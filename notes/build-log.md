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

## Nov 13 — Screens + first run of the core task

### B16. Screens built (one commit each)
Home (lab book + empty state + signed-out landing) → New dictation → Dictation
page (Create recipe, with a loading state that says what's happening) →
Questions (answer / Use suggestion / leave blank) → Recipe page (labeled why,
"What the app changed", her words, Send panel) → Shared link page (read +
"Save to my lab book").

### B17. First run, by the student, on localhost
- **Student:** "done, it worked"
- Yogurt, 4 questions: cooling step (used suggestion → **Suggested**), brand
  and size (answered → **Family answer**, Dannon credited), incubator
  (suggestion), fridge or freeze (answered). All labels saved correctly.
- Timing: create recipe 35 s, finish recipe 13 s.
- Agent found in the logs: a dev warning on every page (data fetched without a
  placeholder during navigation). Fixed by adding a `loading.tsx` skeleton to
  each route.
- Share link not tried yet in this run.

### B18. Deployed (Nov 13)
- Vercel: https://dbs-project-v1-omega.vercel.app, with all 6 env vars set in Vercel.
- Signed-out checks on the live site: home ✓; `/new` and recipe pages →
  Clerk sign-in ✓ (non-browser requests get a 404); fake share token → "isn't
  shared anymore" ✓; `/.env.local` → 404 ✓.

### B19. Phone + share link test (student, live site)
- **Student:** "done, it worked on my phone." Signed in on the phone, read the
  recipe, made a link, opened it signed out, and saw the recipe without getting
  into the lab book.

## Nov 14 — Security review

### B20. `/security-review` on the whole app (d5c7577..HEAD)
- One reviewer agent searched for vulnerabilities, and a second agent checked
  each finding for false positives.
- **Finding (MEDIUM, confirmed by both; 7/10 confidence, so just under the
  skill's 8/10 reporting bar):** the UPDATE policy on `recipe_questions`
  only checked `owner_id`. A user who saved a copy of someone's shared recipe
  could learn the original recipe id (`copied_from`), re-point one of their own
  questions at it, and `save_shared_recipe` would copy that fake Q&A,
  labeled "Family answer", into every later recipient's lab book. The same gap
  existed for `recipes.dictation_id` (no new data exposed).
- **Fixed anyway** (`20261114010000_tighten_updates.sql`): column-level UPDATE
  grants (questions: answer fields only; recipes: generated content + sharing
  only), the UPDATE policy re-checks the parent owner, and both share functions
  only follow rows with the same owner.
- **Proved:** `supabase/tests/repoint_attack.sql`. Both attacks are now
  "permission denied"; normal answering, sharing, and saving a copy still work.
- From here on, work happens on branches (`refine-v1`), each with its own
  Vercel preview link, merged after review.

## Nov 14 — Lab book tabs

### B21. Ideas / Development / Finished
- **Student:** "I want to add tabs for Ideas, Development, and Finished
  Recipes." Then: "I want the ideas to be where i can attached quick notes,
  pictures, links. Development is were I actively work on developing a recipe.
  And the finished have different iterations and notes."
- **Pushback (once):** v1 is due Tuesday, and user testing plus the v2 plan
  still have to happen. Photos are the biggest piece (upload, storage, privacy
  rules).
- **Options offered:** all 3 tabs with photos in v2 / everything now / tabs now
  with the rest in v2.
- **Student chose:** "Tabs now, the rest in v2."
- **Built:** the home page has three tabs with counts. Ideas = words saved, no
  recipe yet. Development = recipe with questions waiting. Finished = ready.
  It opens on the tab where the work is, and each tab has its own empty state.
- **v2 headline:** Ideas get notes, photos, and links, plus "Start developing";
  Finished recipes get iterations (each trial: what changed, how it turned out).

## Nov 14 — Line & Stone + browser verification

### B22. Visual style
- **Student:** "can you use line and stone" (their Assignment 2 design system).
- Restyled every screen from the A2 tokens and components: Limestone, Plaster,
  Ink, Slate, Stone hairlines, Aegean for the one primary action, Instrument
  Serif + Jost, square corners, no shadows, underline tabs.
- Source labels kept their meaning: cook = ochre, food science = Cypress tint,
  suggested = Aegean tint, family answer = ink outline, not stated = dashed.

### B23. "Constantly review" against the design checklist
- **Student:** "Can you constantly review for the following requirements"
  (brief step 6 Verify + Design Requirements). Written into AGENTS.md as a
  standing rule.
- `npm run verify` (Playwright): runs the whole core task as a test user and
  takes screenshots at 390px and 1440px of 16 screens, an axe WCAG AA scan, a
  keyboard Tab pass, and a sideways-scroll check.
- **Caught by looking at the screenshots, not by the automated checks:** the
  first run passed every check, but the screenshots showed none of the colors
  or fonts. The dev server was serving stale CSS (Tailwind's cache, after a
  production build ran alongside it). Restarted it with a clean cache.
- **Review fixes:** placeholders looked like filled-in values ("Yogurt",
  "Grandma"), so they now read "e.g. …" in italic. The "Made with model ·
  prompt" line moved inside "Questions the app asked" (Simplicity).
- **Result:** 0 axe violations on all 16 screens, no sideways scroll at 390px,
  a visible focus style on every Tab stop.
- **Known, left:** Clerk's default avatar is purple (only for accounts without a
  photo).

### B24. Primary color: Scarlet
- **Student:** "Instead of agean blue, I want a scarlet red/ burgundy for the
  design template." Agent made `notes/design/red-swatches.html` (Scarlet →
  Oxblood, with contrast ratios). **Student:** "I am between scarlet and
  crimsom." Agent made `red-swatches-2.html` (5 steps). **Student chose:**
  "Scarlet-leaning": `#ae1f2e` (hover `#941a27`, pressed `#7a1620`), 6.4:1.
- Everything else stays Line & Stone. Terracotta errors still read as
  different from the Scarlet button.

### B25. Verify found two more real problems
- **Stale CSS, again:** the dev server ignores `globals.css` edits (a
  Tailwind/Turbopack cache issue). `npm run verify` now starts with a test
  that compares every color token in `globals.css` to the served CSS, and
  fails with "restart the dev server" if they differ.
- **Finished recipes couldn't be deleted** (only ideas could). Added "Delete
  this recipe" with a confirmation. The verify run now deletes its own
  recipe and checks that it's gone.
- Next's floating dev badge covered the Delete button at 390px (dev only),
  so the badge is now off (`devIndicators: false`).

## Nov 15 — Ideas you can create, and Move to

### B26. New ideas + moving between tabs
- **Student:** "Can you add a way for me to create new ideas a move them between
  ideas, development and finished."
- **Built:** "New idea" (title, optional note, optional link; photos still v2)
  → idea page (note, link opens in a new tab, "Add the cook's words" starts a
  dictation with the dish name filled in, Edit, Delete). A **Move to** row on
  every item (list, dictation page, recipe page). Creating a recipe moves it to
  Development and finishing moves it to Finished automatically; the user can
  move anything afterwards. Moving only reorganizes and never deletes anything.
- **Database** (`20261115000000_ideas_and_stages.sql`): `ideas` table with
  owner-only RLS; links must be http(s) (a check constraint, plus server
  validation); `dictations.stage`, where owners may update **only** `stage`
  (column grant). Her words stay blocked by the grant + trigger. Copies saved
  from a link land in Finished. Tested: owner moves ✓, transcript edit
  blocked ✓, `javascript:` link rejected ✓, another user sees/moves 0 ✓.
- **Verify found:** Move gave no feedback (now shows "Moving to …"). Other
  failures were test issues: Next keeps hidden copies of past pages, and its
  screen-reader route announcer still holds the old title, so checks now count
  only visible text inside `<main>`.
- **Hit the Gemini free-tier rate limit** after many verify runs. The app
  showed its designed state ("The recipe helper is busy right now. Try again in
  a minute.") with Try again. Verify now fails fast with that message instead
  of waiting 4 minutes.

### B27. Limit Gemini calls during testing
- **Student:** "Can you limit the API call to Gemini during testing?"
- **Built:** a dev-only response cache (`lib/ai/cache.ts`), keyed by model +
  prompt + transcript + answers + schema. The same request reuses the saved
  answer; anything new still calls Gemini. Off in production (the live site
  always calls the model) and off for evals (they measure the model).
- **Measured:** two verify runs in a row = **0 Gemini calls** (2 cache hits
  each), and each run took about 35 s instead of over a minute.
- `npm run verify:fresh` clears it, for when a test should use the real model.

### B28. One "New" button
- **Student:** "arent these two buttons do the same thing? Can you merge with
  the option to add dictation in the New button."
- **Built:** a single Scarlet **New** button (the one primary action) that
  opens **Idea** ("A note, link, or dish to try later") or **Dictation** ("The
  cook's words, to turn into a recipe"). It's a disclosure button with
  `aria-expanded`; outside click or Escape closes it and returns focus. The
  first-run "Add your first dictation" became secondary, so there's still one
  primary per screen.
- **Verify found:** the menu was cut off at 390px (anchored right while the
  button sits left on phones), and the ▾ rendered as a dot. Fixed (left-anchored
  on mobile, an SVG chevron). Keyboard test: Enter opens ✓, Tab reaches Idea ✓,
  Escape closes and returns focus ✓. Page waits now time out at 30 s.

### B29. Edit ideas; make the AI step deliberate
- **Student:** "Add a way to edit ideas. The crete recipe should be more
  highlighted because it uses AI to generate the receipe. We do not want to hit
  that as offten untile we are ready."
- **Edit ideas:** an "Edit idea" button under the title → `/i/[id]/edit`
  (same form; Save changes returns to the idea, Cancel goes back). Replaced
  the folded "Edit idea" box that was easy to miss.
- **AI step:** Create recipe is its own panel with a **Uses AI** badge (blue
  tint = from AI, same as "Suggested"), a plain explanation, and a required
  "Their words are complete. I'm ready." checkbox. The button ("Create recipe
  with AI") stays disabled until it's ticked. "Make the recipe with AI" on the
  questions page is marked the same way. The home card hint now says "Words
  saved" instead of "Create recipe", since tapping it only opens the page.
- **Verify:** the button is disabled before the tick ✓ and enabled after ✓;
  edit idea saves and shows the new note ✓; 0 axe violations.

### B30. Dictations become editable (product rule changed)
- **Student** (looking at a dictation): "I don't see edit option."
- **Options offered:** editable until the AI uses them (recommended) / lock the
  words, edit names only / always editable.
- **Student chose:** "Always editable." This replaces the proposal's
  "her words are never edited."
- **How it stays honest:** the database keeps the first version
  (`original_transcript`, shown as "See the original words") and stamps
  `edited_at` (the client can't forge either). A recipe made before an edit
  shows "Their words were edited on …, after this recipe was made, so the
  recipe may not match them anymore." The label reads "Their words · edited
  <date>" instead of "exactly as said".
- **Tested:** in the DB, the first version is kept across two edits ✓, forging
  the original is blocked ✓, another user edits 0 ✓. Verify edits words after
  the recipe exists: notice ✓, original kept ✓, 0 Gemini calls.
