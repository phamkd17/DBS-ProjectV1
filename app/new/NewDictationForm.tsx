"use client";

import { useActionState } from "react";
import { createDictation } from "@/app/actions";
import { Button, ErrorNote, eyebrow, fieldClass, Spinner } from "@/components/ui";
import type { ActionState } from "@/lib/types";

const FIELD = fieldClass;

export function NewDictationForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(createDictation, {});
  const v = state.values ?? {};
  const err = state.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-5">
      <div className="space-y-1.5">
        <label htmlFor="transcript" className="block text-[17px] font-medium">
          The cook&apos;s words
        </label>
        <textarea
          id="transcript"
          name="transcript"
          rows={12}
          defaultValue={v.transcript}
          aria-invalid={!!err.transcript}
          aria-describedby={err.transcript ? "transcript-error" : "transcript-hint"}
          className={FIELD}
          placeholder="Yogurt is a very simple dish you need about 1/2 gallon jug of milk…"
        />
        {err.transcript ? (
          <p id="transcript-error" className="text-[15px] text-ls-error">
            {err.transcript}
          </p>
        ) : (
          <p id="transcript-hint" className="text-[15px] text-ls-muted">
            Tip: on a phone, tap the 🎤 on the keyboard to dictate.
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="dish_name" className="block text-[17px] font-medium">
          Dish name <span className={eyebrow}>Optional</span>
        </label>
        <input id="dish_name" name="dish_name" maxLength={120} defaultValue={v.dish_name} className={FIELD} placeholder="Yogurt" />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="cook_name" className="block text-[17px] font-medium">
          Whose words are these? <span className={eyebrow}>Optional</span>
        </label>
        <input
          id="cook_name"
          name="cook_name"
          maxLength={60}
          defaultValue={v.cook_name}
          aria-describedby="cook_name-hint"
          className={FIELD}
          placeholder="Grandma"
        />
        <p id="cook_name-hint" className="text-[15px] text-ls-muted">
          Used to label their reasons in the recipe.
        </p>
      </div>

      {state.error && <ErrorNote>{state.error}</ErrorNote>}

      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending && <Spinner />}
        {pending ? "Saving…" : "Save their words"}
      </Button>
    </form>
  );
}
