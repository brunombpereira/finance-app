import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'
import type { LucideIcon } from 'lucide-react'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700 ${className}`}
    >
      {children}
    </div>
  )
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          {title}
        </h1>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'neutral',
  hint,
}: {
  label: string
  value: string
  icon: LucideIcon
  tone?: 'neutral' | 'positive' | 'negative' | 'accent'
  hint?: string
}) {
  const tones: Record<string, { text: string; chip: string }> = {
    neutral: {
      text: 'text-slate-900 dark:text-slate-100',
      chip: 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300',
    },
    positive: {
      text: 'text-emerald-600 dark:text-emerald-400',
      chip: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
    },
    negative: {
      text: 'text-red-600 dark:text-red-400',
      chip: 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400',
    },
    accent: {
      text: 'text-slate-900 dark:text-slate-100',
      chip: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400',
    },
  }
  const t = tones[tone]
  return (
    <Card className="group p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <span
          className={`grid h-9 w-9 place-items-center rounded-lg transition duration-200 group-hover:scale-110 ${t.chip}`}
        >
          <Icon size={18} />
        </span>
      </div>
      <p className={`mt-3 text-2xl font-semibold ${t.text}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{hint}</p>}
    </Card>
  )
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
}

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  const styles: Record<string, string> = {
    primary:
      'bg-slate-900 text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white',
    secondary:
      'bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-600 dark:hover:bg-slate-700',
    danger: 'bg-red-600 text-white hover:bg-red-500',
    ghost:
      'bg-transparent text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700',
  }
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
      {...props}
    />
  )
}

export function Label({ children }: { children: ReactNode }) {
  return (
    <span className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">
      {children}
    </span>
  )
}

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-slate-400 dark:focus:ring-slate-400 ${className}`}
      {...props}
    />
  )
}

export function Select({ className = '', ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-400 dark:focus:ring-slate-400 ${className}`}
      {...props}
    />
  )
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-slate-200 dark:bg-slate-700 ${className}`} />
}

export function Spinner({ label = 'A carregar…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-400 dark:text-slate-500">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600 dark:border-slate-600 dark:border-t-slate-300" />
      {label}
    </div>
  )
}

export function EmptyState({
  title,
  hint,
  icon: Icon,
  action,
}: {
  title: string
  hint?: string
  icon?: LucideIcon
  action?: ReactNode
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 px-6 py-10 text-center dark:border-slate-700">
      {Icon && (
        <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-400">
          <Icon size={24} />
        </span>
      )}
      <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{title}</p>
      {hint && (
        <p className="mx-auto mt-1 max-w-sm text-xs text-slate-400 dark:text-slate-500">{hint}</p>
      )}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  )
}

export function ErrorText({ children }: { children: ReactNode }) {
  if (!children) return null
  return <p className="mt-2 text-sm text-red-600 dark:text-red-400">{children}</p>
}
