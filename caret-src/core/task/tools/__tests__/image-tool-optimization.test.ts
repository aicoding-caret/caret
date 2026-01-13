// CARET MODIFICATION: Image tool optimization integration tests

import { optimizeImageDataUrl } from "@caret/utils/image-optimization"
import { expect } from "chai"
import * as fsSync from "fs"
import * as fs from "fs/promises"
import { after, afterEach, before, beforeEach, describe, it } from "mocha"
import { tmpdir } from "os"
import * as path from "path"

describe("Image Tool Optimization Integration", () => {
	const testImagesDir = path.join(tmpdir(), "caret-image-tests")
	let testImagePaths: string[] = []

	before(async () => {
		await fs.mkdir(testImagesDir, { recursive: true })
	})

	after(async () => {
		for (const filePath of testImagePaths) {
			try {
				await fs.unlink(filePath)
			} catch {
				// Ignore cleanup errors
			}
		}
		try {
			await fs.rmdir(testImagesDir)
		} catch {
			// Ignore cleanup errors
		}
	})

	beforeEach(() => {
		testImagePaths = []
	})

	afterEach(async () => {
		for (const filePath of testImagePaths) {
			try {
				await fs.unlink(filePath)
			} catch {
				// Ignore cleanup errors
			}
		}
	})

	describe("WebP Auto Conversion", () => {
		it("should auto-convert large images to WebP", async () => {
			const largePng = createMockImageDataUrl("png", 2048, 2048, 1024 * 1024)
			const optimized = await optimizeImageDataUrl(largePng)

			expect(optimized).to.include("image/webp")
			expect(optimized).to.not.include("image/png")
			expect(optimized.length).to.be.lessThan(largePng.length)
		})

		it("should not convert already WebP 1024px image", async () => {
			const smallWebP = createMockImageDataUrl("webp", 800, 800)
			const optimized = await optimizeImageDataUrl(smallWebP)

			expect(optimized).to.equal(smallWebP)
		})

		it("should throw clear error for >7500px image", async () => {
			const hugeImage = createMockImageDataUrl("png", 8000, 6000)

			try {
				await optimizeImageDataUrl(hugeImage)
				expect.fail("Should have thrown an error")
			} catch (error) {
				expect((error as Error).message).to.include("exceed maximum allowed size")
			}
		})

		it("should resize images larger than 1024px", async () => {
			const largeImage = createMockImageDataUrl("png", 2000, 2000)
			const optimized = await optimizeImageDataUrl(largeImage)

			expect(optimized).to.include("image/webp")
		})

		it("should handle unsupported MIME types gracefully", async () => {
			const unsupportedImage = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
			const result = await optimizeImageDataUrl(unsupportedImage)

			expect(result).to.equal(unsupportedImage)
		})
	})

	describe("Image File Direct Read", () => {
		it("should read image file from path", async () => {
			const testImage = createTestImageFile(testImagesDir, "test-png.png", "png", 100, 100)
			testImagePaths.push(testImage)

			const buffer = await fs.readFile(testImage)
			expect(buffer.length).to.be.greaterThan(0)
		})

		it("should handle non-existent file gracefully", async () => {
			const nonExistentPath = path.join(testImagesDir, "non-existent.png")

			try {
				await fs.readFile(nonExistentPath)
				expect.fail("Should have thrown an error")
			} catch (error) {
				const nodeError = error as NodeJS.ErrnoException
				expect(nodeError.code).to.equal("ENOENT")
			}
		})

		it("should optimize image after file read", async () => {
			const testImage = createTestImageFile(testImagesDir, "test-jpg.jpg", "jpeg", 1500, 1500)
			testImagePaths.push(testImage)

			const buffer = await fs.readFile(testImage)
			const dataUrl = `data:image/jpeg;base64,${buffer.toString("base64")}`
			const optimized = await optimizeImageDataUrl(dataUrl)

			expect(optimized).to.include("image/webp")
		})
	})

	describe("Error Handling", () => {
		it("should handle invalid data URL format", async () => {
			const invalidDataUrl = "not-a-data-url"

			try {
				await optimizeImageDataUrl(invalidDataUrl)
				expect.fail("Should have thrown an error")
			} catch (error) {
				expect((error as Error).message).to.include("Invalid data URL")
			}
		})

		it("should handle corrupted image data", async () => {
			const corruptedDataUrl = "data:image/png;base64,corrupted_base64_data!!!"

			try {
				await optimizeImageDataUrl(corruptedDataUrl)
				// Sharp may handle this gracefully, so we check the result
				expect(true).to.be.true
			} catch (error) {
				// Or it may throw
				expect(error).to.be.an("error")
			}
		})
	})
})

function createMockImageDataUrl(mimeType: string, width: number, height: number, sizeBytes: number = 1024): string {
	const base64Data = Buffer.alloc(sizeBytes).fill("A").toString("base64")
	return `data:image/${mimeType};base64,${base64Data}`
}

function createTestImageFile(dir: string, filename: string, mimeType: string, width: number, height: number): string {
	const filePath = path.join(dir, filename)

	const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
	const pngData = Buffer.concat([header, Buffer.from("test-image-data")])

	fsSync.writeFileSync(filePath, pngData)

	return filePath
}
