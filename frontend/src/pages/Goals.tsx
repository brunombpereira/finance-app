import { useState } from 'react'
import { Link2, Pencil, Plus, Target, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  useAccounts,
  useContributeGoal,
  useDeleteGoal,
  useGoals,
  useSaveGoal,
} from '../api/hooks'
import type { SavingsGoal } from '../api/types'
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
import { formatDate, formatMoney } from '../lib/format'

interface FormState {
  id?: number
  name: string
  targetAmount: string
  currentAmount: string
  accountId: string
  targetDate: string
}

const emptyForm: FormState = {
  name: '',
  targetAmount: '',
  currentAmount: '0',
  accountId: '',
  targetDate: '',
}

function GoalCard({
  goal,
  onEdit,
  onContribute,
  onDelete,
}: {
  goal: SavingsGoal
  onEdit: (g: SavingsGoal) => void
  onContribute: (g: SavingsGoal) => void
  onDelete: (id: number) => void
}) {
  const pct = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0
  const done = goal.currentAmount >= goal.targetAmount
  const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0)

  return (
    <Card className="group relative flex flex-col overflow-hidden p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
      {/* Accent bar — grows in on hover */}
      <span
        className={`absolute left-0 top-1/2 h-14 w-1 origin-center -translate-y-1/2 scale-y-0 rounded-r-full opacity-0 transition-all duration-200 group-hover:scale-y-100 group-hover:opacity-100 ${
          done ? 'bg-emerald-500' : 'bg-indigo-500'
        }`}
      />
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span
            className={`grid h-11 w-11 place-items-center rounded-full transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 ${
              done
                ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400'
                : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400'
            }`}
          >
            <Target size={20} />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{goal.name}</p>
            {goal.targetDate && (
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Até {formatDate(goal.targetDate)}
              </p>
            )}
          </div>
        </div>
        <div className="flex translate-x-2 gap-0.5 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100">
          <button
            onClick={() => onEdit(goal)}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-100"
            title="Editar"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => onDelete(goal.id)}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-500/20 dark:hover:text-red-400"
            title="Apagar"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {formatMoney(goal.currentAmount)}
        </span>
        <span className="text-sm text-slate-400 dark:text-slate-500">
          de {formatMoney(goal.targetAmount)}
        </span>
      </div>
      <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            done ? 'bg-emerald-500' : 'bg-indigo-500'
          }`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">
        {done ? 'Meta concluída 🎉' : `Faltam ${formatMoney(remaining)} (${pct.toFixed(0)}%)`}
      </p>

      {goal.accountName && (
        <p className="mt-2 flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400">
          <Link2 size={12} /> Ligada a {goal.accountName}
        </p>
      )}

      <Button
        variant="secondary"
        onClick={() => onContribute(goal)}
        className="mt-4 w-full"
        disabled={done}
      >
        <Plus size={16} /> Contribuir
      </Button>
    </Card>
  )
}

export function Goals() {
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [formError, setFormError] = useState('')

  const [contributeGoal, setContributeGoal] = useState<SavingsGoal | null>(null)
  const [contributeAmount, setContributeAmount] = useState('')
  const [contributeFrom, setContributeFrom] = useState('')
  const [contributeError, setContributeError] = useState('')

  const { data: goals = [], isLoading } = useGoals()
  const { data: accounts = [] } = useAccounts()
  const saveGoal = useSaveGoal()
  const contribute = useContributeGoal()
  const deleteGoal = useDeleteGoal()
  const confirm = useConfirm()

  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0)
  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0)

  function openCreate() {
    setForm(emptyForm)
    setFormError('')
    setModalOpen(true)
  }

  function openEdit(g: SavingsGoal) {
    setForm({
      id: g.id,
      name: g.name,
      targetAmount: String(g.targetAmount),
      currentAmount: String(g.currentAmount),
      accountId: g.accountId ? String(g.accountId) : '',
      targetDate: g.targetDate ?? '',
    })
    setFormError('')
    setModalOpen(true)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    try {
      await saveGoal.mutateAsync({
        id: form.id,
        name: form.name,
        targetAmount: Number(form.targetAmount),
        currentAmount: Number(form.currentAmount),
        accountId: form.accountId ? Number(form.accountId) : null,
        targetDate: form.targetDate || null,
      })
      setModalOpen(false)
      toast.success(form.id ? 'Meta atualizada.' : 'Meta criada.')
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Não foi possível guardar.')
    }
  }

  function openContribute(g: SavingsGoal) {
    setContributeGoal(g)
    setContributeAmount('')
    // For a linked goal, default the source to the first account that isn't the goal's account.
    const defaultFrom = accounts.find((a) => a.id !== g.accountId)
    setContributeFrom(g.accountId && defaultFrom ? String(defaultFrom.id) : '')
    setContributeError('')
  }

  async function submitContribute(e: React.FormEvent) {
    e.preventDefault()
    if (!contributeGoal) return
    setContributeError('')
    if (contributeGoal.accountId && !contributeFrom) {
      setContributeError('Escolhe a conta de origem.')
      return
    }
    try {
      await contribute.mutateAsync({
        id: contributeGoal.id,
        amount: Number(contributeAmount),
        fromAccountId: contributeGoal.accountId ? Number(contributeFrom) : undefined,
      })
      setContributeGoal(null)
      toast.success('Contribuição registada.')
    } catch (err) {
      setContributeError(err instanceof ApiError ? err.message : 'Não foi possível contribuir.')
    }
  }

  async function remove(id: number) {
    const ok = await confirm({
      title: 'Apagar meta',
      message: 'Tens a certeza que queres apagar esta meta de poupança?',
      confirmLabel: 'Apagar',
      danger: true,
    })
    if (!ok) return
    try {
      await deleteGoal.mutateAsync(id)
      toast.success('Meta apagada.')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Não foi possível apagar.')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Metas de poupança"
        subtitle="Define objetivos e acompanha o progresso"
        action={
          <Button onClick={openCreate}>
            <Plus size={16} /> Nova meta
          </Button>
        }
      />

      {goals.length > 0 && (
        <Card className="p-4 transition duration-200 hover:shadow-md">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-slate-500 dark:text-slate-400">
              Total poupado em todas as metas
            </span>
            <span className="text-sm">
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {formatMoney(totalSaved)}
              </span>
              <span className="text-slate-400 dark:text-slate-500">
                {' '}
                / {formatMoney(totalTarget)}
              </span>
            </span>
          </div>
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all"
              style={{
                width: `${totalTarget > 0 ? Math.min((totalSaved / totalTarget) * 100, 100) : 0}%`,
              }}
            />
          </div>
        </Card>
      )}

      {isLoading ? (
        <CardGridSkeleton count={3} />
      ) : goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="Ainda não tens metas de poupança."
          hint="Define um objetivo — um fundo de emergência, férias, um carro — e acompanha o progresso ao longo do tempo."
          action={
            <Button onClick={openCreate}>
              <Plus size={16} /> Criar meta
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {goals.map((g) => (
            <GoalCard
              key={g.id}
              goal={g}
              onEdit={openEdit}
              onContribute={openContribute}
              onDelete={remove}
            />
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        title={form.id ? 'Editar meta' : 'Nova meta'}
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label>Nome</Label>
            <Input
              required
              maxLength={80}
              autoFocus
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ex: Fundo de emergência"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Objetivo (€)</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={form.targetAmount}
                onChange={(e) => setForm((f) => ({ ...f, targetAmount: e.target.value }))}
              />
            </div>
            {!form.accountId && (
              <div>
                <Label>Já poupado (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={form.currentAmount}
                  onChange={(e) => setForm((f) => ({ ...f, currentAmount: e.target.value }))}
                />
              </div>
            )}
          </div>
          <div>
            <Label>Conta ligada (opcional)</Label>
            <Select
              value={form.accountId}
              onChange={(e) => setForm((f) => ({ ...f, accountId: e.target.value }))}
            >
              <option value="">Sem conta — valor manual</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
            {form.accountId && (
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                O progresso passa a refletir o saldo desta conta.
              </p>
            )}
          </div>
          <div>
            <Label>Data-alvo (opcional)</Label>
            <Input
              type="date"
              value={form.targetDate}
              onChange={(e) => setForm((f) => ({ ...f, targetDate: e.target.value }))}
            />
          </div>
          <ErrorText>{formError}</ErrorText>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saveGoal.isPending}>
              {saveGoal.isPending ? 'A guardar…' : 'Guardar'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={contributeGoal !== null}
        title={`Contribuir — ${contributeGoal?.name ?? ''}`}
        onClose={() => setContributeGoal(null)}
      >
        <form onSubmit={submitContribute} className="space-y-3">
          {contributeGoal?.accountId && (
            <div>
              <Label>Conta de origem</Label>
              <Select
                value={contributeFrom}
                onChange={(e) => setContributeFrom(e.target.value)}
                required
              >
                <option value="">Escolher…</option>
                {accounts
                  .filter((a) => a.id !== contributeGoal.accountId)
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
              </Select>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                A contribuição é registada como uma transferência para {contributeGoal.accountName}.
              </p>
            </div>
          )}
          <div>
            <Label>Valor a adicionar (€)</Label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              required
              autoFocus
              value={contributeAmount}
              onChange={(e) => setContributeAmount(e.target.value)}
            />
          </div>
          <ErrorText>{contributeError}</ErrorText>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setContributeGoal(null)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={contribute.isPending}>
              {contribute.isPending ? 'A guardar…' : 'Adicionar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
