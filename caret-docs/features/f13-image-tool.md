# F13 - Image Tool (이미지 생성/저장/히스토리 표시)

**상태**: ✅ 진행 중 (코어/웹뷰 연동 완료, 히스토리 재로딩 안정화 확인 필요)
**영향 범위**: Core Task/Tool, Webview UI, File Service, Settings
**우선순위**: 🔴 High

---

## 📋 개요

이미지 생성 도구(`generateImage`)는 다음 요구사항을 만족하도록 설계되어 있습니다.

- 이미지는 **프로젝트(workspace) 하위 `assets/`**에 파일로 저장
- 생성된 프롬프트/메타정보는 **이미지와 같은 폴더에 `.md`**로 저장
- Webview는 **절대경로가 아닌 data URL로만 이미지 렌더링**
- 히스토리 복원 시에도 **저장된 파일을 읽어 이미지가 다시 표시**되어야 함
- 모델 설명에서 **비율/사이즈 설정**을 지원하여 이미지 생성 요청에 반영

---

## ✅ 최종 결정 사항

- 저장 경로: `workspaceRoot/assets/<requestId>.<ext>`
- 메타데이터: `workspaceRoot/assets/<requestId>.md`
- 렌더링: `<img src>`는 data URL만 사용
- 히스토리 복원: 파일 읽기 → data URL 주입 → UI 표시
- 비율 옵션: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`
- 사이즈 옵션: `1K`, `2K`, `3K`, `4K`
- 참조 이미지가 있으면 시스템 프롬프트에 이미지-투-이미지 페르소나 적용
- 참조 이미지는 chat/completions로 보내지 않고 이미지 생성 요청에만 전달

---

## 🧱 핵심 데이터 흐름

### 1) 이미지 생성 요청
- 실행 지점: `caret-editor-new/src/core/task/tools/handlers/GenerateImageToolHandler.ts`
- 요청 바디:
  - `prompt`
  - `model` (선택)
  - `aspect_ratio` (선택)
  - `image_size` (선택)
  - `reference_images` (선택, data URL 배열)
  - `stream: true`
- 전역 설정값이 있으면 우선 사용:
  - `imageGenerationAspectRatio`
  - `imageGenerationSize`

### 2) 스트리밍 처리
- SSE 이벤트 처리:
  - `text` → 진행 메시지 갱신
  - `image` → base64 저장 + UI 이벤트
  - `usage` → 비용/토큰 업데이트
  - `done` → 완료 처리
  - `error` → 실패 처리

### 3) 파일 저장
- 이미지 저장: `assets/<requestId>.<ext>`
- 메타 저장: `assets/<requestId>.md`
- 폴더가 없으면 `fs.mkdir(..., { recursive: true })`로 생성

### 4) 메시지 페이로드
- `ToolImageMessage` 필드:
  - `workspaceRelativePath`, `workspaceAbsolutePath`, `imageUrl`(선택)
  - `prompt`, `model`, `aspectRatio`, `imageSize`, `status`, `progressText`
- `ToolImageEvent` (UI 실시간 표시용):
  - `requestId`, `mimeType`, `base64`, `workspaceRelativePath`, `workspaceAbsolutePath`

---

## 🧾 메타데이터 마크다운 포맷

`buildImageMarkdown()` 기준 (요약):

- Frontmatter 포함
  - `request_id`, `created_at`, `model`, `aspect_ratio`, `image_size`, `mime_type`, `image_file`, `prompt`
- 본문에 Prompt 블록 + 이미지 링크 삽입

예시:

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

```text
A cute cat...
```

## Image

![Generated image](./img_....png)
```

---

## 🖼️ Webview 렌더링 규칙

- 위치: `caret-editor-new/webview-ui/src/components/chat/ChatRow.tsx`
- 렌더링은 **`imageUrl`(data URL)만** 사용
- 경로 표시/열기:
  - `workspaceAbsolutePath` 우선
  - 없으면 `workspaceRelativePath`

### 이미지 로딩 순서
1) `tool.imageUrl`이 있으면 즉시 사용
2) `readFileDataUrlRelativePath`로 `workspaceAbsolutePath` 시도
3) 없으면 `workspaceRelativePath` 시도
4) 그래도 실패하면 `assets/<requestId>.<ext>` 추정 후보 탐색

### “이미지를 불러올 수 없습니다” 조건
- data URL 해석 실패 + 생성 중 아님
- 이 경우 경로만 표시 (클릭 시 파일 열기)

---

## 🔎 파일 읽기/열기 경로 해석

### readFileDataUrlRelativePath
- 절대경로 지원 (`/Users/...`)
- `file://` 경로 정규화 지원
- 상대경로의 경우 다중 루트 탐색:
  - HostProvider workspace roots
  - workspaceManager roots
  - taskHistory의 `cwdOnTaskInitialization`

### openFileRelativePath / ifFileExistsRelativePath
- 동일한 루트 집합에서 상대경로를 해석하여 파일 열기

---

## 🕘 히스토리 복원 처리

### 복원 시 처리 단계
1) `addAbsolutePathsToGenerateImageMessages`
   - `workspaceRelativePath` → `workspaceAbsolutePath` 보강
2) `addImageDataUrlsToGenerateImageMessages`
   - 절대경로 파일 읽기 → `imageUrl` 주입

### 주의사항
- `resumeTaskFromHistory()`에서 patch 후 **다시 `getSavedClineMessages()`로 덮어쓰는 코드가 존재**
- 이 경우 주입된 `imageUrl`이 사라질 가능성이 있어 **실제 복원 동작 확인 필요**

---

## ⚙️ UI 설정 (비율/사이즈)

- 위치: `caret-editor-new/webview-ui/src/components/settings/common/ModelInfoView.tsx`
- 지원 옵션:
  - 비율: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`
  - 사이즈: `1K`, `2K`, `3K`, `4K`
- 저장 키:
  - `imageGenerationAspectRatio`
  - `imageGenerationSize`
- 업데이트 경로:
  - `updateSettings` → `StateManager` → `GenerateImageToolHandler`에서 사용

---

## 🧩 주요 파일 맵

- 이미지 생성 Tool
  - `caret-editor-new/src/core/task/tools/handlers/GenerateImageToolHandler.ts`
- Webview 렌더링
  - `caret-editor-new/webview-ui/src/components/chat/ChatRow.tsx`
- 파일 읽기/열기
  - `caret-editor-new/src/core/controller/file/readFileDataUrlRelativePath.ts`
  - `caret-editor-new/src/core/controller/file/openFileRelativePath.ts`
  - `caret-editor-new/src/core/controller/file/ifFileExistsRelativePath.ts`
- 히스토리 복원
  - `caret-editor-new/src/core/task/index.ts`
- 설정
  - `caret-editor-new/webview-ui/src/components/settings/common/ModelInfoView.tsx`
  - `caret-editor-new/src/core/controller/state/updateSettings.ts`
  - `caret-editor-new/src/shared/storage/state-keys.ts`

---

## ⚠️ 알려진 이슈 / 체크 포인트

- 히스토리 복원 시 `imageUrl` 주입 이후 다시 덮어쓰는 흐름이 있어 **이미지 표시 실패 가능성**
- “이미지를 불러올 수 없습니다”는 **data URL 해석 실패**일 때 발생
- `workspaceRelativePath`가 올바르더라도 **절대경로 → data URL 변환 실패** 시 렌더 불가
- 이미지 도구는 한 번에 하나만 실행 가능 (tool-use 단일 실행 제한)

---

## ✅ 다음 검증 항목

- 히스토리 복원 후 이미지 재표시 정상 여부
- 경로 클릭 시 파일 열기 정상 여부
- `assets/` 폴더가 없는 환경에서 자동 생성 동작 여부
- 설정값(비율/사이즈)이 요청에 실제 반영되는지 확인
