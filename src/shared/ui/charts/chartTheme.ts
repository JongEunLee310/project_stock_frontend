import { useEffect, useRef, useState, type HTMLAttributes } from 'react'

export const chartTheme = {
  fallbackWidth: 240,
  axisColor: '#8ea0b8',
  gridColor: '#26364a',
  lineColor: '#5fa8ff',
  positiveColor: '#34d399',
  negativeColor: '#fb7185',
  mutedColor: '#475569',
  barColor: '#2f7df7',
  donutColors: ['#62d66f', '#30445f', '#2f7df7', '#f59e0b', '#fb7185'],
  sparklineMargin: { top: 4, right: 3, bottom: 3, left: 3 },
  chartMargin: { top: 12, right: 16, bottom: 8, left: 8 },
} as const

export type ChartAccessibilityProps = Pick<
  HTMLAttributes<HTMLDivElement>,
  'aria-hidden' | 'aria-label' | 'role'
>

export function getChartAccessibility(
  ariaLabel?: string,
): ChartAccessibilityProps {
  if (ariaLabel) {
    return {
      role: 'img',
      'aria-label': ariaLabel,
    }
  }

  return {
    'aria-hidden': true,
  }
}

export function useMeasuredChartWidth(width?: number) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [measuredWidth, setMeasuredWidth] = useState(
    width ?? chartTheme.fallbackWidth,
  )

  useEffect(() => {
    if (width !== undefined) {
      setMeasuredWidth(width)
      return undefined
    }

    const element = containerRef.current

    if (!element) {
      return undefined
    }

    const updateWidth = () => {
      setMeasuredWidth(
        Math.max(Math.round(element.getBoundingClientRect().width), 1),
      )
    }

    updateWidth()

    if (!('ResizeObserver' in window)) {
      return undefined
    }

    const resizeObserver = new ResizeObserver(updateWidth)
    resizeObserver.observe(element)

    return () => resizeObserver.disconnect()
  }, [width])

  return {
    containerRef,
    chartWidth: width ?? measuredWidth,
  }
}
