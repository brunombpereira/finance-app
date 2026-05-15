import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button, ErrorText, Input, Label } from '../components/ui'
import { ApiError } from '../api/client'

export function Login() {
  const { isAuthenticated, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (isAuthenticated) return <Navigate to="/" replace />

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível iniciar sessão.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-slate-900 text-lg font-bold text-white dark:bg-slate-100 dark:text-slate-900">
            €
          </span>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">FinanceApp</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Inicia sessão para continuar
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700"
        >
          <div className="mb-4">
            <Label>Email</Label>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
            />
          </div>
          <div className="mb-2">
            <Label>Password</Label>
            <Input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
            />
          </div>
          <ErrorText>{error}</ErrorText>
          <Button type="submit" disabled={loading} className="mt-4 w-full">
            {loading ? 'A entrar…' : 'Entrar'}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
          Não tens conta?{' '}
          <Link
            to="/register"
            className="font-medium text-slate-900 hover:underline dark:text-slate-100"
          >
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  )
}
