import type { NewsTopicExplanationView } from '@/features/news-insights'
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  PanelHeader,
  PanelFreshness,
  Skeleton,
} from '@/shared/ui'

interface CounterViewPanelProps {
  counterArguments: string[]
  explanation?: NewsTopicExplanationView
  isLoading?: boolean
  isError?: boolean
  isExplanationLoading?: boolean
  isExplanationError?: boolean
  onRetry?: () => void
  onExplanationRetry?: () => void
  updatedAt?: number
}

function AnalysisList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-app-text">{title}</h3>
      {items.length > 0 ? (
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm leading-6 text-app-text-muted">
          {items.map((item, index) => (
            <li key={`${item}-${index}`}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-app-text-muted">제공된 항목 없음</p>
      )}
    </div>
  )
}

function ExplanationUnavailable({
  isLoading,
  isError,
  onRetry,
}: {
  isLoading: boolean
  isError: boolean
  onRetry?: () => void
}) {
  if (isLoading) {
    return (
      <div role="status" aria-label="반대 관점 확장 근거 불러오는 중">
        <Skeleton className="h-20 w-full" />
      </div>
    )
  }

  if (isError) {
    return (
      <ErrorState
        className="px-0 py-3"
        title="확장 근거를 불러오지 못했습니다"
        description="기본 반대 관점은 계속 확인할 수 있습니다. 아직 분석되지 않은 토픽일 수 있습니다."
        onRetry={onRetry}
      />
    )
  }

  return (
    <p className="text-sm text-app-text-muted">
      현재 제공된 확장 근거가 없습니다.
    </p>
  )
}

function hasExtendedCounterView(explanation: NewsTopicExplanationView) {
  const counterView = explanation.counterView
  return (
    counterView.counterArguments.length > 0 ||
    counterView.invalidationConditions.length > 0 ||
    counterView.alreadyPricedIn.likely ||
    counterView.alreadyPricedIn.note !== null ||
    counterView.contradictingEvidence.length > 0
  )
}

export function CounterViewPanel({
  counterArguments,
  explanation,
  isLoading = false,
  isError = false,
  isExplanationLoading = false,
  isExplanationError = false,
  onRetry,
  onExplanationRetry,
  updatedAt,
}: CounterViewPanelProps) {
  if (isLoading) {
    return (
      <Card aria-label="반대 관점 불러오는 중" role="status">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="mt-4 h-24" />
      </Card>
    )
  }
  if (isError) {
    return (
      <Card className="border-red-400/30 bg-red-950/10 shadow-none">
        <ErrorState
          title="반대 관점을 불러오지 못했습니다"
          description="추이와 관련 근거 패널은 계속 확인할 수 있습니다."
          onRetry={onRetry}
        />
      </Card>
    )
  }

  const hasExplanation = explanation
    ? hasExtendedCounterView(explanation)
    : false

  return (
    <Card
      aria-labelledby="counter-view-title"
      className="border-red-400/30 bg-red-950/10 shadow-none"
    >
      <PanelHeader
        title="반대 관점"
        titleId="counter-view-title"
        titleClassName="text-lg"
        controls={
          <>
            <PanelFreshness updatedAt={updatedAt} />
            {explanation ? (
              <Badge tone="accent">
                AI 확장 분석 · 신뢰도 {explanation.meta.confidencePercent}%
              </Badge>
            ) : null}
          </>
        }
      />

      <section className="mt-5" aria-labelledby="base-counter-title">
        <h3
          id="base-counter-title"
          className="text-sm font-semibold text-app-text"
        >
          기본 반대 근거
        </h3>
        <p className="mt-1 text-xs text-app-text-muted">
          토픽 1차 분석에서 제공한 기본 관점입니다.
        </p>
        {counterArguments.length === 0 ? (
          <EmptyState
            className="px-0 pb-0"
            title="등록된 반대 관점이 없습니다"
            description="반대 근거가 확인되면 이 영역에 동일한 비중으로 표시됩니다."
          />
        ) : (
          <ul className="mt-3 space-y-2">
            {counterArguments.map((argument, index) => (
              <li
                key={`${argument}-${index}`}
                className="rounded-control border border-red-400/20 bg-app-surface/70 px-3 py-2 text-sm leading-6 text-app-text"
              >
                {argument || '내용 없음'}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section
        className="mt-5 border-t border-red-400/20 pt-5"
        aria-labelledby="extended-counter-title"
      >
        <div className="flex flex-wrap items-center gap-2">
          <h3
            id="extended-counter-title"
            className="text-sm font-semibold text-app-text"
          >
            확장 분석
          </h3>
          <Badge tone="accent">AI 분석</Badge>
        </div>
        <p className="mt-1 text-xs text-app-text-muted">
          무효화 조건과 반대 문서 근거를 포함한 추가 분석입니다.
        </p>

        {!explanation || !hasExplanation ? (
          <div className="mt-3">
            <ExplanationUnavailable
              isLoading={isExplanationLoading}
              isError={isExplanationError}
              onRetry={onExplanationRetry}
            />
          </div>
        ) : (
          <div className="mt-4 grid gap-5 lg:grid-cols-2">
            <AnalysisList
              title="추가 반대 논리"
              items={explanation.counterView.counterArguments}
            />
            <AnalysisList
              title="분석 무효화 조건"
              items={explanation.counterView.invalidationConditions}
            />

            <div>
              <h3 className="text-sm font-semibold text-app-text">
                시장 선반영 가능성
              </h3>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge
                  tone={
                    explanation.counterView.alreadyPricedIn.likely
                      ? 'warning'
                      : 'neutral'
                  }
                >
                  {explanation.counterView.alreadyPricedIn.likely
                    ? '선반영 가능성 있음'
                    : '선반영 가능성 낮음'}
                </Badge>
                <span className="text-sm leading-6 text-app-text-muted">
                  {explanation.counterView.alreadyPricedIn.note ??
                    '제공된 설명 없음'}
                </span>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-app-text">
                반대 원문 근거
              </h3>
              {explanation.counterView.contradictingEvidence.length > 0 ? (
                <ul className="mt-2 divide-y divide-app-border">
                  {explanation.counterView.contradictingEvidence.map(
                    (evidence) => (
                      <li key={evidence.id} className="py-3">
                        <div className="flex flex-wrap gap-2">
                          <Badge tone="danger">상충 근거</Badge>
                          <Badge tone="info">원문 메타</Badge>
                        </div>
                        <p className="mt-2 text-sm font-medium text-app-text">
                          {evidence.title}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-app-text-muted">
                          {evidence.source} · {evidence.publishedAt} · 이벤트 #
                          {evidence.eventId} · 문서 #{evidence.documentId}
                        </p>
                      </li>
                    ),
                  )}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-app-text-muted">
                  제공된 상충 근거 없음
                </p>
              )}
            </div>
          </div>
        )}
      </section>
    </Card>
  )
}
