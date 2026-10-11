// Dinosaur park: an expedition camp in a prehistoric jungle valley - paleontologists in pith helmets,
// park rangers with radios, and friendly dinosaur folk on two legs (a feathered raptor, a horned frill,
// a duck-bill with a crest, a baby long-neck) - and the camp's furniture: a canvas tent, a fossil shelf,
// a log bench under ferns, a kettle over the campfire, a canvas water bag, cycads and tree ferns.
// Original designs for this app: the feel of the genre, no characters or designs from books or films.
// Coordinates: figure-kit.js (characters), world-layout.js ART (furniture), viewBox 68 20 72 96 (stations).

import { circle, darker, ellipse, lighter, line, path, rect, svg } from '../svg-kit.js';
import {
  BEARD, HAIR, arm, belt, blob, box, dot, headBase, leg, limb, nose, pick, pickWeighted, rngOf, shade, shape,
  stroke, torsoPath,
} from '../figure-kit.js';

const TOON_EYES = Object.freeze({ anchors: [[43, 41], [52, 41]], style: 'toon' });
const WOOD = '#9a6a3c';
const WOOD_DARK = '#6e4a28';
const BRASS = '#e0b84a';
const STEEL = '#a7b0ba';
const BONE = '#efe4c8';
const CANVAS = '#d6c08e';
const BARK = '#7a5534';
const FERN = '#4f8a34';
const FERN_LIGHT = '#6fae4a';
const NAILS = '#f4ecd8';

const HUMAN_SKINS = ['#f6d7bd', '#efc8a6', '#e2b38c', '#d29f74', '#b9845a', '#8f5f3c'];
const HAIR_COLORS = ['#2b1d14', '#4a3020', '#7a4a26', '#b8792f', '#d9c08a', '#1f1a17', '#8f8a84'];

// ---------------------------------------------------------------------------
// Small drawing helpers
// ---------------------------------------------------------------------------

const fixed = value => Math.round(value * 10) / 10;

/** Points along a quadratic curve (start, control, end), with the direction of the curve at each one. */
function curvePoints([x1, y1], [cx, cy], [x2, y2], count) {
  return Array.from({ length: count }, (_, index) => {
    const t = (index + 1) / (count + 1);
    const x = (1 - t) ** 2 * x1 + 2 * (1 - t) * t * cx + t ** 2 * x2;
    const y = (1 - t) ** 2 * y1 + 2 * (1 - t) * t * cy + t ** 2 * y2;
    const dx = 2 * (1 - t) * (cx - x1) + 2 * t * (x2 - cx);
    const dy = 2 * (1 - t) * (cy - y1) + 2 * t * (y2 - cy);
    return { x, y, t, angle: Math.atan2(dy, dx) };
  });
}

/** A fern frond: a curved stem with leaflets on both sides, shorter towards the tip. */
function frond(start, control, end, { leaflets = 8, length = 6, color = FERN, width = 1.6, extra = {} } = {}) {
  const leafPath = curvePoints(start, control, end, leaflets).map(({ x, y, t, angle }) => {
    const size = length * (1 - 0.6 * t);
    return [-1, 1].map(side => {
      const direction = angle + side * 1.05;
      return `M${fixed(x)} ${fixed(y)} l${fixed(Math.cos(direction) * size)} ${fixed(Math.sin(direction) * size)}`;
    }).join(' ');
  }).join(' ');
  return [
    stroke(`M${start.join(' ')} Q${control.join(' ')} ${end.join(' ')}`, darker(color, 0.2), width * 0.75, extra),
    stroke(leafPath, color, width, extra),
  ];
}

/** Round reading glasses over the eye anchors. */
const roundGlasses = (color = '#3b2a1c') => [
  circle(43, 41, 3.7, '#e8f4fa', { 'fill-opacity': 0.25, stroke: color, 'stroke-width': 1 }),
  circle(52.4, 41, 3.7, '#e8f4fa', { 'fill-opacity': 0.25, stroke: color, 'stroke-width': 1 }),
  stroke('M46.7 40.6 Q47.7 39.8 48.7 40.6 M39.3 40.4 L33.4 39.4', color, 1),
];

/** Aviator sunglasses over the eye anchors. */
const sunglasses = () => [
  shape('M38.6 38.6 H46.6 Q46.6 44.6 42.6 44.6 Q38.6 44.6 38.6 38.6 Z', '#2b2f36'),
  shape('M48 38.6 H56 Q56 44.6 52 44.6 Q48 44.6 48 38.6 Z', '#2b2f36'),
  stroke('M46.6 39.2 H48 M38.6 39 L33.4 38.4', '#2b2f36', 1.1),
  stroke('M40.2 40.2 L42 39.6 M49.6 40.2 L51.4 39.6', '#9fb3c8', 0.8),
];

// ---------------------------------------------------------------------------
// Things held in the back hand (at about (34,83); they swing with the arm). The hand is drawn again on
// top, so it grips the handle.
// ---------------------------------------------------------------------------

const HELD = {
  notebook: hand => [box(27.2, 76.4, 10.4, 13.6, '#7a4a2a', { rx: 1.2 }), stroke('M36.4 77.6 V88.8', '#f3ead2', 1.3),
    stroke('M27.4 81.6 H37.4', '#3b2a1c', 0.9), limb(38.6, 74, 38.6, 84, 1, '#e0b84a'), dot(34, 83, 3.4, hand)],
  hammer: hand => [limb(34, 92, 34, 66, 2, WOOD), shape('M26.4 63.2 Q34 61.8 41.8 63 L42 67.2 Q34 66.6 27.6 67.8 Z', STEEL),
    shape('M26.6 63.4 L21 66.8 L27.6 67.6 Z', STEEL), dot(34, 83, 3.4, hand)],
  brush: hand => [limb(34, 90, 34, 75, 2.2, '#c9a064'), box(32, 71, 4, 4.4, '#b0b8c0', { rx: 0.6 }),
    shape('M31.4 71.4 L30.6 63.6 Q34 61.6 37.4 63.6 L36.6 71.4 Z', '#4a3a2e'), dot(34, 83, 3.4, hand)],
  bone: hand => [limb(29, 98, 39.4, 66, 3.6, BONE),
    ...[[29, 98], [39.4, 66]].flatMap(([x, y]) => [dot(x - 2, y + 0.6, 2.6, BONE), dot(x + 2, y - 0.6, 2.6, BONE)]),
    dot(34, 83, 3.4, hand)],
  magnifier: hand => [limb(34, 89, 34, 74, 2.2, '#5a3b22'), circle(34, 67, 6.2, '#d6f0fa', { 'fill-opacity': 0.55, stroke: '#8a7a5a', 'stroke-width': 1.9 }),
    stroke('M30.6 64.8 Q31.8 62.6 34 62.4', '#ffffff', 1.1), dot(34, 83, 3.4, hand)],
  radio: hand => [limb(31.4, 75, 31.4, 63.6, 1.3, '#1f2937'), box(28.8, 73, 8.6, 14, '#2f353d', { rx: 1.8 }),
    box(30.2, 75, 5.8, 4.2, '#9ad0a8', { rx: 0.6 }), stroke('M30.4 81.4 H36 M30.4 83.4 H36', '#5a636e', 0.7),
    dot(35.6, 72.4, 1, '#ef4444', { class: 'p-antenna' }), dot(34, 84.8, 3.3, hand)],
  flashlight: hand => [limb(34, 91, 34, 75, 3.6, '#3b4048'), shape('M30.8 75.4 L30.2 68 H37.8 L37.2 75.4 Z', '#3b4048'),
    ellipse(34, 68, 3.8, 1.3, '#fff4c2', { class: 'p-glow' }), dot(34, 83, 3.4, hand)],
  rope: hand => [circle(30.6, 86, 6.4, 'none', { stroke: '#a8834a', 'stroke-width': 3 }), circle(30.6, 86, 6.4, 'none', { stroke: '#d6b67a', 'stroke-width': 1.6 }),
    circle(30.6, 86, 3.4, 'none', { stroke: '#c9a064', 'stroke-width': 1.4 }), stroke('M35 91 Q36 98 33 104', '#c9a064', 1.4), dot(34, 83, 3.4, hand)],
  lantern: hand => [line(34, 84, 34, 90, '#6b7280', 0.9), box(30.5, 90, 7, 9, '#f6d77a', { rx: 1.4, class: 'p-glow' }),
    stroke('M30.5 90 H37.5 M34 90 V99', '#5a4a3a', 0.9), shape('M30 90 L34 87.4 L38 90 Z', '#5a4a3a'), dot(34, 83, 3.2, hand)],
  frond: hand => [...frond([34, 86], [33, 70], [25, 54], { leaflets: 7, length: 5.4, color: FERN_LIGHT, width: 1.7 }), dot(34, 83, 3.2, hand)],
  leaf: hand => [stroke('M34 84 L31.6 72', '#4e7a2a', 1.3), shape('M31.6 72.4 Q23 67 26.4 57.6 Q35.4 59.6 36 68 Q35 71.6 31.6 72.4 Z', FERN_LIGHT),
    stroke('M31.4 71.4 Q29.6 64.6 27.6 60', '#4e8a32', 0.8), dot(34, 83, 3, hand)],
};

// ---------------------------------------------------------------------------
// Dinosaur limbs and tails
// ---------------------------------------------------------------------------

/** A dinosaur's arm from the shoulder to a clawed hand (at about the kit's hand). */
function clawArm(side, { skin, width = 5, claws = NAILS }) {
  const [shoulderX, shoulderY] = side === 'back' ? [37, 62] : [55, 62];
  const sign = side === 'back' ? -1 : 1;
  const elbow = [shoulderX + sign * 1.4, 72];
  const wrist = [shoulderX + sign * 2.8, 80.6];
  return [
    limb(shoulderX, shoulderY, ...elbow, width, skin),
    limb(...elbow, ...wrist, width - 0.8, skin),
    dot(wrist[0], wrist[1] + 1.6, width * 0.62, skin),
    stroke(`M${wrist[0] - 1.8} ${wrist[1] + 3.4} l-0.6 2 M${wrist[0]} ${wrist[1] + 4} l0 2.2 M${wrist[0] + 1.8} ${wrist[1] + 3.4} l0.6 2`, claws, 1),
  ];
}

/**
 * A dinosaur's leg from the hip. style: 'raptor' (a bent ankle, a raised sickle claw), 'stomp' (a thick
 * pillar on a round foot with nails) or 'runner' (a strong thigh and a three-toed foot).
 */
function dinoLeg(side, style, { skin, width = 8, nails = NAILS }) {
  const hipX = side === 'back' ? 41 : 51;
  const x = offset => fixed(hipX + offset);
  if (style === 'raptor') {
    return [
      limb(hipX, 88, x(3.4), 97.4, width, skin),
      limb(x(3.4), 97.4, x(0.4), 106.4, width * 0.6, skin),
      shape(`M${x(-3.6)} 111.8 Q${x(-3.4)} 106.6 ${x(0.4)} 105.6 Q${x(4.6)} 106 ${x(8.6)} 109.4 Q${x(10)} 112.4 ${x(6.6)} 112.6 H${x(-2.4)} Q${x(-3.8)} 112.6 ${x(-3.6)} 111.8 Z`, skin),
      stroke(`M${x(8.8)} 110.6 l1.6 0.8 M${x(6.4)} 109 l1.6 0.6`, nails, 1),
      shape(`M${x(-1)} 106.8 Q${x(0.6)} 102.6 ${x(3.8)} 103.2 Q${x(1.6)} 104.6 ${x(0.8)} 107.6 Z`, nails),
    ];
  }
  if (style === 'runner') {
    return [
      limb(hipX, 88, x(2.4), 98, width, skin),
      limb(x(2.4), 98, x(0.6), 107, width * 0.66, skin),
      shape(`M${x(-3.6)} 112.4 Q${x(-3.6)} 107.4 ${x(0.6)} 106.2 Q${x(5.2)} 106.8 ${x(8)} 110.2 Q${x(8.6)} 112.6 ${x(5.8)} 112.6 Z`, skin),
      stroke(`M${x(8.2)} 111.6 h1.2 M${x(5.2)} 112.4 h1.2 M${x(2.2)} 112.6 h1.2`, nails, 1.4),
    ];
  }
  return [
    limb(hipX, 88, x(-0.4), 103, width, skin),
    blob(x(1), 108.6, width * 0.78, 3.9, skin),
    ...[-2.2, 1, 4.2].map(offset => dot(x(offset), 110.8, 1, nails, { 'stroke-width': 0.5 })),
  ];
}

// ---------------------------------------------------------------------------
// Archetypes (looks: figure-kit.js composeFigure)
// ---------------------------------------------------------------------------

/** A paleontologist: a pith helmet or a bush hat, a khaki shirt, a vest in the category color, binoculars, a field tool. */
function paleontologist(look) {
  const random = rngOf(look);
  const skin = pick(HUMAN_SKINS, random);
  const hairColor = pick(HAIR_COLORS, random);
  const shirt = pick(['#ece0bf', '#e2d3a8', '#f3ead2', '#d6c79c'], random);
  const pants = pick(['#a8956a', '#8f7f58', '#b9a77a', '#7a7454'], random);
  const kerchief = pick(['#b23a2a', '#7a2e1e', '#2f4f6e', '#c9772a', '#3f5f3a'], random);
  const hatStyle = pickWeighted([['pith', 55], ['bush', 30], [null, 15]], random);
  const hatColor = hatStyle === 'pith' ? pick(['#efe4c6', '#e2d2a6', '#f6f0e0', '#d9c79a'], random) : pick(['#8a6a42', '#a07a48', '#6b5a3a'], random);
  const hair = HAIR[pick(['shortCrop', 'shaggy', 'braids', 'topKnot', 'curlyMop', 'longStraight'], random)](hairColor);
  const facial = pickWeighted([[null, 55], ['stubble', 18], ['short', 15], ['mustache', 12]], random);
  const glasses = random() < 0.3;
  const shorts = random() < 0.55;
  const held = pickWeighted([['notebook', 26], ['hammer', 22], ['brush', 18], ['bone', 16], ['magnifier', 12], [null, 6]], random);
  const legs = shorts
    ? { trousers: pants, length: 'short', lower: skin, feet: 'boot', shoes: '#6b4a2e', cuff: '#efe6d0', width: 7 }
    : { trousers: pants, feet: 'boot', shoes: '#5a3e26', width: 7 };
  const sleeves = { style: 'rolled', sleeve: shirt, hand: skin };
  const hat = hatStyle === 'pith'
    ? [shape('M26.4 34.4 Q46 27.4 65.6 34.4 Q67.2 36.8 63.6 37.2 Q46 32.4 28.4 37.2 Q24.8 36.8 26.4 34.4 Z', hatColor),
      shape('M31.6 33.6 Q31 18.4 46 17 Q61 18.4 60.4 33.6 Q46 30.6 31.6 33.6 Z', hatColor),
      stroke('M31.8 30.4 Q46 27.4 60.2 30.4', darker(hatColor, 0.35), 2.4),
      stroke('M38 21.4 Q42 19 46 18.8', '#ffffff', 1.2, { 'stroke-opacity': 0.6 }), dot(46, 17.4, 1.5, hatColor)]
    : hatStyle === 'bush'
      ? [shape('M33 33 Q32.4 21 40 20.2 Q46 22.4 52 20.2 Q59.6 21 59 33 Z', hatColor),
        shape('M25.6 35.6 Q46 29 68 35.2 Q67.2 38.8 63 38 Q46 33.8 29 38.4 Q24.8 38.2 25.6 35.6 Z', hatColor),
        stroke('M33.4 30.6 Q46 28.2 58.6 30.6', '#4a3626', 2), stroke('M46 20.4 V25', darker(hatColor, 0.25), 0.9)]
      : null;
  return {
    shadowWidth: 17,
    legBack: leg('back', legs),
    legFront: leg('front', legs),
    armBack: arm('back', sleeves),
    armFront: arm('front', sleeves),
    torso: [
      shape(torsoPath('regular'), shirt),
      stroke('M46 60 V88', darker(shirt, 0.18), 0.8),
      shape('M34.4 57.6 Q37.6 55.4 41.6 56 L44.8 66 L44.6 92.4 Q39 93.4 34.8 91.6 Q32.8 75 34.4 57.6 Z', 'cat'),
      shape('M57.6 57.6 Q54.4 55.4 50.4 56 L47.2 66 L47.4 92.4 Q53 93.4 57.2 91.6 Q59.2 75 57.6 57.6 Z', 'cat'),
      shade('M50.4 56 L47.2 66 L47.4 92.4 Q53 93.4 57.2 91.6 Q59.2 75 57.6 57.6 Q54.4 55.4 50.4 56 Z', '#000000', 0.1),
      box(36.4, 77.4, 7, 7.4, 'cat-dark', { rx: 1 }), box(48.8, 77.4, 7, 7.4, 'cat-dark', { rx: 1 }),
      box(36.8, 63.6, 6.4, 2.6, 'cat-dark', { rx: 0.8 }), box(49, 63.6, 6.4, 2.6, 'cat-dark', { rx: 0.8 }),
    ],
    overTorso: [
      shape('M39.4 55 Q46 59.6 52.6 55 L50.6 59.6 Q46 62.6 41.4 59.6 Z', kerchief),
      stroke('M41.8 57.6 Q43 64 44 68.6 M50.2 57.6 Q49 64 48 68.6', '#3b2a1c', 1),
      box(40.8, 68.2, 5, 7.6, '#3a3f45', { rx: 1.5 }), box(46.2, 68.2, 5, 7.6, '#3a3f45', { rx: 1.5 }),
      box(44.6, 70, 2.8, 3.2, '#2a2e33', { rx: 0.6 }),
      stroke('M42 74.8 H44.6 M47.4 74.8 H50', '#9fc3d6', 1.1),
    ],
    held: HELD[held]?.(skin) ?? null,
    headScale: 1,
    head: {
      back: hair.back,
      base: headBase(skin),
      features: nose(skin),
      eyes: TOON_EYES,
      brows: darker(hairColor, 0.1),
      beforeMouth: facial === 'stubble' || facial === 'short' ? BEARD[facial](hairColor) : null,
      mouth: { anchor: [47.6, 47.8] },
      front: [hair.front, facial === 'mustache' ? BEARD.mustache(hairColor) : null],
      eyewear: glasses ? roundGlasses() : null,
      hat,
    },
  };
}

/** A park ranger: a shirt in the category color with pockets and a badge, olive cargo trousers, a campaign hat or a cap, a radio. */
function ranger(look) {
  const random = rngOf(look);
  const skin = pick(HUMAN_SKINS, random);
  const hairColor = pick(HAIR_COLORS, random);
  const trousers = pick(['#5f6b3a', '#4f5a36', '#6b6a48', '#55603f'], random);
  const hatStyle = pickWeighted([['campaign', 50], ['cap', 32], [null, 18]], random);
  const hatColor = hatStyle === 'campaign' ? pick(['#b08a4a', '#9a7a44', '#7a7448'], random) : pick(['#5f6b3a', '#4a5434', '#8a7a52'], random);
  const shades = random() < 0.35;
  const facial = pickWeighted([[null, 55], ['mustache', 15], ['short', 15], ['stubble', 15]], random);
  const held = pickWeighted([['radio', 45], ['flashlight', 25], ['rope', 20], [null, 10]], random);
  const shortSleeves = random() < 0.5;
  const hair = HAIR[pick(['shortCrop', 'shaggy', 'braids', 'longStraight', 'topKnot'], random)](hairColor);
  const legs = { trousers, feet: 'tallboot', shoes: '#3b2c22', width: 7.4 };
  const sleeves = shortSleeves ? { style: 'short', sleeve: 'cat', hand: skin } : { sleeve: 'cat', hand: skin, cuff: 'cat-dark' };
  const hat = hatStyle === 'campaign'
    ? [blob(46, 32.4, 21.4, 3.9, hatColor),
      shape('M35.4 32.2 Q35.8 24 38.6 19.6 Q42 16.4 46 17.6 Q50 16.4 53.4 19.6 Q56.2 24 56.6 32.2 Z', hatColor),
      stroke('M46 17.8 V23.4 M41.2 19 L43.4 23.8 M50.8 19 L48.6 23.8', darker(hatColor, 0.3), 0.9),
      stroke('M35.8 30 Q46 31.8 56.2 30', '#4a3626', 2.2)]
    : hatStyle === 'cap'
      ? [shape('M31 37.4 A15 15 0 0 1 61 36 Q46 32.6 31 37.4 Z', hatColor),
        shape('M57 34.2 Q66.4 33.4 70.4 36.4 Q64.4 38.8 56.6 37.6 Z', darker(hatColor, 0.12)), dot(46, 22.6, 1.3, darker(hatColor, 0.2))]
      : null;
  return {
    shadowWidth: 17,
    legBack: leg('back', legs),
    legFront: [leg('front', legs), box(50, 92.6, 4.6, 5.4, darker(trousers, 0.14), { rx: 0.8 })],
    armBack: arm('back', sleeves),
    armFront: arm('front', sleeves),
    torso: [
      shape(torsoPath('regular'), 'cat'),
      stroke('M46 60 V86', 'cat-dark', 1.2),
      shape('M36.6 63.4 H43.6 V70.4 H36.6 Z', 'cat'), shape('M36.2 62.4 H44 L43.4 65.2 H36.8 Z', 'cat-dark'),
      shape('M48.4 63.4 H55.4 V70.4 H48.4 Z', 'cat'), shape('M48 62.4 H55.8 L55.2 65.2 H48.6 Z', 'cat-dark'),
      shape('M39 66.6 l1.8 -0.8 l1.8 0.8 l-0.2 2.6 l-1.6 1.4 l-1.6 -1.4 Z', BRASS),
      stroke('M34.8 57.8 L40.4 56.6 M57.2 57.8 L51.6 56.6', 'cat-dark', 2.2),
      belt('regular', 85.4, '#3b2c22', '#c0c6cc'),
    ],
    overTorso: [shape('M40 55 L46 60.4 L42.4 62 Z', 'cat-dark'), shape('M52 55 L46 60.4 L49.6 62 Z', 'cat-dark')],
    held: HELD[held]?.(skin) ?? null,
    headScale: 1,
    head: {
      back: hair.back,
      base: headBase(skin),
      features: nose(skin),
      eyes: TOON_EYES,
      brows: darker(hairColor, 0.1),
      beforeMouth: facial === 'stubble' || facial === 'short' ? BEARD[facial](hairColor) : null,
      mouth: { anchor: [47.6, 47.8] },
      front: [hair.front, facial === 'mustache' ? BEARD.mustache(hairColor) : null],
      eyewear: shades ? sunglasses() : null,
      hat,
    },
  };
}

/** A small feathered raptor: a long toothy grin, a crest of feathers, a striped tail, a bandana in the category color. */
function raptor(look) {
  const random = rngOf(look);
  const [skin, belly, stripes] = pick([
    ['#c9a45a', '#f1dfb0', '#8a6a2e'], ['#5f9a7a', '#d6e8c4', '#3a6a50'], ['#c46a3e', '#f3d2a8', '#8a3e1e'],
    ['#7f8f4a', '#e3e2b0', '#4f5a2a'], ['#6f7fa0', '#dfe3ef', '#45506e'],
  ], random);
  const crest = random() < 0.75 ? pick(['#e34a3a', '#f2b234', '#3a8fd9', '#f4f1ea', '#7a3fb0', '#2f9e6a'], random) : null;
  const held = pickWeighted([[null, 55], ['bone', 25], ['magnifier', 20]], random);
  const stripe = darker(stripes, 0.05);
  return {
    shadowWidth: 22,
    behind: [
      shape('M40 78 Q26 72 14 68 Q6 65.6 1.4 68.4 Q6 71.4 13 75.4 Q24 83 38 92 Z', skin),
      stroke('M30 74.4 l-2.4 4.6 M22 71.4 l-2.2 4.4 M14.6 69 l-1.8 3.6', stripe, 1.6),
    ],
    legBack: dinoLeg('back', 'raptor', { skin: darker(skin, 0.06), width: 8.4 }),
    legFront: dinoLeg('front', 'raptor', { skin, width: 8.4 }),
    armBack: clawArm('back', { skin: darker(skin, 0.06), width: 4.6 }),
    armFront: clawArm('front', { skin, width: 4.6 }),
    torso: [
      shape('M40.6 58 Q38.6 50 41 45 L53 46 Q52.6 52 55 58 Z', skin),
      shape('M36 61 Q38 54 46 54 Q55 54 57 62 Q60 76 56 88 Q50 95 42 94 Q34 92 33.6 82 Q33 70 36 61 Z', skin),
      shape('M47 58 Q55 60 55.6 72 Q55.6 84 51 90 Q46 92 44 88 Q48.4 76 47 58 Z', belly),
      stroke('M35.4 66 l4.4 1.4 M34.4 72.4 l4.6 1 M34.2 79 l4.6 0.4', stripe, 1.6),
    ],
    overTorso: [
      shape('M38.6 55.4 Q46 60.4 54.6 55 L52.6 61.4 Q48 70 46.2 72 Q44 70 40.6 61.4 Z', 'cat'),
      stroke('M42 61.6 Q46 63.6 51 61.2', 'cat-dark', 0.9),
      dot(53.6, 56.6, 2.3, 'cat-dark'), shape('M54.6 56.4 L60 60.2 L57.2 61.8 Z', 'cat-dark'),
    ],
    held: HELD[held]?.(skin) ?? null,
    headScale: 1,
    head: {
      back: crest && [
        shape('M38 30 Q30 21 22.6 22.6 Q28.6 26 33 33 Z', crest), shape('M34.6 35 Q25 31 19.6 34 Q25.6 36 31.6 39.4 Z', crest),
        shape('M42.4 28.4 Q39 18.6 32.4 16 Q35 22.4 37.4 30 Z', darker(crest, 0.1)),
      ],
      base: [
        shape('M31 41 Q30 29 42 27 Q52 25.6 58 31 Q62 34 67.6 36.6 Q71 38.6 69.4 42.4 Q67.6 45.6 62 46.6 L54 48.6 Q46 52 38 50.4 Q31.6 48.4 31 41 Z', skin),
        shape('M38 50.4 Q46 52 54 48.6 L62 46.6 Q58.6 50 52.6 51.8 Q44.4 54.6 38 50.4 Z', belly),
        stroke('M39 28.6 l2.2 4.2 M44.6 27.2 l1.8 4.2 M50 27.6 l1.2 3.8', stripe, 1.5),
      ],
      features: [dot(66.6, 38.4, 0.95, darker(skin, 0.55)), stroke('M55.4 48.2 l0.6 1.6 l0.8 -1.6 l0.8 1.4 l0.8 -1.6', '#ffffff', 0.7)],
      eyes: { anchors: [[45.6, 37.4], [53.2, 36.8]], style: 'toon' },
      brows: darker(skin, 0.45),
      mouth: { anchor: [57.6, 44.6], width: 1.15 },
      cheeks: '#f0a08a',
    },
  };
}

/** A horned frill dinosaur: a scalloped frill, two brow horns and a beak, stocky legs, a backpack in the category color. */
function horned(look) {
  const random = rngOf(look);
  const [skin, belly, frill, spots] = pick([
    ['#d08a48', '#f2d6a8', '#b5552e', '#f2c14a'], ['#7f9f62', '#e3e6bf', '#c9733a', '#f4d35e'],
    ['#7086a6', '#dbe3ee', '#d0a23a', '#7a3f6e'], ['#b56a4a', '#f0cfb0', '#5f8a5a', '#e8d07a'],
    ['#8a72a6', '#e6dcef', '#e08a3a', '#f6d26a'],
  ], random);
  const held = pickWeighted([[null, 50], ['lantern', 20], ['leaf', 30]], random);
  const knobs = Array.from({ length: 10 }, (_, index) => {
    const angle = ((18 + index * 23) * Math.PI) / 180;
    return dot(fixed(35 + Math.cos(angle) * 17.4), fixed(31 - Math.sin(angle) * 17.4), 2.8, frill);
  });
  return {
    shadowWidth: 22,
    behind: [
      shape('M38 80 Q22 82 11 95 Q8 100.4 13 100 Q25 96 39 94 Z', skin),
      shape('M17 60 Q17.6 55.4 23 55.2 L36 56 L37 90 L22.6 90.4 Q16.4 89.6 16.6 82 Z', 'cat'),
      shape('M16.8 63 Q17.6 57 23 56.8 L35.6 57.4 L35.8 66 Q26 68 16.8 66.6 Z', 'cat-dark'),
      box(19, 73, 9.6, 9.6, 'cat-dark', { rx: 1.6 }),
      box(17.4, 47.6, 19, 8.2, '#b9925a', { rx: 4 }), stroke('M22 47.8 V55.6 M31 47.8 V55.6', '#6b4a2e', 1.4),
    ],
    legBack: dinoLeg('back', 'stomp', { skin: darker(skin, 0.07), width: 10 }),
    legFront: dinoLeg('front', 'stomp', { skin, width: 10 }),
    armBack: clawArm('back', { skin: darker(skin, 0.07), width: 7 }),
    armFront: clawArm('front', { skin, width: 7 }),
    torso: [
      shape(torsoPath('round'), skin),
      shape('M46.4 59 Q56.6 61 58.4 74 Q59 86 53 91.6 Q47 93 45 89 Q49.4 76 46.4 59 Z', belly),
      stroke('M47.6 66.6 H56 M48.2 73.6 H57.6 M48 80.6 H57.4 M47 87 H54.6', darker(belly, 0.18), 0.9),
      stroke('M38.4 56.6 Q41 70 38.4 88 M53.8 56.6 Q56 63 56.4 68', 'cat-dark', 2.8),
      stroke('M39.6 67.4 Q47 69.6 55.6 66.4', 'cat-dark', 2),
    ],
    held: HELD[held]?.(skin) ?? null,
    headScale: 1,
    head: {
      back: [
        ...knobs,
        circle(35, 31, 17.4, frill, { stroke: darker(frill, 0.45), 'stroke-width': 0.9 }),
        circle(35, 31, 12.6, 'none', { stroke: darker(frill, 0.2), 'stroke-width': 1.2 }),
        dot(29, 22.6, 3.2, spots), dot(24.4, 31.4, 2.6, spots),
      ],
      base: [
        shape('M31 42 Q30.4 28 44 26.6 Q56 26 61 34 Q63.4 38 66.6 41 Q68 46 63.4 48.6 Q58 52.6 48 53 Q35 53.6 31.6 47 Z', skin),
        shape('M61 37.4 Q67.6 38.8 69 44.2 Q66.6 46.2 63.4 44.8 Q63.6 40.8 61 37.4 Z', darker(skin, 0.38)),
        shape('M36 49.6 Q46 54.6 58 50.6 Q54 53.4 46 53.6 Q39 53.4 36 49.6 Z', belly),
      ],
      features: [
        shape('M58.6 33.6 Q60.6 26.6 64.2 24.6 Q63.4 30.2 62.2 35.4 Z', NAILS),
        shape('M41.2 30.6 Q43 20.6 50.4 15.2 Q48 22.6 46.2 31.2 Z', NAILS),
        shape('M49.4 30.6 Q53.6 22.4 60 19.6 Q56.8 25.4 53.8 32 Z', NAILS),
        dot(64, 41, 0.9, darker(skin, 0.6)),
      ],
      eyes: { anchors: [[44.4, 39.6], [52.2, 39.2]], style: 'toon' },
      brows: darker(skin, 0.45),
      mouth: { anchor: [54, 47.6], width: 0.85 },
      cheeks: '#f0a08a',
    },
  };
}

/** A duck-billed dinosaur: a long tube crest, a flat bill, a striped tail, an explorer vest in the category color. */
function duckbill(look) {
  const random = rngOf(look);
  const [skin, belly, crest] = pick([
    ['#6fa75a', '#e4ebc0', '#d1563a'], ['#4f9a9e', '#dceee6', '#f0b43a'], ['#c8a14a', '#f4e6bc', '#3f7f8a'],
    ['#b9674a', '#f3d5b8', '#5a7a9e'], ['#9a86c2', '#ece6f6', '#5aa26a'],
  ], random);
  const bill = lighter(skin, 0.42);
  const held = pickWeighted([[null, 45], ['frond', 35], ['lantern', 20]], random);
  const stripe = darker(skin, 0.22);
  return {
    shadowWidth: 22,
    behind: [
      shape('M37 74 Q22 70 8 74 Q1.6 76 2.6 79.6 Q12 79.6 22 83.6 Q30 88 38 90 Z', skin),
      stroke('M28 73.4 l-1.2 4.8 M19 73 l-0.8 4.6 M10.6 74.6 l-0.4 3.6', stripe, 1.6),
    ],
    legBack: dinoLeg('back', 'runner', { skin: darker(skin, 0.07), width: 9.4 }),
    legFront: dinoLeg('front', 'runner', { skin, width: 9.4 }),
    armBack: clawArm('back', { skin: darker(skin, 0.07), width: 5.4 }),
    armFront: clawArm('front', { skin, width: 5.4 }),
    torso: [
      shape('M40.4 58 Q39.4 50 41.6 46 L53 46.6 Q52.4 52 55.4 58 Z', skin),
      shape(torsoPath('regular', { bottom: 93 }), skin),
      shape('M46.6 58 Q55.6 59.4 57 70 Q57.6 84 53 91 Q47.4 93.4 45.4 89 Q49.4 76 46.6 58 Z', belly),
      shape('M34.4 58.6 Q37.6 56 41.4 56.4 L44.6 66 L44.4 92 Q39 93.4 35 91.8 Q32.8 75 34.4 58.6 Z', 'cat'),
      shape('M57.6 58.6 Q54.4 56 50.6 56.4 L48.6 66 L49 92 Q53.4 93.4 57.2 91.8 Q59.2 75 57.6 58.6 Z', 'cat'),
      box(36.2, 75.4, 7, 7.4, 'cat-dark', { rx: 1 }), box(49.8, 75.4, 6.6, 7.4, 'cat-dark', { rx: 1 }),
      stroke('M37 70 H43 M50.4 70 H56', 'cat-dark', 1.2),
    ],
    held: HELD[held]?.(skin) ?? null,
    headScale: 1,
    head: {
      back: [
        shape('M41 31 Q32 22 20 15.6 Q14.6 12.6 13.6 16 Q13.4 19.4 18.4 21.6 Q29 27 35 37 Z', crest),
        stroke('M38.4 29.6 Q28.4 22 18 17.4', lighter(crest, 0.35), 1.5),
      ],
      base: [
        shape('M31 42 Q30 28 44 27 Q54 27 58 34 Q60 37 66 37.4 Q72 38 72.4 42.6 Q72 47 66 47.6 Q60 48.6 55 50.4 Q46 54 38 51 Q31.6 48.4 31 42 Z', skin),
        shape('M57 36.8 Q60 37.4 66 37.4 Q72 38 72.4 42.6 Q72 47 66 47.6 Q61 48 57.4 47 Q59.4 42 57 36.8 Z', bill),
        shape('M37 50.4 Q46 53.6 55 50.4 Q50 53.8 45 54 Q40 53.6 37 50.4 Z', belly),
        stroke('M38.6 29.6 l1.4 4 M44 28.2 l1 4', stripe, 1.4),
      ],
      features: dot(68.4, 39.8, 0.9, darker(bill, 0.5)),
      eyes: { anchors: [[44.6, 38.4], [52, 38]], style: 'toon' },
      brows: darker(skin, 0.45),
      mouth: { anchor: [61.6, 44.6], width: 0.9 },
      cheeks: '#f0a08a',
    },
  };
}

/** A baby long-neck: a long neck under a small round head, a big belly, stubby legs, a scarf in the category color, maybe an eggshell cap. */
function babyNeck(look) {
  const random = rngOf(look);
  const [skin, belly, spots] = pick([
    ['#8ab06a', '#e6eec8', '#5f8a46'], ['#7fa6c8', '#e3eef6', '#5a7fa6'], ['#c8a2c8', '#f4e6f2', '#9a72a0'],
    ['#d9a86a', '#f6e4c4', '#b07a3e'], ['#9ac2a8', '#e8f3ea', '#6a9a7e'],
  ], random);
  const eggshell = random() < 0.4;
  const held = pickWeighted([[null, 60], ['leaf', 40]], random);
  const stubbyArm = (x1, x2, hand) => [limb(x1, 71, x2, 81.4, 5.8, skin), dot(hand, 84, 3.2, skin),
    stroke(`M${hand - 1.6} 86.4 l-0.4 1 M${hand + 1.4} 86.4 l0.4 1`, NAILS, 1)];
  return {
    shadowWidth: 21,
    behind: shape('M34 94 Q20 99 8 107 Q4 110.6 9 111 Q22 109 38 102 Z', skin),
    legBack: dinoLeg('back', 'stomp', { skin: darker(skin, 0.07), width: 9.4 }),
    legFront: dinoLeg('front', 'stomp', { skin, width: 9.4 }),
    armBack: stubbyArm(39.4, 36.2, 36),
    armFront: stubbyArm(54.2, 57.6, 57.8),
    torso: [
      shape('M42 46 L51.6 46 Q51 58 54 66 Q61.6 72 62.4 85 Q63.4 99 54 103.4 Q46 106 38 103.4 Q29 99 30 85 Q31 72 39.6 66 Q42.6 58 42 46 Z', skin),
      shape('M48.6 48 L51.6 47.6 Q51.2 58 53.8 66 Q61 72 58 85 Q58.6 96 51.4 100 Q46.4 101.6 44.6 98 Q49.4 88 48.4 68 Q48.6 57 48.6 48 Z', belly),
      stroke('M50 74 H57.6 M50.4 81 H58.4 M49.6 88 H57.6 M48 94.6 H54.6', darker(belly, 0.16), 0.9),
      dot(35.6, 80, 2.2, spots, { 'stroke-width': 0 }), dot(34.4, 88, 1.8, spots, { 'stroke-width': 0 }), dot(38.4, 72.6, 1.6, spots, { 'stroke-width': 0 }),
    ],
    overTorso: [
      shape('M40.2 57.6 Q47 60.8 53.8 57.2 L55.2 63.4 Q47.4 67.4 39 64.2 Z', 'cat'),
      stroke('M43.4 59.4 L43 65.4 M47.6 60 L47.6 66 M51.6 59.4 L52 65.2', 'cat-dark', 1.1),
      shape('M41.4 64 L37.6 77.4 L42.8 78.2 L44.8 65.2 Z', 'cat'),
      stroke('M38.2 78.2 l-0.4 2 M40.4 78.4 v2 M42.4 78.6 l0.4 2', 'cat-dark', 1),
    ],
    held: HELD[held]?.(skin) ?? null,
    headScale: 1,
    head: {
      base: shape('M35.6 39.6 Q35.6 28.6 46 28 Q55.6 28 58 33.4 Q62.6 34.4 63.6 39 Q64 44.4 57.6 46 Q51.6 48.4 44.4 48.4 Q35.8 48 35.6 39.6 Z', skin),
      features: [dot(61.4, 37.6, 0.85, darker(skin, 0.55)), dot(38, 32.6, 1.6, spots, { 'stroke-width': 0 }), dot(41.6, 30.4, 1.2, spots, { 'stroke-width': 0 })],
      eyes: { anchors: [[45.6, 38.6], [52.8, 38.2]], style: 'toon' },
      brows: darker(skin, 0.45),
      mouth: { anchor: [55, 43.2], width: 0.75 },
      cheeks: '#f6a6b2',
      hat: eggshell && [
        shape('M36.6 32.2 Q37 22.4 46.4 21.4 Q56 22.4 56.6 31.6 L53.8 29.4 L51.2 32.6 L48.2 29 L45.2 32.6 L42.2 29 L39.6 32.4 Z', '#f8f2e2'),
        dot(42, 25.6, 0.9, '#c9b98a', { 'stroke-width': 0 }), dot(50, 24.6, 1.1, '#c9b98a', { 'stroke-width': 0 }),
      ],
    },
  };
}

// ---------------------------------------------------------------------------
// Furniture (world-layout.js ART sizes)
// ---------------------------------------------------------------------------

const decor = {
  // An expedition tent with its flaps tied back, a lantern at the entrance, a crate and a fern.
  door: () => [
    ellipse(25, 91, 28, 3.2, '#000000', { 'fill-opacity': 0.16 }),
    stroke('M25 9 L-3.4 74 M25 9 L53.4 74', '#8a7a5a', 0.8),
    stroke('M-4.4 73 l2 4.6 M54.4 73 l-2 4.6', '#5a4030', 1.6),
    path('M25 6 L50.6 91 H-0.6 Z', CANVAS, { stroke: '#8a7448', 'stroke-width': 1.2, 'stroke-linejoin': 'round' }),
    path('M25 6 L50.6 91 H25 Z', '#000000', { 'fill-opacity': 0.09 }),
    path('M25 8 L13 52 M25 8 L37 52', 'none', { stroke: '#b9a26e', 'stroke-width': 0.9 }),
    path('M25 28 L39.6 91 H10.4 Z', '#33281a'),
    path('M25 34 L35 91 H15 Z', '#241c12'),
    path('M25 28 L10.4 91 L4.4 91 Q12 60 25 28 Z', '#e6d4a6', { stroke: '#8a7448', 'stroke-width': 0.9 }),
    path('M25 28 L39.6 91 L45.6 91 Q38 60 25 28 Z', '#cbb27e', { stroke: '#8a7448', 'stroke-width': 0.9 }),
    path('M5.6 63 Q9 60 12.4 62.6 M37.6 62.6 Q41 60 44.4 63', 'none', { stroke: '#7a5a34', 'stroke-width': 1.6, 'stroke-linecap': 'round' }),
    line(25, 0.6, 25, 8, WOOD_DARK, 1.6), path('M25 0.8 L33.4 3.2 L25 5.4 Z', '#c0392b', { stroke: '#8a2a20', 'stroke-width': 0.6 }),
    path('M36 34.6 H41.6 V38.6', 'none', { stroke: '#4b5563', 'stroke-width': 1 }),
    rect(38.8, 38.6, 5.6, 7.6, '#ffd97a', { rx: 1.2, stroke: '#5a4a3a', 'stroke-width': 0.8, class: 'p-glow' }),
    circle(41.6, 42.4, 6.4, '#ffe9a6', { 'fill-opacity': 0.3, class: 'p-glow' }),
    rect(38.4, 79, 13, 12, '#a0703a', { rx: 0.8, stroke: '#6a4622', 'stroke-width': 1 }),
    path('M38.4 85 H51.4 M44.9 79 V91', 'none', { stroke: '#6a4622', 'stroke-width': 0.9 }),
    ...frond([3, 91], [0, 82], [-3, 74], { leaflets: 6, length: 4.6, color: FERN_LIGHT, width: 1.6 }),
    ...frond([5, 91], [8, 82], [13, 77], { leaflets: 5, length: 4.2, color: FERN, width: 1.6 }),
  ],
  // A camp shelf of rough planks: a toothy skull, an ammonite, a trilobite, amber, bones and a crate.
  shelf: () => [
    rect(2, 8, 60, 84, '#8a6440', { rx: 1.6, stroke: '#5a3e24', 'stroke-width': 1.2 }),
    rect(6, 12, 52, 76, '#5e4228'),
    path('M6 24 H58 M6 50 H58 M6 76 H58', 'none', { stroke: '#4e3620', 'stroke-width': 0.8 }),
    rect(4, 36, 56, 3.4, '#a07a4a', { stroke: '#5a3e24', 'stroke-width': 0.6 }),
    rect(4, 62, 56, 3.4, '#a07a4a', { stroke: '#5a3e24', 'stroke-width': 0.6 }),
    path('M8 35.6 Q7.4 25 16 22.6 Q24 20.4 31 25 L41.6 27.6 Q46 29.2 44.4 32.6 L34 33.4 Q28 36 22 35.6 Z', BONE, { stroke: '#a8987a', 'stroke-width': 0.9 }),
    circle(18.6, 27.6, 2.8, '#3a2a1a'), ellipse(27.6, 28.4, 2.2, 1.4, '#3a2a1a'), circle(41, 29.4, 0.9, '#3a2a1a'),
    path('M25 33.6 l1 2 l1 -2 l1 2 l1 -2 l1 2 l1 -2 l1 1.8 l1 -1.8 l1 1.6 l1 -1.6', 'none', { stroke: '#a8987a', 'stroke-width': 0.7 }),
    circle(52, 28.4, 7, '#c9a87a', { stroke: '#8a6a44', 'stroke-width': 0.9 }),
    path('M52 28.4 m0 -1.6 a1.6 1.6 0 1 1 -1.6 1.6 a3.2 3.2 0 0 1 3.2 -3.2 a4.8 4.8 0 0 1 4.8 4.8 a6.4 6.4 0 0 1 -6.4 6.4', 'none', { stroke: '#8a6a44', 'stroke-width': 0.9 }),
    ellipse(17, 56, 8.4, 5.4, '#9a8a74', { stroke: '#6a5a46', 'stroke-width': 0.8 }),
    path('M10 54 Q17 52.4 24 54 M9.4 57 Q17 55.6 24.6 57 M10.4 60 Q17 58.8 23.6 60 M17 50.8 V61.2', 'none', { stroke: '#6a5a46', 'stroke-width': 0.7 }),
    path('M29 61.6 L31 52.6 L37.6 50.6 L40.6 56.4 L38 61.6 Z', '#f0a531', { 'fill-opacity': 0.9, stroke: '#b5701a', 'stroke-width': 0.8 }),
    path('M33.6 55 l1.4 1.4 l1.4 -1.4 M35 56.4 v2.2', 'none', { stroke: '#4a2a10', 'stroke-width': 0.8 }),
    path('M32 54 L34 52.4', 'none', { stroke: '#ffffff', 'stroke-opacity': 0.6, 'stroke-width': 0.9 }),
    line(44, 59.6, 55, 52.6, BONE, 2.4), circle(43.2, 58.8, 1.6, BONE), circle(44.6, 60.8, 1.6, BONE), circle(54.4, 51.6, 1.6, BONE), circle(55.8, 53.6, 1.6, BONE),
    rect(9, 72, 26, 14, '#b08048', { stroke: '#6e4a28', 'stroke-width': 0.9 }),
    path('M9 79 H35 M22 72 V86', 'none', { stroke: '#6e4a28', 'stroke-width': 0.8 }),
    path('M10 72 q3 -3 5 0 q3 -3 5 0 q3 -3 5 0 q3 -3 5 0 q2 -2.4 4 0', '#e2c46a', { stroke: '#b8963e', 'stroke-width': 0.6 }),
    line(38, 85, 54, 73, BONE, 3.2), circle(37, 84, 2.2, BONE), circle(39, 86.4, 2.2, BONE), circle(53.4, 71.6, 2.2, BONE), circle(55.6, 73.8, 2.2, BONE),
    path('M0 8 Q32 2 64 8 L62 11.4 Q32 6 2 11.4 Z', '#6e4a28', { stroke: '#4e3620', 'stroke-width': 0.9 }),
  ],
  // A fallen log as a bench, ferns fanned behind it like a backrest, moss and little mushrooms.
  sofa: () => [
    ...[[[30, 32], [8, 22], [-6, 14]], [[30, 32], [14, 6], [8, -8]], [[30, 32], [34, 6], [46, -8]],
      [[75, 30], [58, 4], [52, -12]], [[75, 30], [92, 4], [98, -12]], [[75, 30], [74, 4], [76, -16]],
      [[120, 32], [116, 6], [104, -8]], [[120, 32], [136, 6], [142, -8]], [[120, 32], [142, 22], [156, 14]]]
      .flatMap(([start, control, end], index) => frond(start, control, end, { leaflets: 10, length: 8, color: index % 2 ? FERN_LIGHT : FERN, width: 2.2 })),
    ellipse(75, 62.6, 72, 4, '#000000', { 'fill-opacity': 0.15 }),
    path('M20 46 H36 L38 63 H18 Z', '#6b4a2e', { stroke: '#4a3220', 'stroke-width': 1 }),
    path('M114 46 H130 L132 63 H112 Z', '#6b4a2e', { stroke: '#4a3220', 'stroke-width': 1 }),
    path('M10 27 H140 Q148 27 148 38.6 Q148 50.4 140 50.4 H10 Z', BARK, { stroke: '#4a3220', 'stroke-width': 1.3 }),
    path('M16 34 Q50 32 80 34.6 T136 33.4 M18 42 Q60 44 92 41.6 T138 43', 'none', { stroke: '#5a3e24', 'stroke-width': 1.1 }),
    path('M10 29 H140', 'none', { stroke: '#a07a4c', 'stroke-width': 1.6, 'stroke-linecap': 'round' }),
    ellipse(10, 38.7, 6.4, 11.6, '#d8b07a', { stroke: '#4a3220', 'stroke-width': 1.1 }),
    ellipse(10, 38.7, 4, 7.4, 'none', { stroke: '#b08850', 'stroke-width': 0.8 }),
    ellipse(10, 38.7, 1.8, 3.4, 'none', { stroke: '#b08850', 'stroke-width': 0.8 }),
    ...[[30, 27.6, 9], [62, 27.2, 7], [98, 27.6, 10], [128, 27.4, 6]].map(([cx, cy, rx]) => ellipse(cx, cy, rx, 2.2, '#7f9a52', { 'fill-opacity': 0.9 })),
    ...[[138, 24, 3.6, '#c0392b'], [143.4, 26, 2.6, '#d9572f']].flatMap(([x, y, r, cap]) => [
      rect(x - 0.8, y, 1.6, 4, '#f4ecd8'), path(`M${x - r} ${y + 0.6} Q${x} ${y - r * 1.4} ${x + r} ${y + 0.6} Z`, cap, { stroke: darker(cap, 0.3), 'stroke-width': 0.6 }),
      circle(x - r * 0.3, y - r * 0.3, 0.6, '#ffffff')]),
  ],
  // A woven reed mat.
  rug: () => [
    path('M14 6 H186 Q194 6 194 14 V26 Q194 34 186 34 H14 Q6 34 6 26 V14 Q6 6 14 6 Z', '#cdb47a', { stroke: '#8a6a3a', 'stroke-width': 1.4 }),
    path('M16 10 H184 Q190 10 190 16 V24 Q190 30 184 30 H16 Q10 30 10 24 V16 Q10 10 16 10 Z', 'none', { stroke: '#a88a4a', 'stroke-width': 1, 'stroke-dasharray': '3 2' }),
    path(Array.from({ length: 21 }, (_, index) => `M${18 + index * 8} 12 V28`).join(' '), 'none', { stroke: '#b89a5c', 'stroke-width': 1.6, 'stroke-dasharray': '2.4 2.4' }),
    path(Array.from({ length: 11 }, (_, index) => `M${30 + index * 14} 20 l4 -4 l4 4 l-4 4 Z`).join(' '), '#8a5a2e', { 'fill-opacity': 0.75 }),
    path('M6 12 h-4 M6 17 h-4 M6 22 h-4 M6 27 h-4 M194 12 h4 M194 17 h4 M194 22 h4 M194 27 h4', 'none', { stroke: '#a88a4a', 'stroke-width': 1.2, 'stroke-linecap': 'round' }),
  ],
  // A kettle hanging from a tripod over the campfire, tin mugs by the stones.
  coffee: () => [
    ellipse(28, 89.4, 27, 3.4, '#000000', { 'fill-opacity': 0.16 }),
    line(29, 84, 28, 9, '#5a3e24', 2.2),
    line(5, 90, 28, 8, '#7a5534', 2.6), line(51, 90, 28, 8, '#7a5534', 2.6),
    path('M25.6 9.6 L30.4 11.6 M25.6 12 L30.4 9.6', 'none', { stroke: '#c9a064', 'stroke-width': 1.2 }),
    path('M28 11 V41', 'none', { stroke: '#4b5563', 'stroke-width': 1.3, 'stroke-dasharray': '1.8 1' }),
    path('M16.6 46 Q28 31 39.4 46', 'none', { stroke: '#2b2f33', 'stroke-width': 1.4 }),
    path('M40 50.4 Q46 48.4 48.6 42.6 L50.6 43.6 Q48.4 52.6 40.8 56.4 Z', '#3f4448', { stroke: '#22272b', 'stroke-width': 0.8 }),
    path('M15 48 Q14 62.4 28 63.2 Q42 62.4 41 48 Q40 42.4 28 42 Q16 42.4 15 48 Z', '#3f4448', { stroke: '#22272b', 'stroke-width': 1 }),
    path('M18.4 47 Q19 56 24 59', 'none', { stroke: '#ffffff', 'stroke-opacity': 0.22, 'stroke-width': 1.6, 'stroke-linecap': 'round' }),
    ellipse(28, 43, 8.4, 2.2, '#55606a', { stroke: '#22272b', 'stroke-width': 0.7 }), circle(28, 40.8, 1.4, '#22272b'),
    path('M50 40 q-2.4 -4 0.6 -7.4 q3 -3.4 0 -7.4', 'none', { stroke: '#ffffff', 'stroke-opacity': 0.75, 'stroke-width': 1.6, 'stroke-linecap': 'round', class: 'p-steam' }),
    ellipse(28, 82, 13, 4.6, '#ffb347', { 'fill-opacity': 0.35, class: 'p-glow' }),
    line(15, 85.4, 41, 79, '#6b4a2e', 4), line(14, 79.4, 42, 86, '#5a3e24', 4),
    path('M18.4 83 Q19.4 73 24.4 68.4 Q24.4 74.4 27.4 76.6 Q29.4 66 34.6 61.6 Q35.6 72.6 38.6 83 Z', '#f59e0b', { class: 'flame' }),
    path('M23 83 Q24 77 27 74.6 Q28 79 30.4 79.4 Q31.4 74 34 71.6 Q34.6 78 35 83 Z', '#fde68a', { class: 'flame' }),
    ...[[8, 87.4, 4.4], [16, 89, 4], [40, 89, 4], [48, 87.4, 4.4], [28, 89.6, 4.6]].map(([cx, cy, rx]) => ellipse(cx, cy, rx, 2.6, '#8f8a80', { stroke: '#5f5a52', 'stroke-width': 0.8 })),
    ...[[1.6, '#2f6fb0'], [8.8, '#3f8a5a']].flatMap(([x, color]) => [
      rect(x, 79.6, 6, 7, color, { rx: 0.8, stroke: darker(color, 0.4), 'stroke-width': 0.7 }), ellipse(x + 3, 79.6, 3, 0.9, '#f4f4f0'),
      path(`M${x + 6} 81 q2.2 0.4 2 2.4 q-0.2 1.6 -2 1.6`, 'none', { stroke: darker(color, 0.4), 'stroke-width': 0.9 })]),
  ],
  // A canvas water bag hanging from a bamboo frame, its tap dripping into a tin basin, a canteen on a peg.
  cooler: () => [
    ellipse(18, 91, 18, 2.6, '#000000', { 'fill-opacity': 0.15 }),
    line(5, 92, 7, 8, '#a8924a', 3.4), line(31, 92, 29, 8, '#a8924a', 3.4),
    path('M4 30 h4.6 M4.6 52 h4.6 M5.2 74 h4.6 M27.6 30 h4.6 M27.4 52 h4.6 M26.8 74 h4.6', 'none', { stroke: '#7a6a2e', 'stroke-width': 1 }),
    line(3, 11.4, 33, 11.4, '#b8a25a', 3), path('M5 9.4 l4 4 M27 9.4 l4 4', 'none', { stroke: '#7a5a34', 'stroke-width': 1.2 }),
    path('M18 11.4 V19', 'none', { stroke: '#7a5a34', 'stroke-width': 1.3 }),
    path('M10 20 Q18 16 26 20 Q30.6 34 28.4 52 Q26.4 60.4 18 61.4 Q9.6 60.4 7.6 52 Q5.4 34 10 20 Z', '#c9b27a', { stroke: '#8a7448', 'stroke-width': 1.1 }),
    path('M8 44 Q18 47 28.6 44 Q28.6 50 28.4 52 Q26.4 60.4 18 61.4 Q9.6 60.4 7.6 52 Q7.6 48 8 44 Z', '#a8915e', { 'fill-opacity': 0.7 }),
    path('M18 18 V61 M9 28 Q18 31 27 28', 'none', { stroke: '#a38c5a', 'stroke-width': 0.8, 'stroke-dasharray': '1.6 1.2' }),
    rect(16.4, 60.4, 3.4, 4, STEEL, { stroke: '#6b7480', 'stroke-width': 0.6 }),
    path('M18 65 V74', 'none', { stroke: '#8ec5e8', 'stroke-width': 1.3, 'stroke-dasharray': '2 3', class: 'p-pour' }),
    rect(9, 80, 18, 12, '#7a5332', { rx: 1, stroke: '#4d321d', 'stroke-width': 0.9 }),
    ellipse(18, 80, 9, 1.8, '#a07a4a', { stroke: '#4d321d', 'stroke-width': 0.7 }),
    path('M10 74.6 H26 L24.6 80 H11.4 Z', STEEL, { stroke: '#6b7480', 'stroke-width': 0.8 }),
    ellipse(18, 74.8, 7.6, 1.5, '#8ec5e8'),
    circle(14, 76.8, 0.9, '#d6eefa', { class: 'cooler-bubble' }), circle(21, 76.8, 0.8, '#d6eefa', { class: 'cooler-bubble cooler-bubble-2' }),
    path('M32 30 Q35.4 34 33.6 40', 'none', { stroke: '#5a4030', 'stroke-width': 0.9 }),
    circle(33.4, 44, 4.6, '#5f6b3a', { stroke: '#3a4224', 'stroke-width': 0.9 }), rect(32.4, 38, 2, 2.4, '#3a4224'),
    path('M30.4 42 Q33 40.6 35.6 42', 'none', { stroke: '#8a9a5a', 'stroke-width': 0.8 }),
  ],
  // 0: a cycad on a nest of stones (the lounge corner); 1: a tree fern (by the door).
  plant: variant => variant % 2 === 0
    ? [
      ellipse(22, 68.4, 20, 2.4, '#000000', { 'fill-opacity': 0.15 }),
      svg('g', { class: 'p-sway' },
        ...[[[22, 40], [6, 30], [-2, 40]], [[22, 40], [8, 20], [2, 10]], [[22, 40], [18, 18], [16, 2]], [[22, 40], [28, 16], [32, 2]],
          [[22, 40], [38, 22], [44, 12]], [[22, 40], [40, 30], [48, 40]], [[22, 40], [14, 32], [6, 48]], [[22, 40], [32, 32], [40, 50]]]
          .flatMap(([start, control, end], index) => frond(start, control, end, { leaflets: 8, length: 5, color: index % 2 ? '#3f7a2e' : '#4f8a34', width: 1.8 }))),
      path('M14 70 L15.6 44 Q22 39.4 28.4 44 L30 70 Z', '#9a7440', { stroke: '#5a4224', 'stroke-width': 1 }),
      path('M15.4 50 L28.6 46 M15.2 56 L29 52 M15 62 L29.4 58 M15 68 L29.6 64 M15.6 46 L29 50 M15.2 52 L29.2 56 M15 58 L29.4 62 M14.8 64 L29.8 68', 'none', { stroke: '#6e5228', 'stroke-width': 0.8 }),
      ...[[8, 68, 6, '#8f8a80'], [36, 68, 6.4, '#7f7a70'], [22, 69, 5, '#a09a8e']].map(([cx, cy, rx, color]) => ellipse(cx, cy, rx, 3, color, { stroke: '#5f5a52', 'stroke-width': 0.8 })),
    ]
    : [
      ellipse(22, 68.6, 14, 2.2, '#000000', { 'fill-opacity': 0.15 }),
      path('M19.6 70 Q20.6 46 20.4 24 L23.8 24 Q23.6 46 25 70 Z', '#5a3e24', { stroke: '#3a2614', 'stroke-width': 0.9 }),
      path('M20.4 32 l3.4 1.4 M20.6 40 l3.4 1.4 M20.8 48 l3.6 1.4 M21 56 l3.6 1.4 M21.2 64 l3.8 1.4', 'none', { stroke: '#7a5a34', 'stroke-width': 1 }),
      svg('g', { class: 'p-sway p-sway-2' },
        ...[[[22, 24], [6, 12], [-4, 30]], [[22, 24], [36, 12], [48, 30]], [[22, 24], [10, 4], [2, 8]], [[22, 24], [34, 4], [42, 8]],
          [[22, 24], [16, 2], [12, -6]], [[22, 24], [28, 2], [32, -6]], [[22, 24], [4, 20], [0, 42]], [[22, 24], [40, 20], [44, 42]]]
          .flatMap(([start, control, end], index) => frond(start, control, end, { leaflets: 9, length: 4.6, color: index % 2 ? FERN_LIGHT : FERN, width: 1.7 }))),
      path('M22 24 q-1.6 -6 2 -7 q2.6 0.4 1 2.6', 'none', { stroke: '#7fae4a', 'stroke-width': 1.4, 'stroke-linecap': 'round' }),
    ],
};

// ---------------------------------------------------------------------------
// Stations (viewBox 68 20 72 96, floor at y = 112)
// ---------------------------------------------------------------------------

const stations = {
  // A dig site: a pit with a half-uncovered skeleton, grid strings on stakes, a sieve, a bucket and a flag.
  dig: () => [
    path('M70 104 Q72 96 82 95.6 L128 95.6 Q138 96 139.4 104 L138.4 110 Q136.6 114.4 128 114.4 L81 114.4 Q71.4 114.4 70.4 110 Z', '#a08a58', { stroke: '#6b5a34', 'stroke-width': 1 }),
    path('M74 104.6 Q75.4 99.6 83 99.4 L127 99.4 Q134.6 99.6 135.4 104.6 L134.6 108.6 Q133 111.6 127 111.6 L82 111.6 Q75 111.6 74.4 108.6 Z', '#6e5a34'),
    path('M84 106 Q92 101 100 106 M90 103.4 V109 M94 102.4 V109.6 M98 103 V109.4 M86.4 104.4 V108.4', 'none', { stroke: BONE, 'stroke-width': 1.6, 'stroke-linecap': 'round' }),
    path('M80 106.6 H104 M104 106.6 Q108 106 110 104.6', 'none', { stroke: BONE, 'stroke-width': 1.8, 'stroke-linecap': 'round', 'stroke-dasharray': '2.4 1' }),
    path('M110 106.8 Q110 100.4 116.6 100 Q122 99.6 126 102.6 L131 104 Q133 105.4 131.6 107 L124 107.4 Q118 109.4 113 108.6 Z', BONE, { stroke: '#a8987a', 'stroke-width': 0.8 }),
    circle(117.4, 103.2, 1.7, '#3a2a1a'), path('M120 107.4 l0.8 1.4 l0.8 -1.4 l0.8 1.4 l0.8 -1.4 l0.8 1.2', 'none', { stroke: '#a8987a', 'stroke-width': 0.6 }),
    path('M126 99 l0.7 1.5 l1.5 0.7 l-1.5 0.7 l-0.7 1.5 l-0.7 -1.5 l-1.5 -0.7 l1.5 -0.7 Z', '#fde047', { class: 'p-spark' }),
    line(72.4, 98, 72.4, 88, '#9a7a4a', 1.6), line(137, 98, 137, 88, '#9a7a4a', 1.6), line(105, 96, 105, 87.4, '#9a7a4a', 1.4),
    path('M72.4 89.6 Q88 91.6 105 89 Q121 91.6 137 89.6', 'none', { stroke: '#f4ecd8', 'stroke-width': 0.7 }),
    path('M105 87.6 L112 89.4 L105 91.2 Z', '#e34a3a'),
    line(93, 99, 98, 86, '#c9a064', 1.6), path('M96.6 86.4 L99.6 80.4 L101.8 81.6 L99.4 87.6 Z', '#4a3a2e'),
    path('M114 76 H136 L134 82 H116 Z', '#9a7a4a', { stroke: '#6b5a34', 'stroke-width': 0.9 }),
    path('M116 82 L114 96 M134 82 L136 96', 'none', { stroke: '#6b5a34', 'stroke-width': 1.6 }),
    path('M115.6 78.6 H134.4', 'none', { stroke: '#c9b98a', 'stroke-width': 2, 'stroke-dasharray': '1 1' }),
    path('M118 77.6 Q125 73.4 132 77.6 Z', '#8a7448'),
    svg('g', { class: 'p-steam' }, circle(120, 72.6, 2.4, '#e2d2a6', { 'fill-opacity': 0.8 }), circle(124.4, 70.4, 3, '#e2d2a6', { 'fill-opacity': 0.75 }), circle(129, 72.4, 2.2, '#e2d2a6', { 'fill-opacity': 0.7 })),
    path('M74 112 L76 100 H88 L90 112 Z', '#7f8a96', { stroke: '#4b5563', 'stroke-width': 0.9 }),
    ellipse(82, 100, 6, 1.6, '#6b5530'), path('M76 100 Q82 92 88 100', 'none', { stroke: '#4b5563', 'stroke-width': 1 }),
  ],
  // A nest of speckled eggs on a mound of twigs, one egg wobbling as it starts to hatch, a fern beside it.
  nest: () => [
    ...frond([132, 112], [138, 96], [130, 82], { leaflets: 8, length: 5.4, color: FERN, width: 1.8 }),
    ...frond([128, 112], [124, 98], [116, 90], { leaflets: 7, length: 5, color: FERN_LIGHT, width: 1.8 }),
    ellipse(106, 111.6, 30, 3.4, '#000000', { 'fill-opacity': 0.16 }),
    path('M78 100 Q80 92 106 91 Q132 92 134 100 Q132 111.4 106 112 Q80 111.4 78 100 Z', '#8a6a3a', { stroke: '#5a4224', 'stroke-width': 1 }),
    ellipse(106, 96, 24, 5.4, '#5a4224'),
    ...[[96, 86, 7, 9.4, '#f2e6c8', -12], [108, 84, 7.4, 10, '#d8ecd6', 4], [119, 87, 6.6, 8.8, '#f4dccc', 14]].flatMap(([cx, cy, rx, ry, color, tilt]) => [
      ellipse(cx, cy, rx, ry, color, { stroke: darker(color, 0.4), 'stroke-width': 0.9, transform: `rotate(${tilt} ${cx} ${cy})` }),
      circle(cx - 2, cy - 3, 1, darker(color, 0.3)), circle(cx + 2.4, cy + 1, 1.2, darker(color, 0.3)), circle(cx - 1, cy + 4, 0.8, darker(color, 0.3)),
      path(`M${cx - rx * 0.4} ${cy - ry * 0.5} q1 -2 3 -2.4`, 'none', { stroke: '#ffffff', 'stroke-opacity': 0.7, 'stroke-width': 1.1, 'stroke-linecap': 'round' }),
    ]),
    svg('g', { class: 'p-wobble' },
      ellipse(104, 92, 7.4, 9.6, '#efd9a6', { stroke: '#a88a4a', 'stroke-width': 0.9 }),
      path('M97.4 90 l2.4 2 l2 -2.6 l2.4 2.6 l2.2 -2.4 l2.2 2.2 l1.8 -1.8', 'none', { stroke: '#6b5a34', 'stroke-width': 0.9 }),
      circle(101.6, 87, 1.2, '#c9a86a'), circle(107, 95, 1.1, '#c9a86a')),
    path('M80 99 Q92 103 104 101 M108 102 Q120 102.6 132 99 M82 104 l8 2 M96 106 l10 -1 M114 105 l10 1 M79 96 l-4 -3 M133 96 l4 -3 M90 92 l-3 -4 M124 92 l3 -4', 'none', { stroke: '#a8854a', 'stroke-width': 1.2, 'stroke-linecap': 'round' }),
    path('M112 76 l0.6 1.4 l1.4 0.6 l-1.4 0.6 l-0.6 1.4 l-0.6 -1.4 l-1.4 -0.6 l1.4 -0.6 Z', '#fde047', { class: 'p-spark' }),
  ],
};

export default Object.freeze({
  archetypes: { paleontologist, ranger, raptor, horned, duckbill, babyNeck },
  decor,
  stations,
});
