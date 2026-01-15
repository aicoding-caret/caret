// CARET MODIFICATION: Add analyze_image tool specification for image analysis.
// This tool is only available for models that don't support images (supportsImages: false).
// It uses Caret API (Gemini 2.5 Flash) to analyze images.

import type { ClineToolSpec } from "@core/prompts/system-prompt/spec"
import { ModelFamily } from "@/shared/prompts"
import { ClineDefaultTool } from "@/shared/tools"

const id = ClineDefaultTool.ANALYZE_IMAGE

const GENERIC: ClineToolSpec = {
	variant: ModelFamily.GENERIC,
	id,
	name: "analyze_image",
	description: `Analyze an image using vision AI. **IMPORTANT: Only use this tool if your model does NOT support images directly (supportsImages: false).** If your model supports images (like Claude, GPT-4V), you can see images directly without this tool.

Use this tool when you need to understand, describe, or extract information from images. This tool is especially useful for:
- UI/UX analysis: Check for misalignment, layout issues, visual bugs, responsive design problems
- Text extraction: Extract text from screenshots, dialogs, error messages, logs that cannot be copy-pasted
- Code review: Analyze screenshots of code, identify issues or patterns
- Design comparison: Compare UI implementations with design mockups
- Error analysis: Interpret error dialogs, stack traces, or debug output shown in images

The analysis is performed by Caret's vision AI (Gemini 2.5 Flash). Requires Caret account login.`,
	parameters: [
		{
			name: "image",
			required: true,
			instruction:
				"Path to the image file to analyze. Can be a relative path from workspace root, absolute path, or file:// URL. Also accepts data: URLs for inline images.",
			usage: "screenshots/error-dialog.png",
		},
		{
			name: "question",
			required: true,
			instruction:
				"Your question or request about the image. Be specific about what you want to know. For UI issues, ask about specific elements. For text extraction, specify if formatting should be preserved.",
			usage: "What text is shown in this error dialog? Is there a stack trace?",
		},
	],
}

const NATIVE_GPT_5: ClineToolSpec = {
	variant: ModelFamily.NATIVE_GPT_5,
	id,
	name: "analyze_image",
	description:
		"Analyze an image using vision AI. Use for UI analysis, text extraction from screenshots, code review, design comparison, and error interpretation.",
	parameters: [
		{
			name: "image",
			required: true,
			instruction: "Path to the image file (relative/absolute/file:// URL) or data: URL.",
		},
		{
			name: "question",
			required: true,
			instruction: "Your question about the image. Be specific.",
		},
	],
}

const NATIVE_NEXT_GEN: ClineToolSpec = {
	...NATIVE_GPT_5,
	variant: ModelFamily.NATIVE_NEXT_GEN,
}

export const analyze_image_variants = [GENERIC, NATIVE_GPT_5, NATIVE_NEXT_GEN]
