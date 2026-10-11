// Wizards: a castle school of magic at night - students in black robes with house scarves, professors in
// starry robes and tall hats, pearly ghosts in ruff collars, owls that carry the mail, a lantern-carrying
// caretaker and a potions master with bubbling flasks - and the castle's furniture: an iron-studded arched
// door, a bookcase of spellbooks and potions, a velvet sofa, a tea trolley, a gargoyle fountain, magical
// plants. Original designs for this app: the feel of the genre, no characters or designs from books or films.
// Coordinates: figure-kit.js (characters), world-layout.js ART (furniture), viewBox 68 20 72 96 (stations).

import { circle, darker, ellipse, group, lighter, line, path, rect, svg } from '../svg-kit.js';
import {
  BEARD, HAIR, arm, blob, box, buttons, cloakBack, cloakFront, dot, headBase, leg, limb, longGarmentPath, nose,
  pick, pickWeighted, rngOf, shade, shape, stroke, torsoPath,
} from '../figure-kit.js';

const TOON_EYES = Object.freeze({ anchors: [[43, 41], [52, 41]], style: 'toon' });
const GOLD = '#e0b043';
const GOLD_DARK = '#9a6b12';
const WOOD = '#6b4426';
const WOOD_DARK = '#432a16';
const IRON = '#36363d';
const STONE = '#8f887e';
const STONE_DARK = '#5f5951';
const PARCHMENT = '#f3e7c9';
const VELVET = '#7a1d2c';
const HOUSE_COLORS = ['#8e1b22', '#17603a', '#21408f', '#d4951c'];

const HUMAN_SKINS = ['#f6d7bd', '#efc8a6', '#e2b38c', '#d29f74', '#b9845a', '#8f5f3c', '#6e4a2e'];
const HAIR_COLORS = ['#2b1d14', '#4a2e1a', '#7a4a22', '#b5651d', '#d9b26a', '#1a1a1a', '#8a3b1a', '#e8d9a8'];

const fixed = value => Number(value.toFixed(2));

/** A five-pointed star centered at (x, y). */
function starPath(x, y, outer, inner = outer * 0.45) {
  const points = [];
  for (let index = 0; index < 10; index += 1) {
    const radius = index % 2 ? inner : outer;
    const angle = -Math.PI / 2 + (index * Math.PI) / 5;
    points.push(`${fixed(x + Math.cos(angle) * radius)} ${fixed(y + Math.sin(angle) * radius)}`);
  }
  return `M${points.join(' L')} Z`;
}

/** A crescent moon at (x, y), radius r, its horns to the right. */
function moonPath(x, y, r) {
  const [hornX, hornY] = [fixed(x + r * 0.5), r * 0.866];
  return `M${hornX} ${fixed(y - hornY)} A${r} ${r} 0 1 0 ${hornX} ${fixed(y + hornY)} A${fixed(r * 0.9)} ${fixed(r * 0.9)} 0 0 1 ${hornX} ${fixed(y - hornY)} Z`;
}

/** A see-through group (ghosts). */
const faint = (opacity, ...children) => svg('g', { opacity }, ...children);

// ---------------------------------------------------------------------------
// Things held in the back hand (at about (34,83); they swing with the arm)
// ---------------------------------------------------------------------------

const HELD = {
  wand: (wood = '#5b3a22') => [limb(35.4, 89, 27.4, 68.4, 1.5, wood), dot(35.2, 88.2, 1.5, darker(wood, 0.3)),
    path(starPath(27, 67, 3.6, 1.4), '#fde68a', { class: 'p-glow' })],
  book: cover => [shape('M25.4 77.2 L36.6 75.6 L38.2 90.8 L27 92.4 Z', cover), stroke('M27.4 92 L38 90.4', PARCHMENT, 1.4),
    stroke('M28.6 80 L35.6 79', GOLD, 0.9), path(starPath(32, 84.4, 2.4), GOLD)],
  lantern: () => [line(33.6, 84.6, 29.2, 87, IRON, 1), circle(29.2, 94.4, 8.4, '#ffd66b', { 'fill-opacity': 0.22, class: 'p-glow' }),
    shape('M24.8 89.6 L29.2 86.6 L33.6 89.6 Z', IRON), box(25.6, 89.6, 7.2, 10, '#ffd66b', { rx: 1.2, class: 'p-glow' }),
    stroke('M25.6 89.6 H32.8 M29.2 89.6 V99.6 M25.6 99.6 H32.8', IRON, 1.1), box(25, 99.4, 8.4, 1.8, IRON, { rx: 0.6 })],
  broom: () => [limb(30.6, 56, 35.6, 101, 2.2, '#8a5a2e'), shape('M32.6 100 L38.8 99.4 L44.4 114.6 Q37 116.6 28.6 115 Z', '#c9a04a'),
    stroke('M33.6 103 L31.6 114 M36 103 L36 115 M38.4 103 L40.8 114', '#9a7430', 0.8), stroke('M32.4 101.2 L39.2 100.6', '#6b4a2e', 1.8)],
  keys: () => [circle(34, 88.4, 3.4, 'none', { stroke: '#b08d3c', 'stroke-width': 1.2 }),
    stroke('M32 91.4 L30.6 98 M30.6 98 h1.6 M31 96 h1.4 M35.6 91.6 L36.6 98.4 M36.6 98.4 h-1.6 M36.4 96.4 h-1.4 M34 91.8 V97', '#c9a227', 1.1)],
  flask: liquid => [box(27, 78.4, 3.4, 10, '#e6f2ff', { rx: 0.8, 'fill-opacity': 0.85 }), circle(28.7, 93.4, 8.4, liquid, { 'fill-opacity': 0.2, class: 'p-glow' }),
    dot(28.7, 93.4, 6, '#e6f2ff', { 'fill-opacity': 0.85 }), path('M22.8 94 Q28.7 91.6 34.6 94 A6 6 0 0 1 22.8 94 Z', liquid, { class: 'p-glow' }),
    circle(26.4, 90.8, 1.1, '#ffffff', { 'fill-opacity': 0.9 }), box(26.5, 76.6, 4.4, 2.6, '#9a6a3c', { rx: 0.6 }),
    circle(29.6, 72.6, 1.1, liquid, { 'fill-opacity': 0.7 }), circle(27.6, 69.4, 0.8, liquid, { 'fill-opacity': 0.5 })],
  ladle: () => [limb(34, 97, 33, 60, 1.8, '#8a8f98'), blob(34.4, 99.4, 3.6, 2.6, '#8a8f98')],
  letter: () => [shape('M25.6 78.6 L39.4 76.8 L40.8 86.4 L27 88.2 Z', '#f6ecd2'), stroke('M25.8 78.8 L33.6 83.6 L39.4 77', '#c9b48a', 0.8),
    dot(33.6, 83.4, 1.9, '#b91c1c')],
  parcel: () => [box(26, 79, 14, 10, '#b98a52', { rx: 1 }), stroke('M33 79 V89 M26 84 H40', '#f3e7c9', 1.1), stroke('M31 78.6 q2 -3 2 0.4 q0 -3.4 2.4 -0.4', '#f3e7c9', 0.9)],
};

// ---------------------------------------------------------------------------
// Hats and eyewear
// ---------------------------------------------------------------------------

/** A school hat: black, a little floppy, the tip bent back, a band in the category color. */
const studentHat = color => [
  blob(46, 29.6, 18.6, 3.6, color),
  shape('M35.6 29 Q40.8 21 41.8 13.6 Q42.4 6.4 35 2.6 Q46.6 2.4 49 11.4 Q51 20.4 56.4 29 Q46 31.4 35.6 29 Z', color),
  stroke('M36.8 26.4 Q46 28.6 55.2 26.4', 'cat', 1.8),
];

/** A professor's tall hat in the category color, with gold stars and a moon. */
const professorHat = () => [
  blob(46, 30.4, 22.6, 4.4, 'cat-dark'),
  shape('M34.6 30 Q40.6 19 42.6 6 Q43.8 -4 51.4 -11 Q48.4 -1 49.8 6 Q51.6 19 57.4 30 Q46 32.4 34.6 30 Z', 'cat-dark'),
  stroke('M35.6 27 Q46 29.6 56.4 27', GOLD, 2.2),
  path(starPath(46.4, 15.6, 3), GOLD), path(starPath(46.2, 3.4, 1.8), GOLD), path(moonPath(41.6, 22, 2), '#fde68a'),
  path(starPath(52.4, 22.6, 1.4), '#fde68a'),
];

const roundGlasses = color => [
  circle(43, 41.2, 3.6, '#e0f2fe', { 'fill-opacity': 0.25, stroke: color, 'stroke-width': 1 }),
  circle(52.4, 41.2, 3.6, '#e0f2fe', { 'fill-opacity': 0.25, stroke: color, 'stroke-width': 1 }),
  path('M46.6 40.8 Q47.7 39.8 48.8 40.8 M39.4 40.4 L32.6 39.4', 'none', { stroke: color, 'stroke-width': 0.9 }),
];
const halfMoonGlasses = color => [
  path('M39.4 41.8 H46.6 Q46.4 45.6 43 45.6 Q39.6 45.6 39.4 41.8 Z M48.8 41.8 H56 Q55.8 45.6 52.4 45.6 Q49 45.6 48.8 41.8 Z', '#e0f2fe', { 'fill-opacity': 0.3, stroke: color, 'stroke-width': 1 }),
  path('M46.6 42.4 Q47.7 41.4 48.8 42.4 M39.4 42 L32.6 40', 'none', { stroke: color, 'stroke-width': 0.9 }),
];

// ---------------------------------------------------------------------------
// Archetypes (looks: figure-kit.js composeFigure)
// ---------------------------------------------------------------------------

/** A student: a black school robe with lapels in the category color, a striped house scarf or a tie, a wand or a book. */
function student(look) {
  const random = rngOf(look);
  const skin = pick(HUMAN_SKINS, random);
  const hairColor = pick(HAIR_COLORS, random);
  const hairStyle = pick(['shortCrop', 'curlyMop', 'longStraight', 'braids', 'shaggy', 'longWavy', 'topKnot'], random);
  const robe = pick(['#1e1d24', '#24222b', '#1c2129'], random);
  const scarf = random() < 0.55;
  const glasses = random() < 0.28;
  const hatOn = random() < 0.3;
  const jumper = pick(['#6b7280', '#7c818a', '#4b5563', '#8a8478'], random);
  const held = pickWeighted([['wand', 62], ['book', 22], [null, 16]], random);
  const bookCover = pick(['#7a1f2b', '#1f3a6b', '#1f5a3a', '#5a3a1e'], random);
  const build = random() < 0.6 ? 'slim' : 'regular';
  const hair = HAIR[hairStyle](hairColor);
  const sleeves = { style: 'wide', sleeve: robe, hand: skin };
  const legs = { trousers: '#33333b', feet: 'shoe', shoes: '#111114', width: 6.4 };
  return {
    shadowWidth: 17,
    legBack: leg('back', legs),
    legFront: leg('front', legs),
    armBack: arm('back', sleeves),
    armFront: arm('front', sleeves),
    torso: [
      shape(longGarmentPath(build, { hem: 104, flare: 6 }), robe),
      shade('M50 57 L56 66 L61 104 Q56 105.4 52 105.4 Z', '#ffffff', 0.05),
      shape('M40.6 56 L46 75 L51.4 56 Z', jumper),
      shape('M41.2 55.6 L44.6 60.8 L46 57 Z M50.8 55.6 L47.4 60.8 L46 57 Z', '#f8fafc'),
      stroke('M40.4 56.4 L45.3 75 V104.6 M51.6 56.4 L46.7 75 V104.6', 'cat', 1.7),
      !scarf && [shape('M44.7 58 H47.3 L48.2 70.4 L46 73 L43.8 70.4 Z', 'cat'), stroke('M44.4 62.4 L47.8 60.8 M44.2 66.6 L48 65', 'cat-light', 1.1)],
    ],
    overTorso: scarf
      ? [
        shape('M35.4 55.2 Q46 50.4 56.6 55.2 Q57.6 59.6 55.4 61.2 Q46 64.8 36.6 61.2 Q34.2 59.4 35.4 55.2 Z', 'cat'),
        stroke('M39.4 55.6 L39 61.8 M44 54 V63 M48.6 54 V63 M53.2 55.6 L53.6 61.8', 'cat-light', 1.8),
        shape('M40.4 59.6 L46.8 59.4 L46.6 81 L40.6 81.4 Z', 'cat'),
        stroke('M40.5 65 H46.7 M40.5 70.4 H46.7 M40.6 75.8 H46.6', 'cat-light', 2),
        stroke('M41.4 81.6 V84 M43.6 81.6 V84.4 M45.8 81.6 V84', 'cat-dark', 1),
      ]
      : [shape('M33.4 57 Q35 51.6 40.6 53 L43.2 58.4 Q38 60.6 33.4 57 Z', 'cat'), shape('M58.6 57 Q57 51.6 51.4 53 L48.8 58.4 Q54 60.6 58.6 57 Z', 'cat')],
    held: held === 'book' ? HELD.book(bookCover) : HELD[held]?.() ?? null,
    headScale: 1.04,
    head: {
      back: hair.back,
      base: headBase(skin),
      features: nose(skin, 0.9),
      eyes: TOON_EYES,
      brows: darker(hairColor, 0.1),
      mouth: { anchor: [47.5, 47.4] },
      front: hair.front,
      eyewear: glasses && roundGlasses('#2b2b30'),
      hat: hatOn && studentHat(robe),
      cheeks: random() < 0.5 ? '#f4a3a3' : null,
    },
  };
}

/** A professor: tall, a robe in the category color sprinkled with stars and moons, a tall pointed hat, spectacles; a long beard or a high bun. */
function professor(look) {
  const random = rngOf(look);
  const skin = pick(HUMAN_SKINS.slice(0, 6), random);
  const bearded = random() < 0.55;
  const hairColor = bearded ? pick(['#ece8e1', '#d4cfc7', '#a8a29e', '#9a4a22', '#5a3a22'], random) : pick(['#3d2614', '#7a4a22', '#c9c5bd', '#1f1a17', '#a8582a'], random);
  const cloak = pick(['#2e1f4f', '#1f2d4f', '#3a1f2a', '#1f3a33', '#3f3418'], random);
  const hatOn = bearded ? random() < 0.85 : random() < 0.55;
  const spectacles = pick(['half', 'round', 'half', null], random);
  const held = pickWeighted([['wand', 58], ['book', 30], [null, 12]], random);
  const hair = bearded ? HAIR.longWavy(hairColor) : HAIR.longStraight(hairColor);
  const stars = [[33.4, 99, 2.3], [45, 93, 2], [57.8, 97.4, 2.3], [40.4, 105, 1.6], [51.4, 103.4, 1.8], [44.6, 67, 1.6], [48.2, 80, 1.6]];
  const moons = [[37.6, 90, 2.4], [53.6, 89, 2.2], [61.6, 104, 2]];
  const legs = { trousers: '#3b3346', feet: 'shoe', shoes: '#3a2a4a', width: 6 };
  return {
    shadowWidth: 19,
    behind: cloakBack(cloak, { hem: 109, spread: 15 }),
    legBack: leg('back', legs),
    legFront: leg('front', legs),
    armBack: arm('back', { style: 'wide', sleeve: 'cat', hand: skin }),
    armFront: arm('front', { style: 'wide', sleeve: 'cat', hand: skin }),
    torso: [
      shape(longGarmentPath('regular', { hem: 108, flare: 8 }), 'cat'),
      shade('M50 57 L57 66 L66 108 Q59 109.4 54 109.4 Z', '#000000', 0.12),
      stroke('M27 106.6 Q46 110.6 65 106.6', GOLD, 1.6),
      ...stars.map(([x, y, size]) => path(starPath(x, y, size), '#fde68a', { stroke: GOLD_DARK, 'stroke-width': 0.3 })),
      ...moons.map(([x, y, size]) => path(moonPath(x, y, size), '#e2e8f0')),
      stroke('M35.6 78.4 Q46 81.4 56.4 78.4', GOLD, 1.4), stroke('M43 80.6 L42 88 M45 80.8 L45 87.6', GOLD, 1),
    ],
    overTorso: cloakFront(cloak, GOLD),
    held: held === 'book' ? HELD.book(pick(['#4a1d5a', '#1f3a6b', '#5a3a1e'], random)) : HELD[held]?.('#3d2614') ?? null,
    headScale: 1,
    head: {
      back: [hair.back, !bearded && !hatOn && [dot(45, 20.6, 7, hairColor), stroke('M40 21 Q45 17 50 21', darker(hairColor, 0.25), 0.8)]],
      base: headBase(skin),
      features: nose(skin, 1.25),
      eyes: TOON_EYES,
      brows: darker(hairColor, bearded ? 0.12 : 0.2),
      beforeMouth: bearded && BEARD.long(hairColor),
      mouth: { anchor: bearded ? [47.6, 48.6] : [47.5, 47.4] },
      front: [bearded && shape('M41 47 q3.4 -2.6 6.6 -0.4 q3.4 -2.2 6.6 0.4 q-3 3 -6.6 1.4 q-3.6 1.6 -6.6 -1.4 Z', hairColor),
        bearded ? hair.front : shape('M31 41 Q30 25 46 24.5 Q61 25 61 37 Q54 29.6 46 29.6 Q37 30 33.4 37 Q33 42 33.4 46 Z', hairColor)],
      eyewear: spectacles === 'half' ? halfMoonGlasses(GOLD_DARK) : spectacles === 'round' ? roundGlasses(GOLD_DARK) : null,
      hat: hatOn && professorHat(),
    },
  };
}

/** A potions master: a long dark robe with a high collar, a leather apron in the category color, a bandolier of vials, a bubbling flask. */
function potioneer(look) {
  const random = rngOf(look);
  const skin = pick(HUMAN_SKINS, random);
  const hairColor = pick(['#141414', '#2b1d14', '#5a3a22', '#9a948c', '#3a2a4a', '#7a2e1a'], random);
  const robe = pick(['#1c1b22', '#1d2a24', '#2a1d2a', '#1f2430'], random);
  const hairStyle = pick(['longStraight', 'topKnot', 'shortCrop', 'bald'], random);
  const goggles = random() < 0.45;
  const goatee = hairStyle !== 'topKnot' && random() < 0.4;
  const liquid = pick(['#4ade80', '#a78bfa', '#f472b6', '#38bdf8', '#facc15'], random);
  const gloves = random() < 0.4 ? '#3a2f2a' : skin;
  const held = pickWeighted([['flask', 70], ['ladle', 15], [null, 15]], random);
  const hair = HAIR[hairStyle](hairColor);
  const vials = [[40.4, 63.6, '#4ade80'], [44.6, 68.6, '#f472b6'], [48.8, 73.6, '#38bdf8']];
  const legs = { trousers: '#26262c', feet: 'boot', shoes: '#1a1614', width: 6 };
  const sleeves = { sleeve: robe, hand: gloves, cuff: '#3a2a1a', width: 5.8 };
  return {
    shadowWidth: 17,
    legBack: leg('back', legs),
    legFront: leg('front', legs),
    armBack: arm('back', sleeves),
    armFront: arm('front', sleeves),
    torso: [
      shape(longGarmentPath('slim', { hem: 107, flare: 6 }), robe),
      shape('M38.4 61 Q46 59 53.6 61 L56.4 101 Q46 103.8 35.6 101 Z', 'cat'),
      shade('M47 60 Q51 60 53.6 61 L56.4 101 Q52 102.6 47.6 103 Z', '#000000', 0.12),
      box(40.6, 86, 10.8, 7.4, 'cat-dark', { rx: 1.2 }),
      stroke('M38.8 61 L41.6 55.4 M53.2 61 L50.4 55.4', 'cat-dark', 1.4),
      path('M44 95 q1.4 -2 3 0 q-1.4 2 -3 0 Z', '#000000', { 'fill-opacity': 0.12 }),
    ],
    overTorso: [
      shape('M37.6 57.4 L36.6 48.6 Q40.4 49.4 43.2 55 Z', robe), shape('M54.4 57.4 L55.4 48.6 Q51.6 49.4 48.8 55 Z', robe),
      stroke('M37 59.6 L55 82', '#5a3a22', 2.8),
      ...vials.flatMap(([x, y, color]) => [box(x - 1.3, y - 3.6, 2.6, 5.4, color, { rx: 0.9 }), box(x - 1, y - 4.8, 2, 1.4, '#9a6a3c', { rx: 0.4 })]),
    ],
    held: held === 'flask' ? HELD.flask(liquid) : HELD[held]?.() ?? null,
    headScale: 1,
    head: {
      back: hair.back,
      base: headBase(skin),
      features: nose(skin, 1.45),
      eyes: TOON_EYES,
      brows: darker(hairColor, 0.05),
      beforeMouth: goatee && shape('M43.6 50.6 Q47.6 52.4 51.4 50.4 Q50.6 56.4 47.4 58 Q44.4 56 43.6 50.6 Z', hairColor),
      mouth: { anchor: [47.5, 47.4] },
      front: [hair.front,
        goggles && [stroke('M31.2 34.2 Q46 29.4 60.8 33.4', '#3a2a1a', 2), circle(43.4, 32.6, 3.4, '#bde0fe', { stroke: '#b08d3c', 'stroke-width': 1.5 }),
          circle(51.6, 32.4, 3.4, '#bde0fe', { stroke: '#b08d3c', 'stroke-width': 1.5 }), circle(42.4, 31.6, 0.9, '#ffffff')]],
    },
  };
}

/** The caretaker: a patched long coat over a waistcoat in the category color, a ring of keys, a lantern or a broom; a cap or a bald head. */
function caretaker(look) {
  const random = rngOf(look);
  const skin = pick(HUMAN_SKINS, random);
  const hairColor = pick(['#9a948c', '#5a4a3a', '#c9c5bd', '#3d2a1c', '#7a5a3a'], random);
  const coat = pick(['#5c4a36', '#4f4a3c', '#6b5236', '#4a3f38', '#56523f'], random);
  const patch = pick(['#8a6a44', '#6b7a5a', '#7a5a5a', '#8a8070'], random);
  const cap = pickWeighted([['flat', 45], ['wool', 20], [null, 35]], random);
  const capColor = pick(['#4a4238', '#5a4a3a', '#3f4a3a', '#6b3a2a'], random);
  const held = pickWeighted([['lantern', 55], ['broom', 30], ['keys', 15]], random);
  const beard = pick(['stubble', 'short', 'mustache', 'stubble'], random);
  const build = pick(['slim', 'regular', 'round'], random);
  const hair = cap ? null : random() < 0.6 ? HAIR.bald(hairColor) : HAIR.shaggy(hairColor);
  const legs = { trousers: '#4a4238', feet: 'boot', shoes: '#2e2620', width: 7 };
  const sleeves = { sleeve: coat, hand: skin, cuff: darker(coat, 0.25), width: 6.2 };
  const stitches = color => ({ stroke: color, 'stroke-width': 0.6, 'stroke-dasharray': '1 1' });
  return {
    shadowWidth: 18,
    legBack: leg('back', legs),
    legFront: [leg('front', legs), box(49.2, 94, 4.6, 4.4, patch, { rx: 0.6 })],
    armBack: arm('back', sleeves),
    armFront: arm('front', sleeves),
    torso: [
      shape(torsoPath(build, { bottom: 92 }), 'cat'),
      buttons(46, [64, 70, 76, 82], '#c9b48a', 1),
      shape('M33 56 Q38 54.4 42 56 L41.4 72 L40.4 101 Q36.6 102.4 33.2 100.8 Q32 78 33 56 Z', coat),
      shape('M59 56 Q54 54.4 50 56 L50.6 72 L51.6 101 Q57 102.4 62.4 100.4 Q62.6 78 59 56 Z', coat),
      stroke('M42 56 L38.6 66 M50 56 L53.4 66', darker(coat, 0.35), 1.1),
      box(53.6, 86, 6.4, 6.4, patch, { rx: 0.6 }), rect(54.4, 86.8, 4.8, 4.8, 'none', stitches(lighter(patch, 0.4))),
      box(34.4, 73, 5.4, 6.4, patch, { rx: 0.6 }), rect(35.2, 73.8, 3.8, 4.8, 'none', stitches(lighter(patch, 0.4))),
    ],
    overTorso: [circle(39.6, 92.4, 2.8, 'none', { stroke: '#b08d3c', 'stroke-width': 1.1 }),
      stroke('M38.4 95 L37.8 99.6 h1.4 M41 95 L41.8 99.4 h-1.4 M39.8 95.2 V99', '#c9a227', 1)],
    held: HELD[held](),
    headScale: 1.02,
    head: {
      back: hair?.back ?? null,
      base: headBase(skin),
      features: [blob(52.8, 44.6, 3, 2.6, darker(skin, 0.08)), hair?.front ?? null],
      eyes: TOON_EYES,
      brows: darker(hairColor, 0.2),
      beforeMouth: beard === 'mustache' ? null : BEARD[beard](hairColor),
      mouth: { anchor: [47.4, 48.6] },
      front: beard === 'mustache' ? BEARD.mustache(hairColor) : null,
      hat: cap === 'flat'
        ? [shape('M30.6 35.6 Q30.6 23 46 22.4 Q60.6 23 61.6 31.6 Q67.4 33 65.4 36 Q52 34 30.6 35.6 Z', capColor), stroke('M32 33 Q46 28 61 31.4', darker(capColor, 0.3), 0.9)]
        : cap === 'wool'
          ? [shape('M31 37 Q30 21.6 46 21 Q62 21.6 61 37 Z', capColor), box(30, 33.4, 32, 4.4, darker(capColor, 0.15), { rx: 2 }), dot(46, 20.4, 3, lighter(capColor, 0.2))]
          : null,
    },
  };
}

/** A castle ghost: pearly and see-through, a ruff collar, a doublet (or a gown, or a friar's habit) in the category color, floating on a wisp. */
function ghost(look) {
  const random = rngOf(look);
  const variant = pickWeighted([['noble', 40], ['lady', 35], ['friar', 25]], random);
  const pearl = pick(['#eef5fb', '#e8f0f7', '#f1f4fa', '#e6f2f0'], random);
  const edge = '#9fb4c8';
  const pale = (d, extra = {}) => shape(d, pearl, { stroke: edge, ...extra });
  const hairColor = '#d3dde8';
  const ruff = [blob(46, 57.6, 13.6, 4.6, '#ffffff', { stroke: '#b6c6d6' }),
    stroke('M35.6 57 L35 59.6 M39.6 55.4 L39.2 61.4 M43.6 54.6 V62.2 M48.4 54.6 V62.2 M52.4 55.4 L52.8 61.4 M56.4 57 L57 59.6', '#b6c6d6', 0.7)];
  const wisp = pale('M33.6 60 Q30.6 78 33 92 Q35.4 101 42 104.4 Q47.4 108 43.4 113.6 Q52.4 111 52.6 103.4 Q58.6 96.4 59.4 86 Q61.4 72 58.4 60 Z');
  const body = {
    noble: [shape('M35 58 Q46 54.4 57 58 L58.6 85 Q46 90 33.4 85 Z', 'cat', { 'fill-opacity': 0.65 }),
      stroke('M38 63 V70 M42 64 V72 M50 64 V72 M54 63 V70', 'cat-light', 1.2), buttons(46, [65, 70, 75, 80], GOLD, 0.9),
      stroke('M34.4 84.6 Q46 89.4 57.6 84.6', '#b6c6d6', 1.6)],
    lady: [shape('M36.6 58 Q46 55 55.4 58 L52 80 Q46 84 40 80 Z', 'cat', { 'fill-opacity': 0.65 }),
      shape('M40 80 Q46 84 52 80 L58.6 92 Q55 100 50.4 103 Q46 99 42 104 Q35 98 33.2 91 Z', 'cat-light', { 'fill-opacity': 0.5 }),
      stroke('M41 60 L46 78 L51 60', GOLD, 0.9), buttons(46, [66, 72], '#ffffff', 1)],
    friar: [shape('M34.6 58 Q46 54 57.4 58 Q61 76 59 92 Q50 99 46 104 Q40 99 33 92 Q31 76 34.6 58 Z', 'cat', { 'fill-opacity': 0.6 }),
      stroke('M34.6 79 Q46 83 57.6 79', '#d6c7a6', 1.6), stroke('M40.4 81 Q39.6 88 41.4 93', '#d6c7a6', 1.2)],
  }[variant];
  const sleeve = variant === 'friar' ? { style: 'wide', sleeve: pearl, hand: pearl } : { style: 'puffy', sleeve: pearl, hand: pearl, width: 5.6 };
  return {
    shadowWidth: 14,
    behind: [ellipse(46, 74, 25, 40, '#dbeafe', { 'fill-opacity': 0.22, class: 'p-glow' }),
      variant === 'friar' && faint(0.8, shape('M33 58 Q32 48 46 46 Q60 48 59 58 Q52 62 46 61 Q40 62 33 58 Z', 'cat-dark'))],
    legBack: null,
    legFront: null,
    armBack: faint(0.75, arm('back', sleeve)),
    armFront: faint(0.85, arm('front', sleeve)),
    torso: faint(0.86, wisp, body,
      stroke('M38 92 Q40 99 45 101 M54 92 Q53 99 49 103', edge, 0.8)),
    overTorso: variant === 'friar' ? null : faint(0.95, ruff),
    held: null,
    headScale: 1,
    head: {
      back: faint(0.85, variant === 'lady' ? [dot(46, 21, 8, hairColor), HAIR.longWavy(hairColor).back] : null),
      base: faint(0.9, headBase(pearl)),
      features: [nose(pearl, 1.1), variant === 'friar' && faint(0.85, [stroke('M31.6 45 Q30.6 38 33.6 33 M60.4 43 Q61.4 37 58.6 33', hairColor, 2.6)])],
      eyes: { ...TOON_EYES, color: '#475d7a' },
      brows: '#8aa0b6',
      beforeMouth: variant === 'noble' && faint(0.9, [shape('M42.6 50.4 Q47.4 52.6 52.4 50.2 Q50.6 57.6 47.2 61 Q44.6 56.4 42.6 50.4 Z', hairColor)]),
      mouth: { anchor: [47.5, 47.4], color: '#475d7a' },
      front: [variant === 'noble' && BEARD.mustache(hairColor), variant === 'lady' && faint(0.9, HAIR.longWavy(hairColor).front)],
      hat: variant === 'noble'
        ? [shape('M31.4 32.4 Q31 24.6 46 24 Q61 24.6 60.6 32.4 Q46 35.4 31.4 32.4 Z', 'cat-dark', { 'fill-opacity': 0.8 }),
          stroke('M33 31.4 Q46 34 59 31.4', GOLD, 1.1), shape('M52 26.4 Q60 18 66 19.6 Q61 22.6 55 28 Z', '#ffffff', { stroke: '#b6c6d6' })]
        : variant === 'lady' ? [stroke('M33.4 31 Q46 25.4 58.6 30.6', '#ffffff', 1.4), dot(46, 27.4, 1.4, '#ffffff', { stroke: '#b6c6d6' })] : null,
    },
  };
}

const OWL_BREEDS = [
  { body: '#d8a865', wing: '#c48f4c', belly: '#faf2e4', face: '#fdf8ef', ring: '#b8834a', iris: null, spots: '#8a6a3a', barn: true },
  { body: '#f4f4f1', wing: '#e6e6e2', belly: '#ffffff', face: '#ffffff', ring: '#cfcfc8', iris: '#f5b70a', spots: '#4b4b4b' },
  { body: '#8a5a32', wing: '#73482a', belly: '#d9b48a', face: '#c99a6a', ring: '#5a3a1e', iris: null, spots: '#5a3a1e' },
  { body: '#9a7350', wing: '#7f5d40', belly: '#dcbf96', face: '#cfab82', ring: '#4a3424', iris: '#f97316', spots: '#5a3f2a', tufts: true },
  { body: '#8a8580', wing: '#706b66', belly: '#dad6d0', face: '#e8e4dd', ring: '#57534e', iris: '#facc15', spots: '#57534e' },
];

/** A mail owl: a round feathered body, wings for arms, big eyes, a satchel in the category color and a letter or a parcel. */
function owl(look) {
  const random = rngOf(look, 3);
  const breed = pick(OWL_BREEDS, random);
  const tufts = breed.tufts ?? random() < 0.25;
  const held = pickWeighted([['letter', 75], ['parcel', 25]], random);
  const { body, wing, belly, face, ring, iris, spots } = breed;
  const feathers = darker(wing, 0.28);
  const talon = (x, y) => [limb(x - 0.2, 95, x, 106.6, 4.6, belly), blob(x + 0.4, 109.4, 4, 2.5, belly),
    stroke(`M${x - 2.6} ${y - 0.4} l-1.2 2 M${x + 0.4} ${y} v2.2 M${x + 3.2} ${y - 0.4} l1.4 1.8`, '#3f3a36', 1.2)];
  const eyes = [[41.6, 40.6], [51.8, 40.6]];
  return {
    shadowWidth: 16,
    legBack: talon(41.4, 111),
    legFront: talon(51.6, 111),
    armBack: [shape('M37.6 57.6 Q28.2 62 28.4 77 Q28.8 90 34.6 95.8 Q37.4 86 39.6 72 Q40.6 62 37.6 57.6 Z', wing),
      stroke('M31.2 82 Q33.4 86 34.6 92 M30.2 74 Q32.8 79 35.4 86', feathers, 0.8)],
    armFront: [shape('M54.4 57.6 Q63.8 62 63.6 77 Q63.2 90 57.4 95.8 Q54.6 86 52.4 72 Q51.4 62 54.4 57.6 Z', wing),
      stroke('M60.8 82 Q58.6 86 57.4 92 M61.8 74 Q59.2 79 56.6 86 M60.4 66 Q58 70 55.6 76', feathers, 0.8)],
    torso: [
      shape('M32 62 Q31 51 46 49.6 Q61 51 60 62 Q64.4 80 58.4 96 Q46 103.4 33.6 96 Q27.6 80 32 62 Z', body),
      shape('M37 69 Q46 63 55 69 Q58.4 84 53.4 95.4 Q46 99.4 38.6 95.4 Q33.6 84 37 69 Z', belly),
      stroke('M39.6 73 q2 2 4 0 M48.4 73 q2 2 4 0 M43.6 79.4 q2 2 4 0 M39.6 85.6 q2 2 4 0 M48.4 85.6 q2 2 4 0 M44 91.6 q2 2 4 0', spots, 0.9),
    ],
    overTorso: [stroke('M37.4 57.4 L49.4 84', 'cat-dark', 2.6),
      shape('M38.4 82.6 H52.6 L52 94 Q45.4 96 39 94 Z', 'cat'), shape('M38.4 82.6 H52.6 V88 Q45.4 90.6 38.4 88 Z', 'cat-dark'),
      dot(45.4, 88.6, 1.3, GOLD)],
    held: HELD[held](),
    headScale: 1.04,
    head: {
      back: tufts && [shape('M35.4 30.4 L31.4 17.6 L41.4 27 Z', body), shape('M56.6 30.4 L60.8 17.6 L50.8 27 Z', body)],
      base: [blob(46, 40, 16.6, 15.4, body), stroke('M36 28.6 q2 1.6 4 0 M44 26.6 q2 1.6 4 0 M52 28.6 q2 1.6 4 0', feathers, 0.8)],
      features: breed.barn
        ? [shape('M46.6 30.6 Q37 25.6 33.2 35.4 Q30.8 46 38 51.2 Q43 54.4 46.6 50.2 Q50.2 54.4 55.2 51.2 Q62.4 46 60 35.4 Q56.2 25.6 46.6 30.6 Z', face, { stroke: ring })]
        : [blob(eyes[0][0], eyes[0][1], 7, 6.8, face, { stroke: ring }), blob(eyes[1][0], eyes[1][1], 7, 6.8, face, { stroke: ring }),
          iris && eyes.map(([x, y]) => circle(x, y, 4.5, 'none', { stroke: iris, 'stroke-width': 1.6 }))],
      eyes: { anchors: eyes, style: 'big', color: '#1a1208' },
      brows: darker(body, 0.4),
      mouth: { custom: shape('M45.2 43.8 Q48.8 43 49.8 45.2 Q49.4 48.8 46.8 50.6 Q47 47.4 45.2 43.8 Z', '#d6a54e') },
    },
  };
}

// ---------------------------------------------------------------------------
// Furniture (world-layout.js ART sizes)
// ---------------------------------------------------------------------------

/** A row of upright books standing on a shelf line (baseline y). */
function bookRow(x, baseline, books) {
  const parts = [];
  let left = x;
  for (const [width, height, color] of books) {
    parts.push(rect(left, baseline - height, width, height, color, { stroke: darker(color, 0.4), 'stroke-width': 0.6, rx: 0.6 }),
      path(`M${left + 0.6} ${baseline - height + 2.4} h${width - 1.2} M${left + 0.6} ${baseline - 2.6} h${width - 1.2}`, 'none', { stroke: GOLD, 'stroke-width': 0.7 }));
    left += width + 0.3;
  }
  return parts;
}

const pot = (x, top, width, height, color, band) => [
  path(`M${x} ${top} H${x + width} L${x + width - 3.4} ${top + height} H${x + 3.4} Z`, color, { stroke: darker(color, 0.4), 'stroke-width': 1.1 }),
  rect(x - 2, top - 3, width + 4, 5, lighter(color, 0.1), { rx: 1.4, stroke: darker(color, 0.4), 'stroke-width': 1 }),
  path(`M${x + 1.4} ${top + height * 0.42} H${x + width - 1.4}`, 'none', { stroke: band, 'stroke-width': 1.6 }),
];

const decor = {
  // A great arched door: a pointed stone arch, oak leaves with iron straps and studs, ring handles, a stained-glass lunette.
  door: () => {
    const studs = [];
    for (const y of [47.4, 66.4, 84.4]) for (let x = 9.4; x < 42; x += 4.4) studs.push(circle(x, y, 0.85, '#a1a1aa'));
    return [
      path('M-2 92 V40 Q-2 12 25 -1 Q52 12 52 40 V92 Z', STONE, { stroke: STONE_DARK, 'stroke-width': 1.2 }),
      path('M-2 54 H5 M45 54 H52 M-2 72 H5 M45 72 H52 M0 32 L6.4 35.6 M50 32 L43.6 35.6 M8 11 L12.6 16.6 M42 11 L37.4 16.6 M25 -1 V7', 'none', { stroke: STONE_DARK, 'stroke-width': 1 }),
      path('M5 92 V41 Q5 18.6 25 7.6 Q45 18.6 45 41 V92 Z', '#2a1a0e'),
      path('M7 39 Q7 21 25 10.6 Q43 21 43 39 Z', '#1d2550'),
      path('M25 10.6 V39 M25 24 L11 33 M25 24 L39 33', 'none', { stroke: '#1a1a1e', 'stroke-width': 1.2 }),
      path('M8.6 37.6 Q9.6 24.6 23.6 13.6 V22.6 L10.6 31 Z', HOUSE_COLORS[0], { 'fill-opacity': 0.9 }),
      path('M41.4 37.6 Q40.4 24.6 26.4 13.6 V22.6 L39.4 31 Z', HOUSE_COLORS[1], { 'fill-opacity': 0.9 }),
      path('M10.4 34.6 L23.6 26 V37.6 Z', HOUSE_COLORS[2], { 'fill-opacity': 0.9 }), path('M39.6 34.6 L26.4 26 V37.6 Z', HOUSE_COLORS[3], { 'fill-opacity': 0.9 }),
      path('M7 39 Q7 21 25 10.6 Q43 21 43 39 Z', '#fff3c4', { 'fill-opacity': 0.12, class: 'p-glow' }),
      rect(6, 39, 38, 53, '#6b4426', { stroke: WOOD_DARK, 'stroke-width': 1 }),
      path('M12.4 40 V92 M18.6 40 V92 M31.4 40 V92 M37.6 40 V92', 'none', { stroke: '#4f3119', 'stroke-width': 0.9 }),
      path('M25 39 V92', 'none', { stroke: '#2a1a0e', 'stroke-width': 1.6 }),
      ...[46, 65, 83].map(y => rect(6, y, 38, 3, IRON)),
      ...studs,
      circle(21, 59, 2.8, 'none', { stroke: '#c9a227', 'stroke-width': 1.2 }), circle(29, 59, 2.8, 'none', { stroke: '#c9a227', 'stroke-width': 1.2 }),
      circle(21, 56.4, 1, '#c9a227'), circle(29, 56.4, 1, '#c9a227'),
      rect(-3, 89, 56, 3.4, STONE_DARK, { rx: 1 }),
    ];
  },
  // A gothic bookcase: spellbooks, a crystal ball, potion bottles (one glowing), a candle, old tomes and a scroll.
  shelf: () => [
    path('M2 92 V15 Q2 7 11 5 Q25 3 32 -4 Q39 3 53 5 Q62 7 62 15 V92 Z', '#5b3a20', { stroke: '#2e1d10', 'stroke-width': 1.2 }),
    path('M7 88 V16 Q7 11 13 10 Q26 8 32 2.6 Q38 8 51 10 Q57 11 57 16 V88 Z', '#24160c'),
    circle(32, 5.4, 2.4, GOLD, { stroke: GOLD_DARK, 'stroke-width': 0.6 }),
    ...[33, 55, 75].map(y => rect(5, y, 54, 3, '#7a5030', { stroke: '#3e2614', 'stroke-width': 0.6 })),
    ...bookRow(9, 33, [[3.6, 15, '#7a1f2b'], [3, 13, '#1f3a6b'], [4, 17, '#3f5a2a'], [3.2, 14, '#5a2a5a'], [3.6, 16, '#8a5a2a'], [2.8, 12, '#2a2a3a']]),
    path('M33 33 L37.6 19 L40.6 20 L36 33 Z', '#a0522d', { stroke: '#5a2a14', 'stroke-width': 0.6 }),
    circle(48.6, 33, 9, '#a5b4fc', { 'fill-opacity': 0.25, class: 'p-glow' }),
    path('M44 33 L45.6 29.4 H51.6 L53.2 33 Z', GOLD, { stroke: GOLD_DARK, 'stroke-width': 0.6 }),
    circle(48.6, 24.6, 5.6, '#c7d2fe', { stroke: '#818cf8', 'stroke-width': 0.8, 'fill-opacity': 0.9 }),
    circle(46.8, 22.8, 1.6, '#ffffff', { 'fill-opacity': 0.9 }),
    // Potions.
    circle(14, 50, 5.4, '#4ade80', { stroke: '#166534', 'stroke-width': 0.7, class: 'p-glow' }), rect(12.4, 41, 3.2, 5, '#d1fae5', { stroke: '#166534', 'stroke-width': 0.5 }), rect(12, 39.6, 4, 2, '#9a6a3c'),
    path('M21 55 V44 Q21 41.6 23.4 41.6 Q25.8 41.6 25.8 44 V55 Z', '#7c3aed', { stroke: '#4c1d95', 'stroke-width': 0.7 }), rect(22.2, 38.4, 2.4, 3.4, '#ede9fe'), rect(21.8, 37.2, 3.2, 1.6, '#9a6a3c'),
    path('M29 55 L30.4 47 H34.6 L36 55 Z', '#ef4444', { stroke: '#7f1d1d', 'stroke-width': 0.7 }), rect(31.4, 44, 2.2, 3.2, '#fee2e2'),
    rect(38.6, 46.4, 7.4, 8.6, '#f59e0b', { rx: 1.2, 'fill-opacity': 0.85, stroke: '#92400e', 'stroke-width': 0.7 }), rect(38, 44.6, 8.6, 2.2, '#9a6a3c', { rx: 0.6 }),
    rect(50.4, 46, 3.4, 9, '#fbf3dc', { rx: 0.5 }), path('M52.1 39.6 q-2 3 0 5.4 q2 -2.4 0 -5.4 Z', '#ffb238', { class: 'flame' }),
    circle(52.1, 43, 4.4, '#ffd97a', { 'fill-opacity': 0.3, class: 'p-glow' }),
    // Leaning books and a stack.
    ...bookRow(9, 75, [[4, 15, '#1f5a3a'], [3.4, 13, '#7a1f2b'], [4.2, 16, '#3a2a5a'], [3, 12, '#8a6a2a']]),
    path('M25.4 75 L31.6 62 L34.6 63.4 L28.6 75 Z', '#2a4a7a', { stroke: '#152540', 'stroke-width': 0.6 }),
    rect(37, 70.4, 18, 4.6, '#6b2a1a', { rx: 0.8, stroke: '#3a140a', 'stroke-width': 0.6 }), rect(38.4, 66, 15, 4.4, '#2a4a3a', { rx: 0.8, stroke: '#14281e', 'stroke-width': 0.6 }),
    rect(39.6, 62.2, 12.4, 3.8, '#7a5a1a', { rx: 0.8, stroke: '#3e2c0a', 'stroke-width': 0.6 }),
    // Old tomes and a scroll at the bottom.
    rect(9, 81, 22, 7, '#4a2a1a', { rx: 1, stroke: '#24140a', 'stroke-width': 0.7 }), path('M10.4 84.4 H29.6', 'none', { stroke: GOLD, 'stroke-width': 0.8 }),
    rect(33, 82.6, 20, 5.4, PARCHMENT, { rx: 2.6, stroke: '#b9a47e', 'stroke-width': 0.7 }), circle(53, 85.3, 2.7, '#e6d6b0', { stroke: '#b9a47e', 'stroke-width': 0.7 }),
    rect(41, 82.4, 2.4, 5.8, '#b91c1c'),
  ],
  // A velvet common-room sofa: a buttoned back, rolled arms, three cushions, carved feet.
  sofa: () => {
    const tufts = [];
    for (let row = 0; row < 2; row += 1) for (let x = 26 + row * 9; x < 126; x += 18) tufts.push(circle(x, 15 + row * 7, 1.1, '#4a0f1a'));
    return [
      path('M14 36 Q12 12 42 8.6 Q75 4.6 108 8.6 Q138 12 136 36 Z', VELVET, { stroke: '#3e0c14', 'stroke-width': 1.4 }),
      path('M20 32 Q20 16 44 13 Q75 9.6 106 13 Q130 16 130 32', 'none', { stroke: '#a3394a', 'stroke-width': 1.4, 'stroke-opacity': 0.7 }),
      ...tufts,
      path('M26 15 L35 22 L44 15 L53 22 L62 15 L71 22 L80 15 L89 22 L98 15 L107 22 L116 15 L125 22', 'none', { stroke: '#5c1420', 'stroke-width': 0.7 }),
      rect(8, 33, 134, 12, '#5c1420', { rx: 4, stroke: '#3e0c14', 'stroke-width': 1.2 }),
      ...[34, 75, 116].map(x => rect(x - 19.5, 27, 39, 10, VELVET, { rx: 4.4, stroke: '#3e0c14', 'stroke-width': 1 })),
      ...[34, 75, 116].map(x => path(`M${x - 15} 29.6 Q${x} 27.8 ${x + 15} 29.6`, 'none', { stroke: '#b4505e', 'stroke-width': 1.4, 'stroke-linecap': 'round' })),
      path('M-1 46 V25 Q-1 15 9 15 Q19 15 19 25 V46 Z', VELVET, { stroke: '#3e0c14', 'stroke-width': 1.2 }),
      path('M151 46 V25 Q151 15 141 15 Q131 15 131 25 V46 Z', VELVET, { stroke: '#3e0c14', 'stroke-width': 1.2 }),
      circle(9, 24, 5.4, '#8f2636', { stroke: '#3e0c14', 'stroke-width': 1 }), circle(141, 24, 5.4, '#8f2636', { stroke: '#3e0c14', 'stroke-width': 1 }),
      path('M9 24 m-2.6 0 a2.6 2.6 0 1 1 2.6 2.6 M141 24 m2.6 0 a2.6 2.6 0 1 0 -2.6 2.6', 'none', { stroke: GOLD, 'stroke-width': 0.9 }),
      rect(2, 45, 146, 5.4, WOOD, { rx: 1.6, stroke: WOOD_DARK, 'stroke-width': 1 }), path('M4 47.6 H146', 'none', { stroke: GOLD, 'stroke-width': 0.8 }),
      ...[8, 75, 142].map(x => path(`M${x - 4} 50 H${x + 4} L${x + 3} 57 Q${x + 5.4} 60 ${x + 2} 62 H${x - 2} Q${x - 5.4} 60 ${x - 3} 57 Z`, WOOD_DARK, { stroke: '#24160c', 'stroke-width': 0.8 })),
    ];
  },
  // A round rug in the four house colors, with a gold border and fringe.
  rug: () => [
    ellipse(100, 20, 99, 19, GOLD, { stroke: GOLD_DARK, 'stroke-width': 1 }),
    ellipse(100, 20, 99, 19, 'none', { stroke: '#f6dd8a', 'stroke-width': 2.4, 'stroke-dasharray': '1 2.4' }),
    ellipse(100, 20, 91, 16.4, '#3a1e2a', { stroke: '#2a121c', 'stroke-width': 0.8 }),
    path('M100 20 L24 20 A76 13.4 0 0 1 100 6.6 Z', HOUSE_COLORS[0]), path('M100 20 L100 6.6 A76 13.4 0 0 1 176 20 Z', HOUSE_COLORS[1]),
    path('M100 20 L176 20 A76 13.4 0 0 1 100 33.4 Z', HOUSE_COLORS[2]), path('M100 20 L100 33.4 A76 13.4 0 0 1 24 20 Z', HOUSE_COLORS[3]),
    ellipse(100, 20, 76, 13.4, 'none', { stroke: GOLD, 'stroke-width': 1.4 }),
    path('M24 20 H176 M100 6.6 V33.4', 'none', { stroke: GOLD, 'stroke-width': 1.2 }),
    ellipse(100, 20, 26, 6.4, '#2a121c', { stroke: GOLD, 'stroke-width': 1.4 }),
    path(starPath(100, 20, 5.6, 2.2), GOLD, { transform: 'translate(100 20) scale(1.2 0.8) translate(-100 -20)' }),
    ...[[60, 13], [140, 13], [60, 27], [140, 27]].map(([x, y]) => path(`M${x} ${y - 2.6} L${x + 3.4} ${y} L${x} ${y + 2.6} L${x - 3.4} ${y} Z`, '#f6dd8a', { 'fill-opacity': 0.8 })),
  ],
  // A tea trolley: a copper teapot and goblets on top, a jug of pumpkin juice and cakes below.
  coffee: () => [
    rect(4, 42, 4, 44, '#b08d3c', { rx: 1 }), rect(48, 42, 4, 44, '#b08d3c', { rx: 1 }),
    path('M50 42 Q57 40 56 30', 'none', { stroke: '#b08d3c', 'stroke-width': 2.4, 'stroke-linecap': 'round' }),
    rect(2, 43, 52, 4.4, WOOD, { rx: 1.2, stroke: WOOD_DARK, 'stroke-width': 0.9 }),
    rect(2, 72, 52, 4.4, WOOD, { rx: 1.2, stroke: WOOD_DARK, 'stroke-width': 0.9 }),
    circle(8, 87, 4.6, IRON, { stroke: '#18181b', 'stroke-width': 0.8 }), circle(48, 87, 4.6, IRON, { stroke: '#18181b', 'stroke-width': 0.8 }),
    circle(8, 87, 1.4, '#a1a1aa'), circle(48, 87, 1.4, '#a1a1aa'),
    // Teapot.
    ellipse(16, 36, 9.4, 7.4, '#c2703a', { stroke: '#7a3e18', 'stroke-width': 1 }),
    path('M24.6 37 Q30 36 31 29.4', 'none', { stroke: '#c2703a', 'stroke-width': 2.6, 'stroke-linecap': 'round' }),
    path('M7 33 Q2.4 33.6 3.6 38.4 Q4.6 41 7.4 39.6', 'none', { stroke: '#7a3e18', 'stroke-width': 1.6 }),
    path('M10 29.6 Q16 25.6 22 29.6 Z', '#a85a2a', { stroke: '#7a3e18', 'stroke-width': 0.8 }), circle(16, 26.4, 1.6, GOLD),
    path('M12 33.6 Q14 31.6 17 32.6', 'none', { stroke: '#f0b48a', 'stroke-width': 1.2, 'stroke-linecap': 'round' }),
    path('M31 26 q-2 -3 0 -6 q2 -3 0 -6', 'none', { stroke: '#e5e7eb', 'stroke-width': 1.4, 'stroke-linecap': 'round', class: 'p-steam' }),
    // Goblets.
    ...[36.6, 45].map(x => path(`M${x - 3.6} 30.6 H${x + 3.6} Q${x + 3.6} 37 ${x + 0.8} 37.6 V40.6 H${x + 2.8} V43 H${x - 2.8} V40.6 H${x - 0.8} V37.6 Q${x - 3.6} 37 ${x - 3.6} 30.6 Z`, GOLD, { stroke: GOLD_DARK, 'stroke-width': 0.7 })),
    ellipse(36.6, 31, 3.2, 0.9, '#f59e0b'), ellipse(45, 31, 3.2, 0.9, '#f59e0b'),
    // Pumpkin juice and cakes.
    path('M9 72 L10 58 Q9.4 55 12 54 H19 Q21.6 55 21 58 L22 72 Z', '#fde7c7', { stroke: '#b0a08a', 'stroke-width': 0.8, 'fill-opacity': 0.9 }),
    path('M9.6 72 L10.4 61 H20.6 L21.4 72 Z', '#f08a24', { 'fill-opacity': 0.9 }),
    path('M21 58 Q25 59 23.6 64', 'none', { stroke: '#b0a08a', 'stroke-width': 1.4 }),
    ellipse(38, 71.4, 13, 2.2, '#e5e7eb', { stroke: '#9ca3af', 'stroke-width': 0.7 }),
    ...[[31.6, 68], [38, 67.4], [44.4, 68]].map(([x, y]) => [path(`M${x - 4} ${y + 3} Q${x - 4} ${y - 3} ${x} ${y - 3} Q${x + 4} ${y - 3} ${x + 4} ${y + 3} Z`, '#6b3f1e', { stroke: '#3e2410', 'stroke-width': 0.7 }),
      path(`M${x - 3} ${y - 0.6} Q${x} ${y - 3.4} ${x + 3} ${y - 0.6}`, 'none', { stroke: '#fde68a', 'stroke-width': 1 })]),
  ],
  // A stone fountain: a gargoyle head on a column spouts water into a basin.
  cooler: () => [
    rect(10, 12, 16, 56, STONE, { stroke: STONE_DARK, 'stroke-width': 1 }),
    path('M10 26 H26 M10 44 H26 M18 12 V26 M14 26 V44 M22 44 V62', 'none', { stroke: STONE_DARK, 'stroke-width': 0.7 }),
    path('M7 12 H29 L27 7 H9 Z', '#a39c92', { stroke: STONE_DARK, 'stroke-width': 1 }),
    // The gargoyle.
    path('M10 24 L6 14 L13 20 Z M26 24 L30 14 L23 20 Z', '#7d766c', { stroke: '#4b463f', 'stroke-width': 0.8 }),
    path('M8 30 Q2 26 4 20 Q8 24 11 25 Z M28 30 Q34 26 32 20 Q28 24 25 25 Z', '#8f887e', { stroke: '#4b463f', 'stroke-width': 0.8 }),
    ellipse(18, 29, 9, 8.4, '#9a938a', { stroke: '#4b463f', 'stroke-width': 1 }),
    path('M11 25.4 Q14.6 22.6 17 25.4 M19 25.4 Q21.4 22.6 25 25.4', 'none', { stroke: '#4b463f', 'stroke-width': 1.3 }),
    circle(14.4, 27.4, 1.3, '#fbbf24', { class: 'p-glow' }), circle(21.6, 27.4, 1.3, '#fbbf24', { class: 'p-glow' }),
    ellipse(18, 32, 3.4, 2.4, '#7d766c'), circle(16.8, 31.6, 0.6, '#3a3631'), circle(19.2, 31.6, 0.6, '#3a3631'),
    ellipse(18, 35.4, 4.4, 2.4, '#2a2622'), path('M14.6 34.6 l0.8 1.6 l0.8 -1.6 M20 34.6 l0.8 1.6 l0.8 -1.6', '#f3f4f6'),
    path('M18 37 Q19.6 48 18.6 61', 'none', { stroke: '#8ec5e8', 'stroke-width': 2, 'stroke-dasharray': '2.4 2', class: 'p-pour' }),
    // The basin.
    path('M2 62 H34 L30.4 74 Q18 78 5.6 74 Z', '#a39c92', { stroke: STONE_DARK, 'stroke-width': 1.1 }),
    ellipse(18, 62.6, 15.4, 2.6, '#6fb3d9', { stroke: STONE_DARK, 'stroke-width': 0.8 }),
    path('M10 62.4 q2.4 -1 4.8 0 M21 63 q2.4 -1 4.8 0', 'none', { stroke: '#d6eefa', 'stroke-width': 0.8 }),
    rect(13.4, 75, 9.2, 13, STONE, { stroke: STONE_DARK, 'stroke-width': 1 }),
    rect(8, 87, 20, 5, STONE_DARK, { rx: 1 }),
  ],
  // 0: an enchanted plant with curling tendrils and glowing buds (the lounge corner); 1: a root creature peeking from its pot (by the door).
  plant: variant => variant % 2 === 0
    ? [
      group('p-sway',
        ...[[22, 34, 9, 4.6, -70], [13, 34, 9, 4.6, -125], [31, 36, 9, 4.4, -40], [9, 42, 8, 4, -160], [35, 43, 8, 4, -15], [22, 22, 8, 4, -95]].map(([cx, cy, rx, ry, angle]) =>
          ellipse(cx, cy, rx, ry, '#3f8a5a', { transform: `rotate(${angle} ${cx} ${cy})`, stroke: '#1f5a36', 'stroke-width': 0.8 })),
        path('M22 44 Q20 30 25 22 Q30 15 26 9 Q23 6 21 9 M18 44 Q12 34 6 30 Q2 26 5 22 M27 44 Q34 36 39 32 Q42 28 40 25', 'none', { stroke: '#5b9a6e', 'stroke-width': 1.3, 'stroke-linecap': 'round' }),
        ...[[21, 9, '#c4b5fd'], [5, 22, '#f0abfc'], [40, 25, '#a5f3fc'], [14, 27, '#c4b5fd'], [31, 26, '#f0abfc']].map(([x, y, color]) =>
          [circle(x, y, 4.2, color, { 'fill-opacity': 0.3, class: 'p-glow' }), circle(x, y, 2.2, color, { stroke: darker(color, 0.35), 'stroke-width': 0.6 })])),
      ...pot(8, 46, 28, 24, '#2f5d62', GOLD),
    ]
    : [
      group('p-sway p-sway-2',
        ...[[22, 24, -90], [16, 26, -120], [28, 26, -60], [12, 31, -150], [32, 31, -30]].map(([x, y, angle]) =>
          ellipse(x, y, 9, 3.6, '#4f8a34', { transform: `rotate(${angle} ${x} ${y})`, stroke: '#2f5a1e', 'stroke-width': 0.8 })),
        path('M22 40 V18 M20 40 L13 24 M24 40 L31 24', 'none', { stroke: '#2f5a1e', 'stroke-width': 0.9 })),
      ellipse(22, 43, 9, 6.4, '#c9a27a', { stroke: '#8a6a44', 'stroke-width': 1 }),
      path('M17.6 42 q1.6 1.4 3.2 0 M23 42 q1.6 1.4 3.2 0', 'none', { stroke: '#4a3424', 'stroke-width': 0.9, 'stroke-linecap': 'round' }),
      circle(21.8, 46, 1.3, '#7a3a2a'), circle(16.6, 44.6, 1.3, '#e8a08a', { 'fill-opacity': 0.6 }), circle(27, 44.6, 1.3, '#e8a08a', { 'fill-opacity': 0.6 }),
      ...pot(8, 48, 28, 22, '#b45a32', '#f3e7c9'),
      ellipse(22, 48, 14, 2.4, '#3a2a1a'),
    ],
};

// ---------------------------------------------------------------------------
// Stations (viewBox 68 20 72 96, floor at y = 112)
// ---------------------------------------------------------------------------

const stations = {
  // A carved lectern with an open spellbook (glowing runes rising), a quill in an ink pot and a tall candlestand.
  lectern: () => [
    path('M87 112 L90.6 105 H109.4 L113 112 Z', WOOD_DARK, { stroke: '#24160c', 'stroke-width': 1 }),
    path('M95.6 105 L96.6 89 H103.4 L104.4 105 Z', WOOD, { stroke: '#24160c', 'stroke-width': 1 }),
    rect(93.6, 95, 12.8, 3.2, WOOD_DARK, { rx: 1.2 }),
    path('M79 89 L83.6 74 H116.4 L121 89 Z', WOOD, { stroke: '#24160c', 'stroke-width': 1.1 }),
    rect(78, 88, 44, 3.6, WOOD_DARK, { rx: 1.2, stroke: '#24160c', 'stroke-width': 0.8 }),
    path('M83.4 87.4 L86.6 75.6 H113.4 L116.6 87.4 Z', '#6b1d2a', { stroke: '#3a0c14', 'stroke-width': 0.8 }),
    path('M85.4 86.4 L88.2 76.6 Q94 75 99.6 77 V87.2 Q93 85.4 85.4 86.4 Z', PARCHMENT, { stroke: '#b9a47e', 'stroke-width': 0.6 }),
    path('M114.6 86.4 L111.8 76.6 Q106 75 100.4 77 V87.2 Q107 85.4 114.6 86.4 Z', PARCHMENT, { stroke: '#b9a47e', 'stroke-width': 0.6 }),
    path('M89.6 79.4 H97.6 M89 82 H97.2 M88.4 84.6 H94', 'none', { stroke: '#8a6a44', 'stroke-width': 0.7 }),
    path('M103 79.4 H110.6 M103 82 H111.2 M103 84.6 H108', 'none', { stroke: '#7c3aed', 'stroke-width': 0.8, class: 'p-screen-line' }),
    path(starPath(106.4, 80.2, 1.6), '#7c3aed', { 'fill-opacity': 0.5 }),
    path('M100 87.2 L101 94', 'none', { stroke: '#b91c1c', 'stroke-width': 1.3 }),
    ...[[96, 68, 2.4], [104, 63, 2], [109.6, 69.4, 1.8], [91, 62, 1.6]].map(([x, y, size]) => path(starPath(x, y, size), '#c4b5fd', { class: 'p-spark' })),
    rect(113, 69.6, 6, 4.6, '#1f1f2a', { rx: 1.2 }), path('M116 70 Q119 60 125.6 54.6 Q122.4 62 117.4 70.4 Z', '#f8fafc', { stroke: '#cbd5e1', 'stroke-width': 0.5 }),
    // A tall iron candlestand.
    path('M126 112 L131 106 L136 112 M131 106 V66', 'none', { stroke: IRON, 'stroke-width': 1.8, 'stroke-linecap': 'round' }),
    path('M126.6 66 H135.4 L134 63.6 H128 Z', IRON),
    rect(129.2, 51, 3.6, 12.8, '#fbf3dc', { rx: 0.8 }),
    path('M131 43.6 q-2.6 3.4 0 6.4 q2.6 -3 0 -6.4 Z', '#ffb02e', { class: 'flame' }),
    circle(131, 47.6, 7, '#ffd97a', { 'fill-opacity': 0.28, class: 'p-glow' }),
  ],
  // A cauldron bubbling over a log fire, a ladle, steam; jars of ingredients on a stool.
  cauldron: () => [
    path('M78 110 L112 103.6 L113.4 107.4 L79.4 113.6 Z', '#6b4426', { stroke: '#3e2614', 'stroke-width': 0.8 }),
    path('M80 104 L116 110 L114.6 113.6 L78.6 107.6 Z', '#7a5030', { stroke: '#3e2614', 'stroke-width': 0.8 }),
    path('M84 104 q2 -8 6 -11 q0.6 6 -1 11 Z M94 104 q2.4 -10 7 -13 q0.6 7 -2 13 Z M105 104 q2 -8 6 -10 q0.4 6 -1.6 10 Z', '#f97316', { class: 'flame' }),
    path('M88 104 q1.4 -5 4 -7 q0.4 4 -1 7 Z M99 104 q1.6 -6 4.6 -8 q0.4 4.6 -1.4 8 Z', '#fde047', { class: 'flame' }),
    path('M80 78 Q77.6 102 98 104 Q118.4 102 116 78 Z', '#2a2a30', { stroke: '#0f0f12', 'stroke-width': 1.2 }),
    path('M84 84 Q84 96 93 100', 'none', { stroke: '#52525b', 'stroke-width': 1.6, 'stroke-linecap': 'round' }),
    circle(78.6, 84, 2.6, 'none', { stroke: '#0f0f12', 'stroke-width': 1.4 }), circle(117.4, 84, 2.6, 'none', { stroke: '#0f0f12', 'stroke-width': 1.4 }),
    ellipse(98, 104, 20, 4, '#f97316', { 'fill-opacity': 0.45, class: 'p-glow' }),
    path('M81 104 q-1 -7 3 -11 q1 5 3.4 7 q0.4 -5 3 -7 q1 6 0 11 Z M115 104 q1 -7 -3 -11 q-1 5 -3.4 7 q-0.4 -5 -3 -7 q-1 6 0 11 Z', '#fb923c', { class: 'flame' }),
    path('M84 104 q0 -4 2 -6 q0.6 3 1.4 6 Z M112 104 q0 -4 -2 -6 q-0.6 3 -1.4 6 Z M96 104.6 q1 -3 2 -4.4 q1 1.4 2 4.4 Z', '#fde047', { class: 'flame' }),
    ellipse(98, 78, 19.6, 4.6, '#3f3f46', { stroke: '#0f0f12', 'stroke-width': 1 }),
    ellipse(98, 78.4, 16.4, 3.2, '#4ade80', { class: 'p-glow' }),
    ellipse(94, 77.6, 6, 1.2, '#bbf7d0', { 'fill-opacity': 0.8 }),
    ...[[91, 75.6, 2], [100, 74.6, 2.4], [106, 76, 1.6], [96, 72, 1.4]].map(([x, y, r]) => circle(x, y, r, '#86efac', { stroke: '#166534', 'stroke-width': 0.5, class: 'p-bubble' })),
    path('M90 68 q-3 -4 0 -8 q3 -4 0 -8 M100 66 q-3 -4 0 -8 q3 -4 0 -8 M108 69 q-2.4 -3 0 -6 q2.4 -3 0 -6', 'none', { stroke: '#d1fae5', 'stroke-width': 1.6, 'stroke-linecap': 'round', class: 'p-steam' }),
    line(104, 77, 117, 56, '#8a5a2e', 2.2), circle(117.6, 55, 1.8, '#6b4426'),
    // A stool with ingredients.
    rect(121, 92, 18, 3.4, WOOD, { rx: 1, stroke: WOOD_DARK, 'stroke-width': 0.8 }),
    path('M123 95.4 L122 112 M137 95.4 L138 112', 'none', { stroke: WOOD_DARK, 'stroke-width': 2 }),
    rect(122.4, 82, 6.4, 10, '#c4b5fd', { rx: 1.4, 'fill-opacity': 0.85, stroke: '#6d28d9', 'stroke-width': 0.6 }), rect(122, 80.4, 7.2, 2, '#9a6a3c', { rx: 0.5 }),
    circle(125.6, 87.6, 1.4, '#7c3aed'), circle(124.4, 85, 1, '#7c3aed'),
    path('M131 92 L132 84 H136.6 L137.6 92 Z', '#fca5a5', { 'fill-opacity': 0.85, stroke: '#b91c1c', 'stroke-width': 0.6 }), rect(132.6, 81.6, 3.4, 2.6, '#fee2e2'),
    path('M130 80 q-2 -6 2 -10 M133 80 q1 -7 5 -9 M131.6 80 q0 -6 -3 -9', 'none', { stroke: '#4d7c0f', 'stroke-width': 1.1, 'stroke-linecap': 'round' }),
  ],
};

export default Object.freeze({
  archetypes: { student, professor, potioneer, caretaker, ghost, owl },
  decor,
  stations,
});
