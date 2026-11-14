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
