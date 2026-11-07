import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { renderAiMath } from './lib/pages.mjs';

const root = new URL('./', import.meta.url);
const results = JSON.parse(await readFile(new URL('data/results.json', root), 'utf8'));
const bodies = Object.fromEntries(await Promise.all(results.map(async ({ slug }) => [slug, await readFile(new URL(`content/${slug}.html`, root), 'utf8')])));
// A proof sketch is optional while the collection grows. The tests say which results need one.
const exists = url => access(url).then(() => true, () => false);
const proofs = {};
for (const { slug } of results) {
  const url = new URL(`content/proofs/${slug}.html`, root);
  if (await exists(url)) proofs[slug] = await readFile(url, 'utf8');
}
for (const [path, html] of renderAiMath(results, bodies, proofs)) {
  const target = new URL(path, root);
  await mkdir(new URL('./', target), { recursive: true });
  await writeFile(target, html);
}
console.log(`Built the landing page, ${results.length} explainers and ${Object.keys(proofs).length} proof sketches.`);
