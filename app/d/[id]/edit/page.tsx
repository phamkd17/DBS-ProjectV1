import Link from "next/link";
import { notFound } from "next/navigation";
import { NewDictationForm } from "@/app/new/NewDictationForm";
import { eyebrow, textLink } from "@/components/ui";
import { supabaseForUser } from "@/lib/supabase/server";
import type { DictationRow } from "@/lib/types";

export default async function EditDictationPage({ params }: PageProps<"/d/[id]/edit">) {
  const { id } = await params;
  const supabase = await supabaseForUser();
  const { data: d } = await supabase.from("dictations").select("*").eq("id", id).maybeSingle<DictationRow>();
  if (!d) notFound();
  const { data: recipe } = await supabase
    .from("recipes")
    .select("id")
    .eq("dictation_id", id)
    .neq("status", "failed")
    .limit(1)
    .maybeSingle();
  const backHref = recipe ? `/r/${recipe.id}` : `/d/${d.id}`;

  return (
    <main className="space-y-8">
      <div className="space-y-3">
        <p className={eyebrow}>
          <Link href={backHref} className={textLink}>
            Back
          </Link>
        </p>
        <h1 className="font-ls-serif text-5xl leading-none">Edit their words</h1>
        <p className="max-w-prose text-[17px] leading-relaxed text-ls-muted">
          {recipe
            ? "There's already a recipe made from these words. It won't change by itself, and it will be marked as made before your edit."
            : "Fix a dictation mistake or add what was missing."}{" "}
          The first version is always kept, so you can see the original later.
        </p>
      </div>
      <NewDictationForm dictation={d} backHref={backHref} />
    </main>
  );
}
