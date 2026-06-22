import { Badge, Button, Card, Input } from '@/shared/ui'

export default function App() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-app-bg p-page text-app-text">
      <Card className="flex w-full max-w-xl flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Badge data-testid="status" status="안정">
            status: ok
          </Badge>
          <h1 className="text-3xl font-bold">AI Assisted React Template</h1>
          <p className="text-sm text-app-text-muted">
            Dark theme tokens and shared UI primitives are ready.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input aria-label="Sample input" placeholder="Search symbol" />
          <Button>Track</Button>
        </div>
      </Card>
    </main>
  )
}
