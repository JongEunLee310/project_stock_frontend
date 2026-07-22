import { useNavigate, useParams } from 'react-router-dom'

import {
  useNewsTopicDetailQuery,
  useNewsTopicEvidenceQuery,
  useNewsTopicExplanationQuery,
  useNewsTopicTrendQuery,
} from '@/features/news-insights'
import { appRoutePaths } from '@/shared/config/navigation'
import { Button } from '@/shared/ui'
import { CounterViewPanel } from '@/widgets/CounterViewPanel'
import { FundFlowScenarioPanel } from '@/widgets/FundFlowScenarioPanel'
import { InvestorFlowPanel } from '@/widgets/InvestorFlowPanel'
import { InsightExplanationPanel } from '@/widgets/InsightExplanationPanel'
import { PlannedPanelCard, type PlannedPanel } from '@/widgets/PlannedPanelCard'
import { TopicEvidenceList } from '@/widgets/TopicEvidenceList'
import { TopicInsightSummary } from '@/widgets/TopicInsightSummary'
import { TopicKeywordGraph } from '@/widgets/TopicKeywordGraph'
import { TopicSymbolSensitivity } from '@/widgets/TopicSymbolSensitivity'
import { TopicSummaryHeader } from '@/widgets/TopicSummaryHeader'
import { TopicTrendChart } from '@/widgets/TopicTrendChart'

const plannedPanels = {
  actionChecklist: {
    title: '액션 체크리스트',
    description:
      '관련 종목 리서치, 포트폴리오 확인, 알림과 판단 기록을 한곳에서 점검합니다.',
    phase: '3차',
    issue: '#270',
  },
} as const satisfies Record<string, PlannedPanel>

export function TopicInsightDetailPage() {
  const { topicId = '' } = useParams<{ topicId: string }>()
  const navigate = useNavigate()
  const detailQuery = useNewsTopicDetailQuery(topicId)
  const trendQuery = useNewsTopicTrendQuery(topicId)
  const evidenceQuery = useNewsTopicEvidenceQuery(topicId)
  const explanationQuery = useNewsTopicExplanationQuery(topicId)
  const evidence = evidenceQuery.data?.flatMap((page) => page.items) ?? []

  return (
    <section className="flex flex-col gap-5 py-4">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-app-text-muted">
            Topic intelligence
          </p>
          <h1 className="mt-1 text-3xl font-bold text-app-text">
            토픽 인사이트 상세
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-app-text-muted">
            중요해진 이유, 영향 종목, 뒷받침 근거와 반대 관점을 함께 검증합니다.
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => void navigate(appRoutePaths.news)}
        >
          뉴스 인사이트로 돌아가기
        </Button>
      </header>

      {!topicId ? (
        <p role="alert" className="text-sm text-red-300">
          토픽 식별자가 없어 상세 정보를 요청할 수 없습니다.
        </p>
      ) : null}

      <TopicSummaryHeader
        data={detailQuery.data}
        isLoading={detailQuery.isLoading}
        isError={detailQuery.isError}
        onRetry={() => void detailQuery.refetch()}
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <TopicInsightSummary
          data={detailQuery.data}
          isLoading={detailQuery.isLoading}
          isError={detailQuery.isError}
          onRetry={() => void detailQuery.refetch()}
        />
        <TopicTrendChart
          data={trendQuery.data}
          isLoading={trendQuery.isLoading}
          isError={trendQuery.isError}
          onRetry={() => void trendQuery.refetch()}
        />
        <TopicKeywordGraph topicId={topicId} />

        <TopicEvidenceList
          evidence={evidence}
          isLoading={evidenceQuery.isLoading}
          isError={evidenceQuery.isError}
          isFetchingNextPage={evidenceQuery.isFetchingNextPage}
          isFetchNextPageError={evidenceQuery.isFetchNextPageError}
          hasNextPage={evidenceQuery.hasNextPage}
          onLoadMore={() => void evidenceQuery.fetchNextPage()}
          onRetry={() => void evidenceQuery.refetch()}
        />
        <InvestorFlowPanel
          market="KR"
          window="7d"
          topicId={topicId}
          title="투자자 반응"
          context="이 토픽의 영향 종목군에서 나타난 투자 주체별 수급 반응을 비교합니다."
        />
        <FundFlowScenarioPanel topicId={topicId} />

        <TopicSymbolSensitivity topicId={topicId} />

        <InsightExplanationPanel
          data={explanationQuery.data}
          isLoading={explanationQuery.isLoading}
          isError={explanationQuery.isError}
          onRetry={() => void explanationQuery.refetch()}
        />
        <PlannedPanelCard panel={plannedPanels.actionChecklist} />
        <CounterViewPanel
          counterArguments={detailQuery.data?.insight.counterArguments ?? []}
          explanation={explanationQuery.data}
          isLoading={detailQuery.isLoading}
          isError={detailQuery.isError}
          isExplanationLoading={explanationQuery.isLoading}
          isExplanationError={explanationQuery.isError}
          onRetry={() => void detailQuery.refetch()}
          onExplanationRetry={() => void explanationQuery.refetch()}
        />
      </div>
    </section>
  )
}
