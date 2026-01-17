# API 프로바이더 테스트 가이드

## 개요

Caret에서 지원하는 LLM API 프로바이더들을 개별적으로 테스트하는 방법입니다.

## 환경 설정

`.env` 파일에 테스트할 프로바이더의 API 키를 설정하세요:

```env
# Google Gemini
GEMINI_TOKEN=your_gemini_api_key

# Upstage Solar
UPSTAGE_KEY=your_upstage_api_key

# ZAI (GLM4.7)
ZAI_TOKEN=your_zai_api_key

# Caret
CARET_KEY=your_caret_api_key
```

## 테스트 스크립트

### 1. Upstage Solar

```bash
node scripts/test-upstage-api.js
```

- **엔드포인트**: `https://api.upstage.ai/v1/chat/completions`
- **인증**: Bearer 토큰
- **모델**: solar-pro2, solar-mini
- **테스트**: 스트리밍 + 논스트리밍

### 2. GLM4.7 (ZAI)

```bash
node scripts/test-glm47-streaming.js
```

- **엔드포인트**: `https://api.z.ai/api/coding/paas/v4/chat/completions`
- **인증**: Bearer 토큰
- **모델**: glm-4.7
- **필수 설정**:
  - `stream: true`
  - `thinking: { type: "enabled" }`
  - `max_tokens: 500` 이상

### 3. Gemini

```bash
node scripts/test-api-scenarios.js gemini-text
node scripts/test-api-scenarios.js gemini-image
```

- **엔드포인트**: `https://generativelanguage.googleapis.com/v1beta`
- **인증**: URL에 API 키 포함
- **모델**: gemini-2.0-flash-exp

### 4. Hook & Skill 통합

```bash
node scripts/test-api-hook-skill.js
```

- API 연결 확인
- Hook 시스템 동작 확인
- Skill 도구 호출 확인

## 새 테스트 스크립트 만들기

### 기본 구조

```javascript
// scripts/test-{provider}-api.js

const fs = require('fs');
const path = require('path');

// .env 로드 (dotenv 없이)
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf-8').split('\n').forEach((line) => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match && !process.env[match[1]]) {
            process.env[match[1]] = match[2];
        }
    });
}

const API_KEY = process.env.{PROVIDER}_KEY;

if (!API_KEY) {
    console.error('❌ {PROVIDER}_KEY not found in .env');
    process.exit(1);
}

async function testAPI() {
    console.log('🚀 Testing {Provider} API...');

    const response = await fetch('{ENDPOINT}', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: '{MODEL_ID}',
            messages: [{ role: 'user', content: 'Hello!' }],
            max_tokens: 100,
            stream: true,
        }),
    });

    if (!response.ok) {
        console.error('❌ Error:', response.status, await response.text());
        return;
    }

    // SSE 스트리밍 처리
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
                const json = JSON.parse(data);
                const content = json.choices?.[0]?.delta?.content;
                if (content) process.stdout.write(content);
            } catch {}
        }
    }

    console.log('\n✅ Test passed!');
}

testAPI().catch(console.error);
```

### 체크리스트

새 프로바이더 테스트 스크립트 작성 시:

1. **환경 변수 이름 정의**: `{PROVIDER}_KEY` 형식
2. **엔드포인트 URL 확인**: API 문서에서 정확한 URL 확인
3. **인증 방식 확인**: Bearer 토큰, API 키 헤더, URL 파라미터 등
4. **스트리밍 지원 확인**: SSE 처리 로직 필요 여부
5. **에러 처리 추가**: HTTP 상태 코드별 메시지

## 문제 해결

### API 키 오류
```
❌ {PROVIDER}_KEY not found in .env
```
→ `.env` 파일에 API 키 추가

### 인증 실패 (401)
→ API 키가 유효한지 확인

### Rate Limit (429)
→ 요청 간격을 두고 재시도

### 빈 응답
→ `max_tokens` 값 증가, `stream: true` 설정 확인

## 관련 파일

| 파일 | 설명 |
|------|------|
| `docs/API_TEST_GUIDE.md` | 전체 API 테스트 가이드 |
| `scripts/test-upstage-api.js` | Upstage 테스트 |
| `scripts/test-glm47-streaming.js` | GLM4.7 테스트 |
| `scripts/test-api-hook-skill.js` | Hook/Skill 테스트 |
| `.agents/context/api-provider-testing.yaml` | AI용 테스트 가이드 |
