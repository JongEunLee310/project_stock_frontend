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

import type { NewsTopicTrendView } from '@/features/news-insights'
import { formatKstTime } from '@/shared/lib/format'
import {
  Badge,
  Card,
  DonutChart,
  EmptyState,
  ErrorState,
  Skeleton,
  chartTheme,
} from '@/shared/ui'
import { useMeasuredChartWidth } from '@/shared/ui/charts/chartTheme'

interface TopicTrendChartProps {
  data?: NewsTopicTrendView
  isLoading: boolean
  isError: boolean
  onRetry: () => void
}

function TopicTrendLoading() {
  return (
    <Card aria-label="토픽 추이 불러오는 중" role="status">
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
}: TopicTrendChartProps) {
  const { containerRef, chartWidth } = useMeasuredChartWidth()

  if (isLoading) return <TopicTrendLoading />
  if (isError) {
    return (
      <Card>
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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-app-accent">
            Mention & sentiment
          </p>
          <h2
            id="topic-trend-title"
            className="mt-1 text-xl font-semibold text-app-text"
          >
            감성·언급 추이
          </h2>
          <p className="mt-1 text-sm leading-6 text-app-text-muted">
            언급량은 막대, 감성은 선으로 표시하며 서로 다른 축을 사용합니다.
          </p>
        </div>
        <Badge tone="accent">최근 7일 · 일간</Badge>
      </div>

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

      <div className="mt-5 grid gap-5 border-t border-app-border pt-5 lg:grid-cols-2">
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
            <ul className="mt-3 space-y-2">
              {data.markers.map((marker) => (
                <li
                  key={`${marker.eventId}-${marker.timestamp}`}
                  className="rounded-control border border-amber-400/20 bg-amber-950/10 p-3 text-sm"
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
            <div className="mt-3 grid grid-cols-[7rem_minmax(0,1fr)] items-center gap-4">
              <DonutChart
                data={sourceChartData}
                height={112}
                ariaLabel="문서 유형별 출처 분포"
              />
              <ul className="space-y-2">
                {data.sourceDistribution.map((source) => (
                  <li
                    key={source.sourceTypeLabel}
                    className="flex items-center justify-between gap-2 text-sm"
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
