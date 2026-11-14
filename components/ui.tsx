import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import type { Source } from "@/lib/ai/schema";

// Colors from the proposal page: cook = cream, food science = green,
// suggested = blue. Family answers get violet. All pairs pass WCAG AA.
const SOURCE_STYLE: Record<Source, string> = {
  cook: "bg-amber-50 text-amber-900 ring-amber-300",
  food_science: "bg-emerald-50 text-emerald-900 ring-emerald-300",
  suggested: "bg-sky-50 text-sky-900 ring-sky-300",
  user_answer: "bg-violet-50 text-violet-900 ring-violet-300",
  not_stated: "bg-stone-100 text-stone-700 ring-stone-300",
};

export function sourceLabel(source: Source, cookName?: string | null) {
  switch (source) {
    case "cook":
      return cookName || "Cook";
    case "food_science":
      return "Food science";
    case "suggested":
      return "Suggested";
    case "user_answer":
      return "Family answer";
    case "not_stated":
      return "Not stated";
  }
}

export function SourceBadge({ source, cookName }: { source: Source; cookName?: string | null }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${SOURCE_STYLE[source]}`}
    >
      {sourceLabel(source, cookName)}
    </span>
  );
}

const BUTTON_BASE =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-base font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900 disabled:cursor-not-allowed disabled:opacity-60";
const BUTTON_VARIANT = {
  primary: "bg-stone-900 text-white hover:bg-stone-700 active:bg-stone-800",
  secondary: "bg-white text-stone-900 ring-1 ring-inset ring-stone-300 hover:bg-stone-100 active:bg-stone-200",
  quiet: "text-stone-700 underline-offset-4 hover:bg-stone-100 hover:underline active:bg-stone-200",
  danger: "text-red-800 hover:bg-red-50 active:bg-red-100",
};
export type ButtonVariant = keyof typeof BUTTON_VARIANT;

export function buttonClass(variant: ButtonVariant = "primary", extra = "") {
  return `${BUTTON_BASE} ${BUTTON_VARIANT[variant]} ${extra}`;
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: ButtonVariant }) {
  return <button className={buttonClass(variant, className)} {...props} />;
}

export function LinkButton({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: ButtonVariant }) {
  return <Link className={buttonClass(variant, className)} {...props} />;
}

export function ErrorNote({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <p id={id} role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-900 ring-1 ring-inset ring-red-200">
      {children}
    </p>
  );
}

export function Spinner() {
  return (
    <span
      aria-hidden
      className="inline-block size-4 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none"
    />
  );
}

/** Her words, exactly as saved. Never edited. */
export function Transcript({
  text,
  cookName,
  open = false,
}: {
  text: string;
  cookName?: string | null;
  open?: boolean;
}) {
  return (
    <details open={open} className="group rounded-xl bg-amber-50 ring-1 ring-inset ring-amber-200">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-xl px-4 py-3 font-medium text-amber-950 hover:bg-amber-100 focus-visible:outline-2 focus-visible:outline-stone-900">
        <span>{cookName ? `${cookName}'s words` : "Her words"} · exactly as said</span>
        <span aria-hidden className="text-sm transition-transform group-open:rotate-180">▾</span>
      </summary>
      <p className="whitespace-pre-wrap px-4 pb-4 text-[15px] leading-relaxed text-amber-950">{text}</p>
    </details>
  );
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
