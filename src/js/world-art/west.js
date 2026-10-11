// The wild west: a frontier town at sunset - cowhands with wide hats, chaps and spurs, a sheriff with a
// star and a duster coat, a saloon keeper in a bowler hat, a bearded prospector, horse folk and
// homesteaders - and the town's furniture: saloon swinging doors, general-store shelves, hay bales, a
// coffee pot on a campfire, a pump over a trough, cacti in pots and a cowhide rug.
// Original designs for this app: the feel of the genre, no characters or designs from films or shows.
// Coordinates: figure-kit.js (characters), world-layout.js ART (furniture), viewBox 68 20 72 96 (stations).

import { circle, darker, ellipse, lighter, line, path, rect, svg } from '../svg-kit.js';
import {
  BEARD, BUILDS, HAIR, arm, belt, blob, box, buttons, dot, headBase, leg, limb, longGarmentPath, nose, pick,
  pickWeighted, rngOf, shade, shape, stroke, torsoPath,
} from '../figure-kit.js';

const TOON_EYES = Object.freeze({ anchors: [[43, 41], [52, 41]], style: 'toon' });
const WOOD = '#a0683a';
const WOOD_DARK = '#6b4226';
const BRASS = '#d9a83a';
const SILVER = '#c9ced6';
const IRON = '#3f4650';
const ROPE = '#c9a46a';
const HAY = '#e3c26a';

const HUMAN_SKINS = ['#f6d7bd', '#efc8a6', '#e2b38c', '#d29f74', '#b9845a', '#8f5f3c'];
const HAIR_COLORS = ['#2b1d14', '#4a2f1c', '#6b4226', '#8a5a2e', '#b8792f', '#d9b36a', '#1f1a17'];

const round1 = value => Math.round(value * 10) / 10;

// The kit's leg joints (figure-kit.js LEG), for the western boots and chaps drawn here.
const LEG_POINTS = {
  back: { hip: [41, 88], knee: [40.6, 99], ankle: [40.2, 107.5], foot: [41.5, 111] },
  front: { hip: [51, 88], knee: [51.6, 99], ankle: [52.2, 107.5], foot: [54, 111] },
};

// ---------------------------------------------------------------------------
// Western clothes: boots with spurs, chaps, vests, hats
// ---------------------------------------------------------------------------

/** A heeled cowboy boot with a pointed toe and, optionally, a spur with a star rowel at the heel. */
function cowboyBoot(side, color, { spur = true, height = 8 } = {}) {
  const { ankle: [ax, ay], foot: [fx, fy] } = LEG_POINTS[side];
  const top = ay - height;
  const parts = [
    shape(`M${round1(ax - 3.8)} ${top} H${round1(ax + 3.8)} L${round1(ax + 4.2)} ${round1(fy - 3.6)} Q${round1(fx + 3.4)} ${round1(fy - 4.2)} ${round1(fx + 7.4)} ${round1(fy - 0.6)} Q${round1(fx + 7.8)} ${fy + 1} ${fx + 6} ${fy + 1} H${round1(ax - 0.4)} L${round1(ax - 0.8)} ${fy + 2} H${round1(ax - 4.4)} Z`, color),
    stroke(`M${round1(ax - 3.4)} ${top + 2.4} Q${ax} ${top + 4} ${round1(ax + 3.4)} ${top + 2.4}`, lighter(color, 0.3), 0.8),
  ];
  if (spur) {
    const spurX = round1(ax - 7.6);
    const spurY = round1(fy - 0.6);
    parts.push(
      stroke(`M${round1(ax - 4.2)} ${spurY} H${round1(spurX + 1)}`, SILVER, 1.1),
      stroke(`M${spurX} ${round1(spurY - 2.3)} V${round1(spurY + 2.3)} M${round1(spurX - 2.3)} ${spurY} H${round1(spurX + 2.3)} M${round1(spurX - 1.6)} ${round1(spurY - 1.6)} L${round1(spurX + 1.6)} ${round1(spurY + 1.6)} M${round1(spurX - 1.6)} ${round1(spurY + 1.6)} L${round1(spurX + 1.6)} ${round1(spurY - 1.6)}`, '#8a939e', 0.8),
      dot(spurX, spurY, 0.9, SILVER, { 'stroke-width': 0.4 }),
    );
  }
  return parts;
}

/** Leather chaps over one leg, with a fringe down the outer edge. */
function chapsOf(side, color) {
  const { hip: [hx, hy], ankle: [ax, ay] } = LEG_POINTS[side];
  const outer = side === 'back' ? -1 : 1;
  const top = [hx + outer * 4.8, hy - 1];
  const bottom = [ax + outer * 5.2, ay - 5];
  const fringe = [0.12, 0.3, 0.48, 0.66, 0.84].map(share => {
    const x = round1(top[0] + (bottom[0] - top[0]) * share);
    const y = round1(top[1] + (bottom[1] - top[1]) * share);
    return `M${x} ${y} l${outer * 2.6} 1.4`;
  }).join(' ');
  return [
    shape(`M${round1(hx - 4.8)} ${hy - 1} H${round1(hx + 4.8)} L${round1(ax + 5.2)} ${round1(ay - 5)} H${round1(ax - 5.2)} Z`, color),
    stroke(`M${hx} ${hy + 1} L${ax} ${round1(ay - 6)}`, darker(color, 0.2), 0.7, { 'stroke-dasharray': '1.4 1.6' }),
    stroke(fringe, darker(color, 0.15), 1.2),
  ];
}

/** Both legs: trousers, optional chaps, cowboy boots. */
function westernLegs({ trousers, boots, chaps = null, spur = true, width = 7, bootHeight = 8 }) {
  const legOf = side => {
    const { hip, ankle } = LEG_POINTS[side];
    return [limb(...hip, ...ankle, width, trousers), chaps && chapsOf(side, chaps), cowboyBoot(side, boots, { spur, height: bootHeight })];
  };
  return { legBack: legOf('back'), legFront: legOf('front') };
}

/** An open vest: two front panels (the shirt shows between them). */
function vestPanels(build, { bottom = 89, fill = 'cat' } = {}) {
  const { x, width } = BUILDS[build] ?? BUILDS.regular;
  const panel = (edge, toward) => `M${edge} 58 Q${round1(edge + toward * 3.4)} 55.6 ${46 - toward * 4} 56.4 L${round1(46 - toward * 0.6)} 66 L${round1(46 - toward * 0.4)} ${bottom} Q${round1(edge + toward * 4.6)} ${round1(bottom + 1.4)} ${round1(edge + toward * 0.4)} ${round1(bottom - 0.4)} Q${round1(edge - toward * 1.6)} 76 ${edge} 58 Z`;
  return [shape(panel(x + 1, 1), fill), shape(panel(x + width - 1, -1), fill)];
}

/** A closed vest with a V neck and pointed points at the bottom. */
const closedVest = (fill = 'cat') => shape('M38.6 56.6 L46 66 L53.4 56.6 Q56.4 57.6 56.8 62 L57 86 L51.6 85 L46 89.6 L40.4 85 L35 86 L35.2 62 Q35.6 57.6 38.6 56.6 Z', fill);

/** A bandana knotted at the neck, its point hanging over the chest. */
const bandanaOf = color => [
  shape('M37.6 55.2 Q46 60.6 54.4 55.2 L53 58.8 Q49.6 62.4 46 66.4 Q42.4 62.4 39 58.8 Z', color),
  stroke('M40.6 59.4 Q46 62.4 51.4 59.4', darker(color, 0.25), 0.7),
  ...[[42.6, 60.8], [46, 63], [49.4, 60.8]].map(([cx, cy]) => circle(cx, cy, 0.6, '#ffffff', { 'fill-opacity': 0.8 })),
];

/** A six-pointed star badge with a ball on every point. */
function starBadge(cx, cy, size = 3.6, color = '#e8c04a') {
  const points = Array.from({ length: 12 }, (_, index) => {
    const angle = (index * Math.PI) / 6 - Math.PI / 2;
    const radius = index % 2 === 0 ? size : size * 0.5;
    return `${round1(cx + Math.cos(angle) * radius)} ${round1(cy + Math.sin(angle) * radius)}`;
  });
  const tips = Array.from({ length: 6 }, (_, index) => {
    const angle = (index * Math.PI) / 3 - Math.PI / 2;
    return circle(round1(cx + Math.cos(angle) * size), round1(cy + Math.sin(angle) * size), 0.6, color, { stroke: darker(color, 0.4), 'stroke-width': 0.3 });
  });
  return [shape(`M${points.join(' L')} Z`, color), ...tips, circle(cx, cy, size * 0.28, lighter(color, 0.4))];
}

const COWBOY_BRIM = 'M21 26 Q23.6 34 35 34.4 H57 Q68.4 34 71 26 Q67 30.6 57.6 30.4 H34.4 Q25 30.6 21 26 Z';

/** A wide-brimmed cowboy hat: a curled brim, a pinched (or flat) crown and a band. */
function cowboyHat(color, { band = darker(color, 0.45), flat = false } = {}) {
  const crown = flat
    ? 'M35 31.4 Q34 21 35.8 15.6 Q46 13.6 56.2 15.6 Q58 21 57 31.4 Z'
    : 'M34.8 31.4 Q33.4 21 35.8 15 Q39.4 12.2 42.8 15 Q46 12.4 49.2 15 Q52.6 12.2 56.2 15 Q58.6 21 57.2 31.4 Z';
  return [
    shape(COWBOY_BRIM, color),
    stroke('M24.4 28.6 Q29.6 32 35.6 32.4 M56.4 32.4 Q62.4 32 67.6 28.6', lighter(color, 0.3), 0.9),
    shape(crown, color),
    shade('M50.4 14.2 Q53.4 12.6 56.2 15 Q58.6 21 57.2 31.4 H52 Q52.8 22 50.4 14.2 Z', '#000000', 0.13),
    shape('M34.6 26.8 Q46 29 57.4 26.8 L57.3 30.4 Q46 32.6 34.7 30.4 Z', band),
  ];
}

/** A round bowler hat with a narrow curled brim. */
const bowlerHat = color => [
  shape('M35.4 31 Q34.6 16.2 46 15.8 Q57.4 16.2 56.6 31 Z', color),
  shade('M50.4 16.4 Q57 18 56.6 31 H52 Q53.2 22 50.4 16.4 Z', '#000000', 0.15),
  path('M38.6 20 Q41 17.6 44.6 17.2', 'none', { stroke: '#ffffff', 'stroke-opacity': 0.25, 'stroke-width': 1.4, 'stroke-linecap': 'round' }),
  shape('M35.1 27.4 Q46 29.4 56.9 27.4 L56.8 30.4 Q46 32.4 35.2 30.4 Z', darker(color, 0.45)),
  shape('M29.6 31.6 Q30.6 29.4 35 30.2 Q46 32.6 57 30.2 Q61.4 29.4 62.4 31.6 Q61.6 34.2 57.6 33.2 Q46 35.4 34.4 33.2 Q30.4 34.2 29.6 31.6 Z', color),
];

/** A wide straw hat with a colored band. */
function strawHat(band) {
  const straw = '#e9c873';
  return [
    blob(46, 31.6, 25, 5.2, straw),
    stroke('M25 32.4 Q46 37.6 67 32.4 M29 30 Q46 34 63 30', darker(straw, 0.18), 0.6),
    shape('M35.4 31.4 Q34.6 18.4 46 17.8 Q57.4 18.4 56.6 31.4 Z', straw),
    stroke('M38 22 Q46 20 54 22 M36.6 26 Q46 24 55.4 26', darker(straw, 0.18), 0.6),
    shape('M35.2 27.4 Q46 29.6 56.8 27.4 L56.7 30.6 Q46 32.8 35.3 30.6 Z', band),
  ];
}

/** A battered slouch hat with a drooping brim and a patch. */
const slouchHat = (color, patch) => [
  shape('M22.6 34.8 Q27 28.6 46 29 Q65 28.4 69.4 33.4 Q66.4 37 60 34.8 Q46 32.4 33 35.2 Q26 37.8 22.6 34.8 Z', color),
  shape('M35.6 31.4 Q33.6 19 39.4 16.4 Q43.4 18.6 47.4 16 Q53.4 15.2 56.4 20 Q58.2 25 56.8 31.4 Z', color),
  stroke('M38.6 20.6 Q42.6 22.8 46.6 19.8', darker(color, 0.3), 0.9),
  shape('M49.6 21.4 L54.6 20.8 L55 25.6 L50 26.2 Z', patch),
  stroke('M50.2 21.4 l0.2 4.6 M54 20.9 l0.3 4.6', darker(patch, 0.35), 0.5, { 'stroke-dasharray': '0.8 0.8' }),
  shape('M35.4 27.8 Q46 29.8 56.9 27.6 L56.8 30.6 Q46 32.6 35.5 30.8 Z', darker(color, 0.35)),
];

/** A prairie sunbonnet: a deep pleated brim framing the face, tied under the chin (its crown is behind the head). */
const sunbonnetCrown = color => shape('M26.6 46 Q24.4 22 46 19.4 Q67.6 22 65.4 46 Q66 58 58 60.4 L34 60.4 Q26 58 26.6 46 Z', color);
const sunbonnet = color => [
  shape('M26.4 54.4 Q21.4 30 34 20.4 Q46 11.6 58 20.4 Q70.6 30 65.6 54.4 L60 52.6 Q62 35 54.4 28.6 Q46 23 37.6 28.6 Q30 35 32 52.6 Z', color),
  stroke('M28 46 L32.4 45.4 M26.6 36 L31.8 37 M30.4 26.4 L34.6 29.6 M38 19.4 L40.4 25.4 M46 16.6 V23.6 M54 19.4 L51.6 25.4 M61.6 26.4 L57.4 29.6 M65.4 36 L60.2 37 M64 46 L59.6 45.4', darker(color, 0.2), 0.8),
  ...[[36, 23], [46, 19.6], [56, 23], [29, 32], [63, 32], [28.4, 44], [63.6, 44]].map(([cx, cy]) => circle(cx, cy, 0.7, darker(color, 0.32))),
  stroke('M32 52.6 Q38 58 44.6 57.4 M60 52.6 Q54 58 47.4 57.4', darker(color, 0.15), 1.3),
  shape('M46 57.4 l-4 -2.4 v4.8 Z M46 57.4 l4 -2.4 v4.8 Z', darker(color, 0.1)), dot(46, 57.4, 1.1, darker(color, 0.2)),
];

// ---------------------------------------------------------------------------
// Faces: mustaches and hair the figure kit does not have
// ---------------------------------------------------------------------------

const MUSTACHES = {
  horseshoe: color => shape('M41 47.6 Q44 44.4 47.6 46 Q51.2 44.4 54.2 47.6 Q55.6 51.6 54.6 55.2 Q53 51 51 49.6 Q47.6 50.8 44.2 49.6 Q42.2 51 40.6 55.2 Q39.6 51.6 41 47.6 Z', color),
  handlebar: color => shape('M47.6 46 Q44 44.2 40.8 46.4 Q38.4 47.6 37.4 45.2 Q37 48.6 40.4 48.8 Q44 48.8 47.6 47.6 Q51.2 48.8 54.8 48.8 Q58.2 48.6 57.8 45.2 Q56.8 47.6 54.4 46.4 Q51.2 44.2 47.6 46 Z', color),
  walrus: color => shape('M40.6 48.6 Q42 44 47.6 45.2 Q53.2 44 54.6 48.6 Q55 51.4 53.4 51.8 Q52 49.6 47.6 49.8 Q43.2 49.6 41.8 51.8 Q40.2 51.4 40.6 48.6 Z', color),
};

/** Slicked hair with a parting (saloon keepers, sheriffs). */
const slickedHair = color => ({
  back: null,
  front: [shape('M31 40.4 Q30.2 26 46 25.4 Q61.8 26 61 38 Q56 31.6 48 31.2 L46.6 27.8 L45 31.4 Q36.4 31.8 31 40.4 Z', color),
    stroke('M36 31 Q40 28 45 27.6', lighter(color, 0.3), 0.8)],
});

/** Hair gathered up in a bun with a ribbon. */
const bunHair = (color, ribbon) => ({
  back: [dot(37, 25, 6.4, color), stroke('M33 22 Q37 19.4 41 22', darker(color, 0.2), 0.8)],
  front: [shape('M31 41 Q30 25 46 24.6 Q61 25 61 37 Q54 30 46 30.6 Q37 31 33.6 38 Q33 42 33.4 46 Z', color),
    shape('M40.4 21 l-3.4 -3.4 l0.4 5 Z M40.4 21 l1 -4.6 l2.6 4 Z', ribbon), dot(40.4, 21, 1.2, ribbon)],
});

/** A face for a human archetype. */
function humanFace(skin, { hair, brows, beard = null, mustache = null, hat = null, noseSize = 1, mouthY = 47.4, cheeks = null }) {
  return {
    back: hair?.back ?? null,
    base: headBase(skin),
    features: nose(skin, noseSize),
    eyes: TOON_EYES,
    brows,
    beforeMouth: beard,
    mouth: { anchor: [47.6, mouthY] },
    front: [hair?.front ?? null, mustache],
    hat,
    cheeks,
  };
}

// ---------------------------------------------------------------------------
// Things held in the back hand (at about (34,83); they swing with the arm)
// ---------------------------------------------------------------------------

/** A rope drawn with an outline (two strokes). */
const rope = (d, width = 1.5) => [stroke(d, '#7a5a30', width + 1.1), stroke(d, ROPE, width)];

const HELD = {
  lasso: () => [
    ...[[29.6, 91.6, 6.4, 8.4], [31.4, 92, 5.8, 7.8], [33, 92.4, 5.2, 7.2]].flatMap(([cx, cy, rx, ry]) => [
      ellipse(cx, cy, rx, ry, 'none', { stroke: '#7a5a30', 'stroke-width': 2.6 }), ellipse(cx, cy, rx, ry, 'none', { stroke: ROPE, 'stroke-width': 1.5 })]),
    ...rope('M25 98 Q20 104 24 110 Q27 113 31 111'),
  ],
  saddlebag: () => [stroke('M33 83 Q30 80 27 84', '#5e3a1a', 1.4), shape('M23 84 H37 L36.4 99 Q30 101.6 23.6 99 Z', '#8b5a2b'),
    shape('M22.6 84 H37.4 L36.6 91 Q30 93.6 23.4 91 Z', '#6e4423'), box(28.4, 89, 3.2, 4, BRASS, { rx: 0.6 })],
  keys: () => [circle(32.6, 88.6, 3.8, 'none', { stroke: IRON, 'stroke-width': 1.4 }),
    ...[[29.6, 91.4, -12], [33.4, 92.4, 6]].flatMap(([x, y, angle]) => [
      svg('g', { transform: `rotate(${angle} ${x} ${y})` },
        line(x, y, x, y + 9, '#8a7444', 1.6), circle(x, y - 0.4, 1.6, 'none', { stroke: '#8a7444', 'stroke-width': 1.2 }),
        path(`M${x} ${y + 7} h2.6 v1.2 h-1.2 v1 h1.2 v1 h-2.6`, '#8a7444'))])],
  coffeeCup: () => [box(27.6, 79, 8, 8.4, '#3b6ea5', { rx: 1.2 }), stroke('M27.6 81 q-3 0.2 -3 2.6 q0 2.4 3 2.2', '#2a5080', 1.3),
    ...[[30, 82], [33, 84.6], [29.6, 85.4]].map(([cx, cy]) => circle(cx, cy, 0.5, '#ffffff')), blob(31.6, 79, 4, 1.2, '#5a3a22')],
  glass: () => [path('M27.4 75.6 H35.6 L34.8 88 H28.2 Z', '#b0621f', { 'fill-opacity': 0.85, stroke: '#d6dde4', 'stroke-width': 0.9 }),
    blob(31.5, 75.6, 4.6, 1.8, '#fbf3e0'), stroke('M35.4 78 q3 0.4 2.8 3.4 q-0.2 2.6 -3 2.4', '#d6dde4', 1.2),
    stroke('M29.4 79 V86', '#ffffff', 0.7, { 'stroke-opacity': 0.6 })],
  bottle: () => [shape('M28.8 84 Q28.4 78 31.4 76.6 V71 H33.6 V76.6 Q36.6 78 36.2 84 L36 97 H29 Z', '#5f7f3a', { 'fill-opacity': 0.9 }),
    box(31.2, 69.2, 2.6, 2.4, '#8a6a44', { rx: 0.5 }), box(29.6, 86, 5.8, 5, '#efe3c4', { rx: 0.6 }), stroke('M30.4 79 V94', '#ffffff', 0.6, { 'stroke-opacity': 0.4 })],
  towel: () => [shape('M30 80.6 Q34 79 38 81 L37 96 Q35 95 33 97 Q31 95 29 96.4 Z', '#f4f1ea'), stroke('M30.6 88 H37.4 M30.4 90.4 H37.2', '#c0392b', 0.8)],
  pickaxe: () => [limb(34, 102, 34, 57, 2.2, WOOD), shape('M18.6 63 Q25 55 34 55 Q43 55 48.6 61 Q42 57.8 34 58.4 Q26 58.6 18.6 63 Z', '#8e98a3'), box(31.6, 54, 4.8, 5.6, IRON, { rx: 0.8 })],
  goldPan: () => [ellipse(26.6, 87, 10, 3.8, '#7c8692', { stroke: '#4b5563', 'stroke-width': 1 }), ellipse(26.6, 86.4, 7.6, 2.4, '#5b6470'),
    ellipse(26.6, 86.4, 6, 1.6, '#8ec5e8', { 'fill-opacity': 0.7 }), ...[[24, 86.4], [27.6, 85.8], [29.2, 86.8], [25.6, 87]].map(([cx, cy]) => circle(cx, cy, 0.8, '#f5c518', { stroke: '#b38a1e', 'stroke-width': 0.3 }))],
  shovel: () => [limb(34, 50, 34, 98, 2.2, WOOD), stroke('M31 50 H37', WOOD_DARK, 2), shape('M29.4 97 H38.6 L38 107 Q34 111 30 107 Z', '#8e98a3')],
  pitchfork: () => [limb(34, 110, 34, 50, 2, WOOD), shape('M28.4 49.6 Q28.4 52.6 31 52.6 H37 Q39.6 52.6 39.6 49.6 L38.6 49.6 Q38.6 51.4 37 51.4 H31 Q29.4 51.4 29.4 49.6 Z', '#8e98a3'),
    stroke('M28.9 50 V40.4 M34 51 V39.6 M39.1 50 V40.4', '#8e98a3', 1.2)],
  pail: () => [shape('M22.4 87 H37.6 L36.2 100 H23.8 Z', '#b4bcc6'), stroke('M22.6 89.4 H37.4 M23.4 97 H36.6', '#8a939e', 1),
    stroke('M22.4 87 Q30 77.6 37.6 87', '#6b7280', 1), blob(30, 87, 7.4, 1.4, '#f8f6f0')],
  eggBasket: () => [blob(26.6, 85.4, 2.2, 2.8, '#f6ead6'), blob(30.4, 85, 2.2, 2.8, '#e2b98a'), blob(28.6, 84.4, 2.1, 2.7, '#fbf6ec'),
    shape('M21 86 H37 L35 96 Q29 98 23 96 Z', '#c9a064'), stroke('M22 89.4 H36 M23 93 H35 M25 86 L26 96 M29 86 V97 M33 86 L32 96', '#9a7440', 0.7),
    stroke('M22 86 Q29 76.4 36 86', '#9a7440', 1.4)],
  guitar: () => [limb(33, 84, 41, 56, 2, '#5a3a22'), box(38.6, 52, 4, 5.6, '#3a2616', { rx: 1, transform: 'rotate(16 40.6 54.8)' }),
    shape('M22.6 88 Q20 84 23 81.4 Q26 79.6 28 81.6 Q30.6 78.6 34 80.6 Q37.6 83.4 35 87.4 Q38 92 34.4 96.4 Q30 100 25 97.4 Q20.6 94 22.6 88 Z', '#c98a4a'),
    circle(29.2, 88.4, 2.4, '#3a2616'), stroke('M26.4 95 L33.6 84', '#f2e6cf', 0.5), box(25.4, 92.6, 4.6, 1.6, '#5a3a22', { transform: 'rotate(-55 27.7 93.4)' })],
};

/** A pack on the back: a bag, a rolled blanket on top, a frying pan and a tin cup hanging from it. */
const prospectorPack = blanket => [
  shape('M23.6 60 Q23 58 25.6 57.6 H36 L37 86 Q30 88 24.4 86 Z', '#8a6a44'),
  stroke('M24 66 H36.4 M24.2 78 H36.8', '#6b4f30', 1),
  blob(30.4, 56.4, 9.4, 4.4, blanket), stroke('M24.4 54 V58.8 M30.4 52.4 V60.4 M36.4 54 V58.8', darker(blanket, 0.3), 0.8),
  circle(22.6, 76, 4.6, IRON), circle(22.6, 76, 3.2, '#59616c'), stroke('M22.6 71.4 V65', IRON, 1.6),
  box(19.6, 84, 4.6, 4.6, '#b4bcc6', { rx: 0.6 }),
];

/** A horse's tail, flowing from behind the hips. */
const horseTail = color => [
  shape('M36.4 82 Q25 82 21.6 94 Q19.6 103 23.6 111 Q25.6 103 28.6 98 Q32 92 38 88 Z', color),
  stroke('M33 85 Q26 89 24.4 98 M30.6 88 Q27 94 26.6 104', darker(color, 0.25), 0.8),
];

// ---------------------------------------------------------------------------
// Archetypes (looks: figure-kit.js composeFigure)
// ---------------------------------------------------------------------------

/** A cowhand: a wide hat, a bandana, a vest in the category color, chaps, spurred boots and a lasso. */
function cowhand(look) {
  const random = rngOf(look);
  const skin = pick(HUMAN_SKINS, random);
  const isCowgirl = random() < 0.45;
  const hairColor = pick(HAIR_COLORS, random);
  const shirt = pick(['#f1e6d0', '#c8d6e5', '#e9c6a1', '#b33a2e', '#3e6a96', '#e8dcc4', '#7b9466'], random);
  const bandana = pick(['#c0392b', '#2f5d8a', '#e2b33a', '#2b2b2b', '#efe6d4'], random);
  const hatColor = pick(['#8a5a2e', '#c9a273', '#5a3a22', '#e8d8b8', '#3a2a20', '#a0522d', '#6b6158'], random);
  const jeans = pick(['#3f5a7f', '#4b6890', '#36496a', '#5a4632'], random);
  const chaps = random() < 0.6 ? pick(['#8b5a2b', '#a66b3a', '#6e4423', '#c49a6c'], random) : null;
  const boots = pick(['#6e4423', '#3a2a20', '#8b5a2b', '#5a2f1a', '#a0683a'], random);
  const held = pickWeighted([['lasso', 60], [null, 25], ['saddlebag', 15]], random);
  const build = isCowgirl ? 'slim' : pick(['regular', 'regular', 'broad'], random);
  const hair = isCowgirl ? (random() < 0.5 ? HAIR.longWavy(hairColor) : HAIR.braids(hairColor)) : HAIR.shortCrop(hairColor);
  const facialHair = isCowgirl ? null : pickWeighted([[null, 50], ['stubble', 25], ['mustache', 25]], random);
  const sleeves = { style: random() < 0.65 ? 'fitted' : 'rolled', sleeve: shirt, hand: skin };
  const { x, width } = BUILDS[build];
  return {
    shadowWidth: 18,
    ...westernLegs({ trousers: jeans, boots, chaps }),
    armBack: arm('back', sleeves),
    armFront: arm('front', sleeves),
    torso: [
      shape(torsoPath(build), shirt),
      vestPanels(build),
      shade(`M50 57 L46.6 66 L46.4 89 Q52 90.4 ${x + width - 0.6} 88.6 Q${x + width + 1} 74 ${x + width - 1} 58 Q53 55.6 50 57 Z`, '#000000', 0.1),
      ...[[x + 4.6, 66], [x + 4.4, 74], [x + width - 4.6, 66], [x + width - 4.4, 74]].map(([cx, cy]) => circle(cx, cy, 0.9, SILVER, { stroke: '#7c8692', 'stroke-width': 0.4 })),
      belt(build, 84.4, '#5a3a22', SILVER),
      ellipse(46.5, 86.1, 3.2, 2.4, SILVER, { stroke: '#6b7280', 'stroke-width': 0.6 }),
    ],
    overTorso: bandanaOf(bandana),
    held: HELD[held]?.() ?? null,
    head: humanFace(skin, {
      hair,
      brows: darker(hairColor, 0.1),
      beard: facialHair === 'stubble' ? BEARD.stubble(hairColor) : null,
      mustache: facialHair === 'mustache' ? MUSTACHES.walrus(darker(hairColor, 0.05)) : null,
      hat: cowboyHat(hatColor),
      cheeks: isCowgirl ? '#f0a08a' : null,
    }),
  };
}

/** The sheriff: a long open duster coat, a vest in the category color with a star badge, a big mustache. */
function sheriff(look) {
  const random = rngOf(look);
  const skin = pick(HUMAN_SKINS, random);
  const isWoman = random() < 0.3;
  const hairColor = pick(['#2b1d14', '#4a2f1c', '#6b4226', '#9a9590', '#d8d4cc', '#8a5a2e'], random);
  const coat = pick(['#b39a72', '#8a6a48', '#6b5a4a', '#4a4038', '#c2a77a', '#5e4b3c'], random);
  const hatColor = pick(['#2b2420', '#3a2a20', '#5a4a3a', '#c9b48e', '#6b5848'], random);
  const shirt = pick(['#efe6d4', '#d8dee8', '#e9d9bf', '#f4f1ea'], random);
  const trousers = pick(['#4a4038', '#5a4a3a', '#3f4a5a', '#6b5a48'], random);
  const boots = pick(['#2b2420', '#4a2f1c', '#5a3a22'], random);
  const held = pickWeighted([['keys', 45], [null, 35], ['coffeeCup', 20]], random);
  const hair = isWoman ? (random() < 0.5 ? HAIR.braids(hairColor) : HAIR.longStraight(hairColor)) : slickedHair(hairColor);
  const mustache = isWoman ? null : pickWeighted([['horseshoe', 45], ['handlebar', 40], [null, 15]], random);
  const coatEdge = darker(coat, 0.25);
  const sleeves = { sleeve: coat, hand: skin, cuff: coatEdge, width: 6.4 };
  return {
    shadowWidth: 19,
    behind: [shape('M33 56 Q46 52 59 56 L64.6 104.6 Q46 107.6 27.4 104.6 Z', coat), stroke('M46 80 V106', coatEdge, 0.9)],
    ...westernLegs({ trousers, boots }),
    armBack: arm('back', sleeves),
    armFront: arm('front', sleeves),
    torso: [
      shape(torsoPath('regular'), shirt),
      closedVest(),
      buttons(46, [71, 76, 81], '#e5e7eb', 0.9),
      starBadge(51.6, 66.6),
      belt('regular', 85.6, '#3a2a20', SILVER),
    ],
    overTorso: [
      shape('M33 55.6 Q36.4 54.4 39.8 56 L38.4 70 L37.8 104.4 Q32 105.6 28.4 104 Q30.4 80 33 55.6 Z', coat),
      shape('M59 55.6 Q55.6 54.4 52.2 56 L53.6 70 L54.2 104.4 Q60 105.6 63.6 104 Q61.6 80 59 55.6 Z', coat),
      shade('M59 55.6 Q55.6 54.4 52.2 56 L53.6 70 L54.2 104.4 Q60 105.6 63.6 104 Q61.6 80 59 55.6 Z', '#000000', 0.08),
      shape('M39.8 56 L42.6 62.6 L38.6 66 Z', coatEdge), shape('M52.2 56 L49.4 62.6 L53.4 66 Z', coatEdge),
      stroke('M38.8 66 L37.8 104 M53.2 66 L54.2 104', coatEdge, 0.8),
    ],
    held: HELD[held]?.() ?? null,
    head: humanFace(skin, {
      hair,
      brows: darker(hairColor, 0.15),
      beard: !isWoman && random() < 0.3 ? BEARD.stubble(hairColor) : null,
      mustache: mustache && MUSTACHES[mustache](darker(hairColor, 0.05)),
      mouthY: 48.4,
      hat: cowboyHat(hatColor, { flat: random() < 0.5 }),
    }),
  };
}

/** The saloon keeper: a bowler hat, a white shirt with sleeve garters, a vest in the category color, a long apron. */
function saloonKeeper(look) {
  const random = rngOf(look);
  const skin = pick(HUMAN_SKINS, random);
  const isWoman = random() < 0.35;
  const hairColor = pick(['#1f1a17', '#2b1d14', '#4a2f1c', '#6b4226', '#8a3b1a', '#9a9590'], random);
  const shirt = pick(['#f6f1e6', '#f3ecdf', '#e6ecf2'], random);
  const garter = pick(['#b33a2e', '#1f2937', '#2f5d8a', '#3f6b3a'], random);
  const trousers = pick(['#2f2a28', '#3a3434', '#4a4038'], random);
  const apron = '#f4f1ea';
  const hatColor = pick(['#2b2420', '#4a3a2c', '#5a5550', '#6b4a2e'], random);
  const wearsHat = random() < (isWoman ? 0.25 : 0.7);
  const held = pickWeighted([['glass', 40], ['towel', 25], ['bottle', 15], [null, 20]], random);
  const hair = isWoman ? bunHair(hairColor, garter) : slickedHair(hairColor);
  // A band around the upper arm, across the sleeve.
  const garterBand = side => shape(side === 'back' ? 'M32.8 65.8 L39.9 66.8 L39.6 69 L32.5 68 Z' : 'M52.1 66.8 L59.2 65.8 L59.5 68 L52.4 69 Z', garter);
  const sleeves = { sleeve: shirt, hand: skin, width: 6 };
  return {
    shadowWidth: 17,
    legBack: leg('back', { trousers, feet: 'shoe', shoes: '#1f1a17' }),
    legFront: leg('front', { trousers, feet: 'shoe', shoes: '#1f1a17' }),
    armBack: [arm('back', sleeves), garterBand('back')],
    armFront: [arm('front', sleeves), garterBand('front')],
    torso: [
      shape(torsoPath(isWoman ? 'slim' : 'regular'), shirt),
      closedVest(),
      buttons(46, [70.6, 75, 79.4], BRASS, 0.95),
      stroke('M46.4 72.8 Q50 76.6 54.6 73.6', BRASS, 0.7),
      shape('M34.2 82.4 H57.8 L59.6 104.4 Q46 107 32.4 104.4 Z', apron),
      stroke('M34.2 83.6 H57.8', '#d6d0c4', 1.2),
      stroke('M40 88 L39 103 M52 88 L53 103', '#d6d0c4', 0.7),
      isWoman
        ? shape('M42.6 56.4 Q46 59.6 49.4 56.4 L48.4 59.6 Q46 61.4 43.6 59.6 Z', garter)
        : [shape('M41.6 56.6 L46 58.8 L41.6 61 Z', '#1f1a17'), shape('M50.4 56.6 L46 58.8 L50.4 61 Z', '#1f1a17'), dot(46, 58.8, 1, '#1f1a17')],
    ],
    held: HELD[held]?.() ?? null,
    head: humanFace(skin, {
      hair,
      brows: darker(hairColor, 0.1),
      mustache: isWoman ? null : (random() < 0.7 ? MUSTACHES.handlebar(darker(hairColor, 0.05)) : null),
      mouthY: 48,
      hat: wearsHat ? bowlerHat(hatColor) : null,
      cheeks: isWoman ? '#f0a08a' : null,
    }),
  };
}

/** A prospector: a battered slouch hat, a huge bushy beard, a shirt in the category color, suspenders, a pick or a gold pan. */
function prospector(look) {
  const random = rngOf(look);
  const skin = pick(['#efc8a6', '#e2b38c', '#d29f74', '#c08458', '#a8714a', '#8f5f3c'], random);
  const beardColor = pick(['#d8d4cc', '#a8a29e', '#b5651d', '#6b4a2e', '#eeebe4', '#8a6a4a'], random);
  const hatColor = pick(['#7a6a52', '#5e5040', '#8a6a44', '#4a4038', '#9a8a6a'], random);
  const patch = pick(['#a0522d', '#6b7f3a', '#3e5a7a', '#c9a273'], random);
  const trousers = pick(['#7a6a52', '#6b5a3a', '#5e5648', '#6a5a4a'], random);
  const suspenders = pick(['#5a3a22', '#8a2f2a', '#3a3a3a'], random);
  const build = pick(['regular', 'round', 'slim'], random);
  const held = pickWeighted([['pickaxe', 40], ['goldPan', 35], ['shovel', 15], [null, 10]], random);
  const hasPack = random() < 0.55;
  const legs = { trousers, feet: 'boot', shoes: pick(['#4a3626', '#3b2c22', '#5a4030'], random), width: 7.2 };
  const { x, width } = BUILDS[build];
  return {
    shadowWidth: 18,
    behind: hasPack ? prospectorPack(pick(['#8a2f2a', '#3e5a7a', '#6b7f3a', '#9a7a4a'], random)) : null,
    legBack: leg('back', legs),
    legFront: [leg('front', legs), box(49.4, 95.4, 5.2, 5, patch, { rx: 0.8, transform: 'rotate(-6 52 98)' })],
    armBack: arm('back', { style: 'rolled', sleeve: 'cat', hand: skin }),
    armFront: arm('front', { style: 'rolled', sleeve: 'cat', hand: skin }),
    torso: [
      shape(torsoPath(build), 'cat'),
      shade(`M50 56 Q${x + width - 3} 55 ${x + width} ${65} Q${x + width + 1} 78 ${x + width - 1} 91 Q52 93 50 93 Z`, '#000000', 0.1),
      stroke('M46 56.6 V68', 'cat-dark', 1.4),
      buttons(47.2, [59.6, 63.2, 66.8], '#efe6d4', 0.8),
      stroke(`M${x + 6} 56.6 L${x + 7} 89 M${x + width - 6} 56.6 L${x + width - 7} 89`, suspenders, 2),
      stroke(`M${x + 1} 88.6 Q46 91 ${x + width - 1} 88.6`, ROPE, 1.6),
    ],
    held: HELD[held]?.() ?? null,
    headScale: 1.04,
    head: {
      back: null,
      base: headBase(skin),
      features: [blob(53.2, 44.8, 3.4, 2.8, darker(skin, 0.06)), circle(54.4, 44.4, 1.2, '#e8a090', { 'fill-opacity': 0.6 })],
      eyes: TOON_EYES,
      brows: darker(beardColor, 0.2),
      beforeMouth: [BEARD.long(beardColor), stroke('M33.4 46 Q31 56 33 63', darker(beardColor, 0.15), 0.9)],
      mouth: { anchor: [47.6, 49.4] },
      front: [MUSTACHES.walrus(darker(beardColor, 0.04)), stroke('M31.6 44 Q31 38 33 34 M60.6 41 Q61 37 59.4 34', beardColor, 2.4)],
      hat: slouchHat(hatColor, patch),
    },
  };
}

/** Horse folk: a horse's head with a mane and a long face, a vest in the category color, hooves, a tail. */
function horsefolk(look) {
  const random = rngOf(look);
  const coat = pick(['#9a5a32', '#7a4a2a', '#d9b26a', '#a8a29e', '#3b3030', '#efe8dc', '#b5651d'], random);
  const isLight = ['#d9b26a', '#efe8dc', '#a8a29e'].includes(coat);
  const mane = coat === '#d9b26a' ? '#f6efdc' : isLight ? darker(coat, 0.35) : darker(coat, 0.5);
  const muzzle = coat === '#3b3030' ? '#6a5a56' : lighter(coat, 0.3);
  const hoof = '#3a2e28';
  const hasBlaze = random() < 0.5;
  const hasSocks = random() < 0.45;
  const hasHat = random() < 0.6;
  const hatColor = pick(['#8a5a2e', '#e8d8b8', '#3a2a20', '#c9a273', '#a0522d'], random);
  const shirt = pick(['#f1e6d0', '#c8d6e5', '#b33a2e', '#3e6a96', '#e9c6a1'], random);
  const bandana = pick(['#c0392b', '#2f5d8a', '#e2b33a', '#efe6d4'], random);
  const held = pickWeighted([['lasso', 30], [null, 40], ['guitar', 30]], random);
  const legOf = side => {
    const { hip, knee, ankle, foot: [fx, fy] } = LEG_POINTS[side];
    return [
      limb(...hip, ...ankle, 8, coat),
      hasSocks && limb(...knee, ...ankle, 7.2, '#f4efe6'),
      shape(`M${round1(ankle[0] - 4.2)} ${fy - 4.4} H${round1(ankle[0] + 4.4)} Q${round1(fx + 4.6)} ${fy - 4} ${round1(fx + 5.2)} ${fy + 1.6} H${round1(ankle[0] - 4.6)} Z`, hoof),
    ];
  };
  const ears = [shape('M38.8 27.4 L36.2 15.4 L43.6 23.8 Z', coat), shape('M45.2 23.6 L48.4 12.4 L52.6 24.2 Z', coat), stroke('M47.6 22.6 L48.6 16.2 L50.6 22.6', darker(coat, 0.3), 0.8)];
  return {
    shadowWidth: 19,
    behind: horseTail(mane),
    legBack: legOf('back'),
    legFront: legOf('front'),
    armBack: arm('back', { sleeve: shirt, hand: hoof, width: 6.6 }),
    armFront: arm('front', { sleeve: shirt, hand: hoof, width: 6.6 }),
    torso: [shape(torsoPath('regular'), shirt), vestPanels('regular'), shade('M50 57 L46.6 66 L46.4 89 Q52 90.4 57.4 88.6 Q59 74 57 58 Q53 55.6 50 57 Z', '#000000', 0.1),
      belt('regular', 84.4, '#5a3a22', SILVER)],
    overTorso: bandanaOf(bandana),
    held: HELD[held]?.() ?? null,
    headScale: 1.04,
    head: {
      back: [shape('M40.4 23.4 Q31.6 25.6 30 36 Q29 46 32.4 57 L38.6 56 Q35.6 46 36.4 38 Q37.4 30 42.4 26 Z', mane),
        stroke('M36.6 28 Q33 34 33 42 M35 46 Q35 51 36 55', darker(mane, 0.2), 0.8)],
      base: [shape('M33.6 46 Q30 32 38 25.4 Q45 20.6 53 23.4 Q58.6 25.8 60.4 32 Q61.6 37 64.6 41.6 Q68.6 47 66.6 52.4 Q64.2 57.6 57.4 56.8 Q52.4 56.2 49 53.2 Q45 55.4 40.4 53.8 Q35.4 51.8 33.6 46 Z', coat), ...ears],
      features: [
        hasBlaze && shape('M50.6 26 Q53.6 26.4 54.6 30 Q57.6 38 62.6 44.6 Q60 46 58.4 44 Q54 37 50.6 26 Z', '#f6f1e6', { class: 'p-no-outline', stroke: 'none' }),
        ellipse(61.6, 50.6, 6, 5, muzzle),
        ellipse(64.8, 48.8, 1.1, 1.7, darker(coat, 0.55)),
        shade('M38 46 Q42 52 48 52.4 Q44 49 42.6 44 Z', '#000000', 0.08),
      ],
      eyes: { anchors: [[46.4, 36.8], [54.4, 36]], style: 'toon' },
      brows: darker(mane, 0.1),
      mouth: { anchor: [60.4, 54.4], width: 0.55 },
      front: shape('M41.6 23.6 Q45.4 17.4 51 20.6 Q48.6 22.8 49.4 28 Q46.4 24.2 41.6 23.6 Z', mane),
      hat: hasHat ? [svg('g', { transform: 'translate(45 26.6) scale(0.74) translate(-46 -31)' }, cowboyHat(hatColor)), shape('M45.2 21 L48.4 12.4 L51.6 20.4 Z', coat)] : null,
    },
  };
}

/** Homesteaders: a farmer in a straw hat and overalls in the category color with a pitchfork, or a homesteader in a sunbonnet and a long dress. */
function homesteader(look) {
  const random = rngOf(look);
  const skin = pick(HUMAN_SKINS, random);
  const hairColor = pick(HAIR_COLORS, random);
  const isFarmer = random() < 0.55;
  if (isFarmer) {
    const plaid = pick(['#c0392b', '#2f5d8a', '#3f7a4a', '#c8941a', '#7a3a6a'], random);
    const held = pickWeighted([['pitchfork', 60], ['pail', 20], [null, 20]], random);
    const sleeves = { style: random() < 0.5 ? 'rolled' : 'fitted', sleeve: plaid, hand: skin };
    const legs = { trousers: 'cat', feet: 'boot', shoes: pick(['#5a3a22', '#3b2c22', '#6e4423'], random), width: 7.4 };
    return {
      shadowWidth: 18,
      legBack: leg('back', legs),
      legFront: leg('front', legs),
      armBack: arm('back', sleeves),
      armFront: arm('front', sleeves),
      torso: [
        shape(torsoPath('regular'), plaid),
        stroke('M36 61 H56 M35 67 H57 M40 56.4 V70 M46 56 V70 M52 56.4 V70', lighter(plaid, 0.35), 0.9),
        shape('M37.4 64 H54.6 L56 76 L57.6 91.4 Q46 94 34.4 91.4 L36 76 Z', 'cat'),
        shape('M41.6 68 H50.4 V75 Q46 76.4 41.6 75 Z', 'cat-dark'),
        stroke('M38.4 64.4 L36.6 56.6 M53.6 64.4 L55.4 56.6', 'cat', 2.6),
        dot(38.6, 65.4, 1.2, BRASS), dot(53.4, 65.4, 1.2, BRASS),
      ],
      held: HELD[held]?.() ?? null,
      head: humanFace(skin, {
        hair: HAIR.shortCrop(hairColor),
        brows: darker(hairColor, 0.1),
        beard: random() < 0.35 ? pick([BEARD.short(hairColor), BEARD.stubble(hairColor)], random) : null,
        hat: strawHat(pick(['#b33a2e', '#2f5d8a', '#3a3434', '#6b7f3a'], random)),
        cheeks: '#f0a08a',
      }),
    };
  }
  const bonnet = pick(['#f3d9c8', '#d8e4f0', '#efe3b8', '#e6d0e8', '#dcebd4'], random);
  const held = pickWeighted([['eggBasket', 40], ['pail', 30], [null, 30]], random);
  const sleeves = { style: 'puffy', sleeve: 'cat', hand: skin, width: 5.6 };
  return {
    shadowWidth: 17,
    legBack: leg('back', { trousers: 'cat-dark', feet: 'boot', shoes: '#3b2c22', width: 6 }),
    legFront: leg('front', { trousers: 'cat-dark', feet: 'boot', shoes: '#3b2c22', width: 6 }),
    armBack: arm('back', sleeves),
    armFront: arm('front', sleeves),
    torso: [
      shape(longGarmentPath('slim', { hem: 108, flare: 7 }), 'cat'),
      shade('M50 58 L55.5 66 L62.5 108 Q56 109 52 109 Z', '#000000', 0.1),
      shape('M37.4 72 H54.6 L57.6 104 Q46 106.4 34.4 104 Z', '#f6f2e8'),
      stroke('M37.4 72.8 H54.6', '#d8d0c0', 1.4),
      shape('M40 56 Q46 61 52 56 L51 59.4 Q46 63 41 59.4 Z', '#f6f2e8'),
      stroke('M30.6 106.6 Q46 110.4 61.4 106.6', 'cat-dark', 1.4),
    ],
    held: HELD[held]?.() ?? null,
    head: humanFace(skin, {
      hair: { back: sunbonnetCrown(bonnet), front: shape('M35 34.6 Q46 27.4 57 34.6 Q51.6 31.6 46 32.2 Q40.4 31.6 35 34.6 Z', hairColor) },
      brows: darker(hairColor, 0.1),
      hat: sunbonnet(bonnet),
      cheeks: '#f0a08a',
    }),
  };
}

// ---------------------------------------------------------------------------
// Furniture (world-layout.js ART sizes)
// ---------------------------------------------------------------------------

/** A hay bale seen from the front: straw texture and two twine bands. */
function hayBale(x, y, width, height) {
  const straws = [];
  for (let row = 0; row < 3; row += 1) {
    for (let index = 0; index < Math.floor(width / 7); index += 1) {
      const strawX = round1(x + 3 + index * 7 + (row % 2) * 3.4);
      const strawY = round1(y + 4 + row * (height - 8) / 2.4);
      if (strawX < x + width - 3) straws.push(`M${strawX} ${strawY} l2.4 ${index % 2 ? 1.4 : -1.2}`);
    }
  }
  return [
    rect(x, y, width, height, HAY, { rx: 3, stroke: '#a8822e', 'stroke-width': 1.1 }),
    rect(x + 1.4, y + 1.4, width - 2.8, height * 0.36, '#f0d88a', { rx: 2 }),
    path(straws.join(' '), 'none', { stroke: '#c49a3a', 'stroke-width': 0.8, 'stroke-linecap': 'round' }),
    line(round1(x + width * 0.28), y + 0.6, round1(x + width * 0.28), y + height - 0.6, '#8a5a2e', 1.4),
    line(round1(x + width * 0.72), y + 0.6, round1(x + width * 0.72), y + height - 0.6, '#8a5a2e', 1.4),
    path(`M${x + 2} ${y + height} l-2.4 2 M${round1(x + width * 0.5)} ${y + height} l1 2.4 M${x + width - 2} ${y + height} l2.4 2`, 'none', { stroke: '#c49a3a', 'stroke-width': 1, 'stroke-linecap': 'round' }),
  ];
}

/** A potted cactus arm (a saguaro arm bending up). */
const cactusRibs = (x, top, bottom, color) => path(`M${x - 2} ${top + 3} V${bottom} M${x + 2} ${top + 3} V${bottom}`, 'none', { stroke: darker(color, 0.2), 'stroke-width': 0.8 });

const decor = {
  // The saloon's entrance: a wooden frame, a lamp-lit doorway and the swinging batwing doors.
  door: () => [
    path('M-2 12 H52 V92 H-2 Z', '#a0683a', { stroke: '#5e3a1a', 'stroke-width': 1.2 }),
    path('M5 12 V92 M45 12 V92', 'none', { stroke: '#7a4a28', 'stroke-width': 0.8 }),
    path('M-4 4 H54 L52 12 H-2 Z', '#7a4a28', { stroke: '#5e3a1a', 'stroke-width': 1 }),
    path('M8 0 H42 L40 4 H10 Z', '#8a5a32', { stroke: '#5e3a1a', 'stroke-width': 0.8 }),
    rect(8, 16, 34, 74, '#3a2416'),
    rect(8, 16, 34, 30, '#f2b45a', { 'fill-opacity': 0.35, class: 'p-glow' }),
    path('M12 20 h8 v12 h-8 Z M30 20 h8 v12 h-8 Z', '#ffd98a', { 'fill-opacity': 0.5 }),
    rect(6.4, 14.4, 37.2, 2.4, '#5e3a1a'),
    rect(5, 14, 3.4, 78, '#7a4a28', { stroke: '#4a2c16', 'stroke-width': 0.8 }), rect(41.6, 14, 3.4, 78, '#7a4a28', { stroke: '#4a2c16', 'stroke-width': 0.8 }),
    path('M8.6 40 Q16.4 35 24.6 38.6 V68 H8.6 Z', '#b5793f', { stroke: '#5e3a1a', 'stroke-width': 1 }),
    path('M41.4 40 Q33.6 35 25.4 38.6 V68 H41.4 Z', '#b5793f', { stroke: '#5e3a1a', 'stroke-width': 1 }),
    path('M10.6 44.6 H22.6 M10.6 48.6 H22.6 M10.6 52.6 H22.6 M10.6 56.6 H22.6 M10.6 60.6 H22.6 M27.4 44.6 H39.4 M27.4 48.6 H39.4 M27.4 52.6 H39.4 M27.4 56.6 H39.4 M27.4 60.6 H39.4', 'none', { stroke: '#7a4a28', 'stroke-width': 1.1 }),
    circle(22.6, 54, 0.9, BRASS), circle(27.4, 54, 0.9, BRASS),
    rect(-3, 88, 56, 4.6, '#8a5a32', { stroke: '#5e3a1a', 'stroke-width': 0.8 }),
    line(-0.6, 30, -0.6, 22, '#3a3434', 1.2), path('M-4 30 H3 L2 39 H-3 Z', '#3a3434'), rect(-2.6, 31, 4.2, 6.6, '#ffd97a', { class: 'p-glow' }),
  ],
  // General-store shelves: tin cans, jars, oil lanterns, a coffee grinder, sacks and a coil of rope.
  shelf: () => [
    rect(2, 6, 60, 86, '#8a5a32', { rx: 1.6, stroke: '#5e3a1a', 'stroke-width': 1.2 }),
    path('M-1 6 H65 V11 H-1 Z', '#6e4423', { stroke: '#4a2c16', 'stroke-width': 1 }),
    rect(6, 12, 52, 76, '#5e3a1f'),
    rect(5, 36, 54, 3, '#a0683a'), rect(5, 62, 54, 3, '#a0683a'),
    ...[[9, '#c0392b'], [16, '#d9a83a'], [23, '#2f5d8a'], [30, '#c0392b'], [37, '#6b7f3a']].flatMap(([x, color]) => [
      rect(x - 3, 24, 6, 12, '#c9ced6', { stroke: '#7c8692', 'stroke-width': 0.6 }), rect(x - 3, 27, 6, 5, color)]),
    ...[[45, '#e9c873'], [53, '#8a3b1a']].flatMap(([x, color]) => [rect(x - 3.6, 22, 7.2, 14, '#dfe8ec', { rx: 1.4, 'fill-opacity': 0.8, stroke: '#9aa7b0', 'stroke-width': 0.6 }),
      rect(x - 3, 26, 6, 9.4, color, { rx: 1 }), rect(x - 3.4, 20.6, 6.8, 2.4, '#8a6a44', { rx: 0.6 })]),
    ...[14, 30].flatMap(x => [path(`M${x - 4} 61 H${x + 4} L${x + 3} 59 H${x - 3} Z`, '#3f4650'),
      rect(x - 3.4, 47, 6.8, 12, '#ffe7a6', { rx: 2, 'fill-opacity': 0.9, stroke: '#3f4650', 'stroke-width': 1 }),
      path(`M${x - 4} 47 Q${x} 41 ${x + 4} 47 Z`, '#3f4650'), path(`M${x} 41 V38.6`, 'none', { stroke: '#3f4650', 'stroke-width': 1 }),
      path(`M${x} 49.4 q-1.4 2.4 0 4.6 q1.4 -2.2 0 -4.6 Z`, '#ff9f2e', { class: 'flame' })]),
    rect(40, 50, 14, 11, '#8a5a32', { stroke: '#4a2c16', 'stroke-width': 0.8 }), rect(42.6, 46, 8.8, 4, '#3f4650'),
    path('M47 46 V41.6 H52', 'none', { stroke: '#3f4650', 'stroke-width': 1.2 }), circle(52.4, 41.6, 1.2, '#c0392b'),
    path('M8 88 Q6 74 15 70 Q24 74 22 88 Z', '#c9a46a', { stroke: '#8a6a3a', 'stroke-width': 0.8 }),
    path('M12 70 Q15 66 18 70', 'none', { stroke: '#8a6a3a', 'stroke-width': 1 }),
    path('M25 88 Q24 76 32 73 Q40 76 39 88 Z', '#e6dcc4', { stroke: '#a89878', 'stroke-width': 0.8 }),
    path('M28.6 79 H35.4', 'none', { stroke: '#c0392b', 'stroke-width': 1.4 }),
    ...[[50, 81, 7.4], [50, 81, 5], [50, 81, 2.6]].map(([cx, cy, r]) => ellipse(cx, cy, r, r * 0.86, 'none', { stroke: '#a8824a', 'stroke-width': 1.8 })),
  ],
  // Hay bales to sit on, a row of bales behind as the backrest and a saddle on top.
  sofa: () => [
    ...hayBale(6, 6, 46, 28), ...hayBale(52, 4, 46, 30), ...hayBale(98, 6, 46, 28),
    ...[[34, 30], [75, 30], [116, 30]].flatMap(([x, y]) => hayBale(x - 20, y, 40, 32)),
    // A coil of rope on the left bale and a cowboy hat resting on the right one.
    ...[[24, 6, 9, 3.2], [24, 4.6, 6.6, 2.4], [24, 3.4, 4.2, 1.6]].flatMap(([cx, cy, rx, ry]) => [
      ellipse(cx, cy, rx, ry, 'none', { stroke: '#7a5a30', 'stroke-width': 2.6 }), ellipse(cx, cy, rx, ry, 'none', { stroke: ROPE, 'stroke-width': 1.5 })]),
    ellipse(124, 6.4, 17, 3.6, '#8a5a2e', { stroke: '#4a2c16', 'stroke-width': 1 }),
    path('M116 6 Q115 -4 117.6 -8 Q121 -10 124 -7.6 Q127 -10 130.4 -8 Q133 -4 132 6 Z', '#8a5a2e', { stroke: '#4a2c16', 'stroke-width': 1 }),
    path('M115.8 2.4 Q124 4.4 132.2 2.4 L132 5.6 Q124 7.4 116 5.6 Z', '#4a2c16'),
  ],
  // A cowhide rug.
  rug: () => [
    path('M22 8 Q30 2 40 6 Q60 1 100 3 Q140 1 160 6 Q170 2 178 8 Q186 6 192 12 Q186 18 194 26 Q186 30 180 33 Q170 39 160 34 Q140 38 100 37 Q60 39 40 34 Q30 39 20 33 Q14 30 6 26 Q14 18 8 12 Q14 6 22 8 Z', '#f3ece0', { stroke: '#c9bba4', 'stroke-width': 1.2 }),
    path('M34 10 Q46 6 54 12 Q58 20 48 24 Q38 22 34 16 Z', '#4a3324'),
    path('M78 18 Q90 10 104 14 Q114 20 106 28 Q94 34 82 30 Q72 26 78 18 Z', '#5a3d2a'),
    path('M134 8 Q148 6 156 12 Q156 20 146 22 Q136 18 134 8 Z', '#2f2420'),
    path('M150 26 Q160 24 168 28 Q164 33 154 33 Z', '#4a3324'),
    path('M24 26 Q30 22 36 26 Q34 32 26 31 Z', '#2f2420'),
    path('M120 30 Q126 28 130 32 Q125 35 120 33 Z', '#5a3d2a'),
  ],
  // A coffee pot hanging from a tripod over a campfire, a tin cup on a stone.
  coffee: () => [
    line(6, 92, 28, 26, '#6e4423', 2.2), line(50, 92, 28, 26, '#6e4423', 2.2),
    line(28, 27, 28, 42, '#3f4650', 1),
    ellipse(28, 88, 22, 4.4, '#3a2a20', { 'fill-opacity': 0.35 }),
    ...[[10, 87], [17, 90], [26, 91], [35, 90.4], [43, 87.4], [46, 84], [8, 83.6]].map(([cx, cy]) => ellipse(cx, cy, 4.4, 3, '#9a8f84', { stroke: '#6b6158', 'stroke-width': 0.8 })),
    path('M14 86 L42 80 M14 80 L42 86', 'none', { stroke: '#6e4423', 'stroke-width': 3.2, 'stroke-linecap': 'round' }),
    path('M19 83 Q20 72 24 68 Q24 75 27 77 Q28 66 32 62 Q32 71 35 74 Q37 70 38 68 Q40 76 37 83 Z', '#f59e0b', { class: 'flame' }),
    path('M23 83 Q24 76 27 73 Q28 78 30 79 Q31 74 33 72 Q35 78 33 83 Z', '#fde68a', { class: 'flame' }),
    circle(28, 76, 12, '#ffb347', { 'fill-opacity': 0.18, class: 'p-glow' }),
    path('M21 46 Q21 42 28 42 Q35 42 35 46 L37 60 Q37 64 28 64 Q19 64 19 60 Z', '#3b6ea5', { stroke: '#22446e', 'stroke-width': 1 }),
    path('M22.6 42.4 Q28 39 33.4 42.4 Z', '#2f5d8a', { stroke: '#22446e', 'stroke-width': 0.8 }), circle(28, 40.4, 1.4, '#22446e'),
    path('M35 50 Q41 48 42 43', 'none', { stroke: '#3b6ea5', 'stroke-width': 2.2, 'stroke-linecap': 'round' }),
    path('M19.6 48 Q14 50 16 56 Q17 59 19.6 58', 'none', { stroke: '#22446e', 'stroke-width': 1.4 }),
    ...[[24, 48], [31, 52], [26, 57], [33, 59], [22, 54], [29, 45.4]].map(([cx, cy]) => circle(cx, cy, 0.7, '#e6eef8')),
    path('M42 41 q-2 -3 0 -6 q2 -3 0 -6', 'none', { stroke: '#f1f5f9', 'stroke-width': 1.4, 'stroke-linecap': 'round', class: 'p-steam' }),
    ellipse(50, 90, 6, 3, '#9a8f84', { stroke: '#6b6158', 'stroke-width': 0.8 }),
    path('M46.6 82 H53.4 L53 88.6 H47 Z', '#c9ced6', { stroke: '#7c8692', 'stroke-width': 0.7 }),
  ],
  // A cast-iron hand pump on a post over a wooden water trough.
  cooler: () => [
    path('M-2 72 H38 L36 92 H0 Z', '#8a5a32', { stroke: '#4a2c16', 'stroke-width': 1.1 }),
    path('M-1 79 H37 M-0.4 86 H36.4', 'none', { stroke: '#6e4423', 'stroke-width': 0.8 }),
    rect(-3, 70, 42, 4, '#6e4423', { rx: 1, stroke: '#4a2c16', 'stroke-width': 0.8 }),
    rect(0, 72.4, 36, 2, '#8ec5e8'),
    rect(9, 34, 8, 38, '#7a4a28', { stroke: '#4a2c16', 'stroke-width': 0.9 }),
    path('M8 34 Q8 24 14 24 Q20 24 20 34 Z', '#8a2f2a', { stroke: '#4a1a16', 'stroke-width': 1 }),
    rect(9.4, 34, 9.2, 22, '#9b3b2f', { rx: 1, stroke: '#4a1a16', 'stroke-width': 1 }),
    path('M18.6 38 H27 Q30 38 30 41 V45 H27 V41.6 H18.6 Z', '#9b3b2f', { stroke: '#4a1a16', 'stroke-width': 0.9 }),
    circle(14, 22.6, 1.8, '#4a1a16'),
    path('M14 23 Q8 14 1 12', 'none', { stroke: '#4a1a16', 'stroke-width': 2.2, 'stroke-linecap': 'round' }),
    circle(1, 12, 1.8, '#4a1a16'),
    path('M28.6 45.6 V70', 'none', { stroke: '#8ec5e8', 'stroke-width': 1.6, 'stroke-dasharray': '2.4 2.6', class: 'p-pour' }),
    ellipse(28.6, 72.6, 3.4, 1, '#d6ecf8', { class: 'cooler-bubble' }),
  ],
  // 0: a prickly pear and a barrel cactus in a clay pot (the lounge corner); 1: a tall cactus in a half barrel (by the door).
  plant: variant => variant % 2 === 0
    ? [
      ellipse(14, 34, 7, 10, '#5f9a4a', { stroke: '#3d6a2e', 'stroke-width': 1 }),
      ellipse(24, 22, 6.4, 9, '#6aa652', { stroke: '#3d6a2e', 'stroke-width': 1, transform: 'rotate(12 24 22)' }),
      ellipse(8, 22, 5, 7, '#6aa652', { stroke: '#3d6a2e', 'stroke-width': 1, transform: 'rotate(-22 8 22)' }),
      ...[[12, 30], [16, 38], [24, 18], [26, 26], [8, 20], [12, 40]].map(([cx, cy]) => path(`M${cx} ${cy} l1.4 -1 M${cx} ${cy} l-1.4 -1`, 'none', { stroke: '#f3ecd0', 'stroke-width': 0.6 })),
      circle(24.4, 12.6, 2.4, '#e2566a', { stroke: '#9a2a3a', 'stroke-width': 0.6 }), circle(7, 15, 2, '#f59e0b', { stroke: '#a0621a', 'stroke-width': 0.6 }),
      path('M28 46 Q28 30 34 30 Q40 30 40 46 Z', '#4e8a3c', { stroke: '#2f5a24', 'stroke-width': 1 }),
      path('M31 46 V33 M34 46 V30.6 M37 46 V33', 'none', { stroke: '#3d6a2e', 'stroke-width': 0.8 }),
      circle(34, 29.4, 2.2, '#f9a8d4', { stroke: '#be185d', 'stroke-width': 0.6 }),
      path('M4 44 H42 L37 70 H9 Z', '#c0643a', { stroke: '#8a4022', 'stroke-width': 1.2 }),
      rect(2, 42, 42, 5.4, '#d0744a', { rx: 1.6, stroke: '#8a4022', 'stroke-width': 1 }),
      path('M12 56 L18 52 L24 56 L30 52 L36 56', 'none', { stroke: '#f3d9b0', 'stroke-width': 1.2 }),
    ]
    : [
      rect(17, 2, 10, 50, '#5f9a4a', { rx: 5, stroke: '#3d6a2e', 'stroke-width': 1.1 }),
      cactusRibs(22, 2, 50, '#5f9a4a'),
      path('M17 30 H11 Q7 30 7 26 V16 Q7 12 10.4 12 Q13.6 12 13.6 16 V24 H17', '#5f9a4a', { stroke: '#3d6a2e', 'stroke-width': 1.1 }),
      path('M27 24 H32 Q36 24 36 20 V10 Q36 6 33 6 Q30 6 30 10 V18 H27', '#5f9a4a', { stroke: '#3d6a2e', 'stroke-width': 1.1 }),
      circle(22, 2.4, 2.2, '#f8f1e0', { stroke: '#c9b48e', 'stroke-width': 0.6 }),
      path('M6 46 H38 L36 70 H8 Z', '#a8743f', { stroke: WOOD_DARK, 'stroke-width': 1.2 }),
      path('M7 52 H37 M7.6 63 H36.4', 'none', { stroke: '#3f4650', 'stroke-width': 2 }),
      path('M15 46 V70 M22 46 V70 M29 46 V70', 'none', { stroke: '#8a5a2e', 'stroke-width': 0.8 }),
      ellipse(22, 46, 16, 2.6, '#7a5030', { stroke: WOOD_DARK, 'stroke-width': 0.8 }),
    ],
};

// ---------------------------------------------------------------------------
// Stations (viewBox 68 20 72 96, floor at y = 112)
// ---------------------------------------------------------------------------

const stations = {
  // The saloon bar: a paneled counter with a brass foot rail, a frothy mug, bottles and an oil lamp.
  saloonbar: () => [
    rect(74, 85, 64, 27, '#94592f', { stroke: '#4a2c16', 'stroke-width': 1 }),
    ...[78, 97, 116].map(x => rect(x, 89, 16, 14, '#7a4a28', { rx: 1, stroke: '#b5793f', 'stroke-width': 1 })),
    rect(74, 108, 64, 4, '#5a3418'),
    line(73, 105, 139, 105, BRASS, 2), ...[80, 106, 132].map(x => line(x, 103, x, 107, '#a8822e', 1.4)),
    rect(71, 79, 70, 7, '#7a4a28', { rx: 1.6, stroke: '#4a2c16', 'stroke-width': 1 }),
    line(73, 80.6, 139, 80.6, '#b5793f', 1),
    path('M82 66 H92 L91.4 79 H82.6 Z', '#b0621f', { 'fill-opacity': 0.9, stroke: '#d6dde4', 'stroke-width': 0.9 }),
    path('M92 68.6 q3.6 0.4 3.4 3.8 q-0.2 3 -3.6 2.8', 'none', { stroke: '#d6dde4', 'stroke-width': 1.4 }),
    ellipse(87, 66, 5.6, 2.2, '#fbf3e0', { stroke: '#e6dcc4', 'stroke-width': 0.5 }),
    ...[[85, 75], [88.4, 72], [86.4, 70]].map(([cx, cy]) => circle(cx, cy, 0.8, '#fbe6c4', { class: 'p-bubble' })),
    ...[[104, '#7a3a1a', 50], [112, '#3f6a3a', 46], [120, '#d8e2e8', 52]].flatMap(([x, color, top]) => [
      path(`M${x - 3.6} 79 V${top + 10} Q${x - 3.6} ${top + 6} ${x - 1.4} ${top + 5} V${top} H${x + 1.4} V${top + 5} Q${x + 3.6} ${top + 6} ${x + 3.6} ${top + 10} V79 Z`, color, { 'fill-opacity': 0.92, stroke: darker(color, 0.4), 'stroke-width': 0.8 }),
      rect(x - 1.6, top - 2, 3.2, 2.4, '#8a6a44', { rx: 0.5 }), rect(x - 3, top + 14, 6, 6, '#efe3c4', { rx: 0.6 }),
      path(`M${x - 2} ${top + 8} V77`, 'none', { stroke: '#ffffff', 'stroke-opacity': 0.4, 'stroke-width': 0.8 })]),
    path('M96 74 H101 L100.6 79 H96.4 Z', '#e6eef4', { 'fill-opacity': 0.8, stroke: '#9aa7b0', 'stroke-width': 0.6 }),
    rect(126, 74, 10, 5, BRASS, { rx: 1, stroke: '#8f6c16', 'stroke-width': 0.6 }),
    path('M128 74 Q127 66 131 62 Q135 66 134 74 Z', '#eef6fb', { 'fill-opacity': 0.7, stroke: '#9aa7b0', 'stroke-width': 0.6 }),
    path('M131 65 q-1.6 2.4 0 4.6 q1.6 -2.2 0 -4.6 Z', '#ffb02e', { class: 'flame' }),
    circle(131, 67, 6.4, '#ffd97a', { 'fill-opacity': 0.25, class: 'p-glow' }),
  ],
  // A farrier's corner: an anvil on a block with a glowing horseshoe, sparks, a quench bucket and spare shoes on a post.
  anvil: () => [
    rect(118, 50, 20, 30, '#9a6a3c', { rx: 1, stroke: '#4a2c16', 'stroke-width': 1 }),
    path('M118 60 H138 M118 70 H138', 'none', { stroke: '#7a4a28', 'stroke-width': 0.7 }),
    line(135, 80, 135, 112, '#7a4a28', 3),
    ...[[123, 56], [133, 56], [128, 67]].map(([x, y]) => [path(`M${x - 3.6} ${y + 8} Q${x - 4} ${y} ${x} ${y} Q${x + 4} ${y} ${x + 3.6} ${y + 8}`, 'none', { stroke: '#4b5563', 'stroke-width': 2.4, 'stroke-linecap': 'round' }),
      circle(x, y - 0.6, 0.9, '#2a2a2a')]),
    path('M84 95 H106 L108 112 H82 Z', '#7a4e2c', { stroke: '#4a2c16', 'stroke-width': 1 }),
    path('M88 99 V110 M96 98 V111 M102 99 V110', 'none', { stroke: '#5e3a1f', 'stroke-width': 0.8 }),
    ellipse(95, 95, 12, 2.6, '#a47a4c', { stroke: '#4a2c16', 'stroke-width': 0.8 }),
    path('M86 94 H104 L102 88 H108 Q115 88 120 83 Q112 81.4 104 81.6 H84 Q81.6 85 86 88 Z', IRON, { stroke: '#1f2937', 'stroke-width': 1 }),
    path('M86 82.8 H104', 'none', { stroke: '#9ca3af', 'stroke-width': 0.8 }),
    path('M90 81.6 Q90 76 95 76 Q100 76 100 81.6', 'none', { stroke: '#ff7a2e', 'stroke-width': 2.6, 'stroke-linecap': 'round', class: 'p-glow' }),
    path('M90 81.6 Q90 76 95 76 Q100 76 100 81.6', 'none', { stroke: '#ffe08a', 'stroke-width': 0.9, 'stroke-linecap': 'round' }),
    ...[[94, 70], [100, 66], [89, 68], [104, 72]].map(([x, y]) => path(`M${x} ${y - 2.4} l0.8 1.6 l1.6 0.8 l-1.6 0.8 l-0.8 1.6 l-0.8 -1.6 l-1.6 -0.8 l1.6 -0.8 Z`, '#fde047', { class: 'p-spark' })),
    line(78, 112, 84, 96, '#7a5332', 2.2), rect(78.4, 91.6, 9, 5, '#6b7280', { rx: 1, transform: 'rotate(22 83 94)' }),
    path('M114 94 H132 L130 112 H116 Z', '#9a6a3c', { stroke: '#4a2c16', 'stroke-width': 1 }),
    path('M114.6 99 H131.4 M115.4 106 H130.6', 'none', { stroke: '#3f4650', 'stroke-width': 1.6 }),
    ellipse(123, 94, 9, 2, '#5b8fb0', { stroke: '#4a2c16', 'stroke-width': 0.8 }),
    path('M119 90 q-2 -3 0 -6 M125 89 q2 -3 0 -6.4', 'none', { stroke: '#e5e7eb', 'stroke-width': 1.3, 'stroke-linecap': 'round', class: 'p-steam' }),
  ],
};

export default Object.freeze({
  archetypes: { cowhand, sheriff, saloonKeeper, prospector, horsefolk, homesteader },
  decor,
  stations,
});
