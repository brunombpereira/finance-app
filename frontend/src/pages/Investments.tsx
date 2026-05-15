import { useState } from 'react'
import { Pencil, Plus, RefreshCw, Trash2, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import { useDeleteInvestment, useInvestments, useSaveInvestment } from '../api/hooks'
import type { CurrencyTotal, Investment } from '../api/types'
import {
  Button,
  Card,
  EmptyState,
  ErrorText,
  Input,
  Label,
  PageHeader,
} from '../components/ui'
import { CardGridSkeleton } from '../components/Skeletons'
import { Modal } from '../components/Modal'
import { useConfirm } from '../context/ConfirmContext'
import { ApiError } from '../api/client'
import { formatMoneyIn } from '../lib/format'

interface FormState {
  id?: number
  symbol: string
  name: string
  quantity: string
  avgCost: string
  currency: string
  notes: string
}

const emptyForm: FormState = {
  symbol: '',
  name: '',
  quantity: '',
  avgCost: '',
  currency: 'USD',
  notes: '',
}

function plToneClasses(pl: number): string {
  if (pl > 0) return 'text-emerald-600 dark:text-emerald-400'
  if (pl < 0) return 'text-red-600 dark:text-red-400'
  return 'text-slate-500 dark:text-slate-400'
}

function TotalCard({ total }: { total: CurrencyTotal }) {
  return (
    <Card className="p-5 transition duration-200 hover:shadow-md">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
        Total · {total.currency}
      </p>
      <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
        {formatMoneyIn(total.currency, total.currentValue)}
      </p>
      <div className="mt-2 flex items-baseline justify-between text-xs">
        <span className="text-slate-400 dark:text-slate-500">
          Custo {formatMoneyIn(total.currency, total.costBasis)}
        </span>
        <span className={`font-semibold ${plToneClasses(total.profitLoss)}`}>
          {total.profitLoss >= 0 ? '+' : '−'}
          {formatMoneyIn(total.currency, Math.abs(total.profitLoss))}{' '}
          ({total.profitLossPct >= 0 ? '+' : '−'}
          {Math.abs(total.profitLossPct).toFixed(2)}%)
        </span>
      </div>
    </Card>
  )
}

function InvestmentCard({
  inv,
  onEdit,
  onDelete,
}: {
  inv: Investment
  onEdit: (i: Investment) => void
  onDelete: (id: number) => void
}) {
  const hasPrice = inv.currentValue !== null
  return (
    <Card className="group relative p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-cyan-100 text-cyan-600 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 dark:bg-cyan-500/15 dark:text-cyan-400">
            <TrendingUp size={20} />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{inv.symbol}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">{inv.name}</p>
          </div>
        </div>
        <div className="flex translate-x-2 gap-0.5 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100">
          <button
            onClick={() => onEdit(inv)}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-100"
            title="Editar"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => onDelete(inv.id)}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-500/20 dark:hover:text-red-400"
            title="Apagar"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="text-slate-400 dark:text-slate-500">Quantidade</p>
          <p className="font-medium text-slate-700 dark:text-slate-200">{inv.quantity}</p>
        </div>
        <div>
          <p className="text-slate-400 dark:text-slate-500">Custo médio</p>
          <p className="font-medium text-slate-700 dark:text-slate-200">
            {formatMoneyIn(inv.currency, inv.avgCost)}
          </p>
        </div>
        <div>
          <p className="text-slate-400 dark:text-slate-500">Preço atual</p>
          <p className="font-medium text-slate-700 dark:text-slate-200">
            {inv.currentPrice !== null ? formatMoneyIn(inv.currency, inv.currentPrice) : '—'}
          </p>
        </div>
        <div>
          <p className="text-slate-400 dark:text-slate-500">Valor</p>
          <p className="font-semibold text-slate-900 dark:text-slate-100">
            {hasPrice ? formatMoneyIn(inv.currency, inv.currentValue!) : '—'}
          </p>
        </div>
      </div>

      {hasPrice ? (
        <div className={`mt-3 text-sm font-semibold ${plToneClasses(inv.profitLoss ?? 0)}`}>
          {(inv.profitLoss ?? 0) >= 0 ? '+' : '−'}
          {formatMoneyIn(inv.currency, Math.abs(inv.profitLoss ?? 0))}
          {inv.profitLossPct !== null && (
            <span className="ml-1 text-xs">
              ({inv.profitLossPct >= 0 ? '+' : '−'}
              {Math.abs(inv.profitLossPct).toFixed(2)}%)
            </span>
          )}
        </div>
      ) : (
        <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
          Sem preço — verifica o símbolo
        </p>
      )}
    </Card>
  )
}

export function Investments() {
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [formError, setFormError] = useState('')

  const { data, isLoading, refetch, isFetching } = useInvestments()
  const save = useSaveInvestment()
  const del = useDeleteInvestment()
  const confirm = useConfirm()

  const items = data?.items ?? []
  const totals = data?.totals ?? []

  function openCreate() {
    setForm(emptyForm)
    setFormError('')
    setModalOpen(true)
  }

  function openEdit(i: Investment) {
    setForm({
      id: i.id,
      symbol: i.symbol,
      name: i.name,
      quantity: String(i.quantity),
      avgCost: String(i.avgCost),
      currency: i.currency,
      notes: i.notes ?? '',
    })
    setFormError('')
    setModalOpen(true)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    try {
      await save.mutateAsync({
        id: form.id,
        symbol: form.symbol,
        name: form.name,
        quantity: Number(form.quantity),
        avgCost: Number(form.avgCost),
        currency: form.currency,
        notes: form.notes || null,
      })
      setModalOpen(false)
      toast.success(form.id ? 'Posição atualizada.' : 'Posição adicionada.')
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Não foi possível guardar.')
    }
  }

  async function remove(id: number) {
    const ok = await confirm({
      title: 'Apagar posição',
      message: 'Tens a certeza que queres remover esta posição?',
      confirmLabel: 'Apagar',
      danger: true,
    })
    if (!ok) return
    try {
      await del.mutateAsync(id)
      toast.success('Posição apagada.')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Não foi possível apagar.')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Investimentos"
        subtitle="Acompanha o teu portfolio com preços ao vivo"
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} /> Atualizar
            </Button>
            <Button onClick={openCreate}>
              <Plus size={16} /> Nova posição
            </Button>
          </div>
        }
      />

      {totals.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {totals.map((t) => (
            <TotalCard key={t.currency} total={t} />
          ))}
        </div>
      )}

      {isLoading ? (
        <CardGridSkeleton count={3} />
      ) : items.length === 0 ? (
        <EmptyState
          title="Sem posições"
          hint="Adiciona uma posição com o seu ticker (ex: AAPL, VWCE.DE, BTC-EUR) para começar."
          icon={TrendingUp}
          action={
            <Button onClick={openCreate}>
              <Plus size={16} /> Nova posição
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((i) => (
            <InvestmentCard key={i.id} inv={i} onEdit={openEdit} onDelete={remove} />
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={form.id ? 'Editar posição' : 'Nova posição'}
      >
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Símbolo</Label>
              <Input
                required
                autoFocus
                value={form.symbol}
                onChange={(e) => setForm({ ...form, symbol: e.target.value.toUpperCase() })}
                placeholder="AAPL"
              />
            </div>
            <div>
              <Label>Moeda</Label>
              <Input
                required
                maxLength={3}
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })}
                placeholder="USD"
              />
            </div>
          </div>
          <div>
            <Label>Nome</Label>
            <Input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Apple Inc."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Quantidade</Label>
              <Input
                required
                type="number"
                step="0.000001"
                min="0"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                placeholder="10"
              />
            </div>
            <div>
              <Label>Custo médio (por unidade)</Label>
              <Input
                required
                type="number"
                step="0.0001"
                min="0"
                value={form.avgCost}
                onChange={(e) => setForm({ ...form, avgCost: e.target.value })}
                placeholder="150"
              />
            </div>
          </div>
          <div>
            <Label>Notas (opcional)</Label>
            <Input
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Compra de 2024"
            />
          </div>
          <ErrorText>{formError}</ErrorText>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? 'A guardar…' : 'Guardar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
