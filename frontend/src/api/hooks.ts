import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './client'
import type {
  Account,
  AccountInput,
  Budget,
  BudgetInput,
  Category,
  CategoryInput,
  DashboardSummary,
  InvestmentInput,
  InvestmentsSummary,
  BankConnection,
  BankingStatus,
  Institution,
  PagedTransactions,
  RecurringTransaction,
  ReportSummary,
  RequisitionCreated,
  RecurringTransactionInput,
  SavingsGoal,
  SavingsGoalInput,
  TransactionFilters,
  TransactionInput,
  Transfer,
  TransferInput,
} from './types'

// Invalidate everything that can change when money moves: transactions, transfers,
// account balances, budgets, goals (linked goals track account balances) and the dashboard.
function useInvalidateFinances() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: ['transactions'] })
    qc.invalidateQueries({ queryKey: ['transfers'] })
    qc.invalidateQueries({ queryKey: ['accounts'] })
    qc.invalidateQueries({ queryKey: ['budgets'] })
    qc.invalidateQueries({ queryKey: ['goals'] })
    qc.invalidateQueries({ queryKey: ['dashboard'] })
  }
}

/* ---------- Accounts ---------- */

export function useAccounts() {
  return useQuery({
    queryKey: ['accounts'],
    queryFn: () => api<Account[]>('/accounts'),
  })
}

export function useSaveAccount() {
  const invalidate = useInvalidateFinances()
  return useMutation({
    mutationFn: (input: AccountInput & { id?: number }) =>
      input.id
        ? api<Account>(`/accounts/${input.id}`, { method: 'PUT', body: input })
        : api<Account>('/accounts', { method: 'POST', body: input }),
    onSuccess: invalidate,
  })
}

export function useDeleteAccount() {
  const invalidate = useInvalidateFinances()
  return useMutation({
    mutationFn: (id: number) => api<void>(`/accounts/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  })
}

/* ---------- Transfers ---------- */

export function useTransfers() {
  return useQuery({
    queryKey: ['transfers'],
    queryFn: () => api<Transfer[]>('/transfers'),
  })
}

export function useSaveTransfer() {
  const invalidate = useInvalidateFinances()
  return useMutation({
    mutationFn: (input: TransferInput & { id?: number }) =>
      input.id
        ? api<Transfer>(`/transfers/${input.id}`, { method: 'PUT', body: input })
        : api<Transfer>('/transfers', { method: 'POST', body: input }),
    onSuccess: invalidate,
  })
}

export function useDeleteTransfer() {
  const invalidate = useInvalidateFinances()
  return useMutation({
    mutationFn: (id: number) => api<void>(`/transfers/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  })
}

/* ---------- Categories ---------- */

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => api<Category[]>('/categories'),
  })
}

export function useSaveCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CategoryInput & { id?: number }) =>
      input.id
        ? api<Category>(`/categories/${input.id}`, { method: 'PUT', body: input })
        : api<Category>('/categories', { method: 'POST', body: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  })
}

export function useDeleteCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api<void>(`/categories/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  })
}

/* ---------- Transactions ---------- */

export function useTransactions(filters: TransactionFilters, page = 1) {
  const params = new URLSearchParams()
  if (filters.from) params.set('from', filters.from)
  if (filters.to) params.set('to', filters.to)
  if (filters.categoryId) params.set('categoryId', String(filters.categoryId))
  if (filters.accountId) params.set('accountId', String(filters.accountId))
  if (filters.type) params.set('type', filters.type)
  if (filters.search) params.set('search', filters.search)
  params.set('page', String(page))
  return useQuery({
    queryKey: ['transactions', filters, page],
    queryFn: () => api<PagedTransactions>(`/transactions?${params.toString()}`),
  })
}

export function useSaveTransaction() {
  const invalidate = useInvalidateFinances()
  return useMutation({
    mutationFn: (input: TransactionInput & { id?: number }) =>
      input.id
        ? api<unknown>(`/transactions/${input.id}`, { method: 'PUT', body: input })
        : api<unknown>('/transactions', { method: 'POST', body: input }),
    onSuccess: invalidate,
  })
}

export function useDeleteTransaction() {
  const invalidate = useInvalidateFinances()
  return useMutation({
    mutationFn: (id: number) => api<void>(`/transactions/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  })
}

export function useImportTransactions() {
  const invalidate = useInvalidateFinances()
  return useMutation({
    mutationFn: (rows: TransactionInput[]) =>
      api<{ imported: number }>('/transactions/bulk', { method: 'POST', body: rows }),
    onSuccess: invalidate,
  })
}

/* ---------- Budgets ---------- */

export function useBudgets(year: number, month: number) {
  return useQuery({
    queryKey: ['budgets', year, month],
    queryFn: () => api<Budget[]>(`/budgets?year=${year}&month=${month}`),
  })
}

export function useSaveBudget() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: BudgetInput & { id?: number }) =>
      input.id
        ? api<Budget>(`/budgets/${input.id}`, { method: 'PUT', body: input })
        : api<Budget>('/budgets', { method: 'POST', body: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budgets'] }),
  })
}

export function useDeleteBudget() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api<void>(`/budgets/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budgets'] }),
  })
}

/* ---------- Savings goals ---------- */

export function useGoals() {
  return useQuery({
    queryKey: ['goals'],
    queryFn: () => api<SavingsGoal[]>('/goals'),
  })
}

export function useSaveGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: SavingsGoalInput & { id?: number }) =>
      input.id
        ? api<SavingsGoal>(`/goals/${input.id}`, { method: 'PUT', body: input })
        : api<SavingsGoal>('/goals', { method: 'POST', body: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  })
}

export function useContributeGoal() {
  const invalidate = useInvalidateFinances()
  return useMutation({
    mutationFn: ({
      id,
      amount,
      fromAccountId,
    }: {
      id: number
      amount: number
      fromAccountId?: number
    }) =>
      api<SavingsGoal>(`/goals/${id}/contribute`, {
        method: 'POST',
        body: { amount, fromAccountId },
      }),
    onSuccess: invalidate,
  })
}

export function useDeleteGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api<void>(`/goals/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  })
}

/* ---------- Recurring transactions ---------- */

export function useRecurring() {
  return useQuery({
    queryKey: ['recurring'],
    queryFn: () => api<RecurringTransaction[]>('/recurring'),
  })
}

export function useSaveRecurring() {
  const invalidate = useInvalidateFinances()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: RecurringTransactionInput & { id?: number }) =>
      input.id
        ? api<RecurringTransaction>(`/recurring/${input.id}`, { method: 'PUT', body: input })
        : api<RecurringTransaction>('/recurring', { method: 'POST', body: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recurring'] })
      invalidate()
    },
  })
}

export function useDeleteRecurring() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api<void>(`/recurring/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recurring'] }),
  })
}

/* ---------- Investments ---------- */

export function useInvestments() {
  return useQuery({
    queryKey: ['investments'],
    queryFn: () => api<InvestmentsSummary>('/investments'),
    // Live prices change — let the query refetch when the user returns to the tab.
    refetchOnWindowFocus: true,
  })
}

export function useSaveInvestment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: InvestmentInput & { id?: number }) =>
      input.id
        ? api(`/investments/${input.id}`, { method: 'PUT', body: input })
        : api('/investments', { method: 'POST', body: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['investments'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useDeleteInvestment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api<void>(`/investments/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['investments'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

/* ---------- Banking (Open Banking via GoCardless) ---------- */

export function useBankingStatus() {
  return useQuery({
    queryKey: ['banking', 'status'],
    queryFn: () => api<BankingStatus>('/banking/status'),
    staleTime: 5 * 60 * 1000,
  })
}

export function useInstitutions(country: string, enabled: boolean) {
  return useQuery({
    queryKey: ['banking', 'institutions', country],
    queryFn: () => api<Institution[]>(`/banking/institutions?country=${country}`),
    enabled,
    staleTime: 30 * 60 * 1000,
  })
}

export function useBankConnections() {
  return useQuery({
    queryKey: ['banking', 'connections'],
    queryFn: () => api<BankConnection[]>('/banking/connections'),
  })
}

export function useCreateRequisition() {
  return useMutation({
    mutationFn: (institutionId: string) =>
      api<RequisitionCreated>('/banking/requisitions', {
        method: 'POST',
        body: { institutionId },
      }),
  })
}

export function useFinalizeBankConnection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (requisitionId: string) =>
      api<BankConnection>('/banking/finalize', {
        method: 'POST',
        body: { requisitionId },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['banking', 'connections'] }),
  })
}

export function useDeleteBankConnection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api<void>(`/banking/connections/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['banking', 'connections'] }),
  })
}

/* ---------- Reports ---------- */

export function useReports(from: string, to: string) {
  return useQuery({
    queryKey: ['reports', from, to],
    queryFn: () => api<ReportSummary>(`/reports?from=${from}&to=${to}`),
    enabled: Boolean(from) && Boolean(to),
    // Keep the previous range's data on screen while the new range loads —
    // avoids the spinner blanking the page on every preset switch.
    placeholderData: keepPreviousData,
    // The data only changes when the user adds/edits a transaction.
    staleTime: 60_000,
  })
}

/* ---------- Dashboard ---------- */

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api<DashboardSummary>('/dashboard/summary'),
  })
}

/* ---------- Password ---------- */

export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) =>
      api<{ message: string }>('/auth/forgot-password', {
        method: 'POST',
        body: { email },
        auth: false,
      }),
  })
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (input: { token: string; newPassword: string }) =>
      api<void>('/auth/reset-password', { method: 'POST', body: input, auth: false }),
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: { currentPassword: string; newPassword: string }) =>
      api<void>('/auth/change-password', { method: 'POST', body: input }),
  })
}
