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

export interface LineChartPoint {
  [key: string]: number | string
}

export interface LineChartProps {
  data: LineChartPoint[]
  height: number
  width?: number
  responsive?: boolean
  color?: string
  ariaLabel?: string
  className?: string
  xDataKey?: string
  yDataKey?: string
  margin?: Margin
  showAxes?: boolean
  showGrid?: boolean
  showTooltip?: boolean
}

export function LineChart({
  data,
  height,
  width,
  responsive = width === undefined,
  color = chartTheme.lineColor,
  ariaLabel,
  className,
  xDataKey = 'name',
  yDataKey = 'value',
  margin = chartTheme.chartMargin,
  showAxes = true,
  showGrid = true,
  showTooltip = false,
}: LineChartProps) {
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
            dataKey={xDataKey}
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
        <Line
          type="monotone"
          dataKey={yDataKey}
          stroke={color}
          strokeWidth={2.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          dot={false}
          isAnimationActive={false}
        />
      </RechartsLineChart>
    </div>
  )
}
