/**
 * Optional CommonJS-compatible startup loader.
 *
 * Run npm run build first. Hostinger normally uses server.js directly.
 */
const fs = require('node:fs');
const path = require('node:path');

const builtServer = path.resolve(__dirname, 'server.js');

if (fs.existsSync(builtServer)) {
  import('./server.js').then(({ startServer }) => startServer()).catch((err) => {
    console.error('Gagal memuat server.js:', err);
    process.exit(1);
  });
} else {
  console.error('Production bundle missing. Run npm run build first.');
  process.exit(1);
}
