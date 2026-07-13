# Issue 7–11 선행 — 도메인·Mock 확장

## Context

페이지 7~11(Dashboard·Watchlist·Signals·Research Detail·Decision Log)을 구현하려면
현재 `src/shared/model`의 도메인 타입이 부족하다. 기존 모델(이슈 6, PR #27)은 최소 골격만
정의되어 있어 뉴스 위험도·밸류에이션·AI 판단·시그널 신뢰도·리서치 상세·판단 기록 확장 필드가
없다. 페이지 구현에 들어가기 전에 **타입과 Mock을 한 번에 확장**해, 각 페이지 task는 UI에만
집중하도록 한다. 본 확장은 `shared/model`·`shared/mock`에 한정한다(페이지·위젯 미변경).

이 확장은 특정 이슈 하나를 종료시키지 않는다. 이슈 7~11 구현을 위한 선행 작업이며,
PR은 `Refs #7 #8 #9 #10 #11`로 연결한다(`Closes` 없음).

## Shared Enums

기존 `StockStatus`(7종), `RiskLevel`('높음'|'중간'|'낮음')은 유지. 신규 2종 추가:

| Enum | 값 | 용도 |
| --- | --- | --- |
| `ValuationLevel` | `'저평가' \| '적정' \| '고평가'` | Watchlist 밸류에이션, Research 헤더 |
| `DecisionType` | `'매수' \| '비중 확대' \| '관망' \| '비중 축소' \| '매도' \| '보류'` | Decision Log 판단 유형 배지 |

## Extended Models

### `Stock` (Watchlist 8 / Dashboard 7)

기존 필드 + 추가:

| 필드 | 타입 | 의미 |
| --- | --- | --- |
| `market` | `string` | 시장(예: `'NASDAQ'`) — 시장 필터용 |
| `newsRisk` | `RiskLevel` | 뉴스 위험도 |
| `valuation` | `ValuationLevel` | 밸류에이션 |
| `aiVerdict` | `string` | AI 판단 요약 한 줄 |

### `Signal` (Signals 9)

기존 필드 + 추가:

| 필드 | 타입 | 의미 |
| --- | --- | --- |
| `confidence` | `number` | 신뢰도(0–100) |
| `reasons` | `string[]` | 근거 bullet |
| `updatedAt` | `string`(ISO) | 최근 변경 시각(최근 변경 패널) |
| `priority` | `number` | 우선순위(작을수록 상위) |

### `DecisionLog` (Decision Log 11)

기존 필드(`symbol`,`decision`,`rationale`,`createdAt`) + 추가:

| 필드 | 타입 | 의미 |
| --- | --- | --- |
| `decisionType` | `DecisionType` | 판단 유형(배지) |
| `cognitiveRisks` | `string[]` | 인지 리스크 태그 |
| `reviewDate` | `string`(ISO date) | 재검토 일정 |

## New Models

### Dashboard (7)

| 모델 | 필드 |
| --- | --- |
| `DashboardSummary` | `riskAlertCount: number`, `importantNewsCount: number`, `reviewSignalCount: number`, `cashRatio: number`(%) |
| `AiBriefing` | `headline: string`, `body: string` (Dashboard·Research 공용) |
| `PriorityQueueItem` | `id: string`, `symbol: string`, `reason: string`, `risk: RiskLevel` |

> 최근 판단 기록 영역은 `DecisionLog`를 재사용한다.

### Research Detail (10) — `StockResearch`

| 필드 | 타입 | 의미 |
| --- | --- | --- |
| `symbol` | `string` | 종목 |
| `pricePoints` | `PricePoint[]` | 가격 차트 데이터(`{ date: string; close: number }`) |
| `stance` | `string` | AI 투자 스탠스 라벨 |
| `briefing` | `AiBriefing` | AI 브리핑 |
| `keyRisks` | `ResearchRisk[]` | 핵심 리스크(`{ id, title, level: RiskLevel, description }`) — **3개 이상** |
| `news` | `NewsItem[]` | 뉴스/공시(`{ id, headline, source, publishedAt: string, risk: RiskLevel }`) |
| `catalysts` | `CatalystItem[]` | 촉매 타임라인(`{ id, date: string, title, description }`) |
| `checklist` | `ChecklistItem[]` | 의사결정 체크리스트(`{ id, label, checked: boolean }`) |
| `memo` | `string` | 사용자 메모 초기값(빈 문자열 가능) |

### Decision Log 보조 (11)

| 모델 | 필드 |
| --- | --- |
| `DecisionPattern` | `id: string`, `label: string`, `count: number` (자주 나온 판단 패턴) |
| `ReviewMemo` | `id: string`, `symbol: string`, `memo: string`, `reviewedAt: string`(ISO) (최근 복기 메모) |

## Mock Data

- 기존 mock(`mockStocks`·`mockSignals`·`mockDecisionLogs`)에 신규 필드 채움.
- 신규 export: `mockDashboardSummary`, `mockAiBriefing`, `mockPriorityQueue`,
  `mockStockResearch`(심볼→`StockResearch` 맵, 최소 `NVDA`·`AAPL`·`TSLA`),
  `mockDecisionPatterns`, `mockReviewMemos`.
- 모든 mock은 `satisfies` 타입으로 도메인 타입을 무손실 만족 → 추후 API 응답 교체 가능.
- 완료 조건 충족용: Research mock의 `keyRisks`는 종목당 3개 이상, `mockPriorityQueue` 3개 이상,
  `mockStockResearch`에 `NVDA` 존재.

## Open Questions

- `aiVerdict`·`stance`를 자유 문자열로 둘지 enum화할지(문구 다양성 우선 → 1차 문자열).
- 가격 차트(`pricePoints`)의 해상도(일봉 N개) — 차트 컴포넌트(이슈 19)에서 확정, 본 task는 표시용 샘플.
- `cashRatio` 출처(포트폴리오 집계 vs 고정값) — 1차 고정값, Dashboard task에서 집계 검토.

## Related

- `docs/designs/6-domain-types-and-mock-data.md` (이슈 6 기반 모델)
- `docs/designs/2-frontend-architecture.md`
- 이슈 7·8·9·10·11 페이지 구현 (후속 task)
- 공통 컴포넌트: Badge(이슈 13, PR #28), Table(이슈 12, PR #29)
