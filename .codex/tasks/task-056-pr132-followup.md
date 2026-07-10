# Task 056: PR #132 후속 — evidence 원시 JSON 제거·신뢰도 라벨 추가

## Source Issue

FE #131 / PR #132 후속. 사용자가 실제 화면에서 발견한 2가지 개선. 기능 범위 확장 없음, 카드 UI 정리.

## Implementation Scope

`src/pages/ui/SignalsPage.tsx`만 변경한다(필요 시 `SignalsPage.test.tsx` 갱신).

1. **evidence 원시 JSON 노출 제거** — 현재 `SignalCard`가 `signal.evidence`(adapter가 `JSON.stringify`한 문자열)를 그대로 렌더해 `{ "news_item_id": 391, "impact_level": "HIGH", "sentiment": "POSITIVE" }` 같은 날 JSON이 화면에 보인다. 이 원시 JSON 블록 렌더를 제거한다. 대신 evidence가 객체일 때 `impact_level`·`sentiment` 값이 있으면 작은 라벨(칩) 형태로만 표시한다(예: "영향도 HIGH", "감성 POSITIVE"). 값이 없으면 아무것도 표시하지 않는다. 근거 문장(`signal.reason`)은 그대로 유지한다. 구조화된 근거 불릿은 후속 phase(BE) 범위이므로 여기서 만들지 않는다.
   - 주의: `signal.evidence`는 adapter에서 이미 문자열로 가공된다(`formatEvidence`). 칩 표시를 하려면 원본 구조가 필요한데, adapter/dto는 변경 금지 파일이다. 따라서 원본 구조 접근이 불가능하면 **원시 JSON 블록을 단순 제거**만 하고 칩은 생략한다(회귀 없이 안전한 최소 조치). 칩 표시는 adapter 변경이 필요하면 하지 말고, 문자열이 JSON 형태로 보이지 않게 하는 것을 최우선으로 한다.

2. **신뢰도 라벨 추가** — `ConfidenceRing` 위(또는 인접)에 "신뢰도" 텍스트 라벨을 추가해 링이 신뢰도 지표임을 명시한다. 기존 `role="meter"`·aria 속성은 유지한다.

## Out of Scope

- adapter/dto/queries 변경 (변경 금지)
- 구조화된 근거 불릿(BE key_points) — 후속 phase
- 종목당 1카드 집계(BE #252) — 별도 이슈
- 그 외 카드·레일·필터 로직 변경

## Verification Commands

```
corepack pnpm format:check
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm test
```

## Rules

- 현재 브랜치(feat/signal-redesign-phase1) 유지 — 새 브랜치·커밋 금지.
- 변경 금지 파일(adapters.ts·dto.ts·queries.ts·shared/ui·enumLabel.ts) 수정 금지.
- 위 2개 항목 외 변경 금지.
