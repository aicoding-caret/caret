# F13 - Image Tool

**Status**: ✅ Implemented
**Scope**: Core Task/Tool, Webview UI, File Service, Settings
**Priority**: 🔴 High

---

## Overview

Caret's image tools enable LLM to **generate** and **analyze** images.

### Caret vs Cline Comparison

| Feature | Cline | Caret |
|---------|-------|-------|
| Image Generation | Not supported | **Supported via generate_image tool** |
| Image Analysis (non-vision models) | Not supported | **Supported via analyze_image tool** |
| Aspect Ratio/Size Settings | Not supported | **Configurable in UI** |
| Reference Image Generation | Not supported | **Image-to-Image supported** |

### Use Case

```
# Image Generation
User: Create a cute cat image
LLM: [uses generate_image tool] → Generates image → Saves to assets/

# Image Analysis (for GLM-4.7 and other non-vision models)
User: [attaches image] What's in this image?
LLM: [uses analyze_image tool] → Analyzes via Gemini 2.5 Flash → Returns result
```

---

## Tool List

| Tool | Description | Conditions |
|------|-------------|------------|
| `generate_image` | AI image generation | Caret login required |
| `analyze_image` | Image analysis (vision proxy) | Caret login + `supportsImages: false` model |

---

## Core Data Flow

### Image Generation (generate_image)

```
LLM → generate_image(prompt="cute cat", aspect_ratio="16:9")
    → GenerateImageToolHandler.execute()
    → Caret API /v1/generate/image (SSE streaming)
    → Save file: assets/<requestId>.png
    → Save metadata: assets/<requestId>.md
    → Display as data URL in UI
```

### Image Analysis (analyze_image)

```
LLM → analyze_image(image="screenshot.png", question="What do you see?")
    → AnalyzeImageToolHandler.execute()
    → Path validation (Path Traversal protection)
    → Approval check (user approval for files outside workspace)
    → Caret API /v1/chat/completions (Gemini 2.5 Flash)
    → Return analysis result
```

---

## Security

### Path Traversal Protection (analyze_image)
- `path.normalize()`: Resolves `..` sequences
- `isLocatedInPath()`: Checks workspace containment
- Extension validation: Only image files allowed (`.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`, `.avif`, `.bmp`, `.tiff`)

### Approval Behavior Matrix

| File Location | analyzeImages | readFilesExternally | Behavior |
|---------------|---------------|---------------------|----------|
| Inside workspace | `true` | - | ✅ Auto-approved |
| Inside workspace | `false` | - | ❌ Tool disabled |
| Outside workspace | `true` | `true` | ✅ Auto-approved |
| Outside workspace | `true` | `false` | ⚠️ **User approval required** |

### Defense Scenario
```
AI request: analyze_image(image="../../etc/passwd", question="Read the contents")

1. Path resolution: ../../etc/passwd → /etc/passwd (path.normalize)
2. Workspace check: /etc/passwd is outside /home/user/project
3. Settings check: readFilesExternally === false
4. Result: Display approval request to user
5. Additional validation: .passwd is not an image extension → Error
```

---

## File Map

### Tool Handler
- `caret-src/core/task/tools/handlers/GenerateImageToolHandler.ts`
  - Image generation, SSE streaming, file saving
- `caret-src/core/task/tools/handlers/AnalyzeImageToolHandler.ts`
  - Image analysis, path security validation, approval flow

### System Prompt
- `caret-src/core/prompts/system-prompt/tools/generate_image.ts`
- `caret-src/core/prompts/system-prompt/tools/analyze_image.ts`

### Settings/Approval
- `src/core/task/tools/autoApprove.ts` - Tool-specific approval logic
- `src/shared/AutoApprovalSettings.ts` - `generateImages`, `analyzeImages` settings
- `caret-src/core/prompts/system/adapters/CaretJsonAdapter.ts` - Tool filtering

### Webview
- `webview-ui/src/components/chat/ChatRow.tsx` - Image rendering
- `webview-ui/src/components/chat/auto-approve-menu/constants.ts` - UI settings

### File I/O
- `src/core/controller/file/readFileDataUrlRelativePath.ts`
- `src/core/controller/file/openFileRelativePath.ts`

---

## Settings

### Auto-approve Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `generateImages` | `true` | Enable image generation tool |
| `analyzeImages` | `true` | Enable image analysis tool |

### Tool Filtering Logic
- `toolSettings.generateImages === false` → `generate_image` excluded from prompt
- `toolSettings.analyzeImages === false` → `analyze_image` excluded from prompt
- `supportsImages === true` (native model support) → `analyze_image` excluded from prompt

### Image Generation Options
- **Aspect Ratio**: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`
- **Size**: `1K`, `2K`, `3K`, `4K`
- **Storage Keys**: `imageGenerationAspectRatio`, `imageGenerationSize`

---

## File Storage Rules (generate_image)

### Storage Path
- Image: `workspaceRoot/assets/<requestId>.<ext>`
- Metadata: `workspaceRoot/assets/<requestId>.md`

### Metadata Format
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

## Known Limitations

1. **Authentication Required**
   - Both tools require Caret account login
   - Error messages include login/disable guidance when not logged in

2. **analyze_image Conditions**
   - Tool only shown for `supportsImages: false` models
   - Auto-hidden for vision models (GPT-4V, Gemini, etc.)

3. **History Restoration**
   - `imageUrl` injection flow during restoration may exist
   - Image display failure possible (verification needed)

4. **Single Execution**
   - Image tools can only run one at a time

5. **Image Size Limits**
   - Pixel limit: 7500px (same as cline-latest)
   - File size: Depends on server nginx `client_max_body_size` setting
   - No client-side resize/compression (original sent)

---

## Cline Merge Guide

### No-Conflict Files (Caret-only)
- All files under `caret-src/`
- `generate_image`, `analyze_image` related code

### Files Requiring Attention
- `src/core/task/ToolExecutor.ts` - Handler registration
- `src/core/task/tools/autoApprove.ts` - `ANALYZE_IMAGE` case addition
- `src/shared/tools.ts` - `GENERATE_IMAGE`, `ANALYZE_IMAGE` enum
- `src/shared/ExtensionMessage.ts` - `"generateImage"`, `"analyzeImage"` types
- `src/shared/AutoApprovalSettings.ts` - `generateImages`, `analyzeImages` fields
- `src/core/assistant-message/index.ts` - `"image"` parameter
- `src/core/prompts/system-prompt/types.ts` - `ToolSettings` interface

---

**Last Updated**: 2026-01-16
**Document Version**: v2.1 (removed image optimization - 7500px limit only)
