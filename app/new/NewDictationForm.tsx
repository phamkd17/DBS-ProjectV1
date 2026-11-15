"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createDictation, updateDictation } from "@/app/actions";
import { Button, ErrorNote, eyebrow, fieldClass, Spinner, textLink } from "@/components/ui";
import type { ActionState, DictationRow } from "@/lib/types";

const FIELD = fieldClass;

type Editing = Pick<DictationRow, "id" | "transcript" | "dish_name" | "cook_name">;

export function NewDictationForm({
  defaultDish = "",
  dictation,
  backHref,
}: {
  defaultDish?: string;
  dictation?: Editing;
  backHref?: string;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    dictation ? updateDictation.bind(null, dictation.id) : createDictation,
    {}
  );
  const v =
    state.values ??
    (dictation
      ? { transcript: dictation.transcript, dish_name: dictation.dish_name ?? "", cook_name: dictation.cook_name ?? "" }
      : { dish_name: defaultDish });
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
          placeholder="e.g. “Yogurt is a very simple dish, you need about a half gallon of milk…”"
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
        <input id="dish_name" name="dish_name" maxLength={120} defaultValue={v.dish_name} className={FIELD} placeholder="e.g. Yogurt" />
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
          placeholder="e.g. Grandma"
        />
        <p id="cook_name-hint" className="text-[15px] text-ls-muted">
          Used to label their reasons in the recipe.
        </p>
      </div>

      {state.error && <ErrorNote>{state.error}</ErrorNote>}

      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending && <Spinner />}
        {pending ? "Saving…" : dictation ? "Save changes" : "Save their words"}
      </Button>
      {dictation && backHref && (
        <Link
          href={backHref}
          className={`ml-2 inline-flex min-h-11 items-center px-3 font-ls-sans text-xs font-medium uppercase tracking-[0.18em] ${textLink}`}
        >
          Cancel
        </Link>
      )}
    </form>
  );
}
