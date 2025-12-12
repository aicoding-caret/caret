# 2025-12-11 Caret/LiteLLM 프로바이더 후속 작업 마스터

## 현재 현황
- 머징 완료, CLI 실행/표기 Cline→Caret 전환 적용 확인.
- 캐럿 모드 시스템 프롬프트 반영 완료(동작 확인).
- D-2.4 요구사항 정리 문서: `caret-docs/merging/v3.38.1/attempt-2-master.md` 324~346행 참조.

## 할 일
- [ ] **Caret 프로바이더 추가**: Cline 메뉴 유지 + Caret 인증 메뉴 병렬 노출, `caret.team`/`api.caret.team` URL 사용, 모델 리스트 로직은 기존 Caret 리스트 공용화(중복 코드 금지).
- [ ] **LiteLLM 프로바이더 추가**: BYO 경로에 LiteLLM 추가, Caret System gRPC로 모델 목록 조회 후 인터랙티브 메뉴 제공(웹뷰/CLI 모두 동작 확인).
- [ ] **메뉴 순서/문구 재정렬**: Configure BYO 위치는 Caret/Cline 선택 뒤 3순위, Select active provider 문구 단순화(“(Cline or BYO)” 제거) 및 LiteLLM 항목 추가 유지.
- [ ] **테스트/빌드**: `npm run protos-go` → `/tmp/go/bin/go test -short ./cli/...` 재실행, 필요 시 dist 의존 e2e는 제외. LiteLLM/Caret 추가 후 회귀 확인.
- [ ] **추가 확인**: CLI 배너/로그/브랜드 util 연계가 Caret 바이너리에서도 정상 동작하는지 점검.
