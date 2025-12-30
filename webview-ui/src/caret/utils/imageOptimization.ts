// CARET MODIFICATION: Webview image optimization helpers for image tool uploads.
const MAX_IMAGE_DIMENSION = 1024
const MAX_INPUT_DIMENSION = 7500
const DEFAULT_IMAGE_QUALITY = 0.86

let cachedPreferredMimeType: "image/webp" | "image/jpeg" | null = null

const getPreferredImageMimeType = (): "image/webp" | "image/jpeg" => {
	if (cachedPreferredMimeType) {
		return cachedPreferredMimeType
	}

	const canvas = document.createElement("canvas")
	canvas.width = 1
	canvas.height = 1
	const webpDataUrl = canvas.toDataURL("image/webp")
	cachedPreferredMimeType = webpDataUrl.startsWith("data:image/webp") ? "image/webp" : "image/jpeg"
	return cachedPreferredMimeType
}

const extractMimeType = (dataUrl: string): string | undefined => {
	const match = dataUrl.match(/^data:([^;]+);base64,/i)
	return match ? match[1].toLowerCase() : undefined
}

const loadImage = (dataUrl: string): Promise<HTMLImageElement> => {
	return new Promise((resolve, reject) => {
		const img = new Image()
		img.onload = () => resolve(img)
		img.onerror = () => reject(new Error("Failed to load image for optimization."))
		img.src = dataUrl
	})
}

export const optimizeImageDataUrl = async (dataUrl: string): Promise<string> => {
	const img = await loadImage(dataUrl)

	if (img.naturalWidth > MAX_INPUT_DIMENSION || img.naturalHeight > MAX_INPUT_DIMENSION) {
		throw new Error("Image dimensions exceed maximum allowed size of 7500px.")
	}

	const longestSide = Math.max(img.naturalWidth, img.naturalHeight)
	const scale = longestSide > MAX_IMAGE_DIMENSION ? MAX_IMAGE_DIMENSION / longestSide : 1
	const targetWidth = Math.max(1, Math.round(img.naturalWidth * scale))
	const targetHeight = Math.max(1, Math.round(img.naturalHeight * scale))

	const outputMimeType = getPreferredImageMimeType()
	const inputMimeType = extractMimeType(dataUrl)
	const needsResize = scale < 1
	const shouldReencode = needsResize || inputMimeType !== outputMimeType

	if (!shouldReencode) {
		return dataUrl
	}

	const canvas = document.createElement("canvas")
	canvas.width = targetWidth
	canvas.height = targetHeight
	const ctx = canvas.getContext("2d")
	if (!ctx) {
		return dataUrl
	}
	ctx.drawImage(img, 0, 0, targetWidth, targetHeight)

	return canvas.toDataURL(outputMimeType, DEFAULT_IMAGE_QUALITY)
}
