// CARET MODIFICATION: HWP 5.0 (구형 한글) document parser
// Uses @ohah/hwpjs library for parsing legacy HWP binary format
// HWP 5.0 is an OLE-based binary format (different from ZIP-based HWPX)

import * as fs from "fs/promises"

import { Logger } from "@/services/logging/Logger"

// @ohah/hwpjs provides toMarkdown and toJson functions
// eslint-disable-next-line @typescript-eslint/no-require-imports
const hwpjs = require("@ohah/hwpjs")

/**
 * Parse HWP 5.0 document from file path and extract text content
 * @param filePath - Path to the HWP file
 * @returns Extracted text content
 */
export async function parseHwpFromFile(filePath: string): Promise<string> {
	// Check if file exists
	try {
		await fs.access(filePath)
	} catch {
		throw new Error(`File not found: ${filePath}`)
	}

	const buffer = await fs.readFile(filePath)
	return parseHwp(buffer)
}

/**
 * Parse HWP 5.0 document from buffer and extract text content
 * @param buffer - Buffer containing HWP file data
 * @returns Extracted text content
 */
export async function parseHwp(buffer: Buffer): Promise<string> {
	Logger.debug("[HwpParser] Starting HWP 5.0 extraction")

	try {
		// Use toMarkdown for text extraction (cleaner output than JSON)
		const result = hwpjs.toMarkdown(buffer, {
			image: "blob", // Don't embed images as base64
			use_html: false,
			include_version: false,
			include_page_info: false,
		})

		const markdown = result.markdown || result

		if (!markdown || typeof markdown !== "string") {
			throw new Error("Failed to extract text from HWP file")
		}

		// Clean up markdown to plain text
		const plainText = markdownToPlainText(markdown)

		Logger.debug(`[HwpParser] Extracted ${plainText.length} chars from HWP 5.0 file`)

		return plainText
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error)
		Logger.warn(`[HwpParser] Failed to parse HWP: ${errorMessage}`)
		throw new Error(`Invalid HWP file or parse error: ${errorMessage}`)
	}
}

/**
 * Convert markdown to plain text by removing formatting
 */
function markdownToPlainText(markdown: string): string {
	return (
		markdown
			// Remove headers
			.replace(/^#{1,6}\s+/gm, "")
			// Remove bold/italic
			.replace(/\*\*([^*]+)\*\*/g, "$1")
			.replace(/\*([^*]+)\*/g, "$1")
			.replace(/__([^_]+)__/g, "$1")
			.replace(/_([^_]+)_/g, "$1")
			// Remove links but keep text
			.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
			// Remove images
			.replace(/!\[([^\]]*)\]\([^)]+\)/g, "")
			// Remove code blocks
			.replace(/```[\s\S]*?```/g, "")
			.replace(/`([^`]+)`/g, "$1")
			// Remove horizontal rules
			.replace(/^[-*_]{3,}$/gm, "")
			// Remove list markers
			.replace(/^\s*[-*+]\s+/gm, "")
			.replace(/^\s*\d+\.\s+/gm, "")
			// Normalize whitespace
			.replace(/\n{3,}/g, "\n\n")
			.trim()
	)
}
