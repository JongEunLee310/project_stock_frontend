import { useState, type ReactNode } from 'react'

import type { AlertRule } from '@/features/alerts/adapters'
import { conditionText } from '@/features/alerts/conditionText'
import type {
  AlertChannel,
  AlertRuleStatus,
  AlertSeverity,
  AlertTargetType,
} from '@/features/alerts/dto'
import {
  type AlertRuleSort,
  useAlertRules,
  useDeleteAlertRule,
  usePauseAlertRule,
  useResumeAlertRule,
} from '@/features/alerts/queries'
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Skeleton,
  Table,
  type BadgeTone,
  type TableColumn,
} from '@/shared/ui'

interface AlertRuleTableProps {
  onEdit: (rule: AlertRule) => void
  onDuplicate: (rule: AlertRule) => void
}

const pageSize = 10
const selectClassName =
  'min-h-10 rounded-control border border-app-border bg-app-surface-muted px-3 py-2 text-sm text-app-text outline-none focus:border-app-accent focus:ring-2 focus:ring-app-accent/30'

const targetTypeLabels: Record<AlertTargetType, string> = {
  SYMBOL: '종목',
  WATCHLIST: '관심종목',
  PORTFOLIO: '포트폴리오',
  TOPIC: '토픽',
  MARKET: '시장',
}

const channelLabels: Record<AlertChannel, string> = {
  APP: '앱',
  EMAIL: '이메일',
  DISCORD: 'Discord',
  SLACK: 'Slack',
}

const severityLabels: Record<AlertSeverity, string> = {
  LOW: '낮음',
  MEDIUM: '중간',
  HIGH: '높음',
  CRITICAL: '긴급',
}

const severityTones: Record<AlertSeverity, BadgeTone> = {
  LOW: 'info',
  MEDIUM: 'warning',
  HIGH: 'danger',
  CRITICAL: 'danger',
}

function TargetCell({ rule }: { rule: AlertRule }) {
  return (
    <span>
      <span className="font-medium text-app-text">
        {targetTypeLabels[rule.targetType]}
      </span>
      {rule.targetId ? (
        <span className="mt-1 block text-xs text-app-text-muted">
          {rule.targetId}
        </span>
      ) : null}
    </span>
  )
}

function ChannelBadges({ channels }: { channels: AlertChannel[] }) {
  return (
    <span className="flex flex-wrap gap-1">
      {channels.map((channel) => (
        <Badge key={channel} tone="neutral">
          {channelLabels[channel]}
        </Badge>
      ))}
    </span>
  )
}

const columns: Array<TableColumn<AlertRule>> = [
  {
    key: 'name',
    header: '이름',
    sortable: true,
    className: 'min-w-44 font-semibold text-app-text',
    cell: (rule) => rule.name,
  },
  {
    key: 'target',
    header: '대상',
    className: 'min-w-32',
    cell: (rule) => <TargetCell rule={rule} />,
  },
  {
    key: 'condition',
    header: '조건',
    className: 'min-w-64 text-app-text-muted',
    cell: (rule) => conditionText(rule.condition),
  },
  {
    key: 'channels',
    header: '채널',
    className: 'min-w-32',
    cell: (rule) => <ChannelBadges channels={rule.channels} />,
  },
  {
    key: 'severity',
    header: '중요도',
    cell: (rule) => (
      <Badge tone={severityTones[rule.severity]}>
        {severityLabels[rule.severity]}
      </Badge>
    ),
  },
  {
    key: 'status',
    header: '상태',
    cell: (rule) => (
      <Badge tone={rule.status === 'ACTIVE' ? 'success' : 'neutral'}>
        {rule.status === 'ACTIVE' ? '활성' : '일시정지'}
      </Badge>
    ),
  },
  {
    key: 'lastTriggeredAt',
    header: '마지막 발생',
    className: 'min-w-36 text-app-text-muted',
    cell: (rule) =>
      rule.lastTriggeredAt && rule.lastTriggeredAtIso ? (
        <time dateTime={rule.lastTriggeredAtIso}>{rule.lastTriggeredAt}</time>
      ) : (
        '발생 없음'
      ),
  },
]

function loadingMessage(): ReactNode {
  return (
    <div
      className="mx-auto max-w-md space-y-3"
      aria-label="알림 규칙 불러오는 중"
    >
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-5 w-5/6" />
      <Skeleton className="h-5 w-4/6" />
    </div>
  )
}

export function AlertRuleTable({ onEdit, onDuplicate }: AlertRuleTableProps) {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<AlertRuleStatus | ''>('')
  const [targetType, setTargetType] = useState<AlertTargetType | ''>('')
  const [sort, setSort] = useState<AlertRuleSort>('-created_at')
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)

  const rulesQuery = useAlertRules({
    page,
    size: pageSize,
    sort,
    status: status || undefined,
    targetType: targetType || undefined,
  })
  const pauseRule = usePauseAlertRule()
  const resumeRule = useResumeAlertRule()
  const deleteRule = useDeleteAlertRule()
  const isActionPending =
    pauseRule.isPending || resumeRule.isPending || deleteRule.isPending
  const actionError = pauseRule.error ?? resumeRule.error ?? deleteRule.error

  if (rulesQuery.isError) {
    return (
      <ErrorState
        title="알림 규칙을 불러오지 못했습니다"
        description={rulesQuery.error.message}
        onRetry={() => {
          void rulesQuery.refetch()
        }}
      />
    )
  }

  const rules = rulesQuery.data?.items ?? []
  const meta = rulesQuery.data?.meta

  return (
    <section aria-labelledby="alert-rule-table-title">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2
            id="alert-rule-table-title"
            className="text-lg font-semibold text-app-text"
          >
            알림 규칙
          </h2>
          <p className="mt-1 text-sm text-app-text-muted">
            조건과 전달 채널을 확인하고 규칙을 관리합니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="flex flex-col gap-1 text-xs font-medium text-app-text-muted">
            상태
            <select
              className={selectClassName}
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as AlertRuleStatus | '')
                setPage(1)
              }}
            >
              <option value="">전체</option>
              <option value="ACTIVE">활성</option>
              <option value="PAUSED">일시정지</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-app-text-muted">
            대상
            <select
              className={selectClassName}
              value={targetType}
              onChange={(event) => {
                setTargetType(event.target.value as AlertTargetType | '')
                setPage(1)
              }}
            >
              <option value="">전체</option>
              {Object.entries(targetTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-app-text-muted">
            정렬
            <select
              className={selectClassName}
              value={sort}
              onChange={(event) => {
                setSort(event.target.value as AlertRuleSort)
                setPage(1)
              }}
            >
              <option value="-created_at">최신 생성순</option>
              <option value="created_at">오래된 생성순</option>
              <option value="name">이름 오름차순</option>
              <option value="-name">이름 내림차순</option>
            </select>
          </label>
        </div>
      </div>

      {actionError ? (
        <p
          className="mb-3 rounded-control border border-red-400/40 bg-red-400/10 px-3 py-2 text-sm text-red-200"
          role="alert"
        >
          {actionError.message}
        </p>
      ) : null}

      <Table
        aria-label="알림 규칙 목록"
        columns={columns}
        rows={rules}
        getRowKey={(rule) => rule.id}
        isLoading={rulesQuery.isLoading}
        loadingMessage={loadingMessage()}
        emptyMessage={
          <EmptyState
            title="등록된 알림 규칙이 없습니다"
            description="템플릿을 선택해 첫 알림 규칙을 만들어 보세요."
          />
        }
        pagination={
          meta
            ? {
                page: meta.page,
                pageSize: meta.size,
                total: meta.total,
                manual: true,
                onPageChange: setPage,
              }
            : undefined
        }
        rowAction={(rule) => (
          <div className="flex min-w-max flex-wrap justify-end gap-1">
            <Button
              variant="ghost"
              className="min-h-8 px-2 py-1 text-xs"
              disabled={isActionPending}
              onClick={() => onEdit(rule)}
            >
              수정
            </Button>
            <Button
              variant="ghost"
              className="min-h-8 px-2 py-1 text-xs"
              disabled={isActionPending || rule.templateType === null}
              title={
                rule.templateType === null
                  ? '템플릿이 없는 규칙은 복제할 수 없습니다.'
                  : undefined
              }
              onClick={() => onDuplicate(rule)}
            >
              복제
            </Button>
            <Button
              variant="ghost"
              className="min-h-8 px-2 py-1 text-xs"
              disabled={isActionPending}
              onClick={() => {
                if (rule.status === 'ACTIVE') pauseRule.mutate(rule.id)
                else resumeRule.mutate(rule.id)
              }}
            >
              {rule.status === 'ACTIVE' ? '일시정지' : '재개'}
            </Button>
            {deleteConfirmId === rule.id ? (
              <>
                <Button
                  variant="ghost"
                  className="min-h-8 px-2 py-1 text-xs text-red-200"
                  disabled={isActionPending}
                  onClick={() => {
                    deleteRule.mutate(rule.id, {
                      onSuccess: () => setDeleteConfirmId(null),
                    })
                  }}
                >
                  삭제 확인
                </Button>
                <Button
                  variant="ghost"
                  className="min-h-8 px-2 py-1 text-xs"
                  disabled={isActionPending}
                  onClick={() => setDeleteConfirmId(null)}
                >
                  취소
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                className="min-h-8 px-2 py-1 text-xs"
                disabled={isActionPending || rule.source === 'SYSTEM'}
                title={
                  rule.source === 'SYSTEM'
                    ? '시스템 규칙은 삭제할 수 없습니다.'
                    : undefined
                }
                onClick={() => setDeleteConfirmId(rule.id)}
              >
                삭제
              </Button>
            )}
          </div>
        )}
      />
    </section>
  )
}
