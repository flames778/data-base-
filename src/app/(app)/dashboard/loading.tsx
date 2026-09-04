export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="mb-6 h-8 w-48 rounded bg-slate-200" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-[28px] bg-slate-100" />
        ))}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 h-64 rounded-[28px] bg-slate-100" />
        <div className="h-64 rounded-[28px] bg-slate-100" />
      </div>
    </div>
  );
}
