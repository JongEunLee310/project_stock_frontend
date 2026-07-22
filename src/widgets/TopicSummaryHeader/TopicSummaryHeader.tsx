import { FiCpu } from 'react-icons/fi'
import { generatePath, useNavigate } from 'react-router-dom'

import type {
  NewsTopicDetailView,
  TopicScoreView,
} from '@/features/news-insights'
import { appRoutePaths } from '@/shared/config/navigation'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  PanelFreshness,
  Skeleton,
} from '@/shared/ui'

interface TopicSummaryHeaderProps {
  data?: NewsTopicDetailView
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  updatedAt?: number
}

function TopicSummaryLoading() {
  return (
    <Card aria-label="토픽 요약 불러오는 중" role="status">
      <Skeleton className="h-10 w-2/3" />
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-24" />
        ))}
      </div>
    </Card>
  )
}

function ScoreStat({ score }: { score?: TopicScoreView }) {
  if (!score) {
    return (
      <div className="rounded-control border border-app-border bg-app-surface-muted/50 p-3">
        <span className="text-sm text-app-text-muted">정보 없음</span>
      </div>
    )
  }

  if (score.id === 'sentiment') {
    const direction = score.direction
    return (
      <div
        aria-label={`${score.label} ${direction?.label ?? `${score.valuePercent}%`} ${direction?.trendLabel ?? ''}`.trim()}
        className="rounded-control border border-app-border bg-app-surface-muted/50 p-3"
      >
        <p className="text-xs font-semibold text-app-text-muted">
          {score.label}
        </p>
        <div className="mt-2 flex items-end justify-between gap-2">
          <div>
            <strong className="text-2xl text-app-text">
              {direction?.label ?? `${score.valuePercent}%`}
            </strong>
            {direction ? (
              <p className="mt-1 text-xs text-app-text-muted">
                {direction.trendLabel} 방향
              </p>
            ) : null}
          </div>
          {direction ? (
            <Badge tone={score.tone} className="text-base" aria-hidden="true">
              {direction.indicator}
            </Badge>
          ) : null}
        </div>
      </div>
    )
  }

  const suffix = score.id === 'impact' ? '/100' : '%'
  return (
    <div
      aria-label={`${score.label} ${score.valuePercent}${suffix}`}
      className="rounded-control border border-app-border bg-app-surface-muted/50 p-3"
    >
      <p className="text-xs font-semibold text-app-text-muted">{score.label}</p>
      <strong className="mt-2 block text-2xl text-app-text">
        {score.valuePercent}
        <span className="ml-1 text-sm font-medium text-app-text-muted">
          {suffix}
        </span>
      </strong>
    </div>
  )
}

export function TopicSummaryHeader({
  data,
  isLoading,
  isError,
  onRetry,
  updatedAt,
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

  const impactScore = data.scores.find((score) => score.id === 'impact')
  const sentimentScore = data.scores.find((score) => score.id === 'sentiment')
  const confidenceScore = data.scores.find((score) => score.id === 'confidence')
  const firstAffectedSymbol = data.affectedSymbols[0]?.symbol

  return (
    <Card aria-labelledby="topic-summary-title" className="overflow-hidden p-0">
      <div className="p-panel">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <span
              aria-hidden="true"
              className="flex size-14 shrink-0 items-center justify-center rounded-full border border-violet-400/30 bg-violet-500/10 text-2xl text-violet-300"
            >
              <FiCpu />
            </span>
            <div className="min-w-0">
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
              <p className="mt-2 text-xs text-app-text-muted">
                버전 {data.version} · 갱신 {data.updatedAt}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3">
            <PanelFreshness updatedAt={updatedAt} />
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                variant="secondary"
                disabled={!firstAffectedSymbol}
                onClick={() => {
                  if (!firstAffectedSymbol) return
                  void navigate(
                    generatePath(appRoutePaths.researchDetail, {
                      symbol: firstAffectedSymbol,
                    }),
                  )
                }}
              >
                관련 종목 보기
              </Button>
              <Button variant="secondary" disabled title="준비 중">
                포트폴리오 영향 보기
              </Button>
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
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <ScoreStat score={impactScore} />
          <ScoreStat score={sentimentScore} />
          <ScoreStat score={confidenceScore} />
        </div>

        <section className="mt-5" aria-labelledby="affected-symbols-title">
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
                  className="h-auto min-h-0 gap-2 px-3 py-2"
                  aria-label={`${item.symbol} 리서치 보기`}
                  onClick={() =>
                    void navigate(
                      generatePath(appRoutePaths.researchDetail, {
                        symbol: item.symbol,
                      }),
                    )
                  }
                >
                  <span>{item.symbol}</span>
                  <Badge tone={item.direction.tone}>
                    {item.direction.label}
                  </Badge>
                  <Badge tone={item.relationship.tone}>
                    {item.relationship.label}
                  </Badge>
                  <span className="text-xs text-app-text-muted">
                    노출 {item.exposurePercent}%
                  </span>
                </Button>
              ))}
            </div>
          )}
        </section>

        <p className="mt-4 rounded-control border border-amber-400/20 bg-amber-950/10 px-3 py-2 text-xs leading-5 text-amber-100">
          종합 영향도는 수익률 점수가 아닌 관찰 우선순위입니다. 감성의 ‘긍정’은
          주가 상승 예상을 뜻하지 않습니다.
        </p>
      </div>

      <div className="border-t border-app-border bg-app-surface-muted/30 px-panel py-3 text-sm leading-6 text-app-text-muted">
        <strong className="mr-3 text-violet-300">AI 요약</strong>
        {data.insight.summary || '표시할 요약이 없습니다.'}
      </div>
    </Card>
  )
}
