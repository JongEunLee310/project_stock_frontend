import {
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  ReferenceDot,
  Tooltip,
  XAxis,
  YAxis,
  type Margin,
  type DotProps,
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
}

const DEFAULT_MARKER_COLOR = '#f59e0b'

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
}: LineChartProps<T>) {
  const { containerRef, chartWidth } = useMeasuredChartWidth(
    responsive ? width : (width ?? chartTheme.fallbackWidth),
  )
  const resolvedXDataKey = (xDataKey ?? 'name') as LineChartDataKey<T>
  const resolvedYDataKey = (yDataKey ?? 'value') as LineChartDataKey<T>

  return (
    <div
      ref={containerRef}
      className={classNames('min-w-0', className)}
      style={{ height, width: width ?? undefined }}
      {...getChartAccessibility(ariaLabel)}
    >
      <RechartsLineChart
        width={chartWidth}
        height={height}
        data={data}
        margin={margin}
      >
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
          />
        ) : null}
        {showTooltip ? <Tooltip isAnimationActive={false} /> : null}
        {(
          series ?? [{ dataKey: resolvedYDataKey, color, strokeWidth: 2.6 }]
        ).map((item) => (
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
      </RechartsLineChart>
    </div>
  )
}
