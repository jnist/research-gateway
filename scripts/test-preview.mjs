import { preview } from 'astro';

// The API stays in the foreground even inside agent environments; Playwright owns it.
const server = await preview({ server: { host: '127.0.0.1', port: 4399 } });
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, async () => { await server.stop(); process.exit(0); });
}
