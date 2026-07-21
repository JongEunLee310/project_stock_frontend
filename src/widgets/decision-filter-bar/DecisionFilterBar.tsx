import type { ChangeEvent } from 'react'

import type { DecisionLogFilters } from '@/features/decision-log/queries'
import {
  decisionStatusLabels,
  decisionTypeLabels,
  riskTypeLabels,
  targetTypeLabels,
} from '@/shared/model'
import { Button, Card, Input } from '@/shared/ui'

interface DecisionFilterBarProps {
  filters: DecisionLogFilters
  onChange: (filters: DecisionLogFilters) => void
}

const selectClassName =
  'min-h-10 w-full rounded-control border border-app-border bg-app-surface-muted px-3 py-2 text-sm text-app-text outline-none transition-colors focus:border-app-accent focus:ring-2 focus:ring-app-accent/30'

function toOptionalValue(value: string): string | undefined {
  return value || undefined
}

export function DecisionFilterBar({
  filters,
  onChange,
}: DecisionFilterBarProps) {
  const updateFilter = (key: keyof DecisionLogFilters, value: string) => {
    onChange({
      ...filters,
      [key]: toOptionalValue(value),
      page: undefined,
    })
  }

  const handleSymbolChange = (event: ChangeEvent<HTMLInputElement>) => {
    updateFilter('symbol', event.target.value.trimStart().toUpperCase())
  }

  return (
    <Card aria-labelledby="decision-filter-heading" className="shadow-none">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2
          id="decision-filter-heading"
          className="text-lg font-semibold text-app-text"
        >
          판단 기록 필터
        </h2>
        <Button
          type="button"
          variant="ghost"
          className="min-h-9 px-3 py-1.5"
          onClick={() => onChange({})}
        >
          필터 초기화
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <label className="grid gap-1 text-sm text-app-text-muted">
          대상 유형
          <select
            className={selectClassName}
            value={filters.targetType ?? ''}
            onChange={(event) => updateFilter('targetType', event.target.value)}
          >
            <option value="">전체</option>
            {Object.entries(targetTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-sm text-app-text-muted">
          종목 심볼
          <Input
            type="search"
            value={filters.symbol ?? ''}
            placeholder="예: NVDA"
            onChange={handleSymbolChange}
          />
        </label>

        <label className="grid gap-1 text-sm text-app-text-muted">
          판단 유형
          <select
            className={selectClassName}
            value={filters.decisionType ?? ''}
            onChange={(event) =>
              updateFilter('decisionType', event.target.value)
            }
          >
            <option value="">전체</option>
            {Object.entries(decisionTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-sm text-app-text-muted">
          상태
          <select
            className={selectClassName}
            value={filters.status ?? ''}
            onChange={(event) => updateFilter('status', event.target.value)}
          >
            <option value="">전체</option>
            {Object.entries(decisionStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-sm text-app-text-muted">
          위험 유형
          <select
            className={selectClassName}
            value={filters.riskType ?? ''}
            onChange={(event) => updateFilter('riskType', event.target.value)}
          >
            <option value="">전체</option>
            {Object.entries(riskTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-sm text-app-text-muted">
          재검토 예정일
          <Input
            type="date"
            value={filters.reviewDueBefore ?? ''}
            onChange={(event) =>
              updateFilter('reviewDueBefore', event.target.value)
            }
          />
        </label>
      </div>
    </Card>
  )
}
