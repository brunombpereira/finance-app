import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, MailCheck } from 'lucide-react'
import { useForgotPassword } from '../api/hooks'
import { AuthCard, AuthLayout, IconInput } from '../components/AuthLayout'
import { Button, ErrorText, Label } from '../components/ui'
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
    <AuthLayout title="Recuperar password" subtitle="Enviamos-te um link para definires uma nova">
      <AuthCard>
        {sent ? (
          <div>
            <span className="mb-3 grid h-11 w-11 place-items-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
              <MailCheck size={22} />
            </span>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Se o email existir, enviámos um link para recuperar a password. Verifica a tua caixa
              de entrada.
            </p>
          </div>
        ) : (
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
            <ErrorText>{error}</ErrorText>
            <Button type="submit" variant="brand" disabled={forgot.isPending} className="w-full">
              {forgot.isPending ? 'A enviar…' : 'Enviar link'}
            </Button>
          </form>
        )}
      </AuthCard>

      <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        <Link to="/login" className="font-medium text-slate-900 hover:underline dark:text-slate-100">
          Voltar ao início de sessão
        </Link>
      </p>
    </AuthLayout>
  )
}
