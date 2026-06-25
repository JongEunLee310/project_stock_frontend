import { Cell, Pie, PieChart } from 'recharts'

import { classNames } from '@/shared/ui/classNames'

import {
  chartTheme,
  getChartAccessibility,
  useMeasuredChartWidth,
} from './chartTheme'

export interface DonutChartPoint {
  name: string
  value: number
}

export interface DonutChartProps {
  data: DonutChartPoint[]
  height: number
  width?: number
  responsive?: boolean
  colors?: string[]
  color?: string
  ariaLabel?: string
  className?: string
  innerRadius?: number | string
  outerRadius?: number | string
  paddingAngle?: number
}

export function DonutChart({
  data,
  height,
  width,
  responsive = width === undefined,
  colors,
  color,
  ariaLabel,
  className,
  innerRadius = '62%',
  outerRadius = '100%',
  paddingAngle = 0,
}: DonutChartProps) {
  const { containerRef, chartWidth } = useMeasuredChartWidth(
    responsive ? width : (width ?? height),
  )
  const segmentColors =
    colors ?? (color ? [color, chartTheme.mutedColor] : chartTheme.donutColors)

  return (
    <div
      ref={containerRef}
      className={classNames('min-w-0', className)}
      style={{ height, width: width ?? undefined }}
      {...getChartAccessibility(ariaLabel)}
    >
      <PieChart width={chartWidth} height={height}>
        <Pie
          data={data}
          dataKey="value"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={90}
          endAngle={-270}
          paddingAngle={paddingAngle}
          stroke="none"
          isAnimationActive={false}
        >
          {data.map((point, index) => (
            <Cell
              key={point.name}
              fill={segmentColors[index % segmentColors.length]}
            />
          ))}
        </Pie>
      </PieChart>
    </div>
  )
}
