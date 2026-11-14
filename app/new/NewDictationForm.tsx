"use client";

import { useActionState } from "react";
import { createDictation } from "@/app/actions";
import { Button, ErrorNote, Spinner } from "@/components/ui";
import type { ActionState } from "@/lib/types";

const FIELD =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-base text-stone-900 placeholder:text-stone-500 focus:border-stone-900 focus:outline-2 focus:outline-stone-900 aria-invalid:border-red-700";

export function NewDictationForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(createDictation, {});
  const v = state.values ?? {};
  const err = state.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-5">
      <div className="space-y-1.5">
        <label htmlFor="transcript" className="block font-medium">
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
          <p id="transcript-error" className="text-sm text-red-800">
            {err.transcript}
          </p>
        ) : (
          <p id="transcript-hint" className="text-sm text-stone-600">
            Tip: on a phone, tap the 🎤 on the keyboard to dictate.
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="dish_name" className="block font-medium">
          Dish name <span className="font-normal text-stone-600">(optional)</span>
        </label>
        <input id="dish_name" name="dish_name" maxLength={120} defaultValue={v.dish_name} className={FIELD} placeholder="Yogurt" />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="cook_name" className="block font-medium">
          Whose words are these? <span className="font-normal text-stone-600">(optional)</span>
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
        <p id="cook_name-hint" className="text-sm text-stone-600">
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
