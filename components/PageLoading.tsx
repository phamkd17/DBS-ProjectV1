import { ProgressLine } from "./ui";

/** Shown while a page loads its data. */
export function PageLoading() {
  return (
    <div role="status" aria-label="Loading" className="space-y-6 pt-2">
      <ProgressLine />
      <div className="h-9 w-2/3 bg-ls-disabled/70" />
      <div className="h-28 border border-ls-border bg-ls-surface" />
      <div className="h-28 border border-ls-border bg-ls-surface" />
    </div>
  );
}
