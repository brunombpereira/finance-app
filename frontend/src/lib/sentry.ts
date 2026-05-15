import * as Sentry from '@sentry/react'

// Only initialise when a DSN is provided — keeps dev runs free of network
// calls and avoids accidentally polluting issue trackers from local builds.
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN
  if (!dsn) return

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 0.1,
    // Trim noise — these errors are usually browser-extension or third-party glitches.
    ignoreErrors: ['ResizeObserver loop limit exceeded', 'Non-Error promise rejection captured'],
  })
}
