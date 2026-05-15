import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileUp, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { useAccounts, useCategories, useImportTransactions } from '../api/hooks'
import type { TransactionInput, TransactionType } from '../api/types'
import { Button, Card, EmptyState, Label, PageHeader, Select } from '../components/ui'
import { ApiError } from '../api/client'
import { parseAmount, parseCsv, parseFlexibleDate } from '../lib/csv'
import { formatMoney } from '../lib/format'
import type { ParsedCsv } from '../lib/csv'

interface Mapping {
  date: string
  description: string
  amount: string
}

// Best-effort guess of which CSV column is which, by header name.
function guessMapping(headers: string[]): Mapping {
  const find = (...needles: string[]) =>
    headers.find((h) => needles.some((n) => h.toLowerCase().includes(n))) ?? ''
  return {
    date: find('data', 'date'),
    description: find('desc', 'nota', 'note', 'memo', 'movimento'),
    amount: find('valor', 'montante', 'amount', 'importância', 'quantia'),
  }
}

interface PreviewRow {
  index: number
  date: string | null
  amount: number | null
  note: string
  type: TransactionType
  valid: boolean
}

export function Import() {
  const navigate = useNavigate()
  const { data: accounts = [] } = useAccounts()
  const { data: categories = [] } = useCategories()
  const importTransactions = useImportTransactions()

  const [parsed, setParsed] = useState<ParsedCsv | null>(null)
  const [fileName, setFileName] = useState('')
  const [mapping, setMapping] = useState<Mapping>({ date: '', description: '', amount: '' })
  const [accountId, setAccountId] = useState('')
  const [rowCategories, setRowCategories] = useState<Record<number, string>>({})
  const [excluded, setExcluded] = useState<Set<number>>(new Set())

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const result = parseCsv(text)
    setParsed(result)
    setFileName(file.name)
    setMapping(guessMapping(result.headers))
    setRowCategories({})
    setExcluded(new Set())
  }

  const dateIdx = parsed ? parsed.headers.indexOf(mapping.date) : -1
  const descIdx = parsed ? parsed.headers.indexOf(mapping.description) : -1
  const amountIdx = parsed ? parsed.headers.indexOf(mapping.amount) : -1
  const mappingComplete = dateIdx > -1 && amountIdx > -1

  const previewRows = useMemo<PreviewRow[]>(() => {
    if (!parsed || !mappingComplete) return []
    return parsed.rows.map((raw, index) => {
      const date = parseFlexibleDate(raw[dateIdx] ?? '')
      const amount = parseAmount(raw[amountIdx] ?? '')
      const note = descIdx > -1 ? (raw[descIdx] ?? '').trim() : ''
      const type: TransactionType = (amount ?? 0) < 0 ? 'Expense' : 'Income'
      const valid = date !== null && amount !== null && amount !== 0
      return { index, date, amount, note, type, valid }
    })
  }, [parsed, mappingComplete, dateIdx, descIdx, amountIdx])

  const importable = previewRows.filter(
    (r) => r.valid && !excluded.has(r.index) && rowCategories[r.index],
  )
  const readyToImport =
    accountId !== '' && importable.length > 0 && importable.length === previewRows
      .filter((r) => r.valid && !excluded.has(r.index)).length

  function setDefaultCategory(categoryId: string) {
    if (!parsed) return
    const next: Record<number, string> = {}
    parsed.rows.forEach((_, i) => {
      next[i] = categoryId
    })
    setRowCategories(next)
  }

  function toggleExcluded(index: number) {
    setExcluded((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  async function runImport() {
    const rows: TransactionInput[] = importable.map((r) => ({
      amount: Math.abs(r.amount as number),
      date: r.date as string,
      type: r.type,
      categoryId: Number(rowCategories[r.index]),
      accountId: Number(accountId),
      note: r.note,
    }))
    try {
      const result = await importTransactions.mutateAsync(rows)
      toast.success(`${result.imported} transações importadas.`)
      navigate('/transactions')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Não foi possível importar.')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Importar extrato"
        subtitle="Carrega o CSV do teu banco e cria as transações de uma vez"
      />

      {/* Step 1 — file */}
      <Card className="p-5">
        <Label>Ficheiro CSV</Label>
        <label className="mt-1 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 px-4 py-4 transition hover:border-slate-400 dark:border-slate-600 dark:hover:border-slate-500">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300">
            <FileUp size={20} />
          </span>
          <span className="text-sm text-slate-600 dark:text-slate-300">
            {fileName || 'Escolher um ficheiro .csv…'}
          </span>
          <input type="file" accept=".csv,text/csv" onChange={onFile} className="hidden" />
        </label>
      </Card>

      {parsed && parsed.headers.length === 0 && (
        <EmptyState title="O ficheiro não tem linhas válidas." hint="Confirma que é um CSV." />
      )}

      {parsed && parsed.headers.length > 0 && (
        <>
          {/* Step 2 — mapping */}
          <Card className="p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
              Mapear colunas
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <Label>Data</Label>
                <Select
                  value={mapping.date}
                  onChange={(e) => setMapping((m) => ({ ...m, date: e.target.value }))}
                >
                  <option value="">Escolher…</option>
                  {parsed.headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Descrição</Label>
                <Select
                  value={mapping.description}
                  onChange={(e) => setMapping((m) => ({ ...m, description: e.target.value }))}
                >
                  <option value="">— (sem nota)</option>
                  {parsed.headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Valor</Label>
                <Select
                  value={mapping.amount}
                  onChange={(e) => setMapping((m) => ({ ...m, amount: e.target.value }))}
                >
                  <option value="">Escolher…</option>
                  {parsed.headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
              O valor é uma coluna única: negativo é despesa, positivo é receita.
            </p>
          </Card>

          {/* Step 3 — destination + categories */}
          <Card className="p-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label>Conta de destino</Label>
                <Select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                  <option value="">Escolher…</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Categoria por omissão</Label>
                <Select defaultValue="" onChange={(e) => setDefaultCategory(e.target.value)}>
                  <option value="">Aplicar a todas as linhas…</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </Card>

          {/* Preview */}
          {mappingComplete ? (
            <Card>
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-700">
                <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Pré-visualização ({importable.length} de {previewRows.length} prontas)
                </h2>
                <Button onClick={runImport} disabled={!readyToImport || importTransactions.isPending}>
                  <Upload size={16} />
                  {importTransactions.isPending ? 'A importar…' : `Importar ${importable.length}`}
                </Button>
              </div>
              <div className="max-h-[28rem] overflow-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-slate-50 text-left text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    <tr>
                      <th className="px-4 py-2 font-medium">Incluir</th>
                      <th className="px-4 py-2 font-medium">Data</th>
                      <th className="px-4 py-2 font-medium">Descrição</th>
                      <th className="px-4 py-2 font-medium">Valor</th>
                      <th className="px-4 py-2 font-medium">Categoria</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {previewRows.map((row) => (
                      <tr
                        key={row.index}
                        className={!row.valid ? 'opacity-50' : excluded.has(row.index) ? 'opacity-40' : ''}
                      >
                        <td className="px-4 py-2">
                          <input
                            type="checkbox"
                            disabled={!row.valid}
                            checked={row.valid && !excluded.has(row.index)}
                            onChange={() => toggleExcluded(row.index)}
                            className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 dark:bg-slate-900"
                          />
                        </td>
                        <td className="px-4 py-2 text-slate-600 dark:text-slate-300">
                          {row.date ?? <span className="text-red-500">data inválida</span>}
                        </td>
                        <td className="max-w-[16rem] truncate px-4 py-2 text-slate-600 dark:text-slate-300">
                          {row.note || '—'}
                        </td>
                        <td
                          className={`px-4 py-2 font-medium tabular-nums ${
                            row.amount === null
                              ? 'text-red-500'
                              : row.type === 'Income'
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {row.amount === null
                            ? 'valor inválido'
                            : `${row.type === 'Income' ? '+' : '−'}${formatMoney(Math.abs(row.amount))}`}
                        </td>
                        <td className="px-4 py-2">
                          <Select
                            value={rowCategories[row.index] ?? ''}
                            onChange={(e) =>
                              setRowCategories((prev) => ({
                                ...prev,
                                [row.index]: e.target.value,
                              }))
                            }
                            disabled={!row.valid}
                            className="text-xs"
                          >
                            <option value="">Escolher…</option>
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </Select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!readyToImport && (
                <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400 dark:border-slate-700 dark:text-slate-500">
                  Escolhe a conta de destino e uma categoria para cada linha incluída.
                </p>
              )}
            </Card>
          ) : (
            <EmptyState
              title="Mapeia pelo menos a data e o valor."
              hint="Indica acima qual coluna do CSV corresponde a cada campo."
            />
          )}
        </>
      )}
    </div>
  )
}
