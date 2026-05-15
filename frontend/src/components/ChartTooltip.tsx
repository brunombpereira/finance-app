import { formatMoney } from '../lib/format'

interface TooltipEntry {
  name?: string
  value?: number | string
  color?: string
  payload?: { color?: string; fill?: string }
}

interface ChartTooltipProps {
  active?: boolean
  payload?: TooltipEntry[]
  label?: string | number
}

export function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg dark:border-slate-700 dark:bg-slate-800">
      {label !== undefined && label !== '' && (
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
          {label}
        </p>
      )}
      <ul className="space-y-1">
        {payload.map((entry, i) => {
          const color = entry.color ?? entry.payload?.color ?? entry.payload?.fill ?? '#94a3b8'
          return (
            <li key={i} className="flex items-center gap-2 text-sm">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-slate-500 dark:text-slate-400">{entry.name}</span>
              <span className="ml-4 font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                {formatMoney(Number(entry.value ?? 0))}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
