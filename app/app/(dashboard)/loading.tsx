export default function Loading() {
  return (
    <main className="min-h-screen bg-white px-4 py-8 dark:bg-black sm:px-8 sm:py-12" aria-busy="true" aria-label="Loading dashboard">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="h-9 w-40 animate-pulse rounded-lg bg-stone-100 dark:bg-stone-900" />
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-2xl bg-stone-100 dark:bg-stone-900" />
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="h-44 animate-pulse rounded-2xl bg-stone-100 dark:bg-stone-900" />
          ))}
        </div>
      </div>
    </main>
  );
}
