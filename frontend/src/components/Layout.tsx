import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  ArrowLeftRight,
  BarChart3,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Repeat,
  Settings,
  Sun,
  Tags,
  Target,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { Logo } from './Logo'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end: boolean
}

const navItems: NavItem[] = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/accounts', label: 'Contas', icon: Landmark, end: false },
  { to: '/app/transactions', label: 'Transações', icon: ArrowLeftRight, end: false },
  { to: '/app/recurring', label: 'Recorrentes', icon: Repeat, end: false },
  { to: '/app/budgets', label: 'Orçamentos', icon: Wallet, end: false },
  { to: '/app/goals', label: 'Metas', icon: Target, end: false },
  { to: '/app/investments', label: 'Investimentos', icon: TrendingUp, end: false },
  { to: '/app/reports', label: 'Relatórios', icon: BarChart3, end: false },
  { to: '/app/categories', label: 'Categorias', icon: Tags, end: false },
]

// The four most-used tabs get a fixed slot in the mobile bottom nav.
// Everything else lives behind the "Mais" sheet.
const primaryMobileItems: NavItem[] = [
  navItems[0],   // Dashboard
  navItems[2],   // Transações
  navItems[4],   // Orçamentos
  navItems[5],   // Metas
]
const secondaryMobileItems: NavItem[] = navItems.filter((n) => !primaryMobileItems.includes(n))

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

function MoreSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  // Close when the user navigates into a secondary route.
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-slate-900/40 md:hidden dark:bg-black/60"
      onClick={onClose}
    >
      <div
        className="w-full rounded-t-2xl bg-white p-4 pb-8 shadow-xl dark:bg-slate-900 dark:ring-1 dark:ring-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Mais</h2>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <X size={18} />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {secondaryMobileItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 rounded-xl p-3 text-[11px] font-medium transition ${
                  isActive
                    ? 'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300'
                    : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                }`
              }
            >
              <Icon size={20} />
              <span className="text-center leading-tight">{label}</span>
            </NavLink>
          ))}
          <NavLink
            to="/app/settings"
            onClick={onClose}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 rounded-xl p-3 text-[11px] font-medium transition ${
                isActive
                  ? 'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300'
                  : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
              }`
            }
          >
            <Settings size={20} />
            <span className="text-center leading-tight">Definições</span>
          </NavLink>
        </div>
      </div>
    </div>
  )
}

export function Layout() {
  const { user, logout } = useAuth()
  const [moreOpen, setMoreOpen] = useState(false)
  const location = useLocation()

  const isOnSecondaryRoute = secondaryMobileItems.some((n) =>
    n.end ? location.pathname === n.to : location.pathname.startsWith(n.to),
  ) || location.pathname.startsWith('/app/settings')

  return (
    <div className="flex min-h-full bg-slate-100 dark:bg-slate-950">
      {/* Sidebar — desktop */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col overflow-y-auto border-r border-slate-200 bg-white md:flex dark:border-slate-800 dark:bg-slate-900">
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
                    ? 'bg-cyan-600 text-white shadow-sm dark:bg-cyan-500'
                    : 'text-slate-600 hover:translate-x-1 hover:bg-cyan-50 hover:text-cyan-700 dark:text-slate-400 dark:hover:bg-cyan-500/10 dark:hover:text-cyan-300'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-cyan-500 transition-all duration-200 ${
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
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-cyan-500 to-fuchsia-500 text-sm font-semibold text-white transition-transform duration-200 group-hover:scale-105">
              {user?.displayName?.charAt(0).toUpperCase() ?? '?'}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                {user?.displayName}
              </p>
              <p className="truncate text-xs text-slate-400 dark:text-slate-500">{user?.email}</p>
            </div>
            <NavLink
              to="/app/settings"
              title="Definições"
              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-200 hover:text-slate-900 dark:hover:bg-slate-700 dark:hover:text-slate-100"
            >
              <Settings size={18} />
            </NavLink>
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

        {/* Bottom nav — mobile (4 primary + Mais) */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden dark:border-slate-800 dark:bg-slate-900">
          {primaryMobileItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition ${
                  isActive
                    ? 'text-cyan-600 dark:text-cyan-400'
                    : 'text-slate-400 dark:text-slate-500'
                }`
              }
            >
              <Icon size={20} />
              {label}
            </NavLink>
          ))}
          <button
            onClick={() => setMoreOpen(true)}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition ${
              isOnSecondaryRoute || moreOpen
                ? 'text-cyan-600 dark:text-cyan-400'
                : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            <Menu size={20} />
            Mais
          </button>
        </nav>

        <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
      </div>
    </div>
  )
}
