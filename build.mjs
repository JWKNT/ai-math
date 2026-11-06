import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { renderAiMath } from './lib/pages.mjs';

const root = new URL('./', import.meta.url);
const results = JSON.parse(await readFile(new URL('data/results.json', root), 'utf8'));
const bodies = Object.fromEntries(await Promise.all(results.map(async ({ slug }) => [slug, await readFile(new URL(`content/${slug}.html`, root), 'utf8')])));
for (const [path, html] of renderAiMath(results, bodies)) {
  const target = new URL(path, root);
  await mkdir(new URL('./', target), { recursive: true });
  await writeFile(target, html);
}
console.log(`Built the landing page and ${results.length} explainers.`);
