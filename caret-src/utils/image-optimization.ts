// CARET MODIFICATION: Backend image optimization shared across upload/mention/reference flows.
import { Logger } from "@/services/logging/Logger"

type SharpFactory = typeof import("sharp")

let sharpPromise: Promise<SharpFactory | null> | null = null

const loadSharp = async (): Promise<SharpFactory | null> => {
	if (sharpPromise) {
		return sharpPromise
	}
	sharpPromise = (async () => {
		try {
			const mod = (await import("sharp")) as SharpFactory | { default?: SharpFactory }
			if (typeof (mod as { default?: SharpFactory }).default === "function") {
				return (mod as { default: SharpFactory }).default
			}
			return mod as SharpFactory
		} catch {
			return null
		}
	})()
	return sharpPromise
}

const MAX_IMAGE_DIMENSION = 1024
const MAX_INPUT_DIMENSION = 7500
const DEFAULT_IMAGE_QUALITY = 86
const OUTPUT_MIME_TYPE = "image/webp"
const SUPPORTED_INPUT_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp"])

const parseDataUrl = (value: string): { mimeType: string; base64: string } => {
	const match = value.match(/^data:([^;]+);base64,(.+)$/i)
	if (!match) {
		throw new Error("Invalid data URL.")
	}
	return { mimeType: match[1].toLowerCase(), base64: match[2] }
}

export const optimizeImageDataUrl = async (dataUrl: string): Promise<string> => {
	const sharp = await loadSharp()
	if (!sharp) {
		Logger.warn("[ImageOptimization] Sharp library not available, skipping optimization")
		return dataUrl
	}
	const { mimeType, base64 } = parseDataUrl(dataUrl)
	if (!SUPPORTED_INPUT_MIME_TYPES.has(mimeType)) {
		Logger.debug(`[ImageOptimization] Unsupported MIME type: ${mimeType}, skipping optimization`)
		return dataUrl
	}

	const inputBuffer = Buffer.from(base64, "base64")
	const metadata = await sharp(inputBuffer, { failOnError: false }).metadata()

	if (!metadata.width || !metadata.height) {
		throw new Error("Failed to determine image dimensions.")
	}

	if (metadata.width > MAX_INPUT_DIMENSION || metadata.height > MAX_INPUT_DIMENSION) {
		throw new Error("Image dimensions exceed maximum allowed size of 7500px.")
	}

	const longestSide = Math.max(metadata.width, metadata.height)
	const scale = longestSide > MAX_IMAGE_DIMENSION ? MAX_IMAGE_DIMENSION / longestSide : 1
	const targetWidth = Math.max(1, Math.round(metadata.width * scale))
	const targetHeight = Math.max(1, Math.round(metadata.height * scale))
	const needsResize = scale < 1
	const shouldReencode = needsResize || mimeType !== OUTPUT_MIME_TYPE

	if (!shouldReencode) {
		Logger.debug(`[ImageOptimization] Already optimized: WebP format and ${metadata.width}x${metadata.height}px, skipping`)
		return dataUrl
	}

	let pipeline = sharp(inputBuffer, { failOnError: false })
	if (needsResize) {
		pipeline = pipeline.resize({
			width: targetWidth,
			height: targetHeight,
			fit: "inside",
			withoutEnlargement: true,
		})
	}

	const outputBuffer = await pipeline.webp({ quality: DEFAULT_IMAGE_QUALITY }).toBuffer()
	const inputSize = Buffer.byteLength(dataUrl, "utf8")
	const outputSize = Buffer.byteLength(`data:${OUTPUT_MIME_TYPE};base64,`, "utf8") + outputBuffer.length
	const reduction = Math.round(((inputSize - outputSize) / inputSize) * 100)

	Logger.info(
		`[ImageOptimization] Optimized: ${metadata.width}x${metadata.height}px → ${targetWidth}x${targetHeight}px, ${inputSize} → ${outputSize} bytes (${reduction}% reduction)`,
	)

	return `data:${OUTPUT_MIME_TYPE};base64,${outputBuffer.toString("base64")}`
}
