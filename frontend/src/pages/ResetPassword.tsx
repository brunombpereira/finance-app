import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CircleCheck, Lock } from 'lucide-react'
import { useResetPassword } from '../api/hooks'
import { AuthCard, AuthLayout, PasswordInput } from '../components/AuthLayout'
import { Button, ErrorText, Label } from '../components/ui'
import { ApiError } from '../api/client'

export function ResetPassword() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const reset = useResetPassword()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      await reset.mutateAsync({ token, newPassword: password })
      setDone(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível redefinir a password.')
    }
  }

  return (
    <AuthLayout title="Nova password" subtitle="Define a tua nova password">
      <AuthCard>
        {!token ? (
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Link inválido. Pede um novo em "Recuperar password".
          </p>
        ) : done ? (
          <div>
            <span className="mb-3 grid h-11 w-11 place-items-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
              <CircleCheck size={22} />
            </span>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Password redefinida. Já podes iniciar sessão com a nova password.
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label>Nova password</Label>
              <PasswordInput
                icon={Lock}
                required
                minLength={6}
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <ErrorText>{error}</ErrorText>
            <Button type="submit" variant="brand" disabled={reset.isPending} className="w-full">
              {reset.isPending ? 'A guardar…' : 'Definir password'}
            </Button>
          </form>
        )}
      </AuthCard>

      <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        <Link to="/login" className="font-medium text-slate-900 hover:underline dark:text-slate-100">
          Ir para o início de sessão
        </Link>
      </p>
    </AuthLayout>
  )
}
