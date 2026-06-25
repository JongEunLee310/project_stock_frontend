import { classNames } from './classNames'

export interface SkeletonProps {
  className?: string
  lines?: number
}

export function Skeleton({ className, lines }: SkeletonProps) {
  if (lines !== undefined) {
    const lineCount = Math.max(0, Math.floor(lines))

    return (
      <div
        aria-hidden="true"
        className={classNames('flex flex-col gap-2', className)}
      >
        {Array.from({ length: lineCount }, (_, index) => (
          <div
            key={index}
            className={classNames(
              'h-3 animate-pulse rounded-control bg-app-surface-muted',
              index === lineCount - 1 && lineCount > 1 && 'w-3/4',
            )}
          />
        ))}
      </div>
    )
  }

  return (
    <div
      aria-hidden="true"
      className={classNames(
        'h-4 animate-pulse rounded-control bg-app-surface-muted',
        className,
      )}
    />
  )
}
