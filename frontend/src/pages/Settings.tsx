import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Building2, Link2, Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  useBankConnections,
  useBankingStatus,
  useChangePassword,
  useCreateRequisition,
  useDeleteBankConnection,
  useFinalizeBankConnection,
  useInstitutions,
} from '../api/hooks'
import type { BankConnection } from '../api/types'
import { Button, Card, ErrorText, Input, Label, PageHeader, Select } from '../components/ui'
import { useConfirm } from '../context/ConfirmContext'
import { ApiError } from '../api/client'

const PENDING_REQUISITION_KEY = 'nexofinance.pending_requisition_id'

function statusBadge(status: string): { label: string; tone: string } {
  switch (status) {
    case 'LN':
      return { label: 'Ligada', tone: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' }
    case 'EX':
      return { label: 'Expirada', tone: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300' }
    case 'CR':
      return { label: 'Pendente', tone: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300' }
    default:
      return { label: status, tone: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' }
  }
}

function PasswordCard() {
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
  )
}

function BankConnectionRow({
  connection,
  onDelete,
}: {
  connection: BankConnection
  onDelete: (id: number) => void
}) {
  const badge = statusBadge(connection.status)
  return (
    <li className="flex items-center justify-between rounded-xl border border-slate-200 p-3 dark:border-slate-700">
      <div className="flex items-center gap-3">
        {connection.institutionLogo ? (
          <img
            src={connection.institutionLogo}
            alt=""
            className="h-9 w-9 rounded-lg object-contain"
          />
        ) : (
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300">
            <Building2 size={18} />
          </span>
        )}
        <div>
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
            {connection.institutionName}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {connection.linkedAccountCount} conta(s) ·{' '}
            <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] ${badge.tone}`}>
              {badge.label}
            </span>
          </p>
        </div>
      </div>
      <button
        onClick={() => onDelete(connection.id)}
        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-500/20 dark:hover:text-red-400"
        title="Remover"
      >
        <Trash2 size={16} />
      </button>
    </li>
  )
}

function BankingCard() {
  const { data: status } = useBankingStatus()
  const [country] = useState('PT')
  const [selected, setSelected] = useState('')
  const [searchParams, setSearchParams] = useSearchParams()

  const { data: connections = [], isLoading: connectionsLoading } = useBankConnections()
  const { data: institutions = [], isLoading: instLoading } = useInstitutions(
    country,
    Boolean(status?.configured),
  )
  const createRequisition = useCreateRequisition()
  const finalize = useFinalizeBankConnection()
  const del = useDeleteBankConnection()
  const confirm = useConfirm()

  // On return from the bank, the URL has ?banking=callback — finalise the pending requisition.
  useEffect(() => {
    if (searchParams.get('banking') !== 'callback') return
    const pending = localStorage.getItem(PENDING_REQUISITION_KEY)
    if (!pending) {
      setSearchParams({}, { replace: true })
      return
    }
    finalize
      .mutateAsync(pending)
      .then(() => toast.success('Banco ligado com sucesso.'))
      .catch((err) =>
        toast.error(err instanceof ApiError ? err.message : 'Não foi possível ligar o banco.'),
      )
      .finally(() => {
        localStorage.removeItem(PENDING_REQUISITION_KEY)
        setSearchParams({}, { replace: true })
      })
    // The mutation is stable across renders for our purposes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const sortedInstitutions = useMemo(
    () => [...institutions].sort((a, b) => a.name.localeCompare(b.name)),
    [institutions],
  )

  async function startConnection() {
    if (!selected) return
    try {
      const result = await createRequisition.mutateAsync(selected)
      localStorage.setItem(PENDING_REQUISITION_KEY, result.requisitionId)
      window.location.href = result.link
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Não foi possível iniciar a ligação.')
    }
  }

  async function remove(id: number) {
    const ok = await confirm({
      title: 'Remover ligação',
      message: 'Tens a certeza que queres remover esta ligação bancária?',
      confirmLabel: 'Remover',
      danger: true,
    })
    if (!ok) return
    try {
      await del.mutateAsync(id)
      toast.success('Ligação removida.')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Não foi possível remover.')
    }
  }

  if (!status?.configured) {
    return (
      <Card className="max-w-md p-5">
        <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
          <Link2 size={16} /> Ligações bancárias
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Open Banking não está configurado no servidor. Para ativar, regista-te em{' '}
          <a
            href="https://bankaccountdata.gocardless.com/"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-cyan-600 hover:underline dark:text-cyan-400"
          >
            bankaccountdata.gocardless.com
          </a>{' '}
          e define as variáveis <code>GOCARDLESS_SECRET_ID</code> e{' '}
          <code>GOCARDLESS_SECRET_KEY</code>.
        </p>
      </Card>
    )
  }

  return (
    <Card className="max-w-2xl p-5">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
        <Link2 size={16} /> Ligações bancárias
      </h2>

      {finalize.isPending && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-cyan-50 px-3 py-2 text-sm text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300">
          <Loader2 size={14} className="animate-spin" /> A confirmar a ligação…
        </div>
      )}

      {connectionsLoading ? (
        <p className="text-sm text-slate-400 dark:text-slate-500">A carregar…</p>
      ) : connections.length === 0 ? (
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          Sem ligações bancárias. Liga uma para começares.
        </p>
      ) : (
        <ul className="mb-4 space-y-2">
          {connections.map((c) => (
            <BankConnectionRow key={c.id} connection={c} onDelete={remove} />
          ))}
        </ul>
      )}

      <div className="rounded-xl border border-dashed border-slate-300 p-4 dark:border-slate-700">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
          Ligar novo banco
        </h3>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <Label>Banco</Label>
            <Select value={selected} onChange={(e) => setSelected(e.target.value)}>
              <option value="">
                {instLoading ? 'A carregar bancos…' : 'Escolhe o teu banco'}
              </option>
              {sortedInstitutions.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </Select>
          </div>
          <Button
            onClick={startConnection}
            disabled={!selected || createRequisition.isPending}
          >
            {createRequisition.isPending ? 'A preparar…' : 'Ligar'}
          </Button>
        </div>
        <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
          Vais ser redirecionado para o teu banco para autorizares o acesso.
        </p>
      </div>
    </Card>
  )
}

export function Settings() {
  return (
    <div className="space-y-6">
      <PageHeader title="Definições" subtitle="Gere a tua conta" />
      <PasswordCard />
      <BankingCard />
    </div>
  )
}
