// SVG art for the fun parts: the characters of the people view (many kinds and looks, mood overlays,
// holiday accessories), their desks (a station per activity), the office furniture, and the holiday
// emblems. Drawn with createElementNS (no markup strings), animated only by CSS classes (styles.css,
// "People view"), so it works under the strict Content-Security-Policy.
//
// Character coordinates (viewBox 92 x 124, facing right): the figure stands around x = 46 with its feet
// on y = 112. CSS rotates the arms around the shoulders (37,62) / (55,62) and the legs around the hips
// (41,88) / (51,88). Stations keep the coordinates they had next to the figure (x 68-140).

import { circle, darker, ellipse, group, lighter, line, path, rect, svg } from './svg-kit.js';
import { createWorldStationArt, worldDecorParts } from './art-worlds.js';

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
/**
 * The station of an activity (desk with a laptop, easel, cart...), with a check flag once the task is done.
 * worldStation: a themed world's station key (art-worlds.js) to draw instead.
 */
export function createStationArt(activity, { done = false, worldStation = null } = {}) {
  const themed = worldStation && createWorldStationArt(worldStation, { done, doneFlag });
  if (themed) return themed;
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
  bigbeard: hair => path('M31 41 Q29 63 47 66 Q64 63 61 40 Q58 49 47.5 49.5 Q36 49 31 41 Z', hair),
  mustache: hair => path('M42.5 45.5 q2.6 -2 5 0 q2.4 -2 5 0 q-2.6 2.4 -5 0.8 q-2.4 1.6 -5 -0.8 Z', hair),
  goatee: hair => path('M45 50.5 q2.5 2 5 0 l-1 4 q-1.5 1.2 -3 0 Z', hair),
};

const EYEWEAR_ART = {
  eyepatch: ([, [x2, y2]]) => [path('M30 35 L62 46', 'none', { stroke: '#111827', 'stroke-width': 1 }), ellipse(x2, y2, 3.8, 3.4, '#111827')],
  goggles: ([[x1, y1], [x2, y2]], look) => [
    path(`M30 ${y1} H62`, 'none', { stroke: '#334155', 'stroke-width': 2 }),
    circle(x1, y1, 3.9, '#a5f3fc', { stroke: look?.accent ?? '#334155', 'stroke-width': 1.8, 'fill-opacity': 0.75 }),
    circle(x2, y2, 3.9, '#a5f3fc', { stroke: look?.accent ?? '#334155', 'stroke-width': 1.8, 'fill-opacity': 0.75 }),
  ],
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
  wizard: look => [path('M33 29 Q45 11 53 1 Q52 16 59 29 Z', look.accent), ellipse(46, 29, 19, 3.6, darker(look.accent, 0.15)), rect(35.5, 25, 21, 3, darker(look.accent, 0.35)), circle(49, 15, 1.4, '#facc15')],
  helmet: () => [path('M30 37 A16 16 0 0 1 62 37 Z', '#94a3b8'), rect(29, 34, 34, 4, '#64748b', { rx: 1.5 }), rect(44.8, 34, 2.6, 9, '#64748b', { rx: 1 }),
    path('M31 31 q-7 -3 -6 -12 q4 7 9 8 Z', '#f5f5f4'), path('M61 31 q7 -3 6 -12 q-4 7 -9 8 Z', '#f5f5f4')],
  bubble: () => [circle(46, 40, 21.5, '#bae6fd', { 'fill-opacity': 0.22, stroke: '#e0f2fe', 'stroke-width': 1.6 }), path('M32 30 q5 -7 13 -9', 'none', { stroke: '#ffffff', 'stroke-width': 1.6, 'stroke-linecap': 'round', 'stroke-opacity': 0.8 })],
  tricorn: () => [path('M33 31 Q46 12 59 31 Z', '#1f2937'), path('M25 32 Q46 21 67 32 Q58 27 46 25.5 Q34 27 25 32 Z', '#111827'), path('M27 31.5 Q46 21.5 65 31.5', 'none', { stroke: '#facc15', 'stroke-width': 0.9 })],
  bandana: look => [path('M31 37 A15 14 0 0 1 61 37 Z', look.accent), path('M31.5 36 l-7 3.5 l5 2.5 Z', look.accent), ...[[38, 30], [46, 28], [54, 31]].map(([x, y]) => circle(x, y, 1, '#ffffff'))],
  mask: (look, [[x1, y1], [x2, y2]] = HUMAN_EYES) => [
    path(`M30 ${y1 - 3.5} H62 V${y1 + 3.5} H30 Z M${x1 - 3} ${y1} a3 2.6 0 1 0 6 0 a3 2.6 0 1 0 -6 0 Z M${x2 - 3} ${y2} a3 2.6 0 1 0 6 0 a3 2.6 0 1 0 -6 0 Z`, look.accent, { 'fill-rule': 'evenodd' }),
    path(`M30.5 ${y1 - 1} l-6 -3 M30.5 ${y1 + 1} l-6 3`, 'none', { stroke: look.accent, 'stroke-width': 1.6, 'stroke-linecap': 'round' }),
  ],
  toque: () => [rect(35, 22, 22, 12, '#ffffff', { stroke: '#e2e8f0', 'stroke-width': 0.8 }), circle(37.5, 20, 6, '#ffffff'), circle(46, 16.5, 7, '#ffffff'), circle(54.5, 20, 6, '#ffffff'), rect(34, 30.5, 24, 4.5, '#f1f5f9', { stroke: '#e2e8f0', 'stroke-width': 0.8, rx: 1 })],
  laurel: () => [...[-4, -3, -2, -1, 1, 2, 3, 4].map(step => {
    const angle = (step * 18 * Math.PI) / 180;
    const cx = 46 + Math.sin(angle) * 15.5;
    const cy = 40 - Math.cos(angle) * 15.5;
    return ellipse(cx, cy, 1.9, 3.4, '#eab308', { transform: `rotate(${step * 18 + (step < 0 ? 35 : -35)} ${cx} ${cy})` });
  })],
  cowboy: () => [ellipse(46, 30.5, 22, 4.2, '#92400e'), path('M35 30.5 Q34.5 15 46 18.5 Q57.5 15 57 30.5 Z', '#a16207'), rect(35.4, 26, 21.2, 3.2, '#78350f'), path('M46 18.5 v6', 'none', { stroke: '#78350f', 'stroke-width': 1 })],
  safari: () => [path('M31 34 A15 14 0 0 1 61 34 Z', '#e7d3a1'), ellipse(46, 34, 20, 3.6, '#d6c08f'), rect(31.5, 30.5, 29, 2.6, '#a16207')],
  visor: (look, [[x1, y1], [x2, y2]] = HUMAN_EYES) => [rect(x1 - 5.5, y1 - 3.5, x2 - x1 + 11, 7, look.accent, { rx: 3.5, 'fill-opacity': 0.85, class: 'p-glow' }), line(x1 - 3, y1 - 1.5, x1 + 1, y1 - 1.5, '#ffffff', 0.9, { 'stroke-opacity': 0.8 })],
  hood: () => path('M28 50 Q26 22 46 21 Q66 22 64 50 Q61 30 46 29.5 Q31 30 28 50 Z', null, { class: 'p-torso-dark' }),
  kerchief: look => [path('M30 38 Q32 22 46 22 Q60 22 62 38 Q46 30 30 38 Z', look.accent), path('M30.5 37 l-5 5 l6 -1 Z', look.accent)],
  earpiece: () => [path('M31.5 39 q-3 2 -1 5', 'none', { stroke: '#111827', 'stroke-width': 1.8, 'stroke-linecap': 'round' }), path('M30.5 44 q-2 6 3 10', 'none', { stroke: '#94a3b8', 'stroke-width': 0.8 })],
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
  // Fantasy folk: human heads with a twist (pointed ears; dwarves' big beard and hobbits' curls come from the look).
  elf: look => ({ ...humanHead(look), base: [circle(46, 40, 15, look.skin), path('M33.5 44 L21 32.5 L33.5 37.5 Z', look.skin), line(31, 41, 25, 35.5, darker(look.skin, 0.15), 0.8)] }),
  dwarf: humanHead,
  hobbit: humanHead,
  merfolk: humanHead,
  owl: look => {
    const feathers = look.skin;
    return {
      back: [path('M33 31 L30 18 L40 27 Z', feathers), path('M59 31 L62 18 L52 27 Z', feathers)],
      base: circle(46, 40, 15.5, feathers),
      features: [circle(42, 40, 6.6, lighter(feathers, 0.6)), circle(52, 40, 6.6, lighter(feathers, 0.6)), path('M31 33 Q46 27 61 33', 'none', { stroke: darker(feathers, 0.25), 'stroke-width': 1.4 })],
      eyes: { anchors: [[42, 40], [52, 40]], style: 'big', color: '#1f2937' },
      mouth: { custom: path('M45 44 l2.5 5.5 l2.5 -5.5 Z', '#f59e0b') },
    };
  },
  ghost: look => ({
    base: path('M30 44 A16 16 0 0 1 62 44 L62 56 L30 56 Z', look.skin, { 'fill-opacity': 0.92 }),
    eyes: { anchors: [[41, 40], [52, 40]], style: 'big', color: '#334155' },
    mouth: { anchor: [46.5, 48.5], color: '#334155' },
    cheeks: true,
  }),
  tree: look => {
    const bark = look.skin;
    return {
      back: [circle(36, 26, 9, '#16a34a'), circle(47, 19, 11, '#22c55e'), circle(58, 25, 9, '#15803d'), circle(46, 28, 10, '#16a34a')],
      base: rect(32, 27, 28, 29, bark, { rx: 9 }),
      features: path('M36 32 v7 M57 34 v8 M38 52 q3 2 6 0', 'none', { stroke: darker(bark, 0.3), 'stroke-width': 1.2, 'stroke-linecap': 'round' }),
      eyes: { anchors: [[42, 41], [52, 41]] },
      mouth: { anchor: [47.5, 48.5] },
    };
  },
  parrot: look => {
    const feathers = look.skin;
    return {
      back: [path('M42 27 q-5 -9 1 -13 q0 7 5 10 Z', lighter(feathers, 0.2)), path('M47 26 q-1 -9 6 -10 q-3 6 0 10 Z', darker(feathers, 0.15))],
      base: circle(46, 40, 15, feathers),
      features: [circle(51.5, 39, 4.6, '#ffffff'), path('M55 36 q10 1 8 10 q-3 -3 -8 -3 Z', '#f59e0b')],
      eyes: { anchors: [[43, 39], [51.5, 39]] },
      mouth: { custom: path('M55 44 q5 1 6 -1 l-6 -1.5 Z', '#b45309') },
    };
  },
  octopus: look => ({
    base: ellipse(46, 37, 16.5, 18, look.skin),
    features: [circle(38, 28, 2.2, lighter(look.skin, 0.4)), circle(53, 25, 1.6, lighter(look.skin, 0.4)), circle(57, 32, 1.4, lighter(look.skin, 0.4))],
    eyes: { anchors: [[42, 40], [52, 40]], style: 'big', color: '#111827' },
    mouth: { anchor: [47, 48.5] },
    cheeks: true,
  }),
  fish: look => {
    const scales = look.skin;
    return {
      back: path('M38 29 q8 -13 19 -1 Z', darker(scales, 0.2)),
      base: ellipse(47, 40, 17, 14, scales),
      features: [path('M36 34 q-3 6 0 12', 'none', { stroke: darker(scales, 0.25), 'stroke-width': 1.3 }), path('M38 45 l-7 4 l8 1 Z', darker(scales, 0.2))],
      eyes: { anchors: [[46, 37], [55, 37]], style: 'big', color: '#111827' },
      mouth: { anchor: [58, 45], width: 0.6 },
    };
  },
  turtle: look => ({
    base: circle(46, 41, 14, look.skin),
    features: [circle(40, 33, 1.8, darker(look.skin, 0.2)), circle(53, 31, 1.4, darker(look.skin, 0.2))],
    eyes: { anchors: [[42, 41], [52, 41]] },
    mouth: { anchor: [47.5, 48] },
    cheeks: true,
  }),
  dino: look => {
    const skin = look.skin;
    return {
      back: [[36, 27], [42, 23], [49, 22], [56, 24]].map(([x, y]) => path(`M${x - 3} ${y + 3} L${x} ${y - 4} L${x + 3} ${y + 3} Z`, darker(skin, 0.25))),
      base: path('M31 45 Q29 27 46 25 Q59 24 62 35 L71 38 Q76 45 69 49 L50 51 Q33 53 31 45 Z', skin),
      features: [circle(70, 41, 0.9, darker(skin, 0.5)), path('M56 49.5 l1.5 2.5 l1.5 -2.5 Z M61 49 l1.5 2.5 l1.5 -2.5 Z', '#ffffff')],
      eyes: { anchors: [[44, 36], [53, 35]] },
      mouth: { anchor: [60, 46], width: 0.8 },
    };
  },
  horse: look => {
    const coat = look.skin;
    const mane = darker(coat, 0.4);
    return {
      back: [path('M40 26 l1 -8 l5 6 Z', coat), path('M33 30 q-7 7 -4 18 q5 -3 7 -10 Z', mane)],
      base: path('M35 46 Q31 25 46 23 Q58 22 61 34 L67 46 Q68 55 59 55 Q51 55 47 49 Q40 53 35 46 Z', coat),
      features: [path('M38 25 q6 -4 12 0', 'none', { stroke: mane, 'stroke-width': 2.5 }), ellipse(61, 50, 5.5, 4, lighter(coat, 0.25)), circle(63, 50, 1.1, darker(coat, 0.45))],
      eyes: { anchors: [[46, 36], [54, 35]] },
      mouth: { anchor: [60, 53], width: 0.6 },
    };
  },
  droid: look => ({
    base: [path('M30 47 A16 16 0 0 1 62 47 Z', look.skin, { stroke: '#64748b', 'stroke-width': 1 }), rect(30, 46, 32, 7, look.accent, { rx: 1.5 })],
    features: [circle(52, 36, 4.2, '#0f172a'), circle(53, 35, 1.3, '#38bdf8'), circle(38, 39, 1.8, '#ef4444', { class: 'p-antenna' })],
    eyes: { anchors: [[43, 38], [52, 36]], style: 'led' },
    mouth: { custom: rect(41, 48.5, 10, 2, '#0f172a', { rx: 1 }) },
  }),
  yeti: look => {
    const fur = look.skin;
    return {
      back: path('M29 42 l-3 -6 l4 -2 l-2 -6 l5 0 l0 -6 l5 3 l2 -6 l5 4 l4 -5 l4 5 l5 -4 l2 6 l5 -3 l0 6 l5 0 l-2 6 l4 2 l-3 6 Z', fur),
      base: circle(46, 41, 15.5, fur),
      features: ellipse(48, 44, 9, 8, lighter(fur, 0.45)),
      eyes: { anchors: [[44, 41], [52, 41]] },
      mouth: { anchor: [48, 48] },
    };
  },
  // An original little creature: round, with long or round ears.
  critter: look => {
    const fur = look.skin;
    const inner = lighter(fur, 0.45);
    const ears = look.spotted
      ? [circle(34, 28, 6, fur), circle(58, 28, 6, fur), circle(34, 28, 3, inner), circle(58, 28, 3, inner)]
      : [path('M35 32 L28 10 L43 26 Z', fur), path('M57 32 L64 10 L49 26 Z', fur), path('M34.5 28 L30.5 15 L39.5 25 Z', inner), path('M57.5 28 L61.5 15 L52.5 25 Z', inner)];
    return {
      back: ears,
      base: circle(46, 41, 15, fur),
      eyes: { anchors: [[42, 40], [52, 40]], style: 'big', color: '#111827' },
      mouth: { anchor: [47.5, 47.5], width: 0.6 },
      cheeks: true,
    };
  },
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

// How the body below the head is made, by kind (the rest wear an outfit over a plain body).
const KIND_BODY = Object.freeze({ robot: 'metal', droid: 'metal', penguin: 'penguin', ghost: 'sheet', tree: 'bark', critter: 'furry' });
// Kinds that do not walk on two legs.
const KIND_LEGS = Object.freeze({ ghost: 'none', octopus: 'tentacles', merfolk: 'tail' });
// Kinds whose legs are fur, scales or bark (no trousers).
const FURRY_LEGS = new Set(['dino', 'horse', 'yeti', 'critter', 'turtle', 'tree']);
const BIRD_LEGS = new Set(['owl', 'parrot']);
// Outfits with sleeves (and trousers) of their own color; the rest wear the category color.
const OUTFIT_SLEEVES = Object.freeze({ labcoat: '#f8fafc', spacesuit: '#f1f5f9', chef: '#f8fafc', trench: '#c8a27a', khaki: '#d6c08f', neon: '#1e1b4b', armor: '#94a3b8' });
const OUTFIT_LEGS = Object.freeze({ overalls: '#2563eb', spacesuit: '#f1f5f9', khaki: '#a3825a' });

function limbColors(look) {
  const body = KIND_BODY[look.kind];
  if (body === 'metal') return { hand: look.skin, sleeve: look.skin, legs: look.skin, shoes: '#475569', legWidth: 6 };
  if (body === 'penguin') return { hand: '#1f2937', sleeve: '#1f2937', legs: '#f59e0b', shoes: '#f59e0b', legWidth: 4 };
  if (body === 'sheet') return { hand: look.skin, sleeve: look.skin, legs: look.skin, shoes: look.skin, legWidth: 7 };
  if (body === 'bark') return { hand: '#22c55e', sleeve: look.skin, legs: darker(look.skin, 0.15), shoes: darker(look.skin, 0.35), legWidth: 8 };
  if (body === 'furry') return { hand: look.skin, sleeve: look.skin, legs: look.skin, shoes: darker(look.skin, 0.2), legWidth: 7 };
  const sleeve = look.outfit === 'toga' ? look.skin : (OUTFIT_SLEEVES[look.outfit] ?? null); // null: the category color (CSS)
  if (BIRD_LEGS.has(look.kind)) return { hand: look.skin, sleeve, legs: '#f59e0b', shoes: '#f59e0b', legWidth: 3.5 };
  if (FURRY_LEGS.has(look.kind)) return { hand: look.skin, sleeve, legs: look.skin, shoes: darker(look.skin, 0.4), legWidth: 7 };
  return {
    hand: look.skin,
    sleeve,
    legs: OUTFIT_LEGS[look.outfit] ?? look.pants,
    shoes: look.kind === 'hobbit' ? look.skin : look.shoes, // hobbits go barefoot
    legWidth: 7,
  };
}

function legParts(look, limbs) {
  const mode = KIND_LEGS[look.kind] ?? 'legs';
  if (mode === 'none') return [group('p-leg p-leg-back'), group('p-leg p-leg-front')];
  if (mode === 'tentacles') {
    const tentacle = (x, side) => path(`M${x} 86 q${-3 * side} 9 ${2 * side} 16 q${4 * side} 5 ${-2 * side} 9`, 'none', { stroke: look.skin, 'stroke-width': 5, 'stroke-linecap': 'round' });
    return [group('p-leg p-leg-back', tentacle(38, 1), tentacle(43, -1)), group('p-leg p-leg-front', tentacle(49, 1), tentacle(54, -1))];
  }
  if (mode === 'tail') {
    return [group('p-leg p-leg-back'), group('p-leg p-leg-front',
      path('M36 84 Q34 98 44 106 L38 114 L47 110 L56 114 L50 106 Q60 98 56 84 Z', look.accent),
      path('M40 92 q6 3 12 0 M42 99 q4 2 8 0', 'none', { stroke: darker(look.accent, 0.25), 'stroke-width': 1 }))];
  }
  const footWidth = look.kind === 'hobbit' ? 6.8 : 5;
  return [
    group('p-leg p-leg-back', line(41, 88, 40, 109, limbs.legs, limbs.legWidth), ellipse(41.5, 111, footWidth, 2.6, limbs.shoes)),
    group('p-leg p-leg-front', line(51, 88, 52, 109, limbs.legs, limbs.legWidth), ellipse(54, 111, footWidth, 2.6, limbs.shoes)),
  ];
}

// Behind everything: a dinosaur's tail, a turtle's shell.
function backExtras(look) {
  if (look.kind === 'dino') return path('M38 80 Q20 84 8 100 Q24 96 40 90 Z', look.skin);
  if (look.kind === 'turtle') {
    return [ellipse(40, 72, 15, 19, '#4d7c0f', { stroke: '#365314', 'stroke-width': 1.5 }),
      path('M32 64 l8 -5 l8 5 v10 l-8 5 l-8 -5 Z', 'none', { stroke: '#365314', 'stroke-width': 1.2 })];
  }
  return null;
}

// A hero's cape hangs behind the body.
function capeParts(look, build) {
  if (look.outfit !== 'cape' || KIND_BODY[look.kind]) return null;
  return path(`M${build.x + 1} 57 Q46 53 ${build.x + build.width - 1} 57 L${build.x + build.width + 9} 104 Q46 98 ${build.x - 9} 104 Z`, null, { class: 'p-torso-dark' });
}

// Outfits over the body: base is the torso in the category color; x / right / width are its edges.
const OUTFIT_ART = {
  tee: ({ base, limbs }) => [base, path('M42 55 Q46 60 50 55 Z', limbs.hand)],
  hoodie: ({ base, x, right }) => [base, path(`M${x + 3} 57.5 Q46 50 ${right - 3} 57.5 Q46 63 ${x + 3} 57.5 Z`, null, { class: 'p-torso-dark' }),
    rect(39.5, 77, 13, 7, null, { rx: 3, class: 'p-torso-dark' }), line(44, 58, 43.5, 66, '#f8fafc', 1), line(48, 58, 48.5, 66, '#f8fafc', 1)],
  suit: ({ base }) => [base, path('M41.5 55 L46 67 L50.5 55 Z', '#f8fafc'), path('M45 56.5 h2 l1.1 9 l-2.1 2.6 l-2.1 -2.6 Z', '#1f2937'),
    path('M40 55 L46 69 L52 55', 'none', { class: 'p-torso-dark-stroke', 'stroke-width': 1.6 }), circle(46, 75, 1.1, '#1f2937'), circle(46, 81, 1.1, '#1f2937')],
  dress: ({ base, x, right, width }) => [path(`M${x + 1} 82 L${x - 6} 101 Q46 104 ${right + 6} 101 L${right - 1} 82 Z`, null, { class: 'p-torso' }), base,
    rect(x, 79, width, 3, null, { class: 'p-torso-dark' })],
  overalls: ({ base, x, right, width }) => [base, rect(x + 4, 68, width - 8, 23, '#2563eb', { rx: 2 }), line(x + 6, 69, x + 5, 56, '#2563eb', 2.4), line(right - 6, 69, right - 5, 56, '#2563eb', 2.4),
    circle(x + 6, 70, 1.2, '#facc15'), circle(right - 6, 70, 1.2, '#facc15'), rect(42, 74, 8, 5, '#1d4ed8', { rx: 1 })],
  labcoat: ({ base, x, right, width, rx }) => [base, rect(x - 1, 56, width + 2, 38, '#f8fafc', { rx, stroke: '#e2e8f0', 'stroke-width': 0.8 }), path('M42 56 L46 68 L50 56 Z', null, { class: 'p-torso' }),
    line(46, 68, 46, 92, '#e2e8f0', 0.8), rect(right - 9, 66, 6, 6, 'none', { stroke: '#cbd5e1', 'stroke-width': 0.8 }), line(right - 7, 64, right - 7, 68, '#2563eb', 1)],
  stripes: ({ base, x, width }) => [base, ...[63, 71, 79].map(y => rect(x + 1, y, width - 2, 3, '#ffffff', { 'fill-opacity': 0.45 }))],
  sweater: ({ base, x, width }) => [base, path('M41 55 l5 4.5 l5 -4.5 Z', '#f8fafc'), rect(x + 0.5, 86, width - 1, 4, null, { rx: 2, class: 'p-torso-dark' })],
  vest: ({ base, x, right }) => [base,
    path(`M${x + 0.5} 60 L44 70 L44 90 L${x + 4} 90 Q${x + 0.5} 88 ${x + 0.5} 84 Z`, null, { class: 'p-torso-dark' }),
    path(`M${right - 0.5} 60 L48 70 L48 90 L${right - 4} 90 Q${right - 0.5} 88 ${right - 0.5} 84 Z`, null, { class: 'p-torso-dark' })],
  // Themed outfits
  robe: ({ x, right }) => [path(`M${x} 57 Q46 52 ${right} 57 L${right + 5} 106 Q46 109 ${x - 5} 106 Z`, null, { class: 'p-torso' }),
    path('M41 56 L46 64 L51 56', 'none', { class: 'p-torso-dark-stroke', 'stroke-width': 1.8 }), line(46, 64, 46, 106, null, 1, { class: 'p-torso-dark-stroke' }), rect(x + 1, 79, right - x - 2, 2.4, '#facc15', { rx: 1 })],
  armor: ({ base, x, width }) => [base, rect(x + 2, 58, width - 4, 21, '#94a3b8', { rx: 6, stroke: '#64748b', 'stroke-width': 1 }),
    circle(x + 2, 59, 4.5, '#cbd5e1'), circle(x + width - 2, 59, 4.5, '#cbd5e1'), rect(x, 80, width, 3, '#78350f')],
  spacesuit: ({ x, width, rx }) => [rect(x, 55, width, 36, '#f1f5f9', { rx, stroke: '#cbd5e1', 'stroke-width': 0.8 }), rect(40.5, 62, 11, 9, null, { rx: 1.5, class: 'p-torso' }),
    circle(43, 66.5, 1, '#ffffff'), circle(49, 66.5, 1, '#facc15'), rect(x, 80, width, 3, '#94a3b8')],
  coat: ({ base, x, right }) => [base, path(`M${x} 70 L${x - 4} 100 L44 92 Z M${right} 70 L${right + 4} 100 L48 92 Z`, null, { class: 'p-torso-dark' }),
    path('M42 55 L46 64 L50 55 Z', '#f8fafc'), ...[64, 71, 78].map(y => circle(43, y, 1, '#facc15')), ...[64, 71, 78].map(y => circle(49, y, 1, '#facc15'))],
  cape: ({ base }) => [base, circle(46, 67, 4.6, '#facc15'), path('M44 67 l2 -3 l2 3 l-2 3 Z', null, { class: 'p-torso' }), rect(34, 80, 24, 3, '#facc15')],
  apron: ({ base, x, width }) => [base, rect(x + 3, 62, width - 6, 30, '#f8fafc', { rx: 3 }), line(x + 5, 62, x + 8, 55, '#f8fafc', 1.6), line(x + width - 5, 62, x + width - 8, 55, '#f8fafc', 1.6),
    rect(42, 74, 8, 6, 'none', { stroke: '#cbd5e1', 'stroke-width': 0.8 })],
  toga: ({ x, right, width, rx }) => [rect(x, 55, width, 40, '#f8fafc', { rx, stroke: '#e2e8f0', 'stroke-width': 0.8 }),
    path(`M${right} 56 L${right} 62 L${x + 2} 88 L${x} 82 Z`, null, { class: 'p-torso' }), circle(right - 2, 58, 1.8, '#facc15')],
  trench: ({ x, right, width, rx }) => [rect(x - 1, 55, width + 2, 42, '#c8a27a', { rx, stroke: '#a16207', 'stroke-width': 0.8 }),
    path('M41 55 L46 66 L51 55 Z', null, { class: 'p-torso' }), path(`M40 55 L46 70 L52 55`, 'none', { stroke: '#a16207', 'stroke-width': 1.4 }),
    rect(x - 1, 78, width + 2, 3, '#92400e'), circle(43, 72, 0.9, '#78350f'), circle(49, 72, 0.9, '#78350f')],
  chef: ({ x, width, rx }) => [rect(x, 55, width, 36, '#f8fafc', { rx, stroke: '#e2e8f0', 'stroke-width': 0.8 }),
    ...[61, 67, 73, 79].flatMap(y => [circle(42, y, 0.9, '#94a3b8'), circle(50, y, 0.9, '#94a3b8')]),
    path('M39 55 Q46 61 53 55 L52 59 Q46 63 40 59 Z', null, { class: 'p-torso' })],
  tunic: ({ base, x, width }) => [base, rect(x, 79, width, 3, '#78350f'), path('M44 56 L46 62 L48 56', 'none', { stroke: '#f8fafc', 'stroke-width': 0.9 }), circle(46, 80.5, 1.4, '#facc15')],
  khaki: ({ x, width, rx }) => [rect(x, 55, width, 36, '#d6c08f', { rx, stroke: '#a3825a', 'stroke-width': 0.8 }),
    rect(x + 3, 64, 6, 5, 'none', { stroke: '#a3825a', 'stroke-width': 0.8 }), rect(x + width - 9, 64, 6, 5, 'none', { stroke: '#a3825a', 'stroke-width': 0.8 }),
    path('M40 55 Q46 61 52 55 L50 60 Q46 63 42 60 Z', null, { class: 'p-torso' })],
  sheriff: ({ base, x, right }) => [base,
    path(`M${x + 0.5} 60 L44 70 L44 90 L${x + 4} 90 Q${x + 0.5} 88 ${x + 0.5} 84 Z`, '#78350f'),
    path(`M${right - 0.5} 60 L48 70 L48 90 L${right - 4} 90 Q${right - 0.5} 88 ${right - 0.5} 84 Z`, '#78350f'),
    path('M39 64 l1.2 2.4 l2.6 0.3 l-1.9 1.8 l0.5 2.6 l-2.4 -1.3 l-2.4 1.3 l0.5 -2.6 l-1.9 -1.8 l2.6 -0.3 Z', '#facc15')],
  jumpsuit: ({ base, x, width }) => [base, line(46, 56, 46, 90, null, 1.2, { class: 'p-torso-dark-stroke' }), rect(x, 78, width, 3, '#334155'), rect(x + 3, 62, 6, 4, null, { rx: 1, class: 'p-torso-dark' })],
  neon: ({ x, width, rx }) => [rect(x, 55, width, 36, '#1e1b4b', { rx }), path('M42 55 L46 66 L50 55 Z', null, { class: 'p-torso' }),
    rect(x + 1, 55, width - 2, 36, 'none', { rx, class: 'p-torso-glow', 'stroke-width': 1.4 }), line(x + 4, 72, x + width - 4, 72, null, 1.2, { class: 'p-torso-glow' })],
};

function torsoParts(look, limbs, build) {
  const { x, width, rx } = build;
  const right = x + width;
  switch (KIND_BODY[look.kind]) {
    case 'metal':
      return [rect(x, 55, width, 36, look.skin, { rx: 5, stroke: '#64748b', 'stroke-width': 1 }), rect(x + 4, 61, width - 8, 15, null, { rx: 2.5, class: 'p-torso' }),
        circle(42, 83, 1.6, '#ef4444'), circle(47, 83, 1.6, '#facc15'), circle(52, 83, 1.6, '#22c55e')];
    case 'penguin':
      // A black body with a white belly; the category color is its scarf.
      return [rect(x, 55, width, 36, '#1f2937', { rx: 13 }), ellipse(46.5, 76, width / 2 - 3, 14, '#f8fafc'),
        path('M37.5 55 Q46 61.5 54.5 55 L54.5 59.5 Q46 66 37.5 59.5 Z', null, { class: 'p-torso' }), rect(48.5, 59, 5, 11, null, { rx: 1.6, class: 'p-torso' })];
    case 'sheet':
      // A ghost is a floating sheet with a wavy hem; its scarf is in the category color.
      return [path('M33 55 Q46 50 59 55 L62 99 q-4 -5 -8 0 q-4 5 -8 0 q-4 -5 -8 0 q-4 5 -8 0 Z', look.skin, { 'fill-opacity': 0.92 }),
        path('M37.5 56 Q46 62.5 54.5 56 L54.5 60 Q46 66.5 37.5 60 Z', null, { class: 'p-torso' })];
    case 'bark':
      // A walking tree: a bark trunk with a sash in the category color.
      return [rect(x, 55, width, 37, look.skin, { rx: 6 }), path(`M${x + 4} 62 v18 M${right - 5} 60 v22`, 'none', { stroke: darker(look.skin, 0.3), 'stroke-width': 1.2 }),
        path(`M${x} 60 L${right} 76 L${right} 81 L${x} 65 Z`, null, { class: 'p-torso' })];
    case 'furry':
      // A little creature: fur, a lighter belly and a scarf in the category color.
      return [rect(x, 55, width, 36, look.skin, { rx: 14 }), ellipse(46.5, 76, width / 2 - 4, 12, lighter(look.skin, 0.45)),
        path('M37.5 55 Q46 61.5 54.5 55 L54.5 59.5 Q46 66 37.5 59.5 Z', null, { class: 'p-torso' })];
    default: {
      const base = rect(x, 55, width, 36, null, { rx, class: 'p-torso' });
      return (OUTFIT_ART[look.outfit] ?? OUTFIT_ART.tee)({ base, x, right, width, rx, look, limbs });
    }
  }
}

// Things held in the back hand (at about (34,83)) - themed worlds' wands, swords, lassos...
const HELD_ART = {
  wand: () => [line(34, 85, 27, 69, '#78350f', 1.7), circle(27, 68.5, 1.2, '#fde68a', { class: 'p-glow' })],
  staff: () => [line(34, 98, 34, 47, '#78350f', 2.3), circle(34, 45, 3.2, '#93c5fd', { class: 'p-glow' })],
  sword: () => [line(34, 79, 34, 56, '#cbd5e1', 2.4), line(30, 79.5, 38, 79.5, '#a16207', 2), line(34, 81, 34, 86, '#78350f', 2.2)],
  axe: () => [line(34, 92, 34, 62, '#78350f', 2.1), path('M34 62 q-9 1 -9 9 q4 -3 9 -3 Z', '#94a3b8')],
  lightsword: look => [rect(32.6, 79, 2.8, 8, '#475569', { rx: 0.8 }), line(34, 79, 34, 51, look.accent, 5, { 'stroke-opacity': 0.35, class: 'p-glow' }), line(34, 79, 34, 51, '#ffffff', 1.8)],
  trident: () => [line(34, 98, 34, 50, '#facc15', 1.8), path('M29.5 56 v-7 M34 56 v-9 M38.5 56 v-7 M29.5 56 h9', 'none', { stroke: '#facc15', 'stroke-width': 1.6, 'stroke-linecap': 'round' })],
  spatula: () => [line(34, 85, 32, 70, '#78350f', 1.9), rect(28.5, 61, 7, 9, '#94a3b8', { rx: 1.2 })],
  lasso: () => [ellipse(30, 87, 5.5, 4, 'none', { stroke: '#a16207', 'stroke-width': 1.6 }), ellipse(25, 79, 6, 5, 'none', { stroke: '#a16207', 'stroke-width': 1.4 })],
  scroll: () => [rect(28.5, 76, 11, 9, '#fef3c7', { rx: 1.5, stroke: '#d6c08f', 'stroke-width': 0.8 }), circle(28.5, 80.5, 1.8, '#d6c08f'), circle(39.5, 80.5, 1.8, '#d6c08f')],
  gadget: look => [rect(29.5, 77, 7.5, 11, '#111827', { rx: 1.5 }), rect(30.5, 78, 5.5, 6, look.accent, { class: 'p-glow' })],
  bolt: () => path('M37 61 l-7 11 h5 l-4 11 l10 -13 h-5 l4 -9 Z', '#facc15', { stroke: '#ca8a04', 'stroke-width': 0.6 }),
  net: () => [line(34, 85, 30, 66, '#78350f', 1.6), ellipse(29, 61, 6.5, 5.2, '#ffffff', { 'fill-opacity': 0.25, stroke: '#94a3b8', 'stroke-width': 1 }), path('M23.5 61 h11 M29 56 v10', 'none', { stroke: '#cbd5e1', 'stroke-width': 0.6 })],
  shovel: () => [line(34, 90, 34, 62, '#78350f', 2), path('M30 90 h8 l-1 8 q-3 3 -6 0 Z', '#94a3b8')],
};

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
 * activityProps: show the office activity's prop in the hand while working (themed worlds hold their own items).
 */
export function createCharacterArt(persona, { seasonKey = null, activityProps = true } = {}) {
  const { look, mood, activity } = persona;
  const face = MOOD_FACES[mood] ?? MOOD_FACES.idle;
  const build = BUILD_SHAPES[look.build] ?? BUILD_SHAPES.regular;
  const limbs = limbColors(look);
  const head = (HEADS[look.kind] ?? HEADS.human)(look);
  const season = look.festive ? seasonKey : null;
  const seasonHat = HEAD_ACCESSORIES[season]?.() ?? null;
  const headwear = seasonHat ? null : HEADWEAR_ART[look.headwear]?.(look, head.eyes.anchors) ?? null;
  const sleeveAttributes = limbs.sleeve ? {} : { class: 'p-sleeve' };
  const headScale = look.headSize / 15;
  const shadowWidth = 17 + (build.width - 24) / 2;
  const backHand = BACK_HAND_ACCESSORIES[season]?.() ?? HELD_ART[look.held]?.(look) ?? null;

  return svg('svg', { viewBox: '0 0 92 124', class: 'person-art', 'aria-hidden': 'true', focusable: 'false' },
    ellipse(46, 114, shadowWidth, 3.4, null, { class: 'p-shadow' }),
    group('p-bob',
      group('p-figure',
        backExtras(look),
        legParts(look, limbs),
        group('p-arm p-arm-back', line(37, 62, 34, 81, limbs.sleeve, build.arm, sleeveAttributes), circle(34, 83, 3.4, limbs.hand), backHand),
        capeParts(look, build),
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
            EYEWEAR_ART[look.eyewear]?.(head.eyes.anchors, look),
            headwear,
            seasonHat)),
        group('p-arm p-arm-front', line(55, 62, 58, 81, limbs.sleeve, build.arm, sleeveAttributes), circle(58, 83, 3.4, limbs.hand),
          group('p-hand-prop', activityProps && HAND_PROPS[activity]?.()), cupInHand())),
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
  // The rug's colors come from the room (styles.css) - these are the office's.
  rug: () => [
    ellipse(100, 20, 98, 18, '#fde68a', { class: 'rug-outer' }),
    ellipse(100, 20, 88, 14, 'none', { stroke: '#f59e0b', 'stroke-width': 2, 'stroke-dasharray': '6 4', class: 'rug-edge' }),
    ellipse(100, 20, 70, 9, '#fef3c7', { class: 'rug-inner' }),
  ],
};

// The office's own pieces under the keys the worlds use; the plant key picks the office plant's variant.
const OFFICE_DECOR_KEYS = Object.freeze({
  window: ['sky'], door: ['office'], sofa: ['sofa'], coffee: ['coffee'], cooler: ['cooler'], shelf: ['books'], picture: ['art'], plant: ['fern', 'snake'],
});

/**
 * A piece of furniture; size: { width, height } of its viewBox (world-layout.js ART).
 * theme: the world's variant key for this kind (worlds/*.js decor) - a themed piece (art-worlds.js), or the
 * office's own piece for the office keys.
 */
export function createDecorArt(kind, size, { variant = 0, theme = null } = {}) {
  const officeVariants = OFFICE_DECOR_KEYS[kind] ?? [];
  const themed = theme && !officeVariants.includes(theme) ? worldDecorParts(kind, theme) : null;
  const officeVariant = kind === 'plant' && theme ? Math.max(0, officeVariants.indexOf(theme)) + variant : variant;
  return svg('svg', { viewBox: `0 0 ${size.width} ${size.height}`, class: `decor-art decor-${kind}`, 'aria-hidden': 'true', focusable: 'false' },
    themed ?? DECOR[kind]?.(officeVariant));
}

/** The office's own variant keys, per furniture kind (the worlds are checked against these and art-worlds.js). */
export const OFFICE_SCENERY_KEYS = OFFICE_DECOR_KEYS;

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

/** Every kind, outfit, hat, eyewear and held item the character art can draw. */
export const CHARACTER_PARTS = Object.freeze({
  kinds: Object.freeze(Object.keys(HEADS)),
  outfits: Object.freeze(Object.keys(OUTFIT_ART)),
  headwear: Object.freeze(Object.keys(HEADWEAR_ART)),
  eyewear: Object.freeze(Object.keys(EYEWEAR_ART)),
  held: Object.freeze(Object.keys(HELD_ART)),
  facialHair: Object.freeze(Object.keys(FACIAL_HAIR_ART)),
});
