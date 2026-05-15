import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useCategories, useDeleteCategory, useSaveCategory } from '../api/hooks'
import type { Category, TransactionType } from '../api/types'
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
import { CATEGORY_ICONS, FALLBACK_ICON, ICON_KEYS } from '../lib/icons'
import { PRESET_COLORS } from '../lib/colors'

interface FormState {
  id?: number
  name: string
  type: TransactionType
  color: string
  icon: string
}

const emptyForm: FormState = { name: '', type: 'Expense', color: '#0ea5e9', icon: 'tag' }

interface SectionProps {
  label: string
  items: Category[]
  onCreate: (type: TransactionType) => void
  onEdit: (c: Category) => void
  onDelete: (c: Category) => void
}

function Section({ label, items, onCreate, onEdit, onDelete }: SectionProps) {
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {label}
        </h2>
        <Button
          variant="secondary"
          onClick={() => onCreate(label === 'Receitas' ? 'Income' : 'Expense')}
        >
          <Plus size={16} /> Adicionar
        </Button>
      </div>
      {items.length === 0 ? (
        <EmptyState title="Sem categorias." hint="Adiciona a primeira categoria." />
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((c) => (
            <div
              key={c.id}
              style={{ '--cat': c.color } as React.CSSProperties}
              className="group flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5 transition duration-200 hover:-translate-y-0.5 hover:border-[var(--cat)] hover:shadow-sm dark:border-slate-700"
            >
              <span className="transition-transform duration-200 group-hover:scale-110">
                <CategoryIcon icon={c.icon} color={c.color} size={38} />
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800 transition-transform duration-200 group-hover:translate-x-0.5 dark:text-slate-200">
                {c.name}
              </span>
              <div className="flex translate-x-2 gap-0.5 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100">
                <button
                  onClick={() => onEdit(c)}
                  className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-100"
                  title="Editar"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => onDelete(c)}
                  className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-500/20 dark:hover:text-red-400"
                  title="Apagar"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

export function Categories() {
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [formError, setFormError] = useState('')

  const { data: categories = [], isLoading } = useCategories()
  const saveCategory = useSaveCategory()
  const deleteCategory = useDeleteCategory()
  const confirm = useConfirm()

  const expense = categories.filter((c) => c.type === 'Expense')
  const income = categories.filter((c) => c.type === 'Income')

  function openCreate(type: TransactionType) {
    setForm({ ...emptyForm, type })
    setFormError('')
    setModalOpen(true)
  }

  function openEdit(c: Category) {
    setForm({ id: c.id, name: c.name, type: c.type, color: c.color, icon: c.icon })
    setFormError('')
    setModalOpen(true)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    try {
      await saveCategory.mutateAsync(form)
      setModalOpen(false)
      toast.success(form.id ? 'Categoria atualizada.' : 'Categoria criada.')
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Não foi possível guardar.')
    }
  }

  async function remove(c: Category) {
    const ok = await confirm({
      title: 'Apagar categoria',
      message: `Tens a certeza que queres apagar a categoria "${c.name}"?`,
      confirmLabel: 'Apagar',
      danger: true,
    })
    if (!ok) return
    try {
      await deleteCategory.mutateAsync(c.id)
      toast.success('Categoria apagada.')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Não foi possível apagar.')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categorias"
        subtitle="Organiza as tuas receitas e despesas"
        action={
          <Button onClick={() => openCreate('Expense')}>
            <Plus size={16} /> Nova categoria
          </Button>
        }
      />

      {isLoading ? (
        <CardGridSkeleton count={6} />
      ) : (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <Section
            label="Despesas"
            items={expense}
            onCreate={openCreate}
            onEdit={openEdit}
            onDelete={remove}
          />
          <Section
            label="Receitas"
            items={income}
            onCreate={openCreate}
            onEdit={openEdit}
            onDelete={remove}
          />
        </div>
      )}

      <Modal
        open={modalOpen}
        title={form.id ? 'Editar categoria' : 'Nova categoria'}
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={submit} className="space-y-4">
          <div className="flex items-center gap-3">
            <CategoryIcon icon={form.icon} color={form.color} size={48} />
            <div className="flex-1">
              <Label>Nome</Label>
              <Input
                required
                maxLength={60}
                autoFocus
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ex: Restaurantes"
              />
            </div>
          </div>

          <div>
            <Label>Tipo</Label>
            <Select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as TransactionType }))}
            >
              <option value="Expense">Despesa</option>
              <option value="Income">Receita</option>
            </Select>
          </div>

          <div>
            <Label>Cor</Label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, color }))}
                  className={`h-7 w-7 rounded-full transition ${
                    form.color === color
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
                    onClick={() => setForm((f) => ({ ...f, icon: key }))}
                    className={`grid h-9 place-items-center rounded-lg transition ${
                      form.icon === key
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

          <ErrorText>{formError}</ErrorText>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saveCategory.isPending}>
              {saveCategory.isPending ? 'A guardar…' : 'Guardar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
