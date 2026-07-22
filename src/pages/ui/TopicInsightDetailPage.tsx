import { useNavigate, useParams } from 'react-router-dom'

import {
  useNewsTopicDetailQuery,
  useNewsTopicEvidenceQuery,
  useNewsTopicTrendQuery,
} from '@/features/news-insights'
import { appRoutePaths } from '@/shared/config/navigation'
import { Button } from '@/shared/ui'
import { TopicEvidenceList } from '@/widgets/TopicEvidenceList'
import { TopicSummaryHeader } from '@/widgets/TopicSummaryHeader'
import { TopicTrendChart } from '@/widgets/TopicTrendChart'

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

      <div className="grid items-start gap-5 2xl:grid-cols-[minmax(0,1.2fr)_minmax(28rem,0.8fr)]">
        <TopicTrendChart
          data={trendQuery.data}
          isLoading={trendQuery.isLoading}
          isError={trendQuery.isError}
          onRetry={() => void trendQuery.refetch()}
        />
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
      </div>
    </section>
  )
}
