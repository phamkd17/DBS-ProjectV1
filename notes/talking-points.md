# Talking points: what we did and why

> Draft notes, written by the agent as we go, for you to speak from in class
> (Nov 17) and at the fair (Dec 1). Put them in your own words before you
> present. The decisions are logged in `notes/build-log.md`.
>
> The course asks you to be ready to explain: **tracing a request, where
> identity and access are decided, where API calls happen and why, what the
> failing test looked like, and what you stopped the agent from doing.** Each
> section below points to one of those.

---

## 1. What v1 does (the core task)

A cook's dictation goes in → the app asks what it can't know → you answer or
accept a suggestion → you get a recipe page with her words, the recipe, and the
why labeled by source → you can send it by link, and the person who opens it
saves a copy to their own lab book.

**Why this is the smallest complete version:** it covers capture → recipe →
sharing, the full journey from the one-liner ("…recipes that can be shared for
others to repeat"). Everything else (dials UI, five tastes, photos, lab book of
trials) builds on top, and the recipe format already has room for it.

## 2. A scope change since the proposal

- **Proposal:** one family, built on Clerk Organizations.
- **v1:** everyone gets their own **private lab book** and can **send** a
  recipe by link. *"I want this to be an app where people can send recipe to
  each other. Or have a labbook of their own."*
- **Why a link instead of email:** simplest, works for someone using it alone,
  nothing to look up. **Tradeoff:** anyone with the link can read that one
  recipe until the owner turns the link off.

## 3. Riskiest part first: the AI pipeline (my focus area)

We built and tested the AI **before any screens**, following the brief: *"make
sure the most challenging part works first."*

**Two passes** (`lib/ai/pipeline.ts`):
1. **Pass 1:** transcript → draft recipe + **questions** (amount, dictation
   error, missing step, contradiction, ambiguity), each with a suggestion.
2. **Pass 2:** draft + answers → final recipe. Every amount and every why is
   labeled `cook`, `user_answer`, `suggested`, or `food_science`.

**Structured output:** the recipe format is defined once with Zod
(`lib/ai/schema.ts`), sent to Gemini as a JSON Schema, and every response is
checked against it. A bad response becomes an error state instead of a broken
page.

**Errors are designed:** a 429 (free-tier rate limit) is retried twice with a
wait, then shown as *"The recipe helper is busy right now. Try again in a
minute."*

**Prompt versioning:** `PROMPT_VERSION` is saved with every eval run, so prompt
changes can be compared.

## 4. Evals: how I know the AI works

`npm run eval` runs Grandma's 3 real dictations through the pipeline and scores
deterministic checks (`evals/run.ts`).

- **Must-pass (yogurt):** it asks about the "10 in" container (it's Dannon), and
  it flags the **missing cooling step** (she cools the milk but left it out).
- **Honesty checks on every recipe:**
  - Every reason labeled as the cook's has to **quote the transcript exactly**,
    so the AI can't put words in her mouth.
  - Every amount labeled as hers can only use numbers she actually said.
- **Pass 2 uses scripted answers** (our confirmed facts: plain Dannon, she cools
  the milk) and accepts the suggestion for everything else. Then it checks that
  accepted suggestions stay labeled **Suggested**.
- **Not teaching to the test:** the eval answers are kept *out* of the prompt.
  If the prompt said "10 in means Dannon," the eval would pass without measuring
  anything.

*(Results will go here after the first run: score, what failed, what we
changed.)*

## 5. Keys and safety (what I stopped the agent from doing)

- Before any key existed, we added a **deny rule** in `.claude/settings.json`
  that blocks the agent from reading `.env` files.
- **It worked:** when the agent tried to create `.env.local` itself, the
  command was **denied**, so I created the file and pasted the keys myself.
  The agent has never seen a key.
- `.env.local` is git-ignored. `.env.example` lists only the variable names.
- The Gemini key is used **only in server code**, never sent to the browser.
- Gemini free tier with **no billing attached**, so it can't be charged.

## 6. Process evidence

- Small commits after each step, pushed to GitHub.
- Decisions logged with my answers quoted in `notes/build-log.md`.

---

## Coming next (sections to fill in as we build)

- **Tracing a request:** phone → Next.js server route → Supabase (RLS) / Gemini → page
- **Where identity and access are decided:** Clerk session → Supabase RLS policies
- **Where API calls happen and why:** server-only, so the key never reaches the phone
- **Testing with real users:** who, what they did, where they got stuck
- **Plan for v2**
