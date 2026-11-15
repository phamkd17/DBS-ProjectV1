import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { SignUpButton } from "@clerk/nextjs";
import { supabaseForUser } from "@/lib/supabase/server";
import { Button, ErrorNote, formatDate, LinkButton } from "@/components/ui";
import type { DictationRow, RecipeStatus } from "@/lib/types";

type Row = DictationRow & { recipes: { id: string; status: RecipeStatus; recipe: { title?: string } | null }[] };

// Draft wording: for the student to review.
const TABS = {
  ideas: {
    label: "Ideas",
    blurb: "Words you've saved but haven't turned into a recipe yet.",
    empty: "No ideas waiting. Save a cook's words with “New dictation”, and they'll wait here until you're ready.",
  },
  development: {
    label: "Development",
    blurb: "Recipes you're working out: the app has questions for you.",
    empty: "Nothing in development. Open an idea and tap “Create recipe” to start one.",
  },
  finished: {
    label: "Finished",
    blurb: "Recipes ready to cook and send.",
    empty: "No finished recipes yet. Answer the questions on a recipe in Development to finish it.",
  },
} as const;
type Tab = keyof typeof TABS;

function tabOf(d: Row): Tab {
  const r = d.recipes[0];
  if (!r) return "ideas";
  if (r.status === "ready") return "finished";
  return "development";
}

export default async function Home({ searchParams }: PageProps<"/">) {
  const { userId } = await auth();
  if (!userId) return <Landing />;

  const supabase = await supabaseForUser();
  const [{ tab: tabParam }, { data, error }] = await Promise.all([
    searchParams,
    supabase
      .from("dictations")
      .select("*, recipes(id, status, recipe)")
      .order("created_at", { ascending: false })
      .returns<Row[]>(),
  ]);

  const rows = data ?? [];
  const byTab: Record<Tab, Row[]> = { ideas: [], development: [], finished: [] };
  for (const d of rows) byTab[tabOf(d)].push(d);

  // Explicit ?tab= wins; otherwise open where the work is.
  const tab: Tab =
    typeof tabParam === "string" && tabParam in TABS
      ? (tabParam as Tab)
      : byTab.development.length
        ? "development"
        : byTab.finished.length
          ? "finished"
          : "ideas";

  const items = byTab[tab];

  return (
    <main className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Your lab book</h1>
        <LinkButton href="/new">New dictation</LinkButton>
      </div>

      {error && <ErrorNote>We couldn&apos;t load your lab book. Refresh the page to try again.</ErrorNote>}

      {rows.length === 0 && !error ? (
        <FirstRun />
      ) : (
        <>
          <nav aria-label="Lab book sections" className="-mx-4 overflow-x-auto px-4">
            <ul className="flex gap-1 rounded-xl bg-stone-200/70 p-1">
              {(Object.keys(TABS) as Tab[]).map((t) => {
                const active = t === tab;
                return (
                  <li key={t} className="flex-1">
                    <Link
                      href={`/?tab=${t}`}
                      aria-current={active ? "page" : undefined}
                      className={`flex min-h-11 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-stone-900 ${
                        active
                          ? "bg-white text-stone-900 shadow-sm"
                          : "text-stone-700 hover:bg-white/60 hover:text-stone-900 active:bg-white/80"
                      }`}
                    >
                      {TABS[t].label}
                      <span
                        className={`rounded-full px-1.5 text-xs ${active ? "bg-stone-900 text-white" : "bg-stone-300/80 text-stone-800"}`}
                      >
                        {byTab[t].length}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <p className="text-sm text-stone-600">{TABS[tab].blurb}</p>

          {items.length === 0 ? (
            <p className="rounded-xl bg-white p-5 text-stone-700 ring-1 ring-stone-200">{TABS[tab].empty}</p>
          ) : (
            <ul className="space-y-3">
              {items.map((d) => (
                <EntryCard key={d.id} d={d} />
              ))}
            </ul>
          )}
        </>
      )}
    </main>
  );
}

function EntryCard({ d }: { d: Row }) {
  const r = d.recipes[0];
  const title = r?.recipe?.title || d.dish_name || "Untitled dictation";
  const href = r ? `/r/${r.id}` : `/d/${d.id}`;
  const next = !r ? "Create recipe →" : r.status === "ready" ? null : "Answer questions →";
  return (
    <li>
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
          {next && <span className="shrink-0 text-sm font-medium text-stone-800">{next}</span>}
        </div>
        <p className="mt-2 line-clamp-2 text-sm text-stone-700">{d.transcript}</p>
      </Link>
    </li>
  );
}

function FirstRun() {
  return (
    <div className="space-y-3 rounded-xl bg-white p-6 ring-1 ring-stone-200">
      <h2 className="text-lg font-semibold">Start with one dish</h2>
      <p className="text-stone-700">
        While someone cooks, tap the microphone on the phone keyboard and let them talk through what they&apos;re doing.
        Then paste or dictate it here. The app keeps their words exactly, asks about anything a new cook couldn&apos;t
        figure out, and turns it into a recipe you can send to others.
      </p>
      <LinkButton href="/new">Add your first dictation</LinkButton>
    </div>
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
