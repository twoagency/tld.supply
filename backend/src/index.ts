import { Hono } from 'hono';

import isAvailableRoute from './routes/isAvailable';
import whoIsRoute from './routes/whois';

const app = new Hono();
const port = 3000;

app.get('api/isAvailable/:domains', (c) => isAvailableRoute(c));
app.get('api/whoIs/:domain', (c) => whoIsRoute(c));

console.log(`Started development server: http://localhost:${port}`);

Bun.serve({
  port,
  fetch: app.fetch,
  idleTimeout: 60
});