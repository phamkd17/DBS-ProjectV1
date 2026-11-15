import { notFound, redirect } from "next/navigation";
import { deleteDictation } from "@/app/actions";
import { DictationEditor } from "@/components/DictationEditor";
import { eyebrow, textLink } from "@/components/ui";
import Link from "next/link";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { supabaseForUser } from "@/lib/supabase/server";
import type { DictationRow } from "@/lib/types";
import { CreateRecipe } from "./CreateRecipe";
import { StartDeveloping } from "@/components/StartDeveloping";
import { MoveTo } from "@/components/MoveTo";
import { STAGE_LABEL } from "@/lib/types";

// Gemini can take a while on the free tier.
export const maxDuration = 300;

export default async function DictationPage({ params }: PageProps<"/d/[id]">) {
  const { id } = await params;
  const supabase = await supabaseForUser();

  // RLS: returns nothing unless this dictation is yours.
  const { data: d } = await supabase.from("dictations").select("*").eq("id", id).maybeSingle<DictationRow>();
  if (!d) notFound();

  const { data: recipe } = await supabase
    .from("recipes")
    .select("id")
    .eq("dictation_id", id)
    .neq("status", "failed")
    .limit(1)
    .maybeSingle();
  if (recipe) redirect(`/r/${recipe.id}`);

  return (
    <main className="space-y-8">
      <div className="space-y-3">
        <p className={eyebrow}>
          <Link href={`/?tab=${d.stage}`} className={textLink}>
            {STAGE_LABEL[d.stage]}
          </Link>
        </p>
        <DictationEditor dictation={d} withHeading open>
          {/* The AI recipe step only appears in Development. */}
          {d.stage === "development" ? <CreateRecipe dictationId={d.id} /> : <StartDeveloping dictationId={d.id} />}
        </DictationEditor>
      </div>

      <MoveTo kind="dictation" id={d.id} current={d.stage} hide={d.stage === "development" ? [] : ["development"]} />

      <form action={deleteDictation.bind(null, d.id)} className="border-t border-ls-border pt-4">
        <ConfirmSubmit variant="danger" message="Delete these words and any recipe made from them? This can't be undone.">
          Delete this dictation
        </ConfirmSubmit>
      </form>
    </main>
  );
}
