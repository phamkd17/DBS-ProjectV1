import type { Recipe } from "@/lib/ai/schema";
import { SourceBadge, Transcript } from "./ui";

type Props = {
  recipe: Recipe;
  transcript: string;
  cookName?: string | null;
};

/** The finished recipe: ingredients, steps, the why labeled by source, and her words. */
export function RecipeView({ recipe, transcript, cookName }: Props) {
  return (
    <article className="space-y-8">
      <h1 className="text-3xl font-semibold tracking-tight">{recipe.title}</h1>

      <section aria-labelledby="ingredients" className="space-y-3">
        <h2 id="ingredients" className="text-xl font-semibold">Ingredients</h2>
        <ul className="divide-y divide-stone-200 rounded-xl bg-white ring-1 ring-stone-200">
          {recipe.ingredients.map((ing, i) => (
            <li key={i} className="space-y-1.5 px-4 py-3">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <p>
                  {ing.amount ? <span className="font-semibold">{ing.amount} </span> : null}
                  {ing.item}
                  {!ing.amount && <span className="text-stone-600"> (amount not stated)</span>}
                </p>
                <SourceBadge source={ing.source} cookName={cookName} />
              </div>
              {ing.from_answers.map((a, j) => (
                <p key={j} className="flex items-baseline gap-2 text-sm text-stone-700">
                  <SourceBadge source={a.source} /> {a.text}
                </p>
              ))}
              {ing.note && <p className="text-sm text-stone-600">{ing.note}</p>}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="steps" className="space-y-3">
        <h2 id="steps" className="text-xl font-semibold">Steps</h2>
        <ol className="space-y-4">
          {recipe.steps.map((step, i) => (
            <li key={i} className="rounded-xl bg-white p-4 ring-1 ring-stone-200">
              <div className="flex gap-3">
                <span
                  aria-hidden
                  className="flex size-7 shrink-0 items-center justify-center rounded-full bg-stone-900 text-sm font-semibold text-white"
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1 space-y-3">
                  <p className="text-[17px] leading-relaxed">{step.text}</p>

                  {step.from_answers.length > 0 && (
                    <ul className="space-y-1.5">
                      {step.from_answers.map((a, j) => (
                        <li key={j} className="flex items-baseline gap-2 text-sm text-stone-700">
                          <SourceBadge source={a.source} /> {a.text}
                        </li>
                      ))}
                    </ul>
                  )}

                  {step.dials.length > 0 && (
                    <div className="rounded-lg bg-stone-50 p-3">
                      <p className="mb-1.5 text-sm font-medium text-stone-700">Adjust to taste</p>
                      <ul className="space-y-1 text-sm">
                        {step.dials.map((d, j) => (
                          <li key={j} className="flex flex-wrap items-baseline gap-x-2">
                            <span className="font-medium">{d.setting}</span>
                            <span aria-hidden>→</span>
                            <span>{d.effect}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {step.why.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-stone-700">Why</p>
                      <ul className="space-y-2">
                        {step.why.map((w, j) => (
                          <li key={j} className="flex flex-col gap-1 text-sm sm:flex-row sm:items-baseline sm:gap-2">
                            <SourceBadge source={w.source} cookName={cookName} />
                            <span>
                              {w.source === "cook" && w.quote ? (
                                <q className="italic">{w.quote}</q>
                              ) : (
                                w.text
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {recipe.notes.length > 0 && (
        <section aria-labelledby="changes" className="space-y-2">
          <h2 id="changes" className="text-xl font-semibold">What the app changed from her words</h2>
          <ul className="list-disc space-y-1 pl-5 text-stone-700">
            {recipe.notes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </section>
      )}

      <section aria-label="Original dictation">
        <Transcript text={transcript} cookName={cookName} />
      </section>

      <p className="text-sm text-stone-600">
        Labels show where each part came from:{" "}
        <SourceBadge source="cook" cookName={cookName} /> said it,{" "}
        <SourceBadge source="user_answer" /> answered a question,{" "}
        <SourceBadge source="suggested" /> is an AI suggestion someone accepted, and{" "}
        <SourceBadge source="food_science" /> is an AI explanation.
      </p>
    </article>
  );
}
