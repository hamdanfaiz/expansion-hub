import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

async function collect(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map(entry => {
    const file = join(directory, entry.name);
    return entry.isDirectory() ? collect(file) : file.endsWith('.test.ts') ? [file] : [];
  }))).flat();
}
const tests = (await collect('src')).sort();
const child = spawn(process.execPath, ['--import', 'tsx', '--test', ...tests], { stdio: 'inherit' });
child.on('error', error => { console.error(error); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
