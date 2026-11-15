import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteIdea } from "@/app/actions";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { EditableNotes, EditableTitle } from "@/components/InlineEdit";
import { MoveTo } from "@/components/MoveTo";
import { eyebrow, formatDate, LinkButton, textLink } from "@/components/ui";
import { supabaseForUser } from "@/lib/supabase/server";
import { STAGE_LABEL, type IdeaRow } from "@/lib/types";

export default async function IdeaPage({ params }: PageProps<"/i/[id]">) {
  const { id } = await params;
  const supabase = await supabaseForUser();
  // RLS: returns nothing unless this idea is yours.
  const { data: idea } = await supabase.from("ideas").select("*").eq("id", id).maybeSingle<IdeaRow>();
  if (!idea) notFound();

  return (
    <main className="space-y-8">
      <div className="space-y-3">
        <p className={eyebrow}>
          <Link href={`/?tab=${idea.stage}`} className={textLink}>
            {STAGE_LABEL[idea.stage]}
          </Link>{" "}
          / Idea
        </p>
        <EditableTitle kind="idea" id={idea.id} title={idea.title} />
        <p className={eyebrow}>
          Saved {formatDate(idea.created_at)}
          {idea.updated_at > idea.created_at ? ` · edited ${formatDate(idea.updated_at)}` : ""}
        </p>
      </div>

      <EditableNotes kind="idea" id={idea.id} note={idea.note} link={idea.link} />

      <div className="space-y-3">
        <LinkButton href={`/new?dish=${encodeURIComponent(idea.title)}`}>Add the cook&apos;s words</LinkButton>
        <p className="text-[15px] text-ls-muted">Ready to cook it? Save a dictation, and the app will turn it into a recipe.</p>
      </div>

      <MoveTo kind="idea" id={idea.id} current={idea.stage} />

      <form action={deleteIdea.bind(null, idea.id)} className="border-t border-ls-border pt-4">
        <ConfirmSubmit variant="danger" message="Delete this idea? This can't be undone.">
          Delete this idea
        </ConfirmSubmit>
      </form>
    </main>
  );
}
