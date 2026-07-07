import { useState } from 'react'

import { useAddAssetToFirstWatchlist } from '@/features/watchlist/queries'
import type { AssetDto } from '@/features/watchlist/dto'
import { apiGet } from '@/shared/api/client'
import { Button, Card, EmptyState, ErrorState, Skeleton } from '@/shared/ui'
import { classNames } from '@/shared/ui/classNames'

import type { StockRecommendationDto } from './dto'
import { useWatchlistRecommendations } from './queries'

const generatedAtFormatter = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

type AddStatus = 'idle' | 'pending' | 'success' | 'error'

interface AddState {
  status: AddStatus
  message?: string
}

function formatGeneratedAt(value: string) {
  if (!value) return null

  const generatedAt = new Date(value)
  if (Number.isNaN(generatedAt.getTime())) return null

  return generatedAtFormatter.format(generatedAt)
}

function getAddErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message

  return '관심종목에 추가하지 못했습니다.'
}

async function findAssetIdBySymbol(symbol: string) {
  const { data } = await apiGet<AssetDto[]>(
    `/assets?symbol=${encodeURIComponent(symbol)}&page=1&size=20`,
  )
  const matchingAsset = data.find(
    (asset) => asset.symbol.toLowerCase() === symbol.toLowerCase(),
  )

  if (!matchingAsset) {
    throw new Error('일치하는 종목을 찾지 못했습니다.')
  }

  return matchingAsset.id
}

export function WatchlistRecommendationsSection() {
  const recommendationsQuery = useWatchlistRecommendations()
  const addAssetToWatchlist = useAddAssetToFirstWatchlist()
  const [addStateBySymbol, setAddStateBySymbol] = useState<
    Record<string, AddState>
  >({})
  const recommendations = recommendationsQuery.data?.recommendations ?? []
  const generatedAt = formatGeneratedAt(
    recommendationsQuery.data?.generated_at ?? '',
  )

  const requestRecommendations = () => {
    void recommendationsQuery.refetch()
  }

  const addRecommendation = async (recommendation: StockRecommendationDto) => {
    setAddStateBySymbol((current) => ({
      ...current,
      [recommendation.symbol]: { status: 'pending' },
    }))

    try {
      const assetId = await findAssetIdBySymbol(recommendation.symbol)
      await addAssetToWatchlist.mutateAsync({ asset_id: assetId })
      setAddStateBySymbol((current) => ({
        ...current,
        [recommendation.symbol]: { status: 'success' },
      }))
    } catch (error) {
      setAddStateBySymbol((current) => ({
        ...current,
        [recommendation.symbol]: {
          status: 'error',
          message: getAddErrorMessage(error),
        },
      }))
    }
  }

  return (
    <Card
      className="border-cockpit-border bg-cockpit-surface/85 p-4 shadow-blue-950/20"
      aria-labelledby="watchlist-recommendations-title"
    >
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2
            id="watchlist-recommendations-title"
            className="text-lg font-semibold text-cockpit-text"
          >
            추천 종목
          </h2>
          <p className="mt-1 text-sm leading-6 text-cockpit-text-muted">
            관심목록 기반 후보를 요청합니다. AI 추천 생성에는 수 초 이상 걸릴 수
            있습니다.
          </p>
          {generatedAt ? (
            <p className="mt-1 text-xs text-cockpit-text-muted">
              생성 시각 {generatedAt}
            </p>
          ) : null}
        </div>
        <Button
          type="button"
          className="min-h-10 shrink-0 border-blue-600 bg-blue-600 px-4 text-white hover:bg-blue-500"
          disabled={recommendationsQuery.isFetching}
          aria-busy={recommendationsQuery.isFetching}
          onClick={requestRecommendations}
        >
          {recommendationsQuery.isFetching ? '추천 생성 중' : '추천 받기'}
        </Button>
      </div>

      <div aria-live="polite" aria-atomic="false">
        {recommendationsQuery.isFetching ? (
          <div className="rounded-card border border-cockpit-border bg-cockpit-bg/35 p-4">
            <p className="mb-3 text-sm text-cockpit-text-muted">
              추천 근거와 참고 지표를 생성하고 있습니다. 잠시만 기다려 주세요.
            </p>
            <Skeleton lines={5} />
          </div>
        ) : recommendationsQuery.isError ? (
          <ErrorState
            title="추천 종목을 불러오지 못했습니다"
            description={recommendationsQuery.error.message}
            retryLabel="다시 추천 받기"
            onRetry={requestRecommendations}
          />
        ) : recommendationsQuery.isSuccess && recommendations.length === 0 ? (
          <EmptyState
            title="추천할 후보가 없습니다."
            description="현재 관심목록에서 새로 추천할 종목을 찾지 못했습니다."
            className="py-6"
          />
        ) : recommendations.length > 0 ? (
          <ul className="grid gap-3 lg:grid-cols-2">
            {recommendations.map((recommendation) => {
              const addState = addStateBySymbol[recommendation.symbol] ?? {
                status: 'idle',
              }
              const isAdding = addState.status === 'pending'
              const isAdded = addState.status === 'success'

              return (
                <li
                  key={recommendation.symbol}
                  className="rounded-card border border-cockpit-border bg-cockpit-bg/40 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                        <strong className="text-base font-semibold text-cockpit-text">
                          {recommendation.symbol}
                        </strong>
                        <span className="text-sm text-cockpit-text-muted">
                          {recommendation.name}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-cockpit-text">
                        {recommendation.rationale}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant={isAdded ? 'secondary' : 'primary'}
                      className={classNames(
                        'min-h-9 shrink-0 px-3',
                        !isAdded &&
                          'border-blue-600 bg-blue-600 text-white hover:bg-blue-500',
                      )}
                      disabled={isAdding || isAdded}
                      aria-busy={isAdding}
                      onClick={() => {
                        void addRecommendation(recommendation)
                      }}
                    >
                      {isAdded ? '추가됨' : isAdding ? '추가 중' : '추가'}
                    </Button>
                  </div>

                  {recommendation.reference_metrics.length > 0 ? (
                    <ul
                      className="mt-3 flex flex-wrap gap-2"
                      aria-label={`${recommendation.symbol} 참고 지표`}
                    >
                      {recommendation.reference_metrics.map((metric) => (
                        <li
                          key={metric}
                          className="rounded-control border border-cockpit-border bg-cockpit-surface-muted px-2 py-1 text-xs font-semibold text-cockpit-text-muted"
                        >
                          {metric}
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {addState.status === 'error' ? (
                    <p className="mt-3 text-sm text-rose-300" role="alert">
                      {addState.message}
                    </p>
                  ) : null}
                </li>
              )
            })}
          </ul>
        ) : null}
      </div>
    </Card>
  )
}
