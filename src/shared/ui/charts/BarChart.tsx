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

export type BarChartPoint = Record<string, number | string>
export type BarChartDataKey<T extends BarChartPoint> = Extract<keyof T, string>

export interface BarChartProps<T extends BarChartPoint = BarChartPoint> {
  data: T[]
  height: number
  width?: number
  responsive?: boolean
  color?: string
  ariaLabel?: string
  className?: string
  xDataKey?: BarChartDataKey<T>
  yDataKey?: BarChartDataKey<T>
  margin?: Margin
  radius?: [number, number, number, number]
  showAxes?: boolean
}

export function BarChart<T extends BarChartPoint = BarChartPoint>({
  data,
  height,
  width,
  responsive = width === undefined,
  color = chartTheme.barColor,
  ariaLabel,
  className,
  xDataKey,
  yDataKey,
  margin = { top: 6, right: 0, bottom: 0, left: 0 },
  radius = [2, 2, 0, 0],
  showAxes = false,
}: BarChartProps<T>) {
  const { containerRef, chartWidth } = useMeasuredChartWidth(
    responsive ? width : (width ?? chartTheme.fallbackWidth),
  )
  const resolvedXDataKey = (xDataKey ?? 'name') as BarChartDataKey<T>
  const resolvedYDataKey = (yDataKey ?? 'value') as BarChartDataKey<T>

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
            dataKey={resolvedXDataKey}
            tick={{ fill: chartTheme.axisColor, fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: chartTheme.gridColor }}
          />
        ) : null}
        {showAxes ? <YAxis hide /> : null}
        <Bar
          dataKey={resolvedYDataKey}
          fill={color}
          isAnimationActive={false}
          radius={radius}
        />
      </RechartsBarChart>
    </div>
  )
}
