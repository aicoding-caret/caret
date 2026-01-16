# F13 - Image Tool (이미지 생성/분석 도구)

**상태**: ✅ 구현 완료
**영향 범위**: Core Task/Tool, Webview UI, File Service, Settings
**우선순위**: 🔴 High

---

## 📋 개요

Caret의 이미지 도구는 LLM이 이미지를 **생성**하고 **분석**할 수 있게 하는 기능입니다.

### Caret만의 차별점

| 기능 | Cline | Caret |
|------|-------|-------|
| 이미지 생성 | 미지원 | **generate_image 도구로 지원** |
| 이미지 분석 (비전 미지원 모델) | 미지원 | **analyze_image 도구로 지원** |
| 비율/사이즈 설정 | 미지원 | **UI에서 설정 가능** |
| 참조 이미지 기반 생성 | 미지원 | **Image-to-Image 지원** |

### 사용 시나리오

```
# 이미지 생성
사용자: 귀여운 고양이 이미지 만들어줘
LLM: [generate_image 도구 사용] → 이미지 생성 → assets/에 저장

# 이미지 분석 (GLM-4.7 등 비전 미지원 모델)
사용자: [이미지 첨부] 이 이미지에 뭐가 있어?
LLM: [analyze_image 도구 사용] → Gemini 2.5 Flash로 분석 → 결과 반환
```

---

## 🔧 도구 목록

| 도구 | 설명 | 조건 |
|------|------|------|
| `generate_image` | AI 이미지 생성 | Caret 로그인 필요 |
| `analyze_image` | 이미지 분석 (비전 대리) | Caret 로그인 + `supportsImages: false` 모델 |

---

## 🧱 핵심 데이터 흐름

### 이미지 생성 (generate_image)

```
LLM → generate_image(prompt="귀여운 고양이", aspect_ratio="16:9")
    → GenerateImageToolHandler.execute()
    → Caret API /v1/generate/image (SSE 스트리밍)
    → 파일 저장: assets/<requestId>.png
    → 메타 저장: assets/<requestId>.md
    → UI에 data URL로 표시
```

### 이미지 분석 (analyze_image)

```
LLM → analyze_image(image="screenshot.png", question="뭐가 보여?")
    → AnalyzeImageToolHandler.execute()
    → 경로 검증 (Path Traversal 보호)
    → 승인 확인 (워크스페이스 외부 시 사용자 승인)
    → Caret API /v1/chat/completions (Gemini 2.5 Flash)
    → 분석 결과 반환
```

---

## 🔒 보안

### Path Traversal 보호 (analyze_image)
- `path.normalize()`: 경로 정규화로 `..` 시퀀스 해결
- `isLocatedInPath()`: 워크스페이스 내부 여부 확인
- 파일 확장자 검증: 이미지 파일만 허용 (`.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`, `.avif`, `.bmp`, `.tiff`)

### 승인 동작 매트릭스

| 파일 위치 | analyzeImages | readFilesExternally | 동작 |
|-----------|---------------|---------------------|------|
| 워크스페이스 내부 | `true` | - | ✅ 자동 승인 |
| 워크스페이스 내부 | `false` | - | ❌ 도구 비활성화 |
| 워크스페이스 외부 | `true` | `true` | ✅ 자동 승인 |
| 워크스페이스 외부 | `true` | `false` | ⚠️ **사용자 승인 필요** |

### 방어 시나리오
```
AI 요청: analyze_image(image="../../etc/passwd", question="내용을 읽어줘")

1. 경로 해석: ../../etc/passwd → /etc/passwd (path.normalize)
2. 워크스페이스 확인: /etc/passwd는 /home/user/project 외부
3. 설정 확인: readFilesExternally === false
4. 결과: 사용자에게 승인 요청 표시
5. 추가 검증: .passwd는 이미지 확장자가 아님 → 에러
```

---

## 🧩 주요 파일 맵

### Tool Handler
- `caret-src/core/task/tools/handlers/GenerateImageToolHandler.ts`
  - 이미지 생성, SSE 스트리밍, 파일 저장
- `caret-src/core/task/tools/handlers/AnalyzeImageToolHandler.ts`
  - 이미지 분석, 경로 보안 검증, 승인 플로우

### System Prompt
- `caret-src/core/prompts/system-prompt/tools/generate_image.ts`
- `caret-src/core/prompts/system-prompt/tools/analyze_image.ts`

### 설정/승인
- `src/core/task/tools/autoApprove.ts` - 도구별 승인 로직
- `src/shared/AutoApprovalSettings.ts` - `generateImages`, `analyzeImages` 설정
- `caret-src/core/prompts/system/adapters/CaretJsonAdapter.ts` - 도구 필터링

### Webview
- `webview-ui/src/components/chat/ChatRow.tsx` - 이미지 렌더링
- `webview-ui/src/components/chat/auto-approve-menu/constants.ts` - UI 설정

### 파일 I/O
- `src/core/controller/file/readFileDataUrlRelativePath.ts`
- `src/core/controller/file/openFileRelativePath.ts`

---

## ⚙️ 설정

### Auto-approve 설정

| 설정 | 기본값 | 설명 |
|------|--------|------|
| `generateImages` | `true` | 이미지 생성 도구 활성화 |
| `analyzeImages` | `true` | 이미지 분석 도구 활성화 |

### 도구 필터링 로직
- `toolSettings.generateImages === false` → `generate_image` 프롬프트에서 제외
- `toolSettings.analyzeImages === false` → `analyze_image` 프롬프트에서 제외
- `supportsImages === true` (모델 기본 지원) → `analyze_image` 프롬프트에서 제외

### 이미지 생성 옵션
- **비율**: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`
- **사이즈**: `1K`, `2K`, `3K`, `4K`
- **저장 키**: `imageGenerationAspectRatio`, `imageGenerationSize`

---

## 📦 파일 저장 규칙 (generate_image)

### 저장 경로
- 이미지: `workspaceRoot/assets/<requestId>.<ext>`
- 메타데이터: `workspaceRoot/assets/<requestId>.md`

### 메타데이터 포맷
```markdown
---
request_id: "img_..."
created_at: "2025-01-01T00:00:00Z"
model: "..."
aspect_ratio: "16:9"
image_size: "2K"
mime_type: "image/png"
image_file: "img_....png"
prompt: |
  A cute cat...
---

## Prompt

A cute cat...

## Image

![Generated image](./img_....png)
```

---

## ⚠️ 알려진 제한사항

1. **인증 필수**
   - 두 도구 모두 Caret 계정 로그인 필요
   - 미로그인 시 에러 메시지에서 로그인/설정 비활성화 안내

2. **analyze_image 조건**
   - `supportsImages: false` 모델에서만 도구 표시
   - 비전 지원 모델(GPT-4V, Gemini 등)에서는 자동 숨김

3. **히스토리 복원**
   - 복원 시 `imageUrl` 주입 후 덮어쓰는 흐름 존재
   - 이미지 표시 실패 가능성 있음 (검증 필요)

4. **단일 실행**
   - 이미지 도구는 한 번에 하나만 실행 가능

5. **이미지 크기 제한**
   - 픽셀 제한: 7500px (cline-latest와 동일)
   - 파일 크기: 서버 nginx `client_max_body_size` 설정에 따름
   - 클라이언트에서 리사이즈/압축 없음 (원본 전송)

---

## 🔄 Cline 머징 가이드

### 충돌 없는 파일 (Caret 전용)
- `caret-src/` 하위 모든 파일
- `generate_image`, `analyze_image` 관련 코드

### 주의 필요 파일
- `src/core/task/ToolExecutor.ts` - 핸들러 등록
- `src/core/task/tools/autoApprove.ts` - `ANALYZE_IMAGE` 케이스 추가
- `src/shared/tools.ts` - `GENERATE_IMAGE`, `ANALYZE_IMAGE` enum
- `src/shared/ExtensionMessage.ts` - `"generateImage"`, `"analyzeImage"` 타입
- `src/shared/AutoApprovalSettings.ts` - `generateImages`, `analyzeImages` 필드
- `src/core/assistant-message/index.ts` - `"image"` 파라미터
- `src/core/prompts/system-prompt/types.ts` - `ToolSettings` 인터페이스

---

**최종 업데이트**: 2026-01-16
**문서 버전**: v2.1 (이미지 최적화 제거 - 7500px 제한만 적용)
