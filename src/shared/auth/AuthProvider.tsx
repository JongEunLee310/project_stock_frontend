import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { fetchMe, login as apiLogin, type MeUser } from './authApi'
import { clearTokens, getTokens, subscribeAuthExpired } from './tokenStore'

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

interface AuthContextValue {
  status: AuthStatus
  user: MeUser | null
  login: (credentials: { email: string; password: string }) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<MeUser | null>(null)
  const [expiredBanner, setExpiredBanner] = useState(false)
  // 마운트 중 구독 해제를 위한 ref
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  // 부팅: 토큰 유무로 초기 상태 결정
  useEffect(() => {
    const tokens = getTokens()
    if (!tokens) {
      setStatus('unauthenticated')
      return
    }

    fetchMe()
      .then((me) => {
        if (!mounted.current) return
        setUser(me)
        setStatus('authenticated')
      })
      .catch(() => {
        // 토큰 있어도 fetchMe 실패 → 로그인 필요
        if (!mounted.current) return
        clearTokens()
        setStatus('unauthenticated')
      })
  }, [])

  // 만료 이벤트 구독
  useEffect(() => {
    const unsub = subscribeAuthExpired(() => {
      if (!mounted.current) return
      clearTokens()
      setUser(null)
      setStatus('unauthenticated')
      setExpiredBanner(true)
    })
    return unsub
  }, [])

  const login = useCallback(
    async (credentials: { email: string; password: string }) => {
      const result = await apiLogin(credentials)
      let me: MeUser | null = result.me ?? null
      if (!me) {
        me = await fetchMe()
      }
      setUser(me)
      setStatus('authenticated')
      setExpiredBanner(false)
    },
    [],
  )

  const logout = useCallback(() => {
    clearTokens()
    setUser(null)
    setStatus('unauthenticated')
    setExpiredBanner(false)
  }, [])

  return (
    <AuthContext.Provider value={{ status, user, login, logout }}>
      {expiredBanner && (
        <div
          role="alert"
          aria-live="assertive"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            padding: '12px 16px',
            background: '#dc2626',
            color: '#fff',
            textAlign: 'center',
            fontSize: '14px',
          }}
        >
          로그인이 만료됐습니다. 다시 로그인해 주세요.
          <button
            onClick={() => setExpiredBanner(false)}
            style={{
              marginLeft: 12,
              background: 'transparent',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
            }}
            aria-label="닫기"
          >
            ✕
          </button>
        </div>
      )}
      {children}
    </AuthContext.Provider>
  )
}

interface RequireAuthProps {
  children: ReactNode
}

export function RequireAuth({ children }: RequireAuthProps) {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    // 초기 로딩 중 - 아무것도 렌더하지 않음(플리커 방지)
    return null
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}
