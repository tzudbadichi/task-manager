// Scenery of the people view's themed worlds (worlds/*.js pick it by key): windows, doors, seats,
// refreshments, drinks, plants, shelves, pictures, and the work stations. Every piece is drawn in the
// same viewBox as the office piece it replaces (world-layout.js ART), so one layout fits every world.
// The office's own pieces stay in art.js; the keys of both are listed in SCENERY_KEYS for the tests.
// Animated parts only carry CSS classes (styles.css, "People view").

import { circle, darker, ellipse, line, path, rect, svg } from './svg-kit.js';

const WOOD = '#a16207';
const WOOD_DARK = '#78350f';
const STONE = '#78716c';
const METAL = '#94a3b8';

const bars = color => [rect(48, 7, 4, 58, color), rect(7, 34, 86, 3, color)];
const sill = color => rect(0, 66, 100, 6, color, { rx: 1.5 });
const stars = points => points.map(([x, y, r = 0.9]) => circle(x, y, r, '#ffffff'));

// ---------------------------------------------------------------------------
// Windows (100 x 72)
// ---------------------------------------------------------------------------

const WINDOWS = {
  stained: () => [
    path('M8 70 V30 Q8 4 50 4 Q92 4 92 30 V70 Z', '#57534e'),
    path('M13 66 V31 Q13 9 50 9 Q87 9 87 31 V66 Z', '#1e3a8a'),
    path('M13 66 V40 L50 30 V66 Z', '#b91c1c', { 'fill-opacity': 0.85 }),
    path('M87 66 V40 L50 30 V66 Z', '#ca8a04', { 'fill-opacity': 0.85 }),
    path('M13 40 V31 Q13 9 50 9 V30 Z', '#1d4ed8'),
    path('M87 40 V31 Q87 9 50 9 V30 Z', '#15803d'),
    circle(50, 30, 7, '#facc15'),
    path('M50 9 V66 M13 40 L50 30 L87 40 M30 66 L50 30 L70 66', 'none', { stroke: '#292524', 'stroke-width': 1.6 }),
    sill('#78716c'),
  ],
  hills: () => [
    circle(50, 36, 34, WOOD_DARK), circle(50, 36, 29, '#bae6fd'),
    circle(66, 22, 5, '#fde047'),
    path('M22.1 44 Q35 32 50 42 Q64 30 77.9 44 A29 29 0 0 1 22.1 44 Z', '#4ade80'),
    path('M30 52 Q45 44 60 54 Q70 50 75 52 A29 29 0 0 1 26 54 Z', '#22c55e'),
    line(40, 44, 40, 37, '#78350f', 1.4), circle(40, 34, 4, '#15803d'),
    path('M16 36 H84 M50 7 V65', 'none', { stroke: WOOD_DARK, 'stroke-width': 2.4 }),
  ],
  space: () => [
    rect(2, 2, 96, 68, '#475569', { rx: 12 }), rect(8, 8, 84, 56, '#0f172a', { rx: 9 }),
    ...stars([[16, 16], [30, 50], [44, 14, 0.7], [58, 56], [82, 18], [20, 34, 0.7], [74, 52, 0.7]]),
    circle(66, 38, 13, '#3b82f6'), path('M58 32 q5 -3 8 1 q-2 5 -7 4 Z M66 44 q5 -2 7 2 q-3 3 -7 1 Z', '#22c55e'),
    ellipse(66, 38, 19, 4, 'none', { stroke: '#cbd5e1', 'stroke-width': 0.8, transform: 'rotate(-15 66 38)' }),
    circle(26, 22, 5, '#e2e8f0'),
    ...[[8, 8], [92, 8], [8, 64], [92, 64]].map(([x, y]) => circle(x, y, 1.6, '#94a3b8')),
  ],
  sea: () => [
    rect(2, 2, 96, 68, WOOD_DARK, { rx: 3 }), rect(7, 7, 86, 34, '#7dd3fc'), rect(7, 41, 86, 25, '#0284c7'),
    circle(76, 18, 6, '#fde047'),
    ellipse(28, 41, 12, 3, '#fde68a'), line(28, 40, 30, 28, '#78350f', 1.4),
    path('M30 28 q-6 -1 -9 3 M30 28 q6 -2 9 2 M30 28 q-2 -5 -6 -6 M30 28 q3 -5 8 -5', 'none', { stroke: '#16a34a', 'stroke-width': 1.6 }),
    path('M10 50 q4 -3 8 0 q4 3 8 0 M50 56 q4 -3 8 0 q4 3 8 0 M64 47 q3 -2 6 0', 'none', { stroke: '#e0f2fe', 'stroke-width': 1.2 }),
    ...bars(WOOD_DARK), sill(WOOD),
  ],
  desert2: () => [
    rect(2, 2, 96, 68, METAL, { rx: 6 }), rect(7, 7, 86, 58, '#fdba74', { rx: 3 }), rect(7, 7, 86, 22, '#fb923c', { rx: 3 }),
    circle(30, 22, 6, '#fef08a'), circle(44, 18, 4, '#fde047'),
    path('M7 50 Q30 38 52 48 Q72 36 93 46 V65 H7 Z', '#f59e0b'), path('M7 58 Q36 50 60 58 Q78 52 93 56 V65 H7 Z', '#d97706'),
    rect(68, 40, 8, 8, '#e7e5e4', { rx: 3 }), circle(72, 39, 4, '#e7e5e4'),
    sill('#64748b'),
  ],
  skyline: () => [
    rect(2, 2, 96, 68, '#334155', { rx: 3 }), rect(7, 7, 86, 58, '#1e1b4b'),
    circle(70, 20, 9, '#fde68a', { 'fill-opacity': 0.75, class: 'p-glow' }), path('M70 14 l2 4.5 l5 0.5 l-3.8 3.2 l1.2 5 l-4.4 -2.6 l-4.4 2.6 l1.2 -5 l-3.8 -3.2 l5 -0.5 Z', '#1e1b4b'),
    ...[[9, 34, 12, 31], [23, 26, 10, 39], [35, 40, 14, 25], [51, 30, 9, 35], [62, 44, 13, 21], [77, 34, 14, 31]].map(([x, y, w, h]) => rect(x, y, w, h, '#0f172a')),
    ...[[12, 38], [15, 46], [26, 30], [28, 42], [38, 46], [42, 52], [53, 36], [55, 48], [66, 50], [80, 40], [84, 50]].map(([x, y]) => rect(x, y, 2.4, 2.4, '#fde047')),
    sill('#475569'),
  ],
  underwater: () => [
    ellipse(50, 36, 47, 34, '#64748b'), ellipse(50, 36, 41, 28.5, '#0e7490'),
    path('M30 8 L22 64 M48 8 L46 64 M64 8 L72 64', 'none', { stroke: '#ffffff', 'stroke-width': 5, 'stroke-opacity': 0.08 }),
    ellipse(35, 30, 6, 3.4, '#f97316'), path('M29 30 l-5 -3 v6 Z', '#f97316'),
    ellipse(64, 46, 5, 3, '#facc15'), path('M69 46 l5 -3 v6 Z', '#facc15'),
    ...[[50, 20, 2], [54, 13, 1.4], [26, 46, 1.6]].map(([x, y, r]) => circle(x, y, r, 'none', { stroke: '#e0f2fe', 'stroke-width': 0.8 })),
    path('M14 64 q4 -10 0 -18 M86 64 q-4 -10 0 -18', 'none', { stroke: '#22c55e', 'stroke-width': 2.4 }),
    ...[[8, 36], [92, 36], [50, 3], [50, 69]].map(([x, y]) => circle(x, y, 1.8, '#94a3b8')),
  ],
  volcano: () => [
    rect(2, 2, 96, 68, WOOD_DARK, { rx: 3 }), rect(7, 7, 86, 58, '#a5f3fc'),
    path('M28 65 L46 26 H56 L74 65 Z', '#78350f'), path('M46 26 H56 L53 33 L50 29 L47 33 Z', '#f97316'),
    ...[[50, 20, 4], [55, 14, 5], [61, 9, 6]].map(([x, y, r]) => circle(x, y, r, '#cbd5e1', { 'fill-opacity': 0.9 })),
    path('M7 65 Q20 50 34 62 Q50 54 66 62 Q80 50 93 60 V65 Z', '#15803d'),
    line(16, 64, 18, 46, '#78350f', 1.6), path('M18 46 q-6 0 -9 4 M18 46 q6 -1 9 3 M18 46 q-1 -5 -6 -7 M18 46 q3 -5 8 -5', 'none', { stroke: '#16a34a', 'stroke-width': 1.8 }),
    ...bars(WOOD_DARK), sill(WOOD),
  ],
  mesa: () => [
    rect(2, 2, 96, 68, WOOD_DARK, { rx: 3 }), rect(7, 7, 86, 58, '#fde68a'), rect(7, 7, 86, 26, '#fb923c'),
    circle(50, 40, 10, '#f97316'),
    path('M7 46 H22 V38 H38 V46 H58 V34 H74 V46 H93 V65 H7 Z', '#b45309'),
    rect(80, 48, 4, 14, '#15803d', { rx: 2 }), path('M80 54 h-3 v-5 M84 52 h3 v-5', 'none', { stroke: '#15803d', 'stroke-width': 2.4, 'stroke-linecap': 'round' }),
    ...bars(WOOD_DARK), sill(WOOD),
  ],
  street: () => [
    rect(2, 2, 96, 68, '#d6c7a1', { rx: 2 }),
    path('M10 66 V28 Q10 10 28 10 Q46 10 46 28 V66 Z M54 66 V28 Q54 10 72 10 Q90 10 90 28 V66 Z', '#fef3c7'),
    path('M12 30 H44 L40 36 H16 Z', '#dc2626'), path('M18 30 V36 M26 30 V36 M34 30 V36', 'none', { stroke: '#ffffff', 'stroke-width': 2.4 }),
    path('M56 30 H88 L84 36 H60 Z', '#16a34a'), path('M62 30 V36 M70 30 V36 M78 30 V36', 'none', { stroke: '#ffffff', 'stroke-width': 2.4 }),
    ...[[20, 50, '#ef4444'], [26, 52, '#f97316'], [32, 50, '#facc15'], [64, 50, '#22c55e'], [72, 52, '#ef4444'], [80, 50, '#a855f7']].map(([x, y, fill]) => circle(x, y, 3, fill)),
    line(28, 10, 28, 16, '#57534e', 0.8), circle(28, 18, 2.4, '#fde047', { class: 'p-glow' }),
    line(72, 10, 72, 16, '#57534e', 0.8), circle(72, 18, 2.4, '#fde047', { class: 'p-glow' }),
    sill('#c8b88a'),
  ],
  meadow: () => [
    rect(2, 2, 96, 68, '#f8fafc', { rx: 3 }), rect(7, 7, 86, 58, '#bae6fd'),
    circle(78, 18, 6, '#fde047'), ellipse(30, 18, 9, 3.6, '#ffffff'), ellipse(36, 15, 5, 3.4, '#ffffff'),
    path('M7 46 Q30 36 50 44 Q72 36 93 44 V65 H7 Z', '#86efac'), path('M7 56 Q40 48 93 56 V65 H7 Z', '#4ade80'),
    ...[[20, 52, '#f472b6'], [34, 58, '#facc15'], [62, 54, '#f472b6'], [80, 58, '#facc15']].map(([x, y, fill]) => circle(x, y, 1.6, fill)),
    ...bars('#e2e8f0'), sill('#cbd5e1'),
  ],
  clouds: () => [
    rect(2, 2, 96, 68, '#e7e5e4', { rx: 2 }), rect(7, 7, 86, 58, '#fde68a'),
    circle(50, 22, 8, '#fef9c3'),
    ...[[18, 52, 10], [32, 56, 12], [52, 54, 13], [72, 56, 12], [86, 52, 10]].map(([x, y, r]) => circle(x, y, r, '#ffffff')),
    rect(40, 30, 20, 3, '#f5f5f4'), ...[42, 47, 52, 57].map(x => rect(x, 33, 2, 10, '#f5f5f4')), path('M38 30 L50 24 L62 30 Z', '#f5f5f4'),
    rect(2, 2, 6, 68, '#d6d3d1'), rect(92, 2, 6, 68, '#d6d3d1'),
    sill('#d6d3d1'),
  ],
  neon: () => [
    rect(2, 2, 96, 68, '#312e81', { rx: 3 }), rect(7, 7, 86, 58, '#0f172a'),
    ...[[9, 24, 14, 41], [25, 14, 12, 51], [39, 30, 16, 35], [57, 18, 12, 47], [71, 28, 20, 37]].map(([x, y, w, h]) => rect(x, y, w, h, '#1e1b4b')),
    rect(27, 20, 8, 4, '#f0abfc', { class: 'p-glow' }), rect(42, 36, 10, 3, '#22d3ee', { class: 'p-glow' }), rect(74, 34, 12, 4, '#f472b6', { class: 'p-glow' }), rect(59, 26, 6, 10, '#a3e635', { class: 'p-glow' }),
    ellipse(54, 14, 7, 2.2, '#94a3b8'), circle(49, 14, 1, '#f472b6'),
    path('M14 8 l-3 9 M34 10 l-3 9 M60 8 l-3 9 M84 10 l-3 9 M24 40 l-3 9 M70 44 l-3 9', 'none', { stroke: '#93c5fd', 'stroke-width': 0.8, 'stroke-opacity': 0.6, class: 'p-rain' }),
    sill('#4c1d95'),
  ],
  worldmap: () => [
    rect(2, 2, 96, 68, '#0f172a', { rx: 3, stroke: '#334155', 'stroke-width': 1.5 }), rect(7, 7, 86, 58, '#082f49'),
    path('M7 22 H93 M7 36 H93 M7 50 H93 M28 7 V65 M50 7 V65 M72 7 V65', 'none', { stroke: '#134e4a', 'stroke-width': 0.6 }),
    path('M14 20 q8 -6 18 -2 q4 6 -2 10 q-6 6 -4 14 q-8 0 -10 -8 q-6 -6 -2 -14 Z', '#0d9488'),
    path('M44 16 q10 -4 16 2 q-2 6 -8 6 q2 8 -2 16 q-6 -4 -6 -12 q-4 -6 0 -12 Z', '#0d9488'),
    path('M64 18 q14 -4 22 4 q2 8 -6 10 q-8 2 -12 -4 q-6 -4 -4 -10 Z', '#0d9488'),
    path('M74 44 q8 -2 10 4 q-2 6 -8 4 Z', '#0d9488'),
    ...[[24, 26], [52, 24], [76, 26], [80, 48]].map(([x, y]) => circle(x, y, 1.8, '#f43f5e', { class: 'p-blink-dot' })),
  ],
};

// ---------------------------------------------------------------------------
// Doors (50 x 92)
// ---------------------------------------------------------------------------

const DOORS = {
  castle: () => [
    path('M2 92 V30 Q2 4 25 4 Q48 4 48 30 V92 Z', '#57534e'),
    path('M7 92 V31 Q7 10 25 10 Q43 10 43 31 V92 Z', WOOD_DARK),
    path('M16 12 V92 M25 10 V92 M34 12 V92', 'none', { stroke: '#5b2b0d', 'stroke-width': 1 }),
    rect(7, 40, 36, 3, '#292524'), rect(7, 72, 36, 3, '#292524'),
    circle(36, 58, 3, 'none', { stroke: '#facc15', 'stroke-width': 1.4 }),
  ],
  round: () => [
    circle(25, 70, 23, '#78350f'), circle(25, 70, 19.5, '#15803d'),
    path('M12 58 V92 M19 52 V92 M25 51 V92 M31 52 V92 M38 58 V92', 'none', { stroke: '#166534', 'stroke-width': 0.9 }),
    circle(25, 70, 2.6, '#facc15'),
  ],
  airlock: () => [
    rect(0, 0, 50, 92, '#475569', { rx: 4 }), rect(5, 5, 40, 87, METAL, { rx: 3 }),
    line(25, 5, 25, 92, '#64748b', 1.2), rect(14, 18, 22, 10, '#0f172a', { rx: 3 }),
    path('M5 80 l8 -8 h5 l-8 8 Z M15 80 l8 -8 h5 l-8 8 Z M25 80 l8 -8 h5 l-8 8 Z M35 80 l8 -8 h2 v4 l-4 4 Z', '#facc15'),
    circle(41, 48, 2, '#22c55e', { class: 'p-blink-led' }),
  ],
  cabin: () => [
    rect(0, 0, 50, 92, WOOD_DARK, { rx: 2 }), rect(4, 4, 42, 88, '#92400e'),
    path('M14 4 V92 M25 4 V92 M36 4 V92', 'none', { stroke: '#78350f', 'stroke-width': 1 }),
    circle(25, 26, 8, '#bae6fd', { stroke: '#facc15', 'stroke-width': 2 }), circle(38, 56, 2.4, '#facc15'),
  ],
  saloon: () => [
    rect(2, 0, 46, 92, '#1c1917'), rect(0, 0, 4, 92, WOOD_DARK), rect(46, 0, 4, 92, WOOD_DARK), rect(0, 0, 50, 5, WOOD_DARK),
    rect(5, 30, 19, 38, WOOD, { rx: 1 }), rect(26, 30, 19, 38, WOOD, { rx: 1 }),
    path('M9 34 V64 M14 34 V64 M19 34 V64 M31 34 V64 M36 34 V64 M41 34 V64', 'none', { stroke: '#78350f', 'stroke-width': 1 }),
  ],
  stone: () => [
    rect(0, 0, 50, 92, '#e7e5e4'), rect(9, 12, 32, 80, '#44403c'), rect(0, 0, 50, 10, '#d6d3d1'),
    rect(1, 10, 7, 82, '#f5f5f4'), rect(42, 10, 7, 82, '#f5f5f4'),
    path('M3 10 V92 M6 10 V92 M44 10 V92 M47 10 V92', 'none', { stroke: '#d6d3d1', 'stroke-width': 0.8 }),
    rect(15, 18, 20, 70, '#fde68a', { 'fill-opacity': 0.15 }),
  ],
  vault: () => [
    rect(0, 0, 50, 92, '#334155', { rx: 3 }), circle(25, 50, 21, METAL, { stroke: '#64748b', 'stroke-width': 3 }),
    circle(25, 50, 7, 'none', { stroke: '#475569', 'stroke-width': 2 }),
    path('M25 39 V61 M14 50 H36 M17 42 L33 58 M33 42 L17 58', 'none', { stroke: '#475569', 'stroke-width': 1.6 }),
    ...[0, 60, 120, 180, 240, 300].map(angle => circle(25 + Math.cos((angle * Math.PI) / 180) * 17, 50 + Math.sin((angle * Math.PI) / 180) * 17, 1.4, '#e2e8f0')),
  ],
  shutter: () => [
    rect(0, 0, 50, 92, '#9ca3af', { rx: 1 }),
    ...Array.from({ length: 17 }, (_, index) => line(1, 6 + index * 5, 49, 6 + index * 5, '#6b7280', 0.9)),
    rect(18, 84, 14, 3, '#4b5563', { rx: 1.5 }),
    path('M8 40 q6 -8 12 0 t12 0 t12 0', 'none', { stroke: '#ec4899', 'stroke-width': 2.4, 'stroke-linecap': 'round' }),
  ],
  neon: () => [
    rect(0, 0, 50, 92, '#1e1b4b', { rx: 2 }), rect(5, 5, 40, 87, '#0f172a', { rx: 2 }),
    rect(5, 5, 40, 87, 'none', { rx: 2, stroke: '#e879f9', 'stroke-width': 1.6, class: 'p-glow' }),
    rect(37, 44, 3, 12, '#22d3ee', { rx: 1.5 }),
  ],
  cave: () => [
    path('M0 92 Q2 18 25 12 Q48 18 50 92 Z', STONE), path('M8 92 Q10 30 25 24 Q40 30 42 92 Z', '#292524'),
    circle(6, 40, 4, '#a8a29e'), circle(44, 30, 3, '#a8a29e'), circle(42, 70, 3.6, '#57534e'),
  ],
  hatch: () => [
    circle(25, 66, 23, '#475569'), circle(25, 66, 18, METAL),
    circle(25, 66, 7, 'none', { stroke: '#334155', 'stroke-width': 2 }),
    path('M25 55 V77 M14 66 H36', 'none', { stroke: '#334155', 'stroke-width': 1.8 }),
    ...[0, 45, 90, 135, 180, 225, 270, 315].map(angle => circle(25 + Math.cos((angle * Math.PI) / 180) * 20.5, 66 + Math.sin((angle * Math.PI) / 180) * 20.5, 1.2, '#cbd5e1')),
  ],
  swing: () => [
    rect(0, 4, 50, 88, '#cbd5e1'), rect(3, 8, 21, 84, '#e5e7eb', { stroke: '#94a3b8', 'stroke-width': 1 }), rect(26, 8, 21, 84, '#e5e7eb', { stroke: '#94a3b8', 'stroke-width': 1 }),
    circle(13.5, 34, 6, '#bae6fd', { stroke: '#94a3b8', 'stroke-width': 1.2 }), circle(36.5, 34, 6, '#bae6fd', { stroke: '#94a3b8', 'stroke-width': 1.2 }),
    rect(4, 70, 19, 4, '#94a3b8'), rect(27, 70, 19, 4, '#94a3b8'),
  ],
};

// ---------------------------------------------------------------------------
// Lounge seats (150 x 66; three seats at x 34, 75, 116)
// ---------------------------------------------------------------------------

const SEATS = {
  armchairs: () => [
    rect(8, 8, 50, 40, '#7f1d1d', { rx: 12 }), rect(4, 30, 58, 22, '#b91c1c', { rx: 7 }), rect(92, 8, 50, 40, '#7f1d1d', { rx: 12 }), rect(88, 30, 58, 22, '#b91c1c', { rx: 7 }),
    rect(62, 38, 26, 16, '#991b1b', { rx: 6 }),
    ...[10, 54, 94, 138, 66, 82].map(x => rect(x, 52, 4, 10, WOOD_DARK)),
  ],
  log: () => [
    rect(4, 34, 142, 24, '#92400e', { rx: 12 }), ellipse(8, 46, 5, 12, '#d6a46c'), ellipse(8, 46, 2.4, 6, 'none', { stroke: '#a16207', 'stroke-width': 0.8 }),
    path('M30 38 h30 M70 44 h40 M40 52 h50 M110 38 h24', 'none', { stroke: '#78350f', 'stroke-width': 1.2 }),
    rect(14, 58, 6, 6, '#78350f'), rect(130, 58, 6, 6, '#78350f'),
  ],
  pods: () => [16, 57, 98].map(x => [
    rect(x, 10, 36, 44, '#e2e8f0', { rx: 14, stroke: '#94a3b8', 'stroke-width': 1 }),
    rect(x + 4, 34, 28, 14, '#cbd5e1', { rx: 6 }),
    rect(x + 6, 16, 24, 3, '#38bdf8', { rx: 1.5, class: 'p-glow' }),
    rect(x + 15, 54, 6, 10, '#64748b'),
  ]),
  hammock: () => [
    line(4, 10, 4, 64, WOOD_DARK, 4), line(146, 10, 146, 64, WOOD_DARK, 4),
    path('M6 16 Q75 70 144 16 Q75 50 6 16 Z', '#fde68a', { stroke: '#d97706', 'stroke-width': 1 }),
    path('M30 26 L44 42 M60 32 L66 46 M90 32 L84 46 M120 26 L106 42', 'none', { stroke: '#d97706', 'stroke-width': 0.8 }),
  ],
  beanbags: () => [
    ellipse(34, 46, 23, 17, '#f472b6'), ellipse(28, 40, 8, 4, '#fbcfe8', { 'fill-opacity': 0.7 }),
    ellipse(75, 46, 23, 17, '#60a5fa'), ellipse(69, 40, 8, 4, '#bfdbfe', { 'fill-opacity': 0.7 }),
    ellipse(116, 46, 23, 17, '#facc15'), ellipse(110, 40, 8, 4, '#fef08a', { 'fill-opacity': 0.7 }),
  ],
  rock: () => [
    path('M4 62 Q2 30 30 24 Q75 14 120 24 Q148 30 146 62 Z', STONE),
    path('M20 34 q20 -10 50 -8', 'none', { stroke: '#a8a29e', 'stroke-width': 2, 'stroke-linecap': 'round' }),
    circle(110, 32, 5, '#16a34a'), circle(118, 30, 3.6, '#22c55e'), circle(26, 50, 3, '#fb7185'),
  ],
  haybales: () => [8, 80].map(x => [
    rect(x, 28, 62, 34, '#eab308', { rx: 4 }), line(x + 18, 28, x + 18, 62, '#a16207', 1.6), line(x + 44, 28, x + 44, 62, '#a16207', 1.6),
    path(`M${x + 4} 36 h10 M${x + 24} 44 h14 M${x + 48} 34 h10 M${x + 8} 52 h8 M${x + 30} 54 h10`, 'none', { stroke: '#ca8a04', 'stroke-width': 0.9 }),
  ]),
  crates: () => [[12, '#2563eb'], [55, '#16a34a'], [98, '#dc2626']].map(([x, fill]) => [
    rect(x, 34, 40, 28, fill, { rx: 2 }), path(`M${x + 6} 40 h28 M${x + 6} 46 h28 M${x + 6} 52 h28`, 'none', { stroke: darker(fill, 0.25), 'stroke-width': 2 }),
  ]),
  marble: () => [
    rect(4, 30, 142, 11, '#f5f5f4', { rx: 2, stroke: '#d6d3d1', 'stroke-width': 1 }), rect(4, 38, 142, 3, '#eab308'),
    rect(14, 41, 16, 21, '#e7e5e4', { rx: 2 }), rect(120, 41, 16, 21, '#e7e5e4', { rx: 2 }),
    path('M16 46 h12 M16 52 h12 M122 46 h12 M122 52 h12', 'none', { stroke: '#d6d3d1', 'stroke-width': 1 }),
  ],
  stools: () => [34, 75, 116].map(x => [
    ellipse(x, 30, 14, 4.5, '#dc2626'), line(x, 32, x, 62, METAL, 2.6), ellipse(x, 63, 9, 2.4, '#64748b'), line(x - 7, 48, x + 7, 48, METAL, 1.6),
  ]),
};

// ---------------------------------------------------------------------------
// Refreshments (56 x 92) and drinks (36 x 92)
// ---------------------------------------------------------------------------

const REFRESHMENTS = {
  barrel: () => [
    rect(4, 58, 48, 34, WOOD_DARK, { rx: 2 }), rect(8, 62, 40, 3, '#92400e'),
    rect(6, 22, 44, 34, WOOD, { rx: 12 }), path('M18 22 V56 M38 22 V56', 'none', { stroke: '#57534e', 'stroke-width': 2.4 }),
    rect(24, 52, 8, 6, '#57534e', { rx: 1 }), rect(26.5, 58, 3, 4, '#94a3b8'),
    rect(36, 46, 9, 10, '#fde68a', { rx: 1.5, stroke: '#d6a46c', 'stroke-width': 0.8 }),
  ],
  dispenser: () => [
    rect(8, 8, 40, 84, '#334155', { rx: 4 }), rect(13, 15, 30, 20, '#22d3ee', { rx: 2, class: 'p-glow' }),
    path('M17 21 h22 M17 26 h14 M17 31 h18', 'none', { stroke: '#0e7490', 'stroke-width': 1.2 }),
    rect(18, 44, 20, 26, '#0f172a', { rx: 2 }), rect(26, 44, 4, 6, '#64748b'), rect(23, 58, 10, 10, '#a5f3fc', { rx: 1.5 }),
    circle(40, 80, 2, '#22c55e', { class: 'p-blink-led' }),
  ],
  juice: () => [
    rect(2, 58, 52, 34, '#d97706', { rx: 2 }), path('M2 58 H54 L50 52 H6 Z', '#f59e0b'),
    rect(10, 24, 16, 34, '#cbd5e1', { rx: 2 }), circle(18, 22, 7, METAL), line(18, 15, 30, 10, '#64748b', 2),
    ...[[34, 50], [40, 46], [46, 50], [37, 54], [44, 55]].map(([x, y]) => circle(x, y, 3.4, '#b91c1c')),
    rect(12, 46, 8, 10, '#fecaca', { rx: 1.5, stroke: '#f87171', 'stroke-width': 0.8 }),
  ],
  fountain: () => [
    ellipse(28, 82, 24, 7, '#e7e5e4', { stroke: '#d6d3d1', 'stroke-width': 1 }), ellipse(28, 80, 20, 4, '#fde047', { 'fill-opacity': 0.8 }),
    rect(24, 40, 8, 40, '#f5f5f4'), ellipse(28, 40, 12, 4, '#e7e5e4'),
    path('M20 40 q-6 14 -2 36 M36 40 q6 14 2 36', 'none', { stroke: '#facc15', 'stroke-width': 1.6, class: 'p-pour' }),
    circle(28, 33, 4, '#facc15'),
  ],
  vent: () => [
    path('M4 92 Q8 66 22 60 Q30 56 38 62 Q52 70 52 92 Z', STONE), path('M20 62 Q28 52 36 62', 'none', { stroke: '#44403c', 'stroke-width': 3 }),
    circle(28, 48, 2.4, 'none', { stroke: '#e0f2fe', 'stroke-width': 1, class: 'cooler-bubble' }),
    circle(24, 40, 1.6, 'none', { stroke: '#e0f2fe', 'stroke-width': 1, class: 'cooler-bubble cooler-bubble-2' }),
    circle(32, 34, 2, 'none', { stroke: '#e0f2fe', 'stroke-width': 1, class: 'cooler-bubble' }),
  ],
  campfire: () => [
    ...[[8, 86], [18, 88], [28, 89], [38, 88], [48, 86]].map(([x, y]) => ellipse(x, y, 5, 3.4, STONE)),
    line(12, 84, 44, 76, '#78350f', 3.4), line(12, 76, 44, 84, '#92400e', 3.4),
    path('M28 78 q-8 -10 0 -24 q8 14 0 24 Z', '#f97316', { class: 'flame' }), path('M28 78 q-4 -6 0 -14 q4 8 0 14 Z', '#fde047', { class: 'flame' }),
    path('M10 86 L28 34 L46 86', 'none', { stroke: '#57534e', 'stroke-width': 1.6 }),
    rect(22, 40, 12, 9, '#334155', { rx: 3 }), path('M34 43 l4 -2', 'none', { stroke: '#334155', 'stroke-width': 1.6 }),
  ],
};

const DRINKS = {
  waterbarrel: () => [
    rect(4, 40, 28, 52, WOOD, { rx: 9 }), path('M4 54 H32 M4 78 H32', 'none', { stroke: '#57534e', 'stroke-width': 2.4 }),
    ellipse(18, 40, 14, 3.4, '#7dd3fc'), line(26, 40, 32, 22, WOOD_DARK, 1.6), ellipse(33, 21, 3, 2, '#64748b'),
  ],
  amphora: () => [
    path('M13 30 Q8 30 9 40 Q4 58 12 80 Q18 90 18 92 Q18 90 24 80 Q32 58 27 40 Q28 30 23 30 Z', '#c2410c'),
    path('M7 54 Q18 58 29 54', 'none', { stroke: '#1c1917', 'stroke-width': 3 }), path('M9 64 Q18 68 27 64', 'none', { stroke: '#1c1917', 'stroke-width': 1.4 }),
    path('M13 32 q-7 4 -4 12 M23 32 q7 4 4 12', 'none', { stroke: '#c2410c', 'stroke-width': 2 }),
    rect(12, 26, 12, 5, '#9a3412', { rx: 1.5 }),
  ],
  kelp: () => [
    path('M8 92 Q2 70 10 50 Q16 30 8 8', 'none', { stroke: '#16a34a', 'stroke-width': 4, 'stroke-linecap': 'round', class: 'p-sway' }),
    path('M20 92 Q26 72 18 54 Q12 38 22 18', 'none', { stroke: '#22c55e', 'stroke-width': 4, 'stroke-linecap': 'round', class: 'p-sway p-sway-2' }),
    path('M30 92 Q26 78 32 62 Q36 50 30 40', 'none', { stroke: '#15803d', 'stroke-width': 3.4, 'stroke-linecap': 'round', class: 'p-sway' }),
  ],
  tank: () => [
    rect(6, 18, 24, 62, '#bae6fd', { rx: 6, 'fill-opacity': 0.55, stroke: METAL, 'stroke-width': 1.4 }), rect(8, 42, 20, 36, '#38bdf8', { rx: 4, 'fill-opacity': 0.7 }),
    rect(4, 80, 28, 12, '#475569', { rx: 2 }), circle(18, 86, 2.4, '#22c55e', { class: 'p-blink-led' }), rect(14, 12, 8, 6, '#64748b', { rx: 1.5 }),
  ],
  pump: () => [
    rect(10, 34, 12, 50, '#475569', { rx: 2 }), rect(8, 84, 16, 8, '#334155'), path('M22 42 h8 v6', 'none', { stroke: '#475569', 'stroke-width': 3 }),
    line(10, 36, -2, 24, '#334155', 2.4), path('M22 66 l4 8 h8 l2 -10 Z', METAL),
  ],
};

// ---------------------------------------------------------------------------
// Plants (44 x 70; pots stand on y 70)
// ---------------------------------------------------------------------------

const pot = (fill = '#c2410c', rim = '#ea580c') => [path('M10 48 h24 l-3 22 h-18 Z', fill), rect(8, 46, 28, 5, rim, { rx: 2 })];

const PLANTS = {
  cactus: () => [rect(18, 14, 9, 34, '#16a34a', { rx: 4.5 }), path('M18 32 h-5 v-10', 'none', { stroke: '#16a34a', 'stroke-width': 5, 'stroke-linecap': 'round' }),
    path('M27 26 h5 v-8', 'none', { stroke: '#16a34a', 'stroke-width': 5, 'stroke-linecap': 'round' }), circle(22.5, 13, 3, '#f472b6'), ...pot('#d97706', '#f59e0b')],
  palm: () => [path('M22 70 Q18 44 24 22', 'none', { stroke: '#92400e', 'stroke-width': 4, 'stroke-linecap': 'round' }),
    path('M24 22 q-12 -4 -20 6 M24 22 q12 -6 20 2 M24 22 q-6 -12 -16 -12 M24 22 q4 -12 14 -14 M24 22 q-2 10 -10 18 M24 22 q4 8 12 14', 'none', { stroke: '#16a34a', 'stroke-width': 2.6, 'stroke-linecap': 'round' }),
    circle(23, 26, 2, '#78350f'), circle(26, 25, 2, '#78350f')],
  coral: () => [path('M8 70 Q12 50 22 46 Q32 50 36 70 Z', STONE),
    path('M16 48 V30 M16 38 l-6 -8 M16 34 l6 -10 M28 48 V24 M28 32 l7 -6 M28 38 l-6 -6', 'none', { stroke: '#fb7185', 'stroke-width': 3, 'stroke-linecap': 'round' }),
    circle(22, 44, 3, '#f97316')],
  mandrake: () => [path('M22 46 l-10 -16 l6 4 l-2 -12 l6 8 l2 -14 l3 14 l6 -8 l-2 12 l6 -4 l-9 16 Z', '#166534'), ...pot('#57534e', '#78716c'),
    circle(19, 52, 1.2, '#1f2937'), circle(25, 52, 1.2, '#1f2937')],
  tree: () => [rect(20, 26, 4, 22, '#78350f'), circle(22, 20, 12, '#16a34a'), circle(14, 26, 7, '#22c55e'), circle(30, 26, 7, '#15803d'), circle(18, 18, 2, '#ef4444'), circle(28, 22, 2, '#ef4444'), ...pot()],
  herbs: () => [[4, '#16a34a'], [16, '#22c55e'], [28, '#15803d']].map(([x, leaf]) => [
    circle(x + 6, 46, 5, leaf), circle(x + 3, 50, 3.6, leaf), circle(x + 9, 50, 3.6, leaf),
    path(`M${x} 54 h12 l-2 16 h-8 Z`, '#c2410c'),
  ]),
  olive: () => [path('M22 48 Q18 36 24 30 Q20 24 22 16', 'none', { stroke: '#57534e', 'stroke-width': 3.4 }),
    ...[[14, 18], [30, 16], [22, 10], [12, 28], [32, 28], [24, 22]].map(([x, y]) => ellipse(x, y, 5, 2.4, '#a3b18a', { transform: `rotate(${x > 22 ? -25 : 25} ${x} ${y})` })),
    circle(18, 22, 1.4, '#3f3f46'), circle(28, 20, 1.4, '#3f3f46'), ...pot('#e7e5e4', '#d6d3d1')],
  neonplant: () => [path('M22 46 Q10 30 6 14 M22 46 Q22 26 22 8 M22 46 Q34 30 38 14', 'none', { stroke: '#22d3ee', 'stroke-width': 2.2, 'stroke-linecap': 'round', class: 'p-glow' }),
    path('M22 46 Q14 34 12 24 M22 46 Q30 34 32 24', 'none', { stroke: '#e879f9', 'stroke-width': 1.8, 'stroke-linecap': 'round', class: 'p-glow' }), ...pot('#1e1b4b', '#4c1d95')],
};

// ---------------------------------------------------------------------------
// Shelves (64 x 92) and pictures (44 x 34)
// ---------------------------------------------------------------------------

const shelfFrame = (wood = '#57534e', back = '#78716c') => [rect(0, 0, 64, 92, wood, { rx: 2 }), rect(4, 4, 56, 84, back), rect(4, 30, 56, 3, wood), rect(4, 58, 56, 3, wood)];

const SHELVES = {
  spellbooks: () => [...shelfFrame('#3f2a1d', '#57402c'),
    ...[[7, '#7f1d1d'], [12, '#1e3a8a'], [17, '#14532d'], [22, '#581c87']].map(([x, fill]) => rect(x, 12, 4.4, 18, fill, { rx: 0.6 })),
    ...[[36, '#4ade80'], [46, '#c084fc'], [54, '#f472b6']].map(([x, fill]) => [rect(x - 1, 18, 2, 4, '#e2e8f0'), circle(x, 25, 4, fill, { 'fill-opacity': 0.85 })]),
    ...[[8, '#92400e'], [14, '#b45309'], [20, '#7c2d12'], [26, '#1e3a8a'], [32, '#7f1d1d']].map(([x, fill]) => rect(x, 40, 5, 18, fill, { rx: 0.6 })),
    rect(46, 46, 4, 12, '#fef3c7'), path('M48 46 q-2 -3 0 -6 q2 3 0 6 Z', '#f97316', { class: 'flame' }),
    ...[[10, '#a16207'], [24, '#15803d'], [40, '#7f1d1d']].map(([x, fill]) => rect(x, 72, 12, 16, fill, { rx: 1 }))],
  weapons: () => [rect(0, 0, 64, 92, WOOD_DARK, { rx: 2 }), rect(4, 4, 56, 84, '#92400e'),
    line(14, 14, 34, 64, '#cbd5e1', 2.4), line(50, 14, 30, 64, '#cbd5e1', 2.4), line(10, 22, 20, 18, WOOD, 2.4), line(44, 18, 54, 22, WOOD, 2.4),
    circle(32, 72, 11, '#b91c1c', { stroke: '#facc15', 'stroke-width': 2 }), circle(32, 72, 3, '#facc15')],
  servers: () => [rect(0, 0, 64, 92, '#1f2937', { rx: 3 }),
    ...[6, 20, 34, 48, 62, 76].map(y => [rect(6, y, 52, 11, '#334155', { rx: 1.5 }), path(`M12 ${y + 5.5} h24`, 'none', { stroke: '#475569', 'stroke-width': 1.2 }),
      circle(44, y + 5.5, 1.3, '#22c55e', { class: 'p-blink-led' }), circle(50, y + 5.5, 1.3, y % 28 === 6 ? '#38bdf8' : '#22c55e', { class: 'p-blink-led' })])],
  treasure: () => [...shelfFrame(WOOD_DARK, '#92400e'),
    ...[[16, 28], [30, 27], [46, 28]].map(([x, y]) => ellipse(x, y, 7, 3, '#facc15', { stroke: '#ca8a04', 'stroke-width': 0.6 })),
    circle(20, 50, 3, '#ef4444'), circle(30, 52, 3, '#3b82f6'), circle(40, 50, 3, '#22c55e'),
    rect(16, 70, 32, 18, '#78350f', { rx: 2 }), rect(16, 76, 32, 3, '#facc15'), rect(30, 74, 4, 6, '#facc15')],
  spices: () => [...shelfFrame('#a16207', '#fef3c7'),
    ...[[8, '#dc2626'], [19, '#f97316'], [30, '#facc15'], [41, '#16a34a'], [52, '#92400e']].flatMap(([x, fill]) => [rect(x, 16, 9, 14, fill, { rx: 2 }), rect(x, 13, 9, 3, '#e5e7eb'), rect(x, 44, 9, 14, fill, { rx: 2 }), rect(x, 41, 9, 3, '#e5e7eb')]),
    path('M10 88 Q8 70 18 68 Q28 70 26 88 Z', '#d6a46c'), path('M36 88 Q34 72 44 70 Q54 72 52 88 Z', '#c8a27a')],
  fossils: () => [...shelfFrame('#78716c', '#d6d3d1'),
    path('M10 24 h20 M12 20 l-2 8 M28 20 l2 8', 'none', { stroke: '#fafaf9', 'stroke-width': 3, 'stroke-linecap': 'round' }),
    circle(44, 22, 7, '#fafaf9'), circle(42, 21, 1.6, '#57534e'), circle(47, 21, 1.6, '#57534e'),
    circle(22, 46, 8, 'none', { stroke: '#a8a29e', 'stroke-width': 2 }), path('M22 46 m-4 0 a4 4 0 1 1 4 4', 'none', { stroke: '#a8a29e', 'stroke-width': 1.4 }),
    path('M38 50 q8 -10 16 0', 'none', { stroke: '#fafaf9', 'stroke-width': 3, 'stroke-linecap': 'round' }),
    path('M10 80 q12 -10 24 0 q12 -10 20 0', 'none', { stroke: '#fafaf9', 'stroke-width': 3 })],
  scrolls: () => [...shelfFrame('#a8a29e', '#e7e5e4'),
    ...[[12, 16], [28, 18], [44, 16], [14, 44], [30, 46], [46, 44], [12, 72], [28, 74], [44, 72]].map(([x, y]) => [
      rect(x - 6, y, 12, 9, '#fef3c7', { rx: 2 }), circle(x - 6, y + 4.5, 3, '#d6c08f'), circle(x + 6, y + 4.5, 3, '#d6c08f'),
    ])],
  bottles: () => [rect(0, 0, 64, 92, WOOD_DARK, { rx: 2 }), rect(4, 4, 56, 84, '#fde68a', { 'fill-opacity': 0.25 }), rect(4, 30, 56, 3, WOOD), rect(4, 58, 56, 3, WOOD),
    ...[[10, '#16a34a'], [20, '#b45309'], [30, '#dc2626'], [40, '#7c3aed'], [50, '#0284c7']].flatMap(([x, fill]) => [
      rect(x - 3, 16, 6, 14, fill, { rx: 1.5, 'fill-opacity': 0.85 }), rect(x - 1, 11, 2, 5, fill), rect(x - 3, 44, 6, 14, fill, { rx: 1.5, 'fill-opacity': 0.85 }), rect(x - 1, 39, 2, 5, fill),
    ]),
    rect(8, 66, 48, 20, '#cbd5e1', { rx: 2, 'fill-opacity': 0.6 })],
};

const PICTURES = {
  portrait: () => [ellipse(22, 17, 21, 16.5, '#ca8a04'), ellipse(22, 17, 17, 13, '#14532d'),
    circle(22, 13, 5.5, '#f1c27d'), path('M12 30 Q22 18 32 30 Z', '#7f1d1d'), circle(20, 12.5, 0.9, '#1f2937', { class: 'p-blink-dot' }), circle(24, 12.5, 0.9, '#1f2937', { class: 'p-blink-dot' })],
  map: () => [rect(0, 0, 44, 34, '#fef3c7', { rx: 2, stroke: '#d6c08f', 'stroke-width': 1.4 }),
    path('M6 26 L10 18 L14 26 Z M14 26 L19 16 L24 26 Z', '#a8a29e'),
    path('M8 10 q8 4 14 0 t12 6', 'none', { stroke: '#dc2626', 'stroke-width': 1, 'stroke-dasharray': '2 1.6' }),
    path('M32 13 l4 4 M36 13 l-4 4', 'none', { stroke: '#dc2626', 'stroke-width': 1.6 })],
  wanted: () => [rect(2, 0, 40, 34, '#fde68a', { rx: 1 }), rect(6, 3, 32, 4, '#92400e', { rx: 1 }),
    circle(22, 17, 6, '#a16207'), path('M13 31 Q22 21 31 31 Z', '#a16207'),
    path('M19.5 13.5 a2.6 2.6 0 1 1 3.6 2.4 c-.8 .4 -1.1 .9 -1.1 1.7', 'none', { stroke: '#fde68a', 'stroke-width': 1.3, 'stroke-linecap': 'round' })],
  poster: () => [rect(0, 0, 44, 34, '#1e293b', { rx: 2 }), path('M22 6 l3.6 7.4 l8 1.1 l-5.8 5.6 l1.4 8 l-7.2 -3.8 l-7.2 3.8 l1.4 -8 l-5.8 -5.6 l8 -1.1 Z', '#facc15'),
    rect(4, 28, 36, 2.6, '#ef4444')],
  screen: () => [rect(0, 0, 44, 34, '#0f172a', { rx: 2, stroke: '#334155', 'stroke-width': 1.4 }),
    path('M4 26 L12 18 L18 22 L26 10 L32 16 L40 6', 'none', { stroke: '#22d3ee', 'stroke-width': 1.4, class: 'p-glow' }),
    ...[[6, 6], [12, 9], [18, 4]].map(([x, h]) => rect(x, 30 - h, 4, h, '#a3e635'))],
};

// ---------------------------------------------------------------------------
// Work stations (viewBox 68 20 72 96; floor at y = 112). A world gives two: "desk" for desk work
// (code, email, writing, money, people, calls...) and "craft" for hands-on work (design, fixing,
// cleaning, sport, deliveries, shopping, travel).
// ---------------------------------------------------------------------------

const table = (top = 82, color = '#8b5e3c') => [rect(76, top, 58, 5, color, { rx: 2 }), rect(80, top + 5, 4, 112 - top - 5, darker(color, 0.2)), rect(126, top + 5, 4, 112 - top - 5, darker(color, 0.2))];
const flameAt = (x, y, size = 1) => [
  path(`M${x} ${y} q${-6 * size} ${-8 * size} 0 ${-18 * size} q${6 * size} ${10 * size} 0 ${18 * size} Z`, '#f97316', { class: 'flame' }),
  path(`M${x} ${y} q${-3 * size} ${-5 * size} 0 ${-10 * size} q${3 * size} ${6 * size} 0 ${10 * size} Z`, '#fde047', { class: 'flame' }),
];

const STATIONS = {
  lectern: () => [rect(99, 72, 6, 38, WOOD_DARK), rect(90, 108, 24, 4, WOOD_DARK, { rx: 1 }),
    path('M84 72 L120 64 L122 70 L86 78 Z', WOOD),
    path('M88 70 L102 67 L102 58 L88 61 Z', '#f8fafc'), path('M102 67 L116 64 L116 55 L102 58 Z', '#f1f5f9'),
    path('M90 63 l9 -2 M90 66 l9 -2 M104 60 l9 -2 M104 63 l9 -2', 'none', { stroke: '#94a3b8', 'stroke-width': 0.7, class: 'p-screen-line' }),
    rect(122, 96, 14, 3, WOOD_DARK), rect(127, 99, 4, 13, WOOD_DARK), rect(127, 86, 4, 10, '#fef3c7'), ...flameAt(129, 86, 0.4)],
  cauldron: () => [...flameAt(96, 112, 0.6), ...flameAt(112, 112, 0.6), ...flameAt(104, 112, 0.8),
    line(84, 106, 82, 112, '#1f2937', 2.4), line(124, 106, 126, 112, '#1f2937', 2.4),
    path('M82 80 Q82 108 104 108 Q126 108 126 80 Z', '#1f2937'), ellipse(104, 80, 23, 5, '#374151'), ellipse(104, 80, 20, 3.6, '#4ade80'),
    ...[[96, 76, 2.4], [106, 72, 3], [114, 77, 2]].map(([x, y, r]) => circle(x, y, r, '#86efac', { class: 'p-bubble' })),
    line(116, 82, 130, 62, '#78350f', 2.2)],
  maptable: () => [...table(84),
    path('M80 84 L82 74 L128 72 L130 84 Z', '#fef3c7', { stroke: '#d6c08f', 'stroke-width': 0.8 }),
    path('M88 80 l4 -5 l4 5 Z M96 80 l5 -6 l5 6 Z', '#a8a29e'),
    path('M108 80 q6 -4 12 0', 'none', { stroke: '#dc2626', 'stroke-width': 1, 'stroke-dasharray': '2 1.4', class: 'p-screen-line' }),
    circle(124, 78, 2.6, 'none', { stroke: '#b45309', 'stroke-width': 1 }), rect(84, 70, 4, 6, '#fef3c7'), ...flameAt(86, 70, 0.35)],
  anvil: () => [rect(90, 92, 30, 20, '#92400e', { rx: 2 }), path('M92 92 h26', 'none', { stroke: '#78350f', 'stroke-width': 1.2 }),
    path('M82 80 h42 l-6 6 h-6 v6 h-18 v-6 h-6 Z', '#374151'), path('M82 80 q-6 0 -8 4 h8 Z', '#374151'),
    rect(98, 76, 14, 4, '#f97316', { rx: 1, class: 'p-glow' }),
    line(126, 112, 132, 84, WOOD_DARK, 2), rect(128, 80, 10, 6, '#475569', { rx: 1 }),
    ...[[104, 70], [110, 68], [100, 66]].map(([x, y]) => circle(x, y, 1, '#fde047', { class: 'p-spark' }))],
  console: () => [path('M76 86 L132 86 L128 66 L82 66 Z', '#334155'), rect(80, 86, 50, 26, '#1e293b', { rx: 2 }),
    rect(86, 48, 18, 14, '#0f172a', { rx: 2, stroke: '#475569', 'stroke-width': 1 }), rect(108, 42, 22, 20, '#0f172a', { rx: 2, stroke: '#475569', 'stroke-width': 1 }),
    rect(89, 52, 10, 1.6, '#38bdf8', { class: 'p-screen-line' }), rect(89, 56, 7, 1.6, '#a3e635', { class: 'p-screen-line' }),
    rect(111, 47, 14, 1.6, '#f472b6', { class: 'p-screen-line' }), rect(111, 51, 10, 1.6, '#38bdf8', { class: 'p-screen-line' }), rect(111, 55, 12, 1.6, '#a3e635', { class: 'p-screen-line' }),
    ...[[88, 74, '#ef4444'], [96, 72, '#facc15'], [104, 74, '#22c55e'], [120, 72, '#38bdf8']].map(([x, y, fill]) => circle(x, y, 1.8, fill, { class: 'p-blink-led' }))],
  workbench: () => [...table(84, '#64748b'),
    circle(92, 78, 5, 'none', { stroke: '#94a3b8', 'stroke-width': 2.4, 'stroke-dasharray': '2.6 1.8' }),
    rect(102, 70, 14, 14, '#cbd5e1', { rx: 3 }), circle(106, 76, 1.6, '#38bdf8'), circle(112, 76, 1.6, '#38bdf8'),
    path('M120 84 l6 -10 l4 2', 'none', { stroke: '#475569', 'stroke-width': 2 }), circle(130, 72, 1.2, '#fde047', { class: 'p-spark' })],
  chest: () => [rect(84, 86, 42, 26, WOOD_DARK, { rx: 2 }), rect(84, 92, 42, 3, '#facc15'), rect(102, 90, 6, 8, '#facc15', { rx: 1 }),
    path('M84 86 L88 66 L130 66 L126 86 Z', '#92400e'), path('M88 66 h42', 'none', { stroke: '#facc15', 'stroke-width': 2 }),
    ...[[92, 84], [100, 82], [110, 84], [118, 82], [104, 80], [96, 80]].map(([x, y]) => ellipse(x, y, 5, 2.4, '#facc15', { stroke: '#ca8a04', 'stroke-width': 0.6 })),
    circle(112, 78, 2.4, '#ef4444'), circle(98, 76, 2, '#22c55e', { class: 'p-glow' })],
  cannon: () => [circle(92, 102, 9, WOOD_DARK), circle(92, 102, 3, '#57534e'), circle(116, 102, 9, WOOD_DARK), circle(116, 102, 3, '#57534e'),
    path('M86 92 L126 80 L130 90 L90 100 Z', '#334155'), circle(129, 85, 5, '#1f2937'),
    ...[[134, 74, '#f472b6'], [138, 80, '#facc15'], [132, 68, '#38bdf8']].map(([x, y, fill]) => rect(x, y, 4, 2, fill, { class: 'p-fly' }))],
  holotable: () => [ellipse(104, 108, 22, 4, '#334155'), rect(98, 86, 12, 22, '#475569'), ellipse(104, 86, 20, 4, '#64748b'),
    path('M86 86 L96 46 H112 L122 86 Z', '#60a5fa', { 'fill-opacity': 0.25, class: 'p-holo' }),
    circle(104, 58, 9, 'none', { stroke: '#93c5fd', 'stroke-width': 1.4, class: 'p-holo' }), ellipse(104, 58, 14, 3.4, 'none', { stroke: '#93c5fd', 'stroke-width': 0.9, class: 'p-holo' })],
  punchbag: () => [line(124, 112, 124, 40, '#334155', 3), line(124, 42, 102, 42, '#334155', 3), line(104, 42, 104, 52, '#94a3b8', 1.4),
    rect(96, 52, 16, 40, '#dc2626', { rx: 7 }), path('M96 60 h16 M96 84 h16', 'none', { stroke: '#991b1b', 'stroke-width': 1.4 }),
    ellipse(84, 108, 6, 4, '#dc2626'), ellipse(90, 110, 6, 4, '#b91c1c'), rect(116, 108, 16, 4, '#334155')],
  clamdesk: () => [path('M78 104 Q104 120 130 104 Q130 92 104 92 Q78 92 78 104 Z', '#f9a8d4'),
    path('M78 98 Q80 64 104 62 Q128 64 130 98 Q104 84 78 98 Z', '#fbcfe8'), path('M90 70 L94 92 M104 64 V90 M118 70 L114 92', 'none', { stroke: '#f9a8d4', 'stroke-width': 1.2 }),
    circle(104, 96, 4.6, '#f8fafc', { class: 'p-glow' }), rect(84, 100, 10, 6, '#fef3c7', { transform: 'rotate(-8 89 103)' })],
  dig: () => [path('M74 112 Q80 92 104 90 Q128 92 136 112 Z', '#a16207'), path('M82 104 Q104 96 128 104', 'none', { stroke: '#92400e', 'stroke-width': 1.4 }),
    path('M92 100 h16 M94 96 l-3 8 M106 96 l3 8', 'none', { stroke: '#fafaf9', 'stroke-width': 3, 'stroke-linecap': 'round' }),
    circle(118, 98, 4, '#fafaf9'), line(78, 112, 80, 84, '#78350f', 1.4), path('M80 84 l8 3 l-8 3 Z', '#ef4444'),
    line(130, 112, 132, 88, '#78350f', 1.4), path('M132 88 l8 3 l-8 3 Z', '#facc15'), rect(122, 88, 3, 10, '#d6a46c', { class: 'p-screen-line' })],
  nest: () => [ellipse(104, 104, 26, 9, '#d6a46c'), path('M80 102 q10 6 24 4 q14 2 24 -4 M82 106 q22 6 44 0', 'none', { stroke: '#a16207', 'stroke-width': 1.2 }),
    ellipse(96, 96, 6, 8, '#fef3c7', { class: 'p-wobble' }), ellipse(108, 95, 6, 8, '#ecfccb'), ellipse(115, 99, 5, 6.5, '#fef3c7'),
    circle(94, 94, 1, '#a3e635'), circle(98, 99, 1.2, '#a3e635'), circle(110, 93, 1, '#f472b6')],
  saloonbar: () => [rect(78, 76, 56, 36, '#92400e', { rx: 1 }), rect(74, 72, 64, 6, WOOD_DARK, { rx: 2 }), path('M84 84 h44 M84 96 h44', 'none', { stroke: '#78350f', 'stroke-width': 1.4 }),
    ...[[86, '#16a34a'], [94, '#dc2626'], [102, '#0284c7']].flatMap(([x, fill]) => [rect(x - 2.5, 58, 5, 14, fill, { rx: 1.2, 'fill-opacity': 0.85 }), rect(x - 1, 53, 2, 5, fill)]),
    rect(112, 62, 7, 10, '#fef3c7', { rx: 1.2, 'fill-opacity': 0.8 }), circle(126, 68, 3.6, '#facc15'), rect(125, 64, 2, 1.6, '#ca8a04')],
  stall: () => [line(78, 112, 78, 50, WOOD_DARK, 2.4), line(130, 112, 130, 50, WOOD_DARK, 2.4),
    path('M74 50 H134 L130 60 H78 Z', '#dc2626'), path('M82 50 L80 60 M94 50 L93 60 M106 50 L106 60 M118 50 L119 60', 'none', { stroke: '#ffffff', 'stroke-width': 3.4 }),
    ...table(84, WOOD),
    ...[[86, 80, '#ef4444'], [92, 80, '#ef4444'], [89, 76, '#dc2626'], [104, 80, '#f97316'], [110, 80, '#f97316'], [107, 76, '#fb923c']].map(([x, y, fill]) => circle(x, y, 3.2, fill)),
    ...[[120, 80], [126, 80], [123, 76]].map(([x, y]) => ellipse(x, y, 4.4, 2, '#16a34a'))],
  scale: () => [...table(88, WOOD), rect(102, 64, 4, 24, '#475569'), rect(98, 86, 12, 3, '#475569'),
    line(84, 64, 124, 64, '#475569', 2), circle(104, 64, 2, '#facc15'),
    path('M78 72 Q86 80 94 72 Z M114 72 Q122 80 130 72 Z', METAL), path('M84 64 L80 72 M84 64 L92 72 M124 64 L116 72 M124 64 L128 72', 'none', { stroke: '#64748b', 'stroke-width': 0.8 }),
    circle(84, 70, 3, '#ef4444'), circle(88, 70, 3, '#f97316'), rect(118, 68, 6, 4, '#64748b', { rx: 1 })],
  berries: () => [rect(90, 94, 28, 18, '#92400e', { rx: 3 }), ellipse(104, 94, 14, 4, '#d6a46c'),
    path('M90 84 Q104 98 118 84 Z', '#b45309'), path('M90 84 Q104 76 118 84', 'none', { stroke: '#78350f', 'stroke-width': 1.6 }),
    ...[[96, 84, '#ef4444'], [102, 82, '#a855f7'], [108, 84, '#3b82f6'], [100, 87, '#ef4444'], [106, 88, '#a855f7']].map(([x, y, fill]) => circle(x, y, 2.6, fill)),
    path('M118 86 q8 -6 10 -14 q-8 2 -10 14 Z', '#22c55e')],
  stove: () => [rect(78, 74, 56, 38, '#475569', { rx: 2 }), rect(84, 86, 44, 20, '#334155', { rx: 2 }), rect(86, 88, 40, 3, '#64748b'),
    ...[86, 94, 118, 126].map(x => circle(x, 79, 1.8, '#cbd5e1')),
    path('M84 74 Q84 58 96 58 Q108 58 108 74 Z', METAL), ellipse(96, 58, 12, 2.6, '#cbd5e1'),
    rect(112, 64, 18, 10, '#64748b', { rx: 2 }), line(130, 66, 138, 64, '#334155', 2),
    path('M92 54 q-2 -4 0 -8 M100 54 q-2 -4 0 -8 M120 60 q-2 -4 0 -8', 'none', { stroke: '#cbd5e1', 'stroke-width': 1, class: 'p-steam' })],
  cuttingboard: () => [...table(86, '#e5e7eb'), rect(84, 80, 34, 6, '#d6a46c', { rx: 2 }),
    path('M92 80 h14 l2 -3 h-16 Z', METAL), rect(106, 79, 8, 2.4, '#1f2937', { rx: 1 }),
    ...[[88, 78], [93, 77], [98, 78]].map(([x, y]) => circle(x, y, 2, '#f97316')), circle(124, 80, 4, '#ef4444'), ellipse(116, 74, 6, 3.6, '#22c55e')],
  altar: () => [rect(92, 72, 24, 40, '#f5f5f4', { stroke: '#d6d3d1', 'stroke-width': 1 }), path('M96 72 V112 M104 72 V112 M112 72 V112', 'none', { stroke: '#e7e5e4', 'stroke-width': 1 }),
    rect(86, 66, 36, 7, '#e7e5e4', { rx: 1.5 }), rect(86, 70, 36, 2.4, '#eab308'),
    rect(90, 58, 12, 8, '#fef3c7', { rx: 1.5 }), circle(90, 62, 2.4, '#d6c08f'), circle(102, 62, 2.4, '#d6c08f'),
    path('M108 66 Q106 52 112 48 Q118 52 116 66 Z', 'none', { stroke: '#ca8a04', 'stroke-width': 1.6 }), path('M110 52 V64 M112 50 V64 M114 52 V64', 'none', { stroke: '#fde68a', 'stroke-width': 0.6 })],
  neonterminal: () => [...table(84, '#1e1b4b'), rect(88, 48, 32, 30, '#0f172a', { rx: 2 }),
    rect(88, 48, 32, 30, 'none', { rx: 2, stroke: '#e879f9', 'stroke-width': 1.4, class: 'p-glow' }),
    rect(92, 54, 14, 1.6, '#22d3ee', { class: 'p-screen-line' }), rect(92, 59, 20, 1.6, '#a3e635', { class: 'p-screen-line' }), rect(92, 64, 10, 1.6, '#f472b6', { class: 'p-screen-line' }), rect(92, 69, 16, 1.6, '#22d3ee', { class: 'p-screen-line' }),
    rect(102, 78, 4, 6, '#334155'), rect(90, 80, 28, 3, '#22d3ee', { rx: 1, 'fill-opacity': 0.6, class: 'p-glow' })],
  gadgetdesk: () => [...table(84, '#334155'),
    rect(80, 56, 22, 16, '#0f172a', { rx: 2 }), circle(91, 64, 4, 'none', { stroke: '#22d3ee', 'stroke-width': 1 }), circle(91, 64, 1.2, '#f43f5e', { class: 'p-blink-dot' }),
    rect(106, 54, 24, 18, '#0f172a', { rx: 2 }), rect(110, 58, 10, 1.6, '#a3e635', { class: 'p-screen-line' }), rect(110, 62, 14, 1.6, '#22d3ee', { class: 'p-screen-line' }),
    rect(90, 76, 18, 8, '#fde68a', { rx: 1 }), rect(90, 76, 18, 2, '#dc2626'),
    circle(120, 80, 3, 'none', { stroke: '#475569', 'stroke-width': 1.4 }), line(122, 82, 126, 84, '#475569', 1.6)],
  safe: () => [rect(84, 60, 42, 52, '#64748b', { rx: 3 }), rect(88, 64, 34, 44, '#94a3b8', { rx: 2 }),
    circle(105, 84, 8, '#475569'), circle(105, 84, 6, '#cbd5e1'),
    svg('g', { class: 'p-dial' }, line(105, 84, 105, 79, '#1f2937', 1.4), ...Array.from({ length: 8 }, (_, index) => {
      const angle = (index * Math.PI) / 4;
      return circle(105 + Math.sin(angle) * 4.5, 84 - Math.cos(angle) * 4.5, 0.5, '#1f2937');
    })),
    rect(116, 80, 3, 10, '#475569', { rx: 1 }), rect(86, 108, 6, 4, '#334155'), rect(118, 108, 6, 4, '#334155')],
};

// ---------------------------------------------------------------------------
// Lookup
// ---------------------------------------------------------------------------

const SCENERY = { window: WINDOWS, door: DOORS, sofa: SEATS, coffee: REFRESHMENTS, cooler: DRINKS, plant: PLANTS, shelf: SHELVES, picture: PICTURES };

/** The themed piece for a furniture kind ('window', 'door'...) and a variant key, or null (the office piece is used). */
export function worldDecorParts(kind, variant) {
  return SCENERY[kind]?.[variant]?.() ?? null;
}

/** A themed work station (viewBox 68 20 72 96), or null when the key is unknown. */
export function createWorldStationArt(stationKey, { done = false, doneFlag = null } = {}) {
  const draw = STATIONS[stationKey];
  if (!draw) return null;
  return svg('svg', { viewBox: '68 20 72 96', class: 'station-art', 'aria-hidden': 'true', focusable: 'false' }, draw(), done && doneFlag?.());
}

/** Every themed variant key, per furniture kind, and every station key (the worlds are checked against these). */
export const WORLD_SCENERY_KEYS = Object.freeze({
  ...Object.fromEntries(Object.entries(SCENERY).map(([kind, variants]) => [kind, Object.freeze(Object.keys(variants))])),
  stations: Object.freeze(Object.keys(STATIONS)),
});
