// CARET MODIFICATION: 컨텍스트 분리 클래스 - 시스템 규칙과 사용자 컨텍스트 분리
// 원칙: .agents/context/ (시스템용, JSON/YAML)과 .agents/context-for-user/ (사용자용, Markdown) 분리

import { fileExistsAtPath, isDirectory } from "@utils/fs"
import * as fs from "fs/promises"
import * as path from "path"

export type SystemContext = {
	project_identity: {
		name: string
		symbol: string
		nature: string
		philosophy: string
	}
	merge_strategy: {
		priority: number
		phase_0_rule: string
		hybrid_pattern: string
		logic_based_3way: string
		reference: string
	}
	architecture_rules: {
		modification_levels: {
			L1_independent: string
			L2_conditional: string
			L3_direct: string
		}
		protection_rules: {
			protected_directories: string[]
			comment_required: string
			max_changes: string
		}
	}
	[key: string]: any
}

export type UserContext = string // Markdown 형식의 사용자 컨텍스트

export class ContextSeparator {
	private static readonly SYSTEM_CONTEXT_DIR = ".agents/context"
	private static readonly USER_CONTEXT_DIR = ".agents/context-for-user"
	private static readonly CARET_RULES_FILE = "caret-rules.json"

	/**
	 * 시스템 컨텍스트 로드 (.agents/context/)
	 * JSON/YAML 형식으로 AI 시스템 규칙을 포함
	 */
	static async loadSystemContext(cwd: string = process.cwd()): Promise<SystemContext | null> {
		const contextDir = path.resolve(cwd, ContextSeparator.SYSTEM_CONTEXT_DIR)
		const rulesPath = path.join(contextDir, ContextSeparator.CARET_RULES_FILE)

		try {
			const rulesExists = await fileExistsAtPath(rulesPath)
			if (!rulesExists) {
				console.warn(`[ContextSeparator] System context not found at ${rulesPath}`)
				return null
			}

			const rulesContent = await fs.readFile(rulesPath, "utf-8")
			const context = JSON.parse(rulesContent) as SystemContext

			console.info(`[ContextSeparator] Loaded system context (${rulesContent.length} chars) from ${rulesPath}`)

			return context
		} catch (error) {
			console.error(`[ContextSeparator] Failed to load system context: ${error}`)
			return null
		}
	}

	/**
	 * 사용자 컨텍스트 로드 (.agents/context-for-user/)
	 * Markdown 형식으로 사람이 읽기 쉬운 사용자 컨텍스트
	 * 토큰 최적화를 위해 영어 사용
	 */
	static async loadUserContext(cwd: string = process.cwd()): Promise<UserContext> {
		const contextDir = path.resolve(cwd, ContextSeparator.USER_CONTEXT_DIR)

		try {
			const dirExists = (await fileExistsAtPath(contextDir)) && (await isDirectory(contextDir))
			if (!dirExists) {
				console.debug(`[ContextSeparator] User context directory not found at ${contextDir}`)
				return ""
			}

			// 모든 마크다운 파일 순차적으로 로드
			const files = await fs.readdir(contextDir)
			const markdownFiles = files.filter((f) => f.endsWith(".md")).sort()

			let userContext = ""

			for (const file of markdownFiles) {
				const filePath = path.join(contextDir, file)
				try {
					const content = await fs.readFile(filePath, "utf-8")
					userContext += `\n\n${content}\n\n`
					console.debug(`[ContextSeparator] Loaded user context from ${file}`)
				} catch (error) {
					console.warn(`[ContextSeparator] Failed to read ${file}: ${error}`)
				}
			}

			console.info(
				`[ContextSeparator] Loaded user context (${userContext.length} chars) from ${markdownFiles.length} file(s)`,
			)

			return userContext.trim()
		} catch (error) {
			console.error(`[ContextSeparator] Failed to load user context: ${error}`)
			return ""
		}
	}

	/**
	 * AI 프롬프트에 분리된 컨텍스트 빌드
	 * 시스템 컨텍스트와 사용자 컨텍스트를 별도 섹션으로 구분
	 */
	static async buildAIPromptWithSeparatedContexts(cwd: string = process.cwd()): Promise<string> {
		const systemContext = await ContextSeparator.loadSystemContext(cwd)
		const userContext = await ContextSeparator.loadUserContext(cwd)

		let prompt = ""

		if (systemContext) {
			prompt += `# System Context\n\n`
			prompt += `The following is AI system context from .agents/context/:\n\n`
			prompt += JSON.stringify(systemContext, null, 2)
			prompt += "\n\n"
		}

		if (userContext) {
			prompt += `# User Context\n\n`
			prompt += `The following is user-provided context from .agents/context-for-user/:\n\n`
			prompt += userContext
			prompt += "\n\n"
		}

		console.info(
			`[ContextSeparator] Built AI prompt (${prompt.length} chars) with ${systemContext ? "system" : "no system"} + ${userContext ? "user" : "no user"} context`,
		)

		return prompt.trim()
	}

	/**
	 * 사용자 컨텍스트 디렉토리 생성 (초기화용)
	 */
	static async createUserContextDirectory(cwd: string = process.cwd()): Promise<void> {
		const contextDir = path.resolve(cwd, ContextSeparator.USER_CONTEXT_DIR)

		try {
			await fs.mkdir(contextDir, { recursive: true })
			console.info(`[ContextSeparator] Created user context directory at ${contextDir}`)
		} catch (error) {
			console.error(`[ContextSeparator] Failed to create user context directory: ${error}`)
			throw error
		}
	}

	/**
	 * 시스템 컨텍스트가 존재하는지 확인
	 */
	static async hasSystemContext(cwd: string = process.cwd()): Promise<boolean> {
		const contextDir = path.resolve(cwd, ContextSeparator.SYSTEM_CONTEXT_DIR)
		const rulesPath = path.join(contextDir, ContextSeparator.CARET_RULES_FILE)
		return await fileExistsAtPath(rulesPath)
	}

	/**
	 * 사용자 컨텍스트가 존재하는지 확인
	 */
	static async hasUserContext(cwd: string = process.cwd()): Promise<boolean> {
		const contextDir = path.resolve(cwd, ContextSeparator.USER_CONTEXT_DIR)
		const dirExists = (await fileExistsAtPath(contextDir)) && (await isDirectory(contextDir))
		if (!dirExists) {
			return false
		}
		const files = await fs.readdir(contextDir)
		return files.some((f) => f.endsWith(".md"))
	}
}
