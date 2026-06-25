import { Link } from 'react-router-dom'

import { usePortfolioSummary, usePortfolios } from '@/shared/api/hooks'
import type { PortfolioHolding, PortfolioSummary } from '@/shared/api/adapters'
import { appRoutePaths } from '@/shared/config/navigation'
import type { AiBriefing, PortfolioRiskExposure } from '@/shared/model'
import {
  Badge,
  BarChart,
  Card,
  DonutChart,
  EmptyState,
  ErrorState,
  Skeleton,
  Table,
  type TableColumn,
} from '@/shared/ui'
import { classNames } from '@/shared/ui/classNames'

type HoldingWeight = PortfolioHolding & {
  assetWeight: number
}

interface SectorExposure extends Record<string, string | number> {
  name: string
  value: number
  amount: number
}

const krwFormatter = new Intl.NumberFormat('ko-KR', {
  style: 'currency',
  currency: 'KRW',
  maximumFractionDigits: 0,
})

const numberFormatter = new Intl.NumberFormat('ko-KR')

const percentFormatter = new Intl.NumberFormat('ko-KR', {
  maximumFractionDigits: 1,
})

const allocationColors = [
  '#2563eb',
  '#4f46e5',
  '#06b6d4',
  '#f59e0b',
  '#22c55e',
  '#a855f7',
  '#ef4444',
  '#64748b',
  '#475569',
]

// TODO #48: 리스크 노출 분석 API 미구현
const portfolioRiskExposures = [
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
] satisfies PortfolioRiskExposure[]

// TODO #48: 포트폴리오 AI 브리핑 API 미구현
const portfolioAiBriefing = {
  headline: '포트폴리오 브리핑',
  body: '포트폴리오는 성장 섹터에 대한 익스포저가 높아 단기 수익 기회가 크지만, 일부 리스크가 누적되고 있습니다.',
  riskHeadline: '권고 요약',
  riskChecks: [
    '현금 비중을 25~30% 수준으로 확대 검토',
    '반도체/성장주 비중을 점진적으로 분산',
    '방어주 및 배당 ETF 편입으로 리스크 완충',
  ],
} satisfies AiBriefing

function getResearchPath(symbol: string) {
  return appRoutePaths.research.replace(':symbol', symbol)
}

function formatKrw(value: number) {
  return krwFormatter.format(value)
}

function formatPercent(value: number) {
  return `${percentFormatter.format(value)}%`
}

function getHoldingWeights(portfolio: PortfolioSummary): HoldingWeight[] {
  const totalAssets = portfolio.totalValue

  return portfolio.holdings
    .map((holding) => ({
      ...holding,
      assetWeight:
        totalAssets > 0 ? (holding.currentValue / totalAssets) * 100 : 0,
    }))
    .sort((first, second) => second.currentValue - first.currentValue)
}

function SummaryCard({
  label,
  value,
  helper,
  visual,
  donutRatio,
}: {
  label: string
  value: string
  helper: string
  visual: 'wallet' | 'donut' | 'risk'
  donutRatio?: number
}) {
  return (
    <Card className="min-h-28 border-cockpit-border bg-cockpit-surface/80">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <span className="text-sm font-semibold text-cockpit-text-muted">
            {label}
          </span>
          <strong className="mt-2 block text-2xl font-bold text-cockpit-text md:text-3xl">
            {value}
          </strong>
          <span className="mt-2 block text-sm text-emerald-300">{helper}</span>
        </div>
        {visual === 'wallet' ? (
          <span
            aria-hidden="true"
            className="grid h-12 w-12 shrink-0 place-items-center rounded-control border border-cockpit-border text-2xl text-cockpit-text-muted"
          >
            ▣
          </span>
        ) : null}
        {visual === 'donut' ? (
          <DonutChart
            className="shrink-0 text-emerald-400"
            width={64}
            height={64}
            data={[
              { name: '현금', value: donutRatio ?? 0 },
              { name: '투자자산', value: Math.max(0, 100 - (donutRatio ?? 0)) },
            ]}
            colors={['currentColor', '#334155']}
            innerRadius={22}
            outerRadius={30}
            ariaLabel="현금 비중 요약"
          />
        ) : null}
        {visual === 'risk' ? (
          <div
            className="mt-1 h-12 w-20 shrink-0 rounded-t-full border-[10px] border-b-0 border-rose-400"
            aria-hidden="true"
          />
        ) : null}
      </div>
    </Card>
  )
}

function PanelTitle({ title, kicker }: { title: string; kicker?: string }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-lg font-bold text-cockpit-text">{title}</h2>
      {kicker ? (
        <span className="text-sm text-cockpit-text-muted">{kicker}</span>
      ) : null}
    </div>
  )
}

function PortfolioHoldingLink({ holding }: { holding: PortfolioHolding }) {
  return (
    <div className="flex min-w-36 flex-col">
      <Link
        to={getResearchPath(holding.symbol)}
        className="w-fit font-bold text-cockpit-text hover:text-cockpit-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cockpit-accent"
      >
        {holding.symbol}
      </Link>
      <span className="max-w-40 truncate text-xs text-cockpit-text-muted">
        asset_id {holding.assetId}
      </span>
    </div>
  )
}

function buildHoldingColumns(): Array<TableColumn<HoldingWeight>> {
  return [
    {
      key: 'symbol',
      header: '종목',
      cell: (holding) => <PortfolioHoldingLink holding={holding} />,
    },
    {
      key: 'quantity',
      header: '수량',
      align: 'right',
      cell: (holding) => numberFormatter.format(holding.quantity),
    },
    {
      key: 'avgPrice',
      header: '평균단가',
      align: 'right',
      cell: (holding) => formatKrw(holding.avgPrice),
    },
    {
      key: 'currentValue',
      header: '평가액',
      align: 'right',
      cell: (holding) => formatKrw(holding.currentValue),
    },
    {
      key: 'weight',
      header: '비중',
      align: 'right',
      cell: (holding) => formatPercent(holding.weight),
    },
  ]
}

export function PortfolioPageView({
  portfolio,
}: {
  portfolio: PortfolioSummary
}) {
  const totalAssets = portfolio.totalValue
  const cashRatio = portfolio.cashRatio
  const holdings = getHoldingWeights(portfolio)
  const sectorExposure: SectorExposure[] = portfolio.sectorWeights.map(
    (sector) => ({
      name: sector.name,
      value: sector.value,
      amount: sector.amount,
    }),
  )
  const topHoldings = holdings.slice(0, 5)
  const topThreeShare = holdings
    .slice(0, 3)
    .reduce((sum, holding) => sum + holding.weight, 0)
  const topFiveShare = holdings
    .slice(0, 5)
    .reduce((sum, holding) => sum + holding.weight, 0)
  const maxHolding = holdings[0]
  const holdingColumns = buildHoldingColumns()
  const allocationData = [
    ...holdings.map((holding) => ({
      name: holding.symbol,
      value: holding.currentValue,
    })),
    { name: '현금', value: portfolio.cash },
  ]

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-3xl font-bold text-cockpit-text">포트폴리오</h1>
      </header>

      <section
        className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-4"
        aria-label="포트폴리오 요약"
      >
        <SummaryCard
          label="총 자산"
          value={formatKrw(totalAssets)}
          helper="일간 손익은 API 미지원"
          visual="wallet"
        />
        <SummaryCard
          label="현금 비중"
          value={formatPercent(cashRatio)}
          helper={formatKrw(portfolio.cash)}
          visual="donut"
          donutRatio={cashRatio}
        />
        <SummaryCard
          label="상위 3 종목 비중"
          value={formatPercent(topThreeShare)}
          helper={
            maxHolding
              ? `최대 ${maxHolding.symbol} ${formatPercent(maxHolding.weight)}`
              : '보유 종목 없음'
          }
          visual="risk"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_1.1fr_1fr]">
        <Card className="border-cockpit-border bg-cockpit-surface/80">
          <PanelTitle title="자산 배분" kicker="총 자산 기준" />
          {holdings.length > 0 ? (
            <div className="grid items-center gap-5 sm:grid-cols-[220px_1fr]">
              <div className="relative mx-auto h-56 w-56">
                <DonutChart
                  width={224}
                  height={224}
                  data={allocationData}
                  colors={allocationColors}
                  innerRadius={72}
                  outerRadius={108}
                  paddingAngle={1}
                  ariaLabel="포트폴리오 자산 배분"
                />
                <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                  <span className="text-xs text-cockpit-text-muted">
                    총 자산
                  </span>
                  <strong className="text-sm text-cockpit-text">
                    {formatKrw(totalAssets)}
                  </strong>
                </div>
              </div>
              <ul className="grid gap-2">
                {holdings.slice(0, 6).map((holding, index) => (
                  <li
                    key={holding.symbol}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="flex min-w-0 items-center gap-2 text-cockpit-text-muted">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-sm"
                        style={{
                          backgroundColor:
                            allocationColors[index % allocationColors.length],
                        }}
                      />
                      <span className="truncate">{holding.symbol}</span>
                    </span>
                    <span className="font-semibold text-cockpit-text">
                      {formatPercent(holding.assetWeight)}
                    </span>
                  </li>
                ))}
                <li className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2 text-cockpit-text-muted">
                    <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
                    현금
                  </span>
                  <span className="font-semibold text-cockpit-text">
                    {formatPercent(cashRatio)}
                  </span>
                </li>
              </ul>
            </div>
          ) : (
            <EmptyState
              title="보유 종목이 없습니다"
              description="자산 배분을 계산할 보유 종목 데이터가 없습니다."
              icon="◌"
              className="text-cockpit-text"
            />
          )}
        </Card>

        <Card className="border-cockpit-border bg-cockpit-surface/80">
          <PanelTitle title="섹터 익스포저" kicker="주식 포지션 기준" />
          <div className="grid gap-3">
            {sectorExposure.map((sector) => (
              <div key={sector.name} className="grid gap-1.5">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-cockpit-text-muted">{sector.name}</span>
                  <span className="font-semibold text-cockpit-text">
                    {formatPercent(sector.value)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-cockpit-surface-muted">
                  <div
                    className="h-full rounded-full bg-cockpit-accent"
                    style={{ width: `${Math.min(100, sector.value)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <BarChart
            className="mt-5 text-cockpit-accent"
            width={360}
            height={72}
            data={sectorExposure}
            color="currentColor"
            xDataKey="name"
            yDataKey="value"
            ariaLabel="섹터 익스포저 차트"
          />
        </Card>

        <Card className="border-cockpit-border bg-cockpit-surface/80">
          <PanelTitle title="단일 종목 집중도" />
          <div className="grid gap-3">
            {topHoldings.slice(0, 3).map((holding, index) => (
              <div key={holding.symbol} className="grid gap-1.5">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-cockpit-text-muted">
                    {index + 1}. {holding.symbol}
                  </span>
                  <span className="font-semibold text-cockpit-text">
                    {formatPercent(holding.weight)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-cockpit-surface-muted">
                  <div
                    className={classNames(
                      'h-full rounded-full',
                      index === 0
                        ? 'bg-rose-400'
                        : index === 1
                          ? 'bg-orange-400'
                          : 'bg-amber-400',
                    )}
                    style={{ width: `${Math.min(100, holding.weight)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <dl className="mt-5 grid gap-3 border-t border-cockpit-border pt-4 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-cockpit-text-muted">Top 3 합계</dt>
              <dd className="font-semibold text-cockpit-text">
                {formatPercent(topThreeShare)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-cockpit-text-muted">Top 5 합계</dt>
              <dd className="font-semibold text-cockpit-text">
                {formatPercent(topFiveShare)}
              </dd>
            </div>
          </dl>
          {maxHolding ? (
            <p className="mt-4 rounded-control border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-sm text-amber-100">
              {maxHolding.symbol} 비중이 가장 높습니다. 추가 매수 전 섹터와 종목
              분산을 먼저 확인하세요.
            </p>
          ) : null}
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="grid gap-4">
          <Card className="border-cockpit-border bg-cockpit-surface/80">
            <PanelTitle title="리스크 노출 분석" />
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {portfolioRiskExposures.map((risk) => (
                <article
                  key={risk.id}
                  className="rounded-card border border-cockpit-border bg-cockpit-surface-muted/40 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold text-cockpit-text">
                      {risk.label}
                    </h3>
                    <Badge riskLevel={risk.level}>{risk.level}</Badge>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-cockpit-text-muted">
                    {risk.description}
                  </p>
                </article>
              ))}
            </div>
          </Card>
        </div>

        <Card className="border-cockpit-border bg-cockpit-surface/80">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid h-7 w-7 place-items-center rounded-full border border-cockpit-accent/40 bg-cockpit-accent/15 text-sm font-bold text-cockpit-accent">
                AI
              </span>
              <h2 className="text-lg font-bold text-cockpit-accent">
                포트폴리오 브리핑
              </h2>
            </div>
            <span className="text-xs text-cockpit-text-muted">
              Insight Cockpit AI
            </span>
          </div>
          <div className="rounded-card border border-cockpit-border bg-cockpit-bg/40 p-4">
            <h3 className="font-bold text-cockpit-text">
              {portfolioAiBriefing.headline}
            </h3>
            <p className="mt-3 leading-7 text-cockpit-text">
              {portfolioAiBriefing.body}
            </p>
          </div>
          {portfolioAiBriefing.riskChecks ? (
            <div className="mt-4 rounded-card border border-cockpit-border bg-cockpit-accent/10 p-4">
              <h3 className="font-semibold text-cockpit-text">
                {portfolioAiBriefing.riskHeadline}
              </h3>
              <ul className="mt-3 grid gap-2 text-sm text-cockpit-text-muted">
                {portfolioAiBriefing.riskChecks.map((check) => (
                  <li key={check}>• {check}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </Card>
      </section>

      <Card className="border-cockpit-border bg-cockpit-surface/80">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <PanelTitle title="보유 종목" />
          <span className="rounded-control border border-cockpit-border bg-cockpit-surface-muted px-3 py-2 text-sm text-cockpit-text-muted">
            리스크 상태 필터 · 전체
          </span>
        </div>
        {holdings.length > 0 ? (
          <Table
            aria-label="보유 종목"
            columns={holdingColumns}
            rows={holdings}
            getRowKey={(holding) => holding.symbol}
            className="border-cockpit-border bg-cockpit-surface/60"
          />
        ) : (
          <EmptyState
            title="보유 종목이 없습니다"
            description="보유 종목이 추가되면 평가액과 비중을 계산합니다."
            icon="□"
          />
        )}
      </Card>
    </div>
  )
}

export function PortfolioPage() {
  const portfoliosQuery = usePortfolios()
  const selectedPortfolioId = portfoliosQuery.data?.[0]?.id
  const summaryQuery = usePortfolioSummary(selectedPortfolioId)

  if (portfoliosQuery.isPending || summaryQuery.isPending) {
    return <Skeleton className="min-h-[32rem]" />
  }

  if (portfoliosQuery.isError || summaryQuery.isError) {
    const queryError = portfoliosQuery.error ?? summaryQuery.error

    return (
      <ErrorState
        description={
          queryError instanceof Error ? queryError.message : undefined
        }
        onRetry={() => {
          void portfoliosQuery.refetch()
          void summaryQuery.refetch()
        }}
      />
    )
  }

  if (!selectedPortfolioId || !summaryQuery.data) {
    return (
      <EmptyState
        title="포트폴리오가 없습니다"
        description="포트폴리오를 생성하면 요약을 표시합니다."
      />
    )
  }

  return <PortfolioPageView portfolio={summaryQuery.data} />
}
