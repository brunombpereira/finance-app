import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ArrowDownRight, ArrowUpRight, BarChart3, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { useReports } from '../api/hooks'
import type { CategoryAmount, ReportSummary } from '../api/types'
import { Card, EmptyState, PageHeader, Spinner } from '../components/ui'
import { ChartTooltip } from '../components/ChartTooltip'
import { useTheme } from '../context/ThemeContext'
import { EXPENSE_COLOR, INCOME_COLOR } from '../lib/colors'
import { formatMoney, monthLabel } from '../lib/format'

interface Preset {
  label: string
  from: string
  to: string
}

const isoDate = (d: Date) => d.toISOString().slice(0, 10)

function computePresets(now: Date): Preset[] {
  const today = isoDate(now)
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
  const threeAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1)
  const sixAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
  const thisYear = new Date(now.getFullYear(), 0, 1)
  const lastYearStart = new Date(now.getFullYear() - 1, 0, 1)
  const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31)
  return [
    { label: 'Este mês', from: isoDate(thisMonth), to: today },
    { label: 'Mês passado', from: isoDate(lastMonthStart), to: isoDate(lastMonthEnd) },
    { label: 'Últimos 3 meses', from: isoDate(threeAgo), to: today },
    { label: 'Últimos 6 meses', from: isoDate(sixAgo), to: today },
    { label: 'Este ano', from: isoDate(thisYear), to: today },
    { label: 'Ano passado', from: isoDate(lastYearStart), to: isoDate(lastYearEnd) },
  ]
}

function DeltaPill({ current, previous, invert }: { current: number; previous: number; invert?: boolean }) {
  const diff = current - previous
  // For expenses (invert=true), a *decrease* is good, so flip the sign that drives the colour.
  const goodWhen = invert ? diff < 0 : diff > 0
  const neutral = diff === 0
  const tone = neutral
    ? 'text-slate-400 dark:text-slate-500'
    : goodWhen
      ? 'text-emerald-600 dark:text-emerald-400'
      : 'text-red-600 dark:text-red-400'
  const pct = previous === 0 ? null : (diff / previous) * 100
  const Arrow = diff === 0 ? null : diff > 0 ? ArrowUpRight : ArrowDownRight
  return (
    <span className={`mt-1 flex items-center gap-0.5 text-xs font-medium ${tone}`}>
      {Arrow && <Arrow size={12} />}
      {diff >= 0 ? '+' : '−'}
      {formatMoney(Math.abs(diff))}
      {pct !== null && <span className="ml-1">({pct >= 0 ? '+' : '−'}{Math.abs(pct).toFixed(0)}%)</span>}
    </span>
  )
}

function StatRow({
  label,
  value,
  icon,
  delta,
}: {
  label: string
  value: string
  icon: { Icon: typeof Wallet; chip: string }
  delta: React.ReactNode
}) {
  const { Icon, chip } = icon
  return (
    <Card className="p-5 transition duration-200 hover:shadow-md">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <span className={`grid h-9 w-9 place-items-center rounded-lg ${chip}`}>
          <Icon size={18} />
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold text-slate-900 dark:text-slate-100">{value}</p>
      {delta}
    </Card>
  )
}

function CategoryBarList({
  title,
  items,
  color,
}: {
  title: string
  items: CategoryAmount[]
  color: string
}) {
  const total = items.reduce((s, c) => s + c.amount, 0)
  return (
    <Card className="p-5 transition duration-200 hover:shadow-md">
      <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">{title}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-slate-400 dark:text-slate-500">Sem movimentos no período.</p>
      ) : (
        <ul className="space-y-2.5">
          {items.slice(0, 8).map((c) => {
            const pct = total > 0 ? (c.amount / total) * 100 : 0
            return (
              <li key={c.categoryId} className="text-xs">
                <div className="mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-200">
                    <span className="h-2 w-2 rounded-full" style={{ background: c.color || color }} />
                    {c.name}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    {formatMoney(c.amount)}
                    <span className="ml-1 text-slate-400 dark:text-slate-500">
                      ({pct.toFixed(0)}%)
                    </span>
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${pct}%`, background: c.color || color }}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}

function MonthlyChart({ data }: { data: ReportSummary['monthly'] }) {
  const { theme } = useTheme()
  const gridColor = theme === 'dark' ? '#334155' : '#e2e8f0'
  const axisColor = theme === 'dark' ? '#94a3b8' : '#64748b'

  const series = data.map((m) => ({
    name: `${monthLabel(m.month)} ${String(m.year).slice(2)}`,
    Receitas: m.income,
    Despesas: m.expense,
  }))

  return (
    <Card className="p-5 transition duration-200 hover:shadow-md">
      <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
        Evolução mensal
      </h2>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={series} margin={{ left: -16, right: 8, top: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fill: axisColor }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: axisColor }}
              axisLine={false}
              tickLine={false}
              width={60}
            />
            <Tooltip
              content={<ChartTooltip />}
              cursor={{ fill: theme === 'dark' ? 'rgba(148,163,184,0.08)' : 'rgba(148,163,184,0.12)' }}
            />
            <Bar dataKey="Receitas" fill={INCOME_COLOR} radius={[4, 4, 0, 0]} />
            <Bar dataKey="Despesas" fill={EXPENSE_COLOR} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

export function Reports() {
  const presets = useMemo(() => computePresets(new Date()), [])
  // Default to "Últimos 3 meses".
  const [range, setRange] = useState({ from: presets[2].from, to: presets[2].to })

  const { data, isLoading, isFetching } = useReports(range.from, range.to)

  const activePreset = presets.find((p) => p.from === range.from && p.to === range.to)
  const savingsRate =
    data && data.totalIncome > 0
      ? Math.max(0, Math.min(100, (data.net / data.totalIncome) * 100))
      : 0
  const prevSavingsRate =
    data && data.prevTotalIncome > 0
      ? Math.max(0, Math.min(100, (data.prevNet / data.prevTotalIncome) * 100))
      : 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatórios"
        subtitle="Análise das tuas finanças por período"
        action={
          isFetching && data ? (
            <span className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-cyan-500" />
              A atualizar…
            </span>
          ) : undefined
        }
      />

      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-wrap gap-1.5">
            {presets.map((p) => (
              <button
                key={p.label}
                onClick={() => setRange({ from: p.from, to: p.to })}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  activePreset?.label === p.label
                    ? 'bg-cyan-600 text-white shadow-sm dark:bg-cyan-500'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex items-end gap-2">
            <div>
              <p className="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">De</p>
              <input
                type="date"
                value={range.from}
                onChange={(e) => setRange({ ...range, from: e.target.value })}
                className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-400 dark:focus:ring-slate-400"
              />
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">Até</p>
              <input
                type="date"
                value={range.to}
                onChange={(e) => setRange({ ...range, to: e.target.value })}
                className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-400 dark:focus:ring-slate-400"
              />
            </div>
          </div>
        </div>
      </Card>

      {isLoading || !data ? (
        <Spinner />
      ) : data.monthly.every((m) => m.income === 0 && m.expense === 0) ? (
        <EmptyState
          title="Sem movimentos no período"
          hint="Escolhe outro período ou regista algumas transações para veres os relatórios."
          icon={BarChart3}
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatRow
              label="Receitas"
              value={formatMoney(data.totalIncome)}
              icon={{ Icon: TrendingUp, chip: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400' }}
              delta={<DeltaPill current={data.totalIncome} previous={data.prevTotalIncome} />}
            />
            <StatRow
              label="Despesas"
              value={formatMoney(data.totalExpense)}
              icon={{ Icon: TrendingDown, chip: 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400' }}
              delta={<DeltaPill current={data.totalExpense} previous={data.prevTotalExpense} invert />}
            />
            <StatRow
              label="Saldo"
              value={formatMoney(data.net)}
              icon={{ Icon: Wallet, chip: 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300' }}
              delta={<DeltaPill current={data.net} previous={data.prevNet} />}
            />
            <StatRow
              label="Taxa de poupança"
              value={`${savingsRate.toFixed(0)}%`}
              icon={{ Icon: BarChart3, chip: 'bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-500/15 dark:text-fuchsia-400' }}
              delta={
                <p
                  className={`mt-1 text-xs font-medium ${
                    savingsRate > prevSavingsRate
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : savingsRate < prevSavingsRate
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {savingsRate >= prevSavingsRate ? '+' : '−'}
                  {Math.abs(savingsRate - prevSavingsRate).toFixed(0)} pp vs. período anterior
                </p>
              }
            />
          </div>

          <MonthlyChart data={data.monthly} />

          <div className="grid gap-4 lg:grid-cols-2">
            <CategoryBarList title="Top despesas por categoria" items={data.topExpenses} color={EXPENSE_COLOR} />
            <CategoryBarList title="Top receitas por categoria" items={data.topIncome} color={INCOME_COLOR} />
          </div>
        </>
      )}
    </div>
  )
}
