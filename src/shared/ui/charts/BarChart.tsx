import {
  Bar,
  BarChart as RechartsBarChart,
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

export interface BarChartPoint {
  [key: string]: number | string
}

export interface BarChartProps {
  data: BarChartPoint[]
  height: number
  width?: number
  responsive?: boolean
  color?: string
  ariaLabel?: string
  className?: string
  xDataKey?: string
  yDataKey?: string
  margin?: Margin
  radius?: [number, number, number, number]
  showAxes?: boolean
}

export function BarChart({
  data,
  height,
  width,
  responsive = width === undefined,
  color = chartTheme.barColor,
  ariaLabel,
  className,
  xDataKey = 'name',
  yDataKey = 'value',
  margin = { top: 6, right: 0, bottom: 0, left: 0 },
  radius = [2, 2, 0, 0],
  showAxes = false,
}: BarChartProps) {
  const { containerRef, chartWidth } = useMeasuredChartWidth(
    responsive ? width : (width ?? chartTheme.fallbackWidth),
  )

  return (
    <div
      ref={containerRef}
      className={classNames('min-w-0', className)}
      style={{ height, width: width ?? undefined }}
      {...getChartAccessibility(ariaLabel)}
    >
      <RechartsBarChart
        width={chartWidth}
        height={height}
        data={data}
        margin={margin}
      >
        {showAxes ? (
          <XAxis
            dataKey={xDataKey}
            tick={{ fill: chartTheme.axisColor, fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: chartTheme.gridColor }}
          />
        ) : null}
        {showAxes ? <YAxis hide /> : null}
        <Bar
          dataKey={yDataKey}
          fill={color}
          isAnimationActive={false}
          radius={radius}
        />
      </RechartsBarChart>
    </div>
  )
}
