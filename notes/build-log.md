# Build log — Culinary Lab Book v1

Picks up from the proposal's decision log (`notes/process.md` in
`phamkd17/DBS-project_proposal`). Each entry has the decision, the student's
answer (quoted), and why.

---

## Nov 13 — Setup and scope

### B1. Where the build lives
- **Decision:** its own repo, `phamkd17/DBS-ProjectV1` (created by the student).

### B2. Core task for v1
- **Draft (agent):** paste a dictation → the app asks what it can't know →
  answer, or accept/edit a suggestion → recipe page (her words · recipe ·
  labeled why) that someone else can open and cook from.
- **Kept:** sign-in, verbatim capture, two Gemini passes, recipe page with
  source labels, sharing, eval script on the 3 real dictations.
- **Left out of v1:** dials UI and the five tastes (dials still appear as text),
  photos, function-calling tools, lab book of trials, Playwright test.

### B3. Who it's for, and how sharing works
- **Student:** "I want this to be an app where people can send recipe to each
  other. Or have a labbook of their own. It could be multi-user or single user."
- **Decision:** every user gets a private lab book. This replaces the proposal's
  PROPOSED "Clerk Organizations = families."
- **Options offered:** (1) link → save a copy, (2) send by email to an inbox,
  (3) both.
- **Student chose:** "Link → save a copy."
- **Why:** simplest to build, works for solo users, nothing to look up. Tradeoff
  accepted: anyone with the link can read that one recipe until the owner turns
  the link off.

### B4. Accounts
- Clerk app, Supabase project, and Vercel ↔ GitHub: already set up.
- Gemini key: still to create (AI Studio).

### B5. Safety before keys
- `.claude/settings.json` denies agent reads of `.env` / `.env.*`.
- `.env.example` lists the variable names; the student creates `.env.local`.

### B6. The deny rule in action
- The agent tried to run `cp .env.example .env.local` itself; the permission
  system **denied** it. The student created `.env.local` and pasted the keys
  themselves. The agent has never read the keys.

### B7. Talking points
- **Student:** "Can you also keep notes of what we are doing so I can speak
  about it."
- **Decision:** `notes/talking-points.md`, a running draft organized around the
  questions the course asks in class (tracing a request, identity/access, where
  API calls happen, the failing test, what the agent was stopped from doing).

## Nov 13 — First eval run

### B8. Model choice
- `npm run models` listed 12 Flash models. Agent recommended `gemini-3.8-flash`
  (newest full Flash; Lite models reason less well about missing steps), with
  `gemini-2.5-flash` as the fallback if the free-tier quota is too low.

### B9. First run failed with a 400, and the harness hid why
- The error said only "unavailable (400)", and the summary wrongly printed "All
  must-pass checks passed" even though nothing ran.
- **Fixes:** errors now carry Gemini's raw message (for logs and evals only,
  never shown to users); the summary reports run errors instead of a false pass;
  the `$schema` key is stripped from the JSON Schema sent to Gemini.
- **Real cause:** a typo in `.env.local` (`GEMINI_MODEL=GEMINI_MODEL=…`). Found
  by printing only the model value, never the keys.

### B10. First real eval: yogurt, prompt p1, gemini-3.8-flash (14/17)
- **Both must-pass checks passed:** it asked about the "10 in" container
  ("What brand or size…?") and flagged the missing cooling step ("Do you let the
  milk cool down…?", suggestion ≈110–115°F).
- **Missed:** it didn't ask the incubator *temperature* (it asked what kind of
  incubator instead), and it didn't ask fridge vs. freezer.
- **Real bug, the one the product promises can't happen:** the accepted suggestion
  "whole pasteurized milk" ended up inside an ingredient labeled **cook**. The
  110°F from a suggestion was labeled as the family's answer.
  One label per ingredient couldn't hold mixed sources.
- **Fix (prompt p2):** ingredients and steps get a `suggested_detail` field for
  the parts that came from a suggestion. Pass 2 must surface every accepted
  suggestion there or in a "suggested" why. A new must-pass check fails if a
  suggestion hides under a cook/family label.
- **Too slow:** ~12 minutes for two calls. Added a 90 s request timeout, timing
  per pass, and a `GEMINI_THINKING` setting to compare thinking levels.

## Nov 13 — Connecting the services

### B11. Clerk ↔ Supabase
- New Clerk app "Culinary Lab Book" (development keys, email sign-in).
- Clerk's Supabase integration activated, so session tokens carry
  `role: authenticated`. Clerk domain (public, not a secret):
  `https://loved-lionfish-7298.clerk.accounts.dev`
- Supabase → Authentication → Third-Party Auth → Clerk, using that domain.
  RLS reads the Clerk user id from `auth.jwt() ->> 'sub'`.

### B12. Supabase project + keys
- The student created a new Supabase project (`zsfkpztpdxcowqsjfylu`, free
  plan) and added Clerk under Third-Party Auth.
- `npm run check-env` validates `.env.local` without printing secrets: formats,
  doubled names, a service-role key used by mistake, and that the Clerk key's
  domain matches. All passed.

### B13. How migrations get applied
- **Options offered:** connect the Supabase MCP, or paste into the SQL Editor.
- **Student chose:** "Connect Supabase MCP."
- Scoped to this one project (`project_ref=…` in `.mcp.json`, committed; no
  secrets in it, since login is OAuth in the browser).

### B14. Migration applied + RLS verified (Nov 13)
- `/mcp` connected the **claude.ai Supabase connector** (account-wide), not
  the project-scoped server in `.mcp.json`. The agent only used project
  `zsfkpztpdxcowqsjfylu`. To do: switch to the scoped server for v2.
- Before applying: pinned `search_path` on the helper functions, and revoked
  anon EXECUTE on `save_shared_recipe` (Supabase grants it to anon by default).
- **RLS checks** (`supabase/tests/rls_check.sql`, rolled back): user A sees 1
  own dictation; **user B sees 0; signed-out visitor sees 0**. The owner's
  attempt to edit the transcript changed 0 rows. A signed-out visitor with the
  link gets the recipe, and with a wrong token gets nothing. User B's "save a
  copy" creates their own recipe with the transcript unchanged.
- **Security advisor:** 3 warnings, all that `get_shared_recipe` /
  `save_shared_recipe` are callable. That's intentional (they are the
  share-link door), and both require the token.

### B15. Model comparison on prompt p4 (all 3 dictations)
| Model | Score | Must-pass | Time |
|---|---|---|---|
| gemini-3.5-flash | 45/50 | all ✓ | ~20 s per pass |
| gemini-3.7-flash | — | — | every call 504 (timed out) |
| gemini-3.8-flash | 14/17 (p1, yogurt only) | ✓ | ~12 min, then 504s |
| gemini-2.5-flash | — | — | 404: closed to new users |
- p3 → p4 on 3.5-flash: 42/50 → 45/50. Pork soup questions went 5 → 7 (the
  scan step), and the mango contradiction is now asked. Still missed: where the
  green onions go, the number of parboils, tomatoes ≈ 5, kind of milk, fridge or
  freezer.
- **Student chose:** "gemini-3.5-flash" for v1. Why: it passed every must-pass
  check and is fast enough for someone waiting on a phone.
