# Codex Handoff Task

## Source Issue

이슈 #225 (F2) — 알림 규칙 관리 UI(목록·생성·수정 drawer·조건 자연어 번역). 에픽 #133.
`gh issue view 225`, `gh issue view 133`으로 맥락을 읽는다. 설계 근거는 BE repo의
`docs/designs/alert-rule-event-unified.md`(§3 템플릿 카탈로그·§4 조건 스키마·§8 API)와
ADR-013 §5~§8이다. BE 규칙 계약은 dev에 머지 완료(alert-rules·templates).

## Task Summary

알림 규칙을 사용자가 직접 관리하는 화면을 세운다. 규칙 목록 테이블과, 템플릿에서 출발해
대상·조건·채널·중복 방지를 미세조정하는 생성/수정 drawer, 그리고 조건 JSON을 사용자에게
노출하지 않기 위한 **조건 자연어 번역 유틸**이 핵심이다. F1이 깔아둔 `alertKeys`·adapter
패턴 위에 규칙 CRUD 쿼리/뮤테이션을 얹는다.

구 알림 인박스(`AlertsPage`·`useAlerts`·`useAlertCandidates`)와 요약 카드(F1)는 건드리지
않는다. 최근 내역·상세·채널 설정·페이지 통합 레이아웃은 F3(#226) 범위다.

## Goal

- 규칙 목록: 이름·대상·조건(자연어)·채널·중요도·상태·마지막 발생·동작(수정/복제/일시정지·재개/삭제).
- 규칙 빌더 drawer: 템플릿 선택 → 대상 → 조건 미세조정 → 채널 → 빈도/중복 방지. **조건 JSON 비노출.**
- 조건 자연어 번역 유틸: `condition`(metric·operator·value) → 한국어 문구.
- 규칙 생성/수정/삭제/일시정지·재개 후 `alertKeys.rules`·`alertKeys.overview` invalidate.

## Background — BE 계약(정본)

모든 응답은 `{ data, meta }` 엔벨로프. 경로 접두사는 `/api/v1`(client가 처리).

### 엔드포인트

```
GET    /alert-rules/templates                 -> ApiResponse<AlertRuleTemplateProjection[]>
GET    /alert-rules?status=&target_type=&page=&size=&sort=
                                              -> ApiResponse<AlertRuleProjection[]> (paginated)
POST   /alert-rules                           -> ApiResponse<AlertRuleProjection> (201)
PATCH  /alert-rules/{id}                      -> ApiResponse<AlertRuleProjection>
POST   /alert-rules/{id}/pause                -> ApiResponse<AlertRuleProjection>
POST   /alert-rules/{id}/resume               -> ApiResponse<AlertRuleProjection>
DELETE /alert-rules/{id}                       -> 204 No Content
```

목록 정렬 `sort`는 `-created_at`(기본)·`created_at`·`name`·`-name`만 허용. 필터 `status`는
`ACTIVE`|`PAUSED`, `target_type`은 아래 enum.

### AlertRuleProjection (목록·단건 응답, snake_case)

```
id: number
user_id: number
name: string
source: "SYSTEM" | "USER"
template_type: string | null
target_type: "SYMBOL"|"WATCHLIST"|"PORTFOLIO"|"TOPIC"|"MARKET"
target_id: string | null
condition: object              // 아래 조건 스키마
severity: "LOW"|"MEDIUM"|"HIGH"|"CRITICAL"
channels: string[]             // "APP"|"EMAIL"|"DISCORD"|"SLACK"
enabled: boolean
status: "ACTIVE" | "PAUSED"
cooldown_seconds: number
delivery_policy: "ONCE_PER_TRANSITION" | "ONCE_PER_DAY"
last_triggered_at: string | null   // ISO datetime(UTC)
created_at: string                 // ISO datetime(UTC)
updated_at: string                 // ISO datetime(UTC)
```

### AlertRuleTemplateProjection (템플릿 카탈로그)

```
template_type: string
label: string                  // 한국어 라벨(그대로 표시)
target_type: string
condition: object              // 기본 조건(빌더 초기값)
severity: string
channels: string[]
cooldown_seconds: number
delivery_policy: string
is_active: boolean             // false면 선택 불가(회색 처리·생성 시 BE가 422)
```

템플릿 6종(라벨은 카탈로그가 내려주므로 하드코딩 금지, 아래는 참고):
`HOLDING_NEWS_RISK`(보유 종목 위험 증가)·`WATCHLIST_AI_JUDGMENT`(관심 종목 AI 판단 변경)·
`EARNINGS_D3`(실적 발표 3일 전)·`POSITION_WEIGHT_OVER`(단일 종목 비중 초과)·
`NEWS_RISK_HIGH`(뉴스 위험도 High 이상)·`TOPIC_IMPACT_SURGE`(토픽 영향도 급등, `is_active=false`).

### 생성/수정 요청 바디

```
POST /alert-rules  (AlertRuleCreate)
  template_type: string            // 필수. is_active=false 템플릿이면 BE가 422
  target_id?: string | null
  name?: string | null
  condition?: object | null        // 미지정 시 템플릿 기본값 사용
  severity?: string | null
  channels?: string[] | null       // 지정 시 최소 1개
  enabled?: boolean = true
  cooldown_seconds?: number | null // >= 0
  delivery_policy?: string | null

PATCH /alert-rules/{id}  (AlertRuleUpdate)
  // 아래 필드 중 보낸 것만 부분 갱신. target_id를 제외한 필드에 null 보내면 422.
  name?, target_type?, target_id?, condition?, severity?, channels?(최소1),
  enabled?, cooldown_seconds?(>=0), delivery_policy?
```

### 조건 스키마 (§4) — 자연어 번역의 입력

단일 조건: `{ "metric": M, "operator": OP, "value": V }`. 복합(AND): `{ "all": [ 단일조건, ... ] }`
(중첩 `all` 금지). MVP 빌더는 **단일 조건 편집**을 우선 지원하고, 복합 조건은 표시(번역)만
지원하면 된다.

metric·operator·value 유효 조합(BE 검증 규칙과 일치시킬 것):

| metric | operator | value | 자연어 예시 |
|---|---|---|---|
| `NEWS_RISK` | `GTE` | `"LOW"`\|`"MEDIUM"`\|`"HIGH"`(NewsRisk) | 뉴스 위험도가 High 이상일 때 |
| `PRICE_CHANGE_1D` | `GTE`\|`LTE`\|`EQ` | number(%) | 1일 등락률이 5% 이상일 때 |
| `SIGNAL_CHANGED` | `CHANGED` | `null` | 시그널이 변경되면 |
| `AI_JUDGMENT_CHANGED` | `CHANGED` | `null` | AI 판단이 변경되면 |
| `THEME_HEAT` | `GTE`\|`LTE`\|`EQ` | ThemeHeat enum 값 | 테마 열기가 … 이상일 때 |
| `POSITION_WEIGHT` | `GTE`\|`LTE`\|`EQ` | 0~1 실수(비중) | 단일 종목 비중이 15% 이상일 때 |
| `EARNINGS_DATE` | `GTE`\|`LTE`\|`EQ` | 0 이상 정수(일) | 실적 발표 3일 이내일 때 |
| `TOPIC_IMPACT_SCORE` | — | — | (비활성, 생성 불가) |

규칙: `SIGNAL_CHANGED`·`AI_JUDGMENT_CHANGED`는 `operator=CHANGED`·`value=null` 고정.
`TOPIC_IMPACT_SCORE`는 생성 불가(422). `POSITION_WEIGHT`는 0~1 실수이나 UI에는 % 로
보여주는 게 자연스럽다(0.15 → 15%). NewsRisk/ThemeHeat의 정확한 enum 값은 FE `shared/model`
또는 기존 라벨 맵(`riskLevelLabels` 등)을 확인해 재사용한다.

## FE 관례 (반드시 따를 것)

- F1이 만든 `src/features/alerts/queries.ts`의 `alertKeys` 팩토리를 그대로 확장한다
  (`alertKeys.rules(filters)` 사용). DTO(snake) → `adapt*` → 도메인(camel) 패턴
  (`dto.ts`·`adapters.ts`).
- `apiGet`/`apiPost`는 있으나 **`apiPatch`는 client에 없다.** update가 PATCH이므로
  `src/shared/api/client.ts`에 `apiPut`과 동일 형태로 `apiPatch`를 추가한다(작은 확장, F3도
  재사용). 임의로 PUT으로 우회하지 말 것 — BE는 PATCH만 받는다.
- **DELETE는 204 No Content**다. `apiDelete`는 watchlist에서 이미 쓰이지만, 규칙 삭제 204
  빈 본문에서 뮤테이션이 성공 처리되는지 실제로 확인하고, 파싱 오류가 나면 처리한다.
- UI 프리미티브는 `@/shared/ui` 재사용: 목록은 `Table`(정렬·페이지네이션 지원), 상태·중요도는
  `Badge`, 버튼은 `Button`, 폼은 `Input`. 로딩 `Skeleton`, 에러 `ErrorState`, 빈 상태
  `EmptyState`. **shared/ui에 Drawer 프리미티브가 없다** — 빌더 drawer는 alerts 위젯 내부에
  자체 오버레이+패널로 간결하게 구현한다(새 공용 프리미티브 신설은 과설계, 범위 밖).
- 중요도 색상은 배지에만 제한(낮음 파랑/회색·중간 주황·높음/critical 빨강). F1과 일관.

## Implementation Scope

- `src/features/alerts/dto.ts` — `AlertRuleDto`·`AlertRuleTemplateDto`·조건 타입 추가.
- `src/features/alerts/adapters.ts` — `adaptAlertRule`·`adaptAlertRuleTemplate` + camelCase 도메인 타입.
- `src/features/alerts/conditionText.ts`(신규) — 조건 자연어 번역 유틸(단일 + `all` 복합).
- `src/features/alerts/queries.ts` — `useAlertRules(filters)`·`useAlertRuleTemplates`
  쿼리 + `useCreateAlertRule`·`useUpdateAlertRule`·`useDeleteAlertRule`·
  `usePauseAlertRule`·`useResumeAlertRule` 뮤테이션(성공 시 `rules`·`overview` invalidate).
- `src/shared/api/client.ts` — `apiPatch` 추가.
- `src/widgets/alert-rule-table/`(또는 파일) — 목록 테이블 위젯.
- `src/widgets/alert-rule-builder/`(또는 파일) — 생성/수정 drawer 위젯.
- 관련 단위 테스트.

## Out of Scope

- 최근 내역·알림 상세(근거)·채널 설정 UI (F3 #226).
- `/alerts` 페이지 통합 레이아웃·구 인박스 정리 (F3).
- 시그널 카드 → Rule Builder deep-link (#134, F2 머지 후 별도).
- 복합(`all`) 조건 **편집** UI. MVP는 단일 조건 편집 + 복합 조건 표시(번역)만.

## Protected Files

없음. 단, F1이 만든 `queries.ts`의 기존 export(`alertKeys`·`useAlertOverview`·구 훅)와
`AlertSummaryCards`·`Sidebar`는 계약을 깨지 않는다(확장만).

## Requirements

1. 목록이 규칙을 페이지네이션·정렬(`-created_at` 기본)·상태/대상 필터로 표시하고, 각 행에
   조건을 자연어로 보여준다. 동작 버튼이 해당 뮤테이션을 호출한다.
2. 빌더가 템플릿 카탈로그(활성만 선택 가능)에서 출발해 대상·조건·채널·cooldown·delivery_policy를
   조정하고, 생성/수정을 수행한다. **조건 JSON은 화면에 노출하지 않는다.**
3. 조건 자연어 번역이 위 표의 모든 metric·operator 조합과 복합(`all`)을 커버한다.
4. 뮤테이션 성공 시 `alertKeys.rules`·`alertKeys.overview`가 invalidate되어 목록·요약 카드가 갱신된다.
5. 복제 동작은 기존 규칙 값을 프리필한 생성으로 처리한다(별도 BE 엔드포인트 없음).
6. 구 인박스·요약 카드·사이드바가 무변경으로 계속 동작한다.

## Test Requirements

- `conditionText` 단위 테스트(각 metric·operator·value + 복합 `all` + `CHANGED`/`null`).
- `adaptAlertRule`·`adaptAlertRuleTemplate` 단위 테스트.
- 뮤테이션 훅 테스트(성공 시 invalidate 호출) — 기존 훅 테스트 방식 재사용.
- 테이블·빌더 위젯 렌더 테스트(로딩/데이터/에러, 활성/비활성 템플릿, 조건 자연어 표시).
- 기존 테스트 회귀 없음.

## Verification Commands

- `pnpm format:check`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`

## Documentation Impact

- 없음(구현 이슈). 계약과 어긋나면 멈추고 가정을 보고한다.

## Risk Level

Medium — 새 CRUD·drawer·조건 번역이 한 번에 들어가고, F3가 재사용할 `apiPatch`·조건 번역·
규칙 뮤테이션의 일관성이 중요하다. BE 조건 검증 규칙과 FE 입력 제약을 어긋나지 않게 맞춘다.

## Expected Output

- 규칙 DTO/adapter/조건번역 유틸, 규칙 CRUD 쿼리·뮤테이션, `apiPatch`, 목록 테이블·빌더 drawer 위젯, 테스트.
- 지정된 현재 브랜치(아래)에 커밋. 자체 브랜치 생성 금지.
- 검증 4종 통과 보고.

## Rules

- Stay within scope. 구 인박스·내역/상세/채널 UI·페이지 통합은 건드리지 않는다.
- Do not weaken verification.
- 지정된 현재 브랜치를 유지한다. 새 브랜치 금지.
- 조건 JSON을 사용자에게 노출하지 않는다.
- BE 조건 검증 규칙과 어긋나는 입력을 만들지 않는다(예: TOPIC_IMPACT_SCORE 생성, CHANGED에 value).
- Report assumptions and verification results.
