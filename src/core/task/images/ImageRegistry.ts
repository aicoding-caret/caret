import { getMimeType } from "@integrations/misc/process-files"
import { GlobalFileNames, ensureTaskDirectoryExists } from "@core/storage/disk"
import { fileExistsAtPath } from "@utils/fs"
import fs from "fs/promises"
import path from "path"
import { createImageId } from "@shared/images/image-id"

export type ImageSource = "user" | "generated" | "tool" | "unknown"

export interface ImageRecord {
	id: string
	dataUrl?: string
	filePath?: string
	source: ImageSource
	createdAt: number
	originMessageTs?: number
}

export interface ImageAttachmentSet {
	id: string
	imageIds: string[]
	source: ImageSource
	createdAt: number
	originMessageTs?: number
}

type ImageRegistrySnapshot = {
	version: 1
	images: ImageRecord[]
	sets: ImageAttachmentSet[]
}

export class ImageRegistry {
	private images = new Map<string, ImageRecord>()
	private sets: ImageAttachmentSet[] = []

	constructor(private taskId: string) {}

	reset() {
		this.images.clear()
		this.sets = []
	}

	private async getFilePath(): Promise<string> {
		const taskDir = await ensureTaskDirectoryExists(this.taskId)
		return path.join(taskDir, GlobalFileNames.imageRegistry)
	}

	async load(): Promise<void> {
		try {
			const filePath = await this.getFilePath()
			if (!(await fileExistsAtPath(filePath))) {
				return
			}
			const raw = await fs.readFile(filePath, "utf8")
			const parsed = JSON.parse(raw) as ImageRegistrySnapshot
			if (!parsed || parsed.version !== 1) {
				return
			}
			this.images = new Map(parsed.images.map((record) => [record.id, record]))
			this.sets = parsed.sets || []
		} catch (error) {
			console.error("Failed to load image registry:", error)
		}
	}

	async save(): Promise<void> {
		try {
			const filePath = await this.getFilePath()
			const snapshot: ImageRegistrySnapshot = {
				version: 1,
				images: Array.from(this.images.values()),
				sets: this.sets,
			}
			await fs.writeFile(filePath, JSON.stringify(snapshot, null, 2), "utf8")
		} catch (error) {
			console.error("Failed to save image registry:", error)
		}
	}

	registerDataUrls(dataUrls: string[], source: ImageSource, originMessageTs?: number): string[] {
		const now = Date.now()
		const ids: string[] = []
		for (const dataUrl of dataUrls) {
			const id = createImageId(dataUrl)
			const existing = this.images.get(id)
			if (existing) {
				if (!existing.dataUrl) {
					existing.dataUrl = dataUrl
				}
				ids.push(id)
				continue
			}
			this.images.set(id, {
				id,
				dataUrl,
				source,
				createdAt: now,
				originMessageTs,
			})
			ids.push(id)
		}
		void this.save()
		return ids
	}

	registerGeneratedImage(params: { dataUrl?: string; filePath?: string; originMessageTs?: number }): string | undefined {
		const { dataUrl, filePath, originMessageTs } = params
		if (!dataUrl && !filePath) {
			return undefined
		}
		const id = createImageId(dataUrl ?? filePath ?? "")
		const existing = this.images.get(id)
		if (existing) {
			if (dataUrl && !existing.dataUrl) {
				existing.dataUrl = dataUrl
			}
			if (filePath && !existing.filePath) {
				existing.filePath = filePath
			}
			void this.save()
			return id
		}
		this.images.set(id, {
			id,
			dataUrl,
			filePath,
			source: "generated",
			createdAt: Date.now(),
			originMessageTs,
		})
		void this.save()
		return id
	}

	createAttachmentSet(imageIds: string[], source: ImageSource, originMessageTs?: number): string | undefined {
		if (!imageIds.length) {
			return undefined
		}
		const setId = `set-${Date.now()}`
		this.sets.push({
			id: setId,
			imageIds,
			source,
			createdAt: Date.now(),
			originMessageTs,
		})
		void this.save()
		return setId
	}

	getLatestAttachmentSet(source?: ImageSource, excludeSetId?: string): ImageAttachmentSet | undefined {
		const filtered = [...this.sets]
			.filter((set) => (source ? set.source === source : true))
			.filter((set) => (excludeSetId ? set.id !== excludeSetId : true))
			.sort((a, b) => b.createdAt - a.createdAt)
		return filtered[0]
	}

	getImage(id: string): ImageRecord | undefined {
		return this.images.get(id)
	}

	async resolveDataUrls(ids: string[]): Promise<string[]> {
		const results: string[] = []
		for (const id of ids) {
			const record = this.images.get(id)
			if (!record) {
				continue
			}
			if (record.dataUrl) {
				results.push(record.dataUrl)
				continue
			}
			if (record.filePath) {
				try {
					const buffer = await fs.readFile(record.filePath)
					const mimeType = getMimeType(record.filePath)
					const dataUrl = `data:${mimeType};base64,${buffer.toString("base64")}`
					record.dataUrl = dataUrl
					results.push(dataUrl)
				} catch (error) {
					console.error("Failed to load image from file:", record.filePath, error)
				}
			}
		}
		void this.save()
		return results
	}
}
