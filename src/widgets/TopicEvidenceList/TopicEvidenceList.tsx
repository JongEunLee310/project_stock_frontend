import { useState } from 'react'

import type { NewsTopicEvidenceView } from '@/features/news-insights'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  PanelHeader,
  PanelFreshness,
  Skeleton,
} from '@/shared/ui'

interface TopicEvidenceListProps {
  evidence: NewsTopicEvidenceView[]
  isLoading: boolean
  isError: boolean
  isFetchingNextPage: boolean
  isFetchNextPageError: boolean
  hasNextPage: boolean
  onLoadMore: () => void
  onRetry: () => void
  updatedAt?: number
}

type EvidenceViewMode = 'source' | 'summary'

export function TopicEvidenceList({
  evidence,
  isLoading,
  isError,
  isFetchingNextPage,
  isFetchNextPageError,
  hasNextPage,
  onLoadMore,
  onRetry,
  updatedAt,
}: TopicEvidenceListProps) {
  const [viewModes, setViewModes] = useState<Record<string, EvidenceViewMode>>(
    {},
  )

  if (isLoading) {
    return (
      <Card aria-label="관련 근거 불러오는 중" role="status">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-4 h-36" />
      </Card>
    )
  }
  if (isError && evidence.length === 0) {
    return (
      <Card>
        <ErrorState
          title="관련 근거를 불러오지 못했습니다"
          description="토픽 요약과 추이 패널은 계속 확인할 수 있습니다."
          onRetry={onRetry}
        />
      </Card>
    )
  }

  return (
    <Card aria-labelledby="topic-evidence-title" className="p-0">
      <PanelHeader
        className="p-panel"
        title="관련 근거"
        titleId="topic-evidence-title"
        controls={<PanelFreshness updatedAt={updatedAt} />}
      />

      {evidence.length === 0 ? (
        <EmptyState
          title="표시할 관련 근거가 없습니다"
          description="연결된 문서가 생기면 근거 역할과 함께 표시됩니다."
        />
      ) : (
        <ul className="divide-y divide-app-border border-t border-app-border">
          {evidence.map((item) => {
            const viewMode = viewModes[item.id] ?? 'source'
            return (
              <li key={item.id} className="px-panel py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge tone={item.evidenceRole.tone}>
                        {item.evidenceRole.label}
                      </Badge>
                      <Badge tone={item.documentType.tone}>
                        {item.documentType.label}
                      </Badge>
                      <Badge tone={item.direction.tone}>
                        감성 {item.direction.label}
                      </Badge>
                    </div>
                    <h3 className="mt-3 font-semibold text-app-text">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-xs text-app-text-muted">
                      {item.symbol} · 관련도 {item.relevancePercent}% · 이벤트 #
                      {item.eventId}
                    </p>
                  </div>
                  <div
                    className="flex gap-2"
                    aria-label={`${item.title} 보기 방식`}
                  >
                    <Button
                      variant={viewMode === 'source' ? 'selected' : 'ghost'}
                      aria-pressed={viewMode === 'source'}
                      onClick={() =>
                        setViewModes((current) => ({
                          ...current,
                          [item.id]: 'source',
                        }))
                      }
                    >
                      원문 보기
                    </Button>
                    <Button
                      variant={viewMode === 'summary' ? 'selected' : 'ghost'}
                      aria-pressed={viewMode === 'summary'}
                      onClick={() =>
                        setViewModes((current) => ({
                          ...current,
                          [item.id]: 'summary',
                        }))
                      }
                    >
                      AI 요약 보기
                    </Button>
                  </div>
                </div>

                {viewMode === 'source' ? (
                  <div className="mt-3 border-t border-app-border pt-3 text-sm leading-6">
                    <strong className="text-sky-200">원문 정보</strong>
                    <p className="mt-1 text-app-text-muted">
                      {item.source} · {item.publishedAt} · 문서 #
                      {item.documentId}
                    </p>
                    <p className="mt-2 text-xs text-app-text-muted">
                      API가 원문 URL·본문을 제공하지 않아 출처 메타데이터만
                      표시합니다.
                    </p>
                  </div>
                ) : (
                  <div className="mt-3 border-t border-app-border pt-3 text-sm leading-6">
                    <strong className="text-violet-200">AI 요약</strong>
                    <p className="mt-1 text-app-text-muted">
                      {item.summary || '제공된 AI 요약이 없습니다.'}
                    </p>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {evidence.length > 0 && (hasNextPage || isFetchNextPageError) ? (
        <div className="flex flex-col items-center gap-2 border-t border-app-border p-4">
          {isFetchNextPageError ? (
            <p role="alert" className="text-sm text-red-300">
              다음 근거를 불러오지 못했습니다. 다시 시도해 주세요.
            </p>
          ) : null}
          <Button
            variant="secondary"
            disabled={isFetchingNextPage}
            onClick={onLoadMore}
          >
            {isFetchingNextPage ? '불러오는 중…' : '근거 더 보기'}
          </Button>
        </div>
      ) : null}
    </Card>
  )
}
