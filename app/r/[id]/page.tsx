import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { RecipeView } from "@/components/RecipeView";
import { SourceBadge, Transcript } from "@/components/ui";
import { supabaseForUser } from "@/lib/supabase/server";
import type { DictationRow, QuestionRow, RecipeRow } from "@/lib/types";
import { QuestionsForm } from "./QuestionsForm";
import { SharePanel } from "./SharePanel";

// Pass 2 can take a while on the free tier.
export const maxDuration = 300;

export default async function RecipePage({ params }: PageProps<"/r/[id]">) {
  const { id } = await params;
  const supabase = await supabaseForUser();

  // RLS: each of these returns nothing unless the rows are yours.
  const { data: recipe } = await supabase.from("recipes").select("*").eq("id", id).maybeSingle<RecipeRow>();
  if (!recipe) notFound();
  const [{ data: dictation }, { data: questions }] = await Promise.all([
    supabase.from("dictations").select("*").eq("id", recipe.dictation_id).single<DictationRow>(),
    supabase.from("recipe_questions").select("*").eq("recipe_id", id).order("position").returns<QuestionRow[]>(),
  ]);
  if (!dictation) notFound();

  if (recipe.status !== "ready" || !recipe.recipe) {
    return (
      <main className="space-y-6">
        <div className="space-y-2">
          <p className="text-sm text-stone-600">
            <Link href="/?tab=development" className="underline underline-offset-4 hover:text-stone-900">
              Development
            </Link>{" "}
            / {dictation.dish_name || recipe.draft?.title || "Recipe"}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">A few questions first</h1>
          <p className="text-stone-700">
            These are things a new cook couldn&apos;t figure out from {dictation.cook_name ? `${dictation.cook_name}'s` : "the"}{" "}
            words. Answer what you know.
          </p>
        </div>
        <Transcript text={dictation.transcript} cookName={dictation.cook_name} />
        <QuestionsForm recipeId={recipe.id} questions={questions ?? []} cookName={dictation.cook_name} />
      </main>
    );
  }

  const answered = (questions ?? []).filter((q) => q.answer_source);
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const shareUrl = recipe.share_token ? `${origin}/s/${recipe.share_token}` : null;

  return (
    <main className="space-y-8">
      <p className="text-sm text-stone-600">
        <Link href="/?tab=finished" className="underline underline-offset-4 hover:text-stone-900">
          Finished
        </Link>{" "}
        / {recipe.recipe.title}
        {recipe.copied_from ? " · saved from a link" : ""}
      </p>

      <RecipeView recipe={recipe.recipe} transcript={dictation.transcript} cookName={dictation.cook_name} />

      {answered.length > 0 && (
        <details className="rounded-xl bg-white ring-1 ring-stone-200">
          <summary className="flex min-h-11 cursor-pointer items-center px-4 py-3 font-medium hover:bg-stone-50 focus-visible:outline-2 focus-visible:outline-stone-900">
            Questions the app asked ({answered.length})
          </summary>
          <ol className="space-y-3 px-4 pb-4">
            {answered.map((q) => (
              <li key={q.id} className="space-y-1 text-sm">
                <p className="font-medium">{q.question}</p>
                {q.answer_source === "skipped" ? (
                  <p className="flex items-baseline gap-2 text-stone-600">
                    <SourceBadge source="not_stated" /> Nobody knew yet
                  </p>
                ) : (
                  <p className="flex items-baseline gap-2">
                    <SourceBadge source={q.answer_source === "user_answer" ? "user_answer" : "suggested"} /> {q.answer}
                  </p>
                )}
              </li>
            ))}
          </ol>
        </details>
      )}

      <SharePanel recipeId={recipe.id} url={shareUrl} title={recipe.recipe.title} />

      <p className="text-xs text-stone-500">
        Made with {recipe.model} · prompt {recipe.prompt_version}
      </p>
    </main>
  );
}
