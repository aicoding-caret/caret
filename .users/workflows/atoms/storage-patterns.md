# 스토리지 패턴 - 일관된 상태 관리

VSCode 익스텐션 상태 관리를 위한 일관된 스토리지 패턴입니다.

## 핵심 원칙
**데이터 라이프사이클과 공유 요구사항에 적합한 스토리지 범위 사용**

## 스토리지 타입

### WorkspaceState (프로젝트별)
**용도**: 프로젝트/워크스페이스별로 다른 설정
```typescript
// chatSettings - 대화 기록, 프로젝트별 AI 컨텍스트
context.workspaceState.update('chatSettings', settings);
const chatSettings = context.workspaceState.get('chatSettings');
```

**특성**:
- VSCode 워크스페이스별로 격리
- VSCode 세션 간 지속
- 워크스페이스 삭제 시 손실
- 워크스페이스 멤버 간 공유 (팀 설정에서)

### GlobalState (사용자 전역)
**용도**: 모든 프로젝트에 적용되는 사용자 설정
```typescript
// globalSettings - 사용자 환경설정, API 키, 일반 설정
context.globalState.update('globalSettings', preferences);
const globalSettings = context.globalState.get('globalSettings');
```

**특성**:
- 모든 워크스페이스에서 사용 가능
- 사용자별 설정
- VSCode 재설치 시에도 지속
- 개인 사용자 전용

## 일관성 규칙

### 설정 분류:
- **채팅/대화 데이터** → `workspaceState`
- **사용자 환경설정** → `globalState`
- **API 자격증명** → `globalState`
- **프로젝트 설정** → `workspaceState`
- **UI 상태** (패널, 뷰) → 공유 필요에 따라 결정

### 명명 규칙:
```typescript
// 좋음: 명확한 범위 표시
'chatSettings'     // 워크스페이스별
'globalSettings'   // 사용자별
'projectConfig'    // 워크스페이스별

// 나쁨: 모호한 범위
'settings'         // 어떤 범위?
'config'           // 전역 또는 워크스페이스?
```

## 구현 패턴

### 표준 VS Code 스토리지
```typescript
export class StorageService {
  constructor(private context: vscode.ExtensionContext) {}

  // 워크스페이스 범위
  getChatSettings(): ChatSettings {
    return this.context.workspaceState.get('chatSettings', defaultChatSettings);
  }

  setChatSettings(settings: ChatSettings): void {
    this.context.workspaceState.update('chatSettings', settings);
  }

  // 전역 범위
  getGlobalPreferences(): GlobalPreferences {
    return this.context.globalState.get('globalSettings', defaultGlobalSettings);
  }

  setGlobalPreferences(prefs: GlobalPreferences): void {
    this.context.globalState.update('globalSettings', prefs);
  }
}
```

### Caret 전용: CaretGlobalManager 패턴
**용도**: gRPC 백엔드 통합과 세션 간 지속성이 필요한 Caret 상태

```typescript
// gRPC 백엔드 통합을 갖춘 CaretGlobalManager 싱글톤
export class CaretGlobalManager {
  private _inputHistory: string[] = []

  // gRPC를 통해 백엔드에서 로드
  public async getInputHistory(): Promise<string[]> {
    if (this._inputHistory.length === 0) {
      const response = await StateServiceClient.getSettings()
      this._inputHistory = response.inputHistory || []
    }
    return this._inputHistory
  }

  // gRPC를 통해 백엔드에 저장
  public async setInputHistory(history: string[]): Promise<void> {
    this._inputHistory = history // 로컬 캐시
    await StateServiceClient.updateSettings({
      inputHistory: history
    })
  }

  // 편의를 위한 정적 접근자
  public static async getInputHistory(): Promise<string[]> {
    return CaretGlobalManager.get().getInputHistory()
  }
}
```

**패턴 이점**:
- **하이브리드 스토리지**: 로컬 캐시 (빠른 접근) + gRPC 백엔드 (지속성)
- **세션 간 유지**: VS Code 재시작/워크스페이스 전환 시에도 유지
- **싱글톤 접근**: 컴포넌트 간 일관된 상태 관리
- **타입 안전성**: 생성된 gRPC 클라이언트를 통한 완전한 TypeScript 통합

## 관련 워크플로우
- `/modification-levels`로 새 기능 구현 시 적용
- `/tdd-cycle` 통합 테스트로 스토리지 동작 테스트
- `/verification-steps`로 데이터 지속성 검증

## 일반 가이드라인
일관된 스토리지 패턴은 데이터 손실을 방지하고 예측 가능한 사용자 경험을 제공합니다.

워크스페이스 vs 전역 구분은 데이터의 의도된 사용법에서 명확해야 합니다.

누락된 스토리지 값에 대해 항상 합리적인 기본값을 제공하세요.

## 미러링 정책
- 이 파일 수정 시 `.agents/workflows/atoms/storage-patterns.md`도 동일하게 업데이트
