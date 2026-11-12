import { build as buildFrontend } from 'vite';
import { build as buildServer } from 'esbuild';

// Await both builds and propagate errors so hosting never deploys a stale bundle.
await buildFrontend();
await buildServer({
  entryPoints: ['server.ts'],
  outfile: 'server.js',
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node24',
  packages: 'external',
  banner: { js: 'import { createRequire as __createRequire } from "node:module"; const require = __createRequire(import.meta.url);' },
});

