// The restaurant kitchen: head chefs in tall toques and neckerchiefs, line cooks in bandanas and aprons,
// pastry chefs with piping bags, waiters in vests and bow ties, sous-chefs with a big ladle and dishwashers
// in rubber gloves - and the kitchen's furniture: swinging doors with portholes, a spice rack, flour sacks
// on a pallet, an espresso machine, a glass-door fridge, herb pots, an anti-fatigue mat.
// Original designs for this app: the feel of a busy restaurant kitchen, no characters from films or shows.
// Coordinates: figure-kit.js (characters), world-layout.js ART (furniture), viewBox 68 20 72 96 (stations).

import { circle, darker, ellipse, group, lighter, line, path, rect } from '../svg-kit.js';
import {
  BEARD, HAIR, arm, box, buttons, dot, headBase, leg, limb, nose, pick, pickWeighted, rngOf, shade, shape, stroke, torsoPath,
} from '../figure-kit.js';

const TOON_EYES = Object.freeze({ anchors: [[43, 41], [52, 41]], style: 'toon' });
const CHEF_WHITE = '#f8fafc';
const STEEL = '#c3c9d1';
const STEEL_DARK = '#7d8692';
const WOOD = '#b07a48';
const WOOD_DARK = '#7a5030';
const NIGHT = '#1f2937';
const BURLAP = '#e9dcc0';

const HUMAN_SKINS = ['#f6d7bd', '#efc8a6', '#e2b38c', '#d29f74', '#b9845a', '#8f5f3c', '#6e4630'];
const HAIR_COLORS = ['#1f1a17', '#3d2a1c', '#5a3a22', '#8a4b26', '#c9a05a', '#e8d18a', '#b23a2a', '#9ca3af'];

// ---------------------------------------------------------------------------
// Garments and hats shared by the cooks
// ---------------------------------------------------------------------------

/** A double-breasted chef jacket: the body, the overlapping front edge, two rows of buttons. */
function chefJacket(build, { cloth = CHEF_WHITE, edge = null, studs = '#d1d5db', bottom = 93 }) {
  return [
    shape(torsoPath(build, { bottom }), cloth),
    shade('M50 56 Q56 56 58.6 58 Q61 66 60 80 L59 92 Q54 94 50 94 Z', '#000000', 0.08),
    stroke('M53.4 58.6 Q54.6 74 53.6 92', edge ?? darker(cloth, 0.18), edge ? 1.4 : 0.9),
    buttons(42.4, [65, 72, 79, 86], studs, 1.1),
    buttons(50, [65, 72, 79, 86], studs, 1.1),
  ];
}

/** A chef's stand-up collar (cloth color or the category color). */
const chefCollar = color => shape('M38.4 55.2 Q46 59.6 53.6 55.2 L54 59.2 Q46 63.2 38 59.2 Z', color);

/** A neckerchief knotted at the throat. */
const neckerchief = color => [shape('M40.4 56.4 Q46 60.6 51.6 56.4 L49 64.4 Q46 66.6 43 64.4 Z', color), dot(46, 59.4, 2.1, color === 'cat' ? 'cat-dark' : darker(color, 0.2))];

/** A tall pleated toque. */
const tallToque = () => [
  shape('M32 29.4 Q27.6 18 34 13 Q32 2.6 41 2 Q46 -1.6 51 2 Q60 2.4 58.6 12.4 Q64.4 18 60 29.4 Z', CHEF_WHITE),
  stroke('M38.6 28 Q37 18 39.6 7 M46 28 V3.6 M53.4 28 Q55 18 52.6 7', '#d1d5db', 0.9),
  box(31.4, 27.4, 29.2, 7.6, CHEF_WHITE, { rx: 2 }),
  stroke('M33 31.2 H59', '#e5e7eb', 0.8),
];

/** A short puffy toque (pastry). */
const shortToque = () => [
  shape('M32 30.4 Q26.4 23 33 18.6 Q35 11.6 46 12.4 Q57 11.6 59 18.6 Q65.6 23 60 30.4 Z', CHEF_WHITE),
  stroke('M39 29 Q37.4 23 39.6 16.4 M46 29 V14 M53 29 Q54.6 23 52.4 16.4', '#d1d5db', 0.9),
  box(31.6, 28, 28.8, 6.6, CHEF_WHITE, { rx: 2 }),
];

/** A cloth bandana tied at the back of the head. */
function bandana(color, dots) {
  return [
    shape('M31.4 31.6 L23.6 28.6 L25.4 34.8 Z', color), shape('M31 34.6 L24.6 39.6 L30.6 38.4 Z', color),
    shape('M30.4 38.6 Q29.4 24 46 23 Q62.6 24 61.6 37.4 Q54 31.6 46 32 Q37.6 32 30.4 38.6 Z', color),
    ...[[38, 28], [45, 26.4], [52, 27.4], [57, 31], [41.6, 31.4], [49, 30.6]].map(([x, y]) => circle(x, y, 0.9, dots)),
  ];
}

/** A cap worn backwards (the brim points to the back). */
const backwardsCap = color => [
  shape('M31.4 35.4 L19.6 37.6 Q20.4 33.4 31.6 31.6 Z', darker(color, 0.15)),
  shape('M30.6 37 Q30 23 46 23 Q62 23 61.4 36 Q54 32.4 46 32.6 Q38 32.6 30.6 37 Z', color),
  stroke('M46 23.4 V32.4', darker(color, 0.25), 0.8), dot(46, 23.6, 1.3, darker(color, 0.25)),
];

/** A black skull cap with a folded band. */
const skullCap = color => [
  shape('M30.6 38.4 Q30 23.6 46 23.4 Q62 23.6 61.4 38 Q54 33 46 33.2 Q38 33 30.6 38.4 Z', color),
  stroke('M31.2 35 Q46 29 60.8 34.6', lighter(color, 0.2), 1.6),
];

/** A big handlebar mustache. */
const handlebar = color => shape('M40 46.4 q3 -3.4 7.4 -1 q4.4 -2.4 7.4 1 q2 -0.2 3.6 -2.6 q0.4 3.6 -3 4.4 q-4 0.8 -8 -0.6 q-4 1.4 -8 0.6 q-3.4 -0.8 -3 -4.4 q1.6 2.4 3.6 2.6 Z', color);

/** Checked chef trousers: two dashed lines along the leg. */
function checkedLeg(side, legs) {
  const [hip, ankle] = side === 'back' ? [[41, 88], [40.2, 106]] : [[51, 88], [52.2, 106]];
  return [leg(side, legs), stroke(`M${hip[0] - 1.6} ${hip[1] + 2} L${ankle[0] - 1.6} ${ankle[1]} M${hip[0] + 1.6} ${hip[1] + 2} L${ankle[0] + 1.6} ${ankle[1]}`, '#d1d5db', 1.2, { 'stroke-dasharray': '1.3 1.7' })];
}

// ---------------------------------------------------------------------------
// Things held in the back hand (at about (34,83); they swing with the arm)
// ---------------------------------------------------------------------------

const HELD = {
  woodenSpoon: () => [limb(34, 96, 33, 64, 1.8, WOOD), ellipse(32.8, 60.4, 3, 4.4, WOOD, { stroke: WOOD_DARK, 'stroke-width': 0.8 })],
  ladle: () => [stroke('M34 80 q0 -3.4 2.6 -3.6', '#9aa3ae', 1.8), limb(34, 80, 34, 99, 1.8, '#9aa3ae'),
    shape('M28.6 98.6 Q28.6 106 34 106 Q39.4 106 39.4 98.6 Z', STEEL), ellipse(34, 98.6, 5.4, 1.2, STEEL_DARK), stroke('M30 100.4 Q31 104 34 104.4', '#ffffff', 0.8)],
  bigLadle: () => [stroke('M34 79 q0 -4 3 -4.2', '#9aa3ae', 2.2), limb(34, 79, 34, 100, 2.2, '#9aa3ae'),
    shape('M27 99.4 Q27 108.6 34 108.6 Q41 108.6 41 99.4 Z', STEEL), ellipse(34, 99.4, 7, 1.6, '#d4462a', { stroke: STEEL_DARK, 'stroke-width': 0.8 }), stroke('M28.8 101.4 Q30 106 34 106.6', '#ffffff', 0.9)],
  tongs: () => [stroke('M34 84 L30.4 102 M34 84 L36.6 102', '#9aa3ae', 1.6), stroke('M30 101.6 l-1 2.4 M37 101.6 l1 2.4', '#7d8692', 1.4)],
  spatula: () => [limb(34, 84, 33.6, 97, 1.8, NIGHT), shape('M29.8 97 H37.6 L38.2 108 H29.2 Z', STEEL), stroke('M31.6 100 V106 M33.8 100 V106 M36 100 V106', STEEL_DARK, 0.6)],
  sautePan: () => [limb(34, 83, 26, 86, 2.2, NIGHT), shape('M9 84 H27 Q26 92 18 92 Q10 92 9 84 Z', '#374151'), ellipse(18, 84, 9, 2, '#4b5563', { stroke: '#1f2937', 'stroke-width': 0.8 }),
    circle(15, 83.4, 1.4, '#e0402e'), circle(19.6, 83.6, 1.2, '#2f9e44'), circle(22, 83.2, 1, '#f2c94c')],
  pipingBag: () => [shape('M27.4 73 L40.6 73 L35.4 92 L32.6 92 Z', '#f1f5f9'), stroke('M30 76 L33.4 90 M38 76 L34.6 90', '#cbd5e1', 0.7),
    shape('M32.6 92 H35.4 L34.6 96 H33.4 Z', '#9ca3af'), dot(34, 96.8, 1.2, '#f9a8d4'),
    shape('M27.4 73 Q29 68 34 69.4 Q39 68 40.6 73 Z', '#f9a8d4')],
  bottle: () => [shape('M30.4 98 V82 Q30.4 78 32.6 76.6 V70 H35.4 V76.6 Q37.6 78 37.6 82 V98 Z', '#14532d'), box(32.4, 68.4, 3.2, 2.6, '#7f1d1d', { rx: 0.6 }),
    box(30.4, 84, 7.2, 7, '#f6efe2', { rx: 0.6 }), stroke('M31.8 80 V95', '#4ade80', 0.7, { 'stroke-opacity': 0.5 })],
  menu: () => [box(27.6, 76, 12, 16, '#7f1d1d', { rx: 1 }), stroke('M28.4 76.4 V91.6', '#f5c542', 1.2), box(31, 80, 6, 1.6, '#f5c542', { rx: 0.4 })],
  notepad: () => [box(29, 77.6, 9, 11.6, '#fefce8', { rx: 0.8 }), stroke('M30.6 81 H36.6 M30.6 83.6 H36 M30.6 86.2 H35', '#94a3b8', 0.7), stroke('M29 77.6 H38', '#ef4444', 1.4)],
  plates: () => [0, 1, 2, 3, 4].map(index => ellipse(30, 90 - index * 2.4, 9, 2.4, '#ffffff', { stroke: '#94a3b8', 'stroke-width': 0.8 })),
  scrubBrush: () => [limb(34, 84, 34, 98, 2.2, '#3b82f6'), box(29.6, 97, 9, 4, '#2563eb', { rx: 1 }), stroke('M30.6 101 v3 M32.6 101 v3 M34.6 101 v3 M36.6 101 v3', '#facc15', 0.9)],
};

// ---------------------------------------------------------------------------
// Archetypes (looks: figure-kit.js composeFigure)
// ---------------------------------------------------------------------------

/** The head chef: a tall toque, a white double-breasted jacket with collar and piping in the category color, a neckerchief, often a mustache. */
function headChef(look) {
  const random = rngOf(look);
  const skin = pick(HUMAN_SKINS, random);
  const hairColor = pick(HAIR_COLORS, random);
  const build = random() < 0.5 ? 'round' : 'regular';
  const woman = random() < 0.35;
  const facial = woman ? null : pickWeighted([['handlebar', 40], ['mustache', 25], ['goatee', 15], [null, 20]], random);
  const held = pickWeighted([[null, 40], ['woodenSpoon', 30], ['ladle', 30]], random);
  const hair = woman ? { back: dot(33, 46.6, 5.4, hairColor), front: HAIR.shortCrop(hairColor).front } : HAIR.shortCrop(hairColor);
  const legs = { trousers: '#3f4652', feet: 'shoe', shoes: pick([NIGHT, '#f8fafc', '#7f1d1d'], random), width: 7.4 };
  const sleeves = { sleeve: CHEF_WHITE, hand: skin, cuff: 'cat', width: 6.6 };
  return {
    shadowWidth: build === 'round' ? 20 : 18,
    legBack: checkedLeg('back', legs),
    legFront: checkedLeg('front', legs),
    armBack: arm('back', sleeves),
    armFront: arm('front', sleeves),
    torso: chefJacket(build, { edge: 'cat', studs: pick(['#1f2937', '#d1d5db', '#f5c542'], random) }),
    overTorso: [chefCollar('cat'), neckerchief('cat')],
    held: HELD[held]?.() ?? null,
    headScale: 1,
    head: {
      back: hair.back,
      base: headBase(skin),
      features: [nose(skin, 1.15), woman ? null : stroke('M35.6 49.6 Q38 53.6 43 54.6', darker(skin, 0.1), 0.8)],
      eyes: TOON_EYES,
      brows: darker(hairColor, 0.1),
      beforeMouth: facial === 'goatee' ? shape('M44 50.6 Q47.6 49.6 51 50.6 Q50.6 56.6 47.6 57 Q44.4 56.6 44 50.6 Z', hairColor) : null,
      mouth: { anchor: [47.6, 48] },
      front: [hair.front, facial === 'handlebar' ? handlebar(darker(hairColor, 0.05)) : facial === 'mustache' ? BEARD.mustache(darker(hairColor, 0.05)) : null],
      hat: tallToque(),
      cheeks: woman ? true : '#f0a08a',
    },
  };
}

/** A line cook: a bandana, a dark jacket with rolled sleeves, a bib apron in the category color, a towel at the waist, tongs or a pan. */
function lineCook(look) {
  const random = rngOf(look);
  const skin = pick(HUMAN_SKINS, random);
  const hairColor = pick(HAIR_COLORS, random);
  const shirt = pick(['#1f2937', '#374151', '#f8fafc', '#e5e7eb'], random);
  const scarf = pick(['#1f2937', '#b91c1c', '#1e3a8a', '#f8fafc', '#065f46'], random);
  const hairStyle = pick(['shortCrop', 'shaggy', 'braids', 'longStraight'], random);
  const held = pickWeighted([['tongs', 35], ['spatula', 30], ['sautePan', 35]], random);
  const hair = HAIR[hairStyle](hairColor);
  const tattoo = random() < 0.35;
  const stubble = random() < 0.35;
  const legs = { trousers: pick(['#1f2937', '#374151', '#3f4652'], random), feet: 'shoe', shoes: NIGHT, width: 7.2 };
  const sleeves = { style: 'rolled', sleeve: shirt, hand: skin, width: 6.4 };
  const ink = side => tattoo && stroke(side === 'back' ? 'M35.6 74 l-0.6 3 M34.6 76.6 l1.6 0.4' : 'M56.6 74 l0.6 3 M55.8 76.6 l1.6 -0.4', '#1e3a8a', 0.8);
  return {
    shadowWidth: 18,
    legBack: leg('back', legs),
    legFront: leg('front', legs),
    armBack: [arm('back', sleeves), ink('back')],
    armFront: [arm('front', sleeves), ink('front')],
    torso: [
      shape(torsoPath('regular', { bottom: 92 }), shirt),
      shape('M38.6 58 Q46 61 53.4 58 L54 62 Q46 65 38 62 Z', darker(shirt, 0.12)),
      shape('M38 64 H54 L55.4 78 Q58 80 59.4 82 L58.6 101 Q46 104 33.4 101 L32.6 82 Q34 80 36.6 78 Z', 'cat'),
      stroke('M38.6 64 L36.6 56.6 M53.4 64 L55.4 56.6', 'cat-dark', 1.4),
      stroke('M32.8 80.6 H59.2', 'cat-dark', 1.2),
      shape('M41.4 86 H50.6 V93 H41.4 Z', 'cat-dark'),
      shape('M55.6 81 H61.4 L62.4 97 Q59.6 98.6 57 97 Z', '#f8fafc'), stroke('M56 85 H61.8 M56.4 89 H62', '#93c5fd', 0.9),
    ],
    held: HELD[held]?.() ?? null,
    headScale: 1,
    head: {
      back: hair.back,
      base: headBase(skin),
      features: nose(skin),
      eyes: TOON_EYES,
      brows: darker(hairColor, 0.1),
      beforeMouth: stubble ? BEARD.stubble(hairColor) : null,
      mouth: { anchor: [47.6, 47.8] },
      front: hairStyle === 'longStraight' || hairStyle === 'braids' ? hair.front : stroke('M31.8 39 Q31.4 42 32.4 45', hairColor, 2.2),
      hat: bandana(scarf, scarf === '#f8fafc' ? '#94a3b8' : '#f8fafc'),
    },
  };
}

/** A pastry chef: a short toque, a pastel jacket in the category color, a white apron dusted with flour, a piping bag. */
function pastryChef(look) {
  const random = rngOf(look);
  const skin = pick(HUMAN_SKINS, random);
  const hairColor = pick(HAIR_COLORS, random);
  const hairStyle = pick(['bun', 'braids', 'crop', 'bob'], random);
  const held = pickWeighted([['pipingBag', 60], ['woodenSpoon', 20], [null, 20]], random);
  const glasses = random() < 0.3;
  const hair = {
    bun: { back: dot(33.4, 47, 5.6, hairColor), front: HAIR.shortCrop(hairColor).front },
    braids: HAIR.braids(hairColor),
    crop: HAIR.shortCrop(hairColor),
    bob: { back: shape('M30.6 36 Q30 30 34 28 H58 Q62 30 61.6 36 L61.4 52 Q56 53 54 49 H38 Q36 53 30.8 52 Z', hairColor), front: HAIR.shortCrop(hairColor).front },
  }[hairStyle];
  const legs = { trousers: pick(['#3f4652', '#e5e7eb', '#1f2937'], random), feet: 'shoe', shoes: pick(['#f8fafc', '#f9a8d4', NIGHT], random), width: 6.8 };
  const sleeves = { sleeve: 'cat-light', hand: skin, cuff: CHEF_WHITE, width: 6.2 };
  return {
    shadowWidth: 17,
    legBack: leg('back', legs),
    legFront: leg('front', legs),
    armBack: arm('back', sleeves),
    armFront: arm('front', sleeves),
    torso: [
      chefJacket('regular', { cloth: 'cat-light', edge: 'cat', studs: '#ffffff', bottom: 91 }),
      shape('M35.6 78 H56.4 L58.4 104 Q46 106.6 33.6 104 Z', CHEF_WHITE),
      stroke('M35.2 78.6 H56.8', '#e5e7eb', 2),
      shape('M40.2 88 H47.6 V92.4 Q43.9 95.8 40.2 92.4 Z', '#f1f5f9'), stroke('M40.2 88 H47.6', 'cat', 1.2),
      ...[[38.6, 98.6, 2.2], [52, 84, 1.8], [54.6, 99, 1.4], [44, 101.6, 1.2]].map(([x, y, r]) => circle(x, y, r, '#ffffff', { 'fill-opacity': 0.9 })),
      stroke('M37.4 101.6 Q46 103.6 54.6 101.6', '#e5e7eb', 0.8),
    ],
    overTorso: [chefCollar(CHEF_WHITE), neckerchief('cat')],
    held: HELD[held]?.() ?? null,
    headScale: 1.02,
    head: {
      back: hair.back,
      base: headBase(skin),
      features: [nose(skin, 0.9), circle(56.4, 46.6, 1.1, '#ffffff', { 'fill-opacity': 0.9 }), circle(58.2, 44.6, 0.7, '#ffffff', { 'fill-opacity': 0.9 })],
      eyes: TOON_EYES,
      brows: darker(hairColor, 0.1),
      mouth: { anchor: [47.6, 47.8] },
      front: hair.front,
      eyewear: glasses && [circle(43, 41, 3.6, 'none', { stroke: '#7c2d12', 'stroke-width': 1.1 }), circle(52.4, 41, 3.6, 'none', { stroke: '#7c2d12', 'stroke-width': 1.1 }), stroke('M46.6 41 H48.8', '#7c2d12', 1)],
      hat: shortToque(),
      cheeks: true,
    },
  };
}

/** A waiter: a white shirt, a vest in the category color, a bow tie, a long bistro apron, a towel over the arm, a bottle, a menu or a notepad. */
function waiter(look) {
  const random = rngOf(look);
  const skin = pick(HUMAN_SKINS, random);
  const hairColor = pick(HAIR_COLORS, random);
  const woman = random() < 0.4;
  const tie = pick(['cat-dark', NIGHT, '#7f1d1d'], random);
  const apron = pick([CHEF_WHITE, NIGHT], random);
  const held = pickWeighted([['bottle', 35], ['menu', 35], ['notepad', 30]], random);
  const pencilMustache = !woman && random() < 0.35;
  const hair = woman
    ? { back: dot(33, 45.6, 5.4, hairColor), front: shape('M31 41 Q30 26 46 25 Q61 26 61 37 Q56 31 47 32 Q46.4 30 45 31.6 Q38 32 34 37 Q33 42 33.4 46 Z', hairColor) }
    : { back: null, front: [shape('M31 40.6 Q30.4 26.4 46 25.4 Q61.6 26 61 37.6 Q55 31.4 44 31.4 Q37 31.6 31 40.6 Z', hairColor), stroke('M40 27 Q43.4 30.4 42.6 32', lighter(hairColor, 0.3), 0.9)] };
  const legs = { trousers: NIGHT, feet: 'shoe', shoes: '#111827', width: 6.8 };
  const sleeves = { sleeve: CHEF_WHITE, hand: skin, cuff: CHEF_WHITE, width: 6.2 };
  return {
    shadowWidth: 17,
    legBack: leg('back', legs),
    legFront: leg('front', legs),
    armBack: arm('back', sleeves),
    armFront: [arm('front', sleeves), shape('M53.6 70 Q58 68.6 61.6 70.4 L60.6 84 Q59 86 57.6 84 L56.4 76 Q55 74 53.6 74 Z', CHEF_WHITE), stroke('M55.6 72 L58.4 83', '#e5e7eb', 0.8)],
    torso: [
      shape(torsoPath(woman ? 'slim' : 'regular', { bottom: 90 }), CHEF_WHITE),
      shape(woman
        ? 'M37.4 57 L42.6 56 L46 70 L49.4 56 L54.6 57 Q57.4 72 56 88 Q46 91.4 36 88 Q34.6 72 37.4 57 Z'
        : 'M35.4 57 L41.6 56 L46 71 L50.4 56 L56.6 57 Q59.6 72 58 88 Q46 91.6 34 88 Q32.4 72 35.4 57 Z', 'cat'),
      buttons(46, [75, 80.6, 86], '#f5c542', 1),
      stroke('M38 72 H42 M50 72 H54', 'cat-dark', 1),
      shape(woman ? 'M36 86 H56 L57 108 Q46 110 35 108 Z' : 'M34.2 86 H57.8 L59 108 Q46 110 33 108 Z', apron),
      stroke(woman ? 'M35.6 87 H56.4' : 'M33.8 87 H58.2', apron === NIGHT ? '#4b5563' : '#e5e7eb', 2),
    ],
    overTorso: [shape('M40.4 56.4 L46 59 L51.6 56.4 L51.6 61.6 L46 59.4 L40.4 61.6 Z', tie), dot(46, 59, 1.6, tie)],
    held: HELD[held]?.() ?? null,
    headScale: 1,
    head: {
      back: hair.back,
      base: headBase(skin),
      features: nose(skin),
      eyes: TOON_EYES,
      brows: darker(hairColor, 0.1),
      mouth: { anchor: [47.6, 48] },
      front: [hair.front, pencilMustache ? stroke('M43 45.8 Q47.6 44 52.4 45.8', darker(hairColor, 0.1), 1.1) : null],
      cheeks: woman ? true : null,
    },
  };
}

/** A sous-chef: a chef jacket in the category color, a black skull cap, a striped towel over the shoulder, a half apron and a big ladle. */
function sousChef(look) {
  const random = rngOf(look);
  const skin = pick(HUMAN_SKINS, random);
  const hairColor = pick(HAIR_COLORS, random);
  const cap = pick([NIGHT, '#374151', CHEF_WHITE], random);
  const towelStripe = pick(['#2563eb', '#dc2626', '#16a34a'], random);
  const beard = pickWeighted([[null, 40], ['short', 30], ['stubble', 30]], random);
  const held = pickWeighted([['bigLadle', 60], ['woodenSpoon', 20], ['tongs', 20]], random);
  const legs = { trousers: '#1f2937', feet: 'shoe', shoes: NIGHT, width: 7.2 };
  const sleeves = { style: 'rolled', sleeve: 'cat', hand: skin, width: 6.6 };
  return {
    shadowWidth: 18,
    legBack: leg('back', legs),
    legFront: leg('front', legs),
    armBack: arm('back', sleeves),
    armFront: arm('front', sleeves),
    torso: [
      chefJacket('broad', { cloth: 'cat', edge: NIGHT, studs: NIGHT, bottom: 92 }),
      shape('M31.6 84 H60.4 L61.6 100 Q46 103 30.4 100 Z', '#4b5563'),
      stroke('M31.4 85 H60.6', '#374151', 2.4),
    ],
    overTorso: [
      chefCollar(NIGHT),
      shape('M32.4 55.8 Q36.6 53 41 55.2 L39.8 79 Q37.6 81 35.4 79 L35 61 Q34.2 58 32.4 55.8 Z', CHEF_WHITE),
      stroke('M35.2 66 L40 66.2 M35.2 72 L39.8 72.2', towelStripe, 1.3),
    ],
    held: HELD[held]?.() ?? null,
    headScale: 1,
    head: {
      base: headBase(skin),
      features: nose(skin, 1.05),
      eyes: TOON_EYES,
      brows: darker(hairColor, 0.15),
      beforeMouth: beard === 'short' ? BEARD.short(hairColor) : beard === 'stubble' ? BEARD.stubble(hairColor) : null,
      mouth: { anchor: [47.6, 48] },
      front: stroke('M31.8 39 Q31.4 42 32.4 45', hairColor, 2.2),
      hat: skullCap(cap),
    },
  };
}

/** A dishwasher: a cap backwards, a t-shirt, long yellow rubber gloves, a long rubber apron in the category color, rubber boots. */
function dishwasher(look) {
  const random = rngOf(look);
  const skin = pick(HUMAN_SKINS, random);
  const hairColor = pick(HAIR_COLORS, random);
  const tee = pick(['#e5e7eb', '#94a3b8', '#fde68a', '#bfdbfe', '#1f2937'], random);
  const cap = pick(['#1e3a8a', '#b91c1c', '#065f46', '#f59e0b', '#374151'], random);
  const gloves = pick(['#facc15', '#fb923c', '#60a5fa'], random);
  const held = pickWeighted([['plates', 50], ['scrubBrush', 30], [null, 20]], random);
  const capOn = random() < 0.7;
  const hair = pick([HAIR.shortCrop, HAIR.shaggy, HAIR.curlyMop], random)(hairColor);
  const legs = { trousers: '#3f4652', feet: 'tallboot', shoes: pick(['#1f2937', '#065f46', '#7f1d1d'], random), width: 7 };
  const sleeves = { style: 'short', sleeve: tee, hand: gloves, width: 6.6, cuff: darker(gloves, 0.1) };
  const foam = side => {
    const [x, y] = side === 'back' ? [34, 86] : [58, 86];
    return [circle(x - 2, y, 1.6, '#ffffff', { stroke: '#bae6fd', 'stroke-width': 0.5 }), circle(x + 1.6, y + 1, 1.2, '#ffffff', { stroke: '#bae6fd', 'stroke-width': 0.5 })];
  };
  return {
    shadowWidth: 17,
    legBack: leg('back', legs),
    legFront: leg('front', legs),
    armBack: [arm('back', sleeves), foam('back')],
    armFront: [arm('front', sleeves), foam('front')],
    torso: [
      shape(torsoPath('regular', { bottom: 92 }), tee),
      shape('M38.6 63 H53.4 L54.4 76 Q58.4 78 59.6 82 L59.6 106 Q46 109 32.4 106 L32.4 82 Q33.6 78 37.6 76 Z', 'cat'),
      stroke('M38.6 63 L37 56.4 M53.4 63 L55 56.4', 'cat-dark', 1.3),
      stroke('M36.4 68 L35.4 100', '#ffffff', 1.6, { 'stroke-opacity': 0.35 }),
      ...[[44, 96, 1.6], [50, 100, 1.2], [41, 88, 1]].map(([x, y, r]) => circle(x, y, r, '#e0f2fe', { stroke: '#7dd3fc', 'stroke-width': 0.4 })),
    ],
    held: HELD[held]?.() ?? null,
    headScale: 1.02,
    head: {
      back: capOn ? null : hair.back,
      base: headBase(skin),
      features: nose(skin),
      eyes: TOON_EYES,
      brows: darker(hairColor, 0.1),
      mouth: { anchor: [47.6, 47.8] },
      front: capOn ? stroke('M31.8 39 Q31.4 42 32.4 45', hairColor, 2.2) : hair.front,
      hat: capOn ? backwardsCap(cap) : null,
      cheeks: true,
    },
  };
}

// ---------------------------------------------------------------------------
// Furniture (world-layout.js ART sizes)
// ---------------------------------------------------------------------------

const porthole = (cx, cy) => [
  circle(cx, cy, 7.4, '#9aa3ae', { stroke: '#5f6874', 'stroke-width': 1 }),
  circle(cx, cy, 5.6, '#f5b866'),
  circle(cx - 1, cy + 1, 3.2, '#ffd99a'),
  path(`M${cx - 4} ${cy - 1.6} A4.6 4.6 0 0 1 ${cx + 1} ${cy - 4.6}`, 'none', { stroke: '#ffffff', 'stroke-width': 1.2, 'stroke-opacity': 0.7 }),
];

/** A spice jar with a cork lid. */
const spiceJar = (x, y, color, height = 11) => [
  rect(x - 4, y - height, 8, height, color, { rx: 1.6, stroke: darker(color, 0.35), 'stroke-width': 0.7 }),
  rect(x - 4, y - height + 1.6, 8, 2.6, '#ffffff', { 'fill-opacity': 0.25 }),
  rect(x - 3.2, y - height - 2.4, 6.4, 2.8, '#c9a064', { rx: 0.6 }),
];

/** A plump burlap sack (seat), tied at the top. */
const sack = (cx, top, width) => [
  path(`M${cx - width / 2} 50 Q${cx - width / 2 - 4} ${top + 12} ${cx - width / 2 + 4} ${top + 4} Q${cx} ${top - 4} ${cx + width / 2 - 4} ${top + 4} Q${cx + width / 2 + 4} ${top + 12} ${cx + width / 2} 50 Z`,
    BURLAP, { stroke: '#a8916a', 'stroke-width': 1.2 }),
  path(`M${cx - width / 2 + 4} ${top + 5} Q${cx} ${top + 9} ${cx + width / 2 - 4} ${top + 5}`, 'none', { stroke: '#a8916a', 'stroke-width': 1 }),
  path(`M${cx} ${top + 34} V${top + 16} M${cx} ${top + 19} l-4 -3.4 M${cx} ${top + 24} l-4 -3.4 M${cx} ${top + 29} l-4 -3.4 M${cx} ${top + 19} l4 -3.4 M${cx} ${top + 24} l4 -3.4 M${cx} ${top + 29} l4 -3.4`,
    'none', { stroke: '#c9a14a', 'stroke-width': 1.4, 'stroke-linecap': 'round' }),
  path(`M${cx - width / 2 + 2} ${top + 20} Q${cx - width / 2 + 5} ${top + 30} ${cx - width / 2 + 3} 46`, 'none', { stroke: '#ffffff', 'stroke-opacity': 0.35, 'stroke-width': 2 }),
];

const decor = {
  // Swinging kitchen doors: two steel leaves with round portholes onto the warm dining room, kick plates, a red lamp above.
  door: () => [
    rect(0, 6, 50, 86, '#6b7280', { rx: 2, stroke: '#4b5563', 'stroke-width': 1.2 }),
    rect(3, 10, 44, 82, '#3a2a20'),
    rect(3.6, 10.6, 21, 81.4, STEEL, { stroke: STEEL_DARK, 'stroke-width': 0.8 }),
    rect(25.4, 10.6, 21, 81.4, '#b9c0c9', { stroke: STEEL_DARK, 'stroke-width': 0.8 }),
    path('M6 14 V70 M28 14 V70', 'none', { stroke: '#ffffff', 'stroke-opacity': 0.45, 'stroke-width': 1.2 }),
    ...porthole(14, 32), ...porthole(36, 32),
    rect(4.6, 72, 19, 18, '#9aa3ae', { stroke: STEEL_DARK, 'stroke-width': 0.8 }), rect(26.4, 72, 19, 18, '#9aa3ae', { stroke: STEEL_DARK, 'stroke-width': 0.8 }),
    path('M6 76 L22 86 M6 82 L16 88 M10 74 L22 81 M28 76 L44 86 M28 82 L38 88 M32 74 L44 81', 'none', { stroke: '#7d8692', 'stroke-width': 0.7 }),
    rect(20.4, 46, 2.6, 12, '#7d8692', { rx: 1 }), rect(27, 46, 2.6, 12, '#7d8692', { rx: 1 }),
    rect(19, 0, 12, 5, '#4b5563', { rx: 1.4 }), rect(20.6, 1, 8.8, 3.6, '#ef4444', { rx: 1, class: 'p-glow' }),
  ],
  // A wooden spice rack: rows of spice jars, oil bottles, a pepper mill, a garlic braid and dried chilies, a mortar and pestle.
  shelf: () => [
    rect(4, 4, 56, 88, '#8a5a32', { rx: 2, stroke: '#5a3b22', 'stroke-width': 1.2 }),
    rect(8, 8, 48, 80, '#6e4626'),
    ...[30, 52, 74].map(y => rect(6, y, 52, 3.4, '#a87444', { stroke: '#6e4626', 'stroke-width': 0.6 })),
    rect(6, 88, 52, 4, '#a87444'),
    ...[[13, '#c0392b'], [22, '#e6a23c'], [31, '#7aa33c'], [40, '#8a4b26'], [49, '#2b2420']].flatMap(([x, color]) => spiceJar(x, 30, color)),
    ...[[12, '#e0402e'], [20, '#f2c94c'], [28, '#5a7a2a']].flatMap(([x, color]) => spiceJar(x, 52, color, 9)),
    path('M36 52 V38 Q36 35 38 34 V30 H41 V34 Q43 35 43 38 V52 Z', '#c9a640', { stroke: '#8a6a1a', 'stroke-width': 0.8, 'fill-opacity': 0.9 }),
    rect(38.4, 27.6, 2.2, 2.8, '#2b2420'),
    path('M46 52 V40 Q46 37 48 36 V31 H51 V36 Q53 37 53 40 V52 Z', '#3f6a2a', { stroke: '#22401a', 'stroke-width': 0.8 }),
    rect(48.4, 28.6, 2.2, 2.8, '#2b2420'),
    path('M12 74 V62 Q12 58 15 57 V55 H19 V57 Q22 58 22 62 V74 Z', '#2b2420', { stroke: '#111', 'stroke-width': 0.6 }), circle(17, 54, 1.8, '#9aa3ae'),
    path('M28 74 Q27 64 35 64 Q43 64 42 74 Z', '#9ca3af', { stroke: '#4b5563', 'stroke-width': 0.8 }), ellipse(35, 64.4, 7.4, 1.6, '#6b7280'),
    line(37, 66, 43, 58, '#d1d5db', 2.4),
    ...[[50, 70], [54, 68], [52, 72]].map(([x, y]) => ellipse(x, y, 3.4, 3, '#f2c94c', { stroke: '#b8961a', 'stroke-width': 0.6 })),
    ...[[18, 86], [30, 86], [42, 86]].map(([x, y]) => [path(`M${x - 7} ${y} Q${x - 8} ${y - 9} ${x} ${y - 10} Q${x + 8} ${y - 9} ${x + 7} ${y} Z`, '#c98a4a', { stroke: '#8a5a2a', 'stroke-width': 0.8 })]).flat(),
    rect(48, 76, 8, 10, '#e9dcc0', { rx: 1.4, stroke: '#a8916a', 'stroke-width': 0.6 }),
    // A garlic braid hanging on the left side, dried chilies on the right
    line(2, 6, 2, 46, '#c9a064', 1.2),
    ...[12, 20, 28, 36, 44].map((y, index) => ellipse(index % 2 ? 4 : 0.4, y, 3.4, 3.8, '#f5efe0', { stroke: '#c9bfa8', 'stroke-width': 0.6 })),
    line(62, 6, 62, 40, '#7a5a32', 1),
    ...[10, 16, 22, 28, 34].map((y, index) => path(`M62 ${y} q${index % 2 ? 3 : -3} 2 ${index % 2 ? 1.4 : -1.4} 6`, 'none', { stroke: '#c81e1e', 'stroke-width': 2, 'stroke-linecap': 'round' })),
  ],
  // Flour sacks on a wooden pallet (the break seats), a crate of onions at each end.
  sofa: () => [
    rect(4, 48, 142, 6, '#b8864e', { rx: 1, stroke: WOOD_DARK, 'stroke-width': 1 }),
    ...[8, 40, 72, 104, 134].map(x => rect(x, 54, 8, 8, '#a87444', { stroke: WOOD_DARK, 'stroke-width': 0.8 })),
    rect(4, 61, 142, 4, '#b8864e', { stroke: WOOD_DARK, 'stroke-width': 0.8 }),
    ...sack(34, 22, 40), ...sack(116, 21, 40), ...sack(75, 18, 40),
    rect(0, 26, 15, 22, '#c08a52', { stroke: '#7a5532', 'stroke-width': 1 }), path('M0 33 H15 M0 40 H15', 'none', { stroke: '#9a6a3a', 'stroke-width': 0.8 }),
    ...[[3.6, 25], [8.4, 23.6], [12, 25.4]].map(([x, y]) => ellipse(x, y, 3.2, 3, '#c98a4a', { stroke: '#8a5a2a', 'stroke-width': 0.6 })),
    rect(135, 26, 15, 22, '#c08a52', { stroke: '#7a5532', 'stroke-width': 1 }), path('M135 33 H150 M135 40 H150', 'none', { stroke: '#9a6a3a', 'stroke-width': 0.8 }),
    ...[[138.6, 25], [143, 23.4], [147, 25.4]].map(([x, y]) => circle(x, y, 3.2, '#e0402e', { stroke: '#9a2418', 'stroke-width': 0.6 })),
  ],
  // An anti-fatigue rubber mat with rows of drainage holes.
  rug: () => [
    path('M16 5 H184 Q190 5 192 10 L199 32 Q200 37 194 37 H6 Q0 37 1 32 L8 10 Q10 5 16 5 Z', '#2b2f36'),
    path('M18 8 H182 L190 33 H10 Z', '#353a42'),
    ...[11.5, 18.5, 25.5].flatMap((y, row) => {
      const inset = 18 - row * 3;
      const count = 22;
      const spacing = (200 - inset * 2) / count;
      return Array.from({ length: count }, (_, index) => ellipse(inset + spacing * (index + 0.5) + (row % 2 ? spacing / 2 - 2 : 0), y + 2, 2.6, 1.4, '#1a1d22'));
    }),
    path('M8 33 H192', 'none', { stroke: '#1a1d22', 'stroke-width': 1.4 }),
    path('M18 8 H182', 'none', { stroke: '#4b5563', 'stroke-width': 1 }),
  ],
  // An espresso machine on a steel cabinet: two group heads, gauges, cups warming on top, a steaming wand.
  coffee: () => [
    rect(2, 50, 52, 42, '#c3c9d1', { rx: 1.4, stroke: STEEL_DARK, 'stroke-width': 1 }),
    rect(2, 48, 52, 4, '#e5e8ec', { stroke: STEEL_DARK, 'stroke-width': 0.8 }),
    rect(6, 56, 20, 32, 'none', { stroke: '#9aa3ae', 'stroke-width': 1 }), rect(30, 56, 20, 32, 'none', { stroke: '#9aa3ae', 'stroke-width': 1 }),
    rect(22, 60, 2, 8, STEEL_DARK, { rx: 1 }), rect(32, 60, 2, 8, STEEL_DARK, { rx: 1 }),
    path('M6 48 V22 Q6 16 12 16 H44 Q50 16 50 22 V48 Z', '#dfe3e8', { stroke: STEEL_DARK, 'stroke-width': 1.2 }),
    rect(8, 24, 40, 12, '#9f1239', { rx: 1.6, stroke: '#6b0f2a', 'stroke-width': 0.8 }),
    circle(19, 30, 4.2, '#f8fafc', { stroke: '#4b5563', 'stroke-width': 1 }), line(19, 30, 21.4, 27.6, '#b91c1c', 0.9),
    circle(37, 30, 4.2, '#f8fafc', { stroke: '#4b5563', 'stroke-width': 1 }), line(37, 30, 34.4, 28, '#b91c1c', 0.9),
    path('M10 18 H46', 'none', { stroke: '#ffffff', 'stroke-width': 1.2, 'stroke-opacity': 0.8 }),
    ...[17, 39].flatMap(x => [rect(x - 4, 36, 8, 4, '#9aa3ae', { stroke: '#4b5563', 'stroke-width': 0.6 }), line(x + 3, 40.6, x + 11, 41.4, '#1f2937', 2.2),
      rect(x - 3.4, 42, 6.8, 5.4, '#f8fafc', { rx: 1, stroke: '#cbd5e1', 'stroke-width': 0.6 })]),
    path('M50 30 H53 V44', 'none', { stroke: '#9aa3ae', 'stroke-width': 1.6 }),
    path('M53 42 q-2.4 -4 0 -7 q2.4 -3 0 -6', 'none', { stroke: '#f1f5f9', 'stroke-width': 1.6, 'stroke-linecap': 'round', class: 'p-steam' }),
    ...[[12, 12], [20, 12], [28, 12], [16, 7.6], [24, 7.6]].map(([x, y]) => rect(x - 3.4, y, 6.8, 4.6, '#f8fafc', { rx: 1, stroke: '#cbd5e1', 'stroke-width': 0.6 })),
    rect(36, 12, 10, 4, '#7a4a2a', { rx: 1 }),
  ],
  // A tall steel fridge with a glass door: bottles on the shelves, a blue light, frost on the glass.
  cooler: () => [
    rect(1, 2, 34, 90, '#c3c9d1', { rx: 2, stroke: STEEL_DARK, 'stroke-width': 1 }),
    rect(4, 8, 26, 72, '#1e293b', { rx: 1 }),
    rect(4, 8, 26, 72, '#7dd3fc', { rx: 1, 'fill-opacity': 0.14, class: 'p-glow' }),
    ...[30, 52, 74].map(y => rect(5, y, 24, 1.6, '#94a3b8')),
    ...[12, 18, 24].flatMap(x => [[30], [52], [74]].map(([y]) => [rect(x - 2.2, y - 14, 4.4, 14, '#bfdbfe', { rx: 1.6, 'fill-opacity': 0.85 }), rect(x - 1.2, y - 16.4, 2.4, 2.6, '#2563eb', { rx: 0.6 })])).flat(),
    path('M6 76 L14 64 M8 80 L20 62 M22 20 L28 12', 'none', { stroke: '#ffffff', 'stroke-opacity': 0.3, 'stroke-width': 2 }),
    rect(31, 30, 2.4, 24, '#9aa3ae', { rx: 1 }),
    rect(4, 82, 28, 7, '#9aa3ae', { rx: 1 }), path('M7 85.5 H29', 'none', { stroke: '#7d8692', 'stroke-width': 1.4, 'stroke-dasharray': '1.6 1.6' }),
    circle(6.4, 5, 1.1, '#38bdf8', { class: 'p-blink-dot' }),
  ],
  // 0: a crate of herb pots - basil, rosemary and parsley (the lounge); 1: a small lemon tree in a terracotta pot (by the door).
  plant: variant => variant % 2 === 0
    ? [
      group('p-sway',
        ...[[9, 30], [13, 26], [6, 34], [12, 34], [16, 31]].map(([x, y]) => ellipse(x, y, 4, 3, '#3f8a34', { stroke: '#22541c', 'stroke-width': 0.7 })),
        ...[[22, 44, 18], [20, 44, 22], [24, 44, 20], [26, 44, 24]].map(([x, y, top]) => path(`M${x} ${y} Q${x - 1} ${(y + top) / 2} ${x + (x - 23) * 0.6} ${top}`, 'none', { stroke: '#4e6a3a', 'stroke-width': 1.8 })),
        ...[[22, 24], [20, 28], [25, 26], [23, 32]].map(([x, y]) => path(`M${x - 2} ${y} l2 -1 l2 1`, 'none', { stroke: '#7a9a6a', 'stroke-width': 1 }))),
      group('p-sway p-sway-2',
        ...[[32, 32], [36, 28], [38, 34], [30, 36], [35, 37], [40, 31]].map(([x, y]) => circle(x, y, 3, '#5ea83c', { stroke: '#2f6a1c', 'stroke-width': 0.6 }))),
      ...[[10, '#c0643a'], [22, '#b85a32'], [34, '#c0643a']].map(([x, color]) => path(`M${x - 6} 38 H${x + 6} L${x + 5} 48 H${x - 5} Z`, color, { stroke: '#8a4022', 'stroke-width': 0.9 })),
      rect(1, 46, 42, 24, '#c08a52', { stroke: '#7a5532', 'stroke-width': 1.2 }),
      path('M1 54 H43 M1 62 H43', 'none', { stroke: '#9a6a3a', 'stroke-width': 1 }),
    ]
    : [
      line(22, 52, 22, 26, '#6b4a2e', 2.6),
      group('p-sway p-sway-2',
        ...[[14, 20, 10], [28, 18, 11], [22, 10, 10], [10, 30, 8], [33, 29, 8], [22, 24, 10]].map(([x, y, r], index) => circle(x, y, r, index % 2 ? '#3f8a34' : '#4f9a3a', { stroke: '#2a5e22', 'stroke-width': 0.8 })),
        ...[[14, 24], [28, 22], [20, 14], [32, 30], [10, 31], [24, 28]].map(([x, y]) => ellipse(x, y, 2.6, 3.2, '#f6d33c', { stroke: '#b8961a', 'stroke-width': 0.6 }))),
      path('M8 50 H36 L32 70 H12 Z', '#c0643a', { stroke: '#8a4022', 'stroke-width': 1.2 }),
      rect(6, 47, 32, 5, '#d0744a', { rx: 1.6, stroke: '#8a4022', 'stroke-width': 1 }),
    ],
};

// ---------------------------------------------------------------------------
// Stations (viewBox 68 20 72 96, floor at y = 112)
// ---------------------------------------------------------------------------

const burnerFlames = (cx, y) => [
  path(`M${cx - 9} ${y} Q${cx - 8} ${y - 5} ${cx - 6} ${y} Q${cx - 4} ${y - 6} ${cx - 2} ${y} Q${cx} ${y - 7} ${cx + 2} ${y} Q${cx + 4} ${y - 6} ${cx + 6} ${y} Q${cx + 8} ${y - 5} ${cx + 9} ${y} Z`, '#60a5fa', { class: 'flame' }),
  path(`M${cx - 6} ${y} Q${cx - 4} ${y - 3} ${cx - 2} ${y} Q${cx} ${y - 4} ${cx + 2} ${y} Q${cx + 4} ${y - 3} ${cx + 6} ${y} Z`, '#fde68a', { class: 'flame' }),
];

const stations = {
  // A range: a saute pan tossing vegetables over blue flames, a stockpot steaming with a ladle, knobs and a glowing oven door.
  stove: () => [
    rect(72, 84, 64, 28, '#374151', { rx: 1.6, stroke: '#1f2937', 'stroke-width': 1 }),
    rect(70, 80, 68, 5, '#c3c9d1', { rx: 1.4, stroke: STEEL_DARK, 'stroke-width': 0.8 }),
    ...[78, 90, 102, 114].map((x, index) => [circle(x, 88, 2.2, '#e5e7eb', { stroke: '#4b5563', 'stroke-width': 0.6 }), line(x, 88, x, 86.2, '#1f2937', 0.8, index === 1 ? { class: 'p-dial' } : {})]).flat(),
    circle(128, 88, 1.3, '#ef4444', { class: 'p-blink-led' }),
    rect(76, 92, 56, 17, '#1f2937', { rx: 1.4 }),
    rect(80, 96, 48, 9, '#f59e0b', { rx: 1, class: 'p-glow' }), rect(80, 96, 48, 3, '#fde68a', { rx: 1, 'fill-opacity': 0.6 }),
    rect(84, 93.4, 40, 2, STEEL, { rx: 1 }),
    ...burnerFlames(88, 80), ...burnerFlames(120, 80),
    // The saute pan with vegetables in the air
    path('M75 72 H101 Q100 79 88 79.6 Q76 79 75 72 Z', '#374151', { stroke: '#111827', 'stroke-width': 1 }),
    ellipse(88, 72, 13, 2.6, '#4b5563', { stroke: '#111827', 'stroke-width': 0.8 }),
    line(101, 73, 110, 70, '#111827', 2.4),
    ...[[83, 70.4, '#2f9e44'], [88, 70, '#e0402e'], [93, 70.6, '#f2c94c']].map(([x, y, color]) => circle(x, y, 1.6, color)),
    ...[[84, 62, '#e0402e'], [90, 58, '#2f9e44'], [95, 63, '#f2c94c'], [87, 55, '#e8590c']].map(([x, y, color]) => circle(x, y, 1.6, color, { class: 'p-fly' })),
    // The stockpot with a ladle and steam
    path('M108 54 H132 V78 Q120 81 108 78 Z', '#d1d5db', { stroke: '#5f6874', 'stroke-width': 1 }),
    path('M110 56 V76', 'none', { stroke: '#ffffff', 'stroke-width': 1.6, 'stroke-opacity': 0.7 }),
    ellipse(120, 54, 12, 2.6, '#8a4a2a', { stroke: '#5f6874', 'stroke-width': 0.9 }),
    path('M108 60 Q104 60 104 63 M132 60 Q136 60 136 63', 'none', { stroke: '#5f6874', 'stroke-width': 1.6 }),
    line(124, 54, 130, 38, '#9aa3ae', 1.6), circle(130.4, 37, 1.8, '#9aa3ae'),
    path('M114 49 q-3 -4 0 -8 q3 -4 0 -8 M121 47 q-3 -4 0 -8 q3 -4 0 -8', 'none', { stroke: '#e5e7eb', 'stroke-width': 1.8, 'stroke-linecap': 'round', class: 'p-steam' }),
  ],
  // A prep table: a wooden cutting board with a carrot being sliced, a tomato and an onion, a rocking knife, a bowl of chopped vegetables.
  cuttingboard: () => [
    rect(72, 84, 64, 4, '#d1d5db', { rx: 1.2, stroke: STEEL_DARK, 'stroke-width': 0.8 }),
    rect(74, 88, 3, 24, '#9aa3ae'), rect(131, 88, 3, 24, '#9aa3ae'),
    rect(74, 102, 60, 2.6, '#c3c9d1', { stroke: STEEL_DARK, 'stroke-width': 0.6 }),
    ...[[82, 98], [88, 96.6], [94, 98]].map(([x, y]) => ellipse(x, y, 4, 3.4, '#c98a4a', { stroke: '#8a5a2a', 'stroke-width': 0.6 })),
    path('M104 102 Q103 94 112 94 Q121 94 120 102 Z', '#9ca3af', { stroke: '#4b5563', 'stroke-width': 0.6 }),
    rect(76, 80.6, 46, 4, WOOD, { rx: 1.2, stroke: WOOD_DARK, 'stroke-width': 0.8 }),
    path('M78 81 H120', 'none', { stroke: '#d9a66a', 'stroke-width': 0.8 }),
    path('M80 79 L98 77 Q100 78.4 98 80 L80 80.6 Q78.6 80 80 79 Z', '#f97316', { stroke: '#c2410c', 'stroke-width': 0.6 }),
    path('M80 79.6 l-3 -2.4 M80 79.6 l-3.4 0 M80 79.6 l-2.6 2', 'none', { stroke: '#2f9e44', 'stroke-width': 1 }),
    ...[101, 104, 107].map(x => ellipse(x, 79.4, 1.6, 1.3, '#fb923c', { stroke: '#c2410c', 'stroke-width': 0.4 })),
    circle(114, 77, 3.6, '#e0402e', { stroke: '#9a2418', 'stroke-width': 0.6 }), path('M113 73.6 l1 1 l1.4 -1', 'none', { stroke: '#2f9e44', 'stroke-width': 0.9 }),
    path('M116 80.6 Q116 75 120.6 75 Q120.6 80.6 116 80.6 Z', '#f5efe0', { stroke: '#c9bfa8', 'stroke-width': 0.6 }),
    group('p-wobble',
      path('M99 77 L111 70.6 Q113 70 113.4 71.6 L101 78 Z', '#e5e7eb', { stroke: '#6b7280', 'stroke-width': 0.6 }),
      path('M111.6 70.8 L118 67.4', 'none', { stroke: '#1f2937', 'stroke-width': 2.4, 'stroke-linecap': 'round' })),
    ...[[103, 72, '#fb923c'], [106, 68, '#fb923c']].map(([x, y, color]) => circle(x, y, 1.2, color, { class: 'p-fly' })),
    path('M124 84 Q124 76 130 76 Q136 76 136 84 Z', '#f8fafc', { stroke: '#94a3b8', 'stroke-width': 0.8 }),
    ...[[127, 76.4, '#2f9e44'], [130, 75.6, '#e0402e'], [133, 76.6, '#fb923c'], [129, 77.4, '#f2c94c']].map(([x, y, color]) => circle(x, y, 1.4, color)),
  ],
};

export default Object.freeze({
  archetypes: { headChef, lineCook, pastryChef, waiter, sousChef, dishwasher },
  decor,
  stations,
});
