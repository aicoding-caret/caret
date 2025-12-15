# 2025-12-16 문서 정리 계획 (개발 문서 × .caretrules 매핑)

## 재검증 요약 (2025-12-16)
- `ai-work-index.md`: `.caretrules/caret-rules.json` 온디맨드 원칙과 충돌/비존재 문서 경로가 있어 수정 필요 → KO 우선, `.caretrules` 기반 매핑으로 개편
- `testing-guide.md`: `package.json`에 없는 스크립트(`test:backend`, `caret:coverage` 등) 참조 → 실제 스크립트 기준으로 정정
- `webview-extension-communication.md`: 레거시 메시지 타입 예시가 실제 코드(ProtoBus gRPC 메시지)와 불일치 → ProtoBus(gRPC over postMessage) 기준으로 재작성
- `caret-docs/development/workflows/*`: `.caretrules`와 중복 구조(고립/드리프트 위험) → 이후 “stub(포인터)화” 또는 아카이브로 정리 필요

## 목표
- `caret-docs/development` 문서를 KO 우선으로 재정리하고, `features` 만 EN 병행
- `.caretrules` workflows/atoms 와 1:1 매핑을 복구해 AI-개발자 지식 동등성 유지
- 고립/중복 문서를 해소하고 README/index 네비게이션을 일관되게 구성

## 작업 원칙
- KO 우선, `caret-docs/features.*`는 EN/KR 병행 유지
- `.caretrules/workflows/*` ↔ `caret-docs/development/*` 대응 여부를 명시
- 불필요/구버전 문서는 삭제 제안 또는 archived/ 이동 (사전 합의 필요)

## 인벤토리 & 매핑 (확정용 초안)

- 시작하기 / 환경·빌드·CLI
  - development/configuration.md ↔ .caretrules 없음 (개발자 가이드 전용)
  - development/build-and-test.md ↔ .caretrules 없음 (스크립트 안내)
  - development/cli-development.md ↔ .caretrules 없음 (CLI 전용)

- 개발 워크플로우 (AI rules 매핑)
  - development/caret-development.md ↔ .caretrules/workflows/caret-development.md
  - development/cline-modification.md ↔ .caretrules/workflows/cline-modification.md
  - development/testing-guide.md ↔ .caretrules/workflows/testing-work.md (+ atoms/tdd-cycle 등)
  - development/ai-work-index.md, ai-work-protocol.md ↔ .caretrules/workflows/ai-work-protocol.md
  - development/b2b-branding-workflow.md ↔ .caretrules/workflows/branding-and-logging.md
  - development/new-component.md ↔ .caretrules/workflows/new-component.md
  - development/critical-verification.md ↔ .caretrules/workflows/critical-verification.md
  - development/document-organization.md ↔ .caretrules/workflows/document-organization.md
  - development/ai-feature.md ↔ .caretrules/workflows/ai-feature.md
  - development/testing-work.md ↔ .caretrules/workflows/testing-work.md (중복 여부 확인)

- 아키텍처/패턴
  - development/caret-architecture-and-implementation-guide.md ↔ .caretrules/workflows/merge-strategy.md? (부분 매핑 필요, 개요)
  - frontend-backend-interaction-patterns.md ↔ atoms? (직접 대응 없음, 참조 가이드)
  - component-architecture-principles.md ↔ atoms? (직접 대응 없음)
  - prompt-management.md ↔ atoms? (없음, 참조 가이드)
  - file-storage-and-image-loading-guide.md / ui-to-storage-flow.md ↔ 없음
  - message-processing-architecture.md / checkpoint-architecture.md ↔ 없음 (아키텍처 참고)
  - button-system-architecture-guide.md ↔ 없음 (UI 패턴)
  - build-system.md ↔ 없음 (구버전, build-and-test 대체 가능)
  - system-prompt-implementation.md ↔ 없음 (프롬프트 구현 참고)
  - extension-architecture.mmd ↔ 없음 (다이어그램)

- 레퍼런스 / 기타
  - support-model-list.* (EN/KR 병행) ↔ .caretrules/workflows/ai-feature.md 에서 참조 가능
  - locale.md, logging-rules.md, link-management-guide.md, json-comment-conventions.md ↔ atoms? (없음, 규약 참고)
  - utilities.md ↔ 없음 (스크립트 안내)
  - ai-work-index.md (목록) ↔ ai-work-protocol.md/.caretrules 대응 확인 필요
  - ai-work-protocol.md ↔ .caretrules/workflows/ai-work-protocol.md (확정 필요)

## TODO (정리/편입/삭제 후보)
- 고립 문서 식별: 위 매핑에 없는 파일은 인덱스 편입/삭제 여부 결정
- 한/영 혼용: support-model-list.*는 EN/KR 병행 유지, 나머지는 KO 통일 및 EN 링크 표기
- README 및 development/index.md 네비게이션 업데이트: KO 중심, workflows/.caretrules 매핑 섹션 추가
- 아카이브/삭제 후보 목록 작성 후 합의

### 삭제/아카이브 후보 (초안)
- build-system.md: build-and-test.md로 대체 가능
- button-system-architecture-guide.md: UI 패턴 개요, 사용처 불명
- message-processing-architecture.md, checkpoint-architecture.md: 현재 아키텍처와 불일치 가능성 검토
- system-prompt-implementation.md: 프롬프트 구현 구버전 여부 확인
- extension-architecture.mmd: 최신 다이어그램 여부 확인 후 보존/아카이브 결정

## 다음 단계
1) 위 인벤토리 보완 및 .caretrules 실제 대응 관계 재검증
2) index/README 개편안 제시 (섹션/링크 구조)
3) 삭제/아카이브 후보 표 공유 후 적용
