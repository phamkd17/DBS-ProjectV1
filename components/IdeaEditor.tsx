"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { IdeaRow } from "@/lib/types";
import { IdeaForm } from "./IdeaForm";
import { Button, eyebrow, formatDate, textLink } from "./ui";

/** An idea you can edit in place: Edit turns the title, note, and link into fields right here. */
export function IdeaEditor({ idea, children }: { idea: IdeaRow; children?: ReactNode }) {
  const [editing, setEditing] = useState(false);
  const editBtn = useRef<HTMLButtonElement>(null);
  const wasEditing = useRef(false);
  useEffect(() => {
    if (!editing && wasEditing.current) editBtn.current?.focus(); // back where you were
    wasEditing.current = editing;
  }, [editing]);

  if (editing) {
    return (
      <section aria-label="Edit idea" className="border border-ls-ink bg-ls-surface p-5">
        <IdeaForm idea={idea} onSaved={() => setEditing(false)} onCancel={() => setEditing(false)} />
      </section>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="font-ls-serif text-5xl leading-none">{idea.title}</h1>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className={eyebrow}>
            Saved {formatDate(idea.created_at)}
            {idea.updated_at > idea.created_at ? ` · edited ${formatDate(idea.updated_at)}` : ""}
          </p>
          <Button ref={editBtn} variant="secondary" onClick={() => setEditing(true)}>
            Edit
          </Button>
        </div>
      </div>

      {(idea.note || idea.link) && (
        <div className="space-y-4 border-y border-ls-ink py-5">
          {idea.note && <p className="max-w-prose whitespace-pre-wrap text-[17px] leading-relaxed">{idea.note}</p>}
          {idea.link && (
            <p className="text-[15px]">
              <a href={idea.link} target="_blank" rel="noopener noreferrer" className={`break-all ${textLink}`}>
                {idea.link.replace(/^https?:\/\//, "")}
              </a>
              <span aria-hidden> ↗</span>
              <span className="sr-only"> (opens in a new tab)</span>
            </p>
          )}
        </div>
      )}
      {/* Next step (e.g. "Add the cook's words"): hidden while editing, so Save is the only main action. */}
      {children}
    </div>
  );
}
