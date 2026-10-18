// Reports the build size against the YouTube Playables limits recorded in the brief.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { gzipSync } from 'node:zlib';

const MiB = 1024 * 1024;
const INITIAL_LIMIT = 30 * MiB;
const INITIAL_TARGET = 15 * MiB;
const FILE_LIMIT = 30 * MiB;
const dist = new URL('../dist/', import.meta.url).pathname;

function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

let raw = 0;
let gz = 0;
let failed = false;
for (const file of walk(dist)) {
  const data = readFileSync(file);
  const g = gzipSync(data, { level: 9 }).length;
  raw += data.length;
  gz += g;
  if (data.length > FILE_LIMIT) {
    failed = true;
    console.error(`FAIL ${relative(dist, file)} is over the 30 MiB single-file limit`);
  }
  console.log(`${relative(dist, file).padEnd(36)} ${(data.length / 1024).toFixed(1).padStart(8)} KB  gzip ${(g / 1024).toFixed(1).padStart(7)} KB`);
}
console.log(`${'total'.padEnd(36)} ${(raw / 1024).toFixed(1).padStart(8)} KB  gzip ${(gz / 1024).toFixed(1).padStart(7)} KB`);
// Everything in the build is loaded before gameReady, so the whole build is the initial bundle.
if (gz > INITIAL_LIMIT) {
  failed = true;
  console.error('FAIL initial bundle is over the 30 MiB limit');
} else {
  console.log(`initial bundle ${(gz / MiB).toFixed(2)} MiB compressed: ${gz <= INITIAL_TARGET ? 'within' : 'OVER'} the 15 MiB target, within the 30 MiB limit`);
}
if (failed) process.exit(1);
