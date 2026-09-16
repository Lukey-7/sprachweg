# Sprachweg — working notes for Claude

Personal German learning app (one user, no login). Read this before touching anything.

**Repo on this machine:** `C:\Users\hp\sw-tmp\sprachweg` (Windows, Git Bash + PowerShell).
**GitHub:** `Lukey-7/sprachweg`, everything is on `main`.

## Rules for this project

1. **NEVER run a git command that can touch `.env`.** Before any `git checkout`, `switch`,
   `merge`, `stash`, `clean` or `reset`, copy `.env` somewhere outside the repo first and put
   it back afterwards. An earlier session destroyed the owner's filled-in `.env` this exact
   way: an old commit still tracked a placeholder `.env`, checking out that commit overwrote
   the real file, and the next commit deleted it. Git keeps no copy of ignored files, and it
   was unrecoverable (Notepad cache, Recycle Bin, shadow copies, File History all checked).
2. **Never print secrets.** Read `.env` in scripts; report only shapes ("present, length 60").
   Never ask the owner to paste keys into chat.
3. **Tests wipe every table.** They refuse to run unless `TEST_DATABASE_URL` is set, and it must
   never be the real database. Keep the guard in `server/vitest.config.ts`.
4. The owner wants to be told what's actually true. Don't present untested work as verified.

## Where it stands

Done and verified (118 server tests + 220 e2e pass, checked in a browser at phone size):

- The app was a good-looking shell whose frontend never really talked to its backend: four API
  URLs 404'd and every failure silently fell back to hardcoded demo data, so reviews were lost
  on reload. That is fixed — cards, reviews, streak, grammar mastery and daily progress persist.
- Postgres (Neon) instead of SQLite; Express runs as one Vercel function; PWA installable with
  offline caching of lessons/stories/cards.
- AI runs on `gemini-3.5-flash-lite` (~3-5s/call). Live-tested: dictionary, sentence analysis
  and speaking feedback all return correct German.

**Not done: the deploy.** The Vercel project was never created. Everything else is ready:
`vercel.json` + `scripts/vercel-build.mjs` produce Build Output API v3 (static client +
`/api/*` function pinned to `sin1`, Singapore, next to the Neon database). The bundled
function was tested locally against Postgres and served requests fine.

## To finish the deploy

The owner must supply four values in `.env` (the file is gone; see rule 1):

| Variable | Where they get it |
| --- | --- |
| `DATABASE_URL` | Neon → project `sprachweg` → Connect → pooling **ON** |
| `DIRECT_URL` | same dialog, pooling **OFF** |
| `GEMINI_API_KEY` | aistudio.google.com/apikey (existing key is re-copyable) |
| `VERCEL_TOKEN` | vercel.com/account/tokens → Create Token (old one is not viewable again) |

Plus `MOCK_GEMINI=false`, `SPRACHWEG_USER_ID="me"`, `PORT=4000`, and a `TEST_DATABASE_URL`
pointing at a throwaway database. `pgbouncer=true` must be appended to `DATABASE_URL` (a
script did this automatically before; do it again without printing the value).

Then: create the Vercel project (`api.vercel.com`, token in the `Authorization` header),
add the env vars there, deploy, open the URL on a phone → Add to Home Screen.

Neon already has the tables and seeded content; `npm run db:push && npm run db:seed` were run.
Vercel account is `varundarji-9365` (Hobby); GitHub is `Lukey-7` — different names, both correct.

## Commands

```bash
npm run dev        # API :4000 + client :5173
npm test           # server (vitest) + e2e; needs TEST_DATABASE_URL
npm run db:push    # apply schema      npm run db:seed   # load lesson content
npm run vercel-build   # writes .vercel/output
```

No local Postgres is installed. A previous session ran one via the npm package
`embedded-postgres` on port 54330 (`C:\Users\hp\sw-tmp\pg`), initialised with
`--encoding=UTF8` — the Windows default (WIN1252) cannot store IPA characters.

## Things that bite

- **Gemini free tier is per model and small** (`gemini-2.5-flash` was 20 requests/day). Testing
  burns it fast. `MOCK_GEMINI=true` returns canned sample data that is unrelated to the input;
  the UI labels it, and it is never written to the database or the cache.
- **AI response schemas must require every field** (`requireAllFields`), or light models omit the
  declension/conjugation tables. Because everything is required, unused tables come back filled
  with empty strings — `toDetail()` keeps only the table matching the part of speech.
- **Bump `PROMPT_VERSION`** in `server/src/ai/geminiClient.ts` after changing a prompt or schema,
  or cached answers from the old prompt keep being served.
- Models answer with German labels ("Nomen") and gender as "masculine" — normalise via
  `server/src/linguistics/gender.ts`.
- **Killing `npm run dev` on Windows leaves children running** and holding ports; the script now
  uses `taskkill /T /F`. A stale server on :4000 once served old code during a test.
- `server/tests/client_contract.test.ts` runs the real client API layer against the real server.
  It is what catches URL/shape mismatches — keep it passing.
- The 220 "e2e" tests never start the app; they test reference implementations in `e2e/harness`.
  Don't treat them as coverage.

## Worth doing next

1. **Content is thin:** 7 grammar topics, 2 stories, ~9 dictionary words, against a "52-week
   A0→B2" claim. Agree a plan with the owner before generating any.
2. Offline review queue (reviews currently need a connection).
3. Optional password on the deployed URL — right now anyone with the link is the learner.
4. `PROJECT.md`, `TEST_READY.md`, `TEST_INFRA.md`, `BRIEFING.md` and `screenshots/` still describe
   the old app and are inaccurate.
