import { useState } from 'react'

import type { NewsEventDetailView } from '@/features/news-insights'
import { Badge, Button, Card, EmptyState } from '@/shared/ui'

interface NewsEventEvidenceListProps {
  evidence: NewsEventDetailView['evidence']
}

type EvidenceViewMode = 'source' | 'summary'

export function NewsEventEvidenceList({
  evidence,
}: NewsEventEvidenceListProps) {
  const [viewModes, setViewModes] = useState<Record<string, EvidenceViewMode>>(
    {},
  )

  return (
    <Card aria-labelledby="news-event-evidence-title" className="p-0">
      <div className="p-panel">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-app-accent">
          Evidence
        </p>
        <h2
          id="news-event-evidence-title"
          className="mt-1 text-xl font-semibold text-app-text"
        >
          근거 문서
        </h2>
        <p className="mt-1 text-sm leading-6 text-app-text-muted">
          원문 메타데이터와 AI 분석 제공 범위를 구분해 확인합니다.
        </p>
      </div>
      {evidence.length === 0 ? (
        <EmptyState
          title="표시할 근거 문서가 없습니다"
          description="연결된 문서가 생기면 근거 역할과 원문 메타데이터를 표시합니다."
        />
      ) : (
        <ul className="divide-y divide-app-border border-t border-app-border">
          {evidence.map((item) => {
            const viewMode = viewModes[item.id] ?? 'source'
            return (
              <li key={item.id} className="p-panel">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge tone={item.evidenceRole.tone}>
                        {item.evidenceRole.label}
                      </Badge>
                      <Badge tone={item.documentType.tone}>
                        {item.documentType.label}
                      </Badge>
                    </div>
                    <h3 className="mt-3 font-semibold text-app-text">
                      {item.title}
                    </h3>
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
                  <div className="mt-4 rounded-control border border-sky-400/20 bg-sky-950/10 p-3 text-sm leading-6">
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
                  <div className="mt-4 rounded-control border border-violet-400/20 bg-violet-950/10 p-3 text-sm leading-6">
                    <strong className="text-violet-200">AI 요약</strong>
                    <p className="mt-1 text-app-text-muted">
                      문서별 AI 요약은 제공되지 않습니다. 이벤트 수준의 AI
                      요약은 상단에서 확인할 수 있습니다.
                    </p>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
