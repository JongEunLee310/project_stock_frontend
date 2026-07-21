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
    change: -0.31,
    changePercent: -0.24,
    per: 60.3,
    peg: 1.32,
    status: '매수 검토 가능',
    newsRisk: '중간',
    valuation: '고평가',
    aiVerdict: '위험 증가',
    themeHeat: '높음',
    lastUpdatedAt: '2026-05-24T00:21:00.000Z',
    isFavorite: true,
    changeSeries: [128.4, 127.9, 128.1, 127.6, 127.8, 128.2, 128.72],
  },
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    market: 'NASDAQ',
    price: 214.3,
    change: 0.68,
    changePercent: 0.32,
    per: 28.7,
    peg: 2.36,
    status: '관망',
    newsRisk: '낮음',
    valuation: '적정',
    aiVerdict: '안정',
    themeHeat: '중간',
    lastUpdatedAt: '2026-05-24T00:21:00.000Z',
    isFavorite: true,
    changeSeries: [212.4, 212.8, 213.1, 212.9, 213.7, 213.9, 214.3],
  },
  {
    symbol: 'TSLA',
    name: 'Tesla Inc.',
    market: 'NASDAQ',
    price: 182.64,
    change: -4.02,
    changePercent: -2.15,
    per: 88.1,
    peg: 3.04,
    status: '위험 증가',
    newsRisk: '높음',
    valuation: '고평가',
    aiVerdict: '위험 증가',
    themeHeat: '높음',
    lastUpdatedAt: '2026-05-24T00:20:00.000Z',
    isFavorite: false,
    changeSeries: [190.4, 188.8, 187.2, 186.1, 184.8, 183.6, 182.64],
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corp.',
    market: 'NASDAQ',
    price: 447.22,
    change: 1.82,
    changePercent: 0.41,
    per: 31.6,
    peg: 2.36,
    status: '안정',
    newsRisk: '낮음',
    valuation: '적정',
    aiVerdict: '안정',
    themeHeat: '낮음',
    lastUpdatedAt: '2026-05-24T00:20:00.000Z',
    isFavorite: true,
    changeSeries: [444.3, 445.1, 446.2, 445.8, 446.6, 447.0, 447.22],
  },
  {
    symbol: 'AMZN',
    name: 'Amazon',
    market: 'NASDAQ',
    price: 186.39,
    change: 0.28,
    changePercent: 0.15,
    per: 45.2,
    peg: 1.98,
    status: '관망',
    newsRisk: '중간',
    valuation: '저평가',
    aiVerdict: '관망 유지',
    themeHeat: '중간',
    lastUpdatedAt: '2026-05-24T00:19:00.000Z',
    isFavorite: false,
    changeSeries: [183.6, 184.2, 184.8, 184.4, 185.1, 185.8, 186.39],
  },
  {
    symbol: 'GOOGL',
    name: 'Alphabet',
    market: 'NASDAQ',
    price: 174.21,
    change: 1.08,
    changePercent: 0.62,
    per: 24.8,
    peg: 1.44,
    status: '안정',
    newsRisk: '낮음',
    valuation: '적정',
    aiVerdict: '안정',
    themeHeat: '낮음',
    lastUpdatedAt: '2026-05-24T00:18:00.000Z',
    isFavorite: false,
    changeSeries: [170.9, 171.8, 172.4, 172.0, 173.1, 173.8, 174.21],
  },
  {
    symbol: 'AMD',
    name: 'Advanced Micro Devices',
    market: 'NASDAQ',
    price: 161.88,
    change: -1.12,
    changePercent: -0.69,
    per: 44.8,
    peg: 1.84,
    status: '관망',
    newsRisk: '중간',
    valuation: '고평가',
    aiVerdict: '관망',
    themeHeat: '높음',
    lastUpdatedAt: '2026-05-24T00:17:00.000Z',
    isFavorite: false,
    changeSeries: [164.2, 163.4, 165.1, 162.8, 163.2, 162.4, 161.88],
  },
  {
    symbol: 'META',
    name: 'Meta Platforms',
    market: 'NASDAQ',
    price: 512.42,
    change: 5.94,
    changePercent: 1.17,
    per: 27.4,
    peg: 1.51,
    status: '매수 검토 가능',
    newsRisk: '낮음',
    valuation: '적정',
    aiVerdict: '매수 검토 가능',
    themeHeat: '중간',
    lastUpdatedAt: '2026-05-24T00:16:00.000Z',
    isFavorite: true,
    changeSeries: [493.1, 497.8, 501.2, 505.6, 508.3, 510.1, 512.42],
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
    addedAt: '2026-05-24T00:17:00.000Z',
  },
  {
    symbol: 'AMD',
    name: 'Advanced Micro Devices',
    status: '관망',
    addedAt: '2026-05-24T00:16:00.000Z',
  },
  {
    symbol: 'NFLX',
    name: 'Netflix',
    status: '관망',
    addedAt: '2026-05-24T00:15:00.000Z',
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
    previousStatus: '관망 유지',
    confidence: 86,
    previousConfidence: 70,
    oneMonthChangePercent: 12.4,
    trendSeries: [42, 43, 41, 45, 44, 48, 47, 50, 49, 53, 55, 54, 58],
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
    previousStatus: '관망 유지',
    confidence: 78,
    previousConfidence: 62,
    oneMonthChangePercent: -8.7,
    trendSeries: [62, 60, 59, 55, 56, 54, 53, 52, 54, 51, 50, 49, 47],
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
    previousStatus: '매수 검토 가능',
    confidence: 71,
    previousConfidence: 66,
    oneMonthChangePercent: 1.3,
    trendSeries: [50, 51, 50, 52, 51, 53, 52, 51, 53, 54, 53, 55, 56],
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
    previousStatus: '추가 리서치 필요',
    confidence: 64,
    previousConfidence: 64,
    oneMonthChangePercent: 6.2,
    trendSeries: [36, 37, 35, 38, 40, 43, 44, 46, 45, 47, 49, 50, 51],
    reasons: [
      'Price remains above the medium-term moving average.',
      'Volume confirmation is below the prior breakout window.',
    ],
    updatedAt: '2026-06-22T01:25:00.000Z',
    priority: 5,
  },
  {
    id: 'sig-amd-001',
    symbol: 'AMD',
    kind: 'news',
    message: 'AI accelerator share gains need order confirmation.',
    createdAt: '2026-06-22T01:35:00.000Z',
    status: '추가 리서치 필요',
    previousStatus: '추가 리서치 필요',
    confidence: 55,
    previousConfidence: 59,
    oneMonthChangePercent: -1.8,
    trendSeries: [48, 50, 47, 49, 51, 50, 48, 47, 46, 47, 45, 44, 43],
    reasons: [
      'Server GPU adoption could expand if customer ramps accelerate.',
      'Quarterly volatility and competitive pricing need closer validation.',
      'Guidance sensitivity remains elevated around AI order timing.',
    ],
    updatedAt: '2026-06-22T01:35:00.000Z',
    priority: 4,
  },
  {
    id: 'sig-meta-001',
    symbol: 'META',
    kind: 'technical',
    message:
      'Ad efficiency and buyback support keep trend quality constructive.',
    createdAt: '2026-06-22T01:50:00.000Z',
    status: '매수 검토 가능',
    previousStatus: '매수 검토 가능',
    confidence: 70,
    previousConfidence: 66,
    oneMonthChangePercent: 4.9,
    trendSeries: [38, 37, 39, 38, 40, 41, 40, 42, 43, 45, 46, 47, 50],
    reasons: [
      'Advertising revenue recovery is improving operating leverage.',
      'AI and metaverse investment remains the primary model risk.',
      'Share repurchases continue to support shareholder return quality.',
    ],
    updatedAt: '2026-06-22T01:50:00.000Z',
    priority: 6,
  },
] satisfies Signal[]

export const mockDashboardSummary = {
  riskAlertCount: 3,
  importantNewsCount: 8,
  reviewSignalCount: 5,
  cashRatio: 22.7,
  riskAlertDelta: '전일 대비 +1',
  importantNewsDelta: '전일 대비 +2',
  reviewSignalDelta: '전일 대비 +1',
  cashRatioDelta: '전일 대비 +1.3%p',
} satisfies DashboardSummary

export const mockAiBriefing = {
  headline: 'AI 관점 오늘의 시장 브리핑',
  body: 'AI 인프라 수요는 여전히 견조하지만 고밸류 종목의 변동성이 커지고 있습니다. NVDA와 MSFT는 품질 신호가 유지되는 반면, TSLA는 뉴스 감성과 마진 리스크가 동시에 악화되어 신규 매수 전 조건 확인이 필요합니다.',
  riskHeadline: '신규 매수 전 리스크 검토',
  riskChecks: [
    'TSLA 변동성 확대 구간에서 손절 기준을 먼저 확정',
    'NVDA 추가 진입은 PER 부담과 실적 모멘텀을 함께 확인',
    'AAPL 서비스 성장률이 현재 밸류에이션을 방어하는지 점검',
    '현금 비중 22.7%를 유지하며 이벤트 전 추격 매수 제한',
  ],
} satisfies AiBriefing

export const mockPriorityQueue = [
  {
    id: 'queue-nvda-entry',
    symbol: 'NVDA',
    title: '엔비디아 추가 진입 가격 점검',
    reason:
      'AI 인프라 수요는 강하지만 PER 60배 구간이라 기존 지지선 재접근 여부와 실적 코멘트를 함께 확인해야 합니다.',
    risk: '중간',
  },
  {
    id: 'queue-tsla-risk',
    symbol: 'TSLA',
    title: '테슬라 뉴스 감성 급락',
    reason:
      '최근 변동성 확대와 마진 둔화 뉴스가 겹쳐 단기 신규 매수보다 하방 시나리오와 보유 기준을 먼저 재점검해야 합니다.',
    risk: '높음',
  },
  {
    id: 'queue-aapl-valuation',
    symbol: 'AAPL',
    title: '애플 서비스 성장률 확인',
    reason:
      '하드웨어 교체 수요가 약한 상황에서 서비스 매출 성장률이 현재 프리미엄을 정당화하는지 비교가 필요합니다.',
    risk: '중간',
  },
] satisfies PriorityQueueItem[]

export const mockPortfolio = {
  totalValue: 99_510_000,
  cash: 29_224_000,
  dayChangeValue: 1_292_000,
  dayChangePercent: 1.02,
  holdings: [
    {
      symbol: 'NVDA',
      name: 'NVIDIA Corp.',
      sector: '정보기술',
      quantity: 120,
      avgPrice: 154_900,
      currentValue: 15_125_520,
      dailyChangePercent: 2.64,
    },
    {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      sector: '정보기술',
      quantity: 80,
      avgPrice: 145_200,
      currentValue: 11_344_140,
      dailyChangePercent: 1.18,
    },
    {
      symbol: 'TSLA',
      name: 'Tesla Inc.',
      sector: '소비재',
      quantity: 70,
      avgPrice: 170_400,
      currentValue: 11_941_200,
      dailyChangePercent: -2.35,
    },
    {
      symbol: 'QQQ',
      name: 'Invesco QQQ ETF',
      sector: 'ETF',
      quantity: 100,
      avgPrice: 203_800,
      currentValue: 20_383_548,
      dailyChangePercent: 0.84,
    },
    {
      symbol: 'MSFT',
      name: 'Microsoft Corp.',
      sector: '정보기술',
      quantity: 65,
      avgPrice: 231_100,
      currentValue: 14_112_750,
      dailyChangePercent: 0.92,
    },
    {
      symbol: 'AMZN',
      name: 'Amazon',
      sector: '소비재',
      quantity: 90,
      avgPrice: 102_600,
      currentValue: 9_005_000,
      dailyChangePercent: 0.46,
    },
    {
      symbol: '005930',
      name: '삼성전자',
      sector: '한국 주식',
      quantity: 200,
      avgPrice: 72_400,
      currentValue: 12_339_600,
      dailyChangePercent: 1.71,
    },
    {
      symbol: '0700.HK',
      name: '텐센트홀딩스',
      sector: '커뮤니케이션',
      quantity: 150,
      avgPrice: 34_500,
      currentValue: 5_258_242,
      dailyChangePercent: 0.77,
    },
  ],
  aiBriefing: {
    headline: '포트폴리오 브리핑',
    body: '포트폴리오는 성장 섹터에 대한 익스포저가 높아 단기 수익 기회가 크지만, 일부 리스크가 누적되고 있습니다.',
    riskHeadline: '권고 요약',
    riskChecks: [
      '현금 비중을 25~30% 수준으로 확대 검토',
      '반도체/성장주 비중을 점진적으로 분산',
      '방어주 및 배당 ETF 편입으로 리스크 완충',
    ],
  },
  riskExposures: [
    {
      id: 'portfolio-risk-semiconductor',
      label: '반도체 쏠림 위험',
      level: '높음',
      description:
        '정보기술/반도체 비중이 높아 업종 변동성 확대 시 타격 가능성이 큽니다.',
    },
    {
      id: 'portfolio-risk-us-megacap',
      label: '미국 대형주 의존도',
      level: '중간',
      description:
        '미국 대형주 비중이 높아 환율 및 금리 변수에 민감할 수 있습니다.',
    },
    {
      id: 'portfolio-risk-growth',
      label: '성장주 편중',
      level: '중간',
      description: '성장주 비중이 높아 방어력이 낮아질 수 있습니다.',
    },
    {
      id: 'portfolio-risk-cash',
      label: '현금 비중 부족',
      level: '높음',
      description:
        '변동성 확대에 대비해 현금 여력을 추가 확보하는 것을 권장합니다.',
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
    decision: '기존 비중을 유지하고 눌림 구간만 재검토',
    decisionType: '관망 유지',
    rationale:
      '데이터센터 수요는 견조하지만 밸류에이션이 이미 높은 수준이라 추가 진입은 가격 조정 이후로 미룬다.',
    cognitiveRisks: ['밸류에이션', '공급망'],
    reviewDate: '2026-06-29',
    outcome: '진행 중',
    createdAt: '2026-06-22T08:40:00.000Z',
  },
  {
    id: 'decision-tsla-001',
    symbol: 'TSLA',
    decision: '단기 신규 매수 보류',
    decisionType: '매도 검토',
    rationale:
      '가격 변동성이 커졌고 마진 둔화 뉴스가 이어져 기존 성장 가정의 하향 가능성을 먼저 점검한다.',
    cognitiveRisks: ['마진 압박', '수요 둔화'],
    reviewDate: '2026-06-26',
    outcome: '진행 중',
    createdAt: '2026-06-21T17:20:00.000Z',
  },
  {
    id: 'decision-aapl-001',
    symbol: 'AAPL',
    decision: '서비스 성장률 확인 전까지 관망',
    decisionType: '관찰 지속',
    rationale:
      '하드웨어 교체 수요가 약한 가운데 서비스 매출 방어력이 현재 멀티플을 정당화하는지 추가 확인이 필요하다.',
    cognitiveRisks: ['밸류에이션', '수요 둔화'],
    reviewDate: '2026-07-01',
    outcome: '대기',
    createdAt: '2026-06-21T10:15:00.000Z',
  },
  {
    id: 'decision-msft-001',
    symbol: 'MSFT',
    decision: '실적 전 클라우드 지표 추가 확인',
    decisionType: '매수 검토',
    rationale:
      'Azure 성장률과 AI 인프라 투자 회수 기간을 함께 확인해야 목표 비중 확대 여부를 판단할 수 있다.',
    cognitiveRisks: ['밸류에이션', '경쟁 심화'],
    reviewDate: '2026-07-03',
    outcome: '리서치 중',
    createdAt: '2026-06-20T14:05:00.000Z',
  },
  {
    id: 'decision-amzn-001',
    symbol: 'AMZN',
    decision: 'AWS 마진 개선 시 매수 후보 편입',
    decisionType: '매수 검토',
    rationale:
      '커머스 비용 효율화는 긍정적이나 AWS 마진 회복이 확인되어야 리스크 대비 보상이 충분하다.',
    cognitiveRisks: ['마진 압박', '경쟁 심화'],
    reviewDate: '2026-07-05',
    outcome: '리서치 중',
    createdAt: '2026-06-20T09:30:00.000Z',
  },
  {
    id: 'decision-meta-001',
    symbol: 'META',
    decision: '광고 성장 둔화 여부 확인 전 보류',
    decisionType: '추가 리서치 필요',
    rationale:
      'AI 추천 효율은 강하지만 광고 수요 둔화와 규제 비용이 동시에 커지는지 확인해야 한다.',
    cognitiveRisks: ['규제', '수요 둔화'],
    reviewDate: '2026-07-02',
    outcome: '리서치 중',
    createdAt: '2026-06-19T13:25:00.000Z',
  },
  {
    id: 'decision-googl-001',
    symbol: 'GOOGL',
    decision: '검색 점유율 변화 추적',
    decisionType: '관찰 지속',
    rationale:
      '클라우드와 광고 기반은 견조하지만 생성형 검색 전환이 핵심 사업의 방어력을 시험하고 있다.',
    cognitiveRisks: ['경쟁 심화', '규제'],
    reviewDate: '2026-07-04',
    outcome: '대기',
    createdAt: '2026-06-18T15:10:00.000Z',
  },
  {
    id: 'decision-avgo-001',
    symbol: 'AVGO',
    decision: 'AI 반도체 수주 흐름 유지 시 매수 검토',
    decisionType: '매수 검토',
    rationale:
      '커스텀 실리콘 수요는 강하지만 최근 상승 폭이 커서 고객 집중도와 가격 부담을 함께 확인한다.',
    cognitiveRisks: ['밸류에이션', '공급망'],
    reviewDate: '2026-07-08',
    outcome: '진행 중',
    createdAt: '2026-06-17T11:50:00.000Z',
  },
  {
    id: 'decision-crm-001',
    symbol: 'CRM',
    decision: '성장률 회복 전 비중 확대 보류',
    decisionType: '관망 유지',
    rationale:
      '마진 방어는 긍정적이지만 신규 매출 성장률이 둔화되어 재가속 신호 전까지 기존 비중을 유지한다.',
    cognitiveRisks: ['수요 둔화', '경쟁 심화'],
    reviewDate: '2026-07-06',
    outcome: '대기',
    createdAt: '2026-06-16T16:45:00.000Z',
  },
  {
    id: 'decision-amd-001',
    symbol: 'AMD',
    decision: 'AI GPU 점유율 가정 재점검',
    decisionType: '매수 검토',
    rationale:
      '서버 GPU 기대감은 유효하지만 고객 채택 속도와 가격 경쟁 강도를 실제 주문 흐름으로 확인해야 한다.',
    cognitiveRisks: ['경쟁 심화', '공급망'],
    reviewDate: '2026-07-07',
    outcome: '리서치 중',
    createdAt: '2026-06-15T12:35:00.000Z',
  },
  {
    id: 'decision-nflx-001',
    symbol: 'NFLX',
    decision: '가입자 성장 둔화 시 일부 축소 검토',
    decisionType: '매도 검토',
    rationale:
      '광고 요금제 성장은 긍정적이나 콘텐츠 투자 확대와 환율 부담이 동시에 나타나면 수익성 민감도가 커진다.',
    cognitiveRisks: ['환율', '수요 둔화'],
    reviewDate: '2026-07-09',
    outcome: '대기',
    createdAt: '2026-06-14T10:20:00.000Z',
  },
  {
    id: 'decision-adbe-001',
    symbol: 'ADBE',
    decision: 'AI 제품 전환 속도 확인 전 축소 검토',
    decisionType: '매도 검토',
    rationale:
      '생성형 AI 기능의 가격 전가가 예상보다 느리면 구독 성장률 둔화가 멀티플 부담으로 이어질 수 있다.',
    cognitiveRisks: ['경쟁 심화', '밸류에이션'],
    reviewDate: '2026-07-10',
    outcome: '진행 중',
    createdAt: '2026-06-13T09:55:00.000Z',
  },
  {
    id: 'decision-intc-001',
    symbol: 'INTC',
    decision: '턴어라운드 근거가 쌓일 때까지 관망',
    decisionType: '관찰 지속',
    rationale:
      '파운드리 투자 회수와 제품 경쟁력 회복이 아직 숫자로 확인되지 않아 단기 반등만으로 판단하지 않는다.',
    cognitiveRisks: ['회계', '공급망'],
    reviewDate: '2026-07-11',
    outcome: '대기',
    createdAt: '2026-06-12T08:30:00.000Z',
  },
] satisfies DecisionLog[]

export const mockStockResearch = {
  NVDA: {
    symbol: 'NVDA',
    priceAsOf: '06.22 16:00 ET · 종가',
    stance: 'Constructive, wait for disciplined add-on entry',
    stanceConfidence: 65,
    marketCap: '2.54T USD',
    fiftyTwoWeekLow: 399.23,
    fiftyTwoWeekHigh: 974.0,
    sector: '정보기술',
    nextEarningsDate: '2026-08-28',
    targetPrice: 1145.32,
    targetUpsidePercent: 11.8,
    pricePoints: [
      { date: '2026-06-16', close: 122.4 },
      { date: '2026-06-17', close: 124.1 },
      { date: '2026-06-18', close: 126.8 },
      { date: '2026-06-19', close: 126.31 },
      { date: '2026-06-22', close: 128.72 },
    ],
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
        category: '실적',
        headline: 'Cloud capex plans remain tilted toward AI accelerators.',
        source: 'Market Desk',
        publishedAt: '2026-06-21T12:00:00.000Z',
        risk: '중간',
      },
      {
        id: 'nvda-news-002',
        category: '제품',
        headline: 'Next-generation accelerator schedule remains on track.',
        source: 'Supply Chain Daily',
        publishedAt: '2026-06-22T08:20:00.000Z',
        risk: '낮음',
      },
    ],
    catalysts: [
      {
        id: 'nvda-catalyst-earnings',
        category: '실적',
        date: '2026-08-26',
        title: 'Quarterly earnings',
        description: 'Validate data center growth and gross margin durability.',
      },
      {
        id: 'nvda-catalyst-product',
        category: '제품',
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
        description:
          'Confirm the current price is inside the pre-defined add-on range.',
        checked: false,
      },
      {
        id: 'nvda-check-margin',
        label: 'Margin trend remains intact',
        description:
          'Review gross margin commentary against the long-term thesis.',
        checked: true,
      },
    ],
    memo: '',
  },
  AAPL: {
    symbol: 'AAPL',
    priceAsOf: '06.22 16:00 ET · 종가',
    stance: 'Neutral until growth assumptions improve',
    stanceConfidence: 58,
    marketCap: '3.18T USD',
    fiftyTwoWeekLow: 164.08,
    fiftyTwoWeekHigh: 237.49,
    sector: '정보기술',
    nextEarningsDate: '2026-07-30',
    targetPrice: 224.5,
    targetUpsidePercent: 4.8,
    pricePoints: [
      { date: '2026-06-16', close: 216.2 },
      { date: '2026-06-17', close: 215.7 },
      { date: '2026-06-18', close: 214.92 },
      { date: '2026-06-19', close: 215.48 },
      { date: '2026-06-22', close: 214.3 },
    ],
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
        category: '실적',
        headline:
          'Services revenue remains the key watch item for the next quarter.',
        source: 'Market Desk',
        publishedAt: '2026-06-20T09:30:00.000Z',
        risk: '낮음',
      },
      {
        id: 'aapl-news-002',
        category: '규제',
        headline: 'Platform fee scrutiny remains a manageable headline risk.',
        source: 'Policy Monitor',
        publishedAt: '2026-06-21T11:45:00.000Z',
        risk: '중간',
      },
    ],
    catalysts: [
      {
        id: 'aapl-catalyst-earnings',
        category: '실적',
        date: '2026-07-30',
        title: 'Quarterly earnings',
        description:
          'Focus on services growth and management commentary on device demand.',
      },
      {
        id: 'aapl-catalyst-product',
        category: '제품',
        date: '2026-09-09',
        title: 'Product cycle update',
        description:
          'Watch whether the next device cycle can reset growth expectations.',
      },
    ],
    checklist: [
      {
        id: 'aapl-check-services',
        label: 'Services growth supports valuation',
        description:
          'Confirm services growth offsets slower hardware replacement demand.',
        checked: true,
      },
      {
        id: 'aapl-check-catalyst',
        label: 'New catalyst identified',
        description:
          'Require a product or AI catalyst before upgrading the stance.',
        checked: false,
      },
    ],
    memo: '',
  },
  TSLA: {
    symbol: 'TSLA',
    priceAsOf: '06.22 16:00 ET · 종가',
    stance: 'Defensive review before adding exposure',
    stanceConfidence: 42,
    marketCap: '582.4B USD',
    fiftyTwoWeekLow: 138.8,
    fiftyTwoWeekHigh: 299.29,
    sector: '임의소비재',
    nextEarningsDate: '2026-07-23',
    targetPrice: 196.75,
    targetUpsidePercent: 7.7,
    pricePoints: [
      { date: '2026-06-16', close: 194.8 },
      { date: '2026-06-17', close: 191.35 },
      { date: '2026-06-18', close: 188.62 },
      { date: '2026-06-19', close: 189.46 },
      { date: '2026-06-22', close: 182.64 },
    ],
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
        category: '실적',
        headline:
          'Volatility increased as investors reassess near-term delivery risk.',
        source: 'Market Desk',
        publishedAt: '2026-06-21T14:15:00.000Z',
        risk: '높음',
      },
      {
        id: 'tsla-news-002',
        category: '파트너십',
        headline:
          'Charging ecosystem updates remain a secondary support factor.',
        source: 'Mobility Brief',
        publishedAt: '2026-06-22T07:10:00.000Z',
        risk: '중간',
      },
    ],
    catalysts: [
      {
        id: 'tsla-catalyst-deliveries',
        category: '이벤트',
        date: '2026-07-02',
        title: 'Delivery update',
        description:
          'Confirm whether demand and inventory trends are stabilizing.',
      },
      {
        id: 'tsla-catalyst-earnings',
        category: '실적',
        date: '2026-07-23',
        title: 'Quarterly earnings',
        description: 'Review margin trajectory and management guidance.',
      },
    ],
    checklist: [
      {
        id: 'tsla-check-support',
        label: 'Price recovered above support band',
        description:
          'Avoid adding before price action confirms a support recovery.',
        checked: false,
      },
      {
        id: 'tsla-check-margin',
        label: 'Margin risk has stabilized',
        description: 'Check whether price cuts and mix pressure are easing.',
        checked: false,
      },
    ],
    memo: '',
  },
  MSFT: {
    symbol: 'MSFT',
    priceAsOf: '06.22 16:00 ET · 종가',
    stance: 'Stable compounder, review on cloud durability',
    stanceConfidence: 72,
    marketCap: '3.32T USD',
    fiftyTwoWeekLow: 366.5,
    fiftyTwoWeekHigh: 468.35,
    sector: '정보기술',
    nextEarningsDate: '2026-07-29',
    targetPrice: 486.4,
    targetUpsidePercent: 8.8,
    pricePoints: [
      { date: '2026-06-16', close: 444.3 },
      { date: '2026-06-17', close: 445.1 },
      { date: '2026-06-18', close: 446.2 },
      { date: '2026-06-19', close: 445.8 },
      { date: '2026-06-22', close: 447.22 },
    ],
    briefing: null,
    keyRisks: [
      {
        id: 'msft-risk-cloud',
        title: 'Cloud growth deceleration',
        level: '중간',
        description:
          'A slower Azure growth path would challenge current quality-premium assumptions.',
      },
      {
        id: 'msft-risk-ai-spend',
        title: 'AI capex efficiency',
        level: '중간',
        description:
          'Large infrastructure investment needs visible revenue conversion to protect margins.',
      },
      {
        id: 'msft-risk-regulation',
        title: 'Platform regulation',
        level: '낮음',
        description:
          'Enterprise bundling and cloud market scrutiny can create headline risk.',
      },
    ],
    news: [
      {
        id: 'msft-news-001',
        category: '파트너십',
        headline:
          'Enterprise cloud demand remains resilient into the next quarter.',
        source: 'Market Desk',
        publishedAt: '2026-06-21T10:20:00.000Z',
        risk: '낮음',
      },
      {
        id: 'msft-news-002',
        category: '제품',
        headline:
          'AI platform adoption keeps enterprise pipeline constructive.',
        source: 'Cloud Weekly',
        publishedAt: '2026-06-22T06:50:00.000Z',
        risk: '낮음',
      },
    ],
    catalysts: [
      {
        id: 'msft-catalyst-earnings',
        category: '실적',
        date: '2026-07-29',
        title: 'Quarterly earnings',
        description:
          'Check Azure growth, AI contribution, and margin guidance.',
      },
      {
        id: 'msft-catalyst-cloud',
        category: '공급',
        date: '2026-09-15',
        title: 'Cloud platform update',
        description:
          'Watch for enterprise adoption signals and infrastructure efficiency.',
      },
    ],
    checklist: [
      {
        id: 'msft-check-azure',
        label: 'Azure growth remains within thesis range',
        description:
          'Confirm cloud growth remains strong enough to justify quality premium.',
        checked: true,
      },
      {
        id: 'msft-check-valuation',
        label: 'Valuation premium is still justified',
        description:
          'Compare target upside with current multiple and margin trend.',
        checked: false,
      },
    ],
    memo: '',
  },
} satisfies Record<string, StockResearch>

export const mockDecisionPatterns = [
  {
    id: 'pattern-watch-hold',
    label: '관망 유지',
    count: 5,
  },
  {
    id: 'pattern-research',
    label: '추가 리서치 필요',
    count: 3,
  },
  {
    id: 'pattern-buy-review',
    label: '매수 검토',
    count: 2,
  },
  {
    id: 'pattern-reduce-review',
    label: '비중 축소 검토',
    count: 2,
  },
  {
    id: 'pattern-risk-review',
    label: '리스크 증가 검토',
    count: 1,
  },
] satisfies DecisionPattern[]

export const mockReviewMemos = [
  {
    id: 'memo-nvda-001',
    symbol: 'NVDA',
    memo: '강한 실적 직후 바로 추격하지 않고 가격 구간을 요구한 점은 유지할 만하다. 다음 판단에서도 목표 진입 밴드를 먼저 적는다.',
    reviewedAt: '2026-06-21T08:00:00.000Z',
  },
  {
    id: 'memo-tsla-001',
    symbol: 'TSLA',
    memo: '마진 압박 뉴스가 반복될 때 손실 회피로 판단을 늦췄다. 다음에는 리스크 증가 조건을 넘으면 축소 검토를 바로 기록한다.',
    reviewedAt: '2026-06-20T08:30:00.000Z',
  },
  {
    id: 'memo-aapl-001',
    symbol: 'AAPL',
    memo: '익숙한 우량주라는 이유로 밸류에이션 부담을 낮게 보려는 경향이 있었다. 서비스 성장률과 멀티플을 분리해서 점검한다.',
    reviewedAt: '2026-06-19T09:10:00.000Z',
  },
  {
    id: 'memo-amd-001',
    symbol: 'AMD',
    memo: 'AI GPU 기대감을 주문 데이터보다 먼저 반영했다. 경쟁 강도와 고객 채택 속도를 확인하기 전까지는 리서치 상태로 둔다.',
    reviewedAt: '2026-06-18T10:45:00.000Z',
  },
] satisfies ReviewMemo[]
