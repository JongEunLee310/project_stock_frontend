import type {
  AlertRule,
  AiBriefing,
  DashboardSummary,
  DecisionLog,
  DecisionPattern,
  Portfolio,
  PriorityQueueItem,
  RecentWatchlistItem,
  ReviewMemo,
  Signal,
  Stock,
  StockResearch,
  WatchlistAlertSetting,
  WatchlistObservation,
  WatchlistSummaryCard,
} from '@/shared/model'

export const mockStocks = [
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corp.',
    market: 'NASDAQ',
    price: 128.72,
    change: 2.41,
    changePercent: 1.91,
    status: '매수 검토 가능',
    newsRisk: '중간',
    valuation: '고평가',
    aiVerdict:
      'AI infrastructure demand remains strong, but entry price needs discipline.',
    themeHeat: '높음',
    lastUpdatedAt: '2026-06-22T00:21:00.000Z',
    isFavorite: true,
    changeSeries: [123.4, 124.1, 125.8, 125.2, 126.6, 127.1, 128.72],
  },
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    market: 'NASDAQ',
    price: 214.3,
    change: -1.18,
    changePercent: -0.55,
    status: '관망',
    newsRisk: '낮음',
    valuation: '적정',
    aiVerdict:
      'Services resilience offsets muted hardware replacement momentum.',
    themeHeat: '중간',
    lastUpdatedAt: '2026-06-22T00:21:00.000Z',
    isFavorite: true,
    changeSeries: [216.2, 215.9, 216.5, 215.1, 214.8, 214.1, 214.3],
  },
  {
    symbol: 'TSLA',
    name: 'Tesla Inc.',
    market: 'NASDAQ',
    price: 182.64,
    change: -6.82,
    changePercent: -3.6,
    status: '위험 증가',
    newsRisk: '높음',
    valuation: '고평가',
    aiVerdict: 'Volatility and margin pressure keep the risk band elevated.',
    themeHeat: '높음',
    lastUpdatedAt: '2026-06-22T00:20:00.000Z',
    isFavorite: false,
    changeSeries: [191.4, 189.2, 188.5, 186.1, 184.8, 183.6, 182.64],
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corp.',
    market: 'NASDAQ',
    price: 447.22,
    change: 0.86,
    changePercent: 0.19,
    status: '안정',
    newsRisk: '낮음',
    valuation: '적정',
    aiVerdict:
      'Cloud growth and balance sheet quality support a stable stance.',
    themeHeat: '낮음',
    lastUpdatedAt: '2026-06-22T00:18:00.000Z',
    isFavorite: true,
    changeSeries: [444.3, 445.1, 446.2, 445.8, 446.6, 447.0, 447.22],
  },
] satisfies Stock[]

export const mockWatchlistSummary = [
  {
    label: '전체 관심 종목',
    value: '28개',
    deltaLabel: '전일 대비 +2',
    trend: 'up',
  },
  {
    label: '위험 증가 종목',
    value: '3개',
    deltaLabel: '전일 대비 +1',
    trend: 'up',
  },
  {
    label: '추가 리서치 필요',
    value: '5개',
    deltaLabel: '전일 대비 +1',
    trend: 'up',
  },
  {
    label: '평균 현금 연관도',
    value: '58%',
    deltaLabel: '전일 대비 +4%p',
    trend: 'up',
  },
] satisfies WatchlistSummaryCard[]

export const mockWatchlistObservations = [
  {
    id: 'watchlist-observation-risk',
    text: 'NVDA, TSLA는 최근 뉴스 흐름과 밸류에이션 부담으로 위험 증가 상태 지속. 단기 변동성 확대 가능성 주의.',
  },
  {
    id: 'watchlist-observation-quality',
    text: 'AAPL, MSFT는 실적 및 현금흐름 안정으로 현재 포트폴리오의 핵심 방어주 역할 기대.',
  },
  {
    id: 'watchlist-observation-entry',
    text: 'AI 반도체 테마 과열 지표가 높은 수준. 신규 진입은 분할 매수 전략 권장.',
  },
] satisfies WatchlistObservation[]

export const mockRecentWatchlist = [
  {
    symbol: 'META',
    name: 'Meta Platforms',
    status: '안정',
    addedAt: '2026-06-22T00:17:00.000Z',
  },
  {
    symbol: 'AMD',
    name: 'Advanced Micro Devices',
    status: '관망',
    addedAt: '2026-06-22T00:16:00.000Z',
  },
  {
    symbol: 'NFLX',
    name: 'Netflix',
    status: '관망',
    addedAt: '2026-06-22T00:15:00.000Z',
  },
] satisfies RecentWatchlistItem[]

export const mockWatchlistAlertSettings = [
  { label: '가격 변동', value: '±3%' },
  { label: '뉴스 위험도', value: '높음' },
  { label: 'AI 판단 변경', value: '모든 변경' },
  { label: '테마 과열', value: '높음' },
] satisfies WatchlistAlertSetting[]

export const mockSignals = [
  {
    id: 'sig-nvda-001',
    symbol: 'NVDA',
    kind: 'earnings',
    message: 'Data center revenue trend remains above watchlist threshold.',
    createdAt: '2026-06-21T13:30:00.000Z',
    status: '매수 검토 가능',
    confidence: 86,
    reasons: [
      'Data center demand remains above the prior quarter run rate.',
      'Gross margin commentary supports continued AI accelerator pricing power.',
    ],
    updatedAt: '2026-06-22T00:20:00.000Z',
    priority: 1,
  },
  {
    id: 'sig-tsla-001',
    symbol: 'TSLA',
    kind: 'price_momentum',
    message: 'Short-term price momentum weakened after recent volatility.',
    createdAt: '2026-06-21T15:45:00.000Z',
    status: '위험 증가',
    confidence: 78,
    reasons: [
      'Price closed below the short-term support band.',
      'Delivery and margin news flow remains mixed.',
    ],
    updatedAt: '2026-06-22T00:45:00.000Z',
    priority: 2,
  },
  {
    id: 'sig-aapl-001',
    symbol: 'AAPL',
    kind: 'valuation',
    message: 'Valuation spread is near the upper bound of the peer range.',
    createdAt: '2026-06-22T01:10:00.000Z',
    status: '추가 리서치 필요',
    confidence: 71,
    reasons: [
      'Forward multiple is near the upper peer range.',
      'Services growth needs to offset slower device cycle expectations.',
    ],
    updatedAt: '2026-06-22T01:10:00.000Z',
    priority: 3,
  },
  {
    id: 'sig-msft-001',
    symbol: 'MSFT',
    kind: 'technical',
    message: 'Trend quality remains stable while volume confirmation is muted.',
    createdAt: '2026-06-22T01:25:00.000Z',
    status: '관망 유지',
    confidence: 64,
    reasons: [
      'Price remains above the medium-term moving average.',
      'Volume confirmation is below the prior breakout window.',
    ],
    updatedAt: '2026-06-22T01:25:00.000Z',
    priority: 5,
  },
  {
    id: 'sig-nvda-002',
    symbol: 'NVDA',
    kind: 'news',
    message: 'Supplier commentary keeps AI infrastructure demand constructive.',
    createdAt: '2026-06-22T01:35:00.000Z',
    status: '매수 검토 가능',
    confidence: 82,
    reasons: [
      'Recent supply chain updates point to sustained accelerator demand.',
      'Competitive risk remains manageable versus current growth expectations.',
    ],
    updatedAt: '2026-06-22T01:35:00.000Z',
    priority: 4,
  },
  {
    id: 'sig-tsla-002',
    symbol: 'TSLA',
    kind: 'technical',
    message: 'Downside retest risk is elevated after support failed to hold.',
    createdAt: '2026-06-22T01:50:00.000Z',
    status: '위험 증가',
    confidence: 74,
    reasons: [
      'Relative strength remains below the peer group average.',
      'The latest rebound attempt faded near prior support.',
    ],
    updatedAt: '2026-06-22T01:50:00.000Z',
    priority: 6,
  },
] satisfies Signal[]

export const mockDashboardSummary = {
  riskAlertCount: 4,
  importantNewsCount: 7,
  reviewSignalCount: 3,
  cashRatio: 18,
} satisfies DashboardSummary

export const mockAiBriefing = {
  headline:
    'AI leaders remain constructive while volatility concentrates in high-beta names.',
  body: 'NVDA and MSFT retain the strongest quality signals. TSLA requires a stricter review band until delivery and margin risk stabilize.',
} satisfies AiBriefing

export const mockPriorityQueue = [
  {
    id: 'queue-nvda-entry',
    symbol: 'NVDA',
    reason:
      'Review add-on entry if price resets toward the prior support band.',
    risk: '중간',
  },
  {
    id: 'queue-tsla-risk',
    symbol: 'TSLA',
    reason: 'Recheck downside scenario after the latest volatility spike.',
    risk: '높음',
  },
  {
    id: 'queue-aapl-valuation',
    symbol: 'AAPL',
    reason:
      'Compare services growth assumptions with current valuation premium.',
    risk: '낮음',
  },
] satisfies PriorityQueueItem[]

export const mockPortfolio = {
  totalValue: 82_995,
  holdings: [
    {
      symbol: 'NVDA',
      quantity: 250,
      avgPrice: 102.4,
      currentValue: 32_180,
    },
    {
      symbol: 'AAPL',
      quantity: 140,
      avgPrice: 189.75,
      currentValue: 30_002,
    },
    {
      symbol: 'MSFT',
      quantity: 45,
      avgPrice: 398.1,
      currentValue: 20_813,
    },
  ],
} satisfies Portfolio

export const mockAlertRules = [
  {
    id: 'alert-nvda-target',
    symbol: 'NVDA',
    condition: 'price_above',
    threshold: 135,
    enabled: true,
  },
  {
    id: 'alert-market-risk',
    symbol: null,
    condition: 'status_changed',
    threshold: 0,
    enabled: true,
  },
  {
    id: 'alert-tsla-drop',
    symbol: 'TSLA',
    condition: 'change_percent_above',
    threshold: 4,
    enabled: false,
  },
] satisfies AlertRule[]

export const mockDecisionLogs = [
  {
    id: 'decision-nvda-001',
    symbol: 'NVDA',
    decision: 'Hold and review pullbacks for add-on entry.',
    decisionType: '비중 확대',
    rationale:
      'Growth signal is positive, but entry should wait for risk/reward reset.',
    cognitiveRisks: ['최근성 편향', 'FOMO'],
    reviewDate: '2026-06-28',
    createdAt: '2026-06-21T16:00:00.000Z',
  },
  {
    id: 'decision-tsla-001',
    symbol: 'TSLA',
    decision: 'Pause new buying.',
    decisionType: '보류',
    rationale:
      'Volatility and momentum signals moved outside the current risk band.',
    cognitiveRisks: ['손실 회피', '확증 편향'],
    reviewDate: '2026-06-27',
    createdAt: '2026-06-21T17:20:00.000Z',
  },
] satisfies DecisionLog[]

export const mockStockResearch = {
  NVDA: {
    symbol: 'NVDA',
    pricePoints: [
      { date: '2026-06-16', close: 122.4 },
      { date: '2026-06-17', close: 124.1 },
      { date: '2026-06-18', close: 126.8 },
      { date: '2026-06-19', close: 126.31 },
      { date: '2026-06-22', close: 128.72 },
    ],
    stance: 'Constructive, wait for disciplined add-on entry',
    briefing: {
      headline: 'Data center demand keeps NVDA on the priority list.',
      body: 'The stock remains a high-quality AI compounder, but current valuation leaves limited room for execution misses.',
    },
    keyRisks: [
      {
        id: 'nvda-risk-valuation',
        title: 'Valuation compression',
        level: '중간',
        description:
          'A small growth reset could pressure the elevated forward multiple.',
      },
      {
        id: 'nvda-risk-supply',
        title: 'Supply chain bottleneck',
        level: '중간',
        description:
          'Advanced packaging capacity remains a constraint for near-term shipments.',
      },
      {
        id: 'nvda-risk-policy',
        title: 'Export control headlines',
        level: '높음',
        description:
          'Policy changes can quickly alter revenue expectations for restricted markets.',
      },
    ],
    news: [
      {
        id: 'nvda-news-001',
        headline: 'Cloud capex plans remain tilted toward AI accelerators.',
        source: 'Market Desk',
        publishedAt: '2026-06-21T12:00:00.000Z',
        risk: '중간',
      },
    ],
    catalysts: [
      {
        id: 'nvda-catalyst-earnings',
        date: '2026-08-26',
        title: 'Quarterly earnings',
        description: 'Validate data center growth and gross margin durability.',
      },
      {
        id: 'nvda-catalyst-product',
        date: '2026-09-10',
        title: 'AI platform update',
        description:
          'Watch for comments on next-generation accelerator demand.',
      },
    ],
    checklist: [
      {
        id: 'nvda-check-entry',
        label: 'Entry price is inside target band',
        checked: false,
      },
      {
        id: 'nvda-check-margin',
        label: 'Margin trend remains intact',
        checked: true,
      },
    ],
    memo: '',
  },
  AAPL: {
    symbol: 'AAPL',
    pricePoints: [
      { date: '2026-06-16', close: 216.2 },
      { date: '2026-06-17', close: 215.7 },
      { date: '2026-06-18', close: 214.92 },
      { date: '2026-06-19', close: 215.48 },
      { date: '2026-06-22', close: 214.3 },
    ],
    stance: 'Neutral until growth assumptions improve',
    briefing: {
      headline: 'AAPL remains stable but needs a clearer growth trigger.',
      body: 'Services strength supports downside resilience, while valuation limits near-term upside without a hardware or AI catalyst.',
    },
    keyRisks: [
      {
        id: 'aapl-risk-cycle',
        title: 'Device cycle softness',
        level: '중간',
        description:
          'Replacement demand may remain muted without a compelling upgrade cycle.',
      },
      {
        id: 'aapl-risk-regulation',
        title: 'Platform regulation',
        level: '중간',
        description:
          'App store and ecosystem scrutiny can pressure services margins.',
      },
      {
        id: 'aapl-risk-valuation',
        title: 'Limited valuation upside',
        level: '낮음',
        description: 'Current valuation already prices in defensive quality.',
      },
    ],
    news: [
      {
        id: 'aapl-news-001',
        headline:
          'Services revenue remains the key watch item for the next quarter.',
        source: 'Market Desk',
        publishedAt: '2026-06-20T09:30:00.000Z',
        risk: '낮음',
      },
    ],
    catalysts: [
      {
        id: 'aapl-catalyst-earnings',
        date: '2026-07-30',
        title: 'Quarterly earnings',
        description:
          'Focus on services growth and management commentary on device demand.',
      },
    ],
    checklist: [
      {
        id: 'aapl-check-services',
        label: 'Services growth supports valuation',
        checked: true,
      },
      {
        id: 'aapl-check-catalyst',
        label: 'New catalyst identified',
        checked: false,
      },
    ],
    memo: '',
  },
  TSLA: {
    symbol: 'TSLA',
    pricePoints: [
      { date: '2026-06-16', close: 194.8 },
      { date: '2026-06-17', close: 191.35 },
      { date: '2026-06-18', close: 188.62 },
      { date: '2026-06-19', close: 189.46 },
      { date: '2026-06-22', close: 182.64 },
    ],
    stance: 'Defensive review before adding exposure',
    briefing: {
      headline: 'TSLA risk remains elevated after momentum weakened.',
      body: 'The setup needs evidence of margin stabilization and calmer delivery expectations before new buying is justified.',
    },
    keyRisks: [
      {
        id: 'tsla-risk-margin',
        title: 'Margin pressure',
        level: '높음',
        description:
          'Price cuts and mix changes can keep automotive margin under pressure.',
      },
      {
        id: 'tsla-risk-delivery',
        title: 'Delivery volatility',
        level: '높음',
        description:
          'Delivery misses can amplify sentiment swings around the stock.',
      },
      {
        id: 'tsla-risk-narrative',
        title: 'Narrative premium',
        level: '중간',
        description:
          'Future optionality remains difficult to value and can reprice sharply.',
      },
    ],
    news: [
      {
        id: 'tsla-news-001',
        headline:
          'Volatility increased as investors reassess near-term delivery risk.',
        source: 'Market Desk',
        publishedAt: '2026-06-21T14:15:00.000Z',
        risk: '높음',
      },
    ],
    catalysts: [
      {
        id: 'tsla-catalyst-deliveries',
        date: '2026-07-02',
        title: 'Delivery update',
        description:
          'Confirm whether demand and inventory trends are stabilizing.',
      },
      {
        id: 'tsla-catalyst-earnings',
        date: '2026-07-23',
        title: 'Quarterly earnings',
        description: 'Review margin trajectory and management guidance.',
      },
    ],
    checklist: [
      {
        id: 'tsla-check-support',
        label: 'Price recovered above support band',
        checked: false,
      },
      {
        id: 'tsla-check-margin',
        label: 'Margin risk has stabilized',
        checked: false,
      },
    ],
    memo: '',
  },
} satisfies Record<string, StockResearch>

export const mockDecisionPatterns = [
  {
    id: 'pattern-fomo',
    label: 'FOMO after strong earnings',
    count: 4,
  },
  {
    id: 'pattern-loss-aversion',
    label: 'Delayed trimming after risk increase',
    count: 3,
  },
  {
    id: 'pattern-confirmation',
    label: 'Overweighting confirming news',
    count: 2,
  },
] satisfies DecisionPattern[]

export const mockReviewMemos = [
  {
    id: 'memo-nvda-001',
    symbol: 'NVDA',
    memo: 'Entry discipline improved; keep requiring a price band before adding.',
    reviewedAt: '2026-06-20T08:00:00.000Z',
  },
  {
    id: 'memo-tsla-001',
    symbol: 'TSLA',
    memo: 'Risk flags were visible before the drawdown; review trimming threshold.',
    reviewedAt: '2026-06-19T08:30:00.000Z',
  },
] satisfies ReviewMemo[]
