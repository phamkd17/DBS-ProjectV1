"use client";

import { useTransition } from "react";
import { moveItem } from "@/app/actions";
import { AiBadge, Button, Spinner } from "./ui";

/**
 * Shown instead of the AI step when a dictation isn't in Development.
 * The AI recipe step only lives in Development (student's rule, Nov 15).
 * Draft wording: for the student to review.
 */
export function StartDeveloping({ dictationId }: { dictationId: string }) {
  const [pending, start] = useTransition();
  return (
    <section aria-labelledby="start-dev" className="space-y-4 border border-ls-border bg-ls-surface p-5">
      <AiBadge>AI recipe step</AiBadge>
      <h2 id="start-dev" className="font-ls-serif text-3xl leading-tight">
        Ready to develop it?
      </h2>
      <p className="max-w-prose text-[15px] leading-relaxed text-ls-muted">
        Recipes are made with AI in Development. Move it there when their words are complete, then create the recipe.
      </p>
      <Button
        disabled={pending}
        onClick={() => {
          const fd = new FormData();
          fd.set("stage", "development");
          start(() => moveItem("dictation", dictationId, fd));
        }}
        className="w-full sm:w-auto"
      >
        {pending && <Spinner />}
        {pending ? "Moving…" : "Move to Development"}
      </Button>
    </section>
  );
}
