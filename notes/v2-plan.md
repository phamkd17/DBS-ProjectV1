# Culinary Lab Book: Plan for v2

> **Draft for Khang to edit.** The five v2 features are Khang's (Nov 15). The
> evidence, design sketches, and schedule were drafted by the agent from the
> build log. Put it in your own words before submitting.
>
> v1 due Nov 17 · **v2 at the project fair, Dec 1** · course focus: **AI**

---

## Where v1 is

A new person can do the core task end to end, on a phone or a laptop:
**write an idea, or save a cook's words → move it to Development → the AI drafts
a recipe and asks what it can't know → answer, or accept a suggestion → a
finished recipe with every reason labeled by who said it → send it by link.**

- Live: https://dbs-project-v1-omega.vercel.app · Repo: github.com/phamkd17/DBS-ProjectV1
- AI: two Gemini passes on prompt **p4**: **45/50** checks on Grandma's three
  real dictations, with every must-pass check passing (it catches the "10 in"
  Dannon starter and the missing cooling step).
- Lab book: **Ideas → Development → Finished**, Idea notes kept at every stage,
  and the cook's words as their own section.

## What we saw when people used v1

**From building and using it myself (Nov 13–15):** most of my changes this
week were about **flow, not features**. Each one was a spot where I got stuck
or the next step wasn't obvious:
- Two "New" buttons that did the same thing → merged into one.
- Editing opened a separate page → I wanted to edit right where I was (pencils).
- Notes disappeared when an idea moved to Development → now kept.
- The AI button was easy to hit by accident → now it only appears in
  Development, behind an "I'm ready" tick.

That's the main reason **streamlining the workflow** is a v2 priority. The
path from idea to recipe still takes too many decisions.

**From the evals:** the AI still misses things on long dictations: where the
prepped green onions go, how many parboils, "≈5 tomatoes", the kind of milk,
and fridge vs. freezer. All five are in the eval results, and none have a fix yet.

**From real users** (cousin / aunt / friends, watched without helping):
> *To fill in after this weekend's tests: what each person did, where they got
> stuck, what they said.*

---

## What v2 adds and changes

### 1. Pictures in ideas

**What:** add photos to an idea (a dish I tasted, a page from Grandma's pantry
notebook, a plating I want to try), next to the notes and the link. Several
photos per idea, viewable full screen.

**Why:** in my interviews, inspiration *"gets lost… in all different places"*,
and most of it is photos on my phone. A note without the picture loses half
of the idea. A cousin has already photographed the pantry notebook.

**How (sketch):** a private Supabase Storage bucket. Files live under each
user's id and follow the same owner-only rules as the rest of the lab book.
Photos are resized on the phone before upload to stay on the free tier, with a
`photos` table linking each one to its entry. Photos go to the AI only when the
user asks (see 4).

**Done when:** I can add 3 photos from my phone to an idea, see them on the
idea and in the list, and another user can't open them, even with the URL.

### 2. A streamlined path: idea → development → finished recipe

**What:** make the next step obvious and close at hand at every stage:
- A **progress line** on each entry: Idea → Development → Finished, showing
  where it is and what's needed next ("Add the cook's words", "Answer 3
  questions", "Make the recipe").
- **One next-step button** in the same place on every screen. Fewer screens
  and fewer choices between saving words and getting a recipe.
- **Faster AI waits:** show the questions as soon as they're ready, instead of
  a ~30 s spinner.
- Polish from testers (to fill in after the tests), plus review of the drafted
  on-screen wording.

**Why:** see "What we saw" above. Almost every v1 change was a flow fix, and
the testers' sessions will show the rest.

**Done when:** a new tester goes from a saved idea to a finished recipe without
asking me what to do next, and I can count fewer taps than in v1.

### 3. Iterations in Development: what each change does to the dish

**What:** a **lab book of trials** for each recipe. Each time I (or a cousin)
make it, I log a trial:
- **What I changed**, picked from the recipe's own dials ("incubate 8 h → 10 h",
  "sugar ⅓ cup → ¼ cup"), or anything else
- **How it turned out**: notes, an optional photo, and how close it came
  ("Grandma: closer, but still not as sour")
- The **date**

Trials sit side by side, so I can see how each parameter changes the dish.

**Why:** this is the "lab" in Culinary Lab Book. Every interviewee already keeps
a trial log after a miss, on paper or in their head. The yogurt success test is
exactly this: my test batch → the cousin's batch → Grandma tastes. Grandma's
recipes are full of dials (onions 5 vs 7 min, yogurt 8 vs 12 h), and v1 shows
them but can't record what happened when you turned one.

**AI angle (course focus):** after a few trials, the AI summarizes what the
trials show ("longer incubation made it tangier; 10 h matched Grandma's best"),
labeled **Suggested**, never as fact or as Grandma's. It gets an eval of its
own: does the summary only claim what the trial notes say?

**Done when:** I can log 3 yogurt trials with changes, notes, and dates, see
them side by side, and get a labeled summary that passes its eval.

### 4. Recipe descriptions and variations, with notes and dates

**What:**
- A **description** on every finished recipe: what the dish is, where it comes
  from, when we make it. It's labeled like everything else: Grandma's words, a
  family answer, or a Suggested draft.
- **Variations of the same recipe:** "Grandma's original", "My less-sweet
  version", "Auntie's crispy tofu", each with its own changes, notes, and
  date. They're linked to the original and never overwrite it.

**Why:** families already make one dish several ways (the sister likes the
tofu creamy, Grandma likes it crispy; Grandpa likes the yogurt sour). v1 has a
single recipe per dish, so a change either overwrites Grandma's version or
gets lost. A variation keeps her original intact, which is the core promise.

**Done when:** a finished recipe has a description and two variations, each
with notes and a date, and the original is unchanged.

### 5. Nutrition facts and portion scaling

**What:**
- **Scale the recipe:** pick how many servings ("Makes 6 jars → make 12"), and
  every amount that can be scaled updates (½ gallon → 1 gallon). It switches
  between cups/spoons and grams.
- **Nutrition facts** per serving (calories, protein, fat, carbs, sugar,
  sodium), worked out from the ingredients.

**Why:** cousins and friends cook for different numbers of people than Grandma
does, and a recipe that can't be resized means guessing again, which is the
problem the app exists to fix. Nutrition was asked about in my proposal
interviews as a "nice to have" for sharing recipes beyond the family.

**The hard part, handled honestly:** Grandma's amounts are often "a little
bit" or not stated at all.
- Amounts that aren't numbers (**"a little bit of fish sauce"**) are shown
  unscaled, with a note, never turned into an invented number.
- Nutrition is labeled an **estimate** and lists which ingredients it couldn't
  count ("fish sauce: amount not stated").
- Accepted suggestions still count, and stay labeled **Suggested**.
- "How much does this make?" becomes one of the AI's questions in pass 1, since
  the dictations rarely say.

**How (sketch), with the AI angle:**
- The recipe format stores each amount as **number + unit** (plus the original
  words), so scaling and unit conversion are plain code, not AI. These are the
  `convert_units` tool from my proposal.
- A **nutrition step with tool calling:** the AI matches each ingredient to a
  food in USDA FoodData Central (free API), and code does the math. The AI
  never makes up nutrient numbers.
- **Evals:** scaling is unit-tested (½ gallon × 2 = 1 gallon; "a little bit"
  stays as is). Nutrition is checked against hand-computed totals for the yogurt.

**Done when:** I can make the yogurt for 12 instead of 6 and every measurable
amount doubles correctly, the vague ones stay as they are, and the nutrition
panel is labeled as an estimate and names what it left out.

---

## Also fixing (from v1)

- **AI question recall** on long dictations (the 5 misses above): prompt p5,
  measured with the existing evals, plus a flan dictation as a fourth sample.
- **Cleanups:** retire the unused `ideas` table; use the project-scoped Supabase
  MCP (`.mcp.json`) instead of the account-wide connector.

## Schedule (Nov 17 → Dec 1)

| When | What |
|---|---|
| Weekend before Nov 17 | Real-user tests on v1; fill in "What we saw" |
| Week of Nov 17 | **2. Streamlined flow** (from test findings) · **1. Photos** · AI recall fix (p5) |
| Week of Nov 24 (no class) | **3. Iterations** + AI trial summary and its eval · **5. Portion scaling** (amounts as number + unit) · my yogurt test batch, logged as trial 1 |
| Nov 28 – Dec 1 | **4. Descriptions + variations** · **5. Nutrition** (USDA tool) · cousin's batch as trial 2 · fair prep |

**If behind, cut in this order:** nutrition (keep scaling) → the AI trial
summary → variations (keep the description) → multiple photos (keep one per
idea).

## Open questions

- Should Idea notes (and photos) ever be sent to the AI, or only the cook's words?
- Can trials and variations be shared with family by link, like recipes are now?
- Who logs the cousin's trial: the cousin in their own copy, or me in mine?
- Nutrition: is calories + the big four (protein, fat, carbs, sugar) enough, or
  does it need a full nutrition label?
