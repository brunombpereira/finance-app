import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BarChart3,
  Code2,
  Repeat,
  Smartphone,
  Target,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { LogoMark } from '../components/Logo'

const features = [
  {
    icon: Wallet,
    title: 'Contas e saldos',
    description: 'Várias contas, transferências entre elas e o saldo sempre atualizado.',
  },
  {
    icon: BarChart3,
    title: 'Relatórios profundos',
    description: 'Compara qualquer período com o anterior, por categoria e ao longo do tempo.',
  },
  {
    icon: TrendingUp,
    title: 'Portfolio de investimentos',
    description: 'Acompanha posições com preços ao vivo, P&L e totais por moeda.',
  },
  {
    icon: Target,
    title: 'Metas de poupança',
    description: 'Define objetivos, liga-os a uma conta e vê o progresso em tempo real.',
  },
  {
    icon: Repeat,
    title: 'Recorrentes e orçamentos',
    description: 'Transações recorrentes automáticas e orçamentos mensais por categoria.',
  },
  {
    icon: Smartphone,
    title: 'PWA com modo escuro',
    description: 'Instala como app no telemóvel ou desktop. Tema claro e escuro.',
  },
]

export function Landing() {
  return (
    <div className="relative min-h-full overflow-hidden bg-white dark:bg-slate-950">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,rgba(148,163,184,0.12)_1px,transparent_1px)] [background-size:22px_22px] dark:bg-[radial-gradient(circle,rgba(148,163,184,0.08)_1px,transparent_1px)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 -top-40 h-[36rem] w-[36rem] rounded-full bg-cyan-500/15 blur-3xl dark:bg-cyan-500/10"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 top-1/3 h-[36rem] w-[36rem] rounded-full bg-fuchsia-500/15 blur-3xl dark:bg-fuchsia-500/10"
      />

      {/* Nav */}
      <header className="relative">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link to="/" className="flex items-center gap-2.5">
            <LogoMark className="h-9 w-9" />
            <span className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              Nexo <span className="text-slate-400 dark:text-slate-500">Finance</span>
            </span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link
              to="/login"
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            >
              Entrar
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-3.5 py-1.5 text-sm font-medium text-white shadow-sm transition hover:opacity-95"
            >
              Criar conta
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <div className="mx-auto max-w-3xl px-6 pt-16 pb-20 text-center sm:pt-24 sm:pb-28">
          <div className="mx-auto mb-8 flex justify-center">
            <div className="relative">
              <div
                aria-hidden
                className="pointer-events-none absolute -inset-8 rounded-full bg-gradient-to-br from-cyan-500 to-fuchsia-500 opacity-50 blur-2xl"
              />
              <LogoMark className="relative h-16 w-16" />
            </div>
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl dark:text-slate-100">
            As tuas finanças,{' '}
            <span className="bg-gradient-to-r from-cyan-500 to-fuchsia-500 bg-clip-text text-transparent">
              com clareza.
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-slate-600 sm:text-lg dark:text-slate-300">
            Contas, transações, orçamentos, metas e investimentos numa só app. Vê para onde vai
            o teu dinheiro — e onde poderia ir.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/register"
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
            >
              Começar grátis
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Já tenho conta
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-100">
              Tudo o que precisas, num só sítio
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Pensada para quem leva a sério o controlo das suas finanças.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="rounded-2xl border border-slate-200/80 bg-white/60 p-5 shadow-sm backdrop-blur-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800/80 dark:bg-slate-900/50"
              >
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-cyan-100 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-400">
                  <Icon size={20} />
                </span>
                <h3 className="mt-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {title}
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative">
        <div className="mx-auto max-w-3xl px-6 pb-20 text-center">
          <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white/70 p-10 shadow-sm backdrop-blur-sm dark:border-slate-800/80 dark:bg-slate-900/60">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-100">
              Pronto para começar?
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
              Cria uma conta em segundos e começa a organizar o teu dinheiro.
            </p>
            <Link
              to="/register"
              className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
            >
              Criar conta
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-6 py-6 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          <p>
            © {new Date().getFullYear()} Nexo Finance. Construído por{' '}
            <a
              href="https://github.com/brunombpereira"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-slate-700 hover:underline dark:text-slate-200"
            >
              Bruno Pereira
            </a>
            .
          </p>
          <a
            href="https://github.com/brunombpereira/finance-app"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 transition hover:text-slate-900 dark:hover:text-slate-100"
          >
            <Code2 size={14} /> Código no GitHub
          </a>
        </div>
      </footer>
    </div>
  )
}
