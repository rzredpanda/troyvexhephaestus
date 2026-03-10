export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 rounded bg-muted" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-md border bg-card p-5 space-y-3">
            <div className="h-3 w-24 rounded bg-muted" />
            <div className="h-7 w-16 rounded bg-muted" />
          </div>
        ))}
      </div>
      <div className="rounded-md border bg-card p-6 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-4 rounded bg-muted" style={{ width: `${70 + Math.random() * 30}%` }} />
        ))}
      </div>
    </div>
  );
}
