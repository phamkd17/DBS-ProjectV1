"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { buttonClass, focusRing } from "./ui";

// Draft wording: for the student to review.
const OPTIONS = [
  { href: "/ideas/new", label: "Idea", hint: "A note, link, or dish to try later" },
  { href: "/new", label: "Dictation", hint: "The cook's words, to turn into a recipe" },
];

/** One "New" button that opens a choice: Idea or Dictation (disclosure pattern). */
export function NewMenu() {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrap} className="relative">
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className={buttonClass("primary", "min-w-32")}
      >
        New
        <svg
          aria-hidden
          viewBox="0 0 12 12"
          className={`size-3 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        >
          <path d="M2 4.5 6 8.5 10 4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>
      <ul
        id={id}
        hidden={!open}
        className="absolute left-0 z-10 mt-2 w-72 max-w-[calc(100vw-2.5rem)] divide-y divide-ls-border border border-ls-ink bg-ls-surface sm:right-0 sm:left-auto"
      >
        {OPTIONS.map((o) => (
          <li key={o.href}>
            <Link
              href={o.href}
              onClick={() => setOpen(false)}
              className={`block px-4 py-3 hover:bg-ls-ink/[0.06] active:bg-ls-ink/[0.12] ${focusRing} focus-visible:-outline-offset-2`}
            >
              <span className="block font-ls-serif text-2xl leading-tight">{o.label}</span>
              <span className="block text-[15px] text-ls-muted">{o.hint}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
