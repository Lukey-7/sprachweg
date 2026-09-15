# Sprachweg 🇩🇪

A personal German learning app, A0 → B2. Installable on your phone as a PWA.

**What you do each day** (the *Today* tab walks you through it):

1. **Review:** spaced-repetition flashcards scheduled by an FSRS engine on the server.
2. **Grammar:** a lesson with drills; your mastery per topic is tracked.
3. **Sentence mining:** paste a German sentence and see word by word how it's built (Gemini).
4. **Speaking:** speak or type an answer to a scenario and get corrections (Gemini).
5. **Reading:** short graded stories; tap any word to look it up.

Everything you do is saved: cards, reviews, streak, grammar mastery, daily progress.

## Stack

| Part | Tech |
| --- | --- |
| Client | React 18, Vite, Tailwind, TanStack Query, vite-plugin-pwa |
| Server | Express (runs as a single Vercel function in production) |
| Database | Postgres via Prisma (Neon in production) |
| AI | Google Gemini (`gemini-3.5-flash-lite`), server-side only |

```
client/   React app (PWA)
server/   Express API, FSRS engine, Gemini client, seed content
prisma/   schema.prisma
scripts/  dev runner, Vercel build
```

## Run it locally

You need Node 20+ and a Postgres database. The easiest option is a free
[Neon](https://neon.tech) project with two databases (or two branches): one for
the app and one the tests are allowed to wipe.

```bash
npm install
cp .env.example .env      # then fill in the values
npm run db:push           # create tables
npm run db:seed           # load lessons, dictionary and stories
npm run dev               # API on :4000, app on http://localhost:5173
```

Without a `GEMINI_API_KEY` (or with `MOCK_GEMINI=true`) the AI features return
canned sample data, and the app labels it as such.

## Environment variables

| Name | Required | What it is |
| --- | --- | --- |
| `DATABASE_URL` | yes | Neon **pooled** connection string (host contains `-pooler`), with `&pgbouncer=true` |
| `DIRECT_URL` | yes | Neon **direct** connection string, used for `db:push` |
| `GEMINI_API_KEY` | for AI | From [Google AI Studio](https://aistudio.google.com/apikey) |
| `MOCK_GEMINI` | no | `true` = never call Gemini |
| `GEMINI_MODEL` | no | Override the model, default `gemini-3.5-flash-lite` |
| `SPRACHWEG_USER_ID` | no | Your learner id, default `me`. Changing it starts a fresh profile. |
| `TEST_DATABASE_URL` | tests only | A database the tests may **delete everything** in |

## Tests

```bash
npm run db:push:test   # once, creates tables in TEST_DATABASE_URL
npm test
```

- `server/tests/*.test.ts`: API, FSRS, cache and concurrency tests, plus
  `client_contract.test.ts`, which runs the real client API layer against the
  real server so URL or response-shape mismatches fail here.
- `e2e/`: checks standalone reference implementations in `e2e/harness`. It does
  not start the app.

Tests refuse to run without `TEST_DATABASE_URL`, because they wipe every table.

## Deploy to Vercel

1. Push the repo to GitHub and import it in Vercel. `vercel.json` sets the build;
   leave framework as *Other*.
2. Add `DATABASE_URL`, `DIRECT_URL`, `GEMINI_API_KEY` (and optionally
   `SPRACHWEG_USER_ID`) under *Settings → Environment Variables*.
3. From your machine, with `.env` pointing at the Neon database:
   `npm run db:push && npm run db:seed`.
4. Deploy. Open the URL on your phone and choose *Add to Home Screen*.

`npm run vercel-build` writes `.vercel/output` (Build Output API v3): the client as
static files and the API as one Node function at `/api/*`.

After a schema change, run `npm run db:push` against Neon before deploying.

## Notes

- **Single user.** There is no login. Anyone with the URL can use your profile.
- **Offline:** the app shell, lessons, stories and your last-loaded cards are cached.
  Reviews and AI tools need a connection.
- **Speech recognition** uses the browser's Web Speech API: good in Chrome and
  Android, limited on iOS Safari. You can always type instead.
