import { useSettingsProfile } from '@/features/settings/queries'
import { Badge, Card, EmptyState, ErrorState, Skeleton } from '@/shared/ui'

export function SettingsPage() {
  const profile = useSettingsProfile()

  if (profile.isLoading) {
    return (
      <Card>
        <Skeleton lines={4} />
      </Card>
    )
  }

  if (profile.isError) {
    return (
      <ErrorState
        title="설정을 불러오지 못했습니다"
        description="계정 프로필 조회를 다시 시도해 주세요."
        onRetry={() => void profile.refetch()}
      />
    )
  }

  if (!profile.data) {
    return (
      <EmptyState
        title="프로필 정보가 없습니다"
        description="로그인 상태를 확인한 뒤 다시 시도해 주세요."
      />
    )
  }

  return (
    <div className="flex max-w-3xl flex-col gap-5">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-app-text-muted">
          Settings
        </p>
        <h1 className="mt-1 text-3xl font-bold text-app-text">설정</h1>
      </header>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-app-text">계정 프로필</h2>
            <p className="mt-2 text-sm text-app-text-muted">
              인증 서버의 내 계정 정보입니다.
            </p>
          </div>
          <Badge tone={profile.data.isActive ? 'accent' : 'neutral'}>
            {profile.data.isActive ? '활성' : '비활성'}
          </Badge>
        </div>
        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-control border border-app-border bg-app-surface-muted p-4">
            <dt className="text-sm text-app-text-muted">사용자 ID</dt>
            <dd className="mt-1 text-lg font-bold text-app-text">
              {profile.data.id}
            </dd>
          </div>
          <div className="rounded-control border border-app-border bg-app-surface-muted p-4">
            <dt className="text-sm text-app-text-muted">이메일</dt>
            <dd className="mt-1 break-all text-lg font-bold text-app-text">
              {profile.data.email}
            </dd>
          </div>
        </dl>
      </Card>

      {/* G11: 알림 설정 API는 폐기되어 mock 설정 섹션은 렌더링하지 않는다. */}
    </div>
  )
}
