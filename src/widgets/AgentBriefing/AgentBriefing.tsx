import { useState } from 'react'
import { FiX } from 'react-icons/fi'

import type { NewsOverviewView } from '@/features/news-insights'
import { Badge, Card, EmptyState, ErrorState, Skeleton } from '@/shared/ui'

interface AgentBriefingProps {
  data?: NewsOverviewView['briefing']
  isLoading: boolean
  isError: boolean
  onRetry: () => void
}

function BriefingBody({
  data,
  isLoading,
  isError,
  onRetry,
}: AgentBriefingProps) {
  if (isLoading) {
    return (
      <div role="status" className="mt-4" aria-label="브리핑 불러오는 중">
        <span className="sr-only">에이전트 브리핑을 불러오는 중입니다.</span>
        <Skeleton lines={4} />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="mt-4">
        <ErrorState
          title="에이전트 브리핑을 불러오지 못했습니다"
          description="브리핑 데이터만 다시 요청할 수 있습니다."
          onRetry={onRetry}
        />
      </div>
    )
  }

  if (data && !data.summary && !data.highlights.length) {
    return (
      <div className="mt-4">
        <EmptyState title="생성된 브리핑이 없습니다" />
      </div>
    )
  }

  if (data && (data.summary || data.highlights.length)) {
    return (
      <>
        {data.summary ? (
          <p className="mt-4 rounded-control border border-violet-400/20 bg-violet-400/5 p-4 text-sm leading-6 text-app-text">
            {data.summary}
          </p>
        ) : null}

        <ul className="mt-4 space-y-3">
          {data.highlights.map((highlight) => (
            <li key={highlight.id} className="flex items-start gap-3 text-sm">
              <span className="mt-1 text-violet-300" aria-hidden="true">
                •
              </span>
              <p className="min-w-0 flex-1 leading-6 text-app-text-muted">
                {highlight.text}
              </p>
              <Badge tone="neutral">근거 {highlight.evidenceCount}건</Badge>
            </li>
          ))}
        </ul>
      </>
    )
  }

  return null
}

export function AgentBriefing(props: AgentBriefingProps) {
  const { data } = props
  const [open, setOpen] = useState(false)

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
      {open ? (
        <Card
          role="dialog"
          aria-labelledby="agent-briefing-title"
          className="max-h-[70vh] w-[min(24rem,calc(100vw-3rem))] overflow-y-auto shadow-xl"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Badge tone="accent">AI 분석</Badge>
                {data ? (
                  <span className="text-xs text-app-text-muted">
                    생성 {data.generatedAt}
                  </span>
                ) : null}
              </div>
              <h2
                id="agent-briefing-title"
                className="mt-3 text-xl font-semibold text-app-text"
              >
                에이전트 브리핑
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="브리핑 접기"
              className="rounded-control p-1.5 text-app-text-muted transition-colors hover:bg-app-surface-muted hover:text-app-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent"
            >
              <FiX className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <BriefingBody {...props} />
        </Card>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={open ? '에이전트 브리핑 닫기' : '에이전트 브리핑 열기'}
        className="relative inline-flex h-14 w-14 items-center justify-center rounded-full border border-violet-400/40 bg-violet-500 text-2xl text-white shadow-lg transition-colors hover:bg-violet-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent"
      >
        <span aria-hidden="true">✦</span>
        {!open && data && data.highlights.length > 0 ? (
          <span
            className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-semibold text-white"
            aria-hidden="true"
          >
            {data.highlights.length}
          </span>
        ) : null}
      </button>
    </div>
  )
}
