// The space world: the crew of an orbital station - astronauts in white suits, flight engineers in
// jumpsuits, a commander with a headset, scientists in lab coats, a helper robot and a friendly visitor
// from another world - and the station's furniture: a round airlock hatch, storage lockers, lounge seats,
// a drink dispenser, a water-pouch tank and hydroponic plants under grow lights.
// Original designs for this app: the feel of the genre, no real missions, patches, emblems or craft.
// Coordinates: figure-kit.js (characters), world-layout.js ART (furniture), viewBox 68 20 72 96 (stations).

import { circle, darker, ellipse, group, lighter, line, path, rect } from '../svg-kit.js';
import {
  BEARD, BUILDS, HAIR, arm, belt, blob, box, dot, headBase, leg, limb, longGarmentPath, nose, pick,
  pickWeighted, rngOf, shade, shape, stroke, torsoPath,
} from '../figure-kit.js';

const TOON_EYES = Object.freeze({ anchors: [[43, 41], [52, 41]], style: 'toon' });
const SUIT_SEAM = '#c3ccd6';
const STEEL = '#a7b0ba';
const STEEL_DARK = '#5b6675';
const PANEL_EDGE = '#7b8796';
const SCREEN = '#0f2740';
const CYAN = '#67e8f9';
const GOLD_FOIL = '#d9a93a';
const HAZARD = '#f2c230';
const LED_GREEN = '#4ade80';

const HUMAN_SKINS = ['#f6d7bd', '#efc8a6', '#e2b38c', '#d29f74', '#b9845a', '#8f5f3c', '#6e4630'];
const HAIR_COLORS = ['#2b1d14', '#3d2a1c', '#5a3a22', '#8a4b26', '#c9a05a', '#1f1a17', '#a0522d', '#e2c27a'];
const GRAY_HAIR = ['#9ca3af', '#d1d5db', '#6b7280', '#e5e7eb'];

const round = value => Math.round(value * 100) / 100;

/** A band across a limb (a stripe or a cuff) at t (0..1) of the segment from a to b, length along it, width across. */
function band([x1, y1], [x2, y2], t, length, width, fill) {
  const span = Math.hypot(x2 - x1, y2 - y1);
  const [ux, uy] = [(x2 - x1) / span, (y2 - y1) / span];
  const [nx, ny] = [-uy, ux];
  const [cx, cy] = [x1 + (x2 - x1) * t, y1 + (y2 - y1) * t];
  const corner = (along, across) => `${round(cx + ux * along + nx * across)} ${round(cy + uy * along + ny * across)}`;
  const [a, w] = [length / 2, width / 2];
  return shape(`M${corner(-a, w)} L${corner(a, w)} L${corner(a, -w)} L${corner(-a, -w)} Z`, fill);
}

const ARM_LINE = {
  back: { shoulder: [37, 62], elbow: [35.5, 72], wrist: [34.3, 80.5], hand: [34, 83] },
  front: { shoulder: [55, 62], elbow: [56.5, 72], wrist: [57.7, 80.5], hand: [58, 83] },
};
const LEG_LINE = {
  back: { hip: [41, 88], knee: [40.6, 99], ankle: [40.2, 107.5] },
  front: { hip: [51, 88], knee: [51.6, 99], ankle: [52.2, 107.5] },
};

/** A puffy spacesuit sleeve with a stripe in the category color, a metal wrist ring and a glove. */
function suitArm(side, suit, glove) {
  const { shoulder, wrist, hand } = ARM_LINE[side];
  return [limb(...shoulder, ...wrist, 7.8, suit), band(shoulder, wrist, 0.34, 3.2, 9, 'cat'),
    band(shoulder, wrist, 0.92, 2.4, 8.6, STEEL), dot(...hand, 4, glove)];
}

/** A spacesuit leg with a knee band in the category color and a chunky boot. */
function suitLeg(side, suit, boots) {
  const { hip, ankle } = LEG_LINE[side];
  return [leg(side, { trousers: suit, feet: 'boot', shoes: boots, width: 8.6 }), band(hip, ankle, 0.5, 3, 9.8, 'cat')];
}

// ---------------------------------------------------------------------------
// Helmets, headsets and caps (head.hat; a holiday hat replaces them)
// ---------------------------------------------------------------------------

/** A clear bubble helmet with its gold sun visor raised, a lamp on the side. */
const bubbleHelmet = () => [
  circle(46, 40, 20.4, 'none', { stroke: '#7b8796', 'stroke-width': 3.6 }),
  circle(46, 40, 20.4, '#dbeafe', { 'fill-opacity': 0.14, stroke: '#eef2f6', 'stroke-width': 2 }),
  shape('M25.8 46 Q24 22.4 46 19.4 Q62.6 20.4 65.8 31.4 Q58.4 26.6 46 26.6 Q34.6 27 31 35.4 Q29.8 40.4 30.8 47 Z', '#f1f4f8'),
  shape('M31 35.4 Q34.6 27.2 46 26.8 Q58.4 26.8 65.8 31.4 L65.4 35 Q58 30.8 46 30.8 Q36.4 31 33.6 37.6 Z', GOLD_FOIL),
  stroke('M35.4 30 Q46 27.4 57.6 29', '#fbe3a1', 1),
  stroke('M29 30 Q34 22.4 44 21', '#ffffff', 1.4),
  path('M58.4 50.6 Q61.4 47.4 62.4 43', 'none', { stroke: '#ffffff', 'stroke-opacity': 0.6, 'stroke-width': 1.2, 'stroke-linecap': 'round' }),
  box(23.2, 37, 4.6, 7, '#cfd6df', { rx: 1.2 }), circle(23.2, 40.5, 1.5, '#fef3c7'),
];

/** A comm cap: white top, dark side panels over the ears, a thin microphone. */
const commCap = () => [
  shape('M30.4 43 Q29.4 24.4 46 23.8 Q62.6 24.4 61.6 40 Q58 31.4 46 31 Q35.4 31.4 34 43 Z', '#f3f0e8'),
  shape('M30.4 43 Q29.8 32 34.6 27.6 L37.4 30.6 Q34.2 35 34 43 Z', '#6b5442'),
  blob(32.4, 43.4, 3.8, 4.8, '#3f3a36'),
  stroke('M33.2 47.6 Q36 52.4 42.4 52', '#3f3a36', 1.1), dot(43, 51.9, 1.4, '#3f3a36'),
];

/** A headset over the head: a band, one ear cup and a microphone boom. */
const headset = color => [
  stroke('M31.6 40 Q30.6 23.4 46 23 Q61 23.4 60.6 37', color, 2.2),
  blob(31.8, 42.4, 3.7, 4.8, color), dot(31.8, 42.4, 1.6, '#64748b', { 'stroke-width': 0.5 }),
  stroke('M33 47 Q35.6 52.6 43.6 51.8', color, 1.2), dot(44.2, 51.6, 1.6, '#111827'),
];

// ---------------------------------------------------------------------------
// Things held in the back hand (at about (34,83); they swing with the arm)
// ---------------------------------------------------------------------------

const HELD = {
  helmet: () => [circle(30.6, 85, 9.6, '#eef1f5', { stroke: '#7b8796', 'stroke-width': 1.1 }),
    shape('M27.4 79.6 Q32 76.4 38.4 79.4 Q40.6 85 38.4 90.4 Q32 93.4 27.4 90.2 Q25.4 85 27.4 79.6 Z', GOLD_FOIL),
    stroke('M29.6 80.4 Q33 78.8 36.4 80.4', '#fbe3a1', 1), blob(30.6, 95, 7.6, 1.8, STEEL)],
  tablet: () => [box(24.4, 74.4, 11.8, 16, '#1f2937', { rx: 1.8 }), rect(25.8, 76, 9, 12.4, '#38bdf8', { rx: 0.8, class: 'p-glow' }),
    ellipse(30.3, 82, 3.4, 1.6, 'none', { stroke: '#e0f2fe', 'stroke-width': 0.6 }), circle(30.3, 82, 1, '#e0f2fe'),
    path('M27 78 H31 M27 86.4 H33.4', 'none', { stroke: '#e0f2fe', 'stroke-width': 0.7 })],
  wrench: () => [limb(34, 98, 34, 70, 2.6, STEEL),
    shape('M29.4 62.6 Q28.6 70.4 34 71.8 Q39.4 70.4 38.6 62.6 L36.2 62.6 L36 66.6 Q34 68.2 32 66.6 L31.8 62.6 Z', STEEL),
    stroke('M34 75 V95', '#d7dde4', 0.7)],
  drill: () => [box(31.8, 80, 4.8, 10, '#1f2937', { rx: 1 }),
    shape('M26 73 H42.4 Q44.4 73 44.4 75.6 V77.4 Q44.4 80 42.4 80 H26 Q24.6 80 24.6 78 V75 Q24.6 73 26 73 Z', '#f59e0b'),
    stroke('M44.4 76.5 H50', '#9ca3af', 1.4), box(30.8, 88.4, 6.8, 3.4, '#f59e0b', { rx: 0.8 }), stroke('M27.4 75.4 H33', '#b45309', 0.8)],
  cable: () => [circle(31, 86, 7, 'none', { stroke: '#f97316', 'stroke-width': 3.2 }), circle(31, 86, 7, 'none', { stroke: '#c2410c', 'stroke-width': 0.6 }),
    circle(31, 86, 3.4, '#9ca3af', { stroke: STEEL_DARK, 'stroke-width': 0.8 }), stroke('M37.4 89 Q40 95 37 100', '#f97316', 1.6), box(35.4, 99.6, 3.4, 3, STEEL, { rx: 0.6 })],
  canister: color => [box(27.6, 79, 11.6, 15.6, '#e2e8f0', { rx: 2.2 }), rect(29.6, 82, 7.6, 9.6, color, { rx: 1.2, class: 'p-glow' }),
    circle(31.6, 89, 0.9, '#ffffff', { 'fill-opacity': 0.8 }), circle(34.4, 85.6, 0.7, '#ffffff', { 'fill-opacity': 0.8 }),
    box(27, 77.4, 12.8, 3, STEEL_DARK, { rx: 1 }), box(27, 93.4, 12.8, 2.6, STEEL_DARK, { rx: 1 })],
  seedling: () => [shape('M27 86 H40 L38.6 94 H28.4 Z', '#e2e8f0'), ellipse(33.5, 86, 6.5, 1.6, '#7c5a3a'),
    stroke('M33.5 86 V78', '#3f8f3a', 1.2), shape('M33.5 80 Q29 76 27.6 78.6 Q30 81.6 33.5 80 Z', '#58b14c'), shape('M33.5 79 Q38 74.4 39.6 77.4 Q37 80.6 33.5 79 Z', '#6cc35d')],
  camera: () => [box(25.4, 78.6, 13.6, 9.6, '#374151', { rx: 1.8 }), circle(32.4, 83.4, 3.4, '#94a3b8', { stroke: '#1f2937', 'stroke-width': 0.9 }),
    circle(32.4, 83.4, 1.6, '#1e293b'), circle(33, 82.8, 0.6, '#ffffff'), box(26.4, 76.6, 4.4, 2.4, '#4b5563', { rx: 0.6 }), rect(35.4, 79.6, 2.4, 1.6, '#fef08a')],
  orb: color => [circle(33.4, 87, 7, color, { 'fill-opacity': 0.25, class: 'p-glow' }), circle(33.4, 87, 4.4, color, { stroke: darker(color, 0.35), 'stroke-width': 0.8 }),
    circle(32, 85.6, 1.4, '#ffffff', { 'fill-opacity': 0.85 })],
};

// ---------------------------------------------------------------------------
// Archetypes (looks: figure-kit.js composeFigure)
// ---------------------------------------------------------------------------

/** Astronauts: a white spacesuit with stripes and a mission patch in the category color, a life-support pack, a bubble helmet with the visor up (or under the arm, or a comm cap). */
function astronaut(look) {
  const random = rngOf(look);
  const skin = pick(HUMAN_SKINS, random);
  const hairColor = pick(HAIR_COLORS, random);
  const suit = pick(['#f3f5f8', '#eef0f3', '#f4f1ea', '#e9eef4'], random);
  const helmet = pickWeighted([['on', 46], ['held', 30], ['cap', 24]], random);
  const hair = pick([HAIR.shortCrop, HAIR.curlyMop, HAIR.topKnot, HAIR.braids, HAIR.shortCrop, HAIR.longStraight], random)(hairColor);
  const glove = pick(['#dfe4ea', '#cfd6df', '#e8e4da'], random);
  const pack = darker(suit, 0.07);
  return {
    shadowWidth: 20,
    behind: [box(24.4, 55, 14.6, 33, pack, { rx: 3.4 }), stroke('M27.6 62 V81 M31 62 V81', SUIT_SEAM, 0.9),
      box(26, 51.4, 10.6, 5, STEEL, { rx: 1.6 }), circle(28.4, 85, 1.2, '#f87171', { class: 'p-glow' })],
    legBack: suitLeg('back', suit, glove),
    legFront: suitLeg('front', suit, glove),
    armBack: suitArm('back', suit, glove),
    armFront: suitArm('front', suit, glove),
    torso: [
      shape(torsoPath('broad', { bottom: 94 }), suit),
      shade('M50 56 Q58 56 61 64 Q62 80 60.6 93 Q55 95 50 95 Z', '#64748b', 0.12),
      shape('M31.2 79 Q46 82 60.8 79 L60.8 84.4 Q46 87.4 31.2 84.4 Z', 'cat'),
      stroke('M36 60 Q38.6 70 36.8 78 M56 60 Q53.4 70 55.2 78', SUIT_SEAM, 0.9),
      box(41.8, 63.6, 13, 10.4, '#dde3ea', { rx: 1.8 }),
      dot(44.8, 66.8, 1.1, '#ef4444'), dot(48.3, 66.8, 1.1, LED_GREEN), dot(51.8, 66.8, 1.1, '#3b82f6'),
      rect(43.6, 69.6, 9.4, 2.4, SCREEN, { rx: 0.6 }),
      dot(36.4, 66.4, 3.8, 'cat'),
      stroke('M33.6 67.2 Q36.4 63.6 39.2 67.2', '#ffffff', 0.9), dot(36.4, 66.6, 0.9, '#ffffff', { stroke: 'none' }),
      stroke('M30 72 Q35 79 41.8 71', STEEL_DARK, 1.2),
    ],
    overTorso: [blob(46, 56.2, 11.6, 3.4, STEEL), blob(46, 55.6, 8.6, 1.9, '#8b97a8', { 'stroke-width': 0.6 })],
    held: helmet === 'held' ? HELD.helmet() : null,
    headScale: 1,
    head: {
      back: helmet === 'cap' ? null : hair.back,
      base: headBase(skin),
      features: nose(skin),
      eyes: TOON_EYES,
      brows: darker(hairColor, 0.1),
      mouth: { anchor: [47.5, 47.6] },
      front: helmet === 'cap' ? null : hair.front,
      hat: helmet === 'on' ? bubbleHelmet() : helmet === 'cap' ? commCap() : null,
      cheeks: random() < 0.4 ? '#f0a08a' : null,
    },
  };
}

/** Flight engineers: a jumpsuit in the category color, a tool belt with pouches, a wrench, a drill or a cable reel, a beanie, a headlamp or goggles. */
function engineer(look) {
  const random = rngOf(look);
  const skin = pick(HUMAN_SKINS, random);
  const hairColor = pick(HAIR_COLORS, random);
  const build = pick(['regular', 'round', 'slim', 'broad'], random);
  const headgear = pickWeighted([['beanie', 28], ['headlamp', 26], ['goggles', 22], [null, 24]], random);
  const held = pickWeighted([['wrench', 46], ['drill', 30], ['cable', 24]], random);
  const hair = pick([HAIR.shortCrop, HAIR.shaggy, HAIR.curlyMop, HAIR.topKnot, HAIR.braids], random)(hairColor);
  const knit = pick(['#f97316', '#334155', '#b91c1c', '#facc15', '#0f766e'], random);
  const gloved = random() < 0.5;
  const sleeves = gloved ? { sleeve: 'cat', hand: '#4b5563', cuff: 'cat-dark' } : { style: 'rolled', sleeve: 'cat', hand: skin };
  const legs = { trousers: 'cat', feet: 'boot', shoes: '#3f3f46', width: 7.4, cuff: 'cat-dark' };
  const { x, width } = BUILDS[build];
  const right = x + width;
  return {
    shadowWidth: 18,
    legBack: [leg('back', legs), band(LEG_LINE.back.hip, LEG_LINE.back.ankle, 0.55, 4, 8.4, 'cat-dark')],
    legFront: [leg('front', legs), band(LEG_LINE.front.hip, LEG_LINE.front.ankle, 0.55, 4, 8.4, 'cat-dark')],
    armBack: arm('back', sleeves),
    armFront: arm('front', sleeves),
    torso: [
      shape(torsoPath(build, { bottom: 93 }), 'cat'),
      shade(`M50 56 Q${right - 3} 55 ${right} 65 Q${right + 1} 80 ${right - 1} 92 Q55 94 50 94 Z`, '#000000', 0.1),
      shape('M38.4 55.2 L46 61.4 L53.6 55.2 L52.4 59.8 L46 64.4 L39.6 59.8 Z', 'cat-dark'),
      stroke('M46 63 V92', 'cat-dark', 1),
      box(48.6, 64.6, 7, 6.6, 'cat-dark', { rx: 1 }), stroke('M48.6 66.8 H55.6', 'cat', 0.8),
      box(37.6, 64.6, 7.6, 2.8, '#f1f5f9', { rx: 0.6 }),
      belt(build, 82.6, '#6b4f33', '#cbd5e1'),
      stroke(`M${x + 4.6} 85 L${x + 3.4} 77.6`, '#f97316', 1.8), stroke(`M${x + 3.4} 77.6 l-0.3 -2.6`, STEEL, 0.9),
      box(x + 0.6, 85.2, 7.4, 8, '#8a6a44', { rx: 1.2 }), stroke(`M${x + 0.6} 87.6 H${x + 8}`, '#6b4f33', 0.8),
      box(right - 8.6, 85.2, 7.4, 8, '#8a6a44', { rx: 1.2 }), stroke(`M${right - 8.6} 87.6 H${right - 1.2}`, '#6b4f33', 0.8),
    ],
    held: HELD[held](),
    headScale: 1,
    head: {
      back: headgear === 'beanie' ? null : hair.back,
      base: headBase(skin),
      features: nose(skin),
      eyes: TOON_EYES,
      brows: darker(hairColor, 0.1),
      beforeMouth: random() < 0.3 ? BEARD.stubble(hairColor) : null,
      mouth: { anchor: [47.5, 47.6] },
      front: headgear === 'beanie' ? null : hair.front,
      hat: headgear === 'beanie'
        ? [shape('M30.4 38.6 Q29.8 22.4 46 22.2 Q62.2 22.4 61.6 37.4 Z', knit), stroke('M38 26 V36 M46 23.6 V36 M54 25.4 V35.6', darker(knit, 0.2), 0.8),
          box(29.6, 34.2, 32.6, 5.2, darker(knit, 0.15), { rx: 2.4 }), dot(46, 21.6, 3, lighter(knit, 0.45))]
        : headgear === 'headlamp'
          ? [stroke('M31 36 Q46 28.6 61 34.2', '#1f2937', 2.2), box(54.8, 29.4, 7.6, 5.8, '#e5e7eb', { rx: 1.4 }), dot(61.8, 32.3, 1.7, '#fde68a', { class: 'p-glow' })]
          : headgear === 'goggles'
            ? [stroke('M31 33.6 Q46 26.4 61 32', '#374151', 2), dot(41.6, 30.6, 3.8, '#7dd3fc', { stroke: '#374151', 'stroke-width': 1.4 }),
              dot(51.2, 29.8, 3.8, '#7dd3fc', { stroke: '#374151', 'stroke-width': 1.4 }), path('M40 29.4 l2 -1.6 M49.6 28.6 l2 -1.6', 'none', { stroke: '#ffffff', 'stroke-width': 0.9 })]
            : null,
    },
  };
}

/** Commanders: a flight jacket in the category color with rank bars, a headset with a microphone, a tablet. */
function commander(look) {
  const random = rngOf(look);
  const skin = pick(HUMAN_SKINS, random);
  const graying = random() < 0.45;
  const hairColor = graying ? pick(GRAY_HAIR, random) : pick(HAIR_COLORS, random);
  const hairStyle = pick(['shortCrop', 'shortCrop', 'topKnot', 'bald', 'braids'], random);
  const hair = HAIR[hairStyle](hairColor);
  const trousers = pick(['#2b3445', '#3a3f4a', '#4b5563', '#1f2937', '#4a4537'], random);
  const facial = hairStyle !== 'braids' && random() < 0.4 ? pick(['short', 'mustache', 'stubble'], random) : null;
  const held = pickWeighted([['tablet', 70], [null, 30]], random);
  const legs = { trousers, feet: 'boot', shoes: '#111827', width: 7 };
  const sleeves = { sleeve: 'cat', hand: skin, cuff: 'cat-dark' };
  return {
    shadowWidth: 18,
    legBack: leg('back', legs),
    legFront: leg('front', legs),
    armBack: [arm('back', sleeves), band(ARM_LINE.back.shoulder, ARM_LINE.back.wrist, 0.12, 2.6, 7.4, 'cat-dark')],
    armFront: [arm('front', sleeves), band(ARM_LINE.front.shoulder, ARM_LINE.front.wrist, 0.12, 2.6, 7.4, 'cat-dark')],
    torso: [
      shape(torsoPath('regular', { bottom: 93 }), 'cat'),
      shade('M50 56 Q55 55 58 65 Q59 80 57 92 Q54 94 50 94 Z', '#000000', 0.1),
      shape('M40.6 55.4 L46 64.6 L51.4 55.4 Q46 53.6 40.6 55.4 Z', '#1f2a44'),
      shape('M39.4 54.8 L46 64.8 L43 66.6 L37 56.6 Z', 'cat-dark'), shape('M52.6 54.8 L46 64.8 L49 66.6 L55 56.6 Z', 'cat-dark'),
      stroke('M46 65 V92', 'cat-dark', 1.1),
      box(48.4, 67.6, 6.6, 1.5, '#e8c766', { rx: 0.4 }), box(48.4, 70.2, 6.6, 1.5, '#e8c766', { rx: 0.4 }),
      box(36, 67, 6.6, 4.6, '#e5e7eb', { rx: 1 }), stroke('M37 69.3 H41.6', '#64748b', 0.8),
      belt('regular', 86, '#1f2937', '#cbd5e1'),
      shape('M34.6 57.4 Q37.4 54.6 42 54.6 L42.4 58.4 Q38 58.6 35.2 60.6 Z', 'cat-dark'), stroke('M36.4 57.6 Q38.6 56.4 41.2 56.4', '#e8c766', 1),
    ],
    front: [shape('M57.4 57.4 Q54.6 54.6 50 54.6 L49.6 58.4 Q54 58.6 56.8 60.6 Z', 'cat-dark'), stroke('M55.6 57.6 Q53.4 56.4 50.8 56.4', '#e8c766', 1)],
    held: held ? HELD[held]() : null,
    headScale: 1,
    head: {
      back: hair.back,
      base: headBase(skin),
      features: nose(skin, 1.1),
      eyes: TOON_EYES,
      brows: darker(hairColor, 0.2),
      beforeMouth: facial && facial !== 'mustache' ? BEARD[facial](hairColor) : null,
      mouth: { anchor: [47.5, 47.8] },
      front: [hair.front, facial === 'mustache' ? BEARD.mustache(hairColor) : null],
      hat: headset(pick(['#374151', '#1f2937', '#475569'], random)),
    },
  };
}

/** Scientists: a white lab coat open over a jumpsuit in the category color, glasses, a glowing sample canister or a seedling. */
function scientist(look) {
  const random = rngOf(look);
  const skin = pick(HUMAN_SKINS, random);
  const hairColor = random() < 0.2 ? pick(GRAY_HAIR, random) : pick(HAIR_COLORS, random);
  const hair = pick([HAIR.longWavy, HAIR.topKnot, HAIR.curlyMop, HAIR.shortCrop, HAIR.braids, HAIR.longStraight], random)(hairColor);
  const coat = pick(['#f8fafc', '#f1f5f9', '#f5f3ee'], random);
  const glasses = pickWeighted([['round', 45], ['safety', 20], [null, 35]], random);
  const held = pickWeighted([['canister', 60], ['seedling', 40]], random);
  const sample = pick(['#4ade80', '#22d3ee', '#e879f9', '#facc15'], random);
  const legs = { trousers: 'cat', feet: 'shoe', shoes: '#475569', width: 6.8 };
  const sleeves = { sleeve: coat, hand: skin, cuff: 'cat' };
  return {
    shadowWidth: 17,
    legBack: leg('back', legs),
    legFront: leg('front', legs),
    armBack: arm('back', sleeves),
    armFront: arm('front', sleeves),
    torso: [
      shape(longGarmentPath('regular', { hem: 101, flare: 4 }), coat),
      shade('M51 56 Q56 56 58 65 L62 101 Q57 102.4 52 102 Z', '#94a3b8', 0.18),
      shape('M41.4 55.4 L46 61 L50.6 55.4 L49.6 92 Q46 93 42.4 92 Z', 'cat'),
      stroke('M46 62 V92', 'cat-dark', 0.9),
      shape('M40.2 55 L46 62.4 L42.6 70 L38.4 57.4 Z', coat), shape('M51.8 55 L46 62.4 L49.4 70 L53.6 57.4 Z', coat),
      stroke('M42.4 70 L42.6 101 M49.6 70 L49.4 101', '#cbd5e1', 0.9),
      box(51, 66, 6, 5.6, coat, { rx: 0.8 }), stroke('M52.6 66 V62.6 M54.8 66 V63.4', '#2563eb', 1.1),
      box(34.6, 86, 7, 6, coat, { rx: 0.8 }), box(50.6, 86, 7, 6, coat, { rx: 0.8 }),
      box(36.4, 64.4, 4.6, 6, '#e2e8f0', { rx: 0.6 }), rect(37.2, 65.2, 3, 2, '#64748b'),
    ],
    held: held === 'canister' ? HELD.canister(sample) : HELD.seedling(),
    headScale: 1,
    head: {
      back: hair.back,
      base: headBase(skin),
      features: nose(skin),
      eyes: TOON_EYES,
      brows: darker(hairColor, 0.15),
      mouth: { anchor: [47.5, 47.6] },
      front: hair.front,
      eyewear: glasses === 'round'
        ? [circle(43, 41, 3.6, '#e0f2fe', { 'fill-opacity': 0.25, stroke: '#1f2937', 'stroke-width': 1 }), circle(52.4, 41, 3.6, '#e0f2fe', { 'fill-opacity': 0.25, stroke: '#1f2937', 'stroke-width': 1 }),
          path('M46.6 40.6 Q47.7 39.6 48.8 40.6 M39.4 40.4 L33 39', 'none', { stroke: '#1f2937', 'stroke-width': 0.9 })]
        : glasses === 'safety'
          ? [path('M38 37.4 H57.6 Q58.6 44.6 52.6 45 Q47.7 45 47.7 42 Q47.7 45 42.8 45 Q37 44.6 38 37.4 Z', '#bae6fd', { 'fill-opacity': 0.4, stroke: '#0e7490', 'stroke-width': 1 }),
            stroke('M38 38.6 L32.4 38.2', '#0e7490', 1.1)]
          : null,
    },
  };
}

/** Helper robots: a rounded shell with a chest panel in the category color, a face screen with LED eyes, an antenna. */
function helperRobot(look) {
  const random = rngOf(look);
  const shell = pick(['#e8edf2', '#dfe6ee', '#f1e9dc', '#cfd8e3', '#f4f4f5'], random);
  const joint = pick(['#64748b', '#475569', '#7c8794'], random);
  const headShape = pick(['dome', 'box', 'visor'], random);
  const antennas = pick([1, 2, 1, 0], random);
  const beacon = pick(['#f87171', '#fbbf24', '#4ade80', '#60a5fa'], random);
  const roboLeg = (hip, knee, ankle, footX) => [limb(...hip, ...knee, 4.6, joint), dot(...knee, 2.6, shell), limb(...knee, ...ankle, 4.2, joint),
    shape(`M${footX - 6} 112 Q${footX - 6} 105.2 ${footX} 105.2 Q${footX + 6.4} 105.2 ${footX + 6.4} 112 Z`, shell)];
  const roboArm = side => {
    const { shoulder, elbow, wrist, hand } = ARM_LINE[side];
    return [limb(...shoulder, ...elbow, 4, joint), dot(...elbow, 2.4, shell), limb(...elbow, ...wrist, 3.6, joint),
      dot(...hand, 3.2, '#94a3b8'), stroke(`M${hand[0] - 2} ${hand[1] + 2} l-1 2.6 M${hand[0] + 2} ${hand[1] + 2} l1 2.6`, '#475569', 1.2)];
  };
  const head = headShape === 'dome'
    ? [shape('M30.6 52 V39 A15.4 15.4 0 0 1 61.4 39 V52 Q61.4 55.6 57.8 55.6 H34.2 Q30.6 55.6 30.6 52 Z', shell), box(34.6, 33.2, 22.8, 17, '#0f172a', { rx: 5 })]
    : headShape === 'box'
      ? [box(30, 25.6, 32, 29.6, shell, { rx: 6 }), box(34, 31.6, 24, 18.4, '#0f172a', { rx: 3.6 }), stroke('M30.4 30 H61.6', darker(shell, 0.12), 0.8)]
      : [shape('M31 50 Q29.6 26 46 25.4 Q62.4 26 61 50 Q61 55.6 55 55.6 H37 Q31 55.6 31 50 Z', shell), shape('M32.6 35 Q46 31.4 59.8 35 V46 Q46 49.6 32.6 46 Z', '#0f172a')];
  return {
    shadowWidth: 18,
    legBack: roboLeg([41, 88], [40.6, 99], [40.2, 105.6], 41.6),
    legFront: roboLeg([51, 88], [51.6, 99], [52.2, 105.6], 54),
    armBack: roboArm('back'),
    armFront: roboArm('front'),
    torso: [
      shape('M33 59 Q33 54.4 37.6 54.4 H54.4 Q59 54.4 59 59 V86 Q59 92.6 52.6 92.6 H39.4 Q33 92.6 33 86 Z', shell),
      shade('M51 54.4 H54.4 Q59 54.4 59 59 V86 Q59 92.6 52.6 92.6 H51 Z', '#475569', 0.14),
      box(37.4, 60.4, 17.2, 14.4, 'cat', { rx: 2.6 }),
      rect(40, 63, 12, 3, '#ffffff', { 'fill-opacity': 0.35, rx: 1 }),
      circle(41.4, 70.6, 1.2, '#fde047', { class: 'p-antenna' }), circle(45.4, 70.6, 1.2, LED_GREEN), circle(49.4, 70.6, 1.2, '#f87171'),
      stroke('M38.6 80 H53.4 M38.6 83.4 H53.4 M38.6 86.8 H53.4', darker(shell, 0.22), 1),
      dot(36.4, 61, 2.2, joint), dot(55.6, 61, 2.2, joint),
    ],
    headScale: 1,
    head: {
      back: [antennas >= 1 && [stroke('M46 26 V16.6', joint, 1.3), dot(46, 15.6, 2.2, beacon, { class: 'p-antenna' })],
        antennas === 2 && [stroke('M54 28 L59 19', joint, 1.1), dot(59.4, 18.4, 1.6, '#e2e8f0')]],
      base: [head, dot(30.2, 42, 3.6, 'cat'), dot(30.2, 42, 1.4, '#e2e8f0', { 'stroke-width': 0.5 })],
      eyes: { anchors: [[42.6, 40.6], [51.6, 40.6]], style: 'led' },
      brows: null,
      mouth: { anchor: [47.2, 45.4], color: '#22d3ee', width: 0.7 },
    },
  };
}

/** Friendly visitors from another world: colored skin, a big head with big eyes, antennae, fins or a crest, a tunic in the category color, a camera or a glowing orb. */
function alienVisitor(look) {
  const random = rngOf(look);
  const skin = pick(['#8bd17c', '#7cc6c1', '#b59ae6', '#f0a6c8', '#a5d86b', '#79b8f2', '#f2b66b'], random);
  const deep = darker(skin, 0.25);
  const feature = pick(['stalks', 'fins', 'crest'], random);
  const glow = pick(['#fde047', '#f0abfc', '#67e8f9', '#bef264'], random);
  const held = pickWeighted([['camera', 40], ['orb', 35], [null, 25]], random);
  const collar = pick(['#e2e8f0', '#fcd34d', '#c7d2fe'], random);
  const legs = { trousers: skin, feet: 'boot', shoes: '#cbd5e1', width: 5.6 };
  const sleeves = { style: 'bare', sleeve: skin, hand: skin, width: 5.6 };
  const featureParts = feature === 'stalks'
    ? [stroke('M40 26 Q36 17 31.6 12.4', deep, 1.8), dot(31.2, 11.6, 2.8, glow, { class: 'p-antenna' }),
      stroke('M52 25.4 Q56.4 15.6 61 12', deep, 1.8), dot(61.4, 11.4, 2.8, glow)]
    : feature === 'fins'
      ? [shape('M32 46 Q22 44 19 33 Q25 35 27 31 Q29 37 33 38 Z', deep), shape('M58.6 34 Q64 27 70 27 Q67 32 69 36 Q64 36 60 40 Z', deep)]
      : [shape('M34 30 Q33 18 40 14 Q41 20 44 21 Q46 13 52 11 Q51 18 55 21 Q60 18 63 20 Q58 24 58.6 30 Z', deep)];
  return {
    shadowWidth: 16,
    legBack: leg('back', legs),
    legFront: leg('front', legs),
    armBack: arm('back', sleeves),
    armFront: arm('front', sleeves),
    torso: [
      shape(longGarmentPath('slim', { hem: 98, flare: 5 }), 'cat'),
      shade('M50 57 Q54 57 55.6 66 L60.6 98 Q56 99 52 99 Z', '#000000', 0.12),
      stroke('M32.6 95 L35.6 91.6 L38.6 95 L41.6 91.6 L44.6 95 L47.6 91.6 L50.6 95 L53.6 91.6 L56.6 95 L59.6 91.6', 'cat-light', 1.2),
      stroke('M36.6 76 H55.4', 'cat-light', 1.4),
      dot(46, 70, 2.4, glow),
    ],
    overTorso: shape('M35.6 56 Q46 52 56.4 56 L55 61.4 Q46 64.6 37 61.4 Z', collar),
    held: held === 'camera' ? HELD.camera() : held === 'orb' ? HELD.orb(glow) : null,
    headScale: 1.1,
    head: {
      back: feature === 'crest' ? featureParts : feature === 'stalks' ? featureParts : null,
      base: [shape('M46 22.6 Q63.4 22.6 62.2 40 Q61.2 54.6 46 55.6 Q30.8 54.6 29.8 40 Q28.6 22.6 46 22.6 Z', skin), feature === 'fins' ? featureParts : null],
      features: [dot(36, 47, 1.2, deep, { stroke: 'none' }), dot(38.4, 49.4, 0.9, deep, { stroke: 'none' }), dot(57.6, 47.4, 1.1, deep, { stroke: 'none' })],
      eyes: { anchors: [[41.6, 40.4], [52.6, 40.4]], style: 'big' },
      brows: null,
      mouth: { anchor: [47.2, 48.4] },
      cheeks: lighter(pick(['#f472b6', '#fb923c', '#a78bfa'], random), 0.2),
    },
  };
}

// ---------------------------------------------------------------------------
// Furniture (world-layout.js ART sizes)
// ---------------------------------------------------------------------------

/** Diagonal yellow-black safety stripes in a box (x, y, width, height). */
function hazardBand(x, y, width, height, step = 6) {
  const stripes = [];
  for (let left = x; left + step / 2 <= x + width; left += step) {
    const end = Math.min(left + step / 2, x + width);
    stripes.push(`M${round(left)} ${y + height} L${round(end)} ${y + height} L${round(Math.min(end + height * 0.6, x + width))} ${y} L${round(Math.min(left + height * 0.6, x + width))} ${y} Z`);
  }
  return [rect(x, y, width, height, '#2b2f36'), path(stripes.join(' '), HAZARD)];
}

const leafCluster = (cx, cy, scale, color) => [
  ellipse(cx - 4 * scale, cy, 5 * scale, 3 * scale, color, { transform: `rotate(-28 ${cx - 4 * scale} ${cy})`, stroke: darker(color, 0.3), 'stroke-width': 0.6 }),
  ellipse(cx + 4 * scale, cy, 5 * scale, 3 * scale, color, { transform: `rotate(28 ${cx + 4 * scale} ${cy})`, stroke: darker(color, 0.3), 'stroke-width': 0.6 }),
  ellipse(cx, cy - 3 * scale, 3.4 * scale, 5 * scale, lighter(color, 0.15), { stroke: darker(color, 0.3), 'stroke-width': 0.6 }),
];

const decor = {
  // A round airlock hatch with a wheel and a porthole in a bulkhead frame, a status light and a striped threshold.
  door: () => [
    rect(0, 4, 50, 88, '#cfd6df', { rx: 7, stroke: PANEL_EDGE, 'stroke-width': 1.2 }),
    rect(3.4, 7.4, 43.2, 70, '#bcc5d0', { rx: 5 }),
    circle(25, 44, 22.4, '#9aa6b4', { stroke: '#5b6675', 'stroke-width': 1.2 }),
    ...Array.from({ length: 12 }, (_, index) => {
      const angle = (index * Math.PI) / 6;
      return circle(round(25 + Math.cos(angle) * 20.6), round(44 + Math.sin(angle) * 20.6), 0.9, '#e2e8f0');
    }),
    circle(25, 44, 18.6, '#e6ebf1', { stroke: '#7b8796', 'stroke-width': 1 }),
    path('M12.6 36 A14.6 14.6 0 0 1 31 30.6', 'none', { stroke: '#ffffff', 'stroke-width': 1.6, 'stroke-linecap': 'round', 'stroke-opacity': 0.8 }),
    circle(25, 33.4, 5, '#13284a', { stroke: '#7b8796', 'stroke-width': 1.2 }), circle(26.4, 32.2, 0.7, '#ffffff'), circle(23.4, 34.6, 0.5, '#ffffff'),
    circle(25, 48, 7.6, 'none', { stroke: '#5b6675', 'stroke-width': 2.2 }),
    path('M25 40.4 V55.6 M17.4 48 H32.6', 'none', { stroke: '#5b6675', 'stroke-width': 1.8 }), circle(25, 48, 2.2, '#f2c230', { stroke: '#8a6d12', 'stroke-width': 0.6 }),
    ...hazardBand(2, 80, 46, 8),
    rect(0, 88, 50, 4, '#7b8796', { rx: 1 }),
    rect(39.4, 10, 6, 4, LED_GREEN, { rx: 1, class: 'p-blink-led' }), rect(4.6, 10, 6, 4, '#334155', { rx: 1 }),
    line(1.4, 22, 1.4, 66, '#e8b04a', 2.4), line(48.6, 22, 48.6, 66, '#e8b04a', 2.4),
  ],
  // Storage lockers with colored labels, cargo bags strapped in a net, drawers with a status light.
  shelf: () => [
    rect(1, 3, 62, 89, '#d7dde5', { rx: 3, stroke: PANEL_EDGE, 'stroke-width': 1.2 }),
    ...[[4, '#3b82f6'], [23.4, '#f97316'], [42.8, '#22c55e']].flatMap(([x, label]) => [
      rect(x, 7, 17.2, 26, '#eef2f6', { rx: 1.6, stroke: '#9aa6b4', 'stroke-width': 0.8 }),
      rect(x + 3, 10, 11.2, 3.2, label, { rx: 0.8 }), rect(x + 13, 18, 2, 7, '#7b8796', { rx: 0.8 }),
      path(`M${x + 3} 28 H${x + 9}`, 'none', { stroke: '#c3ccd6', 'stroke-width': 1 })]),
    rect(4, 36, 56, 28, '#a9b4c2', { rx: 1.6 }),
    rect(7, 40, 22, 22, '#f2efe8', { rx: 4, stroke: '#b8b2a4', 'stroke-width': 0.8 }), rect(30.6, 44, 26, 18, '#ece7dc', { rx: 4, stroke: '#b8b2a4', 'stroke-width': 0.8 }),
    path('M7 48 H29 M30.6 51 H56.6 M18 40 V62 M43.6 44 V62', 'none', { stroke: '#7b8796', 'stroke-width': 1.4 }),
    rect(10, 43, 6, 3, '#38bdf8', { rx: 0.6 }), rect(33, 46.6, 6, 3, '#fbbf24', { rx: 0.6 }),
    path('M4 38 L60 62 M4 62 L60 38 M4 50 H60', 'none', { stroke: '#5b6675', 'stroke-width': 0.6, 'stroke-opacity': 0.55 }),
    ...[67, 77.6].map(y => rect(4, y, 56, 9, '#eef2f6', { rx: 1.4, stroke: '#9aa6b4', 'stroke-width': 0.8 })),
    rect(26, 70, 12, 2.4, '#7b8796', { rx: 1 }), rect(26, 80.6, 12, 2.4, '#7b8796', { rx: 1 }),
    circle(54.6, 71.4, 1.4, LED_GREEN, { class: 'p-blink-dot' }), circle(54.6, 82, 1.4, '#f59e0b'),
    rect(1, 88, 62, 4, '#7b8796', { rx: 1 }),
  ],
  // Three contoured lounge seats on a shared frame, with headrests and a soft light strip below.
  sofa: () => [
    rect(4, 39, 142, 11, '#aeb8c4', { rx: 4.6, stroke: PANEL_EDGE, 'stroke-width': 1.1 }),
    rect(12, 46, 126, 2.2, CYAN, { rx: 1, 'fill-opacity': 0.85, class: 'p-glow' }),
    path('M16 50 L20 64 H36 L40 50 Z M110 50 L114 64 H130 L134 50 Z', '#9aa6b4', { stroke: PANEL_EDGE, 'stroke-width': 1 }),
    rect(14, 62, 28, 4, '#7b8796', { rx: 1.4 }), rect(108, 62, 28, 4, '#7b8796', { rx: 1.4 }),
    ...[34, 75, 116].flatMap(x => [
      path(`M${x - 18} 40 Q${x - 20} 22 ${x - 15} 10 Q${x} 4 ${x + 15} 10 Q${x + 20} 22 ${x + 18} 40 Z`, '#e8edf2', { stroke: PANEL_EDGE, 'stroke-width': 1.1 }),
      path(`M${x - 13} 34 Q${x - 14.6} 22 ${x - 11} 14 Q${x} 10 ${x + 11} 14 Q${x + 14.6} 22 ${x + 13} 34 Z`, '#3f5f8a', { stroke: '#2b4166', 'stroke-width': 0.9 }),
      path(`M${x - 8} 15.6 Q${x} 13 ${x + 8} 15.6 M${x - 11.6} 24 Q${x} 21.6 ${x + 11.6} 24`, 'none', { stroke: '#2b4166', 'stroke-width': 0.8 }),
      rect(x - 18, 30, 36, 10, '#4b6c96', { rx: 4.6, stroke: '#2b4166', 'stroke-width': 1 }),
      path(`M${x - 11} 9.6 Q${x} 6.2 ${x + 11} 9.6`, 'none', { stroke: '#ffffff', 'stroke-width': 1.2, 'stroke-opacity': 0.7, 'stroke-linecap': 'round' }),
    ]),
    ...[54.5, 95.5].map(x => rect(x - 3, 24, 6, 17, '#cfd6df', { rx: 2.4, stroke: PANEL_EDGE, 'stroke-width': 0.9 })),
    rect(0, 24, 7, 18, '#cfd6df', { rx: 2.6, stroke: PANEL_EDGE, 'stroke-width': 0.9 }), rect(143, 24, 7, 18, '#cfd6df', { rx: 2.6, stroke: PANEL_EDGE, 'stroke-width': 0.9 }),
  ],
  // A deck pad: a rubber mat with a lit rim and chevrons at the ends.
  rug: () => [
    rect(4, 5, 192, 31, '#5e6b7d', { rx: 14 }),
    rect(10, 9, 180, 23, '#6f7c8f', { rx: 10, stroke: CYAN, 'stroke-width': 1, 'stroke-opacity': 0.55, 'stroke-dasharray': '6 4' }),
    path(Array.from({ length: 15 }, (_, index) => `M${40 + index * 8.6} 13 v15`).join(' '), 'none', { stroke: '#5e6b7d', 'stroke-width': 2 }),
    path('M18 14 l7 6.5 l-7 6.5 M26 14 l7 6.5 l-7 6.5 M182 14 l-7 6.5 l7 6.5 M174 14 l-7 6.5 l7 6.5', 'none', { stroke: HAZARD, 'stroke-width': 2.2, 'stroke-opacity': 0.85, 'stroke-linejoin': 'round' }),
  ],
  // A food and drink dispenser: a menu screen, three buttons, a drink pouch under the nozzle, snack packs on top.
  coffee: () => [
    ...[[8, '#f97316'], [19, '#22c55e'], [30, '#e11d48'], [41, '#3b82f6']].map(([x, color]) => rect(x, 2, 9, 8, color, { rx: 1.4, stroke: darker(color, 0.35), 'stroke-width': 0.7 })),
    rect(4, 9, 48, 79, '#e3e8ee', { rx: 4, stroke: PANEL_EDGE, 'stroke-width': 1.2 }),
    rect(9, 14, 38, 15, SCREEN, { rx: 2 }),
    circle(16, 21.6, 3.4, '#f59e0b', { 'fill-opacity': 0.85, class: 'p-glow' }), circle(28, 21.6, 3.4, '#22d3ee', { 'fill-opacity': 0.85 }), circle(40, 21.6, 3.4, '#f472b6', { 'fill-opacity': 0.85 }),
    ...[[16, '#f59e0b'], [28, '#22d3ee'], [40, '#f472b6']].map(([x, color]) => circle(x, 34.4, 2.4, color, { stroke: darker(color, 0.4), 'stroke-width': 0.7 })),
    rect(11, 40, 34, 32, '#2b3443', { rx: 3 }),
    rect(24.6, 40, 6.8, 5.6, '#9aa6b4', { rx: 1 }),
    path('M28 46 V52', 'none', { stroke: '#c08a5a', 'stroke-width': 1.6, 'stroke-dasharray': '2 2', class: 'p-pour' }),
    path('M20.6 56 Q20 53 23 53 H33 Q36 53 35.4 56 L34.6 68 Q34.4 70 32.4 70 H23.6 Q21.6 70 21.4 68 Z', '#f1f5f9', { stroke: '#94a3b8', 'stroke-width': 0.8 }),
    rect(22.6, 60, 10.8, 5, '#c08a5a', { rx: 0.8 }), path('M28 53 V47.4', 'none', { stroke: '#f97316', 'stroke-width': 1.2 }),
    path('M25 50 q-2 -3 0 -6 q2 -3 0 -6', 'none', { stroke: '#e2e8f0', 'stroke-width': 1.2, 'stroke-linecap': 'round', 'stroke-opacity': 0.7, class: 'p-steam' }),
    rect(11, 70, 34, 3, '#7b8796', { rx: 1 }),
    rect(9, 77, 38, 6, '#cfd6df', { rx: 1.6 }), path('M13 80 H43', 'none', { stroke: '#9aa6b4', 'stroke-width': 1, 'stroke-dasharray': '2 2' }),
    rect(2, 86, 52, 6, '#7b8796', { rx: 1.6 }),
  ],
  // A water-pouch dispenser: a clear tank with bubbles, a nozzle and a pouch on a hook.
  cooler: () => [
    rect(5, 4, 26, 42, '#dbeafe', { rx: 9, 'fill-opacity': 0.75, stroke: '#7b8796', 'stroke-width': 1.2 }),
    rect(7.4, 15, 21.2, 29, '#60a5fa', { rx: 7, 'fill-opacity': 0.8 }),
    path('M8 18 Q18 15.4 28 18', 'none', { stroke: '#bfdbfe', 'stroke-width': 1.2 }),
    circle(14, 38, 1.6, '#eff6ff', { class: 'cooler-bubble' }), circle(22, 40, 1.2, '#eff6ff', { class: 'cooler-bubble cooler-bubble-2' }),
    path('M10 8 Q8.6 20 10 34', 'none', { stroke: '#ffffff', 'stroke-width': 1.6, 'stroke-opacity': 0.8, 'stroke-linecap': 'round' }),
    rect(3, 44, 30, 7, '#9aa6b4', { rx: 2, stroke: '#5b6675', 'stroke-width': 0.9 }),
    rect(5, 50, 26, 42, '#e3e8ee', { rx: 3, stroke: PANEL_EDGE, 'stroke-width': 1.1 }),
    rect(15, 51, 6, 6, '#7b8796', { rx: 1 }),
    path('M18 57 V62', 'none', { stroke: '#93c5fd', 'stroke-width': 1.4, 'stroke-dasharray': '2 2', class: 'p-pour' }),
    path('M12 63 H24 L23 77 Q18 80 13 77 Z', '#dbeafe', { stroke: '#7b8796', 'stroke-width': 0.8 }), rect(13.4, 70, 9.2, 6, '#60a5fa', { 'fill-opacity': 0.8 }),
    rect(9, 81, 18, 3, '#cfd6df', { rx: 1 }), circle(27, 55, 1.3, LED_GREEN, { class: 'p-blink-dot' }),
  ],
  // 0: a hydroponic tray of lettuce under a grow light (the lounge corner); 1: a hydroponic tower with tomatoes (by the door).
  plant: variant => variant % 2 === 0
    ? [
      path('M8 2 H36 L40 10 H4 Z', '#cfd6df', { stroke: PANEL_EDGE, 'stroke-width': 1 }),
      rect(7, 9, 30, 2.6, '#f0abfc', { rx: 1, class: 'p-glow' }),
      path('M7 11.6 H37 L42 40 H2 Z', '#f0abfc', { 'fill-opacity': 0.14 }),
      line(4, 6, 4, 46, '#9aa6b4', 1.6), line(40, 6, 40, 46, '#9aa6b4', 1.6),
      ...[[10, 38, 1], [22, 35, 1.15], [34, 38, 1]].flatMap(([x, y, scale]) => leafCluster(x, y, scale, '#5bb04a')),
      ...[[16, 40, 0.8], [28, 40, 0.8]].flatMap(([x, y, scale]) => leafCluster(x, y, scale, '#79c95a')),
      rect(2, 42, 40, 13, '#e3e8ee', { rx: 2.4, stroke: PANEL_EDGE, 'stroke-width': 1.1 }),
      rect(5, 46, 34, 4, '#93c5fd', { rx: 1.4, 'fill-opacity': 0.8 }),
      rect(8, 55, 6, 15, '#9aa6b4', { rx: 1 }), rect(30, 55, 6, 15, '#9aa6b4', { rx: 1 }),
    ]
    : [
      rect(12, 0, 20, 4, '#cfd6df', { rx: 1.4, stroke: PANEL_EDGE, 'stroke-width': 0.9 }), rect(13, 4, 18, 2, '#f0abfc', { rx: 1, class: 'p-glow' }),
      path('M13 6 H31 L38 30 H6 Z', '#f0abfc', { 'fill-opacity': 0.12 }),
      rect(16, 8, 12, 56, '#e3e8ee', { rx: 6, stroke: PANEL_EDGE, 'stroke-width': 1.1 }),
      ...[[14, 16], [30, 26], [14, 36], [30, 46], [14, 56]].flatMap(([x, y]) => [
        ...leafCluster(x, y, 0.95, '#5bb04a'),
        circle(x + (x < 22 ? -3 : 3), y + 3.6, 1.8, '#ef4444', { stroke: '#991b1b', 'stroke-width': 0.5 }),
        circle(x < 22 ? 18 : 26, y + 1, 2.6, '#cfd6df', { stroke: PANEL_EDGE, 'stroke-width': 0.7 })]),
      rect(10, 62, 24, 8, '#cfd6df', { rx: 2, stroke: PANEL_EDGE, 'stroke-width': 1 }),
    ],
};

// ---------------------------------------------------------------------------
// Stations (viewBox 68 20 72 96, floor at y = 112)
// ---------------------------------------------------------------------------

const stations = {
  // A control console: an orbit screen and a status screen, rows of keys, blinking lights and a joystick.
  console: () => [
    path('M82 112 L86 88 H130 L134 112 Z', '#cfd6df', { stroke: PANEL_EDGE, 'stroke-width': 1 }),
    path('M90 96 H126 M88.6 104 H128', 'none', { stroke: '#9aa6b4', 'stroke-width': 1 }),
    rect(92, 98.4, 6, 3, '#38bdf8', { rx: 0.8, class: 'p-blink-led' }),
    path('M72 86 L74 80 L136 76 L138 82 Z', '#9aa6b4', { stroke: '#5b6675', 'stroke-width': 1 }),
    path('M74 86.2 L138 82.2 L138 85 L74 89 Z', '#7b8796'),
    ...[0, 1, 2, 3, 4, 5].map(index => rect(92 + index * 6.4, 79.6 - index * 0.4, 4.8, 1.8, '#e2e8f0', { rx: 0.5 })),
    ...[0, 1, 2].map(index => circle(126 + index * 3.6, 77.8 - index * 0.2, 1, ['#f87171', '#4ade80', '#fbbf24'][index], { class: index === 1 ? 'p-blink-led' : null })),
    line(81, 82, 79.4, 72.6, '#475569', 1.8), circle(79.2, 71.6, 2.6, '#ef4444', { stroke: '#7f1d1d', 'stroke-width': 0.7 }),
    rect(77.6, 80.6, 7, 2.6, '#475569', { rx: 1 }),
    line(110, 76, 110, 70, '#5b6675', 2.2),
    rect(89, 40, 42, 30, '#1e293b', { rx: 2.6, stroke: '#0f172a', 'stroke-width': 1 }),
    rect(91.4, 42.4, 37.2, 25.2, '#0b3352', { rx: 1.4 }),
    circle(110, 55, 5.6, '#2563eb', { stroke: '#93c5fd', 'stroke-width': 0.6 }), path('M106 53 q3 -2 5 1 q2 3 -2 4', '#4ade80', { 'fill-opacity': 0.8 }),
    ellipse(110, 55, 15, 6, 'none', { stroke: CYAN, 'stroke-width': 0.8, 'stroke-dasharray': '2 1.6' }),
    circle(124.6, 54.4, 1.4, '#fde047', { class: 'p-blink-led' }),
    path('M93.6 64.6 L97 61.6 L99.6 63.4 L103 59.4 L106 62 L109 58.6', 'none', { stroke: '#4ade80', 'stroke-width': 0.9, class: 'p-screen-line' }),
    rect(119, 24, 19, 15, '#1e293b', { rx: 1.6, stroke: '#0f172a', 'stroke-width': 0.9 }),
    ...[0, 1, 2, 3].map(index => rect(121.4 + index * 4, 35 - [6, 9, 4, 7][index], 2.6, [6, 9, 4, 7][index], ['#22d3ee', '#4ade80', '#fbbf24', '#22d3ee'][index], { class: index === 2 ? 'p-blink-dot' : null })),
    line(128.5, 39, 128.5, 42, '#5b6675', 1.6),
  ],
  // A satellite workbench: a gold-foil satellite being assembled, a folded solar panel, a small robotic arm with sparks.
  workbench: () => [
    rect(72, 84, 64, 6, '#9aa6b4', { rx: 1.6, stroke: '#5b6675', 'stroke-width': 1 }),
    rect(75, 90, 5, 22, '#7b8796', { rx: 1 }), rect(128, 90, 5, 22, '#7b8796', { rx: 1 }), rect(78, 102, 52, 3, '#9aa6b4', { rx: 1 }),
    rect(84, 104.6, 12, 7, '#e3e8ee', { rx: 1.4, stroke: PANEL_EDGE, 'stroke-width': 0.8 }), rect(110, 104.6, 14, 7, '#f97316', { rx: 1.4, stroke: '#9a3412', 'stroke-width': 0.8 }),
    rect(97, 62, 22, 22, GOLD_FOIL, { rx: 1.6, stroke: '#8a6d12', 'stroke-width': 1 }),
    path('M101 62 V84 M108 62 V84 M115 62 V84 M97 69 H119 M97 77 H119', 'none', { stroke: '#b8892a', 'stroke-width': 0.7 }),
    path('M99 64 L104 70', 'none', { stroke: '#fde68a', 'stroke-width': 1.2, 'stroke-linecap': 'round' }),
    path('M104 62 L101 54 M112 62 L115 54', 'none', { stroke: '#9aa6b4', 'stroke-width': 1.4 }),
    path('M98 54 Q108 44 118 54 Z', '#e2e8f0', { stroke: '#7b8796', 'stroke-width': 1 }), line(108, 52, 108, 46.6, '#7b8796', 1), circle(108, 46, 1.4, '#ef4444'),
    rect(120, 66, 15, 17, '#1e3a8a', { stroke: '#cbd5e1', 'stroke-width': 1 }),
    path('M120 71.6 H135 M120 77.2 H135 M125 66 V83 M130 66 V83', 'none', { stroke: '#60a5fa', 'stroke-width': 0.6 }),
    line(119, 74.5, 120, 74.5, '#9aa6b4', 1.6),
    group('p-wobble', [
      rect(77, 80, 9, 4, '#475569', { rx: 1 }),
      line(81.5, 80, 83, 68, '#f2c230', 3.2), circle(83, 68, 2.2, '#5b6675'),
      line(83, 68, 93, 63.6, '#f2c230', 2.8), circle(93, 63.6, 1.8, '#5b6675'),
      path('M94 62 l3 -1.6 M94 65.4 l3 1.4', 'none', { stroke: '#475569', 'stroke-width': 1.2 }),
    ]),
    ...[[98.6, 60.4], [96, 57], [101.4, 57.6]].map(([x, y]) => path(`M${x} ${y - 2.2} l0.7 1.5 l1.5 0.7 l-1.5 0.7 l-0.7 1.5 l-0.7 -1.5 l-1.5 -0.7 l1.5 -0.7 Z`, '#fde047', { class: 'p-spark' })),
    line(86, 83, 93, 81.4, '#475569', 1.4), rect(84, 82, 3.2, 2, '#f97316', { rx: 0.6 }),
    circle(125, 82.4, 1.2, '#cbd5e1'), circle(128, 82.8, 1.2, '#cbd5e1'), circle(131, 82.4, 1.2, '#cbd5e1'),
  ],
};

export default Object.freeze({
  archetypes: { astronaut, engineer, commander, scientist, robot: helperRobot, alien: alienVisitor },
  decor,
  stations,
});
