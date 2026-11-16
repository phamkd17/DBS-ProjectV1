"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { updateIngredientAmount } from "@/app/actions";
import type { ActionState } from "@/lib/types";
import { PencilButton } from "./InlineEdit";
import { fieldClass, Spinner, textLink } from "./ui";

/** An ingredient's amount with a pencil to change it in place. Enter saves, Escape cancels. */
export function EditableAmount({
  recipeId,
  index,
  amount,
  item,
  cookName,
}: {
  recipeId: string;
  index: number;
  amount: string;
  item: string;
  cookName: string;
}) {
  const [editing, setEditing] = useState(false);
  const pencil = useRef<HTMLButtonElement>(null);
  const was = useRef(false);
  useEffect(() => {
    if (!editing && was.current) pencil.current?.focus();
    was.current = editing;
  }, [editing]);

  const [state, action, pending] = useActionState<ActionState, FormData>(async (prev, fd) => {
    const result = await updateIngredientAmount(recipeId, index, cookName, prev, fd);
    if (result.saved) setEditing(false);
    return result;
  }, {});

  if (editing) {
    const inputId = `amount-${index}`;
    return (
      <form action={action} className="flex flex-wrap items-center gap-2">
        <label htmlFor={inputId} className="sr-only">
          Amount of {item}
        </label>
        <input
          id={inputId}
          name="amount"
          autoFocus
          maxLength={60}
          defaultValue={state.values?.amount ?? amount}
          placeholder="e.g. 1/4 cup"
          onKeyDown={(e) => {
            if (e.key === "Escape") setEditing(false);
          }}
          className={`${fieldClass} w-40 py-1.5`}
        />
        <button
          type="submit"
          disabled={pending}
          className={`min-h-11 cursor-pointer px-2 font-ls-sans text-xs font-medium uppercase tracking-[0.18em] ${textLink}`}
        >
          {pending ? <Spinner /> : "Save"}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className={`min-h-11 cursor-pointer px-2 font-ls-sans text-xs font-medium uppercase tracking-[0.18em] text-ls-muted ${textLink}`}
        >
          Cancel
        </button>
        {state.error && (
          <p role="alert" className="w-full text-[15px] text-ls-error">
            {state.error}
          </p>
        )}
      </form>
    );
  }

  return (
    <span className="inline-flex items-center">
      {amount ? <span className="font-medium">{amount}</span> : <span className="text-ls-muted">amount not stated</span>}
      <PencilButton ref={pencil} label={`Edit amount of ${item}`} onClick={() => setEditing(true)} />
    </span>
  );
}
