// Builds the Vercel Build Output API v3 layout in .vercel/output:
//   static/            the Vite client (PWA)
//   functions/api.func the Express server bundled into one Node function
// Docs: https://vercel.com/docs/build-output-api/v3
import { build } from 'esbuild';
import { execSync } from 'child_process';
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';

const out = '.vercel/output';
const fn = join(out, 'functions/api.func');
const run = cmd => execSync(cmd, { stdio: 'inherit' });

rmSync(out, { recursive: true, force: true });
mkdirSync(fn, { recursive: true });

run('npx prisma generate --schema=prisma/schema.prisma');
run('npm --prefix client run build');
cpSync('client/dist', join(out, 'static'), { recursive: true });

await build({
  entryPoints: ['server/src/vercel.ts'],
  outfile: join(fn, 'index.js'),
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'cjs',
  // Prisma loads its query engine from disk, so it ships as files next to the bundle.
  external: ['@prisma/client', '.prisma/client'],
  sourcemap: true,
  logLevel: 'warning',
});

// Prisma client + generated client with only the Linux engine (skip local Windows/macOS engines).
cpSync('node_modules/@prisma/client', join(fn, 'node_modules/@prisma/client'), { recursive: true });
const generated = 'node_modules/.prisma/client';
cpSync(generated, join(fn, 'node_modules/.prisma/client'), {
  recursive: true,
  filter: src => !/query_engine-windows|libquery_engine-darwin|libquery_engine-debian/.test(src),
});
if (!readdirSync(join(fn, 'node_modules/.prisma/client')).some(f => f.includes('rhel-openssl-3.0.x'))) {
  throw new Error('Linux Prisma engine missing. Check binaryTargets in prisma/schema.prisma.');
}
if (existsSync('prisma/schema.prisma')) cpSync('prisma/schema.prisma', join(fn, 'node_modules/.prisma/client/schema.prisma'));

writeFileSync(
  join(fn, '.vc-config.json'),
  JSON.stringify({ runtime: 'nodejs22.x', handler: 'index.js', launcherType: 'Nodejs', maxDuration: 30, shouldAddSourcemapSupport: true }, null, 2)
);

writeFileSync(
  join(out, 'config.json'),
  JSON.stringify(
    {
      version: 3,
      routes: [
        // The service worker must never be cached, or app updates never reach the phone.
        { src: '/sw\.js', headers: { 'cache-control': 'public, max-age=0, must-revalidate' }, continue: true },
        { src: '/assets/(.*)', headers: { 'cache-control': 'public, max-age=31536000, immutable' }, continue: true },
        { src: '/api/(.*)', dest: '/api?__p=$1' },
        { handle: 'filesystem' },
        { src: '/(.*)', dest: '/index.html' },
      ],
    },
    null,
    2
  )
);

console.log('Vercel build output ready in .vercel/output');
