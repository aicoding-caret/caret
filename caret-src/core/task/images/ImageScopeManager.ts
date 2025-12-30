import { Anthropic } from "@anthropic-ai/sdk"
import type { ClineContent } from "@shared/messages/content"
import { createImageId } from "@caret/shared/images/image-id"
import { formatResponse } from "@core/prompts/responses"
import { ImageRegistry } from "./ImageRegistry"
import { buildImageScopeMeta } from "./ImageScopeMetaBuilder"
import { ImageScopeResolver, type ImageScopeResult } from "./ImageScopeResolver"
import { imageBlockToDataUrl } from "./image-utils"

const USER_TEXT_TAGS = ["<task>", "<user_message>", "<answer>", "<feedback>"]

const extractUserText = (content: ClineContent[]): string => {
	const candidateTexts: string[] = []

	const collectText = (value?: string) => {
		if (typeof value === "string" && value.trim().length > 0) {
			candidateTexts.push(value)
		}
	}

	for (const block of content) {
		if (block.type === "text") {
			collectText(block.text)
			continue
		}

		if (block.type === "tool_result") {
			const toolContent = block.content
			if (typeof toolContent === "string") {
				collectText(toolContent)
				continue
			}
			if (Array.isArray(toolContent)) {
				for (const inner of toolContent) {
					if (inner.type === "text") {
						collectText(inner.text)
					}
				}
			}
		}
	}

	const tagged = candidateTexts.filter((text) => USER_TEXT_TAGS.some((tag) => text.includes(tag)))
	if (tagged.length > 0) {
		return tagged.join("\n")
	}
	return candidateTexts.join("\n")
}

const extractImageDataUrls = (content: ClineContent[]): string[] => {
	const dataUrls: string[] = []
	for (const block of content) {
		if (block.type === "image") {
			const dataUrl = imageBlockToDataUrl(block as Anthropic.ImageBlockParam)
			if (dataUrl) {
				dataUrls.push(dataUrl)
			}
			continue
		}

		if (block.type === "tool_result" && Array.isArray(block.content)) {
			for (const inner of block.content) {
				if (inner.type !== "image") {
					continue
				}
				const dataUrl = imageBlockToDataUrl(inner as Anthropic.ImageBlockParam)
				if (dataUrl) {
					dataUrls.push(dataUrl)
				}
			}
		}
	}
	return dataUrls
}

const stripImageBlocks = (content: ClineContent[]): ClineContent[] => {
	return content
		.map((block) => {
			if (block.type === "image") {
				return null
			}

			if (block.type === "tool_result" && Array.isArray(block.content)) {
				const nextContent = block.content.filter((inner) => inner.type !== "image")
				if (nextContent.length === 0) {
					return null
				}
				return {
					...block,
					content: nextContent,
				}
			}

			return block
		})
		.filter(Boolean) as ClineContent[]
}

type ApplyScopeResult = {
	userContent: ClineContent[]
	scope: ImageScopeResult
}

export class ImageScopeManager {
	private resolver: ImageScopeResolver

	constructor(private registry: ImageRegistry) {
		this.resolver = new ImageScopeResolver(registry)
	}

	async applyScope(userContent: ClineContent[], originMessageTs?: number): Promise<ApplyScopeResult> {
		const currentImageDataUrls = extractImageDataUrls(userContent)
		const currentImageIds = this.registry.registerDataUrls(currentImageDataUrls, "user", originMessageTs)
		const currentSetId = this.registry.createAttachmentSet(currentImageIds, "user", originMessageTs)

		const userText = extractUserText(userContent)
		const scope = this.resolver.resolve({
			userText,
			currentImageIds,
			currentSetId,
		})

		if (!scope.applied) {
			return { userContent, scope }
		}

		const selectedDataUrls = await this.registry.resolveDataUrls(scope.selectedImageIds)
		const scopeMeta = buildImageScopeMeta(scope)

		const nextContent = stripImageBlocks(userContent)
		if (scopeMeta) {
			nextContent.push({ type: "text", text: scopeMeta })
		}
		if (selectedDataUrls.length > 0) {
			nextContent.push(...formatResponse.imageBlocks(selectedDataUrls))
		}

		return { userContent: nextContent, scope }
	}

	shouldFilterHistory(scope?: ImageScopeResult): boolean {
		return Boolean(scope?.applied)
	}

	filterHistory(
		history: Anthropic.Messages.MessageParam[],
		selectedImageIds: string[],
	): Anthropic.Messages.MessageParam[] {
		const filtered = history
			.map((message) => this.stripImagesFromMessage(message, selectedImageIds))
			.filter((message): message is Anthropic.Messages.MessageParam => Boolean(message))
		return filtered
	}

	private stripImagesFromMessage(
		message: Anthropic.Messages.MessageParam,
		selectedImageIds: string[],
	): Anthropic.Messages.MessageParam | null {
		if (typeof message.content === "string") {
			return message
		}

		const filtered = message.content
			.map((block) => {
				if (block.type === "image") {
					const dataUrl = imageBlockToDataUrl(block as Anthropic.ImageBlockParam)
					if (!dataUrl) {
						return null
					}
					const id = createImageId(dataUrl)
					return selectedImageIds.includes(id) ? block : null
				}

				if (block.type === "tool_result" && Array.isArray(block.content)) {
					const nextContent = block.content.filter((inner) => {
						if (inner.type !== "image") {
							return true
						}
						const dataUrl = imageBlockToDataUrl(inner as Anthropic.ImageBlockParam)
						if (!dataUrl) {
							return false
						}
						const id = createImageId(dataUrl)
						return selectedImageIds.includes(id)
					})
					if (nextContent.length === 0) {
						return null
					}
					return {
						...block,
						content: nextContent,
					}
				}

				return block
			})
			.filter(Boolean) as typeof message.content

		if (!filtered.length) {
			return null
		}

		return {
			...message,
			content: filtered,
		}
	}
}
