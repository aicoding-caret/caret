# API 프로바이더 테스팅 스킬

## 개요
Caret에서 LLM API 프로바이더를 추가하거나 수정할 때의 테스트 가이드라인입니다.

## 테스트 카테고리

### 1. 기본 대화 테스트
- 간단한 프롬프트 → 응답 검증
- 스트리밍 청크 수신
- 토큰 사용량 리포팅

**예시:**
```javascript
const response = await handler.createMessage("System prompt", [
  { role: 'user', content: 'Hello' }
])
// 검증: text 청크 + usage 청크
```

### 2. 도구 호출 테스트
에이전트 기능의 핵심 검증입니다.

**테스트 흐름:**
1. 도구 정의와 함께 메시지 전송
2. `tool_calls` 청크 수신 확인
3. 함수명과 인자 검증
4. 도구 결과 전송
5. 최종 텍스트 응답 확인

**프로바이더별 형식:**

| 프로바이더 | Tool Call 키 | Arguments | Tool Result 키 |
|-----------|-------------|-----------|----------------|
| OpenAI | `tool_calls` | string | `tool_call_id` |
| Naver Cloud | `toolCalls` | object | `toolCallId` |
| Upstage | `tool_calls` | string | `tool_call_id` |
| Gemini | `functionCall` | object | n/a (다른 형식) |

### 3. 타임아웃 테스트
- `AbortController`로 설정 가능한 타임아웃 사용
- 기본값: 60초 권장
- 타임아웃 에러가 올바르게 발생하는지 확인

### 4. 에러 처리 테스트
- 잘못된 API 키 → 401/403 에러
- Rate limiting → 429 에러 및 재시도
- 빈 응답 → 특정 에러 메시지

## 테스트 스크립트 템플릿

위치: `scripts/test-{provider}-api.js`

```javascript
// .env 로드
const fs = require('fs')
const path = require('path')
const envPath = path.resolve(__dirname, '../.env')
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf-8').split('\n').forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/)
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2]
    }
  })
}

// 테스트 구조
async function testBasicConversation() { ... }
async function testToolCalling() { ... }
async function testToolResultFlow() { ... }
async function testTimeout() { ... }

async function main() {
  const results = {
    basic: await testBasicConversation(),
    toolCall: await testToolCalling(),
    toolFlow: await testToolResultFlow(),
  }
  console.log('Results:', results)
}
```

## 기존 테스트 스크립트

| 스크립트 | 프로바이더 | 테스트 내용 |
|---------|-----------|-----------|
| `scripts/test-naver-cloud-api.js` | Naver Cloud | 기본, 타임아웃 |
| `scripts/test-naver-tool-calling.js` | Naver Cloud | 도구 호출, 도구 흐름 |
| `scripts/test-upstage-api.js` | Upstage | 기본, 스트리밍 |
| `scripts/test-glm47-streaming.js` | GLM4.7 | Thinking, 스트리밍 |

## 주요 파일

| 파일 | 용도 |
|-----|------|
| `src/core/api/providers/{provider}.ts` | 프로바이더 핸들러 |
| `src/core/api/transform/tool-call-processor.ts` | 도구 호출 파싱 |
| `src/core/api/transform/stream.ts` | 스트림 타입 |
| `src/core/api/retry.ts` | 재시도 데코레이터 |

## 새 프로바이더 체크리스트

1. [ ] 기본 대화 작동
2. [ ] 스트리밍 청크 올바르게 파싱
3. [ ] 도구 호출 시 `tool_calls` 타입 청크 트리거
4. [ ] 도구 결과 → 최종 응답 흐름 작동
5. [ ] AbortController로 타임아웃 작동
6. [ ] 에러 메시지 명확함
7. [ ] 토큰 사용량 올바르게 리포팅
8. [ ] `__tests__/`에 통합 테스트 추가

## 미러링 정책
`.agents/`와 `.users/`는 1:1 미러링 구조입니다.
- 이 파일 수정 시 `.agents/skills/api-provider-testing/SKILL.md`도 동일하게 업데이트
- `.agents/`는 영어(토큰 효율), `.users/`는 사용자/팀 언어(상세 설명)
- 참조: `assets/agents_template/AGENTS.md`의 Key Principles
