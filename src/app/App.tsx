export default function App() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 text-slate-900">
      <h1 className="text-3xl font-bold">AI Assisted React Template</h1>
      <p
        data-testid="status"
        className="rounded bg-green-100 px-3 py-1 font-medium text-green-800"
      >
        status: ok
      </p>
    </main>
  )
}
