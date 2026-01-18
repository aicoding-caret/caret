# 하드코딩 방지 규칙 (Atom)

> **AI 재사용 코드 패턴 블록**

## 🧩 **패턴 요약**
하드코딩된 값을 방지하고 유지보수 가능하고 설정 가능한 코드를 보장하기 위한 표준 규칙과 패턴입니다.

## 📝 **피해야 할 하드코딩 카테고리**

### A. 파일명과 경로
```typescript
// ❌ 잘못됨 - 하드코딩된 파일명
const personaMdPath = path.join(rulesDir, "persona.md")
const profilePath = path.join(personaDir, "agent_profile.png")
const configDir = path.join(baseDir, "configs")

// ✅ 올바름 - 상수 사용
import { GlobalFileNames } from "@/core/storage/disk"
const personaMdPath = path.join(rulesDir, GlobalFileNames.persona)
const profilePath = path.join(personaDir, PERSONA_CONSTANTS.PROFILE_IMAGE)
const configDir = path.join(baseDir, FILE_CONSTANTS.CONFIG_DIR)
```

### B. 매직 넘버와 문자열
```typescript
// ❌ 잘못됨 - 매직 값
if (retryCount > 3) { ... }
await delay(5000)
const maxFileSize = 1048576 // 1MB

// ✅ 올바름 - 명명된 상수
const MAX_RETRY_COUNT = 3
const DEFAULT_DELAY_MS = 5000
const MAX_FILE_SIZE_BYTES = 1024 * 1024 // 1MB

if (retryCount > MAX_RETRY_COUNT) { ... }
await delay(DEFAULT_DELAY_MS)
```

### C. UI 텍스트와 메시지
```typescript
// ❌ 잘못됨 - 하드코딩된 UI 텍스트
const message = "Profile saved successfully"
const errorMsg = "Failed to load data"

// ✅ 올바름 - i18n 시스템 사용
const message = t('profile.saveSuccess', 'common')
const errorMsg = t('errors.loadFailed', 'common')
```

### D. 설정 값
```typescript
// ❌ 잘못됨 - 하드코딩된 설정
const apiTimeout = 30000
const defaultLanguage = "en"
const maxConcurrency = 5

// ✅ 올바름 - 설정 객체
const CONFIG = {
    API_TIMEOUT_MS: 30000,
    DEFAULT_LANGUAGE: "en" as const,
    MAX_CONCURRENCY: 5,
} as const
```

## 🔧 **구현 패턴**

### 1. 상수 파일 구조
```typescript
// constants/file-names.ts
export const FILE_CONSTANTS = {
    PERSONA_IMAGES_DIR: "personas",
    PROFILE_IMAGE: "agent_profile.png",
    THINKING_IMAGE: "agent_thinking.png",
    CONFIG_DIR: "configs",
} as const

// constants/limits.ts
export const LIMITS = {
    MAX_RETRY_COUNT: 3,
    DEFAULT_TIMEOUT_MS: 5000,
    MAX_FILE_SIZE_MB: 10,
} as const
```

### 2. 관련 상수를 위한 Enum 사용
```typescript
// 관련 문자열 상수
export enum PersonaImageType {
    PROFILE = "agent_profile.png",
    THINKING = "agent_thinking.png",
}

// 숫자 상수
export enum RetryLimits {
    MAX_ATTEMPTS = 3,
    BACKOFF_MS = 1000,
    MAX_BACKOFF_MS = 10000,
}
```

### 3. 설정 객체
```typescript
// config/persona.ts
export const PERSONA_CONFIG = {
    FILES: {
        PROFILE_MD: "persona.md",
        IMAGES_DIR: "personas",
        PROFILE_IMAGE: "agent_profile.png",
        THINKING_IMAGE: "agent_thinking.png",
    },
    LIMITS: {
        MAX_DESCRIPTION_LENGTH: 500,
        MAX_INSTRUCTION_LENGTH: 5000,
    },
    DEFAULTS: {
        NAME: "Default",
        DESCRIPTION: "Default Persona",
    },
} as const
```

## ⚠️ **일반적인 위반 패턴**

### 1. 파일 작업
```typescript
// ❌ 흔한 실수
await fs.writeFile("output.json", data)
const configPath = path.join(dir, "config.yml")

// ✅ 예방
const OUTPUT_FILE = "output.json"
await fs.writeFile(OUTPUT_FILE, data)
const configPath = path.join(dir, CONFIG_FILES.MAIN)
```

### 2. 오류 메시지
```typescript
// ❌ 흔한 실수
throw new Error("Invalid input provided")
Logger.error("Connection failed")

// ✅ 예방
const ERROR_MESSAGES = {
    INVALID_INPUT: "Invalid input provided",
    CONNECTION_FAILED: "Connection failed",
} as const

throw new Error(ERROR_MESSAGES.INVALID_INPUT)
Logger.error(ERROR_MESSAGES.CONNECTION_FAILED)
```

### 3. 타임아웃과 인터벌
```typescript
// ❌ 흔한 실수
setTimeout(callback, 1000)
setInterval(poll, 5000)

// ✅ 예방
const INTERVALS = {
    CALLBACK_DELAY_MS: 1000,
    POLL_INTERVAL_MS: 5000,
} as const

setTimeout(callback, INTERVALS.CALLBACK_DELAY_MS)
setInterval(poll, INTERVALS.POLL_INTERVAL_MS)
```

## 🔍 **탐지와 예방**

### 코드 리뷰 체크리스트
- [ ] 하드코딩된 파일명이나 경로 없음
- [ ] 설명 없는 매직 넘버 없음
- [ ] 하드코딩된 UI 텍스트 없음 (i18n 사용)
- [ ] 하드코딩된 URL이나 엔드포인트 없음
- [ ] 하드코딩된 타임아웃이나 제한 없음
- [ ] 모든 반복 값이 상수로 추출됨

### 자동화 탐지 (TODO)
```bash
# 일반적인 하드코딩을 잡기 위한 grep 패턴
rg '"[a-zA-Z_]+\.(md|json|png|jpg|txt)"' --type ts
rg 'setTimeout\([^,]+,\s*\d+' --type ts
rg 'setInterval\([^,]+,\s*\d+' --type ts
```

## 📋 **구현 체크리스트**
- [ ] 관련 값들을 위한 상수 파일 생성
- [ ] 불변 객체에 `as const` 사용
- [ ] 관련 상수를 논리적으로 그룹화
- [ ] 명확하지 않은 값에 설명 주석 추가
- [ ] 관련 문자열/숫자 상수에 TypeScript enum 사용
- [ ] 기존 상수 시스템 참조 (GlobalFileNames 등)
- [ ] 상수를 사용하도록 import 업데이트

## 🎯 **이점**
- **유지보수성**: 값에 대한 단일 진실 소스
- **리팩토링**: 코드베이스 전체에서 값을 쉽게 변경
- **타입 안전성**: TypeScript가 잘못된 참조를 잡아냄
- **문서화**: 명명된 상수가 자체 문서화됨
- **테스팅**: 알려진 상수로 더 쉽게 목킹 및 테스트

---
**패턴 버전**: v1.0
**사용 예**: persona-storage.ts 상수 추출

## 미러링 정책
- 이 파일 수정 시 `.agents/workflows/atoms/hardcoding-prevention.md`도 동일하게 업데이트
