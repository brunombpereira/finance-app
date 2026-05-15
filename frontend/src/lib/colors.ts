// Single source of truth for the income/expense palette used in charts, progress
// bars and legend dots (inline styles). Kept in the same hue family as the Tailwind
// text classes: graphical elements use the -500 shade, text uses -600 (light) / -400 (dark).
export const INCOME_COLOR = '#10b981' // emerald-500
export const EXPENSE_COLOR = '#ef4444' // red-500
export const WARNING_COLOR = '#f59e0b' // amber-500

// Palette offered in the colour picker for categories and accounts.
export const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#16a34a',
  '#10b981', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6',
  '#a855f7', '#ec4899', '#f43f5e', '#64748b',
]
