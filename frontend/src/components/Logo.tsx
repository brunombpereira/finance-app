import { useId } from 'react'

type Tone = 'brand' | 'onColor'

/**
 * The Nexo mark — a stylised "N" whose connecting stroke climbs to a peak
 * (a rising trend line ending in a data point). Echoes the cyan→magenta
 * "N" of the Nexo WSL theme.
 */
export function LogoMark({
  className = 'h-9 w-9',
  tone = 'brand',
}: {
  className?: string
  tone?: Tone
}) {
  const id = useId()
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      {tone === 'brand' ? (
        <>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#06b6d4" />
              <stop offset="1" stopColor="#d946ef" />
            </linearGradient>
          </defs>
          <rect width="48" height="48" rx="13" fill={`url(#${id})`} />
        </>
      ) : (
        <rect width="48" height="48" rx="13" fill="#ffffff" fillOpacity="0.16" />
      )}
      <path
        d="M14 21V34L34 14"
        fill="none"
        stroke="#ffffff"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M34 34V14" fill="none" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
      <circle cx="34" cy="14" r="4" fill="#ffffff" />
    </svg>
  )
}

export function Logo({
  className = '',
  tone = 'brand',
}: {
  className?: string
  tone?: Tone
}) {
  return (
    <div className={`group flex items-center gap-2.5 ${className}`}>
      <LogoMark className="h-9 w-9 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6" tone={tone} />
      <span
        className={`text-lg font-semibold tracking-tight ${
          tone === 'onColor' ? 'text-white' : 'text-slate-900 dark:text-slate-100'
        }`}
      >
        Nexo{' '}
        <span className={tone === 'onColor' ? 'text-white/60' : 'text-slate-400 dark:text-slate-500'}>
          Finance
        </span>
      </span>
    </div>
  )
}
