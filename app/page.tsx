import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { SignUpButton } from "@clerk/nextjs";
import { supabaseForUser } from "@/lib/supabase/server";
import { Button, ErrorNote, formatDate, LinkButton } from "@/components/ui";
import type { DictationRow, RecipeStatus } from "@/lib/types";

type Row = DictationRow & { recipes: { id: string; status: RecipeStatus; recipe: { title?: string } | null }[] };

const STATUS: Record<RecipeStatus | "none", { label: string; style: string }> = {
  none: { label: "Words saved", style: "bg-stone-100 text-stone-800" },
  needs_answers: { label: "Has questions", style: "bg-amber-100 text-amber-950" },
  ready: { label: "Recipe ready", style: "bg-emerald-100 text-emerald-950" },
  failed: { label: "Try again", style: "bg-red-100 text-red-900" },
};

export default async function Home() {
  const { userId } = await auth();
  if (!userId) return <Landing />;

  const supabase = await supabaseForUser();
  const { data, error } = await supabase
    .from("dictations")
    .select("*, recipes(id, status, recipe)")
    .order("created_at", { ascending: false })
    .returns<Row[]>();

  return (
    <main className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Your lab book</h1>
        <LinkButton href="/new">New dictation</LinkButton>
      </div>

      {error && <ErrorNote>We couldn&apos;t load your lab book. Refresh the page to try again.</ErrorNote>}

      {data && data.length === 0 && (
        <div className="space-y-3 rounded-xl bg-white p-6 ring-1 ring-stone-200">
          <h2 className="text-lg font-semibold">Start with one dish</h2>
          <p className="text-stone-700">
            While someone cooks, tap the microphone on the phone keyboard and let them talk through what they&apos;re
            doing. Then paste or dictate it here. The app keeps their words exactly, asks about anything a new cook
            couldn&apos;t figure out, and turns it into a recipe you can send to others.
          </p>
          <LinkButton href="/new">Add your first dictation</LinkButton>
        </div>
      )}

      {data && data.length > 0 && (
        <ul className="space-y-3">
          {data.map((d) => {
            const r = d.recipes[0];
            const status = STATUS[r?.status ?? "none"];
            const title = r?.recipe?.title || d.dish_name || "Untitled dictation";
            const href = r ? `/r/${r.id}` : `/d/${d.id}`;
            return (
              <li key={d.id}>
                <Link
                  href={href}
                  className="block rounded-xl bg-white p-4 ring-1 ring-stone-200 hover:ring-stone-400 focus-visible:outline-2 focus-visible:outline-stone-900 active:bg-stone-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{title}</p>
                      <p className="text-sm text-stone-600">
                        {d.cook_name ? `${d.cook_name} · ` : ""}
                        {formatDate(d.created_at)}
                        {d.copied_from ? " · saved from a link" : ""}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${status.style}`}>
                      {status.label}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-stone-700">{d.transcript}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}

function Landing() {
  return (
    <main className="space-y-6 py-6">
      <h1 className="text-3xl font-semibold leading-tight tracking-tight">
        Turn what cooks say while they cook into recipes others can repeat.
      </h1>
      <p className="text-lg text-stone-700">
        Paste a cook&apos;s dictation. Culinary Lab Book keeps their words exactly, asks what a new cook couldn&apos;t
        know, labels every reason by who said it, and lets you send the recipe to someone else.
      </p>
      <div className="flex flex-wrap gap-3">
        <SignUpButton mode="modal">
          <Button>Start your lab book</Button>
        </SignUpButton>
      </div>
    </main>
  );
}
