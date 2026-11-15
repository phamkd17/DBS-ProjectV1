import type { Recipe } from "@/lib/ai/schema";
import { eyebrow, SourceBadge, Transcript } from "./ui";

type Props = {
  recipe: Recipe;
  transcript: string;
  cookName?: string | null;
};

/** The finished recipe: ingredients, steps, the why labeled by source, and her words. */
export function RecipeView({ recipe, transcript, cookName }: Props) {
  return (
    <article className="space-y-10">
      <header className="space-y-4">
        <h1 className="font-ls-serif text-5xl leading-none sm:text-6xl">{recipe.title}</h1>
        <Legend cookName={cookName} />
      </header>

      <section aria-labelledby="ingredients" className="space-y-3">
        <h2 id="ingredients" className="font-ls-serif text-3xl leading-tight">
          Ingredients
        </h2>
        <ul className="divide-y divide-ls-border border-y border-ls-ink">
          {recipe.ingredients.map((ing, i) => (
            <li key={i} className="space-y-1.5 py-3">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <p className="text-[17px]">
                  {ing.amount ? <span className="font-medium">{ing.amount} </span> : null}
                  {ing.item}
                  {!ing.amount && <span className="text-ls-muted"> · amount not stated</span>}
                </p>
                <SourceBadge source={ing.source} cookName={cookName} />
              </div>
              {ing.from_answers.map((a, j) => (
                <p key={j} className="flex flex-wrap items-baseline gap-2 text-[15px] text-ls-muted">
                  <SourceBadge source={a.source} /> {a.text}
                </p>
              ))}
              {ing.note && <p className="text-[15px] text-ls-muted">{ing.note}</p>}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="steps" className="space-y-3">
        <h2 id="steps" className="font-ls-serif text-3xl leading-tight">
          Steps
        </h2>
        <ol className="divide-y divide-ls-border border-y border-ls-ink">
          {recipe.steps.map((step, i) => (
            <li key={i} className="flex gap-4 py-5">
              <span aria-hidden className="w-7 shrink-0 font-ls-serif text-3xl leading-none text-ls-muted">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1 space-y-4">
                <p className="text-[17px] leading-relaxed">{step.text}</p>

                {step.from_answers.length > 0 && (
                  <ul className="space-y-1.5">
                    {step.from_answers.map((a, j) => (
                      <li key={j} className="flex flex-wrap items-baseline gap-2 text-[15px] text-ls-muted">
                        <SourceBadge source={a.source} /> {a.text}
                      </li>
                    ))}
                  </ul>
                )}

                {step.dials.length > 0 && (
                  <div className="space-y-1.5">
                    <p className={eyebrow}>Adjust to taste</p>
                    <ul className="divide-y divide-ls-rule/60 border border-ls-border bg-ls-surface">
                      {step.dials.map((d, j) => (
                        <li key={j} className="flex flex-wrap items-baseline gap-x-2 px-3 py-2 text-[15px]">
                          <span className="font-medium">{d.setting}</span>
                          <span aria-hidden className="text-ls-muted">
                            →
                          </span>
                          <span>{d.effect}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {step.why.length > 0 && (
                  <div className="space-y-2 border-l-2 border-ls-ink pl-4">
                    <p className={eyebrow}>Why</p>
                    <ul className="space-y-2.5">
                      {step.why.map((w, j) => (
                        <li key={j} className="space-y-1 text-[15px] leading-relaxed">
                          <SourceBadge source={w.source} cookName={cookName} />
                          <p>
                            {w.source === "cook" && w.quote ? (
                              <q className="font-ls-serif text-lg italic">{w.quote}</q>
                            ) : (
                              w.text
                            )}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>

      {recipe.notes.length > 0 && (
        <section aria-labelledby="changes" className="space-y-3">
          <h2 id="changes" className="font-ls-serif text-3xl leading-tight">
            What the app changed
          </h2>
          <ul className="list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed text-ls-muted marker:text-ls-rule">
            {recipe.notes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </section>
      )}

      <section aria-label="Original dictation">
        <Transcript text={transcript} cookName={cookName} />
      </section>
    </article>
  );
}

/** One line that explains the labels, near the top where they first appear. */
function Legend({ cookName }: { cookName?: string | null }) {
  return (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[15px] text-ls-muted">
      <span>Where each part came from:</span>
      <SourceBadge source="cook" cookName={cookName} />
      <SourceBadge source="user_answer" />
      <SourceBadge source="suggested" />
      <SourceBadge source="food_science" />
    </p>
  );
}
