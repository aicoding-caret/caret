# Caret CLI 인증 플로우 (서버 연동 요구사항 + 목업 검증)

이 문서는 다른 개발자(특히 서버/플랫폼 팀)가 **Caret CLI 인증을 빠르게 맞출 수 있도록** 필요한 엔드투엔드 요구사항을 정리합니다.

## 1) 실제 동작 개요 (Cline 방식과 동일)

CLI(`caret auth -v`)가 인증을 시작하면 다음이 일어납니다.

1. CLI → core(gRPC): `CaretAccountLoginClicked`
   - core는 **로그인 URL 문자열**을 반환해야 합니다(브라우저 자동 오픈이 실패할 수 있으므로 URL 출력은 필수).
2. 사용자 브라우저에서 로그인 완료 → **로컬 콜백**으로 리다이렉트
   - 콜백 URL: `http://127.0.0.1:48801/auth`
   - 쿼리: `provider=caret&code=<auth_code>` (권장)
3. core는 콜백 수신 후, 서버로 `POST /v1/auth/token`을 호출해 토큰 교환
4. core → CLI(gRPC 스트림): `SubscribeToCaretAuthStatusUpdate`에서 `user` 포함 `CaretAuthState`를 전송
   - CLI의 성공 판정 1순위는 **스트림에서 user가 채워진 AuthState 수신**입니다.
5. (보조 검증) CLI는 3초 간격으로 인증 상태를 폴링하며 최대 5분까지 대기합니다.
   - 현재 CLI는 `GetCaretUserCredits` 호출로 확인합니다(서버에서 200을 주면 가장 깔끔).

## 2) caret.team(서버)에서 구현해야 할 항목

### A. 로그인 URL 발급 (gRPC)
- RPC: `CaretAccountLoginClicked`
- 반환: `response.Value`에 완전한 로그인 URL 문자열 포함

### B. 콜백 규약
- 콜백 endpoint(로컬): `http://127.0.0.1:48801/auth`
- 필수 쿼리:
  - `provider=caret`
  - `code=<auth_code>`

### C. 토큰 교환 API
- `POST /v1/auth/token`
- 요청 바디(권장):
  - `code`
  - `client_type: "extension"`
  - `redirect_uri: "http://127.0.0.1:48801/auth"`
  - `provider: "caret"`
- 응답(JSON) 필수 필드:
  - `accessToken`, `refreshToken`, `expiresAt`, `userInfo.id`

### D. Auth 상태 스트림(gRPC)
- 스트림: `SubscribeToCaretAuthStatusUpdate`
- 토큰 교환 성공 직후 `CaretAuthState{ user: CaretUserInfo }`를 즉시 전송
  - **이게 없으면 CLI는 폴링/타임아웃에 의존해서 UX가 급격히 나빠집니다.**

### E. 크레딧(선택이지만 권장)
- RPC: `GetCaretUserCredits`
- 인증 완료 후/로그인 상태 확인을 위해 CLI가 호출하므로 200 응답을 주는 것이 좋습니다.

## 3) 로컬 목업으로 CLI 흐름 검증하기

서버 구현 전에도 로컬 목업으로 플로우를 검증할 수 있습니다.

### A. 목업 서버
- 스크립트: `scripts/mock-caret-api.js`
- 제공 엔드포인트:
  - `GET /v1/auth/authorize` → 302로 `http://127.0.0.1:48801/auth?provider=caret&code=mock-code` 리다이렉트
  - `POST /v1/auth/token` → 토큰 JSON 반환
  - `GET /v1/profile/balance` → balance JSON 반환

### B. 원샷 실행(권장)
- `scripts/caret-cli-auth-mock.sh`
  - 기존 host/core 종료
  - `~/.caret/data`의 Caret/Cline 토큰/유저 캐시 스크럽(백업 생성)
  - 목업 API 기동 후 `CARET_ENVIRONMENT_OVERRIDE=local`로 `caret auth -v` 실행
  - 필요 시 `CARET_PURGE_STATE=1`로 `~/.caret/data/state`까지 제거

## 4) 빌드/실행 커맨드

- 빌드 후 auth 실행: `scripts/caret-build-auth.sh`
  - 기본: 실행 중 host/core/cli 종료 후 빌드 (보존하려면 `CARET_SKIP_KILL=1`)
- 빌드 생략 auth 재실행: `scripts/caret-run-auth.sh`
- Go(CLI) 단위 테스트: `GOCACHE=$PWD/.cache/go-build go test -short ./cli/...`

## 5) 실서비스 전환 체크리스트

- `CARET_ENVIRONMENT_OVERRIDE`/`CARET_ENVIRONMENT` 오버라이드를 제거하고 prod 도메인으로 실행
- 로그인 URL/리다이렉트/콜백이 다음을 만족하는지 확인:
  - 로그인 완료 후 `http://127.0.0.1:48801/auth?provider=caret&code=...`로 도달
  - `/v1/auth/token`이 필수 토큰 필드 반환
  - 스트림 `SubscribeToCaretAuthStatusUpdate`가 user 포함 AuthState를 푸시

## 6) 주의(캐시 공유)

VSCode 확장(host/core)과 CLI는 같은 저장소(`~/.caret/data`)를 공유할 수 있어, 확장이 실행 중이면 로그인/로그아웃 상태가 다시 써질 수 있습니다.
목업/회귀 테스트 시에는 확장/host/core를 종료하고 위 스크럽 스크립트를 사용하는 것을 권장합니다.

