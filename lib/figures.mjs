// Margin figures for /ai-math/. The build calculates every shape from its formula,
// so a figure cannot drift from the mathematics. Each viewBox is about as wide as
// the margin column, so labels stay near their stated size. Colors come from
// theme tokens through the fig-* classes in assets/styles.css.

const fmt = value => {
  const rounded = Math.round(value * 100) / 100;
  return Object.is(rounded, -0) ? '0' : String(rounded);
};
const svg = (width, height, label, body) => `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${label}" preserveAspectRatio="xMinYMin meet">${body}</svg>`;
const line = (x1, y1, x2, y2, cls = 'fig-line') => `<line class="${cls}" x1="${fmt(x1)}" y1="${fmt(y1)}" x2="${fmt(x2)}" y2="${fmt(y2)}"/>`;
const dot = (x, y, r = 3, cls = 'fig-dot') => `<circle class="${cls}" cx="${fmt(x)}" cy="${fmt(y)}" r="${r}"/>`;
const text = (x, y, value, cls = 'fig-label', anchor = 'start') => `<text class="${cls}" x="${fmt(x)}" y="${fmt(y)}"${anchor === 'start' ? '' : ` text-anchor="${anchor}"`}>${value}</text>`;
const polyline = (points, cls = 'fig-line') => `<polyline class="${cls}" points="${points.map(([x, y]) => `${fmt(x)},${fmt(y)}`).join(' ')}"/>`;
const polygon = (points, cls = 'fig-band') => `<polygon class="${cls}" points="${points.map(([x, y]) => `${fmt(x)},${fmt(y)}`).join(' ')}"/>`;
const range = (from, to, count) => Array.from({ length: count + 1 }, (_, i) => from + (to - from) * i / count);

// The curve q = w² with rational w, and the projection of each point on the q axis.
export function shadowFigure() {
  const X = q => 26 + q * 76, Y = w => 204 - w * 84;
  const fractions = [[0, 1], [1, 4], [1, 3], [1, 2], [2, 3], [3, 4], [1, 1], [5, 4], [4, 3], [3, 2], [5, 3], [7, 4], [2, 1]];
  const curve = range(0, 2.12, 60).map(w => [X(w * w), Y(w)]);
  let body = line(X(0) - 10, Y(0), X(4.5), Y(0)) + line(X(0), Y(0) + 6, X(0), Y(2.2));
  for (const q of [0, 1, 2, 3, 4]) body += line(X(q), Y(0), X(q), Y(0) + 5) + text(X(q), Y(0) + 20, q, 'fig-label', 'middle');
  body += text(X(4.5) - 2, Y(0) - 7, 'q', 'fig-math', 'end') + text(X(0) - 9, Y(2.2) + 6, 'w', 'fig-math', 'end');
  body += polyline(curve);
  for (const [a, b] of fractions) {
    const w = a / b, q = w * w;
    if (a) body += line(X(q), Y(w), X(q), Y(0), 'fig-guide');
    body += dot(X(q), Y(w), 2.8) + dot(X(q), Y(0), 2, 'fig-dot-accent');
  }
  body += `<circle class="fig-open" cx="${fmt(X(2))}" cy="${fmt(Y(Math.SQRT2))}" r="3.6"/>`;
  return svg(380, 232, 'The curve q equals w squared, with dots at fraction values of w and the points directly below them on the q axis', body);
}

export const ZETA_ZEROS = [14.134725, 21.022040, 25.010858, 30.424876, 32.935062];

// The upper half of the critical strip, with the zero-free bands.
export function stripFigure() {
  const X = re => 50 + (re + .2) * 200, top = 18, bottom = 256, Y = im => bottom - im * 6.5;
  let body = polygon([[X(0), top], [X(1 / 8), top], [X(1 / 8), bottom], [X(0), bottom]]) + polygon([[X(7 / 8), top], [X(1), top], [X(1), bottom], [X(7 / 8), bottom]]);
  for (const re of [0, 1]) body += line(X(re), top, X(re), bottom);
  body += line(X(1 / 2), top, X(1 / 2), bottom, 'fig-accent') + line(X(-.2), bottom, X(1.2), bottom);
  for (const [re, label] of [[0, '0'], [1 / 8, '1/8'], [1 / 2, '1/2'], [7 / 8, '7/8'], [1, '1']]) body += line(X(re), bottom, X(re), bottom + 5) + text(X(re), bottom + 20, label, 'fig-label', 'middle');
  for (const im of ZETA_ZEROS) body += dot(X(1 / 2), Y(im), 3.2, 'fig-dot-accent') + text(X(1 / 2) + 8, Y(im) + 4, im.toFixed(2), 'fig-note');
  body += text(X(1.2), bottom - 7, 'Re s', 'fig-note', 'end');
  return svg(380, 284, 'The strip between real part 0 and real part 1, with zeros on the line at one half and shaded bands free of zeros', body);
}

// A needle of length 1 in a deltoid. With a = 1/4, every tangent chord has length 1.
export function deltoidNeedle(a, t) {
  const mx = a * Math.cos(t), my = a * Math.sin(t), dx = 2 * a * Math.cos(t / 2), dy = -2 * a * Math.sin(t / 2);
  return [[mx - dx, my - dy], [mx + dx, my + dy]];
}
export function deltoidPoint(a, t) {
  return [2 * a * Math.cos(t) + a * Math.cos(2 * t), 2 * a * Math.sin(t) - a * Math.sin(2 * t)];
}
export function deltoidFigure() {
  const a = 50, cx = 150, cy = 165;
  const turn = ([x, y]) => [cx + y, cy - x];
  let body = polygon(range(0, 2 * Math.PI, 240).slice(0, -1).map(t => turn(deltoidPoint(a, t))), 'fig-line-closed');
  for (let k = 0; k < 12; k++) {
    const [p, q] = deltoidNeedle(a, k * 2 * Math.PI / 12 + .13).map(turn);
    body += line(p[0], p[1], q[0], q[1], k === 2 ? 'fig-accent' : 'fig-guide');
  }
  return svg(300, 250, 'A three-pointed deltoid with needles that touch its boundary at both ends', body);
}

// A grid with spacing 1/5 and the unit circle through its twelve grid points.
export function unitGrid() {
  const step = 20, C = 150, R = 7;
  let body = '';
  for (let p = -R; p <= R; p++) for (let q = -R; q <= R; q++) if (p * p + q * q !== 25 && (p || q)) body += dot(C + p * step, C + q * step, 1.6, 'fig-grid');
  body += `<circle class="fig-accent" cx="${C}" cy="${C}" r="${5 * step}"/>`;
  for (let p = -5; p <= 5; p++) for (let q = -5; q <= 5; q++) if (p * p + q * q === 25) body += line(C, C, C + p * step, C + q * step, 'fig-guide') + dot(C + p * step, C + q * step, 3.6, 'fig-dot-accent');
  body += dot(C, C, 3.6);
  return svg(300, 300, 'A square grid with a circle of radius one that passes through twelve grid points', body);
}

// The example game. Each constraint says: value(to) = value(from) + constant, modulo 5.
export const UG_CONSTRAINTS = [['a', 'b', 2], ['b', 'c', 1], ['c', 'd', 4], ['d', 'e', 3], ['e', 'a', 0], ['a', 'c', 3], ['b', 'd', 0], ['c', 'e', 2]];
export const UG_VALUES = { a: 0, b: 2, c: 3, d: 2, e: 0 };
export function ugGraph() {
  const names = ['a', 'b', 'c', 'd', 'e'], C = [150, 128], R = 98;
  const at = Object.fromEntries(names.map((name, i) => { const th = -Math.PI / 2 + i * 2 * Math.PI / 5; return [name, [C[0] + R * Math.cos(th), C[1] + R * Math.sin(th)]]; }));
  let body = '';
  for (const [from, to, k] of UG_CONSTRAINTS) {
    const [x1, y1] = at[from], [x2, y2] = at[to], d = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / d, uy = (y2 - y1) / d;
    const ax = x2 - ux * 20, ay = y2 - uy * 20;
    body += line(x1 + ux * 18, y1 + uy * 18, ax, ay, 'fig-guide-strong');
    body += polygon([[ax, ay], [ax - ux * 9 - uy * 4, ay - uy * 9 + ux * 4], [ax - ux * 9 + uy * 4, ay - uy * 9 - ux * 4]], 'fig-solid');
    const f = from === 'a' && to === 'c' ? .3 : from === 'c' && to === 'e' ? .68 : from === 'b' && to === 'd' ? .3 : .5;
    const mx = x1 + (x2 - x1) * f, my = y1 + (y2 - y1) * f, side = 12;
    body += text(mx - uy * side, my + ux * side + 4, `+${k}`, 'fig-note', 'middle');
  }
  for (const name of names) {
    const [x, y] = at[name];
    body += `<circle class="fig-node" cx="${fmt(x)}" cy="${fmt(y)}" r="17"/>` + text(x, y + 4, `${name}=${UG_VALUES[name]}`, 'fig-node-label', 'middle');
  }
  return svg(300, 248, 'Five unknowns joined by eight arrows, with values that satisfy all of them', body);
}

// dy/dt = y² against dy/dt = y, both from y(0) = 1.
export function blowupFigure() {
  const X = t => 34 + t * 205, Y = y => 206 - y * 16.5;
  let body = line(X(0), Y(0), X(1.6), Y(0)) + line(X(0), Y(0), X(0), Y(11.6));
  for (const t of [0, .5, 1, 1.5]) body += line(X(t), Y(0), X(t), Y(0) + 5) + text(X(t), Y(0) + 20, String(t), 'fig-label', 'middle');
  for (const y of [0, 5, 10]) body += line(X(0) - 5, Y(y), X(0), Y(y)) + text(X(0) - 9, Y(y) + 4, String(y), 'fig-label', 'end');
  body += line(X(1), Y(0), X(1), Y(11.6), 'fig-dash');
  body += polyline(range(0, 1.6, 60).map(t => [X(t), Y(Math.exp(t))]));
  body += polyline(range(0, 1 - 1 / 11.4, 80).map(t => [X(t), Y(1 / (1 - t))]), 'fig-accent');
  body += text(X(.88) - 10, Y(9), 'dy/dt = y²', 'fig-note-accent', 'end') + text(X(1.6), Y(Math.exp(1.6)) - 8, 'dy/dt = y', 'fig-note', 'end');
  body += text(X(1) + 6, Y(11), 't = 1', 'fig-note') + text(X(1.6), Y(0) - 7, 't', 'fig-math', 'end');
  return svg(380, 236, 'Two curves from one: y equals one over one minus t rises without limit at t equals one, and y equals e to the t stays finite', body);
}

// A Hadamard matrix of order 12 from the Paley construction with q = 11.
export const paleyMatrix = (q = 11) => {
  const squares = new Set(Array.from({ length: q - 1 }, (_, i) => (i + 1) ** 2 % q));
  const chi = a => { const x = ((a % q) + q) % q; return x === 0 ? 0 : squares.has(x) ? 1 : -1; };
  const size = q + 1;
  return Array.from({ length: size }, (_, i) => Array.from({ length: size }, (_, j) => {
    if (i === j) return 1;
    if (i === 0) return 1;
    if (j === 0) return -1;
    return chi(i - j);
  }));
};
export function hadamardFigure() {
  const cell = 20, matrix = paleyMatrix(), size = matrix.length;
  let body = '';
  matrix.forEach((row, i) => row.forEach((value, j) => { body += `<rect class="${value > 0 ? 'fig-cell-plus' : 'fig-cell-minus'}" x="${j * cell + .5}" y="${i * cell + .5}" width="${cell - 1}" height="${cell - 1}"/>`; }));
  return svg(size * cell + 1, size * cell + 1, 'A twelve by twelve grid of dark and light cells in which any two rows agree in exactly six columns', body);
}

// The integers modeled on a cycle of twelve points.
export function cycleFigure() {
  const n = 12, C = 130, R = 92, at = k => { const th = -Math.PI / 2 + k * 2 * Math.PI / n; return [C + R * Math.cos(th), C + R * Math.sin(th)]; };
  let body = '';
  for (let k = 0; k < n; k++) {
    const [x1, y1] = at(k), [x2, y2] = at((k + 1) % n), d = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / d, uy = (y2 - y1) / d;
    const ax = x2 - ux * 8, ay = y2 - uy * 8;
    body += line(x1 + ux * 7, y1 + uy * 7, ax, ay, 'fig-guide-strong');
    body += polygon([[ax, ay], [ax - ux * 8 - uy * 3.5, ay - uy * 8 + ux * 3.5], [ax - ux * 8 + uy * 3.5, ay - uy * 8 - ux * 3.5]], 'fig-solid');
    body += dot(x1, y1, 3.6);
    const th = -Math.PI / 2 + k * 2 * Math.PI / n;
    body += text(C + (R + 19) * Math.cos(th), C + (R + 19) * Math.sin(th) + 4.5, k, 'fig-label', 'middle');
  }
  return svg(260, 260, 'Twelve points in a circle, with an arrow from each point to the next', body);
}

// A small weighted graph. The route a, b, c is shorter than the edge from a to c.
export const APSP_EDGES = [['a', 'b', 1], ['b', 'c', 2], ['a', 'c', 7], ['c', 'd', 1], ['d', 'a', 4], ['b', 'd', 5]];
export function apspGraph() {
  const at = { a: [55, 45], b: [245, 45], c: [245, 195], d: [55, 195] }, route = new Set(['ab', 'bc']);
  let body = '';
  for (const [from, to, weight] of APSP_EDGES) {
    const [x1, y1] = at[from], [x2, y2] = at[to], d = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / d, uy = (y2 - y1) / d;
    const ax = x2 - ux * 19, ay = y2 - uy * 19, onRoute = route.has(from + to);
    body += line(x1 + ux * 17, y1 + uy * 17, ax, ay, onRoute ? 'fig-accent' : 'fig-guide-strong');
    body += polygon([[ax, ay], [ax - ux * 9 - uy * 4, ay - uy * 9 + ux * 4], [ax - ux * 9 + uy * 4, ay - uy * 9 - ux * 4]], onRoute ? 'fig-dot-accent' : 'fig-solid');
    const f = from + to === 'ac' ? .28 : from + to === 'bd' ? .28 : .5, mx = x1 + (x2 - x1) * f, my = y1 + (y2 - y1) * f;
    body += text(mx - uy * 12, my + ux * 12 + 4, weight, onRoute ? 'fig-note-accent' : 'fig-note', 'middle');
  }
  for (const [name, [x, y]] of Object.entries(at)) body += `<circle class="fig-node" cx="${x}" cy="${y}" r="16"/>` + text(x, y + 5, name, 'fig-math', 'middle');
  return svg(300, 240, 'Four towns joined by one-way roads with costs, where the route from a through b to c costs less than the direct road', body);
}

// A two-coloring of the edges between five points with no one-color triangle.
export const k5Color = (i, j) => { const gap = Math.min((i - j + 5) % 5, (j - i + 5) % 5); return gap === 1 ? 0 : 1; };
export function k5Figure() {
  const C = 130, R = 104, at = k => { const th = -Math.PI / 2 + k * 2 * Math.PI / 5; return [C + R * Math.cos(th), C + R * Math.sin(th)]; };
  let body = '';
  for (let i = 0; i < 5; i++) for (let j = i + 1; j < 5; j++) { const [p, q] = [at(i), at(j)]; body += line(p[0], p[1], q[0], q[1], k5Color(i, j) ? 'fig-accent' : 'fig-line'); }
  for (let i = 0; i < 5; i++) { const [x, y] = at(i); body += dot(x, y, 4.2); }
  return svg(260, 240, 'Five points. The outer pentagon is one color and the inner star is the other color, and neither color contains a triangle', body);
}

// Six vertices and ten edges, so the average degree is above 3, with a tree on five vertices marked.
export const ES_EDGES = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [0, 2], [0, 3], [1, 4], [2, 5]];
export const ES_TREE = [[0, 1], [0, 2], [0, 3], [3, 4]];
export function treesFigure() {
  const ring = (cx, cy, r, n, turn) => Array.from({ length: n }, (_, k) => [cx + r * Math.cos(turn + k * 2 * Math.PI / n), cy + r * Math.sin(turn + k * 2 * Math.PI / n)]);
  const left = ring(82, 84, 64, 4, -Math.PI / 4), right = ring(284, 84, 74, 6, -Math.PI / 2);
  const marked = new Set(ES_TREE.map(([a, b]) => `${a},${b}`)), inTree = new Set(ES_TREE.flat());
  let body = '';
  for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) body += line(left[i][0], left[i][1], left[j][0], left[j][1]);
  for (const [x, y] of left) body += dot(x, y, 4.2);
  for (const [a, b] of ES_EDGES) body += line(right[a][0], right[a][1], right[b][0], right[b][1], marked.has(`${a},${b}`) ? 'fig-accent' : 'fig-guide-strong');
  right.forEach(([x, y], k) => { body += dot(x, y, 4.2, inTree.has(k) ? 'fig-dot-accent' : 'fig-dot'); });
  body += text(82, 186, 'Average degree 3', 'fig-note', 'middle') + text(284, 186, 'Average degree 3.33', 'fig-note', 'middle');
  return svg(380, 196, 'Two graphs. On the left, four vertices with all six edges. On the right, six vertices and ten edges, with a tree on five vertices marked', body);
}

// The Petersen graph: outer vertices 0 to 4, inner vertices 5 to 9. Six cycles of five edges cover each edge twice.
export const PETERSEN_EDGES = Array.from({ length: 5 }, (_, i) => [[i, (i + 1) % 5], [i, i + 5], [5 + i, 5 + (i + 2) % 5]]).flat();
export const PETERSEN_COVER = [[4, 0, 1, 2, 3], [8, 5, 0, 1, 6], [9, 4, 0, 5, 7], [9, 6, 1, 2, 7], [8, 5, 7, 2, 3], [9, 6, 8, 3, 4]];
export function petersenFigure() {
  const at = k => { const R = k < 5 ? 108 : 50, th = -Math.PI / 2 + (k % 5) * 2 * Math.PI / 5; return [130 + R * Math.cos(th), 120 + R * Math.sin(th)]; };
  const cycle = PETERSEN_COVER[1], key = (a, b) => (a < b ? `${a},${b}` : `${b},${a}`);
  const marked = new Set(cycle.map((v, i) => key(v, cycle[(i + 1) % 5])));
  let body = '';
  for (const [a, b] of PETERSEN_EDGES) { const [p, q] = [at(a), at(b)]; if (!marked.has(key(a, b))) body += line(p[0], p[1], q[0], q[1], 'fig-guide-strong'); }
  for (const [a, b] of PETERSEN_EDGES) { const [p, q] = [at(a), at(b)]; if (marked.has(key(a, b))) body += line(p[0], p[1], q[0], q[1], 'fig-accent'); }
  for (let k = 0; k < 10; k++) { const [x, y] = at(k); body += dot(x, y, 4.2, cycle.includes(k) ? 'fig-dot-accent' : 'fig-dot'); }
  return svg(260, 224, 'The Petersen graph, an outer pentagon joined to an inner five-pointed star, with one cycle of five edges marked', body);
}

// Complex numbers as pairs. The critical points of a cubic come from the quadratic formula.
const times = ([a, b], [c, d]) => [a * c - b * d, a * d + b * c];
const plus = ([a, b], [c, d]) => [a + c, b + d];
const root = ([a, b]) => { const r = Math.sqrt(Math.hypot(a, b)), th = Math.atan2(b, a) / 2; return [r * Math.cos(th), r * Math.sin(th)]; };
const polar = (r, th) => [r * Math.cos(th), r * Math.sin(th)];
export const SENDOV_ZEROS = [[1, 0], polar(.9, 2.2), polar(.7, -2)];
export function sendovCritical([a, b, c] = SENDOV_ZEROS) {
  const sum = plus(plus(a, b), c), pairs = plus(plus(times(a, b), times(b, c)), times(c, a));
  const [dx, dy] = root(plus(times([4, 0], times(sum, sum)), times([-12, 0], pairs)));
  return [[(2 * sum[0] + dx) / 6, (2 * sum[1] + dy) / 6], [(2 * sum[0] - dx) / 6, (2 * sum[1] - dy) / 6]];
}
export function sendovFigure() {
  const S = 88, X = x => 104 + x * S, Y = y => 112 - y * S;
  let body = line(X(-1.1), Y(0), X(2.1), Y(0), 'fig-guide') + line(X(0), Y(1.1), X(0), Y(-1.1), 'fig-guide');
  body += dot(X(0), Y(0), S, 'fig-line-closed') + dot(X(1), Y(0), S, 'fig-dash');
  for (const [x, y] of SENDOV_ZEROS) body += dot(X(x), Y(y), 4.4, 'fig-dot-accent');
  for (const [x, y] of sendovCritical()) body += dot(X(x), Y(y), 4, 'fig-open');
  return svg(300, 224, 'The unit disk with three zeros of a polynomial, its two critical points, and a dashed circle of radius one around one zero', body);
}

// For A with rows (1, 1.5) and (0, -1), the unit vector (cos t, e^{ip} sin t) gives x*Ax = cos 2t + 0.75 sin 2t e^{ip}.
export const rangePoint = (t, p) => [Math.cos(2 * t) + .75 * Math.sin(2 * t) * Math.cos(p), .75 * Math.sin(2 * t) * Math.sin(p)];
export function numericalRangeFigure() {
  const S = 112, X = x => 156 + x * S, Y = y => 98 - y * S;
  let body = line(X(-1.38), Y(0), X(1.38), Y(0), 'fig-guide') + line(X(0), Y(.85), X(0), Y(-.85), 'fig-guide');
  // A random unit vector has cos^2 t uniform on [0, 1]. Fixed low-discrepancy steps keep the build deterministic.
  for (let k = 1; k <= 260; k++) {
    const t = Math.acos(Math.sqrt((k * .6180339887) % 1)), p = 2 * Math.PI * ((k * .7548776662) % 1), [x, y] = rangePoint(t, p);
    body += dot(X(x), Y(y), 1.3, 'fig-solid');
  }
  body += polygon(range(0, 2 * Math.PI, 120).slice(0, -1).map(u => [X(1.25 * Math.cos(u)), Y(.75 * Math.sin(u))]), 'fig-line-closed');
  for (const x of [-1, 1]) body += dot(X(x), Y(0), 4.4, 'fig-dot-accent') + text(X(x), Y(0) + 19, x === 1 ? '1' : '−1', 'fig-note', 'middle');
  return svg(312, 196, 'An ellipse in the complex plane filled with sample values of the numerical range, with the two eigenvalues at its foci', body);
}

// The triangle that reaches Ehrhart's limit in two dimensions.
export const EHRHART_TRIANGLE = [[-1, -1], [2, -1], [-1, 2]];
export function ehrhartFigure() {
  const S = 50, X = x => 112 + x * S, Y = y => 158 - y * S;
  let body = polygon(EHRHART_TRIANGLE.map(([x, y]) => [X(x), Y(y)])) + polygon(EHRHART_TRIANGLE.map(([x, y]) => [X(x), Y(y)]), 'fig-line-closed');
  for (let x = -2; x <= 3; x++) for (let y = -2; y <= 3; y++) if (x || y) body += dot(X(x), Y(y), 2.4);
  body += dot(X(0), Y(0), 4.6, 'fig-dot-accent') + text(X(0) + 9, Y(0) - 7, '(0, 0)', 'fig-note-accent');
  body += text(X(-1) - 8, Y(-1) + 17, '(−1, −1)', 'fig-note', 'middle') + text(X(2) + 4, Y(-1) + 17, '(2, −1)', 'fig-note', 'middle') + text(X(-1), Y(2) - 11, '(−1, 2)', 'fig-note', 'middle');
  return svg(280, 276, 'A grid of lattice points and a triangle with corners at minus one, minus one, at two, minus one, and at minus one, two. The origin is the only lattice point strictly inside', body);
}

// A disk of diameter 1 cut into three equal sectors. The longest distance in a sector is the chord across it.
export function borsukFigure() {
  const C = 118, R = 104, at = deg => [C + R * Math.cos(deg * Math.PI / 180), 116 + R * Math.sin(deg * Math.PI / 180)];
  let body = dot(C, 116, R, 'fig-line-closed');
  for (const deg of [-90, 30, 150]) { const [x, y] = at(deg); body += line(C, 116, x, y); }
  const [a, b] = [at(30), at(150)];
  body += line(a[0], a[1], b[0], b[1], 'fig-accent') + text(C, a[1] + 21, '0.87', 'fig-note-accent', 'middle');
  const [l, r] = [at(180), at(0)];
  body += line(l[0], l[1], r[0], r[1], 'fig-dash') + text(l[0] + 18, l[1] - 7, '1', 'fig-note', 'middle');
  return svg(236, 232, 'A disk of diameter one cut into three equal sectors. The chord across one sector has length about 0.87', body);
}

// The hexagonal packing of equal disks, which is the densest in the plane.
export function hexPackingFigure() {
  const r = 27, W = 340, H = 198;
  let body = '';
  for (let row = 0; row < 5; row++) for (let col = 0; col < 8; col++) {
    const x = r + 1 + col * 2 * r + (row % 2) * r, y = r + 1 + row * r * Math.sqrt(3);
    if (x + r < W && y + r < H) body += dot(x, y, r, 'fig-ball');
  }
  return svg(W, H, 'Equal disks in the plane, each touching six others', body);
}

export const BUTTERFLY_DIGITS = [3, 1, 4, 1, 5, 9, 2, 6];
// Each round pairs the entries whose positions differ by the gap, and turns a, b into a + b, a - b.
export const butterflyRounds = (values, gaps = [4, 2, 1]) => gaps.reduce((rounds, gap) => {
  const before = rounds.at(-1) ?? values, after = [...before];
  for (let i = 0; i < before.length; i++) if (!(i & gap)) { after[i] = before[i] + before[i + gap]; after[i + gap] = before[i] - before[i + gap]; }
  return [...rounds, after];
}, []);

// Eight numbers through three rounds of four butterflies, with the first butterfly marked.
export function butterflyFigure() {
  const X = col => 18 + col * 114, Y = row => 36 + row * 28, GAP = 18;
  const columns = [BUTTERFLY_DIGITS, ...butterflyRounds(BUTTERFLY_DIGITS)];
  const signed = value => String(value).replace('-', '−');
  let body = '', marked = '';
  [4, 2, 1].forEach((gap, round) => {
    const x1 = X(round) + GAP, x2 = X(round + 1) - GAP;
    body += text((x1 + x2) / 2, 13, `Round ${round + 1}`, 'fig-note', 'middle');
    for (let i = 0; i < 8; i++) if (!(i & gap)) {
      const j = i + gap, wires = [[i, i], [j, j], [i, j], [j, i]].map(([from, to]) => [x1, Y(from), x2, Y(to)]);
      if (round === 0 && i === 0) marked += wires.map(wire => line(...wire, 'fig-accent')).join('');
      else body += wires.map(wire => line(...wire, 'fig-guide-strong')).join('');
    }
  });
  body += marked;
  columns.forEach((column, col) => column.forEach((value, row) => {
    const accent = col < 2 && (row === 0 || row === 4);
    body += text(X(col), Y(row) + 4.5, signed(value), accent ? 'fig-note-accent' : 'fig-label', 'middle');
  }));
  return svg(378, 240, 'Eight digits pass through three rounds. Each round pairs the numbers and replaces each pair by its sum and its difference. The first pair turns 3 and 5 into 8 and minus 2', body);
}

// Position (x, y) plus position (a, b), with 1 + 1 = 0. The term xa is the carry, as in binary addition of x + 2y.
export const addPositions = (carry, [x, y], [a, b]) => [(x + a) % 2, (y + b + (carry ? x * a : 0)) % 2];

// Adding (1, 0) to each of the four positions, without and with the carry.
export function carryFigure() {
  const arrow = (from, to, lineClass, headClass, shift) => {
    const d = Math.hypot(to[0] - from[0], to[1] - from[1]), ux = (to[0] - from[0]) / d, uy = (to[1] - from[1]) / d;
    const ox = -uy * shift, oy = ux * shift, tipX = to[0] - ux * 9 + ox, tipY = to[1] - uy * 9 + oy, baseX = tipX - ux * 8, baseY = tipY - uy * 8;
    return line(from[0] + ux * 9 + ox, from[1] + uy * 9 + oy, baseX, baseY, lineClass) + polygon([[tipX, tipY], [baseX - uy * 3.5, baseY + ux * 3.5], [baseX + uy * 3.5, baseY - ux * 3.5]], headClass);
  };
  const panel = (left, carry, title, note) => {
    const at = ([x, y]) => [left + 34 + x * 112, 146 - y * 92], points = [[0, 0], [1, 0], [0, 1], [1, 1]];
    let out = text(left + 90, 14, title, carry ? 'fig-note-accent' : 'fig-note', 'middle');
    for (const point of points) out += arrow(at(point), at(addPositions(carry, point, [1, 0])), carry ? 'fig-accent' : 'fig-guide-strong', carry ? 'fig-dot-accent' : 'fig-solid', carry ? 0 : 6);
    for (const point of points) {
      const [x, y] = at(point);
      out += dot(x, y, 3.4) + text(x, y + (point[1] ? -14 : 24), `(${point[0]}, ${point[1]})`, 'fig-label', 'middle');
    }
    return out + text(left + 90, 198, note, 'fig-note', 'middle');
  };
  return svg(380, 206, 'Four positions, each a pair of 0s and 1s. Without the carry, adding the position 1, 0 swaps the positions in two pairs. With the carry, it moves all four positions around one cycle', panel(0, false, 'Without the carry', 'back in 2 steps') + panel(200, true, 'With the carry', 'back in 4 steps'));
}

// A square grid of closed cells with six outer lines, numbered clockwise from the top left.
export function fishnetGraph(cells = 3) {
  const vertices = [], edges = [];
  for (let j = 0; j <= cells; j++) for (let i = 0; i <= cells; i++) {
    vertices.push([i, j]);
    if (i < cells) edges.push([[i, j], [i + 1, j]]);
    if (j < cells) edges.push([[i, j], [i, j + 1]]);
  }
  return { vertices, edges, legs: [[0, 0], [1, 0], [cells, 0], [cells, cells], [cells - 1, cells], [0, cells]] };
}

export function fishnetFigure() {
  const { vertices, edges, legs } = fishnetGraph(), X = i => 92 + i * 62, Y = j => 44 + j * 62, out = v => (v === 0 ? -1 : v === 3 ? 1 : 0);
  let body = polygon([[X(1), Y(1)], [X(2), Y(1)], [X(2), Y(2)], [X(1), Y(2)]]);
  for (const [[a, b], [c, d]] of edges) body += line(X(a), Y(b), X(c), Y(d));
  legs.forEach(([i, j], k) => {
    const x = X(i) + out(i) * 26, y = Y(j) + out(j) * 26;
    body += line(X(i), Y(j), x, y, 'fig-accent') + text(x + out(i) * 9, y + out(j) * 9 + 4.5, k + 1, 'fig-note-accent', 'middle');
  });
  for (const [i, j] of vertices) body += dot(X(i), Y(j), 2.8);
  return svg(380, 280, 'A square grid of nine closed cells, with six lines leaving its outer edge. The center cell is shaded', body);
}

export const figures = { carry: carryFigure, fishnet: fishnetFigure, butterfly: butterflyFigure, 'es-graph': treesFigure, petersen: petersenFigure, sendov: sendovFigure, 'numerical-range': numericalRangeFigure, ehrhart: ehrhartFigure, 'borsuk-disk': borsukFigure, 'hex-packing': hexPackingFigure, shadow: shadowFigure, strip: stripFigure, deltoid: deltoidFigure, 'unit-grid': unitGrid, 'ug-graph': ugGraph, blowup: blowupFigure, hadamard: hadamardFigure, cycle: cycleFigure, 'apsp-graph': apspGraph, k5: k5Figure };
