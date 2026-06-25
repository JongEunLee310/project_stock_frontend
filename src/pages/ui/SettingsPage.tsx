import { useMe } from '@/features/settings/queries'
import { Card, ErrorState, Skeleton } from '@/shared/ui'

export function SettingsPage() {
  const meQuery = useMe()

  if (meQuery.isLoading) {
    return (
      <section className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold text-app-text">설정</h1>
        <Skeleton className="h-40" />
      </section>
    )
  }

  if (meQuery.isError) {
    return (
      <ErrorState
        title="프로필을 불러오지 못했습니다"
        description={meQuery.error.message}
        onRetry={() => void meQuery.refetch()}
      />
    )
  }

  const profile = meQuery.data

  return (
    <section className="flex flex-col gap-4">
      <header className="flex min-h-16 items-center">
        <h1 className="text-3xl font-bold text-app-text">설정</h1>
      </header>

      <Card>
        <p className="text-sm font-semibold uppercase tracking-wide text-app-text-muted">
          Profile
        </p>
        <h2 className="mt-2 text-2xl font-bold text-app-text">
          {profile?.username ?? '사용자'}
        </h2>
        <dl className="mt-6 grid gap-3 md:grid-cols-3">
          <div className="rounded-control border border-app-border bg-app-surface-muted p-4">
            <dt className="text-xs font-medium text-app-text-muted">이메일</dt>
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
            <dt className="text-xs font-medium text-app-text-muted">가입일</dt>
            <dd className="mt-2 text-sm font-semibold text-app-text">
              {profile?.createdAt ?? '-'}
            </dd>
          </div>
        </dl>
      </Card>

      {/* G11 폐기 — 알림 설정 섹션은 AlertRule/채널 설정 폐기 결정에 따라 제거됨. */}
    </section>
  )
}
