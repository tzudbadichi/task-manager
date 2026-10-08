// SVG art for the fun parts: the characters of the people view (many kinds and looks, mood overlays,
// holiday accessories), their desks (a station per activity), the office furniture, and the holiday
// emblems. Drawn with createElementNS (no markup strings), animated only by CSS classes (styles.css,
// "People view"), so it works under the strict Content-Security-Policy.
//
// Character coordinates (viewBox 92 x 124, facing right): the figure stands around x = 46 with its feet
// on y = 112. CSS rotates the arms around the shoulders (37,62) / (55,62) and the legs around the hips
// (41,88) / (51,88). Stations keep the coordinates they had next to the figure (x 68-140).

const SVG_NS = 'http://www.w3.org/2000/svg';

function svg(tag, attributes = {}, ...children) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attributes)) {
    if (value !== null && value !== undefined && value !== false) node.setAttribute(name, String(value));
  }
  for (const child of children.flat(Infinity)) if (child) node.append(child);
  return node;
}

const group = (className, ...children) => svg('g', { class: className }, ...children);
const rect = (x, y, width, height, fill, extra = {}) => svg('rect', { x, y, width, height, fill, ...extra });
const circle = (cx, cy, r, fill, extra = {}) => svg('circle', { cx, cy, r, fill, ...extra });
const ellipse = (cx, cy, rx, ry, fill, extra = {}) => svg('ellipse', { cx, cy, rx, ry, fill, ...extra });
const path = (d, fill, extra = {}) => svg('path', { d, fill, ...extra });
const line = (x1, y1, x2, y2, stroke, width, extra = {}) =>
  svg('line', { x1, y1, x2, y2, stroke, 'stroke-width': width, 'stroke-linecap': 'round', ...extra });

const WOOD = '#b07a4f';
const WOOD_DARK = '#8b5e3c';
const METAL = '#94a3b8';
const INK = '#1f2937';

// ---------------------------------------------------------------------------
// Stations: the desk (or easel, cart...) of each character, by activity
// ---------------------------------------------------------------------------

function desk(...onTop) {
  return [
    rect(74, 84, 60, 5, WOOD, { rx: 2 }),
    rect(78, 89, 4, 23, WOOD_DARK),
    rect(126, 89, 4, 23, WOOD_DARK),
    ...onTop,
  ];
}

function laptop(...onScreen) {
  return [
    path('M86 84 L122 84 L118 80 L90 80 Z', METAL),
    rect(92, 60, 24, 20, '#334155', { rx: 2 }),
    rect(94, 62, 20, 16, '#0f172a', { rx: 1 }),
    ...onScreen,
  ];
}

function mug(x, y) {
  return [
    rect(x, y, 7, 8, '#f8fafc', { rx: 1.5, stroke: '#cbd5e1', 'stroke-width': 0.8 }),
    path(`M${x + 7} ${y + 2} q3 0 3 2.5 q0 2.5 -3 2.5`, 'none', { stroke: '#cbd5e1', 'stroke-width': 1.2 }),
    path(`M${x + 2} ${y - 2} q-1.5 -2 0 -4 M${x + 5} ${y - 2} q-1.5 -2 0 -4`, 'none', { stroke: '#cbd5e1', 'stroke-width': 0.9, class: 'p-steam' }),
  ];
}

function whiteboard(...content) {
  return [
    line(90, 72, 86, 112, METAL, 2),
    line(124, 72, 128, 112, METAL, 2),
    rect(82, 38, 50, 36, '#ffffff', { rx: 2, stroke: METAL, 'stroke-width': 2 }),
    ...content,
  ];
}

const STATIONS = {
  coding: () => desk(...laptop(
    rect(96, 64, 10, 1.6, '#38bdf8', { class: 'p-screen-line' }),
    rect(98, 68, 13, 1.6, '#a3e635', { class: 'p-screen-line' }),
    rect(96, 72, 8, 1.6, '#f472b6', { class: 'p-screen-line' }),
  ), ...mug(124, 76)),
  email: () => [
    ...desk(...laptop(
      rect(98, 65, 12, 9, '#f8fafc', { rx: 1 }),
      path('M98 65 L104 70 L110 65', 'none', { stroke: '#64748b', 'stroke-width': 1 }),
    )),
    group('p-fly', rect(100, 44, 12, 8, '#fde68a', { rx: 1 }), path('M100 44 L106 49 L112 44', 'none', { stroke: '#b45309', 'stroke-width': 1 })),
  ],
  writing: () => desk(
    rect(90, 76, 22, 8, '#f8fafc', { stroke: '#cbd5e1', 'stroke-width': 0.8 }),
    rect(92, 72, 22, 4, '#f1f5f9', { stroke: '#cbd5e1', 'stroke-width': 0.8 }),
    rect(118, 72, 7, 12, '#64748b', { rx: 1.5 }),
    line(120, 72, 118, 64, '#f59e0b', 1.6),
    line(123, 72, 125, 65, '#3b82f6', 1.6),
  ),
  money: () => desk(
    rect(88, 70, 16, 14, '#475569', { rx: 2 }),
    rect(90, 72, 12, 4, '#bbf7d0'),
    ...[0, 1, 2].flatMap(row => [0, 1, 2].map(col => rect(90 + col * 4.2, 78 + row * 2, 3, 1.2, '#e2e8f0'))),
    ...[0, 1, 2, 3].map(index => svg('ellipse', { cx: 118, cy: 82 - index * 3, rx: 7, ry: 2.2, fill: '#facc15', stroke: '#ca8a04', 'stroke-width': 0.8 })),
  ),
  people: () => whiteboard(
    circle(107, 46, 3.5, '#6366f1'),
    circle(95, 62, 3.5, '#ec4899'),
    circle(107, 62, 3.5, '#10b981'),
    circle(119, 62, 3.5, '#f59e0b'),
    path('M107 49.5 V55 M95 58.5 V55 H119 V58.5 M107 55 V58.5', 'none', { stroke: '#94a3b8', 'stroke-width': 1.2 }),
  ),
  testing: () => whiteboard(
    ...[0, 1, 2].flatMap(index => [
      path(`M88 ${47 + index * 9} l2.5 2.5 l4.5 -5`, 'none', { stroke: '#16a34a', 'stroke-width': 1.8, 'stroke-linecap': 'round', class: `p-check p-check-${index}` }),
      rect(98, 46 + index * 9, 26 - index * 4, 2, '#cbd5e1'),
    ]),
  ),
  design: () => [
    line(96, 60, 88, 112, WOOD_DARK, 2.5),
    line(116, 60, 124, 112, WOOD_DARK, 2.5),
    line(106, 60, 106, 112, WOOD_DARK, 2.5),
    rect(86, 40, 40, 32, '#ffffff', { stroke: WOOD, 'stroke-width': 2.5 }),
    circle(98, 52, 6, '#f472b6', { class: 'p-paint' }),
    circle(112, 58, 7, '#38bdf8', { class: 'p-paint' }),
    circle(104, 64, 4, '#facc15', { class: 'p-paint' }),
  ],
  phone: () => [
    rect(96, 86, 28, 4, WOOD, { rx: 2 }),
    rect(108, 90, 4, 22, WOOD_DARK),
    rect(100, 110, 20, 2.5, WOOD_DARK, { rx: 1 }),
    ...mug(104, 78),
  ],
  cleaning: () => [
    svg('ellipse', { cx: 104, cy: 110, rx: 12, ry: 3.5, fill: '#a8a29e', class: 'p-dust-pile' }),
    path('M118 96 h16 l-2 16 h-12 Z', '#3b82f6'),
    path('M120 96 q6 -8 12 0', 'none', { stroke: '#1e3a8a', 'stroke-width': 1.5 }),
  ],
  shopping: () => [
    path('M84 78 h44 l-5 20 h-34 Z', 'none', { stroke: '#64748b', 'stroke-width': 2.5, 'stroke-linejoin': 'round' }),
    path('M84 78 l-5 -8 h-5', 'none', { stroke: '#64748b', 'stroke-width': 2.5, 'stroke-linecap': 'round' }),
    rect(92, 70, 8, 9, '#ef4444', { rx: 1 }),
    rect(102, 66, 7, 13, '#22c55e', { rx: 1 }),
    circle(115, 74, 5, '#f59e0b'),
    circle(94, 106, 4, INK),
    circle(120, 106, 4, INK),
    line(90, 98, 94, 102, '#64748b', 2),
    line(122, 98, 120, 102, '#64748b', 2),
  ],
  travel: () => [
    rect(92, 66, 30, 40, '#0ea5e9', { rx: 5 }),
    path('M100 66 v-8 h14 v8', 'none', { stroke: '#334155', 'stroke-width': 2.5 }),
    rect(96, 74, 9, 6, '#facc15', { rx: 1.5 }),
    circle(112, 92, 4, '#f472b6'),
    line(97, 70, 97, 102, '#0284c7', 1.2),
    line(117, 70, 117, 102, '#0284c7', 1.2),
    circle(97, 109, 2.5, INK),
    circle(117, 109, 2.5, INK),
  ],
  sport: () => [
    rect(80, 108, 52, 4, '#a78bfa', { rx: 2 }),
    rect(114, 88, 8, 18, '#38bdf8', { rx: 3 }),
    rect(115.5, 84, 5, 4, '#0f172a', { rx: 1 }),
  ],
  fixing: () => [
    rect(90, 92, 34, 18, '#dc2626', { rx: 2 }),
    path('M100 92 v-5 h14 v5', 'none', { stroke: '#7f1d1d', 'stroke-width': 2.5 }),
    rect(90, 98, 34, 2, '#7f1d1d'),
    path('M113 87 l9 -9 a3.5 3.5 0 1 1 2.5 2.5 l-9 9 Z', '#94a3b8'),
  ],
  delivery: () => [
    rect(96, 88, 24, 22, '#d6a46c', { rx: 1 }),
    rect(100, 68, 20, 20, '#c8925a', { rx: 1 }),
    line(108, 88, 108, 110, '#a16207', 1.5),
    line(110, 68, 110, 88, '#a16207', 1.5),
  ],
  coffee: () => [
    rect(96, 86, 28, 4, WOOD, { rx: 2 }),
    rect(108, 90, 4, 22, WOOD_DARK),
    rect(100, 110, 20, 2.5, WOOD_DARK, { rx: 1 }),
    rect(100, 74, 14, 12, '#7c3aed', { rx: 2 }),
    rect(102, 77, 10, 2, '#ede9fe'),
  ],
};

// A finished task plants a flag with a check mark on its station.
function doneFlag() {
  return group('p-done-flag',
    line(132, 112, 132, 30, '#64748b', 2),
    path('M132 30 h-20 l5 7 l-5 7 h20 Z', '#22c55e'),
    path('M117 37 l3 3 l5 -6', 'none', { stroke: '#ffffff', 'stroke-width': 1.8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
}

// ---------------------------------------------------------------------------
// Desks: in the office every task has its own station (viewBox 68 20 72 96, floor at y = 112)
// ---------------------------------------------------------------------------

/** The station of an activity (desk with a laptop, easel, cart...), with a check flag once the task is done. */
export function createStationArt(activity, { done = false } = {}) {
  return svg('svg', { viewBox: '68 20 72 96', class: 'station-art', 'aria-hidden': 'true', focusable: 'false' },
    (STATIONS[activity] ?? STATIONS.coffee)(), done && doneFlag());
}

// ---------------------------------------------------------------------------
// Hand props (in the front hand, at about (58,82); they move with the arm). CSS shows the activity's
// prop only while working at the desk, and the cup only on a coffee break.
// ---------------------------------------------------------------------------

const HAND_PROPS = {
  phone: () => rect(55.5, 77, 6, 10, '#111827', { rx: 1.5 }),
  testing: () => [line(58, 82, 62, 78, '#475569', 2.5), circle(65, 75, 5, '#bae6fd', { stroke: '#475569', 'stroke-width': 1.8, 'fill-opacity': 0.7 })],
  design: () => [line(57, 84, 64, 74, WOOD_DARK, 2), circle(64.5, 73.5, 1.8, '#f472b6')],
  cleaning: () => [line(50, 66, 68, 108, WOOD_DARK, 2.5), path('M62 106 h13 l3 7 h-19 Z', '#facc15')],
  sport: () => [line(53, 82, 63, 82, '#334155', 2), rect(50.5, 78, 3.5, 8, '#334155', { rx: 1 }), rect(62, 78, 3.5, 8, '#334155', { rx: 1 })],
  fixing: () => path('M57 83 l7 -7 a3 3 0 1 1 2 2 l-7 7 Z', '#64748b'),
  people: () => [rect(56, 74, 11, 14, '#b45309', { rx: 1.5 }), rect(57.5, 77, 8, 9.5, '#f8fafc'), rect(59, 72.5, 5, 3, '#64748b', { rx: 1 })],
  delivery: () => [rect(48, 72, 18, 14, '#d6a46c', { rx: 1 }), line(57, 72, 57, 86, '#a16207', 1.3)],
  coffee: () => [rect(56, 77, 6, 7, '#f8fafc', { rx: 1.2, stroke: '#cbd5e1', 'stroke-width': 0.8 }), path('M62 79 q2.5 0 2.5 2 q0 2 -2.5 2', 'none', { stroke: '#cbd5e1', 'stroke-width': 1 })],
  writing: () => line(57, 83, 62, 76, '#f59e0b', 2),
};

function cupInHand() {
  return group('p-cup',
    rect(56, 77, 6.5, 7.5, '#f8fafc', { rx: 1.3, stroke: '#cbd5e1', 'stroke-width': 0.8 }),
    path('M62.5 79 q2.6 0 2.6 2 q0 2 -2.6 2', 'none', { stroke: '#cbd5e1', 'stroke-width': 1 }));
}

// ---------------------------------------------------------------------------
// The character (viewBox 92 x 124, facing right, feet on y = 112). The head is drawn for a radius of 15
// around (46,40) and scaled by the look's head size around the neck, so every hair style, ear and hat
// fits every head. Its look (people-model.js lookOf) picks the kind - human, animal, robot, alien - and
// the traits; the shirt is always in the task's category color (CSS --cat-color).
// ---------------------------------------------------------------------------

function mixColor(color, other, amount) {
  const channels = hex => [1, 3, 5].map(index => Number.parseInt(hex.slice(index, index + 2), 16));
  const [from, to] = [channels(color), channels(other)];
  return `#${from.map((value, index) => Math.round(value + (to[index] - value) * amount).toString(16).padStart(2, '0')).join('')}`;
}
const lighter = (color, amount = 0.5) => mixColor(color, '#ffffff', amount);
const darker = (color, amount = 0.3) => mixColor(color, '#000000', amount);

const MOOD_FACES = {
  idle: { eyes: 'open', mouth: 'smile' },
  working: { eyes: 'open', mouth: 'smile' },
  sweating: { eyes: 'open', mouth: 'worried' },
  waiting: { eyes: 'open', mouth: 'flat' },
  bored: { eyes: 'half', mouth: 'flat' },
  sleeping: { eyes: 'closed', mouth: 'small' },
  celebrating: { eyes: 'happy', mouth: 'open' },
};

const HUMAN_EYES = [[43, 41], [52, 41]];
const LED = '#22d3ee';

/** Eyes at two anchors. style: 'dot' (most faces), 'big' (aliens) or 'led' (robots). */
function drawEyes(state, [[x1, y1], [x2, y2]], style, color) {
  if (style === 'led') {
    if (state === 'closed') return group('p-eyes', line(x1 - 2, y1, x1 + 2, y1, LED, 1.4), line(x2 - 2, y2, x2 + 2, y2, LED, 1.4));
    if (state === 'happy') return group('p-eyes', path(`M${x1 - 2.2} ${y1 + 1} q2.2 -3 4.4 0 M${x2 - 2.2} ${y2 + 1} q2.2 -3 4.4 0`, 'none', { stroke: LED, 'stroke-width': 1.5, 'stroke-linecap': 'round' }));
    if (state === 'half') return group('p-eyes', rect(x1 - 1.8, y1 - 0.6, 3.6, 1.4, LED), rect(x2 - 1.8, y2 - 0.6, 3.6, 1.4, LED));
    return group('p-eyes p-blink', rect(x1 - 1.8, y1 - 1.8, 3.6, 3.6, LED, { rx: 0.8 }), rect(x2 - 1.8, y2 - 1.8, 3.6, 3.6, LED, { rx: 0.8 }));
  }
  const isBig = style === 'big';
  const stroke = { stroke: color, 'stroke-width': isBig ? 1.8 : 1.4, 'stroke-linecap': 'round' };
  if (state === 'closed') return group('p-eyes', path(`M${x1 - 2} ${y1} q2 2 4 0 M${x2 - 2} ${y2} q2 2 4 0`, 'none', stroke));
  if (state === 'happy') return group('p-eyes', path(`M${x1 - 2} ${y1 + 1} q2 -3 4 0 M${x2 - 2} ${y2 + 1} q2 -3 4 0`, 'none', stroke));
  if (state === 'half') return group('p-eyes', rect(x1 - 2, y1, 4, isBig ? 2.2 : 1.6, color, { rx: 0.8 }), rect(x2 - 2, y2, 4, isBig ? 2.2 : 1.6, color, { rx: 0.8 }));
  if (isBig) {
    return group('p-eyes p-blink', ellipse(x1, y1, 3, 4.2, color), ellipse(x2, y2, 3, 4.2, color),
      circle(x1 + 1, y1 - 1.6, 1, '#ffffff'), circle(x2 + 1, y2 - 1.6, 1, '#ffffff'));
  }
  return group('p-eyes p-blink', ellipse(x1, y1, 1.8, 2.3, color), ellipse(x2, y2, 1.8, 2.3, color));
}

/** A mouth centered at (x, y); widthScale stretches it (frogs). */
function drawMouth(state, [x, y], color = INK, widthScale = 1) {
  const half = 5 * widthScale;
  const stroke = { stroke: color, 'stroke-width': 1.6, 'stroke-linecap': 'round' };
  const fillColor = color === INK ? '#7f1d1d' : color;
  switch (state) {
    case 'flat': return path(`M${x - half * 0.8} ${y + 1} H${x + half * 0.8}`, 'none', stroke);
    case 'worried': return path(`M${x - half} ${y + 2} Q${x} ${y - 1} ${x + half} ${y + 2}`, 'none', stroke);
    case 'open': return path(`M${x - half * 1.1} ${y - 1} Q${x} ${y + 8} ${x + half * 1.1} ${y - 1} Z`, fillColor);
    case 'small': return circle(x, y + 1.5, 1.6, fillColor);
    default: return path(`M${x - half} ${y} Q${x} ${y + 4.5} ${x + half} ${y}`, 'none', stroke);
  }
}

// --- Human hair: [behind the head, on top of it] ------------------------------------------

const HAIR_CAP = 'M31 40 A15 15 0 0 1 61 38 Q55 30 46 31 Q37 31 31 40 Z';
const HAIR_STYLES = [
  /* short */ hair => [null, path(HAIR_CAP, hair)],
  /* long */ hair => [path('M30 40 A16 16 0 0 1 62 39 L62 55 Q58 53 58 46 L34 46 Q34 53 30 56 Z', hair), path(HAIR_CAP, hair)],
  /* bun */ hair => [circle(45, 23, 5.5, hair), path(HAIR_CAP, hair)],
  /* spiky */ hair => [null, path('M31 39 L33 29 L37 32 L40 25 L44 30 L48 23 L51 30 L55 26 L57 32 L61 30 L61 38 Q54 32 46 33 Q38 32 31 39 Z', hair)],
  /* afro */ hair => [[circle(46, 36, 20, hair), ...[[30, 29], [36, 21], [46, 18], [56, 21], [62, 29]].map(([x, y]) => circle(x, y, 6.5, hair))], null],
  /* ponytail */ (hair, look) => [[ellipse(29, 47, 4, 9.5, hair, { transform: 'rotate(22 29 47)' }), circle(31.5, 38.5, 2.2, look.accent)], path(HAIR_CAP, hair)],
  /* bald, side hair */ hair => [null, [path('M31 42 Q31 34 34.5 30.5 L35.5 33 Q33 36 33 42 Z', hair), ellipse(42, 29.5, 3.2, 1.4, '#ffffff', { 'fill-opacity': 0.35 })]],
  /* mohawk */ hair => [null, path('M42 28 L43 18 L46.5 23 L48.5 15 L51 23 L53.5 18.5 L53 28.5 Q47.5 26 42 28 Z', hair)],
  /* pigtails */ hair => [[circle(28.5, 44, 4.8, hair), circle(63.5, 44, 4.8, hair)], path(HAIR_CAP, hair)],
  /* swoop */ hair => [null, [path(HAIR_CAP, hair), path('M33 35 Q43 22 61 33 Q48 29 40 35.5 Q36 37.5 33 35 Z', darker(hair, 0.12))]],
  /* curly */ hair => [null, [path(HAIR_CAP, hair), ...[[33, 35, 3.6], [38, 30, 3.8], [44, 28, 3.8], [50, 28.5, 3.8], [56, 31, 3.6], [60, 36, 3.2]].map(([x, y, r]) => circle(x, y, r, hair))]],
  /* buzz */ hair => [null, path(HAIR_CAP, hair, { 'fill-opacity': 0.55 })],
];

const FACIAL_HAIR_ART = {
  beard: hair => path('M33 42 Q33 56 47 56 Q61 56 60 41 Q58 48 47.5 48.5 Q36 48 33 42 Z', hair),
  mustache: hair => path('M42.5 45.5 q2.6 -2 5 0 q2.4 -2 5 0 q-2.6 2.4 -5 0.8 q-2.4 1.6 -5 -0.8 Z', hair),
  goatee: hair => path('M45 50.5 q2.5 2 5 0 l-1 4 q-1.5 1.2 -3 0 Z', hair),
};

const EYEWEAR_ART = {
  round: ([[x1, y1], [x2, y2]]) => [
    circle(x1, y1, 3.4, 'none', { stroke: INK, 'stroke-width': 1 }), circle(x2, y2, 3.4, 'none', { stroke: INK, 'stroke-width': 1 }),
    path(`M${x1 + 3.4} ${y1} Q${(x1 + x2) / 2} ${y1 - 1.5} ${x2 - 3.4} ${y2} M${x1 - 3.4} ${y1} L${x1 - 7.5} ${y1 - 1}`, 'none', { stroke: INK, 'stroke-width': 1 }),
  ],
  square: ([[x1, y1], [x2, y2]]) => [
    rect(x1 - 3.5, y1 - 2.7, 7, 5.4, 'none', { rx: 1.2, stroke: INK, 'stroke-width': 1.1 }),
    rect(x2 - 3.5, y2 - 2.7, 7, 5.4, 'none', { rx: 1.2, stroke: INK, 'stroke-width': 1.1 }),
    path(`M${x1 + 3.5} ${y1} H${x2 - 3.5} M${x1 - 3.5} ${y1} L${x1 - 7.5} ${y1 - 1}`, 'none', { stroke: INK, 'stroke-width': 1.1 }),
  ],
  sun: ([[x1, y1], [x2, y2]]) => [
    rect(x1 - 3.8, y1 - 2.8, 7.6, 5.6, '#111827', { rx: 2.2 }), rect(x2 - 3.8, y2 - 2.8, 7.6, 5.6, '#111827', { rx: 2.2 }),
    path(`M${x1 + 3.8} ${y1 - 0.5} H${x2 - 3.8} M${x1 - 3.8} ${y1} L${x1 - 7.5} ${y1 - 1}`, 'none', { stroke: '#111827', 'stroke-width': 1.2 }),
    line(x1 - 1.6, y1 - 1.2, x1 + 0.4, y1 - 1.2, '#94a3b8', 0.8), line(x2 - 1.6, y2 - 1.2, x2 + 0.4, y2 - 1.2, '#94a3b8', 0.8),
  ],
};

const HEADWEAR_ART = {
  cap: look => [path('M31 37 A15 14 0 0 1 61 37 Z', look.accent), path('M56 35.5 h11 a1.6 1.6 0 0 1 0 3.2 h-11 Z', darker(look.accent, 0.2)), circle(46, 23.3, 1.4, darker(look.accent, 0.25))],
  beanie: look => [path('M30.5 37.5 A15.5 16 0 0 1 61.5 37.5 Z', look.accent), rect(30.5, 34, 31, 4.6, lighter(look.accent, 0.35), { rx: 2 }), circle(46, 20.5, 3.4, '#ffffff')],
  headphones: look => [path('M30 42 A16 17 0 0 1 62 42', 'none', { stroke: INK, 'stroke-width': 2.6 }), rect(27.3, 37, 5.4, 10, look.accent, { rx: 2.2 }), rect(59.3, 37, 5.4, 10, look.accent, { rx: 2.2 })],
  bow: look => [path('M34 27 l-6.5 -4.5 v9 Z M34 27 l6.5 -4.5 v9 Z', look.accent), circle(34, 27, 1.9, darker(look.accent, 0.2))],
  flower: look => [...[[0, -3], [2.9, -0.9], [1.8, 2.4], [-1.8, 2.4], [-2.9, -0.9]].map(([dx, dy]) => circle(34 + dx, 29 + dy, 2.3, look.accent)), circle(34, 29, 1.6, '#facc15')],
  hardhat: () => [path('M30 37.5 A16 15 0 0 1 62 37.5 Z', '#facc15'), rect(27, 35.5, 38, 3.6, '#eab308', { rx: 1.6 }), line(46, 23, 46, 35, '#eab308', 1.4)],
  crown: () => [path('M37 29 l1.5 -9 l4.5 5 l3 -7 l3 7 l4.5 -5 l1.5 9 Z', '#facc15', { stroke: '#ca8a04', 'stroke-width': 0.8 }), circle(46, 24, 1.3, '#ef4444'), circle(40.5, 26, 1, '#3b82f6'), circle(51.5, 26, 1, '#10b981')],
  tophat: look => [rect(32, 27.5, 28, 3.2, '#111827', { rx: 1.6 }), rect(36.5, 11, 19, 17, '#111827', { rx: 1.5 }), rect(36.5, 23.5, 19, 3, look.accent)],
};

// --- Heads by kind. Each gives what goes behind and on the head, and where the eyes and mouth go. ---

function humanHead(look) {
  const [back, front] = HAIR_STYLES[look.hairStyle % HAIR_STYLES.length](look.hair, look);
  return {
    back,
    base: [circle(46, 40, 15, look.skin), circle(31.8, 42.5, 2.8, look.skin)],
    beforeMouth: FACIAL_HAIR_ART[look.facialHair]?.(look.hair),
    front,
    eyes: { anchors: HUMAN_EYES },
    mouth: { anchor: [47.5, 47] },
    cheeks: true,
  };
}

const HEADS = {
  human: humanHead,
  cat: look => {
    const fur = look.skin;
    const whiskers = fur === '#4b5563' ? '#e5e7eb' : '#475569';
    return {
      back: [path('M32 48 L32 20 L43 27 Z', fur), path('M60 46 L60 20 L49 27 Z', fur), path('M34 41 L34 24 L40 28 Z', '#f9a8d4'), path('M58 40 L58 24 L52 28 Z', '#f9a8d4')],
      base: circle(46, 40, 15, fur),
      features: [
        look.spotted && path('M44 27 v4 M48 26.5 v4.5 M52 27.5 v3.5', 'none', { stroke: darker(fur, 0.3), 'stroke-width': 1.4, 'stroke-linecap': 'round' }),
        ellipse(48, 46, 5.5, 3.6, lighter(fur, 0.55)),
        path('M46.5 43.6 h3.6 l-1.8 2.2 Z', '#f472b6'),
        path('M53 45 l7 -2 M53 46.6 l7 1 M43 45 l-7 -2 M43 46.6 l-7 1', 'none', { stroke: whiskers, 'stroke-width': 0.7 }),
      ],
      eyes: { anchors: [[42.5, 40], [52.5, 40]] },
      mouth: { anchor: [48.3, 48] },
    };
  },
  dog: look => {
    const fur = look.skin;
    const ear = darker(fur, 0.3);
    return {
      base: circle(46, 40, 15, fur),
      features: [
        ellipse(32, 42, 4.6, 9.5, ear, { transform: 'rotate(14 32 42)' }), ellipse(60, 42, 4.6, 9.5, ear, { transform: 'rotate(-14 60 42)' }),
        look.spotted && circle(42.5, 39, 4.6, ear),
        ellipse(49, 46, 7, 5, lighter(fur, 0.55)), ellipse(51.5, 43.4, 2.7, 2, INK),
      ],
      eyes: { anchors: [[42.5, 39], [51.5, 39]] },
      mouth: { anchor: [49, 48.5] },
    };
  },
  bear: look => {
    const fur = look.skin;
    return {
      back: [circle(34, 29, 5, fur), circle(58, 29, 5, fur), circle(34, 29, 2.6, lighter(fur, 0.45)), circle(58, 29, 2.6, lighter(fur, 0.45))],
      base: circle(46, 40, 15, fur),
      features: [ellipse(48, 46, 6.5, 5, lighter(fur, 0.55)), ellipse(49.5, 43.6, 2.6, 1.9, INK)],
      eyes: { anchors: [[42, 39], [52, 39]], color: fur === '#57534e' ? '#ffffff' : INK },
      mouth: { anchor: [49, 48.5] },
    };
  },
  panda: () => ({
    back: [circle(34, 29, 5, '#1f2937'), circle(58, 29, 5, '#1f2937')],
    base: circle(46, 40, 15, '#f8fafc'),
    features: [
      ellipse(42, 40, 3.6, 4.6, '#1f2937', { transform: 'rotate(-20 42 40)' }), ellipse(52, 40, 3.6, 4.6, '#1f2937', { transform: 'rotate(20 52 40)' }),
      ellipse(48, 46.5, 5, 3.6, '#ffffff'), ellipse(49, 44.5, 2.3, 1.6, INK),
    ],
    eyes: { anchors: [[42, 40], [52, 40]], color: '#ffffff' },
    mouth: { anchor: [49, 49] },
  }),
  fox: look => {
    const fur = look.skin;
    return {
      back: [path('M33 48 L31 18 L43 26 Z', fur), path('M59 46 L61 18 L49 26 Z', fur), path('M31.5 22 L31 18 L34.5 20.5 Z', '#1f2937'), path('M60.5 22 L61 18 L57.5 20.5 Z', '#1f2937')],
      base: circle(46, 40, 15, fur),
      features: [path('M33 42 Q44 57 65 45 Q53 41 47 44 Q41 40 33 42 Z', '#fff7ed'), circle(63.5, 44.6, 1.9, INK)],
      eyes: { anchors: [[43, 39], [52, 39]] },
      mouth: { anchor: [52, 48.5] },
    };
  },
  rabbit: look => {
    const fur = look.skin;
    return {
      back: [
        ellipse(42, 17, 3.8, 10.5, fur, { transform: 'rotate(-10 42 17)' }), ellipse(51, 16, 3.8, 10.5, fur, { transform: 'rotate(12 51 16)' }),
        ellipse(42, 17, 1.8, 7.5, '#f9a8d4', { transform: 'rotate(-10 42 17)' }), ellipse(51, 16, 1.8, 7.5, '#f9a8d4', { transform: 'rotate(12 51 16)' }),
      ],
      base: circle(46, 40, 15, fur),
      features: [ellipse(48.5, 44, 2, 1.5, '#f472b6'), rect(47.3, 48.3, 2.6, 2.8, '#ffffff', { stroke: '#e5e7eb', 'stroke-width': 0.4 })],
      eyes: { anchors: [[43, 40], [52, 40]] },
      mouth: { anchor: [48.5, 47] },
      cheeks: true,
    };
  },
  penguin: () => ({
    base: circle(46, 40, 15, '#1f2937'),
    features: ellipse(47, 43, 12, 10.5, '#f8fafc'),
    eyes: { anchors: [[43, 41], [51, 41]] },
    mouth: { custom: path('M51 43.5 l8 2 l-8 2.2 Z', '#f59e0b') },
    cheeks: true,
  }),
  frog: look => {
    const fur = look.skin;
    return {
      back: [circle(42, 29, 5.4, fur), circle(52.5, 29, 5.4, fur)],
      base: ellipse(47, 42, 18, 14, fur),
      features: [circle(42, 29, 3.9, '#ffffff'), circle(52.5, 29, 3.9, '#ffffff')],
      eyes: { anchors: [[42, 29], [52.5, 29]] },
      mouth: { anchor: [47.5, 46], width: 1.5 },
      cheeks: true,
    };
  },
  monkey: look => {
    const fur = look.skin;
    const face = lighter(fur, 0.5);
    return {
      back: [circle(30, 41, 4.6, fur), circle(62, 41, 4.6, fur), circle(30, 41, 2.6, face), circle(62, 41, 2.6, face)],
      base: circle(46, 40, 15, fur),
      features: [path('M39 37 Q44 33 47.5 38 Q51 33 56 37 Q59 48 47.5 54 Q36 48 39 37 Z', face), circle(47, 45, 0.7, darker(fur, 0.2)), circle(49, 45, 0.7, darker(fur, 0.2))],
      eyes: { anchors: [[43, 41], [52, 41]] },
      mouth: { anchor: [48, 48.5] },
    };
  },
  robot: look => ({
    back: [line(46, 27, 46, 19, '#64748b', 1.5), circle(46, 18, 2.3, look.accent, { class: 'p-antenna' })],
    base: [rect(31, 27, 30, 27, look.skin, { rx: 5, stroke: '#64748b', 'stroke-width': 1 }), circle(31, 41, 2.2, '#64748b'), circle(61, 41, 2.2, '#64748b')],
    features: rect(34, 35, 24, 10, '#0f172a', { rx: 3 }),
    eyes: { anchors: [[43, 40], [52, 40]], style: 'led' },
    mouth: { anchor: [47.5, 48.5], color: '#0e7490' },
  }),
  alien: look => ({
    back: [line(41, 26, 37, 17, look.skin, 1.6), circle(37, 16, 2.4, look.accent), line(52, 26, 56, 18, look.skin, 1.6), circle(56, 17, 2.4, look.accent)],
    base: ellipse(47, 39, 16.5, 18, look.skin),
    eyes: { anchors: [[42, 40], [52.5, 40]], style: 'big', color: '#111827' },
    mouth: { anchor: [47.5, 49] },
  }),
};

// Holiday accessories: hats on the head, or something held in the back hand.
const HEAD_ACCESSORIES = {
  purim: () => [path('M35 30 L46 5 L57 30 Z', '#a855f7'), path('M38.5 22 L53.5 22 M41.5 15 L50.5 15', 'none', { stroke: '#facc15', 'stroke-width': 2 }), circle(46, 5, 3, '#facc15')],
  hanukkah: () => [path('M30 36 A16 16 0 0 1 62 36 Z', '#2563eb'), rect(30, 33, 32, 4, '#93c5fd', { rx: 2 }), circle(46, 20, 3.5, '#ffffff')],
  shavuot: () => [[35, 29, '#f9a8d4'], [40, 25.5, '#fde047'], [46, 24.5, '#ffffff'], [52, 25.5, '#f9a8d4'], [57, 29, '#fde047']]
    .map(([cx, cy, fill]) => circle(cx, cy, 3, fill, { stroke: '#86efac', 'stroke-width': 1 })),
  pesach: () => [circle(32, 33, 3, '#fbcfe8'), circle(32, 33, 1.2, '#f59e0b')],
  'tu-bishvat': () => [circle(32, 33, 3, '#fce7f3'), circle(32, 33, 1.2, '#db2777')],
};
const BACK_HAND_ACCESSORIES = {
  atzmaut: () => [line(34, 84, 34, 56, '#64748b', 1.5), rect(34, 56, 15, 10, '#ffffff', { stroke: '#cbd5e1', 'stroke-width': 0.6 }),
    rect(34, 57.2, 15, 1.4, '#2563eb'), rect(34, 63.4, 15, 1.4, '#2563eb'), path('M41.5 59.2 l1.6 2.8 h-3.2 Z M41.5 63 l1.6 -2.8 h-3.2 Z', 'none', { stroke: '#2563eb', 'stroke-width': 0.6 })],
  'rosh-hashana': () => [circle(33, 85, 4.5, '#dc2626'), path('M33 80.5 q2 -3 4 -2', 'none', { stroke: '#15803d', 'stroke-width': 1.5 })],
  sukkot: () => [line(34, 86, 34, 44, '#15803d', 2), path('M34 50 l-4 -6 M34 56 l4 -6 M34 62 l-4 -6', 'none', { stroke: '#22c55e', 'stroke-width': 1.5 })],
};

// --- Body ---------------------------------------------------------------------------------

const BUILD_SHAPES = Object.freeze({
  slim: { x: 36, width: 20, arm: 5, rx: 9 },
  regular: { x: 34, width: 24, arm: 6, rx: 10 },
  broad: { x: 31, width: 30, arm: 7, rx: 13 },
});

function limbColors(look) {
  if (look.kind === 'robot') return { hand: look.skin, sleeve: look.skin, legs: look.skin, shoes: '#475569', legWidth: 6 };
  if (look.kind === 'penguin') return { hand: '#1f2937', sleeve: '#1f2937', legs: '#f59e0b', shoes: '#f59e0b', legWidth: 4 };
  return {
    hand: look.skin,
    sleeve: look.outfit === 'labcoat' ? '#f8fafc' : null, // null: the category color (CSS)
    legs: look.outfit === 'overalls' ? '#2563eb' : look.pants,
    shoes: look.shoes,
    legWidth: 7,
  };
}

function torsoParts(look, limbs, build) {
  const { x, width, rx } = build;
  const right = x + width;
  if (look.kind === 'robot') {
    return [rect(x, 55, width, 36, look.skin, { rx: 5, stroke: '#64748b', 'stroke-width': 1 }), rect(x + 4, 61, width - 8, 15, null, { rx: 2.5, class: 'p-torso' }),
      circle(42, 83, 1.6, '#ef4444'), circle(47, 83, 1.6, '#facc15'), circle(52, 83, 1.6, '#22c55e')];
  }
  if (look.kind === 'penguin') {
    // A black body with a white belly; the category color is its scarf.
    return [rect(x, 55, width, 36, '#1f2937', { rx: 13 }), ellipse(46.5, 76, width / 2 - 3, 14, '#f8fafc'),
      path('M37.5 55 Q46 61.5 54.5 55 L54.5 59.5 Q46 66 37.5 59.5 Z', null, { class: 'p-torso' }), rect(48.5, 59, 5, 11, null, { rx: 1.6, class: 'p-torso' })];
  }
  const base = rect(x, 55, width, 36, null, { rx, class: 'p-torso' });
  switch (look.outfit) {
    case 'hoodie':
      return [base, path(`M${x + 3} 57.5 Q46 50 ${right - 3} 57.5 Q46 63 ${x + 3} 57.5 Z`, null, { class: 'p-torso-dark' }),
        rect(39.5, 77, 13, 7, null, { rx: 3, class: 'p-torso-dark' }), line(44, 58, 43.5, 66, '#f8fafc', 1), line(48, 58, 48.5, 66, '#f8fafc', 1)];
    case 'suit':
      return [base, path('M41.5 55 L46 67 L50.5 55 Z', '#f8fafc'), path('M45 56.5 h2 l1.1 9 l-2.1 2.6 l-2.1 -2.6 Z', '#1f2937'),
        path('M40 55 L46 69 L52 55', 'none', { class: 'p-torso-dark-stroke', 'stroke-width': 1.6 }), circle(46, 75, 1.1, '#1f2937'), circle(46, 81, 1.1, '#1f2937')];
    case 'dress':
      return [path(`M${x + 1} 82 L${x - 6} 101 Q46 104 ${right + 6} 101 L${right - 1} 82 Z`, null, { class: 'p-torso' }), base,
        rect(x, 79, width, 3, null, { class: 'p-torso-dark' })];
    case 'overalls':
      return [base, rect(x + 4, 68, width - 8, 23, '#2563eb', { rx: 2 }), line(x + 6, 69, x + 5, 56, '#2563eb', 2.4), line(right - 6, 69, right - 5, 56, '#2563eb', 2.4),
        circle(x + 6, 70, 1.2, '#facc15'), circle(right - 6, 70, 1.2, '#facc15'), rect(42, 74, 8, 5, '#1d4ed8', { rx: 1 })];
    case 'labcoat':
      return [base, rect(x - 1, 56, width + 2, 38, '#f8fafc', { rx, stroke: '#e2e8f0', 'stroke-width': 0.8 }), path('M42 56 L46 68 L50 56 Z', null, { class: 'p-torso' }),
        line(46, 68, 46, 92, '#e2e8f0', 0.8), rect(right - 9, 66, 6, 6, 'none', { stroke: '#cbd5e1', 'stroke-width': 0.8 }), line(right - 7, 64, right - 7, 68, '#2563eb', 1)];
    case 'stripes':
      return [base, ...[63, 71, 79].map(y => rect(x + 1, y, width - 2, 3, '#ffffff', { 'fill-opacity': 0.45 }))];
    case 'sweater':
      return [base, path('M41 55 l5 4.5 l5 -4.5 Z', '#f8fafc'), rect(x + 0.5, 86, width - 1, 4, null, { rx: 2, class: 'p-torso-dark' })];
    case 'vest':
      return [base,
        path(`M${x + 0.5} 60 L44 70 L44 90 L${x + 4} 90 Q${x + 0.5} 88 ${x + 0.5} 84 Z`, null, { class: 'p-torso-dark' }),
        path(`M${right - 0.5} 60 L48 70 L48 90 L${right - 4} 90 Q${right - 0.5} 88 ${right - 0.5} 84 Z`, null, { class: 'p-torso-dark' })];
    default: // tee
      return [base, path('M42 55 Q46 60 50 55 Z', limbs.hand)];
  }
}

function accessoryParts(look, build) {
  if (look.kind === 'penguin' || look.kind === 'robot') return null;
  switch (look.accessory) {
    case 'scarf': return [path('M37.5 55 Q46 61.5 54.5 55 L54.5 59.5 Q46 66 37.5 59.5 Z', look.accent), rect(48.5, 59, 5, 12, look.accent, { rx: 1.6 })];
    case 'bowtie': return [path('M41.5 55.5 L46 57.6 L41.5 59.7 Z M50.5 55.5 L46 57.6 L50.5 59.7 Z', look.accent), circle(46, 57.6, 1.2, darker(look.accent, 0.25))];
    case 'necklace': return [...[[40, 56], [41.8, 57.6], [43.8, 58.7], [46, 59.1], [48.2, 58.7], [50.2, 57.6], [52, 56]].map(([cx, cy]) => circle(cx, cy, 0.9, '#facc15')), circle(46, 61.2, 1.7, look.accent)];
    case 'badge': return [rect(build.x + build.width - 9, 63, 6, 8, '#f8fafc', { rx: 1 }), rect(build.x + build.width - 9, 63, 6, 2.2, look.accent)];
    case 'tie': return look.outfit === 'suit' || look.outfit === 'labcoat' ? null : path('M45 56.5 h2 l1.2 10 l-2.2 2.6 l-2.2 -2.6 Z', look.accent);
    default: return null;
  }
}

function overlay(mood) {
  switch (mood) {
    case 'waiting':
      return group('p-overlay', group('p-hourglass', path('M62 5 h12 l-6 8 l6 8 h-12 l6 -8 Z', '#fbbf24', { stroke: '#b45309', 'stroke-width': 1 })));
    case 'bored':
    case 'sleeping':
      return group('p-overlay', ...[[62, 26, 5], [69, 17, 6.5], [77, 6, 8]].map(([x, y, size], index) =>
        path(`M${x} ${y} h${size} l${-size} ${size} h${size}`, 'none', { stroke: '#64748b', 'stroke-width': 1.6, 'stroke-linejoin': 'round', class: `p-z p-z-${index}` })));
    case 'sweating':
      return group('p-overlay', path('M63 25 q3.5 4.5 0 7 q-3.5 -2.5 0 -7 Z', '#7dd3fc', { class: 'p-sweat' }));
    case 'celebrating':
      return group('p-overlay', ...[[18, 22], [74, 18], [12, 50]].map(([x, y], index) =>
        path(`M${x} ${y - 5} L${x + 1.5} ${y - 1.5} L${x + 5} ${y} L${x + 1.5} ${y + 1.5} L${x} ${y + 5} L${x - 1.5} ${y + 1.5} L${x - 5} ${y} L${x - 1.5} ${y - 1.5} Z`, '#facc15', { class: `p-sparkle p-sparkle-${index}` })));
    case 'idle':
      return group('p-overlay p-thought',
        circle(62, 28, 2, '#ffffff', { stroke: '#cbd5e1' }),
        circle(68, 19, 8.5, '#ffffff', { stroke: '#cbd5e1' }),
        path('M65.5 16.5 a2.6 2.6 0 1 1 3.6 2.4 c-.8 .4 -1.1 .9 -1.1 1.7', 'none', { stroke: '#64748b', 'stroke-width': 1.5, 'stroke-linecap': 'round' }),
        circle(68, 23.6, 0.9, '#64748b'));
    default:
      return null;
  }
}

/**
 * The SVG of one task's character. persona: from people-model.buildPersona (look, mood, activity).
 * CSS animates it by data-pose / data-mood / data-activity on the surrounding .agent element.
 * A festive character (most of them) wears the holiday's accessory instead of its own hat.
 */
export function createCharacterArt(persona, { seasonKey = null } = {}) {
  const { look, mood, activity } = persona;
  const face = MOOD_FACES[mood] ?? MOOD_FACES.idle;
  const build = BUILD_SHAPES[look.build] ?? BUILD_SHAPES.regular;
  const limbs = limbColors(look);
  const head = (HEADS[look.kind] ?? HEADS.human)(look);
  const season = look.festive ? seasonKey : null;
  const seasonHat = HEAD_ACCESSORIES[season]?.() ?? null;
  const headwear = seasonHat ? null : HEADWEAR_ART[look.headwear]?.(look) ?? null;
  const sleeveAttributes = limbs.sleeve ? {} : { class: 'p-sleeve' };
  const headScale = look.headSize / 15;
  const shadowWidth = 17 + (build.width - 24) / 2;

  return svg('svg', { viewBox: '0 0 92 124', class: 'person-art', 'aria-hidden': 'true', focusable: 'false' },
    ellipse(46, 114, shadowWidth, 3.4, null, { class: 'p-shadow' }),
    group('p-bob',
      group('p-figure',
        group('p-leg p-leg-back', line(41, 88, 40, 109, limbs.legs, limbs.legWidth), ellipse(41.5, 111, 5, 2.6, limbs.shoes)),
        group('p-leg p-leg-front', line(51, 88, 52, 109, limbs.legs, limbs.legWidth), ellipse(54, 111, 5, 2.6, limbs.shoes)),
        group('p-arm p-arm-back', line(37, 62, 34, 81, limbs.sleeve, build.arm, sleeveAttributes), circle(34, 83, 3.4, limbs.hand),
          BACK_HAND_ACCESSORIES[season]?.()),
        torsoParts(look, limbs, build),
        accessoryParts(look, build),
        group('p-head',
          svg('g', { transform: headScale === 1 ? null : `translate(46 55) scale(${headScale}) translate(-46 -55)` },
            head.back,
            head.base,
            head.features,
            head.cheeks && [circle(39.5, 45.5, 2.2, '#f9a8d4', { 'fill-opacity': 0.55 }), circle(55.5, 45.5, 2.2, '#f9a8d4', { 'fill-opacity': 0.55 })],
            drawEyes(face.eyes, head.eyes.anchors, head.eyes.style ?? 'dot', head.eyes.color ?? INK),
            head.beforeMouth,
            group('p-mouth', head.mouth.custom ?? drawMouth(face.mouth, head.mouth.anchor, head.mouth.color, head.mouth.width)),
            head.front,
            EYEWEAR_ART[look.eyewear]?.(head.eyes.anchors),
            headwear,
            seasonHat)),
        group('p-arm p-arm-front', line(55, 62, 58, 81, limbs.sleeve, build.arm, sleeveAttributes), circle(58, 83, 3.4, limbs.hand),
          group('p-hand-prop', HAND_PROPS[activity]?.()), cupInHand())),
      overlay(mood)));
}

// ---------------------------------------------------------------------------
// Office furniture (sizes in world-layout.js ART)
// ---------------------------------------------------------------------------

const BOOK_COLORS = ['#ef4444', '#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#14b8a6', '#64748b'];

function books(shelfBottom, seed) {
  const parts = [];
  let left = 7;
  let index = seed;
  while (left < 54) {
    const width = 4 + (index % 3);
    const height = 15 + ((index * 7) % 9);
    parts.push(rect(left, shelfBottom - height, width, height, BOOK_COLORS[index % BOOK_COLORS.length], { rx: 0.6 }));
    left += width + 0.8;
    index += 1;
  }
  return parts;
}

const PLANTS = [
  () => [ellipse(14, 30, 6, 12, '#16a34a', { transform: 'rotate(-35 14 30)' }), ellipse(30, 28, 6, 13, '#22c55e', { transform: 'rotate(30 30 28)' }),
    ellipse(22, 20, 6, 15, '#15803d'), ellipse(12, 42, 5, 9, '#22c55e', { transform: 'rotate(-60 12 42)' }), ellipse(33, 41, 5, 9, '#16a34a', { transform: 'rotate(60 33 41)' })],
  () => [path('M16 48 Q12 26 15 6 Q19 26 20 48 Z', '#15803d'), path('M21 48 Q21 20 24 2 Q27 22 25 48 Z', '#16a34a'), path('M26 48 Q30 28 33 12 Q32 30 30 48 Z', '#22c55e'),
    path('M18 30 v10 M23 18 v14 M30 26 v10', 'none', { stroke: '#bbf7d0', 'stroke-width': 0.8 })],
];

const DECOR = {
  window: () => [
    rect(2, 2, 96, 68, '#e2e8f0', { rx: 3 }),
    rect(7, 7, 86, 58, null, { class: 'win-sky' }),
    circle(72, 22, 8, null, { class: 'win-sun' }),
    path('M31 13 a9 9 0 1 0 9 12 a7 7 0 1 1 -9 -12 Z', null, { class: 'win-moon' }),
    group('win-stars', circle(18, 15, 0.9, '#ffffff'), circle(56, 12, 0.8, '#ffffff'), circle(84, 30, 0.9, '#ffffff'), circle(44, 26, 0.7, '#ffffff'), circle(64, 40, 0.7, '#ffffff')),
    group('win-cloud', ellipse(28, 30, 10, 4, '#ffffff'), ellipse(34, 27, 6, 4, '#ffffff'), ellipse(70, 44, 8, 3.2, '#ffffff')),
    path('M7 65 V52 h8 v-6 h7 v10 h6 v-14 h9 v18 h7 v-9 h8 v13 h10 v-16 h8 v12 h7 v-7 h9 V65 Z', null, { class: 'win-city' }),
    rect(48, 7, 4, 58, '#e2e8f0'), rect(7, 34, 86, 3, '#e2e8f0'),
    rect(0, 66, 100, 6, '#cbd5e1', { rx: 1.5 }),
  ],
  picture: variant => [
    rect(0, 0, 44, 34, '#78350f', { rx: 2 }), rect(3, 3, 38, 28, '#fef3c7'),
    ...(variant % 2 === 0
      ? [circle(31, 11, 4, '#f59e0b'), path('M3 31 L15 15 L23 24 L29 18 L41 31 Z', '#16a34a')]
      : [circle(15, 15, 7, '#ec4899', { 'fill-opacity': 0.8 }), rect(22, 9, 12, 12, '#3b82f6', { 'fill-opacity': 0.8 }), path('M10 28 L20 20 L30 28 Z', '#f59e0b')]),
  ],
  clock: () => [
    circle(20, 20, 18, '#ffffff', { stroke: '#334155', 'stroke-width': 2.4 }),
    ...Array.from({ length: 12 }, (_, hour) => {
      const angle = (hour * Math.PI) / 6;
      return line(20 + Math.sin(angle) * 14.2, 20 - Math.cos(angle) * 14.2, 20 + Math.sin(angle) * 16, 20 - Math.cos(angle) * 16, '#334155', hour % 3 === 0 ? 1.6 : 0.9);
    }),
    line(20, 20, 20, 11, '#0f172a', 2.2, { class: 'clock-hour' }),
    line(20, 20, 20, 6.5, '#0f172a', 1.4, { class: 'clock-minute' }),
    circle(20, 20, 1.6, '#ef4444'),
  ],
  door: () => [
    rect(0, 0, 50, 92, '#cbd5e1', { rx: 2 }),
    rect(4, 4, 42, 88, '#b07a4f', { rx: 1.5 }),
    rect(9, 10, 32, 30, 'none', { stroke: '#8b5e3c', 'stroke-width': 1.5, rx: 1.5 }),
    rect(9, 48, 32, 36, 'none', { stroke: '#8b5e3c', 'stroke-width': 1.5, rx: 1.5 }),
    circle(39, 52, 2.4, '#facc15'),
  ],
  shelf: () => [
    rect(0, 0, 64, 92, '#8b5e3c', { rx: 2 }),
    rect(4, 4, 56, 84, '#a47148'),
    rect(4, 30, 56, 3, '#8b5e3c'), rect(4, 58, 56, 3, '#8b5e3c'),
    ...books(30, 0), ...books(58, 3), ...books(88, 5),
  ],
  sofa: () => [
    rect(12, 6, 126, 34, '#0f766e', { rx: 10 }),
    rect(6, 34, 138, 20, '#14b8a6', { rx: 7 }),
    line(52, 36, 52, 52, '#0f766e', 1.4), line(98, 36, 98, 52, '#0f766e', 1.4),
    rect(0, 22, 16, 34, '#0f766e', { rx: 7 }), rect(134, 22, 16, 34, '#0f766e', { rx: 7 }),
    rect(12, 54, 5, 10, '#475569'), rect(133, 54, 5, 10, '#475569'),
    rect(20, 14, 22, 18, '#fbbf24', { rx: 6 }), rect(110, 14, 20, 17, '#f472b6', { rx: 6 }),
  ],
  coffee: () => [
    rect(0, 46, 56, 46, '#cbd5e1', { rx: 2 }),
    line(28, 50, 28, 88, '#94a3b8', 1), circle(24, 68, 1.2, '#64748b'), circle(32, 68, 1.2, '#64748b'),
    rect(8, 12, 36, 34, '#334155', { rx: 4 }),
    rect(13, 16, 14, 7, '#22d3ee', { rx: 1.5 }),
    circle(36, 19, 2.2, '#ef4444'),
    rect(20, 27, 12, 4, '#1e293b'),
    rect(14, 42, 24, 3, '#64748b'),
    rect(22, 34, 8, 8, '#f8fafc', { rx: 1.2 }),
    path('M20 9 q-1.5 -2.5 0 -5 M26 9 q-1.5 -2.5 0 -5 M32 9 q-1.5 -2.5 0 -5', 'none', { stroke: '#94a3b8', 'stroke-width': 1, class: 'p-steam' }),
  ],
  cooler: () => [
    path('M8 4 Q8 0 12 0 H24 Q28 0 28 4 V34 Q28 38 24 38 H12 Q8 38 8 34 Z', '#7dd3fc', { 'fill-opacity': 0.75, stroke: '#38bdf8', 'stroke-width': 1 }),
    circle(15, 28, 1.4, '#ffffff', { class: 'cooler-bubble' }), circle(21, 22, 1, '#ffffff', { class: 'cooler-bubble cooler-bubble-2' }),
    rect(14, 36, 8, 4, '#0ea5e9'),
    rect(4, 40, 28, 52, '#f1f5f9', { rx: 3, stroke: '#cbd5e1', 'stroke-width': 1 }),
    circle(13, 52, 2, '#3b82f6'), circle(23, 52, 2, '#ef4444'),
    rect(9, 60, 18, 3, '#cbd5e1'),
    rect(10, 70, 16, 18, '#e2e8f0', { rx: 1.5 }),
  ],
  plant: variant => [
    ...PLANTS[variant % PLANTS.length](),
    path('M10 48 h24 l-3 22 h-18 Z', variant % 2 === 0 ? '#c2410c' : '#475569'),
    rect(8, 46, 28, 5, variant % 2 === 0 ? '#ea580c' : '#64748b', { rx: 2 }),
  ],
  rug: () => [
    ellipse(100, 20, 98, 18, '#fde68a'),
    ellipse(100, 20, 88, 14, 'none', { stroke: '#f59e0b', 'stroke-width': 2, 'stroke-dasharray': '6 4' }),
    ellipse(100, 20, 70, 9, '#fef3c7'),
  ],
};

/** A piece of office furniture; size: { width, height } of its viewBox (world-layout.js ART). */
export function createDecorArt(kind, size, { variant = 0 } = {}) {
  return svg('svg', { viewBox: `0 0 ${size.width} ${size.height}`, class: `decor-art decor-${kind}`, 'aria-hidden': 'true', focusable: 'false' },
    DECOR[kind]?.(variant));
}

/** Points the office clock's hands at the given time. */
export function setClockTime(clockSvg, date) {
  const minutes = date.getMinutes();
  const hours = (date.getHours() % 12) + minutes / 60;
  clockSvg.querySelector('.clock-hour')?.setAttribute('transform', `rotate(${hours * 30} 20 20)`);
  clockSvg.querySelector('.clock-minute')?.setAttribute('transform', `rotate(${minutes * 6} 20 20)`);
}

// ---------------------------------------------------------------------------
// Holiday emblems (top bar and the people view's sky), viewBox 32 x 32
// ---------------------------------------------------------------------------

const EMBLEMS = {
  'rosh-hashana': () => [
    circle(16, 19, 10, '#be123c'),
    path('M11 9.5 l1.7 3 l1.6 -3 l1.7 3 l1.6 -3 l1.7 3 l1.6 -3 v4 h-9.9 Z', '#9f1239'),
    circle(12, 16, 2.4, '#fda4af', { 'fill-opacity': 0.6 }),
  ],
  sukkot: () => [
    rect(5, 14, 22, 14, '#e7c995'),
    rect(13, 19, 6, 9, '#a16207'),
    path('M3 14 q3 -5 6 0 q3 -5 6 0 q3 -5 6 0 q3 -5 6 0 q2 -3 3 0', '#16a34a'),
  ],
  hanukkah: () => [
    rect(6, 27, 20, 2.5, '#ca8a04', { rx: 1 }),
    rect(15, 16, 2, 11, '#ca8a04'),
    path('M5 17 q0 6 11 6 q11 0 11 -6', 'none', { stroke: '#ca8a04', 'stroke-width': 1.6 }),
    ...[5, 7.75, 10.5, 13.25, 18.75, 21.5, 24.25, 27].map(x => [rect(x - 0.7, 12, 1.4, 5, '#93c5fd'), svg('ellipse', { cx: x, cy: 10.5, rx: 1, ry: 1.6, fill: '#f59e0b', class: 'flame' })]),
    rect(15.3, 9, 1.4, 7, '#93c5fd'),
    svg('ellipse', { cx: 16, cy: 7.5, rx: 1.1, ry: 1.8, fill: '#f59e0b', class: 'flame' }),
  ],
  'tu-bishvat': () => [
    rect(14.5, 18, 3, 11, '#92400e'),
    circle(16, 12, 8, '#22c55e'),
    circle(10, 15, 5, '#16a34a'),
    circle(22, 15, 5, '#16a34a'),
    circle(12, 10, 1.6, '#fbcfe8'), circle(19, 8, 1.6, '#fbcfe8'), circle(21, 14, 1.6, '#fbcfe8'), circle(14, 15, 1.6, '#fbcfe8'),
  ],
  purim: () => [
    path('M3 12 q6 -4 13 1 q7 -5 13 -1 q0 9 -7 9 q-4 0 -6 -3 q-2 3 -6 3 q-7 0 -7 -9 Z', '#9333ea'),
    svg('ellipse', { cx: 10, cy: 14, rx: 3, ry: 2, fill: '#fef3c7' }),
    svg('ellipse', { cx: 22, cy: 14, rx: 3, ry: 2, fill: '#fef3c7' }),
    line(28, 17, 30, 30, '#ca8a04', 1.5),
    circle(16, 8, 1.6, '#facc15'),
  ],
  pesach: () => [
    rect(4, 6, 24, 22, '#f5deb3', { rx: 2.5, stroke: '#d4a373', 'stroke-width': 1 }),
    ...[11, 17, 23].map(y => line(6, y, 26, y, '#c8a27a', 1.2, { 'stroke-dasharray': '0.2 3' })),
  ],
  atzmaut: () => [
    rect(3, 7, 26, 18, '#ffffff', { stroke: '#cbd5e1', 'stroke-width': 0.8 }),
    rect(3, 9, 26, 2.2, '#2563eb'),
    rect(3, 20.8, 26, 2.2, '#2563eb'),
    path('M16 12.3 l3 5.2 h-6 Z M16 19.7 l3 -5.2 h-6 Z', 'none', { stroke: '#2563eb', 'stroke-width': 1 }),
  ],
  'lag-baomer': () => [
    line(7, 28, 25, 22, '#92400e', 3),
    line(7, 22, 25, 28, '#78350f', 3),
    path('M16 4 q7 8 4 15 q-2 4 -4 4 q-2 0 -4 -4 q-3 -7 4 -15 Z', '#f97316', { class: 'flame' }),
    path('M16 12 q3.5 4 2 8 q-1 2 -2 2 q-1 0 -2 -2 q-1.5 -4 2 -8 Z', '#fde047'),
  ],
  shavuot: () => [
    ...[10, 16, 22].map((x, index) => [
      line(x, 29, x + (index - 1) * 2, 10, '#ca8a04', 1.4),
      ...[0, 1, 2, 3].map(step => svg('ellipse', { cx: x + (index - 1) * 2 * (1 - step / 4) - 1.6, cy: 12 + step * 3.5, rx: 1.5, ry: 2.2, fill: '#eab308' })),
      ...[0, 1, 2, 3].map(step => svg('ellipse', { cx: x + (index - 1) * 2 * (1 - step / 4) + 1.6, cy: 12 + step * 3.5, rx: 1.5, ry: 2.2, fill: '#facc15' })),
    ]),
  ],
};

/** The emblem of a holiday season, or null. */
export function createSeasonEmblem(seasonKey, { size = 26 } = {}) {
  const draw = EMBLEMS[seasonKey];
  if (!draw) return null;
  return svg('svg', { viewBox: '0 0 32 32', width: size, height: size, class: 'season-emblem', 'aria-hidden': 'true', focusable: 'false' }, draw());
}
