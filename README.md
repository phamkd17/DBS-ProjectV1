# Culinary Lab Book

Culinary Lab Book helps cooks turn what they say while they cook into recipes
that can be shared for others to repeat.

Design, Build, Ship (MPCS 51238) · Project v1.

## Run locally

```bash
npm install
cp .env.example .env.local   # then fill in the keys
npm run dev
```

## Layout

- `app/` — Next.js app (App Router)
- `evals/samples/` — real dictations and their expected checks (never edit the transcripts)
- `notes/build-log.md` — decision log
