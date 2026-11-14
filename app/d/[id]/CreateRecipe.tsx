"use client";

import { useActionState } from "react";
import { createRecipe } from "@/app/actions";
import { Button, ErrorNote } from "@/components/ui";
import { Working } from "@/components/Working";
import type { ActionState } from "@/lib/types";

export function CreateRecipe({ dictationId }: { dictationId: string }) {
  const [state, action, pending] = useActionState<ActionState>(createRecipe.bind(null, dictationId), {});

  return (
    <form action={action} className="space-y-3">
      {pending ? (
        <Working
          messages={[
            "Reading their words…",
            "Writing a first draft…",
            "Looking for anything a new cook couldn't figure out…",
            "Almost done…",
          ]}
        />
      ) : (
        <>
          {state.error && <ErrorNote>{state.error}</ErrorNote>}
          <Button type="submit" className="w-full sm:w-auto">
            {state.error ? "Try again" : "Create recipe"}
          </Button>
          <p className="text-sm text-stone-600">
            The app drafts a recipe and asks you about anything it can&apos;t know from their words.
          </p>
        </>
      )}
    </form>
  );
}
