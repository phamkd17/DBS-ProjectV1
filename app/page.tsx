import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { SignUpButton } from "@clerk/nextjs";
import { supabaseForUser } from "@/lib/supabase/server";
import { Button, ErrorNote, eyebrow, focusRing, formatDate, LinkButton } from "@/components/ui";
import { MoveTo } from "@/components/MoveTo";
import { NewMenu } from "@/components/NewMenu";
import type { DictationRow, RecipeStatus } from "@/lib/types";

type Row = DictationRow & { recipes: { id: string; status: RecipeStatus; recipe: { title?: string } | null }[] };


// Draft wording: for the student to review.
const TABS = {
  ideas: {
    label: "Ideas",
    blurb: "Notes, links, and saved words to come back to.",
    empty: "Nothing here yet. Tap “New” to jot down an idea or save a cook's words.",
  },
  development: {
    label: "Development",
    blurb: "Recipes you're working on.",
    empty: "Nothing in development. Move an idea here, or open saved words and tap “Create recipe”.",
  },
  finished: {
    label: "Finished",
    blurb: "Recipes ready to cook and send.",
    empty: "No finished recipes yet. Answer a recipe's questions to finish it, or move something here.",
  },
} as const;
type Tab = keyof typeof TABS;


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
  for (const d of rows) byTab[d.stage].push(d);

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
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-ls-serif text-5xl leading-none">Your lab book</h1>
        <NewMenu />
      </div>

      {error && <ErrorNote>We couldn&apos;t load your lab book. Refresh the page to try again.</ErrorNote>}

      {rows.length === 0 && !error ? (
        <FirstRun />
      ) : (
        <>
          <nav aria-label="Lab book sections" className="border-b border-ls-border">
            <ul className="flex gap-6 sm:gap-8">
              {(Object.keys(TABS) as Tab[]).map((t) => {
                const active = t === tab;
                return (
                  <li key={t}>
                    <Link
                      href={`/?tab=${t}`}
                      aria-current={active ? "page" : undefined}
                      className={`-mb-px inline-flex min-h-11 items-center gap-2 border-b-2 px-1 font-ls-sans text-xs font-medium uppercase tracking-[0.18em] transition-colors duration-150 ${focusRing} ${
                        active
                          ? "border-ls-ink text-ls-ink"
                          : "border-transparent text-ls-muted hover:border-ls-rule hover:text-ls-ink active:border-ls-border"
                      }`}
                    >
                      {TABS[t].label}
                      <span className="tabular-nums text-ls-muted">{byTab[t].length}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <p className="text-[15px] text-ls-muted">{TABS[tab].blurb}</p>

          {items.length === 0 ? (
            <p className="border border-dashed border-ls-border p-6 text-[15px] text-ls-muted">{TABS[tab].empty}</p>
          ) : (
            <ul className="divide-y divide-ls-border border-y border-ls-ink">
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
  const next = r
    ? r.status === "ready"
      ? null
      : "Answer questions"
    : d.stage === "development"
      ? d.transcript
        ? "Create recipe"
        : "Add the cook's words"
      : null;
  const preview = d.notes || d.transcript;
  return (
    <li className="pb-1">
      <Link
        href={href}
        className={`group block px-1 pt-4 pb-1 transition-colors hover:bg-ls-ink/[0.04] active:bg-ls-ink/[0.08] ${focusRing}`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <p className="truncate font-ls-serif text-2xl leading-tight">{title}</p>
            <p className={eyebrow}>
              {d.cook_name ? `${d.cook_name} · ` : ""}
              {formatDate(d.created_at)}
              {d.copied_from ? " · from a link" : ""}
              {d.link ? " · has a link" : ""}
            </p>
          </div>
          {next && (
            <span className="shrink-0 pt-1 text-xs font-medium uppercase tracking-[0.18em] underline decoration-ls-rule underline-offset-4 group-hover:decoration-ls-ink">
              {next}
            </span>
          )}
        </div>
        {preview && <p className="mt-2 line-clamp-2 text-[15px] text-ls-muted">{preview}</p>}
      </Link>
      <div className="px-1">
        <MoveTo kind="dictation" id={d.id} current={d.stage} />
      </div>
    </li>
  );
}

function FirstRun() {
  // Draft wording: for the student to review.
  const cards = [
    {
      id: "start-idea",
      title: "Start with an idea",
      body: "Tasted something you want to make, saw a technique, or found a recipe online? Jot it down with a note and a link. It waits in Ideas until you're ready to develop it into a recipe.",
      href: "/ideas/new",
      cta: "Save an idea",
    },
    {
      id: "start-words",
      title: "Start with the cook's words",
      body: "While someone cooks, tap the microphone on the phone keyboard and let them talk through what they're doing. Then paste or dictate it here. The app asks about anything a new cook couldn't figure out and helps you turn it into a recipe.",
      href: "/new",
      cta: "Add the cook's words",
    },
  ];
  return (
    <section aria-labelledby="first-run" className="space-y-4">
      <h2 id="first-run" className="font-ls-serif text-3xl leading-tight">
        Start with one dish
      </h2>
      <ul className="grid gap-4 sm:grid-cols-2">
        {cards.map((c) => (
          <li key={c.id} aria-labelledby={c.id} className="flex flex-col gap-4 border border-ls-ink bg-ls-surface p-6">
            <h3 id={c.id} className="font-ls-serif text-2xl leading-tight">
              {c.title}
            </h3>
            <p className="flex-1 text-[17px] leading-relaxed">{c.body}</p>
            <LinkButton href={c.href} variant="secondary" className="self-start">
              {c.cta}
            </LinkButton>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Landing() {
  return (
    <main className="space-y-8 py-8">
      <p className={eyebrow}>A lab book for recipe development</p>
      <h1 className="font-ls-serif text-5xl leading-[1.05] sm:text-7xl">
        Turn what cooks say while they cook into recipes others can repeat.
      </h1>
      <p className="max-w-prose text-lg leading-relaxed text-ls-muted">
        Jot down ideas, save what the cook says while they cook, and develop them into recipes. The AI asks what a new
        cook couldn&apos;t know, explains the science behind each step, and keeps track of what came from whom. When
        it&apos;s ready, send it to someone else to cook or save it for future use.
      </p>
      <div className="flex flex-wrap gap-3 border-t border-ls-ink pt-8">
        <SignUpButton mode="modal">
          <Button>Start your lab book</Button>
        </SignUpButton>
      </div>
    </main>
  );
}
