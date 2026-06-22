import type {
  AlertRule,
  DecisionLog,
  Portfolio,
  Signal,
  Stock,
} from '@/shared/model'

export const mockStocks = [
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corp.',
    price: 128.72,
    change: 2.41,
    changePercent: 1.91,
    status: '매수 검토 가능',
  },
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    price: 214.3,
    change: -1.18,
    changePercent: -0.55,
    status: '관망',
  },
  {
    symbol: 'TSLA',
    name: 'Tesla Inc.',
    price: 182.64,
    change: -6.82,
    changePercent: -3.6,
    status: '위험 증가',
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corp.',
    price: 447.22,
    change: 0.86,
    changePercent: 0.19,
    status: '안정',
  },
] satisfies Stock[]

export const mockSignals = [
  {
    id: 'sig-nvda-001',
    symbol: 'NVDA',
    kind: 'earnings',
    message: 'Data center revenue trend remains above watchlist threshold.',
    createdAt: '2026-06-21T13:30:00.000Z',
    status: '매수 검토 가능',
  },
  {
    id: 'sig-tsla-001',
    symbol: 'TSLA',
    kind: 'price_momentum',
    message: 'Short-term price momentum weakened after recent volatility.',
    createdAt: '2026-06-21T15:45:00.000Z',
    status: '위험 증가',
  },
  {
    id: 'sig-aapl-001',
    symbol: 'AAPL',
    kind: 'valuation',
    message: 'Valuation spread is near the upper bound of the peer range.',
    createdAt: '2026-06-22T01:10:00.000Z',
    status: '추가 리서치 필요',
  },
] satisfies Signal[]

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
    rationale:
      'Growth signal is positive, but entry should wait for risk/reward reset.',
    createdAt: '2026-06-21T16:00:00.000Z',
  },
  {
    id: 'decision-tsla-001',
    symbol: 'TSLA',
    decision: 'Pause new buying.',
    rationale:
      'Volatility and momentum signals moved outside the current risk band.',
    createdAt: '2026-06-21T17:20:00.000Z',
  },
] satisfies DecisionLog[]
