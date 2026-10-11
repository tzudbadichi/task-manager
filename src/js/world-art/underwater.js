// Under the sea: a coral reef kingdom of merfolk with fish tails, old-style divers in brass helmets, fish
// folk in knitted sweaters, octopus scholars, wise old sea turtles and crab guards - and the reef's
// furniture: a shell-crowned door, a coral shelf of treasures, a rock bench with sponge cushions, a kelp-tea
// pot over a warm vent, a bubble column and coral gardens.
// Original designs for this app: the feel of the genre, no characters or designs from books or films.
// Coordinates: figure-kit.js (characters), world-layout.js ART (furniture), viewBox 68 20 72 96 (stations).

import { circle, darker, ellipse, lighter, line, path, rect } from '../svg-kit.js';
import {
  BEARD, BUILDS, HAIR, arm, belt, blob, box, buttons, dot, headBase, limb, nose, pick, pickWeighted,
  rngOf, shade, shape, stroke, torsoPath,
} from '../figure-kit.js';

const TOON_EYES = Object.freeze({ anchors: [[43, 41], [52, 41]], style: 'toon' });
const GOLD = '#f2c94c';
const BRASS = '#d9a441';
const BRASS_DARK = '#9a6a1a';
const PEARL = '#fbf6ee';
const SHELL_PINK = '#f6d2c4';
const ROCK = '#5d8a98';
const ROCK_DARK = '#3f6878';
const KELP = '#5a9a4a';

const HUMAN_SKINS = ['#f6d7bd', '#efc8a6', '#e2b38c', '#d29f74', '#b9845a', '#8f5f3c', '#6e4630'];

/** A two-tone tentacle or soft limb along a path: an outline stroke and a fill stroke. */
const softLimb = (d, color, width) => [stroke(d, darker(color, 0.4), width + 1.8), stroke(d, color, width)];
/** A small starfish centered at (x, y). */
const starfish = (x, y, r, color = '#f2864a') => {
  const points = Array.from({ length: 10 }, (_, index) => {
    const angle = -Math.PI / 2 + (index * Math.PI) / 5;
    const radius = index % 2 ? r * 0.42 : r;
    return `${(x + Math.cos(angle) * radius).toFixed(2)} ${(y + Math.sin(angle) * radius).toFixed(2)}`;
  });
  return [shape(`M${points.join(' L')} Z`, color), circle(x, y, r * 0.18, lighter(color, 0.5))];
};
/** A scallop shell: a fan with ribs, its hinge at (x, y), opening upwards. */
const scallop = (x, y, r, color = SHELL_PINK) => [
  shape(`M${x} ${y} L${x - r} ${y - r * 0.5} Q${x - r * 0.9} ${y - r * 1.4} ${x} ${y - r * 1.5} Q${x + r * 0.9} ${y - r * 1.4} ${x + r} ${y - r * 0.5} Z`, color),
  stroke(`M${x} ${y} L${x - r * 0.62} ${y - r * 1.2} M${x} ${y} L${x - r * 0.22} ${y - r * 1.42} M${x} ${y} L${x + r * 0.22} ${y - r * 1.42} M${x} ${y} L${x + r * 0.62} ${y - r * 1.2}`, darker(color, 0.25), 0.7),
];

// ---------------------------------------------------------------------------
// Things held in the back hand (at about (34,83); they swing with the arm)
// ---------------------------------------------------------------------------

const HELD = {
  trident: () => [
    limb(34, 112, 34, 52, 2, GOLD),
    stroke('M27.4 46 Q27 53 34 54 Q41 53 40.6 46 M34 54 V42', GOLD, 2),
    shape('M26.2 47.4 L27.4 42.4 L28.6 47.4 Z M32.8 43.4 L34 38 L35.2 43.4 Z M39.4 47.4 L40.6 42.4 L41.8 47.4 Z', GOLD),
    dot(34, 56.4, 1.8, '#7ad6e8'),
  ],
  conch: () => [
    shape('M26 86 Q24 78 31 76 L39 79 Q42 84 38 89 Q32 92 26 86 Z', '#f6c8b0'),
    stroke('M28 80 Q33 79 37 82 M27.6 84 Q32 84 36.4 87', '#d0907a', 0.9),
    shape('M38 79 Q41 78 42 81 Q40 83 38.6 82 Z', '#f2a0a0'),
  ],
  pearl: () => [dot(34, 87.4, 3.6, PEARL, { 'stroke-width': 0.6 }), circle(33, 86.2, 1.1, '#ffffff'), circle(34, 87.4, 6, '#e8fbff', { 'fill-opacity': 0.35, class: 'p-glow' })],
  lamp: () => [line(34, 84, 34, 88, '#4b5563', 1), box(29.6, 88, 8.8, 11, BRASS, { rx: 2.4 }), circle(34, 93.6, 3.4, '#fff3b0', { class: 'p-glow' }),
    stroke('M29.6 93.6 H38.4', BRASS_DARK, 0.8), circle(34, 93.6, 7, '#fff6c8', { 'fill-opacity': 0.3, class: 'p-glow' })],
  net: () => [
    stroke('M31 83 L26 88 M37 83 L42 88', '#c9a46a', 1),
    shape('M25 88 Q34 85 43 88 Q44 98 34 102 Q24 98 25 88 Z', 'none', { stroke: '#c9a46a', 'stroke-width': 1 }),
    starfish(31, 95, 3.6), scallop(37.6, 98, 3.4),
    stroke('M27 90 L40 99 M30 87 L42 95 M41 90 L28 99 M38 87 L25.6 95', '#c9a46a', 0.6),
  ],
  book: () => [box(27.6, 79, 9, 12, '#5a7a6a', { rx: 1 }), rect(29, 80.2, 7, 9.6, '#efe6cc'), stroke('M27.6 79 V91', '#3a5244', 1.6), stroke('M30 83 H35 M30 85.4 H34', '#9a9070', 0.6)],
  quill: () => [shape('M34 84 Q30 72 24 62 Q32 66 36 82 Z', '#f4f1ea'), stroke('M34.4 86 L25 63', '#b8b2a4', 0.6), box(31, 86, 6, 6, '#2b2b3a', { rx: 1.2 })],
  stick: () => [stroke('M34.6 112 Q33 96 35 80 Q36.4 66 33 54 Q31.6 49 35 47', '#9a8a6a', 3), stroke('M34.6 112 Q33 96 35 80 Q36.4 66 33 54', '#c2b08a', 1.2)],
};

// ---------------------------------------------------------------------------
// Archetypes (looks: figure-kit.js composeFigure)
// ---------------------------------------------------------------------------

/** A fin-like ear in the category color. */
const finEar = () => [shape('M33.6 45 Q27 42.4 25 34.6 Q29.6 37.4 33.6 38 Z', 'cat-light'), stroke('M32.6 43 L27 37 M33 40.4 L28.6 37.4', 'cat-dark', 0.6)];

/** The tail of a mermaid: scaled, in the category color, curving into a fluke (the front leg group). */
function fishTail() {
  return [
    shape('M35 82 Q33.4 97 41.4 105.4 L39 107.6 Q31.4 110 28.4 117.4 Q36.6 113.2 44.8 112.2 Q53.4 114.4 60.4 117.6 Q57.6 110 50.4 107.4 L49.2 105.4 Q58.8 96 57 82 Z', 'cat'),
    stroke('M38 88 q2.6 2.6 5.2 0 q2.6 2.6 5.2 0 q2.6 2.6 5.2 0 M38.6 94 q2.4 2.4 4.8 0 q2.4 2.4 4.8 0 q2.4 2.4 4.8 0 M41 100 q2 2 4 0 q2 2 4 0', 'cat-dark', 0.8),
    shape('M39.4 107.4 Q31.8 110.4 28.4 117.4 Q36.6 113.2 44.8 112.2 Q53.4 114.4 60.4 117.6 Q57.6 110.2 50.2 107.6 Q45 110 39.4 107.4 Z', 'cat-light'),
    stroke('M44.8 111.4 L33 115.6 M44.8 111.4 L37.6 112 M44.8 111.4 L56 115.8 M44.8 111.4 L51.6 111.2', 'cat-dark', 0.7),
  ];
}

/** Long hair streaming back in the water, in wavy locks. */
function flowingHair(color) {
  return {
    back: [shape('M46 22.6 Q32 22 27.4 31 Q19 28.6 9.4 34 Q17.6 36.4 20 41 Q11.6 45 7.6 53.6 Q15.6 51 21.6 51.6 Q17 58 17.6 66.4 Q23.6 60 30 58.4 Q33 62 35.4 61.4 L37 44 Z', color),
      stroke('M27 34 Q19 36 13 35.4 M25 44 Q17 47.6 11.4 52 M29 52 Q23 57.6 20.4 63', darker(color, 0.22), 0.9)],
    front: HAIR.longWavy(color).front,
  };
}

/** Merfolk: a scaled fish tail in the category color, fin ears, flowing hair, shell jewelry, a trident or a conch. */
function merfolk(look) {
  const random = rngOf(look);
  const skin = pick([...HUMAN_SKINS, '#d8eee6'], random);
  const hairColor = pick(['#2a9d8f', '#e85d75', '#f2c94c', '#1f1a17', '#8a3b1a', '#7c4dbe', '#3d6fd0', '#f4ead0', '#5a3a22'], random);
  const isMerman = random() < 0.4;
  const crown = pickWeighted([['tiara', 30], ['starfish', 25], ['flower', 20], [null, 25]], random);
  const held = pickWeighted([['trident', 35], ['conch', 25], ['pearl', 15], [null, 25]], random);
  const shellColor = pick([SHELL_PINK, '#f2b8c6', '#cfe8f0', '#f4ead0', '#e8c8f0'], random);
  const build = isMerman ? 'regular' : 'slim';
  const { x, width } = BUILDS[build];
  const hair = isMerman ? (random() < 0.5 ? HAIR.shaggy(hairColor) : HAIR.longStraight(hairColor)) : flowingHair(hairColor);
  const sleeves = { style: 'bare', hand: skin, cuff: GOLD, width: isMerman ? 6 : 5.4 };
  const scaleRow = y => stroke(`M${x + 1} ${y} ${Array.from({ length: Math.floor((width - 2) / 4.2) }, () => 'q2.1 2.2 4.2 0').join(' ')}`, 'cat-dark', 0.7);
  return {
    shadowWidth: 13,
    legBack: [],
    legFront: fishTail(),
    armBack: arm('back', sleeves),
    armFront: arm('front', sleeves),
    torso: [
      shape(torsoPath(build), skin),
      shape(`M${x + 0.3} 75 Q46 78.4 ${x + width - 0.3} 75 L${x + width - 0.6} 91 Q46 94 ${x + 0.6} 91 Z`, 'cat'),
      scaleRow(80), scaleRow(85.4),
      shape(`M${x - 1} 76.6 L${x + 2} 72.6 L${x + 5} 76.6 L${x + 8} 72.4 L${x + 11} 76.6 L46 72.2 L${46 + 3} 76.6 L${46 + 6} 72.4 L${x + width - 5} 76.6 L${x + width - 2} 72.6 L${x + width + 1} 76.6 Q46 80 ${x - 1} 76.6 Z`, 'cat-light'),
      isMerman
        ? [stroke(`M${x + 2} 58 Q46 68 ${x + width - 3} 74`, '#3f7a3a', 3.4), stroke(`M${x + 2} 58 Q46 68 ${x + width - 3} 74`, KELP, 2),
          scallop(48, 67, 3.6, shellColor)]
        : [scallop(42.2, 66.6, 4.4, shellColor), scallop(50.4, 66.6, 4.4, shellColor), stroke('M37.4 62 Q46 58.4 54.6 62', darker(shellColor, 0.2), 0.7)],
      shade(`M50 56 Q${x + width - 2} 56 ${x + width} 64 L${x + width - 1} 91 Q54 92.6 50 92.6 Z`, '#000000', 0.08),
    ],
    overTorso: [
      stroke('M39.6 56.4 Q46 62.4 52.4 56.4', '#fff8ee', 1.6, { 'stroke-dasharray': '0.1 2.6' }),
      isMerman && shape('M51 56 Q58 54 61.4 59 Q60 63 56.6 62.6 Q55 59 51 58.6 Z', shellColor),
    ],
    held: HELD[held]?.() ?? null,
    headScale: 1,
    head: {
      back: hair.back,
      base: [headBase(skin, { ears: 'none' }), finEar()],
      features: nose(skin, 0.9),
      eyes: TOON_EYES,
      brows: darker(hairColor, 0.15),
      beforeMouth: isMerman && random() < 0.4 ? BEARD.short(hairColor) : null,
      mouth: { anchor: [47.6, 47.4] },
      front: hair.front,
      cheeks: isMerman ? null : '#f6a0a8',
      hat: crown === 'tiara'
        ? [stroke('M32.4 32 Q46 25.6 59.6 31.4', GOLD, 1.6), shape('M40.4 28.4 L42 22.6 L44 27.4 Z M47.4 26.6 L49 20.6 L50.6 26.4 Z M53.8 27.6 L55.6 23 L56.4 28.6 Z', GOLD), dot(46, 27.6, 1.8, PEARL, { 'stroke-width': 0.4 })]
        : crown === 'starfish' ? starfish(35.6, 30.4, 4.6, pick(['#f2864a', '#f2c94c', '#e85d75'], random))
          : crown === 'flower' ? [...[0, 72, 144, 216, 288].map(angle => blob(35 + Math.cos(angle * Math.PI / 180) * 2.6, 31 + Math.sin(angle * Math.PI / 180) * 2.6, 2.2, 2.2, '#f8a8c8', { 'stroke-width': 0.5 })), dot(35, 31, 1.4, '#ffe08a', { 'stroke-width': 0.4 })]
            : null,
    },
  };
}

/** An old-style diver: a brass helmet with portholes (the face behind the front glass), a canvas suit in the category color, lead boots. */
function diver(look) {
  const random = rngOf(look);
  const skin = pick(HUMAN_SKINS, random);
  const hairColor = pick(['#1f1a17', '#3d2a1c', '#5a3a22', '#8a3b1a', '#a8a29e'], random);
  const held = pickWeighted([['lamp', 40], ['net', 35], [null, 25]], random);
  const brass = pick([BRASS, '#c9923a', '#e0b84a'], random);
  const brassDark = darker(brass, 0.35);
  const mustache = random() < 0.35;
  const gloves = pick(['#5a4a3a', '#3a3a3a', '#7a5a3a'], random);
  const leadBoot = side => {
    const [ax, fx] = side === 'back' ? [40.2, 41.5] : [52.2, 54];
    return [shape(`M${ax - 5} 100 H${ax + 5} L${ax + 5.6} 107 Q${fx + 9} 106.6 ${fx + 8.4} 112.6 H${fx - 7} Q${fx - 7.6} 106 ${ax - 5} 104 Z`, '#6b7280'),
      shape(`M${fx + 2} 107.6 Q${fx + 9} 106.6 ${fx + 8.4} 112.6 H${fx + 2} Z`, brass), stroke(`M${ax - 5} 103.4 H${ax + 5.4}`, '#4b5563', 1.6)];
  };
  return {
    shadowWidth: 19,
    behind: [stroke('M31 42 Q14 48 17 68 Q20 86 12 104 Q8 112 10 120', '#2f3338', 4.8), stroke('M31 42 Q14 48 17 68 Q20 86 12 104 Q8 112 10 120', '#5a626b', 3),
      stroke('M18 54 h2.6 M17.4 64 h2.6 M18 74 h2.6 M17.2 84 h2.6 M14.6 96 h2.6', '#2f3338', 0.8)],
    legBack: [limb(41, 88, 40.4, 103, 8.4, 'cat'), leadBoot('back')],
    legFront: [limb(51, 88, 52, 103, 8.4, 'cat'), leadBoot('front')],
    armBack: arm('back', { sleeve: 'cat', hand: gloves, cuff: '#3a3a3a', width: 7.4, handSize: 3.8 }),
    armFront: arm('front', { sleeve: 'cat', hand: gloves, cuff: '#3a3a3a', width: 7.4, handSize: 3.8 }),
    torso: [
      shape(torsoPath('broad', { bottom: 93 }), 'cat'),
      stroke('M46 66 V92 M36 70 Q35 82 36 92 M56 70 Q57 82 56 92', 'cat-dark', 0.9),
      shade('M50 56 Q58 56 61 64 L60 92 Q54 94 50 94 Z', '#000000', 0.12),
      box(30.4, 82, 31.2, 5, '#4a3a2a', { rx: 1.4 }),
      ...[33.6, 41, 51, 58.4].map(bx => box(bx - 2.6, 81, 5.2, 7, '#7a828c', { rx: 1 })),
    ],
    overTorso: [
      shape('M29.6 57.4 Q46 49.4 62.4 57.4 L61 68.4 Q46 74 31 68.4 Z', brass),
      shade('M50 52.6 Q58 53.6 62.4 57.4 L61 68.4 Q56 70.6 50 71.4 Z', '#000000', 0.14),
      ...[[33, 62.6], [38.6, 66.6], [46, 68.6], [53.4, 66.6], [59, 62.6]].map(([bx, by]) => circle(bx, by, 0.9, brassDark)),
    ],
    held: HELD[held]?.() ?? null,
    headScale: 1.04,
    head: {
      base: [dot(46, 38.4, 17.6, brass), shade('M52 22 Q64 28 63.6 40 Q63 50 56 55 Q60 44 58.4 34 Q57 26 52 22 Z', '#000000', 0.16),
        stroke('M34 28 Q38.4 23.6 45 22.4', '#fff3c4', 2.2, { 'stroke-opacity': 0.7 }),
        dot(33.6, 39.4, 4.8, brassDark), dot(33.6, 39.4, 3.4, '#2a5a6a', { 'stroke-width': 0.4 }), stroke('M32 37.8 L35 36.6', '#bfe8f0', 0.8),
        dot(45, 24.6, 3.6, brassDark), dot(45, 24.6, 2.4, '#2a5a6a', { 'stroke-width': 0.4 }),
        dot(48.8, 41.4, 10.6, brassDark), dot(48.8, 41.4, 9.2, skin, { 'stroke-width': 0.4 })],
      features: [stroke('M52.6 42.6 q1.4 1.2 0.2 2.6', darker(skin, 0.3), 0.8), stroke('M41 33.6 Q45 31.6 48 33', hairColor, 2.2)],
      eyes: { anchors: [[45.4, 40.4], [51.4, 40.4]], style: 'toon' },
      brows: darker(hairColor, 0.1),
      beforeMouth: mustache ? shape('M44.6 44.4 q2 -1.6 4 0 q2 -1.6 4 0 q-2 2 -4 0.6 q-2 1.4 -4 -0.6 Z', hairColor) : null,
      mouth: { anchor: [48.6, 45.6], width: 0.6 },
      front: [circle(48.8, 41.4, 9.4, 'none', { stroke: brass, 'stroke-width': 2 }),
        ...[0, 60, 120, 180, 240, 300].map(angle => circle(48.8 + Math.cos(angle * Math.PI / 180) * 10.2, 41.4 + Math.sin(angle * Math.PI / 180) * 10.2, 0.9, brassDark))],
      eyewear: [path('M42.4 36 A8 8 0 0 1 50 33.4', 'none', { stroke: '#ffffff', 'stroke-width': 1.6, 'stroke-opacity': 0.75, 'stroke-linecap': 'round' }),
        circle(48.8, 41.4, 9.2, '#bfeaf6', { 'fill-opacity': 0.05 })],
      hat: [box(36.6, 20.2, 5, 4.4, brassDark, { rx: 1, transform: 'rotate(-30 39 22.4)' }), dot(37.4, 19.6, 1.8, brass)],
    },
  };
}

// --- Fish folk: a fish head on a body in a knitted sweater ---

const FISH_PALETTES = [
  { body: '#ffd84a', belly: '#fff0a8', fin: '#ffd84a', mark: '#1f2a44', pattern: 'bands', lips: '#f0a83a' },
  { body: '#a8865a', belly: '#d8c4a0', fin: '#8a6a44', mark: '#6e5232', pattern: 'spots', lips: '#c8a07a' },
  { body: '#3cc0a8', belly: '#a8ecd8', fin: '#f27ca0', mark: '#f27ca0', pattern: 'scales', lips: '#f6a0b8' },
  { body: '#e8564a', belly: '#f6b0a0', fin: '#c83a3a', mark: '#c83a3a', pattern: 'scales', lips: '#f6a0a0' },
  { body: '#8a5ad0', belly: '#d8c4f6', fin: '#ffd84a', mark: '#ffd84a', pattern: 'band', lips: '#c8a0f0' },
  { body: '#5a8ad8', belly: '#d0e4f6', fin: '#3a62a8', mark: '#d0e4f6', pattern: 'spots', lips: '#a8c8f0' },
];

/** A flipper foot at a leg's foot point. */
const flipper = (side, color) => {
  const [fx, fy] = side === 'back' ? [41.5, 111] : [54, 111];
  return [shape(`M${fx - 4} ${fy - 3.6} L${fx + 9.6} ${fy - 2} Q${fx + 11} ${fy} ${fx + 9.6} ${fy + 1.8} L${fx - 4} ${fy + 1.6} Q${fx - 6} ${fy - 1} ${fx - 4} ${fy - 3.6} Z`, color),
    stroke(`M${fx} ${fy - 1} L${fx + 9} ${fy - 1.2} M${fx} ${fy + 0.6} L${fx + 9} ${fy + 0.8}`, darker(color, 0.3), 0.6)];
};

/** Fish folk: a fish head with big eyes, a crest fin and pouting lips, a knitted sweater in the category color, flipper feet. */
function fishfolk(look, persona = {}) {
  const random = rngOf(look);
  const colors = pick(FISH_PALETTES, random);
  const held = pickWeighted([['net', 40], ['lamp', 15], [null, 45]], random);
  const hat = pickWeighted([['cap', 30], [null, 70]], random);
  const mouthOpen = persona.mood === 'celebrating';
  const worried = persona.mood === 'sweating';
  const headShape = 'M30.6 41 Q30 24.6 45 23 Q57.6 22.4 63 35 Q65.6 41.4 62.6 47.6 Q56.6 56 44.4 56 Q30.8 54.6 30.6 41 Z';
  const markings = {
    bands: [path('M37.6 25.6 Q34 40 37.6 54.2 L42.6 55.6 Q38.6 40 42.6 23.8 Z', colors.mark), path('M51 23 Q47 38 51.6 55.6 L55 54.4 Q51 38 54.6 24.2 Z', colors.mark, { 'fill-opacity': 0.9 })],
    spots: [[37, 30], [41, 48], [36, 40], [56, 30], [58.6, 49], [44, 27]].map(([sx, sy]) => circle(sx, sy, 1.7, colors.mark, { 'fill-opacity': 0.8 })),
    scales: [path('M33.6 36 q2 -2.4 4 0 q2 -2.4 4 0 M32.6 44 q2 -2.4 4 0 q2 -2.4 4 0 M35.6 51 q2 -2.4 4 0', 'none', { stroke: colors.mark, 'stroke-width': 1, 'stroke-linecap': 'round' })],
    band: [path('M44 23.4 Q40 40 44.6 56 L49.6 55.8 Q45 40 49 23 Z', colors.mark)],
  }[colors.pattern];
  return {
    shadowWidth: 16,
    behind: [shape('M37 84 Q28 78 22 72 Q24 82 22 92 Q28 88 37 90 Z', colors.fin), stroke('M36 86 L24 76 M36 87 L23.6 84 M36 88 L23.6 90', darker(colors.fin, 0.3), 0.7)],
    legBack: [limb(41, 88, 41, 107.5, 6.6, colors.body), flipper('back', colors.fin)],
    legFront: [limb(51, 88, 52, 107.5, 6.6, colors.body), flipper('front', colors.fin)],
    armBack: [arm('back', { sleeve: 'cat', hand: colors.body, width: 6.6, cuff: 'cat-dark' }), shape('M36 70 Q28 72 27.4 78 Q31.6 75 35.4 76 Z', colors.fin)],
    armFront: [arm('front', { sleeve: 'cat', hand: colors.body, width: 6.6, cuff: 'cat-dark' }), shape('M58 70 Q65 73 65 79 Q61.4 76 57.8 76.6 Z', colors.fin)],
    torso: [
      shape(torsoPath('round', { bottom: 92 }), 'cat'),
      stroke('M37 64 V89 M41 61 V91 M45 60 V92 M49 60 V92 M53 61 V91 M57 64 V88', 'cat-dark', 0.7),
      shape('M34 86 Q46 90.4 58 86 L58.4 91.4 Q46 95.4 33.6 91.4 Z', 'cat-dark'),
      shape('M37.4 54.6 Q46 51 54.6 54.6 L54.4 59.6 Q46 62.4 37.6 59.6 Z', 'cat-dark'),
      shade('M50 56 Q58 56 59.4 64 L59 90 Q54 92.6 50 92.6 Z', '#000000', 0.1),
    ],
    held: HELD[held]?.() ?? null,
    headScale: 1.06,
    head: {
      back: [shape('M35.4 27 Q37 12 52 9.4 Q47 15 52.4 18 Q48 20 54 24.4 Z', colors.fin), stroke('M38.6 24 L44 13 M42.4 23.4 L48 13 M46.4 23.6 L50 18.6', darker(colors.fin, 0.3), 0.7)],
      base: [shape(headShape, colors.body), shape('M33 46 Q40 55.6 52 55.6 Q60.6 54.4 62.6 47.6 Q54 51 44 50.4 Q37 49.6 33 46 Z', colors.belly, { 'stroke-width': 0 }), markings],
      features: [
        stroke('M40 30 Q36.4 40 40.6 51', darker(colors.body, 0.3), 0.9),
        shape('M40 41 Q33 39 30.4 33 Q36.6 35.6 41 37 Z', colors.fin),
        blob(46.6, 37.6, 5, 5.4, '#ffffff'), blob(55, 37.2, 4.2, 4.8, '#ffffff'),
      ],
      eyes: { anchors: [[47, 38.2], [55.4, 37.8]], style: 'toon' },
      brows: darker(colors.body, 0.4),
      mouth: {
        custom: mouthOpen
          ? [blob(61, 47.6, 3.4, 3.6, colors.lips), blob(61.4, 47.8, 1.8, 2.2, '#5a1a2a', { 'stroke-width': 0 })]
          : worried ? [shape('M57.6 46.6 Q61 44.6 63.6 46.4 Q63.4 48.6 61 49.6 Q58.4 49.4 57.6 46.6 Z', colors.lips), stroke('M58.6 47.6 H62.6', darker(colors.lips, 0.4), 0.7)]
            : [shape('M57.4 45.6 Q61.4 43.4 64 46.2 Q61.4 47.8 64 49.6 Q61 51.6 57.4 49 Z', colors.lips), stroke('M58.4 47.4 Q61 47.6 63.2 47.8', darker(colors.lips, 0.35), 0.7)],
      },
      hat: hat === 'cap' ? [shape('M33 31 Q34 20 46 19.6 Q57 20 58 30 Z', pick(['#2a4a7a', '#b8322c', '#f4efe2'], random)), dot(46, 18.6, 2.2, '#f4efe2'),
        box(31, 29, 28, 3.4, '#1f2937', { rx: 1.4 })] : null,
    },
  };
}

// --- The octopus: a bulbous head, tentacle arms and legs, a waistcoat ---

const OCTOPUS_COLORS = ['#e8604a', '#c0508a', '#8a5ad0', '#f29a4a', '#3ab0a8', '#d8706a', '#e8b04a'];

/** A tentacle from the hip curling on the floor, with suckers. */
function tentacle(d, color, suckers) {
  return [softLimb(d, color, 5.2), suckers.map(([sx, sy]) => circle(sx, sy, 0.9, lighter(color, 0.55)))];
}

/** An octopus scholar: a big spotted head with large eyes, tentacles for arms and legs, a waistcoat in the category color, a book or a quill. */
function octopus(look) {
  const random = rngOf(look);
  const color = pick(OCTOPUS_COLORS, random);
  const light = lighter(color, 0.35);
  const held = pickWeighted([['book', 40], ['quill', 30], [null, 30]], random);
  const headwear = pickWeighted([['bowler', 25], ['monocle', 25], [null, 50]], random);
  const bow = pick(['#f2c94c', '#1f2937', '#f4efe2', '#2a9d8f'], random);
  const armTentacle = side => side === 'back'
    ? [softLimb('M37 62 Q33 72 35 80 Q36.4 85 33.4 86', color, 5), circle(34, 70, 0.9, light), circle(34.6, 76, 0.9, light)]
    : [softLimb('M55 62 Q59 72 57 80 Q55.6 85 58.6 86', color, 5), circle(58, 70, 0.9, light), circle(57.4, 76, 0.9, light)];
  return {
    shadowWidth: 20,
    legBack: [
      tentacle('M39 86 Q34 98 28 106 Q24 111 28.6 112 Q31 112 30 109', color, [[33.6, 99], [30, 104.6]]),
      tentacle('M43 88 Q41 100 40 106 Q39.6 111 43.6 111.4 Q45.6 111 45 108.6', color, [[41.4, 99], [40.6, 105]]),
    ],
    legFront: [
      tentacle('M49 88 Q51 100 52 106 Q52.6 111 56.6 111 Q58.6 110.4 57.6 108', color, [[50.8, 99], [52, 105]]),
      tentacle('M53 86 Q58 98 64 105 Q68 110 64 112 Q61.6 112.4 62 109.6', color, [[57.6, 98], [61.6, 103.6]]),
    ],
    armBack: armTentacle('back'),
    armFront: armTentacle('front'),
    torso: [
      shape(torsoPath('round', { top: 54, bottom: 90 }), color),
      shape('M33.6 58 Q37 55.2 41.8 56 L45.4 70 L45.4 89 Q39 90.4 34.4 88 Q31.4 74 33.6 58 Z', 'cat'),
      shape('M58.4 58 Q55 55.2 50.2 56 L46.6 70 L46.6 89 Q53 90.4 57.6 88 Q60.6 74 58.4 58 Z', 'cat'),
      shade('M50.2 56 L46.6 70 L46.6 89 Q53 90.4 57.6 88 Q60.6 74 58.4 58 Q55 55.2 50.2 56 Z', '#000000', 0.12),
      buttons(48.2, [72, 77.4, 82.8], GOLD, 1.05),
      stroke('M45.6 74 Q50 77 53.6 74', GOLD, 0.7),
    ],
    overTorso: [shape('M41 55 L46 57.6 L41 60.4 Z', bow), shape('M51 55 L46 57.6 L51 60.4 Z', bow), dot(46, 57.6, 1.3, darker(bow, 0.2))],
    held: HELD[held]?.() ?? null,
    headScale: 1.06,
    head: {
      base: [shape('M30.6 47.6 Q25 32 33 19.6 Q41 8.6 52 10.6 Q63.4 13 64.6 27 Q65.6 39 61.6 47.6 Q54 55 46 55 Q36.6 55 30.6 47.6 Z', color),
        shade('M52 10.6 Q63.4 13 64.6 27 Q65.6 39 61.6 47.6 Q60 34 56 24 Q54 16 52 10.6 Z', '#000000', 0.12),
        ...[[38, 20, 2.2], [45, 15, 1.8], [52, 18, 2.4], [34, 30, 1.6], [57, 27, 1.8], [44, 24, 1.4]].map(([sx, sy, r]) => circle(sx, sy, r, light, { 'fill-opacity': 0.8 })),
        stroke('M35 22 Q38 15 45 13', '#ffffff', 1.8, { 'stroke-opacity': 0.45 })],
      features: [blob(42.4, 40.4, 4.6, 5.2, '#ffffff'), blob(51.8, 40.2, 4.2, 5, '#ffffff'),
        shape('M60.6 44 Q65 43 66 46.6 Q64 48.4 61 47.4 Z', color)],
      eyes: { anchors: [[42.8, 40.8], [52.2, 40.6]], style: 'toon' },
      brows: darker(color, 0.4),
      mouth: { anchor: [47.6, 48.4], width: 0.8 },
      eyewear: headwear === 'monocle' ? [circle(52.2, 40.6, 5, 'none', { stroke: GOLD, 'stroke-width': 1.1 }), stroke('M56.6 43 Q58 50 55 56', GOLD, 0.6)] : null,
      hat: headwear === 'bowler' ? [blob(45, 13.6, 13, 2.6, '#2b2523'), shape('M36 13.6 Q36 3 45 2.6 Q54 3 54 13.6 Z', '#2b2523'), stroke('M36.4 11.4 Q45 13 53.6 11.4', bow, 1.4)] : null,
    },
  };
}

/** A sea turtle elder: a domed shell on the back, a scaly head, flipper arms, a long knitted scarf in the category color. */
function turtle(look) {
  const random = rngOf(look);
  const skin = pick(['#8fb87a', '#7aa86a', '#a0b878', '#6f9a7a', '#9ab88a'], random);
  const shellColors = pick([['#8a6a3a', '#b08a52'], ['#6a5a3a', '#94804e'], ['#7a5a32', '#a87a42'], ['#5a6a4a', '#7a8a5a']], random);
  const held = pickWeighted([['stick', 45], ['book', 15], [null, 40]], random);
  const glasses = random() < 0.5;
  const cap = random() < 0.3 ? pick(['#2a4a7a', '#b8322c', '#e9e2d0'], random) : null;
  const skinDark = darker(skin, 0.25);
  const flipperArm = side => {
    const [sx, sy, ex, ey] = side === 'back' ? [37, 62, 34.4, 76] : [55, 62, 57.6, 76];
    return [limb(sx, sy, ex, ey, 6.2, skin),
      shape(side === 'back' ? 'M30.4 74 Q29 84 33 90 Q37.6 88 38.2 80 Q38 75 34.4 73 Z' : 'M54 73 Q53.6 82 58 89 Q62.4 87 62 79 Q60.4 74 57.6 73 Z', skin),
      circle(side === 'back' ? 34 : 58, 82, 0.9, skinDark)];
  };
  return {
    shadowWidth: 21,
    behind: [
      shape('M22 70 Q20 52 34 48.6 Q46 46.6 52 54 L56 92 Q50 104 36 102 Q22 98 22 84 Z', shellColors[0]),
      path('M26 66 L34 60 L42 64 L42 76 L34 80 L26 76 Z M34 80 L34 92 L26 94 M42 76 L50 82 M42 64 L48 58', 'none', { stroke: darker(shellColors[0], 0.35), 'stroke-width': 1.2, 'stroke-linejoin': 'round' }),
      path('M27 67 L34 62 L41 65 L41 75 L34 79 L27 75 Z', shellColors[1], { 'fill-opacity': 0.75 }),
      path('M22 70 Q20 52 34 48.6', 'none', { stroke: lighter(shellColors[1], 0.3), 'stroke-width': 1.6, 'stroke-linecap': 'round' }),
    ],
    legBack: [limb(41, 88, 40.6, 106, 8.6, skin), blob(42, 110.4, 6, 3, skin)],
    legFront: [limb(51, 88, 52.6, 106, 8.6, skin), blob(54.6, 110.4, 6, 3, skin)],
    armBack: flipperArm('back'),
    armFront: flipperArm('front'),
    torso: [
      shape(torsoPath('round', { bottom: 94 }), '#e8d8a0'),
      stroke('M34 66 Q46 69 58 66 M33.6 76 Q46 79 58.6 76 M34 86 Q46 89 58 86 M46 58 V93', '#b8a46a', 1),
      shade('M50 56 Q58 56 60 64 L59 92 Q54 95 50 95 Z', '#000000', 0.08),
    ],
    overTorso: [
      shape('M35.6 54.6 Q46 50.6 56.4 54.6 L56 60.6 Q46 64.6 36 60.6 Z', 'cat'),
      shape('M49 59 L54.6 60 L55 81 L49.4 79 Z', 'cat'),
      stroke('M50 64 H54.8 M50 68.6 H54.8 M50 73.2 H54.8', 'cat-dark', 1),
      stroke('M49.4 79.6 v2.6 M51.2 80.2 v2.6 M53 80.8 v2.6 M54.8 81.2 v2.6', 'cat-dark', 0.9),
      stroke('M38 56.6 Q46 59.6 54 56.6', 'cat-dark', 0.9),
    ],
    held: HELD[held]?.() ?? null,
    headScale: 0.96,
    head: {
      base: [shape('M31.4 44 Q30.4 27 45 25.6 Q58.6 25.4 63 37.6 Q65.4 46 60.6 52 Q54 56 44 55.4 Q33 53.6 31.4 44 Z', skin),
        ...[[38, 31, 1.6], [44, 29, 1.2], [36, 38, 1.2], [56, 31, 1.4], [40, 50, 1.2]].map(([sx, sy, r]) => circle(sx, sy, r, skinDark, { 'fill-opacity': 0.7 }))],
      features: [shape('M58.6 42 Q64 41 64.6 45.4 Q62.4 47 59.6 46 Z', darker(skin, 0.12)), stroke('M33 46 Q40 53 52 53.4', skinDark, 0.8)],
      eyes: TOON_EYES,
      brows: darker(skin, 0.45),
      mouth: { anchor: [49, 48.6], width: 0.85 },
      eyewear: glasses ? [circle(43, 41, 3.8, 'none', { stroke: '#5a4a3a', 'stroke-width': 1 }), circle(52, 41, 3.8, 'none', { stroke: '#5a4a3a', 'stroke-width': 1 }),
        stroke('M46.8 41 H48.2 M39.2 40.4 L33 38.6', '#5a4a3a', 0.9)] : null,
      hat: cap ? [shape('M32.4 33 Q32 21.6 46 21 Q59.4 21.6 59.8 32 Z', cap), shape('M31.4 34.4 Q46 29 60.6 33 L60.4 30 Q46 25.6 31.6 31 Z', darker(cap, 0.15)), dot(46, 20.4, 2, lighter(cap, 0.3))] : null,
    },
  };
}

/** A crab guard of the palace: a spiky shell, eyes on stalks, big claws, a tabard in the category color, sometimes a trident. */
function crab(look) {
  const random = rngOf(look);
  const shell = pick(['#d8432e', '#e8743a', '#5a6ad0', '#d8a05a', '#c0503a'], random);
  const shellDark = darker(shell, 0.3);
  const shellLight = lighter(shell, 0.3);
  const held = pickWeighted([['trident', 40], [null, 60]], random);
  const claw = side => {
    const [sx, sy, wx, wy] = side === 'back' ? [37, 62, 34.4, 78] : [55, 62, 57.6, 78];
    const [hx, hy] = side === 'back' ? [34, 84] : [58, 84];
    return [limb(sx, sy, wx, wy, 4.6, shell),
      shape(`M${hx - 8} ${hy - 5} Q${hx - 8.4} ${hy - 14} ${hx} ${hy - 13.4} Q${hx + 9} ${hy - 13} ${hx + 9.6} ${hy - 3} Q${hx + 3.4} ${hy - 6.4} ${hx - 0.6} ${hy - 3.4} Q${hx - 5} ${hy - 0.4} ${hx - 8} ${hy - 5} Z`, shell),
      shape(`M${hx - 6.4} ${hy - 0.4} Q${hx} ${hy - 3.8} ${hx + 8.4} ${hy + 0.4} Q${hx + 3} ${hy + 7.4} ${hx - 4.6} ${hy + 5.4} Z`, shellLight),
      stroke(`M${hx - 4.4} ${hy - 10} Q${hx} ${hy - 11.6} ${hx + 4.4} ${hy - 10}`, '#ffffff', 1, { 'stroke-opacity': 0.5 })];
  };
  const crabLegs = side => (side === 'back'
    ? [limb(40, 88, 34, 99, 2.8, shell), limb(34, 99, 31, 111, 2.4, shell), limb(43, 89, 39.6, 100, 2.8, shell), limb(39.6, 100, 39, 111, 2.4, shell)]
    : [limb(49, 89, 53, 100, 2.8, shell), limb(53, 100, 54, 111, 2.4, shell), limb(52, 88, 59, 99, 2.8, shell), limb(59, 99, 62, 111, 2.4, shell)]);
  return {
    shadowWidth: 20,
    legBack: crabLegs('back'),
    legFront: crabLegs('front'),
    armBack: claw('back'),
    armFront: claw('front'),
    torso: [
      shape(torsoPath('round', { top: 56, bottom: 90 }), shell),
      shape('M37 58 Q46 55 55 58 L56.4 88 Q46 91.4 35.6 88 Z', 'cat'),
      shape('M37 58 Q46 55 55 58 L55.4 64 Q46 61.4 36.6 64 Z', 'cat-dark'),
      stroke('M36 87 Q46 90.6 56 87', 'cat-dark', 1.2),
      belt('round', 74, '#5a3a22', GOLD),
      dot(46, 66.6, 2, PEARL, { 'stroke-width': 0.5 }),
    ],
    held: HELD[held]?.() ?? null,
    headScale: 1.04,
    head: {
      back: [limb(41, 34, 39, 20, 2.4, shell), limb(51, 34, 53, 20, 2.4, shell),
        blob(39, 18.6, 4.6, 4.8, '#ffffff', { stroke: shellDark }), blob(53, 18.6, 4.6, 4.8, '#ffffff', { stroke: shellDark })],
      base: [shape('M27 45 Q26 32 46 30.6 Q66 32 65 45 Q60 55 46 55.4 Q32 55 27 45 Z', shell),
        shape('M27 45 L24.6 41 L28.4 40.6 L27.6 36 L31.6 37.4 M65 45 L67.4 41 L63.6 40.6 L64.4 36 L60.4 37.4', shell),
        stroke('M31 36 Q46 31.4 61 36', shellLight, 1.6, { 'stroke-opacity': 0.8 }),
        ...[[36, 47], [56, 47], [46, 51]].map(([sx, sy]) => circle(sx, sy, 1, shellDark))],
      eyes: { anchors: [[39.4, 19], [53.4, 19]], style: 'toon' },
      brows: shellDark,
      mouth: { anchor: [46.4, 43.4], width: 0.9 },
      cheeks: '#f6a0a0',
    },
  };
}

// ---------------------------------------------------------------------------
// Furniture (world-layout.js ART sizes)
// ---------------------------------------------------------------------------

/** A branching coral (stroked tree) rooted at (x, y). */
const branchCoral = (x, y, scale, color, extra = {}) => {
  const d = `M${x} ${y} l0 ${-8 * scale} l${-5 * scale} ${-7 * scale} l${-1 * scale} ${-7 * scale} M${x} ${y - 8 * scale} l${4 * scale} ${-9 * scale} l${-1 * scale} ${-8 * scale} M${x + 4 * scale} ${y - 17 * scale} l${6 * scale} ${-4 * scale} l${1 * scale} ${-6 * scale} M${x} ${y - 4 * scale} l${-7 * scale} ${-4 * scale} l${-3 * scale} ${-6 * scale}`;
  return [path(d, 'none', { stroke: darker(color, 0.3), 'stroke-width': 3.2 * scale + 1.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...extra }),
    path(d, 'none', { stroke: color, 'stroke-width': 3.2 * scale, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...extra })];
};

/** A kelp frond (a wavy blade) rising from (x, y) by height. */
const kelpFrond = (x, y, height, color, extra = {}) => [
  path(`M${x} ${y} Q${x - 5} ${y - height * 0.3} ${x} ${y - height * 0.55} Q${x + 5} ${y - height * 0.8} ${x - 1} ${y - height} Q${x + 7} ${y - height * 0.78} ${x + 4} ${y - height * 0.55} Q${x + 1} ${y - height * 0.3} ${x + 4} ${y} Z`, color, { stroke: darker(color, 0.3), 'stroke-width': 0.9, ...extra }),
];

/** A sea anemone: a base and wavy tentacles. */
const anemone = (x, y, scale, tentacles, base = '#c0507a', extra = {}) => [
  path(`M${x - 6 * scale} ${y} Q${x - 7 * scale} ${y - 5 * scale} ${x - 5 * scale} ${y - 7 * scale} H${x + 5 * scale} Q${x + 7 * scale} ${y - 5 * scale} ${x + 6 * scale} ${y} Z`, base, { stroke: darker(base, 0.3), 'stroke-width': 0.8 }),
  path(`M${x - 5 * scale} ${y - 7 * scale} q${-5 * scale} ${-5 * scale} ${-3 * scale} ${-10 * scale} M${x - 2.5 * scale} ${y - 7 * scale} q${-3 * scale} ${-7 * scale} 0 ${-12 * scale} M${x} ${y - 7 * scale} q${-1 * scale} ${-8 * scale} ${1 * scale} ${-13 * scale} M${x + 2.5 * scale} ${y - 7 * scale} q${3 * scale} ${-7 * scale} 0 ${-12 * scale} M${x + 5 * scale} ${y - 7 * scale} q${5 * scale} ${-5 * scale} ${3 * scale} ${-10 * scale}`,
    'none', { stroke: tentacles, 'stroke-width': 2 * scale, 'stroke-linecap': 'round', ...extra }),
];

/** A rounded rock. */
const rock = (x, y, width, height, color = ROCK) => [
  path(`M${x} ${y} Q${x - 2} ${y - height * 0.8} ${x + width * 0.3} ${y - height} Q${x + width * 0.7} ${y - height * 1.06} ${x + width} ${y - height * 0.6} Q${x + width + 2} ${y - height * 0.2} ${x + width} ${y} Z`, color, { stroke: darker(color, 0.3), 'stroke-width': 1 }),
  path(`M${x + width * 0.2} ${y - height * 0.7} Q${x + width * 0.4} ${y - height * 0.92} ${x + width * 0.62} ${y - height * 0.9}`, 'none', { stroke: lighter(color, 0.35), 'stroke-width': 1.4, 'stroke-linecap': 'round' }),
];

const decor = {
  // A stone arch crowned with a great scallop shell; a driftwood door with a brass porthole; coral and kelp around it.
  door: () => [
    path('M-2 92 V34 Q-2 6 25 4 Q52 6 52 34 V92 Z', ROCK, { stroke: ROCK_DARK, 'stroke-width': 1.2 }),
    path('M-2 50 H6 M44 50 H52 M-2 70 H6 M44 70 H52 M2 30 L8 34 M48 30 L42 34', 'none', { stroke: ROCK_DARK, 'stroke-width': 1 }),
    path('M7 92 V36 Q7 17 25 16 Q43 17 43 36 V92 Z', '#2a4a58'),
    path('M9 92 V37 Q9 19 25 18.4 Q41 19 41 37 V92 Z', '#7a8a6a', { stroke: '#4a5a44', 'stroke-width': 1 }),
    path('M17 19.6 V92 M25 18.4 V92 M33 19.6 V92', 'none', { stroke: '#5a6a50', 'stroke-width': 1 }),
    circle(25, 40, 7.6, BRASS, { stroke: BRASS_DARK, 'stroke-width': 1 }), circle(25, 40, 5.4, '#8adbe8', { class: 'p-glow' }),
    path('M21.6 37.4 A4.2 4.2 0 0 1 26.6 35.8', 'none', { stroke: '#ffffff', 'stroke-width': 1.1, 'stroke-opacity': 0.8, 'stroke-linecap': 'round' }),
    circle(35.6, 64, 2.4, 'none', { stroke: BRASS, 'stroke-width': 1.2 }),
    ...scallop(25, 14, 15, '#f4c4b8'),
    circle(25, 13, 2.6, PEARL, { stroke: '#d8c0b0', 'stroke-width': 0.6 }),
    ...[[4, 28], [10, 16], [40, 16], [46, 28]].map(([px, py]) => circle(px, py, 1.6, PEARL, { stroke: '#d8c0b0', 'stroke-width': 0.4 })),
    ...branchCoral(2, 92, 1.1, '#f4789a'), ...anemone(47, 92, 0.9, '#7ae0b0'),
    ...kelpFrond(-3, 92, 40, KELP, { class: 'p-sway' }),
    rect(4, 88, 42, 4, '#c9b48a', { rx: 1.4, stroke: '#9a8a62', 'stroke-width': 0.6 }),
  ],
  // A coral shelf: a rock with niches holding a conch, a jar, a bottle with a letter and pearls in a clam.
  shelf: () => [
    path('M0 92 Q-2 50 4 26 Q10 6 32 6 Q54 6 60 26 Q66 50 64 92 Z', ROCK, { stroke: ROCK_DARK, 'stroke-width': 1.2 }),
    path('M8 40 Q8 20 32 18 Q56 20 56 40 Z M6 66 Q8 46 32 46 Q56 46 58 66 Z M6 90 Q8 72 32 72 Q56 72 58 90 Z', '#2f5868'),
    path('M6 40 H58 M4 66 H60', 'none', { stroke: '#7aa8b4', 'stroke-width': 2.4, 'stroke-linecap': 'round' }),
    path('M14 39 Q12 30 19 28 L28 30 Q31 35 27 39 Z', '#f6c8b0', { stroke: '#c8907a', 'stroke-width': 0.8 }),
    path('M16 32 Q20 31 26 33 M15 36 Q20 35.4 25.6 37', 'none', { stroke: '#c8907a', 'stroke-width': 0.7 }),
    path('M38 39 Q35 33 38 29 V26 H44 V29 Q47 33 44 39 Z', '#c87a4a', { stroke: '#8a4a2a', 'stroke-width': 0.8 }),
    path('M37 27 Q34 28 35 31 M45 27 Q48 28 47 31', 'none', { stroke: '#8a4a2a', 'stroke-width': 1 }),
    path('M38.4 33 H43.6', 'none', { stroke: '#f2c08a', 'stroke-width': 1.2 }),
    path('M12 64 V54 Q12 50 15 49 V45 H18 V49 Q21 50 21 54 V64 Z', '#7ac0a8', { 'fill-opacity': 0.75, stroke: '#3a7a6a', 'stroke-width': 0.8 }),
    rect(13.4, 54, 6, 6, '#efe0b8', { transform: 'rotate(-8 16 57)' }),
    rect(15, 43, 3.4, 2.4, '#a8743f'),
    path('M28 64 Q30 56 38 56 Q46 56 48 64 Z', '#e8d0e0', { stroke: '#b890a8', 'stroke-width': 0.8 }),
    ...[[33, 60], [37.6, 59], [42, 60.4], [35.4, 62.4], [40, 62.6]].map(([px, py]) => circle(px, py, 1.8, PEARL, { stroke: '#d8c8c0', 'stroke-width': 0.4 })),
    ...starfish(52, 59, 5),
    ...scallop(16, 88, 6, '#f2b8c6'), ...scallop(30, 88, 5, SHELL_PINK),
    path('M40 88 Q38 80 44 78 Q52 78 52 84 Q50 88 40 88 Z', '#e9d3a6', { stroke: '#b89a6a', 'stroke-width': 0.8 }),
    path('M43 82 Q46 80 49 82', 'none', { stroke: '#b89a6a', 'stroke-width': 0.7 }),
    ...branchCoral(10, 8, 0.9, '#ff8a5a'), ...branchCoral(54, 10, 0.8, '#f4789a'),
  ],
  // A long rock bench overgrown with sea grass, three sponge cushions, sea anemones and kelp behind it.
  sofa: () => [
    ...kelpFrond(16, 40, 62, '#4f8a42', { class: 'p-sway' }), ...kelpFrond(134, 40, 66, '#4f8a42', { class: 'p-sway p-sway-2' }),
    ...kelpFrond(54, 30, 50, '#5a9a4a', { class: 'p-sway p-sway-2' }), ...kelpFrond(98, 30, 54, '#5a9a4a', { class: 'p-sway' }),
    ...kelpFrond(24, 40, 44, '#6aaa52', { class: 'p-sway p-sway-2' }), ...kelpFrond(124, 40, 46, '#6aaa52', { class: 'p-sway' }),
    ...kelpFrond(76, 30, 40, '#4f8a42', { class: 'p-sway' }),
    path('M8 34 Q6 14 30 12 Q75 6 120 12 Q144 14 142 34 Z', '#6a96a2', { stroke: ROCK_DARK, 'stroke-width': 1.2 }),
    path('M20 18 Q75 10 130 18', 'none', { stroke: '#9cc2ca', 'stroke-width': 2, 'stroke-linecap': 'round' }),
    path('M2 64 Q0 44 8 34 H142 Q150 44 148 64 Z', ROCK, { stroke: ROCK_DARK, 'stroke-width': 1.2 }),
    path('M10 50 Q30 46 50 52 M90 54 Q110 48 136 52', 'none', { stroke: ROCK_DARK, 'stroke-width': 0.9 }),
    ...[[34, '#f2b33c'], [75, '#f28a5a'], [116, '#e86a9a']].flatMap(([cx, color]) => [
      path(`M${cx - 18} 36 Q${cx - 19} 26 ${cx - 10} 25 H${cx + 10} Q${cx + 19} 26 ${cx + 18} 36 Z`, color, { stroke: darker(color, 0.3), 'stroke-width': 0.9 }),
      ...[[-10, 30], [-4, 28.4], [3, 30.6], [9, 28.6], [13, 32], [-13, 33]].map(([dx, dy]) => circle(cx + dx, dy, 1.2, darker(color, 0.25)))]),
    ...anemone(4, 64, 1.2, '#ff9ac8'), ...anemone(146, 64, 1.1, '#7ae0b0'),
    ...starfish(60, 52, 5, '#f2864a'),
    path('M24 64 q-2 -6 0 -10 M28 64 q2 -6 0 -9 M120 64 q-2 -6 0 -10 M124 64 q2 -6 0 -9', 'none', { stroke: '#4f9a5a', 'stroke-width': 1.6, 'stroke-linecap': 'round' }),
  ],
  // A woven sea-grass mat with a sand dollar in the middle and shells around it.
  rug: () => [
    ellipse(100, 20, 98, 18, '#9ab07a'),
    ellipse(100, 20, 90, 16, '#c8c890', { stroke: '#8a9a62', 'stroke-width': 1, 'stroke-dasharray': '3 2' }),
    ellipse(100, 20, 74, 13, '#b4bc80', { stroke: '#8a9a62', 'stroke-width': 1, 'stroke-dasharray': '3 2' }),
    ellipse(100, 20, 58, 10, '#c8c890', { stroke: '#8a9a62', 'stroke-width': 1, 'stroke-dasharray': '3 2' }),
    ellipse(100, 20, 22, 8, '#efe2c4', { stroke: '#c8b48a', 'stroke-width': 1 }),
    ...[0, 72, 144, 216, 288].map(angle => ellipse(100 + Math.cos((angle - 90) * Math.PI / 180) * 9, 20 + Math.sin((angle - 90) * Math.PI / 180) * 3.6, 3.6, 1.4, 'none', {
      stroke: '#b8a07a', 'stroke-width': 1, transform: `rotate(${angle - 90} ${100 + Math.cos((angle - 90) * Math.PI / 180) * 9} ${20 + Math.sin((angle - 90) * Math.PI / 180) * 3.6})`,
    })),
    circle(100, 20, 1.6, '#b8a07a'),
    ...scallop(30, 24, 4, '#f2b8c6'), ...scallop(170, 24, 4, SHELL_PINK), ...starfish(56, 30, 3.4), ...starfish(146, 10, 3, '#f2c94c'),
  ],
  // Kelp tea: a clay pot on a rock over a warm vent (bubbles rise), shell cups, a kelp bundle.
  coffee: () => [
    ...rock(2, 92, 52, 34, '#6a8a94'),
    path('M20 62 Q18 56 22 54 H34 Q38 56 36 62 Z', '#3a4a50'),
    circle(23, 50, 1.6, '#e8fbff', { 'fill-opacity': 0.4, stroke: '#e8fbff', 'stroke-width': 0.6, class: 'cooler-bubble' }),
    circle(33, 48, 1.3, '#e8fbff', { 'fill-opacity': 0.4, stroke: '#e8fbff', 'stroke-width': 0.6, class: 'cooler-bubble cooler-bubble-2' }),
    path('M12 54 Q8 40 14 32 H42 Q48 40 44 54 Q28 58 12 54 Z', '#c87a4a', { stroke: '#8a4a2a', 'stroke-width': 1.2 }),
    path('M12 44 Q28 48 45 44', 'none', { stroke: '#e8a070', 'stroke-width': 1.6 }),
    path('M44 38 Q54 34 56 26', 'none', { stroke: '#8a4a2a', 'stroke-width': 3.2, 'stroke-linecap': 'round' }),
    path('M44 38 Q54 34 56 26', 'none', { stroke: '#c87a4a', 'stroke-width': 1.8, 'stroke-linecap': 'round' }),
    path('M12 40 Q4 40 6 34', 'none', { stroke: '#8a4a2a', 'stroke-width': 2.4, 'stroke-linecap': 'round' }),
    rect(12, 29, 32, 4, '#a85a32', { rx: 1.6, stroke: '#8a4a2a', 'stroke-width': 0.9 }),
    circle(28, 27.6, 2.4, '#f2c94c', { stroke: '#a87a1a', 'stroke-width': 0.6 }),
    ...kelpFrond(18, 30, 10, KELP), ...kelpFrond(30, 30, 12, '#6aaa52'),
    circle(52, 22, 2.4, '#e8fbff', { 'fill-opacity': 0.5, stroke: '#ffffff', 'stroke-width': 0.6, class: 'p-steam' }),
    circle(55, 15, 1.8, '#e8fbff', { 'fill-opacity': 0.5, stroke: '#ffffff', 'stroke-width': 0.6, class: 'p-steam' }),
    ...[[10, '#f6d2c4'], [44, '#f2b8c6']].flatMap(([cx, color]) => [path(`M${cx - 5} 72 Q${cx} 80 ${cx + 5} 72 Z`, color, { stroke: darker(color, 0.25), 'stroke-width': 0.8 }),
      path(`M${cx - 3} 73.6 L${cx} 78 M${cx + 3} 73.6 L${cx} 78`, 'none', { stroke: darker(color, 0.25), 'stroke-width': 0.6 })]),
  ],
  // A bubble column: a glass tube on a coral base, bubbles rising inside.
  cooler: () => [
    rect(8, 14, 20, 66, '#bfeaf2', { rx: 10, 'fill-opacity': 0.45, stroke: '#7ab8c8', 'stroke-width': 1.4 }),
    path('M12 20 V72', 'none', { stroke: '#ffffff', 'stroke-width': 2, 'stroke-opacity': 0.6, 'stroke-linecap': 'round' }),
    ...[[18, 70, 2.4, ''], [15, 58, 1.8, ' cooler-bubble-2'], [21, 46, 2.2, ''], [17, 34, 1.6, ' cooler-bubble-2'], [20, 24, 2, '']].map(([cx, cy, r, extra]) =>
      circle(cx, cy, r, '#ffffff', { 'fill-opacity': 0.35, stroke: '#ffffff', 'stroke-width': 0.8, class: `cooler-bubble${extra}` })),
    rect(6, 10, 24, 6, BRASS, { rx: 2, stroke: BRASS_DARK, 'stroke-width': 0.8 }),
    ...scallop(18, 10, 6, '#f4c4b8'),
    path('M2 92 Q0 82 6 78 H30 Q36 82 34 92 Z', '#e86a9a', { stroke: '#a83a62', 'stroke-width': 1 }),
    ...[[8, 84], [14, 88], [22, 84], [28, 88], [18, 81]].map(([cx, cy]) => circle(cx, cy, 1.4, '#a83a62')),
    rect(4, 76, 28, 4, BRASS, { rx: 1.4, stroke: BRASS_DARK, 'stroke-width': 0.8 }),
  ],
  // 0: a coral garden on a rock (the lounge corner); 1: tall kelp in a big shell (by the door).
  plant: variant => variant % 2 === 0
    ? [
      ...rock(2, 70, 40, 16, '#6a8a94'),
      ...branchCoral(14, 58, 1.3, '#ff8a5a'), ...branchCoral(30, 58, 1.1, '#f4789a'),
      path('M22 58 V54 M22 54 Q4 46 8 26 Q22 16 36 26 Q40 46 22 54 Z', '#a45ad0', { stroke: '#6a2a8a', 'stroke-width': 0.9, 'fill-opacity': 0.9 }),
      path('M22 54 L12 34 M22 54 L20 26 M22 54 L32 32 M16 44 L9 38 M27 42 L35 38', 'none', { stroke: '#6a2a8a', 'stroke-width': 0.8 }),
      ...anemone(36, 62, 0.8, '#ff9ac8'), ...anemone(8, 62, 0.7, '#7ae0b0'),
    ]
    : [
      ...kelpFrond(16, 52, 50, '#5a9a4a', { class: 'p-sway' }), ...kelpFrond(24, 52, 44, '#6aaa52', { class: 'p-sway p-sway-2' }), ...kelpFrond(10, 54, 34, '#4f8a42', { class: 'p-sway p-sway-2' }),
      ...kelpFrond(30, 54, 30, '#4f8a42', { class: 'p-sway' }),
      path('M4 54 Q2 70 22 70 Q42 70 40 54 Z', '#f4c4b8', { stroke: '#c8907a', 'stroke-width': 1.2 }),
      path('M8 56 Q12 66 14 68 M16 55 Q18 64 19 69 M28 55 Q26 64 25 69 M36 56 Q32 66 30 68', 'none', { stroke: '#c8907a', 'stroke-width': 0.8 }),
      rect(2, 51, 40, 5, '#f6d2c4', { rx: 2.4, stroke: '#c8907a', 'stroke-width': 1 }),
    ],
};

// ---------------------------------------------------------------------------
// Stations (viewBox 68 20 72 96, floor at y = 112)
// ---------------------------------------------------------------------------

const stations = {
  // A giant clam on a rock, open, a glowing pearl inside, bubbles rising.
  clamdesk: () => [
    ...rock(74, 112, 62, 20, '#6a8a94'),
    path('M80 92 Q74 70 90 60 Q105 52 120 58 Q138 66 132 90 Z', '#a8d0d0', { stroke: '#5a8a8e', 'stroke-width': 1.2 }),
    path('M86 90 Q84 72 96 64 M98 90 Q96 70 106 60 M112 90 Q114 70 118 60 M124 90 Q130 74 128 66', 'none', { stroke: '#5a8a8e', 'stroke-width': 1 }),
    path('M80 92 Q78 86 84 84 Q88 90 94 84 Q100 90 106 84 Q112 90 118 84 Q124 90 130 84 Q136 86 132 92 Z', '#7a5aa8', { stroke: '#4a3a7a', 'stroke-width': 1 }),
    circle(106, 85, 5.4, PEARL, { stroke: '#d8c8c0', 'stroke-width': 0.6 }), circle(104.4, 83.4, 1.6, '#ffffff'),
    circle(106, 85, 11, '#f0fbff', { 'fill-opacity': 0.35, class: 'p-glow' }),
    path('M76 92 Q80 104 106 106 Q132 104 136 92 Q130 96 124 92 Q118 98 112 92 Q106 98 100 92 Q94 98 88 92 Q82 96 76 92 Z', '#bfe0dc', { stroke: '#5a8a8e', 'stroke-width': 1.2 }),
    path('M88 94 Q90 100 94 104 M100 94 Q101 100 102 105 M112 94 Q111 100 110 105 M124 94 Q122 100 118 104', 'none', { stroke: '#7aa8ac', 'stroke-width': 0.9 }),
    ...[[100, 74, ''], [112, 68, ' p-bubble'], [106, 60, '']].map(([cx, cy, extra]) => circle(cx, cy, 1.8, '#ffffff', { 'fill-opacity': 0.3, stroke: '#ffffff', 'stroke-width': 0.7, class: `p-bubble${extra}` })),
    ...anemone(80, 112, 0.9, '#ff9ac8'), ...starfish(130, 106, 4.6),
  ],
  // A sunken treasure chest half buried in sand: the lid ajar, gold glowing, bubbles escaping, an anchor beside it.
  chest: () => [
    path('M72 112 Q76 100 96 98 Q118 96 132 102 Q140 106 140 112 Z', '#e7cf8d', { stroke: '#c8ae6c', 'stroke-width': 0.9 }),
    path('M118 112 V80 M110 86 H126 M110 104 Q118 112 126 104', 'none', { stroke: '#4a5560', 'stroke-width': 3, 'stroke-linecap': 'round' }),
    circle(118, 77.6, 2.6, 'none', { stroke: '#4a5560', 'stroke-width': 1.6 }),
    path('M80 104 V86 H112 V104 Q96 108 80 104 Z', '#6a6a4a', { stroke: '#3e3e2a', 'stroke-width': 1.2 }),
    path('M80 94 H112', 'none', { stroke: '#4e4e34', 'stroke-width': 0.9 }),
    path('M84 86 V104 M108 86 V104', 'none', { stroke: '#8a7a3a', 'stroke-width': 2.2 }),
    rect(93, 89, 6, 6.4, BRASS, { rx: 1, stroke: BRASS_DARK, 'stroke-width': 0.7 }),
    path('M80 86 Q82 72 96 70 Q110 72 112 86 L108 84 Q104 76 96 75.6 Q88 76 84 84 Z', '#5e5e40', { stroke: '#3e3e2a', 'stroke-width': 1.2, transform: 'rotate(-14 80 86)' }),
    path('M82 86 Q86 80 92 82 Q96 78 100 81 Q106 79 110 86 Z', GOLD, { stroke: '#b8860b', 'stroke-width': 0.8 }),
    ...[[88, 84], [94, 82.6], [100, 83], [106, 84.4]].map(([cx, cy]) => circle(cx, cy, 1.7, '#ffd75a', { stroke: '#b8860b', 'stroke-width': 0.5 })),
    circle(97, 80.6, 1.6, '#d9364a', { stroke: '#8a1a2a', 'stroke-width': 0.5 }),
    ...[[76, 108], [82, 110], [126, 109], [131, 110.6]].map(([cx, cy]) => ellipse(cx, cy, 2.2, 1.2, '#ffd75a', { stroke: '#b8860b', 'stroke-width': 0.4 })),
    circle(96, 82, 14, '#fff3a0', { 'fill-opacity': 0.25, class: 'p-glow' }),
    ...[[94, 72, ''], [100, 64, ' p-bubble'], [96, 56, '']].map(([cx, cy, extra]) => circle(cx, cy, 2, '#ffffff', { 'fill-opacity': 0.3, stroke: '#ffffff', 'stroke-width': 0.7, class: `p-bubble${extra}` })),
    path('M87 80 l0.8 1.6 l1.6 0.8 l-1.6 0.8 l-0.8 1.6 l-0.8 -1.6 l-1.6 -0.8 l1.6 -0.8 Z', '#fff3a0', { class: 'p-spark' }),
    ...kelpFrond(136, 112, 26, KELP), ...starfish(84, 108, 3.4, '#f2c94c'),
  ],
};

export default Object.freeze({
  archetypes: { merfolk, diver, fishfolk, octopus, turtle, crab },
  decor,
  stations,
});
