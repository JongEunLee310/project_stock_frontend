import { Card, EmptyState, ErrorState, Skeleton } from '@/shared/ui'

interface CounterViewPanelProps {
  counterArguments: string[]
  isLoading?: boolean
  isError?: boolean
  onRetry?: () => void
}

export function CounterViewPanel({
  counterArguments,
  isLoading = false,
  isError = false,
  onRetry,
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

  return (
    <Card
      aria-labelledby="counter-view-title"
      className="border-red-400/30 bg-red-950/10 shadow-none"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-300">
        Counter view
      </p>
      <h2
        id="counter-view-title"
        className="mt-1 text-lg font-semibold text-app-text"
      >
        반대 관점
      </h2>
      <p className="mt-1 text-sm leading-6 text-app-text-muted">
        같은 근거를 다르게 해석할 가능성과 현재 분석의 반대 논리를 함께
        확인합니다.
      </p>

      {counterArguments.length === 0 ? (
        <EmptyState
          className="px-0 pb-0"
          title="등록된 반대 관점이 없습니다"
          description="반대 근거가 확인되면 이 영역에 동일한 비중으로 표시됩니다."
        />
      ) : (
        <ul className="mt-4 space-y-2">
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
    </Card>
  )
}
