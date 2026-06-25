import { type FormEvent, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { useAuth } from '@/shared/auth/AuthProvider'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from: string = (location.state as { from?: string } | null)?.from ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErrorMsg(null)
    setIsPending(true)
    try {
      await login({ email, password })
      navigate(from, { replace: true })
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : '로그인에 실패했습니다')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cockpit-bg px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-6 text-center text-2xl font-bold text-app-text">
          로그인
        </h1>

        {errorMsg ? (
          <div
            role="alert"
            className="mb-4 rounded-control border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400"
          >
            {errorMsg}
          </div>
        ) : null}

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
          noValidate
        >
          <div className="flex flex-col gap-1">
            <label
              htmlFor="login-email"
              className="text-sm font-medium text-app-text"
            >
              이메일
            </label>
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="login-password"
              className="text-sm font-medium text-app-text"
            >
              비밀번호
            </label>
            <Input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <Button type="submit" variant="primary" disabled={isPending}>
            {isPending ? '로그인 중…' : '로그인'}
          </Button>
        </form>
      </div>
    </div>
  )
}
