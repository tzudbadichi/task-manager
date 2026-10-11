// The star-knights world: a desert hangar of a galactic space-fantasy saga - hooded knights with glowing
// energy swords, pilots in flight suits, smugglers with a holster and a scarf, droids, alien traders and a
// big furry co-pilot - and the hangar's furniture: a sliding blast door, stacked cargo crates, a bench of
// crates, a cantina drink tap, a moisture vaporator, hardy desert plants and a landing-pad marking.
// Original designs for this app: the feel of the genre, no characters, helmets, droids, ships or emblems
// from films or shows. Coordinates: figure-kit.js (characters), world-layout.js ART (furniture),
// viewBox 68 20 72 96 (stations).

import { circle, darker, ellipse, group, lighter, line, path, rect } from '../svg-kit.js';
import {
  BEARD, HAIR, arm, belt, blob, box, cloakBack, dot, headBase, leg, limb, longGarmentPath, nose, pick,
  pickWeighted, rngOf, shade, shape, stroke, torsoPath,
} from '../figure-kit.js';

const TOON_EYES = Object.freeze({ anchors: [[43, 41], [52, 41]], style: 'toon' });
const METAL = '#b9bfc6';
const METAL_DARK = '#4b5563';
const LEATHER = '#5e4128';
const LEATHER_DARK = '#3f2a1a';
const SAND = '#d8c39a';
const HAZARD = '#e8a33a';
const HOLO = '#7dd3fc';

const HUMAN_SKINS = ['#f6d7bd', '#efc8a6', '#e2b38c', '#d29f74', '#b9845a', '#8f5f3c', '#6e4630'];
const HAIR_COLORS = ['#2b1d14', '#3d2a1c', '#5a3a22', '#8a4b26', '#c9a05a', '#1f1a17', '#a0522d', '#d9c08a', '#9ca3af'];

const round = value => Math.round(value * 100) / 100;

// ---------------------------------------------------------------------------
// Things held in the back hand (at about (34,83); they swing with the arm)
// ---------------------------------------------------------------------------

/** An energy sword: a metal hilt in the hand and a blade glowing in the category color, angled away from the body. */
const energySword = (hilt = METAL) => [
  stroke('M33.6 78.4 L19.4 39.4', 'cat', 9.4, { 'stroke-opacity': 0.3, class: 'p-glow' }),
  stroke('M33.6 78.4 L19.4 39.4', 'cat', 4.6),
  stroke('M33.2 77 L19.9 40.6', '#ffffff', 1.8),
  limb(34.2, 80, 35.8, 91, 3, hilt), stroke('M33.4 83.4 L36.2 82.8 M34 86.6 L36.8 86', METAL_DARK, 1),
  shape('M31.8 78.8 L36.6 77.8 L37 80.6 L32.4 81.6 Z', '#6b7280'),
];

const HELD = {
  blade: () => energySword(),
  bladeDark: () => energySword('#3f3f46'),
  staff: () => [limb(34, 112, 33, 50, 2.4, '#7a5a3a'), box(31.2, 47, 3.8, 5, METAL, { rx: 1 }), box(32.4, 108, 2.6, 4, METAL, { rx: 0.6 })],
  pilotHelmet: (shell, stripe) => [circle(30.4, 86, 9.4, shell, { stroke: '#6b7280', 'stroke-width': 1 }), stroke('M30.4 76.8 V95', stripe, 2.6),
    shape('M25 82 Q30.4 78.6 36.6 81.4 L36.6 85.4 Q30.4 82.8 24.6 86 Z', '#7c2d12'), dot(22.6, 87, 2.4, METAL)],
  blaster: () => [box(31.6, 81.6, 4.4, 9, '#2b2b2b', { rx: 1 }), shape('M27 76.4 H44.4 Q46 76.4 46 78.2 V80.4 H36 L35.4 82.6 H31 L30.4 80.4 H27 Q25.6 80.4 25.6 78.4 Q25.6 76.4 27 76.4 Z', '#3f3f46'),
    box(29.4, 73.6, 9, 2.8, '#6b7280', { rx: 0.8 }), stroke('M44.6 78.2 H49', METAL_DARK, 1.6), dot(28.4, 78.4, 0.8, '#f87171', { stroke: 'none' })],
  datapad: () => [box(25, 76, 11, 14, '#3f3f46', { rx: 1.6 }), rect(26.4, 77.6, 8.2, 8.4, '#7dd3fc', { rx: 0.6, class: 'p-glow' }),
    path('M27.6 80 H33.4 M27.6 82.6 H31.6', 'none', { stroke: '#0c4a6e', 'stroke-width': 0.8 }), dot(30.5, 88, 0.9, '#fbbf24', { stroke: 'none' })],
  crate: () => [box(24, 80, 16, 12, '#c4733a', { rx: 1 }), stroke('M24 84 H40 M28 80 V92 M36 80 V92', '#8a4a20', 0.8), box(30, 85, 4, 3, '#e5e7eb', { rx: 0.6 })],
  sack: color => [shape('M26 82 Q24 92 31 93.6 Q38 92 36.4 82 Q33.6 79.6 31 81 Q28.6 79.6 26 82 Z', color),
    stroke('M27.6 82.6 Q31 85 35.2 82.4', darker(color, 0.3), 1.1), dot(29, 79.6, 1.8, '#a3e635'), dot(32.6, 79, 1.6, '#f97316')],
  jug: () => [shape('M27.6 81 Q24 87 26.6 93.4 H35.6 Q38.2 87 34.6 81 Z', '#b86b3a'), box(28.6, 77.6, 5, 3.6, '#9a5a2e', { rx: 0.8 }),
    stroke('M26 86 H36.4', '#e8c58a', 1.2), stroke('M34.6 81.6 Q38.6 82 37.4 86.6', '#9a5a2e', 1.1)],
  crystal: color => [circle(32, 85, 7, color, { 'fill-opacity': 0.25, class: 'p-glow' }), shape('M32 77.6 L36 83.6 L32 92 L28 83.6 Z', color),
    stroke('M32 77.6 V92 M28 83.6 H36', lighter(color, 0.5), 0.7)],
  spanner: () => [limb(34, 100, 34, 64, 3, METAL), shape('M28.6 55.6 Q27.6 64.4 34 66 Q40.4 64.4 39.4 55.6 L36.6 55.6 L36.4 60 Q34 61.8 31.6 60 L31.4 55.6 Z', METAL),
    shape('M30.6 97 Q30 103.4 34 104.6 Q38 103.4 37.4 97 Z', METAL)],
  toolbox: () => [box(23.4, 84, 18, 11, '#c2410c', { rx: 1.4 }), stroke('M23.4 87.6 H41.4', '#7c2d12', 0.9), stroke('M28 84 Q28 79.6 32.4 79.6 Q36.8 79.6 36.8 84', '#3f3f46', 1.6)],
};

// ---------------------------------------------------------------------------
// Archetypes (looks: figure-kit.js composeFigure)
// ---------------------------------------------------------------------------

/** Star knights: a hooded robe over a layered tunic, a wrap in the category color, and an energy sword glowing in the category color. */
function starKnight(look) {
  const random = rngOf(look);
  const skin = pick(HUMAN_SKINS, random);
  const hairColor = pick(HAIR_COLORS, random);
  const robe = pick(['#6b4a2e', '#5a3d26', '#7a5a3a', '#8a6a4a', '#e2d5b5', '#cdbb92', '#4a3f35'], random);
  const tunic = pick(['#efe3c6', '#e6d6b2', '#d9c8a2'], random);
  const hoodUp = random() < 0.38;
  const weapon = pickWeighted([['blade', 64], ['bladeDark', 12], ['hilt', 14], ['staff', 10]], random);
  const hair = pick([HAIR.shortCrop, HAIR.longStraight, HAIR.topKnot, HAIR.shaggy, HAIR.bald, HAIR.braids], random)(hairColor);
  const beard = random() < 0.36 ? pick(['short', 'stubble', 'long'], random) : null;
  const legs = { trousers: darker(tunic, 0.14), feet: 'tallboot', shoes: pick([LEATHER, LEATHER_DARK, '#2b2622'], random), width: 6.8 };
  const sleeves = { style: 'wide', sleeve: robe, hand: skin };
  return {
    shadowWidth: 18,
    behind: cloakBack(robe, { hem: 110, spread: 14 }),
    legBack: leg('back', legs),
    legFront: leg('front', legs),
    armBack: arm('back', sleeves),
    armFront: arm('front', sleeves),
    torso: [
      shape(longGarmentPath('regular', { hem: 104, flare: 4 }), tunic),
      stroke('M33 99 Q46 102.4 59 99', darker(tunic, 0.18), 0.9),
      shape(torsoPath('regular', { bottom: 82 }), 'cat'),
      shape('M40.4 55 L46 66.4 L51.6 55 Q46 53.4 40.4 55 Z', tunic),
      stroke('M51.6 55 L39.4 80.4', 'cat-dark', 1.1), stroke('M40.4 55 L45 64.4', 'cat-dark', 0.9),
      shade('M50 56 Q55 55.6 58 65 Q58.6 74 57.6 82 L50 82 Z', '#000000', 0.12),
      box(33.4, 77, 25.2, 7, 'cat-dark', { rx: 1.6 }),
      box(33.2, 79.2, 25.6, 3, LEATHER, { rx: 1 }), box(44, 78.2, 4.4, 5, '#9aa3ad', { rx: 0.8 }),
      box(36, 81.4, 4.6, 5, LEATHER, { rx: 0.8 }), box(51, 81.4, 4.6, 5, LEATHER, { rx: 0.8 }),
    ],
    overTorso: [
      shape('M33.4 56 Q35.2 54.4 37.8 55 L36 104 L30.8 104 Q31 80 33.4 56 Z', robe),
      shape('M58.6 56 Q56.8 54.4 54.2 55 L56 104 L61.2 104 Q61 80 58.6 56 Z', robe),
      shade('M58.6 56 Q56.8 54.4 54.2 55 L56 104 L61.2 104 Q61 80 58.6 56 Z', '#000000', 0.12),
      !hoodUp && shape('M32.4 56 Q46 48.6 59.6 56 Q55.4 60.6 46 59.4 Q36.6 60.6 32.4 56 Z', robe),
      weapon === 'hilt' && [limb(52.6, 84, 53.8, 95, 2.8, METAL), stroke('M52.2 87.4 L54.6 87 M52.6 90.4 L55 90', METAL_DARK, 0.9)],
    ],
    held: weapon === 'hilt' ? null : HELD[weapon](),
    headScale: 1,
    head: {
      back: hoodUp ? null : hair.back,
      base: headBase(skin),
      features: nose(skin),
      eyes: TOON_EYES,
      brows: darker(hairColor, 0.1),
      beforeMouth: beard ? BEARD[beard](hairColor) : null,
      mouth: { anchor: [47.5, beard === 'long' ? 48.4 : 47.8] },
      front: hoodUp ? null : hair.front,
      hat: hoodUp && [shape('M26.6 56 Q22 24 46 18.6 Q70 24 65.4 56 Q63 33 46 30.4 Q29 33 26.6 56 Z', robe),
        shade('M30.2 52 Q29.8 35.6 46 32.6 Q39.6 37 36.6 52 Z', '#000000', 0.2), stroke('M32 28.6 Q46 20.4 60 28', lighter(robe, 0.15), 1)],
    },
  };
}

/** Pilots: a flight suit in the category color, a life-support vest with a chest box and tubes, a rounded helmet with the visor up. */
function pilot(look) {
  const random = rngOf(look);
  const skin = pick(HUMAN_SKINS, random);
  const hairColor = pick(HAIR_COLORS, random);
  const hair = pick([HAIR.shortCrop, HAIR.topKnot, HAIR.curlyMop, HAIR.braids, HAIR.shaggy], random)(hairColor);
  const shell = pick(['#f1efe8', '#e5e7eb', '#e9e2cf', '#cfd4da'], random);
  const stripe = pick(['#dc2626', '#f97316', '#eab308', '#475569', '#16a34a', '#0ea5e9'], random);
  const helmetOn = random() < 0.62;
  const vest = pick(['#ece6d8', '#e2dccd', '#d6d3cb'], random);
  const legs = { trousers: 'cat', feet: 'tallboot', shoes: '#1f2937', width: 7 };
  const sleeves = { sleeve: 'cat', hand: '#3f3f46', cuff: 'cat-dark' };
  return {
    shadowWidth: 18,
    legBack: [leg('back', legs), stroke('M37.4 92.6 Q41 95 44.6 92.6', '#3f3f46', 1.8)],
    legFront: [leg('front', legs), stroke('M47.6 92.6 Q51.4 95 55 92.6', '#3f3f46', 1.8)],
    armBack: arm('back', sleeves),
    armFront: arm('front', sleeves),
    torso: [
      shape(torsoPath('regular', { bottom: 93 }), 'cat'),
      shade('M50 56 Q55 55 58 65 Q59 80 57 92 Q54 94 50 94 Z', '#000000', 0.1),
      shape('M34.6 58 Q38 55 43 55.6 L46 62 L49 55.6 Q54 55 57.4 58 L57.8 77.6 Q46 80.6 34.2 77.6 Z', vest),
      shade('M50.6 56 Q54 55 57.4 58 L57.8 77.6 Q54 78.8 50.6 79 Z', '#000000', 0.1),
      box(40.4, 61.4, 11.2, 9, '#9aa3ad', { rx: 1.4 }),
      dot(43.4, 64.4, 1.1, '#f87171'), dot(46.4, 64.4, 1.1, '#4ade80'), dot(49.4, 64.4, 1.1, '#fbbf24'), rect(42.4, 67, 7.4, 1.6, METAL_DARK, { rx: 0.4 }),
      stroke('M42 70.4 Q38.4 75 36.2 80 M50 70.4 Q53.6 75 55.8 80', METAL_DARK, 1.6),
      stroke('M37.4 78.4 L40.6 92 M54.6 78.4 L51.4 92', '#3f3f46', 2),
      belt('regular', 84, '#3f3f46', METAL),
    ],
    held: helmetOn ? null : HELD.pilotHelmet(shell, stripe),
    headScale: 1,
    head: {
      back: helmetOn ? null : hair.back,
      base: headBase(skin),
      features: nose(skin),
      eyes: TOON_EYES,
      brows: darker(hairColor, 0.1),
      beforeMouth: random() < 0.25 ? BEARD.stubble(hairColor) : null,
      mouth: { anchor: [47.5, 47.6] },
      front: helmetOn ? null : hair.front,
      hat: helmetOn && [
        shape('M28.6 46 Q27.4 21.4 46 20.6 Q64.6 21.4 63.4 46 L59.8 46 Q60.4 31.6 46 31 Q31.6 31.6 32.2 46 Z', shell),
        stroke('M46 20.8 V30.8', stripe, 3), stroke('M30.4 36 Q31.6 26 39 22.8', stripe, 1.8),
        shape('M31.2 34.6 Q46 27 60.8 34.6 L61 30.2 Q46 22.6 31 30.2 Z', '#7c2d12'),
        stroke('M35 30 Q46 25 57.4 29.6', '#fdba74', 0.9),
        dot(30.6, 42, 4.4, METAL), dot(30.6, 42, 1.8, METAL_DARK),
        stroke('M32.6 46.4 Q35 52 41.6 52.4', '#3f3f46', 1.2),
      ],
    },
  };
}

/** Smugglers: a loose shirt, a vest in the category color, a scarf, a gun belt with a holster, tall boots and a cocky grin. */
function smuggler(look) {
  const random = rngOf(look);
  const skin = pick(HUMAN_SKINS, random);
  const hairColor = pick(HAIR_COLORS, random);
  const hair = pick([HAIR.shaggy, HAIR.curlyMop, HAIR.shortCrop, HAIR.topKnot, HAIR.longWavy], random)(hairColor);
  const shirt = pick(['#efe6d4', '#f4efe4', '#e6dcc8', '#d9d2c4', '#3f3f46'], random);
  const trousers = pick(['#3b3a45', '#4a3f35', '#2f3a4a', '#5a4a3a'], random);
  const scarf = pick(['#b45309', '#0f766e', '#a16207', '#7c2d12', '#57534e', '#9f1239'], random);
  const goggles = random() < 0.35;
  const held = pickWeighted([['blaster', 40], ['datapad', 22], ['crate', 13], [null, 25]], random);
  const legs = { trousers, feet: 'tallboot', shoes: pick([LEATHER_DARK, '#2b2622', '#5a3a22'], random), width: 7 };
  const sleeves = random() < 0.5 ? { style: 'rolled', sleeve: shirt, hand: skin } : { sleeve: shirt, hand: skin, cuff: darker(shirt, 0.1) };
  return {
    shadowWidth: 18,
    legBack: leg('back', legs),
    legFront: leg('front', legs),
    armBack: arm('back', sleeves),
    armFront: arm('front', sleeves),
    torso: [
      shape(torsoPath('regular', { bottom: 92 }), shirt),
      shape('M42.6 55.4 L46 63.4 L49.4 55.4 Z', skin, { 'stroke-width': 0.6 }),
      shape('M34.6 57.6 Q38 55 42 55.6 L44 70 L43.6 90 Q38.6 91 34.4 89.4 Q32.8 74 34.6 57.6 Z', 'cat'),
      shape('M57.4 57.6 Q54 55 50 55.6 L48.4 66 L48.6 90 Q53.4 91 57.6 89.4 Q59.2 74 57.4 57.6 Z', 'cat'),
      shade('M57.4 57.6 Q54 55 50 55.6 L48.4 66 L48.6 90 Q53.4 91 57.6 89.4 Q59.2 74 57.4 57.6 Z', '#000000', 0.1),
      box(36.2, 70, 5.6, 5, 'cat-dark', { rx: 0.8 }), box(50.6, 70, 5.6, 5, 'cat-dark', { rx: 0.8 }),
      stroke('M42 58 L43.6 89 M50 58 L48.6 89', 'cat-dark', 0.8),
      box(32.6, 85.4, 26.8, 3.4, LEATHER, { rx: 1.2 }), box(44.2, 84.8, 4.6, 4.6, 'none', { stroke: METAL, 'stroke-width': 1.2, rx: 0.8 }),
      ...[37, 40, 52].map(x => box(x - 1, 84.6, 2, 4.6, '#c9a46a', { rx: 0.6 })),
    ],
    overTorso: [
      shape('M36.6 55.2 Q46 61 55.4 55.2 L56 58.8 Q46 65.2 36 58.8 Z', scarf),
      shape('M39.6 58.4 L37.2 71 L41.2 71.6 L42.6 59.8 Z', scarf), stroke('M37.4 71.2 l-0.6 2 M39.4 71.4 l0 2 M41 71.6 l0.4 2', scarf, 0.9),
    ],
    front: [shape('M54 87.6 H59.6 L58.8 101 H54.6 Z', LEATHER), shape('M54.6 85 L58.4 85 L59 89.6 L54.8 89.6 Z', '#2b2b2b'), stroke('M55 93 H58.6', LEATHER_DARK, 0.8)],
    held: held ? HELD[held]() : null,
    headScale: 1,
    head: {
      back: hair.back,
      base: headBase(skin),
      features: nose(skin),
      eyes: TOON_EYES,
      brows: darker(hairColor, 0.1),
      beforeMouth: random() < 0.5 ? BEARD.stubble(hairColor) : random() < 0.4 ? BEARD.short(hairColor) : null,
      mouth: { anchor: [47.5, 47.8] },
      front: hair.front,
      hat: goggles && [stroke('M31 33 Q46 25.4 61 31.4', '#3f2a1a', 2.2), dot(41.4, 30, 3.8, '#f59e0b', { stroke: '#3f2a1a', 'stroke-width': 1.4, 'fill-opacity': 0.85 }),
        dot(51, 29.2, 3.8, '#f59e0b', { stroke: '#3f2a1a', 'stroke-width': 1.4, 'fill-opacity': 0.85 }), path('M39.8 28.6 l2 -1.4 M49.4 27.8 l2 -1.4', 'none', { stroke: '#fff7ed', 'stroke-width': 0.9 })],
    },
  };
}

/** Droids of original designs: a lanky service droid with a capsule head and a visor band, or a squat dome-headed roller on two wheels. */
function droid(look) {
  const random = rngOf(look);
  const model = random() < 0.5 ? 'service' : 'roller';
  const shell = model === 'service'
    ? pick(['#b8c0c8', '#c97b4a', '#8fa39a', '#d8d0c0', '#6b7a8a'], random)
    : pick(['#e7e1d3', '#cfd6db', '#e9c98a', '#d9d4e2'], random);
  const joint = pick(['#4b5563', '#57534e', '#6b7280'], random);
  const grime = darker(shell, 0.2);
  const eyes = { anchors: [[42.6, 40.4], [51.6, 40.4]], style: 'led' };
  const mouth = { anchor: [47.2, 45.6], color: '#22d3ee', width: 0.6 };
  if (model === 'service') {
    const thinLeg = (hip, knee, ankle, footX) => [limb(...hip, ...knee, 3.6, joint), dot(...knee, 2.4, shell), limb(...knee, ...ankle, 3.4, joint),
      shape(`M${footX - 5.4} 112 L${footX - 4} 106.4 H${footX + 4} L${footX + 6.2} 112 Z`, shell)];
    const thinArm = (shoulder, elbow, wrist, hand) => [limb(...shoulder, ...elbow, 3.4, joint), dot(...elbow, 2.2, shell), limb(...elbow, ...wrist, 3.2, joint),
      dot(...hand, 2.8, shell), stroke(`M${hand[0] - 1.6} ${hand[1] + 2} l-0.8 2.4 M${hand[0] + 1.6} ${hand[1] + 2} l0.8 2.4`, joint, 1.1)];
    return {
      shadowWidth: 15,
      legBack: thinLeg([41, 90], [40.6, 100], [40.2, 106.4], 41.4),
      legFront: thinLeg([51, 90], [51.6, 100], [52.2, 106.4], 53.8),
      armBack: thinArm([37, 62], [35.5, 72], [34.3, 80.5], [34, 83]),
      armFront: thinArm([55, 62], [56.5, 72], [57.7, 80.5], [58, 83]),
      torso: [
        stroke('M43 75 V86 M49 75 V86', joint, 2.2), stroke('M46 75 V86', '#f97316', 1.1),
        shape('M35 58 Q35 55 38 55 H54 Q57 55 57 58 V73 Q57 76.4 53.6 76.4 H38.4 Q35 76.4 35 73 Z', shell),
        shape('M38.6 58.4 H53.4 L51.6 70.6 H40.4 Z', 'cat'), stroke('M41.4 62 H50.6 M42 65.4 H50', 'cat-dark', 0.9),
        box(37.4, 85, 17.2, 6.4, shell, { rx: 2 }), stroke('M40 88.2 H52', grime, 0.9),
        dot(36.6, 61.2, 2, joint), dot(55.4, 61.2, 2, joint),
        shade('M51 55 H54 Q57 55 57 58 V73 Q57 76.4 53.6 76.4 H51 Z', '#000000', 0.12),
      ],
      headScale: 1,
      head: {
        back: [stroke('M58 33 L63 24', joint, 1.2), dot(63.4, 23.2, 1.6, '#f87171', { class: 'p-antenna' })],
        base: [stroke('M46 50 V56', joint, 3), box(29.6, 30.4, 32.8, 20, shell, { rx: 10 }), box(32, 35.4, 28, 10.6, '#111827', { rx: 5.2 }),
          dot(29.2, 40.4, 3, joint), dot(29.2, 40.4, 1.2, '#e5e7eb', { 'stroke-width': 0.4 }), stroke('M34 32.6 H58', lighter(shell, 0.3), 1),
          shade('M29.6 40.4 Q30 49.8 40 50.4 H52 Q62 49.8 62.4 40.4 L62.4 44 Q62 50.4 52 50.4 H40 Q30 50.4 29.6 44 Z', '#000000', 0.12)],
        eyes,
        brows: null,
        mouth: { anchor: [47.2, 47.6], color: '#22d3ee', width: 0.5 },
      },
    };
  }
  const wheelLeg = (hip, x) => [limb(...hip, x, 102.6, 5, joint), circle(x, 106.6, 5.4, '#3f3f46', { stroke: '#1f2937', 'stroke-width': 0.9 }), circle(x, 106.6, 2, METAL)];
  const stubArm = side => {
    const [sx, sy, hx, hy] = side === 'back' ? [37, 64, 34, 82] : [55, 64, 58, 82];
    return [limb(sx, sy, hx, hy - 2, 3, joint), dot(hx, hy, 2.6, METAL), stroke(`M${hx - 1.6} ${hy + 1.8} l-0.6 2.2 M${hx + 1.6} ${hy + 1.8} l0.6 2.2`, joint, 1.1)];
  };
  return {
    shadowWidth: 19,
    legBack: wheelLeg([41, 88], 39.6),
    legFront: wheelLeg([51, 88], 53),
    armBack: stubArm('back'),
    armFront: stubArm('front'),
    torso: [
      shape('M32 66 Q32 55.6 46 55.6 Q60 55.6 60 66 V88 Q60 98 46 98 Q32 98 32 88 Z', shell),
      shade('M50 55.8 Q60 56.6 60 66 V88 Q60 97.4 50 98 Z', '#000000', 0.12),
      shape('M32.2 70 H59.8 V76 H32.2 Z', 'cat'), shape('M38 82 H54 V92 Q46 94.4 38 92 Z', 'cat-light'),
      stroke('M40.6 85.4 H51.4 M40.6 88.6 H51.4', grime, 0.9),
      dot(37.4, 63, 1.4, '#f87171'), dot(41.4, 62, 1.1, '#4ade80'),
      stroke('M56 62 Q57 66 56.4 70', grime, 0.8),
    ],
    headScale: 1,
    head: {
      back: [stroke('M38 28 L34 19', joint, 1.2), dot(33.6, 18.4, 1.8, '#fbbf24', { class: 'p-antenna' })],
      base: [shape('M29.6 54.4 Q29.6 25.6 46 25.6 Q62.4 25.6 62.4 54.4 Z', shell), shape('M29.6 50.6 H62.4 V54.6 H29.6 Z', 'cat'),
        box(35.4, 34.6, 22.4, 12.4, '#111827', { rx: 4.6 }), dot(54.2, 30.4, 2.6, '#1f2937', { stroke: METAL, 'stroke-width': 0.9 }), dot(54.8, 29.8, 0.8, '#ffffff', { stroke: 'none' }),
        stroke('M33 31 Q38 27.6 44 27', lighter(shell, 0.4), 1.4)],
      eyes,
      brows: null,
      mouth,
    },
  };
}

/** Alien traders: colored skin with head-tails, horns, fan ears or a crest, a long robe in the category color under a fringed shawl, goods in hand. */
function alienTrader(look) {
  const random = rngOf(look);
  const skin = pick(['#7fb7a6', '#c58fd1', '#e39b6b', '#6f9fd8', '#d9c36a', '#a3c46b', '#c97a7a', '#8fa0d9'], random);
  const deep = darker(skin, 0.22);
  const feature = pick(['tails', 'horns', 'ears', 'crest'], random);
  const shawl = pick(['#8a6a44', '#6b5a7a', '#5a6b4a', '#9a5a3a', '#4a5a6b'], random);
  const beads = pick(['#fbbf24', '#e5e7eb', '#22d3ee', '#f472b6'], random);
  const held = pickWeighted([['sack', 30], ['jug', 26], ['crystal', 24], [null, 20]], random);
  const build = pick(['regular', 'round'], random);
  const eyeStyle = random() < 0.5 ? 'big' : 'toon';
  const legs = { trousers: darker(shawl, 0.15), feet: 'sandal', shoes: LEATHER, skin, width: 6.4 };
  const sleeves = { style: 'wide', sleeve: 'cat', hand: skin };
  const headFeature = {
    tails: { back: [shape('M34 30 Q24 44 27.4 66 Q28.6 72 32 67 Q30.4 50 38.4 36 Z', skin), shape('M38 28 Q31 42 34.6 60 Q36 64 38.4 60 Q36.6 46 42 33 Z', deep),
      stroke('M29 50 Q29.6 56 30.4 60 M27.8 42 l2 1', deep, 0.8)], front: null },
    horns: { back: null, front: [[34, 28, -30], [40.4, 23.6, -12], [47.4, 22.4, 4], [54.4, 24.4, 20], [59.6, 29, 36]].map(([x, y, angle]) =>
      shape(`M${x - 2.4} ${y + 2} L${x} ${y - 6} L${x + 2.4} ${y + 2} Z`, '#efe3c6', { transform: `rotate(${angle} ${x} ${y})` })) },
    ears: { back: [shape('M34 44 Q16 48 12.4 32 Q18.6 26 25.6 30 Q31 34 34 38 Z', skin), shape('M31.6 41.4 Q20.6 43 18 34 Q22 31 26.4 33.6 Q30 36 31.6 39 Z', lighter(skin, 0.3), { 'stroke-width': 0.5 })], front: null },
    crest: { back: null, front: [shape('M33.6 32 Q34 18 46 15 Q56 18 59 30 Q54.6 25.6 46 25 Q38 25.6 33.6 32 Z', deep), stroke('M38 22.6 L40 27.6 M46 17.4 V25 M53.6 21.6 L52 27', skin, 1)] },
  }[feature];
  return {
    shadowWidth: 18,
    legBack: leg('back', legs),
    legFront: leg('front', legs),
    armBack: arm('back', sleeves),
    armFront: arm('front', sleeves),
    torso: [
      shape(longGarmentPath(build, { hem: 105, flare: 5 }), 'cat'),
      shade('M50 57 Q56 57 58 66 L63 105 Q57 106 52 106 Z', '#000000', 0.12),
      stroke('M30 101.6 Q46 105.4 62 101.6', 'cat-light', 1.6), stroke('M31 98 Q46 101.6 61 98', 'cat-dark', 0.9),
      box(35, 80, 22, 3.4, LEATHER, { rx: 1 }), dot(46, 81.7, 2, beads),
    ],
    overTorso: [
      shape('M32 56 Q46 50.6 60 56 L58.4 72 Q46 78 33.6 72 Z', shawl),
      stroke('M34 72.6 l-0.6 3 M37.4 74.4 l-0.4 3 M41 75.6 l-0.2 3 M44.6 76.2 V79.2 M48.4 76 l0.2 3 M52 75.2 l0.4 3 M55.6 73.8 l0.6 3', shawl, 1),
      ...[38, 42, 46, 50, 54].map((x, index) => dot(x, 60.4 + Math.abs(index - 2) * -0.8 + 2, 1.2, beads, { 'stroke-width': 0.5 })),
    ],
    held: held === 'sack' ? HELD.sack(pick(['#c9a46a', '#a8905f', '#b8a07a'], random)) : held === 'crystal' ? HELD.crystal(pick(['#a78bfa', '#5eead4', '#f9a8d4'], random)) : held ? HELD[held]() : null,
    headScale: 1.04,
    head: {
      back: headFeature.back,
      base: headBase(skin, { ears: feature === 'ears' ? 'none' : 'tip' }),
      features: [nose(skin, 1.1), dot(37.6, 47, 0.9, deep, { stroke: 'none' }), dot(39.6, 49, 0.8, deep, { stroke: 'none' })],
      eyes: { anchors: [[42.6, 40.4], [52.6, 40.4]], style: eyeStyle, color: '#1f2937' },
      brows: eyeStyle === 'toon' ? deep : null,
      mouth: { anchor: [47.4, 48] },
      front: headFeature.front,
    },
  };
}

/** A big furry co-pilot: shaggy fur, round ears, a pale muzzle, a mechanic's vest in the category color and a spanner or a toolbox. */
function furryCopilot(look) {
  const random = rngOf(look);
  const fur = pick(['#8a5a32', '#a87444', '#c49a62', '#6b5a4a', '#9a9aa4', '#d9c7a8', '#7a4a2a'], random);
  const furDark = darker(fur, 0.32);
  const furLight = lighter(fur, 0.42);
  const held = pickWeighted([['spanner', 45], ['toolbox', 30], [null, 25]], random);
  const headgear = pickWeighted([['goggles', 45], ['headset', 25], [null, 30]], random);
  const tuft = (x, y) => stroke(`M${x} ${y} l1.4 -2.6 l1.4 2.6`, furDark, 0.9);
  const legs = { trousers: fur, feet: 'paw', shoes: furDark, width: 9.6 };
  const sleeves = { sleeve: fur, hand: furDark, width: 8.6, handSize: 4.4 };
  const fringe = 'M30.6 90 l2.6 6 l2.8 -4.4 l2.8 6 l2.8 -4.6 l2.8 6 l2.8 -4.6 l2.8 6 l2.8 -4.6 l2.8 6 l2.8 -4.4 l2.6 -6 Z';
  return {
    shadowWidth: 22,
    legBack: [leg('back', legs), tuft(38.6, 100), tuft(39, 94)],
    legFront: [leg('front', legs), tuft(50, 100), tuft(50.4, 94)],
    armBack: [arm('back', sleeves), tuft(34.6, 70)],
    armFront: [arm('front', sleeves), tuft(55.6, 70)],
    torso: [
      shape(torsoPath('broad', { bottom: 92 }), fur),
      shape(fringe, fur),
      stroke('M38 66 q1.4 3 0 6 M44 74 q1.4 3 0 6 M50 66 q1.4 3 0 6 M54 80 q1.4 3 0 6', furDark, 0.9),
      shape('M31.8 58 Q36 54.6 41 55.4 L42 91 Q36.4 92.4 31.6 90.6 Q29.6 74 31.8 58 Z', 'cat'),
      shape('M60.2 58 Q56 54.6 51 55.4 L50 91 Q55.6 92.4 60.4 90.6 Q62.4 74 60.2 58 Z', 'cat'),
      shade('M60.2 58 Q56 54.6 51 55.4 L50 91 Q55.6 92.4 60.4 90.6 Q62.4 74 60.2 58 Z', '#000000', 0.1),
      box(33.4, 74, 7, 7, 'cat-dark', { rx: 1 }), box(51.6, 74, 7, 7, 'cat-dark', { rx: 1 }),
      stroke('M35.4 74 V69.4 M37.8 74 V70.6', METAL, 1.4), dot(55, 77.4, 1.1, '#fbbf24'),
      stroke('M41 56 V90 M51 56 V90', 'cat-dark', 0.8),
    ],
    held: held ? HELD[held]() : null,
    headScale: 1.14,
    head: {
      back: [dot(33.6, 27.4, 5, fur), dot(33.6, 27.4, 2.4, furDark, { stroke: 'none' }), dot(58.4, 27.4, 5, fur), dot(58.4, 27.4, 2.4, furDark, { stroke: 'none' })],
      base: [dot(46, 40, 15.6, fur), shape('M33 31 l2 -6 l2.4 4 l2.4 -6.4 l2.4 5 l2.6 -6.4 l2.4 6 l2.8 -5.6 l2 5.4 l2.8 -4.6 l1.2 6.6 Q46 26.4 33 31 Z', fur),
        shape('M31.4 46 l-3 1.4 l2 -3.4 l-3.4 -0.4 l3 -2.4', fur)],
      features: [blob(49.6, 47, 8.6, 6.2, furLight, { 'stroke-width': 0.6 }), blob(52.4, 43.4, 2.8, 2, '#2b1d14')],
      eyes: { anchors: [[42.6, 39.4], [51.4, 39.4]], style: 'toon', color: '#1f1308' },
      brows: furDark,
      mouth: { anchor: [49.4, 48.6] },
      hat: headgear === 'goggles'
        ? [stroke('M30.4 32.6 Q46 25 61.6 31', '#3f2a1a', 2.6), dot(40.8, 29.6, 4.2, '#f59e0b', { stroke: '#3f2a1a', 'stroke-width': 1.6, 'fill-opacity': 0.9 }),
          dot(51.4, 28.6, 4.2, '#f59e0b', { stroke: '#3f2a1a', 'stroke-width': 1.6, 'fill-opacity': 0.9 }), path('M39 28 l2.2 -1.6 M49.6 27 l2.2 -1.6', 'none', { stroke: '#fff7ed', 'stroke-width': 1 })]
        : headgear === 'headset'
          ? [stroke('M31 41 Q29.6 21 46 20.6 Q62.4 21 61.2 37', '#3f3f46', 2.6), blob(31, 42.4, 4.2, 5.4, '#3f3f46'), dot(31, 42.4, 1.8, '#9ca3af', { 'stroke-width': 0.5 }),
            stroke('M32.6 47.6 Q36 54 43.6 53.6', '#3f3f46', 1.3), dot(44.2, 53.4, 1.7, '#111827')]
          : null,
    },
  };
}

// ---------------------------------------------------------------------------
// Furniture (world-layout.js ART sizes)
// ---------------------------------------------------------------------------

/** Diagonal hazard stripes (amber on dark) in a box. */
function hazardBand(x, y, width, height, step = 7) {
  const stripes = [];
  for (let left = x; left + step / 2 <= x + width; left += step) {
    const end = left + step / 2;
    stripes.push(`M${round(left)} ${y + height} L${round(end)} ${y + height} L${round(Math.min(end + height * 0.7, x + width))} ${y} L${round(Math.min(left + height * 0.7, x + width))} ${y} Z`);
  }
  return [rect(x, y, width, height, '#2f2a24'), path(stripes.join(' '), HAZARD)];
}

/** A cargo crate with metal corners and a painted marking (no text). */
function crate(x, y, width, height, color, marking = 'band') {
  const edge = darker(color, 0.35);
  return [
    rect(x, y, width, height, color, { rx: 1.6, stroke: edge, 'stroke-width': 1 }),
    rect(x + 2.4, y + 2.4, width - 4.8, height - 4.8, 'none', { stroke: darker(color, 0.15), 'stroke-width': 0.8 }),
    ...[[x, y], [x + width - 4, y], [x, y + height - 4], [x + width - 4, y + height - 4]].map(([cx, cy]) => rect(cx, cy, 4, 4, '#8a8f94', { rx: 0.8 })),
    marking === 'band' && rect(x + 2.4, y + height * 0.42, width - 4.8, height * 0.16, HAZARD, { 'fill-opacity': 0.75 }),
    marking === 'ring' && circle(x + width / 2, y + height / 2, Math.min(width, height) * 0.2, 'none', { stroke: '#f5efe0', 'stroke-width': 1.4, 'stroke-opacity': 0.8 }),
    marking === 'chevron' && path(`M${x + width * 0.3} ${y + height * 0.35} L${x + width * 0.5} ${y + height * 0.55} L${x + width * 0.7} ${y + height * 0.35}`, 'none', { stroke: '#f5efe0', 'stroke-width': 1.6, 'stroke-opacity': 0.8 }),
  ];
}

const decor = {
  // A heavy sliding blast door: two halves with ribs and hazard stripes, a status light and a keypad.
  door: () => [
    path('M-2 92 V14 L9 3 H41 L52 14 V92 Z', '#8a7a64', { stroke: '#4e4436', 'stroke-width': 1.2 }),
    path('M3 92 V16 L11 8 H39 L47 16 V92 Z', '#3a342c'),
    rect(6, 14, 18.6, 74, '#b8a888', { stroke: '#6e6250', 'stroke-width': 1 }), rect(25.4, 14, 18.6, 74, '#b0a080', { stroke: '#6e6250', 'stroke-width': 1 }),
    path('M8 24 H22.6 M8 34 H22.6 M8 44 H22.6 M27.4 24 H42 M27.4 34 H42 M27.4 44 H42', 'none', { stroke: '#8f8064', 'stroke-width': 1.4 }),
    path('M24.6 14 V88 M25.4 14 V88', 'none', { stroke: '#2a251f', 'stroke-width': 0.9 }),
    ...hazardBand(6, 62, 38, 12),
    rect(6, 78, 38, 10, '#9a8a6c', { stroke: '#6e6250', 'stroke-width': 0.8 }),
    rect(19, 3.4, 12, 3.6, '#f87171', { rx: 1.2, class: 'p-blink-led' }),
    rect(46.6, 40, 5.4, 12, '#2f2a24', { rx: 1 }), circle(49.3, 43.4, 1, '#4ade80', { class: 'p-blink-dot' }), circle(49.3, 47.6, 1, '#fbbf24'),
    rect(-4, 88, 58, 4, '#6e6250', { rx: 1 }),
  ],
  // Stacked cargo crates, a barrel and a bundle of fuel hose.
  shelf: () => [
    ...crate(1, 54, 36, 38, '#b89b6a', 'band'),
    rect(40, 56, 22, 36, '#9a4a2a', { rx: 3, stroke: '#5e2a16', 'stroke-width': 1 }),
    path('M40 62 H62 M40 74 H62 M40 86 H62', 'none', { stroke: '#5e2a16', 'stroke-width': 1.6 }), ellipse(51, 56.4, 11, 2.6, '#b85a34', { stroke: '#5e2a16', 'stroke-width': 1 }),
    ...crate(5, 24, 32, 30, '#8a8f94', 'ring'),
    ...crate(38, 36, 22, 20, '#c4733a', 'chevron'),
    ...crate(11, 6, 20, 18, SAND, 'band'),
    circle(48, 28, 6.4, 'none', { stroke: '#3f3f46', 'stroke-width': 2.6 }), circle(48, 28, 3.4, 'none', { stroke: '#3f3f46', 'stroke-width': 2 }),
    path('M1 70 L37 60 M1 60 L37 70', 'none', { stroke: '#4a3a2a', 'stroke-width': 1.2, 'stroke-opacity': 0.6 }),
  ],
  // A hangar bench of crates: tall crates behind, low crates with woven blankets as the three seats.
  sofa: () => [
    ...crate(8, 6, 44, 32, '#8a8f94', 'ring'),
    ...crate(54, 2, 42, 36, '#b89b6a', 'chevron'),
    ...crate(98, 8, 44, 30, '#a8905f', 'band'),
    ...crate(2, 36, 48, 26, '#c9b080', null), ...crate(51, 36, 48, 26, '#bfa576', null), ...crate(100, 36, 48, 26, '#c9b080', null),
    ...[[34, '#b45309'], [75, '#0f766e'], [116, '#9f1239']].flatMap(([x, color]) => [
      rect(x - 19, 29, 38, 10, color, { rx: 3, stroke: darker(color, 0.35), 'stroke-width': 1 }),
      path(`M${x - 17} 32 H${x + 17} M${x - 17} 35.6 H${x + 17}`, 'none', { stroke: '#f5e6c8', 'stroke-width': 1, 'stroke-dasharray': '3 2' }),
      path(`M${x - 15} 39 v4 M${x - 9} 39 v4 M${x - 3} 39 v4 M${x + 3} 39 v4 M${x + 9} 39 v4 M${x + 15} 39 v4`, 'none', { stroke: color, 'stroke-width': 1.2 }),
    ]),
    rect(0, 60, 150, 6, '#6e6250', { rx: 1.4 }),
  ],
  // A landing-pad marking: concentric rings, a dashed circle and four chevrons pointing in.
  rug: () => [
    ellipse(100, 20, 98, 18.6, '#b9a476', { 'fill-opacity': 0.9 }),
    ellipse(100, 20, 90, 16.4, 'none', { stroke: '#e07a3a', 'stroke-width': 3, 'stroke-opacity': 0.75 }),
    ellipse(100, 20, 70, 12.6, 'none', { stroke: '#f2e6c8', 'stroke-width': 1.6, 'stroke-dasharray': '7 5', 'stroke-opacity': 0.85 }),
    ellipse(100, 20, 40, 7.2, 'none', { stroke: '#e07a3a', 'stroke-width': 2.2, 'stroke-opacity': 0.7 }),
    ellipse(100, 20, 14, 2.6, '#e07a3a', { 'fill-opacity': 0.6 }),
    path('M20 20 l10 -4 l0 8 Z M180 20 l-10 -4 l0 8 Z M100 4.6 l-7 2.6 h14 Z M100 35.4 l-7 -2.6 h14 Z', '#f2e6c8', { 'fill-opacity': 0.85 }),
    path('M40 12 q20 -2 30 1 M128 30 q18 1 30 -3', 'none', { stroke: '#a08a5a', 'stroke-width': 2, 'stroke-opacity': 0.5, 'stroke-linecap': 'round' }),
  ],
  // A cantina drink tap: tanks of glowing drinks, three taps, a glass filling up on the counter.
  coffee: () => [
    rect(6, 6, 44, 50, '#7a7f86', { rx: 4, stroke: '#3f3f46', 'stroke-width': 1.2 }),
    path('M10 4 H46 L50 8 H6 Z', '#5b6068'),
    ...[[17, '#38bdf8'], [28, '#a3e635'], [39, '#fb923c']].flatMap(([x, color], index) => [
      circle(x, 22, 7.6, '#1f2937', { stroke: '#cbd5e1', 'stroke-width': 1.2 }),
      path(`M${x - 7} ${23 + index} A7.6 7.6 0 0 0 ${x + 7} ${23 + index} Z`, color, { class: index === 1 ? 'p-glow' : null }),
      circle(x - 2, 25.6, 0.9, '#ffffff', { 'fill-opacity': 0.8, class: 'cooler-bubble' }),
      rect(x - 1.6, 40, 3.2, 7, '#cbd5e1', { rx: 1 }), rect(x - 2.2, 33, 4.4, 7.6, color, { rx: 1.2, stroke: darker(color, 0.4), 'stroke-width': 0.6 }),
    ]),
    path('M28 47 V53', 'none', { stroke: '#a3e635', 'stroke-width': 1.6, class: 'p-pour' }),
    rect(2, 56, 52, 36, '#5e4128', { rx: 2, stroke: '#3f2a1a', 'stroke-width': 1.2 }),
    rect(0, 54, 56, 5, '#8a6a44', { rx: 1.4, stroke: '#3f2a1a', 'stroke-width': 1 }),
    path('M24.4 53.6 L25 45.4 H31 L31.6 53.6 Z', '#e0f2fe', { 'fill-opacity': 0.55, stroke: '#94a3b8', 'stroke-width': 0.7 }), rect(25, 49, 6, 4.4, '#a3e635', { 'fill-opacity': 0.85 }),
    rect(6, 64, 44, 3, '#f472b6', { rx: 1.4, class: 'p-glow' }), rect(6, 80, 44, 3, '#38bdf8', { rx: 1.4, 'fill-opacity': 0.8 }),
    path('M10 70 H46 M10 75 H46', 'none', { stroke: '#4e3420', 'stroke-width': 1 }),
  ],
  // A moisture vaporator: a ringed tower with fins, a valve dripping into a canister.
  cooler: () => [
    path('M8 92 L14 80 M28 92 L22 80', 'none', { stroke: '#6e6250', 'stroke-width': 2.4, 'stroke-linecap': 'round' }),
    rect(11, 10, 14, 74, '#cfc8b6', { rx: 3, stroke: '#6e6250', 'stroke-width': 1.1 }),
    path('M13 10 Q18 1 23 10 Z', '#b8b0a0', { stroke: '#6e6250', 'stroke-width': 1 }), line(18, 4, 18, -2, '#6e6250', 1.2), circle(18, -2.6, 1.4, '#f87171', { class: 'p-blink-dot' }),
    ...[18, 32, 48, 64].map(y => rect(9.4, y, 17.2, 4, '#9a917e', { rx: 1.2, stroke: '#6e6250', 'stroke-width': 0.8 })),
    path('M11 22 L4 28 L4 58 L11 62 Z M25 22 L32 28 L32 58 L25 62 Z', '#b8b0a0', { stroke: '#6e6250', 'stroke-width': 0.9 }),
    path('M6 34 H10 M6 42 H10 M6 50 H10 M26 34 H30 M26 42 H30 M26 50 H30', 'none', { stroke: '#8a826e', 'stroke-width': 0.9 }),
    path('M14 26 V58', 'none', { stroke: '#f2ecdd', 'stroke-width': 1.4, 'stroke-linecap': 'round', 'stroke-opacity': 0.8 }),
    rect(24, 70, 9, 3.4, METAL, { rx: 1 }), path('M31.6 73.4 V79', 'none', { stroke: '#7dd3fc', 'stroke-width': 1.3, 'stroke-dasharray': '1.6 1.8', class: 'p-pour' }),
    rect(26.6, 79, 9, 12, '#8a8f94', { rx: 1.4, stroke: '#4b5563', 'stroke-width': 0.8 }), rect(27.6, 83, 7, 7, '#7dd3fc', { 'fill-opacity': 0.75 }),
  ],
  // 0: a cluster of spiky desert succulents in a clay pot (the lounge corner); 1: a ribbed column plant with glowing pods in a canister (by the door).
  plant: variant => variant % 2 === 0
    ? [
      ...[[22, 4], [10, 14], [34, 14], [4, 28], [40, 28], [16, 10], [28, 10]].map(([x, y], index) =>
        path(`M22 46 Q${x - 4} ${y + 12} ${x} ${y} Q${x + 4} ${y + 12} 22 46 Z`, index % 2 ? '#8fae6a' : '#6f9a5a', { stroke: '#4a6a3a', 'stroke-width': 0.8 })),
      path('M22 44 V20', 'none', { stroke: '#a8c47a', 'stroke-width': 1, 'stroke-opacity': 0.6 }),
      circle(22, 4, 2.2, '#f472b6', { stroke: '#9d174d', 'stroke-width': 0.6 }),
      path('M7 44 H37 L33 70 H11 Z', '#b8693a', { stroke: '#7a3a1a', 'stroke-width': 1.2 }),
      rect(5, 42, 34, 5, '#c97a4a', { rx: 1.6, stroke: '#7a3a1a', 'stroke-width': 1 }),
      path('M11 54 L15 50 L19 54 L23 50 L27 54 L31 50 L34 53', 'none', { stroke: '#f2d2a8', 'stroke-width': 1.2 }),
    ]
    : [
      path('M17 54 V12 Q17 4 22 4 Q27 4 27 12 V54 Z', '#6f9a5a', { stroke: '#3f5a2e', 'stroke-width': 1 }),
      path('M19.6 10 V54 M22 6 V54 M24.4 10 V54', 'none', { stroke: '#4f7a3e', 'stroke-width': 0.8 }),
      path('M17 34 H11 Q8 34 8 30 V20 Q8 16 11 16 Q14 16 14 20 V28 H17 Z', '#7aa463', { stroke: '#3f5a2e', 'stroke-width': 1 }),
      path('M27 40 H33 Q36 40 36 36 V26 Q36 22 33 22 Q30 22 30 26 V34 H27 Z', '#7aa463', { stroke: '#3f5a2e', 'stroke-width': 1 }),
      circle(11, 15, 2.6, '#fb923c', { stroke: '#9a3412', 'stroke-width': 0.6, class: 'p-glow' }), circle(33, 21, 2.6, '#fb923c', { stroke: '#9a3412', 'stroke-width': 0.6 }),
      circle(22, 3.4, 2.4, '#f472b6', { stroke: '#9d174d', 'stroke-width': 0.6 }),
      rect(10, 52, 24, 18, '#8a8f94', { rx: 2, stroke: '#4b5563', 'stroke-width': 1 }),
      ...hazardBand(10, 60, 24, 4, 6),
      rect(8, 50, 28, 4, '#6b7280', { rx: 1.2 }),
    ],
};

// ---------------------------------------------------------------------------
// Stations (viewBox 68 20 72 96, floor at y = 112)
// ---------------------------------------------------------------------------

const stations = {
  // A holographic map table: a round table on a pedestal, a cone of light, a turning planet with an orbit and a ship's route.
  holotable: () => [
    path('M94 112 L98 92 H118 L122 112 Z', '#7a7f86', { stroke: '#3f3f46', 'stroke-width': 1 }),
    rect(96, 100, 24, 3, '#5b6068'),
    ellipse(108, 88, 32, 6.4, '#9aa0a8', { stroke: '#3f3f46', 'stroke-width': 1.1 }),
    ellipse(108, 86.6, 28, 4.6, '#2b3038'),
    ...[-24, -12, 0, 12, 24].map((dx, index) => circle(108 + dx, 87.4 + Math.abs(dx) * -0.05, 0.9, index % 2 ? '#38bdf8' : '#fbbf24', { class: index === 2 ? 'p-blink-led' : null })),
    path('M100 86 L82 36 H134 L116 86 Z', HOLO, { 'fill-opacity': 0.12 }),
    group('p-holo', [
      circle(108, 56, 13, HOLO, { 'fill-opacity': 0.18, stroke: HOLO, 'stroke-width': 1 }),
      ellipse(108, 56, 13, 4.6, 'none', { stroke: HOLO, 'stroke-width': 0.7 }), ellipse(108, 56, 5.6, 13, 'none', { stroke: HOLO, 'stroke-width': 0.7 }),
      ellipse(108, 56, 22, 6.4, 'none', { stroke: '#bae6fd', 'stroke-width': 0.7, 'stroke-dasharray': '2 2', transform: 'rotate(-14 108 56)' }),
      circle(127.4, 51.4, 2.2, '#bae6fd'), circle(89, 62, 1.6, '#fbbf24'),
    ]),
    path('M89 62 Q100 74 116 66 Q124 62 127.4 51.4', 'none', { stroke: '#fbbf24', 'stroke-width': 0.9, 'stroke-dasharray': '1.6 1.4', class: 'p-screen-line' }),
    path('M86 40 H130 M85 46 H131', 'none', { stroke: HOLO, 'stroke-width': 0.5, 'stroke-opacity': 0.5 }),
  ],
  // A droid repair bench: an opened dome head with wires, a spare arm, a welding torch with sparks, spanners on a rack.
  workbench: () => [
    rect(118, 30, 20, 40, '#8a7a64', { rx: 1.6, stroke: '#4e4436', 'stroke-width': 1 }),
    ...[124, 130, 135].map((x, index) => [line(x, 36, x, 54 + index * 3, METAL, 1.6), circle(x, 35, 2, 'none', { stroke: METAL, 'stroke-width': 1.4 })]),
    circle(127, 63, 3.6, '#2f2a24', { stroke: METAL, 'stroke-width': 1 }), path('M127 60 V66 M124 63 H130', 'none', { stroke: '#9aa0a8', 'stroke-width': 1, class: 'p-dial' }),
    rect(72, 84, 64, 6, '#8a7a64', { rx: 1.4, stroke: '#4e4436', 'stroke-width': 1 }),
    rect(75, 90, 5, 22, '#6e6250', { rx: 1 }), rect(128, 90, 5, 22, '#6e6250', { rx: 1 }), rect(78, 102, 52, 3, '#7a6a52', { rx: 1 }),
    ...crate(84, 104, 14, 8, '#c4733a', null),
    path('M86 84 Q86 64 102 64 Q118 64 118 84 Z', '#e7e1d3', { stroke: '#6b7280', 'stroke-width': 1.1 }),
    path('M86 80 H118', 'none', { stroke: '#2563eb', 'stroke-width': 3 }),
    rect(93, 70, 16, 6, '#111827', { rx: 2.6 }), circle(98, 73, 1.2, '#22d3ee', { class: 'p-blink-led' }), circle(104, 73, 1.2, '#22d3ee'),
    path('M100 64 Q104 58 112 60 Q118 62 114 66', '#cfc8b6', { stroke: '#6b7280', 'stroke-width': 1 }),
    path('M108 68 Q114 74 120 72 M110 72 Q116 80 124 80', 'none', { stroke: '#ef4444', 'stroke-width': 1.1 }), path('M112 70 Q118 76 126 76', 'none', { stroke: '#fbbf24', 'stroke-width': 1.1 }),
    line(76, 83, 84, 80, '#4b5563', 2.4), rect(73, 82, 6, 3, '#4b5563', { rx: 1 }),
    line(84, 80, 92, 72, '#9aa0a8', 1.4),
    ...[[92, 70.6], [89.4, 68], [94.8, 68.4]].map(([x, y]) => path(`M${x} ${y - 2.2} l0.7 1.5 l1.5 0.7 l-1.5 0.7 l-0.7 1.5 l-0.7 -1.5 l-1.5 -0.7 l1.5 -0.7 Z`, '#fde047', { class: 'p-spark' })),
    circle(92, 72, 2.4, '#fef3c7', { 'fill-opacity': 0.6, class: 'p-glow' }),
  ],
};

export default Object.freeze({
  archetypes: { knight: starKnight, pilot, smuggler, droid, trader: alienTrader, copilot: furryCopilot },
  decor,
  stations,
});
