// Builds the whole game as one self-contained HTML page (scripts, styles and every world
// inlined) for sharing outside YouTube, for example as a claude.ai Artifact.
//   node scripts/build-artifact.mjs [output.html]
// The YouTube Playables SDK is left out: outside YouTube the game falls back to the browser
// (local saving, no ads). Upload dist/ (npm run build), not this file, to YouTube.
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { build } from 'vite';

const out = process.argv[2] || new URL('../dist-artifact/pet-rescue.html', import.meta.url).pathname;
const dir = new URL('../dist-artifact/build/', import.meta.url).pathname;

await build({
  logLevel: 'warn',
  build: {
    outDir: dir,
    emptyOutDir: true,
    // One script: the world files are bundled in rather than loaded on demand.
    rolldownOptions: { output: { inlineDynamicImports: true } },
  },
});

const html = readFileSync(`${dir}index.html`, 'utf8');
const asset = (re) => {
  const m = html.match(re);
  if (!m) throw new Error(`missing ${re}`);
  return readFileSync(`${dir}${m[1].replace(/^\.?\//, '')}`, 'utf8');
};
const js = asset(/<script[^>]+src="([^"]+\.js)"/);
const css = asset(/<link[^>]+href="([^"]+\.css)"/);
if (/import\(["']\.\//.test(js)) throw new Error('a dynamic import was not inlined');

// The Artifact host wraps the page in its own document skeleton, so only the title, styles,
// body content and script are written here.
const page =
  `<title>Pet Rescue: Borrow &amp; Escape</title>\n` +
  `<style>\n${css}\n</style>\n` +
  `<canvas id="scene"></canvas>\n<div id="ui"></div>\n<div id="fatal" role="alert" hidden></div>\n` +
  `<script type="module">\n${js.replace(/<\/script/gi, '<\\/script')}\n</script>\n`;
writeFileSync(out, page);
rmSync(dir, { recursive: true, force: true });
console.log(`${out}: ${(page.length / 1024).toFixed(0)} KB`);
