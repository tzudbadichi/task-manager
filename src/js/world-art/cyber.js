// Cyber: the people of a rainy neon megacity - street hackers in neon-trimmed hoodies and visors, cyborgs
// with chrome arms, sleek androids with glowing seams, street samurai with neon-edged blades, couriers with
// helmets and delivery boxes, and neon idols in big headphones - and the city's furniture: a neon sliding
// door, a data rack, a neon bench, a glowing floor pad, a noodle stall, an energy-drink machine, a neon
// bonsai and a holographic plant. Original designs for this app: the feel of the genre, no characters,
// brands or designs from books, games or films.
// Coordinates: figure-kit.js (characters), world-layout.js ART (furniture), viewBox 68 20 72 96 (stations).

import { circle, darker, ellipse, lighter, line, path, rect, svg } from '../svg-kit.js';
import {
  HAIR, arm, belt, blob, box, dot, headBase, leg, limb, longGarmentPath, nose, pick, pickWeighted, rngOf, shade,
  shape, stroke, torsoPath,
} from '../figure-kit.js';

const TOON_EYES = Object.freeze({ anchors: [[43, 41], [52, 41]], style: 'toon' });
const PINK = '#ff3fa4';
const CYAN = '#22e3f5';
const YELLOW = '#ffd23f';
const LIME = '#a3f54a';
const PURPLE = '#b46bff';
const ORANGE = '#ff8a3d';
const NEONS = [PINK, CYAN, YELLOW, LIME, PURPLE, ORANGE];
const CHROME = '#c3ccd6';
const BLACK = '#1c1b2e';

const HUMAN_SKINS = ['#f6d7bd', '#efc8a6', '#e2b38c', '#d29f74', '#b9845a', '#8f5f3c', '#6e4630'];
const DARK_HAIR = ['#1f1a17', '#2b1d14', '#3d2a1c', '#4a4a55', '#e5e7eb'];
const NEON_HAIR = ['#ff3fa4', '#22e3f5', '#a3f54a', '#b46bff', '#ffd23f', '#f8fafc'];
const HOLO_HAIR = ['#f9a8d4', '#67e8f9', '#c4b5fd', '#86efac', '#f1f5f9', '#fda4af'];

const FRONT_FOOT = [54, 111];
const BACK_FOOT = [41.5, 111];

/** A thick colored sole under a boot (in the leg group). */
const sole = ([fx, fy], color, height = 2.6) => box(fx - 5.8, fy + 0.4, 12.8, height, color, { rx: 1 });

// ---------------------------------------------------------------------------
// Things held in the back hand (at about (34,83); they swing with the arm)
// ---------------------------------------------------------------------------

const HELD = {
  deck: trim => svg('g', { transform: 'rotate(-10 30 84)' },
    box(17.6, 78.6, 19, 12, '#2a2550', { rx: 1.8 }), box(19.6, 80.2, 9, 6.4, CYAN, { 'stroke-width': 0.4, class: 'p-glow' }),
    stroke('M21 82 H27 M21 84.4 H25.4', '#0b1020', 0.7), stroke('M30.4 81 H35 M30.4 83.4 H35 M30.4 85.8 H35', '#64748b', 1.1),
    stroke('M17.6 89.6 H36.6', trim, 1)),
  cable: trim => [stroke('M34 84 q-6 2 -4 6 q2 4 -4 6 q-6 2 -3 7', '#334155', 1.6), box(20.6, 101.6, 5.4, 6.4, '#4b5563', { rx: 1 }),
    box(21.8, 107.6, 3, 2.4, trim, { class: 'p-glow' })],
  can: trim => [box(29.4, 76.6, 8, 12.4, '#111827', { rx: 1.6 }), box(29.4, 80, 8, 4.6, trim, { 'stroke-width': 0.4 }),
    stroke('M31 77.4 H35.8', '#64748b', 0.8), path('M31.6 82.3 l1.6 -1.6 l1.4 1.6 l1.6 -1.6', 'none', { stroke: '#111827', 'stroke-width': 0.8 })],
  chip: () => [box(27.4, 78, 10, 7, '#14532d', { rx: 1 }), stroke('M28.6 85 v2 M31 85 v2 M33.4 85 v2 M35.8 85 v2', CHROME, 0.8),
    box(29.6, 79.6, 5.6, 3.8, '#111827', { 'stroke-width': 0.3 }), dot(36, 79.4, 0.7, LIME, { class: 'p-glow' })],
  katana: trim => [
    shape('M35.8 79.6 Q28.6 61 22.6 39.4 L19.6 36.2 L20 41.2 Q25.6 61.8 33.4 80.8 Z', '#eef2f7'),
    stroke('M33.4 80.4 Q25.6 61.6 20.2 40.6', trim, 1.6, { class: 'p-glow' }), stroke('M34.6 78 Q28 61.6 22.8 42', '#ffffff', 0.6),
    blob(34.4, 81.8, 4, 1.6, '#111827', { transform: 'rotate(-18 34.4 81.8)' }),
    limb(34.8, 83, 37.2, 91, 2.4, '#2a2550'), stroke('M35.2 85 l1.4 0.8 M35.8 87.4 l1.4 0.8 M36.4 89.8 l1.2 0.6', trim, 0.7)],
  parcel: () => [box(19, 78, 16, 13, '#c89a5a', { rx: 1 }), stroke('M27 78 V91 M19 84.4 H35', '#e8d6a8', 1.6), box(21, 80, 4.6, 3, '#f8fafc', { 'stroke-width': 0.3 })],
  scanner: trim => [box(28.6, 75.6, 7.6, 12.6, '#111827', { rx: 1.6 }), box(29.8, 77, 5.2, 7, trim, { 'stroke-width': 0.3, class: 'p-glow' }),
    stroke('M30.6 79 H34.2 M30.6 81 H33.2', '#0b1020', 0.6)],
  lightstick: trim => [limb(34, 85, 33.4, 90, 2.6, '#1f2937'), limb(34.2, 84, 36.4, 64, 3.2, trim), stroke('M34.6 82 L36.6 64', '#ffffff', 1, { 'stroke-opacity': 0.75 }),
    path('M36.4 64 L35 59 L38.6 61 Z', trim, { class: 'p-glow' })],
  mic: trim => [limb(34, 86, 32, 74, 2.8, '#1f2937'), circle(31.6, 71.4, 3.6, '#4b5563', { stroke: '#111827', 'stroke-width': 0.8 }),
    stroke('M29 70.6 H34.2 M29 72.4 H34.2', '#9ca3af', 0.6), stroke('M31 76.6 l2.4 0.4', trim, 1.6, { class: 'p-glow' })],
};

// ---------------------------------------------------------------------------
// Archetypes (looks: figure-kit.js composeFigure)
// ---------------------------------------------------------------------------

/** A street hacker: a hoodie in the category color with neon trim, a mohawk or shaved head, a visor, a deck. */
function hacker(look) {
  const random = rngOf(look);
  const skin = pick(HUMAN_SKINS, random);
  const hairColor = random() < 0.7 ? pick(NEON_HAIR, random) : pick(DARK_HAIR, random);
  const trim = pick(NEONS, random);
  const style = pickWeighted([['mohawk', 50], ['bangs', 25], ['buzz', 25]], random);
  const visor = random() < 0.6 ? pick([CYAN, PINK, LIME, PURPLE], random) : null;
  const held = pickWeighted([['deck', 45], ['cable', 30], [null, 25]], random);
  const legs = { trousers: BLACK, feet: 'boot', shoes: '#0f0e1a', width: 7 };
  const sleeves = { sleeve: 'cat', hand: skin, cuff: trim, width: 6.4 };
  const bangs = style === 'bangs' ? HAIR.shaggy(hairColor) : null;
  const scalp = shade('M31 40 A15 15 0 0 1 61 38 Q55 31 46 31 Q37 31 31 40 Z', darker(hairColor, 0.4), 0.35);
  return {
    shadowWidth: 17,
    legBack: [leg('back', legs), sole(BACK_FOOT, trim, 1.8), stroke('M38.4 96 H43', '#4b5563', 1.6)],
    legFront: [leg('front', legs), sole(FRONT_FOOT, trim, 1.8), stroke('M49.4 96 H54.4', '#4b5563', 1.6)],
    armBack: arm('back', sleeves),
    armFront: arm('front', sleeves),
    torso: [
      shape(torsoPath('regular', { bottom: 94 }), 'cat'),
      shade('M50 56 L56 57 L58 66 L58.6 93 Q54 94.6 50 94.6 Z', '#000000', 0.12),
      stroke('M46.6 58 V93', trim, 1.2),
      stroke('M35.2 91.4 Q46 94 57.6 91.4', trim, 1.8),
      shade('M37 80 Q46 78 55 80 L56.6 90 H35.4 Z', '#000000', 0.12),
      stroke('M36.4 64 L42 70 M56 64 L51 70', trim, 1),
    ],
    overTorso: [shape('M33.6 58.4 Q31.4 51 36.6 48.6 Q46 53.4 55.4 48.6 Q60.6 51 58.4 58.4 Q46 62.4 33.6 58.4 Z', 'cat-dark'),
      stroke('M34 57.6 Q46 61.6 58 57.6', trim, 1.2)],
    held: held && HELD[held](trim),
    headScale: 1.03,
    head: {
      back: bangs?.back ?? null,
      base: headBase(skin),
      features: [nose(skin), style !== 'bangs' && scalp, dot(31.4, 45, 0.9, CHROME), dot(31.8, 47.4, 0.8, CHROME)],
      eyes: TOON_EYES,
      brows: darker(style === 'bangs' ? hairColor : skin, 0.45),
      mouth: { anchor: [47.5, 47.8] },
      front: style === 'mohawk'
        ? shape('M57 30 L61.6 21.4 L53.4 25.4 L55.6 14.6 L48 22 L46.6 9.6 L41.6 20.6 L36.4 13 L36 23.6 L29.6 20.4 L32.4 31.4 Q44 23 57 30 Z', hairColor)
        : bangs?.front ?? null,
      eyewear: visor && [
        shape('M36.4 37.6 H59.4 Q61.2 37.8 61 40.2 L60.6 43.8 Q60.2 45.4 58.2 45.2 H38.2 Q36.4 45 36.4 43.4 Z', visor, { 'fill-opacity': 0.42 }),
        stroke('M37.2 38.4 H59.6', lighter(visor, 0.5), 1), stroke('M36.4 40.6 L31.4 40.2', '#111827', 1.6),
      ],
    },
  };
}

/** A cyborg: a biker jacket in the category color, one chrome arm with a glowing joint, a cyber eye and implants. */
function cyborg(look) {
  const random = rngOf(look);
  const skin = pick(HUMAN_SKINS, random);
  const hairColor = random() < 0.35 ? pick(NEON_HAIR, random) : pick(DARK_HAIR, random);
  const hair = HAIR[pick(['shortCrop', 'shaggy', 'bald', 'topKnot'], random)](hairColor);
  const eyeGlow = pick(['#ef4444', CYAN, LIME, YELLOW], random);
  const held = pickWeighted([['can', 35], ['chip', 25], [null, 40]], random);
  const legs = { trousers: pick([BLACK, '#2a2f45', '#3b3346'], random), feet: 'tallboot', shoes: '#0f0e1a', width: 7.2 };
  const chromeArm = [
    limb(55, 62, 56.6, 72, 6.8, CHROME), limb(56.6, 72, 57.8, 80.6, 6, CHROME),
    stroke('M53.4 63.6 L54.6 70 M55.2 74.6 L56.2 79.6', '#ffffff', 1.1, { 'stroke-opacity': 0.8 }),
    stroke('M54.2 76.4 L60 76', '#6b7785', 0.8),
    dot(56.6, 72, 2.6, '#6b7785'), dot(56.6, 72, 1.1, eyeGlow, { class: 'p-glow' }),
    dot(58, 83.2, 3.9, '#9aa5b1'), stroke('M56.4 81.6 l1.8 3.4 M58.4 81 l1.4 3.6', '#6b7785', 0.7),
    shape('M50.4 57.4 Q56 54.4 60.8 58.4 L60.2 64.8 Q55.6 66.4 51.4 63.8 Z', CHROME), stroke('M51.6 59.4 Q56 57.4 59.6 60.2', '#ffffff', 0.9),
    dot(55.6, 61.4, 0.8, '#6b7785'),
  ];
  return {
    shadowWidth: 18,
    legBack: leg('back', legs),
    legFront: leg('front', legs),
    armBack: arm('back', { sleeve: 'cat', hand: skin, cuff: 'cat-dark', width: 6.6 }),
    armFront: chromeArm,
    torso: [
      shape(torsoPath('regular', { bottom: 92 }), 'cat'),
      shade('M50 56 L56 57 L58 66 L58.6 91 Q54 92.6 50 92.6 Z', '#000000', 0.12),
      shape('M41.6 55.4 L46 61.6 L50.4 55.4 Q46 54 41.6 55.4 Z', '#111827'),
      shape('M37.6 54.4 L42 53.6 L45 62 L40.6 65 Z', 'cat-dark'), shape('M54.4 54.4 L50 53.6 L48.4 60 L52.4 63 Z', 'cat-dark'),
      stroke('M44.6 61 L51.4 91', '#d1d5db', 1.3),
      stroke('M35.4 66 Q38 68 41.4 66.6', 'cat-dark', 1), box(35, 84.6, 7, 4, 'cat-dark', { rx: 1 }),
      belt('regular', 87.4, '#111827', CHROME),
    ],
    held: held && HELD[held](pick(NEONS, random)),
    headScale: 1,
    head: {
      back: hair.back,
      base: headBase(skin),
      features: [nose(skin), stroke('M56.4 32.6 H59.6 L61 35 M57.4 35.6 H60.4', CYAN, 0.8), dot(56.4, 32.6, 0.8, CYAN), dot(57.4, 35.6, 0.7, CYAN)],
      eyes: TOON_EYES,
      brows: darker(hairColor === '#e5e7eb' ? '#6b7280' : hairColor, 0.15),
      beforeMouth: shade('M50.6 50.4 Q55 50.6 57.6 47 L58.6 49 Q56.4 53.4 51 53 Z', '#64748b', 0.35),
      mouth: { anchor: [47.5, 47.8] },
      front: hair.front,
      eyewear: [circle(52, 41, 3.8, 'none', { stroke: '#6b7785', 'stroke-width': 1.6 }), path('M55.4 39 L59.4 37.8 L59.6 40.4 L55.8 41.6 Z', '#6b7785'),
        circle(58.4, 39.2, 1.1, eyeGlow, { class: 'p-glow' })],
    },
  };
}

/** An android: a sleek pale shell with category-color plates, glowing seams, a dark face screen with LED eyes. */
function android(look) {
  const random = rngOf(look);
  const shell = pick(['#eef2f7', '#e4e9f1', '#cfd6df', '#f5f0f6'], random);
  const joint = darker(shell, 0.35);
  const antenna = random() < 0.4;
  const legs = { trousers: shell, feet: 'boot', shoes: darker(shell, 0.4), width: 6.2 };
  const androidArm = ([sx, sy], [ex, ey], [wx, wy], [hx, hy]) => [
    limb(sx, sy, ex, ey, 5.4, shell), limb(ex, ey, wx, wy, 6, 'cat'), dot(ex, ey, 2.2, joint), dot(hx, hy, 3.3, shell),
  ];
  return {
    shadowWidth: 16,
    legBack: [leg('back', legs), limb(41, 89.4, 40.8, 96.6, 3, 'cat'), dot(40.6, 99, 1.8, joint)],
    legFront: [leg('front', legs), limb(51, 89.4, 51.4, 96.6, 3, 'cat'), dot(51.6, 99, 1.8, joint)],
    armBack: androidArm([37, 62], [35.5, 72], [34.3, 80.5], [34, 83]),
    armFront: androidArm([55, 62], [56.5, 72], [57.7, 80.5], [58, 83]),
    torso: [
      shape(torsoPath('slim', { bottom: 90 }), shell),
      shape('M38.6 57.6 Q46 54.6 53.4 57.6 L52.4 72 Q46 75.4 39.6 72 Z', 'cat'),
      stroke('M40.6 77 Q46 79 51.4 77 M40.8 81 Q46 83 51.2 81', joint, 0.8),
      shape('M38.2 84 H53.8 L52.8 91 H39.2 Z', 'cat-dark'),
      dot(46, 64, 2.6, '#e0fbff', { class: 'p-glow' }), circle(46, 64, 4.2, 'none', { stroke: '#e0fbff', 'stroke-width': 0.6, 'stroke-opacity': 0.7 }),
      path(torsoPath('slim', { bottom: 90 }), 'none', { class: 'p-torso-glow', 'stroke-width': 1.3 }),
    ],
    headScale: 1,
    head: {
      back: antenna ? [stroke('M40 27 L36 15', joint, 1.2), dot(36, 14.4, 1.6, PINK, { class: 'p-antenna' })] : null,
      base: [dot(46, 40, 15, shell), dot(32.2, 42, 3.6, darker(shell, 0.08)), circle(32.2, 42, 2, 'none', { class: 'p-torso-glow', 'stroke-width': 0.9 })],
      features: [blob(49.4, 42.6, 10.8, 8.6, '#141a2e'), stroke('M40.6 37 Q49.4 33 58.4 37', '#ffffff', 0.7, { 'stroke-opacity': 0.25 }),
        stroke('M34 32.6 Q46 25 58.6 31.4', darker(shell, 0.18), 0.8)],
      eyes: { anchors: [[45.6, 40.6], [53.4, 40.6]], style: 'led' },
      brows: null,
      mouth: { anchor: [49.5, 45.6], color: '#38bdf8', width: 0.66 },
    },
  };
}

/** A street samurai: a long coat in the category color with a high collar, a sash, a shoulder plate, a neon-edged blade. */
function samurai(look) {
  const random = rngOf(look);
  const skin = pick(HUMAN_SKINS, random);
  const hairColor = random() < 0.3 ? pick(NEON_HAIR, random) : pick(DARK_HAIR, random);
  const hair = HAIR[pick(['topKnot', 'longStraight', 'topKnot', 'shortCrop'], random)](hairColor);
  const trim = pick(NEONS, random);
  const drawn = random() < 0.62;
  const visor = random() < 0.35;
  const legs = { trousers: '#1f1d33', feet: 'tallboot', shoes: '#0f0e1a', width: 7.4 };
  const sleeves = { sleeve: 'cat', hand: skin, cuff: '#111827', width: 6.6 };
  return {
    shadowWidth: 18,
    behind: drawn ? null : [limb(17, 66, 50, 94, 3.6, '#111827'), stroke('M18 67 L49 93.4', trim, 0.9), limb(14, 63.6, 18, 66.6, 3, '#2a2550')],
    legBack: leg('back', legs),
    legFront: leg('front', legs),
    armBack: arm('back', sleeves),
    armFront: [arm('front', sleeves),
      shape('M50 56.4 Q56.6 52.6 62 57.6 L61.4 66 Q56 67.6 51.2 64.6 Z', '#2a2f45'), stroke('M51.2 64.4 Q56 67.2 61.4 65.8', trim, 1.1),
      stroke('M51.6 58.6 Q56.4 56 60.4 59.6 M51.4 61.6 Q56.4 59.6 61 62.6', '#4b5563', 0.8)],
    torso: [
      shape(longGarmentPath('regular', { hem: 106, flare: 6 }), 'cat'),
      shade('M50 57 L56.6 63 L64 106 Q57 108.4 50.4 108 Z', '#000000', 0.12),
      shape('M40.4 55.6 L52.6 76 L46 77 Z', 'cat-dark'),
      stroke('M40.4 55.6 L52.6 76', '#111827', 1),
      box(32.4, 76, 27.2, 6.6, '#111827', { rx: 1.4 }), stroke('M32.6 79.3 H59.4', trim, 1.1),
      shape('M48 82 L52 82 L54 90 L50 88 Z', '#111827'),
      stroke('M46.2 88 V106.6', 'cat-dark', 1.1),
      box(39.4, 50.6, 13.2, 7, 'cat-dark', { rx: 2.2 }), stroke('M39.8 57 H52.2', trim, 0.9),
    ],
    held: drawn ? HELD.katana(trim) : null,
    headScale: 1,
    head: {
      back: hair.back,
      base: headBase(skin),
      features: [nose(skin), stroke('M54 46.6 l2.6 -1.2', darker(skin, 0.3), 0.7)],
      eyes: TOON_EYES,
      brows: darker(hairColor, 0.2),
      mouth: { anchor: [47.5, 47.8] },
      front: hair.front,
      eyewear: visor && [box(37.4, 38.6, 22.4, 3.4, '#ef4444', { rx: 1.4, 'fill-opacity': 0.55, class: 'p-glow' }), stroke('M37.4 40.2 L31.6 40', '#111827', 1.4)],
    },
  };
}

/** A courier: a helmet with the visor up, a reflective jacket in the category color, a glowing delivery box on the back. */
function courier(look) {
  const random = rngOf(look);
  const skin = pick(HUMAN_SKINS, random);
  const hairColor = pick([...DARK_HAIR, ...NEON_HAIR], random);
  const helmet = pick(['#facc15', '#22e3f5', '#ff3fa4', '#a3f54a', '#f97316', '#e5e7eb'], random);
  const glow = pick(NEONS, random);
  const ponytail = random() < 0.35;
  const held = pickWeighted([['parcel', 40], ['scanner', 35], [null, 25]], random);
  const shorts = random() < 0.35;
  const legs = shorts
    ? { trousers: '#1f2937', length: 'short', lower: '#111827', skin, feet: 'shoe', shoes: '#f8fafc', width: 7 }
    : { trousers: '#1f2937', feet: 'shoe', shoes: '#f8fafc', width: 7 };
  const sleeves = { sleeve: 'cat', hand: skin, cuff: '#e5e7eb', width: 6.6 };
  const kneePad = ([x, y]) => box(x - 3.6, y - 2.8, 7.2, 5.8, '#374151', { rx: 2 });
  return {
    shadowWidth: 18,
    behind: [
      box(14.6, 49, 24, 32, '#262b45', { rx: 3 }), stroke('M14.6 56 H38.6', '#3b4266', 1),
      box(14.6, 66, 24, 3.2, glow, { 'stroke-width': 0.4, class: 'p-glow' }),
      path('M21.6 74 H31.6 Q31 79.4 26.6 79.4 Q22.2 79.4 21.6 74 Z M24.6 73 L27.4 70 M27.6 73.6 L30.6 70.6', 'none', { stroke: glow, 'stroke-width': 1, 'stroke-linejoin': 'round' }),
    ],
    legBack: [leg('back', legs), kneePad([40.6, 99])],
    legFront: [leg('front', legs), kneePad([51.6, 99])],
    armBack: arm('back', sleeves),
    armFront: arm('front', sleeves),
    torso: [
      shape(torsoPath('regular', { bottom: 92 }), 'cat'),
      shade('M50 56 L56 57 L58 66 L58.6 91 Q54 92.6 50 92.6 Z', '#000000', 0.12),
      box(34, 69, 24, 3.4, '#e5e7eb', { 'stroke-width': 0.5 }), box(34.2, 79, 23.6, 3.4, '#e5e7eb', { 'stroke-width': 0.5 }),
      stroke('M46 57 V91', 'cat-dark', 1.2),
      box(39.4, 51.4, 13.2, 6.4, 'cat-dark', { rx: 2.4 }),
    ],
    overTorso: [stroke('M38 57 Q36.4 70 38.6 88', '#111827', 2.2), box(35.6, 66.4, 5.2, 3.6, '#4b5563', { rx: 0.8 })],
    held: held && HELD[held](glow),
    headScale: 1.02,
    head: {
      back: ponytail ? stroke('M31 44 Q25.6 52 27.6 60.6', hairColor, 4.2) : null,
      base: headBase(skin),
      features: nose(skin),
      eyes: TOON_EYES,
      brows: darker(hairColor, 0.2),
      mouth: { anchor: [47.5, 47.8] },
      front: [shape('M33 41 Q33.4 33 41 31.6 L44 36 Q38 36.4 35.6 42 Z', hairColor), stroke('M35 45 Q35.6 51 39.4 54.4', '#111827', 1)],
      hat: [
        shape('M29.4 45 Q27.6 22.6 46 21.2 Q63.6 22 62.6 37.4 L60.6 38 Q58.4 32 50 30.8 Q40 30.6 36 37 L35 46.4 Q31.4 48 29.4 45 Z', helmet),
        stroke('M33 40 Q34.6 26 47 24 Q55 23.6 59.6 28', darker(helmet, 0.25), 1.6),
        shape('M41 31.4 Q52.6 26.2 63.6 32.6 L63.2 36.6 Q52.4 30.8 41.6 34.6 Z', '#1e293b', { 'fill-opacity': 0.75 }),
        stroke('M44 31 Q53 27.6 61.6 31.6', '#ffffff', 0.8, { 'stroke-opacity': 0.6 }),
        dot(31.6, 41.6, 1.4, darker(helmet, 0.35)),
      ],
    },
  };
}

/** A neon idol: big headphones (some with cat ears), holographic twin tails, a glowing jacket in the category color, platform boots. */
function idol(look) {
  const random = rngOf(look);
  const skin = pick(HUMAN_SKINS, random);
  const hairColor = pick(HOLO_HAIR, random);
  const tails = random() < 0.62;
  const trim = pick(NEONS, random);
  const catEars = random() < 0.5;
  const held = pickWeighted([['lightstick', 50], ['mic', 35], [null, 15]], random);
  const skirtColor = pick(['#111827', '#2a2550', '#3b0d2e'], random);
  const legs = { trousers: '#1f1d33', feet: 'tallboot', shoes: '#111827', width: 5.8 };
  const sleeves = { style: 'puffy', sleeve: 'cat', hand: skin, width: 5.8 };
  return {
    shadowWidth: 16,
    legBack: [leg('back', legs), sole(BACK_FOOT, trim, 3.4)],
    legFront: [leg('front', legs), sole(FRONT_FOOT, trim, 3.4)],
    armBack: arm('back', sleeves),
    armFront: arm('front', sleeves),
    torso: [
      shape(torsoPath('slim', { bottom: 90 }), '#111827'),
      shape('M36.4 84 H55.6 L60 97 Q46 100 32 97 Z', skirtColor), stroke('M40 85 L38 97.6 M46 85 V98.6 M52 85 L54 97.6', lighter(skirtColor, 0.2), 0.8),
      stroke('M32.6 96.6 Q46 99.6 59.4 96.6', trim, 1.2),
      path('M46 63 l1.4 2.8 l3 0.4 l-2.2 2 l0.6 3 l-2.8 -1.4 l-2.8 1.4 l0.6 -3 l-2.2 -2 l3 -0.4 Z', trim, { class: 'p-glow' }),
      shape('M35.6 57.4 Q38.6 55 42 55.6 L43.6 76 Q39.6 77.4 35.6 76 Q34.4 66 35.6 57.4 Z', 'cat'),
      shape('M56.4 57.4 Q53.4 55 50 55.6 L48.4 76 Q52.4 77.4 56.4 76 Q57.6 66 56.4 57.4 Z', 'cat'),
      path('M35.6 57.4 Q38.6 55 42 55.6 L43.6 76 Q39.6 77.4 35.6 76 Q34.4 66 35.6 57.4 Z M56.4 57.4 Q53.4 55 50 55.6 L48.4 76 Q52.4 77.4 56.4 76 Q57.6 66 56.4 57.4 Z',
        'none', { class: 'p-torso-glow', 'stroke-width': 1.2 }),
      stroke('M35.8 75.6 Q39.6 76.8 43.4 75.6 M48.6 75.6 Q52.4 76.8 56.2 75.6', trim, 1.2),
    ],
    held: held && HELD[held](trim),
    headScale: 1.08,
    head: {
      back: tails
        ? [shape('M32 30 Q18 34 18.6 52 Q19 62 24 68 Q24 56 28.4 48 Q31 42 34.6 37 Z', hairColor), shape('M58 28 Q72 30 72.6 48 Q72.6 60 67.6 66 Q68 54 63.6 46 Q61 40 57.6 36 Z', hairColor),
          stroke('M24 44 Q22 54 23.6 62 M68 42 Q70 52 68.4 60', darker(hairColor, 0.15), 0.8)]
        : shape('M30.6 39 Q30 24 46 23 Q62 24 61.4 39 L62 50 Q57 52 54 48 L38 48 Q35 52 30 50 Z', hairColor),
      base: headBase(skin),
      features: nose(skin, 0.85),
      eyes: TOON_EYES,
      brows: darker(hairColor, 0.35),
      mouth: { anchor: [47.5, 47.6] },
      cheeks: '#f9a8d4',
      front: [
        shape('M31 41 Q30 24.6 46 24 Q61 24.6 61.4 37.6 L58 33.6 L55.6 37.6 L52 32.6 L49 37.6 L45.6 32.6 L42.6 37.6 L39.4 33 L36.6 37.6 Q33.4 39.4 33.4 45 Z', hairColor),
        catEars && [shape('M36.6 26.4 L37.4 15.6 L44 22.4 Z', '#1f2937'), shape('M38.4 23.4 L38.8 18.6 L41.8 21.8 Z', trim),
          shape('M49.6 21.8 L56.4 15.4 L57 26.2 Z', '#1f2937'), shape('M52 21.6 L55.4 18.4 L55.6 23.2 Z', trim)],
        stroke('M32.4 37.4 Q32 21.2 46 20.6 Q60 21 60.6 35.4', '#1f2937', 2.8),
        box(27.2, 35.4, 9, 12.6, '#1f2937', { rx: 3.6 }), circle(31.7, 41.7, 3, 'none', { stroke: trim, 'stroke-width': 1.3, class: 'p-glow' }),
      ],
    },
  };
}

// ---------------------------------------------------------------------------
// Furniture (world-layout.js ART sizes)
// ---------------------------------------------------------------------------

const decor = {
  // A neon sliding door: two steel panels, a glowing frame and slit, a palm scanner, hazard stripes.
  door: () => [
    rect(0, 6, 50, 86, '#1b1838', { rx: 2, stroke: '#0b0a1c', 'stroke-width': 1.2 }),
    rect(1, 7, 48, 4, CYAN, { rx: 1.6, class: 'p-glow' }),
    rect(5, 15, 36, 74, '#0d0b1e'),
    rect(6, 16, 16.6, 72, '#2c2856', { stroke: '#46407e', 'stroke-width': 0.8 }),
    rect(23.4, 16, 16.6, 72, '#2c2856', { stroke: '#46407e', 'stroke-width': 0.8 }),
    path('M8 28 H20.6 M25.4 28 H38 M8 64 H20.6 M25.4 64 H38', 'none', { stroke: '#3a3570', 'stroke-width': 1.4 }),
    path('M8 46 L20.6 40 M25.4 40 L38 46', 'none', { stroke: '#3a3570', 'stroke-width': 1 }),
    rect(22.4, 16, 1.2, 72, PINK, { class: 'p-glow' }),
    rect(4, 14, 38, 76, 'none', { stroke: PINK, 'stroke-width': 1.4, 'stroke-opacity': 0.9 }),
    rect(42.6, 40, 5.6, 9, '#0b0a1c', { rx: 1, stroke: '#46407e', 'stroke-width': 0.6 }),
    rect(43.6, 41.4, 3.6, 5, LIME, { 'fill-opacity': 0.7, class: 'p-blink-dot' }),
    circle(45.4, 30, 1.4, '#ef4444', { class: 'p-blink-led' }),
    ...[0, 1, 2, 3, 4, 5, 6].map(index => path(`M${2 + index * 7} 92 L${6 + index * 7} 88 H${9.4 + index * 7} L${5.4 + index * 7} 92 Z`, YELLOW)),
    rect(0, 88, 50, 4, 'none', { stroke: '#0b0a1c', 'stroke-width': 0.6 }),
  ],
  // A data rack: blinking units, a glowing coolant tube and a chunky monitor on top.
  shelf: () => [
    rect(6, 20, 52, 72, '#141230', { rx: 2, stroke: '#3a3570', 'stroke-width': 1.2 }),
    rect(10, 24, 36, 64, '#0b0a1c'),
    ...[26, 36, 46, 56, 66, 76].flatMap((y, index) => [
      rect(11, y, 34, 8, '#211d44', { rx: 1, stroke: '#0b0a1c', 'stroke-width': 0.8 }),
      path(`M14 ${y + 2.6} H26 M14 ${y + 4.4} H26 M14 ${y + 6.2} H26`, 'none', { stroke: '#0f0d24', 'stroke-width': 0.8 }),
      circle(31, y + 4, 1.3, index % 2 ? PINK : CYAN, { class: index % 2 ? 'p-blink-led' : 'p-blink-dot' }),
      circle(35.4, y + 4, 1.3, index % 3 ? CYAN : LIME, { class: index % 2 ? 'p-blink-dot' : 'p-blink-led' }),
      rect(39, y + 2.6, 4, 2.8, PURPLE, { rx: 0.5, 'fill-opacity': 0.8 }),
    ]),
    rect(48, 24, 6, 64, '#0b0a1c', { rx: 3, stroke: '#3a3570', 'stroke-width': 0.8 }),
    rect(49.4, 30, 3.2, 54, PURPLE, { rx: 1.6, 'fill-opacity': 0.9, class: 'p-glow' }),
    circle(51, 40, 0.9, '#f5e8ff', { class: 'cooler-bubble' }), circle(51, 60, 0.8, '#f5e8ff', { class: 'cooler-bubble cooler-bubble-2' }),
    rect(10, 2, 34, 18, '#2a2550', { rx: 2.4, stroke: '#0b0a1c', 'stroke-width': 1 }),
    rect(13, 4.6, 28, 12.6, '#062a2e', { rx: 1.6 }),
    path('M15 11 L19 11 L21 7 L24 15 L27 9 L29 12 L39 12', 'none', { stroke: LIME, 'stroke-width': 1 }),
    path('M13 7.6 H41 M13 10.6 H41 M13 13.6 H41', 'none', { stroke: '#000000', 'stroke-opacity': 0.25, 'stroke-width': 0.6 }),
    path('M44 30 Q58 40 54 60 M44 52 Q62 64 58 92', 'none', { stroke: PINK, 'stroke-width': 1.3, 'stroke-opacity': 0.85 }),
    rect(8, 89, 10, 3, '#3a3570'), rect(46, 89, 10, 3, '#3a3570'),
  ],
  // A neon bench: a padded seat on a chrome frame, a glowing tube along the backrest, underglow.
  sofa: () => [
    ellipse(75, 60, 66, 4.6, CYAN, { 'fill-opacity': 0.35, class: 'p-glow' }),
    rect(12, 6, 126, 24, '#241f4a', { rx: 6, stroke: '#0b0a1c', 'stroke-width': 1.2 }),
    path('M20 14 H130 M20 22 H130', 'none', { stroke: '#2f2960', 'stroke-width': 3 }),
    rect(14, 4, 122, 3.6, PINK, { rx: 1.8, class: 'p-glow' }),
    rect(6, 29, 138, 14, '#3a2f74', { rx: 6, stroke: '#0b0a1c', 'stroke-width': 1.2 }),
    path('M14 31 H136', 'none', { stroke: '#5a4fa8', 'stroke-width': 1.6, 'stroke-linecap': 'round' }),
    path('M54 30 V42 M96 30 V42', 'none', { stroke: '#241f4a', 'stroke-width': 1.2 }),
    rect(8, 43, 134, 5, CHROME, { rx: 2, stroke: '#6b7785', 'stroke-width': 0.8 }),
    path('M18 48 L14 62 M132 48 L136 62 M75 48 V62', 'none', { stroke: CHROME, 'stroke-width': 3, 'stroke-linecap': 'round' }),
    path('M10 46 H140', 'none', { stroke: CYAN, 'stroke-width': 1.2, 'stroke-opacity': 0.9 }),
    rect(0, 22, 10, 24, '#241f4a', { rx: 3, stroke: '#0b0a1c', 'stroke-width': 1 }), rect(140, 22, 10, 24, '#241f4a', { rx: 3, stroke: '#0b0a1c', 'stroke-width': 1 }),
    rect(2, 24, 2, 18, CYAN, { rx: 1, 'fill-opacity': 0.8 }), rect(146, 24, 2, 18, CYAN, { rx: 1, 'fill-opacity': 0.8 }),
  ],
  // A glowing floor pad: neon rings and a hex grid.
  rug: () => [svg('g', { transform: 'translate(100 20) scale(1 0.2)' },
    circle(0, 0, 98, '#141233', { stroke: '#3a3570', 'stroke-width': 3 }),
    circle(0, 0, 90, 'none', { stroke: CYAN, 'stroke-width': 4, class: 'p-glow' }),
    circle(0, 0, 66, 'none', { stroke: PINK, 'stroke-width': 3, 'stroke-opacity': 0.85 }),
    ...[0, 30, 60, 90, 120, 150].map(degrees => line(-88, 0, 88, 0, '#3a3570', 1.6, { transform: `rotate(${degrees})` })),
    circle(0, 0, 40, 'none', { stroke: '#5a4fa8', 'stroke-width': 2 }),
    circle(0, 0, 18, CYAN, { 'fill-opacity': 0.35, class: 'p-glow' }), circle(0, 0, 8, '#e0fbff'))],
  // A noodle stall: an awning with hanging cloth, a red lantern, a steaming bowl with chopsticks on the counter.
  coffee: () => [
    rect(4, 22, 3, 70, '#2a2550'), rect(49, 22, 3, 70, '#2a2550'),
    path('M0 14 L6 6 H50 L56 14 Z', '#c2185b', { stroke: '#7a0f3a', 'stroke-width': 1 }),
    path('M0 14 H56', 'none', { stroke: '#ff8fd6', 'stroke-width': 1.4 }),
    ...[8, 19, 30, 41].map(x => path(`M${x} 14 H${x + 9} V28 Q${x + 4.5} 30 ${x} 28 Z`, '#3a1030', { stroke: '#1f0a1c', 'stroke-width': 0.6 })),
    ...[8, 19, 30, 41].map(x => circle(x + 4.5, 21, 1.8, 'none', { stroke: '#f5e1ea', 'stroke-width': 0.8 })),
    line(44, 14, 44, 30, '#1a1030', 0.8),
    ellipse(44, 36, 5, 6.4, '#ff4f6e', { stroke: '#b81d45', 'stroke-width': 0.8, class: 'p-glow' }),
    path('M39 34 H49 M39 38 H49', 'none', { stroke: '#b81d45', 'stroke-width': 0.7 }),
    rect(41.4, 29, 5.2, 1.8, '#2a1a3a'), rect(41.4, 42, 5.2, 1.6, '#2a1a3a'),
    rect(2, 56, 52, 36, '#2a2148', { rx: 2, stroke: '#0b0a1c', 'stroke-width': 1.2 }),
    rect(0, 53, 56, 5, '#4a3a7a', { rx: 1.4, stroke: '#0b0a1c', 'stroke-width': 1 }),
    path('M2 58.6 H54', 'none', { stroke: PINK, 'stroke-width': 1.4 }),
    rect(8, 64, 40, 20, '#1a1236', { rx: 2 }),
    path('M16 74 H40 Q38 82 28 82 Q18 82 16 74 Z', 'none', { stroke: CYAN, 'stroke-width': 1.4, 'stroke-linejoin': 'round' }),
    path('M24 72 L36 66 M27 72.6 L39 67.6', 'none', { stroke: YELLOW, 'stroke-width': 1.2, 'stroke-linecap': 'round' }),
    path('M12 53 Q12 43 26 43 Q40 43 40 53 Z', '#f8fafc', { stroke: '#94a3b8', 'stroke-width': 1 }),
    path('M12.6 49 Q26 52 39.4 49', 'none', { stroke: '#dc2626', 'stroke-width': 1.6 }),
    path('M16 44.6 q3 2 6 0 q3 2 6 0 q3 2 6 0', 'none', { stroke: '#fde68a', 'stroke-width': 1.2 }),
    path('M30 44 L44 34 M32 44.4 L46 36', 'none', { stroke: '#8a5a2e', 'stroke-width': 1.3, 'stroke-linecap': 'round' }),
    path('M20 40 q-2 -3 0 -6 q2 -3 0 -6 M26 39 q-2 -3 0 -6 q2 -3 0 -6', 'none', { stroke: '#f1f5f9', 'stroke-width': 1.2, 'stroke-linecap': 'round', 'stroke-opacity': 0.75, class: 'p-glow' }),
    rect(6, 88, 6, 4, '#0b0a1c'), rect(44, 88, 6, 4, '#0b0a1c'),
  ],
  // An energy-drink vending machine: a glowing window of colorful cans, buttons and a tray.
  cooler: () => [
    rect(2, 4, 32, 88, '#16142c', { rx: 2.4, stroke: '#3a3570', 'stroke-width': 1.2 }),
    rect(2, 4, 32, 4, PINK, { rx: 1.6, class: 'p-glow' }),
    rect(5, 11, 20, 52, '#0e3b46', { rx: 1.4 }),
    rect(5, 11, 20, 52, CYAN, { rx: 1.4, 'fill-opacity': 0.18, class: 'p-glow' }),
    ...[0, 1, 2, 3].flatMap(row => [0, 1, 2].map(col => {
      const color = [LIME, PINK, CYAN, YELLOW, PURPLE, ORANGE][(row * 3 + col) % 6];
      return rect(6.6 + col * 6.2, 14 + row * 12, 4.6, 9, color, { rx: 1.2, stroke: darker(color, 0.4), 'stroke-width': 0.5 });
    })),
    ...[0, 1, 2, 3].map(row => rect(5.6, 23.6 + row * 12, 18.8, 1.2, '#5a6b7a')),
    path('M7 13 L12 60', 'none', { stroke: '#ffffff', 'stroke-opacity': 0.15, 'stroke-width': 3 }),
    rect(27, 12, 5, 20, '#0b0a1c', { rx: 1 }),
    ...[15, 19, 23, 27].map((y, index) => rect(28.2, y, 2.6, 2.2, [CYAN, PINK, LIME, YELLOW][index], { rx: 0.5 })),
    rect(27.6, 36, 3.8, 6, '#2a2550', { rx: 0.8 }), rect(29, 37, 1, 4, '#0b0a1c'),
    rect(6, 68, 24, 9, '#0b0a1c', { rx: 1.4, stroke: '#3a3570', 'stroke-width': 0.8 }),
    rect(9, 72, 6, 4, LIME, { rx: 1 }),
    rect(3, 88, 30, 4, '#0b0a1c'),
  ],
  // 0: a neon bonsai in a hexagonal pot (the lounge corner); 1: a holographic plant over a projector disc (by the door).
  plant: variant => variant % 2 === 0
    ? [
      path('M21 52 Q20 44 24 40 Q28 36 25 30 Q22 26 26 20 M24 40 Q16 38 12 32 M25 30 Q31 28 34 24', 'none', { stroke: '#3b2440', 'stroke-width': 3.4, 'stroke-linecap': 'round' }),
      ...[[12, 28, 9, 5], [26, 16, 10, 5.4], [35, 22, 7, 4], [20, 24, 6, 3.4]].map(([cx, cy, rx, ry]) => ellipse(cx, cy, rx, ry, '#c2185b', { stroke: PINK, 'stroke-width': 1 })),
      ...[[8, 27], [12, 25], [16, 28], [22, 14], [27, 13], [31, 16], [34, 21], [38, 22], [19, 23]].map(([cx, cy]) => circle(cx, cy, 1.1, '#ffe4f3', { class: 'p-glow' })),
      path('M8 52 L14 46 H30 L36 52 L32 70 H12 Z', '#1a1236', { stroke: '#0b0a1c', 'stroke-width': 1.2 }),
      path('M8 52 L14 46 H30 L36 52 Z', '#2a2550'),
      path('M10 55 H34', 'none', { stroke: CYAN, 'stroke-width': 1.4, class: 'p-glow' }),
    ]
    : [
      path('M22 60 L8 10 H36 Z', CYAN, { 'fill-opacity': 0.08 }),
      ...[['M22 58 Q12 44 8 26 Q18 36 22 58 Z'], ['M22 58 Q30 42 38 30 Q32 46 22 58 Z'], ['M22 58 Q20 36 24 12 Q28 36 22 58 Z'], ['M22 58 Q14 50 4 46 Q16 46 22 58 Z'], ['M22 58 Q32 52 40 50 Q30 56 22 58 Z']]
        .map(([d]) => path(d, CYAN, { 'fill-opacity': 0.28, stroke: '#9ff6ff', 'stroke-width': 1, class: 'p-glow' })),
      path('M10 30 l3 2 M14 40 l3 1 M24 20 l-2 2 M24 30 l2 1 M34 36 l-3 2 M30 44 l-3 1', 'none', { stroke: '#e0fbff', 'stroke-width': 0.8, 'stroke-opacity': 0.8 }),
      path('M6 24 H38 M6 34 H38 M6 44 H38', 'none', { stroke: '#e0fbff', 'stroke-width': 0.5, 'stroke-opacity': 0.25 }),
      ellipse(22, 62, 14, 4, '#1a1236', { stroke: '#3a3570', 'stroke-width': 1 }),
      ellipse(22, 61, 9, 2.4, CYAN, { 'fill-opacity': 0.8, class: 'p-glow' }),
      rect(10, 62, 24, 6, '#1a1236'), ellipse(22, 68, 12, 2.6, '#141233'),
    ],
};

// ---------------------------------------------------------------------------
// Stations (viewBox 68 20 72 96, floor at y = 112)
// ---------------------------------------------------------------------------

const stations = {
  // A neon terminal: a sleek column projecting a holographic keyboard and three floating screens.
  neonterminal: () => [
    path('M104 84 L80 66 M112 84 L130 60', 'none', { stroke: CYAN, 'stroke-width': 0.6, 'stroke-opacity': 0.35 }),
    path('M104 82 L84 40 H124 Z', CYAN, { 'fill-opacity': 0.06 }),
    svg('g', { class: 'p-holo' },
      rect(76, 44, 24, 18, PINK, { rx: 1.4, 'fill-opacity': 0.22, stroke: '#ff8fd6', 'stroke-width': 1, transform: 'skewY(-6)' }),
      circle(88, 44.4, 5.2, 'none', { stroke: '#ffd1ec', 'stroke-width': 1.6, 'stroke-dasharray': '18 6', transform: 'skewY(-6)' }),
      rect(100, 34, 30, 22, CYAN, { rx: 1.4, 'fill-opacity': 0.22, stroke: '#9ff6ff', 'stroke-width': 1 }),
      rect(120, 60, 16, 12, PURPLE, { rx: 1.2, 'fill-opacity': 0.25, stroke: '#d8b4fe', 'stroke-width': 0.9, transform: 'skewY(6)' }),
      path('M122 52.6 l2 -3 l2 2 l2 -4 l2 3 l2 -2 l2 3', 'none', { stroke: '#f5e8ff', 'stroke-width': 0.8 })),
    ...[38, 42, 46, 50].map((y, index) => rect(103, y, [20, 14, 18, 10][index], 1.6, index === 2 ? YELLOW : '#e0fbff', { class: 'p-screen-line' })),
    path('M78 86 L130 86 L126 80 L84 80 Z', CYAN, { 'fill-opacity': 0.25, stroke: '#9ff6ff', 'stroke-width': 0.9, class: 'p-holo' }),
    path('M86 82 H124 M85 84 H126 M92 80 L90 86 M100 80 L99 86 M108 80 V86 M116 80 L117 86', 'none', { stroke: '#9ff6ff', 'stroke-width': 0.5, 'stroke-opacity': 0.8 }),
    path('M98 112 L100 88 H112 L114 112 Z', '#211d44', { stroke: '#0b0a1c', 'stroke-width': 1 }),
    path('M96 88 H116 L113 84 H99 Z', '#2f2960', { stroke: '#0b0a1c', 'stroke-width': 0.8 }),
    rect(104.6, 92, 2.8, 16, CYAN, { rx: 1.2, 'fill-opacity': 0.85, class: 'p-glow' }),
    circle(106, 85.8, 1.2, PINK, { class: 'p-blink-led' }),
    ellipse(106, 112, 12, 1.6, '#0b0a1c'),
  ],
  // A repair bench: a robot arm welding an open robot head, sparks, tools and hazard stripes.
  workbench: () => [
    rect(72, 84, 64, 6, '#3a3f55', { rx: 1.4, stroke: '#0b0a1c', 'stroke-width': 1 }),
    ...[0, 1, 2, 3, 4, 5, 6, 7].map(index => path(`M${74 + index * 8} 90 L${78 + index * 8} 90 L${75 + index * 8} 94 H${71 + index * 8} Z`, YELLOW)),
    rect(72, 90, 64, 4, 'none', { stroke: '#0b0a1c', 'stroke-width': 0.6 }),
    rect(75, 94, 5, 18, '#2a2f45'), rect(128, 94, 5, 18, '#2a2f45'), rect(78, 104, 52, 3, '#2a2f45'),
    path('M84 84 Q84 66 98 66 Q112 66 112 84 Z', '#d6dbe4', { stroke: '#6b7785', 'stroke-width': 1 }),
    path('M86 74 H110', 'none', { stroke: '#6b7785', 'stroke-width': 0.8 }),
    rect(88, 75.6, 20, 6, '#141a2e', { rx: 2 }),
    circle(93, 78.6, 1.6, CYAN, { class: 'p-glow' }), circle(103, 78.6, 1.6, CYAN, { 'fill-opacity': 0.4 }),
    path('M98 66 L100 70 L106 70 L104 66', '#141a2e'),
    path('M100 68 q2 -6 6 -6 M102 68 q3 -4 8 -2', 'none', { stroke: PINK, 'stroke-width': 0.9 }),
    path('M98 66 V60', 'none', { stroke: '#6b7785', 'stroke-width': 1 }), circle(98, 59.4, 1.2, PINK, { class: 'p-blink-led' }),
    rect(124, 76, 12, 8, '#2a2f45', { rx: 2, stroke: '#0b0a1c', 'stroke-width': 0.8 }),
    path('M130 76 L126 54 L110 50 L106 58', 'none', { stroke: '#f59e0b', 'stroke-width': 4.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
    path('M130 76 L126 54 L110 50 L106 58', 'none', { stroke: '#fcd34d', 'stroke-width': 1.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
    circle(126, 54, 3, '#2a2f45', { stroke: '#0b0a1c', 'stroke-width': 0.8 }), circle(110, 50, 2.6, '#2a2f45', { stroke: '#0b0a1c', 'stroke-width': 0.8 }),
    circle(130, 76, 3.2, '#2a2f45', { stroke: '#0b0a1c', 'stroke-width': 0.8 }),
    path('M104 57 L108 59 L105.6 64 L102 62 Z', '#4b5563', { stroke: '#0b0a1c', 'stroke-width': 0.6 }),
    circle(104, 64.8, 2.4, '#e0fbff', { class: 'p-glow' }),
    ...[[100, 60], [108, 62], [97, 64], [110, 67], [102, 56]].map(([x, y]) => path(`M${x} ${y - 2.4} l0.8 1.6 l1.6 0.8 l-1.6 0.8 l-0.8 1.6 l-0.8 -1.6 l-1.6 -0.8 l1.6 -0.8 Z`, YELLOW, { class: 'p-spark' })),
    path('M76 82 L82 80.6 M77 80 l-1.4 -1.4 M81.4 79 l1.6 -1.2', 'none', { stroke: CHROME, 'stroke-width': 1.3, 'stroke-linecap': 'round' }),
    rect(114, 80.6, 7, 3.4, '#14532d', { rx: 0.6 }), path('M115 84 v1 M117 84 v1 M119 84 v1', 'none', { stroke: CHROME, 'stroke-width': 0.6 }),
  ],
};

export default Object.freeze({
  archetypes: { hacker, cyborg, android, samurai, courier, idol },
  decor,
  stations,
});
