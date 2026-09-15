import { spawn, spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

console.log('Starting Sprachweg full-stack development environment...');
console.log('Backend will run on http://localhost:4000');
console.log('Frontend will run on http://localhost:5173\n');

const server = spawn(npmCmd, ['--prefix', 'server', 'run', 'dev'], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: true,
});

const client = spawn(npmCmd, ['--prefix', 'client', 'run', 'dev'], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: true,
});

// On Windows, killing the npm shell leaves its node children running (and holding
// the ports), so the whole process tree is terminated.
const killTree = child => {
  if (!child.pid || child.exitCode !== null) return;
  // Synchronous so the tree is gone before this process exits.
  if (isWin) spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
  else child.kill('SIGTERM');
};

let shuttingDown = false;
const cleanup = code => {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log('\nShutting down Sprachweg servers...');
  killTree(server);
  killTree(client);
  process.exit(typeof code === 'number' ? code : 0);
};

// If either side's process exits, stop the other instead of leaving a half-running app.
// (tsx watch keeps running after the server crashes, e.g. on a busy port, so that case
// is reported by the server's own error message instead.)
server.on('exit', code => cleanup(code ?? 1));
client.on('exit', code => cleanup(code ?? 1));

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
