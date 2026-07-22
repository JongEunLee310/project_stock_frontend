import { useNavigate, useParams } from 'react-router-dom'

import {
  useNewsTopicDetailQuery,
  useNewsTopicEvidenceQuery,
  useNewsTopicTrendQuery,
} from '@/features/news-insights'
import { appRoutePaths } from '@/shared/config/navigation'
import { Button } from '@/shared/ui'
import { CounterViewPanel } from '@/widgets/CounterViewPanel'
import { PlannedPanelCard, type PlannedPanel } from '@/widgets/PlannedPanelCard'
import { TopicEvidenceList } from '@/widgets/TopicEvidenceList'
import { TopicInsightSummary } from '@/widgets/TopicInsightSummary'
import { TopicKeywordGraph } from '@/widgets/TopicKeywordGraph'
import { TopicSymbolSensitivity } from '@/widgets/TopicSymbolSensitivity'
import { TopicSummaryHeader } from '@/widgets/TopicSummaryHeader'
import { TopicTrendChart } from '@/widgets/TopicTrendChart'

const plannedPanels = {
  investorReaction: {
    title: '투자자 반응',
    description: '투자 주체별 수급 변화와 토픽 전후의 반응을 비교합니다.',
    phase: '2차',
    issue: '#264',
  },
  fundFlowScenario: {
    title: '예상 자금 흐름 시나리오',
    description:
      '낙관·기준·보수 시나리오별 예상 범위와 전제 조건을 제공합니다.',
    phase: '3차',
    issue: '#267',
  },
  explanation: {
    title: '왜 이런 인사이트',
    description:
      'AI Agent의 분석 단계와 주요 요인 기여도를 근거와 함께 설명합니다.',
    phase: '3차',
    issue: '#268',
  },
  actionChecklist: {
    title: '액션 체크리스트',
    description:
      '관련 종목 리서치, 포트폴리오 확인, 알림과 판단 기록을 한곳에서 점검합니다.',
    phase: '3차',
    issue: '#268',
  },
} as const satisfies Record<string, PlannedPanel>

export function TopicInsightDetailPage() {
  const { topicId = '' } = useParams<{ topicId: string }>()
  const navigate = useNavigate()
  const detailQuery = useNewsTopicDetailQuery(topicId)
  const trendQuery = useNewsTopicTrendQuery(topicId)
  const evidenceQuery = useNewsTopicEvidenceQuery(topicId)
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
        <PlannedPanelCard panel={plannedPanels.investorReaction} />
        <PlannedPanelCard panel={plannedPanels.fundFlowScenario} />

        <TopicSymbolSensitivity topicId={topicId} />

        <PlannedPanelCard panel={plannedPanels.explanation} />
        <PlannedPanelCard panel={plannedPanels.actionChecklist} />
        <CounterViewPanel
          counterArguments={detailQuery.data?.insight.counterArguments ?? []}
          isLoading={detailQuery.isLoading}
          isError={detailQuery.isError}
          onRetry={() => void detailQuery.refetch()}
        />
      </div>
    </section>
  )
}
