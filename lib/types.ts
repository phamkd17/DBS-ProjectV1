import type { AnswerSource, Question, QuestionKind, Recipe } from "./ai/schema";

export const STAGES = ["ideas", "development", "finished"] as const;
export type Stage = (typeof STAGES)[number];
export const STAGE_LABEL: Record<Stage, string> = {
  ideas: "Ideas",
  development: "Development",
  finished: "Finished",
};
export function isStage(v: unknown): v is Stage {
  return typeof v === "string" && (STAGES as readonly string[]).includes(v);
}

export type IdeaRow = {
  id: string;
  owner_id: string;
  title: string;
  note: string;
  link: string | null;
  stage: Stage;
  created_at: string;
  updated_at: string;
};

export type DictationRow = {
  id: string;
  owner_id: string;
  stage: Stage;
  dish_name: string | null;
  cook_name: string | null;
  transcript: string;
  copied_from: string | null;
  created_at: string;
};

export type RecipeStatus = "needs_answers" | "ready" | "failed";

export type RecipeRow = {
  id: string;
  owner_id: string;
  dictation_id: string;
  status: RecipeStatus;
  draft: (Recipe & { scan?: unknown }) | null;
  recipe: Recipe | null;
  model: string | null;
  prompt_version: string | null;
  share_token: string | null;
  copied_from: string | null;
  created_at: string;
};

export type QuestionRow = {
  id: string;
  recipe_id: string;
  position: number;
  kind: QuestionKind;
  quote: string;
  question: string;
  why_it_matters: string;
  suggestion: string;
  answer: string | null;
  answer_source: AnswerSource | null;
  answered_at: string | null;
};

export function toQuestion(q: QuestionRow): Question {
  return {
    kind: q.kind,
    quote: q.quote,
    question: q.question,
    why_it_matters: q.why_it_matters,
    suggestion: q.suggestion,
  };
}

/** Result shape for server actions used with useActionState. */
export type ActionState = {
  error?: string;
  saved?: boolean;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
};
