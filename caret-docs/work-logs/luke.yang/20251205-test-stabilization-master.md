# 2025-12-05 테스트 정상화 마스터

## 요청/지침
- 목적: TDD 게이트를 복구하고, AI 코딩/로더 충돌로 인한 허위 실패를 제거해 실제 기능 회귀를 조기에 발견.
- 모든 변경은 CARET MODIFICATION 주석 또는 테스트용 스텁 범위에서 최소 침습으로 처리.
- 실제 기능 버그가 의심되면 즉시 보고 후 범위를 분리한다.
- 작업 기록을 이 파일에 순차 추가한다.
- 추가(2025-12-08): `.caretignore`를 기본으로 리브랜딩하되 `.clineignore` 호환을 유지, Cline 소스 수정 시 최소 침습/주석 준수, 변경 사항을 이 마스터 로그에 연동한다.

## 현재 상황 (2025-12-05)
- `npm run test`가 `PostHogErrorProvider` 로딩 시 ESM/CJS 변환 충돌(`posthog-node` 로더)로 초반에 중단.
- 프런트 타입 오류는 `template_characters` 에셋 누락이 원인 → `webview-ui/src/caret/assets/template_characters`에 복사하여 해소.

## 진행할 조치
1) `PostHogErrorProvider`에 테스트 전용 스텁 경로를 추가해 `posthog-node`를 건드리지 않도록 처리.
2) `src/test/requires.ts`의 모듈 스텁은 최소화하고, 테스트 본문에서 실제 로더를 통과시키지 않는지 확인.
3) `npm run test:unit` 재실행 → 필요 시 추가 로더 가드/skip 적용.
4) 결과/수정 사항을 본 파일에 계속 기록.

## 원칙/가드
- Cline 소스 수정 시 최소 침습: 주 로직을 건드리지 않고 테스트 전용 가드/스텁에 한정, `// CARET MODIFICATION`로 명시.
- 기능 회귀 시 즉시 보고, 테스트 실패가 로더/환경 탓인지 실 기능 버그인지 우선 분류한다.

## 진행 상황 메모 (2025-12-05)
- PostHog/Telemetry 관련 ESM 로더 충돌 대비: `src/services/error/providers/PostHogErrorProvider.ts`에 테스트 모드 스텁 추가, `src/test/requires.ts`를 단일 훅으로 재작성하여 posthog/open-telemetry/workspace PATH 스텁 포함.
- `src/utils/shell.ts`에 테스트 모드 전용 가드 추가(`/bin/sh` 반환 등 최소 스텁)로 ts-node ESM 충돌 우회.
- 다음 액션: guard 적용 후 `npm run test:unit` 재실행 → hooks/telemetry 테스트 실제 수행 여부 확인, 남은 실패 시 기능/로더 원인 분류.

## 변경 기록
- [ ] PostHog 테스트 스텁 적용 후 `test:unit` 통과 확인.
- [ ] 필요 시 `.mocharc.json`/ts-node 옵션 조정 여부 검토.
- [ ] 최종적으로 `npm run test` 성공 시점 기록.

## 추가 진행 (2025-12-05 오후)
- Node child_process 파이프에서 stdout이 사라지는 환경 이슈 확인 → 테스트 시 `HookProcess` 출력이 비어 JSON 파싱 실패.
- 해결: `src/core/hooks/hook-factory.ts`에 테스트 전용 파일 기반 캡처 fallback 추가(`CAREТ_TEST_HOOK_FALLBACK` 플래그, `execFile`로 stdin/out/err를 임시 파일로 redirect 후 읽기). 테스트 시작 시 `src/test/requires.ts`에서 플래그 설정.
- 추가 스텁: `require-shim`에 workspace path, posthog/otel/shell 라우팅; 글로벌 hook recorder override를 위한 `__CARETHOOK_RECORDER__` 글로벌 슬롯 도입(test-hooks 전용).
- `test-hooks` 녹화기 호출 불일치 → 중복 모듈 인스턴스 대비하여 recorder를 1회 캐싱하고 글로벌 오버라이드 사용. 테스트는 singleton을 강제 주입.
- 현재 `npm run test:unit` 전체 통과(527 passing, 4 pending). 나머지 빌드/테스트는 동일 환경에서 재확인 필요.

## 진행 상황 메모 (2025-12-08)
- `.caretignore` 기본화: ignore 컨트롤러/툴 밸리데이터/핸들러/CLI/UI 문구를 .caretignore로 교체하고 `.clineignore` 호환 경로를 유지.
- 프론트 공지/문서(announcement, prompting guide, branding UI) 및 CHANGELOG에 리브랜딩 반영.
- 테스트 계획: 리브랜딩 후 `npm run test:unit` 재확인 예정. 필요 시 .caretignore 신규/레거시 케이스 추가 점검.
- 테스트 추가: 
  - `ToolValidator`에 대한 단위 테스트로 .caretignore 우선 에러 메시지 검증 (`src/core/task/tools/__tests__/ToolValidator.test.ts`).
  - `ClineIgnoreController` 테스트에 .caretignore 우선/레거시 병존 케이스 추가.
- 통합 테스트 시도: `npm run test:integration` 실행 시 VS Code 런타임 샌드박스 오류(Sandbox host FATAL, SIGTRAP)로 중단. 로컬 캐시된 VS Code 1.106.3를 사용했으나 환경 제약으로 실패. 네트워크/샌드박스 허용 후 재시도 필요.
- 추가 진행: 브랜드 유틸을 사용해 ignore 파일명을 동적으로 결정(백엔드/CLI/UI 문자열 모두), 레거시 `.clineignore` 병행 지원, tsconfig에 `caret-src` 포함하여 테스트 시 경로 해석 보강. `npm run test:unit` 재통과(529 passing).

## 진행 상황 메모 (2025-12-09)
- 메인 `CHANGELOG.md`를 Caret 릴리스만 남기고 재작성, `CHANGELOG-CLINE.md`를 업스트림 전용으로 분리하며 다국어 네비게이션 링크 추가.
- 변경 파일 기준으로 `cline`/`caret` 하드코딩 스캔 후 신규 하드코딩 없음 확인(브랜드 util로 처리, PostHog/VSC 설정은 레거시 네임스페이스 fallback만 유지).
