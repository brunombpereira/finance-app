import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Sector,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ArrowDownRight,
  ArrowUpRight,
  PiggyBank,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { useBudgets, useDashboard, useGoals, useTransactions } from '../api/hooks'
import { useTheme } from '../context/ThemeContext'
import { Card, EmptyState, PageHeader, StatCard } from '../components/ui'
import { DashboardSkeleton } from '../components/Skeletons'
import { ChartTooltip } from '../components/ChartTooltip'
import { CategoryIcon } from '../components/CategoryIcon'
import { EXPENSE_COLOR, INCOME_COLOR } from '../lib/colors'
import { formatDate, formatMoney, monthLabel } from '../lib/format'

const now = new Date()

// Highlighted donut slice: grows slightly and gets an outer accent ring.
function ActiveSlice(props: {
  cx?: number
  cy?: number
  innerRadius?: number
  outerRadius?: number
  startAngle?: number
  endAngle?: number
  fill?: string
}) {
  const {
    cx = 0,
    cy = 0,
    innerRadius = 0,
    outerRadius = 0,
    startAngle = 0,
    endAngle = 0,
    fill = '#94a3b8',
  } = props
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={outerRadius + 9}
        outerRadius={outerRadius + 11}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  )
}

export function Dashboard() {
  const { data, isLoading, isError } = useDashboard()
  const { data: recentData, isLoading: recentLoading } = useTransactions({})
  const { data: budgets = [] } = useBudgets(now.getFullYear(), now.getMonth() + 1)
  const { data: goals = [] } = useGoals()
  const { theme } = useTheme()

  const recent = recentData?.items ?? []

  const [activeSlice, setActiveSlice] = useState<number | null>(null)

  const gridColor = theme === 'dark' ? '#334155' : '#e2e8f0'
  const axisColor = theme === 'dark' ? '#94a3b8' : '#64748b'

  if (isLoading) return <DashboardSkeleton />
  if (isError || !data)
    return (
      <EmptyState
        title="Não foi possível carregar o dashboard."
        hint="Verifica se a API está a correr."
      />
    )

  const isNewUser = !recentLoading && recent.length === 0

  const savingsRate =
    data.monthIncome > 0
      ? ((data.monthIncome - data.monthExpense) / data.monthIncome) * 100
      : 0

  const trendData = data.monthlyTrend.map((p) => ({
    name: monthLabel(p.month),
    Receitas: p.income,
    Despesas: p.expense,
  }))

  const netWorthData = data.netWorthTrend.map((p) => ({
    name: monthLabel(p.month),
    Património: p.netWorth,
  }))

  // Month-over-month expense change.
  const expenseDelta = data.monthExpense - data.lastMonthExpense
  const expenseDeltaPct =
    data.lastMonthExpense > 0 ? (expenseDelta / data.lastMonthExpense) * 100 : null

  const pieData = data.spendingByCategory
  const topBudgets = [...budgets]
    .sort((a, b) => b.spentAmount / b.limitAmount - a.spentAmount / a.limitAmount)
    .slice(0, 4)
  const topGoals = goals.slice(0, 3)

  const centerLabel =
    activeSlice !== null && pieData[activeSlice]
      ? { name: pieData[activeSlice].categoryName, value: pieData[activeSlice].amount }
      : { name: 'Gasto total', value: data.monthExpense }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle={`Resumo de ${monthLabel(data.month)} de ${data.year}`}
      />

      {isNewUser && (
        <Card className="bg-slate-900 p-6 text-white">
          <h2 className="text-lg font-semibold">Bem-vindo à Nexo Finance 👋</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-300">
            Ainda não tens dados. Em três passos começas a ver o teu dinheiro a fazer sentido:
          </p>
          <ol className="mt-4 grid gap-3 sm:grid-cols-3">
            <li className="rounded-xl bg-white/10 p-3">
              <span className="text-xs font-semibold text-slate-400">Passo 1</span>
              <p className="mt-0.5 text-sm">Lança as tuas receitas e despesas</p>
            </li>
            <li className="rounded-xl bg-white/10 p-3">
              <span className="text-xs font-semibold text-slate-400">Passo 2</span>
              <p className="mt-0.5 text-sm">Define orçamentos mensais por categoria</p>
            </li>
            <li className="rounded-xl bg-white/10 p-3">
              <span className="text-xs font-semibold text-slate-400">Passo 3</span>
              <p className="mt-0.5 text-sm">Cria metas de poupança e acompanha o progresso</p>
            </li>
          </ol>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              to="/app/transactions"
              className="rounded-lg bg-white px-3.5 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
            >
              Lançar primeira transação
            </Link>
            <Link
              to="/app/recurring"
              className="rounded-lg bg-white/10 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-white/20"
            >
              Configurar ordenado recorrente
            </Link>
          </div>
        </Card>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Património"
          value={formatMoney(data.netWorth)}
          icon={Wallet}
          tone={data.netWorth < 0 ? 'negative' : 'neutral'}
        />
        <StatCard
          label="Receitas do mês"
          value={formatMoney(data.monthIncome)}
          icon={ArrowUpRight}
          tone="positive"
        />
        <StatCard
          label="Despesas do mês"
          value={formatMoney(data.monthExpense)}
          icon={ArrowDownRight}
          tone="negative"
        />
        <StatCard
          label="Taxa de poupança"
          value={`${savingsRate.toFixed(0)}%`}
          icon={PiggyBank}
          tone={savingsRate >= 0 ? 'accent' : 'negative'}
          hint="receitas menos despesas, este mês"
        />
      </div>

      {/* Accounts overview */}
      {data.accounts.length > 0 && (
        <Card className="p-5 transition duration-200 hover:shadow-md">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              As tuas contas
            </h2>
            <Link
              to="/app/accounts"
              className="text-xs font-medium text-slate-400 transition hover:text-slate-900 dark:text-slate-500 dark:hover:text-slate-100"
            >
              Gerir
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {data.accounts.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5 dark:border-slate-700"
              >
                <CategoryIcon icon={a.icon} color={a.color} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">
                    {a.name}
                  </p>
                  <p
                    className={`text-sm font-semibold ${
                      a.balance < 0
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-slate-900 dark:text-slate-100'
                    }`}
                  >
                    {formatMoney(a.balance)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="p-5 transition duration-200 hover:shadow-md lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-200">
            Evolução dos últimos 6 meses
          </h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ left: -16, right: 8, top: 4 }}>
                <defs>
                  <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={INCOME_COLOR} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={INCOME_COLOR} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={EXPENSE_COLOR} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={EXPENSE_COLOR} stopOpacity={0} />
                  </linearGradient>
                </defs>
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
                  cursor={{ stroke: gridColor, strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Area
                  type="monotone"
                  dataKey="Receitas"
                  stroke={INCOME_COLOR}
                  strokeWidth={2}
                  fill="url(#gIncome)"
                  activeDot={{ r: 5, strokeWidth: 2 }}
                />
                <Area
                  type="monotone"
                  dataKey="Despesas"
                  stroke={EXPENSE_COLOR}
                  strokeWidth={2}
                  fill="url(#gExpense)"
                  activeDot={{ r: 5, strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex gap-4 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: INCOME_COLOR }}
              />{' '}
              Receitas
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: EXPENSE_COLOR }}
              />{' '}
              Despesas
            </span>
          </div>
        </Card>

        <Card className="p-5 transition duration-200 hover:shadow-md">
          <h2 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-200">
            Gastos por categoria
          </h2>
          {pieData.length === 0 ? (
            <EmptyState title="Sem despesas este mês." />
          ) : (
            <>
              <div className="relative h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="amount"
                      nameKey="categoryName"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={78}
                      paddingAngle={2}
                      activeShape={ActiveSlice}
                      onMouseEnter={(_, index) => setActiveSlice(index)}
                      onMouseLeave={() => setActiveSlice(null)}
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={entry.categoryId}
                          fill={entry.color}
                          stroke={theme === 'dark' ? '#1e293b' : '#fff'}
                          strokeWidth={2}
                          opacity={
                            activeSlice === null || activeSlice === index ? 1 : 0.35
                          }
                          style={{ transition: 'opacity 150ms', cursor: 'pointer' }}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center label reacts to the hovered slice */}
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="max-w-[7rem] truncate text-[11px] font-medium text-slate-400 dark:text-slate-500">
                    {centerLabel.name}
                  </span>
                  <span className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    {formatMoney(centerLabel.value)}
                  </span>
                </div>
              </div>
              <ul className="mt-3 space-y-0.5">
                {pieData.slice(0, 5).map((entry, index) => (
                  <li
                    key={entry.categoryId}
                    onMouseEnter={() => setActiveSlice(index)}
                    onMouseLeave={() => setActiveSlice(null)}
                    className={`-mx-2 flex cursor-default items-center justify-between rounded-lg px-2 py-1 text-sm transition ${
                      activeSlice === index
                        ? 'bg-slate-100 dark:bg-slate-700'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <span
                        className="h-2.5 w-2.5 rounded-full transition-transform"
                        style={{
                          backgroundColor: entry.color,
                          transform: activeSlice === index ? 'scale(1.4)' : 'scale(1)',
                        }}
                      />
                      {entry.categoryName}
                    </span>
                    <span className="font-medium tabular-nums text-slate-700 dark:text-slate-200">
                      {formatMoney(entry.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
      </div>

      {/* Net worth trend + insights */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="p-5 transition duration-200 hover:shadow-md lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-200">
            Evolução do património
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={netWorthData} margin={{ left: -16, right: 8, top: 4 }}>
                <defs>
                  <linearGradient id="netWorthLine" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0" stopColor="#06b6d4" />
                    <stop offset="1" stopColor="#d946ef" />
                  </linearGradient>
                </defs>
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
                  cursor={{ stroke: gridColor, strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Line
                  type="monotone"
                  dataKey="Património"
                  stroke="url(#netWorthLine)"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#a21caf' }}
                  activeDot={{ r: 5, strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5 transition duration-200 hover:shadow-md">
          <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Insights</h2>
          <div className="space-y-3">
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-700/40">
              <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                {expenseDelta > 0 ? (
                  <TrendingUp size={13} className="text-red-500" />
                ) : (
                  <TrendingDown size={13} className="text-emerald-500" />
                )}
                Despesas vs. mês passado
              </p>
              <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
                {expenseDelta >= 0 ? '+' : '−'}
                {formatMoney(Math.abs(expenseDelta))}
                {expenseDeltaPct !== null && (
                  <span
                    className={`ml-1 text-xs font-medium ${
                      expenseDelta > 0
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    ({expenseDelta >= 0 ? '+' : ''}
                    {expenseDeltaPct.toFixed(0)}%)
                  </span>
                )}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-700/40">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Património projetado para o fim do mês
              </p>
              <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
                {formatMoney(data.projectedMonthEnd)}
              </p>
            </div>
            {data.topCategoryChanges.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs text-slate-500 dark:text-slate-400">
                  Maiores variações por categoria
                </p>
                <ul className="space-y-1">
                  {data.topCategoryChanges.map((c) => {
                    const delta = c.thisMonth - c.lastMonth
                    return (
                      <li
                        key={c.categoryId}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: c.color }}
                          />
                          {c.categoryName}
                        </span>
                        <span
                          className={`text-xs font-medium tabular-nums ${
                            delta > 0
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {delta >= 0 ? '+' : '−'}
                          {formatMoney(Math.abs(delta))}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Recent transactions + side panels */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-700">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Transações recentes
            </h2>
            <Link
              to="/app/transactions"
              className="text-sm font-medium text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            >
              Ver todas
            </Link>
          </div>
          {recent.length === 0 ? (
            <div className="p-5">
              <EmptyState title="Ainda não há transações." hint="Começa por registar uma." />
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-700">
              {recent.slice(0, 7).map((t) => (
                <li
                  key={t.id}
                  className="group relative flex items-center gap-3 px-5 py-3 transition-colors duration-200 hover:bg-slate-50 dark:hover:bg-slate-700/40"
                >
                  {/* Accent bar in the category color — grows in on hover */}
                  <span
                    className="absolute left-0 top-1/2 h-8 w-1 origin-center -translate-y-1/2 scale-y-0 rounded-r-full opacity-0 transition-all duration-200 group-hover:scale-y-100 group-hover:opacity-100"
                    style={{ backgroundColor: t.categoryColor }}
                  />
                  <span className="transition-transform duration-200 group-hover:scale-110">
                    <CategoryIcon icon={t.categoryIcon} color={t.categoryColor} size={38} />
                  </span>
                  <div className="min-w-0 flex-1 transition-transform duration-200 group-hover:translate-x-1">
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                      {t.note || t.categoryName}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {t.categoryName} · {formatDate(t.date)}
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
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="space-y-5">
          <Card className="p-5 transition duration-200 hover:shadow-md">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Orçamentos do mês
              </h2>
              <Link
                to="/app/budgets"
                className="text-xs font-medium text-slate-400 transition hover:text-slate-900 dark:text-slate-500 dark:hover:text-slate-100"
              >
                Gerir
              </Link>
            </div>
            {topBudgets.length === 0 ? (
              <EmptyState title="Sem orçamentos." />
            ) : (
              <ul className="space-y-1">
                {topBudgets.map((b) => {
                  const pct = b.limitAmount > 0 ? (b.spentAmount / b.limitAmount) * 100 : 0
                  const over = b.spentAmount > b.limitAmount
                  return (
                    <li
                      key={b.id}
                      className="group relative -mx-2 rounded-lg px-2 py-1.5 transition-colors duration-200 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                    >
                      <span
                        className="absolute left-0 top-1/2 h-7 w-1 origin-center -translate-y-1/2 scale-y-0 rounded-r-full opacity-0 transition-all duration-200 group-hover:scale-y-100 group-hover:opacity-100"
                        style={{ backgroundColor: b.categoryColor }}
                      />
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-slate-600 dark:text-slate-300">
                          {b.categoryName}
                        </span>
                        <span
                          className={
                            over
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-slate-400 dark:text-slate-500'
                          }
                        >
                          {formatMoney(b.spentAmount)} / {formatMoney(b.limitAmount)}
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(pct, 100)}%`,
                            backgroundColor: over ? EXPENSE_COLOR : b.categoryColor,
                          }}
                        />
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>

          <Card className="p-5 transition duration-200 hover:shadow-md">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Metas de poupança
              </h2>
              <Link
                to="/app/goals"
                className="text-xs font-medium text-slate-400 transition hover:text-slate-900 dark:text-slate-500 dark:hover:text-slate-100"
              >
                Gerir
              </Link>
            </div>
            {topGoals.length === 0 ? (
              <EmptyState title="Sem metas." />
            ) : (
              <ul className="space-y-1">
                {topGoals.map((g) => {
                  const pct = g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0
                  return (
                    <li
                      key={g.id}
                      className="group relative -mx-2 rounded-lg px-2 py-1.5 transition-colors duration-200 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                    >
                      <span className="absolute left-0 top-1/2 h-7 w-1 origin-center -translate-y-1/2 scale-y-0 rounded-r-full bg-cyan-500 opacity-0 transition-all duration-200 group-hover:scale-y-100 group-hover:opacity-100" />
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
                          <Target size={13} className="text-fuchsia-500" /> {g.name}
                        </span>
                        <span className="text-slate-400 dark:text-slate-500">
                          {pct.toFixed(0)}%
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                        <div
                          className="h-full rounded-full bg-cyan-500 transition-all duration-300"
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
