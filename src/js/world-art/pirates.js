// Pirates: a ship's crew at sea - a captain in a long coat and a plumed tricorn, barefoot deckhands in
// striped shirts, a one-eyed quartermaster with a treasure map, a lookout with a spyglass, a parrot and
// the cabin monkey - and the ship's furniture: a cabin door with a porthole, a rack of barrels and rope,
// a hammock over a crate bench, a grog cask, a water butt and potted palms.
// Original designs for this app: the feel of the genre, no characters or designs from books or films.
// Coordinates: figure-kit.js (characters), world-layout.js ART (furniture), viewBox 68 20 72 96 (stations).

import { circle, darker, ellipse, lighter, line, path, rect, svg } from '../svg-kit.js';
import {
  BEARD, BUILDS, HAIR, arm, belt, blob, box, buttons, dot, headBase, leg, limb, longGarmentPath, nose, paint, pick,
  pickWeighted, rngOf, shade, shape, stroke, torsoPath,
} from '../figure-kit.js';

const TOON_EYES = Object.freeze({ anchors: [[43, 41], [52, 41]], style: 'toon' });
const WOOD = '#8a5a32';
const WOOD_DARK = '#5a3820';
const WOOD_LIGHT = '#b07a46';
const IRON = '#2f2a28';
const BRASS = '#e0b84a';
const GOLD = '#f2c94c';
const STEEL = '#c9d1d9';
const ROPE = '#c9a46a';
const PARCHMENT = '#efe0b8';
const SHIRT = '#f6f1e4';

const HUMAN_SKINS = ['#f6d7bd', '#efc8a6', '#e2b38c', '#d29f74', '#b9845a', '#8f5f3c', '#6e4630'];
const HAIR_COLORS = ['#1f1a17', '#2b1d14', '#3d2a1c', '#5a3a22', '#8a3b1a', '#b5651d', '#a8a29e', '#e3c27a'];
const SCARF_COLORS = ['#b8322c', '#1f2937', '#f4efe2', '#d9a441', '#2a4a7a', '#6b2d5c', '#2f6b4f'];

/** Category-colored stripes with no outline (on a shirt). */
const catStripe = (x, y, width, height) => rect(x, y, width, height, null, paint('cat', { outline: false }));
/** A gold hoop earring under the ear. */
const earring = (color = GOLD) => circle(31.8, 47.4, 1.9, 'none', { stroke: color, 'stroke-width': 1.1 });

// ---------------------------------------------------------------------------
// Hats and head scarves (head radius 15 around (46,40))
// ---------------------------------------------------------------------------

/** A three-cornered hat with an upturned brim, a trim and an optional plume sweeping back. */
function tricorn(color, trim, plume) {
  return [
    plume && [shape('M36 22 Q26 4 9 10 Q19 11 24 16 Q14 15 9 22 Q21 18 28 22 Q22 24 20 30 Q28 24 35 26 Z', plume),
      stroke('M35 24 Q26 14 13 13', darker(plume, 0.22), 0.8)],
    shape('M33.4 27 Q33 13 46 12 Q59 13 58.6 27 Z', color),
    shade('M50 13 Q58.6 15 58.6 27 L52 27 Q53 18 50 13 Z', '#000000', 0.18),
    shape('M23 27.6 Q26 19.6 35.6 24.2 Q46 20.4 56.4 24 Q64 18.6 69 26.6 Q63.6 34 51 35.4 Q36 35.4 23 27.6 Z', color),
    stroke('M23.4 27.4 Q26.2 20 35.6 24.4 Q46 20.6 56.4 24.2 Q63.8 18.8 68.6 26.6', trim, 1.4),
    shade('M51 35.4 Q63.6 34 69 26.6 Q64 31 52 31.6 Z', '#000000', 0.2),
  ];
}

/** A tied scarf over the head: knot and tails at the back; dots: an optional polka-dot color. */
function bandana(color, dots = null) {
  return [
    shape('M29.6 36 Q24.4 40 23.2 48 Q27.4 44 31.4 39 Z', darker(color, 0.12)),
    shape('M30.6 37 Q28 43 29 50 Q31.6 44 33 39 Z', color),
    shape('M30.4 39.6 Q29 23 46 22.4 Q62.6 23 61.8 37.4 Q53.4 31.2 44.6 31.8 Q36 32.6 30.4 39.6 Z', color),
    shade('M51 23.4 Q62.6 25.6 61.8 37.4 Q57 33.6 52 32.2 Z', '#000000', 0.14),
    dot(30.6, 35.4, 2.6, color),
    dots && [[38, 27.6], [45, 25.6], [52, 26.6], [57.6, 30.6], [41.6, 30.4], [49, 29.6]].map(([x, y]) => circle(x, y, 0.95, dots)),
  ];
}

/** A knitted sailor's watch cap with a rolled cuff and a little pompom. */
function knitCap(color) {
  return [
    dot(45, 19.6, 2.6, lighter(color, 0.25)),
    shape('M31.4 36 Q30.4 21.6 45.6 21 Q60.6 21.4 60.8 34.4 Z', color),
    stroke('M37 33.6 Q36.6 27 39.4 23.4 M43 33 Q42.6 26 44.4 21.8 M49 33 Q49.6 26 48.6 21.8 M55 33.6 Q56 27.6 54 23', darker(color, 0.2), 0.8),
    shape('M30 37.6 Q45.6 31.6 62 35.6 L61.4 31.2 Q45.6 27.4 30.6 33 Z', darker(color, 0.14)),
  ];
}

// ---------------------------------------------------------------------------
// Things held in the back hand (at about (34,83); they swing with the arm)
// ---------------------------------------------------------------------------

const HELD = {
  cutlass: () => [
    shape('M32.6 80 Q31 66 26.4 52.4 Q33.8 55.6 35.9 68 Q36.6 74 35.6 80 Z', STEEL),
    stroke('M34.4 78 Q33.4 66 29.4 56.4', '#ffffff', 0.7),
    limb(34, 81.4, 34, 88.6, 2.2, '#3a2418'),
    stroke('M29.6 80.6 H38.6 M38.2 80.8 Q41.6 85.4 35.4 89.8', BRASS, 1.6),
    dot(34, 90, 1.5, BRASS),
  ],
  spyglass: () => [
    limb(34.4, 97, 34.1, 88, 3.2, '#5a3820'), limb(34.1, 88, 33.7, 77, 3.9, BRASS), limb(33.7, 77, 33.3, 65, 4.6, BRASS),
    stroke('M31.6 77 H36 M31 66.4 H35.8 M31.8 88 H36.4', '#8a6414', 1.2),
    blob(33.3, 64.6, 2.6, 1, '#9fd4f0'),
  ],
  map: () => [
    shape('M20.6 84.6 Q27 83 34.6 84.6 L35.6 102 Q28.6 100.4 21.6 102 Z', PARCHMENT),
    shape('M24 89 Q26 87 28.6 88.4 Q31 88 31.4 91 Q30 94 27 93.4 Q24 94 24 89 Z', '#a8c77a'),
    stroke('M23 98.6 Q26 96 25.6 92.6 M29.4 91.6 L32.6 96', '#b23a2a', 0.8, { 'stroke-dasharray': '1.2 1.2' }),
    stroke('M31.6 95 l2 2 M33.6 95 l-2 2', '#b23a2a', 0.9),
    limb(20.4, 84.4, 35, 84.4, 2.4, '#e6d2a0'), limb(21.2, 101.8, 35.8, 101.8, 2.4, '#e6d2a0'),
  ],
  mop: () => [
    limb(35.4, 54, 33.4, 103, 2.2, WOOD_LIGHT),
    shape('M26.4 102 Q33 98.4 40.4 102 L42.6 112.4 Q34 110.4 25 112.4 Z', '#d8d2c2'),
    stroke('M29 103 L28 111 M32 101.6 L31.6 111 M35.4 101.8 L36 111 M38.6 102.6 L40 111', '#a8a090', 0.8),
  ],
  bucket: () => [
    stroke('M28.4 88 Q34 79.6 39.6 88', IRON, 1.1),
    shape('M27 88 H41 L39.4 101 H28.6 Z', WOOD),
    stroke('M27.6 91.4 H40.4 M28.2 97.4 H39.8', IRON, 1.3),
    blob(34, 88, 7, 1.4, '#7fb8d8'),
  ],
  lantern: () => [line(34, 84, 34, 89, IRON, 0.9), box(30.4, 89, 7.2, 9.6, '#ffd97a', { rx: 1.4, class: 'p-glow' }),
    stroke('M30.4 89 H37.6 M34 89 V98.6 M30.4 98.6 H37.6', IRON, 1), shape('M29.8 89 L34 86 L38.2 89 Z', IRON)],
  banana: () => [shape('M31 80 Q25.6 89 30.4 98 Q31.4 99 32 97.6 Q29.4 89 34.4 82 Z', '#f6d23c'), stroke('M31 80 l1.4 -2', '#6b4a1e', 1.4), dot(31.4, 98, 0.9, '#6b4a1e')],
  coin: () => [dot(34, 86.4, 3, GOLD), stroke('M33 85 Q34 84.4 35 85', '#b8860b', 0.7)],
};

/** A coil of rope worn across the chest (over the torso). */
const ropeAcross = () => [
  stroke('M34.6 57 Q46 72 57.8 86', '#6e5230', 4.2), stroke('M34.6 57 Q46 72 57.8 86', ROPE, 2.8),
  stroke('M37 61 l1.6 -1 M40.4 65 l1.6 -1 M43.8 69 l1.6 -1 M47.2 73 l1.6 -1 M50.6 77 l1.6 -1 M54 81 l1.6 -1', '#8a6a3a', 0.8),
];

// ---------------------------------------------------------------------------
// Archetypes (looks: figure-kit.js composeFigure)
// ---------------------------------------------------------------------------

/** The captain: a long coat in the category color with gold trim, a plumed tricorn, a beard, a cutlass or a spyglass. */
function captain(look) {
  const random = rngOf(look);
  const skin = pick(HUMAN_SKINS, random);
  const hairColor = pick(HAIR_COLORS, random);
  const hatColor = pick(['#2b2523', '#3a2a22', '#1f2a3a', '#4a1f1f', '#2b2523'], random);
  const plume = pickWeighted([['#f5f5f0', 30], ['#c0392b', 20], ['#2a9d8f', 15], ['#f2c94c', 15], [null, 20]], random);
  const beard = pickWeighted([['short', 35], ['braided', 25], ['mustache', 25], [null, 15]], random);
  const held = pickWeighted([['cutlass', 60], ['spyglass', 25], [null, 15]], random);
  const trousers = pick(['#3a3530', '#efe6d2', '#4a3b2b', '#2b2f3a'], random);
  const build = pick(['regular', 'broad', 'round', 'regular'], random);
  const sash = pick(['#b8322c', '#d9a441', '#6b2d5c', '#1f2937'], random);
  const hair = random() < 0.6 ? HAIR.longWavy(hairColor) : HAIR.braids(hairColor);
  const legs = { trousers, feet: 'tallboot', shoes: '#231c18', width: 7 };
  const sleeves = { sleeve: 'cat', hand: skin, cuff: 'cat-dark', width: 6.4 };
  const { x, width } = BUILDS[build];
  return {
    shadowWidth: 19,
    behind: [hair.back],
    legBack: leg('back', legs),
    legFront: leg('front', legs),
    armBack: arm('back', sleeves),
    armFront: arm('front', sleeves),
    torso: [
      shape(longGarmentPath(build, { hem: 104, flare: 6 }), 'cat'),
      shade(`M50 57 L${x + width - 2} 60 L${x + width + 6} 104 Q56 106 50 106 Z`, '#000000', 0.12),
      shape('M41.2 56 L50.8 56 L50.4 80 L41.6 80 Z', SHIRT),
      shape('M42.4 56.4 Q46 58 49.6 56.4 L48.4 60 Q50 62 47.6 63.4 Q49 65.4 46 67 Q43 65.4 44.4 63.4 Q42 62 43.6 60 Z', '#ffffff'),
      shape('M37.6 56 L42 56 L45 72 L39.4 66 Z', 'cat-dark'), shape('M54.4 56 L50 56 L47 72 L52.6 66 Z', 'cat-dark'),
      stroke(`M41.6 70 L${x + 2.6} 103.6 M50.4 70 L${x + width - 2.6} 103.6`, GOLD, 1),
      buttons(39.4, [70, 75, 87, 93], GOLD, 1.05), buttons(52.6, [70, 75, 87, 93], GOLD, 1.05),
      stroke(`M${x - 5} 103 Q46 107.6 ${x + width + 5} 103`, GOLD, 1.3),
    ],
    overTorso: [
      shape('M37 78 Q46 81 55 78 L55.4 83.6 Q46 86.6 36.6 83.6 Z', sash),
      shape('M53 82 Q57 88 55.6 96 L52.6 95.4 Q53.6 89 50.6 83.6 Z', sash),
      box(43.6, 78.6, 5, 5, GOLD, { rx: 1 }),
    ],
    held: HELD[held]?.() ?? null,
    headScale: 1.02,
    head: {
      base: headBase(skin),
      features: [nose(skin, 1.15), earring()],
      eyes: TOON_EYES,
      brows: darker(hairColor, 0.1),
      beforeMouth: beard === 'short' ? BEARD.short(hairColor) : beard === 'braided' ? BEARD.braided(hairColor, GOLD) : null,
      mouth: { anchor: [47.6, beard === 'short' || beard === 'braided' ? 48.6 : 47.4] },
      front: [hair.front, beard && shape('M40.6 46.4 q3.4 -3 6.8 -0.6 q3.4 -2.4 6.8 0.6 q1.6 2.6 3 1 q-1 3.4 -3.6 2.4 q-3 -1.6 -6.2 -1.4 q-3.6 -0.2 -6.4 1.4 q-2.6 1 -3.4 -2.4 q1.4 1.6 3 -1 Z', darker(hairColor, 0.05))],
      hat: tricorn(hatColor, GOLD, plume),
    },
  };
}

/** A deckhand: a shirt striped in the category color, a bandana, a gold earring, rolled trousers, often barefoot. */
function deckhand(look) {
  const random = rngOf(look);
  const skin = pick(HUMAN_SKINS, random);
  const hairColor = pick(HAIR_COLORS, random);
  const scarf = pick(SCARF_COLORS, random);
  const dots = random() < 0.4 ? (scarf === '#f4efe2' ? '#b8322c' : '#f4efe2') : null;
  const trousers = pick(['#d8c8a0', '#8a7a5a', '#4a5a6a', '#6b5a3a', '#e6dcc4'], random);
  const barefoot = random() < 0.6;
  const held = pickWeighted([['mop', 35], ['bucket', 20], [null, 45]], random);
  const build = pick(['regular', 'broad', 'slim', 'regular'], random);
  const beard = pickWeighted([['stubble', 45], ['short', 15], [null, 40]], random);
  const { x, width } = BUILDS[build];
  const legs = barefoot
    ? { trousers, length: 'knee', lower: skin, skin, feet: 'bare', cuff: lighter(trousers, 0.15), width: 7 }
    : { trousers, feet: 'boot', shoes: '#3a2a20', width: 7 };
  const sleeves = { style: 'rolled', sleeve: SHIRT, hand: skin };
  const hair = HAIR.shaggy(hairColor);
  return {
    shadowWidth: 17,
    behind: [hair.back],
    legBack: leg('back', legs),
    legFront: leg('front', legs),
    armBack: arm('back', sleeves),
    armFront: arm('front', sleeves),
    torso: [
      shape(torsoPath(build), SHIRT),
      [61.6, 68, 74.4, 80.8].map(y => catStripe(x + 0.7, y, width - 1.4, 3.2)),
      catStripe(x + 1.4, 87.2, width - 2.8, 2.6),
      shade(`M50 56 Q${x + width - 2} 56 ${x + width} 64 L${x + width - 1} 91 Q54 92.6 50 92.6 Z`, '#000000', 0.08),
      shape('M40.6 55.6 Q46 61 51.4 55.6 Q46 58 40.6 55.6 Z', darker(skin, 0.05)),
      belt(build, 85.6, '#4a3626', '#c9d1d9'),
    ],
    held: HELD[held]?.() ?? null,
    headScale: 1,
    head: {
      base: headBase(skin),
      features: [nose(skin), earring()],
      eyes: TOON_EYES,
      brows: darker(hairColor, 0.05),
      beforeMouth: beard === 'stubble' ? BEARD.stubble(hairColor) : beard === 'short' ? BEARD.short(hairColor) : null,
      mouth: { anchor: [47.6, 47.6] },
      front: shape('M31.4 41 Q31 34 33.6 31.4 L36 36 Q33.4 38 33.4 44 Z', hairColor),
      hat: bandana(scarf, dots),
    },
  };
}

/** The quartermaster: a waistcoat in the category color over a puffy shirt, an eyepatch, a treasure map, sometimes a peg leg. */
function quartermaster(look) {
  const random = rngOf(look);
  const skin = pick(HUMAN_SKINS, random);
  const hairColor = pick(HAIR_COLORS, random);
  const headgear = pickWeighted([['scarf', 40], ['cap', 30], [null, 30]], random);
  const capColor = pick(['#b8322c', '#2a4a7a', '#3a3a3a', '#6b5a3a'], random);
  const pegLeg = random() < 0.35;
  const trousers = pick(['#3a3530', '#5a4632', '#2b2f3a', '#6b5a3a'], random);
  const beard = pickWeighted([['long', 40], ['short', 35], ['stubble', 25]], random);
  const held = pickWeighted([['map', 70], ['lantern', 15], ['coin', 15]], random);
  const hair = headgear ? HAIR.longStraight(hairColor) : HAIR.bald(hairColor);
  const boots = '#2b211b';
  const sleeves = { style: 'puffy', sleeve: SHIRT, hand: skin, cuff: '#e9e2d0' };
  return {
    shadowWidth: 19,
    behind: headgear ? [hair.back] : null,
    legBack: leg('back', { trousers, feet: 'tallboot', shoes: boots, width: 7.6 }),
    legFront: pegLeg
      ? [limb(51, 88, 51.4, 98, 8, trousers), limb(51.4, 98, 51.8, 99.6, 8.8, darker(trousers, 0.2)),
        shape('M48.6 100 H54.8 L52.8 111.6 H50.8 Z', WOOD_LIGHT), stroke('M49.4 104 H54', WOOD_DARK, 1)]
      : leg('front', { trousers, feet: 'tallboot', shoes: boots, width: 7.6 }),
    armBack: arm('back', sleeves),
    armFront: arm('front', sleeves),
    torso: [
      shape(torsoPath('round', { bottom: 93 }), SHIRT),
      shape('M33.6 58 Q37 55.2 41.8 56 L45.6 70 L45.6 91.6 Q39 93 34 90.4 Q31 74 33.6 58 Z', 'cat'),
      shape('M58.4 58 Q55 55.2 50.2 56 L46.4 70 L46.4 91.6 Q53 93 58 90.4 Q61 74 58.4 58 Z', 'cat'),
      shade('M50.2 56 L46.4 70 L46.4 91.6 Q53 93 58 90.4 Q61 74 58.4 58 Q55 55.2 50.2 56 Z', '#000000', 0.12),
      buttons(48.4, [72, 77, 82], BRASS, 1.1),
      stroke('M42.6 57 Q46 60 49.4 57', '#d9d0bc', 0.9),
      belt('round', 84.6, '#3a2a1c', BRASS),
      shape('M51 82.4 h7.6 l1.4 -1.6 l1 1 l-1 2.6 h-2.6 l-1.4 3.2 h-2.4 l0.6 -3.2 h-2.6 Z', WOOD_DARK),
      box(55.6, 81.6, 2.4, 3, BRASS, { rx: 0.6 }),
    ],
    held: HELD[held]?.() ?? null,
    headScale: 1.04,
    head: {
      base: headBase(skin),
      features: [nose(skin, 1.2), earring(), headgear ? null : hair.front],
      eyes: TOON_EYES,
      brows: darker(hairColor, 0.1),
      beforeMouth: BEARD[beard](hairColor),
      mouth: { anchor: [47.6, beard === 'stubble' ? 47.6 : 48.6] },
      front: [headgear ? shape('M31 41 Q30.6 33 34 30 L36.4 35.4 Q33.6 37.6 33.4 44 Z', hairColor) : null,
        beard !== 'stubble' && BEARD.mustache(darker(hairColor, 0.06))],
      eyewear: [stroke('M31 36.6 L48 39.4 M56 39.6 Q60 37.4 61.4 34.6', IRON, 1.1), blob(52.2, 41.2, 3.8, 3.4, '#1d1a1a')],
      hat: headgear === 'scarf' ? bandana(capColor) : headgear === 'cap' ? knitCap(capColor) : null,
    },
  };
}

/** The lookout: slim, a short jacket in the category color, a long head scarf, a rope across the chest, a spyglass. */
function lookout(look) {
  const random = rngOf(look);
  const skin = pick(HUMAN_SKINS, random);
  const hairColor = pick(HAIR_COLORS.slice(0, 6), random);
  const scarf = pick(SCARF_COLORS, random);
  const shirt = pick([SHIRT, '#e9e2d0', '#d8e4ec'], random);
  const sash = pick(['#b8322c', '#d9a441', '#2a4a7a', '#2f6b4f', '#6b2d5c'], random);
  const trousers = pick(['#4a3b2b', '#3a3530', '#6b5a3a', '#2b2f3a'], random);
  const held = pickWeighted([['spyglass', 75], ['lantern', 10], [null, 15]], random);
  const longHair = random() < 0.55;
  const hair = longHair ? HAIR.braids(hairColor) : HAIR.shaggy(hairColor);
  const legs = { trousers, feet: 'tallboot', shoes: '#4a3424', width: 6.2 };
  const sleeves = { sleeve: 'cat', hand: skin, cuff: 'cat-dark', width: 5.6 };
  return {
    shadowWidth: 15,
    behind: [
      shape('M31.6 33 Q22 34 14 44 Q22 41 26 42 Q18 48 15 56 Q24 48 32 41 Z', scarf),
      stroke('M29 36.6 Q22 40 17 48', darker(scarf, 0.2), 0.8)],
    legBack: leg('back', legs),
    legFront: leg('front', legs),
    armBack: arm('back', sleeves),
    armFront: arm('front', sleeves),
    torso: [
      shape(torsoPath('slim', { bottom: 92 }), shirt),
      shape('M36.4 79.4 Q46 82.4 55.6 79.4 L55.8 86 Q46 89 36.2 86 Z', sash),
      shape('M37 57.4 Q40 55.4 43 56 L44.6 66 L43.6 96 Q39 97.6 34.6 95.6 Q35 76 37 57.4 Z', 'cat'),
      shape('M55 57.4 Q52 55.4 49 56 L47.4 66 L48.4 96 Q53 97.6 57.4 95.6 Q57 76 55 57.4 Z', 'cat'),
      stroke('M43 56 L44.6 66 L43.6 96 M49 56 L47.4 66 L48.4 96', 'cat-dark', 0.9),
      shape('M37.2 56.4 L42.4 56 L43.6 64 L39.6 61 Z M54.8 56.4 L49.6 56 L48.4 64 L52.4 61 Z', 'cat-dark'),
      buttons(41.6, [70, 76], BRASS, 0.95), buttons(50.4, [70, 76], BRASS, 0.95),
    ],
    overTorso: ropeAcross(),
    held: HELD[held]?.() ?? null,
    headScale: 0.98,
    head: {
      back: hair.back,
      base: headBase(skin),
      features: [nose(skin, 0.9), random() < 0.5 && earring()],
      eyes: TOON_EYES,
      brows: darker(hairColor, 0.05),
      mouth: { anchor: [47.6, 47.4] },
      front: shape('M31.4 41 Q31 34 33.6 31.4 L36.4 36 Q33.6 38 33.4 44 Z', hairColor),
      cheeks: true,
      hat: bandana(scarf),
    },
  };
}

// --- The parrot: a bird folk with feathered wings, a hooked beak, a long tail and a little waistcoat ---

const PARROT_PALETTES = [
  { body: '#d8312a', chest: '#e8513a', wing: '#2f7fd0', tip: '#f2c230', tail: '#2f6fc0', crest: '#e8513a', beak: '#f4ead6' },
  { body: '#3aa045', chest: '#62c060', wing: '#2d7fc8', tip: '#e33a2c', tail: '#2b8a3a', crest: '#f2c230', beak: '#f2d8a8' },
  { body: '#2f78c8', chest: '#f2c230', wing: '#2a62a8', tip: '#173f78', tail: '#2a62a8', crest: '#3aa045', beak: '#2b2b2b' },
  { body: '#9aa3ad', chest: '#c3cad2', wing: '#7a848e', tip: '#5a636c', tail: '#d8312a', crest: '#b8c0c8', beak: '#2b2b2b' },
  { body: '#f4f1e8', chest: '#ffffff', wing: '#e8e2d2', tip: '#f2d060', tail: '#e8e2d2', crest: '#f2c230', beak: '#4a4a4a' },
];

/** A wing hanging from the shoulder (the arm): feathers with colored tips; the wing tip is the hand. */
function wing(side, colors) {
  const isBack = side === 'back';
  const outline = isBack ? 'M33.4 58 Q26.6 70 28.6 86.6 Q31.6 91 35.4 86.6 Q38.6 72 40.4 60 Z' : 'M51.6 58 Q50.4 72 56.4 86.6 Q60 91 62.6 86 Q64 70 58.6 58.6 Z';
  const tips = isBack ? 'M28.8 82 Q30 90 33.2 88.6 Q35.6 86 36 80 Q32 83 28.8 82 Z' : 'M55.4 80 Q56.4 89.4 59.6 89.4 Q62.8 87 62.8 80.6 Q59 83 55.4 80 Z';
  const lines = isBack ? 'M31 70 Q31.6 78 33 84 M34.4 66 Q34.4 76 35 82' : 'M56.6 68 Q57.6 78 59 84 M60 66 Q61 76 61.4 82';
  return [shape(outline, colors.wing), shape(tips, colors.tip), stroke(lines, darker(colors.wing, 0.3), 0.8)];
}

/** A bird leg with a two-forward, two-back foot. */
function birdLeg(side) {
  const [hipX, footX] = side === 'back' ? [41, 41.5] : [51, 54];
  return [limb(hipX, 92, footX - 0.6, 109, 2.6, '#8f8f8f'),
    stroke(`M${footX - 0.6} 109.6 l5 1.4 M${footX - 0.6} 109.6 l3.4 2.6 M${footX - 0.6} 109.6 l-3.6 1.6`, '#6f6f6f', 1.8)];
}

/** The ship's parrot: bright feathers, a crest, a hooked beak (open when celebrating or worried), a waistcoat in the category color. */
function parrot(look, persona = {}) {
  const random = rngOf(look);
  const colors = pick(PARROT_PALETTES, random);
  const hat = pickWeighted([['tricorn', 30], ['bandana', 25], [null, 45]], random);
  const beakOpen = ['celebrating', 'sweating'].includes(persona.mood);
  const lowerBeak = darker(colors.beak, 0.18);
  return {
    shadowWidth: 15,
    behind: [
      shape('M39 84 Q30 98 17 118 Q23.6 119 30.4 112 Q35.4 104 44 90 Z', colors.tail),
      shape('M42 86 Q36 100 26 120 Q32 119 36 112 Q40 104 46 90 Z', darker(colors.tail, 0.12)),
      stroke('M38 90 Q30 103 21 116', darker(colors.tail, 0.3), 0.8),
    ],
    legBack: birdLeg('back'),
    legFront: birdLeg('front'),
    armBack: wing('back', colors),
    armFront: wing('front', colors),
    torso: [
      shape('M34 57 Q46 50 58 57 Q62.6 75 57.6 92 Q46 97.6 34.4 92 Q29.6 75 34 57 Z', colors.body),
      shape('M40 60 Q46 57 52 60 Q55.6 76 51.4 92 Q46 94 40.6 92 Q36.6 76 40 60 Z', colors.chest),
      stroke('M41.6 70 q2.2 1.6 4.4 0 q2.2 1.6 4.4 0 M41 78 q2.4 1.6 4.8 0 q2.4 1.6 4.8 0 M42 86 q2 1.4 4 0 q2 1.4 4 0', darker(colors.chest, 0.15), 0.8),
      shape('M34 58.4 Q37.6 55.6 41.4 56.6 L43.4 70 L42.6 86.6 Q37.6 88 34.6 85.6 Q31.6 72 34 58.4 Z', 'cat'),
      shape('M58 58.4 Q54.4 55.6 50.6 56.6 L48.6 70 L49.4 86.6 Q54.4 88 57.4 85.6 Q60.4 72 58 58.4 Z', 'cat'),
      buttons(41.8, [66, 72, 78], GOLD, 0.95),
    ],
    headScale: 1.04,
    head: {
      back: [[44, 24, -24], [39, 25.6, -40], [49, 24.4, -8]].map(([x, y, angle]) =>
        shape(`M${x} ${y + 3} Q${x - 4} ${y - 6} ${x - 1} ${y - 12} Q${x + 3} ${y - 6} ${x + 2} ${y + 3} Z`, colors.crest, { transform: `rotate(${angle} ${x} ${y + 3})` })),
      base: dot(46, 40, 15, colors.body),
      features: [
        blob(43.4, 40.6, 4.4, 4.8, '#ffffff', { 'stroke-width': 0.5 }), blob(51.4, 40.4, 3.8, 4.6, '#ffffff', { 'stroke-width': 0.5 }),
        stroke('M40.6 44 q1.4 0.8 2.8 0 M49.4 44 q1.2 0.8 2.4 0', '#c9c2b4', 0.6),
      ],
      eyes: { anchors: [[43.6, 40.4], [51.6, 40.2]], style: 'toon' },
      brows: null,
      mouth: {
        custom: [
          beakOpen
            ? [shape('M53.4 47.6 Q58.6 48.6 59.6 52.6 Q57 56.6 53.6 53.6 Z', lowerBeak), blob(55.4, 50.6, 2, 1.4, '#e8788a', { 'stroke-width': 0.4 })]
            : shape('M53.4 46.6 Q57.6 46.6 59.2 49 Q57 52 53.6 50.4 Z', lowerBeak),
          shape('M52.6 40.4 Q60 38.6 63.2 44.6 Q64.6 50.6 60.6 53.6 Q61.4 48.4 58 47.4 Q55.6 47.4 53 47.4 Q51.6 44 52.6 40.4 Z', colors.beak),
          stroke('M56 41 Q57.2 43 56.6 45.6', darker(colors.beak, 0.2), 0.7),
        ],
      },
      hat: hat === 'tricorn'
        ? scaledAround(tricorn('#2b2523', GOLD, null), 0.82, [46, 27])
        : hat === 'bandana' ? bandana(pick(SCARF_COLORS, random), '#f4efe2') : null,
    },
  };
}

/** Shrinks parts around a point (a smaller hat for a bird's head). */
const scaledAround = (parts, scale, [cx, cy]) => svg('g', { transform: `translate(${cx} ${cy}) scale(${scale}) translate(${-cx} ${-cy})` }, parts);

/** The cabin monkey: brown fur, a peach face, big ears, a curly tail, a little waistcoat in the category color. */
function monkey(look) {
  const random = rngOf(look);
  const fur = pick(['#7a4a2a', '#8a5a34', '#5e3a22', '#a06a3a', '#4a3020'], random);
  const face = pick(['#f2d2b0', '#e8c09a', '#f6dcc0'], random);
  const hat = pickWeighted([['bandana', 40], ['cap', 25], [null, 35]], random);
  const held = pickWeighted([['banana', 45], ['coin', 25], [null, 30]], random);
  const furDark = darker(fur, 0.25);
  const limbArm = (x1, y1, x2, y2, hx, hy) => [limb(x1, y1, x2, y2, 4.6, fur), dot(hx, hy, 3.2, face)];
  return {
    shadowWidth: 14,
    behind: [stroke('M38 88 Q20 94 17 78 Q15 64 26 63 Q33 64 31.4 71 Q30 75 26.6 73.6', furDark, 5), stroke('M38 88 Q20 94 17 78 Q15 64 26 63 Q33 64 31.4 71 Q30 75 26.6 73.6', fur, 3.2)],
    legBack: [limb(41, 88, 40.6, 106, 5.4, fur), blob(42.4, 110.6, 5, 2.8, face)],
    legFront: [limb(51, 88, 52.4, 106, 5.4, fur), blob(54.6, 110.6, 5, 2.8, face)],
    armBack: limbArm(37, 62, 33.6, 80, 34, 83),
    armFront: limbArm(55, 62, 58, 80, 58, 83),
    torso: [
      shape(torsoPath('slim', { top: 56, bottom: 93 }), fur),
      blob(46, 79, 6.6, 10, lighter(face, 0.1), { 'stroke-width': 0.5 }),
      shape('M36.8 59 Q39.6 56.4 43 57 L44 70 L43 86 Q39.6 87 37 85 Q35.4 72 36.8 59 Z', 'cat'),
      shape('M55.2 59 Q52.4 56.4 49 57 L48 70 L49 86 Q52.4 87 55 85 Q56.6 72 55.2 59 Z', 'cat'),
      buttons(43.6, [66, 72], GOLD, 0.9),
    ],
    held: HELD[held]?.() ?? null,
    headScale: 1.08,
    head: {
      back: [dot(30.4, 41, 5.6, fur), dot(30.4, 41, 3.2, face, { 'stroke-width': 0.5 }), dot(61.2, 37.4, 4.4, fur)],
      base: dot(46, 40, 15, fur),
      features: [
        shape('M35.6 39 Q35 30.6 42.6 31.2 Q46.4 33.6 48.6 31.4 Q57.4 30.4 57.6 38.4 Q60.6 44.4 56.4 50.6 Q48 56.6 39.8 51 Q34.6 45.6 35.6 39 Z', face),
        blob(51, 47.6, 7.2, 4.8, lighter(face, 0.08), { 'stroke-width': 0.6 }),
        dot(53.4, 45.4, 0.7, darker(face, 0.5)), dot(55.6, 45.4, 0.7, darker(face, 0.5)),
        shape('M41 25.6 Q44 20 46 26 Q48 20.4 51.6 26.4 Q47 27.4 41 25.6 Z', fur),
      ],
      eyes: { anchors: [[42.6, 39.6], [50.6, 39.6]], style: 'toon' },
      brows: furDark,
      mouth: { anchor: [50.4, 48.4], width: 0.75 },
      hat: hat === 'bandana' ? bandana(pick(SCARF_COLORS, random)) : hat === 'cap' ? knitCap(pick(['#b8322c', '#2a4a7a', '#f4efe2'], random)) : null,
    },
  };
}

// ---------------------------------------------------------------------------
// Furniture (world-layout.js ART sizes)
// ---------------------------------------------------------------------------

/** An upright barrel standing on y = bottom. */
const barrel = (cx, bottom, width, height, wood = WOOD) => [
  path(`M${cx - width / 2} ${bottom} Q${cx - width / 2 - width * 0.12} ${bottom - height / 2} ${cx - width / 2} ${bottom - height} H${cx + width / 2} Q${cx + width / 2 + width * 0.12} ${bottom - height / 2} ${cx + width / 2} ${bottom} Z`, wood, { stroke: WOOD_DARK, 'stroke-width': 1 }),
  path(`M${cx - width * 0.18} ${bottom - height} Q${cx - width * 0.22} ${bottom - height / 2} ${cx - width * 0.18} ${bottom} M${cx + width * 0.18} ${bottom - height} Q${cx + width * 0.22} ${bottom - height / 2} ${cx + width * 0.18} ${bottom}`, 'none', { stroke: darker(wood, 0.2), 'stroke-width': 0.8 }),
  path(`M${cx - width / 2 - width * 0.06} ${bottom - height * 0.22} H${cx + width / 2 + width * 0.06} M${cx - width / 2 - width * 0.06} ${bottom - height * 0.78} H${cx + width / 2 + width * 0.06}`, 'none', { stroke: IRON, 'stroke-width': 1.8 }),
  ellipse(cx, bottom - height, width / 2, width * 0.1, darker(wood, 0.08), { stroke: WOOD_DARK, 'stroke-width': 0.8 }),
];

/** A wooden crate with diagonal braces. */
const crate = (x, y, width, height) => [
  rect(x, y, width, height, '#9a6a3c', { stroke: WOOD_DARK, 'stroke-width': 1 }),
  path(`M${x + 2} ${y + 2} H${x + width - 2} V${y + height - 2} H${x + 2} Z M${x + 2} ${y + 2} L${x + width - 2} ${y + height - 2}`, 'none', { stroke: '#6e4a28', 'stroke-width': 1.4 }),
];

/** A coil of rope lying flat. */
const ropeCoil = (cx, cy, rx) => [
  ellipse(cx, cy, rx, rx * 0.34, ROPE, { stroke: '#7a5a32', 'stroke-width': 0.9 }),
  ellipse(cx, cy - 0.6, rx * 0.68, rx * 0.22, 'none', { stroke: '#7a5a32', 'stroke-width': 0.9 }),
  ellipse(cx, cy - 1, rx * 0.36, rx * 0.11, '#7a5a32'),
];

/** A tankard with foam. */
const tankard = (x, y, color = '#9aa3ad') => [
  rect(x - 4, y, 8, 10, color, { rx: 1.2, stroke: darker(color, 0.4), 'stroke-width': 0.8 }),
  path(`M${x + 4} ${y + 2.4} q3.2 0.4 3 3.4 q-0.2 2.6 -3 2.4`, 'none', { stroke: darker(color, 0.4), 'stroke-width': 1.1 }),
  ellipse(x, y, 4.6, 1.8, '#fbf6e6'),
];

/** A palm frond: a curved leaf from (x, y) with leaflet notches. */
const frond = (x, y, dx, dy, color, extra = {}) => [
  path(`M${x} ${y} Q${x + dx * 0.5} ${y + dy - 10} ${x + dx} ${y + dy} Q${x + dx * 0.45} ${y + dy - 3} ${x} ${y + 2.4} Z`, color, { stroke: darker(color, 0.3), 'stroke-width': 0.8, ...extra }),
  path(`M${x} ${y + 1} Q${x + dx * 0.5} ${y + dy - 7} ${x + dx} ${y + dy}`, 'none', { stroke: darker(color, 0.35), 'stroke-width': 0.7, ...extra }),
];

const decor = {
  // The captain's cabin door: a planked arch with a brass porthole, iron straps and a ring, a lamp beside it.
  door: () => [
    rect(-2, 4, 54, 88, '#6e4526', { stroke: '#3e2410', 'stroke-width': 1.2 }),
    path('M-2 22 H52 M-2 44 H52 M-2 66 H52', 'none', { stroke: '#4e301a', 'stroke-width': 1 }),
    rect(-4, 0, 58, 6, '#8a5a32', { rx: 1.6, stroke: '#3e2410', 'stroke-width': 1 }),
    path('M7 92 V30 Q7 14 25 14 Q43 14 43 30 V92 Z', '#3e2410'),
    path('M9 92 V31 Q9 17 25 17 Q41 17 41 31 V92 Z', '#9a6a3c', { stroke: '#4e301a', 'stroke-width': 1 }),
    path('M17 18.4 V92 M25 17 V92 M33 18.4 V92', 'none', { stroke: '#6e4a28', 'stroke-width': 1 }),
    path('M9 46 H30 M9 78 H30', 'none', { stroke: IRON, 'stroke-width': 3, 'stroke-linecap': 'round' }),
    ...[[12, 46], [20, 46], [28, 46], [12, 78], [20, 78], [28, 78]].map(([x, y]) => circle(x, y, 0.8, '#8a8a8a')),
    circle(25, 32, 8.4, BRASS, { stroke: '#8a6414', 'stroke-width': 1 }),
    circle(25, 32, 6, '#ffd27a', { class: 'p-glow' }),
    path('M21.4 29 A4.6 4.6 0 0 1 27 27.4', 'none', { stroke: '#ffffff', 'stroke-width': 1.2, 'stroke-opacity': 0.8, 'stroke-linecap': 'round' }),
    ...[0, 60, 120, 180, 240, 300].map(angle => circle(25 + Math.cos(angle * Math.PI / 180) * 7.2, 32 + Math.sin(angle * Math.PI / 180) * 7.2, 0.7, '#8a6414')),
    circle(36, 62, 2.8, 'none', { stroke: IRON, 'stroke-width': 1.3 }), circle(36, 59, 1, IRON),
    rect(4, 88, 42, 4, '#7a4a26', { rx: 1, stroke: '#3e2410', 'stroke-width': 0.8 }),
    path('M48 14 V22 M46 22 H52', 'none', { stroke: IRON, 'stroke-width': 1.2 }),
    rect(45.6, 22, 6.4, 8.6, '#ffd97a', { rx: 1.2, stroke: IRON, 'stroke-width': 0.9, class: 'p-glow' }),
    path('M45 22 L48.8 19.4 L52.6 22 Z', IRON),
  ],
  // A ship's rack: rolled maps and a bottle on top, a coil of rope and a crate, two barrels below.
  shelf: () => [
    rect(2, 6, 60, 86, '#5a3820', { rx: 1.4, stroke: '#3e2410', 'stroke-width': 1.2 }),
    rect(0, 4, 64, 5, '#8a5a32', { rx: 1.4, stroke: '#3e2410', 'stroke-width': 1 }),
    rect(4, 34, 56, 3.4, '#9a6a3c', { stroke: '#3e2410', 'stroke-width': 0.8 }), rect(4, 62, 56, 3.4, '#9a6a3c', { stroke: '#3e2410', 'stroke-width': 0.8 }),
    rect(2, 6, 4, 86, '#7a4a26'), rect(58, 6, 4, 86, '#7a4a26'),
    ...[[10, 20], [15, 23], [20, 19], [12, 27], [18, 28]].map(([x, y]) => [
      rect(x - 1, y, 14, 4.4, PARCHMENT, { rx: 2.2, stroke: '#b9a47e', 'stroke-width': 0.6, transform: `rotate(-12 ${x} ${y})` }),
      circle(x - 0.4, y + 2.4, 1.6, '#e2cf9e', { stroke: '#b9a47e', 'stroke-width': 0.5 })]),
    path('M40 34 V22 Q40 18 43 17 V13 H46 V17 Q49 18 49 22 V34 Z', '#3f7a52', { 'fill-opacity': 0.9, stroke: '#244a30', 'stroke-width': 0.8 }),
    rect(43, 10.6, 3, 3, '#a8743f'),
    rect(41.6, 24, 6, 5, PARCHMENT, { 'fill-opacity': 0.9 }),
    circle(54, 29.6, 4, BRASS, { stroke: '#8a6414', 'stroke-width': 0.8 }), circle(54, 29.6, 2.8, '#f4efe2'),
    path('M54 27.4 L55 29.6 L54 31.8 L53 29.6 Z', '#b8322c'),
    ...ropeCoil(18, 58, 11), ...ropeCoil(18, 53, 9),
    ...crate(34, 42, 22, 20),
    ...barrel(18, 92, 20, 26), ...barrel(44, 92, 20, 26, '#7a4a26'),
  ],
  // A hammock strung between two posts over a bench of planks on barrels, with folded sailcloth cushions.
  sofa: () => [
    rect(2, 0, 6, 64, WOOD_DARK, { rx: 1.4 }), rect(142, 0, 6, 64, WOOD_DARK, { rx: 1.4 }),
    circle(5, 3, 2.2, IRON), circle(145, 3, 2.2, IRON),
    path('M5 4 L18 12 M5 4 L18 16 M145 4 L132 12 M145 4 L132 16', 'none', { stroke: '#7a5a32', 'stroke-width': 1 }),
    path('M16 10 Q75 34 134 10 L134 16 Q75 42 16 16 Z', '#e6d6b2', { stroke: '#a08a62', 'stroke-width': 1 }),
    path('M16 12.4 Q75 37 134 12.4 M16 14.4 Q75 39.6 134 14.4', 'none', { stroke: '#b8322c', 'stroke-width': 1.2 }),
    path('M30 15 Q36 24 34 28 M120 15 Q114 24 116 28', 'none', { stroke: '#a08a62', 'stroke-width': 0.8 }),
    ...barrel(20, 64, 22, 26), ...barrel(130, 64, 22, 26), ...crate(64, 40, 22, 24),
    rect(4, 33, 142, 8, '#9a6a3c', { rx: 1.6, stroke: WOOD_DARK, 'stroke-width': 1.2 }),
    path('M4 37 H146', 'none', { stroke: '#7a4a26', 'stroke-width': 0.8 }),
    ...[[34, '#d8c8a0'], [75, '#b8322c'], [116, '#d8c8a0']].map(([x, color]) => [
      rect(x - 17, 27, 34, 7, color, { rx: 3, stroke: darker(color, 0.3), 'stroke-width': 0.9 }),
      path(`M${x - 13} 30.4 H${x + 13}`, 'none', { stroke: darker(color, 0.18), 'stroke-width': 0.7, 'stroke-dasharray': '2 1.6' })]),
  ],
  // A woven rope mat with a compass rose in the middle.
  rug: () => [
    ellipse(100, 20, 98, 18, '#9a7a4a'),
    ...[90, 78, 66, 54, 42, 30].map((rx, index) => ellipse(100, 20, rx, rx * 0.18, index % 2 ? '#c9a46a' : '#b48a52', { stroke: '#7a5a32', 'stroke-width': 1, 'stroke-dasharray': '2.4 1.4' })),
    path('M100 9 L103 18 L100 20 L97 18 Z M100 31 L103 22 L100 20 L97 22 Z', '#b8322c'),
    path('M80 20 L97 17.4 L100 20 L97 22.6 Z M120 20 L103 17.4 L100 20 L103 22.6 Z', '#1f2a3a'),
    circle(100, 20, 2.2, GOLD),
  ],
  // A grog cask on its side on a cradle, a brass tap, tankards on a board above.
  coffee: () => [
    path('M8 92 L20 66 M48 92 L36 66 M10 88 H46', 'none', { stroke: WOOD_DARK, 'stroke-width': 3.4, 'stroke-linecap': 'round' }),
    circle(28, 58, 21, '#9a6a3c', { stroke: WOOD_DARK, 'stroke-width': 1.4 }),
    circle(28, 58, 17, 'none', { stroke: IRON, 'stroke-width': 2.4 }),
    path('M14 50 H42 M12 58 H44 M14 66 H42', 'none', { stroke: '#7a4a26', 'stroke-width': 1 }),
    circle(28, 58, 21, 'none', { stroke: IRON, 'stroke-width': 1.6 }),
    rect(25, 56, 6, 6, BRASS, { rx: 1, stroke: '#8a6414', 'stroke-width': 0.7 }), rect(26.6, 61.4, 2.8, 6, BRASS, { stroke: '#8a6414', 'stroke-width': 0.6 }),
    rect(23.6, 54, 8.8, 2.4, BRASS, { rx: 1, stroke: '#8a6414', 'stroke-width': 0.6 }),
    rect(4, 30, 48, 4, '#7a4a26', { rx: 1, stroke: WOOD_DARK, 'stroke-width': 0.9 }),
    path('M8 34 V38 M48 34 V38', 'none', { stroke: WOOD_DARK, 'stroke-width': 2 }),
    ...tankard(13, 20), ...tankard(27, 20, '#9a6a3c'), ...tankard(41, 20),
  ],
  // A water butt with a lid and a ladle, a tap pouring into a tin cup.
  cooler: () => [
    ...barrel(18, 86, 26, 44, '#8a5a32'),
    rect(4, 40, 28, 3, '#7a4a26', { rx: 1, stroke: WOOD_DARK, 'stroke-width': 0.8 }),
    path('M20 40 Q26 30 30 26', 'none', { stroke: '#9aa3ad', 'stroke-width': 1.6, 'stroke-linecap': 'round' }),
    ellipse(31, 25, 3.4, 2, '#9aa3ad', { stroke: '#5a636c', 'stroke-width': 0.6 }),
    rect(28, 70, 6, 3, BRASS, { rx: 0.8, stroke: '#8a6414', 'stroke-width': 0.6 }),
    path('M33 73 V82', 'none', { stroke: '#8ec5e8', 'stroke-width': 1.4, 'stroke-dasharray': '2 2.4', class: 'p-pour' }),
    path('M29.6 84 H36.4 L35.6 92 H30.4 Z', '#b8c0c8', { stroke: '#5a636c', 'stroke-width': 0.7 }),
  ],
  // 0: a coconut palm in a half barrel (the lounge corner); 1: a small banana palm in a clay pot (by the door).
  plant: variant => variant % 2 === 0
    ? [
      path('M21 52 Q19 30 24 12', 'none', { stroke: '#7a5a32', 'stroke-width': 4.4, 'stroke-linecap': 'round' }),
      path('M21 48 h2.4 M20.4 42 h2.6 M20.4 36 h2.6 M21 30 h2.6 M21.6 24 h2.6 M22.6 18 h2.4', 'none', { stroke: '#5a3e22', 'stroke-width': 0.9 }),
      ...frond(24, 12, -24, 10, '#3f8a3a', { class: 'p-sway' }), ...frond(24, 12, 22, 12, '#4f9a42', { class: 'p-sway p-sway-2' }),
      ...frond(24, 11, -18, -6, '#56a646'), ...frond(24, 11, 18, -8, '#3f8a3a'), ...frond(24, 11, -2, -12, '#4f9a42'),
      ...frond(24, 13, -14, 20, '#2f7a32'), ...frond(24, 13, 14, 20, '#2f7a32'),
      circle(22, 15, 2.6, '#6b4a24', { stroke: '#4a3018', 'stroke-width': 0.6 }), circle(26.4, 15.6, 2.6, '#7a5428', { stroke: '#4a3018', 'stroke-width': 0.6 }),
      path('M4 50 H40 L37 70 H7 Z', '#a8743f', { stroke: WOOD_DARK, 'stroke-width': 1.2 }),
      path('M5.4 56 H38.6 M6.6 65 H37.4', 'none', { stroke: IRON, 'stroke-width': 2 }),
      path('M14 50 V70 M22 50 V70 M30 50 V70', 'none', { stroke: '#8a5a2e', 'stroke-width': 0.8 }),
      ellipse(22, 50, 18, 2.4, '#6b4a2e'),
    ]
    : [
      path('M22 52 Q21 40 22 30', 'none', { stroke: '#6a8a3a', 'stroke-width': 3.4, 'stroke-linecap': 'round' }),
      ...frond(22, 30, -18, 8, '#58a84a', { class: 'p-sway' }), ...frond(22, 30, 18, 6, '#4a9a40', { class: 'p-sway p-sway-2' }),
      ...frond(22, 29, -10, -16, '#62b452'), ...frond(22, 29, 10, -18, '#4a9a40'),
      ...frond(22, 32, -16, 18, '#3f8a3a'), ...frond(22, 32, 16, 16, '#3f8a3a'),
      path('M8 48 H36 L32 70 H12 Z', '#c0643a', { stroke: '#8a4022', 'stroke-width': 1.2 }),
      rect(6, 46, 32, 5, '#d0744a', { rx: 1.6, stroke: '#8a4022', 'stroke-width': 1 }),
      path('M12 58 H32', 'none', { stroke: '#e8955a', 'stroke-width': 1.2 }),
    ],
};

// ---------------------------------------------------------------------------
// Stations (viewBox 68 20 72 96, floor at y = 112)
// ---------------------------------------------------------------------------

const stations = {
  // A navigator's corner: a map with a dotted route and a compass on a crate, an open chest of gold and gems.
  chest: () => [
    ...crate(72, 90, 26, 22),
    path('M70 89 L99 86.6 L100.6 91 L71.4 92.6 Z', PARCHMENT, { stroke: '#b9a47e', 'stroke-width': 0.8 }),
    path('M74 90.4 Q78 88.4 82 89.6 Q86 88 88 90', 'none', { stroke: '#7aa35a', 'stroke-width': 1.4 }),
    path('M76 91.4 Q84 89 90 89.6 Q94 89.6 96 88', 'none', { stroke: '#b23a2a', 'stroke-width': 0.8, 'stroke-dasharray': '1.6 1.4', class: 'p-screen-line' }),
    path('M95 87 l2 2 M97 87 l-2 2', 'none', { stroke: '#b23a2a', 'stroke-width': 0.9 }),
    circle(91.4, 84.4, 3.6, BRASS, { stroke: '#8a6414', 'stroke-width': 0.8 }), circle(91.4, 84.4, 2.5, '#f4efe2'),
    path('M91.4 82.4 L92.2 84.4 L91.4 86.4 L90.6 84.4 Z', '#b8322c', { class: 'p-dial' }),
    path('M103 112 V88 H137 V112 Z', '#8a5a32', { stroke: WOOD_DARK, 'stroke-width': 1.2 }),
    path('M103 96 H137 M103 104 H137', 'none', { stroke: '#6e4526', 'stroke-width': 0.9 }),
    path('M106 88 V112 M134 88 V112', 'none', { stroke: IRON, 'stroke-width': 2.4 }),
    rect(116.6, 92, 6.8, 7.6, BRASS, { rx: 1, stroke: '#8a6414', 'stroke-width': 0.7 }), circle(120, 95.4, 1.2, '#5a3a14'),
    path('M103 88 Q101 70 106 64 H134 Q139 70 137 88 Z', '#6e4526', { stroke: WOOD_DARK, 'stroke-width': 1.2 }),
    path('M106 64 Q102 74 103.6 88 M134 64 Q138 74 136.4 88', 'none', { stroke: IRON, 'stroke-width': 2.2 }),
    path('M108 70 Q120 66 132 70', 'none', { stroke: '#4e301a', 'stroke-width': 0.9 }),
    path('M102 89 Q106 80 112 82 Q116 76 121 80 Q126 75 130 80 Q135 79 138 89 Z', GOLD, { stroke: '#b8860b', 'stroke-width': 0.8 }),
    ...[[108, 86], [114, 84], [120, 83.4], [126, 84.4], [132, 86], [111, 88], [129, 88]].map(([x, y]) => circle(x, y, 2, '#ffd75a', { stroke: '#b8860b', 'stroke-width': 0.5 })),
    circle(117, 81.4, 1.8, '#d9364a', { stroke: '#8a1a2a', 'stroke-width': 0.5 }), circle(124, 82, 1.7, '#3aa06a', { stroke: '#1a6a3a', 'stroke-width': 0.5 }),
    circle(130.6, 83.6, 1.6, '#3a7ad9', { stroke: '#1a3a8a', 'stroke-width': 0.5 }),
    path('M104 88 Q110 96 116 90 Q119 86 122 88', 'none', { stroke: '#f4efe6', 'stroke-width': 1.8, 'stroke-dasharray': '0.1 2.2', 'stroke-linecap': 'round' }),
    circle(120, 84, 9, '#ffe68a', { 'fill-opacity': 0.3, class: 'p-glow' }),
    ...[[112, 74], [124, 70], [132, 76], [118, 66]].map(([x, y]) => path(`M${x} ${y - 2.4} l0.8 1.6 l1.6 0.8 l-1.6 0.8 l-0.8 1.6 l-0.8 -1.6 l-1.6 -0.8 l1.6 -0.8 Z`, '#fff3a0', { class: 'p-spark' })),
  ],
  // A cannon on its wheeled carriage, the fuse fizzing, smoke at the muzzle, a stack of cannonballs.
  cannon: () => [
    path('M78 100 L82 92 H118 L122 100 Z', '#8a5a32', { stroke: WOOD_DARK, 'stroke-width': 1.2 }),
    path('M80 100 H120 V104 H80 Z', '#6e4526', { stroke: WOOD_DARK, 'stroke-width': 1 }),
    path('M82.4 86 Q78 90 80 95 Q84 100 90 98 L132 84.4 Q135 83 134 79 Q132.6 75 129 76 L88 84 Q85 84 82.4 86 Z', '#3a3f45', { stroke: '#15181c', 'stroke-width': 1.2 }),
    path('M93 83.4 L95 92.6 M108 80 L110 89.4 M122 77.4 L124.4 86', 'none', { stroke: '#5a626b', 'stroke-width': 2 }),
    path('M90 86 L128 78.6', 'none', { stroke: '#8a939c', 'stroke-width': 1.2, 'stroke-linecap': 'round' }),
    ellipse(132, 81, 3, 4.6, '#15181c', { transform: 'rotate(-14 132 81)' }),
    circle(78.6, 90.6, 2.2, '#3a3f45', { stroke: '#15181c', 'stroke-width': 0.8 }),
    path('M85 84 Q84 78 80 76', 'none', { stroke: '#c9a46a', 'stroke-width': 1.2 }),
    path('M80 73.6 l0.8 1.6 l1.6 0.8 l-1.6 0.8 l-0.8 1.6 l-0.8 -1.6 l-1.6 -0.8 l1.6 -0.8 Z', '#ffd75a', { class: 'p-spark' }),
    path('M77 72 l0.6 1.2 l1.2 0.6 l-1.2 0.6 l-0.6 1.2 l-0.6 -1.2 l-1.2 -0.6 l1.2 -0.6 Z', '#ff9a3a', { class: 'p-spark' }),
    circle(88, 104, 7.6, '#6e4526', { stroke: WOOD_DARK, 'stroke-width': 1.2 }), circle(88, 104, 2.4, IRON),
    circle(112, 104, 7.6, '#6e4526', { stroke: WOOD_DARK, 'stroke-width': 1.2 }), circle(112, 104, 2.4, IRON),
    path('M88 97 V111 M81 104 H95 M112 97 V111 M105 104 H119', 'none', { stroke: WOOD_DARK, 'stroke-width': 1 }),
    ...[[124, 107.4], [131, 107.4], [138, 107.4], [127.5, 101.4], [134.5, 101.4], [131, 95.4]].map(([x, y]) => circle(x, y, 3.4, '#2f3338', { stroke: '#15181c', 'stroke-width': 0.8 })),
    ...[[124, 107.4], [131, 107.4], [138, 107.4], [127.5, 101.4], [134.5, 101.4], [131, 95.4]].map(([x, y]) => circle(x - 1.1, y - 1.1, 0.9, '#8a939c')),
    circle(136, 72, 4, '#e8e4dc', { 'fill-opacity': 0.8, class: 'p-steam' }),
    circle(131, 66, 3, '#e8e4dc', { 'fill-opacity': 0.7, class: 'p-steam' }),
  ],
};

export default Object.freeze({
  archetypes: { captain, deckhand, quartermaster, lookout, parrot, monkey },
  decor,
  stations,
});
