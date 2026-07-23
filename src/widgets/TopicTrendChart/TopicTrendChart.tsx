import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import type {
  NewsTopicTrendView,
  NewsTopicTrendWindow,
} from '@/features/news-insights'
import { formatKstTime } from '@/shared/lib/format'
import {
  Badge,
  Card,
  DonutChart,
  EmptyState,
  ErrorState,
  PanelHeader,
  PanelFreshness,
  Skeleton,
  chartTheme,
} from '@/shared/ui'
import { useMeasuredChartWidth } from '@/shared/ui/charts/chartTheme'

interface TopicTrendChartProps {
  data?: NewsTopicTrendView
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  updatedAt?: number
  window: NewsTopicTrendWindow
  onWindowChange: (window: NewsTopicTrendWindow) => void
}

const trendWindowOptions: Array<{
  value: NewsTopicTrendWindow
  label: string
}> = [
  { value: '7d', label: '7일' },
  { value: '30d', label: '30일' },
  { value: '90d', label: '90일' },
]

function TrendWindowToggle({
  window,
  onWindowChange,
}: Pick<TopicTrendChartProps, 'window' | 'onWindowChange'>) {
  return (
    <div className="flex items-center gap-1" aria-label="추이 조회 기간">
      {trendWindowOptions.map((option) => {
        const isSelected = option.value === window

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onWindowChange(option.value)}
            className={`min-h-6 rounded-control border px-2 py-0.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent ${
              isSelected
                ? 'border-sky-400/30 bg-sky-400/15 text-sky-300'
                : 'border-app-border text-app-text-muted hover:border-app-accent/50 hover:text-app-text'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

function TopicTrendLoading({
  window,
  onWindowChange,
}: Pick<TopicTrendChartProps, 'window' | 'onWindowChange'>) {
  return (
    <Card aria-label="토픽 추이 불러오는 중" role="status">
      <div className="flex justify-end">
        <TrendWindowToggle window={window} onWindowChange={onWindowChange} />
      </div>
      <Skeleton className="h-8 w-48" />
      <Skeleton className="mt-4 h-80" />
    </Card>
  )
}

export function TopicTrendChart({
  data,
  isLoading,
  isError,
  onRetry,
  updatedAt,
  window,
  onWindowChange,
}: TopicTrendChartProps) {
  const { containerRef, chartWidth } = useMeasuredChartWidth()

  if (isLoading) {
    return <TopicTrendLoading window={window} onWindowChange={onWindowChange} />
  }
  if (isError) {
    return (
      <Card>
        <div className="mb-4 flex justify-end">
          <TrendWindowToggle window={window} onWindowChange={onWindowChange} />
        </div>
        <ErrorState
          title="토픽 추이를 불러오지 못했습니다"
          description="토픽 요약과 관련 근거는 계속 확인할 수 있습니다."
          onRetry={onRetry}
        />
      </Card>
    )
  }
  if (!data || data.points.length === 0) {
    return (
      <Card>
        <div className="mb-4 flex justify-end">
          <TrendWindowToggle window={window} onWindowChange={onWindowChange} />
        </div>
        <EmptyState
          title="표시할 토픽 추이가 없습니다"
          description="집계된 언급량과 감성 추이가 생기면 이곳에 표시됩니다."
        />
      </Card>
    )
  }

  const sourceChartData = data.sourceDistribution.map((source) => ({
    name: source.sourceTypeLabel,
    value: source.count,
  }))

  return (
    <Card aria-labelledby="topic-trend-title" className="overflow-hidden">
      <PanelHeader
        title="감성·언급 추이"
        titleId="topic-trend-title"
        controls={
          <>
            <PanelFreshness updatedAt={updatedAt} />
            <TrendWindowToggle
              window={window}
              onWindowChange={onWindowChange}
            />
          </>
        }
      />

      <div
        ref={containerRef}
        className="mt-5 h-80 min-w-0"
        role="img"
        aria-label={`언급량 막대와 감성 선 복합 차트, 데이터 ${data.points.length}개, 이벤트 마커 ${data.markers.length}개`}
      >
        <ComposedChart
          width={chartWidth}
          height={320}
          data={data.points}
          margin={{ top: 24, right: 24, bottom: 8, left: 4 }}
        >
          <CartesianGrid stroke={chartTheme.gridColor} strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={formatKstTime}
            tick={{ fill: chartTheme.axisColor, fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: chartTheme.gridColor }}
          />
          <YAxis
            yAxisId="mentions"
            allowDecimals={false}
            tick={{ fill: chartTheme.axisColor, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            yAxisId="sentiment"
            orientation="right"
            domain={[0, 1]}
            tickFormatter={(value: number) => `${Math.round(value * 100)}%`}
            tick={{ fill: chartTheme.axisColor, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: chartTheme.tooltipBackgroundColor,
              border: `1px solid ${chartTheme.tooltipBorderColor}`,
              borderRadius: 8,
              color: chartTheme.tooltipTextColor,
            }}
            labelFormatter={(label) =>
              data.points.find((point) => point.timestamp === label)
                ?.timestampLabel ?? String(label)
            }
            formatter={(value, name) => [
              name === '감성' && typeof value === 'number'
                ? `${Math.round(value * 100)}%`
                : value,
              name,
            ]}
            isAnimationActive={false}
          />
          <Legend />
          <Bar
            yAxisId="mentions"
            dataKey="mentionCount"
            name="언급량"
            fill="#38bdf8"
            radius={[3, 3, 0, 0]}
            isAnimationActive={false}
          />
          <Line
            yAxisId="sentiment"
            dataKey="sentimentScore"
            name="감성"
            stroke="#34d399"
            strokeWidth={3}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
          {data.markers.map((marker) => (
            <ReferenceLine
              key={`${marker.eventId}-${marker.timestamp}`}
              yAxisId="mentions"
              x={marker.timestamp}
              stroke="#f59e0b"
              strokeDasharray="4 3"
            />
          ))}
        </ComposedChart>
      </div>

      <div className="sr-only" aria-label="추이 데이터">
        {data.points.map((point) => (
          <p key={point.timestamp}>
            {point.timestampLabel}: 언급 {point.mentionCount}건, 감성{' '}
            {Math.round(point.sentimentScore * 100)}%
          </p>
        ))}
      </div>

      <div className="mt-5 grid gap-5 border-t border-app-border pt-5 2xl:grid-cols-2">
        <section aria-labelledby="trend-markers-title">
          <h3
            id="trend-markers-title"
            className="text-sm font-semibold text-app-text"
          >
            이벤트 마커
          </h3>
          {data.markers.length === 0 ? (
            <p className="mt-2 text-sm text-app-text-muted">
              표시할 이벤트 마커가 없습니다.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-app-border">
              {data.markers.map((marker) => (
                <li
                  key={`${marker.eventId}-${marker.timestamp}`}
                  className="py-3 text-sm"
                >
                  <strong className="text-app-text">{marker.label}</strong>
                  <span className="mt-1 block text-xs text-app-text-muted">
                    {marker.timestampLabel} · 이벤트 #{marker.eventId}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="source-distribution-title">
          <h3
            id="source-distribution-title"
            className="text-sm font-semibold text-app-text"
          >
            출처 분포
          </h3>
          {data.sourceDistribution.length === 0 ? (
            <p className="mt-2 text-sm text-app-text-muted">
              집계된 출처가 없습니다.
            </p>
          ) : (
            <div className="mt-3 grid min-w-0 gap-4 sm:grid-cols-[7rem_minmax(0,1fr)] sm:items-center">
              <DonutChart
                data={sourceChartData}
                height={112}
                ariaLabel="문서 유형별 출처 분포"
              />
              <ul className="min-w-0 space-y-2">
                {data.sourceDistribution.map((source) => (
                  <li
                    key={source.sourceTypeLabel}
                    className="flex min-w-0 flex-wrap items-center justify-between gap-2 text-sm"
                  >
                    <Badge tone={source.sourceTypeTone}>
                      {source.sourceTypeLabel}
                    </Badge>
                    <span className="text-app-text-muted">
                      {source.count}건 · {source.sharePercent}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>
    </Card>
  )
}
