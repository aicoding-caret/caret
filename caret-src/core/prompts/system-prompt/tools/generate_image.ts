// CARET MODIFICATION: Add generate_image tool specification for image generation.

import type { ClineToolSpec } from "@core/prompts/system-prompt/spec"
import { TASK_PROGRESS_PARAMETER } from "@core/prompts/system-prompt/types"
import { ModelFamily } from "@/shared/prompts"
import { ClineDefaultTool } from "@/shared/tools"

const id = ClineDefaultTool.GENERATE_IMAGE

const GENERIC: ClineToolSpec = {
	variant: ModelFamily.GENERIC,
	id,
	name: "generate_image",
	description:
		"Generate a single image from a text prompt. Output: WebP (max 1024px, Q86). Images >7500px rejected. UI shows card. No raw data needed.",
	parameters: [
		{
			name: "prompt",
			required: true,
			instruction: "A clear text prompt describing the image to generate.",
			usage: "A neon city skyline at dusk, cinematic lighting",
		},
		{
			name: "model",
			required: false,
			instruction: "Optional image model id. If omitted, the default image model will be used.",
			usage: "gemini-3-pro-image-preview",
		},
		{
			name: "aspect_ratio",
			required: false,
			instruction: "Optional aspect ratio for the output image (e.g., 16:9, 1:1, 4:3).",
			usage: "16:9",
		},
		{
			name: "image_size",
			required: false,
			instruction: "Optional image size preset (e.g., 1K, 2K).",
			usage: "1K",
		},
		{
			name: "reference_images",
			required: false,
			instruction:
				"Optional reference image data URLs already provided by the user. Do not generate or paste image data; leave empty to use the most recent user images. If the user refers to @a/@b, treat them as the first/second attached images in the current message.",
		},
		TASK_PROGRESS_PARAMETER,
	],
}

const NATIVE_GPT_5: ClineToolSpec = {
	variant: ModelFamily.NATIVE_GPT_5,
	id,
	name: "generate_image",
	description: "Generate a single image. WebP (max 1024px). No raw data.",
	parameters: [
		{
			name: "prompt",
			required: true,
			instruction: "A clear text prompt describing the image to generate.",
		},
		{
			name: "model",
			required: false,
			instruction: "Optional image model id.",
		},
		{
			name: "aspect_ratio",
			required: false,
			instruction: "Optional aspect ratio for the output image.",
		},
		{
			name: "image_size",
			required: false,
			instruction: "Optional image size preset.",
		},
		{
			name: "reference_images",
			required: false,
			instruction:
				"Optional reference image data URLs already provided by the user. Do not generate or paste image data; leave empty to use the most recent user images. If the user refers to @a/@b, treat them as the first/second attached images in the current message.",
		},
		TASK_PROGRESS_PARAMETER,
	],
}

const NATIVE_NEXT_GEN: ClineToolSpec = {
	...NATIVE_GPT_5,
	variant: ModelFamily.NATIVE_NEXT_GEN,
}

export const generate_image_variants = [GENERIC, NATIVE_GPT_5, NATIVE_NEXT_GEN]
