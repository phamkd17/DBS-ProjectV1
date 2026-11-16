"use client";

import { useEffect, useState } from "react";
import { eyebrow, ProgressLine } from "./ui";

/** A loading state for slow AI calls: says what's happening, and that it's normal. */
export function Working({ messages }: { messages: string[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => Math.min(n + 1, messages.length - 1)), 7000);
    return () => clearInterval(t);
  }, [messages.length]);

  return (
    <div role="status" aria-live="polite" className="space-y-3 border border-ls-ink bg-ls-surface p-5">
      <p className={eyebrow}>Working on it</p>
      <p className="font-ls-serif text-2xl leading-tight">{messages[i]}</p>
      <ProgressLine />
      <p className="text-[15px] text-ls-muted">This usually takes 20–40 seconds. You can keep this page open.</p>
    </div>
  );
}
