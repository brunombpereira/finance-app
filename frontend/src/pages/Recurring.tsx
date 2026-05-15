import { useMemo, useState } from 'react'
import { Pause, Pencil, Plus, Repeat, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  useAccounts,
  useCategories,
  useDeleteRecurring,
  useRecurring,
  useSaveRecurring,
} from '../api/hooks'
import type { RecurringTransaction, TransactionType } from '../api/types'
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
import { useConfirm } from '../context/ConfirmContext'
import { ApiError } from '../api/client'
import { CategoryIcon } from '../components/CategoryIcon'
import { formatMoney, todayIso } from '../lib/format'

interface FormState {
  id?: number
  amount: string
  type: TransactionType
  categoryId: string
  accountId: string
  dayOfMonth: string
  note: string
  active: boolean
  startDate: string
}

const emptyForm: FormState = {
  amount: '',
  type: 'Expense',
  categoryId: '',
  accountId: '',
  dayOfMonth: '1',
  note: '',
  active: true,
  startDate: todayIso(),
}

export function Recurring() {
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [formError, setFormError] = useState('')

  const { data: categories = [] } = useCategories()
  const { data: accounts = [] } = useAccounts()
  const { data: rules = [], isLoading } = useRecurring()
  const saveRecurring = useSaveRecurring()
  const deleteRecurring = useDeleteRecurring()
  const confirm = useConfirm()

  const categoriesForType = useMemo(
    () => categories.filter((c) => c.type === form.type),
    [categories, form.type],
  )

  const monthlyNet = useMemo(() => {
    let income = 0
    let expense = 0
    for (const r of rules) {
      if (!r.active) continue
      if (r.type === 'Income') income += r.amount
      else expense += r.amount
    }
    return income - expense
  }, [rules])

  function openCreate() {
    setForm({ ...emptyForm, accountId: accounts[0] ? String(accounts[0].id) : '' })
    setFormError('')
    setModalOpen(true)
  }

  function openEdit(r: RecurringTransaction) {
    setForm({
      id: r.id,
      amount: String(r.amount),
      type: r.type,
      categoryId: String(r.categoryId),
      accountId: String(r.accountId),
      dayOfMonth: String(r.dayOfMonth),
      note: r.note,
      active: r.active,
      startDate: r.startDate,
    })
    setFormError('')
    setModalOpen(true)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    if (!form.categoryId) {
      setFormError('Escolhe uma categoria.')
      return
    }
    if (!form.accountId) {
      setFormError('Escolhe uma conta.')
      return
    }
    try {
      await saveRecurring.mutateAsync({
        id: form.id,
        amount: Number(form.amount),
        type: form.type,
        categoryId: Number(form.categoryId),
        accountId: Number(form.accountId),
        dayOfMonth: Number(form.dayOfMonth),
        note: form.note,
        active: form.active,
        startDate: form.startDate,
      })
      setModalOpen(false)
      toast.success(form.id ? 'Recorrência atualizada.' : 'Recorrência criada.')
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Não foi possível guardar.')
    }
  }

  async function remove(r: RecurringTransaction) {
    const ok = await confirm({
      title: 'Apagar recorrência',
      message:
        'Apagar esta regra recorrente? As transações já criadas por ela mantêm-se.',
      confirmLabel: 'Apagar',
      danger: true,
    })
    if (!ok) return
    try {
      await deleteRecurring.mutateAsync(r.id)
      toast.success('Recorrência apagada.')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Não foi possível apagar.')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transações recorrentes"
        subtitle="Regras que lançam transações automaticamente todos os meses"
        action={
          <Button onClick={openCreate}>
            <Plus size={16} /> Nova recorrência
          </Button>
        }
      />

      {rules.length > 0 && (
        <Card className="p-4 transition duration-200 hover:shadow-md">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-slate-500 dark:text-slate-400">
              Impacto mensal (regras ativas)
            </span>
            <span
              className={`text-lg font-semibold ${
                monthlyNet < 0
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {monthlyNet >= 0 ? '+' : ''}
              {formatMoney(monthlyNet)}
            </span>
          </div>
        </Card>
      )}

      {isLoading ? (
        <CardGridSkeleton count={3} />
      ) : rules.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title="Ainda não tens transações recorrentes."
          hint="Cria uma regra — por exemplo, o ordenado no dia 1 ou a renda no dia 8 — e a app lança-a sozinha todos os meses."
          action={
            <Button onClick={openCreate}>
              <Plus size={16} /> Criar recorrência
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rules.map((r) => (
            <Card
              key={r.id}
              className={`group relative overflow-hidden p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                r.active ? '' : 'opacity-60'
              }`}
            >
              <span
                className="absolute left-0 top-1/2 h-12 w-1 origin-center -translate-y-1/2 scale-y-0 rounded-r-full opacity-0 transition-all duration-200 group-hover:scale-y-100 group-hover:opacity-100"
                style={{ backgroundColor: r.categoryColor }}
              />
              <div className="flex items-center gap-3">
                <span className="transition-transform duration-200 group-hover:scale-110">
                  <CategoryIcon icon={r.categoryIcon} color={r.categoryColor} size={42} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {r.note || r.categoryName}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Dia {r.dayOfMonth} de cada mês · {r.categoryName}
                  </p>
                </div>
                <div className="flex translate-x-2 gap-0.5 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100 max-md:translate-x-0 max-md:opacity-100">
                  <button
                    onClick={() => openEdit(r)}
                    className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-100"
                    title="Editar"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => remove(r)}
                    className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-500/20 dark:hover:text-red-400"
                    title="Apagar"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span
                  className={`text-lg font-semibold ${
                    r.type === 'Income'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {r.type === 'Income' ? '+' : '−'}
                  {formatMoney(r.amount)}
                </span>
                {!r.active && (
                  <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                    <Pause size={11} /> Pausada
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        title={form.id ? 'Editar recorrência' : 'Nova recorrência'}
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tipo</Label>
              <Select
                value={form.type}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    type: e.target.value as TransactionType,
                    categoryId: '',
                  }))
                }
              >
                <option value="Expense">Despesa</option>
                <option value="Income">Receita</option>
              </Select>
            </div>
            <div>
              <Label>Valor (€)</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Categoria</Label>
              <Select
                value={form.categoryId}
                onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                required
              >
                <option value="">Escolher…</option>
                {categoriesForType.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Conta</Label>
              <Select
                value={form.accountId}
                onChange={(e) => setForm((f) => ({ ...f, accountId: e.target.value }))}
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
              <Label>Dia do mês</Label>
              <Input
                type="number"
                min="1"
                max="28"
                required
                value={form.dayOfMonth}
                onChange={(e) => setForm((f) => ({ ...f, dayOfMonth: e.target.value }))}
              />
            </div>
            <div>
              <Label>Início</Label>
              <Input
                type="date"
                required
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <Label>Nota (opcional)</Label>
            <Input
              value={form.note}
              maxLength={280}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              placeholder="Ex: Ordenado, Renda da casa"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 dark:bg-slate-900"
            />
            Regra ativa (lança transações automaticamente)
          </label>
          <ErrorText>{formError}</ErrorText>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saveRecurring.isPending}>
              {saveRecurring.isPending ? 'A guardar…' : 'Guardar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
