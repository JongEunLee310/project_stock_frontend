# Frontend Conventions

프론트엔드 작업(Codex 구현 포함)에서 지켜야 할 컨벤션. FSD 레이어 정의는 `docs/designs/2-frontend-architecture.md` 참조.

## 공통 컴포넌트 우선 (Reusable-First)

UI 요소를 만들 때 페이지·feature 안에 일회성으로 인라인하지 말고, 재사용 가능한 공통 컴포넌트로 분리한다.

### 규칙

- **기존 것부터 확인**: 새 컴포넌트를 만들기 전에 `src/shared/ui/`(및 `entities/`)에 유사 컴포넌트가 있는지 먼저 확인한다. 있으면 재사용하거나 props로 확장하고, 복제하지 않는다.
- **재사용 신호면 분리**: 같은 UI가 2곳 이상에서 쓰이거나, 재사용 가능한 프리미티브(Table, Badge, Button, Card, Input, Status 표시 등)면 `src/shared/ui/`에 만든다. 도메인 엔티티 표현이면 `entities/<entity>`에 둔다.
- **배치 기준**: 도메인 비의존 공통 UI → `shared/ui`. 특정 엔티티 표현 → `entities`. 사용자 행동 단위 → `features`. 페이지는 하위 레이어 **조합만** 하고, 한 페이지에서만 쓰는 순수 레이아웃 조립 정도만 페이지 내부에 둔다.
- **확장 용이 구조**: 상태/variant는 union 키 기반 매핑(`Record<Union, ...>`)으로 작성해 값 추가가 타입으로 강제되게 한다(예: Badge 상태 색상 매핑).
- **테스트·export**: 공통 컴포넌트는 `shared/ui/index.ts` 등 배럴에서 export하고, 단위 테스트를 동반한다.

### 핸드오프 시

- 페이지/기능 task에서 새 UI 요소가 필요하면, 공통 컴포넌트로 분리할지 먼저 판단한다. 분리가 맞으면 해당 공통 컴포넌트를 별도 이슈/task로 선행하거나, task의 Implementation Scope에 공통 컴포넌트 생성을 명시한다.
- 기존 공통 컴포넌트로 충분하면 그것을 재사용하도록 Background/Requirements에 명시한다.

## 사용자 알림·피드백 (No Native Dialogs)

알림·경고·확인을 브라우저 기본 다이얼로그로 띄우지 않는다.

### 규칙

- **금지**: `alert()`, `confirm()`, `prompt()` 등 브라우저 네이티브 다이얼로그.
- **대체**: 상황에 맞는 인앱 UI를 쓴다.
  - 일시적 성공·실패·정보 알림 → **Toast**(자동 소멸, 비차단).
  - 인라인 검증·폼 오류 → 필드/폼 근처 인라인 메시지.
  - 위험한 동작 확인(삭제 등) → 인앱 **Modal/Dialog** 컴포넌트.
  - 영역 단위 상태(로딩/빈/에러) → 해당 상태 컴포넌트(이슈 18).
- **공통화**: Toast·Dialog 등 피드백 UI는 [공통 컴포넌트 우선] 원칙대로 `src/shared/ui/`에 재사용 가능하게 만들고, 앱 전역에서 호출 가능한 단순한 트리거(예: 프로바이더/훅)를 둔다. 과도한 추상화는 피하고 현재 요구 범위만 구현한다.
- 접근성: 알림은 적절한 ARIA live region(`role="status"`/`role="alert"`)으로 스크린리더에 전달되게 한다.

## Related

- `docs/designs/2-frontend-architecture.md` (FSD 레이어·의존 규칙)
- `docs/designs/12-table-component.md`, `docs/designs/13-status-badge.md` (공통 컴포넌트 예시)
- 이슈 18 (Loading/Empty/Error 상태 컴포넌트)
