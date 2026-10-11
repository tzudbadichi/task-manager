// The character figure of the people view, shared by the office (art.js) and the themed worlds
// (world-art/*.js): composeFigure assembles a figure from its parts into the skeleton CSS animates, and
// adds what every character has - the face for its mood, the mood overlay (z-z-z, hourglass...), the
// holiday accessories, the cup for coffee breaks. The rest of this module is a kit of building blocks
// in an outlined cartoon style (limbs, sleeves, boots, hair, beards, hats) for the worlds' archetypes.
//
// Coordinates (viewBox 92 x 124, facing right): the figure stands around x = 46 with its feet on
// y = 112. CSS rotates the arms around the shoulders (37,62) / (55,62), the legs around the hips
// (41,88) / (51,88) and the head around the neck (46,55). The head is drawn for a radius of 15 around
// (46,40). Parts filled with the task's category color use the classes p-cat / p-cat-dark / p-cat-light
// (styles.css sets their fill and outline from --cat-color).

import { circle, darker, ellipse, group, lighter, line, path, rect, svg } from './svg-kit.js';

export const INK = '#1f2937';
export const SHOULDERS = Object.freeze({ back: [37, 62], front: [55, 62] });
export const HANDS = Object.freeze({ back: [34, 83], front: [58, 83] });
export const HIPS = Object.freeze({ back: [41, 88], front: [51, 88] });
export const FEET = Object.freeze({ back: [41.5, 111], front: [54, 111] });

// ---------------------------------------------------------------------------
// Seeded choices: an archetype picks its own variations from look.seed (people-model.js lookOf), so a
// task keeps the same character on every render and device.
// ---------------------------------------------------------------------------

/** A seeded random generator (mulberry32) for this look. */
export function rngOf(look, salt = 0) {
  let state = ((look.seed ?? 1) + salt * 0x9e3779b9) >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}
export const pick = (list, random) => list[Math.floor(random() * list.length) % list.length];
/** [value, weight] entries. */
export function pickWeighted(entries, random) {
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let remaining = random() * total;
  for (const [value, weight] of entries) {
    remaining -= weight;
    if (remaining < 0) return value;
  }
  return entries[entries.length - 1][0];
}

// ---------------------------------------------------------------------------
// Paint: a fill with its outline. 'cat', 'cat-dark' and 'cat-light' are the category color (CSS).
// ---------------------------------------------------------------------------

const OUTLINE_WIDTH = 0.9;
const isCat = fill => typeof fill === 'string' && fill.startsWith('cat');

/** Attributes for a filled, outlined shape. */
export function paint(fill, { outline = true, width = OUTLINE_WIDTH } = {}) {
  if (isCat(fill)) return { class: outline ? `p-${fill}` : `p-${fill} p-no-outline` };
  if (!outline || fill === 'none') return { fill };
  return { fill, stroke: darker(fill, 0.45), 'stroke-width': width, 'stroke-linejoin': 'round' };
}
const withClass = (attributes, extra) => {
  const merged = { ...attributes, ...extra };
  if (attributes.class && extra.class) merged.class = `${attributes.class} ${extra.class}`;
  return merged;
};
/** Outlined shapes (extra attributes are added; a class is appended). */
export const shape = (d, fill, extra = {}) => path(d, null, withClass(paint(fill), extra));
export const blob = (cx, cy, rx, ry, fill, extra = {}) => ellipse(cx, cy, rx, ry, null, withClass(paint(fill), extra));
export const dot = (cx, cy, r, fill, extra = {}) => circle(cx, cy, r, null, withClass(paint(fill), extra));
export const box = (x, y, width, height, fill, extra = {}) => rect(x, y, width, height, null, withClass(paint(fill), extra));
/** A detail line (no outline): stroke color, or 'cat' / 'cat-dark' for the category color. */
export function stroke(d, color, width = 1, extra = {}) {
  const colorAttributes = isCat(color) ? { class: `p-${color}-stroke` } : { stroke: color };
  return path(d, 'none', withClass({ ...colorAttributes, 'stroke-width': width, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, extra));
}
/** A soft shadow or light over a shape (no outline). */
export const shade = (d, color = '#000000', opacity = 0.14) => path(d, color, { 'fill-opacity': opacity });
/** A detail line darker (amount > 0) or lighter (amount < 0) than the fill under it - the category color too. */
function toneLine(d, fill, width, amount) {
  if (isCat(fill)) return stroke(d, amount > 0 ? '#000000' : '#ffffff', width, { 'stroke-opacity': Math.abs(amount) });
  return stroke(d, amount > 0 ? darker(fill, amount) : lighter(fill, -amount), width);
}

/**
 * A limb: a thick rounded stroke with an outline (two strokes). fill may be the category color.
 * Returns two elements; put them in the arm / leg group.
 */
export function limb(x1, y1, x2, y2, width, fill) {
  if (isCat(fill)) {
    return [
      line(x1, y1, x2, y2, null, width + 1.8, { class: 'p-cat-outline-stroke' }),
      line(x1, y1, x2, y2, null, width, { class: `p-${fill}-stroke` }),
    ];
  }
  return [line(x1, y1, x2, y2, darker(fill, 0.45), width + 1.8), line(x1, y1, x2, y2, fill, width)];
}

// ---------------------------------------------------------------------------
// Arms (sleeve from the shoulder to the wrist, then the hand)
// ---------------------------------------------------------------------------

const ARM = {
  back: { shoulder: [37, 62], elbow: [35.5, 72], wrist: [34.3, 80.5], hand: [34, 83] },
  front: { shoulder: [55, 62], elbow: [56.5, 72], wrist: [57.7, 80.5], hand: [58, 83] },
};

/**
 * One arm. style: 'fitted' | 'rolled' (sleeve to the elbow, then skin) | 'short' | 'bare' | 'wide'
 * (a robe's hanging sleeve) | 'puffy'. sleeve: color or 'cat'; hand: skin (or glove) color; cuff: optional color.
 */
export function arm(side, { style = 'fitted', sleeve = 'cat', hand, width = 6, cuff = null, handSize = 3.4 }) {
  const { shoulder, elbow, wrist, hand: handAt } = ARM[side];
  const sign = side === 'back' ? -1 : 1;
  const parts = [];
  switch (style) {
    case 'bare':
      parts.push(limb(...shoulder, ...wrist, width - 0.5, hand));
      break;
    case 'short':
      parts.push(limb(...elbow, ...wrist, width - 0.8, hand), limb(...shoulder, shoulder[0] + sign * 0.8, 69, width + 0.6, sleeve));
      break;
    case 'rolled':
      parts.push(limb(...elbow, ...wrist, width - 1, hand), limb(...shoulder, elbow[0], elbow[1] + 0.8, width + 0.4, sleeve));
      break;
    case 'wide':
      // A sleeve that widens towards the wrist and hangs a little below it.
      parts.push(shape(side === 'back' ? 'M33.5 59 L40.5 59 L39.8 82 Q34.5 86.5 28.6 83.5 Z' : 'M51.5 59 L58.5 59 L63.4 83.5 Q57.5 86.5 52.2 82 Z', sleeve));
      break;
    case 'puffy':
      parts.push(limb(...elbow, ...wrist, width - 0.6, sleeve), blob(shoulder[0] + sign * 0.6, shoulder[1] + 4, 5, 6, sleeve));
      break;
    default:
      parts.push(limb(...shoulder, ...wrist, width, sleeve));
  }
  if (cuff) parts.push(limb(wrist[0] - 0.4 * sign, wrist[1] - 1.6, wrist[0], wrist[1] + 0.4, width + 1, cuff));
  parts.push(dot(...handAt, handSize, hand));
  return parts;
}

// ---------------------------------------------------------------------------
// Legs and feet
// ---------------------------------------------------------------------------

const LEG = {
  back: { hip: [41, 88], knee: [40.6, 99], ankle: [40.2, 107.5], foot: [41.5, 111] },
  front: { hip: [51, 88], knee: [51.6, 99], ankle: [52.2, 107.5], foot: [54, 111] },
};

/**
 * One leg. trousers: color / 'cat' (full length), length: 'full' | 'knee' (breeches, then skin or hose) |
 * 'short'; lower: the color below the knee (skin or hose); feet: 'shoe' | 'boot' | 'tallboot' | 'bare' |
 * 'hairy' (big bare feet with tufts) | 'sandal' | 'paw'; shoes: their color.
 */
export function leg(side, { trousers, length = 'full', lower, feet = 'shoe', shoes = INK, skin = '#f1c27d', width = 7, cuff = null }) {
  const { hip, knee, ankle, foot } = LEG[side];
  const parts = [];
  if (length === 'full') parts.push(limb(...hip, ...ankle, width, trousers));
  else {
    parts.push(limb(...knee, ...ankle, width - 1.2, lower ?? skin));
    const end = length === 'knee' ? [knee[0], knee[1] + 1] : [hip[0] + (knee[0] - hip[0]) * 0.55, hip[1] + 6];
    parts.push(limb(...hip, ...end, width + 0.6, trousers));
  }
  if (cuff) parts.push(limb(ankle[0], ankle[1] - 2.2, ankle[0], ankle[1] - 0.6, width + 1.2, cuff));
  parts.push(footPart(side, feet, { shoes, skin, foot, ankle, width }));
  return parts;
}

function footPart(side, feet, { shoes, skin, foot: [fx, fy], ankle: [ax, ay], width }) {
  switch (feet) {
    case 'bare': return blob(fx + 0.6, fy - 0.2, 5.4, 2.7, skin);
    case 'hairy': {
      const hair = darker(skin, 0.55);
      return [blob(fx + 1.2, fy - 0.4, 6.8, 3.2, skin),
        stroke(`M${fx - 3} ${fy - 3} l-0.6 -2.2 M${fx - 0.6} ${fy - 3.4} l0 -2.4 M${fx + 1.8} ${fy - 3.2} l0.6 -2.2 M${fx + 4} ${fy - 2.6} l1 -1.8`, hair, 1.1)];
    }
    case 'sandal': return [blob(fx + 0.6, fy - 0.2, 5.4, 2.6, skin), stroke(`M${fx - 3} ${fy - 1} H${fx + 4} M${ax} ${ay} L${fx} ${fy - 1}`, shoes, 1.1)];
    case 'boot': return [shape(`M${ax - width / 2} ${ay - 4} H${ax + width / 2} L${ax + width / 2 + 0.6} ${fy - 2.6} Q${fx + 7.5} ${fy - 3} ${fx + 6.6} ${fy + 1.6} H${fx - 5.4} Q${fx - 6} ${fy - 1} ${ax - width / 2} ${fy - 2.6} Z`, shoes)];
    case 'tallboot': return [shape(`M${ax - width / 2 - 0.6} ${ay - 11} H${ax + width / 2 + 0.6} L${ax + width / 2 + 0.4} ${fy - 2.6} Q${fx + 7.5} ${fy - 3} ${fx + 6.6} ${fy + 1.6} H${fx - 5.4} Q${fx - 6} ${fy - 1} ${ax - width / 2} ${fy - 2.6} Z`, shoes),
      toneLine(`M${ax - width / 2 - 0.4} ${ay - 9} H${ax + width / 2 + 0.4}`, shoes, 1.2, -0.25)];
    case 'paw': return blob(fx + 0.6, fy - 0.4, 5.4, 3, shoes);
    default: return blob(fx + 0.8, fy - 0.2, 5.6, 2.8, shoes);
  }
}

// ---------------------------------------------------------------------------
// Torso: the body shape for a build, and garments over it
// ---------------------------------------------------------------------------

export const BUILDS = Object.freeze({
  slim: { x: 36.5, width: 19, rx: 8 },
  regular: { x: 34, width: 24, rx: 10 },
  broad: { x: 31, width: 30, rx: 12 },
  round: { x: 32.5, width: 27, rx: 13 },
});

/** The torso's outline path for a build, from the shoulders (y 55) to the hips (y 91); belly bulges for 'round'. */
export function torsoPath(build, { top = 55, bottom = 91 } = {}) {
  const { x, width } = BUILDS[build] ?? BUILDS.regular;
  const right = x + width;
  const belly = build === 'round' ? 4 : build === 'broad' ? 1.5 : 0;
  return `M${x + 3} ${top} Q46 ${top - 3} ${right - 3} ${top} Q${right + 1} ${top + 2} ${right} ${top + 10} Q${right + belly} ${(top + bottom) / 2 + 6} ${right - 1} ${bottom} Q46 ${bottom + 3} ${x + 1} ${bottom} Q${x - belly * 0.4} ${(top + bottom) / 2 + 6} ${x} ${top + 10} Q${x - 1} ${top + 2} ${x + 3} ${top} Z`;
}

/** A long garment from the shoulders to the hem (y), flaring out (robes, gowns, long coats). */
export function longGarmentPath(build, { top = 55, hem = 106, flare = 6 } = {}) {
  const { x, width } = BUILDS[build] ?? BUILDS.regular;
  const right = x + width;
  return `M${x + 3} ${top} Q46 ${top - 3} ${right - 3} ${top} Q${right + 1} ${top + 2} ${right} ${top + 10} L${right + flare} ${hem} Q46 ${hem + 3} ${x - flare} ${hem} L${x} ${top + 10} Q${x - 1} ${top + 2} ${x + 3} ${top} Z`;
}

/** A belt across the torso at y, with a buckle. */
export function belt(build, y, color, buckle = '#d4a017') {
  const { x, width } = BUILDS[build] ?? BUILDS.regular;
  return [box(x - 0.4, y, width + 0.8, 3.4, color, { rx: 1.2 }), box(44.2, y - 0.6, 4.6, 4.6, 'none', { stroke: buckle, 'stroke-width': 1.2, rx: 0.8 })];
}

/** A row of buttons down the front. */
export const buttons = (x, ys, color = '#d4a017', r = 0.95) => ys.map(y => dot(x, y, r, color, { 'stroke-width': 0.4 }));

/** A cloak hanging behind the figure (draw in 'behind'): from the shoulders down to the hem. */
export function cloakBack(color, { hem = 108, spread = 13 } = {}) {
  return [shape(`M33 56 Q46 51 59 56 L${59 + spread * 0.55} ${hem - 3} Q${59 + spread * 0.2} ${hem + 2} 46 ${hem + 1} Q${33 - spread * 0.2} ${hem + 2} ${33 - spread * 0.55} ${hem - 3} Z`, color),
    toneLine(`M40 62 Q38 85 ${36 - spread * 0.3} ${hem - 2} M52 62 Q54 85 ${56 + spread * 0.3} ${hem - 2}`, color, 0.9, 0.22)];
}

/** A cloak's front edges over the shoulders (draw in 'overTorso'), closed by a brooch. */
export function cloakFront(color, brooch = '#cbd5e1') {
  return [shape('M33 55 Q37 53 41 55 L39 66 Q35 62 33 55 Z', color), shape('M59 55 Q55 53 51 55 L53 66 Q57 62 59 55 Z', color), dot(46, 58.5, 2, brooch)];
}

// ---------------------------------------------------------------------------
// Heads, hair, beards and hats (head radius 15 around (46,40))
// ---------------------------------------------------------------------------

/** A face's base: the head circle and an ear. ears: 'round' | 'tip' (a small point) | 'pointed' | 'long' (elves) | 'none'. */
export function headBase(skin, { ears = 'round' } = {}) {
  const parts = [dot(46, 40, 15, skin)];
  if (ears === 'round') parts.push(dot(31.6, 42.5, 2.9, skin), stroke('M31 41.5 q1.4 1 0.4 2.4', darker(skin, 0.3), 0.7));
  if (ears === 'tip') parts.push(shape('M33.6 46 Q29.4 43.6 28.6 37.4 Q32.6 39.6 34.2 41.2 Z', skin));
  if (ears === 'pointed') parts.push(shape('M33.5 45.5 Q28 41 25.5 33 Q31.5 37 34 40 Z', skin));
  if (ears === 'long') parts.push(shape('M33.5 45.5 Q26 41 21 31 Q30.5 36 34 39.5 Z', skin));
  return parts;
}

/** A small nose for faces turned to the right. */
export const nose = (skin, size = 1) => stroke(`M${50.5} ${42.4} q${2.2 * size} ${1.6 * size} ${0.2 * size} ${3.4 * size}`, darker(skin, 0.32), 0.9);

/** Hair styles: each returns { back, front } (behind the head / over it). */
export const HAIR = {
  curlyMop: color => {
    const curl = (x, y, r) => dot(x, y, r, color, { 'stroke-width': 0.7 });
    return {
      back: [curl(31.5, 45, 4), curl(30.5, 38, 4.4)],
      front: [curl(33, 32, 4.4), curl(38.5, 27.5, 4.6), curl(45, 25.8, 4.6), curl(51.5, 27, 4.4), curl(57, 30.5, 4), curl(60.5, 35.5, 3.2), curl(35, 37.5, 3)],
    };
  },
  longStraight: color => ({
    back: shape('M30.5 38 Q30 24 46 24 Q62 24 61.5 38 L62 62 Q56 64 52 60 L40 60 Q35 64 29.5 62 Z', color),
    front: [shape('M31 41 Q30 25 46 24.5 Q61 25 61 37 Q53 30.5 44 31 Q37 31.5 34 37 Q33 42 33.4 47 Z', color),
      stroke('M44 25.5 Q41 31 41.5 36', darker(color, 0.25), 0.8)],
  }),
  longWavy: color => ({
    back: shape('M30 38 Q30 23 46 23.5 Q62 24 62 38 Q64 46 61 52 Q64 58 59 63 Q54 65 52 60 L40 60 Q36 65 31 63 Q27 57 31 51 Q28 45 30 38 Z', color),
    front: shape('M31 41 Q30 25 46 24.5 Q61 25 61 37 Q53 30 45 31 Q37 32 34 38 Q33 43 33.5 47 Z', color),
  }),
  topKnot: color => ({ back: [dot(44, 22, 5, color)], front: shape('M31 40 A15 15 0 0 1 61 38 Q55 29.5 46 30 Q37 30.5 31 40 Z', color) }),
  shortCrop: color => ({ back: null, front: shape('M31 40 A15 15 0 0 1 61 38 Q55 30 46 31 Q37 31 31 40 Z', color) }),
  shaggy: color => ({
    back: shape('M30.5 40 Q30 26 46 25 Q62 26 61.5 40 L61 50 Q58 48 57 44 L35 44 Q34 49 30.5 51 Z', color),
    front: shape('M31 41 Q30 26 46 25 Q61 26 61.5 37 L58 34.5 L56 37 L53 33 L50 36 L47 32.5 L44 36 L41 33 L38 37 L35.5 34.5 Q33 38 33.4 44 Z', color),
  }),
  bald: color => ({ back: null, front: [stroke('M31.5 44 Q31 37 33.5 33', color, 2.6), stroke('M60.6 41 Q61 36 59 33', color, 2.2)] }),
  braids: color => ({
    back: [stroke('M32 44 Q30 54 31 64', color, 4.4), stroke('M60 44 Q62 54 61 64', color, 4.4)],
    front: shape('M31 41 Q30 25 46 24.5 Q61 25 61 37 Q53 30.5 46 31 Q38 31 33.5 38 Q33 42 33.4 46 Z', color),
  }),
};

/** Beards (drawn over the face, before the mouth) and mustaches. */
export const BEARD = {
  short: color => shape('M33 42 Q33 56 47 56 Q61 56 60.5 41 Q58 48 47.5 48.5 Q36 48 33 42 Z', color),
  long: color => [shape('M32 41 Q30 60 40 70 Q46 76 52 70 Q62 60 60.5 40 Q58 48.5 47.5 49 Q36 49 32 41 Z', color),
    stroke('M42 55 Q43 63 45 69 M49 55 Q50 62 49 68', darker(color, 0.18), 0.8)],
  braided: (color, bead = '#d4a017') => [
    shape('M31 41 Q29 58 37 64 Q42 67 47 66 Q53 67 57 63 Q63 57 61 40 Q58 49 47.5 49.5 Q36 49 31 41 Z', color),
    shape('M40 63 Q39 72 41 80 L44 80 Q44 71 45 64 Z', color), shape('M49 64 Q50 72 49 80 L52 80 Q54 72 53 63 Z', color),
    box(39.8, 73, 4.8, 2.6, bead, { rx: 0.8 }), box(48.6, 73, 4.8, 2.6, bead, { rx: 0.8 }),
  ],
  stubble: color => path('M33 43 Q33 55 47 55.5 Q60.5 55 60.5 42 Q58 48 47.5 48.5 Q36 48 33 43 Z', color, { 'fill-opacity': 0.35 }),
  mustache: color => shape('M42.5 46 q2.6 -2 5 0 q2.4 -2 5 0 q-2.6 2.4 -5 0.8 q-2.4 1.6 -5 -0.8 Z', color),
};

/** Eyebrows over the eye anchors, shaped by the mood. */
function drawBrows(state, [[x1, y1], [x2, y2]], color) {
  const lift = { worried: [1.2, -1.2], happy: [-1, -1], flat: [0, 0], bored: [0.8, 0.8], sleepy: [0.6, 0.6] }[state] ?? [-0.3, -0.3];
  const top = y => y - 4.4;
  return group('p-brows',
    stroke(`M${x1 - 2.4} ${top(y1) + lift[0]} Q${x1} ${top(y1) - 1 + lift[0]} ${x1 + 2.2} ${top(y1) + lift[1] * -0.4}`, color, 1.1),
    stroke(`M${x2 - 2.2} ${top(y2) + lift[1] * -0.4} Q${x2} ${top(y2) - 1 + lift[0]} ${x2 + 2.4} ${top(y2) + lift[0]}`, color, 1.1));
}

// ---------------------------------------------------------------------------
// The face for the mood, and what goes over the figure
// ---------------------------------------------------------------------------

const MOOD_FACES = {
  idle: { eyes: 'open', mouth: 'smile', brows: 'calm' },
  working: { eyes: 'open', mouth: 'smile', brows: 'calm' },
  sweating: { eyes: 'open', mouth: 'worried', brows: 'worried' },
  waiting: { eyes: 'open', mouth: 'flat', brows: 'flat' },
  bored: { eyes: 'half', mouth: 'flat', brows: 'bored' },
  sleeping: { eyes: 'closed', mouth: 'small', brows: 'sleepy' },
  celebrating: { eyes: 'happy', mouth: 'open', brows: 'happy' },
};

const LED = '#22d3ee';

/** Eyes at two anchors. style: 'dot' (most faces), 'toon' (dot with a highlight), 'big' (aliens) or 'led' (robots). */
export function drawEyes(state, [[x1, y1], [x2, y2]], style, color) {
  if (style === 'led') {
    if (state === 'closed') return group('p-eyes', line(x1 - 2, y1, x1 + 2, y1, LED, 1.4), line(x2 - 2, y2, x2 + 2, y2, LED, 1.4));
    if (state === 'happy') return group('p-eyes', path(`M${x1 - 2.2} ${y1 + 1} q2.2 -3 4.4 0 M${x2 - 2.2} ${y2 + 1} q2.2 -3 4.4 0`, 'none', { stroke: LED, 'stroke-width': 1.5, 'stroke-linecap': 'round' }));
    if (state === 'half') return group('p-eyes', rect(x1 - 1.8, y1 - 0.6, 3.6, 1.4, LED), rect(x2 - 1.8, y2 - 0.6, 3.6, 1.4, LED));
    return group('p-eyes p-blink', rect(x1 - 1.8, y1 - 1.8, 3.6, 3.6, LED, { rx: 0.8 }), rect(x2 - 1.8, y2 - 1.8, 3.6, 3.6, LED, { rx: 0.8 }));
  }
  const isBig = style === 'big';
  const strokeAttributes = { stroke: color, 'stroke-width': isBig ? 1.8 : 1.4, 'stroke-linecap': 'round' };
  if (state === 'closed') return group('p-eyes', path(`M${x1 - 2} ${y1} q2 2 4 0 M${x2 - 2} ${y2} q2 2 4 0`, 'none', strokeAttributes));
  if (state === 'happy') return group('p-eyes', path(`M${x1 - 2} ${y1 + 1} q2 -3 4 0 M${x2 - 2} ${y2 + 1} q2 -3 4 0`, 'none', strokeAttributes));
  if (state === 'half') return group('p-eyes', rect(x1 - 2, y1, 4, isBig ? 2.2 : 1.6, color, { rx: 0.8 }), rect(x2 - 2, y2, 4, isBig ? 2.2 : 1.6, color, { rx: 0.8 }));
  if (isBig) {
    return group('p-eyes p-blink', ellipse(x1, y1, 3, 4.2, color), ellipse(x2, y2, 3, 4.2, color),
      circle(x1 + 1, y1 - 1.6, 1, '#ffffff'), circle(x2 + 1, y2 - 1.6, 1, '#ffffff'));
  }
  if (style === 'toon') {
    return group('p-eyes p-blink', ellipse(x1, y1, 1.9, 2.5, color), ellipse(x2, y2, 1.9, 2.5, color),
      circle(x1 + 0.7, y1 - 0.9, 0.65, '#ffffff'), circle(x2 + 0.7, y2 - 0.9, 0.65, '#ffffff'));
  }
  return group('p-eyes p-blink', ellipse(x1, y1, 1.8, 2.3, color), ellipse(x2, y2, 1.8, 2.3, color));
}

/** A mouth centered at (x, y); widthScale stretches it (frogs). */
export function drawMouth(state, [x, y], color = INK, widthScale = 1) {
  const half = 5 * widthScale;
  const strokeAttributes = { stroke: color, 'stroke-width': 1.6, 'stroke-linecap': 'round' };
  const fillColor = color === INK ? '#7f1d1d' : color;
  switch (state) {
    case 'flat': return path(`M${x - half * 0.8} ${y + 1} H${x + half * 0.8}`, 'none', strokeAttributes);
    case 'worried': return path(`M${x - half} ${y + 2} Q${x} ${y - 1} ${x + half} ${y + 2}`, 'none', strokeAttributes);
    case 'open': return path(`M${x - half * 1.1} ${y - 1} Q${x} ${y + 8} ${x + half * 1.1} ${y - 1} Z`, fillColor);
    case 'small': return circle(x, y + 1.5, 1.6, fillColor);
    default: return path(`M${x - half} ${y} Q${x} ${y + 4.5} ${x + half} ${y}`, 'none', strokeAttributes);
  }
}

// Holiday accessories: hats on the head, or something held in the back hand.
const HEAD_ACCESSORIES = {
  purim: () => [path('M35 30 L46 5 L57 30 Z', '#a855f7'), path('M38.5 22 L53.5 22 M41.5 15 L50.5 15', 'none', { stroke: '#facc15', 'stroke-width': 2 }), circle(46, 5, 3, '#facc15')],
  hanukkah: () => [path('M30 36 A16 16 0 0 1 62 36 Z', '#2563eb'), rect(30, 33, 32, 4, '#93c5fd', { rx: 2 }), circle(46, 20, 3.5, '#ffffff')],
  shavuot: () => [[35, 29, '#f9a8d4'], [40, 25.5, '#fde047'], [46, 24.5, '#ffffff'], [52, 25.5, '#f9a8d4'], [57, 29, '#fde047']]
    .map(([cx, cy, fill]) => circle(cx, cy, 3, fill, { stroke: '#86efac', 'stroke-width': 1 })),
  pesach: () => [circle(32, 33, 3, '#fbcfe8'), circle(32, 33, 1.2, '#f59e0b')],
  'tu-bishvat': () => [circle(32, 33, 3, '#fce7f3'), circle(32, 33, 1.2, '#db2777')],
};
const BACK_HAND_ACCESSORIES = {
  atzmaut: () => [line(34, 84, 34, 56, '#64748b', 1.5), rect(34, 56, 15, 10, '#ffffff', { stroke: '#cbd5e1', 'stroke-width': 0.6 }),
    rect(34, 57.2, 15, 1.4, '#2563eb'), rect(34, 63.4, 15, 1.4, '#2563eb'), path('M41.5 59.2 l1.6 2.8 h-3.2 Z M41.5 63 l1.6 -2.8 h-3.2 Z', 'none', { stroke: '#2563eb', 'stroke-width': 0.6 })],
  'rosh-hashana': () => [circle(33, 85, 4.5, '#dc2626'), path('M33 80.5 q2 -3 4 -2', 'none', { stroke: '#15803d', 'stroke-width': 1.5 })],
  sukkot: () => [line(34, 86, 34, 44, '#15803d', 2), path('M34 50 l-4 -6 M34 56 l4 -6 M34 62 l-4 -6', 'none', { stroke: '#22c55e', 'stroke-width': 1.5 })],
};

function cupInHand() {
  return group('p-cup',
    rect(56, 77, 6.5, 7.5, '#f8fafc', { rx: 1.3, stroke: '#cbd5e1', 'stroke-width': 0.8 }),
    path('M62.5 79 q2.6 0 2.6 2 q0 2 -2.6 2', 'none', { stroke: '#cbd5e1', 'stroke-width': 1 }));
}

function overlay(mood) {
  switch (mood) {
    case 'waiting':
      return group('p-overlay', group('p-hourglass', path('M62 5 h12 l-6 8 l6 8 h-12 l6 -8 Z', '#fbbf24', { stroke: '#b45309', 'stroke-width': 1 })));
    case 'bored':
    case 'sleeping':
      return group('p-overlay', ...[[62, 26, 5], [69, 17, 6.5], [77, 6, 8]].map(([x, y, size], index) =>
        path(`M${x} ${y} h${size} l${-size} ${size} h${size}`, 'none', { stroke: '#64748b', 'stroke-width': 1.6, 'stroke-linejoin': 'round', class: `p-z p-z-${index}` })));
    case 'sweating':
      return group('p-overlay', path('M63 25 q3.5 4.5 0 7 q-3.5 -2.5 0 -7 Z', '#7dd3fc', { class: 'p-sweat' }));
    case 'celebrating':
      return group('p-overlay', ...[[18, 22], [74, 18], [12, 50]].map(([x, y], index) =>
        path(`M${x} ${y - 5} L${x + 1.5} ${y - 1.5} L${x + 5} ${y} L${x + 1.5} ${y + 1.5} L${x} ${y + 5} L${x - 1.5} ${y + 1.5} L${x - 5} ${y} L${x - 1.5} ${y - 1.5} Z`, '#facc15', { class: `p-sparkle p-sparkle-${index}` })));
    case 'idle':
      return group('p-overlay p-thought',
        circle(62, 28, 2, '#ffffff', { stroke: '#cbd5e1' }),
        circle(68, 19, 8.5, '#ffffff', { stroke: '#cbd5e1' }),
        path('M65.5 16.5 a2.6 2.6 0 1 1 3.6 2.4 c-.8 .4 -1.1 .9 -1.1 1.7', 'none', { stroke: '#64748b', 'stroke-width': 1.5, 'stroke-linecap': 'round' }),
        circle(68, 23.6, 0.9, '#64748b'));
    default:
      return null;
  }
}

/**
 * The SVG of one character from its parts. figure:
 *   shadowWidth; behind (tail, cloak, quiver); legBack / legFront; armBack / armFront (sleeve and hand);
 *   held (in the back hand); cape (between the back arm and the torso); torso; overTorso (scarf, cloak
 *   edges, belt); front (over everything, e.g. a pet on the shoulder);
 *   head: { back, base, features, eyes: { anchors, style, color }, brows: color | null, beforeMouth,
 *           mouth: { anchor, color, width } | { custom }, front, eyewear, hat, cheeks: true | color };
 *   headScale (1 = radius 15).
 * The mood picks the face and the overlay; a festive look (holiday) wears the holiday's hat instead of
 * its own and holds the holiday's item. handProp: the office activity's prop in the front hand.
 */
export function composeFigure(persona, figure, { seasonKey = null, handProp = null } = {}) {
  const { look, mood } = persona;
  const face = MOOD_FACES[mood] ?? MOOD_FACES.idle;
  const season = look.festive ? seasonKey : null;
  const seasonHat = HEAD_ACCESSORIES[season]?.() ?? null;
  const backHand = BACK_HAND_ACCESSORIES[season]?.() ?? figure.held ?? null;
  const head = figure.head;
  const headScale = figure.headScale ?? 1;
  const cheekColor = head.cheeks === true ? '#f9a8d4' : head.cheeks;
  const eyes = head.eyes ?? { anchors: [[43, 41], [52, 41]] };

  return svg('svg', { viewBox: '0 0 92 124', class: 'person-art', 'aria-hidden': 'true', focusable: 'false' },
    ellipse(46, 114, figure.shadowWidth ?? 17, 3.4, null, { class: 'p-shadow' }),
    group('p-bob',
      group('p-figure',
        figure.behind,
        group('p-leg p-leg-back', figure.legBack),
        group('p-leg p-leg-front', figure.legFront),
        group('p-arm p-arm-back', figure.armBack, backHand),
        figure.cape,
        figure.torso,
        figure.overTorso,
        group('p-head',
          svg('g', { transform: headScale === 1 ? null : `translate(46 55) scale(${headScale}) translate(-46 -55)` },
            head.back,
            head.base,
            head.features,
            cheekColor && [circle(39.5, 45.5, 2.2, cheekColor, { 'fill-opacity': 0.55 }), circle(55.5, 45.5, 2.2, cheekColor, { 'fill-opacity': 0.55 })],
            drawEyes(face.eyes, eyes.anchors, eyes.style ?? 'dot', eyes.color ?? INK),
            head.brows && drawBrows(face.brows, eyes.anchors, head.brows),
            head.beforeMouth,
            group('p-mouth', head.mouth?.custom ?? drawMouth(face.mouth, head.mouth?.anchor ?? [47.5, 47], head.mouth?.color, head.mouth?.width)),
            head.front,
            head.eyewear,
            seasonHat ?? head.hat)),
        group('p-arm p-arm-front', figure.armFront, group('p-hand-prop', handProp), cupInHand()),
        figure.front),
      overlay(mood)));
}
