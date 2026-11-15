"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { NewDictationForm } from "@/app/new/NewDictationForm";
import type { DictationRow } from "@/lib/types";
import { Button, Transcript } from "./ui";

type Props = {
  dictation: DictationRow;
  open?: boolean;
  /** Next step (e.g. the AI panel): hidden while editing, so Save is the only main action. */
  children?: ReactNode;
};

/** The cook's words (plus dish and cook names), editable in place. The first version is kept by the database. */
export function DictationEditor({ dictation: d, open = false, children }: Props) {
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

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Transcript
          text={d.transcript}
          cookName={d.cook_name}
          original={d.original_transcript}
          editedAt={d.edited_at}
          open={open}
        />
        <div className="flex justify-end">
          <Button ref={editBtn} variant="quiet" onClick={() => setEditing(true)}>
            Edit their words
          </Button>
        </div>
      </div>
      {children}
    </div>
  );
}
