import { useId } from 'react'
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceDot,
  Tooltip,
  XAxis,
  YAxis,
  type DotProps,
  type Margin,
} from 'recharts'

import { classNames } from '@/shared/ui/classNames'

import {
  chartTheme,
  getChartAccessibility,
  useMeasuredChartWidth,
} from './chartTheme'

export type LineChartPoint = Record<string, number | string | null>
export type LineChartDataKey<T extends LineChartPoint> = Extract<
  keyof T,
  string
>

export interface LineChartSeries<T extends LineChartPoint = LineChartPoint> {
  dataKey: LineChartDataKey<T>
  color: string
  strokeWidth?: number
  strokeDasharray?: string
}

export interface LineChartProps<T extends LineChartPoint = LineChartPoint> {
  data: T[]
  height: number
  width?: number
  responsive?: boolean
  color?: string
  ariaLabel?: string
  className?: string
  xDataKey?: LineChartDataKey<T>
  yDataKey?: LineChartDataKey<T>
  margin?: Margin
  showAxes?: boolean
  showGrid?: boolean
  showTooltip?: boolean
  series?: Array<LineChartSeries<T>>
  markers?: Array<{ x: string; y: number; label: string; color?: string }>
  areaSeries?: {
    dataKey: LineChartDataKey<T>
    color: string
    gradientOpacityFrom?: number
    gradientOpacityTo?: number
  }
  yAxisOrientation?: 'left' | 'right'
  hideXAxis?: boolean
  lastValueLabel?: {
    dataKey: LineChartDataKey<T>
    color?: string
  }
}

const DEFAULT_MARKER_COLOR = '#f59e0b'
const DEFAULT_GRADIENT_OPACITY_FROM = 0.32
const DEFAULT_GRADIENT_OPACITY_TO = 0.02

function renderMarkerShape(label: string, color: string) {
  return ({ cx, cy, r }: DotProps) => (
    <circle
      cx={cx}
      cy={cy}
      r={r}
      fill={color}
      stroke="#fef3c7"
      strokeWidth={2}
      tabIndex={0}
      aria-label={label}
      role="img"
    >
      <title>{label}</title>
    </circle>
  )
}

function formatLastValue(value: number) {
  return value.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

function renderLastValueShape(value: number, color: string) {
  const label = formatLastValue(value)
  const labelWidth = Math.max(label.length * 7 + 16, 48)

  return ({ cx = 0, cy = 0 }: DotProps) => (
    <g data-last-value-label={label} aria-hidden="true">
      <circle
        cx={cx}
        cy={cy}
        r={3.5}
        fill={color}
        stroke="#e2e8f0"
        strokeWidth={1.5}
      />
      <rect
        x={cx - labelWidth - 8}
        y={cy - 11}
        width={labelWidth}
        height={22}
        rx={11}
        fill={color}
      />
      <text
        x={cx - labelWidth / 2 - 8}
        y={cy}
        fill="#ffffff"
        fontSize={11}
        fontWeight={700}
        textAnchor="middle"
        dominantBaseline="central"
      >
        {label}
      </text>
    </g>
  )
}

function findLastValidPoint<T extends LineChartPoint>(
  data: T[],
  xDataKey: LineChartDataKey<T>,
  yDataKey: LineChartDataKey<T>,
) {
  for (let index = data.length - 1; index >= 0; index -= 1) {
    const x = data[index][xDataKey]
    const y = data[index][yDataKey]

    if (
      (typeof x === 'string' ||
        (typeof x === 'number' && Number.isFinite(x))) &&
      typeof y === 'number' &&
      Number.isFinite(y)
    ) {
      return { x, y }
    }
  }

  return null
}

export function LineChart<T extends LineChartPoint = LineChartPoint>({
  data,
  height,
  width,
  responsive = width === undefined,
  color = chartTheme.lineColor,
  ariaLabel,
  className,
  xDataKey,
  yDataKey,
  margin = chartTheme.chartMargin,
  showAxes = true,
  showGrid = true,
  showTooltip = false,
  series,
  markers,
  areaSeries,
  yAxisOrientation = 'left',
  hideXAxis = false,
  lastValueLabel,
}: LineChartProps<T>) {
  const gradientId = `line-chart-gradient-${useId().replace(/:/g, '')}`
  const { containerRef, chartWidth } = useMeasuredChartWidth(
    responsive ? width : (width ?? chartTheme.fallbackWidth),
  )
  const resolvedXDataKey = (xDataKey ?? 'name') as LineChartDataKey<T>
  const resolvedYDataKey = (yDataKey ?? 'value') as LineChartDataKey<T>
  const resolvedSeries = series ?? [
    { dataKey: resolvedYDataKey, color, strokeWidth: 2.6 },
  ]
  const lastValidPoint = lastValueLabel
    ? findLastValidPoint(data, resolvedXDataKey, lastValueLabel.dataKey)
    : null
  const lastValueSeriesColor =
    areaSeries && areaSeries.dataKey === lastValueLabel?.dataKey
      ? areaSeries.color
      : resolvedSeries.find((item) => item.dataKey === lastValueLabel?.dataKey)
          ?.color
  const resolvedLastValueColor =
    lastValueLabel?.color ?? lastValueSeriesColor ?? color

  return (
    <div
      ref={containerRef}
      className={classNames('min-w-0', className)}
      style={{ height, width: width ?? undefined }}
      {...getChartAccessibility(ariaLabel)}
    >
      <ComposedChart
        width={chartWidth}
        height={height}
        data={data}
        margin={margin}
      >
        {areaSeries ? (
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor={areaSeries.color}
                stopOpacity={
                  areaSeries.gradientOpacityFrom ??
                  DEFAULT_GRADIENT_OPACITY_FROM
                }
              />
              <stop
                offset="100%"
                stopColor={areaSeries.color}
                stopOpacity={
                  areaSeries.gradientOpacityTo ?? DEFAULT_GRADIENT_OPACITY_TO
                }
              />
            </linearGradient>
          </defs>
        ) : null}
        {showGrid ? (
          <CartesianGrid
            stroke={chartTheme.gridColor}
            strokeDasharray="4 6"
            vertical={false}
          />
        ) : null}
        {showAxes ? (
          <XAxis
            dataKey={resolvedXDataKey}
            hide={hideXAxis}
            tick={{ fill: chartTheme.axisColor, fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: chartTheme.gridColor }}
          />
        ) : null}
        {showAxes ? (
          <YAxis
            tick={{ fill: chartTheme.axisColor, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={48}
            domain={['dataMin', 'dataMax']}
            orientation={yAxisOrientation}
          />
        ) : null}
        {showTooltip ? <Tooltip isAnimationActive={false} /> : null}
        {areaSeries ? (
          <Area
            type="monotone"
            dataKey={areaSeries.dataKey}
            stroke={areaSeries.color}
            strokeWidth={2.6}
            fill={`url(#${gradientId})`}
            fillOpacity={1}
            dot={false}
            connectNulls={false}
            isAnimationActive={false}
          />
        ) : null}
        {resolvedSeries
          .filter((item) => item.dataKey !== areaSeries?.dataKey)
          .map((item) => (
            <Line
              key={item.dataKey}
              type="monotone"
              dataKey={item.dataKey}
              stroke={item.color}
              strokeWidth={item.strokeWidth ?? 2.6}
              strokeDasharray={item.strokeDasharray}
              strokeLinecap="round"
              strokeLinejoin="round"
              dot={false}
              connectNulls={false}
              isAnimationActive={false}
            />
          ))}
        {markers?.map((marker, index) => (
          <ReferenceDot
            key={`${marker.x}:${marker.label}:${index}`}
            x={marker.x}
            y={marker.y}
            r={5}
            ifOverflow="discard"
            shape={renderMarkerShape(
              marker.label,
              marker.color ?? DEFAULT_MARKER_COLOR,
            )}
          />
        ))}
        {lastValueLabel && lastValidPoint ? (
          <ReferenceDot
            x={lastValidPoint.x}
            y={lastValidPoint.y}
            r={0}
            ifOverflow="discard"
            shape={renderLastValueShape(
              lastValidPoint.y,
              resolvedLastValueColor,
            )}
          />
        ) : null}
      </ComposedChart>
    </div>
  )
}
