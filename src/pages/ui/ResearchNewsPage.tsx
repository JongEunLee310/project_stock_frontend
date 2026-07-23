import { generatePath, Link, useParams } from 'react-router-dom'

import { useNewsEventsQuery } from '@/features/news-insights'
import { appRoutePaths } from '@/shared/config/navigation'
import { EmptyState } from '@/shared/ui'
import { RealtimeEventFeed } from '@/widgets/RealtimeEventFeed'

function getResearchSymbol(symbol: string | undefined) {
  return symbol?.trim().toUpperCase() ?? ''
}

function SymbolNewsFeed({ symbol }: { symbol: string }) {
  const eventsQuery = useNewsEventsQuery({ symbols: [symbol] })
  const events = eventsQuery.data?.flatMap((page) => page.items) ?? []

  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link
          to={generatePath(appRoutePaths.researchDetail, { symbol })}
          className="inline-flex min-h-8 items-center rounded-control px-1 text-sm font-semibold text-app-text-muted transition-colors hover:text-app-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent"
        >
          <span aria-hidden="true">‹</span>&nbsp;{symbol} 리서치
        </Link>
        <h1 className="mt-2 text-3xl font-bold text-app-text">
          뉴스 및 공시 — {symbol}
        </h1>
      </header>

      <RealtimeEventFeed
        events={events}
        isLoading={eventsQuery.isLoading}
        isError={eventsQuery.isError}
        isFetchingNextPage={eventsQuery.isFetchingNextPage}
        isFetchNextPageError={eventsQuery.isFetchNextPageError}
        hasNextPage={eventsQuery.hasNextPage}
        onLoadMore={() => void eventsQuery.fetchNextPage()}
        onRetry={() => void eventsQuery.refetch()}
        updatedAt={eventsQuery.dataUpdatedAt}
        title={`${symbol} 뉴스·공시 이벤트`}
        description={`${symbol} 관련 뉴스와 공시를 시장 이벤트 단위로 확인합니다.`}
        showSymbolColumn={false}
      />
    </div>
  )
}

export function ResearchNewsPage() {
  const { symbol } = useParams<{ symbol: string }>()
  const displaySymbol = getResearchSymbol(symbol)

  if (!displaySymbol) {
    return (
      <EmptyState
        title="종목 정보가 없습니다"
        description="리서치 목록에서 종목을 선택해 주세요."
      />
    )
  }

  return <SymbolNewsFeed symbol={displaySymbol} />
}
