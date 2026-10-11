// Spies: the young agents of a secret academy hidden in the highlands - field agents in trench coats and
// sunglasses, tech geniuses with headsets and drones, masters of disguise, stealthy infiltrators with
// grappling hooks and the tea-drinking handler who runs them - and the HQ's furniture: a vault door, a
// server rack, a leather sofa with a tartan throw, a compass-rose rug, a tea station, a water dispenser.
// Original designs for this app: the feel of the genre, no characters or designs from books or films.
// Coordinates: figure-kit.js (characters), world-layout.js ART (furniture), viewBox 68 20 72 96 (stations).

import { circle, darker, ellipse, lighter, line, path, rect, svg } from '../svg-kit.js';
import {
  BEARD, HAIR, arm, belt, blob, box, buttons, dot, headBase, leg, limb, longGarmentPath, nose, pick,
  pickWeighted, rngOf, shade, shape, stroke, torsoPath,
} from '../figure-kit.js';

const TOON_EYES = Object.freeze({ anchors: [[43, 41], [52, 41]], style: 'toon' });
const INK_DARK = '#1f2430';
const STEEL = '#9aa5b1';
const TEAL = '#5eead4';
const BRASS = '#d4a94a';

const HUMAN_SKINS = ['#f6d7bd', '#efc8a6', '#e2b38c', '#d29f74', '#b9845a', '#8f5f3c', '#6e4630'];
const HAIR_COLORS = ['#2b1d14', '#3d2a1c', '#5a3a22', '#1f1a17', '#8a4b26', '#c9a05a', '#e3c47a', '#a33b20'];
const DYED_HAIR = ['#7c3aed', '#0ea5e9', '#ec4899', '#10b981'];
const GREY_HAIR = ['#d9d6cf', '#bdb8b0', '#a8a29e', '#eeebe4', '#8d8a85'];

/** Moves parts as one group (e.g. sunglasses pushed up onto the head). */
const moved = (dx, dy, ...parts) => svg('g', { transform: `translate(${dx} ${dy})` }, ...parts);

// ---------------------------------------------------------------------------
// Eyewear and small gadgets
// ---------------------------------------------------------------------------

/** Dark wraparound sunglasses over the eye anchors. */
const sunglasses = () => [
  shape('M38.6 38.4 H47 Q47.2 44.4 42.8 44.6 Q38.4 44.4 38.6 38.4 Z', '#111827'),
  shape('M48.6 38.4 H56.8 Q57 44.4 52.6 44.6 Q48.2 44.4 48.6 38.4 Z', '#111827'),
  stroke('M47 39.2 Q47.8 38.2 48.6 39.2 M38.6 39 L32.2 40.4', '#111827', 1.1),
  stroke('M40.4 39.8 L42.8 42 M50.4 39.8 L52.8 42', '#94a3b8', 0.8),
];

/** Round glasses (eyes stay visible). */
const roundGlasses = (frame, r = 3.6) => [
  circle(43, 41, r, '#e0f2fe', { 'fill-opacity': 0.25, stroke: frame, 'stroke-width': 1.1 }),
  circle(52, 41, r, '#e0f2fe', { 'fill-opacity': 0.25, stroke: frame, 'stroke-width': 1.1 }),
  stroke(`M${43 + r} 40.6 Q47.5 39.4 ${52 - r} 40.6 M${43 - r} 40.6 L32.4 40`, frame, 1),
];

/** A secret-service earpiece with its coiled wire down to the collar. */
const earpiece = () => [
  stroke('M32.6 44.6 q-1.8 1.8 0 3.4 q1.8 1.6 0 3.2 q-1.8 1.6 0 3.2 L33.4 59', '#e2e8f0', 0.8),
  dot(32.2, 43.2, 1.7, '#e2e8f0'),
];

/** A gadget watch on the front wrist (with a glowing face). */
const gadgetWatch = () => [box(54.6, 77, 6.2, 4.4, '#111827', { rx: 1 }), box(55.6, 77.8, 4.2, 2.8, TEAL, { 'stroke-width': 0.4, class: 'p-glow' })];

// ---------------------------------------------------------------------------
// Things held in the back hand (at about (34,83); they swing with the arm)
// ---------------------------------------------------------------------------

const HELD = {
  briefcase: () => [stroke('M27.4 87 V84.4 Q31 81 34.6 84.4 V87', '#1c1410', 1.7), box(19, 86.4, 20, 13.6, '#4a3326', { rx: 1.8 }),
    stroke('M19 91.6 H39', '#2e2018', 0.9), box(29.2, 89.6, 3.2, 2.6, '#d1d5db', { rx: 0.6 }), box(21.4, 86.4, 2.4, 13.6, '#3a271d', { 'stroke-width': 0.4 })],
  folder: () => svg('g', { transform: 'rotate(-14 30 84)' },
    box(19.4, 73, 15.6, 20, '#e3c27a', { rx: 1 }), box(18.6, 72.4, 15.6, 20, '#d9b25e', { rx: 1 }),
    box(18.6, 80.4, 15.6, 3.2, '#dc2626', { 'stroke-width': 0.5 }), stroke('M21 76 H31 M21 87 H29 M21 89.6 H31', '#8a6a2a', 0.8)),
  gadget: () => [box(28.4, 75, 7.6, 12, '#1f2937', { rx: 1.6 }), box(29.6, 76.4, 5.2, 5.6, TEAL, { 'stroke-width': 0.4, class: 'p-glow' }),
    stroke('M30.4 75 V68.6', '#64748b', 1.1), dot(30.4, 68, 1.2, '#f43f5e', { class: 'p-antenna' }), dot(32.2, 84.6, 0.9, '#94a3b8')],
  tablet: () => svg('g', { transform: 'rotate(-12 30 84)' },
    box(21.6, 72, 14, 19, '#1f2937', { rx: 1.8 }), box(23, 73.6, 11.2, 15.2, '#38bdf8', { 'stroke-width': 0.4 }),
    stroke('M24.6 77 H32.4 M24.6 80 H30.4 M24.6 83 H32 M24.6 86 H28.6', '#e0f2fe', 0.9), dot(28.6, 89.6, 0.6, '#64748b')),
  controller: () => [box(26.4, 79.6, 13.4, 7.6, '#374151', { rx: 3 }), dot(29.6, 83.4, 1.4, '#111827'), dot(36.6, 83.4, 1.4, '#111827'),
    stroke('M33.2 79.6 V73', '#64748b', 1), dot(33.2, 72.4, 1, '#22c55e', { class: 'p-antenna' })],
  umbrella: () => [stroke('M34 83 V78.6 Q34 75 37.4 75 Q40.8 75 40.8 78.6', '#4a2f1d', 2.2), shape('M32.4 85 L35.6 85 L33.8 110 Z', '#1f2937'),
    stroke('M33.6 87 L34.4 104', '#374151', 0.8), stroke('M33.8 110 V112', '#9ca3af', 1.2)],
  newspaper: () => svg('g', { transform: 'rotate(-8 28 82)' },
    box(16, 70, 22, 26, '#ece8df', { rx: 0.6 }), box(16, 70, 22, 4.6, '#cfc9bd', { 'stroke-width': 0.4 }),
    stroke('M18.6 77.6 H35.6 M18.6 80.6 H26 M28 80.6 H35.6 M18.6 83.6 H26 M28 83.6 H35.6 M18.6 86.6 H26 M18.6 89.6 H35.6 M18.6 92.6 H30', '#9ca3af', 0.8),
    dot(30.6, 86, 1.6, '#111827'), dot(34.4, 86, 1.6, '#111827')),
  mask: () => [stroke('M34 84 L26.4 62', '#7a5332', 1.6),
    shape('M18.6 54.6 Q18.4 47.6 25.6 47 Q32.8 47.4 32.6 54.6 Q32 61.6 25.6 62.6 Q19.2 61.6 18.6 54.6 Z', '#f8fafc'),
    blob(22.6, 53.4, 2, 1.4, '#1f2937'), blob(28.8, 53.4, 2, 1.4, '#1f2937'), stroke('M22.4 58.4 Q25.6 60.6 28.8 58.4', '#dc2626', 1.1),
    dot(20.8, 57, 1.2, '#f9a8d4', { 'fill-opacity': 0.8 }), dot(30.6, 57, 1.2, '#f9a8d4', { 'fill-opacity': 0.8 })],
  grapple: () => [stroke('M34 84 Q30.6 92 33 100', '#c8a46a', 1.5), limb(33, 99.6, 33, 104.6, 1.8, STEEL),
    stroke('M33 104.6 Q27.4 105 27 99.6 M33 104.6 Q38.6 105 39 99.6 M33 104.6 V109', STEEL, 1.8), dot(27, 99.4, 0.9, '#cbd5e1'), dot(39, 99.4, 0.9, '#cbd5e1')],
  flashlight: () => svg('g', { transform: 'rotate(-28 34 83)' },
    path('M18.6 79.4 L2 73 V95 L18.6 86.8 Z', '#fef9c3', { 'fill-opacity': 0.32, class: 'p-glow' }),
    box(22, 80.8, 14, 4.6, '#1f2937', { rx: 1.4 }), shape('M22.4 79.4 L18.6 78 V88.2 L22.4 86.8 Z', '#374151'),
    box(17.6, 78.6, 1.6, 9, '#fef08a', { rx: 0.6, 'stroke-width': 0.4 }), stroke('M25 83.1 H32', '#4b5563', 1.2)),
  tea: () => [stroke('M30 72.4 q-1.6 -2.4 0 -4.6 M33.4 71.6 q-1.6 -2.4 0 -4.6', '#e5e7eb', 0.9, { class: 'p-glow' }),
    box(26.6, 75.4, 9.4, 10.6, '#f8fafc', { rx: 1.6 }), stroke('M26.6 77.6 q-3.4 0.4 -3.2 3.4 q0.2 2.6 3.2 2.4', '#cbd5e1', 1.3),
    blob(31.3, 75.6, 4.4, 1.3, '#b45309', { 'stroke-width': 0.4 }), stroke('M33.6 75.6 Q36.8 77 36 80.6', '#f5f5f4', 0.6), box(34.6, 80.4, 2.6, 3, '#fde68a', { 'stroke-width': 0.4 }),
    box(27.6, 79, 7.4, 2, '#1e3a5f', { 'stroke-width': 0.3 })],
};

// ---------------------------------------------------------------------------
// Archetypes (looks: figure-kit.js composeFigure)
// ---------------------------------------------------------------------------

/** A young field agent: a belted trench coat (or a turtleneck) in the category color, sunglasses, an earpiece. */
function fieldAgent(look) {
  const random = rngOf(look);
  const skin = pick(HUMAN_SKINS, random);
  const hairColor = pick(HAIR_COLORS, random);
  const hair = HAIR[pick(['shortCrop', 'longStraight', 'topKnot', 'shaggy', 'braids', 'longWavy'], random)](hairColor);
  const trench = random() < 0.62;
  const glasses = pickWeighted([['on', 45], ['up', 22], [null, 33]], random);
  const trousers = pick(['#1f2937', '#273244', '#2f2f36', '#3b3f4a'], random);
  const held = pickWeighted([['briefcase', 34], ['folder', 26], ['gadget', 22], [null, 18]], random);
  const legs = { trousers, feet: 'boot', shoes: '#111827', width: 6.6 };
  const sleeves = trench ? { sleeve: 'cat', hand: skin, cuff: 'cat-dark', width: 6.2 } : { sleeve: 'cat', hand: skin, width: 5.8 };
  return {
    shadowWidth: 17,
    legBack: leg('back', legs),
    legFront: leg('front', legs),
    armBack: arm('back', sleeves),
    armFront: [arm('front', sleeves), !trench && gadgetWatch()],
    torso: trench
      ? [
        shape(longGarmentPath('regular', { hem: 102, flare: 4.5 }), 'cat'),
        shade('M50 57 L56.6 63 L62.4 102 Q56 104.4 50.4 104 Z', '#000000', 0.12),
        shape('M41 55.4 L46 64.6 L51 55.4 Q46 54 41 55.4 Z', '#1f2937'),
        stroke('M48 64 Q47.2 84 48.4 103', 'cat-dark', 1.1),
        shape('M40.4 55 L46 64.8 L42.6 68.4 L36.8 60.4 L38.4 57.6 Z', 'cat-dark'),
        shape('M51.6 55 L46 64.8 L49.4 68.4 L55.2 60.4 L53.6 57.6 Z', 'cat-dark'),
        box(34.6, 56, 7, 2.6, 'cat-dark', { rx: 1 }), box(50.4, 56, 7, 2.6, 'cat-dark', { rx: 1 }),
        belt('regular', 78.4, 'cat-dark', '#e5e7eb'),
        buttons(43, [71.6, 87.6], '#1f2937', 1.1), buttons(52.6, [71.6, 87.6], '#1f2937', 1.1),
      ]
      : [
        shape(torsoPath('slim', { bottom: 92 }), 'cat'),
        shade('M50 57 L54.6 60 L55.6 91 Q52 92 50 92 Z', '#000000', 0.12),
        stroke('M38 89 Q46 91.6 54.6 89', 'cat-dark', 1.4),
        box(39.6, 51.6, 12.8, 6.4, 'cat-dark', { rx: 2.8 }),
        stroke('M42.4 52.6 V57 M46 52.6 V57.4 M49.6 52.6 V57', 'cat', 0.7),
        stroke('M54.4 58 L38.6 88', '#3b2a20', 2),
        box(35.6, 86, 7, 6, '#3b2a20', { rx: 1.4 }),
      ],
    held: HELD[held]?.() ?? null,
    headScale: 1.04,
    head: {
      back: hair.back,
      base: headBase(skin),
      features: nose(skin),
      eyes: TOON_EYES,
      brows: darker(hairColor, 0.1),
      mouth: { anchor: [47.5, 47.8] },
      front: [hair.front, earpiece()],
      eyewear: glasses === 'on' ? sunglasses() : null,
      hat: glasses === 'up' ? moved(0.4, -10.6, sunglasses()) : null,
    },
  };
}

/** A tech genius: a hoodie in the category color, a headset with a mic, glasses, a tablet or a little drone. */
function techGenius(look) {
  const random = rngOf(look);
  const skin = pick(HUMAN_SKINS, random);
  const hairColor = random() < 0.25 ? pick(DYED_HAIR, random) : pick(HAIR_COLORS, random);
  const hair = HAIR[pick(['curlyMop', 'shaggy', 'shortCrop', 'braids', 'longWavy', 'topKnot'], random)](hairColor);
  const frame = random() < 0.55 ? pick(['#1f2937', '#7c2d12', '#be185d', '#1d4ed8'], random) : null;
  const jeans = pick(['#3b5b8a', '#2f4a6b', '#4b5563', '#5b5b45'], random);
  const held = pickWeighted([['tablet', 42], ['controller', 38], [null, 20]], random);
  const legs = { trousers: jeans, feet: 'shoe', shoes: '#f8fafc', width: 6.8 };
  const sleeves = { sleeve: 'cat', hand: skin, cuff: 'cat-dark', width: 6.4 };
  const drone = held === 'controller' && [
    stroke('M10 32 H30 M13 30 V34 M27 30 V34', '#4b5563', 1.4),
    blob(10, 29.6, 5, 1.2, '#cbd5e1', { 'fill-opacity': 0.7 }), blob(30, 29.6, 5, 1.2, '#cbd5e1', { 'fill-opacity': 0.7 }),
    box(15.6, 30.6, 8.8, 4.6, '#1f2937', { rx: 1.6 }), dot(20, 36.4, 1.4, '#334155'), dot(20, 36.4, 0.7, TEAL),
    dot(23.4, 32.2, 0.8, '#ef4444', { class: 'p-antenna' }),
  ];
  return {
    shadowWidth: 17,
    behind: drone,
    legBack: leg('back', legs),
    legFront: leg('front', legs),
    armBack: arm('back', sleeves),
    armFront: arm('front', sleeves),
    torso: [
      shape(torsoPath('regular', { bottom: 93 }), 'cat'),
      shade('M50 56 L56 57 L58 66 L58.6 92 Q54 93.6 50 93.6 Z', '#000000', 0.1),
      shade('M37 79.6 Q46 77.6 55 79.6 L56.6 90 H35.4 Z', '#000000', 0.1),
      stroke('M37 79.6 Q46 77.6 55 79.6 L56.6 90 M37 79.6 L35.4 90 M41 79 L40 85 M51 79 L52 85', 'cat-dark', 0.9),
      stroke('M35 90.6 Q46 93 57.4 90.6', 'cat-dark', 1.8),
      stroke('M43.4 57.4 V66 M48.6 57.4 V65', '#f8fafc', 1),
      dot(43.4, 66.4, 0.9, '#e2e8f0'), dot(48.6, 65.4, 0.9, '#e2e8f0'),
    ],
    overTorso: shape('M33.6 58.4 Q31.4 51 36.6 48.6 Q46 53.4 55.4 48.6 Q60.6 51 58.4 58.4 Q46 62.4 33.6 58.4 Z', 'cat-dark'),
    held: HELD[held]?.() ?? null,
    headScale: 1.05,
    head: {
      back: hair.back,
      base: headBase(skin),
      features: nose(skin, 0.9),
      eyes: TOON_EYES,
      brows: darker(hairColor, 0.15),
      mouth: { anchor: [47.5, 47.8] },
      front: [
        hair.front,
        stroke('M33.4 36.6 Q34 23 46 22.6 Q58 23 59.6 35.6', '#334155', 2.4),
        box(28.2, 37, 7, 10, '#1f2937', { rx: 2.8 }), dot(31.7, 42, 1.6, TEAL, { 'stroke-width': 0.4 }),
        stroke('M33.6 45.6 Q37 51.6 43.6 51', '#334155', 1.3), dot(44.2, 50.8, 1.4, '#1f2937'),
      ],
      eyewear: frame && roundGlasses(frame),
    },
  };
}

/** A master of disguise: a reversible jacket in the category color, a hat, a fake mustache (or nose and glasses). */
function disguiseMaster(look) {
  const random = rngOf(look);
  const skin = pick(HUMAN_SKINS, random);
  const hairColor = pick(HAIR_COLORS, random);
  const hair = HAIR[pick(['shortCrop', 'shaggy', 'longWavy', 'bald'], random)](hairColor);
  const build = pick(['regular', 'round', 'slim'], random);
  const disguise = pickWeighted([['mustache', 40], ['groucho', 28], ['beard', 16], ['monocle', 16]], random);
  const hatKind = pickWeighted([['fedora', 34], ['flatcap', 24], ['beret', 20], ['bowler', 22]], random);
  const hatColor = pick(['#3f3f46', '#57534e', '#4b3a2a', '#1f2937', '#7c2d12', '#5b6b4a'], random);
  const fakeHair = pick(['#1f1a17', '#7a3b1a', '#c2410c', '#e5e7eb', '#3d2a1c'], random);
  const lining = pick(['#f59e0b', '#e11d48', '#16a34a', '#7c3aed', '#e5e7eb'], random);
  const trousers = pick(['#6b7280', '#57534e', '#4b5563', '#7a6a5a'], random);
  const held = pickWeighted([['umbrella', 36], ['newspaper', 32], ['mask', 32]], random);
  const { x, width } = { x: 34, width: 24, ...(build === 'round' ? { x: 32.5, width: 27 } : build === 'slim' ? { x: 36.5, width: 19 } : {}) };
  const legs = { trousers, feet: 'shoe', shoes: pick(['#3b2a20', '#111827', '#7c2d12'], random), width: 6.8 };
  const sleeves = { sleeve: 'cat', hand: skin, cuff: lining, width: 6.2 };
  const checks = (left) => stroke(left
    ? 'M38.2 58 L44 60.6 M37.6 61 L44.6 64 M38 64 L43.6 66.6 M40.4 56.4 L39 66 M42.6 57.2 L41.4 67'
    : 'M53.8 58 L48 60.6 M54.4 61 L47.4 64 M54 64 L48.4 66.6 M51.6 56.4 L53 66 M49.4 57.2 L50.6 67', darker(lining, 0.3), 0.6);
  const mustacheColor = disguise === 'groucho' ? '#1f1a17' : fakeHair;
  const bigMustache = shape('M40.4 47.6 Q43 44.4 47.6 46.2 Q52.2 44.4 54.8 47.6 Q57.4 47.2 58.8 44.6 Q59 49.8 54.2 49.6 Q50.6 49.6 47.6 48.2 Q44.6 49.6 41 49.6 Q36.2 49.8 36.4 44.6 Q37.8 47.2 40.4 47.6 Z', mustacheColor);
  const hats = {
    fedora: [blob(46, 30.6, 19.6, 3.8, hatColor), shape('M34.6 31 Q34 19.4 46 18.8 Q58 19.4 57.4 31 Q46 33 34.6 31 Z', hatColor),
      stroke('M41.6 20.6 Q46 23.8 50.4 20.6', darker(hatColor, 0.35), 1.1), box(34.4, 27, 23.2, 3.8, '#1f2937', { rx: 0.8 })],
    flatcap: [shape('M30.6 35.6 Q29.4 23.6 45 22.6 Q58.4 22.6 61.4 31.4 L67.6 34.2 Q64.6 37.6 58.4 36.4 Q46 33.4 30.6 35.6 Z', hatColor),
      stroke('M35 27 L38 35 M41 24 L43 34 M47 23.4 L48.6 33.6 M53 24.4 L54 34.4 M33 30.4 Q46 26.4 60 30.4', lighter(hatColor, 0.25), 0.6)],
    beret: [blob(45, 27.6, 15.6, 6.2, hatColor), dot(44, 21, 1.5, hatColor), stroke('M31.6 30.6 Q45 34.4 59.6 30', darker(hatColor, 0.3), 1)],
    bowler: [shape('M35 31.4 Q34.6 16.6 46 16.6 Q57.4 16.6 57 31.4 Z', hatColor), stroke('M35.4 28.4 Q46 30.4 56.6 28.4', '#111827', 2.2),
      shape('M30.4 31.6 Q46 28 61.6 31.6 Q62.6 34.6 59.4 34 Q46 31.4 32.6 34 Q29.4 34.6 30.4 31.6 Z', hatColor)],
  };
  return {
    shadowWidth: 18,
    legBack: leg('back', legs),
    legFront: leg('front', legs),
    armBack: arm('back', sleeves),
    armFront: arm('front', sleeves),
    torso: [
      shape(torsoPath(build, { bottom: 95 }), 'cat'),
      shade(`M50 56 L${x + width - 3} 56 L${x + width} 66 L${x + width - 1} 95 Q54 96.6 50 96.6 Z`, '#000000', 0.1),
      shape('M41.2 55.6 L46 65.6 L50.8 55.6 Q46 54.4 41.2 55.6 Z', '#f8fafc'),
      random() < 0.5
        ? shape('M41.8 57.2 L46 59.4 L50.2 57.2 L50.2 61.6 L46 59.4 L41.8 61.6 Z', pick(['#dc2626', '#1d4ed8', '#111827', '#ca8a04'], random))
        : shape('M45 57.4 H47 L48 66 L46 68.6 L44 66 Z', pick(['#dc2626', '#1d4ed8', '#111827', '#ca8a04'], random)),
      shape('M40.4 55.2 L46 66.4 L43 69.4 L37 60.6 L38.6 57.4 Z', lining), checks(true),
      shape('M51.6 55.2 L46 66.4 L49 69.4 L55 60.6 L53.4 57.4 Z', lining), checks(false),
      shape('M51 64.6 L55 63.8 L54 66.6 Z', pick(['#fde047', '#f472b6', '#f8fafc'], random)),
      buttons(47.4, [74, 82], '#1f2937', 1.1),
      stroke(`M${x + 3} 89.6 L${x + 8} 89.6 M${x + width - 8} 89.6 L${x + width - 3} 89.6`, 'cat-dark', 1),
    ],
    held: HELD[held]?.() ?? null,
    headScale: 1.02,
    head: {
      back: hair.back,
      base: headBase(skin),
      features: disguise === 'groucho' ? null : nose(skin, 1.1),
      eyes: TOON_EYES,
      brows: disguise === 'groucho' ? '#111827' : darker(hairColor, 0.1),
      beforeMouth: [
        disguise === 'beard' && BEARD.short(fakeHair),
        disguise === 'monocle' ? BEARD.mustache(fakeHair) : bigMustache,
        disguise === 'groucho' && blob(54.6, 44.4, 3.8, 3.2, '#f2a7a0'),
      ],
      mouth: { anchor: [47.6, disguise === 'monocle' ? 48.6 : 50.4] },
      front: hair.front,
      eyewear: disguise === 'groucho'
        ? roundGlasses('#111827', 3.8)
        : disguise === 'monocle'
          ? [circle(52, 41, 4, '#e0f2fe', { 'fill-opacity': 0.25, stroke: BRASS, 'stroke-width': 1.2 }), stroke('M54.4 44.4 Q57 52 52 58', BRASS, 0.6)]
          : null,
      hat: hats[hatKind],
    },
  };
}

/** A stealthy infiltrator: a fitted stealth suit in the dark category color, a harness, night-vision goggles, a grappling hook. */
function infiltrator(look) {
  const random = rngOf(look);
  const skin = pick(HUMAN_SKINS, random);
  const hairColor = pick(HAIR_COLORS, random);
  const hair = HAIR[pick(['topKnot', 'shortCrop', 'braids', 'longStraight'], random)](hairColor);
  const beanie = random() < 0.3;
  const held = pickWeighted([['grapple', 55], ['flashlight', 45]], random);
  const rope = '#c8a46a';
  const kneePad = ([x, y]) => box(x - 3.4, y - 2.6, 6.8, 5.4, INK_DARK, { rx: 1.8 });
  const legs = { trousers: 'cat-dark', feet: 'tallboot', shoes: INK_DARK, width: 6.4 };
  const sleeves = { sleeve: 'cat-dark', hand: INK_DARK, cuff: INK_DARK, width: 5.6 };
  const goggles = [
    stroke('M31.4 34 Q46 27.6 60.8 33', INK_DARK, 2.6),
    shape('M47.4 25.4 Q47.6 22.6 51 22.6 H58.6 Q61.6 22.6 61.4 26.6 L61.2 30 Q61 32.6 58 32.4 H51 Q47.6 32.4 47.4 29.6 Z', '#374151'),
    dot(59.8, 25, 2.2, '#4ade80', { class: 'p-glow' }), dot(59.8, 30, 2.2, '#4ade80', { class: 'p-glow' }),
    stroke('M50 25 H55 M50 30 H55', '#1f2937', 0.8),
  ];
  return {
    shadowWidth: 16,
    legBack: [leg('back', legs), kneePad([40.6, 99])],
    legFront: [leg('front', legs), kneePad([51.6, 99])],
    armBack: [arm('back', sleeves), stroke('M37 61 L34.6 79', 'cat', 1)],
    armFront: [arm('front', sleeves), stroke('M55 61 L57.4 79', 'cat', 1)],
    torso: [
      shape(torsoPath('slim', { bottom: 92 }), 'cat-dark'),
      stroke('M38.4 59 Q37 75 38 91 M53.6 59 Q55 75 54 91', 'cat', 1.2),
      stroke('M38 57.4 L52.4 80 M54 57.4 L39.6 80', '#4b5563', 2),
      dot(46, 68.6, 2, STEEL),
      belt('slim', 83, '#374151', STEEL),
      box(36.6, 82.4, 5.6, 6, '#4b5563', { rx: 1.2 }), box(50.4, 82.4, 5.6, 6, '#4b5563', { rx: 1.2 }),
      box(40.6, 52.4, 10.8, 5.6, 'cat-dark', { rx: 2.4 }),
    ],
    overTorso: [
      stroke('M29.4 71 a5.4 8.4 0 1 0 10.8 0 a5.4 8.4 0 1 0 -10.8 0', rope, 1.9),
      stroke('M31 71.4 a3.8 6.6 0 1 0 7.6 0 a3.8 6.6 0 1 0 -7.6 0', darker(rope, 0.15), 1.4),
    ],
    held: HELD[held](),
    headScale: 1.02,
    head: {
      back: beanie ? null : hair.back,
      base: headBase(skin),
      features: nose(skin),
      eyes: TOON_EYES,
      brows: darker(hairColor, 0.1),
      mouth: { anchor: [47.5, 47.8] },
      front: beanie ? null : hair.front,
      hat: beanie
        ? [shape('M30.4 39.6 Q29.4 22 46 21.4 Q62.6 22 61.6 38.6 Q46 33.6 30.4 39.6 Z', INK_DARK), stroke('M30.8 37.4 Q46 31.6 61.4 36.4', '#374151', 2.6), ...goggles.slice(1)]
        : goggles,
    },
  };
}

/** The handler: an older mentor in a cardigan in the category color, reading glasses, a mug of tea. */
function handler(look) {
  const random = rngOf(look);
  const skin = pick(HUMAN_SKINS, random);
  const hairColor = pick(GREY_HAIR, random);
  const style = pick(['bald', 'shortCrop', 'topKnot', 'longWavy', 'shortCrop'], random);
  const hair = HAIR[style](hairColor);
  const lady = style === 'topKnot' || style === 'longWavy';
  const facial = lady ? null : pickWeighted([['mustache', 30], ['beard', 22], [null, 48]], random);
  const shirt = pick(['#f8fafc', '#dbeafe', '#fef3c7', '#e2e8f0'], random);
  const tie = pick(['#7f1d1d', '#1e3a5f', '#14532d', '#4a3a2a'], random);
  const tweed = pick(['#7a5a3a', '#5b4a3a', '#6b6b5a', '#4b5563'], random);
  const skirt = lady && random() < 0.6;
  const cap = !lady && random() < 0.22;
  const frame = pick([BRASS, '#5a3a22', '#1f2937'], random);
  const held = pickWeighted([['tea', 70], ['folder', 30]], random);
  const legs = skirt
    ? { trousers: '#3f3a3a', feet: 'shoe', shoes: '#4a2f1d', width: 5.2 }
    : { trousers: tweed, feet: 'shoe', shoes: '#4a2f1d', width: 7 };
  const sleeves = { sleeve: 'cat', hand: skin, cuff: 'cat-dark', width: 6.4 };
  return {
    shadowWidth: 18,
    legBack: leg('back', legs),
    legFront: leg('front', legs),
    armBack: [arm('back', sleeves), blob(35.6, 71.6, 2.4, 3.2, '#7a5a3a')],
    armFront: arm('front', sleeves),
    torso: [
      shape(torsoPath('regular', { bottom: 93 }), shirt),
      skirt && shape('M33.4 84 H58.6 L61.6 102 Q46 104.6 30.4 102 Z', tweed),
      skirt && stroke('M38 86 L36.6 101 M46 86 V103 M54 86 L55.4 101', darker(tweed, 0.2), 0.7),
      lady
        ? [shape('M41.4 55.4 L46 60 L50.6 55.4 Z', shirt), ...[40.6, 42.8, 45, 47.2, 49.4, 51.6].map((cx, index) => dot(cx, 57.6 + Math.abs(index - 2.5) * -0.5 + 0.6, 1, '#f8fafc', { 'stroke-width': 0.3 }))]
        : [shape('M40.6 55.4 L45 59.6 L46 56 Z', '#ffffff'), shape('M51.4 55.4 L47 59.6 L46 56 Z', '#ffffff'), shape('M45 57.6 H47 L48.2 71 L46 74 L43.8 71 Z', tie)],
      shape('M32.6 58 Q35.6 55.2 40.6 56 L44.8 72 L44.4 95 Q38 96 33 94 Q30.6 76 32.6 58 Z', 'cat'),
      shape('M59.4 58 Q56.4 55.2 51.4 56 L47.2 72 L47.6 95 Q54 96 59 94 Q61.4 76 59.4 58 Z', 'cat'),
      shade('M51.4 56 L47.2 72 L47.6 95 Q54 96 59 94 Q61.4 76 59.4 58 Q56.4 55.2 51.4 56 Z', '#000000', 0.1),
      buttons(48.6, [75, 81, 87], '#e7d7b0', 1.1),
      stroke('M35 84 H41.6 V91 M51 84 H57.4', 'cat-dark', 0.9),
      stroke('M33.4 92.6 Q38.6 94.2 44.4 93.6 M47.6 93.6 Q53.6 94.2 58.6 92.6', 'cat-dark', 1.6),
    ],
    held: HELD[held](),
    headScale: 1,
    head: {
      back: hair.back,
      base: headBase(skin),
      features: [nose(skin, 1.15), stroke('M54.6 37 q2 0.4 3 1.8', darker(skin, 0.25), 0.6)],
      eyes: TOON_EYES,
      brows: darker(hairColor, 0.25),
      beforeMouth: facial === 'beard' ? BEARD.short(hairColor) : facial === 'mustache' ? BEARD.mustache(hairColor) : null,
      mouth: { anchor: [47.6, facial ? 49 : 47.8] },
      front: hair.front,
      eyewear: [
        path('M39.4 41.6 H46.6 Q46.4 45.4 43 45.4 Q39.6 45.4 39.4 41.6 Z', '#e0f2fe', { 'fill-opacity': 0.3, stroke: frame, 'stroke-width': 1 }),
        path('M48.4 41.6 H55.6 Q55.4 45.4 52 45.4 Q48.6 45.4 48.4 41.6 Z', '#e0f2fe', { 'fill-opacity': 0.3, stroke: frame, 'stroke-width': 1 }),
        stroke('M46.6 41.8 Q47.5 41 48.4 41.8 M39.4 41.8 L32.4 40.6', frame, 0.9),
      ],
      hat: cap ? [shape('M30.6 35.6 Q29.4 23.6 45 22.6 Q58.4 22.6 61.4 31.4 L67.6 34.2 Q64.6 37.6 58.4 36.4 Q46 33.4 30.6 35.6 Z', '#6b5a44'),
        stroke('M35 27 L38 35 M41 24 L43 34 M47 23.4 L48.6 33.6 M53 24.4 L54 34.4 M33 30.4 Q46 26.4 60 30.4', '#8a7558', 0.6)] : null,
    },
  };
}

// ---------------------------------------------------------------------------
// Furniture (world-layout.js ART sizes)
// ---------------------------------------------------------------------------

/** A compass rose (drawn round, squashed into the rug's perspective). */
function compassRose() {
  const points = [];
  for (let index = 0; index < 8; index += 1) {
    const angle = (index * Math.PI) / 4 - Math.PI / 2;
    const length = index % 2 === 0 ? 86 : 52;
    const tip = [Math.cos(angle) * length, Math.sin(angle) * length];
    const side = offset => [Math.cos(angle + offset) * 13, Math.sin(angle + offset) * 13];
    const [left, right] = [side(-Math.PI / 4), side(Math.PI / 4)];
    const light = index % 2 === 0 ? '#f1e6c8' : '#c9a24a';
    const dark = index % 2 === 0 ? '#b8a77e' : '#8a6a26';
    points.push(path(`M0 0 L${tip[0].toFixed(1)} ${tip[1].toFixed(1)} L${left[0].toFixed(1)} ${left[1].toFixed(1)} Z`, light),
      path(`M0 0 L${tip[0].toFixed(1)} ${tip[1].toFixed(1)} L${right[0].toFixed(1)} ${right[1].toFixed(1)} Z`, dark));
  }
  // The diagonals first, the four long points over them.
  const ordered = [1, 3, 5, 7, 0, 2, 4, 6].flatMap(index => points.slice(index * 2, index * 2 + 2));
  return svg('g', { transform: 'translate(100 20) scale(1 0.2)' },
    circle(0, 0, 98, '#1b2a44'), circle(0, 0, 92, 'none', { stroke: '#c9a24a', 'stroke-width': 4 }),
    circle(0, 0, 70, 'none', { stroke: '#c9a24a', 'stroke-width': 2.4, 'stroke-dasharray': '4 6' }), circle(0, 0, 62, '#22355a'),
    ...ordered, circle(0, 0, 9, '#c9a24a'), circle(0, 0, 4, '#1b2a44'));
}

const decor = {
  // A round vault door in a steel frame: a spoked wheel, bolts, a keypad and a warning light.
  door: () => [
    rect(0, 8, 50, 84, '#2a3340', { rx: 2, stroke: '#111827', 'stroke-width': 1.2 }),
    rect(3, 11, 44, 4, TEAL, { rx: 1.6, 'fill-opacity': 0.7, class: 'p-glow' }),
    circle(25, 58, 23.4, '#111827'),
    circle(25, 58, 21, '#b6c0ca', { stroke: '#4b5563', 'stroke-width': 1.4 }),
    circle(25, 58, 16.4, '#9aa5b1', { stroke: '#6b7785', 'stroke-width': 1 }),
    path('M11 50 A16 16 0 0 1 31 42.6', 'none', { stroke: '#ffffff', 'stroke-opacity': 0.35, 'stroke-width': 2, 'stroke-linecap': 'round' }),
    ...Array.from({ length: 12 }, (_, index) => {
      const angle = (index * Math.PI) / 6;
      return circle(25 + Math.cos(angle) * 18.7, 58 + Math.sin(angle) * 18.7, 1.1, '#4b5563');
    }),
    ...[0, 60, 120].map(degrees => line(25, 46, 25, 70, '#4b5563', 2.2, { transform: `rotate(${degrees} 25 58)` })),
    ...[0, 60, 120, 180, 240, 300].map(degrees => circle(25, 46, 1.9, '#e5e7eb', { stroke: '#4b5563', 'stroke-width': 0.8, transform: `rotate(${degrees} 25 58)` })),
    circle(25, 58, 5.6, '#6b7785', { stroke: '#374151', 'stroke-width': 1 }), circle(25, 58, 2, '#d1d5db'),
    rect(0, 50, 5, 18, '#4b5563', { rx: 1 }),
    rect(36, 20, 10, 13, '#111827', { rx: 1.4, stroke: '#4b5563', 'stroke-width': 0.8 }),
    ...[0, 1, 2].flatMap(row => [0, 1, 2].map(col => rect(37.6 + col * 2.6, 22 + row * 2.6, 1.8, 1.8, '#64748b'))),
    rect(37.6, 29.8, 6.8, 1.6, '#22c55e', { class: 'p-blink-led' }),
    circle(12, 24, 4, '#7f1d1d', { stroke: '#111827', 'stroke-width': 1 }), circle(12, 24, 2.6, '#ef4444', { class: 'p-blink-dot' }),
    rect(-2, 89, 54, 3, '#4b5563', { rx: 1 }),
  ],
  // A server rack with blinking lights, a little status screen and colored cables.
  shelf: () => [
    rect(6, 2, 52, 90, '#111827', { rx: 2, stroke: '#374151', 'stroke-width': 1.2 }),
    rect(6, 2, 52, 3, TEAL, { 'fill-opacity': 0.8, class: 'p-glow' }),
    rect(10, 7, 44, 81, '#0b0f17'),
    ...[9, 19, 39, 49, 59, 69, 79].flatMap((y, index) => [
      rect(11, y, 42, 8, '#1f2937', { rx: 1, stroke: '#0b0f17', 'stroke-width': 0.8 }),
      path(`M14 ${y + 2.4} H30 M14 ${y + 4} H30 M14 ${y + 5.6} H30`, 'none', { stroke: '#111827', 'stroke-width': 0.8 }),
      circle(36, y + 4, 1.3, index % 3 === 0 ? '#fbbf24' : '#22c55e', { class: index % 2 ? 'p-blink-led' : 'p-blink-dot' }),
      circle(40.4, y + 4, 1.3, TEAL, { class: index % 2 ? 'p-blink-dot' : 'p-blink-led' }),
      circle(44.8, y + 4, 1.3, '#22c55e', { 'fill-opacity': 0.5 }),
      rect(48, y + 2.6, 3.4, 2.8, '#374151', { rx: 0.5 }),
    ]),
    rect(11, 29, 42, 8, '#1f2937', { rx: 1, stroke: '#0b0f17', 'stroke-width': 0.8 }),
    rect(13, 30.4, 22, 5.2, '#0b2a31'),
    path('M14 33 L17 33 L18.4 31.2 L20 34.8 L21.6 32 L23 33.6 L24.4 33 L34 33', 'none', { stroke: TEAL, 'stroke-width': 0.8 }),
    path('M53 23 Q60 30 57 46 Q55 58 60 72 M53 42 Q62 52 58 66 Q56 78 61 90', 'none', { stroke: '#3b82f6', 'stroke-width': 1.4 }),
    path('M53 63 Q59 70 57 80 Q56 86 60 92', 'none', { stroke: '#f59e0b', 'stroke-width': 1.4 }),
    rect(8, 89, 9, 3, '#374151'), rect(47, 89, 9, 3, '#374151'),
  ],
  // A buttoned leather sofa with a tartan throw over one arm.
  sofa: () => {
    const leather = '#8a4b2e';
    const leatherDark = '#5e301b';
    return [
      rect(10, 8, 130, 30, leather, { rx: 9, stroke: leatherDark, 'stroke-width': 1.4 }),
      ...[[22, 16], [40, 16], [58, 16], [76, 16], [94, 16], [112, 16], [130, 16], [31, 25], [49, 25], [67, 25], [85, 25], [103, 25], [121, 25]]
        .map(([cx, cy]) => circle(cx, cy, 1.2, leatherDark)),
      path('M22 16 L31 25 L40 16 L49 25 L58 16 L67 25 L76 16 L85 25 L94 16 L103 25 L112 16 L121 25 L130 16', 'none', { stroke: '#7a3e24', 'stroke-width': 0.8 }),
      rect(12, 29, 126, 13, '#9a5636', { rx: 4, stroke: leatherDark, 'stroke-width': 1.2 }),
      path('M54 30 V41 M96 30 V41', 'none', { stroke: leatherDark, 'stroke-width': 1 }),
      path('M16 31 H50 M58 31 H92 M100 31 H134', 'none', { stroke: '#b9714a', 'stroke-width': 1.2, 'stroke-linecap': 'round' }),
      rect(0, 18, 20, 32, leather, { rx: 8, stroke: leatherDark, 'stroke-width': 1.3 }),
      rect(130, 18, 20, 32, leather, { rx: 8, stroke: leatherDark, 'stroke-width': 1.3 }),
      ellipse(10, 20, 9, 3.6, '#a35e3c'), ellipse(140, 20, 9, 3.6, '#a35e3c'),
      rect(8, 42, 134, 10, leatherDark, { rx: 3 }),
      rect(16, 52, 5, 10, '#2a1c14', { rx: 1 }), rect(129, 52, 5, 10, '#2a1c14', { rx: 1 }),
      path('M118 14 L142 12 Q150 30 145 52 L121 53 Q125 32 118 14 Z', '#b91c1c', { stroke: '#7f1d1d', 'stroke-width': 1 }),
      path('M126 14 Q131 33 128 52 M136 13 Q142 32 138 52', 'none', { stroke: '#14532d', 'stroke-width': 3, 'stroke-opacity': 0.85 }),
      path('M120.6 24 L145.4 22 M122.6 38 L147 36.6', 'none', { stroke: '#14532d', 'stroke-width': 3, 'stroke-opacity': 0.85 }),
      path('M129 14 Q134 33 131 52 M121.6 31 L146.6 29.4', 'none', { stroke: '#facc15', 'stroke-width': 0.8, 'stroke-opacity': 0.8 }),
      path('M122 53 v3 M125 53 v3 M128 53 v3 M131 53 v3 M134 52.6 v3 M137 52.6 v3 M140 52.4 v3 M143 52.2 v3', 'none', { stroke: '#b91c1c', 'stroke-width': 1 }),
    ];
  },
  // A round rug with a compass rose.
  rug: () => [compassRose()],
  // A tea station: a sideboard with a china teapot, a cup and saucer, and a tartan biscuit tin.
  coffee: () => [
    rect(3, 50, 50, 38, '#5a3a24', { rx: 2, stroke: '#3a2416', 'stroke-width': 1.2 }),
    rect(1, 47, 54, 5, '#6e4a2e', { rx: 1.4, stroke: '#3a2416', 'stroke-width': 1 }),
    rect(7, 56, 42, 14, '#2a1c12'),
    path('M7 72 H49 M28 72 V86', 'none', { stroke: '#3a2416', 'stroke-width': 1.2 }),
    circle(25, 79, 1.2, BRASS), circle(31, 79, 1.2, BRASS),
    rect(5, 88, 4, 4, '#3a2416'), rect(47, 88, 4, 4, '#3a2416'),
    path('M12 70 V62 Q12 58.6 19 58.6 Q26 58.6 26 62 V70 Z', '#b91c1c', { stroke: '#7f1d1d', 'stroke-width': 0.8 }),
    path('M16 59 V70 M22 59 V70 M12 63 H26 M12 67 H26', 'none', { stroke: '#14532d', 'stroke-width': 1.4 }),
    ellipse(19, 58.6, 7, 1.6, '#991b1b'),
    ellipse(38, 69, 8, 1.4, '#e5e7eb'), ellipse(38, 67, 8, 1.4, '#f3f4f6'), ellipse(38, 65, 8, 1.4, '#f9fafb', { stroke: '#cbd5e1', 'stroke-width': 0.5 }),
    ellipse(37, 63.4, 4, 1.4, '#e8c37a', { stroke: '#b98a3a', 'stroke-width': 0.5 }),
    path('M8 30 Q-2 30 3 38 Q6 42 9.4 42', 'none', { stroke: '#e8eef5', 'stroke-width': 2.6 }),
    path('M8 30 Q-2 30 3 38 Q6 42 9.4 42', 'none', { stroke: '#94a3b8', 'stroke-width': 0.6 }),
    ellipse(19, 37, 11, 9.6, '#f1f5f9', { stroke: '#94a3b8', 'stroke-width': 1 }),
    path('M8.4 36 Q19 40 29.6 36', 'none', { stroke: '#2563eb', 'stroke-width': 2.2 }),
    path('M12 40.6 q2 -2 4 0 q2 -2 4 0 q2 -2 4 0', 'none', { stroke: '#2563eb', 'stroke-width': 0.9 }),
    path('M28.4 38 Q33 36 34 28 L36.6 27 Q36 38 29.4 42 Z', '#f1f5f9', { stroke: '#94a3b8', 'stroke-width': 0.9 }),
    ellipse(19, 28.4, 6.4, 2, '#e2e8f0', { stroke: '#94a3b8', 'stroke-width': 0.8 }), circle(19, 26, 1.8, '#2563eb'),
    path('M35.4 24 q-1.6 -3 0 -6 M38 23 q-1.6 -3 0 -6', 'none', { stroke: '#e5e7eb', 'stroke-width': 1.1, 'stroke-linecap': 'round', class: 'p-glow' }),
    ellipse(44, 46.4, 8, 1.6, '#f8fafc', { stroke: '#94a3b8', 'stroke-width': 0.7 }),
    path('M39.4 39.6 H48.6 L47.6 45.6 Q44 46.8 40.4 45.6 Z', '#f8fafc', { stroke: '#94a3b8', 'stroke-width': 0.8 }),
    path('M48.4 41 q2.8 0 2.6 2 q-0.2 1.8 -2.8 1.6', 'none', { stroke: '#94a3b8', 'stroke-width': 0.9 }),
    ellipse(44, 39.8, 4.4, 1, '#a16207'),
    path('M40.6 42.6 q1.4 -1.2 2.8 0 q1.4 -1.2 2.8 0', 'none', { stroke: '#2563eb', 'stroke-width': 0.7 }),
  ],
  // A sleek water dispenser: a blue bottle, a lit niche with two taps and a glass.
  cooler: () => [
    path('M10 30 V14 Q10 6 18 6 Q26 6 26 14 V30 Z', '#93c5fd', { 'fill-opacity': 0.85, stroke: '#3b82f6', 'stroke-width': 1 }),
    path('M12.6 12 Q13 9 16 8.4', 'none', { stroke: '#ffffff', 'stroke-opacity': 0.7, 'stroke-width': 1.4, 'stroke-linecap': 'round' }),
    path('M10 18 H26', 'none', { stroke: '#60a5fa', 'stroke-width': 0.8 }),
    circle(16, 24, 1.2, '#dbeafe', { class: 'cooler-bubble' }), circle(20, 26, 0.9, '#dbeafe', { class: 'cooler-bubble cooler-bubble-2' }),
    rect(13, 29, 10, 4, '#64748b'),
    rect(5, 32, 26, 58, '#e5e7eb', { rx: 4, stroke: '#94a3b8', 'stroke-width': 1.1 }),
    rect(27, 34, 2.4, 54, '#cbd5e1', { rx: 1 }),
    rect(9, 44, 18, 26, '#1e293b', { rx: 2.4 }),
    rect(10, 45, 16, 2, '#38bdf8', { class: 'p-glow' }),
    rect(12, 48, 3.4, 4, '#3b82f6', { rx: 0.8 }), rect(20.6, 48, 3.4, 4, '#ef4444', { rx: 0.8 }),
    path('M13.7 52 V56', 'none', { stroke: '#7dd3fc', 'stroke-width': 1, 'stroke-dasharray': '1.4 1.6', class: 'p-pour' }),
    path('M10.6 58 H17 L16.4 66 H11.2 Z', '#e0f2fe', { 'fill-opacity': 0.6, stroke: '#94a3b8', 'stroke-width': 0.6 }),
    rect(11.2, 62, 5.2, 4, '#7dd3fc', { 'fill-opacity': 0.8 }),
    rect(9, 66, 18, 3, '#64748b', { rx: 1 }),
    circle(18, 78, 1.6, '#38bdf8', { class: 'p-glow' }),
    rect(3, 88, 30, 4, '#94a3b8', { rx: 1.4 }),
  ],
  // 0: a snake plant in a modern pot (the lounge corner); 1: a flowering thistle in a stone pot (by the door).
  plant: variant => variant % 2 === 0
    ? [
      ...[['M16 48 Q10 30 13 8 Q18 28 20 48 Z', '#3f7d4a'], ['M20 48 Q20 24 24 2 Q27 24 25 48 Z', '#4a8a52'], ['M24 48 Q28 28 34 10 Q33 30 28 48 Z', '#3f7d4a'],
        ['M13 48 Q4 36 3 22 Q10 34 17 48 Z', '#4a8a52'], ['M27 48 Q36 38 41 24 Q38 40 31 48 Z', '#4a8a52']].flatMap(([d, color]) => [
        path(d, color, { stroke: '#c9d36a', 'stroke-width': 1.2, 'stroke-linejoin': 'round' }),
      ]),
      path('M14 30 l3 -1 M14 38 l3 -1 M21 20 l3 -1 M21 30 l3 -1 M21 40 l3 -1 M28 26 l3 -1 M27 36 l3 -1 M8 34 l3 -1 M34 34 l3 -1', 'none', { stroke: '#2a5a34', 'stroke-width': 1.2, 'stroke-linecap': 'round' }),
      path('M9 46 H35 L33 70 H11 Z', '#2a3442', { stroke: '#111827', 'stroke-width': 1.2 }),
      rect(8, 44, 28, 4, '#374151', { rx: 1.4 }),
      path('M10 54 H34', 'none', { stroke: TEAL, 'stroke-width': 1.4, 'stroke-opacity': 0.7 }),
    ]
    : [
      path('M22 50 Q21 34 16 20 M22 50 Q23 34 28 16 M22 50 Q22 38 22 26', 'none', { stroke: '#5f8a4a', 'stroke-width': 1.8 }),
      path('M22 48 L12 42 L15 41 L9 36 L14 37 L12 31 L18 38 L19 44 Z M22 46 L32 40 L29 39.6 L35 35 L30 35.6 L33 30 L26 36.6 L25 42 Z', '#6a9a5a', { stroke: '#46703c', 'stroke-width': 0.8 }),
      ...[[16, 20, 1], [28, 16, 1.1], [22, 26, 0.9]].flatMap(([x, y, s]) => [
        ellipse(x, y + 4 * s, 4 * s, 4.4 * s, '#5f8a4a', { stroke: '#46703c', 'stroke-width': 0.8 }),
        path(`M${x - 3 * s} ${y + 2 * s} l2 2 M${x + 3 * s} ${y + 2 * s} l-2 2 M${x - 2 * s} ${y + 6 * s} l2 -1.6 M${x + 2 * s} ${y + 6 * s} l-2 -1.6`, 'none', { stroke: '#46703c', 'stroke-width': 0.7 }),
        path(`M${x - 4 * s} ${y + 1} Q${x - 4.4 * s} ${y - 5 * s} ${x - 1.6 * s} ${y - 7 * s} M${x - 2 * s} ${y} Q${x - 1.6 * s} ${y - 6 * s} ${x} ${y - 8 * s} M${x} ${y} Q${x} ${y - 6 * s} ${x + 1.6 * s} ${y - 8 * s} M${x + 2 * s} ${y} Q${x + 2.4 * s} ${y - 5 * s} ${x + 4 * s} ${y - 6.4 * s} M${x + 4 * s} ${y + 1} Q${x + 5 * s} ${y - 3 * s} ${x + 6 * s} ${y - 4 * s}`,
          'none', { stroke: '#9b4fd1', 'stroke-width': 1.8 * s, 'stroke-linecap': 'round' }),
        path(`M${x - 2.6 * s} ${y - 1} Q${x} ${y - 5 * s} ${x + 2.6 * s} ${y - 1}`, 'none', { stroke: '#c084fc', 'stroke-width': 1.2 * s, 'stroke-linecap': 'round' }),
      ]),
      path('M10 52 H34 L31 70 H13 Z', '#8e8a82', { stroke: '#5f5b55', 'stroke-width': 1.1 }),
      rect(8, 49, 28, 5, '#a39f96', { rx: 1.4, stroke: '#5f5b55', 'stroke-width': 1 }),
      path('M14 58 l3 2 M24 62 l4 -1 M18 66 l3 -1', 'none', { stroke: '#6f6b64', 'stroke-width': 0.8 }),
    ],
};

// ---------------------------------------------------------------------------
// Stations (viewBox 68 20 72 96, floor at y = 112)
// ---------------------------------------------------------------------------

// The world in miniature for the console's map screen (360 x 150 map space: longitude + 180, 80 - latitude).
const MINI_WORLD = 'M12 14 L40 10 L80 10 L87 26 L95 30 L102 19 L118 20 L125 28 L104 45 L100 54 L90 51 L83 54 L83 60 L96 66 L102 72 L92 68 L75 60 L63 48 L56 32 L45 23 L20 22 Z '
  + 'M118 3 L162 2 L160 10 L137 21 L124 9 Z M102 72 L120 70 L145 87 L141 100 L122 118 L112 135 L107 120 L110 98 L100 86 Z '
  + 'M171 43 L176 32 L188 26 L186 18 L205 9 L260 7 L285 3 L340 10 L360 12 L343 20 L337 30 L320 28 L315 36 L301 50 L290 60 L285 71 L280 76 L272 58 L260 65 L258 72 L247 55 L237 55 L226 68 L216 49 L207 40 L192 36 L180 41 Z '
  + 'M163 59 L172 75 L189 76 L193 97 L198 114 L206 114 L220 95 L231 68 L223 68 L213 49 L190 43 L170 50 Z M176 22 L180 27 L175 25 Z M318 34 L322 36 L313 47 Z '
  + 'M294 102 L310 92 L322 91 L333 107 L330 117 L311 111 L297 115 Z M311 82 L326 84 L328 89 L316 88 Z';

const stations = {
  // A gadget console: a map screen with a blinking target, a radar, a code screen, a keyboard and a satellite phone.
  gadgetdesk: () => [
    rect(72, 82, 66, 5, '#2c3846', { rx: 1.4, stroke: '#111827', 'stroke-width': 1 }),
    path('M73 82.6 H137', 'none', { stroke: TEAL, 'stroke-width': 0.8, 'stroke-opacity': 0.7 }),
    rect(75, 87, 4, 25, '#1f2937', { rx: 1 }),
    rect(114, 87, 22, 25, '#1f2937', { rx: 1.4, stroke: '#111827', 'stroke-width': 1 }),
    path('M114 95 H136 M114 103 H136', 'none', { stroke: '#111827', 'stroke-width': 1 }),
    rect(122, 90, 6, 1.6, '#64748b', { rx: 0.6 }), rect(122, 98, 6, 1.6, '#64748b', { rx: 0.6 }), rect(122, 106, 6, 1.6, '#64748b', { rx: 0.6 }),
    circle(132, 91, 1, '#22c55e', { class: 'p-blink-led' }),
    rect(102.6, 70, 4.8, 10, '#374151'), rect(97, 79, 16, 3, '#374151', { rx: 1 }),
    rect(86, 45, 38, 26, '#111827', { rx: 2, stroke: '#374151', 'stroke-width': 1 }),
    rect(88.4, 47.4, 33.2, 21.2, '#0b2a31'),
    // The transform sits on a plain group: animated classes move the transform origin of their own element.
    svg('g', { transform: 'translate(88.8 49.2) scale(0.091 0.125)' }, path(MINI_WORLD, '#2dd4bf', { 'fill-opacity': 0.8, class: 'p-holo' })),
    path('M104.9 52.2 Q112 45.6 117.9 54.7', 'none', { stroke: '#fbbf24', 'stroke-width': 0.7, 'stroke-dasharray': '1.4 1' }),
    circle(104.9, 52.2, 1.1, '#ccfbf1'),
    circle(117.9, 54.7, 1.6, '#f43f5e', { class: 'p-blink-dot' }), circle(117.9, 54.7, 3.4, 'none', { stroke: '#fb7185', 'stroke-width': 0.6, class: 'p-glow' }),
    path('M89 48.6 H121', 'none', { stroke: '#ffffff', 'stroke-opacity': 0.12, 'stroke-width': 1 }),
    path('M73 52 L86 50 L86 74 L73 72 Z', '#111827', { stroke: '#374151', 'stroke-width': 1 }),
    path('M75 54 L84 52.6 L84 71.6 L75 70.2 Z', '#0b2a31'),
    circle(79.6, 62, 6, 'none', { stroke: '#2dd4bf', 'stroke-width': 0.6, 'stroke-opacity': 0.7 }), circle(79.6, 62, 3, 'none', { stroke: '#2dd4bf', 'stroke-width': 0.5, 'stroke-opacity': 0.6 }),
    svg('g', { class: 'p-dial' }, circle(79.6, 62, 6, 'none'), path('M79.6 62 L79.6 56 A6 6 0 0 1 84.8 59 Z', TEAL, { 'fill-opacity': 0.6 })),
    circle(82, 59.6, 0.8, '#fbbf24'),
    path('M124 50 L137 52 L137 72 L124 74 Z', '#111827', { stroke: '#374151', 'stroke-width': 1 }),
    path('M126 52.6 L135 54 L135 70.4 L126 71.6 Z', '#0b2a31'),
    ...[56, 59.4, 62.8, 66.2].map((y, index) => rect(127, y, index % 2 ? 5 : 7, 1.4, index === 3 ? '#fbbf24' : TEAL, { class: 'p-screen-line' })),
    path('M84 80.6 L112 80.6 L114 83 L82 83 Z', '#1f2937', { stroke: '#111827', 'stroke-width': 0.6 }),
    path('M86 81.8 H110', 'none', { stroke: '#64748b', 'stroke-width': 0.8, 'stroke-dasharray': '1.4 0.8' }),
    rect(126, 74, 7, 8, '#374151', { rx: 1.4, stroke: '#111827', 'stroke-width': 0.6 }), line(131.6, 74, 131.6, 67.6, '#64748b', 1),
    circle(131.6, 67, 1.1, '#f43f5e', { class: 'p-blink-led' }), rect(127.4, 75.6, 4, 2.6, TEAL),
    rect(74.4, 75, 6, 7, '#e5e7eb', { rx: 1, stroke: '#94a3b8', 'stroke-width': 0.6 }), path('M80.4 77 q2.4 0 2.2 1.8 q-0.2 1.6 -2.2 1.4', 'none', { stroke: '#94a3b8', 'stroke-width': 0.8 }),
  ],
  // A vault safe to crack: a combination dial, a spoked handle, a stethoscope, gold bars and a flashlight beam.
  safe: () => [
    path('M84 107 L100 73 L108 80 Z', '#fef08a', { 'fill-opacity': 0.22, class: 'p-glow' }),
    rect(80, 52, 50, 56, '#4b5563', { rx: 3, stroke: '#1f2937', 'stroke-width': 1.2 }),
    rect(84, 56, 42, 48, '#6b7280', { rx: 2, stroke: '#374151', 'stroke-width': 0.9 }),
    path('M85 57 H125', 'none', { stroke: '#9ca3af', 'stroke-width': 1 }),
    rect(81, 62, 4, 8, '#374151', { rx: 1 }), rect(81, 90, 4, 8, '#374151', { rx: 1 }),
    rect(84, 107, 9, 5, '#1f2937', { rx: 1 }), rect(117, 107, 9, 5, '#1f2937', { rx: 1 }),
    circle(100, 78, 10, '#d1d5db', { stroke: '#374151', 'stroke-width': 1.2 }),
    svg('g', { class: 'p-dial' },
      circle(100, 78, 10, 'none'),
      ...Array.from({ length: 12 }, (_, index) => line(100, 69.4, 100, index % 3 === 0 ? 72 : 71, '#374151', index % 3 === 0 ? 1 : 0.6, { transform: `rotate(${index * 30} 100 78)` })),
      circle(100, 78, 4.4, '#9ca3af', { stroke: '#4b5563', 'stroke-width': 0.8 }), rect(99.4, 73.6, 1.2, 4, '#4b5563')),
    path('M98.4 66.4 L101.6 66.4 L100 68.6 Z', '#dc2626'),
    circle(118, 84, 2.6, '#9ca3af', { stroke: '#374151', 'stroke-width': 0.8 }),
    ...[0, 120, 240].map(degrees => line(118, 84, 118, 76, '#4b5563', 1.6, { transform: `rotate(${degrees} 118 84)` })),
    ...[0, 120, 240].map(degrees => circle(118, 76, 1.6, '#d1d5db', { stroke: '#4b5563', 'stroke-width': 0.6, transform: `rotate(${degrees} 118 84)` })),
    path('M110 52 L113 45 H127 L130 52 Z', '#facc15', { stroke: '#a16207', 'stroke-width': 0.8 }),
    path('M113 45 L115.6 39.6 H125 L127 45 Z', '#fde047', { stroke: '#a16207', 'stroke-width': 0.8 }),
    path('M114 47 H126', 'none', { stroke: '#fef9c3', 'stroke-width': 0.8 }),
    path('M93 68 Q86.6 61 88.6 55 Q90 51 95 51 H99.6', 'none', { stroke: '#1f2937', 'stroke-width': 1.5 }),
    path('M99.6 51 L107 48.8 M99.6 51 L107 51.2', 'none', { stroke: '#94a3b8', 'stroke-width': 1.1 }),
    circle(107.4, 48.6, 1.1, '#1f2937'), circle(107.4, 51.2, 1.1, '#1f2937'),
    circle(93, 69, 2.8, '#cbd5e1', { stroke: '#4b5563', 'stroke-width': 0.8 }), circle(93, 69, 1.2, '#94a3b8'),
    rect(70, 106, 14, 5.4, '#1f2937', { rx: 1.6, transform: 'rotate(-14 77 108.6)' }),
    rect(81.6, 103.6, 3.6, 6.6, '#374151', { rx: 0.8, transform: 'rotate(-14 77 108.6)' }),
    circle(84.4, 105.4, 1.4, '#fef9c3', { transform: 'rotate(-14 77 108.6)' }),
  ],
};

export default Object.freeze({
  archetypes: { fieldAgent, techGenius, disguiseMaster, infiltrator, handler },
  decor,
  stations,
});
