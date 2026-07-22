import { useNavigate, useParams } from 'react-router-dom'

import { useNewsEventDetailQuery } from '@/features/news-insights'
import { ApiError } from '@/shared/api'
import { appRoutePaths } from '@/shared/config/navigation'
import { Button, Card, ErrorState, Skeleton } from '@/shared/ui'
import { NewsEventAffectedSymbols } from '@/widgets/NewsEventAffectedSymbols'
import { NewsEventEvidenceList } from '@/widgets/NewsEventEvidenceList'
import { NewsEventHeader } from '@/widgets/NewsEventHeader'
import { NewsEventRelatedTopics } from '@/widgets/NewsEventRelatedTopics'

export function NewsEventDetailPage() {
  const { eventId = '' } = useParams<{ eventId: string }>()
  const navigate = useNavigate()
  const eventQuery = useNewsEventDetailQuery(eventId)
  const isNotFound =
    eventQuery.error instanceof ApiError &&
    eventQuery.error.code.includes('NOT_FOUND')

  return (
    <section className="flex flex-col gap-5 py-4">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-app-text-muted">
            Event intelligence
          </p>
          <h1 className="mt-1 text-3xl font-bold text-app-text">이벤트 상세</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-app-text-muted">
            시장 이벤트의 영향 종목과 연결된 원문 근거를 함께 검증합니다.
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => void navigate(appRoutePaths.news)}
        >
          뉴스 인사이트로 돌아가기
        </Button>
      </header>

      {!eventId ? (
        <Card>
          <ErrorState
            title="이벤트 식별자가 없습니다"
            description="뉴스 인사이트에서 확인할 이벤트를 다시 선택해 주세요."
          />
        </Card>
      ) : eventQuery.isLoading ? (
        <Card aria-label="이벤트 상세 불러오는 중" role="status">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="mt-4 h-12 w-2/3" />
          <Skeleton className="mt-4 h-28" />
        </Card>
      ) : eventQuery.isError ? (
        <Card>
          <ErrorState
            title={
              isNotFound
                ? '이벤트를 찾을 수 없습니다'
                : '이벤트 상세를 불러오지 못했습니다'
            }
            description={
              isNotFound
                ? '삭제되었거나 존재하지 않는 이벤트 식별자입니다.'
                : '잠시 후 다시 시도해 주세요.'
            }
            onRetry={() => void eventQuery.refetch()}
          />
        </Card>
      ) : eventQuery.data ? (
        <>
          <NewsEventHeader event={eventQuery.data} />
          <div className="grid gap-5 xl:grid-cols-2">
            <NewsEventAffectedSymbols
              symbols={eventQuery.data.affectedSymbols}
            />
            <NewsEventRelatedTopics topics={eventQuery.data.relatedTopics} />
          </div>
          <NewsEventEvidenceList evidence={eventQuery.data.evidence} />
        </>
      ) : (
        <Card>
          <ErrorState
            title="표시할 이벤트 상세가 없습니다"
            description="서버 응답에 이벤트 상세 데이터가 포함되지 않았습니다."
          />
        </Card>
      )}
    </section>
  )
}
