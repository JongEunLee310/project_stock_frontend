import {
  Line,
  LineChart as RechartsLineChart,
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

export interface SparklinePoint {
  value: number
}

export interface SparklineProps {
  data: SparklinePoint[]
  height: number
  width?: number
  responsive?: boolean
  color?: string
  ariaLabel?: string
  className?: string
  margin?: Margin
  strokeWidth?: number
}

export function Sparkline({
  data,
  height,
  width,
  responsive = width === undefined,
  color = 'currentColor',
  ariaLabel,
  className,
  margin = chartTheme.sparklineMargin,
  strokeWidth = 2.2,
}: SparklineProps) {
  const { containerRef, chartWidth } = useMeasuredChartWidth(
    responsive ? width : (width ?? chartTheme.fallbackWidth),
  )
  const chartData = data.map((point, index) => ({ index, value: point.value }))

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
        data={chartData}
        margin={margin}
      >
        <XAxis
          dataKey="index"
          domain={[0, Math.max(chartData.length - 1, 0)]}
          hide
          type="number"
        />
        <YAxis hide domain={['dataMin', 'dataMax']} />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          dot={false}
          isAnimationActive={false}
        />
      </RechartsLineChart>
    </div>
  )
}
