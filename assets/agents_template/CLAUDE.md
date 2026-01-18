# Project Overview
- [Project Name]: Brief description of the project
- 이중 디렉토리: `.agents/` (AI용, 토큰 최적화), `.users/` (사람용, 상세 설명)

# IMPORTANT: 세션 시작 시 필수 작업
**아래 파일들을 반드시 먼저 읽어주세요:**
1. `.agents/context/agents-rules.json` - 프로젝트 핵심 규칙 (SoT)
2. `.agents/context/ai-work-index.yaml` - 작업 유형별 워크플로우 인덱스

필요 시 `.agents/workflows/`에서 관련 워크플로우를 온디맨드로 로드합니다.

# Directory Structure (Dual-directory Architecture)
```
.agents/                    # AI용 (영어, 토큰 최적화)
├── context/               # 시스템 규칙 (JSON/YAML)
│   ├── agents-rules.json   # 메인 규칙 파일 (SoT) ← 필수 읽기
│   └── ai-work-index.yaml  # 작업 인덱스 ← 필수 읽기
├── workflows/             # 작업 워크플로우 (온디맨드)
│   └── atoms/             # 재사용 가능한 빌딩 블록
├── skills/
└── hooks/

.users/                     # 사람용 (네이티브 언어, 상세)
├── context/               # 프로젝트 컨텍스트 (Markdown)
├── workflows/
├── skills/
└── hooks/
```

# Key Principles
1. **1:1 Mirroring**: `.users/` 구조는 `.agents/`를 정확히 미러링
2. **Language Optimization**: `.agents/`는 영어 (토큰 효율), `.users/`는 사용자/팀 언어
3. **SoT**: `.agents/context/agents-rules.json`이 유일한 규칙 소스

# Mirroring Rules
`.agents/` 또는 `.users/` 파일 수정 시 반드시 양쪽을 동기화:
- `context/` - 프로젝트 컨텍스트/규칙
- `workflows/` - 작업 워크플로우
- `skills/` - 스킬 정의 (SKILL.md)
- `hooks/` - 훅 정의

스킬 생성 시: `.agents/skills/[name]/SKILL.md`와 `.users/skills/[name]/SKILL.md` 모두 생성
템플릿: `SKILL_TEMPLATE.md` 참조
