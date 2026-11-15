"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { NewDictationForm } from "@/app/new/NewDictationForm";
import type { DictationRow } from "@/lib/types";
import { Button, eyebrow, formatDate, Transcript } from "./ui";

type Props = {
  dictation: DictationRow;
  /** Show the dish name as the page title (dictation page), or just the words (recipe page). */
  withHeading?: boolean;
  open?: boolean;
  /** Next step (e.g. the AI panel): hidden while editing, so Save is the only main action. */
  children?: ReactNode;
};

/** The cook's words (plus dish and cook names), editable in place. The first version is kept by the database. */
export function DictationEditor({ dictation: d, withHeading = false, open = false, children }: Props) {
  const [editing, setEditing] = useState(false);
  const editBtn = useRef<HTMLButtonElement>(null);
  const wasEditing = useRef(false);
  useEffect(() => {
    if (!editing && wasEditing.current) editBtn.current?.focus();
    wasEditing.current = editing;
  }, [editing]);

  if (editing) {
    return (
      <section aria-label="Edit their words" className="space-y-4 border border-ls-ink bg-ls-surface p-5">
        <p className="text-[15px] text-ls-muted">The first version is always kept, so you can see the original later.</p>
        <NewDictationForm dictation={d} onSaved={() => setEditing(false)} onCancel={() => setEditing(false)} />
      </section>
    );
  }

  const editButton = (
    <Button ref={editBtn} variant="secondary" onClick={() => setEditing(true)}>
      {withHeading ? "Edit" : "Edit their words"}
    </Button>
  );

  return (
    <div className="space-y-8">
      {withHeading && (
        <div className="space-y-3">
          <h1 className="font-ls-serif text-5xl leading-none">{d.dish_name || "Untitled dictation"}</h1>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className={eyebrow}>
              {d.cook_name ? `${d.cook_name} · ` : ""}Saved {formatDate(d.created_at)}
            </p>
            {editButton}
          </div>
        </div>
      )}
      <Transcript
        text={d.transcript}
        cookName={d.cook_name}
        original={d.original_transcript}
        editedAt={d.edited_at}
        open={open}
      />
      {!withHeading && <div className="-mt-5">{editButton}</div>}
      {children}
    </div>
  );
}
