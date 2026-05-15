import { useMemo, useState } from 'react'
import { ArrowLeftRight, Landmark, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  useAccounts,
  useDeleteAccount,
  useDeleteTransfer,
  useSaveAccount,
  useSaveTransfer,
  useTransfers,
} from '../api/hooks'
import type { Account, AccountType } from '../api/types'
import {
  Button,
  Card,
  EmptyState,
  ErrorText,
  Input,
  Label,
  PageHeader,
  Select,
} from '../components/ui'
import { CardGridSkeleton } from '../components/Skeletons'
import { Modal } from '../components/Modal'
import { CategoryIcon } from '../components/CategoryIcon'
import { useConfirm } from '../context/ConfirmContext'
import { ApiError } from '../api/client'
import { CATEGORY_ICONS, FALLBACK_ICON, ICON_KEYS } from '../lib/icons'
import { PRESET_COLORS } from '../lib/colors'
import {
  ACCOUNT_TYPES,
  ACCOUNT_TYPE_DEFAULT_ICON,
  ACCOUNT_TYPE_LABELS,
} from '../lib/accounts'
import { formatDate, formatMoney, todayIso } from '../lib/format'

interface AccountForm {
  id?: number
  name: string
  type: AccountType
  initialBalance: string
  color: string
  icon: string
}

const emptyAccount: AccountForm = {
  name: '',
  type: 'Checking',
  initialBalance: '0',
  color: '#6366f1',
  icon: 'wallet',
}

interface TransferForm {
  id?: number
  fromAccountId: string
  toAccountId: string
  amount: string
  date: string
  note: string
}

const emptyTransfer: TransferForm = {
  fromAccountId: '',
  toAccountId: '',
  amount: '',
  date: todayIso(),
  note: '',
}

export function Accounts() {
  const [accountModal, setAccountModal] = useState(false)
  const [accountForm, setAccountForm] = useState<AccountForm>(emptyAccount)
  const [accountError, setAccountError] = useState('')

  const [transferModal, setTransferModal] = useState(false)
  const [transferForm, setTransferForm] = useState<TransferForm>(emptyTransfer)
  const [transferError, setTransferError] = useState('')

  const { data: accounts = [], isLoading } = useAccounts()
  const { data: transfers = [] } = useTransfers()
  const saveAccount = useSaveAccount()
  const deleteAccount = useDeleteAccount()
  const saveTransfer = useSaveTransfer()
  const deleteTransfer = useDeleteTransfer()
  const confirm = useConfirm()

  const netWorth = useMemo(() => accounts.reduce((sum, a) => sum + a.balance, 0), [accounts])

  /* ---------- accounts ---------- */

  function openCreateAccount() {
    setAccountForm(emptyAccount)
    setAccountError('')
    setAccountModal(true)
  }

  function openEditAccount(a: Account) {
    setAccountForm({
      id: a.id,
      name: a.name,
      type: a.type,
      initialBalance: String(a.initialBalance),
      color: a.color,
      icon: a.icon,
    })
    setAccountError('')
    setAccountModal(true)
  }

  async function submitAccount(e: React.FormEvent) {
    e.preventDefault()
    setAccountError('')
    try {
      await saveAccount.mutateAsync({
        id: accountForm.id,
        name: accountForm.name,
        type: accountForm.type,
        initialBalance: Number(accountForm.initialBalance),
        color: accountForm.color,
        icon: accountForm.icon,
      })
      setAccountModal(false)
      toast.success(accountForm.id ? 'Conta atualizada.' : 'Conta criada.')
    } catch (err) {
      setAccountError(err instanceof ApiError ? err.message : 'Não foi possível guardar.')
    }
  }

  async function removeAccount(a: Account) {
    const ok = await confirm({
      title: 'Apagar conta',
      message: `Tens a certeza que queres apagar a conta "${a.name}"?`,
      confirmLabel: 'Apagar',
      danger: true,
    })
    if (!ok) return
    try {
      await deleteAccount.mutateAsync(a.id)
      toast.success('Conta apagada.')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Não foi possível apagar.')
    }
  }

  /* ---------- transfers ---------- */

  function openCreateTransfer() {
    setTransferForm({
      ...emptyTransfer,
      fromAccountId: accounts[0] ? String(accounts[0].id) : '',
      toAccountId: accounts[1] ? String(accounts[1].id) : '',
    })
    setTransferError('')
    setTransferModal(true)
  }

  async function submitTransfer(e: React.FormEvent) {
    e.preventDefault()
    setTransferError('')
    if (transferForm.fromAccountId === transferForm.toAccountId) {
      setTransferError('A conta de origem e de destino têm de ser diferentes.')
      return
    }
    try {
      await saveTransfer.mutateAsync({
        amount: Number(transferForm.amount),
        fromAccountId: Number(transferForm.fromAccountId),
        toAccountId: Number(transferForm.toAccountId),
        date: transferForm.date,
        note: transferForm.note,
      })
      setTransferModal(false)
      toast.success('Transferência registada.')
    } catch (err) {
      setTransferError(err instanceof ApiError ? err.message : 'Não foi possível guardar.')
    }
  }

  async function removeTransfer(id: number) {
    const ok = await confirm({
      title: 'Apagar transferência',
      message: 'Tens a certeza que queres apagar esta transferência?',
      confirmLabel: 'Apagar',
      danger: true,
    })
    if (!ok) return
    try {
      await deleteTransfer.mutateAsync(id)
      toast.success('Transferência apagada.')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Não foi possível apagar.')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contas"
        subtitle="O teu dinheiro e onde está"
        action={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={openCreateTransfer}
              disabled={accounts.length < 2}
            >
              <ArrowLeftRight size={16} /> Transferir
            </Button>
            <Button onClick={openCreateAccount}>
              <Plus size={16} /> Nova conta
            </Button>
          </div>
        }
      />

      {accounts.length > 0 && (
        <Card className="p-5 transition duration-200 hover:shadow-md">
          <p className="text-sm text-slate-500 dark:text-slate-400">Património total</p>
          <p
            className={`mt-1 text-3xl font-semibold ${
              netWorth < 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-slate-100'
            }`}
          >
            {formatMoney(netWorth)}
          </p>
        </Card>
      )}

      {isLoading ? (
        <CardGridSkeleton count={3} />
      ) : accounts.length === 0 ? (
        <EmptyState
          icon={Landmark}
          title="Ainda não tens contas."
          hint="Cria as tuas contas — à ordem, poupança, dinheiro vivo — para veres quanto tens e onde."
          action={
            <Button onClick={openCreateAccount}>
              <Plus size={16} /> Criar conta
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {accounts.map((a) => (
            <Card
              key={a.id}
              className="group relative overflow-hidden p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <span
                className="absolute left-0 top-1/2 h-12 w-1 origin-center -translate-y-1/2 scale-y-0 rounded-r-full opacity-0 transition-all duration-200 group-hover:scale-y-100 group-hover:opacity-100"
                style={{ backgroundColor: a.color }}
              />
              <div className="flex items-center gap-3">
                <span className="transition-transform duration-200 group-hover:scale-110">
                  <CategoryIcon icon={a.icon} color={a.color} size={42} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {a.name}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {ACCOUNT_TYPE_LABELS[a.type]}
                  </p>
                </div>
                <div className="flex translate-x-2 gap-0.5 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100 max-md:translate-x-0 max-md:opacity-100">
                  <button
                    onClick={() => openEditAccount(a)}
                    className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-100"
                    title="Editar"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => removeAccount(a)}
                    className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-500/20 dark:hover:text-red-400"
                    title="Apagar"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              <p
                className={`mt-4 text-2xl font-semibold ${
                  a.balance < 0
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-slate-900 dark:text-slate-100'
                }`}
              >
                {formatMoney(a.balance)}
              </p>
            </Card>
          ))}
        </div>
      )}

      {transfers.length > 0 && (
        <Card>
          <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-700">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Transferências recentes
            </h2>
          </div>
          <ul className="divide-y divide-slate-100 dark:divide-slate-700">
            {transfers.map((t) => (
              <li
                key={t.id}
                className="group flex items-center gap-4 px-5 py-3.5 transition-colors duration-200 hover:bg-slate-50 dark:hover:bg-slate-700/40"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                  <ArrowLeftRight size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                    {t.fromAccountName} → {t.toAccountName}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {t.note ? `${t.note} · ` : ''}
                    {formatDate(t.date)}
                  </p>
                </div>
                <span className="text-sm font-semibold tabular-nums text-slate-700 dark:text-slate-200">
                  {formatMoney(t.amount)}
                </span>
                <button
                  onClick={() => removeTransfer(t.id)}
                  className="rounded-lg p-2 text-slate-400 opacity-0 transition hover:bg-red-100 hover:text-red-600 group-hover:opacity-100 max-md:opacity-100 dark:hover:bg-red-500/20 dark:hover:text-red-400"
                  title="Apagar"
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Account modal */}
      <Modal
        open={accountModal}
        title={accountForm.id ? 'Editar conta' : 'Nova conta'}
        onClose={() => setAccountModal(false)}
      >
        <form onSubmit={submitAccount} className="space-y-4">
          <div className="flex items-center gap-3">
            <CategoryIcon icon={accountForm.icon} color={accountForm.color} size={48} />
            <div className="flex-1">
              <Label>Nome</Label>
              <Input
                required
                maxLength={60}
                autoFocus
                value={accountForm.name}
                onChange={(e) => setAccountForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ex: Conta à ordem"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tipo</Label>
              <Select
                value={accountForm.type}
                onChange={(e) => {
                  const type = e.target.value as AccountType
                  setAccountForm((f) => ({
                    ...f,
                    type,
                    icon: ACCOUNT_TYPE_DEFAULT_ICON[type],
                  }))
                }}
              >
                {ACCOUNT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {ACCOUNT_TYPE_LABELS[t]}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Saldo inicial (€)</Label>
              <Input
                type="number"
                step="0.01"
                required
                value={accountForm.initialBalance}
                onChange={(e) =>
                  setAccountForm((f) => ({ ...f, initialBalance: e.target.value }))
                }
              />
            </div>
          </div>

          <div>
            <Label>Cor</Label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setAccountForm((f) => ({ ...f, color }))}
                  className={`h-7 w-7 rounded-full transition ${
                    accountForm.color === color
                      ? 'ring-2 ring-slate-900 ring-offset-2 dark:ring-slate-100 dark:ring-offset-slate-800'
                      : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div>
            <Label>Ícone</Label>
            <div className="grid grid-cols-8 gap-1.5">
              {ICON_KEYS.map((key) => {
                const Icon = CATEGORY_ICONS[key] ?? FALLBACK_ICON
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setAccountForm((f) => ({ ...f, icon: key }))}
                    className={`grid h-9 place-items-center rounded-lg transition ${
                      accountForm.icon === key
                        ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                    }`}
                  >
                    <Icon size={17} />
                  </button>
                )
              })}
            </div>
          </div>

          <ErrorText>{accountError}</ErrorText>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setAccountModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saveAccount.isPending}>
              {saveAccount.isPending ? 'A guardar…' : 'Guardar'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Transfer modal */}
      <Modal open={transferModal} title="Nova transferência" onClose={() => setTransferModal(false)}>
        <form onSubmit={submitTransfer} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>De</Label>
              <Select
                value={transferForm.fromAccountId}
                onChange={(e) =>
                  setTransferForm((f) => ({ ...f, fromAccountId: e.target.value }))
                }
                required
              >
                <option value="">Escolher…</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Para</Label>
              <Select
                value={transferForm.toAccountId}
                onChange={(e) => setTransferForm((f) => ({ ...f, toAccountId: e.target.value }))}
                required
              >
                <option value="">Escolher…</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Valor (€)</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={transferForm.amount}
                onChange={(e) => setTransferForm((f) => ({ ...f, amount: e.target.value }))}
              />
            </div>
            <div>
              <Label>Data</Label>
              <Input
                type="date"
                required
                value={transferForm.date}
                onChange={(e) => setTransferForm((f) => ({ ...f, date: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <Label>Nota (opcional)</Label>
            <Input
              value={transferForm.note}
              maxLength={280}
              onChange={(e) => setTransferForm((f) => ({ ...f, note: e.target.value }))}
              placeholder="Ex: poupança do mês"
            />
          </div>
          <ErrorText>{transferError}</ErrorText>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setTransferModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saveTransfer.isPending}>
              {saveTransfer.isPending ? 'A guardar…' : 'Transferir'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
