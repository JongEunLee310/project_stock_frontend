import { useNavigate } from 'react-router-dom'

import { Button } from '@/shared/ui'
import { appRoutePaths } from '@/shared/config/navigation'
import {
  useNewsEventsQuery,
  useNewsOverviewQuery,
  useNewsTopicMapQuery,
} from '@/features/news-insights'
import { AgentBriefing } from '@/widgets/AgentBriefing'
import { AgentPipelinePanel } from '@/widgets/AgentPipelinePanel'
import { FundFlowOutlookPanel } from '@/widgets/FundFlowOutlookPanel'
import { InsightSummaryCards } from '@/widgets/InsightSummaryCards'
import { InvestorFlowPanel } from '@/widgets/InvestorFlowPanel'
import { MarketEventTimeline } from '@/widgets/MarketEventTimeline'
import { RealtimeEventFeed } from '@/widgets/RealtimeEventFeed'
import { TopicMap } from '@/widgets/TopicMap'

export function NewsInsightsOverviewPage() {
  const navigate = useNavigate()
  const overviewQuery = useNewsOverviewQuery()
  const eventsQuery = useNewsEventsQuery()
  const topicMapQuery = useNewsTopicMapQuery()
  const events = eventsQuery.data?.flatMap((page) => page.items) ?? []

  return (
    <>
      <section className="flex flex-col gap-3 pb-4 pt-5 2xl:h-[calc(100vh-1rem)] 2xl:min-h-[57rem] 2xl:overflow-hidden">
        <header className="flex min-h-[4.25rem] flex-wrap items-end justify-between gap-4 2xl:pr-1">
          <div>
            <h1 className="text-[1.75rem] font-bold tracking-tight text-cockpit-text">
              뉴스·공시 인사이트
            </h1>
            <p className="mt-1 max-w-3xl text-xs leading-5 text-cockpit-text-muted">
              AI Agent가 뉴스·공시·실적·투자 동향을 분석해 인사이트를
              추출합니다.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 2xl:mb-0.5">
            <AgentPipelinePanel compact presentation="popover" />
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
          updatedAt={overviewQuery.dataUpdatedAt}
          compact
        />

        <div
          role="group"
          aria-label="핵심 인사이트 패널"
          className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1.15fr)] 2xl:min-h-0 2xl:flex-[1.45]"
        >
          <RealtimeEventFeed
            events={events}
            isLoading={eventsQuery.isLoading}
            isError={eventsQuery.isError}
            isFetchingNextPage={eventsQuery.isFetchingNextPage}
            isFetchNextPageError={eventsQuery.isFetchNextPageError}
            hasNextPage={eventsQuery.hasNextPage}
            onLoadMore={() => void eventsQuery.fetchNextPage()}
            onRetry={() => void eventsQuery.refetch()}
            updatedAt={eventsQuery.dataUpdatedAt}
            compact
          />
          <TopicMap
            data={topicMapQuery.data}
            isLoading={topicMapQuery.isLoading}
            isError={topicMapQuery.isError}
            onRetry={() => void topicMapQuery.refetch()}
            updatedAt={topicMapQuery.dataUpdatedAt}
            compact
          />
        </div>

        <div
          role="group"
          aria-label="시장 분석 패널"
          className="grid min-w-0 gap-3 xl:grid-cols-3 2xl:min-h-0 2xl:flex-1"
        >
          <InvestorFlowPanel
            market="KR"
            window="7d"
            title="투자자 동향"
            spanFullRow={false}
            compact
          />
          <FundFlowOutlookPanel compact />
          <MarketEventTimeline market="KR" window="30d" compact />
        </div>
      </section>

      <AgentBriefing
        data={overviewQuery.data?.briefing}
        isLoading={overviewQuery.isLoading}
        isError={overviewQuery.isError}
        onRetry={() => void overviewQuery.refetch()}
        updatedAt={overviewQuery.dataUpdatedAt}
      />
    </>
  )
}
