/** Skeleton shown while a page loads its data. */
export function PageLoading() {
  return (
    <div role="status" aria-label="Loading" className="space-y-3">
      <div className="h-8 w-2/3 animate-pulse rounded bg-stone-200 motion-reduce:animate-none" />
      <div className="h-24 animate-pulse rounded-xl bg-stone-200 motion-reduce:animate-none" />
      <div className="h-24 animate-pulse rounded-xl bg-stone-200 motion-reduce:animate-none" />
    </div>
  );
}
