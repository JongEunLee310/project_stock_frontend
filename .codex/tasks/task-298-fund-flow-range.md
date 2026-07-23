# Codex Handoff Task

## Source Issue

#298 — FE: 예상 자금 흐름이 삭제된 `estimated_range`를 읽는다 — `estimated_flow` 수치 구간 연동

## Task Summary

BE가 자금 흐름 전망의 표현을 문자열 라벨에서 수치 구간으로 바꿨는데 FE가 옛 필드를 읽고 있어
개요 화면의 `예상 자금 흐름` 패널이 모든 섹터를 `범위 미제공`으로 표시한다. DTO·어댑터를 새
계약에 맞추고 표시 문자열을 어댑터에서 만든다.

## Goal

- 개요 화면의 `예상 자금 흐름` 패널이 섹터마다 실제 구간을 표시한다.
- 구간이 없으면(`null`) 지어내지 않고 `범위 미제공`을 그대로 유지한다.
- **패널의 배치·구조·클래스는 그대로다.** 바뀌는 것은 참조하는 필드와 그 값을 만드는 경로다.

## Background

BE `#393`(PR `project_stock#395`, dev 머지 완료)이 ADR-017에 따라 문자열 라벨을 지우고 수치
구간으로 교체했다. 마이그레이션에서 컬럼 자체가 제거돼 옛 필드는 응답에 존재하지 않는다.

```text
# 이전
estimated_range: string | null      // "1,000억~1,500억원"

# 현재
estimated_flow: { low: string, high: string, currency: string } | null
```

`low`·`high`는 Decimal을 문자열로 직렬화한 값이다(예 `"800000000000.0000"`). 이 도메인의 금액은
모두 문자열로 오고, FE는 `parseDecimal`로 읽는다. `netValue`가 이미 같은 방식이다.

타입 검사로는 잡히지 않는 종류의 결함이다. DTO는 와이어를 **선언**할 뿐 실제 응답과 대조하지
않으므로, 응답에 없는 필드를 선언해 두면 조용히 `undefined`가 된다.

## Implementation Scope

- `src/features/news-insights/dto.ts` — `estimated_range`를 `estimated_flow`로 교체한다.
  구간 타입은 재사용 가능하도록 이름 붙은 타입으로 뽑는다(시나리오의 `expected_net_flow`가
  같은 모양이다).
- `src/features/news-insights/adapters.ts` — 뷰 타입의 `estimatedRange`를 구간을 담는 필드로
  교체한다. 뷰에는 **원시 수치(`low`·`high`·`currency`)와 표시 문자열을 함께** 담는다. 표시
  문자열만 담으면 이후 막대 길이를 값에 비례시킬 때(#294) 다시 파싱해야 한다.
- `src/widgets/FundFlowOutlookPanel/FundFlowOutlookPanel.tsx` — **참조하는 필드 이름만** 바꾼다.
  compact·비compact 두 분기 모두 같은 자리에 같은 방식으로 표시한다.

### 표시 문자열 규칙

관제 배치의 슬롯이 좁아 원 단위를 그대로 쓰면 넘친다.

- 통화가 `KRW`이고 `low`·`high` 중 절댓값이 큰 쪽이 1억 이상이면 억 단위로 줄이고 `억원`을
  붙인다. 소수 첫째 자리까지 둔다.
- 1억 미만이면 억으로 줄였을 때 0이 되므로 원 단위를 유지하고 `원`을 붙인다.
- 통화가 `KRW`가 아니면 억 단위 환산이 성립하지 않는다. 값을 그대로 쓰고 통화 코드를 함께
  적는다.
- `low`와 `high`가 같으면 `~`로 잇지 않고 하나만 적는다.
- 숫자 표기는 기존 `formatMoney`(`ko-KR` 로캘)를 쓴다. 직접 자릿수를 끊지 않는다.

## Out of Scope

- **표현·배치·클래스 변경 금지.** 막대 길이, 색, 폰트, 그리드, 슬롯 폭 어느 것도 건드리지
  않는다. 이번 작업은 데이터 연결만 고친다.
- 시나리오의 `expected_net_flow`와 투자자 동향의 `aggregation_windows`. BE가 새로 제공하지만
  표시할 자리가 없다. 자리를 만드는 일은 #294에서 다룬다. **DTO에 선언만 해 두는 것도 하지
  않는다** — 소비하지 않는 선언은 죽은 코드다.
- 다른 위젯·다른 화면.

## Protected Files

없음.

## Requirements

- 구간이 `null`이거나 `low`·`high`를 수로 읽을 수 없으면 뷰 필드를 `null`로 둔다. **대체
  숫자를 만들지 않는다.**
- `currency`는 공백을 제거하고 대문자로 정규화한다. 비어 있으면 `KRW`로 본다.
- 음수 구간(유출 전망)이 정상 입력이다. 부호를 버리거나 절댓값을 취하지 않는다.
- 이 도메인의 어댑터 관례를 따른다 — 문자열은 `trim`, 금액은 `parseDecimal`, 표시 문자열은
  어댑터에서 만들고 위젯은 받아 쓰기만 한다.

## Test Requirements

- 픽스처를 **실제 시드값**으로 맞춘다. BE `app/domains/news_insights/seed.py`의 반도체 항목이
  `low="800000000000.0000"`, `high="1800000000000.0000"`, `currency="KRW"`다. 임의로 지어낸
  값을 쓰지 않는다.
- 표시 문자열 규칙을 값별로 덮는다 — 억 이상, 억 미만, 음수를 포함한 구간, 비-KRW 통화,
  `low === high`, `null`.
- 기존 `FundFlowOutlookPanel`·`NewsInsightsOverviewPage` 테스트의 픽스처를 새 뷰 타입으로
  옮기고, 화면에 구간이 보인다는 단언을 유지한다. **셀렉터가 깨졌다는 이유로 단언을 삭제하지
  않는다.**
- 기존 단언을 약화시키지 않는다.

## Verification Commands

- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

다섯 가지 모두 CI 검사에 포함된다. `format:check`를 건너뛰지 않는다.

## Documentation Impact

없음. 계약 정본은 BE `docs/designs/307-news-intelligence-phase3.md`이며 이미 갱신돼 있다.
FE 설계 문서(`docs/designs/198-news-insights.md`)는 화면 구조 문서이고 필드 목록을 담지 않는다.

## ADR Need

불요. BE ADR-017의 결정을 따라가는 소비 측 정합 작업이며 FE에서 새로 정할 것이 없다.

## Failure Record Need

불요 — 다만 이 결함의 성격은 기록할 값이 있다. **BE 계약이 바뀌었는데 FE가 타입 검사도 테스트도
통과한 채 조용히 빈 값을 표시했다.** 리뷰 단계에서 이 패턴을 어떻게 잡을지 다룰 예정이므로,
구현 중 같은 구조(응답에 없는 필드를 선언해 둔 곳)를 더 발견하면 고치지 말고 **목록으로
보고한다.**

## Risk Level

Low — 단일 패널의 필드 교체다. 주의할 곳은 표시 문자열 규칙의 경계값(억 미만·음수·동일값)과
기존 픽스처 이관이다.

## Expected Output

- 위 범위의 커밋(한국어 메시지, `type: 본문` 형식). push·PR은 하지 않는다.
- 검증 5종 결과 보고.
- 시드값으로 만들어지는 표시 문자열이 무엇인지 보고.
- 응답에 없는 필드를 선언해 둔 곳을 더 발견했다면 그 목록.

## Rules

- Stay within scope.
- Do not weaken verification.
- Do not modify protected files unless listed above.
- Report assumptions and verification results.
- 현재 체크아웃된 브랜치를 유지한다(자체 브랜치 생성·push·PR 금지).
