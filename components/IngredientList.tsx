import type { Recipe } from "@/lib/ai/schema";
import { SourceBadge } from "./ui";

/** Read-only ingredient rows. Used on shared pages and in the editor's view mode. */
export function IngredientList({ ingredients, cookName }: { ingredients: Recipe["ingredients"]; cookName?: string | null }) {
  return (
    <ul className="divide-y divide-ls-border border-y border-ls-ink">
      {ingredients.map((ing, i) => (
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
  );
}
