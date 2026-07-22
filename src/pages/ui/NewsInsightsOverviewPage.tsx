import { useNavigate } from 'react-router-dom'

import { Badge, Button, Card } from '@/shared/ui'
import { appRoutePaths } from '@/shared/config/navigation'
import {
  useNewsEventsQuery,
  useNewsOverviewQuery,
} from '@/features/news-insights'
import { AgentBriefing } from '@/widgets/AgentBriefing'
import { InsightSummaryCards } from '@/widgets/InsightSummaryCards'
import { RealtimeEventFeed } from '@/widgets/RealtimeEventFeed'
import { TopicMap } from '@/widgets/TopicMap'

interface PlannedPanel {
  id: string
  title: string
  description: string
  phase: string
  issue: string
}

const plannedPanels: PlannedPanel[] = [
  {
    id: 'investor-flow',
    title: '투자자 동향',
    description: '투자 주체별 수급과 이벤트 이후 반응을 비교합니다.',
    phase: '2차',
    issue: '#264',
  },
  {
    id: 'fund-flow-outlook',
    title: '예상 자금 흐름',
    description: '확률과 범위가 포함된 자금 흐름 시나리오를 제공합니다.',
    phase: '3차',
    issue: '#267',
  },
  {
    id: 'event-timeline',
    title: '이벤트 타임라인',
    description: '예정 이벤트와 과거 시장 반응을 시간순으로 연결합니다.',
    phase: '3차',
    issue: '#269',
  },
  {
    id: 'agent-pipeline',
    title: '에이전트 파이프라인',
    description: '수집·분석 에이전트의 실행 상태와 최신 결과를 표시합니다.',
    phase: '3차',
    issue: '#269',
  },
]

function PlannedPanelCard({ panel }: { panel: PlannedPanel }) {
  return (
    <Card
      aria-label={`${panel.title} 준비 중`}
      className="min-h-40 border-dashed border-cockpit-border bg-cockpit-surface/50"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-cockpit-text">
          {panel.title}
        </h3>
        <Badge tone="neutral">
          {panel.phase} · {panel.issue}
        </Badge>
      </div>
      <p className="mt-4 text-sm leading-6 text-cockpit-text-muted">
        {panel.description}
      </p>
      <p className="mt-4 text-xs font-semibold text-app-accent">구현 예정</p>
    </Card>
  )
}

export function NewsInsightsOverviewPage() {
  const navigate = useNavigate()
  const overviewQuery = useNewsOverviewQuery()
  const eventsQuery = useNewsEventsQuery()
  const events = eventsQuery.data?.flatMap((page) => page.items) ?? []

  return (
    <section className="flex flex-col gap-6 py-4">
      <header className="flex min-h-16 flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-app-text-muted">
            News intelligence
          </p>
          <h1 className="mt-1 text-3xl font-bold text-app-text">
            뉴스·공시 인사이트
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-app-text-muted">
            AI Agent가 뉴스·공시·실적·투자 동향을 분석해 인사이트를 추출합니다.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="primary"
            onClick={() => void navigate(appRoutePaths.alerts)}
          >
            + 알림 생성
          </Button>
          <Button
            variant="secondary"
            onClick={() => void navigate(appRoutePaths.decisionLog)}
          >
            판단 기록 연결
          </Button>
        </div>
      </header>

      <InsightSummaryCards
        data={overviewQuery.data}
        isLoading={overviewQuery.isLoading}
        isError={overviewQuery.isError}
        onRetry={() => void overviewQuery.refetch()}
      />

      <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.15fr)]">
        <RealtimeEventFeed
          events={events}
          isLoading={eventsQuery.isLoading}
          isError={eventsQuery.isError}
          isFetchingNextPage={eventsQuery.isFetchingNextPage}
          isFetchNextPageError={eventsQuery.isFetchNextPageError}
          hasNextPage={eventsQuery.hasNextPage}
          onLoadMore={() => void eventsQuery.fetchNextPage()}
          onRetry={() => void eventsQuery.refetch()}
        />
        <AgentBriefing
          data={overviewQuery.data?.briefing}
          isLoading={overviewQuery.isLoading}
          isError={overviewQuery.isError}
          onRetry={() => void overviewQuery.refetch()}
        />
        <TopicMap />
      </div>

      <section aria-labelledby="planned-panels-title">
        <div className="mb-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-app-accent">
            Roadmap
          </p>
          <h2
            id="planned-panels-title"
            className="mt-1 text-xl font-semibold text-app-text"
          >
            단계별 확장 패널
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
          {plannedPanels.map((panel) => (
            <PlannedPanelCard key={panel.id} panel={panel} />
          ))}
        </div>
      </section>
    </section>
  )
}
