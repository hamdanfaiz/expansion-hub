import { spawn } from 'node:child_process';

const child = spawn(process.execPath, ['--import', 'tsx', 'server.ts'], {
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'development', USE_VITE_DEV: 'true' },
});
child.on('error', error => { console.error(error); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });

