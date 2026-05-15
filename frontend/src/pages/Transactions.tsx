import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  Download,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  useAccounts,
  useCategories,
  useDeleteTransaction,
  useSaveTransaction,
  useTransactions,
} from '../api/hooks'
import type { Transaction, TransactionFilters, TransactionType } from '../api/types'
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
import { ListRowsSkeleton } from '../components/Skeletons'
import { Modal } from '../components/Modal'
import { useConfirm } from '../context/ConfirmContext'
import { ApiError } from '../api/client'
import { CategoryIcon } from '../components/CategoryIcon'
import { downloadTransactionsCsv } from '../lib/csv'
import { formatDate, formatMoney, todayIso } from '../lib/format'

interface FormState {
  id?: number
  amount: string
  date: string
  type: TransactionType
  categoryId: string
  accountId: string
  note: string
}

const emptyForm: FormState = {
  amount: '',
  date: todayIso(),
  type: 'Expense',
  categoryId: '',
  accountId: '',
  note: '',
}

const PAGE_SIZE = 25

export function Transactions() {
  const [filters, setFilters] = useState<TransactionFilters>({})
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [formError, setFormError] = useState('')

  // Changing any filter resets back to the first page.
  function changeFilters(updater: (f: TransactionFilters) => TransactionFilters) {
    setFilters(updater)
    setPage(1)
  }

  // Debounce the search box so we don't hit the API on every keystroke.
  useEffect(() => {
    const id = setTimeout(() => {
      changeFilters((f) => ({ ...f, search: searchInput.trim() || undefined }))
    }, 300)
    return () => clearTimeout(id)
  }, [searchInput])

  const { data: categories = [] } = useCategories()
  const { data: accounts = [] } = useAccounts()
  const { data, isLoading } = useTransactions(filters, page)
  const saveTransaction = useSaveTransaction()
  const deleteTransaction = useDeleteTransaction()
  const confirm = useConfirm()

  const transactions = data?.items ?? []
  const total = data?.total ?? 0
  const totalIncome = data?.totalIncome ?? 0
  const totalExpense = data?.totalExpense ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const hasFilters = Boolean(
    filters.search || filters.from || filters.to || filters.type ||
      filters.categoryId || filters.accountId,
  )

  const categoriesForType = useMemo(
    () => categories.filter((c) => c.type === form.type),
    [categories, form.type],
  )

  function openCreate() {
    setForm({ ...emptyForm, accountId: accounts[0] ? String(accounts[0].id) : '' })
    setFormError('')
    setModalOpen(true)
  }

  function openEdit(t: Transaction) {
    setForm({
      id: t.id,
      amount: String(t.amount),
      date: t.date,
      type: t.type,
      categoryId: String(t.categoryId),
      accountId: String(t.accountId),
      note: t.note,
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
      await saveTransaction.mutateAsync({
        id: form.id,
        amount: Number(form.amount),
        date: form.date,
        type: form.type,
        categoryId: Number(form.categoryId),
        accountId: Number(form.accountId),
        note: form.note,
      })
      setModalOpen(false)
      toast.success(form.id ? 'Transação atualizada.' : 'Transação criada.')
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Não foi possível guardar.')
    }
  }

  async function remove(id: number) {
    const ok = await confirm({
      title: 'Apagar transação',
      message: 'Tens a certeza que queres apagar esta transação?',
      confirmLabel: 'Apagar',
      danger: true,
    })
    if (!ok) return
    try {
      await deleteTransaction.mutateAsync(id)
      toast.success('Transação apagada.')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Não foi possível apagar.')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transações"
        subtitle="Lança e consulta as tuas receitas e despesas"
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              to="/import"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-300 transition hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-600 dark:hover:bg-slate-700"
            >
              <Upload size={16} /> Importar CSV
            </Link>
            <Button
              variant="secondary"
              onClick={() => downloadTransactionsCsv(transactions)}
              disabled={transactions.length === 0}
            >
              <Download size={16} /> Exportar CSV
            </Button>
            <Button onClick={openCreate}>
              <Plus size={16} /> Nova transação
            </Button>
          </div>
        }
      />

      {/* Summary — over the whole filtered set, not just the page */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Receitas {hasFilters ? '(filtro)' : ''}
          </p>
          <p className="mt-1 text-xl font-semibold text-emerald-600 dark:text-emerald-400">
            {formatMoney(totalIncome)}
          </p>
        </Card>
        <Card className="p-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Despesas {hasFilters ? '(filtro)' : ''}
          </p>
          <p className="mt-1 text-xl font-semibold text-red-600 dark:text-red-400">
            {formatMoney(totalExpense)}
          </p>
        </Card>
        <Card className="p-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-sm text-slate-500 dark:text-slate-400">Saldo</p>
          <p
            className={`mt-1 text-xl font-semibold ${
              totalIncome - totalExpense < 0
                ? 'text-red-600 dark:text-red-400'
                : 'text-slate-900 dark:text-slate-100'
            }`}
          >
            {formatMoney(totalIncome - totalExpense)}
          </p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="relative mb-3">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
          />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Pesquisar por nota ou categoria…"
            className="pl-9"
          />
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <div>
            <Label>De</Label>
            <Input
              type="date"
              value={filters.from ?? ''}
              onChange={(e) => changeFilters((f) => ({ ...f, from: e.target.value || undefined }))}
            />
          </div>
          <div>
            <Label>Até</Label>
            <Input
              type="date"
              value={filters.to ?? ''}
              onChange={(e) => changeFilters((f) => ({ ...f, to: e.target.value || undefined }))}
            />
          </div>
          <div>
            <Label>Tipo</Label>
            <Select
              value={filters.type ?? ''}
              onChange={(e) =>
                changeFilters((f) => ({
                  ...f,
                  type: (e.target.value || undefined) as TransactionType | undefined,
                }))
              }
            >
              <option value="">Todos</option>
              <option value="Income">Receitas</option>
              <option value="Expense">Despesas</option>
            </Select>
          </div>
          <div>
            <Label>Categoria</Label>
            <Select
              value={filters.categoryId ?? ''}
              onChange={(e) =>
                changeFilters((f) => ({
                  ...f,
                  categoryId: e.target.value ? Number(e.target.value) : undefined,
                }))
              }
            >
              <option value="">Todas</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Conta</Label>
            <Select
              value={filters.accountId ?? ''}
              onChange={(e) =>
                changeFilters((f) => ({
                  ...f,
                  accountId: e.target.value ? Number(e.target.value) : undefined,
                }))
              }
            >
              <option value="">Todas</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      {/* List */}
      {isLoading ? (
        <ListRowsSkeleton />
      ) : transactions.length === 0 ? (
        <EmptyState
          icon={ArrowLeftRight}
          title={
            hasFilters
              ? 'Nenhuma transação corresponde aos filtros.'
              : 'Ainda não registaste nenhuma transação.'
          }
          hint="Lança receitas e despesas para começares a acompanhar o teu dinheiro."
          action={
            <Button onClick={openCreate}>
              <Plus size={16} /> Nova transação
            </Button>
          }
        />
      ) : (
        <Card>
          <ul className="divide-y divide-slate-100 dark:divide-slate-700">
            {transactions.map((t) => (
              <li
                key={t.id}
                className="group relative flex items-center gap-4 px-5 py-3.5 transition-colors duration-200 hover:bg-slate-50 dark:hover:bg-slate-700/40"
              >
                {/* Accent bar in the category color — grows in on hover */}
                <span
                  className="absolute left-0 top-1/2 h-9 w-1 origin-center -translate-y-1/2 scale-y-0 rounded-r-full opacity-0 transition-all duration-200 group-hover:scale-y-100 group-hover:opacity-100"
                  style={{ backgroundColor: t.categoryColor }}
                />
                <span className="transition-transform duration-200 group-hover:scale-110">
                  <CategoryIcon icon={t.categoryIcon} color={t.categoryColor} size={42} />
                </span>
                <div className="min-w-0 flex-1 transition-transform duration-200 group-hover:translate-x-1">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                    {t.note || t.categoryName}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {t.categoryName} · {t.accountName} · {formatDate(t.date)}
                  </p>
                </div>
                <span
                  className={`text-sm font-semibold tabular-nums transition-transform duration-200 group-hover:scale-105 ${
                    t.type === 'Income'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {t.type === 'Income' ? '+' : '−'}
                  {formatMoney(t.amount)}
                </span>
                <div className="flex translate-x-2 gap-0.5 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100">
                  <button
                    onClick={() => openEdit(t)}
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-100"
                    title="Editar"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => remove(t.id)}
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-500/20 dark:hover:text-red-400"
                    title="Apagar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 dark:border-slate-700">
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {total} transações · página {page} de {totalPages}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-700"
                  title="Página anterior"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-700"
                  title="Página seguinte"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </Card>
      )}

      <Modal
        open={modalOpen}
        title={form.id ? 'Editar transação' : 'Nova transação'}
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tipo</Label>
              <Select
                value={form.type}
                onChange={(e) =>
                  setForm((f) => ({ ...f, type: e.target.value as TransactionType, categoryId: '' }))
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
          <div>
            <Label>Data</Label>
            <Input
              type="date"
              required
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            />
          </div>
          <div>
            <Label>Nota (opcional)</Label>
            <Input
              value={form.note}
              maxLength={280}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              placeholder="Ex: jantar com amigos"
            />
          </div>
          <ErrorText>{formError}</ErrorText>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saveTransaction.isPending}>
              {saveTransaction.isPending ? 'A guardar…' : 'Guardar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
