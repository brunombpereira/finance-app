import { lazy, Suspense } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from './context/AuthContext'
import { ConfirmProvider } from './context/ConfirmContext'
import { ThemeProvider } from './context/ThemeContext'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'

// Route-level code splitting — keeps recharts and per-page code out of the entry bundle.
const Login = lazy(() => import('./pages/Login').then((m) => ({ default: m.Login })))
const Register = lazy(() => import('./pages/Register').then((m) => ({ default: m.Register })))
const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })))
const Transactions = lazy(() =>
  import('./pages/Transactions').then((m) => ({ default: m.Transactions })),
)
const Budgets = lazy(() => import('./pages/Budgets').then((m) => ({ default: m.Budgets })))
const Goals = lazy(() => import('./pages/Goals').then((m) => ({ default: m.Goals })))
const Categories = lazy(() =>
  import('./pages/Categories').then((m) => ({ default: m.Categories })),
)
const Recurring = lazy(() => import('./pages/Recurring').then((m) => ({ default: m.Recurring })))
const Accounts = lazy(() => import('./pages/Accounts').then((m) => ({ default: m.Accounts })))
const Import = lazy(() => import('./pages/Import').then((m) => ({ default: m.Import })))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
})

function RouteFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <ConfirmProvider>
            <Toaster richColors position="top-right" theme="system" />
            <BrowserRouter>
              <Suspense fallback={<RouteFallback />}>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route element={<ProtectedRoute />}>
                    <Route element={<Layout />}>
                      <Route index element={<Dashboard />} />
                      <Route path="accounts" element={<Accounts />} />
                      <Route path="transactions" element={<Transactions />} />
                      <Route path="import" element={<Import />} />
                      <Route path="budgets" element={<Budgets />} />
                      <Route path="goals" element={<Goals />} />
                      <Route path="categories" element={<Categories />} />
                      <Route path="recurring" element={<Recurring />} />
                    </Route>
                  </Route>
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </ConfirmProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
