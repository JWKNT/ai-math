import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { renderAiMath, typesetMath, mathChars, validateAiMath } from '../lib/pages.mjs';
import { APSP_EDGES, BUTTERFLY_DIGITS, EHRHART_TRIANGLE, ES_EDGES, ES_TREE, PETERSEN_COVER, PETERSEN_EDGES, SENDOV_ZEROS, UG_CONSTRAINTS, UG_VALUES, ZETA_ZEROS, addPositions, butterflyRounds, deltoidNeedle, deltoidPoint, figures, fishnetGraph, k5Color, paleyMatrix, rangePoint, sendovCritical } from '../lib/figures.mjs';

const root = new URL('../', import.meta.url);
const results = JSON.parse(await readFile(new URL('data/results.json', root), 'utf8'));
const bodies = Object.fromEntries(await Promise.all(results.map(async ({ slug }) => [slug, await readFile(new URL(`content/${slug}.html`, root), 'utf8')])));
const pages = renderAiMath(results, bodies);
const pageOf = slug => pages.find(([path]) => path === `${slug}/index.html`)[1];
const articleOf = slug => pageOf(slug).split('<article')[1].split('</article>')[0];

test('the committed pages are the deterministic build of the data and bodies', async () => {
  for (const [path, html] of pages) assert.equal(await readFile(new URL(path, root), 'utf8'), html, `Run node build.mjs after changing ${path}.`);
  assert.deepEqual(pages, renderAiMath(results, bodies));
});

test('the landing page is a list of titles and nothing else', () => {
  const landing = pages[0][1], main = landing.split('<main')[1];
  assert.deepEqual([...landing.matchAll(/<a class="ai-math-result" href="([^"]+)\/">/g)].map(m => m[1]), results.map(r => r.slug));
  assert.match(landing, /<link rel="canonical" href="https:\/\/jehlp\.net\/ai-math\/">/);
  assert.match(landing, /<h1 class="site-title">AI Math Results<\/h1>/);
  assert.match(landing, /href="assets\/styles\.css\?v=/);
  assert.doesNotMatch(main, /<p[ >]|<h2|<dl|<section/);
});

test('each explainer is a title, plain paragraphs and one margin figure', () => {
  for (const { slug, title } of results) {
    const page = pageOf(slug), article = articleOf(slug);
    assert.match(page, new RegExp(`<link rel="canonical" href="https://jehlp\\.net/ai-math/${slug}/">`));
    assert.match(page, /<span class="site-title">AI Math Results<\/span><\/div>\s*<nav aria-label="Site links"><a href="\.\.\/">All results<\/a>/);
    assert.match(page, /<img class="site-mark" src="https:\/\/jehlp\.net\/site-theme\/v2\/marks\/ai-math\.png" width="32" height="32" alt="">/);
    assert.match(page, /href="\.\.\/assets\/styles\.css\?v=/);
    assert.equal((page.match(/<h1[ >]/g) || []).length, 1, slug);
    assert.doesNotMatch(article, /<h[2-6][ >]|<dl|site-divider|class="lede"/, slug);
    assert.doesNotMatch(article, /\bSources\b|\bStatus\b|Peer review|Why the result matters/, slug);
    assert.equal((article.match(/class="ai-math-side"/g) || []).length, 1, slug);
    assert.ok(title.length < 40, slug);
  }
});

const plain = html => html.replace(/<svg[\s\S]*?<\/svg>/g, ' ').replace(/<math[\s\S]*?<\/math>/g, 'X').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/g, ' ').replace(/\s+/g, ' ').trim();
test('each explainer has 400 to 800 words', () => {
  for (const { slug } of results) {
    const words = plain(articleOf(slug)).split(' ').length;
    assert.ok(words >= 400 && words <= 800, `${slug} has ${words} words`);
  }
});

test('math becomes native MathML with no TeX, script or typesetter left in a page', () => {
  assert.match(typesetMath('\\(x &gt; 0\\)'), /^<math>.*&gt;.*<\/math>$/);
  assert.match(typesetMath('\\(x\\), and'), /^<span class="ai-math-nobreak"><math>.*<\/math>,<\/span> and$/);
  assert.match(typesetMath('\\[ x^2 \\]'), /^<div class="ui-equation" data-scroll-region data-scroll-noun="of the formula" aria-label="Formula"><math display="block"/);
  assert.match(mathChars('ℤ & <ℚ>'), /<span class="ui-math-char">ℤ<\/span> &amp; &lt;<span class="ui-math-char">ℚ<\/span>&gt;/);
  for (const [path, html] of pages) {
    assert.doesNotMatch(html, /\\\(|\\\[|\\\)|\\\]|\{\{/, path);
    assert.doesNotMatch(html, /katex|mathjax|temml\.(?:js|mjs)/i, path);
    for (const [, src] of html.matchAll(/<script src="([^"]+)"/g)) assert.match(src, /^https:\/\/jehlp\.net\/site-theme\/v2\/(?:theme|components)\.js/, path);
  }
});

test('validation rejects a heading, a missing figure, an unknown figure, a repeated slug and a broken link', () => {
  const slug = results[0].slug, one = [results[0]], good = bodies[slug].replace(/href="\.\.\/[^"]+\/"/g, 'href="https://example.com/"');
  assert.doesNotThrow(() => validateAiMath(one, { [slug]: good }));
  assert.throws(() => validateAiMath(one, { [slug]: `<h2>The question</h2>${good}` }), /has a heading/);
  assert.throws(() => validateAiMath(one, { [slug]: good.replace('class="ai-math-side"', '') }), /exactly one margin figure/);
  assert.throws(() => validateAiMath(one, { [slug]: good.replace('{{fig:shadow}}', '{{fig:nothing}}') }), /Unknown figure/);
  assert.throws(() => validateAiMath(one, { [slug]: `${good}{{source:x}}` }), /Unknown directive/);
  assert.throws(() => validateAiMath([results[0], results[0]], { [slug]: good }), /repeated slug/);
  assert.throws(() => validateAiMath(one, { [slug]: bodies[slug] }), /Broken link/);
  assert.throws(() => validateAiMath(one, { [slug]: `${good}<a href="../../${slug}/">x</a>` }), /Broken link/);
  assert.doesNotThrow(() => validateAiMath(one, { [slug]: `${good}<a href="../${slug}/">x</a>` }));
  assert.throws(() => validateAiMath(one, {}), /Missing body/);
});

// A screen, not a certification: STE counts names and formulas in its own way.
const sentences = text => text.replace(/\b(\d)\.(\d)/g, '$1_$2').split(/(?<=[.!?:])\s+(?=[A-Z"X(])/).filter(s => /\w/.test(s));
test('original prose stays within the writing policy limits', () => {
  const problems = [];
  for (const { slug } of results) {
    for (const [, , inner] of articleOf(slug).matchAll(/<(p|figcaption)(?: [^>]*)?>([\s\S]*?)<\/\1>/g)) {
      const block = plain(inner);
      if (block.includes(';')) problems.push(`${slug}: semicolon in "${block.slice(0, 70)}"`);
      if (block.includes('?')) problems.push(`${slug}: question in "${block.slice(0, 70)}"`);
      const parts = sentences(block);
      if (parts.length > 6) problems.push(`${slug}: ${parts.length} sentences in "${block.slice(0, 70)}"`);
      for (const part of parts) if (part.split(' ').length > 25) problems.push(`${slug}: ${part.split(' ').length} words in "${part}"`);
    }
  }
  assert.deepEqual(problems, []);
});

// Every page assumes the same baseline: whole and negative numbers, fractions, decimals, percentages,
// whole-number powers, square roots, variables, simple equations, points on a grid, simple shapes,
// and the words proof, theorem, conjecture and hypothesis. A reader can land on any page from a link, so a
// page defines each other term that it uses.
const withoutLinks = html => html.replace(/href="[^"]*"/g, '');
const STANDARD_DEFINITIONS = [
  [/\bpolynomial/i, 'A <dfn>polynomial</dfn> is a formula that only adds and multiplies numbers and variables'],
  [/\bmatri(?:x|ces)\b/i, 'A <dfn>matrix</dfn> is a table of numbers'],
  [/\bcomplex number/i, 'A <dfn>complex number</dfn> has the form \\(a + bi\\), where \\(i^2 = -1\\). It is a point on a flat map, with \\(a\\) across and \\(b\\) up.'],
  [/\bvertices\b/i, 'A <dfn>graph</dfn> is a set of dots, called vertices, joined by lines, called edges.'],
  [/\bfunctions?\b/i, 'A <dfn>function</dfn> is a rule that gives an output for each input.'],
  [/\bLean\b/, 'a computer program that checks each step of a proof'],
  [/\bdimensions\b/i, /\bpoint(?: in \S+ dimensions)? is a list of\b/],
];
// One word for each idea: whole number, fraction, method, paper, chance, fixed number and limit.
const OFF_STANDARD = /\b(?:letters|integers?|rational|coefficients?|algorithms?|manuscripts?|preprints?|probability|constants?|bounds?)\b/i;

test('every page stands alone on one baseline, with one set of definitions and words', () => {
  const problems = [];
  for (const { slug, description } of results) {
    const body = withoutLinks(bodies[slug]);
    for (const [use, definition] of STANDARD_DEFINITIONS) {
      const defined = typeof definition === 'string' ? body.includes(definition) : definition.test(body);
      if (use.test(body) && !defined) problems.push(`${slug} uses ${use} without the standard definition`);
    }
    // The figure labels and the page description count too: readers meet them in screen readers and search results.
    for (const text of [withoutLinks(articleOf(slug)).replace(/<math[\s\S]*?<\/math>/g, ' '), description]) {
      const word = text.match(OFF_STANDARD);
      if (word) problems.push(`${slug} says "${word[0]}"`);
    }
    const crowded = body.match(/[a-z)]\.(?:<a\b|<dfn>|[A-Z])/);
    if (crowded) problems.push(`${slug} has no space after a sentence: ${crowded[0]}`);
  }
  assert.deepEqual(problems, []);
});

// Exact checks for the calculations that the pages quote. Each quoted number must appear on its page.
const quotes = (slug, ...values) => { for (const value of values) assert.ok(bodies[slug].includes(value), `${slug} quotes ${value}`); };
const gcd = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) [a, b] = [b, a % b]; return a; };
class Q {
  constructor(n, d = 1n) { const g = gcd(n, d) * (d < 0n ? -1n : 1n); this.n = n / g; this.d = d / g; }
  static of(a, b = 1) { return new Q(BigInt(a), BigInt(b)); }
  add(o) { return new Q(this.n * o.d + o.n * this.d, this.d * o.d); }
  sub(o) { return new Q(this.n * o.d - o.n * this.d, this.d * o.d); }
  mul(o) { return new Q(this.n * o.n, this.d * o.d); }
  pow(k) { return k ? this.mul(this.pow(k - 1)) : Q.of(1); }
  eq(o) { return this.n === o.n && this.d === o.d; }
}
const isqrt = n => { let x = n, y = (x + 1n) / 2n; while (y < x) { x = y; y = (x + n / x) / 2n; } return x; };

test('Diophantine page: the sizes and the worked tests', () => {
  // The published equation has variable 0 and 12,503 more. Its largest coefficient is below 2^80.
  assert.equal(12503 + 1, 12504);
  const largest = 685783949153203534233601n;
  assert.equal(String(largest).length, 24);
  assert.ok(largest < 2n ** 80n);
  assert.ok(Q.of(3, 4).mul(Q.of(4, 3)).eq(Q.of(1)));
  assert.ok(Q.of(3, 2).pow(2).eq(Q.of(9, 4)));
  quotes('z-diophantine-in-q', '12,504 variables', '12,503 extra variables', 'highest power is 4', '135,721 terms', '24 digits', '11,939', '9/4');
});

test('ETH page: the settings, the years and the threshold', () => {
  assert.equal(2 ** 10, 1024);
  const settings = 2n ** 100n;
  assert.equal(String(settings).length, 31);
  assert.equal(String(settings).slice(0, 3), '126');
  assert.equal(Math.round(Number(settings) / 1e18 / (365.25 * 86400) / 1e4) * 1e4, 40000);
  quotes('exponential-time-hypothesis', '1,024', '1.27 \\times 10^{30}', '31 digits', '40,000 years', '10^{10\\,000}');
});

test('Quasi-Riemann page: the zeros, the prime counts, the estimate and the scale', () => {
  assert.deepEqual(ZETA_ZEROS.map(z => z.toFixed(2)), ['14.13', '21.02', '25.01', '30.42', '32.94']);
  const N = 1000000, composite = new Uint8Array(N + 1), byEnding = {};
  let total = 0, hundred = 0, thousand = 0;
  for (let i = 2; i <= N; i++) {
    if (composite[i]) continue;
    total++; if (i <= 100) hundred++; if (i <= 1000) thousand++;
    byEnding[i % 10] = (byEnding[i % 10] ?? 0) + 1;
    for (let j = i * i; j <= N; j += i) composite[j] = 1;
  }
  assert.deepEqual([hundred, thousand, total], [25, 168, 78498]);
  assert.deepEqual([byEnding[1], byEnding[3], byEnding[7], byEnding[9]], [19617, 19665, 19621, 19593]);
  // li(x), from the series gamma + ln ln x + sum of (ln x)^k / (k k!). It rounds to 78,628.
  const lnx = Math.log(N); let li = 0.57721566490153286 + Math.log(lnx), term = 1;
  for (let k = 1; k < 200; k++) { term *= lnx / k; li += term / k; }
  assert.equal(Math.round(li), 78628);
  assert.equal(78628 - 78498, 130);
  let zeta = 0; for (let k = 1; k <= 1e6; k++) zeta += 1 / k ** 2;
  assert.equal(zeta.toFixed(3), '1.645');
  assert.equal(Math.round(N ** .5), 1000);
  assert.equal(Math.round(N ** (7 / 8) / 1000), 178);
  // The number of zeros up to the checked height 3e12, by the Riemann-von Mangoldt formula.
  const T = 3e12, zeros = T / (2 * Math.PI) * (Math.log(T / (2 * Math.PI)) - 1);
  assert.equal(Math.round(zeros / 1e12), 12);
  quotes('quasi-riemann-hypothesis', '78,498', '78,628', '19,617', '19,665', '19,621', '19,593', '178,000', '12 trillion');
});

test('Kakeya page: every drawn needle has length one, and the areas and box counts hold', () => {
  for (let k = 0; k < 12; k++) {
    const [p, q] = deltoidNeedle(.25, k * Math.PI / 6 + .13);
    assert.ok(Math.abs(Math.hypot(p[0] - q[0], p[1] - q[1]) - 1) < 1e-12);
    for (const end of [p, q]) {
      let best = Infinity;
      for (let i = 0; i < 20000; i++) { const [x, y] = deltoidPoint(.25, i * 2 * Math.PI / 20000); best = Math.min(best, Math.hypot(x - end[0], y - end[1])); }
      assert.ok(best < 1e-3, `end point of needle ${k} is ${best} from the curve`);
    }
  }
  assert.equal((Math.log(2) / Math.log(3)).toFixed(2), '0.63');
  assert.equal((Math.PI / 4).toFixed(3), '0.785');
  assert.equal((Math.PI / 8).toFixed(3), '0.393');
  quotes('kakeya-conjecture', '0.785', '0.393', '0.63');
});

test('Jacobian page: the examples in the text', () => {
  const shear = ([x, y]) => [x + y ** 2, y], undo = ([u, v]) => [u - v ** 2, v];
  assert.deepEqual(shear([1, 2]), [5, 2]);
  assert.deepEqual(undo([5, 2]), [1, 2]);
  const fold = ([x, y]) => [x ** 2, y];
  assert.deepEqual(fold([1, 5]), fold([-1, 5]));
  quotes('jacobian-conjecture', '(1, 2)', '(5, 2)', '(-1, 5)');
});

test('Jacobian page: three inputs have one output', () => {
  const F = (x, y, z) => {
    const one = Q.of(1), xy = x.mul(y), s = one.add(xy), t = Q.of(4).add(Q.of(3).mul(xy));
    return [
      s.pow(3).mul(z).add(y.pow(2).mul(s).mul(t)),
      y.add(Q.of(3).mul(x).mul(s.pow(2)).mul(z)).add(Q.of(3).mul(x).mul(y.pow(2)).mul(t)),
      Q.of(2).mul(x).sub(Q.of(3).mul(x.pow(2)).mul(y)).sub(x.pow(3).mul(z)),
    ];
  };
  const output = [Q.of(-1, 4), Q.of(0), Q.of(0)];
  for (const input of [[Q.of(0), Q.of(0), Q.of(-1, 4)], [Q.of(1), Q.of(-3, 2), Q.of(13, 2)], [Q.of(-1), Q.of(3, 2), Q.of(13, 2)]]) {
    F(...input).forEach((value, i) => assert.ok(value.eq(output[i]), `coordinate ${i}`));
  }
});

test('Jacobian page: the determinant is -2 as a polynomial identity', () => {
  // Polynomials in x, y, z as a map from exponents to integer coefficients.
  const tidy = map => new Map([...map].filter(([, c]) => c !== 0n));
  const key = (i, j, k) => `${i},${j},${k}`, parts = text => text.split(',').map(Number);
  const c = n => new Map([[key(0, 0, 0), BigInt(n)]]);
  const add = (a, b, sign = 1n) => { const out = new Map(a); for (const [m, v] of b) out.set(m, (out.get(m) ?? 0n) + sign * v); return tidy(out); };
  const mul = (...factors) => factors.reduce((a, b) => { const out = new Map(); for (const [m, v] of a) for (const [n, w] of b) { const [p, q] = [parts(m), parts(n)], k = key(p[0] + q[0], p[1] + q[1], p[2] + q[2]); out.set(k, (out.get(k) ?? 0n) + v * w); } return tidy(out); });
  const diff = (a, axis) => { const out = new Map(); for (const [m, v] of a) { const e = parts(m); if (!e[axis]) continue; const power = BigInt(e[axis]); e[axis] -= 1; const k = key(...e); out.set(k, (out.get(k) ?? 0n) + v * power); } return tidy(out); };
  const x = new Map([[key(1, 0, 0), 1n]]), y = new Map([[key(0, 1, 0), 1n]]), z = new Map([[key(0, 0, 1), 1n]]);
  const s = add(c(1), mul(x, y)), t = add(c(4), mul(c(3), x, y));
  const F = [
    add(mul(s, s, s, z), mul(y, y, s, t)),
    add(add(y, mul(c(3), x, s, s, z)), mul(c(3), x, y, y, t)),
    add(add(mul(c(2), x), mul(c(3), x, x, y), -1n), mul(x, x, x, z), -1n),
  ];
  const J = F.map(f => [0, 1, 2].map(axis => diff(f, axis)));
  const minor = (a, b, d, e) => add(mul(a, e), mul(b, d), -1n);
  const det = add(add(mul(J[0][0], minor(J[1][1], J[1][2], J[2][1], J[2][2])), mul(J[0][1], minor(J[1][0], J[1][2], J[2][0], J[2][2])), -1n), mul(J[0][2], minor(J[1][0], J[1][1], J[2][0], J[2][1])));
  assert.deepEqual([...det], [[key(0, 0, 0), -2n]]);
});

test('Unit distance page: small arrangements, neighbor counts and the per-dot rates', () => {
  const representations = m => { let count = 0; for (let p = -300; p <= 300; p++) for (let q = -300; q <= 300; q++) if (p * p + q * q === m) count++; return count; };
  assert.deepEqual([25, 65, 1105].map(representations), [12, 16, 32]);
  assert.equal((figures['unit-grid']().match(/class="fig-dot-accent"/g) || []).length, 12);
  const pairs = points => { let count = 0; points.forEach((a, i) => points.slice(i + 1).forEach(b => { if (Math.abs(Math.hypot(a[0] - b[0], a[1] - b[1]) - 1) < 1e-9) count++; })); return count; };
  const h = Math.sqrt(3) / 2;
  assert.equal(pairs([[0, 0], [1, 0], [.5, h]]), 3);
  assert.equal(pairs([[0, 0], [1, 0], [.5, h], [1.5, h]]), 5);
  assert.equal(pairs([[0, 0], [1, 0], [.5, h], [-.5, h], [-1, 0], [-.5, -h], [.5, -h]]), 12);
  assert.ok(Q.of(3, 5).pow(2).add(Q.of(4, 5).pow(2)).eq(Q.of(1)));
  assert.equal(Math.round(1e6 ** (4 / 3) / 1e6), 100);
  // The best spacing for a 1,000 by 1,000 grid: each displacement (p, q) occurs (W - |p|)(W - |q|) times.
  const W = 1000, totals = new Map();
  for (let p = -W + 1; p < W; p++) for (let q = -W + 1; q < W; q++) { const m = p * p + q * q; if (m) totals.set(m, (totals.get(m) ?? 0) + (W - Math.abs(p)) * (W - Math.abs(q))); }
  let most = 0; for (const total of totals.values()) most = Math.max(most, total);
  assert.equal(Math.round(most / 2 / W ** 2), 26);
  quotes('unit-distance-problem', '100 million', 'about 26 per dot', '1/\\sqrt{65}', '1/\\sqrt{1105}');
});

test('Hilbert page: the worked equations and the table entries', () => {
  assert.ok(Q.of(3, 5).pow(2).add(Q.of(4, 5).pow(2)).eq(Q.of(1)));
  assert.ok(Q.of(17, 21).pow(3).add(Q.of(37, 21).pow(3)).eq(Q.of(6)));
  const x = new Q(375494528127162193105504069942092792346201n, 6215987776871505425463220780697238044100n);
  const y2 = x.pow(3).add(Q.of(877).mul(x));
  assert.equal(isqrt(y2.n) ** 2n, y2.n);
  assert.equal(isqrt(y2.d) ** 2n, y2.d);
  assert.equal(x.n.toString().length, 42);
  assert.equal((-80538738812075974n) ** 3n + 80435758145817515n ** 3n + 12602123297335631n ** 3n, 42n);
  assert.equal(String(80538738812075974n).length, 17);
  assert.equal(3 ** 2 + 4 ** 2, 25);
  // Cubes modulo 9 are 0, 1 or 8, so two cubes cannot sum to 6 in the integers.
  for (let a = 0; a < 9; a++) for (let b = 0; b < 9; b++) assert.notEqual((a ** 3 + b ** 3) % 9, 6);
  quotes('hilberts-tenth-problem', '17-digit', '42 digits');
});

test('Unique Games page: the clock sum, the walk through the figure and the chain probability', () => {
  assert.equal(UG_CONSTRAINTS.length, 8);
  assert.equal(UG_CONSTRAINTS.filter(([from, to, k]) => (UG_VALUES[from] + k) % 5 === UG_VALUES[to]).length, 8);
  assert.equal((3 + 4) % 5, 2);
  assert.deepEqual([UG_VALUES.a, UG_VALUES.b, UG_VALUES.c, UG_VALUES.d, UG_VALUES.e], [0, 2, 3, 2, 0]);
  assert.equal((1 - .99 ** 100).toFixed(2), '0.63');
  quotes('unique-games', '\\(3 + 4 = 2\\)', '\\(a = 0\\) gives \\(b = 2\\), then \\(c = 3\\), \\(d = 2\\) and \\(e = 0\\)', '63%', '87.8%');
});

test('Navier–Stokes page: the model satisfies its equation, and the table is right', () => {
  const y = t => 1 / (1 - t), h = 1e-6;
  for (const t of [0, .5, .9]) assert.ok(Math.abs((y(t + h) - y(t - h)) / (2 * h) - y(t) ** 2) < 1e-2);
  assert.deepEqual([0, .5, .9, .99, .999].map(t => Math.round(y(t))), [1, 2, 10, 100, 1000]);
  quotes('navier-stokes', '<td>1000</td>', '<td>Infinite</td>');
});

test('Hadamard page: the drawn matrices, the doubling step and the quoted orders hold', () => {
  const dot = (a, b) => a.reduce((sum, v, i) => sum + v * b[i], 0);
  const isHadamard = m => m.every((row, i) => m.every((other, j) => dot(row, other) === (i === j ? m.length : 0)));
  const four = [[1, 1, 1, 1], [1, -1, 1, -1], [1, 1, -1, -1], [1, -1, -1, 1]];
  assert.ok(isHadamard(four));
  for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) assert.equal(four[i].filter((v, c) => v === four[j][c]).length, 2);
  assert.deepEqual([0, 1, 2, 3].filter(c => four[0][c] === four[1][c]), [0, 2], 'the first two rows agree in positions 1 and 3');
  const doubled = [...four.map(row => [...row, ...row]), ...four.map(row => [...row, ...row.map(v => -v)])];
  assert.equal(doubled.length, 8);
  assert.ok(isHadamard(doubled));
  const twelve = paleyMatrix();
  assert.equal(twelve.length, 12);
  assert.ok(isHadamard(twelve));
  assert.ok(twelve.every(row => row.every(v => v === 1 || v === -1)));
  assert.equal(twelve[0].filter((v, j) => v === twelve[1][j]).length, 6);
  // Three orthogonal rows split the columns into four groups of equal size.
  const groups = new Map();
  for (let j = 0; j < 12; j++) { const key = [twelve[0][j], twelve[1][j], twelve[2][j]].join(); groups.set(key, (groups.get(key) ?? 0) + 1); }
  assert.deepEqual([...groups.values()].sort(), [3, 3, 3, 3]);
  assert.equal(668 ** 2, 446224);
  assert.equal(String(2n ** 446224n).length, 134327);
  const orders = [668, 716, 892, 1132, 1244, 1388, 1436, 1676, 1772, 1916, 1948, 1964];
  assert.ok(orders.every(n => n % 4 === 0 && n < 2000));
  assert.equal(orders.length, 12);
  assert.equal(4 * 599, 2396);
  for (const n of orders) quotes('hadamard-matrices', String(n));
  quotes('hadamard-matrices', '446,224', '134,327', '2396');
});

test('Non-sofic page: the string operations obey the stated rules', () => {
  // Each operation maps a string of bits to a string, or to null for nothing.
  const s = bit => w => (w === null ? null : bit + w);
  const t = bit => w => (w !== null && w.startsWith(bit) ? w.slice(1) : null);
  for (const w of ['', '0', '1', '01', '10', '110', '0011']) for (const i of ['0', '1']) assert.equal(t(i)(s(i)(w)), w);
  assert.equal(s('0')(t('0')('1')), null, 'a string that starts with 1 is lost');
  assert.equal((figures.cycle().match(/class="fig-dot"/g) || []).length, 12);
  for (let k = 1; k < 12; k++) for (let x = 0; x < 12; x++) assert.notEqual((x + k) % 12, x);
});

test('3SUM page: the example, the walk through the list and the rates', () => {
  assert.equal(-7 + 2 + 5, 0);
  const list = [-3, 2, 5, 8, 11], walk = [];
  let low = 0, high = list.length - 1;
  while (low < high) { const sum = list[low] + list[high]; walk.push(sum); if (sum === 7) break; if (sum > 7) high--; else low++; }
  assert.deepEqual(walk, [8, 5, 10, 7]);
  assert.deepEqual([...bodies['subquadratic-3sum'].matchAll(/ and \d+<\/td><td>(\d+)<\/td>/g)].map(m => Number(m[1])), walk, 'the table shows the walk');
  assert.equal(1000 * 999 * 998 / 6, 166167000);
  assert.equal(((1 - 1e9 ** -.0008) * 100).toFixed(1), '1.6');
  quotes('subquadratic-3sum', '\\(-7, -3, 2, 5, 8, 11\\)', '166 million', '1.6%');
});

test('Shortest paths page: the route, the product and the rate agree', () => {
  const names = ['a', 'b', 'c', 'd'], n = 4, index = Object.fromEntries(names.map((v, i) => [v, i]));
  const weights = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 0 : Infinity)));
  for (const [from, to, w] of APSP_EDGES) weights[index[from]][index[to]] = w;
  const floyd = weights.map(row => [...row]);
  for (let k = 0; k < n; k++) for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) floyd[i][j] = Math.min(floyd[i][j], floyd[i][k] + floyd[k][j]);
  assert.equal(weights[0][2], 7);
  assert.equal(floyd[0][2], 3);
  const star = (A, B) => A.map((_, i) => A.map((_, j) => Math.min(...A.map((_, k) => A[i][k] + B[k][j]))));
  assert.equal(star(weights, weights)[0][2], 3, 'two roads give the cheaper route');
  assert.deepEqual(star(star(weights, weights), star(weights, weights)), floyd, 'repeated rounds give all the costs');
  assert.equal(APSP_EDGES.length, 6);
  assert.ok((1 - 1e6 ** -.0005) * 100 < 1);
  quotes('all-pairs-shortest-paths', 'less than 1%', 'six one-way roads');
});

test('Quantum page: the game values and the ten-round expectation are as stated', () => {
  const bits = [0, 1];
  let chsh = 0;
  for (const a0 of bits) for (const a1 of bits) for (const b0 of bits) for (const b1 of bits) {
    let wins = 0;
    for (const x of bits) for (const y of bits) if (((x ? a1 : a0) + (y ? b1 : b0)) % 2 === (x & y)) wins++;
    chsh = Math.max(chsh, wins / 4);
  }
  assert.equal(chsh, .75);
  assert.equal((Math.cos(Math.PI / 8) ** 2).toFixed(3), '0.854');
  // One copy of Feige's game: an answer is a named player (0 Alice, 1 Bob) and a bit.
  const answers = [[0, 0], [0, 1], [1, 0], [1, 1]];
  const wins = (x, y, a, b) => a[0] === b[0] && a[1] === b[1] && a[1] === (a[0] === 0 ? x : y);
  let single = 0;
  for (const a0 of answers) for (const a1 of answers) for (const b0 of answers) for (const b1 of answers) {
    let count = 0;
    for (const x of bits) for (const y of bits) if (wins(x, y, x ? a1 : a0, y ? b1 : b0)) count++;
    single = Math.max(single, count / 4);
  }
  assert.equal(single, .5);
  // The plan in the table for two rounds.
  let both = 0;
  for (const x1 of bits) for (const x2 of bits) for (const y1 of bits) for (const y2 of bits) {
    if (wins(x1, y1, [0, x1], [0, y2]) && wins(x2, y2, [1, x1], [1, y2])) { both++; assert.equal(x1, y2); }
  }
  assert.equal(both / 16, .5);
  assert.equal((.75 ** 10 * 100).toFixed(1), '5.6');
  quotes('quantum-parallel-repetition', '5.6%', '85.4%');
});

test('Ramsey page: the small facts, the table of limits and the product coloring hold', () => {
  const triangleFree = color => { for (let i = 0; i < 5; i++) for (let j = i + 1; j < 5; j++) for (let k = j + 1; k < 5; k++) if (color(i, j) === color(i, k) && color(i, j) === color(j, k)) return false; return true; };
  assert.ok(triangleFree(k5Color), 'the drawn coloring has no one-color triangle');
  const edges = []; for (let i = 0; i < 6; i++) for (let j = i + 1; j < 6; j++) edges.push([i, j]);
  const position = new Map(edges.map(([i, j], e) => [`${i},${j}`, e]));
  let bad = 0;
  for (let mask = 0; mask < 2 ** 15; mask++) {
    let found = false;
    for (let i = 0; i < 6 && !found; i++) for (let j = i + 1; j < 6 && !found; j++) for (let k = j + 1; k < 6 && !found; k++) {
      const [p, q, r] = [position.get(`${i},${j}`), position.get(`${i},${k}`), position.get(`${j},${k}`)].map(e => (mask >> e) & 1);
      if (p === q && q === r) found = true;
    }
    if (!found) bad++;
  }
  assert.equal(bad, 0, 'every two-coloring on six points has a one-color triangle');
  assert.equal((380 ** .2).toFixed(2), '3.28');
  const factorial = k => { let out = 1; for (let i = 2; i <= k; i++) out *= i; return out; };
  const short = value => value.toExponential(1).replace(/e\+(\d+)/, ' \\times 10^{$1}');
  for (const k of [10, 20, 30]) quotes('multicolor-triangle-ramsey', `<tr><td>${k}</td><td>\\(${short(380 ** (k / 5))}\\)</td><td>\\(${short(Math.E * factorial(k))}\\)</td></tr>`);
  // Two five-point colorings combine into 25 points and 4 colors with no one-color triangle.
  const color = (a, b) => (Math.floor(a / 5) === Math.floor(b / 5) ? k5Color(a % 5, b % 5) : k5Color(Math.floor(a / 5), Math.floor(b / 5)) + 2);
  for (let a = 0; a < 25; a++) for (let b = a + 1; b < 25; b++) for (let c = b + 1; c < 25; c++) assert.ok(!(color(a, b) === color(a, c) && color(a, b) === color(b, c)), `${a} ${b} ${c}`);
});

test('Erdős–Sós page: the figure and the examples hold', () => {
  assert.equal((2 * ES_EDGES.length / 6).toFixed(2), '3.33');
  const adjacent = new Set(ES_EDGES.flatMap(([a, b]) => [`${a},${b}`, `${b},${a}`]));
  const contains = tree => {
    const place = map => {
      if (map.length === 5) return tree.every(([a, b]) => adjacent.has(`${map[a]},${map[b]}`));
      for (let v = 0; v < 6; v++) if (!map.includes(v) && place([...map, v])) return true;
      return false;
    };
    return place([]);
  };
  // The line, the star and the third tree with 5 vertices all fit in the graph with average degree above 3.
  for (const tree of [[[0, 1], [1, 2], [2, 3], [3, 4]], [[0, 1], [0, 2], [0, 3], [0, 4]], [[0, 1], [0, 2], [0, 3], [3, 4]]]) assert.ok(contains(tree));
  assert.equal(ES_TREE.length, 4);
  assert.equal(new Set(ES_TREE.flat()).size, 5);
  for (const [a, b] of ES_TREE) assert.ok(adjacent.has(`${a},${b}`));
  assert.ok(2 * 100 / 101 < 2, 'one center joined to 100 others');
  quotes('erdos-sos', 'joined to 100', 'average is just below 2', '\\(2t - 2\\)');
});

test('Cycle double cover page: the counts, the cover and the absence of a bridge hold', () => {
  assert.equal(6 * 4, 2 * 12);
  assert.equal(PETERSEN_EDGES.length, 15);
  assert.equal(new Set(PETERSEN_EDGES.flat()).size, 10);
  const key = (a, b) => (a < b ? `${a},${b}` : `${b},${a}`), edges = new Set(PETERSEN_EDGES.map(([a, b]) => key(a, b))), uses = new Map();
  assert.equal(PETERSEN_COVER.length, 6);
  for (const cycle of PETERSEN_COVER) {
    assert.equal(new Set(cycle).size, 5);
    cycle.forEach((v, i) => { const edge = key(v, cycle[(i + 1) % 5]); assert.ok(edges.has(edge), edge); uses.set(edge, (uses.get(edge) ?? 0) + 1); });
  }
  for (const edge of edges) assert.equal(uses.get(edge), 2, edge);
  for (const removed of edges) {
    const seen = new Set([0]), queue = [0];
    while (queue.length) { const v = queue.pop(); for (const [a, b] of PETERSEN_EDGES) { if (key(a, b) === removed) continue; const w = a === v ? b : b === v ? a : null; if (w !== null && !seen.has(w)) { seen.add(w); queue.push(w); } } }
    assert.equal(seen.size, 10, `${removed} is a bridge`);
  }
  quotes('cycle-double-cover', '\\(24 = 2 \\times 12\\)', '\\(6 \\times 5 = 30 = 2 \\times 15\\)');
});

test('Köthe page: the actions in the table and the power rule hold', () => {
  const A = ([, y]) => [y, 0], B = ([x]) => [0, x], sum = ([x, y]) => [y, x], BA = pair => B(A(pair)), pair = [3, 7];
  assert.deepEqual(A(A(pair)), [0, 0]);
  assert.deepEqual(B(B(pair)), [0, 0]);
  assert.deepEqual(sum(pair), [A(pair)[0] + B(pair)[0], A(pair)[1] + B(pair)[1]]);
  assert.deepEqual(sum(sum(pair)), pair);
  assert.deepEqual(BA(pair), [0, 7]);
  assert.deepEqual(BA(BA(pair)), BA(pair));
  // A table with one column, with entries from a nil system: here strictly upper triangular 3 by 3 matrices.
  const mul = (a, b) => a.map(row => b[0].map((_, j) => row.reduce((s, v, k) => s + v * b[k][j], 0)));
  const add = (a, b) => a.map((row, i) => row.map((v, j) => v + b[i][j]));
  const O = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], x = [[0, 1, 2], [0, 0, 3], [0, 0, 0]], y = [[0, 4, 5], [0, 0, 6], [0, 0, 0]];
  const table = ([a, b, c, d], [e, f, g, h]) => [add(mul(a, e), mul(b, g)), add(mul(a, f), mul(b, h)), add(mul(c, e), mul(d, g)), add(mul(c, f), mul(d, h))];
  const left = [x, O, y, O], right = [O, x, O, y];
  const x2 = mul(x, x), y2 = mul(y, y);
  assert.deepEqual(table(left, left), [x2, O, mul(y, x), O], 'left column x^2, y x');
  assert.deepEqual(table(table(left, left), left), [mul(x2, x), O, mul(y, x2), O], 'left column x^3, y x^2');
  assert.deepEqual(table(table(table(left, left), left), left), [O, O, O, O], 'the power reaches zero with x');
  assert.deepEqual(table(table(table(right, right), right), right), [O, O, O, O], 'the right column works the same way');
  assert.deepEqual(table(right, right), [O, mul(x, y), O, y2]);
  quotes('kothe-conjecture', 'b^2 + c &amp; bc \\\\ b &amp; c', '\\(x^k, y x^{k-1}\\)');
});

test('Sendov page: the sample polynomial and the limiting case hold', () => {
  const times = ([a, b], [c, d]) => [a * c - b * d, a * d + b * c], minus = ([a, b], [c, d]) => [a - c, b - d];
  const [p, q, r] = SENDOV_ZEROS, critical = sendovCritical();
  for (const z of critical) {
    const [dp, dq, dr] = [minus(z, p), minus(z, q), minus(z, r)];
    const slope = [times(dq, dr), times(dp, dr), times(dp, dq)].reduce((s, t) => [s[0] + t[0], s[1] + t[1]], [0, 0]);
    assert.ok(Math.hypot(...slope) < 1e-9, 'a critical point is a zero of the derivative');
  }
  for (const z of SENDOV_ZEROS) {
    assert.ok(Math.hypot(...z) <= 1 + 1e-12, 'each zero lies in the unit disk');
    assert.ok(Math.min(...critical.map(c => Math.hypot(...minus(z, c)))) <= 1, 'each zero has a critical point within distance 1');
  }
  assert.ok(critical.some(c => Math.hypot(...minus(p, c)) < 1), 'the dashed circle holds a critical point');
  for (let n = 2; n <= 12; n++) for (let k = 0; k < n; k++) assert.ok(Math.abs(Math.hypot(Math.cos(2 * Math.PI * k / n), Math.sin(2 * Math.PI * k / n)) - 1) < 1e-12);
  quotes('sendov-conjecture', '\\(p\'(x) = 2x\\)', 'about 15,000 lines', 'about 90,000', 'up to 8');
});

test('Crouzeix page: the worked matrix, the factor 2 and the figure hold', () => {
  // The vector (cos t, e^{ip} sin t) gives x*Ax = 100 cos t sin t e^{ip} for the matrix with rows (0, 100) and (0, 0).
  let radius = 0, stretch = 0;
  for (let i = 0; i <= 1000; i++) { const t = i * Math.PI / 2000; radius = Math.max(radius, 100 * Math.cos(t) * Math.sin(t)); stretch = Math.max(stretch, 100 * Math.sin(t)); }
  assert.ok(Math.abs(radius - 50) < 1e-9);
  assert.ok(Math.abs(stretch - 100) < 1e-9);
  assert.equal(Math.round(stretch) / Math.round(radius), 2);
  // The figure: x*Ax calculated directly for the matrix with rows (1, 1.5) and (0, -1).
  for (let i = 0; i <= 24; i++) for (let j = 0; j < 24; j++) {
    const t = i * Math.PI / 48, p = j * Math.PI / 12, [c, s] = [Math.cos(t), Math.sin(t)], [u, v] = [Math.cos(p), Math.sin(p)];
    const re = c * (c + 1.5 * u * s) + s * (u * (-u * s) + v * (-v * s)), im = c * 1.5 * v * s + s * (u * (-v * s) - v * (-u * s));
    const [x, y] = rangePoint(t, p);
    assert.ok(Math.abs(x - re) < 1e-12 && Math.abs(y - im) < 1e-12, 'the formula in the figure is x*Ax');
    assert.ok(Math.hypot(x - 1, y) + Math.hypot(x + 1, y) <= 2.5 + 1e-9, 'the point lies in the ellipse with foci 1 and -1');
  }
  assert.equal((1 + Math.SQRT2).toFixed(3), '2.414');
  quotes('crouzeix-conjecture', '\\((100y, 0)\\)', 'radius 50', '11.08', '2.414', '\\(\\|A\\| = 100\\)');
});

test('Ehrhart page: the triangle reaches the limit, and a lopsided triangle has no limit', () => {
  const [[a, b], [c, d], [e, f]] = EHRHART_TRIANGLE;
  assert.equal(Math.abs((c - a) * (f - b) - (e - a) * (d - b)) / 2, 9 / 2);
  assert.deepEqual([(a + c + e) / 3, (b + d + f) / 3], [0, 0]);
  const strictlyInside = (points, x, y) => {
    const sides = points.map(([px, py], i) => { const [qx, qy] = points[(i + 1) % 3]; return (qx - px) * (y - py) - (qy - py) * (x - px); });
    return sides.every(side => side > 0) || sides.every(side => side < 0);
  };
  const lattice = []; for (let x = -3; x <= 3; x++) for (let y = -3; y <= 3; y++) if (strictlyInside(EHRHART_TRIANGLE, x, y)) lattice.push([x, y]);
  assert.deepEqual(lattice, [[0, 0]]);
  const limit = n => { let value = 1; for (let k = 1; k <= n; k++) value *= (n + 1) / k; return value; };
  assert.deepEqual([2, 3, 4, 10].map(n => limit(n).toFixed(2)), ['4.50', '10.67', '26.04', '7147.66']);
  assert.ok(Math.abs((1 + 1 / 101) ** 101 - 2.7) < .01, 'the growth factor for each new dimension');
  // The lopsided triangle, scaled by L so that every coordinate is a whole number.
  const L = 1000, scaled = [[0, -1], [-L * L, L], [L * L, L]], inside = [];
  for (let x = -L; x <= L; x++) for (const y of [-1, 0, 1]) if (strictlyInside(scaled, x * L, y * L)) inside.push([x, y]);
  assert.deepEqual(inside, [[0, 0]]);
  assert.ok(new Q(BigInt(L) * BigInt(L + 1), BigInt(L)).eq(Q.of(L).mul(Q.of(1).add(Q.of(1, L)))), 'its area is L + 1');
  quotes('ehrhart-volume', '\\(3^2 / 2 = 4.5\\)', '<td>10.67</td>', '<td>26.04</td>', '<td>7,147.66</td>', '<td>1,024</td>', '\\(L + 1\\)');
});

test('Borsuk page: the count, the disk and the graph parameters hold', () => {
  assert.equal(64 * 5, 320);
  assert.equal(Math.ceil(321 / 5), 65);
  assert.equal((Math.sqrt(3) / 2).toFixed(2), '0.87');
  // A strongly regular graph with parameters (416, 100, 36, 20) must satisfy k(k - l - 1) = (v - k - 1)m.
  assert.equal(100 * (100 - 36 - 1), (416 - 100 - 1) * 20);
  quotes('borsuk-dimension-63', '321 points', 'at most 5 points', '\\(64 \\times 5 = 320\\)', 'at least 65 pieces', '416 vertices', 'to 100 others');
  assert.ok(figures['borsuk-disk']().includes('>0.87<'));
});

test('Sphere packing page: the bases, the table and the shares hold', () => {
  const base = Math.sqrt(Math.E / (2 * Math.PI)), old = 2 ** -0.59905576;
  assert.equal(base.toFixed(4), '0.6577');
  assert.equal(Math.log2(1 / base).toFixed(4), '0.6044');
  assert.equal(old.toFixed(4), '0.6602');
  assert.equal(Math.round((old / base) ** 1000 / 10) * 10, 40);
  const factorial = n => { let out = 1; for (let k = 2; k <= n; k++) out *= k; return out; };
  const densities = [Math.PI / Math.sqrt(12), Math.PI / Math.sqrt(18), Math.PI ** 4 / 384, Math.PI ** 12 / factorial(12)];
  assert.deepEqual(densities.map(d => (d * 100).toPrecision(3)), ['90.7', '74.0', '25.4', '0.193']);
  // A ball of radius 1/2 against its unit box, in 2, 3 and 10 dimensions.
  assert.equal((Math.PI / 4 * 100).toFixed(1), '78.5');
  assert.equal((Math.PI / 6 * 100).toFixed(1), '52.4');
  assert.equal((Math.PI ** 5 / factorial(5) / 2 ** 10 * 100).toFixed(2), '0.25');
  // Touching disks of radius r in rows take up 2 sqrt(3) r^2 of area each.
  assert.equal((Math.PI / (2 * Math.sqrt(3)) * 100).toFixed(1), '90.7');
  for (const value of ['<td>90.7%</td>', '<td>74.0%</td>', '<td>25.4%</td>', '<td>0.19%</td>', '78.5%', '52.4%', '0.25%', '0.6602', '0.6577', 'about 40 times']) quotes('sphere-packing', value);
});

test('Multiplication page: the rounds, the divisors and the network', () => {
  // Three rounds of four butterflies on the digits of 31,415,926. The first output of the last round is their sum.
  const rounds = butterflyRounds(BUTTERFLY_DIGITS);
  assert.equal(BUTTERFLY_DIGITS.join(''), '31415926');
  assert.deepEqual(rounds, [[8, 10, 6, 7, -2, -8, 2, -5], [14, 17, 2, 3, 0, -13, -4, -3], [31, -3, 5, -1, -13, 13, -7, -1]]);
  assert.equal(rounds[2][0], BUTTERFLY_DIGITS.reduce((a, b) => a + b));
  assert.deepEqual([rounds[0][0], rounds[0][4]], [3 + 5, 3 - 5]);
  assert.equal(3 * 4, 12);
  // The logarithms and the example divisor.
  assert.deepEqual([2 ** 3, 2 ** 10, 2 ** 4], [8, 1024, 16]);
  assert.equal(Math.round(Math.log2(1e9)), 30);
  // The Lean theorem's value is 4222422970 / 2^46. The reviewed community value is 781451 / 250000000.
  const lean = 4222422970 / 2 ** 46, community = 781451 / 250000000;
  assert.equal(lean.toFixed(5), '0.00006');
  assert.equal(community.toFixed(4), '0.0031');
  assert.equal(Math.floor(1 / lean), 16665);
  assert.equal(Math.round(1 / community), 320);
  // The universe has about 10^80 atoms. Even the smallest entry in the table is beyond that.
  assert.equal(Math.ceil(Math.log2(1e80)), 266);
  // The network has 14,336 data lists, 73 rounds and 1,041,408 child calls.
  const perList = 1041408 / 14336;
  assert.equal(14336 * 73, 1046528);
  assert.equal(perList.toFixed(2), '72.64');
  assert.equal((Math.log(perList) / Math.log(73)).toFixed(4), '0.9989');
  quotes('multiplication-below-n-log-n', '31,415,926', '10^{18}', '30 billion', '2^{-182}', '2^{2^{182}}', '0.00006', '2^{16{,}665}', '0.0031', '2^{320}', '2^{266}', '14,336', '1,046,528', '1,041,408', '72.64', 'r^{0.9989}');
});

test('Connes page: the worked sums, the Fourier lists and the carry hold', () => {
  // A sum p + qs multiplies by the group rule, and its pair (p + q, p - q) multiplies position by position.
  const times = ([p, q], [r, t]) => [p * r + q * t, p * t + q * r], pair = ([p, q]) => [p + q, p - q];
  assert.deepEqual(times([2, 3], [4, 5]), [23, 22]);
  assert.deepEqual([pair([2, 3]), pair([4, 5]), pair([23, 22])], [[5, -1], [9, -1], [45, 1]]);
  for (const a of [[1, 2], [-3, 5], [7, 0]]) for (const b of [[2, 2], [0, -4]]) {
    const [u, v] = pair(a), [x, y] = pair(b);
    assert.deepEqual(pair(times(a, b)), [u * x + 0, v * y + 0]);
  }

  // Both groups with 4 actions give lists of 4 numbers, multiplied position by position. The clock needs i.
  const complexTimes = ([a, b], [c, d]) => [a * c - b * d + 0, a * d + b * c + 0], iPower = k => [[1, 0], [0, 1], [-1, 0], [0, -1]][k % 4];
  const clockList = sum => [0, 1, 2, 3].map(j => sum.reduce(([re, im], n, k) => { const [c, s] = iPower(j * k); return [re + n * c, im + n * s]; }, [0, 0]));
  const clockTimes = (a, b) => [0, 1, 2, 3].map(k => a.reduce((total, n, m) => total + n * b[(k - m + 4) % 4], 0));
  const switchesList = sum => [0, 1, 2, 3].map(j => sum.reduce((total, n, k) => total + n * (-1) ** ((j & 1) * (k & 1) + (j >> 1) * (k >> 1)), 0));
  const switchesTimes = (a, b) => [0, 1, 2, 3].map(k => a.reduce((total, n, m) => total + n * b[k ^ m], 0));
  for (const [a, b] of [[[1, 2, 3, 4], [5, -1, 0, 2]], [[0, 1, 0, 0], [2, 7, -3, 1]]]) {
    assert.deepEqual(clockList(clockTimes(a, b)), clockList(a).map((value, j) => complexTimes(value, clockList(b)[j])));
    assert.deepEqual(switchesList(switchesTimes(a, b)), switchesList(a).map((value, j) => value * switchesList(b)[j]));
  }

  // The carry rule is binary addition of x + 2y, and the two rules differ in how fast a position returns.
  const positions = [[0, 0], [1, 0], [0, 1], [1, 1]], number = ([x, y]) => x + 2 * y;
  const steps = (carry, start) => { let at = start, n = 0; do { at = addPositions(carry, at, [1, 0]); n++; } while (number(at) !== number(start)); return n; };
  for (const a of positions) {
    for (const b of positions) assert.equal(number(addPositions(true, a, b)), (number(a) + number(b)) % 4);
    assert.equal(steps(false, a), 2);
    assert.equal(steps(true, a), 4);
  }
  assert.ok(figures.carry().includes('back in 2 steps') && figures.carry().includes('back in 4 steps'));

  // Turning the kth plane by 1/k degrees moves a far arrow by little, and every arrow moves by something.
  const moved = k => 2 * Math.sin(Math.PI / 360 / k);
  assert.ok(moved(1000) < 0.00002 && moved(1000) > 0);
  quotes('connes-rigidity', '23 + 22s', '(5, -1)', '(9, -1)', '(45, 1)', 'x + 2y', 'SL_3(\\mathbb{Z})');
});

test('Nine-loop page: the diagram, the word counts and the quoted numbers hold', () => {
  const { vertices, edges, legs } = fishnetGraph(), same = ([a, b], [c, d]) => a === c && b === d;
  assert.equal(edges.length - vertices.length + 1, 9);
  assert.equal(legs.length, 6);
  // A meeting of 3 lines carries one power of g and a meeting of 4 carries two. Six particles start at g^4, and nine loops add g^18.
  const degree = v => edges.filter(edge => edge.some(end => same(end, v))).length + legs.filter(leg => same(leg, v)).length;
  assert.ok(vertices.every(v => [3, 4].includes(degree(v))));
  assert.equal(vertices.reduce((total, v) => total + degree(v) - 2, 0), 4 + 18);

  assert.equal(9n ** 18n, 150094635296999121n);
  assert.equal(9n ** 13n, 2541865828329n);
  assert.equal(424 * 5431, 2302744);

  // The values at u = v = w = 1: Dixon and Liu, table 5, and the published nine-loop file.
  const E8 = -47748904.85, E9 = 673807654.7340449;
  assert.equal((E8 / 1e6).toFixed(1), '-47.7');
  assert.equal(Math.round(E9 / 1e6), 674);
  assert.equal((E9 / E8).toFixed(7), '-14.1114787');
  assert.equal((E9 / 100 ** 9).toPrecision(2), '6.7e-10');

  // The sample word obeys the stated rules, and its fraction gives the two published remainders.
  const word = [...'bbfddedfbdfaafefde'];
  const banned = new Set(['ab', 'ba', 'ac', 'ca', 'bc', 'cb', 'ad', 'da', 'be', 'eb', 'cf', 'fc']);
  assert.equal(word.length, 18);
  assert.ok('abc'.includes(word[0]));
  assert.ok(word.slice(1).every((character, i) => !banned.has(word[i] + character)));
  const power = (base, exponent, p) => { let out = 1n; for (base %= p; exponent; exponent >>= 1n, base = base * base % p) if (exponent & 1n) out = out * base % p; return out; };
  const residue = p => ((-105757n % p + p) * power(65536n, p - 2n, p)) % p;
  assert.equal(residue(2147483647n), 829521918n);
  assert.equal(residue(2147483629n), 1173913588n);
  quotes('nine-loop-amplitude', 'bbfddedfb<wbr>dfaafefde', '-47.7', '674 million', '0.00000000067', '9^{18}', '150 quadrillion', '-105{,}757/65{,}536', '5,431', '2.5 trillion', '424 \\times 5{,}431', '2,302,744', '107,053');
});

test('figures are named, stay on theme tokens and contain no raw color', async () => {
  const css = await readFile(new URL('assets/styles.css', root), 'utf8');
  for (const [name, figure] of Object.entries(figures)) {
    const out = figure();
    assert.match(out, /<svg viewBox="[\d. ]+" role="img" aria-label="[^"]+" preserveAspectRatio="xMinYMin meet">/, name);
    assert.doesNotMatch(out, /#[0-9a-f]{3,8}\b|fill="|stroke="|style="|NaN|undefined/i, name);
    for (const [, cls] of out.matchAll(/class="(fig-[\w-]+)"/g)) assert.match(css, new RegExp(`\\.${cls}\\b`), `${name}: ${cls}`);
  }
  for (const name of Object.keys(figures)) assert.ok(Object.values(bodies).some(body => body.includes(`{{fig:${name}}}`)), `${name} is unused`);
});
