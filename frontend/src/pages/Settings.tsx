import { useState } from 'react'
import { toast } from 'sonner'
import { useChangePassword } from '../api/hooks'
import { Button, Card, ErrorText, Input, Label, PageHeader } from '../components/ui'
import { ApiError } from '../api/client'

export function Settings() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState('')
  const changePassword = useChangePassword()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      await changePassword.mutateAsync({ currentPassword, newPassword })
      setCurrentPassword('')
      setNewPassword('')
      toast.success('Password alterada.')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível alterar a password.')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Definições" subtitle="Gere a tua conta" />

      <Card className="max-w-md p-5">
        <h2 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-200">
          Mudar password
        </h2>
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <Label>Password atual</Label>
            <Input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div>
            <Label>Nova password</Label>
            <Input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <ErrorText>{error}</ErrorText>
          <div className="flex justify-end pt-1">
            <Button type="submit" disabled={changePassword.isPending}>
              {changePassword.isPending ? 'A guardar…' : 'Guardar'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
