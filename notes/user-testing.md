# User testing script: Culinary Lab Book v1

> **Draft for Khang to adjust.** From the brief: *"Give them the core task, and
> watch without helping. Write down what each person did and said."*
> About 20–25 minutes per person. Live link: https://dbs-project-v1-omega.vercel.app

---

## Who

Aim for **3 people**, ideally the ones from my proposal interviews:

| | Why them | How |
|---|---|---|
| **Cousin** | Will follow the yogurt recipe for the success test | Video call, screen share from their phone or laptop |
| **Aunt** | Writes down Grandma's dictations today | Video call, or in person if possible |
| **A friend / classmate** | A new person who's never heard of the app | In person or video call |

(Grandma: only if the aunt is there to help. Watch how she dictates into the
phone, but don't make her do the whole task.)

## Before the session (5 min, me)

- [ ] Sign in yourself and check the live link works.
- [ ] Have Grandma's **yogurt dictation** ready to text them (below), in case
      they don't have a dish of their own.
- [ ] Open a blank copy of the notes template (bottom of this file).
- [ ] Ask: "Is it OK if I take notes and maybe quote you in my class
      project? I won't use your name." Only write quotes if they say yes.

## What I say at the start (read it, don't improvise)

> "Thanks for helping. I'm testing an app I built, not you, so there are no
> wrong answers. If something is confusing, that's exactly what I need to find.
> Please **think out loud**: say what you're looking at, what you expect, and
> what surprises you. I'm going to stay quiet and **not help**, even if you get
> stuck, because I want to see what really happens. If you'd give up at home,
> just say 'I'd give up here' and we'll move on."

**My rule while they work:** don't point, don't explain, don't say the name of
any button. If they ask me something, reply *"What would you try?"* or *"What
do you think it does?"* If they're stuck for over 2 minutes, write it down
and say *"Let's move to the next part."*

---

## The tasks

Give one task at a time. **Text it to them, or read it exactly as written.**
The wording doesn't use the app's button names on purpose.

**Task 1: Start the app** (about 2 min)
> "Here's a link. Get started with it as if you'd heard about it from me."

*Watch:* do they understand what it's for from the first screen? Can they sign up?

**Task 2: Save a dish idea** (about 3 min)
> "You tasted something you want to make someday. Save that idea with a short
> note, and a link if you have one."

*Watch:* do they find **New → Idea**? Do they know where it went afterwards (the Ideas tab)?

**Task 3: Save the cook's words** (about 5 min)
> "Now save what a cook said while cooking. Use this (text them the yogurt
> dictation), or dictate one of your own dishes with your phone's microphone."

*Watch:* do they find where to put the words (New → Dictation, or adding them
to the idea)? Do they try the phone's mic? Do they fill in "whose words"?

**Task 4: Turn it into a recipe** (about 8 min, the core of the app)
> "Make this into a recipe someone else could follow."

*Watch (most important):*
- Do they figure out they need to **move it to Development** first?
- Do they understand the **"I'm ready"** tick before the AI step?
- How long does the ~30 s wait feel? Do they leave or tap anything?
- With the **questions**: do they answer, use the suggestions, or skip? Do they
  understand *why* it's asking (e.g. the "10 in" container, cooling the milk)?
- On the **finished recipe**: do they find the **science** and **adjust** icons?
  Do they notice **Show sources**? Do they trust the recipe?

**Task 5: Send it** (about 3 min)
> "Send this recipe to someone in your family."

*Watch:* do they find **Make a link**? What do they expect the other person to see?

## After the tasks (5 min): ask, then listen

1. "In one sentence, what is this app for?"
2. "What was the most confusing moment?"
3. "Was there anything you expected to find and didn't?"
4. "Would you trust this recipe enough to cook it? Why or why not?"
5. (Cousin/aunt) "Would this replace the notebook in the pantry? What would it need?"
6. "If you could change one thing, what would it be?"

Thank them. **Don't explain or defend the design** until the notes are done.

---

## Notes template (one copy per person)

**Person:** ______ (role, e.g. "cousin", no names in the repo) · **Date:** ______ · **Device:** phone / laptop

| Task | Done? (yes / with trouble / gave up) | Time | What they did | What they said (quotes) |
|---|---|---|---|---|
| 1 Start | | | | |
| 2 Idea | | | | |
| 3 Cook's words | | | | |
| 4 Recipe | | | | |
| 5 Send | | | | |

**Where they got stuck** (the moment, and what they tried):
-

**Surprises** (good or bad):
-

**Answers to the after-task questions:**
1.
2.
3.
4.
5.
6.

**My top 3 fixes from this session:**
1.
2.
3.

---

## Yogurt dictation to text them

> Yogurt is a very simple dish you need about 1/2 gallon jug of milk and then one of these small 10 in yogurt container that is not flavored at all uh you heat up the milk make sure it doesn't boil uh just until it steams a little bit and then from there you add 1/3 a cup of sugar maybe less if you like it less sweet and then you mix in the yogurt with the milk you stir it into everything blends and then you put it into these little jars and then you put all these little jars into this incubator and you let it sit for about 8 hours if you don't like it too tangy but I like it at 12 hours super tangy and then from there you can either keep it in the fridge or freeze it and then serve

## After all sessions

- [ ] Put the findings in `notes/v2-plan.md` under **"From real users"**.
- [ ] Re-order v2 item 2 (streamlined flow) around the places people got stuck.
- [ ] Add 1–2 quotes (with permission) to `notes/talking-points.md` for class.
