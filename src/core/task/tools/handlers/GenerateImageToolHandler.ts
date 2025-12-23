import { CaretEnv } from "@caret/config"
import { CaretAuthService } from "@caret/services/auth/CaretAuthService"
import { ClineAsk, ClineSayTool } from "@shared/ExtensionMessage"
import { ClineDefaultTool } from "@shared/tools"
import { sendToolImageEvent } from "@/core/controller/ui/subscribeToToolImageEvents"
import { buildClineExtraHeaders } from "@/services/EnvUtils"
import { telemetryService } from "@/services/telemetry"
import { fetch } from "@/shared/net"
import { ToolUse } from "../../../assistant-message"
import { formatResponse } from "../../../prompts/responses"
import { ToolResponse } from "../.."
import { showNotificationForApproval } from "../../utils"
import type { IFullyManagedTool } from "../ToolExecutorCoordinator"
import type { TaskConfig } from "../types/TaskConfig"
import type { StronglyTypedUIHelpers } from "../types/UIHelpers"
import { ToolResultUtils } from "../utils/ToolResultUtils"

type ToolImageUsage = {
	inputTokens?: number
	outputTokens?: number
	totalTokens?: number
	totalCost?: number
}

type ToolImageStatus = "pending" | "generating" | "completed" | "error"

type ToolImageMessage = ClineSayTool & {
	tool: "generateImage"
	requestId?: string
	prompt?: string
	model?: string
	aspectRatio?: string
	imageSize?: string
	status?: ToolImageStatus
	progressText?: string
	usage?: ToolImageUsage
	errorMessage?: string
}

const MAX_PROGRESS_TEXT_LENGTH = 240

export class GenerateImageToolHandler implements IFullyManagedTool {
	readonly name = ClineDefaultTool.GENERATE_IMAGE

	getDescription(block: ToolUse): string {
		const prompt = block.params.prompt || ""
		return `[${block.name} for '${prompt}']`
	}

	async handlePartialBlock(block: ToolUse, uiHelpers: StronglyTypedUIHelpers): Promise<void> {
		const prompt = uiHelpers.removeClosingTag(block, "prompt", block.params.prompt || "")
		const sharedMessageProps: ToolImageMessage = {
			tool: "generateImage",
			prompt,
			model: uiHelpers.removeClosingTag(block, "model", block.params.model || ""),
			aspectRatio: uiHelpers.removeClosingTag(block, "aspect_ratio", block.params.aspect_ratio || ""),
			imageSize: uiHelpers.removeClosingTag(block, "image_size", block.params.image_size || ""),
			status: "pending",
			progressText: prompt ? `Generating image for: ${prompt}` : "Generating image...",
		}

		const partialMessage = JSON.stringify(sharedMessageProps)

		await uiHelpers.removeLastPartialMessageIfExistsWithType("say", "tool")
		await uiHelpers.ask("tool" as ClineAsk, partialMessage, block.partial).catch(() => {})
	}

	async execute(config: TaskConfig, block: ToolUse): Promise<ToolResponse> {
		try {
			const prompt = (block.params.prompt || "").trim()
			const model = (block.params.model || "").trim()
			const aspectRatio = (block.params.aspect_ratio || "").trim()
			const imageSize = (block.params.image_size || "").trim()

			// Extract provider information for telemetry
			const apiConfig = config.services.stateManager.getApiConfiguration()
			const currentMode = config.services.stateManager.getGlobalSettingsKey("mode")
			const provider = (currentMode === "plan" ? apiConfig.planModeApiProvider : apiConfig.actModeApiProvider) as string

			if (!prompt) {
				config.taskState.consecutiveMistakeCount++
				return await config.callbacks.sayAndCreateMissingParamError(this.name, "prompt")
			}
			config.taskState.consecutiveMistakeCount = 0

			const requestId = `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

			const buildMessage = (overrides: Partial<ToolImageMessage> = {}): string =>
				JSON.stringify({
					tool: "generateImage",
					requestId,
					prompt,
					model: model || undefined,
					aspectRatio: aspectRatio || undefined,
					imageSize: imageSize || undefined,
					status: "generating",
					progressText: "Generating image...",
					...overrides,
				} satisfies ToolImageMessage)

			const completeMessage = buildMessage()

			if (config.callbacks.shouldAutoApproveTool(this.name)) {
				await config.callbacks.removeLastPartialMessageIfExistsWithType("ask", "tool")
				await config.callbacks.say("tool", completeMessage, undefined, undefined, true)
				telemetryService.captureToolUsage(
					config.ulid,
					"generate_image",
					config.api.getModel().id,
					provider,
					true,
					true,
					undefined,
					block.isNativeToolCall,
				)
			} else {
				showNotificationForApproval(`Caret wants to generate an image`, config.autoApprovalSettings.enableNotifications)
				await config.callbacks.removeLastPartialMessageIfExistsWithType("say", "tool")

				const didApprove = await ToolResultUtils.askApprovalAndPushFeedback("tool", completeMessage, config)
				if (!didApprove) {
					telemetryService.captureToolUsage(
						config.ulid,
						block.name,
						config.api.getModel().id,
						provider,
						false,
						false,
						undefined,
						block.isNativeToolCall,
					)
					return formatResponse.toolDenied()
				}
				telemetryService.captureToolUsage(
					config.ulid,
					block.name,
					config.api.getModel().id,
					provider,
					false,
					true,
					undefined,
					block.isNativeToolCall,
				)
				await config.callbacks.say("tool", completeMessage, undefined, undefined, true)
			}

			// Run PreToolUse hook after approval but before execution
			try {
				const { ToolHookUtils } = await import("../utils/ToolHookUtils")
				await ToolHookUtils.runPreToolUseIfEnabled(config, block)
			} catch (error) {
				const { PreToolUseHookCancellationError } = await import("@core/hooks/PreToolUseHookCancellationError")
				if (error instanceof PreToolUseHookCancellationError) {
					return formatResponse.toolDenied()
				}
				throw error
			}

			const authToken = await CaretAuthService.getInstance().getAuthToken()
			if (!authToken) {
				throw new Error("Caret account authentication required to generate images.")
			}

			const url = new URL("/v1/generate/image", CaretEnv.config().apiBaseUrl).toString()
			const headers: Record<string, string> = {
				"Content-Type": "application/json",
				"X-AnyLLM-Key": `Bearer ${authToken}`,
				"X-Task-ID": config.ulid,
				...(await buildClineExtraHeaders()),
			}

			const body = {
				prompt,
				model: model || undefined,
				aspect_ratio: aspectRatio || undefined,
				image_size: imageSize || undefined,
				stream: true,
			}

			const response = await fetch(url, {
				method: "POST",
				headers,
				body: JSON.stringify(body),
			})

			if (!response.ok) {
				const errorText = await response.text()
				throw new Error(`Image generation failed (${response.status}): ${errorText || response.statusText}`)
			}

			const reader = response.body?.getReader()
			if (!reader) {
				throw new Error("Image generation response has no stream body.")
			}

			const decoder = new TextDecoder()
			let buffer = ""
			let progressText = ""
			const textOutputs: string[] = []
			let usage: ToolImageUsage | undefined
			let streamError: string | undefined
			let didReceiveDone = false

			const updateToolMessage = async (overrides: Partial<ToolImageMessage>) => {
				const nextProgress = overrides.progressText ? overrides.progressText.trim() : progressText
				const trimmedProgress =
					nextProgress.length > MAX_PROGRESS_TEXT_LENGTH
						? `${nextProgress.slice(0, MAX_PROGRESS_TEXT_LENGTH - 3)}...`
						: nextProgress
				progressText = trimmedProgress

				await config.callbacks.say(
					"tool",
					buildMessage({
						progressText: progressText || undefined,
						usage,
						...overrides,
					}),
					undefined,
					undefined,
					true,
				)
			}

			while (true) {
				const { done, value } = await reader.read()
				if (done) {
					break
				}

				buffer += decoder.decode(value, { stream: true })
				const lines = buffer.split("\n")
				buffer = lines.pop() || ""

				for (const line of lines) {
					if (!line.startsWith("data: ")) {
						continue
					}
					const data = line.slice(6).trim()
					if (!data) {
						continue
					}

					let parsed: any
					try {
						parsed = JSON.parse(data)
					} catch {
						continue
					}

					switch (parsed.type) {
						case "text": {
							if (typeof parsed.content === "string") {
								textOutputs.push(parsed.content)
								await updateToolMessage({ progressText: parsed.content })
							}
							break
						}
						case "thought": {
							// Ignore internal thoughts for UI and tool result
							break
						}
						case "image": {
							if (typeof parsed.base64 === "string" && parsed.base64) {
								const mimeType = typeof parsed.mimeType === "string" ? parsed.mimeType : "image/png"
								await sendToolImageEvent({
									requestId,
									mimeType,
									base64: parsed.base64,
								})
								await updateToolMessage({ status: "generating" })
							}
							break
						}
						case "usage": {
							usage = {
								inputTokens: parsed.inputTokens,
								outputTokens: parsed.outputTokens,
								totalTokens: parsed.totalTokens,
								totalCost: parsed.totalCost,
							}
							await updateToolMessage({ usage })
							break
						}
						case "error": {
							streamError = typeof parsed.message === "string" ? parsed.message : "Image generation failed."
							break
						}
						case "done": {
							didReceiveDone = true
							break
						}
						default:
							break
					}

					if (parsed.type === "done" || parsed.type === "error") {
						break
					}
				}

				if (streamError || didReceiveDone) {
					break
				}
			}

			if (streamError) {
				await config.callbacks.say(
					"tool",
					buildMessage({ status: "error", errorMessage: streamError }),
					undefined,
					undefined,
					false,
				)
				return formatResponse.toolError(streamError)
			}

			await config.callbacks.say("tool", buildMessage({ status: "completed", usage }), undefined, undefined, false)

			const summaryParts = [
				`Image generated for prompt: "${prompt}"`,
				model ? `Model: ${model}` : undefined,
				aspectRatio ? `Aspect ratio: ${aspectRatio}` : undefined,
				imageSize ? `Image size: ${imageSize}` : undefined,
				textOutputs.length ? `Text output: ${textOutputs.join(" ")}` : undefined,
			].filter(Boolean)

			return formatResponse.toolResult(summaryParts.join("\n"))
		} catch (error) {
			const message = (error as Error).message || "Image generation failed."
			await config.callbacks.say(
				"tool",
				JSON.stringify({
					tool: "generateImage",
					status: "error",
					errorMessage: message,
				} satisfies ToolImageMessage),
				undefined,
				undefined,
				false,
			)
			return formatResponse.toolError(message)
		}
	}
}
