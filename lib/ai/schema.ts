import { z } from "zod";

/**
 * Where a piece of the recipe came from. Shown to the user as a label.
 * - cook:         stated in the cook's own words (the transcript)
 * - user_answer:  answered by a person in the app
 * - suggested:    an AI suggestion the user accepted or edited
 * - food_science: an AI-added explanation
 * - not_stated:   nobody knows yet (draft only, or a skipped question)
 */
export const Source = z.enum([
  "cook",
  "user_answer",
  "suggested",
  "food_science",
  "not_stated",
]);
export type Source = z.infer<typeof Source>;

export const Ingredient = z.object({
  item: z.string().describe("Ingredient name, corrected for dictation errors."),
  amount: z
    .string()
    .describe('Amount with unit, e.g. "1/2 gallon". Empty string if not known.'),
  source: Source.describe("Where the amount came from."),
  note: z.string().describe('Short note, e.g. "she added more as they reduced". Empty if none.'),
});

export const Why = z.object({
  source: Source.describe("cook | food_science | suggested | user_answer"),
  text: z.string().describe("The reason, in plain words."),
  quote: z
    .string()
    .describe(
      "Only when source is cook: the exact words copied from the transcript. Otherwise empty."
    ),
});

export const Dial = z.object({
  setting: z.string().describe('The adjustable choice, e.g. "12 hours".'),
  effect: z.string().describe('What it changes, e.g. "super tangy".'),
  source: Source,
});

export const Step = z.object({
  text: z.string().describe("One clear instruction, corrected for dictation errors."),
  why: z.array(Why),
  dials: z.array(Dial),
});

export const Recipe = z.object({
  title: z.string(),
  ingredients: z.array(Ingredient),
  steps: z.array(Step),
  notes: z
    .array(z.string())
    .describe("What the app changed and why: reordered steps, self-corrections, dictation fixes."),
});
export type Recipe = z.infer<typeof Recipe>;

export const QuestionKind = z.enum([
  "amount",
  "ambiguity",
  "missing_step",
  "contradiction",
  "dictation_error",
]);
export type QuestionKind = z.infer<typeof QuestionKind>;

export const Question = z.object({
  kind: QuestionKind,
  quote: z
    .string()
    .describe("The exact words from the transcript this is about. Empty only for a missing step."),
  question: z.string().describe("A short, friendly question a family member can answer."),
  why_it_matters: z.string().describe("One sentence: what goes wrong if this is left unknown."),
  suggestion: z
    .string()
    .describe("A reasonable answer to offer if nobody knows. Specific, with units."),
});
export type Question = z.infer<typeof Question>;

export const Pass1Output = z.object({
  draft: Recipe,
  questions: z.array(Question),
});
export type Pass1Output = z.infer<typeof Pass1Output>;

export const AnswerSource = z.enum([
  "user_answer",
  "suggestion_accepted",
  "suggestion_edited",
  "skipped",
]);
export type AnswerSource = z.infer<typeof AnswerSource>;

export type Answer = {
  question: Question;
  answer: string;
  answer_source: AnswerSource;
};

/** JSON Schema for Gemini structured output. */
export function jsonSchemaFor(schema: z.ZodType) {
  // Gemini rejects the "$schema" meta key, so drop it.
  const { $schema: _drop, ...rest } = z.toJSONSchema(schema, { target: "draft-2020-12" });
  void _drop;
  return rest;
}
