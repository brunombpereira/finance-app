import { NavLink, Outlet } from 'react-router-dom'
import {
  ArrowLeftRight,
  Landmark,
  LayoutDashboard,
  LogOut,
  Moon,
  Repeat,
  Sun,
  Tags,
  Target,
  Wallet,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end: boolean
}

const navItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/accounts', label: 'Contas', icon: Landmark, end: false },
  { to: '/transactions', label: 'Transações', icon: ArrowLeftRight, end: false },
  { to: '/recurring', label: 'Recorrentes', icon: Repeat, end: false },
  { to: '/budgets', label: 'Orçamentos', icon: Wallet, end: false },
  { to: '/goals', label: 'Metas', icon: Target, end: false },
  { to: '/categories', label: 'Categorias', icon: Tags, end: false },
]

function Logo() {
  return (
    <div className="group flex cursor-default items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 text-base font-bold text-white transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110">
        €
      </span>
      <span className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
        FinanceApp
      </span>
    </div>
  )
}

function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useTheme()
  return (
    <button
      onClick={toggleTheme}
      title={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
      className={`group/theme rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100 ${className}`}
    >
      {theme === 'dark' ? (
        <Sun size={18} className="transition-transform duration-300 group-hover/theme:rotate-45" />
      ) : (
        <Moon size={18} className="transition-transform duration-300 group-hover/theme:-rotate-12" />
      )}
    </button>
  )
}

export function Layout() {
  const { user, logout } = useAuth()

  return (
    <div className="flex min-h-full bg-slate-100 dark:bg-slate-950">
      {/* Sidebar — desktop */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white md:flex dark:border-slate-800 dark:bg-slate-900">
        <div className="px-5 py-5">
          <Logo />
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 overflow-hidden rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm dark:bg-indigo-500'
                    : 'text-slate-600 hover:translate-x-1 hover:bg-indigo-50 hover:text-indigo-700 dark:text-slate-400 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {/* Accent bar — grows in on hover for inactive items */}
                  <span
                    className={`absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-indigo-500 transition-all duration-200 ${
                      isActive
                        ? 'opacity-0'
                        : 'scale-y-0 opacity-0 group-hover:scale-y-100 group-hover:opacity-100'
                    }`}
                  />
                  <Icon
                    size={18}
                    className="shrink-0 transition-transform duration-200 group-hover:scale-110"
                  />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="space-y-1 border-t border-slate-200 p-3 dark:border-slate-800">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-medium text-slate-400 dark:text-slate-500">Tema</span>
            <ThemeToggle />
          </div>
          <div className="group flex items-center gap-3 rounded-lg px-3 py-2 transition-colors duration-200 hover:bg-slate-50 dark:hover:bg-slate-800">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-600 transition-all duration-200 group-hover:scale-105 group-hover:bg-indigo-600 group-hover:text-white dark:bg-indigo-500/15 dark:text-indigo-300 dark:group-hover:bg-indigo-500 dark:group-hover:text-white">
              {user?.displayName?.charAt(0).toUpperCase() ?? '?'}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                {user?.displayName}
              </p>
              <p className="truncate text-xs text-slate-400 dark:text-slate-500">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              title="Sair"
              className="group/btn rounded-lg p-2 text-slate-400 transition hover:bg-slate-200 hover:text-slate-900 dark:hover:bg-slate-700 dark:hover:text-slate-100"
            >
              <LogOut
                size={18}
                className="transition-transform duration-200 group-hover/btn:translate-x-0.5"
              />
            </button>
          </div>
        </div>
      </aside>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar — mobile */}
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden dark:border-slate-800 dark:bg-slate-900">
          <Logo />
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <button
              onClick={logout}
              className="group/btn rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-700 dark:hover:text-slate-100"
              title="Sair"
            >
              <LogOut
                size={20}
                className="transition-transform duration-200 group-hover/btn:translate-x-0.5"
              />
            </button>
          </div>
        </header>

        <main className="flex-1 px-4 pb-24 pt-5 md:px-8 md:pb-8 md:pt-7">
          <Outlet />
        </main>

        {/* Bottom nav — mobile */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-slate-200 bg-white md:hidden dark:border-slate-800 dark:bg-slate-900">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition ${
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-400 dark:text-slate-500'
                }`
              }
            >
              <Icon size={20} />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
