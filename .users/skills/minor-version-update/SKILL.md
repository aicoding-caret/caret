# 마이너 버전 업데이트 스킬

## 개요
Caret의 마이너 버전 업데이트(0.4.x) 시 수행해야 하는 작업들을 정의합니다.

## 사용 시점
- 마이너 버전 업데이트 배포 시 (예: 0.4.5 → 0.4.6)
- 사용자 공지사항 변경 없이 README/CHANGELOG/docs 업데이트가 필요할 때

## 체크리스트

### 1. README.md 업데이트
**버전 번호만 변경** (0.4.x → 0.4.y)

수정 위치:
- `[v0.4.x Update]` 배너 텍스트 → 새 버전 & 주요 변경사항
- `## 🎉 v0.4.x` 섹션 → 새 버전 업데이트 내용

```bash
# 현재 버전 확인
grep -n "v0\.4\." README.md
```

### 2. CHANGELOG.md 업데이트
**이전 버전 유지, 새 버전 추가** (구분 필수!)

```markdown
## [0.4.y] 2026-MM-DD

### ✨ Improved
- **Feature 1**: 설명
- **Feature 2**: 설명

### Fixed
- **Bug 1**: 설명

---

## [0.4.x] 2026-MM-DD
(기존 내용 유지)
```

### 3. docs.caret.team 업데이트
**7개 언어 what-is-caret.mdx 파일 수정**

파일 목록:
```
docs.caret.team/docs-ko/getting-started/what-is-caret.mdx  (한국어)
docs.caret.team/docs-en/getting-started/what-is-caret.mdx  (영어)
docs.caret.team/docs-ja/getting-started/what-is-caret.mdx  (일본어)
docs.caret.team/docs-zh/getting-started/what-is-caret.mdx  (중국어)
docs.caret.team/docs-fr/getting-started/what-is-caret.mdx  (프랑스어)
docs.caret.team/docs-de/getting-started/what-is-caret.mdx  (독일어)
docs.caret.team/docs-ru/getting-started/what-is-caret.mdx  (러시아어)
```

수정 위치:
- `## 🎉 v0.4.x 업데이트` 섹션

번역 템플릿:
| 언어 | 버전 헤더 |
|------|----------|
| 한국어 | `## 🎉 v0.4.y 업데이트` |
| 영어 | `## 🎉 v0.4.y Update` |
| 일본어 | `## 🎉 v0.4.y アップデート` |
| 중국어 | `## 🎉 v0.4.y 更新` |
| 프랑스어 | `## 🎉 Mise à jour v0.4.y` |
| 독일어 | `## 🎉 v0.4.y Update` |
| 러시아어 | `## 🎉 Обновление v0.4.y` |

### 4. package.json 버전 확인
```bash
grep '"version"' package.json
```

> **참고**: package.json 버전은 보통 npm 배포 전 별도로 변경합니다.

### 5. 사용자 공지사항 (선택)
마이너 업데이트 시에는 **수정 안 해도 됨**.

메이저 업데이트나 중요 변경사항이 있을 때만 수정:
- `webview-ui/src/caret/locale/*/announcement.json`

## 마이너 업데이트 시 수정 불필요

- [ ] 사용자 공지사항 (announcement.json)
- [ ] package.json 버전 (배포 시 별도 변경)

## 명령어 요약

```bash
# 1. 변경사항 확인
grep -rn "v0\.4\." README.md CHANGELOG.md docs.caret.team/

# 2. 수정 후 커밋
git add README.md CHANGELOG.md docs.caret.team/
git commit -m "chore: bump version to 0.4.y"

# 3. 푸시
git push origin main
```

## 미러링 정책
`.agents/`와 `.users/`는 1:1 미러링 구조입니다.
- `.agents/`는 영어 (토큰 효율성)
- `.users/`는 사용자/팀 언어 (상세 설명)
- 참조: `assets/agents_template/AGENTS.md`의 Key Principles
