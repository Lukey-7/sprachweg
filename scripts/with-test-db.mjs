// Runs a command with DATABASE_URL/DIRECT_URL swapped for TEST_DATABASE_URL.
import { spawnSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';

if (existsSync('.env')) {
  for (const line of readFileSync('.env', 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*"?(.*?)"?\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  }
}
const url = process.env.TEST_DATABASE_URL;
if (!url) {
  console.error('TEST_DATABASE_URL is not set.');
  process.exit(1);
}
const [cmd, ...args] = process.argv.slice(2);
const r = spawnSync(cmd, args, {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, DATABASE_URL: url, DIRECT_URL: url },
});
process.exit(r.status ?? 1);
