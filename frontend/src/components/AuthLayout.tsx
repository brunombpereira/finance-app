import { useState } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { LogoMark } from './Logo'
import { Input } from './ui'

export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <div className="relative flex min-h-full items-center justify-center overflow-hidden bg-white px-4 py-12 dark:bg-slate-950">
      {/* Subtle dot grid — adds texture to wide empty backdrops */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,rgba(148,163,184,0.12)_1px,transparent_1px)] [background-size:22px_22px] dark:bg-[radial-gradient(circle,rgba(148,163,184,0.08)_1px,transparent_1px)]"
      />
      {/* Ambient brand glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 -top-40 h-[36rem] w-[36rem] rounded-full bg-cyan-500/15 blur-3xl dark:bg-cyan-500/10"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -right-40 h-[36rem] w-[36rem] rounded-full bg-fuchsia-500/15 blur-3xl dark:bg-fuchsia-500/10"
      />

      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <div className="relative">
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-6 rounded-full bg-gradient-to-br from-cyan-500 to-fuchsia-500 opacity-50 blur-2xl"
            />
            <LogoMark className="relative h-14 w-14" />
          </div>
          <p className="mt-4 text-sm font-medium tracking-wide text-slate-500 dark:text-slate-400">
            Nexo Finance
          </p>
        </div>

        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            {title}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>

        {children}
      </div>
    </div>
  )
}

export function AuthCard({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/60 p-7 shadow-xl shadow-slate-300/20 backdrop-blur-sm dark:border-slate-800/80 dark:bg-slate-900/50 dark:shadow-slate-950/40">
      {children}
    </div>
  )
}

type IconInputProps = InputHTMLAttributes<HTMLInputElement> & { icon: LucideIcon }

export function IconInput({ icon: Icon, className = '', ...props }: IconInputProps) {
  return (
    <div className="relative">
      <Icon
        size={16}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
      />
      <Input {...props} className={`pl-9 ${className}`} />
    </div>
  )
}

export function PasswordInput({ icon: Icon, className = '', ...props }: IconInputProps) {
  const [shown, setShown] = useState(false)
  return (
    <div className="relative">
      <Icon
        size={16}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
      />
      <Input
        {...props}
        type={shown ? 'text' : 'password'}
        className={`pl-9 pr-10 ${className}`}
      />
      <button
        type="button"
        onClick={() => setShown((s) => !s)}
        tabIndex={-1}
        aria-label={shown ? 'Esconder password' : 'Mostrar password'}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
      >
        {shown ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  )
}
