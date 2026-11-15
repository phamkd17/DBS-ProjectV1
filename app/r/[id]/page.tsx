import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { deleteDictation } from "@/app/actions";
import { ConfirmSubmit } from "@/components/ConfirmSubmit";
import { RecipeView } from "@/components/RecipeView";
import { eyebrow, focusRing, SourceBadge, textLink, Transcript } from "@/components/ui";
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
      <main className="space-y-8">
        <div className="space-y-3">
          <p className={eyebrow}>
            <Link href="/?tab=development" className={textLink}>
              Development
            </Link>{" "}
            / {dictation.dish_name || recipe.draft?.title || "Recipe"}
          </p>
          <h1 className="font-ls-serif text-5xl leading-none">A few questions first</h1>
          <p className="max-w-prose text-[17px] leading-relaxed text-ls-muted">
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
    <main className="space-y-10">
      <p className={eyebrow}>
        <Link href="/?tab=finished" className={textLink}>
          Finished
        </Link>{" "}
        / {recipe.recipe.title}
        {recipe.copied_from ? " · saved from a link" : ""}
      </p>

      <RecipeView recipe={recipe.recipe} transcript={dictation.transcript} cookName={dictation.cook_name} />

      {answered.length > 0 && (
        <details className="border border-ls-border bg-ls-surface">
          <summary className={`flex min-h-11 cursor-pointer items-center px-4 py-3 text-[15px] hover:bg-ls-ink/[0.04] active:bg-ls-ink/[0.08] ${focusRing}`}>
            Questions the app asked ({answered.length})
          </summary>
          <ol className="divide-y divide-ls-border border-t border-ls-border px-4">
            {answered.map((q) => (
              <li key={q.id} className="space-y-1.5 py-3 text-[15px]">
                <p className="font-medium">{q.question}</p>
                {q.answer_source === "skipped" ? (
                  <p className="flex flex-wrap items-baseline gap-2 text-ls-muted">
                    <SourceBadge source="not_stated" /> Nobody knew yet
                  </p>
                ) : (
                  <p className="flex flex-wrap items-baseline gap-2">
                    <SourceBadge source={q.answer_source === "user_answer" ? "user_answer" : "suggested"} /> {q.answer}
                  </p>
                )}
              </li>
            ))}
          </ol>
          <p className={`border-t border-ls-border px-4 py-3 ${eyebrow}`}>
            Made with {recipe.model} · prompt {recipe.prompt_version}
          </p>
        </details>
      )}

      <SharePanel recipeId={recipe.id} url={shareUrl} title={recipe.recipe.title} />

      <form action={deleteDictation.bind(null, dictation.id)} className="border-t border-ls-border pt-4">
        <ConfirmSubmit
          variant="danger"
          message="Delete this recipe and the words it came from? Links you've sent will stop working. This can't be undone."
        >
          Delete this recipe
        </ConfirmSubmit>
      </form>

    </main>
  );
}
