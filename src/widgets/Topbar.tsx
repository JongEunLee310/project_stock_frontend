import { Button } from '@/shared/ui'

export function Topbar() {
  return (
    <header className="flex min-h-20 flex-wrap items-center justify-end gap-4 border-b border-cockpit-border bg-cockpit-bg px-4 py-3 lg:px-5">
      <div className="flex items-center gap-3 text-sm text-cockpit-text">
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        <span>
          동기화 <strong className="font-semibold">14:32</strong>
        </span>
        <Button
          variant="ghost"
          className="h-9 w-9 px-0 text-xl"
          aria-label="새로고침"
          title="새로고침"
        >
          ↻
        </Button>
      </div>
      <div className="h-8 w-px bg-cockpit-border" />
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          className="h-9 w-9 px-0 text-xl"
          aria-label="알림"
          title="알림"
        >
          ♧
        </Button>
        <Button
          variant="ghost"
          className="h-9 w-9 px-0 text-xl"
          aria-label="도움말"
          title="도움말"
        >
          ?
        </Button>
        <span className="grid h-10 w-10 place-items-center rounded-full bg-cockpit-accent-strong text-sm font-semibold text-cockpit-accent-text">
          IC
        </span>
        <span className="text-lg text-cockpit-text-muted">⌄</span>
      </div>
    </header>
  )
}
