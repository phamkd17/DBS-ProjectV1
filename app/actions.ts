"use server";

/**
 * Every write in the app goes through here. Each action:
 *  1. requires a signed-in Clerk user,
 *  2. talks to Supabase *as that user* (so RLS decides access), and
 *  3. calls Gemini only from the server (the key never reaches the phone).
 */
import { randomUUID } from "node:crypto";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { draftRecipe, finalizeRecipe, ModelError, RateLimitError } from "@/lib/ai/pipeline";
import type { Answer, AnswerSource } from "@/lib/ai/schema";
import { supabaseForUser } from "@/lib/supabase/server";
import { toQuestion, type ActionState, type DictationRow, type QuestionRow, type RecipeRow } from "@/lib/types";

const MAX_TRANSCRIPT = 20000;

async function requireUser() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  return userId;
}

function friendlyModelError(err: unknown): string {
  if (err instanceof RateLimitError) return err.message;
  if (err instanceof ModelError) {
    console.error("[model]", err.message, err.detail ?? "");
    return "The recipe helper couldn't finish. Your words are saved. Try again in a minute.";
  }
  console.error("[unexpected]", err);
  return "Something went wrong. Your words are saved. Try again.";
}

// ---------------------------------------------------------------------------
// 1. Capture: save the dictation verbatim. Asks nothing else.
// ---------------------------------------------------------------------------
export async function createDictation(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  // Keep her words exactly as typed: no trimming inside, no "cleanup".
  const transcript = String(formData.get("transcript") ?? "");
  const dish_name = String(formData.get("dish_name") ?? "").trim().slice(0, 120) || null;
  const cook_name = String(formData.get("cook_name") ?? "").trim().slice(0, 60) || null;
  const values = { transcript, dish_name: dish_name ?? "", cook_name: cook_name ?? "" };

  if (!transcript.trim()) {
    return { values, fieldErrors: { transcript: "Paste or dictate the cook's words here first." } };
  }
  if (transcript.length > MAX_TRANSCRIPT) {
    return {
      values,
      fieldErrors: { transcript: `That's too long for one recipe (${transcript.length} of ${MAX_TRANSCRIPT} characters). Split it into two.` },
    };
  }

  const supabase = await supabaseForUser();
  const { data, error } = await supabase
    .from("dictations")
    .insert({ transcript, dish_name, cook_name })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[createDictation]", error);
    return { values, error: "Couldn't save just now. Your words are still here. Try again." };
  }
  revalidatePath("/");
  redirect(`/d/${data.id}`);
}

// ---------------------------------------------------------------------------
// 2. Create recipe: pass 1 (draft + questions).
// ---------------------------------------------------------------------------
export async function createRecipe(dictationId: string, _prev: ActionState): Promise<ActionState> {
  await requireUser();
  const supabase = await supabaseForUser();

  // RLS: this returns nothing unless the dictation is yours.
  const { data: dictation } = await supabase
    .from("dictations")
    .select("*")
    .eq("id", dictationId)
    .single<DictationRow>();
  if (!dictation) return { error: "We couldn't find that dictation in your lab book." };

  // Don't make a second recipe if one exists (e.g. a double tap).
  const { data: existing } = await supabase
    .from("recipes")
    .select("id")
    .eq("dictation_id", dictationId)
    .neq("status", "failed")
    .limit(1)
    .maybeSingle();
  if (existing) redirect(`/r/${existing.id}`);

  let result;
  try {
    result = await draftRecipe(dictation.transcript, dictation.dish_name ?? undefined);
  } catch (err) {
    return { error: friendlyModelError(err) };
  }

  const { data: recipe, error } = await supabase
    .from("recipes")
    .insert({
      dictation_id: dictationId,
      status: "needs_answers",
      draft: { ...result.draft, scan: result.scan },
      model: result.model,
      prompt_version: result.prompt_version,
    })
    .select("id")
    .single();
  if (error || !recipe) {
    console.error("[createRecipe]", error);
    return { error: "Couldn't save the draft. Try again." };
  }

  if (result.questions.length) {
    const { error: qErr } = await supabase.from("recipe_questions").insert(
      result.questions.map((q, i) => ({ ...q, recipe_id: recipe.id, position: i }))
    );
    if (qErr) console.error("[createRecipe questions]", qErr);
  }

  revalidatePath("/");
  redirect(`/r/${recipe.id}`);
}

// ---------------------------------------------------------------------------
// 3. Answer questions → pass 2 (final recipe).
// ---------------------------------------------------------------------------
function answerSourceFor(mode: string, text: string, suggestion: string): AnswerSource {
  if (!text.trim()) return "skipped";
  if (mode === "suggestion") return text.trim() === suggestion.trim() ? "suggestion_accepted" : "suggestion_edited";
  return "user_answer";
}

export async function submitAnswers(recipeId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const userId = await requireUser();
  const supabase = await supabaseForUser();

  const { data: recipe } = await supabase.from("recipes").select("*").eq("id", recipeId).single<RecipeRow>();
  if (!recipe || !recipe.draft) return { error: "We couldn't find that recipe in your lab book." };

  const { data: dictation } = await supabase
    .from("dictations")
    .select("transcript")
    .eq("id", recipe.dictation_id)
    .single<Pick<DictationRow, "transcript">>();
  const { data: questions } = await supabase
    .from("recipe_questions")
    .select("*")
    .eq("recipe_id", recipeId)
    .order("position")
    .returns<QuestionRow[]>();
  if (!dictation || !questions) return { error: "Couldn't load the questions. Try again." };

  const values: Record<string, string> = {};
  const answers: Answer[] = [];
  const now = new Date().toISOString();

  for (const q of questions) {
    const text = String(formData.get(`answer_${q.id}`) ?? "").slice(0, 2000);
    const mode = String(formData.get(`mode_${q.id}`) ?? "own");
    values[`answer_${q.id}`] = text;
    values[`mode_${q.id}`] = mode;
    const answer_source = answerSourceFor(mode, text, q.suggestion);
    answers.push({ question: toQuestion(q), answer: text.trim(), answer_source });

    const { error } = await supabase
      .from("recipe_questions")
      .update({ answer: text.trim() || null, answer_source, answered_at: now })
      .eq("id", q.id);
    if (error) console.error("[submitAnswers save]", error);
  }

  let final;
  try {
    const { scan: _scan, ...draft } = recipe.draft;
    void _scan;
    final = await finalizeRecipe(dictation.transcript, draft, answers);
  } catch (err) {
    return { values, error: friendlyModelError(err) };
  }

  const { error } = await supabase
    .from("recipes")
    .update({
      status: "ready",
      recipe: final.recipe,
      model: final.model,
      prompt_version: final.prompt_version,
      updated_at: now,
    })
    .eq("id", recipeId);
  if (error) {
    console.error("[submitAnswers finalize]", error, userId);
    return { values, error: "Couldn't save the recipe. Your answers are saved. Try again." };
  }

  revalidatePath(`/r/${recipeId}`);
  revalidatePath("/");
  redirect(`/r/${recipeId}`);
}

// ---------------------------------------------------------------------------
// 4. Send: turn a private link on or off.
// ---------------------------------------------------------------------------
export async function setSharing(recipeId: string, on: boolean): Promise<void> {
  await requireUser();
  const supabase = await supabaseForUser();
  const { error } = await supabase
    .from("recipes")
    .update({ share_token: on ? randomUUID() : null })
    .eq("id", recipeId)
    .eq("status", "ready");
  if (error) console.error("[setSharing]", error);
  revalidatePath(`/r/${recipeId}`);
}

// ---------------------------------------------------------------------------
// 5. Receive: save a copy of a shared recipe into your own lab book.
// ---------------------------------------------------------------------------
export async function saveSharedCopy(token: string, _prev: ActionState): Promise<ActionState> {
  const { userId } = await auth();
  if (!userId) redirect(`/sign-in?redirect_url=${encodeURIComponent(`/s/${token}`)}`);
  const supabase = await supabaseForUser();
  const { data, error } = await supabase.rpc("save_shared_recipe", { token });
  if (error || !data) {
    console.error("[saveSharedCopy]", error);
    return { error: "This link isn't shared anymore, or something went wrong. Ask for a new link." };
  }
  revalidatePath("/");
  redirect(`/r/${data}`);
}

// ---------------------------------------------------------------------------
// Delete a dictation (and its recipe) from your lab book.
// ---------------------------------------------------------------------------
export async function deleteDictation(dictationId: string): Promise<void> {
  await requireUser();
  const supabase = await supabaseForUser();
  const { error } = await supabase.from("dictations").delete().eq("id", dictationId);
  if (error) console.error("[deleteDictation]", error);
  revalidatePath("/");
  redirect("/");
}
