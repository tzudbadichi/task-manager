// The shuk: an Israeli open-air market of Jerusalem stone - vendors in aprons calling out their prices,
// spice merchants with brass scoops, a baker with a tray of sesame bagels, shoppers pulling their
// trolleys, a young darbuka player and the market's cats - and its furniture: a stone arch with a blue
// door, a spice shelf, plastic stools around low tables, a mint-tea tray, a fresh-juice press, a lemon
// tree and herbs growing in olive-oil tins.
// Original designs for this app: the feel of the place, no real people, brands or signs.
// Coordinates: figure-kit.js (characters), world-layout.js ART (furniture), viewBox 68 20 72 96 (stations).

import { circle, darker, ellipse, lighter, line, path, rect } from '../svg-kit.js';
import {
  BEARD, BUILDS, HAIR, arm, belt, blob, box, buttons, dot, headBase, leg, limb, longGarmentPath, nose, pick,
  pickWeighted, rngOf, shade, shape, stroke, torsoPath,
} from '../figure-kit.js';

const TOON_EYES = Object.freeze({ anchors: [[43, 41], [52, 41]], style: 'toon' });
const STONE = '#e8d6ac';
const STONE_DARK = '#c9b182';
const WOOD = '#a8743f';
const WOOD_DARK = '#6e4a28';
const BRASS = '#d9a83a';
const BRASS_DARK = '#9a7420';
const MINT = '#4e9a3c';

const HUMAN_SKINS = ['#f6d7bd', '#efc8a6', '#e2b38c', '#d29f74', '#b9845a', '#8f5f3c', '#6e4630'];
const HAIR_COLORS = ['#1f1a17', '#2b1d14', '#4a2f1c', '#6b4226', '#8a5a2e', '#c08a4a'];

// ---------------------------------------------------------------------------
// Hats, scarves and glasses
// ---------------------------------------------------------------------------

/** A flat cap, its crown sloping forward onto a short visor. */
const flatCap = color => [
  shape('M30.4 37.6 Q28.8 26.6 41.6 24.4 Q54.4 22.8 60.2 31.4 Q62.4 34.4 60.4 36.2 Q45 33.2 30.4 37.6 Z', color),
  shape('M57.4 33.2 Q62.4 33 65.4 35.4 Q62.4 37.4 57.8 37 Z', darker(color, 0.2)),
  stroke('M33.4 31.4 Q44 27.2 58.4 31', darker(color, 0.22), 0.7),
  dot(43.6, 24.6, 1.1, darker(color, 0.2)),
];

/** A small crocheted kippah on the crown of the head. */
const kippah = (color, ring) => [
  shape('M31.8 30.4 Q33.4 21.2 42.6 20.8 Q50.6 21 52.6 25.6 Q42 24.6 31.8 30.4 Z', color),
  stroke('M34.6 27.6 Q41.6 23.6 49.6 23.8', ring, 1),
];

/** A headscarf wrapped over the hair and knotted at the back of the head. */
const headscarf = (color, dots) => [
  dot(29.6, 32, 5.6, color),
  shape('M27.6 35 Q21.4 42 24.4 51 Q27.6 45 31.4 38.4 Z', color),
  shape('M29.6 43 Q28 23 46 21.4 Q63 22 62.6 37.4 Q56 28.6 46 29.4 Q36.4 30 33 38 Q31.6 42 32 47 Z', color),
  ...[[38, 25], [46, 23.6], [54, 25], [33.6, 31], [59.4, 30.4], [29, 30], [42, 28]].map(([cx, cy]) => circle(cx, cy, 0.8, dots)),
  stroke('M33 38 Q37 30.6 46 29.6 Q56 29 62.4 37', darker(color, 0.25), 0.9),
];

/** A wide sun hat with a ribbon. */
const sunHat = (color, ribbon) => [
  blob(46, 31.6, 23, 5, color),
  shape('M35.6 31.4 Q35 18.6 46 18 Q57 18.6 56.4 31.4 Z', color),
  shape('M35.4 27.6 Q46 29.6 56.6 27.6 L56.5 30.8 Q46 32.8 35.5 30.8 Z', ribbon),
  stroke('M25 33 Q46 38 67 33', darker(color, 0.18), 0.7),
];

/** A baseball cap with the peak to the front. */
const baseballCap = color => [
  shape('M31 37.6 A15 14 0 0 1 61 36.6 Q46 33.6 31 37.6 Z', color),
  shape('M57 35.4 H69 a1.6 1.6 0 0 1 0 3.2 H57.6 Z', darker(color, 0.2)),
  dot(46, 23.4, 1.3, darker(color, 0.25)),
];

/** A baker's white cap. */
const bakerCap = () => [shape('M31.6 36.6 Q30.6 24 46 23 Q61.4 24 60.4 36.6 Q46 33.4 31.6 36.6 Z', '#f8f6f0'),
  shape('M31.2 33.6 Q46 30.2 60.8 33.6 L60.6 37 Q46 33.8 31.4 37 Z', '#e8e4da'), stroke('M38 26 Q46 23.6 54 26', '#dcd6c8', 0.8)];

/** Round glasses at the eye anchors. */
const roundGlasses = color => [
  circle(43, 41, 3.4, 'none', { stroke: color, 'stroke-width': 0.9 }), circle(52.6, 41, 3.4, 'none', { stroke: color, 'stroke-width': 0.9 }),
  path('M46.4 40.6 Q47.8 39.6 49.2 40.6 M39.6 40.4 L33.6 39.4', 'none', { stroke: color, 'stroke-width': 0.9 }),
];

/** Sunglasses pushed up on the hair. */
const sunglassesUp = () => [path('M38 30.4 Q41 28.4 44.6 29.6 L44 32.4 Q40.4 33.6 38.4 32.6 Z M48 29.4 Q52 28 55.4 29.8 L54.6 32.6 Q51 33.4 48.4 32.2 Z', '#2b2b33', { stroke: '#111111', 'stroke-width': 0.6 }),
  path('M44.6 30.6 Q46.4 29.6 48 30.4', 'none', { stroke: '#111111', 'stroke-width': 0.8 })];

/** A fuller mustache than the kit's. */
const bushyMustache = color => shape('M41.2 47.4 Q44.2 44.2 47.6 45.8 Q51 44.2 54 47.4 Q52 49.6 47.6 48.4 Q43.2 49.6 41.2 47.4 Z', color);

/** A bib apron in the category color: neck strap, a pocket and a waist tie. */
const bibApron = () => [
  shape('M38.4 59.4 H53.6 L54.2 68 Q57.6 70 58.2 74 L59.6 102.4 Q46 105.4 32.4 102.4 L33.8 74 Q34.4 70 37.8 68 Z', 'cat'),
  stroke('M38.8 59.8 L40.8 55.4 M53.2 59.8 L51.2 55.4', 'cat-dark', 1.6),
  shape('M41 80 H51 V87.4 Q46 88.8 41 87.4 Z', 'cat-dark'),
  stroke('M34.2 70.6 Q46 73 57.8 70.6', 'cat-dark', 1.2),
];

/** A human face. */
function humanFace(skin, { hair, brows, beard = null, mustache = null, hat = null, eyewear = null, noseSize = 1, mouthY = 47.4, cheeks = null }) {
  return {
    back: hair?.back ?? null,
    base: headBase(skin),
    features: nose(skin, noseSize),
    eyes: TOON_EYES,
    brows,
    beforeMouth: beard,
    mouth: { anchor: [47.6, mouthY] },
    front: [hair?.front ?? null, mustache],
    eyewear,
    hat,
    cheeks,
  };
}

// ---------------------------------------------------------------------------
// Things held in the back hand (at about (34,83); they swing with the arm)
// ---------------------------------------------------------------------------

const orange = (cx, cy, r = 2.6) => [circle(cx, cy, r, '#f39a1e', { stroke: '#b8650e', 'stroke-width': 0.6 }), circle(cx - r * 0.35, cy - r * 0.35, r * 0.3, '#ffd08a')];

/** An elongated sesame bagel ring seen from above. */
const bagel = (cx, cy) => [ellipse(cx, cy, 5.6, 3.1, 'none', { stroke: '#8a4e1e', 'stroke-width': 3.4 }), ellipse(cx, cy, 5.6, 3.1, 'none', { stroke: '#d58e44', 'stroke-width': 2.4 }),
  ...[[-3.6, -1.6], [0, -3], [3.6, -1.6], [-4.4, 1.2], [4.4, 1.2], [0, 3]].map(([dx, dy]) => circle(cx + dx, cy + dy, 0.45, '#fbf0d0'))];

const HELD = {
  pomegranate: () => [dot(29.6, 86.4, 4.6, '#b8283a'), path('M27.8 82.2 l0.8 -2.4 l1 1.6 l1 -1.6 l0.8 2.4 Z', '#8a1a2a'), circle(28, 85, 1.2, '#e5687a', { 'fill-opacity': 0.7 })],
  produceBag: () => [stroke('M32 84 Q34 80 36 84 M30 84 Q31 81 33 83', '#e8eef4', 1.2),
    shape('M25.6 84.4 H38 L39.6 100 Q32 103 24.4 100 Z', '#f4f8fb', { 'fill-opacity': 0.92 }), ...orange(29, 95, 3), ...orange(34.4, 96, 3), ...orange(31.6, 90.4, 3)],
  herbs: () => [stroke('M34 84 L33 98', '#3f7a2e', 1.2), ...[[30, 98], [33, 100], [36, 98.6], [31.6, 103], [35, 103]].map(([cx, cy]) => dot(cx, cy, 2.6, MINT, { 'stroke-width': 0.6 })),
    box(31.6, 84.4, 3.4, 3, '#c0392b', { rx: 0.6 })],
  melonSlice: () => [shape('M22.6 82 Q33.4 98 44 82 Z', '#e8443c'), stroke('M22.6 82 Q33.4 98 44 82', '#3f8a3a', 2.2), stroke('M24 83 Q33.4 95 42.6 83', '#c8e8b0', 0.9),
    ...[[30, 85.4], [33.4, 87], [36.8, 85.4], [33.4, 84]].map(([cx, cy]) => ellipse(cx, cy, 0.5, 0.8, '#1f1a17'))],
  spiceScoop: (spice = '#c8402a') => [shape('M21 83.6 Q21 90.6 27.6 90.6 H33.6 L34 83.6 Z', BRASS), shape('M22 83.8 Q27.4 77.6 33.4 83.8 Z', spice),
    ...[[25, 82], [28, 80.4], [31, 82]].map(([cx, cy]) => circle(cx, cy, 0.5, darker(spice, 0.25))), stroke('M33.6 85.6 L38 84.6', BRASS_DARK, 2)],
  bagelTray: () => [path('M12.6 86.2 H38.6 L37.4 89.4 H13.8 Z', '#b98a52', { stroke: '#6e4a28', 'stroke-width': 0.9 }),
    ...bagel(18.6, 83.2), ...bagel(29.8, 83.2), ...bagel(24.2, 79.4)],
  trolley: (fabric = '#2f5d8a', check = '#c0392b') => [
    stroke('M34 82.4 L33.4 86 L21.4 108', '#6b7280', 1.6),
    shape('M24.6 85 L34 87.4 L28.8 107.6 L19.4 105.2 Z', fabric),
    stroke('M23.2 90.4 L32.6 92.8 M21.8 96 L31.2 98.4 M20.6 101.4 L30 103.8 M27.6 86 L22.8 106 M31.4 87 L26.6 107', check, 1),
    stroke('M27.2 85.6 l-3 -8.4 M29.4 86.2 l-0.6 -9.6 M31.6 86.8 l2 -8', '#5e9a3c', 1.8), stroke('M27.2 85.6 l-1 -2.8 M29.4 86.2 l-0.2 -3.2', '#e8f0d8', 1.8),
    dot(21.2, 108.6, 3.4, '#1f2937'), dot(21.2, 108.6, 1.2, '#9aa3ad', { 'stroke-width': 0.3 }),
  ],
  basket: () => [...orange(27, 82.6, 2.4), ...orange(31.4, 82, 2.4), dot(29.2, 80.6, 2.2, '#b8283a'), stroke('M33 81.4 l2 -4', MINT, 1.6),
    shape('M21 83.4 H37 L35 95 Q29 97 23 95 Z', '#c9a064'), stroke('M22 87 H36 M23 91 H35 M25 83.4 L26 95 M29 83.4 V96 M33 83.4 L32 95', '#9a7440', 0.7),
    stroke('M22 83.4 Q29 74 36 83.4', '#9a7440', 1.4)],
  netBag: () => [stroke('M33 83 L30 86 M35 83 L37 86', '#d97706', 1), shape('M26 86 H40 Q42 96 33 101 Q24 96 26 86 Z', 'none', { stroke: '#d97706', 'stroke-width': 0.6 }),
    ...orange(30, 90, 2.8), ...orange(36, 90.4, 2.8), ...orange(33, 95.4, 2.8),
    stroke('M27 90 L39 90 M27.6 94 L38.4 94 M29.6 98 L36.4 98 M30 86 L33 101 M36 86 L33 101', '#d97706', 0.5)],
  darbuka: () => [
    shape('M21 84.6 Q20.6 92.4 26.2 95.4 L26.6 99 Q23.4 102.4 22.6 106.6 H33.6 Q32.8 102.4 29.6 99 L30 95.4 Q35.6 92.4 35.2 84.6 Z', '#b0763a'),
    stroke('M21.6 88.6 Q28 91 34.6 88.6', '#f4efe6', 1.4),
    ...[[23.6, 92], [28, 93.4], [32.4, 92]].map(([cx, cy]) => path(`M${cx} ${cy - 1.4} l1.2 1.4 l-1.2 1.4 l-1.2 -1.4 Z`, '#f4efe6')),
    stroke('M23.2 104.6 H33', '#f4efe6', 1),
    blob(28.1, 84.6, 7.4, 2.2, '#f2e8d4'),
  ],
  fish: () => [shape('M34.4 83 Q39.6 89.6 36 100 Q34.6 103.6 33 100 Q29.4 89.6 34.4 83 Z', '#b8c4cf'), shape('M31.6 80.6 L34.4 84.4 L37.2 80.6 Q34.4 82.4 31.6 80.6 Z', '#9aa7b4'),
    stroke('M33 92 Q34.6 93.6 36.4 92 M32.6 95.4 Q34.4 97 36.2 95.4', '#7c8a98', 0.6), circle(34.6, 99, 0.8, '#1f2937'), stroke('M33.6 86 Q34.4 92 34.2 98', '#e6eef4', 0.7)],
};

// ---------------------------------------------------------------------------
// Archetypes (looks: figure-kit.js composeFigure)
// ---------------------------------------------------------------------------

/** A vendor: a flat cap (or a kippah), a mustache, a t-shirt and a bib apron in the category color, a pomegranate or a bag of oranges. */
function vendor(look) {
  const random = rngOf(look);
  const skin = pick(HUMAN_SKINS, random);
  const hairColor = pick(HAIR_COLORS, random);
  const shirt = pick(['#f1efe8', '#e6ecf2', '#2b2b33', '#d8e6d0', '#f3dcc4', '#9fb4c8'], random);
  const trousers = pick(['#3f5a7f', '#4a4038', '#2f2a28', '#5a5550'], random);
  const build = pick(['regular', 'round', 'broad'], random);
  const headwear = pickWeighted([['cap', 55], ['kippah', 15], [null, 30]], random);
  const hair = pickWeighted([[HAIR.shortCrop(hairColor), 50], [HAIR.bald(hairColor), 25], [HAIR.curlyMop(hairColor), 25]], random);
  const facialHair = pickWeighted([['mustache', 45], ['short', 25], ['stubble', 20], [null, 10]], random);
  const held = pickWeighted([['pomegranate', 30], ['produceBag', 25], ['herbs', 20], ['melonSlice', 15], [null, 10]], random);
  const sleeves = { style: 'short', sleeve: shirt, hand: skin };
  const legs = { trousers, feet: 'shoe', shoes: pick(['#3b2c22', '#1f1a17', '#f1efe8'], random) };
  return {
    shadowWidth: 18,
    legBack: leg('back', legs),
    legFront: leg('front', legs),
    armBack: arm('back', sleeves),
    armFront: arm('front', sleeves),
    torso: [shape(torsoPath(build), shirt), bibApron()],
    held: HELD[held]?.() ?? null,
    head: humanFace(skin, {
      hair,
      brows: darker(hairColor, 0.1),
      beard: facialHair === 'short' ? BEARD.short(hairColor) : facialHair === 'stubble' ? BEARD.stubble(hairColor) : null,
      mustache: facialHair === 'mustache' || facialHair === 'short' ? bushyMustache(darker(hairColor, 0.05)) : null,
      mouthY: 48,
      hat: headwear === 'cap' ? flatCap(pick(['#6b6158', '#4a4038', '#8a7a62', '#3a3f4a', '#7a5a3a'], random))
        : headwear === 'kippah' ? kippah(pick(['#f1efe8', '#2b2b33', '#3e6a96'], random), pick(['#3e6a96', '#c0392b', '#d9a83a'], random)) : null,
    }),
  };
}

/** A spice merchant: older, round glasses, a vest (or a cardigan) in the category color, a brass scoop of spice. */
function spiceMerchant(look) {
  const random = rngOf(look);
  const skin = pick(HUMAN_SKINS, random);
  const isWoman = random() < 0.4;
  const hairColor = pick(['#d8d4cc', '#a8a29e', '#eeebe4', '#6b6158', '#2b1d14'], random);
  const shirt = pick(['#f4f1ea', '#e6ecf2', '#d8e2ea', '#efe3c4'], random);
  const trousers = pick(['#4a4038', '#5a5550', '#3f4a5a', '#6b5a48'], random);
  const spice = pick(['#c8402a', '#e2a51c', '#8a5a2e', '#6b8a3a', '#d9681e'], random);
  const glasses = random() < 0.7 ? pick(['#6b6158', '#2b2b33', '#9a7420'], random) : null;
  const legs = { trousers, feet: 'shoe', shoes: '#3b2c22' };
  if (isWoman) {
    const scarf = pick(['#2f5d8a', '#7a3a6a', '#3f7a4a', '#c0392b', '#6b6158'], random);
    return {
      shadowWidth: 17,
      legBack: leg('back', { ...legs, trousers: 'cat-dark', width: 6 }),
      legFront: leg('front', { ...legs, trousers: 'cat-dark', width: 6 }),
      armBack: arm('back', { sleeve: 'cat', hand: skin, cuff: 'cat-dark' }),
      armFront: arm('front', { sleeve: 'cat', hand: skin, cuff: 'cat-dark' }),
      torso: [shape(longGarmentPath('slim', { hem: 106, flare: 6 }), pick(['#4a4038', '#3f4a5a', '#6b5a48', '#2f2a28'], random)),
        shape('M36.8 57 Q40 55 44 56.6 L45.4 66 L45.6 90 Q41 91 37.4 89.6 Q35.6 74 36.8 57 Z', 'cat'),
        shape('M55.2 57 Q52 55 48 56.6 L46.6 66 L46.4 90 Q51 91 54.6 89.6 Q56.4 74 55.2 57 Z', 'cat'),
        buttons(47.4, [70, 76, 82], '#f4f1ea', 0.9), shape('M44 56.6 L46 60 L48 56.6 Z', shirt)],
      held: HELD.spiceScoop(spice),
      head: humanFace(skin, { hair: { back: null, front: null }, brows: darker(hairColor, 0.2), eyewear: glasses && roundGlasses(glasses), hat: headscarf(scarf, lighter(scarf, 0.6)), cheeks: '#f0a08a' }),
    };
  }
  return {
    shadowWidth: 18,
    legBack: leg('back', legs),
    legFront: leg('front', legs),
    armBack: arm('back', { style: 'rolled', sleeve: shirt, hand: skin }),
    armFront: arm('front', { style: 'rolled', sleeve: shirt, hand: skin }),
    torso: [
      shape(torsoPath('round'), shirt),
      shape('M33.8 58 Q37.4 55.4 42 56.2 L45.4 66 L45.6 90 Q39.4 91.4 34.2 89.4 Q31.6 74 33.8 58 Z', 'cat'),
      shape('M58.2 58 Q54.6 55.4 50 56.2 L46.6 66 L46.4 90 Q52.6 91.4 57.8 89.4 Q60.4 74 58.2 58 Z', 'cat'),
      shade('M50 56.2 L46.6 66 L46.4 90 Q52.6 91.4 57.8 89.4 Q60.4 74 58.2 58 Q54.6 55.4 50 56.2 Z', '#000000', 0.1),
      stroke('M37 68 H42 M50.2 68 H55', 'cat-dark', 1.2),
      buttons(46, [69, 75, 81], '#f4f1ea', 0.8),
    ],
    held: HELD.spiceScoop(spice),
    head: humanFace(skin, {
      hair: random() < 0.6 ? HAIR.bald(hairColor) : HAIR.shortCrop(hairColor),
      brows: darker(hairColor, 0.25),
      beard: random() < 0.45 ? BEARD.short(hairColor) : null,
      mustache: bushyMustache(darker(hairColor, 0.08)),
      mouthY: 48,
      eyewear: glasses && roundGlasses(glasses),
      hat: random() < 0.35 ? flatCap(pick(['#6b6158', '#8a7a62', '#3a3f4a'], random)) : null,
    }),
  };
}

/** A baker: a t-shirt in the category color, a floury white apron, a white cap, a tray of long sesame bagels. */
function baker(look) {
  const random = rngOf(look);
  const skin = pick(HUMAN_SKINS, random);
  const hairColor = pick(HAIR_COLORS, random);
  const isWoman = random() < 0.35;
  const trousers = pick(['#e8e4da', '#4a4038', '#3f5a7f'], random);
  const build = isWoman ? 'slim' : pick(['regular', 'round'], random);
  const sleeves = { style: 'short', sleeve: 'cat', hand: skin };
  const legs = { trousers, feet: 'shoe', shoes: pick(['#f1efe8', '#3b2c22'], random) };
  const { x, width } = BUILDS[build];
  return {
    shadowWidth: 18,
    legBack: leg('back', legs),
    legFront: leg('front', legs),
    armBack: arm('back', sleeves),
    armFront: arm('front', sleeves),
    torso: [
      shape(torsoPath(build), 'cat'),
      shape('M44 56.4 Q46 59.6 48 56.4', 'cat-dark'),
      shape(`M${x + 0.4} 76 H${x + width - 0.4} L${x + width + 2} 101 Q46 104 ${x - 2} 101 Z`, '#f8f6f0'),
      stroke(`M${x} 77 H${x + width}`, '#dcd6c8', 1.4),
      ...[[40, 86, 2.4], [50, 93, 3], [43, 97, 1.8]].map(([cx, cy, r]) => circle(cx, cy, r, '#ffffff', { 'fill-opacity': 0.9 })),
      ...[[38, 66, 1.6], [53, 62, 1.2]].map(([cx, cy, r]) => circle(cx, cy, r, '#ffffff', { 'fill-opacity': 0.6 })),
    ],
    held: HELD.bagelTray(),
    head: humanFace(skin, {
      hair: isWoman ? HAIR.braids(hairColor) : HAIR.shortCrop(hairColor),
      brows: darker(hairColor, 0.1),
      beard: !isWoman && random() < 0.35 ? BEARD.stubble(hairColor) : null,
      mustache: !isWoman && random() < 0.3 ? bushyMustache(hairColor) : null,
      hat: bakerCap(),
      cheeks: '#f0a08a',
    }),
  };
}

/** A shopper: a blouse in the category color, sunglasses up, pulling a checked shopping trolley (or a basket, a net of oranges). */
function shopper(look) {
  const random = rngOf(look);
  const skin = pick(HUMAN_SKINS, random);
  const hairColor = pick(HAIR_COLORS, random);
  const isMan = random() < 0.35;
  if (isMan) {
    const shorts = pick(['#c9b48e', '#5a6a7a', '#3f5a7f', '#7a6a52'], random);
    const legs = { trousers: shorts, length: 'short', skin, feet: 'sandal', shoes: '#6b4a2e' };
    return {
      shadowWidth: 18,
      legBack: leg('back', legs),
      legFront: leg('front', legs),
      armBack: arm('back', { style: 'short', sleeve: 'cat', hand: skin }),
      armFront: arm('front', { style: 'short', sleeve: 'cat', hand: skin }),
      torso: [shape(torsoPath(pick(['regular', 'round'], random)), 'cat'), shape('M42.4 56 L46 61 L49.6 56 Z', 'cat-dark'),
        stroke('M43.4 57 L44 62 M48.6 57 L48 62', 'cat-dark', 0.9), buttons(46, [61.4], '#f4f1ea', 0.8)],
      held: HELD[pickWeighted([['netBag', 45], ['basket', 35], ['produceBag', 20]], random)](),
      head: humanFace(skin, {
        hair: random() < 0.4 ? HAIR.bald(hairColor) : HAIR.shortCrop(hairColor),
        brows: darker(hairColor, 0.1),
        beard: random() < 0.4 ? BEARD.short(hairColor) : null,
        hat: random() < 0.5 ? baseballCap(pick(['#f1efe8', '#2f5d8a', '#c0392b', '#3a3f4a'], random)) : null,
      }),
    };
  }
  const skirt = pick(['#3f5a7f', '#2b2b33', '#e8dcc4', '#7a3a3a', '#5e7a5a'], random);
  const hasHat = random() < 0.3;
  const hair = hasHat ? HAIR.longStraight(hairColor) : pick([HAIR.curlyMop(hairColor), HAIR.longWavy(hairColor), HAIR.topKnot(hairColor)], random);
  const held = pickWeighted([['trolley', 60], ['basket', 40]], random);
  const fabric = pick([['#2f5d8a', '#c0392b'], ['#3f7a4a', '#f1c40f'], ['#7a3a6a', '#f4efe6'], ['#c0392b', '#2b2b33']], random);
  return {
    shadowWidth: 17,
    legBack: leg('back', { trousers: skin, feet: 'sandal', shoes: '#8a5a32', skin, width: 6 }),
    legFront: leg('front', { trousers: skin, feet: 'sandal', shoes: '#8a5a32', skin, width: 6 }),
    armBack: arm('back', { style: 'short', sleeve: 'cat', hand: skin }),
    armFront: arm('front', { style: 'short', sleeve: 'cat', hand: skin }),
    torso: [
      shape(longGarmentPath('slim', { hem: 100, flare: 5 }), skirt),
      shape(torsoPath('slim', { bottom: 80 }), 'cat'),
      shape('M42.6 56 Q46 60.4 49.4 56', 'cat-dark'),
      stroke('M38 56.6 L56 84', '#6b4a2e', 1.2),
      shape('M52.6 81 H60 L60.6 88 Q56.4 89.4 52.2 88 Z', pick(['#8a5a32', '#c9a064', '#2b2b33'], random)),
    ],
    held: held === 'trolley' ? HELD.trolley(...fabric) : HELD.basket(),
    head: humanFace(skin, {
      hair,
      brows: darker(hairColor, 0.1),
      hat: hasHat ? sunHat(pick(['#efe2c4', '#f4f1ea', '#e9c873'], random), pick(['#c0392b', '#2f5d8a', '#2b2b33'], random)) : sunglassesUp(),
      cheeks: '#f0a08a',
    }),
  };
}

/** A young musician: curly hair, a t-shirt in the category color, jeans, sneakers and a darbuka under the arm. */
function musician(look) {
  const random = rngOf(look);
  const skin = pick(HUMAN_SKINS, random);
  const hairColor = pick(HAIR_COLORS, random);
  const hair = pick([HAIR.curlyMop(hairColor), HAIR.shaggy(hairColor), HAIR.longWavy(hairColor), HAIR.topKnot(hairColor)], random);
  const jeans = pick(['#3f5a7f', '#4b6890', '#2b2b33', '#6b7280'], random);
  const legs = { trousers: jeans, feet: 'shoe', shoes: '#f4f4f0' };
  return {
    shadowWidth: 16,
    legBack: [leg('back', legs), stroke('M37.6 110.6 H45', '#c0392b', 0.8)],
    legFront: [leg('front', legs), stroke('M50.2 110.6 H58', '#c0392b', 0.8)],
    armBack: arm('back', { style: 'short', sleeve: 'cat', hand: skin }),
    armFront: arm('front', { style: 'short', sleeve: 'cat', hand: skin }),
    torso: [shape(torsoPath('slim'), 'cat'), shape('M42.6 56 Q46 60 49.4 56', 'cat-dark'),
      path('M41 70 l2.6 -3 l2.4 3 l2.4 -3 l2.6 3', 'none', { stroke: '#ffffff', 'stroke-opacity': 0.7, 'stroke-width': 1.2 }),
      belt('slim', 88.6, '#3b2c22', '#c9ced6')],
    held: HELD.darbuka(),
    headScale: 1.02,
    head: humanFace(skin, {
      hair,
      brows: darker(hairColor, 0.1),
      beard: random() < 0.25 ? BEARD.stubble(hairColor) : null,
      hat: random() < 0.25 ? baseballCap(pick(['#2b2b33', '#f1efe8', '#c0392b'], random)) : null,
      cheeks: '#f0a08a',
    }),
  };
}

/** A shuk cat on its hind legs: a tabby (or calico, black, cream) with a vest in the category color, sometimes a stolen fish. */
function shukCat(look) {
  const random = rngOf(look);
  const [fur, marks, belly] = pick([
    ['#e39a4a', '#b8692a', '#f8e6cc'], ['#9aa3ad', '#6b7480', '#eef0f2'], ['#3a3436', null, '#f4f1ea'],
    ['#efe2c8', '#d0b080', '#fbf6ec'], ['#f6f1e8', '#e39a4a', '#ffffff'], ['#7a6a5a', '#4a3f34', '#d8cdbd'],
  ], random);
  const isCalico = fur === '#f6f1e8';
  const held = pickWeighted([['fish', 50], [null, 50]], random);
  const outline = darker(fur, 0.45);
  const paw = belly;
  const legOf = side => {
    const [hx, hy] = side === 'back' ? [41, 88] : [51, 88];
    const [ax, ay] = side === 'back' ? [40.4, 107] : [52, 107];
    return [limb(hx, hy, ax, ay, 8.4, fur), blob(ax + 1.6, 110.2, 5.4, 3, paw)];
  };
  const stripes = marks && !isCalico ? stroke('M41.4 27.6 l0.6 4.4 M46 26.4 v4.6 M50.6 27.6 l-0.6 4.4', marks, 1.6) : null;
  return {
    shadowWidth: 16,
    behind: [
      stroke('M38 88 Q24 92 21 80 Q19 70 25.4 62', outline, 7),
      stroke('M38 88 Q24 92 21 80 Q19 70 25.4 62', fur, 5),
      marks && stroke('M27 90 l1.6 -3.6 M21.6 83 l3.6 -1 M20.6 75 l3.6 0.6 M22.6 67 l3 1.4', marks, 1.6),
    ],
    legBack: legOf('back'),
    legFront: legOf('front'),
    armBack: [limb(37, 62, 34.6, 80.6, 6, fur), dot(34.2, 83, 3.4, paw)],
    armFront: [limb(55, 62, 57.4, 80.6, 6, fur), dot(58, 83, 3.4, paw)],
    torso: [
      shape(torsoPath('round'), fur),
      blob(46.4, 76, 8, 12, belly, { class: 'p-no-outline', stroke: 'none' }),
      isCalico && [blob(38, 66, 4, 5, '#3a3436', { stroke: 'none' }), blob(53, 84, 4.4, 3.6, '#e39a4a', { stroke: 'none' })],
      marks && !isCalico && stroke('M34 70 h4 M33.4 78 h4.6 M58 70 h-4 M58.6 78 h-4.6', marks, 1.4),
      shape('M33.8 58 Q37.4 55.4 41.4 56.6 L43.4 66 L43 86 Q38 87 34.4 85.4 Q31.8 72 33.8 58 Z', 'cat'),
      shape('M58.2 58 Q54.6 55.4 50.6 56.6 L49 66 L49.4 86 Q54.4 87 57.8 85.4 Q60.4 72 58.2 58 Z', 'cat'),
      buttons(51, [70, 76], BRASS, 0.9),
    ],
    held: HELD[held]?.() ?? null,
    headScale: 1.06,
    head: {
      back: [shape('M32.6 33.4 L31.4 17.4 L43 25.4 Z', fur), shape('M49 24.6 L60.6 16.8 L61 32.6 Z', fur),
        shape('M34 30.6 L33.4 20.6 L40.4 25.8 Z', '#f4a6b8', { stroke: 'none' }), shape('M51.6 24.6 L59 19.6 L59.2 29.6 Z', '#f4a6b8', { stroke: 'none' })],
      base: [dot(46, 40, 15, fur), isCalico && [path('M33 32 Q37 24 46 25.6 Q42 32 36 38 Z', '#3a3436'), path('M52 26 Q60 28 61 38 Q56 36 52 26 Z', '#e39a4a')]],
      features: [
        stripes,
        blob(49, 46.6, 6.4, 4.4, belly, { stroke: 'none' }),
        path('M47.6 43.4 H51.4 L49.5 45.6 Z', '#e8758a'),
        stroke('M55 45.6 l7.4 -1.6 M55 47.4 l7.4 1 M43 45.6 l-7.4 -1.6 M43 47.4 l-7.4 1', fur === '#3a3436' ? '#d8d4cc' : '#5a5250', 0.6),
      ],
      eyes: { anchors: [[42.8, 39.6], [53, 39.6]], style: 'toon', color: '#2a2a1c' },
      brows: null,
      mouth: { anchor: [49.4, 49.4], width: 0.6 },
    },
  };
}

// ---------------------------------------------------------------------------
// Furniture (world-layout.js ART sizes)
// ---------------------------------------------------------------------------

const leaf = (cx, cy, angle, color = MINT, size = 1) => ellipse(cx, cy, 3.4 * size, 1.6 * size, color, { transform: `rotate(${angle} ${cx} ${cy})`, stroke: darker(color, 0.3), 'stroke-width': 0.5 });
const bougainvillea = (cx, cy) => [circle(cx, cy, 2.6, '#d6338a', { stroke: '#9a1f60', 'stroke-width': 0.5 }), circle(cx + 2.4, cy + 1.8, 2.2, '#e8559e', { stroke: '#9a1f60', 'stroke-width': 0.5 })];

/** A plastic stool seen from the side, its seat at y 32. */
function plasticStool(x, color) {
  const edge = darker(color, 0.3);
  return [
    path(`M${x - 11} 36 L${x - 15} 64 H${x - 10.4} L${x - 7} 36 Z M${x + 11} 36 L${x + 15} 64 H${x + 10.4} L${x + 7} 36 Z`, color, { stroke: edge, 'stroke-width': 0.9 }),
    path(`M${x - 12.6} 50 H${x + 12.6}`, 'none', { stroke: color, 'stroke-width': 2.4 }),
    rect(x - 14, 31, 28, 5.4, color, { rx: 1.6, stroke: edge, 'stroke-width': 1 }),
    path(`M${x - 11} 32.4 H${x + 8}`, 'none', { stroke: '#ffffff', 'stroke-opacity': 0.45, 'stroke-width': 1 }),
  ];
}

/** A tulip-shaped glass of tea with a sprig of mint. */
const teaGlass = (x, bottom) => [
  path(`M${x - 2.6} ${bottom - 8} H${x + 2.6} L${x + 1.8} ${bottom} H${x - 1.8} Z`, '#c8742a', { 'fill-opacity': 0.85, stroke: '#e6eef4', 'stroke-width': 0.6 }),
  leaf(x + 1.6, bottom - 9.6, -40, MINT, 0.7), leaf(x + 3, bottom - 8.6, 10, '#5fae48', 0.6),
];

const decor = {
  // A stone arch with a blue door, a fanlight grille, a lantern and bougainvillea over the wall.
  door: () => [
    path('M-3 4 H53 V92 H-3 Z', STONE, { stroke: STONE_DARK, 'stroke-width': 1.2 }),
    path('M-3 16 H5 M45 16 H53 M-3 30 H4 M46 30 H53 M-3 44 H4 M46 44 H53 M-3 58 H5 M45 58 H53 M-3 72 H5 M45 72 H53 M-3 86 H5 M45 86 H53 M-3 4 V92', 'none', { stroke: STONE_DARK, 'stroke-width': 0.8 }),
    path('M2 4 V16 M48 16 V30 M0 30 V44 M50 44 V58 M2 58 V72 M48 72 V86', 'none', { stroke: STONE_DARK, 'stroke-width': 0.8 }),
    path('M4 92 V42 A21 21 0 0 1 46 42 V92 H40 V42 A15 15 0 0 0 10 42 V92 Z', '#ddc496', { stroke: STONE_DARK, 'stroke-width': 1 }),
    path('M4 42 H10 M6.4 31.6 L11.6 34.6 M13.4 23.6 L16.4 28.8 M25 21 V27 M36.6 23.6 L33.6 28.8 M43.6 31.6 L38.4 34.6 M40 42 H46 M4 60 H10 M40 60 H46 M4 78 H10 M40 78 H46', 'none', { stroke: '#b8986a', 'stroke-width': 0.9 }),
    path('M22.4 20.6 H27.6 L27 27.4 H23 Z', '#ecdcb4', { stroke: '#b8986a', 'stroke-width': 0.8 }),
    path('M10 92 V42 A15 15 0 0 1 40 42 V92 Z', '#2f6db3', { stroke: '#1d4a80', 'stroke-width': 1.2 }),
    path('M10 42 A15 15 0 0 1 40 42 Z', '#1f3550'),
    path('M25 42 V27 M25 42 L14.4 31.4 M25 42 L35.6 31.4 M12 42 A13 13 0 0 1 38 42', 'none', { stroke: '#3a3f4a', 'stroke-width': 1.2 }),
    path('M10 42.6 H40 M25 43 V92', 'none', { stroke: '#1d4a80', 'stroke-width': 1.4 }),
    rect(13, 47, 9, 18, 'none', { stroke: '#4a86c8', 'stroke-width': 1.2, rx: 1 }), rect(28, 47, 9, 18, 'none', { stroke: '#4a86c8', 'stroke-width': 1.2, rx: 1 }),
    rect(13, 70, 9, 17, 'none', { stroke: '#4a86c8', 'stroke-width': 1.2, rx: 1 }), rect(28, 70, 9, 17, 'none', { stroke: '#4a86c8', 'stroke-width': 1.2, rx: 1 }),
    ...[[17.5, 56], [32.5, 56], [17.5, 78.5], [32.5, 78.5]].map(([cx, cy]) => circle(cx, cy, 0.9, '#c9ced6')),
    circle(28.6, 67, 2.4, 'none', { stroke: BRASS, 'stroke-width': 1 }), circle(28.6, 64.6, 0.9, BRASS),
    rect(2, 88, 46, 4.6, '#d4bd8e', { rx: 0.8, stroke: STONE_DARK, 'stroke-width': 0.8 }),
    path('M50 24 V30 M47 30 H53 L52 40 H48 Z', '#3a3f4a', { stroke: '#22262e', 'stroke-width': 0.6 }), rect(48.6, 31.4, 2.8, 7, '#ffd97a', { class: 'p-glow' }),
    ...[[-6, 30], [-4, 22], [0, 16], [-2, 8], [6, 6], [12, 2], [20, 0], [4, 12], [-6, 40], [-2, 48]].flatMap(([cx, cy]) => [leaf(cx + 3, cy + 3, 30, '#4e8a32'), ...bougainvillea(cx, cy)]),
  ],
  // A spice shelf: jars on top, cones of spice in tins in the middle, open sacks of nuts and beans below.
  shelf: () => [
    rect(2, 6, 60, 86, '#8a5a32', { rx: 1.6, stroke: '#5e3a1a', 'stroke-width': 1.2 }),
    path('M-1 4 H65 V10 H-1 Z', '#6e4423', { stroke: '#4a2c16', 'stroke-width': 1 }),
    rect(6, 10, 52, 78, '#5e3a1f'),
    rect(5, 34, 54, 3, '#a8743f'), rect(5, 62, 54, 3, '#a8743f'),
    ...[[11, '#c8402a'], [19.6, '#e2a51c'], [28.2, '#6b8a3a'], [36.8, '#8a5a2e'], [45.4, '#d9681e'], [54, '#f4efe6']].flatMap(([x, color]) => [
      rect(x - 3.6, 20, 7.2, 14, '#e6eef4', { rx: 1.6, 'fill-opacity': 0.8, stroke: '#9aa7b0', 'stroke-width': 0.6 }),
      rect(x - 3, 24, 6, 9.4, color, { rx: 1 }), rect(x - 3.2, 17.6, 6.4, 2.8, BRASS, { rx: 0.6, stroke: BRASS_DARK, 'stroke-width': 0.4 })]),
    ...[[13, '#c8402a'], [26, '#e2a51c'], [39, '#8a5a2e'], [52, '#5f8a3a']].flatMap(([x, color]) => [
      path(`M${x - 6} 56 Q${x - 1} 42 ${x} 41 Q${x + 1} 42 ${x + 6} 56 Z`, color, { stroke: darker(color, 0.3), 'stroke-width': 0.7 }),
      path(`M${x} 41 Q${x + 1} 42 ${x + 6} 56 H${x + 2} Q${x + 1} 48 ${x} 41 Z`, '#000000', { 'fill-opacity': 0.15 }),
      path(`M${x - 7} 55 H${x + 7} L${x + 6} 62 H${x - 6} Z`, '#c9ced6', { stroke: '#7c8692', 'stroke-width': 0.7 })]),
    ...[[14, '#c9a064', '#d9b47a'], [32, '#c9a064', '#a8742a'], [50, '#c9a064', '#7a8a3a']].flatMap(([x, sack, inside]) => [
      path(`M${x - 8} 88 Q${x - 9} 76 ${x - 6} 70 H${x + 6} Q${x + 9} 76 ${x + 8} 88 Z`, sack, { stroke: '#8a6a3a', 'stroke-width': 0.8 }),
      ellipse(x, 70.4, 6.8, 2.6, darker(sack, 0.2)), ellipse(x, 70, 5.6, 1.9, inside),
      path(`M${x - 6} 70 Q${x} 73.4 ${x + 6} 70`, 'none', { stroke: lighter(sack, 0.3), 'stroke-width': 1.6 })]),
    path('M47 69 L54 60 L56 61.6 L49.4 70.4 Z', BRASS, { stroke: BRASS_DARK, 'stroke-width': 0.5 }),
  ],
  // Plastic stools around two low tables: a backgammon board, glasses of tea and sunflower seeds.
  sofa: () => [
    ...[55, 96].flatMap(x => [rect(x - 3, 40, 6, 24, WOOD_DARK, { rx: 1 }), ellipse(x, 40, 13, 3.2, WOOD, { stroke: WOOD_DARK, 'stroke-width': 1 }), ellipse(x, 64, 7, 1.6, '#000000', { 'fill-opacity': 0.12 })]),
    path('M45 38.4 L48 31 H62 L65 38.4 Z', '#8a5a32', { stroke: '#4a2c16', 'stroke-width': 0.8 }),
    path('M47.6 37.4 L49.6 32.2 L51 37.4 Z M51 37.4 L52.4 32.2 L53.8 37.4 Z M56.2 37.4 L57.6 32.2 L59 37.4 Z M59 37.4 L60.4 32.2 L62 37.4 Z', '#c0392b'),
    path('M49.6 32.2 L51 37.4 L52.4 32.2 M57.6 32.2 L59 37.4 L60.4 32.2', 'none', { stroke: '#f4efe6', 'stroke-width': 0.8 }),
    line(55, 31, 55, 38.4, '#4a2c16', 0.8),
    ...teaGlass(90, 39), ...teaGlass(96, 39.4), ellipse(103, 38, 5, 1.6, '#f4f1ea', { stroke: '#c9ced6', 'stroke-width': 0.6 }),
    ...[[101, 37], [103, 36.6], [105, 37.2], [102, 36]].map(([cx, cy]) => ellipse(cx, cy, 0.9, 0.5, '#3a3436')),
    ...plasticStool(34, '#d94141'), ...plasticStool(75, '#2f6db3'), ...plasticStool(116, '#3f9a5a'),
    path('M134 62 H150 V44 H134 Z', '#2f6db3', { stroke: '#1d4a80', 'stroke-width': 1 }),
    path('M136 48 H148 M136 53 H148 M136 58 H148', 'none', { stroke: '#1d4a80', 'stroke-width': 1.4 }),
    ...orange(138.6, 42, 2.6), ...orange(143.4, 41.6, 2.6), ...orange(147.6, 42.2, 2.4),
  ],
  // A woven kilim rug with rows of diamonds.
  rug: () => [
    path('M16 6 H184 L196 34 H4 Z', '#b8322a', { stroke: '#7a1f1a', 'stroke-width': 1 }),
    path('M22 10 H178 L187 30 H13 Z', '#e9c873'),
    path('M27 13 H173 L180 27 H20 Z', '#2f4a7a'),
    ...[36, 60, 84, 108, 132, 156].map(x => path(`M${x} 20 L${x + 9} 14.6 L${x + 18} 20 L${x + 9} 25.4 Z`, '#e8443c', { stroke: '#f4efe6', 'stroke-width': 1 })),
    ...[45, 69, 93, 117, 141, 165].map(x => circle(x, 20, 1.6, '#e9c873')),
    path('M22 10 H178 M13 30 H187', 'none', { stroke: '#2f4a7a', 'stroke-width': 1.2, 'stroke-dasharray': '4 3' }),
    path('M4 34 l-2 4 M10 34 l-1 4 M16 34 v4 M184 34 v4 M190 34 l1 4 M196 34 l2 4 M18 6 l-1 -4 M24 6 v-4 M176 6 v-4 M182 6 l1 -4', 'none', { stroke: '#e8dcc4', 'stroke-width': 1.2 }),
  ],
  // A brass tray of mint tea on a folding stand: a teapot, tea glasses and a bunch of fresh mint.
  coffee: () => [
    line(14, 92, 42, 58, WOOD_DARK, 2.4), line(42, 92, 14, 58, WOOD_DARK, 2.4),
    ellipse(28, 58, 26, 6.4, BRASS, { stroke: BRASS_DARK, 'stroke-width': 1.2 }),
    ellipse(28, 57.2, 21, 4.4, '#e8bf5a'), ellipse(28, 57.2, 14, 2.8, 'none', { stroke: '#c49a34', 'stroke-width': 0.8 }),
    path('M8 56 Q6 44 15 41 Q24 44 22 56 Z', '#c9ced6', { stroke: '#6b7280', 'stroke-width': 1 }),
    path('M10.6 41.6 Q15 37.6 19.4 41.6 Z', '#9aa3ad', { stroke: '#6b7280', 'stroke-width': 0.8 }), circle(15, 37.6, 1.4, '#6b7280'),
    path('M21.6 50 Q27 48 28.4 42', 'none', { stroke: '#9aa3ad', 'stroke-width': 2, 'stroke-linecap': 'round' }),
    path('M8.4 46 Q3.6 48 5 53 Q6 55 8.4 54.4', 'none', { stroke: '#6b7280', 'stroke-width': 1.4 }),
    path('M28.4 40 q-2 -3 0 -6 q2 -3 0 -6', 'none', { stroke: '#f1f5f9', 'stroke-width': 1.3, 'stroke-linecap': 'round', class: 'p-steam' }),
    ...teaGlass(31, 57), ...teaGlass(37.4, 57.6), ...teaGlass(43.6, 57),
    ...[[46, 50], [49, 47], [44, 46], [47.6, 43.4], [50.6, 51]].map(([cx, cy], index) => leaf(cx, cy, index * 50 - 60, MINT, 1.1)),
    stroke('M46 57 L47 47 M47.4 57 L49 49', '#3f7a2e', 0.9),
  ],
  // A fresh-juice press on a narrow stand, a glass of orange juice, oranges and pomegranates.
  cooler: () => [
    rect(2, 54, 32, 38, '#3f9a5a', { stroke: '#2a6a3e', 'stroke-width': 1 }),
    path('M2 62 H34 M2 76 H34', 'none', { stroke: '#2a6a3e', 'stroke-width': 0.8 }),
    ...[[8, 70], [14, 70], [20, 70], [26, 70], [11, 66], [17, 66], [23, 66]].flatMap(([cx, cy]) => orange(cx, cy, 2.8)),
    ...[[9, 85], [16, 85], [23, 85], [30, 85], [12.6, 81], [19.6, 81], [26.6, 81]].map(([cx, cy]) => circle(cx, cy, 3, '#b8283a', { stroke: '#7a1a2a', 'stroke-width': 0.6 })),
    rect(0, 50, 36, 5, '#a8743f', { rx: 1, stroke: '#6e4a28', 'stroke-width': 0.9 }),
    rect(6, 47, 16, 3.4, '#3f4650', { rx: 0.8 }),
    rect(8, 22, 3.4, 26, '#3f4650', { rx: 1 }),
    path('M12 38 H20 L18.4 44 H13.6 Z', '#9aa3ad', { stroke: '#4b5563', 'stroke-width': 0.8 }),
    path('M9.6 26 L28 14', 'none', { stroke: '#3f4650', 'stroke-width': 2.4, 'stroke-linecap': 'round' }), circle(28.4, 13.6, 2, '#c0392b'),
    path('M12 30 H20 V36 Q16 38 12 36 Z', '#6b7280', { stroke: '#3f4650', 'stroke-width': 0.8 }),
    path('M16 44.6 V48', 'none', { stroke: '#f39a1e', 'stroke-width': 1.4, 'stroke-dasharray': '1.4 1.6', class: 'p-pour' }),
    path('M24 41 H31 L30.2 50 H24.8 Z', '#f39a1e', { 'fill-opacity': 0.9, stroke: '#e6eef4', 'stroke-width': 0.7 }),
    leaf(31, 39.6, -30, MINT, 0.7), ...orange(4.4, 47.6, 2.4),
  ],
  // 0: a lemon tree in a terracotta pot (the lounge corner); 1: herbs and a geranium in olive-oil tins (by the door).
  plant: variant => variant % 2 === 0
    ? [
      path('M21 46 Q20 34 22 24', 'none', { stroke: '#6b4a2e', 'stroke-width': 2.6 }),
      ...[[12, 22, 9], [22, 14, 10], [32, 21, 9], [17, 30, 8], [28, 30, 8], [22, 22, 8]].map(([cx, cy, r], index) => circle(cx, cy, r, index % 2 ? '#4f8a34' : '#3f7a2a', { stroke: '#2f5a24', 'stroke-width': 0.8 })),
      ...[[10, 18], [26, 10], [34, 24], [18, 32], [29, 31], [22, 21]].map(([cx, cy]) => ellipse(cx, cy, 2.6, 2.1, '#f6d31a', { stroke: '#b89a10', 'stroke-width': 0.6 })),
      ...[[15, 14, 30], [30, 16, -20], [8, 27, 60], [36, 30, -50]].map(([cx, cy, angle]) => leaf(cx, cy, angle, '#5e9b39')),
      path('M6 44 H38 L34 70 H10 Z', '#c0643a', { stroke: '#8a4022', 'stroke-width': 1.2 }),
      rect(4, 42, 36, 5, '#d0744a', { rx: 1.6, stroke: '#8a4022', 'stroke-width': 1 }),
      path('M12 54 H32', 'none', { stroke: '#e8a070', 'stroke-width': 1.2 }),
    ]
    : [
      ...[[8, 34], [12, 30], [16, 33], [10, 26], [14, 24], [6, 30], [18, 28]].map(([cx, cy], index) => leaf(cx, cy, index * 40, MINT, 1.1)),
      ...[[28, 22], [34, 24], [31, 18], [26, 28], [36, 30], [30, 30]].map(([cx, cy], index) => leaf(cx, cy, index * 35 - 20, '#3f7a2e', 1.2)),
      ...[[29, 14], [33, 12], [31, 10], [35, 15]].map(([cx, cy]) => circle(cx, cy, 2, '#e8443c', { stroke: '#a82a24', 'stroke-width': 0.5 })),
      stroke('M31 30 L32 16', '#3f7a2e', 0.9),
      rect(2, 36, 18, 34, '#d9b34a', { stroke: '#8a6a1a', 'stroke-width': 1 }), rect(2, 44, 18, 12, '#3f7a4a'), circle(11, 50, 3.4, '#e9c873'),
      rect(22, 32, 18, 38, '#c9ced6', { stroke: '#6b7280', 'stroke-width': 1 }), rect(22, 40, 18, 14, '#c0392b'), path('M26 47 h10', 'none', { stroke: '#f4efe6', 'stroke-width': 1.4 }),
      path('M2 39 H20 M22 35 H40', 'none', { stroke: '#ffffff', 'stroke-opacity': 0.35, 'stroke-width': 1 }),
    ],
};

// ---------------------------------------------------------------------------
// Stations (viewBox 68 20 72 96, floor at y = 112)
// ---------------------------------------------------------------------------

const tomato = (cx, cy, r = 3.2) => [circle(cx, cy, r, '#e0352a', { stroke: '#9a1f18', 'stroke-width': 0.6 }), path(`M${cx - 1.4} ${cy - r + 0.4} l1.4 0.8 l1.4 -0.8`, 'none', { stroke: '#3f7a2e', 'stroke-width': 0.9 })];

const stations = {
  // A fruit and vegetable stall: a striped awning, a hanging bulb, crates of oranges, tomatoes, cucumbers and eggplants.
  stall: () => [
    line(74, 112, 74, 34, WOOD_DARK, 2.2), line(136, 112, 136, 34, WOOD_DARK, 2.2),
    path('M70 28 H140 L143 38 H67 Z', '#f6f1e6', { stroke: '#a8322a', 'stroke-width': 0.8 }),
    path('M70 28 H77 L74.6 38 H67 Z M84 28 H91 L89.4 38 H82 Z M98 28 H105 L104.2 38 H97 Z M112 28 H119 L119 38 H112 Z M126 28 H133 L133.8 38 H127 Z', '#d94141'),
    path('M67 38 q4 4 8 0 q4 4 8 0 q4 4 8 0 q4 4 8 0 q4 4 8 0 q4 4 8 0 q4 4 8 0 q4 4 8 0 q4 4 8 0 Z', '#d94141', { stroke: '#a8322a', 'stroke-width': 0.6 }),
    line(110, 42, 110, 50, '#3a3434', 0.8),
    circle(110, 53, 7, '#ffe9a0', { 'fill-opacity': 0.3, class: 'p-glow' }), circle(110, 53, 2.6, '#fff4c4', { stroke: '#c9a24a', 'stroke-width': 0.6 }),
    rect(72, 86, 66, 5, WOOD, { rx: 1, stroke: WOOD_DARK, 'stroke-width': 1 }),
    rect(76, 91, 4, 21, WOOD_DARK), rect(130, 91, 4, 21, WOOD_DARK),
    path('M73 91 H137 L135 104 H75 Z', '#f6f1e6', { 'fill-opacity': 0.9 }), path('M73 91 H137', 'none', { stroke: '#3f9a5a', 'stroke-width': 2 }),
    rect(94, 68, 40, 10, '#b98a52', { stroke: WOOD_DARK, 'stroke-width': 0.9 }), path('M94 73 H134', 'none', { stroke: WOOD_DARK, 'stroke-width': 0.6 }),
    ...[[98, 65], [104, 65], [110, 65], [116, 65], [122, 65], [128, 65], [101, 60], [107, 60], [113, 60], [119, 60], [125, 60], [104, 55.4], [110, 55.4], [116, 55.4], [122, 55.4]].flatMap(([cx, cy]) => orange(cx, cy, 3)),
    rect(73, 78, 30, 8, '#2f6db3', { stroke: '#1d4a80', 'stroke-width': 0.9 }), path('M76 81 H100 M76 83.6 H100', 'none', { stroke: '#1d4a80', 'stroke-width': 0.8 }),
    ...[[77, 76], [83, 76], [89, 76], [95, 76], [99.6, 76], [80, 71.4], [86, 71.4], [92, 71.4], [97, 71.6]].flatMap(([cx, cy]) => tomato(cx, cy)),
    rect(105, 78, 31, 8, '#3f9a5a', { stroke: '#2a6a3e', 'stroke-width': 0.9 }), path('M108 81 H133 M108 83.6 H133', 'none', { stroke: '#2a6a3e', 'stroke-width': 0.8 }),
    ...[[109, 75.6], [116, 74.6], [123, 75.6]].map(([cx, cy]) => ellipse(cx, cy, 4.6, 2.2, '#4e8a32', { stroke: '#2f5a24', 'stroke-width': 0.6, transform: `rotate(-14 ${cx} ${cy})` })),
    ...[[129.6, 74], [133, 75.6]].map(([cx, cy]) => ellipse(cx, cy, 2.8, 4, '#5a2a6a', { stroke: '#3a1a46', 'stroke-width': 0.6 })),
    path('M129 70.4 l0.6 -2.4 M132.4 71.6 l0.6 -2.4', 'none', { stroke: '#3f7a2e', 'stroke-width': 1.2 }),
    line(88, 76, 88, 66, '#8a6a44', 0.8), rect(84.6, 61, 7, 5, '#ffffff', { stroke: '#c9ced6', 'stroke-width': 0.6 }),
  ],
  // A market dial scale on a crate, tomatoes on its pan, iron weights on the floor.
  scale: () => [
    rect(78, 88, 46, 24, '#b98a52', { stroke: WOOD_DARK, 'stroke-width': 1 }),
    path('M78 96 H124 M78 104 H124', 'none', { stroke: WOOD_DARK, 'stroke-width': 0.8 }),
    path('M86 88 L88 64 H114 L116 88 Z', '#eef2f4', { stroke: '#6b7280', 'stroke-width': 1 }),
    path('M86.6 82 H115.4', 'none', { stroke: '#c0392b', 'stroke-width': 2.4 }),
    circle(101, 74, 8.4, '#ffffff', { stroke: '#4b5563', 'stroke-width': 1.2 }),
    path('M101 66.4 V68 M108.6 74 H107 M93.4 74 H95 M106.4 68.6 L105.2 69.8 M95.6 68.6 L96.8 69.8 M106.4 79.4 L105.2 78.2 M95.6 79.4 L96.8 78.2', 'none', { stroke: '#4b5563', 'stroke-width': 0.8 }),
    path('M94.6 74 H107.4', 'none', { stroke: '#c0392b', 'stroke-width': 1.3, 'stroke-linecap': 'round', class: 'p-dial' }),
    circle(101, 74, 1.3, '#1f2937'),
    rect(99.4, 60, 3.2, 4.4, '#6b7280'),
    path('M84 59 Q101 67 118 59 Z', '#d9a83a', { stroke: BRASS_DARK, 'stroke-width': 1 }),
    ...[[92, 56.4], [98, 56.6], [104, 56.6], [110, 56.4], [95, 52.4], [101, 52], [107, 52.4], [101, 47.6]].flatMap(([cx, cy]) => tomato(cx, cy, 3.1)),
    ...[[127, 112, 6], [127, 102, 4.6], [136, 112, 4.6]].flatMap(([cx, bottom, half]) => [
      path(`M${cx - half} ${bottom} L${cx - half * 0.7} ${bottom - half * 1.4} H${cx + half * 0.7} L${cx + half} ${bottom} Z`, '#3f4650', { stroke: '#1f2937', 'stroke-width': 0.8 }),
      path(`M${cx - half * 0.5} ${bottom - half * 1.4} Q${cx} ${bottom - half * 2.3} ${cx + half * 0.5} ${bottom - half * 1.4}`, 'none', { stroke: '#3f4650', 'stroke-width': 1.4 })]),
  ],
};

export default Object.freeze({
  archetypes: { vendor, spiceMerchant, baker, shopper, musician, shukCat },
  decor,
  stations,
});
