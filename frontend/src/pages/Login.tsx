import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Lock, Mail } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { AuthCard, AuthLayout, IconInput, PasswordInput } from '../components/AuthLayout'
import { Button, ErrorText, Label } from '../components/ui'
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
    <AuthLayout title="Bem-vindo de volta" subtitle="Inicia sessão para continuar">
      <AuthCard>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label>Email</Label>
            <IconInput
              icon={Mail}
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
            />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <Label>Password</Label>
              <Link
                to="/forgot-password"
                className="text-xs font-medium text-cyan-600 hover:text-fuchsia-600 dark:text-cyan-400 dark:hover:text-fuchsia-400"
              >
                Esqueci-me
              </Link>
            </div>
            <PasswordInput
              icon={Lock}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
            />
          </div>
          <ErrorText>{error}</ErrorText>
          <Button type="submit" variant="brand" disabled={loading} className="w-full">
            {loading ? 'A entrar…' : 'Entrar'}
          </Button>
        </form>
      </AuthCard>

      <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        Não tens conta?{' '}
        <Link
          to="/register"
          className="font-medium text-slate-900 hover:underline dark:text-slate-100"
        >
          Criar conta
        </Link>
      </p>
    </AuthLayout>
  )
}
