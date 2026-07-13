# 81 · Topbar·Sidebar 실데이터 연동

Status: Draft
Track: FE
Source: FE #88, #91
Risk: Low
Author: value-for-fable:itsvff (Sonnet) 위임

---

## 1. 배경

### #88 Sidebar 알림 배지

`src/widgets/Sidebar.tsx`의 메뉴 렌더 로직에서 `item.id === 'alerts'` 분기는 배지를
리터럴 `6`으로 고정 출력합니다. 이 값은 실제 미확인 알림 수와 무관하며, 사용자는
항상 6건이 표시된 배지를 보게 됩니다.

기존 훅 `useUnreadAlertSummary()`(`src/features/alerts/queries.ts`)가 이미
`GET /alerts?status=UNREAD`를 호출하여 미확인 수를 집계하고, 오류 시 빈값을 반환하는
방어 로직까지 갖추고 있습니다. 이 설계는 하드코딩 리터럴을 해당 훅으로 교체하는 방법을
정의합니다.

### #91 Topbar 실데이터·동작 연동

`src/widgets/Topbar.tsx`의 여러 슬롯이 하드코딩되거나 동작이 연결되지 않은 상태입니다.

- 프로필 이니셜이 `IC`로 고정되어 있습니다.
- 새로고침 버튼(↻)에 `onClick` 핸들러가 없어 클릭해도 아무 일도 일어나지 않습니다.
- 동기화 시각이 `동기화 14:32`로 고정되어 있습니다.
- 알림 버튼(♧)이 알림 페이지로 이동하지 않습니다.

두 이슈 모두 신규 BE 계약 없이 기존 FE 쿼리·인증 컨텍스트만으로 연동합니다.

---

## 2. 범위

### 포함

- `src/widgets/Sidebar.tsx`: 알림 배지 리터럴을 `useUnreadAlertSummary().unreadCount`로 교체.
- `src/widgets/Topbar.tsx`: 프로필 이니셜 실데이터 연동, 새로고침 클릭 핸들러·동기화 시각 연동, 알림 버튼 네비게이션 연결.
- 기존 테스트 파일 업데이트 및 신규 테스트 케이스 추가.

### 제외 (Out of Scope)

- BE 변경.
- Topbar 도움말 버튼(?): 별도 UX 정의 필요 — 현행 유지.
- Topbar 프로필 드롭다운(⌄): 별도 UX 정의 필요 — 현행 유지.
- Topbar 알림 버튼의 미확인 카운트 표시(사이드바 배지 #88과 중복 회피).
- 신규 전역 "last sync" 추상화 도입.
- 사이드바 배지 외 Sidebar 나머지 로직.

---

## 3. 설계

### 3.1 Sidebar 배지 (`src/widgets/Sidebar.tsx`)

`useUnreadAlertSummary()`를 컴포넌트 상단에서 호출하고, `item.id === 'alerts'` 분기의
하드코딩 `<span>...6</span>`을 `unreadCount` 기반 조건 렌더로 교체합니다.

**열화(Degradation) 규칙**

| 상태 | 처리 |
|---|---|
| `unreadCount > 0` | 배지 노출 — `unreadCount` 값 표시 |
| `unreadCount === 0` | 배지 비노출 — 현행 항상 노출과 달라짐(의도된 변경) |
| 로딩 중 | 배지 비노출(0으로 취급) — 카드·네비게이션 전체는 정상 렌더 유지 |
| 오류 | 배지 비노출(0으로 취급) — 카드·네비게이션 전체는 정상 렌더 유지 |

슬롯 단위 독립 열화 원칙을 적용합니다. 기존 #77·#78·#80에서 확립한 원칙과 일관됩니다.

**AlertsPage 탭 카운트와의 차이**

AlertsPage 탭 카운트는 전체 알림 수(`useAlerts().data.length`)를 사용하지만, Sidebar
배지는 알림 배지의 의미에 맞게 미확인 수(`unreadCount`)를 사용합니다. 이 차이는
의도된 것입니다.

### 3.2 Topbar 프로필 이니셜 (`src/widgets/Topbar.tsx`)

`useAuth()`(`src/shared/auth/AuthProvider.tsx`)가 제공하는 `user: MeUser | null`을
소비합니다. `MeUser`는 `{ id, email, [key: string]: unknown }` 형태로 `username`을
보장하지 않으므로, 이니셜은 `email`의 local-part 첫 글자(대문자 1글자)를 기준으로
도출합니다.

**이니셜 도출 규칙**

| 조건 | 처리 |
|---|---|
| `user !== null` | `user.email`의 `@` 앞 첫 글자를 `toUpperCase()` |
| `user === null` | 기존 폴백 표시 유지(기본 이니셜 또는 빈 상태) |

### 3.3 Topbar 새로고침·동기화 시각 (`src/widgets/Topbar.tsx`)

동기화 시각은 Topbar 로컬 상태 `lastSyncedAt: Date`로 관리합니다. 마운트 시 현재 시각으로
초기화하고, 새로고침 클릭 시 현재 시각으로 갱신합니다. 신규 전역 추상화는 도입하지
않습니다.

**`lastSyncedAt` 동작 요약**

| 시점 | 값 |
|---|---|
| 마운트 | `new Date()` |
| 새로고침 버튼 클릭 | `new Date()` (갱신) |

새로고침 클릭 핸들러는 `useQueryClient().invalidateQueries()`(전체 무효화)를 호출하고,
이어서 `lastSyncedAt`을 현재 시각으로 갱신합니다.

표시 포맷은 KST 시:분(HH:mm)입니다. `src/shared/lib/format`에 시:분 포맷 유틸이 있으면
재사용하고, 없으면 `toLocaleTimeString` 등 로컬 처리를 최소 구현합니다. 포맷 세부는
구현 시 판단합니다.

### 3.4 Topbar 알림 버튼 네비게이션 (`src/widgets/Topbar.tsx`)

알림 버튼(♧)에 `react-router-dom`의 네비게이션을 연결합니다.

| 항목 | 내용 |
|---|---|
| 이동 경로 | `appRoutePaths.alerts` (`= '/alerts'`, `src/shared/config/navigation.ts`) |
| 구현 방식 | `useNavigate` 훅 또는 `Link` 컴포넌트 — 기존 Topbar 코드 스타일에 맞춰 구현 시 결정 |
| 카운트 표시 | 없음 — 사이드바 배지(#88)와 중복 회피 |

---

## 4. 의존성 및 후속

### 의존성

- `useUnreadAlertSummary()` — `src/features/alerts/queries.ts`에 이미 존재. 변경 없음.
- `useAuth()` — `src/shared/auth/AuthProvider.tsx`에 이미 존재. 변경 없음.
- `appRoutePaths.alerts` — `src/shared/config/navigation.ts`에 이미 존재. 변경 없음.
- `useQueryClient()` — React Query 기존 설정 그대로 사용.

### 비범위 / 후속

- 도움말 버튼·프로필 드롭다운은 UX 정의 후 별도 이슈에서 구현합니다.
- 알림 버튼의 카운트 표시가 필요해지면(향후 UX 재정의 시) 사이드바 배지와 소스를
  공유하거나 분리할지 해당 시점에 결정합니다.

---

## 5. 테스트

실제 코드는 작성하지 않으며, 검증 항목만 정의합니다.

### `src/widgets/Sidebar.test.tsx`

- `unreadCount > 0`이면 해당 값으로 배지가 렌더됨.
- `unreadCount === 0`이면 배지가 렌더되지 않음.
- 로딩 상태(`isLoading: true`)에서 배지가 렌더되지 않음.
- 오류 상태에서 배지가 렌더되지 않음 — 카드·네비게이션 전체는 정상 렌더.

### `src/widgets/Topbar.test.tsx`

- `user.email`이 있을 때 이니셜이 email local-part 첫 글자(대문자)로 렌더됨.
- `user === null`일 때 기존 폴백이 렌더됨.
- 새로고침 버튼 클릭 시 `invalidateQueries`가 호출됨.
- 새로고침 버튼 클릭 시 동기화 시각이 갱신됨.
- 알림 버튼 클릭 시 `/alerts`로 네비게이션이 발생함.
