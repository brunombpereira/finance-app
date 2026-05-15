import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MailCheck } from 'lucide-react'
import { useForgotPassword } from '../api/hooks'
import { Button, ErrorText, Input, Label } from '../components/ui'
import { ApiError } from '../api/client'

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const forgot = useForgotPassword()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      await forgot.mutateAsync(email)
      setSent(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível enviar o email.')
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
            Recuperar password
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Enviamos-te um link para definires uma nova
          </p>
        </div>

        {sent ? (
          <div className="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
            <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
              <MailCheck size={24} />
            </span>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Se o email existir, enviámos um link para recuperar a password. Verifica a tua
              caixa de entrada.
            </p>
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700"
          >
            <div className="mb-2">
              <Label>Email</Label>
              <Input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
              />
            </div>
            <ErrorText>{error}</ErrorText>
            <Button type="submit" disabled={forgot.isPending} className="mt-4 w-full">
              {forgot.isPending ? 'A enviar…' : 'Enviar link'}
            </Button>
          </form>
        )}

        <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
          <Link
            to="/login"
            className="font-medium text-slate-900 hover:underline dark:text-slate-100"
          >
            Voltar ao início de sessão
          </Link>
        </p>
      </div>
    </div>
  )
}
