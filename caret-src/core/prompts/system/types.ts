import { SystemPromptContext as ClineSystemPromptContext } from "@/core/prompts/system-prompt/types"
import { CARET_MODES } from "@caret/shared/constants/PromptSystemConstants"

/**
 * Tool enablement settings for Caret
 */
export interface CaretToolSettings {
	generateImages?: boolean // Enable image generation tool
	analyzeImages?: boolean // Enable image analysis tool (for models that don't support images)
}

/**
 * Extends the base SystemPromptContext with Caret-specific properties.
 */
export interface CaretSystemPromptContext extends ClineSystemPromptContext {
	modeSystem: "caret" // Always "caret" for Caret system
	mode: typeof CARET_MODES.CHATBOT | typeof CARET_MODES.AGENT
	auto_todo?: boolean
	task_progress?: string
	toolSettings?: CaretToolSettings // Tool enablement settings
}
