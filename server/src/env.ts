import { existsSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load the repo-root .env for local dev. On Vercel, variables come from the
// project settings and no file exists, so this is a no-op there.
if (!process.env.VERCEL) {
  const rootEnv = resolve(dirname(fileURLToPath(import.meta.url)), '../../.env');
  if (existsSync(rootEnv)) {
    dotenv.config({ path: rootEnv });
  }
}

export const USER_ID = process.env.SPRACHWEG_USER_ID || 'me';
