import { useState } from 'react'
import { Pencil, Plus, Trash2, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import {
  useBudgets,
  useCategories,
  useDeleteBudget,
  useSaveBudget,
} from '../api/hooks'
import type { Budget } from '../api/types'
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
import { EXPENSE_COLOR, INCOME_COLOR, WARNING_COLOR } from '../lib/colors'
import { formatMoney, monthLabel } from '../lib/format'

function BudgetCard({
  budget,
  onEdit,
  onDelete,
}: {
  budget: Budget
  onEdit: (b: Budget) => void
  onDelete: (id: number) => void
}) {
  const pct = budget.limitAmount > 0 ? (budget.spentAmount / budget.limitAmount) * 100 : 0
  const over = budget.spentAmount > budget.limitAmount
  const remaining = budget.limitAmount - budget.spentAmount
  const barColor = over ? EXPENSE_COLOR : pct > 80 ? WARNING_COLOR : INCOME_COLOR

  return (
    <Card className="group relative overflow-hidden p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
      {/* Accent bar in the category color — grows in on hover */}
      <span
        className="absolute left-0 top-1/2 h-12 w-1 origin-center -translate-y-1/2 scale-y-0 rounded-r-full opacity-0 transition-all duration-200 group-hover:scale-y-100 group-hover:opacity-100"
        style={{ backgroundColor: budget.categoryColor }}
      />
      <div className="flex items-center gap-3">
        <span className="transition-transform duration-200 group-hover:scale-110">
          <CategoryIcon icon={budget.categoryIcon} color={budget.categoryColor} size={42} />
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {budget.categoryName}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {monthLabel(budget.month)} {budget.year}
          </p>
        </div>
        <div className="flex translate-x-2 gap-0.5 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100 max-md:translate-x-0 max-md:opacity-100">
          <button
            onClick={() => onEdit(budget)}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-100"
            title="Editar"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => onDelete(budget.id)}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-500/20 dark:hover:text-red-400"
            title="Apagar"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: barColor }}
        />
      </div>
      <div className="mt-2 flex items-baseline justify-between">
        <span className="text-sm">
          <span
            className={`font-semibold ${
              over ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-slate-100'
            }`}
          >
            {formatMoney(budget.spentAmount)}
          </span>
          <span className="text-slate-400 dark:text-slate-500">
            {' '}
            / {formatMoney(budget.limitAmount)}
          </span>
        </span>
        <span
          className={`text-xs font-medium ${
            over ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
          }`}
        >
          {over
            ? `${formatMoney(Math.abs(remaining))} acima`
            : `${formatMoney(remaining)} disponível`}
        </span>
      </div>
    </Card>
  )
}

const now = new Date()

export function Budgets() {
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Budget | null>(null)
  const [categoryId, setCategoryId] = useState('')
  const [limit, setLimit] = useState('')
  const [formError, setFormError] = useState('')

  const { data: categories = [] } = useCategories()
  const { data: budgets = [], isLoading } = useBudgets(year, month)
  const saveBudget = useSaveBudget()
  const deleteBudget = useDeleteBudget()
  const confirm = useConfirm()

  const expenseCategories = categories.filter((c) => c.type === 'Expense')

  function openCreate() {
    setEditing(null)
    setCategoryId('')
    setLimit('')
    setFormError('')
    setModalOpen(true)
  }

  function openEdit(b: Budget) {
    setEditing(b)
    setCategoryId(String(b.categoryId))
    setLimit(String(b.limitAmount))
    setFormError('')
    setModalOpen(true)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    if (!editing && !categoryId) {
      setFormError('Escolhe uma categoria.')
      return
    }
    try {
      await saveBudget.mutateAsync({
        id: editing?.id,
        categoryId: Number(categoryId),
        year,
        month,
        limitAmount: Number(limit),
      })
      setModalOpen(false)
      toast.success(editing ? 'Orçamento atualizado.' : 'Orçamento criado.')
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Não foi possível guardar.')
    }
  }

  async function remove(id: number) {
    const ok = await confirm({
      title: 'Apagar orçamento',
      message: 'Tens a certeza que queres apagar este orçamento?',
      confirmLabel: 'Apagar',
      danger: true,
    })
    if (!ok) return
    try {
      await deleteBudget.mutateAsync(id)
      toast.success('Orçamento apagado.')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Não foi possível apagar.')
    }
  }

  const totalLimit = budgets.reduce((sum, b) => sum + b.limitAmount, 0)
  const totalSpent = budgets.reduce((sum, b) => sum + b.spentAmount, 0)
  const totalPct = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orçamentos"
        subtitle="Define limites de gastos por categoria"
        action={
          <Button onClick={openCreate}>
            <Plus size={16} /> Novo orçamento
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-4 transition duration-200 hover:shadow-md">
          <Label>Período</Label>
          <div className="grid grid-cols-2 gap-2">
            <Select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {monthLabel(m)}
                </option>
              ))}
            </Select>
            <Select value={year} onChange={(e) => setYear(Number(e.target.value))}>
              {Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </Select>
          </div>
        </Card>

        <Card className="p-4 transition duration-200 hover:shadow-md lg:col-span-2">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-slate-500 dark:text-slate-400">
              Gasto total em {monthLabel(month)}
            </span>
            <span className="text-sm">
              <span
                className={`font-semibold ${
                  totalSpent > totalLimit
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-slate-900 dark:text-slate-100'
                }`}
              >
                {formatMoney(totalSpent)}
              </span>
              <span className="text-slate-400 dark:text-slate-500">
                {' '}
                / {formatMoney(totalLimit)}
              </span>
            </span>
          </div>
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
            <div
              className={`h-full rounded-full transition-all ${
                totalSpent > totalLimit ? 'bg-red-500' : 'bg-slate-900 dark:bg-slate-100'
              }`}
              style={{ width: `${Math.min(totalPct, 100)}%` }}
            />
          </div>
        </Card>
      </div>

      {isLoading ? (
        <CardGridSkeleton count={6} />
      ) : budgets.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Sem orçamentos para este mês."
          hint="Define um limite por categoria para acompanhares os teus gastos e evitares surpresas ao fim do mês."
          action={
            <Button onClick={openCreate}>
              <Plus size={16} /> Criar orçamento
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {budgets.map((b) => (
            <BudgetCard key={b.id} budget={b} onEdit={openEdit} onDelete={remove} />
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        title={editing ? 'Editar orçamento' : 'Novo orçamento'}
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label>Categoria</Label>
            <Select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={!!editing}
              required
            >
              <option value="">Escolher…</option>
              {expenseCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>
              Limite para {monthLabel(month)} {year} (€)
            </Label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
            />
          </div>
          <ErrorText>{formError}</ErrorText>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saveBudget.isPending}>
              {saveBudget.isPending ? 'A guardar…' : 'Guardar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
