import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import {
  useAssetIdBySymbol,
  useNewsDisclosure,
} from '@/features/research/queries'
import { appRoutePaths } from '@/shared/config/navigation'
import { Card, EmptyState, ErrorState, Skeleton } from '@/shared/ui'
import { NewsDisclosureList } from '@/widgets/NewsDisclosureList'

type NewsDisclosureTab = 'news' | 'disclosures'

const tabIds: Record<NewsDisclosureTab, { tab: string; panel: string }> = {
  news: {
    tab: 'research-news-page-news-tab',
    panel: 'research-news-page-panel',
  },
  disclosures: {
    tab: 'research-news-page-disclosures-tab',
    panel: 'research-news-page-panel',
  },
}

function getResearchSymbol(symbol: string | undefined) {
  return symbol?.trim().toUpperCase() || 'UNKNOWN'
}

export function ResearchNewsPage() {
  const { symbol } = useParams<{ symbol: string }>()
  const displaySymbol = getResearchSymbol(symbol)
  const [activeTab, setActiveTab] = useState<NewsDisclosureTab>('news')
  const assetIdQuery = useAssetIdBySymbol(displaySymbol)
  const newsDisclosureQuery = useNewsDisclosure(assetIdQuery.data)
  const items = newsDisclosureQuery.data?.[activeTab] ?? []
  const isNewsTab = activeTab === 'news'
  const researchPath = appRoutePaths.researchDetail.replace(
    ':symbol',
    displaySymbol,
  )

  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link
          to={researchPath}
          className="inline-flex min-h-8 items-center rounded-control px-1 text-sm font-semibold text-app-text-muted transition-colors hover:text-app-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent"
        >
          <span aria-hidden="true">‹</span>&nbsp;{displaySymbol} 리서치
        </Link>
        <h1 className="mt-2 text-3xl font-bold text-app-text">
          뉴스 및 공시 — {displaySymbol}
        </h1>
      </header>

      <Card>
        <div
          className="flex gap-5 border-b border-app-border"
          role="tablist"
          aria-label="뉴스 및 공시"
        >
          <button
            id={tabIds.news.tab}
            role="tab"
            type="button"
            aria-selected={isNewsTab}
            aria-controls={tabIds.news.panel}
            className={`-mb-px border-b-2 px-1 pb-2.5 pt-1 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent ${
              isNewsTab
                ? 'border-app-accent font-bold text-app-accent'
                : 'border-transparent font-semibold text-app-text-muted hover:text-app-text'
            }`}
            onClick={() => setActiveTab('news')}
          >
            뉴스
          </button>
          <button
            id={tabIds.disclosures.tab}
            role="tab"
            type="button"
            aria-selected={!isNewsTab}
            aria-controls={tabIds.disclosures.panel}
            className={`-mb-px border-b-2 px-1 pb-2.5 pt-1 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent ${
              !isNewsTab
                ? 'border-app-accent font-bold text-app-accent'
                : 'border-transparent font-semibold text-app-text-muted hover:text-app-text'
            }`}
            onClick={() => setActiveTab('disclosures')}
          >
            공시
          </button>
        </div>
        <div
          id={tabIds[activeTab].panel}
          role="tabpanel"
          aria-labelledby={tabIds[activeTab].tab}
        >
          {assetIdQuery.isLoading || newsDisclosureQuery.isLoading ? (
            <Skeleton className="mt-4" lines={8} />
          ) : assetIdQuery.isError ? (
            <ErrorState
              title="종목 정보를 불러오지 못했습니다"
              description={assetIdQuery.error.message}
              onRetry={() => void assetIdQuery.refetch()}
              className="py-6"
            />
          ) : newsDisclosureQuery.isError ? (
            <ErrorState
              title="뉴스 및 공시를 불러오지 못했습니다"
              description={newsDisclosureQuery.error.message}
              onRetry={() => void newsDisclosureQuery.refetch()}
              className="py-6"
            />
          ) : items.length > 0 ? (
            <NewsDisclosureList items={items} variant="full" />
          ) : (
            <EmptyState
              title={`표시할 ${isNewsTab ? '뉴스' : '공시'}가 없습니다.`}
              className="py-6"
            />
          )}
        </div>
      </Card>
    </div>
  )
}
