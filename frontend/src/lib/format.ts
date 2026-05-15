const currencyFormatter = new Intl.NumberFormat('pt-PT', {
  style: 'currency',
  currency: 'EUR',
})

export function formatMoney(value: number): string {
  return currencyFormatter.format(value)
}

const dateFormatter = new Intl.DateTimeFormat('pt-PT', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

export function formatDate(iso: string): string {
  // iso is a plain date string like "2026-05-14"
  const [y, m, d] = iso.split('-').map(Number)
  return dateFormatter.format(new Date(y, m - 1, d))
}

const MONTH_NAMES = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
]

export function monthLabel(month: number): string {
  return MONTH_NAMES[month - 1] ?? String(month)
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}
