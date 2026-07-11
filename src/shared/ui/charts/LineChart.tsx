import {
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  Tooltip,
  XAxis,
  YAxis,
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
      </RechartsLineChart>
    </div>
  )
}
