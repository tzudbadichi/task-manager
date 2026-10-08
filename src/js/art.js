// SVG art for the fun parts: the little characters of the people view (body, a hand prop and a
// "station" per activity, mood overlays, holiday accessories) and the holiday emblems.
// Drawn with createElementNS (no markup strings), animated only by CSS classes (styles.css,
// "People view"), so it works under the strict Content-Security-Policy.
//
// Character coordinates (viewBox 140 x 124, facing right): the figure stands around x = 46 with its
// feet on y = 112; the station (desk, easel, cart...) takes x = 72-136. CSS rotates the arms around
// the shoulders (37,62) / (55,62) and the legs around the hips (41,88) / (51,88).

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
const path = (d, fill, extra = {}) => svg('path', { d, fill, ...extra });
const line = (x1, y1, x2, y2, stroke, width, extra = {}) =>
  svg('line', { x1, y1, x2, y2, stroke, 'stroke-width': width, 'stroke-linecap': 'round', ...extra });

const WOOD = '#b07a4f';
const WOOD_DARK = '#8b5e3c';
const METAL = '#94a3b8';
const INK = '#1f2937';

// ---------------------------------------------------------------------------
// Stations: the furniture next to each character, by activity
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
// Hand props (in the front hand, at about (58,82); they move with the arm)
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

// ---------------------------------------------------------------------------
// The character
// ---------------------------------------------------------------------------

const HAIR_STYLES = [
  // short
  look => path('M31 40 A15 15 0 0 1 61 38 Q55 30 46 31 Q37 31 31 40 Z', look.hair),
  // long (falls behind the shoulders)
  look => path('M30 40 A16 16 0 0 1 62 39 L62 54 Q58 52 58 46 L34 46 Q34 52 30 55 Z', look.hair),
  // bun
  look => [circle(45, 23, 5.5, look.hair), path('M31 40 A15 15 0 0 1 61 38 Q55 31 46 31 Q37 31 31 40 Z', look.hair)],
  // spiky
  look => path('M31 39 L33 29 L37 32 L40 25 L44 30 L48 23 L51 30 L55 26 L57 32 L61 30 L61 38 Q54 32 46 33 Q38 32 31 39 Z', look.hair),
];

const MOUTHS = {
  smile: () => path('M42 47 Q47 51.5 52 47', 'none', { stroke: INK, 'stroke-width': 1.6, 'stroke-linecap': 'round' }),
  flat: () => path('M43 48 H51', 'none', { stroke: INK, 'stroke-width': 1.6, 'stroke-linecap': 'round' }),
  worried: () => path('M42 49 Q47 46 52 49', 'none', { stroke: INK, 'stroke-width': 1.6, 'stroke-linecap': 'round' }),
  open: () => path('M41.5 46 Q47 55 52.5 46 Z', '#7f1d1d'),
  small: () => circle(47.5, 48.5, 1.6, '#7f1d1d'),
};

const MOOD_FACES = {
  idle: { eyes: 'open', mouth: 'smile' },
  working: { eyes: 'open', mouth: 'smile' },
  sweating: { eyes: 'open', mouth: 'worried' },
  waiting: { eyes: 'open', mouth: 'flat' },
  bored: { eyes: 'half', mouth: 'flat' },
  sleeping: { eyes: 'closed', mouth: 'small' },
  celebrating: { eyes: 'happy', mouth: 'open' },
};

function eyes(kind) {
  if (kind === 'closed') return group('p-eyes', path('M41 41 q2 2 4 0 M50 41 q2 2 4 0', 'none', { stroke: INK, 'stroke-width': 1.4, 'stroke-linecap': 'round' }));
  if (kind === 'happy') return group('p-eyes', path('M41 42 q2 -3 4 0 M50 42 q2 -3 4 0', 'none', { stroke: INK, 'stroke-width': 1.5, 'stroke-linecap': 'round' }));
  if (kind === 'half') return group('p-eyes', rect(41, 41, 4, 1.6, INK, { rx: 0.8 }), rect(50, 41, 4, 1.6, INK, { rx: 0.8 }));
  return group('p-eyes p-blink', svg('ellipse', { cx: 43, cy: 41, rx: 1.8, ry: 2.3, fill: INK }), svg('ellipse', { cx: 52, cy: 41, rx: 1.8, ry: 2.3, fill: INK }));
}

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
        circle(60, 30, 2, '#ffffff', { stroke: '#cbd5e1' }),
        circle(66, 21, 8.5, '#ffffff', { stroke: '#cbd5e1' }),
        path('M63.5 18.5 a2.6 2.6 0 1 1 3.6 2.4 c-.8 .4 -1.1 .9 -1.1 1.7', 'none', { stroke: '#64748b', 'stroke-width': 1.5, 'stroke-linecap': 'round' }),
        circle(66, 25.6, 0.9, '#64748b'));
    default:
      return null;
  }
}

/**
 * The SVG of one task's character. persona: from people-model.buildPersona (look, mood, activity).
 * CSS animates it by the data-mood / data-activity attributes on the surrounding .person element.
 */
export function createCharacterArt(persona, { seasonKey = null } = {}) {
  const { look, mood, activity } = persona;
  const face = MOOD_FACES[mood] ?? MOOD_FACES.idle;
  const station = (STATIONS[activity] ?? STATIONS.coffee)();
  const handProp = HAND_PROPS[activity]?.() ?? null;
  const headAccessory = HEAD_ACCESSORIES[seasonKey]?.() ?? null;
  const backHandAccessory = BACK_HAND_ACCESSORIES[seasonKey]?.() ?? null;
  const hairStyle = HAIR_STYLES[look.hairStyle % HAIR_STYLES.length];

  return svg('svg', { viewBox: '0 0 140 124', class: 'person-art', 'aria-hidden': 'true', focusable: 'false' },
    svg('ellipse', { class: 'p-shadow', cx: 46, cy: 114, rx: 21, ry: 3.5 }),
    group('p-station', station, mood === 'celebrating' && doneFlag()),
    group('p-walker',
      group('p-bob',
        group('p-figure',
          group('p-leg p-leg-back', line(41, 88, 40, 109, look.pants, 7), svg('ellipse', { cx: 41.5, cy: 111, rx: 5, ry: 2.6, fill: INK })),
          group('p-leg p-leg-front', line(51, 88, 52, 109, look.pants, 7), svg('ellipse', { cx: 54, cy: 111, rx: 5, ry: 2.6, fill: INK })),
          group('p-arm p-arm-back', line(37, 62, 34, 81, null, 6, { class: 'p-sleeve' }), circle(34, 83, 3.4, look.skin), backHandAccessory),
          rect(34, 55, 24, 36, null, { rx: 10, class: 'p-torso' }),
          group('p-head',
            look.hairStyle % HAIR_STYLES.length === 1 && hairStyle(look),
            circle(46, 40, 15, look.skin),
            look.hairStyle % HAIR_STYLES.length !== 1 && hairStyle(look),
            look.hairStyle % HAIR_STYLES.length === 1 && path('M31 40 A15 15 0 0 1 61 38 Q55 30 46 31 Q37 31 31 40 Z', look.hair),
            circle(40, 45.5, 2.2, '#f9a8d4', { 'fill-opacity': 0.55 }),
            circle(55, 45.5, 2.2, '#f9a8d4', { 'fill-opacity': 0.55 }),
            eyes(face.eyes),
            group('p-mouth', MOUTHS[face.mouth]()),
            headAccessory),
          group('p-arm p-arm-front', line(55, 62, 58, 81, null, 6, { class: 'p-sleeve' }), circle(58, 83, 3.4, look.skin), handProp))),
      overlay(mood)));
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
