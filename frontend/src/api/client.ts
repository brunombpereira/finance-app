const TOKEN_KEY = 'financeapp.token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
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

export async function api<T>(path: string, options: Options = {}): Promise<T> {
  const { method = 'GET', body, auth = true } = options
  const headers: Record<string, string> = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  const token = getToken()
  if (auth && token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (res.status === 401) {
    setToken(null)
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
