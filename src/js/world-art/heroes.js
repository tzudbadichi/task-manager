// Heroes: a secret HQ on a rooftop above the city - caped heroes with domino masks and chest emblems,
// heroes in tech armor with a glowing core, speedsters in goggles, strongmen in wrestling suits, teen
// sidekicks in hoodies and robot heroes - and the HQ's furniture: an elevator with a star, a trophy case
// of strange artifacts, a lounge couch, an energy-drink machine, a water cooler, a star rug.
// Original designs for this app: the feel of the genre, no characters, costumes or emblems from comics or films.
// Coordinates: figure-kit.js (characters), world-layout.js ART (furniture), viewBox 68 20 72 96 (stations).

import { circle, darker, ellipse, group, lighter, line, path, rect, svg } from '../svg-kit.js';
import {
  HAIR, BEARD, arm, box, dot, headBase, leg, limb, nose, pick, pickWeighted, rngOf, shade, shape, stroke, torsoPath,
} from '../figure-kit.js';

const TOON_EYES = Object.freeze({ anchors: [[43, 41], [52, 41]], style: 'toon' });
const GOLD = '#f5c542';
const NIGHT = '#111827';
const CORE_GLOW = '#a5f3fc';

const HUMAN_SKINS = ['#f6d7bd', '#efc8a6', '#e2b38c', '#d29f74', '#b9845a', '#8f5f3c', '#6e4630'];
const HAIR_COLORS = ['#1f1a17', '#3d2a1c', '#5a3a22', '#8a4b26', '#c9a05a', '#e8d18a', '#b23a2a', '#2b2b3a'];
const CAPE_COLORS = ['#c81e3a', '#f2b705', '#1e3a8a', '#f8fafc', '#1f2937', '#6d28d9', '#0f766e', '#ea580c'];

/** A five-point star path around (cx, cy). */
function starPath(cx, cy, outer, inner = outer * 0.42, squash = 1) {
  const points = [];
  for (let index = 0; index < 10; index += 1) {
    const radius = index % 2 ? inner : outer;
    const angle = ((-90 + index * 36) * Math.PI) / 180;
    points.push(`${(cx + Math.cos(angle) * radius).toFixed(2)} ${(cy + Math.sin(angle) * radius * squash).toFixed(2)}`);
  }
  return `M${points.join(' L')} Z`;
}

/** A chest emblem: a badge with a simple geometric symbol (star, bolt, ring, chevron or diamond). */
function emblem(kind, [cx, cy], { badge, symbol, r = 5.6 }) {
  const parts = [dot(cx, cy, r, badge)];
  switch (kind) {
    case 'bolt': parts.push(shape(`M${cx + 1.2} ${cy - 4.4} L${cx - 2.6} ${cy + 0.6} H${cx - 0.2} L${cx - 1.4} ${cy + 4.4} L${cx + 2.8} ${cy - 0.8} H${cx + 0.4} Z`, symbol)); break;
    case 'ring': parts.push(dot(cx, cy, 3.2, 'none', { stroke: symbol, 'stroke-width': 1.6 }), dot(cx, cy, 1.1, symbol)); break;
    case 'chevron': parts.push(stroke(`M${cx - 3.2} ${cy - 1.6} L${cx} ${cy + 1.8} L${cx + 3.2} ${cy - 1.6}`, symbol, 1.8)); break;
    case 'diamond': parts.push(shape(`M${cx} ${cy - 3.8} L${cx + 3} ${cy} L${cx} ${cy + 3.8} L${cx - 3} ${cy} Z`, symbol)); break;
    default: parts.push(shape(starPath(cx, cy + 0.3, 4.2), symbol));
  }
  return parts;
}

/** A domino mask over the eyes, with white lenses (the eyes are drawn on them). */
function dominoMask(color, { small = false } = {}) {
  const outline = small
    ? 'M34.6 39 Q39 36.4 46 38 Q53 36.4 58.4 39 Q58.6 43.8 53.6 44.4 Q49.4 44.6 47 41.8 Q46 41 45 41.8 Q42.6 44.6 38.4 44.4 Q34.4 43.8 34.6 39 Z'
    : 'M32.6 38.6 Q38 35 46 37.4 Q54 35 59.6 38.6 Q60 44.6 54 45.4 Q49.4 45.6 47 42 Q46 41 45 42 Q42.6 45.6 38 45.4 Q32.4 44.8 32.6 38.6 Z';
  return [shape(outline, color), ellipse(43, 41, 2.8, 2.5, '#ffffff'), ellipse(52, 41, 2.8, 2.5, '#ffffff'),
    stroke(small ? 'M36 39.4 Q40 37.8 44 38.6' : 'M34.4 39 Q39 36.6 44 38', lighter(color, 0.35), 0.7)];
}

/** A heroic V-shaped torso path (broad shoulders, narrow waist). */
const heroTorso = build => build === 'broad'
  ? 'M31.5 56.5 Q46 52.5 60.5 56.5 Q63.5 59 62 66 L57 88 Q46 91.5 35 88 L30 66 Q28.5 59 31.5 56.5 Z'
  : 'M33.5 56.5 Q46 53 58.5 56.5 Q61 59 60 66 L56 88 Q46 91 36 88 L32 66 Q31 59 33.5 56.5 Z';

/** A quiff: hair swept up and over, one lock falling on the forehead. */
const quiffHair = color => ({
  back: null,
  front: [shape('M31 41 Q29.6 26 44 24 Q54 22.6 59.6 30 Q62 34.6 61 38.6 Q56 31.4 48 31.6 Q49.6 34.4 47.6 37 Q45.6 32.6 40.6 32.6 Q35 33.6 33.4 38.6 Q32.6 42 33 46 Z', color),
    stroke('M38 27.6 Q46 24.6 54 27.4', lighter(color, 0.25), 0.9)],
});

// ---------------------------------------------------------------------------
// Things held in the back hand (at about (34,83); they swing with the arm)
// ---------------------------------------------------------------------------

const HELD = {
  dumbbell: () => [limb(34, 74, 34, 92, 2.4, '#6b7280'), box(28.4, 70, 11.2, 5.4, NIGHT, { rx: 1.6 }), box(28.4, 90, 11.2, 5.4, NIGHT, { rx: 1.6 }),
    stroke('M30 71.4 H38 M30 91.4 H38', '#4b5563', 0.8)],
  kettlebell: () => [stroke('M27.6 92 Q27 82.6 34 82.6 Q41 82.6 40.4 92', NIGHT, 2.6), dot(34, 95, 7, '#374151'), shade('M28 94 Q29 89.6 33 89 Q30 92 30.4 98 Z', '#ffffff', 0.25),
    shape(starPath(34, 96, 2.6), GOLD)],
  blast: () => [circle(32.6, 84.6, 7.6, CORE_GLOW, { 'fill-opacity': 0.35, class: 'p-glow' }), circle(32.6, 84.6, 3.4, '#ecfeff', { class: 'p-glow' })],
  skateboard: deck => [box(26.6, 62, 6.8, 44, deck, { rx: 3.2 }), stroke('M28.2 66 V102', lighter(deck, 0.3), 0.8),
    box(24.6, 67, 2.4, 4, '#9ca3af', { rx: 0.6 }), box(24.6, 97, 2.4, 4, '#9ca3af', { rx: 0.6 }),
    dot(24, 66.4, 1.8, '#f8fafc'), dot(24, 71.6, 1.8, '#f8fafc'), dot(24, 96.4, 1.8, '#f8fafc'), dot(24, 101.6, 1.8, '#f8fafc')],
  gadget: () => [box(29.4, 76.4, 8.4, 11, NIGHT, { rx: 1.6 }), box(30.6, 77.8, 6, 5.4, '#22d3ee', { rx: 0.8, class: 'p-glow' }),
    stroke('M35.6 76.4 L37 71', '#6b7280', 1), circle(37.1, 70.6, 1.1, '#ef4444', { class: 'p-antenna' })],
};

// ---------------------------------------------------------------------------
// Archetypes (looks: figure-kit.js composeFigure)
// ---------------------------------------------------------------------------

/** A caped hero: a bodysuit in the category color, a billowing cape, a domino mask, a chest emblem, gloves and boots. */
function capedHero(look) {
  const random = rngOf(look);
  const skin = pick(HUMAN_SKINS, random);
  const hairColor = pick(HAIR_COLORS, random);
  const cape = pick(CAPE_COLORS, random);
  const accent = pick([GOLD, '#f8fafc', cape, NIGHT], random);
  const build = random() < 0.55 ? 'broad' : 'regular';
  const symbol = pick(['star', 'bolt', 'ring', 'chevron', 'diamond'], random);
  const badge = pick(['#f8fafc', GOLD, cape], random);
  const symbolColor = badge === GOLD ? '#b91c1c' : badge === '#f8fafc' ? (cape === '#f8fafc' ? '#c81e3a' : cape) : (cape === '#f2b705' ? '#b91c1c' : GOLD);
  const masked = random() < 0.8;
  const trunks = random() < 0.3;
  const hair = pick([quiffHair, HAIR.shortCrop, HAIR.longWavy, HAIR.curlyMop, HAIR.topKnot, quiffHair], random)(hairColor);
  const gloves = accent === '#f8fafc' || accent === NIGHT ? accent : cape;
  const legs = { trousers: 'cat', feet: 'tallboot', shoes: gloves === '#f8fafc' ? cape : gloves, width: 7.2 };
  const sleeves = { sleeve: 'cat', hand: gloves, cuff: gloves, width: 6.4, handSize: 3.7 };
  const capeShade = darker(cape, 0.25);
  return {
    shadowWidth: 19,
    behind: [
      shape('M35 55 Q46 51 57 55 Q60 60 59 66 Q58 88 57 108 Q42 113 24 109 Q15 98 18 82 Q22 66 35 55 Z', cape),
      shade('M35 58 Q26 70 22 86 Q20 100 26 108 Q30 96 31 82 Q32 68 35 58 Z', '#000000', 0.16),
      stroke('M40 62 Q34 84 31 106 M47 60 Q46 84 44 109', capeShade, 0.9),
    ],
    legBack: leg('back', legs),
    legFront: leg('front', legs),
    armBack: arm('back', sleeves),
    armFront: arm('front', sleeves),
    torso: [
      shape(heroTorso(build), 'cat'),
      shade('M50 55.6 Q56 55.6 59 57 Q62 60 60.6 66 L56 88 Q52 89.6 49 89.6 Z', '#000000', 0.12),
      stroke('M38.6 73.4 Q42 75 46 74.4 Q50 75 53.4 73.4', 'cat-dark', 0.8),
      emblem(symbol, [46, 66.4], { badge, symbol: symbolColor }),
      trunks && shape('M35.4 85.6 Q46 89 56.6 85.6 L57.4 92.6 Q52.4 94.6 49.6 91.6 Q46 90.6 42.4 91.6 Q39.6 94.6 34.6 92.6 Z', cape),
      box(build === 'broad' ? 35.2 : 35.8, 82.4, build === 'broad' ? 21.6 : 20.4, 3.6, accent === cape ? darker(cape, 0.2) : accent, { rx: 1.2 }),
      dot(46, 84.2, 2.3, GOLD),
    ],
    overTorso: [
      shape('M30.5 57.4 Q32.6 52.4 39 54 L37.6 59 Q33.6 58 30.5 57.4 Z', cape),
      shape('M61.5 57.4 Q59.4 52.4 53 54 L54.4 59 Q58.4 58 61.5 57.4 Z', cape),
      dot(37.4, 58.2, 1.6, GOLD), dot(54.6, 58.2, 1.6, GOLD),
    ],
    headScale: 1,
    head: {
      back: hair.back,
      base: headBase(skin),
      features: [nose(skin), masked && dominoMask(pick([NIGHT, cape, darker(cape, 0.3), '#1e3a8a'], random))],
      eyes: TOON_EYES,
      brows: darker(hairColor, 0.1),
      mouth: { anchor: [47.6, 47.8] },
      front: hair.front,
    },
  };
}

/** A hero in tech armor: plates in the category color, metal trim, a glowing chest core, a helmet with a visor, a jetpack. */
function armoredHero(look) {
  const random = rngOf(look);
  const skin = pick(HUMAN_SKINS, random);
  const trim = pick(['#d4d9e0', '#e0b84a', '#5b6472', '#b8c0cc', '#e5e7eb'], random);
  const core = pick(['#a5f3fc', '#7dd3fc', '#fde68a', '#f0abfc', '#bbf7d0'], random);
  const trimDark = darker(trim, 0.3);
  const jetpack = random() < 0.65;
  const held = pickWeighted([[null, 60], ['blast', 40]], random);
  const knee = ([x, y]) => shape(`M${x - 3.6} ${y - 2.4} H${x + 3.6} L${x + 3} ${y + 1.6} L${x} ${y + 3.6} L${x - 3} ${y + 1.6} Z`, trim);
  const pauldron = ([x, y]) => [shape(`M${x - 5.6} ${y + 3.4} L${x - 6.2} ${y - 1.6} Q${x - 4.6} ${y - 6.4} ${x} ${y - 6.6} Q${x + 4.6} ${y - 6.4} ${x + 6.2} ${y - 1.6} L${x + 5.6} ${y + 3.4} Q${x} ${y + 1.2} ${x - 5.6} ${y + 3.4} Z`, 'cat-dark'),
    stroke(`M${x - 5.4} ${y + 2.4} Q${x} ${y + 0.2} ${x + 5.4} ${y + 2.4}`, trim, 1.4)];
  const legs = { trousers: 'cat', feet: 'boot', shoes: trim, width: 8 };
  const sleeves = { sleeve: 'cat', hand: trim, cuff: trim, width: 7, handSize: 4 };
  return {
    shadowWidth: 20,
    behind: jetpack && [
      box(25.4, 57, 9, 23, trimDark, { rx: 3 }), box(27, 59, 5.8, 3, core, { rx: 1, class: 'p-glow' }),
      shape('M26.4 80 H33.4 L32.4 84 H27.4 Z', '#374151'),
      path('M27.6 84.4 Q30 92 32.2 84.4 Z', '#fb923c', { class: 'p-glow' }), path('M28.6 84.4 Q30 89 31.2 84.4 Z', '#fde68a'),
    ],
    legBack: [leg('back', legs), knee([40.6, 99])],
    legFront: [leg('front', legs), knee([51.6, 99])],
    armBack: [arm('back', sleeves), pauldron([37, 61.6])],
    armFront: [arm('front', sleeves), pauldron([55, 61.6])],
    torso: [
      shape(torsoPath('broad', { bottom: 92 }), 'cat'),
      shape('M34.6 58.6 Q46 54.6 57.4 58.6 L56.6 70 Q46 75 35.4 70 Z', 'cat-light'),
      stroke('M35.4 70 Q46 75 56.6 70', trimDark, 1),
      ...[[40.4, 76.6], [46.6, 76.6], [40.4, 81.2], [46.6, 81.2]].map(([x, y]) => box(x, y, 5.2, 3.6, 'cat-dark', { rx: 1 })),
      box(31.2, 85.6, 29.6, 4.2, trim, { rx: 1.4 }), box(43.6, 85.2, 4.8, 5, trimDark, { rx: 1 }),
      circle(46, 64.6, 7, core, { 'fill-opacity': 0.35, class: 'p-glow' }),
      dot(46, 64.6, 4.8, '#1f2937'), circle(46, 64.6, 3.4, core, { class: 'p-glow' }), circle(45, 63.6, 1.1, '#ffffff'),
    ],
    held: HELD[held]?.() ?? null,
    headScale: 1,
    head: {
      base: [
        dot(46, 40, 15.4, 'cat'),
        shape('M39.6 45.4 Q40.4 54 47.4 55.2 Q55.6 54.6 58.8 46.2 L59.2 44 H40 Z', skin),
        stroke('M46 25 Q53 24.2 58 29.6', trim, 2.2),
        stroke('M40.2 45.6 Q40.8 53.4 47.4 55 Q55.2 54.6 58.6 46.6', trim, 1.3),
        shape('M33 36.4 Q46 33 60.8 35.8 L60.4 45.2 Q46 47.6 33.4 45 Z', '#0f1b2e'),
        shape('M32.4 36.6 Q46 30.4 61.2 35.2 L61 37 Q46 33.4 32.8 38.4 Z', 'cat-dark'),
        stroke('M36 37.6 Q46 35.4 58.4 37.2', '#7dd3fc', 0.8, { 'stroke-opacity': 0.7 }),
        dot(32.4, 42.6, 4.2, trim), circle(32.4, 42.6, 1.7, core, { class: 'p-glow' }),
      ],
      features: nose(skin, 0.8),
      eyes: { anchors: [[43, 40.6], [52, 40.6]], style: 'led' },
      brows: null,
      mouth: { anchor: [48.6, 49.4], width: 0.8 },
    },
  };
}

/** A speedster: a streamlined suit with lightning streaks, goggles, light running shoes, speed lines behind. */
function speedster(look) {
  const random = rngOf(look);
  const skin = pick(HUMAN_SKINS, random);
  const hairColor = pick(HAIR_COLORS, random);
  const streak = pick(['#facc15', '#f8fafc', '#fde68a', '#67e8f9', '#fb923c'], random);
  const lens = pick(['#fbbf24', '#38bdf8', '#f472b6', '#a3e635'], random);
  const cowl = random() < 0.5;
  const shoes = pick(['#f8fafc', NIGHT, streak], random);
  const legs = { trousers: 'cat', feet: 'shoe', shoes, width: 6.4 };
  const sleeves = { sleeve: 'cat', hand: shoes === NIGHT ? NIGHT : skin, cuff: streak, width: 5.6 };
  const goggles = (cy, frame = '#374151') => [
    stroke(`M31 ${cy - 0.4} H60.6`, '#1f2937', 2.2),
    dot(43, cy, 4, frame), dot(52.4, cy, 4, frame),
    circle(43, cy, 3, lens, { 'fill-opacity': 0.5 }), circle(52.4, cy, 3, lens, { 'fill-opacity': 0.5 }),
    stroke(`M41 ${cy - 1.6} l1.6 -0.8 M50.4 ${cy - 1.6} l1.6 -0.8`, '#ffffff', 0.8),
  ];
  const sweptHair = {
    back: shape('M34 30 L19 25 L29 33 L17 37 L30 39.6 L20 46 L32 44 Z', hairColor),
    front: shape('M31 41 Q29 27 44 24.6 Q55 23.6 60 31 Q61.6 34 61 37.6 Q55 31.6 47 31.6 Q39 32 34.4 37.6 Q33 41.6 33.6 46 Z', hairColor),
  };
  return {
    shadowWidth: 16,
    behind: stroke('M6 64 H24 M2 73 H22 M8 82 H25', streak, 1.6, { 'stroke-opacity': 0.75 }),
    legBack: [leg('back', legs), stroke('M42.4 91 L39.6 96.4 L42.4 96.4 L39.8 102', streak, 1.3)],
    legFront: [leg('front', legs), stroke('M52.6 91 L49.8 96.4 L52.6 96.4 L50 102', streak, 1.3)],
    armBack: arm('back', sleeves),
    armFront: arm('front', sleeves),
    torso: [
      shape(torsoPath('slim', { bottom: 90 }), 'cat'),
      shape('M53.6 56.6 L43.4 70.2 L48.6 70.6 L39.6 88.6 L54.4 71.4 L48.8 71 L55.4 58.4 Z', streak),
      box(36.6, 83.4, 19, 2.6, 'cat-dark', { rx: 1 }),
      shade('M50 56 Q54 56 55.5 58 L55.5 88 Q52 90 50 90 Z', '#000000', 0.1),
    ],
    headScale: 1,
    head: {
      back: cowl ? null : sweptHair.back,
      base: headBase(skin, { ears: cowl ? 'none' : 'round' }),
      features: nose(skin),
      eyes: TOON_EYES,
      brows: cowl ? null : darker(hairColor, 0.1),
      mouth: { anchor: [47.6, 48] },
      front: cowl
        ? [shape('M30.2 46 Q28.4 24.4 46 23.8 Q63.6 24.4 61.8 41 L59.6 40.6 Q58.6 31.4 47 31.2 Q36.4 31.4 34.6 40 Q33.6 46.4 36.6 53 Q31.6 51 30.2 46 Z', 'cat')]
        : sweptHair.front,
      eyewear: cowl ? goggles(41) : goggles(29.6, '#4b5563'),
    },
  };
}

/** A strongman or strongwoman: a wrestling suit in the category color, bare strong arms, a champion belt, tall boots. */
function strongman(look) {
  const random = rngOf(look);
  const skin = pick(HUMAN_SKINS, random);
  const hairColor = pick(HAIR_COLORS, random);
  const woman = random() < 0.4;
  const hairStyle = woman ? pick(['ponytail', 'bun', 'long'], random) : pick(['bald', 'mohawk', 'flattop', 'crop'], random);
  const facial = woman ? null : pickWeighted([[null, 35], ['mustache', 35], ['short', 30]], random);
  const boots = pick([NIGHT, '#f8fafc', '#7f1d1d', '#facc15', '#1e3a8a'], random);
  const plate = pick([GOLD, '#d4d9e0'], random);
  const band = pick(['#f8fafc', GOLD, NIGHT], random);
  const held = pickWeighted([[null, 50], ['dumbbell', 25], ['kettlebell', 25]], random);
  const muscleArm = side => {
    const sign = side === 'back' ? -1 : 1;
    return [arm(side, { style: 'bare', hand: skin, width: 9.6, cuff: band, handSize: 4.4 }), stroke(`M${46 + sign * 8.4} 66 q${sign * 2.4} 2.6 ${sign * 0.6} 5.6`, darker(skin, 0.2), 0.8)];
  };
  const legs = { trousers: 'cat', length: 'short', lower: skin, skin, feet: 'tallboot', shoes: boots, width: 8.6 };
  const hair = {
    bald: () => HAIR.bald(hairColor),
    mohawk: () => ({ back: null, front: [shape('M36.6 28.6 Q42 14.6 57 21.6 Q59.6 25.6 59 30.4 Q50 25.4 38.6 31.4 Z', hairColor), shade('M31.6 42 Q31 33 36 29 Q33.4 36 33.6 44 Z', hairColor, 0.35)] }),
    flattop: () => ({ back: null, front: [shape('M31 40 Q30.6 30 33 25.4 Q33.4 22.4 37 22.4 H55 Q58.6 22.4 59 25.4 Q61.4 30 61 38 Q56 30.6 46 30.8 Q37 30.8 31 40 Z', hairColor)] }),
    crop: () => HAIR.shortCrop(hairColor),
    ponytail: () => ({ back: stroke('M32.6 31 Q20 36 22.6 54', hairColor, 5.4), front: [HAIR.shortCrop(hairColor).front, stroke('M31.4 34.6 Q46 26.6 60.6 33.4', 'cat-dark', 2.4)] }),
    bun: () => ({ back: [dot(36, 25, 5.4, hairColor)], front: [HAIR.shortCrop(hairColor).front, stroke('M31.4 34.6 Q46 26.6 60.6 33.4', 'cat-dark', 2.4)] }),
    long: () => HAIR.longWavy(hairColor),
  }[hairStyle]();
  return {
    shadowWidth: 22,
    legBack: leg('back', legs),
    legFront: leg('front', legs),
    armBack: muscleArm('back'),
    armFront: muscleArm('front'),
    torso: [
      shape('M28.4 58.4 Q46 51.4 63.6 58.4 Q66.2 62.4 63.6 70 L58.6 88 Q46 92 33.4 88 L28.4 70 Q25.8 62.4 28.4 58.4 Z', skin),
      shape(woman
        ? 'M33 61 L36.4 56.6 L39.4 57.4 Q40.4 63 46 63.4 Q51.6 63 52.6 57.4 L55.6 56.6 L59 61 Q61.4 66 59.6 72 L57.6 88 Q46 92.4 34.4 88 L32.4 72 Q30.6 66 33 61 Z'
        : 'M33 61 L36.4 56.6 L39.4 57.4 Q40 67 46 67.6 Q52 67 52.6 57.4 L55.6 56.6 L59 61 Q61.4 66 59.6 72 L57.6 88 Q46 92.4 34.4 88 L32.4 72 Q30.6 66 33 61 Z', 'cat'),
      !woman && stroke('M40.2 61 Q43 63.4 45.6 62.4 M46.4 62.4 Q49 63.4 51.8 61', darker(skin, 0.2), 0.8),
      stroke('M36.6 57.4 L39 74 M55.4 57.4 L53 74', 'cat-dark', 0.9),
      box(31.4, 79.4, 29.2, 6.2, '#1f2937', { rx: 2 }),
      dot(46, 82.5, 5.6, plate), dot(46, 82.5, 3.4, darker(plate, 0.15)), shape(starPath(46, 82.8, 2.6), lighter(plate, 0.4)),
      ...[34.6, 39.4, 52.6, 57.4].map(x => circle(x, 82.5, 0.9, plate)),
    ],
    held: HELD[held]?.() ?? null,
    headScale: 0.95,
    head: {
      back: hair.back,
      base: headBase(skin),
      features: [nose(skin, 1.1), stroke('M36 50 Q38.4 54.6 44 55.4', darker(skin, 0.12), 0.8)],
      eyes: TOON_EYES,
      brows: darker(hairColor, 0.15),
      beforeMouth: facial === 'short' ? BEARD.short(hairColor) : null,
      mouth: { anchor: [47.6, 48.2] },
      front: [hair.front, facial === 'mustache' ? shape('M40.6 46.8 q3.4 -3.2 6.8 -0.6 q3.4 -2.6 6.8 0.6 q-1 4.4 -3 1.6 q-1.6 -1 -3.8 -0.4 q-2.2 -0.6 -3.8 0.4 q-2 2.8 -3 -1.6 Z', darker(hairColor, 0.05)) : null],
      cheeks: woman ? '#f4a3a3' : null,
    },
  };
}

/** A teen sidekick: a hoodie in the category color, a small mask, jeans and sneakers, a skateboard or a gadget. */
function sidekick(look) {
  const random = rngOf(look);
  const skin = pick(HUMAN_SKINS, random);
  const hairColor = pick(HAIR_COLORS, random);
  const hoodUp = random() < 0.3;
  const maskColor = pick([NIGHT, '#1e3a8a', '#7f1d1d', '#065f46', '#4c1d95'], random);
  const pants = pick(['#1e3a5f', '#334155', '#3f3f46', '#365f8a', '#4b5563'], random);
  const sneakers = pick(['#f8fafc', '#ef4444', '#facc15', '#22c55e', NIGHT], random);
  const held = pickWeighted([[null, 40], ['skateboard', 30], ['gadget', 30]], random);
  const deck = pick(['#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#0ea5e9'], random);
  const hair = pick([HAIR.shaggy, HAIR.curlyMop, HAIR.shortCrop, HAIR.braids, HAIR.longWavy], random)(hairColor);
  const legs = { trousers: pants, feet: 'shoe', shoes: sneakers, width: 7 };
  const sleeves = { sleeve: 'cat', hand: skin, cuff: 'cat-dark', width: 6.4 };
  const sole = ([x, y]) => stroke(`M${x - 4.4} ${y + 1.6} H${x + 6.2}`, sneakers === '#f8fafc' ? '#cbd5e1' : '#f8fafc', 1);
  return {
    shadowWidth: 16,
    legBack: [leg('back', legs), sole([42.3, 110.8])],
    legFront: [leg('front', legs), sole([54.8, 110.8])],
    armBack: arm('back', sleeves),
    armFront: arm('front', sleeves),
    torso: [
      shape(torsoPath('regular', { bottom: 93 }), 'cat'),
      shade('M50 56 Q55 55.6 58 58 L58 92 Q54 93.4 50 93.6 Z', '#000000', 0.1),
      shape('M38.6 79.4 H53.4 L55.4 89 H36.6 Z', 'cat-dark'),
      stroke('M38.8 79.6 L36.8 88.8 M53.2 79.6 L55.2 88.8', 'cat-light', 0.7),
      box(33.6, 89.4, 24.8, 3.6, 'cat-dark', { rx: 1.4 }),
      stroke('M43.2 58.6 V67 M48.8 58.6 V67', '#f8fafc', 1), dot(43.2, 67.6, 0.9, '#f8fafc'), dot(48.8, 67.6, 0.9, '#f8fafc'),
      shape(starPath(53, 70, 2.8), GOLD),
    ],
    overTorso: hoodUp ? null : shape('M33.6 56.4 Q46 50.4 58.4 56.4 Q55 61.4 46 61 Q37 61.4 33.6 56.4 Z', 'cat-dark'),
    held: held === 'skateboard' ? HELD.skateboard(deck) : HELD[held]?.() ?? null,
    headScale: 1.1,
    head: {
      back: hoodUp ? null : hair.back,
      base: headBase(skin),
      features: [nose(skin, 0.85), dominoMask(maskColor, { small: true })],
      eyes: TOON_EYES,
      brows: darker(hairColor, 0.1),
      mouth: { anchor: [47.6, 47.8] },
      front: hair.front,
      hat: hoodUp && [shape('M28.4 53 Q24.6 25 46 21.6 Q67.4 25 63.6 53 Q61.4 34.6 46 32.6 Q30.6 34.6 28.4 53 Z', 'cat'),
        shade('M31.4 50 Q30.6 36 46 33.8 Q38.6 38 36.4 50 Z', '#000000', 0.16)],
      cheeks: true,
    },
  };
}

/** A robot hero: a metal body, a chest panel in the category color with a glowing core, LED eyes, an antenna, maybe a cape. */
function robotHero(look) {
  const random = rngOf(look);
  const metal = pick(['#cbd5e1', '#d6dde6', '#9fb0c2', '#e6e0d0', '#b9c4d0'], random);
  const joints = darker(metal, 0.4);
  const caped = random() < 0.45;
  const cape = pick(CAPE_COLORS.filter(color => color !== '#f8fafc'), random);
  const headShape = pick(['dome', 'box', 'bucket'], random);
  const antenna = pick(['ball', 'twin', 'fin'], random);
  const robotArm = side => {
    const [shoulder, elbow, wrist, hand] = side === 'back'
      ? [[37, 62], [35.5, 72], [34.3, 80.5], [34, 83]]
      : [[55, 62], [56.5, 72], [57.7, 80.5], [58, 83]];
    return [limb(...shoulder, ...elbow, 6, metal), limb(...elbow, ...wrist, 4.6, metal), dot(...elbow, 2.6, joints), dot(...shoulder, 3.6, joints),
      dot(...hand, 3.6, joints), stroke(`M${hand[0] - 1.6} ${hand[1] + 1} h3.2`, '#1f2937', 0.8)];
  };
  const robotLeg = side => {
    const [hip, knee, ankle, foot] = side === 'back'
      ? [[41, 88], [40.6, 99], [40.2, 106], [41.5, 111]]
      : [[51, 88], [51.6, 99], [52.2, 106], [54, 111]];
    return [limb(...hip, ...knee, 6.4, metal), limb(...knee, ...ankle, 5.4, metal), dot(...knee, 2.8, joints),
      shape(`M${ankle[0] - 4.6} ${ankle[1] - 1} H${ankle[0] + 4.6} L${foot[0] + 6.4} ${foot[1] + 1.4} H${foot[0] - 6} Z`, joints),
      ellipse(foot[0] - 3.4, foot[1] + 2.4, 2.4, 1.2, '#fb923c', { class: 'p-glow', 'fill-opacity': 0.8 })];
  };
  const faceplate = headShape === 'box' ? box(35, 33.6, 23.6, 16.6, '#0f172a', { rx: 3 }) : box(35.4, 34.4, 22.6, 15.4, '#0f172a', { rx: 5 });
  const skull = {
    dome: shape('M30.6 45 Q29.6 24.6 46 24.6 Q62.4 24.6 61.4 45 Q61 53.6 46 54 Q31 53.6 30.6 45 Z', metal),
    box: box(30.6, 26, 30.8, 28, metal, { rx: 5 }),
    bucket: shape('M32.6 26 H59.4 L61.6 52 Q46 55.4 30.4 52 Z', metal),
  }[headShape];
  const top = headShape === 'dome' ? 24.6 : 26;
  return {
    shadowWidth: 18,
    behind: caped && [shape('M34 56 Q46 52 58 56 L60 70 Q58 92 57 106 Q42 111 26 107 Q18 96 21 80 Q25 66 34 56 Z', cape),
      stroke('M40 62 Q35 84 32 104 M47 60 Q46 84 45 107', darker(cape, 0.25), 0.9)],
    legBack: robotLeg('back'),
    legFront: robotLeg('front'),
    armBack: robotArm('back'),
    armFront: robotArm('front'),
    torso: [
      box(42.4, 50, 7.2, 8, joints, { rx: 1.4 }),
      shape('M33 56 H59 Q61.6 56 61.4 59 L60 88 Q46 92 32 88 L30.6 59 Q30.4 56 33 56 Z', metal),
      box(36.6, 60.4, 18.8, 16.6, 'cat', { rx: 2.6 }),
      circle(46, 68.6, 6, '#fef9c3', { 'fill-opacity': 0.35, class: 'p-glow' }), dot(46, 68.6, 3.4, '#fef9c3'),
      shape(starPath(46, 68.9, 2.4), 'cat-dark'),
      stroke('M37 82 H55 M37 85.4 H55', joints, 1.1),
      ...[[34, 59], [58, 59], [34, 85], [58, 85]].map(([x, y]) => circle(x, y, 0.9, joints)),
      shade('M52 56 H59 Q61.6 56 61.4 59 L60 88 Q56 89.6 52 90 Z', '#000000', 0.1),
      caped && [dot(36, 57.6, 2, GOLD), dot(56, 57.6, 2, GOLD)],
    ],
    headScale: 1,
    head: {
      base: [
        antenna === 'twin'
          ? [stroke(`M38 ${top + 1} L35 ${top - 7} M54 ${top + 1} L57 ${top - 7}`, joints, 1.4), circle(35, top - 8, 2, '#ef4444', { class: 'p-antenna' }), circle(57, top - 8, 2, '#ef4444', { class: 'p-antenna' })]
          : antenna === 'fin'
            ? [shape(`M40 ${top + 1} Q46 ${top - 9} 54 ${top + 1} Z`, 'cat'), circle(46, top - 3, 1.4, '#fef9c3', { class: 'p-antenna' })]
            : [stroke(`M46 ${top} V${top - 7}`, joints, 1.4), circle(46, top - 8.4, 2.4, '#ef4444', { class: 'p-antenna' })],
        skull,
        faceplate,
        dot(30.6, 41, 3.6, joints), dot(30.6, 41, 1.4, metal),
        stroke('M37.4 36 H45', '#ffffff', 0.7, { 'stroke-opacity': 0.4 }),
      ],
      eyes: { anchors: [[42, 40.4], [51.6, 40.4]], style: 'led' },
      brows: null,
      mouth: { anchor: [46.8, 45.6], color: '#22d3ee', width: 0.6 },
    },
  };
}

// ---------------------------------------------------------------------------
// Furniture (world-layout.js ART sizes)
// ---------------------------------------------------------------------------

const decor = {
  // The HQ elevator: steel doors split by a big star, a glowing red frame, a keypad and floor lights.
  door: () => [
    path('M0 92 V10 Q0 2 8 2 H42 Q50 2 50 10 V92 Z', '#374151', { stroke: '#1f2937', 'stroke-width': 1.2 }),
    rect(4.4, 12, 41.2, 80, '#b91c1c', { rx: 1.6, class: 'p-glow' }),
    rect(6, 13.6, 38, 78.4, '#1f2937'),
    rect(6.8, 14.4, 17.6, 77.6, '#9ca3af', { stroke: '#4b5563', 'stroke-width': 0.8 }),
    rect(25.6, 14.4, 17.6, 77.6, '#8b95a3', { stroke: '#4b5563', 'stroke-width': 0.8 }),
    path('M9.4 18 V88 M40.6 18 V88', 'none', { stroke: '#ffffff', 'stroke-opacity': 0.25, 'stroke-width': 1 }),
    circle(25, 50, 13, '#1f2937', { stroke: '#4b5563', 'stroke-width': 1 }),
    path(starPath(25, 50.6, 10.4), GOLD, { stroke: '#a16207', 'stroke-width': 0.9 }),
    line(25, 36, 25, 64, '#1f2937', 1.2),
    rect(14, 4.6, 22, 5.4, '#111827', { rx: 1.4 }),
    circle(19, 7.3, 1.4, '#ef4444'), circle(25, 7.3, 1.4, '#facc15', { class: 'p-blink-led' }), circle(31, 7.3, 1.4, '#4b5563'),
    rect(45.6, 44, 3.6, 9, '#111827', { rx: 0.8 }), circle(47.4, 46.4, 0.9, '#22c55e', { class: 'p-blink-dot' }), rect(46.2, 48.4, 2.4, 3.2, '#374151'),
    rect(2, 88, 46, 4, '#6b7280'),
  ],
  // A trophy case: a cup, a glowing crystal, an old helmet, a mask on a stand, a ray gun, a meteorite, a folded cape.
  shelf: () => [
    rect(2, 4, 60, 88, '#1f2937', { rx: 2.4, stroke: '#111827', 'stroke-width': 1.2 }),
    rect(6, 10, 52, 76, '#2a3550'),
    rect(6, 10, 52, 8, '#f8fafc', { 'fill-opacity': 0.08 }),
    rect(5, 35, 54, 2.6, '#6b7280'), rect(5, 60, 54, 2.6, '#6b7280'),
    // Top shelf: a trophy cup, a crystal, a helmet
    path('M10 22 H22 Q22 30 16 31 Q10 30 10 22 Z', GOLD, { stroke: '#a16207', 'stroke-width': 0.8 }),
    path('M10 23.4 Q6.6 24 8 27.4 Q9 28.4 10.6 28 M22 23.4 Q25.4 24 24 27.4 Q23 28.4 21.4 28', 'none', { stroke: '#a16207', 'stroke-width': 1 }),
    rect(14.6, 31, 2.8, 2.4, '#a16207'), rect(12, 33, 8, 2, '#78350f'),
    circle(33, 28, 6, CORE_GLOW, { 'fill-opacity': 0.3, class: 'p-glow' }),
    path('M33 20 L37 27 L33 35 L29 27 Z', '#67e8f9', { stroke: '#0e7490', 'stroke-width': 0.8 }), path('M33 20 L35 27 L33 35 Z', '#ffffff', { 'fill-opacity': 0.4 }),
    path('M42 35 Q41 23 48.6 22.6 Q56 23 55 35 Z', '#b91c1c', { stroke: '#7f1d1d', 'stroke-width': 0.8 }),
    path('M45 27.4 H54.6 V31 H45 Z', '#0f172a'), line(48.6, 22.8, 48.6, 26.4, '#facc15', 1.2),
    // Middle shelf: a mask on a stand, a ray gun, a glowing meteorite
    line(15, 60, 15, 50, '#9ca3af', 1.2), rect(11, 58.4, 8, 1.8, '#9ca3af'),
    path('M8.6 46 Q12 43.6 15 45.4 Q18 43.6 21.4 46 Q21.6 50.4 17.6 50.6 Q15.6 50.4 15 48.4 Q14.4 50.4 12.4 50.6 Q8.4 50.4 8.6 46 Z', '#4c1d95'),
    ellipse(12.4, 47.2, 1.6, 1.3, '#2a3550'), ellipse(17.6, 47.2, 1.6, 1.3, '#2a3550'),
    path('M26 50 H38 Q41 50 41 53 H30 L29 58 H26 Z', '#d1d5db', { stroke: '#6b7280', 'stroke-width': 0.8 }),
    rect(38, 50.6, 4.6, 2, '#f472b6'), circle(43.8, 51.6, 1.4, '#f9a8d4', { class: 'p-glow' }), line(30, 50, 30, 47.6, '#6b7280', 1),
    circle(51.6, 54, 7, '#86efac', { 'fill-opacity': 0.25, class: 'p-glow' }),
    path('M45 60 Q44 51 50 49 Q57 48 58 55 Q58.6 60 56 60 Z', '#57534e', { stroke: '#292524', 'stroke-width': 0.8 }),
    path('M48 53 L51 55 L50 58 M53 51 L54 55 L56.6 56', 'none', { stroke: '#4ade80', 'stroke-width': 1, class: 'p-glow' }),
    // Bottom shelf: a folded cape, a gauntlet, an old badge
    path('M9 85 V74 Q9 70 13 70 H27 Q31 70 31 74 V85 Z', '#c81e3a', { stroke: '#7f1d1d', 'stroke-width': 0.8 }),
    path('M9 76 H31 M9 80.4 H31', 'none', { stroke: '#9f1239', 'stroke-width': 0.8 }),
    path('M36 85 V74 Q36 70 41 70 H44 Q47 70 47 74 V85 Z', '#9ca3af', { stroke: '#4b5563', 'stroke-width': 0.8 }),
    path('M37 74 H46 M37 78 H46', 'none', { stroke: '#6b7280', 'stroke-width': 0.8 }),
    circle(54, 79, 4.6, GOLD, { stroke: '#a16207', 'stroke-width': 0.8 }), path(starPath(54, 79.3, 2.8), '#fef3c7'),
    // The glass front
    path('M10 86 L30 10 M18 86 L38 10 M44 86 L56 40', 'none', { stroke: '#ffffff', 'stroke-opacity': 0.12, 'stroke-width': 2.4 }),
    rect(6, 10, 52, 76, 'none', { stroke: '#94a3b8', 'stroke-width': 1, 'stroke-opacity': 0.6 }),
    rect(4, 86.4, 56, 5, '#111827', { rx: 1 }),
  ],
  // The HQ lounge couch: deep navy with red piping, star pillows at the ends.
  sofa: () => [
    rect(6, 6, 138, 32, '#1e2a4a', { rx: 9, stroke: '#0f172a', 'stroke-width': 1.4 }),
    path('M16 12 H134', 'none', { stroke: '#b91c1c', 'stroke-width': 1.4 }),
    ...[[34], [75], [116]].map(([x]) => rect(x - 19, 10, 38, 22, '#24335a', { rx: 6, stroke: '#16203a', 'stroke-width': 1 })),
    rect(4, 28, 142, 15, '#2b3b66', { rx: 6, stroke: '#0f172a', 'stroke-width': 1.3 }),
    path('M54.5 29 V42 M95.5 29 V42', 'none', { stroke: '#1a2440', 'stroke-width': 1.2 }),
    path('M8 36 H142', 'none', { stroke: '#b91c1c', 'stroke-width': 1.2 }),
    rect(0, 18, 14, 28, '#22305a', { rx: 6, stroke: '#0f172a', 'stroke-width': 1.3 }),
    rect(136, 18, 14, 28, '#22305a', { rx: 6, stroke: '#0f172a', 'stroke-width': 1.3 }),
    rect(14, 11, 17, 16, '#b91c1c', { rx: 4, stroke: '#7f1d1d', 'stroke-width': 1, transform: 'rotate(-12 22.5 19)' }),
    path(starPath(22.5, 19.4, 5), GOLD, { transform: 'rotate(-12 22.5 19)' }),
    rect(119, 11, 17, 16, GOLD, { rx: 4, stroke: '#a16207', 'stroke-width': 1, transform: 'rotate(12 127.5 19)' }),
    path(starPath(127.5, 19.4, 5), '#b91c1c', { transform: 'rotate(12 127.5 19)' }),
    rect(14, 43, 5, 18, '#9ca3af', { rx: 1.4 }), rect(131, 43, 5, 18, '#9ca3af', { rx: 1.4 }), rect(72.5, 43, 5, 16, '#9ca3af', { rx: 1.4 }),
  ],
  // A round rug with a big plain star.
  rug: () => [
    ellipse(100, 20, 96, 18.6, '#1e2a4a'),
    ellipse(100, 20, 88, 16.4, '#b91c1c'),
    ellipse(100, 20, 80, 14.6, '#1e2a4a'),
    ellipse(100, 20, 80, 14.6, 'none', { stroke: GOLD, 'stroke-width': 1.2, 'stroke-dasharray': '4 4' }),
    path(starPath(100, 20.6, 62, 26, 0.2), GOLD, { stroke: '#a16207', 'stroke-width': 1 }),
    path(starPath(100, 20.6, 40, 17, 0.2), '#fcd34d'),
  ],
  // An energy-drink machine: a red cabinet, cans behind glass, a lightning bolt, a slot below.
  coffee: () => [
    rect(4, 4, 48, 88, '#b91c1c', { rx: 3, stroke: '#7f1d1d', 'stroke-width': 1.2 }),
    rect(4, 4, 8, 88, '#991b1b', { rx: 3 }),
    path('M24 8 L18 20 H24 L21 30 L32 15 H26 L29 8 Z', '#facc15', { stroke: '#a16207', 'stroke-width': 0.8 }),
    rect(9, 33, 30, 38, '#0f172a', { rx: 1.6 }),
    rect(9, 33, 30, 38, '#38bdf8', { rx: 1.6, 'fill-opacity': 0.12, class: 'p-glow' }),
    ...[38, 50, 62].flatMap((y, row) => [12, 18.6, 25.2, 31.8].map((x, column) => {
      const color = ['#22c55e', '#38bdf8', '#f97316', '#a855f7', '#facc15', '#ef4444'][(row * 4 + column) % 6];
      return rect(x, y, 4.4, 8, color, { rx: 1, stroke: darker(color, 0.35), 'stroke-width': 0.5 });
    })),
    path('M9 47 H39 M9 59 H39', 'none', { stroke: '#64748b', 'stroke-width': 0.8 }),
    path('M11 35 L18 69', 'none', { stroke: '#ffffff', 'stroke-opacity': 0.15, 'stroke-width': 2.4 }),
    rect(41, 35, 8, 22, '#1f2937', { rx: 1.2 }),
    circle(45, 39, 1.4, '#22c55e', { class: 'p-blink-led' }),
    ...[44, 48, 52].map(y => rect(42.6, y, 4.8, 2.4, '#9ca3af', { rx: 0.6 })),
    rect(12, 76, 26, 9, '#111827', { rx: 1.6 }), rect(14, 78, 22, 4, '#374151', { rx: 1 }),
    rect(6, 88, 44, 4, '#7f1d1d'),
  ],
  // A water cooler: a blue jug with rising bubbles on a white cabinet with a star.
  cooler: () => [
    rect(5, 46, 26, 46, '#e5e7eb', { rx: 2, stroke: '#9ca3af', 'stroke-width': 1 }),
    rect(5, 46, 26, 5, '#cbd5e1', { rx: 1.6 }),
    path(starPath(18, 74, 6), '#b91c1c', { stroke: '#7f1d1d', 'stroke-width': 0.7 }),
    rect(8, 56, 7, 4.6, '#ef4444', { rx: 1 }), rect(21, 56, 7, 4.6, '#3b82f6', { rx: 1 }),
    rect(10, 61, 16, 2, '#9ca3af', { rx: 0.8 }),
    path('M8 18 Q8 12 14 11 H22 Q28 12 28 18 V44 Q28 47 25 47 H11 Q8 47 8 44 Z', '#7dd3fc', { 'fill-opacity': 0.85, stroke: '#0284c7', 'stroke-width': 1 }),
    rect(14, 6, 8, 6, '#0284c7', { rx: 1.4 }),
    path('M11 22 V40', 'none', { stroke: '#ffffff', 'stroke-opacity': 0.5, 'stroke-width': 1.6 }),
    circle(19, 40, 1.4, '#e0f2fe', { class: 'cooler-bubble' }), circle(23, 42, 1, '#e0f2fe', { class: 'cooler-bubble cooler-bubble-2' }),
  ],
  // 0: a snake plant in a dark pot with a gold rim (the lounge); 1: a leafy plant in a steel pot with a red band (by the door).
  plant: variant => variant % 2 === 0
    ? [
      group('p-sway',
        ...[[14, 12, -10], [20, 4, -4], [26, 8, 4], [31, 16, 12], [9, 22, -16], [23, 14, 0]].map(([x, top, lean]) =>
          path(`M${x - 2.6} 50 Q${x - 3 + lean * 0.4} ${(top + 50) / 2} ${x + lean * 0.5} ${top} Q${x + 3 + lean * 0.4} ${(top + 50) / 2} ${x + 2.6} 50 Z`, '#3f7a3a', { stroke: '#1f4a1c', 'stroke-width': 0.9 })),
        ...[[14, 30, -10], [26, 28, 4], [20, 22, -4]].map(([x, y, lean]) => path(`M${x - 1 + lean * 0.2} ${y} q1 3 0 6`, 'none', { stroke: '#d9e86a', 'stroke-width': 0.9 }))),
      path('M6 48 H38 L35 70 H9 Z', '#1f2937', { stroke: '#0b0f17', 'stroke-width': 1.2 }),
      rect(5, 46, 34, 4, GOLD, { rx: 1.4, stroke: '#a16207', 'stroke-width': 0.8 }),
    ]
    : [
      group('p-sway p-sway-2',
        line(22, 50, 22, 18, '#2f6b2a', 1.8),
        ...[[10, 24, -30, '#4f9a3a'], [34, 22, 30, '#4f9a3a'], [16, 16, -50, '#5fae46'], [29, 14, 50, '#5fae46'], [14, 36, -20, '#468c33'], [31, 35, 22, '#468c33'],
          [22, 10, 0, '#67b84c'], [8, 40, -40, '#3f8430'], [36, 40, 40, '#3f8430'], [22, 28, 90, '#56a23f']].map(([x, y, angle, color]) =>
          ellipse(x, y, 8.4, 4.6, color, { stroke: '#2c5e22', 'stroke-width': 0.9, transform: `rotate(${angle} ${x} ${y})` })),
        path('M10 24 L16 22 M34 22 L28 21 M22 10 V16', 'none', { stroke: '#2c5e22', 'stroke-width': 0.7 })),
      path('M8 46 H36 V68 Q36 70 34 70 H10 Q8 70 8 68 Z', '#9ca3af', { stroke: '#4b5563', 'stroke-width': 1.2 }),
      rect(8, 54, 28, 4, '#b91c1c'),
      path('M11 48 V68', 'none', { stroke: '#ffffff', 'stroke-opacity': 0.35, 'stroke-width': 1.4 }),
    ],
};

// ---------------------------------------------------------------------------
// Stations (viewBox 68 20 72 96, floor at y = 112)
// ---------------------------------------------------------------------------

const stations = {
  // The HQ console: a city map with blinking alerts, a radar sweep, a status screen and a glowing keyboard.
  console: () => [
    rect(104, 74, 6, 10, '#374151'),
    rect(80, 40, 56, 36, '#1f2937', { rx: 3, stroke: '#111827', 'stroke-width': 1.2 }),
    rect(83, 43, 50, 30, '#0b1530', { rx: 1.4 }),
    path('M83 52 H133 M83 62 H133 M95 43 V73 M110 43 V73 M123 43 V73', 'none', { stroke: '#1e3a8a', 'stroke-width': 0.8 }),
    path('M83 68 Q98 60 108 64 Q120 69 133 58', 'none', { stroke: '#0e7490', 'stroke-width': 2 }),
    ...[[88, 46, 6, 4], [99, 47, 8, 3.4], [113, 46, 6, 4.6], [126, 47, 5, 3], [87, 55, 5, 5], [98, 56, 9, 4], [114, 55, 7, 5], [125, 54, 6, 6]].map(([x, y, width, height]) =>
      rect(x, y, width, height, '#1e40af', { 'fill-opacity': 0.7 })),
    circle(117, 57, 2, '#ef4444', { class: 'p-blink-dot' }), circle(117, 57, 4.6, 'none', { stroke: '#ef4444', 'stroke-width': 0.8, class: 'p-blink-dot' }),
    circle(91, 66, 1.4, '#facc15', { class: 'p-blink-led' }),
    circle(104, 49, 1.4, '#22c55e'),
    circle(74, 54, 9, '#0b1530', { stroke: '#374151', 'stroke-width': 2 }),
    circle(74, 54, 5.6, 'none', { stroke: '#14532d', 'stroke-width': 0.7 }),
    path('M74 54 L74 45.4 A8.6 8.6 0 0 1 81.4 49.6 Z', '#22c55e', { 'fill-opacity': 0.55, class: 'p-dial' }),
    circle(77, 51, 1, '#86efac'),
    rect(73, 82, 64, 6, '#4b5563', { rx: 2, stroke: '#1f2937', 'stroke-width': 1 }),
    rect(84, 82.8, 34, 3.4, '#0f172a', { rx: 1 }),
    path('M86 84.5 H116', 'none', { stroke: '#22d3ee', 'stroke-width': 1.6, 'stroke-dasharray': '2 1.2', class: 'p-screen-line' }),
    circle(124, 84.6, 1.6, '#ef4444'), circle(129, 84.6, 1.6, '#facc15'),
    path('M76 88 H134 L131 112 H79 Z', '#374151', { stroke: '#1f2937', 'stroke-width': 1 }),
    rect(79, 92, 52, 2.4, '#b91c1c', { class: 'p-glow' }),
    path('M86 98 H124 M86 103 H124', 'none', { stroke: '#4b5563', 'stroke-width': 1 }),
    path(starPath(105, 100.6, 4.4), GOLD),
  ],
  // A training corner: a heavy bag swinging on its chain when hit, comic impact bursts, gloves and a dumbbell rack.
  punchbag: () => [
    rect(130, 28, 5, 84, '#4b5563', { rx: 1.2, stroke: '#1f2937', 'stroke-width': 0.8 }),
    rect(96, 26, 39, 5, '#4b5563', { rx: 1.2, stroke: '#1f2937', 'stroke-width': 0.8 }),
    path('M126 108 H140 V112 H122 Z', '#374151'),
    // The bag is mirrored twice so the wobble animation pivots at the chain's top
    svg('g', { transform: 'translate(0 62) scale(1 -1)' },
      svg('g', { class: 'p-wobble' },
        svg('g', { transform: 'translate(0 62) scale(1 -1)' },
          line(101, 31, 101, 40, '#9ca3af', 1.4),
          path('M95 42 L101 39 L107 42', 'none', { stroke: '#9ca3af', 'stroke-width': 1.2 }),
          rect(90, 42, 22, 56, '#b91c1c', { rx: 8, stroke: '#7f1d1d', 'stroke-width': 1.3 }),
          rect(90, 50, 22, 3, '#7f1d1d'), rect(90, 86, 22, 3, '#7f1d1d'),
          path('M94 56 V82', 'none', { stroke: '#ffffff', 'stroke-opacity': 0.3, 'stroke-width': 2, 'stroke-linecap': 'round' }),
          path(starPath(101, 69.6, 5.2), GOLD, { stroke: '#a16207', 'stroke-width': 0.6 })))),
    path('M84 60 L86.4 63.6 L90.4 62 L88.6 66 L92 68.6 L87.6 69 L87.6 73.4 L85 70 L81 72 L82.6 68 L79.4 65.6 L83.6 65 Z', '#fde047', { stroke: '#ca8a04', 'stroke-width': 0.6, class: 'p-spark' }),
    path('M80 50 l1.2 2.4 l2.6 0.4 l-1.9 1.8 l0.4 2.6 l-2.3 -1.2 l-2.3 1.2 l0.4 -2.6 l-1.9 -1.8 l2.6 -0.4 Z', '#fb923c', { class: 'p-spark' }),
    line(129, 44, 125, 52, '#6b7280', 1), line(129, 44, 121, 50, '#6b7280', 1),
    ellipse(124.4, 55.6, 3.6, 4.4, '#dc2626', { stroke: '#7f1d1d', 'stroke-width': 0.8 }), ellipse(120.4, 53.6, 3.6, 4.4, '#ef4444', { stroke: '#7f1d1d', 'stroke-width': 0.8 }),
    rect(96, 104, 26, 3, '#4b5563', { rx: 1 }), rect(98, 107, 3, 5, '#374151'), rect(117, 107, 3, 5, '#374151'),
    ...[101, 112].flatMap(x => [rect(x - 3.6, 99.6, 2.6, 6, NIGHT, { rx: 0.8 }), rect(x + 1, 99.6, 2.6, 6, NIGHT, { rx: 0.8 }), line(x - 1, 102.6, x + 1, 102.6, '#9ca3af', 1.2)]),
  ],
};

export default Object.freeze({
  archetypes: { capedHero, armoredHero, speedster, strongman, sidekick, robotHero },
  decor,
  stations,
});
