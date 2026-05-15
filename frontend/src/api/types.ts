export type TransactionType = 'Income' | 'Expense'

export type AccountType = 'Checking' | 'Savings' | 'Cash' | 'CreditCard'

export interface AuthResponse {
  token: string
  refreshToken: string
  email: string
  displayName: string
  expiresAt: string
}

export interface Account {
  id: number
  name: string
  type: AccountType
  initialBalance: number
  balance: number
  color: string
  icon: string
}

export interface AccountInput {
  name: string
  type: AccountType
  initialBalance: number
  color: string
  icon: string
}

export interface Transfer {
  id: number
  fromAccountId: number
  fromAccountName: string
  toAccountId: number
  toAccountName: string
  amount: number
  date: string
  note: string
}

export interface TransferInput {
  amount: number
  fromAccountId: number
  toAccountId: number
  date: string
  note: string
}

export interface Category {
  id: number
  name: string
  type: TransactionType
  color: string
  icon: string
}

export interface CategoryInput {
  name: string
  type: TransactionType
  color: string
  icon: string
}

export interface Transaction {
  id: number
  amount: number
  date: string
  type: TransactionType
  categoryId: number
  categoryName: string
  categoryColor: string
  categoryIcon: string
  accountId: number
  accountName: string
  note: string
}

export interface TransactionInput {
  amount: number
  date: string
  type: TransactionType
  categoryId: number
  accountId: number
  note: string
}

export interface PagedTransactions {
  items: Transaction[]
  total: number
  totalIncome: number
  totalExpense: number
  page: number
  pageSize: number
}

export interface Budget {
  id: number
  categoryId: number
  categoryName: string
  categoryColor: string
  categoryIcon: string
  year: number
  month: number
  limitAmount: number
  spentAmount: number
}

export interface BudgetInput {
  categoryId: number
  year: number
  month: number
  limitAmount: number
}

export interface SavingsGoal {
  id: number
  name: string
  targetAmount: number
  currentAmount: number
  accountId: number | null
  accountName: string | null
  targetDate: string | null
  createdAt: string
}

export interface SavingsGoalInput {
  name: string
  targetAmount: number
  currentAmount: number
  accountId: number | null
  targetDate: string | null
}

export interface RecurringTransaction {
  id: number
  amount: number
  type: TransactionType
  categoryId: number
  categoryName: string
  categoryColor: string
  categoryIcon: string
  accountId: number
  accountName: string
  dayOfMonth: number
  note: string
  active: boolean
  startDate: string
  lastRunDate: string | null
}

export interface RecurringTransactionInput {
  amount: number
  type: TransactionType
  categoryId: number
  accountId: number
  dayOfMonth: number
  note: string
  active: boolean
  startDate: string
}

export interface CategorySpend {
  categoryId: number
  categoryName: string
  color: string
  amount: number
}

export interface MonthlyPoint {
  year: number
  month: number
  income: number
  expense: number
}

export interface MonthlyNetWorth {
  year: number
  month: number
  netWorth: number
}

export interface CategoryChange {
  categoryId: number
  categoryName: string
  color: string
  thisMonth: number
  lastMonth: number
}

export interface AccountSummary {
  id: number
  name: string
  type: AccountType
  color: string
  icon: string
  balance: number
}

export interface DashboardSummary {
  netWorth: number
  monthIncome: number
  monthExpense: number
  lastMonthIncome: number
  lastMonthExpense: number
  projectedMonthEnd: number
  year: number
  month: number
  accounts: AccountSummary[]
  spendingByCategory: CategorySpend[]
  monthlyTrend: MonthlyPoint[]
  netWorthTrend: MonthlyNetWorth[]
  topCategoryChanges: CategoryChange[]
}

export interface TransactionFilters {
  from?: string
  to?: string
  categoryId?: number
  accountId?: number
  type?: TransactionType
  search?: string
}
