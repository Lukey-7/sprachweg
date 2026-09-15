import type { IncomingMessage, ServerResponse } from 'http';
import { createServer } from './server.js';

const app = createServer();

/**
 * Vercel entry point. The deployment routes /api/<path> here as /api?__p=<path>;
 * the original path is restored so Express routing works unchanged.
 */
export default function handler(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url || '/', 'http://localhost');
  const rest = url.searchParams.get('__p');
  if (rest !== null) {
    url.searchParams.delete('__p');
    req.url = `/api/${rest}${url.search}`;
  }
  return app(req as any, res as any);
}
