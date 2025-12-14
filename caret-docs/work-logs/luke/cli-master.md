# CLI 작업 마스터 (Luke)

## 개요
- v3.38.1 병합 이후 CLI 재브랜딩·기능 보강을 추적하기 위한 개인 마스터.
- 범위: caret CLI 실행/패키징, LiteLLM BYO, Caret 인증·프로바이더, 테스트·문서 갱신.
- 참고 문서: `caret-docs/merging/v3.38.1/attempt-2-master.md` D-2.4~D-2.5, `caret-docs/merging/v3.38.1/attempt-2-review-cli.md`.

## 작업 원칙 (최소 침습)
- 기본: Cline 코어는 최대한 그대로 유지, Caret 확장은 `caret-src/`(L1) 우선 배치.
- Cline 파일 변경 시 1~3줄 범위 최소 수정, `// CARET MODIFICATION: ...` 주석 필수(L2).
- Go 브랜딩/경로는 `cli/pkg/common/branding.go` 헬퍼로 계산하고 문자열 하드코딩 금지.
- proto/gRPC 생성물은 스크립트만 사용(`npm run protos-go`), 수동 편집 금지.
- 테스트 우선: 기능 추가 전/후 `npm run protos-go`, `/tmp/go/bin/go test -short ./cli/...`로 회귀 확인.

## 진행 현황
- [x] cline CLI → caret CLI 네이밍/배너 정렬 후 실행 확인(머지 후 로컬 run OK).
- [x] Auth 인스턴스 경로 정리: auth 메뉴/리스너/로그인/조직 선택이 컨텍스트 주소(`CARET_AUTH_ADDRESS` 혹은 임시 인스턴스) 기준으로 gRPC를 생성하도록 변경, default registry 의존 제거. 기본 포트(50052)만 설정된 경우는 override에서 제외하고, 지정 주소가 죽어 있으면 헬스 체크 후 임시 인스턴스를 자동 기동.
- [x] Node 20 native 모듈 재빌드: `better-sqlite3`가 Node 23 ABI(131)로 빌드되어 코어 부팅 시점에 `ERR_DLOPEN_FAILED` 발생 → Node 20.19.5 PATH에서 `npm rebuild better-sqlite3 --build-from-source` 수행 후 코어 정상 기동.
- [x] 프롬프트 자원 보강: `dist-standalone/extension/caret-src/core/prompts/sections` 미존재로 `JsonTemplateLoader` 초기화 실패 → `caret-src/core/prompts/sections/*.json`을 dist-standalone 경로로 복사하여 코어 부팅 오류 제거. TS 소스에서 `JsonTemplateLoader`는 없을 때 워닝만 내고 통과하도록 완화.
- [x] 브랜드 감지 보강: `detectCurrentBrandName`가 상위 패스(`/home/luke/dev/package.json`)만 탐색해 ENOENT 경고 발생 → 후보 패스 배열(`__dirname` 기준 상위/현재, `process.cwd()`)을 순회하도록 수정, fallback을 Caret으로 유지.
- [x] LiteLLM 입력 UX/페치: LiteLLM BYO 입력 순서를 Host(Base URL) → API Key로 변경(`PromptForAPIKey`), gRPC `Unimplemented`나 클라이언트 없음 시 `/health`+`/v1/models` HTTP 교차 필터(정규화 포함)로 자동 폴백(`FetchLiteLlmModels`), 트림/필수 검증 유지.
- [x] LiteLLM BYO 옵션(Phase1 완성): CLI wizard/퀵셋업 모두 LiteLLM 모델 설정 시 컨텍스트 윈도우/최대 출력 토큰/온도/프롬프트 캐시/사고 예산 입력 지원. 기본값은 웹 LiteLLM 기본을 맞춰 `contextWindow=128000`, `maxTokens=-1(공급자 기본)`, `temperature=0`, `promptCache=false`, `thinkingBudget=0(비활성)`으로 세팅. 이미지 지원 옵션은 CLI 미지원이라 제외.
- [x] LiteLLM 모델 정보 저장: LiteLLM ModelInfo를 모델 변경/재선택/퀵셋업 시 모두 저장·전파하도록 보강(`buildLiteLlmModelInfo`, plan/act 양쪽에 반영). 기존 config에 저장된 ModelInfo가 있으면 프롬프트 기본값을 그 정보로 시드.
- [x] 테스트: `GOCACHE=$PWD/.cache/go-build go test -short ./cli/...` 통과(IPv4 바인딩 불가 환경에서는 LiteLLM HTTP 폴백 테스트가 자동 skip).
- [x] CLI caret 모드 강제: `cli/pkg/cli/task/manager.go`에서 인스턴스 연결 직후 `SetPromptSystemMode(mode=\"caret\")` 호출(VERBOSE 시 실패만 로깅)로 CLI를 항상 caret 프롬프트 시스템으로 구동.
- [x] 문서 재정리: F04에서 CLI 범위를 분리, 신규 `f12-caret-cli.md` 추가(캐럿 CLI caret 전용 모드, f05/f10 연계), f05/f10에 연계 섹션 추가.
- [ ] Caret 계정/프로바이더 메뉴: 인증 URL·모델 목록을 caret.team API로 노출하는 작업 보류.
- [x] proto·테스트: `npm run protos-go`, `GOCACHE=$PWD/.cache/go-build go test -short ./cli/...` 재실행 통과(Node 20 PATH 사용).
- [ ] 웹뷰/문서: CLI 배너·설정·CHANGELOG 갱신 미반영.

## Phase1 - LiteLLM BYO
- 변경: `FetchLiteLlmModels`에 Base URL/Key trim, 필수 입력 검증, gRPC 클라이언트 nil 방어, 기본 타임아웃(15s) 추가.
- 테스트: `models_list_fetch_test.go`에 Base URL trim/누락/클라이언트 없음 케이스 추가.
- 프로토 복구: `proto/caret/account.proto`의 Caret Account RPC/메시지(`CaretUserProfile`, `CaretUserOrganizationsResponse`, `GetCaretOrganizationCreditsRequest` 등) 재활성화.
- 생성 스크립트 보강: `scripts/build-go-proto.mjs`의 Go 탐지/툴 검증을 spawn 기반으로 완화(EPERM 환경에서도 PATH 감지 가능).
- 생성/빌드: `npm run protos`, `PATH=$HOME/go/bin:$PATH npm run protos-go`, `PATH=$HOME/go/bin:$PATH GOCACHE=.cache/go-build bash scripts/build-cli.sh` 실행 완료( dist-standalone/bin/caret* 만 남기고 cline 명칭 제거, 빌드 스크립트에 CARET 주석 추가).
- 설정 경로: 기본 config/logs 디렉터리를 `.caret`으로 강제(`global.go`, `history_handler.go`, `updater.go` 경로 변경, CARET 주석 추가).
- 인스턴스 레지스트리: 레지스트리 누락 시 건강 상태 기반으로 인스턴스를 수락하도록 완화(`cline-clients.go`, `registry.go` CARET 주석). default/클라이언트 조회 시 sqlite 부재도 허용.
- Auth 컨텍스트: auth 관련 gRPC 호출/리스너(`auth_*provider.go`, `auth_subscription.go`, `wizard_byo(_oca).go`)를 모두 컨텍스트 주소 기반 클라이언트(`getAuthClient`)로 통일하고, 기본 모델 설정도 컨텍스트 기반 매니저(`createTaskManager`)로 사용. `RunAuthFlow`는 기본 포트 override를 무시하고, 지정 주소가 죽어 있으면 헬스 체크 후 임시 인스턴스를 띄움.
- 테스트: `GOCACHE=$PWD/.cache/go-build go test -short ./cli/...` 통과(e2e 포함). Node 20 PATH 강제 후 실행.
- 실행 현황: `scripts/caret-run-auth.sh` 실행 시 기본 포트(50052)가 비어 있으면 헬스 체크 후 임시 인스턴스가 자동 기동(예: 45295/44893). registry 경고가 떠도 코어가 기동되며, Node 20 ABI 모듈 재빌드 후 auth wizard 진입 가능(인터랙티브 입력 필요).
- 주의: Node 버전 전환 후에는 `PATH=$HOME/.config/nvm/versions/node/v20.19.5/bin:$PATH npm rebuild better-sqlite3 --build-from-source`를 다시 실행해야 함. dist-standalone 코어가 프롬프트 섹션을 찾도록 `caret-src/core/prompts/sections`를 `dist-standalone/extension/caret-src/core/prompts/sections`로 복사(빌드 산출물; 소스 수정 없음).
- 빌드/실행 스크립트: `scripts/caret-build-auth.sh`(프로토+Go 빌드 후 `caret auth -v`), `scripts/caret-build-run.sh`(프로토+Go 빌드 후 인자 기반 실행, 기본 `version`) 추가. 두 스크립트 모두 Node 20(`~/.config/nvm/versions/node/v20.19.5/bin`) 우선 경로를 자동 추가.
- 레지스트리/헬스 fallback: `StartNewInstance`에서 registry가 비어도 health check 성공 시 인스턴스 정보를 구성해 실패를 막도록 추가 완화(12회 재시도 후 마지막 health check 통과 시 진행).
- 레지스트리 빈 상태 대응: `.cline` locks DB fallback(`locks.go`), DB 없으면 에러 대신 빈 상태로 취급. health OK 시에도 default 인스턴스에 주소를 기록(best-effort).
- 빌드 생략 실행 스크립트: `scripts/caret-run-auth.sh`(기존 빌드된 바이너리로 `auth -v`만 실행), `scripts/caret-run.sh`(기본 `version`, 인자 전달 가능) 추가. Node 20 우선 PATH 포함.
- 효과: LiteLLM 모델 목록 요청 실패 시 즉시 원인 메시지 반환, wizard의 수동 입력 fallback 흐름 명확화, Caret Account gRPC 시그니처/클라이언트 일치 확보.

## 다음 계획
1) LiteLLM BYO 완성: `cli/pkg/cli/auth/wizard_byo.go`, `models_list_fetch.go`에 Caret System gRPC 연동 추가 후 UI 문구·순서를 D-2.4 체크리스트에 맞추기(테스트 실행 포함).
2) Caret 인증/프로바이더: `auth_menu.go`, `auth_caret_provider.go`에서 caret.team 인증 흐름/모델 리스트 노출, Cline 병렬 메뉴 유지. 브랜드 헬퍼(`cli/pkg/common/branding.go`) 경로 감지 확인.
3) 프로토/테스트: `npm run protos-go`로 gRPC 생성물 갱신, `/tmp/go/bin/go test -short ./cli/...` 수행해 회귀 확인.
4) 수동 검증: caret/cline 모드별 `caret version`, `caret task new` 실행해 배너·감지·로그 경로 정상 확인.
5) 문서 갱신: `attempt-2-master.md` D-2 상태 업데이트, `attempt-2-review-cli.md` 대응 항목 해소 메모, 필요 시 D-2.5 서버 안내·CHANGELOG 반영.

## 개발/테스트 방법 (개발 환경 전용)
- Node 20 강제: `nvm use 20` 후 PATH 앞에 dist-standalone/bin 추가.
- 빠른 실행 (빌드 생략): `scripts/caret-run-auth.sh` (auth -v), `scripts/caret-run.sh version` (또는 인자 전달).
- 빌드 후 실행: `scripts/caret-build-auth.sh` (protos+go+build → auth -v), `scripts/caret-build-run.sh <args>`.
- 인스턴스 재사용 팁(레지스트리 의존 회피): `CARET_AUTH_ADDRESS` 또는 `--address`로 이미 떠 있는 코어를 지정할 수 있음. 기본 포트(50052)만 설정된 경우는 무시하며, 헬스 체크 실패 시 자동으로 임시 인스턴스를 새로 띄워 auth wizard를 연다.
- 개발 시 메모: Node ABI 불일치가 뜨면 `npm rebuild better-sqlite3 --build-from-source`를 Node 20 PATH에서 수행. 프롬프트 섹션 없을 때는 dist-standalone/extension 아래에 `caret-src/core/prompts/sections/*.json`을 복사(현재 로컬 완화 적용).
- 문제 재현 로그: 레지스트리 미등록/포트 권한 문제로 `instance not found in registry` 발생 시, `.cline/.caret` 두 곳 모두 locks.db 확인. 필요 시 legacy `.cline`을 fallback(locks.go)으로 사용. `scripts/caret-run-auth.sh` 실행 시 현재 포트 정보를 `.caret/logs`의 cline-core 로그에서 확인.
- 빌드 스크립트 안전장치: `scripts/build-cli.sh`, `scripts/caret-build-auth.sh`는 기본적으로 실행 중 인스턴스를 유지하고, 필요 시 `CARET_FORCE_KILL=1`로 host/core를 내려 복사 충돌을 방지 가능.
- pkill 옵션화: run/auth 실행 시 `CARET_SKIP_KILL=1`로 host/core 종료를 건너뛸 수 있음. auth는 기본이 “보존”이며, 강제 종료가 필요하면 `CARET_AUTH_KILL=1` 사용.
