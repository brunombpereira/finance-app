import type { AccountType } from '../api/types'

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  Checking: 'Conta à ordem',
  Savings: 'Poupança',
  Cash: 'Dinheiro',
  CreditCard: 'Cartão de crédito',
}

export const ACCOUNT_TYPES: AccountType[] = ['Checking', 'Savings', 'Cash', 'CreditCard']

// Sensible default icon per account type (used to prefill the icon picker).
export const ACCOUNT_TYPE_DEFAULT_ICON: Record<AccountType, string> = {
  Checking: 'wallet',
  Savings: 'piggy-bank',
  Cash: 'banknote',
  CreditCard: 'credit-card',
}
