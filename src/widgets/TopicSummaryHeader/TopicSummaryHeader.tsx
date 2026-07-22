import { generatePath, useNavigate } from 'react-router-dom'

import type { NewsTopicDetailView } from '@/features/news-insights'
import { appRoutePaths } from '@/shared/config/navigation'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Skeleton,
} from '@/shared/ui'
import { CounterViewPanel } from '@/widgets/CounterViewPanel'

interface TopicSummaryHeaderProps {
  data?: NewsTopicDetailView
  isLoading: boolean
  isError: boolean
  onRetry: () => void
}

function TopicSummaryLoading() {
  return (
    <Card aria-label="토픽 요약 불러오는 중" role="status">
      <Skeleton className="h-8 w-2/3" />
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-20" />
        ))}
      </div>
    </Card>
  )
}

function InsightList({
  title,
  items,
}: {
  title: string
  items: Array<{ id: string; label: string }> | string[]
}) {
  return (
    <section>
      <h3 className="text-sm font-semibold text-app-text">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-app-text-muted">
          표시할 내용이 없습니다.
        </p>
      ) : (
        <ul className="mt-2 space-y-2 text-sm leading-6 text-app-text-muted">
          {items.map((item, index) => {
            const id = typeof item === 'string' ? `${item}-${index}` : item.id
            const label = typeof item === 'string' ? item : item.label
            return <li key={id}>• {label || '내용 없음'}</li>
          })}
        </ul>
      )}
    </section>
  )
}

export function TopicSummaryHeader({
  data,
  isLoading,
  isError,
  onRetry,
}: TopicSummaryHeaderProps) {
  const navigate = useNavigate()

  if (isLoading) return <TopicSummaryLoading />
  if (isError) {
    return (
      <Card>
        <ErrorState
          title="토픽 요약을 불러오지 못했습니다"
          description="추이와 관련 근거 패널은 계속 확인할 수 있습니다."
          onRetry={onRetry}
        />
      </Card>
    )
  }
  if (!data) {
    return (
      <Card>
        <EmptyState title="표시할 토픽 요약이 없습니다" />
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card aria-labelledby="topic-summary-title">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={data.lifecycle.tone}>{data.lifecycle.label}</Badge>
              {data.tags.map((tag) => (
                <Badge key={tag} tone="neutral">
                  #{tag}
                </Badge>
              ))}
            </div>
            <h2
              id="topic-summary-title"
              className="mt-3 text-2xl font-bold text-app-text"
            >
              {data.title}
            </h2>
            <p className="mt-2 text-sm text-app-text-muted">
              버전 {data.version} · 갱신 {data.updatedAt}
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {data.scores.map((score) => (
            <div
              key={score.id}
              aria-label={`${score.label} ${score.valuePercent}%`}
              className="rounded-control border border-app-border bg-app-surface-muted/50 p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-app-text-muted">
                  {score.label}
                </span>
                <Badge tone={score.tone}>{score.valuePercent}%</Badge>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 rounded-control border border-amber-400/20 bg-amber-950/10 px-3 py-2 text-xs leading-5 text-amber-100">
          종합 영향도는 수익률 점수가 아닌 관찰 우선순위입니다. 감성의 ‘긍정’은
          주가 상승 예상을 뜻하지 않습니다.
        </p>

        <section className="mt-6" aria-labelledby="affected-symbols-title">
          <h3
            id="affected-symbols-title"
            className="text-sm font-semibold text-app-text"
          >
            영향 종목
          </h3>
          {data.affectedSymbols.length === 0 ? (
            <p className="mt-2 text-sm text-app-text-muted">
              연결된 영향 종목이 없습니다.
            </p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {data.affectedSymbols.map((item) => (
                <Button
                  key={item.symbol}
                  variant="secondary"
                  className="h-auto min-h-0 flex-col items-start gap-1 py-2"
                  aria-label={`${item.symbol} 리서치 보기`}
                  onClick={() =>
                    void navigate(
                      generatePath(appRoutePaths.researchDetail, {
                        symbol: item.symbol,
                      }),
                    )
                  }
                >
                  <span>
                    {item.symbol} · 노출 {item.exposurePercent}%
                  </span>
                  <span className="flex gap-1">
                    <Badge tone={item.direction.tone}>
                      {item.direction.label}
                    </Badge>
                    <Badge tone={item.relationship.tone}>
                      {item.relationship.label}
                    </Badge>
                  </span>
                </Button>
              ))}
            </div>
          )}
        </section>
      </Card>

      <Card aria-labelledby="topic-insight-title">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-app-accent">
          AI insight
        </p>
        <h2
          id="topic-insight-title"
          className="mt-1 text-xl font-semibold text-app-text"
        >
          분석 요약
        </h2>
        <div className="mt-4 grid gap-5 lg:grid-cols-2">
          <section>
            <h3 className="text-sm font-semibold text-app-text">요약</h3>
            <p className="mt-2 text-sm leading-6 text-app-text-muted">
              {data.insight.summary || '표시할 요약이 없습니다.'}
            </p>
          </section>
          <section>
            <h3 className="text-sm font-semibold text-app-text">왜 중요한가</h3>
            <p className="mt-2 text-sm leading-6 text-app-text-muted">
              {data.insight.whyItMatters || '표시할 설명이 없습니다.'}
            </p>
          </section>
          <InsightList title="핵심 근거" items={data.insight.keyEvidence} />
          <InsightList title="주의 포인트" items={data.insight.riskPoints} />
        </div>
      </Card>

      <CounterViewPanel counterArguments={data.insight.counterArguments} />
    </div>
  )
}
