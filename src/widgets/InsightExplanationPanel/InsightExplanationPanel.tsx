import { useNewsTopicExplanationQuery } from '@/features/news-insights'
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  PanelFreshness,
  Skeleton,
} from '@/shared/ui'

interface InsightExplanationPanelProps {
  topicId: string
}

const percentFormatter = new Intl.NumberFormat('ko-KR', {
  style: 'percent',
  maximumFractionDigits: 1,
})

function TextItems({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-app-text-muted">{title}</dt>
      <dd className="mt-1 text-sm leading-6 text-app-text">
        {items.length > 0 ? items.join(' · ') : '없음'}
      </dd>
    </div>
  )
}

export function InsightExplanationPanel({
  topicId,
}: InsightExplanationPanelProps) {
  const explanationQuery = useNewsTopicExplanationQuery(topicId)
  const data = explanationQuery.data

  if (explanationQuery.isLoading) {
    return (
      <Card aria-label="인사이트 설명 불러오는 중" role="status">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="mt-4 h-40" />
      </Card>
    )
  }

  if (explanationQuery.isError) {
    return (
      <Card>
        <ErrorState
          title="인사이트 설명을 불러오지 못했습니다"
          description="아직 분석되지 않은 토픽일 수 있습니다. 다른 패널은 계속 확인할 수 있습니다."
          onRetry={() => void explanationQuery.refetch()}
        />
      </Card>
    )
  }

  return (
    <Card aria-labelledby="insight-explanation-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
            Explanation
          </p>
          <h2
            id="insight-explanation-title"
            className="mt-1 text-lg font-semibold text-app-text"
          >
            왜 이런 인사이트가 나왔나
          </h2>
          <p className="mt-1 text-sm leading-6 text-app-text-muted">
            서버 분석 결과의 요인별 기여 비율과 데이터 상태를 표시합니다.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {data ? (
            <Badge tone="accent">
              AI 분석 · 신뢰도 {data.meta.confidencePercent}%
            </Badge>
          ) : null}
          <PanelFreshness updatedAt={explanationQuery.dataUpdatedAt} />
        </div>
      </div>

      {!data || data.factors.length === 0 ? (
        <EmptyState
          className="px-0 pb-0"
          title="표시할 기여 요인이 없습니다"
          description="분석 요인이 제공되면 서버가 산출한 비율을 그대로 표시합니다."
        />
      ) : (
        <ul className="mt-5 space-y-4" aria-label="인사이트 기여 요인">
          {data.factors.map((factor, index) => {
            const percentLabel = percentFormatter.format(
              factor.contributionRatio,
            )
            return (
              <li key={`${factor.label}-${index}`}>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium text-app-text">
                    {factor.label}
                  </span>
                  <span className="font-semibold text-violet-200">
                    {percentLabel}
                  </span>
                </div>
                <div
                  className="mt-2 h-2 overflow-hidden rounded-full bg-app-surface-muted"
                  role="meter"
                  aria-label={`${factor.label} 기여도 ${percentLabel}`}
                  aria-valuemin={0}
                  aria-valuemax={1}
                  aria-valuenow={factor.contributionRatio}
                >
                  <div
                    className="h-full rounded-full bg-violet-400"
                    style={{ width: percentLabel }}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {data ? (
        <dl className="mt-5 grid gap-4 border-t border-app-border pt-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold text-app-text-muted">
              분석 버전
            </dt>
            <dd className="mt-1 text-sm text-app-text">
              {data.meta.analysisVersion}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-app-text-muted">
              데이터 범위
            </dt>
            <dd className="mt-1 text-sm text-app-text">
              수집 대상의 {data.meta.dataCoveragePercent}% 포함
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-app-text-muted">
              마지막 갱신
            </dt>
            <dd className="mt-1 text-sm text-app-text">
              {data.meta.lastUpdated}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-app-text-muted">
              반대 근거 수
            </dt>
            <dd className="mt-1 text-sm text-app-text">
              {data.meta.counterArgumentCount}건
            </dd>
          </div>
          <TextItems title="누락 데이터" items={data.meta.missingData} />
          <TextItems title="분석 한계" items={data.meta.limitations} />
        </dl>
      ) : null}
    </Card>
  )
}
