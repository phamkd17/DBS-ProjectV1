import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteIdea } from "@/app/actions";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { IdeaForm } from "@/components/IdeaForm";
import { MoveTo } from "@/components/MoveTo";
import { eyebrow, focusRing, formatDate, LinkButton, textLink } from "@/components/ui";
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
        <h1 className="font-ls-serif text-5xl leading-none">{idea.title}</h1>
        <p className={eyebrow}>Saved {formatDate(idea.created_at)}</p>
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

      <div className="space-y-3">
        <LinkButton href={`/new?dish=${encodeURIComponent(idea.title)}`}>Add the cook&apos;s words</LinkButton>
        <p className="text-[15px] text-ls-muted">Ready to cook it? Save a dictation, and the app will turn it into a recipe.</p>
      </div>

      <MoveTo kind="idea" id={idea.id} current={idea.stage} />

      <details className="border border-ls-border bg-ls-surface">
        <summary
          className={`flex min-h-11 cursor-pointer items-center px-4 py-3 text-[15px] hover:bg-ls-ink/[0.04] active:bg-ls-ink/[0.08] ${focusRing}`}
        >
          Edit idea
        </summary>
        <div className="border-t border-ls-border p-4">
          <IdeaForm idea={idea} />
        </div>
      </details>

      <form action={deleteIdea.bind(null, idea.id)} className="border-t border-ls-border pt-4">
        <ConfirmSubmit variant="danger" message="Delete this idea? This can't be undone.">
          Delete this idea
        </ConfirmSubmit>
      </form>
    </main>
  );
}
