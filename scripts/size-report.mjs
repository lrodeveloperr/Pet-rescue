// Reports the build size against the YouTube Playables limits recorded in the brief.
// Worlds 7 onward are separate files loaded on demand (named w007-*.js and so on), so they are
// not part of the initial bundle (the bytes downloaded before gameReady).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { gzipSync } from 'node:zlib';

const MiB = 1024 * 1024;
const INITIAL_LIMIT = 30 * MiB;
const INITIAL_TARGET = 15 * MiB;
const FILE_LIMIT = 30 * MiB;
const FILE_TARGET = 512 * 1024;
const dist = new URL('../dist/', import.meta.url).pathname;

function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

const kb = (n) => (n / 1024).toFixed(1);
const onDemand = (file) => /^w\d{3}-.*\.js$/.test(file.split('/').pop());
let initial = { raw: 0, gz: 0 };
let worlds = { raw: 0, gz: 0, files: 0, largest: 0 };
let failed = false;
for (const file of walk(dist)) {
  const data = readFileSync(file);
  const g = gzipSync(data, { level: 9 }).length;
  const name = relative(dist, file);
  if (data.length > FILE_LIMIT) {
    failed = true;
    console.error(`FAIL ${name} is over the 30 MiB single-file limit`);
  } else if (data.length > FILE_TARGET) {
    console.warn(`note ${name} is over the 512 KiB per-file target`);
  }
  if (onDemand(file)) {
    worlds.raw += data.length;
    worlds.gz += g;
    worlds.files++;
    worlds.largest = Math.max(worlds.largest, data.length);
    continue;
  }
  initial.raw += data.length;
  initial.gz += g;
  console.log(`${name.padEnd(36)} ${kb(data.length).padStart(8)} KB  gzip ${kb(g).padStart(7)} KB`);
}
if (worlds.files) {
  console.log(`${`${worlds.files} world files (on demand)`.padEnd(36)} ${kb(worlds.raw).padStart(8)} KB  gzip ${kb(worlds.gz).padStart(7)} KB  (largest ${kb(worlds.largest)} KB)`);
}
console.log(`${'total'.padEnd(36)} ${kb(initial.raw + worlds.raw).padStart(8)} KB  gzip ${kb(initial.gz + worlds.gz).padStart(7)} KB`);
if (initial.gz > INITIAL_LIMIT) {
  failed = true;
  console.error('FAIL initial bundle is over the 30 MiB limit');
} else {
  console.log(`initial bundle ${(initial.gz / MiB).toFixed(2)} MiB compressed: ${initial.gz <= INITIAL_TARGET ? 'within' : 'OVER'} the 15 MiB target, within the 30 MiB limit`);
}
if (failed) process.exit(1);
