import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Lock, Mail, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { AuthCard, AuthLayout, IconInput, PasswordInput } from '../components/AuthLayout'
import { Button, ErrorText, Label } from '../components/ui'
import { ApiError } from '../api/client'

export function Register() {
  const { isAuthenticated, register } = useAuth()
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState('')
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
      await register(email, password, displayName)
      navigate('/')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível criar a conta.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Criar conta" subtitle="Começa a organizar as tuas finanças">
      <AuthCard>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label>Nome</Label>
            <IconInput
              icon={User}
              required
              autoFocus
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="O teu nome"
            />
          </div>
          <div>
            <Label>Email</Label>
            <IconInput
              icon={Mail}
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
            />
          </div>
          <div>
            <Label>Password</Label>
            <PasswordInput
              icon={Lock}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <ErrorText>{error}</ErrorText>
          <Button type="submit" variant="brand" disabled={loading} className="w-full">
            {loading ? 'A criar…' : 'Criar conta'}
          </Button>
        </form>
      </AuthCard>

      <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        Já tens conta?{' '}
        <Link to="/login" className="font-medium text-slate-900 hover:underline dark:text-slate-100">
          Iniciar sessão
        </Link>
      </p>
    </AuthLayout>
  )
}
