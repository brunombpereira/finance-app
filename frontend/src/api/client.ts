const TOKEN_KEY = 'financeapp.token'
const REFRESH_KEY = 'financeapp.refreshToken'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY)
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export function setRefreshToken(token: string | null) {
  if (token) localStorage.setItem(REFRESH_KEY, token)
  else localStorage.removeItem(REFRESH_KEY)
}

export function setTokens(accessToken: string, refreshToken: string) {
  setToken(accessToken)
  setRefreshToken(refreshToken)
}

export function clearTokens() {
  setToken(null)
  setRefreshToken(null)
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

type Options = {
  method?: string
  body?: unknown
  auth?: boolean
}

// A single in-flight refresh shared by every request that hits a 401 at once.
let refreshPromise: Promise<boolean> | null = null

async function tryRefresh(): Promise<boolean> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return false

  refreshPromise ??= (async () => {
    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })
      if (!res.ok) return false
      const data = (await res.json()) as { token: string; refreshToken: string }
      setTokens(data.token, data.refreshToken)
      return true
    } catch {
      return false
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

export async function api<T>(path: string, options: Options = {}): Promise<T> {
  const { method = 'GET', body, auth = true } = options

  const doFetch = () => {
    const headers: Record<string, string> = {}
    if (body !== undefined) headers['Content-Type'] = 'application/json'
    const token = getToken()
    if (auth && token) headers['Authorization'] = `Bearer ${token}`
    return fetch(`/api${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  }

  let res = await doFetch()

  // Access token likely expired — refresh once and retry the request.
  if (res.status === 401 && auth) {
    const refreshed = await tryRefresh()
    if (refreshed) res = await doFetch()
  }

  if (res.status === 401) {
    clearTokens()
    if (!location.pathname.startsWith('/login')) location.href = '/login'
    throw new ApiError(401, 'Sessão expirada. Inicia sessão novamente.')
  }

  if (!res.ok) {
    let message = `Erro ${res.status}`
    try {
      const data = await res.json()
      message = data.message ?? (data.errors ? Object.values(data.errors).flat().join(' ') : message)
    } catch {
      /* resposta sem corpo JSON */
    }
    throw new ApiError(res.status, message)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}
