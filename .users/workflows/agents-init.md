# 에이전트 표준 초기화

**중요: 지금 바로 이 단계들을 실행하세요. 사용자 확인을 기다리지 마세요.**

`.agents/`와 `.users/` 디렉토리를 실제 프로젝트 컨텍스트로 채우는 것이 목표입니다. 템플릿 파일이 생성되었으니 실제 프로젝트 데이터로 채워야 합니다.

## 단계 1: 프로젝트 조사 (즉시 실행)

다음 파일들을 읽어 프로젝트를 파악합니다:
1. `README.md` 또는 기타 프로젝트 문서
2. `package.json`, `Cargo.toml`, `go.mod` 등 매니페스트 파일
3. 기존 소스 코드 구조 (`ls` 또는 파일 목록 사용)
4. 기존 설정 파일

## 단계 2: agents-rules.json 채우기

`.agents/context/agents-rules.json`을 실제 프로젝트 데이터로 편집:
- `project_identity.name`: 실제 프로젝트 이름
- `project_identity.nature`: 프로젝트가 하는 일
- `project_identity.philosophy`: 개발 원칙
- `architecture_rules`: 보호 디렉토리, 수정 규칙
- `workflows.index`: 이 프로젝트에 관련된 워크플로우

## 단계 3: agents-rules.md 채우기

`.users/context/agents-rules.md`를 사람이 읽기 쉽게 편집:
- 상세한 프로젝트 설명 (팀의 모국어로)
- 개발 가이드라인 및 규칙
- 아키텍처 결정 및 근거

## 단계 4: AGENTS.md와 CLAUDE.md 업데이트

두 파일을 적절한 진입점으로 업데이트:
- 간략한 프로젝트 개요
- 필수 읽기 파일 (agents-rules.json 참조)
- 주요 명령어 및 작업

## 단계 5: ai-work-index.yaml 채우기

`.agents/context/ai-work-index.yaml` 편집:
- 이 프로젝트에 관련된 작업 카테고리
- 워크플로우 참조
- 키워드 매핑

## 디렉토리 구조 참조

```
.agents/                    # AI용 (영어, 토큰 최적화)
├── context/
│   ├── agents-rules.json   # ← 프로젝트 규칙 채우기 (SoT)
│   └── ai-work-index.yaml  # ← 작업 카테고리 채우기
├── workflows/
│   └── atoms/
├── skills/
└── hooks/

.users/                     # 사람용 (모국어)
├── context/
│   ├── agents-rules.md     # ← 상세 설명 채우기
│   └── ai-work-index.md
├── workflows/
├── skills/
└── hooks/

AGENTS.md                   # ← 진입점으로 업데이트
CLAUDE.md                   # ← 진입점으로 업데이트 (AGENTS.md와 동일)
```

## 제약사항

- 사실을 지어내지 마세요 - 프로젝트에서 확인된 소스만 사용
- `.agents/` 내용은 영어 (토큰 최적화)
- `.users/` 내용은 팀의 모국어 (상세)
- 1:1 미러링: `.users/` 구조는 `.agents/`를 정확히 미러링
- `AGENTS.md`와 `CLAUDE.md`는 동일한 내용이어야 함
- 데이터가 없거나 불분명하면 작성 전에 사용자에게 질문

## 마이그레이션 참고

기존 `AGENTS.md` 또는 `CLAUDE.md` 파일에 레거시 콘텐츠가 감지되면
아래에 마이그레이션 가이드가 추가됩니다. 이 경우:
1. 기존 파일에서 규칙 추출
2. `.agents/context/agents-rules.json`으로 마이그레이션 (JSON 형식)
3. 상세 설명은 `.users/context/agents-rules.md`로 마이그레이션
4. AGENTS.md/CLAUDE.md는 진입점으로만 업데이트

**지금 바로 실행 시작 - 단계 1: 프로젝트 파일 읽기부터 시작.**

## 미러링 정책
`.agents/`와 `.users/`는 1:1 미러링 구조입니다.
- 이 파일 수정 시 `.agents/workflows/agents-init.md`도 동일하게 업데이트
- `.agents/`는 영어(토큰 효율), `.users/`는 사용자/팀 언어(상세 설명)
