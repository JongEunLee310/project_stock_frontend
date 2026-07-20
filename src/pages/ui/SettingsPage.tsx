import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import type { AlertRule } from '@/features/alerts/adapters'
import { useMe } from '@/features/settings/queries'
import { Button, Card, ErrorState, Skeleton } from '@/shared/ui'
import {
  AlertRuleBuilder,
  type AlertRuleBuilderMode,
  type AlertRuleBuilderPrefill,
} from '@/widgets/alert-rule-builder'
import { AlertRuleTable } from '@/widgets/alert-rule-table'
import { NotificationChannelPanel } from '@/widgets/notification-channel-panel'

interface BuilderState {
  mode: AlertRuleBuilderMode
  rule: AlertRule | null
  prefill?: AlertRuleBuilderPrefill
}

export function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [builderState, setBuilderState] = useState<BuilderState | null>(null)
  const meQuery = useMe()

  const builderParam = searchParams.get('builder')
  const symbolParam = searchParams.get('symbol')

  useEffect(() => {
    if (builderParam !== 'create') return

    setBuilderState({
      mode: 'create',
      rule: null,
      prefill: {
        templateType: 'NEWS_RISK_HIGH',
        ...(symbolParam ? { targetId: symbolParam } : {}),
      },
    })
    setSearchParams({}, { replace: true })
  }, [builderParam, setSearchParams, symbolParam])

  const profile = meQuery.data

  return (
    <section className="flex flex-col gap-6">
      <header className="flex min-h-16 items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-app-text-muted">
            Settings
          </p>
          <h1 className="mt-1 text-3xl font-bold text-app-text">설정</h1>
          <p className="mt-2 text-sm text-app-text-muted">
            계정과 서비스별 설정을 한곳에서 관리합니다.
          </p>
        </div>
      </header>

      <section aria-labelledby="profile-settings-title">
        <div className="mb-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-app-accent">
            Account
          </p>
          <h2
            id="profile-settings-title"
            className="mt-1 text-xl font-semibold text-app-text"
          >
            프로필 설정
          </h2>
          <p className="mt-1 text-sm text-app-text-muted">
            현재 계정의 기본 정보를 확인합니다.
          </p>
        </div>

        <Card>
          {meQuery.isLoading ? (
            <Skeleton className="h-40" />
          ) : meQuery.isError ? (
            <ErrorState
              title="프로필을 불러오지 못했습니다"
              description={meQuery.error.message}
              onRetry={() => void meQuery.refetch()}
            />
          ) : (
            <>
              <p className="text-sm font-semibold uppercase tracking-wide text-app-text-muted">
                Profile
              </p>
              <h3 className="mt-2 text-2xl font-bold text-app-text">
                {profile?.username ?? '사용자'}
              </h3>
              <dl className="mt-6 grid gap-3 md:grid-cols-3">
                <div className="rounded-control border border-app-border bg-app-surface-muted p-4">
                  <dt className="text-xs font-medium text-app-text-muted">
                    이메일
                  </dt>
                  <dd className="mt-2 break-all text-sm font-semibold text-app-text">
                    {profile?.email ?? '-'}
                  </dd>
                </div>
                <div className="rounded-control border border-app-border bg-app-surface-muted p-4">
                  <dt className="text-xs font-medium text-app-text-muted">
                    사용자명
                  </dt>
                  <dd className="mt-2 text-sm font-semibold text-app-text">
                    {profile?.username ?? '-'}
                  </dd>
                </div>
                <div className="rounded-control border border-app-border bg-app-surface-muted p-4">
                  <dt className="text-xs font-medium text-app-text-muted">
                    가입일
                  </dt>
                  <dd className="mt-2 text-sm font-semibold text-app-text">
                    {profile?.createdAt ?? '-'}
                  </dd>
                </div>
              </dl>
            </>
          )}
        </Card>
      </section>

      <section
        aria-labelledby="alert-settings-title"
        className="border-t-2 border-app-accent/30 pt-6"
      >
        <div className="mb-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-app-accent">
            Alerts
          </p>
          <h2
            id="alert-settings-title"
            className="mt-1 text-xl font-semibold text-app-text"
          >
            알림 설정
          </h2>
          <p className="mt-1 text-sm text-app-text-muted">
            감시 규칙과 알림을 받을 채널을 관리합니다.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <Card aria-labelledby="alert-rules-section-title">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b border-app-border pb-4">
              <div>
                <h3
                  id="alert-rules-section-title"
                  className="text-lg font-semibold text-app-text"
                >
                  규칙 설정
                </h3>
                <p className="mt-1 text-sm text-app-text-muted">
                  무엇을 어떤 조건에서 감시할지 정의합니다.
                </p>
              </div>
              <Button
                type="button"
                onClick={() => setBuilderState({ mode: 'create', rule: null })}
              >
                새 규칙 만들기
              </Button>
            </div>
            <AlertRuleTable
              onEdit={(rule) => setBuilderState({ mode: 'edit', rule })}
              onDuplicate={(rule) =>
                setBuilderState({ mode: 'duplicate', rule })
              }
            />
          </Card>

          <Card aria-labelledby="alert-channels-section-title">
            <div className="mb-5 border-b border-app-border pb-4">
              <h3
                id="alert-channels-section-title"
                className="text-lg font-semibold text-app-text"
              >
                채널 설정
              </h3>
              <p className="mt-1 text-sm text-app-text-muted">
                알림을 어디에서 받을지 관리합니다.
              </p>
            </div>
            <NotificationChannelPanel />
          </Card>
        </div>
      </section>

      <AlertRuleBuilder
        isOpen={builderState !== null}
        mode={builderState?.mode}
        rule={builderState?.rule}
        prefill={builderState?.prefill}
        onClose={() => setBuilderState(null)}
      />
    </section>
  )
}
