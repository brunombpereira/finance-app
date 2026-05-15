import { Card, Skeleton } from './ui'

// Grid of placeholder cards — drop in where a page's card grid loads
// (the page's real header/filters render immediately above it).
export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="space-y-4 p-5">
          <div className="flex items-center gap-3">
            <Skeleton className="h-11 w-11 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
          <Skeleton className="h-2.5 w-full rounded-full" />
          <Skeleton className="h-4 w-1/2" />
        </Card>
      ))}
    </div>
  )
}

// Placeholder rows for a transaction-style list inside a Card.
export function ListRowsSkeleton({ count = 5 }: { count?: number }) {
  return (
    <Card>
      <div className="p-2">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-3 py-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </Card>
  )
}

// Full-page dashboard placeholder — used as a complete replacement while loading.
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-56" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="space-y-3 p-5">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-9 rounded-lg" />
            </div>
            <Skeleton className="h-7 w-28" />
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="space-y-4 p-5 lg:col-span-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-64 w-full" />
        </Card>
        <Card className="space-y-4 p-5">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="mx-auto h-40 w-40 rounded-full" />
        </Card>
      </div>
    </div>
  )
}
