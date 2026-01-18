# API Provider Testing Skill

## Overview
Guidelines for testing LLM API providers when adding or modifying support in Caret.

## Test Categories

### 1. Basic Conversation Test
- Simple prompt → response verification
- Streaming chunk reception
- Token usage reporting

**Example:**
```javascript
const response = await handler.createMessage("System prompt", [
  { role: 'user', content: 'Hello' }
])
// Verify: text chunks + usage chunk
```

### 2. Tool Calling Test
Core verification for agentic capabilities.

**Test Flow:**
1. Send message with tool definitions
2. Verify `tool_calls` chunk received
3. Verify function name and arguments
4. Send tool result back
5. Verify final text response

**Provider-Specific Formats:**

| Provider | Tool Call Key | Arguments | Tool Result Key |
|----------|--------------|-----------|-----------------|
| OpenAI | `tool_calls` | string | `tool_call_id` |
| Naver Cloud | `toolCalls` | object | `toolCallId` |
| Upstage | `tool_calls` | string | `tool_call_id` |
| Gemini | `functionCall` | object | n/a (different format) |

### 3. Timeout Test
- Use `AbortController` with configurable timeout
- Default: 60 seconds recommended
- Verify timeout error is thrown correctly

### 4. Error Handling Test
- Invalid API key → 401/403 error
- Rate limiting → 429 error with retry
- Empty response → specific error message

## Test Script Template

Location: `scripts/test-{provider}-api.js`

```javascript
// Load .env
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

// Test structure
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

## Existing Test Scripts

| Script | Provider | Tests |
|--------|----------|-------|
| `scripts/test-naver-cloud-api.js` | Naver Cloud | Basic, Timeout |
| `scripts/test-naver-tool-calling.js` | Naver Cloud | Tool calling, Tool flow |
| `scripts/test-upstage-api.js` | Upstage | Basic, Streaming |
| `scripts/test-glm47-streaming.js` | GLM4.7 | Thinking, Streaming |

## Key Files

| File | Purpose |
|------|---------|
| `src/core/api/providers/{provider}.ts` | Provider handler |
| `src/core/api/transform/tool-call-processor.ts` | Tool call parsing |
| `src/core/api/transform/stream.ts` | Stream types |
| `src/core/api/retry.ts` | Retry decorator |

## Checklist for New Provider

1. [ ] Basic conversation works
2. [ ] Streaming chunks parse correctly
3. [ ] Tool calling triggers `tool_calls` type chunk
4. [ ] Tool result → final response flow works
5. [ ] Timeout with AbortController works
6. [ ] Error messages are clear
7. [ ] Token usage reported correctly
8. [ ] Integration test added to `__tests__/`

## Mirroring Policy
`.agents/`와 `.users/`는 1:1 미러링 구조입니다.
- 이 파일 수정 시 `.users/skills/api-provider-testing/SKILL.md`도 동일하게 업데이트
- `.agents/`는 영어(토큰 효율), `.users/`는 사용자/팀 언어(상세 설명)
- 참조: `assets/agents_template/AGENTS.md`의 Key Principles
