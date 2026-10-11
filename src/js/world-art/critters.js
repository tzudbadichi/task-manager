// Creature trainers: a bright adventure route in the spirit of creature-collecting games - young
// trainers with caps, backpacks and capture capsules, a professor in a lab coat, and small original
// creatures (an ember gecko with a flame on its tail, a turtle pup with fin ears, a leaf sprite, a
// floating cloud puff) - and the route's furniture: the lab door, a capsule cabinet, a park bench, a
// berry-juice stand, a fountain, flower planters and a round battle circle.
// Original designs for this app: the feel of the genre, no creatures, capsules or logos from any game.
// Coordinates: figure-kit.js (characters), world-layout.js ART (furniture), viewBox 68 20 72 96 (stations).

import { circle, darker, ellipse, lighter, line, path, rect, svg } from '../svg-kit.js';
import {
  BEARD, HAIR, arm, blob, box, dot, headBase, leg, limb, longGarmentPath, nose, pick, pickWeighted, rngOf, shade,
  shape, stroke, torsoPath,
} from '../figure-kit.js';

const TOON_EYES = Object.freeze({ anchors: [[43, 41], [52, 41]], style: 'toon' });
const WOOD = '#b07a48';
const WOOD_DARK = '#7a5232';
const BRASS = '#e0b84a';
const STEEL = '#a7b0ba';
const LAB_COAT = '#f6f7f9';
const LAB_RED = '#d9473a';

const HUMAN_SKINS = ['#f8dcc4', '#f1cba8', '#e3b48c', '#d29f74', '#b9845a', '#8f5f3c'];
const CAPSULE_COLORS = ['#2fb6c9', '#8a5cf0', '#7ccf3a', '#f29a2e', '#e84a7a'];

// ---------------------------------------------------------------------------
// Small drawing helpers
// ---------------------------------------------------------------------------

const fixed = value => Math.round(value * 10) / 10;

/** A soft fluffy shape from circles: outlined once around the outside (the inner outlines are covered). */
function fluffy(circles, fill) {
  return [
    ...circles.map(([cx, cy, r]) => dot(cx, cy, r, fill, { 'stroke-width': 1.9 })),
    ...circles.map(([cx, cy, r]) => circle(cx, cy, r, fill)),
  ];
}

/** A flame of three tongues standing on (x, y), size 1 is about 10 x 14. */
function flamePath(x, y, size) {
  const s = value => fixed(value * size);
  return `M${x} ${y} q${s(-6)} ${s(-3)} ${s(-4.6)} ${s(-10)} q${s(2)} ${s(3)} ${s(3.6)} ${s(2.6)} q${s(-1)} ${s(-6)} ${s(3.6)} ${s(-10.6)} q${s(0.2)} ${s(6)} ${s(3)} ${s(8)} q${s(1.6)} ${s(-3)} ${s(0.8)} ${s(-5.4)} q${s(6)} ${s(6)} ${s(2)} ${s(13)} q${s(-3)} ${s(4.4)} ${s(-8)} ${s(2.4)} Z`;
}

/** Round glasses over the eye anchors. */
const roundGlasses = (color = '#3b2a1c') => [
  circle(43, 41, 3.8, '#e8f4fa', { 'fill-opacity': 0.25, stroke: color, 'stroke-width': 1 }),
  circle(52.4, 41, 3.8, '#e8f4fa', { 'fill-opacity': 0.25, stroke: color, 'stroke-width': 1 }),
  stroke('M46.8 40.6 Q47.7 39.8 48.6 40.6 M39.2 40.4 L33.4 39.4', color, 1),
];

/** Sneakers' white soles under the kit's boots. */
const soles = side => stroke(side === 'back' ? 'M36.6 112.2 H47.6' : 'M49 112.2 H60', '#ffffff', 1.5);

/** A fingerless glove: the glove over the hand, the fingertips peeking out. */
const fingertips = (side, skin) => stroke(side === 'back' ? 'M32 84.6 q2 1.6 4 0' : 'M56 84.6 q2 1.6 4 0', skin, 1.5);

// ---------------------------------------------------------------------------
// Things held in the back hand (at about (34,83); they swing with the arm). The hand is drawn again on
// top, so it grips the item.
// ---------------------------------------------------------------------------

const HELD = {
  // An original capture capsule: a hexagonal capsule, a colored cap, a dark band and a glowing core.
  capsule: (hand, color) => [
    shape('M29.2 74.6 L31.6 71.4 H36.4 L38.8 74.6 V77.4 H29.2 Z', color),
    shape('M29.2 77.4 H38.8 V80.4 L36.4 83.4 H31.6 L29.2 80.4 Z', '#f6f7fa'),
    box(28.8, 76.4, 10.4, 2, '#2b2f36', { rx: 0.6 }),
    circle(34, 77.4, 2, '#b8f6ff', { stroke: '#2b2f36', 'stroke-width': 0.7, class: 'p-glow' }),
    stroke('M31 73.6 L32.4 72.2', '#ffffff', 0.9),
    dot(34, 84.2, 3.2, hand),
  ],
  clipboard: hand => [box(26, 73, 12.4, 16.4, '#a0703a', { rx: 1.2 }), box(27.4, 75.4, 9.6, 12.4, '#ffffff', { 'stroke-width': 0.5 }),
    box(30, 71.6, 4.4, 3, STEEL, { rx: 0.6 }), stroke('M29 79 H35.6 M29 81.6 H35.6 M29 84.2 H33.6', '#94a3b8', 0.8),
    stroke('M29.2 77 l0.8 0.8 l1.4 -1.6', '#16a34a', 0.8), dot(34, 83, 3.3, hand)],
  magnifier: hand => [limb(34, 89, 34, 74, 2.2, '#3b2a1c'), circle(34, 67, 6.2, '#d6f0fa', { 'fill-opacity': 0.55, stroke: '#64748b', 'stroke-width': 1.9 }),
    stroke('M30.6 64.8 Q31.8 62.6 34 62.4', '#ffffff', 1.1), dot(34, 83, 3.3, hand)],
  berry: hand => [dot(31.4, 84.6, 2.8, '#d9304a'), dot(35.6, 85.4, 2.6, '#3f5fd0'), dot(33.4, 87.6, 2.4, '#8a3fb0'), stroke('M31.4 82 l1 -2', '#3f8a3a', 1), dot(34, 82.6, 2.8, hand)],
};

// ---------------------------------------------------------------------------
// Archetypes (looks: figure-kit.js composeFigure)
// ---------------------------------------------------------------------------

/**
 * A young trainer: a two-tone cap (or spiky hair and a long scarf for a rival), a jacket or vest in the
 * category color, a backpack, fingerless gloves, sneakers and an original capture capsule.
 */
function trainer(look) {
  const random = rngOf(look);
  const skin = pick(HUMAN_SKINS, random);
  const rival = random() < 0.32;
  const hairColor = rival
    ? pick(['#3a2a5a', '#8a1e2e', '#1f2a3a', '#c9ccd4', '#2b1d14', '#0f5a5a'], random)
    : pick(['#2b1d14', '#4a3020', '#7a4a26', '#c9772a', '#1f2a44', '#e0b04a'], random);
  const glove = pick(['#2b2f36', '#3f6a3a', '#2f4a7a', '#6a2a2a'], random);
  const shoes = pick(['#d9472f', '#2f6fb0', '#2b2f36', '#f2b234', '#3f8a5a'], random);
  const pants = rival ? pick(['#2b3445', '#3a3a40', '#4a3a5a'], random) : pick(['#3f5f8a', '#2b3445', '#6b5a3a', '#4a6a8a'], random);
  const shorts = !rival && random() < 0.45;
  const outfit = rival ? 'rival' : pickWeighted([['jacket', 50], ['vest', 50]], random);
  const tee = pick(['#2b2f36', '#f6f7fa', '#3f4a5a', '#f2e6c8'], random);
  const pack = pick(['#f2c14a', '#4f9a5a', '#d9472f', '#2f4a7a', '#8a5a34'], random);
  const capStyle = rival ? null : pickWeighted([['forward', 50], ['backward', 20], [null, 30]], random);
  const capColor = pick(['#d9472f', '#2f6fb0', '#3f8a5a', '#f2b234', '#2b2f36', '#7a3fb0'], random);
  const capFront = random() < 0.6 ? '#f8f8f4' : capColor;
  const held = pickWeighted([['capsule', 60], [null, 25], ['berry', 15]], random);
  const capsuleColor = pick(CAPSULE_COLORS, random);
  const legs = shorts
    ? { trousers: pants, length: 'short', lower: skin, feet: 'boot', shoes, cuff: '#ffffff', width: 6.6 }
    : { trousers: pants, feet: 'boot', shoes, width: 6.8 };
  const sleeveStyle = outfit === 'vest' ? { style: 'short', sleeve: tee } : outfit === 'rival' ? { sleeve: '#2f3440', cuff: '#1f232b' } : { sleeve: 'cat', cuff: 'cat-dark' };
  const sleeves = { ...sleeveStyle, hand: glove, width: 5.6 };
  const spikyHair = {
    back: shape('M30.6 44 L21 34 L30.4 31.4 L24 18.6 L36.6 23.4 L38.4 9.6 L47.4 19.6 L56.6 9.6 L58 22.6 L69 18 L63 29.6 L71 33.4 L61.4 38 Z', hairColor),
    front: shape('M31 41 Q30.4 26 46 25 Q61 26 61.4 37 L57.4 33.4 L55.4 38 L51.6 32.6 L49 37.6 L45.6 32.4 L42.6 37 L40 33 L36.6 37.6 Q33.4 39 33.4 45 Z', hairColor),
  };
  const capHair = { back: shape('M31.8 33.6 L25.4 35.6 L30 38.4 L24.8 42.4 L31 42.8 L28 47.4 L33.8 45 Z', hairColor), front: null };
  const hair = rival ? spikyHair : capStyle ? capHair : HAIR[pick(['shaggy', 'shortCrop', 'braids', 'topKnot'], random)](hairColor);
  const visorForward = capStyle === 'forward';
  const cap = capStyle && [
    shape('M31 37.4 Q30.6 22 46 21.6 Q61.4 22 61 36.4 Q46 32.6 31 37.4 Z', capColor),
    shape(visorForward ? 'M46.4 21.8 Q59.6 22.6 61 36.4 Q54 34.2 47.4 34.4 Z' : 'M45.6 21.8 Q32.4 22.6 31 37.4 Q38 34.6 44.6 34.4 Z', capFront),
    shape(visorForward ? 'M57.4 34.6 Q67 33.2 72 36.8 Q65.4 39.6 56.8 38 Z' : 'M34.6 35 Q25 33.6 20 37.2 Q26.6 40 35.2 38.4 Z', darker(capColor, 0.12)),
    dot(46.2, 22, 1.4, darker(capColor, 0.2)),
    stroke(visorForward ? 'M51.2 27.4 l2.2 2.4 l2.2 -2.4' : 'M36.4 27.4 l2.2 2.4 l2.2 -2.4', capFront === capColor ? '#f8f8f4' : capColor, 1.3),
    !visorForward && shape('M52 33.4 L55.6 30.4 L56 34.6 L59.6 32.4 L59.4 37 Z', hairColor),
  ];
  const torso = outfit === 'rival'
    ? [shape(torsoPath('slim', { bottom: 92 }), tee),
      shape('M35.4 57.4 Q38.6 55 42.4 55.6 L44.4 64 L43.6 93 Q39 94 35.6 92.6 Q34 76 35.4 57.4 Z', '#2f3440'),
      shape('M56.6 57.4 Q53.4 55 49.6 55.6 L47.6 64 L48.4 93 Q53 94 56.4 92.6 Q58 76 56.6 57.4 Z', '#2f3440'),
      stroke('M42.4 55.6 L44.4 64 L43.6 93 M49.6 55.6 L47.6 64 L48.4 93', 'cat', 1.2)]
    : outfit === 'vest'
      ? [shape(torsoPath('regular'), tee),
        shape('M34.4 57.6 Q37.6 55.4 41.6 56 L44.6 66 L44.4 92.4 Q39 93.4 34.8 91.6 Q32.8 75 34.4 57.6 Z', 'cat'),
        shape('M57.6 57.6 Q54.4 55.4 50.4 56 L47.4 66 L47.6 92.4 Q53 93.4 57.2 91.6 Q59.2 75 57.6 57.6 Z', 'cat'),
        stroke('M36 71 H42.6 M49.4 71 H56', '#ffffff', 1.6),
        box(36.4, 79, 6.4, 6, 'cat-dark', { rx: 1 }), box(49.2, 79, 6.4, 6, 'cat-dark', { rx: 1 })]
      : [shape(torsoPath('regular'), 'cat'),
        shape('M34 70 H58 V75.4 H34 Z', '#f8f8f4'),
        stroke('M46 58 V91', 'cat-dark', 1.2),
        shape('M38.6 55 Q46 59.6 53.4 55 L54.4 58.6 Q46 63.4 37.6 58.6 Z', '#f8f8f4'),
        box(44.8, 62, 2.4, 4, BRASS, { rx: 0.6 })];
  const scarf = rival && [
    shape('M37 55.4 Q46 60.4 55.6 55.2 L56.2 61 Q46 66 36.2 61 Z', 'cat'),
    stroke('M41 57.8 L40.6 63 M46 59 V64.6 M51 57.8 L51.4 63', 'cat-dark', 1),
    shape('M54.6 58.6 L60 74 L55.2 75.6 L51.6 61.4 Z', 'cat'),
    stroke('M55.6 75.4 l-0.4 2.2 M57.4 75 l0.2 2.2 M59.2 74.4 l0.6 2', 'cat-dark', 1),
  ];
  return {
    shadowWidth: 17,
    behind: [
      rival && shape('M38 57.6 Q28 56 20 51 Q14 48 10.6 52.6 Q16 56.6 22 60.4 Q30 64.6 38.6 62.6 Z', 'cat'),
      rival && stroke('M11.6 53 l-2 -0.6 M13 55.6 l-2.2 0.2 M15.4 57.8 l-1.8 1', 'cat-dark', 1),
      !rival && [
        shape('M18.6 60 Q18.6 55 24 55 L35 56 L35.6 86 L22.6 86.6 Q18 86 18 80 Z', pack),
        shape('M18.4 62 Q19 56.6 24 56.4 L35 57 L35.2 66 Q26 67.4 18.4 66 Z', darker(pack, 0.15)),
        box(20.6, 72, 8.6, 8.6, darker(pack, 0.15), { rx: 1.6 }),
        box(18.6, 48.4, 17, 7.4, '#c9a064', { rx: 3.6 }), stroke('M23 48.6 V55.6 M31 48.6 V55.6', '#7a5232', 1.3),
      ],
    ],
    legBack: [leg('back', legs), soles('back')],
    legFront: [leg('front', legs), soles('front')],
    armBack: [arm('back', sleeves), fingertips('back', skin)],
    armFront: [arm('front', sleeves), fingertips('front', skin)],
    torso,
    overTorso: [!rival && stroke('M38.4 56.6 Q40.8 68 38.6 84', darker(pack, 0.25), 2.4), scarf],
    held: held === 'capsule' ? HELD.capsule(glove, capsuleColor) : HELD[held]?.(glove) ?? null,
    headScale: 1.04,
    head: {
      back: hair.back,
      base: headBase(skin),
      features: nose(skin, 0.9),
      eyes: TOON_EYES,
      brows: darker(hairColor, 0.1),
      mouth: { anchor: [47.6, 47.6] },
      front: hair.front,
      cheeks: '#f6a6a0',
      hat: cap,
    },
  };
}

/** A creature professor: a long open lab coat over a sweater in the category color, glasses, a clipboard. */
function professor(look) {
  const random = rngOf(look);
  const skin = pick(HUMAN_SKINS, random);
  const hairColor = pick(['#d9d6cf', '#a8a29e', '#6b5a4a', '#3b2a1c', '#eeebe4', '#8a5a34'], random);
  const pants = pick(['#6b5a3a', '#4a4f5a', '#7a6a52', '#3b4a5a'], random);
  const hair = HAIR[pick(['bald', 'shortCrop', 'shaggy', 'topKnot', 'longWavy'], random)](hairColor);
  const facial = pickWeighted([[null, 45], ['mustache', 20], ['short', 20], ['stubble', 15]], random);
  const glasses = random() < 0.65;
  const held = pickWeighted([['clipboard', 45], ['capsule', 30], ['magnifier', 25]], random);
  const legs = { trousers: pants, feet: 'shoe', shoes: '#5a3e26', width: 6.8 };
  const sleeves = { sleeve: LAB_COAT, hand: skin, cuff: '#e3e6ea', width: 6.2 };
  return {
    shadowWidth: 18,
    legBack: leg('back', legs),
    legFront: leg('front', legs),
    armBack: arm('back', sleeves),
    armFront: arm('front', sleeves),
    torso: [
      shape(longGarmentPath('regular', { hem: 103, flare: 3.4 }), LAB_COAT),
      shade('M50 57 L55 66 L61.4 103 Q56 104 52 104 Z', '#000000', 0.07),
      shape('M39.2 55.6 L46 61 L52.8 55.6 L51.6 88.4 Q46 90 40.4 88.4 Z', 'cat'),
      stroke('M41.6 63 H50.4 M41.4 67 H50.6', 'cat-dark', 0.9),
      shape('M41 88.4 L51 88.4 L51.6 103.4 L40.6 103.4 Z', pants),
      shape('M39 55.6 L44.4 67 L40.4 70 L35.4 58 Z', '#e8ebef'), shape('M53 55.6 L47.6 67 L51.6 70 L56.6 58 Z', '#e8ebef'),
      stroke('M40.4 70 L40.4 103 M51.6 70 L51.6 103', '#cfd5dc', 1),
      box(34.6, 84, 6, 6.4, LAB_COAT, { rx: 0.8 }), box(52.2, 84, 6, 6.4, LAB_COAT, { rx: 0.8 }),
      box(52.8, 64, 5.4, 4.4, LAB_COAT, { rx: 0.6 }), stroke('M54.2 64.6 V61.6 M56.2 64.6 V62.2', LAB_RED, 1.1),
    ],
    held: held === 'capsule' ? HELD.capsule(skin, pick(CAPSULE_COLORS, random)) : HELD[held](skin),
    headScale: 1,
    head: {
      back: hair.back,
      base: headBase(skin),
      features: nose(skin, 1.1),
      eyes: TOON_EYES,
      brows: darker(hairColor, 0.25),
      beforeMouth: facial === 'short' || facial === 'stubble' ? BEARD[facial](hairColor) : null,
      mouth: { anchor: [47.6, 47.8] },
      front: [hair.front, facial === 'mustache' ? BEARD.mustache(hairColor) : null],
      eyewear: glasses ? roundGlasses(pick(['#3b2a1c', '#7a3f2a', '#1f2a44'], random)) : null,
    },
  };
}

/** An ember gecko: a round grinning head with ember spikes, a cream belly, toe pads, a flame on the tail tip, a scarf in the category color. */
function ember(look) {
  const random = rngOf(look);
  const [skin, belly, spots] = pick([
    ['#d33a3a', '#ffd9a0', '#ffd23e'], ['#b8306a', '#ffd6e0', '#ffb02e'], ['#4a3a44', '#f2b48a', '#ff8a2a'],
    ['#c8402a', '#ffe0b0', '#3a1a10'], ['#7a2a5a', '#f6c8d8', '#ffc83a'],
  ], random);
  const flameSize = 0.95 + random() * 0.3;
  const spikes = pick(['#ffb02e', '#ffd23e', '#ff8a3a'], random);
  const geckoLeg = (side, color) => {
    const hipX = side === 'back' ? 41 : 51;
    const footX = side === 'back' ? 42 : 54;
    return [limb(hipX, 88, footX - 1, 105, 8.6, color), blob(footX + 0.6, 109.4, 5.8, 3.4, color),
      ...[-3.4, 0, 3.4].map(offset => dot(footX + 2.6 + offset, 111.8, 1.5, lighter(color, 0.18), { 'stroke-width': 0.6 }))];
  };
  return {
    shadowWidth: 20,
    behind: [
      shape('M38 86 Q26 92 18 86 Q12 80 14.6 72 Q16.6 67.6 20 70 Q18.6 78 24 81 Q30 84 38 79 Z', skin),
      dot(24, 84.4, 1.8, spots, { 'stroke-width': 0 }), dot(18.4, 78.6, 1.5, spots, { 'stroke-width': 0 }), dot(30.6, 86.6, 1.6, spots, { 'stroke-width': 0 }),
      circle(17.6, 60, 9.4, '#ffb347', { 'fill-opacity': 0.35, class: 'p-glow' }),
      path(flamePath(17.4, 70.6, flameSize), '#ff6a1a', { stroke: '#c2410c', 'stroke-width': 0.8, 'stroke-linejoin': 'round' }),
      path(flamePath(17.8, 70, flameSize * 0.66), '#ffb02e'),
      path(flamePath(18, 69.4, flameSize * 0.36), '#fff2a0'),
    ],
    legBack: geckoLeg('back', darker(skin, 0.07)),
    legFront: geckoLeg('front', skin),
    armBack: arm('back', { style: 'bare', hand: darker(skin, 0.07), width: 6.4, handSize: 3.6 }),
    armFront: arm('front', { style: 'bare', hand: skin, width: 6.4, handSize: 3.6 }),
    torso: [
      shape(torsoPath('round', { bottom: 93 }), skin),
      shape('M46 60 Q56.6 62 57.6 74 Q58 86 52 91.4 Q46 93.4 43.6 89 Q48.6 76 46 60 Z', belly),
      stroke('M47.6 68 H55.6 M48.4 75 H57.2 M48 82 H56.6', darker(belly, 0.14), 0.9),
      dot(36.6, 65, 2.3, spots, { 'stroke-width': 0 }), dot(35.4, 75.4, 2.7, spots, { 'stroke-width': 0 }), dot(39.6, 84, 2.1, spots, { 'stroke-width': 0 }), dot(41, 70.6, 1.5, spots, { 'stroke-width': 0 }),
    ],
    overTorso: [
      shape('M37.4 55 Q46 60 55.4 55 L56 60.4 Q46 65.4 36.6 60.6 Z', 'cat'),
      shape('M38.4 59.4 Q31 59 25.6 63.4 Q29.4 66.6 37.6 63.2 Z', 'cat-dark'),
      dot(39, 60.2, 2.3, 'cat'),
    ],
    headScale: 1.06,
    head: {
      back: [
        shape('M34.6 31 L28.4 21.6 L39.6 26.6 Z', spikes), shape('M40.6 27.4 L39.4 15.4 L46.6 25 Z', spikes),
        shape('M30.6 37.6 L22.6 31.4 L32.6 32 Z', spikes), stroke('M30.4 23.4 l1.6 1.6 M40 17.6 l0.8 2.2', '#fff2a0', 1),
      ],
      base: shape('M30 41 Q29.6 25.4 45.6 24.4 Q61.6 24.6 64.6 36.4 Q67.4 46.4 57.6 51.4 Q48 55.6 39.6 53.6 Q30.4 51 30 41 Z', skin),
      features: [dot(60.6, 40.2, 0.8, darker(skin, 0.55)), dot(37.4, 33.4, 2.2, spots, { 'stroke-width': 0 }), dot(42, 29.2, 1.7, spots, { 'stroke-width': 0 }), dot(35.4, 41.4, 1.6, spots, { 'stroke-width': 0 })],
      eyes: { anchors: [[44.4, 39.6], [53.2, 39]], style: 'toon' },
      brows: darker(skin, 0.45),
      mouth: { anchor: [53, 46.4], width: 1.2 },
      cheeks: '#ffb08a',
    },
  };
}

/** A turtle pup: a puppy face with floppy fin ears and a black nose, a dome shell on its back, a curly wave tail, a bandana in the category color. */
function turtlePup(look) {
  const random = rngOf(look);
  const [skin, muzzle, shell, rim] = pick([
    ['#5aa7e0', '#e6f4ff', '#3f8a7a', '#a8d8c8'], ['#4cc2c2', '#e8fbf8', '#5a7fb0', '#bcd4f0'],
    ['#7a8fe0', '#eef0ff', '#2f8a9a', '#9ad8d8'], ['#5cc29a', '#eafaf2', '#4a6fa0', '#b8cce8'],
  ], random);
  const ear = darker(skin, 0.18);
  const stubLeg = (side, color) => {
    const hipX = side === 'back' ? 41 : 51;
    return [limb(hipX, 88, hipX + 0.4, 105, 8.4, color), blob(hipX + 1.4, 109.2, 6, 3.6, color)];
  };
  return {
    shadowWidth: 21,
    behind: [
      shape('M33 92 Q24 99 18.6 95 Q15.4 91 19.4 89 Q22.4 92.4 26 91.4 Q29.6 89.6 32 89 Z', skin),
      dot(18.4, 92.6, 1.4, '#ffffff', { 'stroke-width': 0.5 }), dot(16.6, 90.4, 1, '#ffffff', { 'stroke-width': 0.5 }),
      shape('M36 55.6 Q19.4 57.4 15.6 72 Q13.6 87 21.6 94 Q29 98.6 38 94.6 Z', shell),
      stroke('M35 56.6 Q20.6 59 16.6 72 Q14.8 86 22.4 93.2', rim, 2.6),
      stroke('M17.6 72 Q26 70 35 72 M17.4 84 Q26 82 36 85 M26.6 58.4 Q24.4 66 26.4 72 M26 72 Q23.6 78 26.4 84 M26.4 84.6 Q25 90 27.4 95.4', darker(shell, 0.3), 1),
    ],
    legBack: stubLeg('back', darker(skin, 0.07)),
    legFront: stubLeg('front', skin),
    armBack: arm('back', { style: 'bare', hand: darker(skin, 0.07), width: 6.6, handSize: 3.8 }),
    armFront: arm('front', { style: 'bare', hand: skin, width: 6.6, handSize: 3.8 }),
    torso: [
      shape(torsoPath('round', { bottom: 94 }), skin),
      shape('M40.6 60 Q47 57.4 54 60 Q57.6 76 53.4 92 Q47 94.6 41.4 92 Q37.6 76 40.6 60 Z', '#f2e2a6'),
      stroke('M39.6 68 H55.6 M39.2 76 H56.8 M39.6 84 H56', '#c9b47a', 0.9),
    ],
    overTorso: [
      shape('M37.6 55.4 Q46 60 54.6 55.2 L51 62 Q47.6 68.6 46 69.4 Q44.4 68.6 41 62 Z', 'cat'),
      stroke('M40.6 58.6 Q46 61.4 51.6 58.4', 'cat-dark', 0.9),
      dot(46, 64, 1.5, '#ffffff', { 'stroke-width': 0.4 }),
    ],
    headScale: 1.04,
    head: {
      back: [
        shape('M35 31 Q24 28 20.6 41 Q20 49.4 26 49.4 Q31 42 35.4 37 Z', ear),
        shape('M57 29 Q67 27 70 39 Q70.6 46.4 65 46.4 Q61 39 56 35 Z', ear),
        stroke('M24 44 Q25 37 31 33 M66.6 42 Q66 35 60 31.4', lighter(ear, 0.3), 1),
      ],
      base: headBase(skin, { ears: 'none' }),
      features: [
        blob(55.4, 46.6, 7.6, 5.4, muzzle),
        blob(61.6, 43.6, 2.6, 1.9, '#2b2f3a'), circle(61, 43, 0.7, '#ffffff'),
        dot(38, 31, 1.6, lighter(skin, 0.35), { 'stroke-width': 0 }), dot(42.4, 28, 1.2, lighter(skin, 0.35), { 'stroke-width': 0 }),
      ],
      eyes: { anchors: [[43, 38.6], [51, 38.2]], style: 'toon' },
      brows: darker(skin, 0.45),
      mouth: { anchor: [55.6, 49.2], width: 0.66 },
      cheeks: '#f6a6b2',
    },
  };
}

/** A leaf sprite: a round bud head under a two-leaf sprout (or a bloom), a leaf skirt, root feet, a petal collar in the category color. */
function leafSprite(look) {
  const random = rngOf(look);
  const [skin, belly, leaf] = pick([
    ['#8fcf6a', '#e4f6c8', '#3f9a3a'], ['#a8d870', '#f0fad8', '#4aa84a'], ['#6cc08a', '#dcf4e4', '#2f8a4a'],
    ['#c9d86a', '#f4f8d0', '#6aa83a'], ['#e0b86a', '#fbefd0', '#c0702a'],
  ], random);
  const bloom = random() < 0.3 ? pick(['#f9a8d4', '#fde047', '#ffffff', '#c4b5fd'], random) : null;
  const petals = [[37.4, 60.4, -34], [41.6, 62.4, -16], [46, 63.2, 0], [50.4, 62.4, 16], [54.6, 60.4, 34]];
  const rootLeg = (side, color) => {
    const hipX = side === 'back' ? 41 : 51;
    return [limb(hipX, 88, hipX + 0.4, 106, 5.6, color),
      shape(`M${hipX - 4.6} 112.4 Q${hipX - 4} 106.6 ${hipX + 0.6} 106.2 Q${hipX + 5.6} 106.6 ${hipX + 6.4} 112.4 Z`, darker(color, 0.12)),
      stroke(`M${hipX - 4.4} 112.4 l-1.6 0.4 M${hipX + 6.2} 112.4 l1.8 0.2`, darker(color, 0.3), 1)];
  };
  return {
    shadowWidth: 16,
    legBack: rootLeg('back', darker(skin, 0.08)),
    legFront: rootLeg('front', skin),
    armBack: arm('back', { style: 'bare', hand: leaf, width: 4.4, handSize: 3 }),
    armFront: arm('front', { style: 'bare', hand: leaf, width: 4.4, handSize: 3 }),
    torso: [
      shape('M38.4 58 Q46 54.6 53.6 58 Q59.6 72 56 88 Q46 92 36 88 Q32.4 72 38.4 58 Z', skin),
      shape('M46 62 Q53.6 64 54 74 Q54 84 50 88 Q46 89.4 44.6 86 Q48 76 46 62 Z', belly),
      ...[[35.6, -24], [41, -8], [46.6, 6], [52.2, 20]].map(([x, tilt]) =>
        shape(`M${x} 84 Q${x - 3.6} 92 ${x + 0.6} 98.4 Q${x + 4.4} 92 ${x + 3} 84.6 Z`, leaf, { transform: `rotate(${tilt} ${x + 1.4} 86)` })),
    ],
    overTorso: petals.map(([x, y, tilt], index) => ellipse(x, y, 3.2, 4.8, null, { class: index % 2 ? 'p-cat-light' : 'p-cat', transform: `rotate(${tilt} ${x} ${y})` })),
    headScale: 1,
    head: {
      back: [
        stroke('M46.6 26 Q45.4 19 47.6 13', darker(leaf, 0.2), 1.8),
        shape('M46.6 16.4 Q35 6 25 11.6 Q33.4 22.6 46.6 17.4 Z', leaf),
        shape('M47.6 14.4 Q58.4 2.6 69 7.6 Q61.6 19.6 47.6 15.6 Z', lighter(leaf, 0.12)),
        stroke('M45 16.4 Q36 13 29 12.4 M49.4 14.6 Q58 9.6 65.6 8.4', lighter(leaf, 0.35), 0.8),
        bloom && [...[0, 72, 144, 216, 288].map(angle => {
          const radians = (angle * Math.PI) / 180;
          return dot(fixed(47.6 + Math.cos(radians) * 2.8), fixed(11.4 + Math.sin(radians) * 2.8), 2.2, bloom, { 'stroke-width': 0.6 });
        }), dot(47.6, 11.4, 1.6, '#f59e0b', { 'stroke-width': 0.5 })],
      ],
      base: [shape('M31 41.6 Q31 28 46 24.6 Q61 28 61 41.6 Q61 55.4 46 55.4 Q31 55.4 31 41.6 Z', skin),
        shade('M31 41.6 Q31 28 46 24.6 Q36 32 35.4 44 Q36 52 46 55.4 Q31 55.4 31 41.6 Z', '#000000', 0.08)],
      eyes: { anchors: [[42.6, 42], [51.6, 42]], style: 'toon' },
      brows: darker(skin, 0.45),
      mouth: { anchor: [47.4, 48.4], width: 0.7 },
      cheeks: '#f9a8d4',
    },
  };
}

/** A cloud puff: a fluffy floating cloud with little wings and dangling feet, a ribbon bow in the category color (storm puffs have a spark). */
function cloudPuff(look) {
  const random = rngOf(look);
  const [skin, wing] = pick([['#f8fafc', '#e2e8f0'], ['#fde4ef', '#f9c6dc'], ['#e6e0fb', '#cfc4f6'], ['#cfd8e3', '#b4c0d0'], ['#ffe8cc', '#fbd0a0']], random);
  const storm = skin === '#cfd8e3';
  const head = [[46, 41, 13.6], [35, 36, 8], [40, 28.6, 8.4], [50.4, 27.4, 9], [58.4, 32.4, 7.6], [61, 41, 6.4], [31.6, 44, 6.4], [46, 31, 8]];
  const body = [[46, 75, 11.6], [36.8, 71, 6.8], [55.2, 71, 6.8], [38.4, 82, 7.2], [53.6, 82, 7.2], [46, 86, 8]];
  const danglingLeg = (side, color) => {
    const hipX = side === 'back' ? 41 : 51;
    return [limb(hipX, 88, hipX + 0.6, 101, 5, color), blob(hipX + 1.4, 103.4, 4, 2.8, color)];
  };
  return {
    shadowWidth: 14,
    behind: [
      shape('M36 66 Q24 56 16.4 61.6 Q20.4 64 21.6 67.6 Q16.6 69.6 17 74.4 Q26 75 35.6 71 Z', wing),
      stroke('M22 63.6 Q28 64 33 67 M21 71 Q27 71 33 69.6', darker(wing, 0.12), 0.9),
    ],
    legBack: danglingLeg('back', darker(skin, 0.05)),
    legFront: danglingLeg('front', skin),
    armBack: arm('back', { style: 'bare', hand: darker(skin, 0.05), width: 5, handSize: 3.4 }),
    armFront: arm('front', { style: 'bare', hand: skin, width: 5, handSize: 3.4 }),
    torso: fluffy(body, skin),
    overTorso: [
      shape('M46 58.6 Q37.4 51.6 34.6 56.4 Q33.6 62.4 46 60.6 Z', 'cat'),
      shape('M46 58.6 Q54.6 51.6 57.4 56.4 Q58.4 62.4 46 60.6 Z', 'cat'),
      shape('M45 60.4 L41.2 68.8 L44.4 68.2 L46.2 61.4 Z', 'cat-dark'), shape('M47 60.4 L50.8 68.8 L47.6 68.2 L45.8 61.4 Z', 'cat-dark'),
      dot(46, 59.4, 2.3, 'cat-dark'),
    ],
    headScale: 1,
    head: {
      base: fluffy(head, skin),
      features: storm ? shape('M51.6 15.4 L46.4 23.4 L50 23.4 L46.2 30.6 L54.4 21 L50.6 21 L53.8 15.4 Z', '#f6d34a') : null,
      eyes: { anchors: [[42.4, 42], [51.4, 42]], style: 'toon' },
      brows: storm ? '#64748b' : null,
      mouth: { anchor: [47, 48.4], width: 0.7 },
      cheeks: '#f9a8d4',
    },
  };
}

// ---------------------------------------------------------------------------
// Furniture (world-layout.js ART sizes)
// ---------------------------------------------------------------------------

const flowerHead = (x, y, color, r = 2.4) => [circle(x, y, r, color, { stroke: darker(color, 0.25), 'stroke-width': 0.5 }), circle(x, y, r * 0.38, '#f6d55c')];

/** A small capture capsule standing in a cradle (furniture scale). */
const shelfCapsule = (x, y, color, glowing) => [
  ellipse(x, y + 3.4, 4.4, 1.4, '#9aa3ad'),
  path(`M${x - 3.4} ${y - 0.6} L${x - 1.8} ${y - 3} H${x + 1.8} L${x + 3.4} ${y - 0.6} V${y} H${x - 3.4} Z`, color, { stroke: darker(color, 0.4), 'stroke-width': 0.6 }),
  path(`M${x - 3.4} ${y} H${x + 3.4} V${y + 1.2} L${x + 1.8} ${y + 3.2} H${x - 1.8} L${x - 3.4} ${y + 1.2} Z`, '#f6f7fa', { stroke: '#9aa3ad', 'stroke-width': 0.6 }),
  rect(x - 3.6, y - 0.5, 7.2, 1.2, '#2b2f36'),
  circle(x, y + 0.1, 1.1, '#b8f6ff', glowing ? { class: 'p-blink-dot' } : {}),
];

const decor = {
  // The lab's entrance: a white wall under a red roof, glass sliding doors, a lamp and a doormat.
  door: () => [
    ellipse(25, 91.4, 27, 2.6, '#000000', { 'fill-opacity': 0.14 }),
    rect(-2, 24, 54, 68, '#f3f0e8', { stroke: '#b8b2a4', 'stroke-width': 1 }),
    rect(-2, 84, 54, 8, '#d8d2c4'),
    path('M-7 27 L25 3 L57 27 Z', LAB_RED, { stroke: '#8a2a20', 'stroke-width': 1.2, 'stroke-linejoin': 'round' }),
    path('M1 21.6 H49 M8 16.4 H42 M15 11.2 H35', 'none', { stroke: '#b8372c', 'stroke-width': 0.9 }),
    path('M-7 27 H57', 'none', { stroke: '#8a2a20', 'stroke-width': 2 }),
    rect(6, 36, 38, 56, '#8a94a0', { rx: 1.4, stroke: '#5f6874', 'stroke-width': 1 }),
    rect(9, 39, 15.4, 53, '#a8d8ec', { stroke: '#5f6874', 'stroke-width': 0.8 }),
    rect(25.6, 39, 15.4, 53, '#a8d8ec', { stroke: '#5f6874', 'stroke-width': 0.8 }),
    path('M11 62 L21 44 M13 74 L23 56 M28 62 L38 44 M30 72 L37 60', 'none', { stroke: '#ffffff', 'stroke-opacity': 0.6, 'stroke-width': 1.6, 'stroke-linecap': 'round' }),
    rect(20.6, 60, 1.6, 10, '#5f6874', { rx: 0.6 }), rect(27.8, 60, 1.6, 10, '#5f6874', { rx: 0.6 }),
    rect(14, 28.4, 22, 6, '#2f6fb0', { rx: 1.4, stroke: '#1f4f80', 'stroke-width': 0.6 }),
    ...shelfCapsule(19, 31.2, LAB_RED, false),
    path('M24.6 30.4 H33 M24.6 32.6 H30.4', 'none', { stroke: '#dbeafe', 'stroke-width': 1, 'stroke-linecap': 'round' }),
    circle(46.6, 34, 2.4, '#ffe08a', { stroke: '#8a7a4a', 'stroke-width': 0.6, class: 'p-glow' }),
    rect(8, 88.6, 34, 3.2, '#6aa84a', { rx: 1.2 }),
  ],
  // A capsule cabinet: a screen with a creature's vital signs and shelves of capsules in cradles.
  shelf: () => [
    rect(2, 6, 60, 86, '#eef1f4', { rx: 3, stroke: '#9aa3ad', 'stroke-width': 1.2 }),
    rect(2, 6, 60, 6, LAB_RED, { rx: 2 }),
    rect(9, 15, 46, 14, '#1f2a3a', { rx: 1.6, stroke: '#5f6874', 'stroke-width': 0.8 }),
    path('M12 23 h6 l2 -4 l3 7 l3 -9 l3 6 h5 l2 -2 l2 3 h8', 'none', { stroke: '#5ef08a', 'stroke-width': 1.1, 'stroke-linejoin': 'round' }),
    circle(51, 18.6, 1.2, '#f87171', { class: 'p-blink-dot' }),
    ...[38, 58, 78].flatMap(y => [rect(5, y + 4.4, 54, 3, '#c4ccd4', { stroke: '#9aa3ad', 'stroke-width': 0.6 })]),
    ...[[38, ['#2fb6c9', '#8a5cf0', LAB_RED, '#7ccf3a', '#f29a2e']], [58, ['#f29a2e', '#e84a7a', '#2fb6c9', '#8a5cf0', '#7ccf3a']], [78, ['#7ccf3a', LAB_RED, '#f29a2e', '#2fb6c9', '#e84a7a']]]
      .flatMap(([y, colors], row) => colors.flatMap((color, index) => shelfCapsule(11 + index * 10.4, y, color, (index + row) % 3 === 0))),
    rect(2, 88, 60, 4, '#c4ccd4', { rx: 1 }),
  ],
  // A park bench: wooden slats on a red frame with curled armrests.
  sofa: () => [
    ellipse(75, 63, 70, 3.4, '#000000', { 'fill-opacity': 0.15 }),
    path('M16 36 L12 64 M134 36 L138 64 M32 44 L30 64 M118 44 L120 64', 'none', { stroke: '#b8372c', 'stroke-width': 3.6, 'stroke-linecap': 'round' }),
    path('M18 2 L18 36 M132 2 L132 36', 'none', { stroke: '#b8372c', 'stroke-width': 3.6, 'stroke-linecap': 'round' }),
    ...[4, 13, 22].map(y => rect(12, y, 126, 6.4, WOOD, { rx: 2, stroke: WOOD_DARK, 'stroke-width': 1 })),
    rect(6, 31, 138, 6.6, '#c08850', { rx: 2.4, stroke: WOOD_DARK, 'stroke-width': 1 }),
    rect(8, 38.4, 134, 5.4, WOOD, { rx: 2, stroke: WOOD_DARK, 'stroke-width': 1 }),
    path('M2 22 Q2 16 9 16 L20 16 Q22 16 22 19 L20 30 L6 30 Q2 30 2 26 Z M148 22 Q148 16 141 16 L130 16 Q128 16 128 19 L130 30 L144 30 Q148 30 148 26 Z', LAB_RED, { stroke: '#8a2a20', 'stroke-width': 1 }),
    path('M14 7 H134 M14 16 H134 M14 25 H134', 'none', { stroke: '#d8a46a', 'stroke-width': 0.8 }),
  ],
  // An empty battle circle on packed clay: the boundary ring, the center line and the center mark.
  rug: () => [
    ellipse(100, 20, 97, 18.6, '#d8b878', { stroke: '#b0904a', 'stroke-width': 1.2 }),
    ellipse(100, 20, 86, 15, 'none', { stroke: '#ffffff', 'stroke-width': 2.2 }),
    line(100, 5.2, 100, 34.8, '#ffffff', 2),
    ellipse(100, 20, 14, 5, 'none', { stroke: '#ffffff', 'stroke-width': 2 }), circle(100, 20, 1.6, '#ffffff'),
    path('M40 12.6 Q35.6 20 40 27.4 M160 12.6 Q164.4 20 160 27.4', 'none', { stroke: '#ffffff', 'stroke-width': 1.6 }),
    path('M8 16 l-2 -4 M10 16 l0 -4.4 M12 16 l2 -4 M188 22 l-2 -4 M190 22 l0 -4.4 M192 22 l2 -4 M60 37 l-2 -4 M62 37 l1 -4.4 M140 4 l-2 -4 M142 4 l1 -4.4', 'none', { stroke: '#5f9a3a', 'stroke-width': 1.4, 'stroke-linecap': 'round' }),
  ],
  // A berry-juice stand: a cart under a scalloped awning, jars of juice with bubbles, cups and a bowl of berries.
  coffee: () => [
    ellipse(28, 90.6, 27, 2.6, '#000000', { 'fill-opacity': 0.14 }),
    line(6, 54, 6, 16, '#8a94a0', 2), line(50, 54, 50, 16, '#8a94a0', 2),
    path('M0 14 L6 8 H50 L56 14 Z', '#e04a6a', { stroke: '#9a2a44', 'stroke-width': 1 }),
    ...Array.from({ length: 6 }, (_, index) => {
      const x0 = fixed(index * 9.33);
      const x1 = fixed((index + 1) * 9.33);
      return path(`M${x0} 14 H${x1} V22 Q${fixed((x0 + x1) / 2)} 27 ${x0} 22 Z`, index % 2 ? '#ffffff' : '#e04a6a', { stroke: '#9a2a44', 'stroke-width': 0.8 });
    }),
    rect(10, 33, 13, 19, '#e3f2f8', { rx: 3, 'fill-opacity': 0.9, stroke: '#94a3b8', 'stroke-width': 0.9 }),
    rect(11.4, 38, 10.2, 13, '#8a3fb0', { rx: 2 }),
    circle(14.4, 46, 0.9, '#e9d5ff', { class: 'cooler-bubble' }), circle(18.6, 48, 0.8, '#e9d5ff', { class: 'cooler-bubble cooler-bubble-2' }),
    rect(9.4, 30.6, 14.2, 3, '#94a3b8', { rx: 1 }),
    rect(26, 37, 11, 15, '#e3f2f8', { rx: 3, 'fill-opacity': 0.9, stroke: '#94a3b8', 'stroke-width': 0.9 }),
    rect(27.2, 41, 8.6, 10, '#f29a2e', { rx: 2 }),
    circle(30, 46.6, 0.8, '#fde68a', { class: 'cooler-bubble' }),
    rect(25.6, 34.8, 11.8, 2.6, '#94a3b8', { rx: 1 }),
    ...[[42, 46], [46.6, 46]].map(([x, y]) => path(`M${x} ${y} H${x + 4} L${x + 3.4} ${y + 6} H${x + 0.6} Z`, '#ffffff', { stroke: '#94a3b8', 'stroke-width': 0.6 })),
    rect(3, 52, 50, 32, '#fdf8ee', { rx: 2, stroke: '#b8a88a', 'stroke-width': 1 }),
    rect(3, 58, 50, 4, '#e04a6a'),
    circle(24, 72, 4, '#d9304a', { stroke: '#8a1e2e', 'stroke-width': 0.7 }), circle(30, 72.6, 3.6, '#3f5fd0', { stroke: '#1f2f80', 'stroke-width': 0.7 }),
    path('M26 68.4 q2 -3 4.4 -2.4 q-1 2.6 -4.4 2.4 Z', '#4aa84a'),
    path('M40 52 Q44.6 46.4 50.6 52 Z', '#c9a064', { stroke: '#8a6a3a', 'stroke-width': 0.7 }),
    circle(43.6, 50.4, 1.6, '#d9304a'), circle(46.4, 50, 1.6, '#3f5fd0'), circle(45, 48.6, 1.5, '#f29a2e'),
    circle(12, 86, 4.4, '#5f6874', { stroke: '#2b2f36', 'stroke-width': 1 }), circle(44, 86, 4.4, '#5f6874', { stroke: '#2b2f36', 'stroke-width': 1 }),
    circle(12, 86, 1.4, '#cbd5e1'), circle(44, 86, 1.4, '#cbd5e1'),
  ],
  // A stone drinking fountain with a little arc of water and bubbles in the basin.
  cooler: () => [
    ellipse(18, 91, 17, 2.4, '#000000', { 'fill-opacity': 0.14 }),
    path('M5 92 L7.6 84 H28.4 L31 92 Z', '#b8b2a4', { stroke: '#8a8476', 'stroke-width': 0.9 }),
    rect(11.6, 46, 12.8, 38, '#dcd6c8', { stroke: '#9a9486', 'stroke-width': 1 }),
    path('M15 50 V80 M18 50 V80 M21 50 V80', 'none', { stroke: '#bfb8a8', 'stroke-width': 0.9 }),
    path('M2 38 Q18 49 34 38 L32.4 44.6 Q18 53.4 3.6 44.6 Z', '#cfc8b8', { stroke: '#8a8476', 'stroke-width': 1 }),
    ellipse(18, 39.4, 15.4, 3.2, '#8ecae6', { stroke: '#8a8476', 'stroke-width': 0.8 }),
    rect(15.4, 33.6, 3.2, 5, STEEL, { rx: 0.8, stroke: '#6b7480', 'stroke-width': 0.5 }),
    path('M17 34 Q20.6 22 26 36.6', 'none', { stroke: '#7cc4e4', 'stroke-width': 1.6, 'stroke-linecap': 'round', class: 'p-pour' }),
    circle(10, 39.6, 0.9, '#e0f2fe', { class: 'cooler-bubble' }), circle(24, 40, 0.8, '#e0f2fe', { class: 'cooler-bubble cooler-bubble-2' }),
    path('M5 86 l-1.6 -4 M7 86 l0 -4.6 M29 86 l0 -4.6 M31 86 l1.6 -4', 'none', { stroke: '#5f9a3a', 'stroke-width': 1.3, 'stroke-linecap': 'round' }),
  ],
  // 0: a planter box of bright flowers (the lounge corner); 1: a round trimmed tree in a pot (by the door).
  plant: variant => variant % 2 === 0
    ? [
      ...[[8, 38, 8, '#4f9a3a'], [17, 32, 9, '#5aa844'], [28, 33, 9, '#4f9a3a'], [36, 38, 8, '#5aa844'], [22, 40, 9, '#46902f']].map(([cx, cy, r, color]) => circle(cx, cy, r, color)),
      ...flowerHead(9, 32, '#ef4444', 3), ...flowerHead(19, 26, '#ffffff', 3.2), ...flowerHead(30, 27, '#facc15', 3.2), ...flowerHead(37, 34, '#f472b6', 2.8),
      ...flowerHead(15, 38, '#fb923c', 2.8), ...flowerHead(27, 38, '#a78bfa', 2.6), ...flowerHead(22, 31, '#f472b6', 2.4),
      path('M3 44 H41 L38 70 H6 Z', '#e8e2d4', { stroke: '#a8a090', 'stroke-width': 1.2 }),
      rect(2, 42, 40, 5, '#d8d0bc', { rx: 1.6, stroke: '#a8a090', 'stroke-width': 1 }),
      path('M4.6 56 H39.4', 'none', { stroke: LAB_RED, 'stroke-width': 2.4 }),
    ]
    : [
      ellipse(22, 68.6, 13, 2, '#000000', { 'fill-opacity': 0.14 }),
      rect(20, 36, 4, 22, '#8a5a34', { rx: 1 }),
      circle(22, 24, 17, '#3f8a3a', { stroke: '#2a6028', 'stroke-width': 1.2 }),
      circle(26, 19, 10, '#5aa844'), circle(17, 28, 6, '#4f9a3a'), circle(28.6, 14.6, 4, '#7cc65a'),
      circle(14, 20, 1.8, '#ef4444'), circle(30, 29, 1.8, '#ef4444'), circle(22, 33, 1.6, '#f472b6'),
      path('M10 54 H34 L31 70 H13 Z', '#c0643a', { stroke: '#8a4022', 'stroke-width': 1.2 }),
      rect(8.6, 52, 26.8, 4.6, '#d0744a', { rx: 1.6, stroke: '#8a4022', 'stroke-width': 1 }),
    ],
};

// ---------------------------------------------------------------------------
// Stations (viewBox 68 20 72 96, floor at y = 112)
// ---------------------------------------------------------------------------

const table = (top = 84) => [
  rect(73, top, 64, 6, '#c08850', { rx: 1.6, stroke: WOOD_DARK, 'stroke-width': 1 }),
  rect(76, top + 6, 5, 112 - top - 6, WOOD_DARK, { rx: 1 }), rect(129, top + 6, 5, 112 - top - 6, WOOD_DARK, { rx: 1 }),
  rect(79, top + 16, 52, 3, '#9a6a3c', { rx: 1 }),
];

const stations = {
  // A research table: a basket of berries, an open field notebook, a magnifier and a sample jar.
  berries: () => [
    ...table(),
    path('M75 84 L77.4 74 H97.6 L100 84 Z', '#c9a064', { stroke: '#8a6a3a', 'stroke-width': 0.9 }),
    path('M76 78 H99 M76.6 81 H99.4 M82 74 L81.4 84 M88 74 V84 M94 74 L94.6 84', 'none', { stroke: '#a8844a', 'stroke-width': 0.7 }),
    ...[[80.6, 72.6, 3.2, '#d9304a'], [86, 71, 3.2, '#3f5fd0'], [91.6, 72.4, 3.2, '#f29a2e'], [96, 72.8, 2.8, '#8a3fb0'], [88.6, 74.6, 2.8, '#e8c13a'], [83.2, 74.8, 2.6, '#8a3fb0']]
      .flatMap(([cx, cy, r, color]) => [circle(cx, cy, r, color, { stroke: darker(color, 0.35), 'stroke-width': 0.6 }), circle(cx - r * 0.35, cy - r * 0.35, r * 0.3, '#ffffff', { 'fill-opacity': 0.7 })]),
    path('M84.4 68 q1.6 -3 4.4 -3 q-0.6 2.8 -4.4 3 Z', '#4aa84a'),
    path('M101 84 L104.6 78.6 H115.6 L112.4 84 Z', '#ffffff', { stroke: '#94a3b8', 'stroke-width': 0.8 }),
    path('M112.4 84 L115.6 78.6 H126.4 L123.4 84 Z', '#fbfaf4', { stroke: '#94a3b8', 'stroke-width': 0.8 }),
    path('M104.4 82.6 L106.4 80 H112.6 M116 82.6 L117.8 80 H123.6', 'none', { stroke: '#94a3b8', 'stroke-width': 0.6 }),
    path('M105 81.4 h5', 'none', { stroke: '#2f6fb0', 'stroke-width': 0.9, class: 'p-screen-line' }),
    circle(119, 81.2, 1.3, '#d9304a'),
    line(120.6, 83.4, 126.6, 78, '#f2b234', 1.2),
    rect(127.6, 71, 7.4, 13, '#e3f2f8', { rx: 2, 'fill-opacity': 0.85, stroke: '#94a3b8', 'stroke-width': 0.8 }),
    rect(127, 69, 8.6, 2.6, '#7a5232', { rx: 0.8 }),
    circle(130, 79.6, 1.6, '#d9304a'), circle(132.6, 80.8, 1.5, '#3f5fd0'), circle(131, 77.4, 1.4, '#8a3fb0'),
    line(108, 74.6, 101.6, 79, '#3b2a1c', 1.6), circle(110.6, 72.6, 3.6, '#d6f0fa', { 'fill-opacity': 0.6, stroke: '#64748b', 'stroke-width': 1.3 }),
    path('M98 64 l0.7 1.6 l1.6 0.7 l-1.6 0.7 l-0.7 1.6 l-0.7 -1.6 l-1.6 -0.7 l1.6 -0.7 Z', '#fde047', { class: 'p-spark' }),
  ],
  // A training dummy: a straw sack with a target on a post, rope bindings, sandbags at its foot.
  punchbag: () => [
    ellipse(106, 111.6, 22, 3, '#000000', { 'fill-opacity': 0.15 }),
    rect(102.6, 54, 6.4, 58, WOOD, { rx: 1.2, stroke: WOOD_DARK, 'stroke-width': 1 }),
    ellipse(94, 107.6, 9, 4.6, '#c9b07a', { stroke: '#8a7448', 'stroke-width': 0.9 }),
    ellipse(118, 107.6, 9, 4.6, '#c9b07a', { stroke: '#8a7448', 'stroke-width': 0.9 }),
    ellipse(106, 104.6, 9, 4.6, '#d6be8a', { stroke: '#8a7448', 'stroke-width': 0.9 }),
    path('M90 106 h8 M114 106 h8 M102 103 h8', 'none', { stroke: '#8a7448', 'stroke-width': 0.7 }),
    svg('g', { class: 'p-wobble' },
      rect(86, 64, 40, 5, WOOD, { rx: 2, stroke: WOOD_DARK, 'stroke-width': 1 }),
      path('M88 62 Q86 66 88 71 M124 62 Q126 66 124 71', 'none', { stroke: '#e0c27a', 'stroke-width': 3, 'stroke-linecap': 'round' }),
      path('M94 58 Q105.8 52 117.6 58 L119 93 Q105.8 99 92.6 93 Z', '#e0c27a', { stroke: '#a8884a', 'stroke-width': 1.1 }),
      path('M97 62 l-1 8 M101 60 l1 9 M112 60 l-1 7 M116 64 l1 8 M96 84 l1 7 M115 84 l-1 7', 'none', { stroke: '#c9a45a', 'stroke-width': 0.8 }),
      path('M93.4 67 Q105.8 70 118.4 67 M93 86 Q105.8 89 118.8 86', 'none', { stroke: '#8a5a34', 'stroke-width': 1.6 }),
      circle(105.8, 76.6, 7.6, LAB_RED, { stroke: '#8a2a20', 'stroke-width': 0.9 }),
      circle(105.8, 76.6, 4.8, '#ffffff'), circle(105.8, 76.6, 2.2, LAB_RED),
      circle(105.8, 47, 8, '#e0c27a', { stroke: '#a8884a', 'stroke-width': 1.1 }),
      path('M100 41 l-2 -4 M104 39.6 l-0.6 -4.4 M108 39.6 l0.6 -4.4 M112 41 l2 -4', 'none', { stroke: '#c9a45a', 'stroke-width': 1.2, 'stroke-linecap': 'round' }),
      path('M101 48 h3 M107.6 48 h3', 'none', { stroke: '#8a5a34', 'stroke-width': 1.2, 'stroke-linecap': 'round' })),
    ...[[90, 72], [121, 66], [92, 58]].map(([x, y]) => path(`M${x} ${y - 2.6} l0.9 1.7 l1.7 0.9 l-1.7 0.9 l-0.9 1.7 l-0.9 -1.7 l-1.7 -0.9 l1.7 -0.9 Z`, '#fde047', { class: 'p-spark' })),
  ],
};

export default Object.freeze({
  archetypes: { trainer, professor, ember, turtlePup, leafSprite, cloudPuff },
  decor,
  stations,
});
