import { Link } from 'react-router-dom'

import { Card } from '@/shared/ui'

export function NotFoundPage() {
  return (
    <section className="flex min-h-[50vh] items-center justify-center">
      <Card className="flex max-w-lg flex-col items-start gap-4">
        <p className="text-sm font-semibold uppercase text-app-accent">Not Found</p>
        <h1 className="text-3xl font-bold text-app-text">Page not found</h1>
        <p className="text-sm leading-6 text-app-text-muted">
          The requested route is not available in this workspace.
        </p>
        <Link
          to="/"
          className="mt-2 inline-flex min-h-10 items-center justify-center rounded-control border border-app-accent-strong bg-app-accent-strong px-4 py-2 text-sm font-semibold text-app-accent-text transition-colors hover:bg-app-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent"
        >
          Back to dashboard
        </Link>
      </Card>
    </section>
  )
}
