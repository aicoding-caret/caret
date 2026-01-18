# 테스팅 작업 - 포괄적 테스팅 구현

통합 우선 TDD 방법론을 따르는 포괄적 테스팅을 구현합니다.

## 사용되는 원자 컴포넌트
- `/tdd-cycle` - 통합 테스트 우선 RED→GREEN→REFACTOR
- `/verification-steps` - Test→Compile→Execute 검증 시퀀스
- `/naming-conventions` - 일관된 테스트 파일 명명 및 구조

## 테스팅 전 단계

### 단계 1: 테스트 전략 계획
**테스팅 범위 및 접근법 정의:**
- [ ] 테스트할 주요 사용자 시나리오는?
- [ ] 통합 테스팅이 필요한 시스템 컴포넌트는?
- [ ] 어떤 엣지 케이스와 에러 조건이 있는가?
- [ ] 성능 또는 신뢰성 요구사항이 있는가?
- [ ] 모킹이 필요한 외부 의존성은?

### 단계 2: 테스트 환경 설정
```bash
# 테스트 인프라 확인
npm run test:webview     # 프론트엔드 테스팅
npm run test:unit        # 백엔드 유닛 테스트 (Mocha)
npm run test:integration # VSCode 통합 테스트
npm run test:coverage    # 통합 커버리지 (vscode-test)
```

## TDD 구현 사이클

### 단계 3: RED - 통합 테스트 먼저
**실제 사용자 시나리오에 대한 실패하는 통합 테스트 작성:**

```typescript
// 예: 완전한 기능 통합 테스트
describe('페르소나 시스템 통합', () => {
  it('사용자가 페르소나를 선택하고, 선택이 유지되며, AI 응답에 영향을 미쳐야 함', async () => {
    // 실제와 유사한 환경 설정
    const mockContext = createMockExtensionContext();
    const mockAIService = createMockAIService();
    const mockWebview = createMockWebviewProvider();

    // 완전한 시스템 초기화
    const personaSystem = new PersonaSystem(mockContext, mockAIService);
    const ui = render(<PersonaSelector personaSystem={personaSystem} />);

    // 사용자 상호작용: 크리에이티브 페르소나 선택
    const creativePersona = ui.getByText('Creative Assistant');
    fireEvent.click(creativePersona);

    // 비동기 작업 대기
    await waitFor(() => {
      // 스토리지 지속성 확인
      expect(mockContext.workspaceState.update).toHaveBeenCalledWith(
        'selectedPersona', 'creative'
      );

      // AI 시스템 업데이트 확인
      expect(mockAIService.updateSystemPrompt).toHaveBeenCalledWith(
        expect.stringContaining('creative and imaginative')
      );

      // UI 피드백 확인
      expect(ui.getByText('Creative Assistant Selected')).toBeInTheDocument();
    });
  });
});
```

### 단계 4: GREEN - 최소 구현
**통합 테스트 통과를 위한 최소한의 코드만 작성:**

```typescript
// PersonaSystem - 최소 구현
export class PersonaSystem {
  constructor(
    private context: vscode.ExtensionContext,
    private aiService: AIService
  ) {}

  async selectPersona(personaId: string): Promise<void> {
    // 선택 유지
    await this.context.workspaceState.update('selectedPersona', personaId);

    // AI 시스템 업데이트
    const persona = this.getPersona(personaId);
    await this.aiService.updateSystemPrompt(persona.systemPrompt);
  }
}
```

### 단계 5: REFACTOR - 품질 개선
- 코드 중복 제거
- 네이밍 개선
- 타입 안전성 강화
- 테스트 코드 정리

## 테스트 유형별 가이드

### 유닛 테스트
- 단일 함수/클래스 테스트
- 외부 의존성 모킹
- 빠른 실행 속도

### 통합 테스트
- 여러 컴포넌트 상호작용 테스트
- 실제 시나리오 기반
- 시스템 동작 검증

### E2E 테스트
- 전체 사용자 플로우
- VS Code 확장 실제 동작
- 수동 테스트 보완

## 검증 체크리스트
- [ ] 모든 테스트 통과
- [ ] 타입 체크 통과
- [ ] 린트 통과
- [ ] 커버리지 기준 충족
- [ ] Cline 기능 손상 없음

## 미러링 정책
`.agents/`와 `.users/`는 1:1 미러링 구조입니다.
- 이 파일 수정 시 `.agents/workflows/testing-work.md`도 동일하게 업데이트
