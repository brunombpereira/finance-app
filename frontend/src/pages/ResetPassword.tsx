import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CircleCheck } from 'lucide-react'
import { useResetPassword } from '../api/hooks'
import { Button, ErrorText, Input, Label } from '../components/ui'
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
    <div className="flex min-h-full items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-indigo-600 text-lg font-bold text-white">
            €
          </span>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Nova password
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Define a tua nova password
          </p>
        </div>

        {!token ? (
          <div className="rounded-2xl bg-white p-6 text-center text-sm text-slate-600 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700">
            Link inválido. Pede um novo em "Recuperar password".
          </div>
        ) : done ? (
          <div className="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
            <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
              <CircleCheck size={24} />
            </span>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Password redefinida. Já podes iniciar sessão com a nova password.
            </p>
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700"
          >
            <div className="mb-2">
              <Label>Nova password</Label>
              <Input
                type="password"
                required
                minLength={6}
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <ErrorText>{error}</ErrorText>
            <Button type="submit" disabled={reset.isPending} className="mt-4 w-full">
              {reset.isPending ? 'A guardar…' : 'Definir password'}
            </Button>
          </form>
        )}

        <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
          <Link
            to="/login"
            className="font-medium text-slate-900 hover:underline dark:text-slate-100"
          >
            Ir para o início de sessão
          </Link>
        </p>
      </div>
    </div>
  )
}
