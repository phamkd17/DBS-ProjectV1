import { notFound, redirect } from "next/navigation";
import { deleteDictation } from "@/app/actions";
import { formatDate, Transcript } from "@/components/ui";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { supabaseForUser } from "@/lib/supabase/server";
import type { DictationRow } from "@/lib/types";
import { CreateRecipe } from "./CreateRecipe";

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
    <main className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{d.dish_name || "Untitled dictation"}</h1>
        <p className="text-sm text-stone-600">
          {d.cook_name ? `${d.cook_name} · ` : ""}Saved {formatDate(d.created_at)}
        </p>
      </div>

      <Transcript text={d.transcript} cookName={d.cook_name} open />

      <CreateRecipe dictationId={d.id} />

      <form action={deleteDictation.bind(null, d.id)} className="border-t border-stone-200 pt-4">
        <ConfirmSubmit variant="danger" className="text-sm" message="Delete these words and any recipe made from them? This can't be undone.">
          Delete this dictation
        </ConfirmSubmit>
      </form>
    </main>
  );
}
