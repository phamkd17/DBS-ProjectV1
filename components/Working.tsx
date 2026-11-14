"use client";

import { useEffect, useState } from "react";
import { Spinner } from "./ui";

/** A loading state for slow AI calls: says what's happening, and that it's normal. */
export function Working({ messages }: { messages: string[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => Math.min(n + 1, messages.length - 1)), 7000);
    return () => clearInterval(t);
  }, [messages.length]);

  return (
    <div role="status" aria-live="polite" className="flex items-start gap-3 rounded-xl bg-white p-4 ring-1 ring-stone-200">
      <span className="mt-1 text-stone-700">
        <Spinner />
      </span>
      <div>
        <p className="font-medium">{messages[i]}</p>
        <p className="text-sm text-stone-600">This usually takes 20–40 seconds. You can keep this page open.</p>
      </div>
    </div>
  );
}
