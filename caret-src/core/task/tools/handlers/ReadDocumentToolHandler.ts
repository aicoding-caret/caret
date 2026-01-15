// CARET MODIFICATION: Read document files (PDF, DOCX, HWPX, PPTX, etc.) for LLM analysis
// This tool allows LLMs to read document files by path without requiring user attachment

import { ClineSayTool } from "@shared/ExtensionMessage"
import { ClineDefaultTool } from "@shared/tools"
import * as path from "path"
import { fileURLToPath } from "url"

import { Logger } from "@/services/logging/Logger"
import { telemetryService } from "@/services/telemetry"
import { ToolUse } from "@core/assistant-message"
import { formatResponse } from "@core/prompts/responses"
import { getReadablePath, isLocatedInPath } from "@utils/path"

import { DocumentExtractor } from "@caret/integrations/document/document-extractor"

import type { ToolResponse } from "@core/task"
import type { IFullyManagedTool } from "@core/task/tools/ToolExecutorCoordinator"
import type { TaskConfig } from "@core/task/tools/types/TaskConfig"
import type { StronglyTypedUIHelpers } from "@core/task/tools/types/UIHelpers"

type ToolReadDocumentMessage = ClineSayTool & {
	tool: "readDocument"
	documentPath?: string
	status?: "pending" | "reading" | "completed" | "error"
	result?: string
	format?: string
	errorMessage?: string
	operationIsLocatedInWorkspace?: boolean
}

const stripQuotes = (value: string): string => {
	const trimmed = value.trim()
	const match = trimmed.match(/^"(.*)"$/)
	return match ? match[1] : trimmed
}

/**
 * Resolve document path to absolute path
 */
function resolveDocumentPath(documentPath: string, cwd: string): string {
	let absolutePath = documentPath

	// Handle file:// URLs
	if (documentPath.startsWith("file://")) {
		try {
			absolutePath = fileURLToPath(documentPath)
		} catch {
			throw new Error(`Invalid file URL: ${documentPath}`)
		}
	}

	// Handle relative paths
	if (!path.isAbsolute(absolutePath)) {
		absolutePath = path.resolve(cwd, absolutePath)
	}

	// Normalize the path
	absolutePath = path.normalize(absolutePath)

	return absolutePath
}

export class ReadDocumentToolHandler implements IFullyManagedTool {
	readonly name = ClineDefaultTool.READ_DOCUMENT

	private extractor: DocumentExtractor

	constructor() {
		this.extractor = new DocumentExtractor()
	}

	getDescription(block: ToolUse): string {
		const documentPath = block.params.path
		return `[${block.name} for '${documentPath}']`
	}

	async handlePartialBlock(block: ToolUse, uiHelpers: StronglyTypedUIHelpers): Promise<void> {
		const documentPath = block.params.path

		const sharedMessageProps: ToolReadDocumentMessage = {
			tool: "readDocument",
			documentPath: documentPath ? stripQuotes(documentPath) : undefined,
			status: "pending",
		}

		const partialMessage = JSON.stringify(sharedMessageProps)
		await uiHelpers.say("tool", partialMessage, undefined, undefined, block.partial)
	}

	async execute(config: TaskConfig, block: ToolUse): Promise<ToolResponse> {
		const documentPath: string | undefined = block.params.path

		// Extract provider information for telemetry
		const apiConfig = config.services.stateManager.getApiConfiguration()
		const currentMode = config.services.stateManager.getGlobalSettingsKey("mode")
		const provider = (currentMode === "plan" ? apiConfig.planModeApiProvider : apiConfig.actModeApiProvider) as string

		// Validate required parameters
		if (!documentPath) {
			config.taskState.consecutiveMistakeCount++
			return await config.callbacks.sayAndCreateMissingParamError(this.name, "path")
		}

		config.taskState.consecutiveMistakeCount = 0

		const cleanDocumentPath = stripQuotes(documentPath)

		// Build message for UI
		const buildMessage = (overrides: Partial<ToolReadDocumentMessage> = {}): string => {
			const message: ToolReadDocumentMessage = {
				tool: "readDocument",
				documentPath: cleanDocumentPath,
				status: "pending",
				...overrides,
			}
			return JSON.stringify(message)
		}

		// Resolve absolute path
		const workspaceRoot = config.workspaceManager?.getPrimaryRoot()?.path ?? config.cwd
		let absolutePath: string

		try {
			absolutePath = resolveDocumentPath(cleanDocumentPath, workspaceRoot)
		} catch (error) {
			const message = (error as Error).message
			Logger.error(`[ReadDocument] Path resolution failed:`, error as Error)

			await config.callbacks.say(
				"tool",
				buildMessage({
					status: "error",
					errorMessage: message,
				}),
				undefined,
				undefined,
				false,
			)

			return formatResponse.toolError(message)
		}

		// Security: Check if file is within workspace
		const isInWorkspace = isLocatedInPath(absolutePath, workspaceRoot)
		const readablePath = getReadablePath(workspaceRoot, absolutePath)

		// Check if format is supported
		if (!this.extractor.isSupported(absolutePath)) {
			const ext = path.extname(absolutePath).toLowerCase()
			const supportedFormats = this.extractor.getSupportedFormats().join(", ")
			const errorMsg = `Unsupported document format: ${ext}. Supported formats: ${supportedFormats}`

			Logger.warn(`[ReadDocument] ${errorMsg}`)

			await config.callbacks.say(
				"tool",
				buildMessage({
					status: "error",
					errorMessage: errorMsg,
					operationIsLocatedInWorkspace: isInWorkspace,
				}),
				undefined,
				undefined,
				false,
			)

			return formatResponse.toolError(errorMsg)
		}

		// Show tool message (auto-approve since read-only)
		const completeMessage = buildMessage({
			status: "pending",
			operationIsLocatedInWorkspace: isInWorkspace,
		})
		await config.callbacks.say("tool", completeMessage, undefined, undefined, false)

		// Telemetry
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

		// Run PreToolUse hook
		try {
			const { ToolHookUtils } = await import("@core/task/tools/utils/ToolHookUtils")
			await ToolHookUtils.runPreToolUseIfEnabled(config, block)
		} catch (error) {
			const { PreToolUseHookCancellationError } = await import("@core/hooks/PreToolUseHookCancellationError")
			if (error instanceof PreToolUseHookCancellationError) {
				return formatResponse.toolDenied()
			}
			throw error
		}

		// Update status to reading
		await config.callbacks.say(
			"tool",
			buildMessage({
				status: "reading",
				operationIsLocatedInWorkspace: isInWorkspace,
			}),
			undefined,
			undefined,
			true,
		)

		try {
			Logger.debug(`[ReadDocument] Reading document: ${absolutePath}`)

			const result = await this.extractor.extract(absolutePath, {
				cwd: workspaceRoot,
			})

			Logger.info(`[ReadDocument] Successfully extracted ${result.content.length} chars from ${result.format}`)

			// Update status to completed
			await config.callbacks.say(
				"tool",
				buildMessage({
					status: "completed",
					format: result.format,
					operationIsLocatedInWorkspace: isInWorkspace,
				}),
				undefined,
				undefined,
				false,
			)

			// Return extracted content with metadata
			const responseText = [
				`Document: ${readablePath}`,
				`Format: ${result.format.toUpperCase()}`,
				`---`,
				result.content,
			].join("\n")

			return formatResponse.toolResult(responseText)
		} catch (error) {
			const message = (error as Error).message || "Document extraction failed."
			Logger.error("[ReadDocument] Extraction failed:", error as Error)

			await config.callbacks.say(
				"tool",
				buildMessage({
					status: "error",
					errorMessage: message,
					operationIsLocatedInWorkspace: isInWorkspace,
				}),
				undefined,
				undefined,
				false,
			)

			return formatResponse.toolError(message)
		}
	}
}
