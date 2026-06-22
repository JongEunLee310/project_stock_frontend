import { Badge, Button } from '@/shared/ui'

export function Topbar() {
  return (
    <header className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-app-border bg-app-surface px-page py-3">
      <div className="flex items-center gap-3">
        <Badge status="안정">Synced 09:30 KST</Badge>
        <span className="text-sm text-app-text-muted">
          US session pre-market
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          className="h-10 w-10 px-0"
          aria-label="Notifications"
          title="Notifications"
        >
          !
        </Button>
        <div className="flex min-h-10 items-center rounded-control border border-app-border bg-app-surface-muted px-3 text-sm font-semibold">
          Analyst
        </div>
      </div>
    </header>
  )
}
