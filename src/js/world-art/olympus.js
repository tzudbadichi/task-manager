// Olympus: the home of the immortals on a mountain above the clouds - bearded gods in draped himations with
// thunderbolts and tridents, goddesses in long chitons with diadems, crested heroes with round shields, muses
// with lyres and flower crowns, goat-legged fauns with pan pipes and a one-eyed smith of the divine forge - and
// its furniture: bronze temple doors between columns, a marble shelf of amphorae and scrolls, a marble bench with
// cushions, a krater of golden nectar, a lion-head fountain, olive and laurel pots, a mosaic. Original designs
// for this app: the feel of the myths, no characters or designs from books or films.
// Coordinates: figure-kit.js (characters), world-layout.js ART (furniture), viewBox 68 20 72 96 (stations).

import { circle, darker, ellipse, group, lighter, line, path, rect } from '../svg-kit.js';
import {
  BEARD, HAIR, arm, belt, blob, box, cloakBack, dot, headBase, leg, limb, longGarmentPath, nose, pick, pickWeighted,
  rngOf, shade, shape, stroke, torsoPath,
} from '../figure-kit.js';

const TOON_EYES = Object.freeze({ anchors: [[43, 41], [52, 41]], style: 'toon' });
const GOLD = '#e8b84a';
const GOLD_DARK = '#a0731c';
const BRONZE = '#c58b3e';
const BRONZE_DARK = '#7a5420';
const MARBLE = '#f4ede0';
const MARBLE_SHADE = '#d9ccb6';
const MARBLE_EDGE = '#b9a98e';
const LAUREL = '#6f9a4a';
const TERRACOTTA = '#c8693c';
const WOOD = '#8a5a2e';

const SKINS = ['#f3d2b4', '#e8bf98', '#d9a77c', '#c48c60', '#a8714a', '#8a5a38'];
const HAIR_COLORS = ['#1f1a17', '#3d2614', '#5a3a22', '#8a4b26', '#c99a4a', '#e6d3a0'];

const fixed = value => Number(value.toFixed(2));

// ---------------------------------------------------------------------------
// Headwear (laurel, gold) and hair
// ---------------------------------------------------------------------------

/** A wreath of leaves around the head (green laurel or gold), along the curve from ear to ear. */
function wreath(color = LAUREL) {
  const leaves = [];
  const [x0, y0, cx, cy, x1, y1] = [31.4, 37.4, 46, 19.6, 60.8, 35.4];
  for (let index = 0; index <= 8; index += 1) {
    const t = index / 8;
    const x = fixed((1 - t) ** 2 * x0 + 2 * (1 - t) * t * cx + t * t * x1);
    const y = fixed((1 - t) ** 2 * y0 + 2 * (1 - t) * t * cy + t * t * y1);
    const angle = fixed((Math.atan2(2 * (1 - t) * (cy - y0) + 2 * t * (y1 - cy), 2 * (1 - t) * (cx - x0) + 2 * t * (x1 - cx)) * 180) / Math.PI);
    for (const side of [-1, 1]) {
      leaves.push(ellipse(x + 1.6, y, 3.2, 1.4, color, { transform: `rotate(${angle + side * 32} ${x} ${y})`, stroke: darker(color, 0.35), 'stroke-width': 0.5 }));
    }
  }
  return [stroke(`M${x0} ${y0} Q${cx} ${cy} ${x1} ${y1}`, darker(color, 0.3), 1), ...leaves];
}

const goldCrown = gem => [shape('M32 34 L33.6 22.4 L38.6 29 L42.2 19 L46 27.6 L49.8 19 L53.4 29 L58.4 22.4 L60 34 Q46 37 32 34 Z', GOLD),
  dot(46, 31.4, 1.6, gem), dot(39, 32.4, 1.1, gem), dot(53, 32.4, 1.1, gem)];

const diadem = gem => [shape('M32.2 34 Q46 26.4 59.8 33.4 L59.2 35.8 Q46 29.4 32.8 36.4 Z', GOLD), shape('M42.6 31 L46 23.8 L49.4 31 Z', GOLD), dot(46, 28.8, 1.3, gem)];

/** A braided updo: hair over the brow, a bun at the back, a braid across the crown. */
const updo = color => ({
  back: [dot(31.4, 32.6, 6.6, color), stroke('M28.4 30.6 Q31.4 28.4 34.4 30.6 M28 34 Q31.4 32 34.8 34.4', darker(color, 0.25), 0.8)],
  front: [shape('M31 42 Q30 25 46 24.4 Q61 25 61 36.6 Q56 30 50 30.6 Q46 27.6 41 31.4 Q35 32 33.6 38.6 Q33 42 33.4 46 Z', color),
    stroke('M33 31 Q46 22.6 59.4 30.4', darker(color, 0.28), 2.6), stroke('M33 31 Q46 22.6 59.4 30.4', lighter(color, 0.25), 1.1, { 'stroke-dasharray': '1.6 1.4' })],
});

/** A full curly beard. */
const curlyBeard = color => [shape('M32.4 42 Q31 58 39 64 Q46 68.4 53 64 Q61 58 60.6 41 Q58 48.6 47.4 49 Q36 48.6 32.4 42 Z', color),
  ...[[36, 56], [41, 61], [47, 63.6], [53, 61], [57.6, 55], [38.6, 51.4], [44, 57.4], [50, 57.4], [55.6, 50]].map(([x, y]) => dot(x, y, 2.5, color, { 'stroke-width': 0.6 }))];

// ---------------------------------------------------------------------------
// Things held in the back hand (at about (34,83); they swing with the arm)
// ---------------------------------------------------------------------------

/** A round shield with a simple geometric device, carried at the side (behind the body). */
function shield(device, rim = BRONZE) {
  const [x, y] = [28.6, 82];
  const devices = {
    rings: [circle(x, y, 7.6, 'none', { stroke: rim, 'stroke-width': 1.6 }), dot(x, y, 2.6, rim)],
    star: [path(`M${x} ${y - 8} L${x + 2} ${y - 2} L${x + 8} ${y} L${x + 2} ${y + 2} L${x} ${y + 8} L${x - 2} ${y + 2} L${x - 8} ${y} L${x - 2} ${y - 2} Z`, rim)],
    wave: [stroke(`M${x - 9} ${y + 1} q2.2 -3.6 4.5 0 q2.2 3.6 4.5 0 q2.2 -3.6 4.5 0 q2.2 3.6 4.5 0`, rim, 1.8), stroke(`M${x - 8} ${y - 4.6} H${x + 8} M${x - 8} ${y + 6} H${x + 8}`, 'cat-light', 1.2)],
    spiral: [stroke(`M${x} ${y} m-1 0 a1.4 1.4 0 1 1 2.8 0 a3 3 0 1 1 -6 0 a4.6 4.6 0 1 1 9.2 0 a6.2 6.2 0 1 1 -12.4 0`, rim, 1.5)],
    chevrons: [stroke(`M${x - 7} ${y - 5} L${x} ${y - 1} L${x + 7} ${y - 5} M${x - 7} ${y + 1} L${x} ${y + 5} L${x + 7} ${y + 1}`, rim, 1.8)],
  };
  return [dot(x, y, 13, 'cat'), circle(x, y, 11.6, 'none', { stroke: rim, 'stroke-width': 2.4 }), ...(devices[device] ?? devices.rings)];
}

// Long things lean out to the left of the body (the back hand is behind it), crossing the hand at about (31,83).
const HELD = {
  bolt: () => [circle(25, 74, 12, '#fde68a', { 'fill-opacity': 0.3, class: 'p-glow' }),
    shape('M23.4 52 L19.4 68.6 L24.2 68 L20.6 81.6 L25.6 80.8 L23 96 L34.4 74.4 L29.6 75.2 L33.6 62.6 L28.8 63.4 L31.4 52 Z', '#facc15', { class: 'p-glow' })],
  trident: () => [limb(36, 112, 24, 42, 1.8, GOLD_DARK), stroke('M17.6 44.4 Q16.4 36.6 14.2 31 M23.6 42.6 L20.8 26 M29.4 41.6 Q28.8 33.6 30.2 27.6 M17.4 44.8 L30 41.2', GOLD, 2),
    shape('M13.6 28.6 L12.8 33.8 L15.6 32.4 Z M20.4 23 L19.4 28.2 L22.6 27.6 Z M30.6 25 L32.4 29.8 L29.4 29.2 Z', GOLD)],
  scepter: () => [limb(36, 108, 25.4, 52, 1.8, GOLD_DARK), dot(25, 49.6, 3.4, GOLD), stroke('M22.6 55.6 L28.6 54.4', GOLD, 1.4)],
  spear: () => [limb(37, 112, 22.4, 32, 1.6, WOOD), shape('M20.4 21 Q25 27.4 22.6 34 Q18.2 28.6 20.4 21 Z', BRONZE)],
  torch: () => [circle(25.4, 51, 8, '#fde68a', { 'fill-opacity': 0.35, class: 'p-glow' }), limb(35, 94, 26, 62, 2.2, WOOD), shape('M21.6 62.4 H29.6 L28.4 58.4 H22.8 Z', GOLD),
    shape('M25.6 43 Q21 49.4 22.6 54 Q25.6 56.4 28.6 54 Q30.2 49.4 25.6 43 Z', '#fb923c', { class: 'p-glow' }), shape('M25.6 47.8 Q23.6 51.4 24.6 53.4 Q25.6 54.4 26.6 53.4 Q27.6 51.4 25.6 47.8 Z', '#fde68a')],
  wheat: () => [stroke('M34 96 L22 62 M34 96 L25.6 59.6 M34 96 L29.4 61.6', '#c9a04a', 1),
    ...[[22, 62, -20], [25.6, 59.6, -14], [29.4, 61.6, -8]].map(([x, y, angle]) => ellipse(x, y, 2, 5, '#e6c35a', { stroke: '#a8822a', 'stroke-width': 0.6, transform: `rotate(${angle} ${x} ${y})` })),
    stroke('M29 84 Q31.6 86.4 34 84.6', '#8a6a2a', 1.6)],
  lyre: () => [blob(27, 90, 7, 4.6, '#b98a52'), stroke('M23 90.6 Q27 92.4 31 90.6', '#8a6038', 0.8),
    stroke('M21.6 89 Q17 78 21 68 Q23 64 20.4 60.6 M32.4 89 Q37 78 33 68 Q31 64 33.6 60.6', GOLD, 1.9), stroke('M20.4 66.4 H33.6', GOLD, 1.6),
    stroke('M24 88 V66.6 M26 88.6 V66.6 M28 88.6 V66.6 M30 88 V66.6', '#fbf3dc', 0.55)],
  scroll: () => [box(20.4, 79.6, 16, 6, '#f3e7c9', { rx: 1 }), dot(20.4, 82.6, 3.2, '#e6d6b0'), dot(36.4, 82.6, 3.2, '#e6d6b0'), stroke('M23.6 81.6 H33.4 M23.6 83.6 H31', '#b9a47e', 0.6)],
  mask: () => [limb(32, 86, 28, 96, 1.2, WOOD), shape('M19.6 70 Q27 66 34.4 70 Q35 80 27 86 Q19 80 19.6 70 Z', '#fbf3dc'),
    path('M22 74 q2 -2 4 0 M28 74 q2 -2 4 0', 'none', { stroke: '#4a3a2a', 'stroke-width': 1.4, 'stroke-linecap': 'round' }), path('M23 79 Q27 84 31 79 Z', '#4a3a2a')],
  pipes: () => [...[0, 1, 2, 3, 4, 5].map(index => box(21.6 + index * 2.2, 74, 2.1, 14 - index * 1.6, '#d9b26a', { rx: 0.8, 'stroke-width': 0.5 })), box(21.2, 79, 14, 2.2, '#8a5a2e', { rx: 0.8 })],
  grapes: () => [...[[26, 86], [29.4, 86], [32.8, 86], [27.6, 89.2], [31.2, 89.2], [29.4, 92.4]].map(([x, y]) => dot(x, y, 2, '#7c3aed', { 'stroke-width': 0.5 })),
    shape('M29 83.6 Q32 79 36 80.6 Q33 84 29.6 84 Z', '#5f8a44')],
  cup: () => [shape('M21 79 H35 Q35 86 28 87 Q21 86 21 79 Z', GOLD), stroke('M21 80 Q17.4 78 19.4 75 M35 80 Q38.6 78 36.6 75', GOLD_DARK, 1.2), stroke('M28 87 V90 M25 90.6 H31', GOLD_DARK, 1.4), ellipse(28, 79, 7, 1.4, '#7a1f4a')],
  hammer: () => [limb(37, 98, 25, 60, 2.4, WOOD), rect(17, 53, 15, 8.4, BRONZE, { rx: 1.4, stroke: BRONZE_DARK, 'stroke-width': 0.9, transform: 'rotate(-17.5 24.5 57.2)' })],
  tongs: () => [stroke('M33 84 L24 104 M35 84 L29 105', '#57534e', 1.6), stroke('M24 104 l-2 3 M29 105 l1 3', '#57534e', 1.6)],
};

// ---------------------------------------------------------------------------
// Archetypes (looks: figure-kit.js composeFigure)
// ---------------------------------------------------------------------------

/** A god: broad and bearded, a himation in the category color draped over one shoulder, a laurel or a gold crown, a thunderbolt, a trident or a scepter. */
function god(look) {
  const random = rngOf(look);
  const skin = pick(SKINS, random);
  const hairColor = pick(['#ece8e1', '#cfcac2', '#8a8580', '#1f1a17', '#5a3a22', '#7a3a1a'], random);
  const crown = pickWeighted([['laurel', 45], ['gold', 30], ['crown', 25]], random);
  const held = pickWeighted([['bolt', 45], ['trident', 30], ['scepter', 25]], random);
  const hair = HAIR.curlyMop(hairColor);
  const legs = { trousers: skin, length: 'full', feet: 'sandal', shoes: '#8a5a2e', skin, width: 7.4 };
  return {
    shadowWidth: 20,
    legBack: leg('back', legs),
    legFront: leg('front', legs),
    armBack: arm('back', { style: 'bare', hand: skin, width: 7 }),
    armFront: arm('front', { style: 'bare', hand: skin, width: 7, cuff: GOLD }),
    torso: [
      shape(torsoPath('broad', { bottom: 92 }), skin),
      stroke('M47 61 Q52 64 57 61 M50 67 Q52.6 68 55 67', darker(skin, 0.25), 0.9),
      shape('M30.6 57 Q36 52.6 43 54.6 L60.6 80 L63.4 106 Q46 110 28.6 106 L29.6 80 Z', 'cat'),
      shade('M43 54.6 L60.6 80 L63.4 106 Q55 108.6 50 108.6 L52 82 Z', '#000000', 0.12),
      stroke('M36 58 Q42 72 41 92 M40 56 Q50 70 51.6 104 M33.4 64 Q34.6 84 33 104', 'cat-dark', 0.9),
      stroke('M29 105 Q46 109.4 63 105', GOLD, 1.6), stroke('M43.6 55.6 L60.4 80.6', GOLD, 1.3),
      dot(41.4, 57.6, 2.2, GOLD),
    ],
    held: HELD[held](),
    headScale: 1.02,
    head: {
      back: hair.back,
      base: headBase(skin),
      features: nose(skin, 1.3),
      eyes: TOON_EYES,
      brows: darker(hairColor, 0.25),
      beforeMouth: curlyBeard(hairColor),
      mouth: { anchor: [47.6, 48.8] },
      front: [BEARD.mustache(darker(hairColor, 0.06)), hair.front],
      hat: crown === 'crown' ? goldCrown('#2563eb') : wreath(crown === 'gold' ? GOLD : LAUREL),
    },
  };
}

/** A goddess: a long chiton in the category color with a gold girdle, a braided updo, a gold diadem; a spear and a shield, a torch or a sheaf of wheat. */
function goddess(look) {
  const random = rngOf(look);
  const skin = pick(SKINS, random);
  const hairColor = pick(HAIR_COLORS, random);
  const held = pickWeighted([['shield', 35], ['torch', 25], ['wheat', 20], ['scepter', 20]], random);
  const device = pick(['rings', 'star', 'wave', 'spiral', 'chevrons'], random);
  const gem = pick(['#2563eb', '#dc2626', '#16a34a', '#7c3aed'], random);
  const hair = updo(hairColor);
  const legs = { trousers: 'cat', feet: 'sandal', shoes: GOLD_DARK, skin, width: 6 };
  return {
    shadowWidth: 17,
    legBack: leg('back', legs),
    legFront: leg('front', legs),
    armBack: arm('back', { style: 'short', sleeve: 'cat', hand: skin, width: 5.6 }),
    armFront: arm('front', { style: 'short', sleeve: 'cat', hand: skin, width: 5.6, cuff: GOLD }),
    torso: [
      shape(longGarmentPath('slim', { hem: 108, flare: 9 }), 'cat'),
      shape('M35 72 Q46 75.6 57.4 72 L58.6 80 Q46 84 33.8 80 Z', 'cat-light'),
      shade('M50 57 L56 66 L64.6 108 Q58 109.4 53 109.4 Z', '#000000', 0.1),
      stroke('M40 82 Q38 96 36 107 M46 83 V108.6 M52 82 Q54 96 56.4 107.6', 'cat-dark', 0.9),
      stroke('M37.6 70.4 Q46 73 54.4 70.4', GOLD, 1.8), stroke('M41 57 L46 70 L51 57', GOLD, 1),
      stroke('M28.4 106.8 Q46 111 64 106.8', GOLD, 1.6), stroke('M28.6 104.6 Q46 108.6 63.8 104.6', GOLD, 0.8, { 'stroke-dasharray': '1.4 1.4' }),
    ],
    overTorso: [stroke('M38.6 57.6 Q46 63 53.4 57.6', GOLD, 1.3), dot(46, 61.4, 1.5, gem)],
    held: held === 'shield' ? [HELD.spear(), shield(device)] : HELD[held](),
    headScale: 1,
    head: {
      back: hair.back,
      base: [headBase(skin), dot(32.6, 46.4, 1.1, GOLD)],
      features: nose(skin, 0.85),
      eyes: TOON_EYES,
      brows: darker(hairColor, 0.15),
      mouth: { anchor: [47.5, 47.4] },
      front: hair.front,
      hat: diadem(gem),
      cheeks: random() < 0.5 ? '#f4a3a3' : null,
    },
  };
}

/** A hero: a crested bronze helmet, a bronze cuirass over a tunic in the category color, a cape, greaves; a spear and a round shield with a simple device. */
function hero(look) {
  const random = rngOf(look);
  const skin = pick(SKINS, random);
  const hairColor = pick(HAIR_COLORS.slice(0, 5), random);
  const device = pick(['rings', 'star', 'wave', 'spiral', 'chevrons'], random);
  const facial = pick(['stubble', 'short', null], random);
  const weapon = pickWeighted([['spear', 70], ['sword', 30]], random);
  const crestStripe = pick(['#ffffff', '#1f1a17', GOLD], random);
  const legs = { trousers: skin, length: 'knee', lower: BRONZE, feet: 'sandal', shoes: '#6b4426', skin, width: 7 };
  const sword = [limb(32.6, 81, 23, 57.6, 2.2, '#d5dbe1'), limb(28.6, 84.4, 36, 81.4, 1.6, BRONZE), limb(33.4, 84, 35, 88, 1.8, '#4a3626')];
  return {
    shadowWidth: 19,
    behind: cloakBack('cat-dark', { hem: 104, spread: 14 }),
    legBack: leg('back', legs),
    legFront: leg('front', legs),
    armBack: arm('back', { style: 'short', sleeve: 'cat', hand: skin, width: 6.6 }),
    armFront: arm('front', { style: 'short', sleeve: 'cat', hand: skin, width: 6.6, cuff: '#6b4426' }),
    torso: [
      shape('M33 86 Q46 89.6 59 86 L60.6 97 Q46 101 31.4 97 Z', 'cat'),
      ...[35, 39.6, 44.2, 48.8, 53.4].map(x => box(x, 85.6, 4, 9, '#8a5a2e', { rx: 1 })),
      shape(torsoPath('regular', { bottom: 88 }), BRONZE),
      stroke('M38 64 Q41.6 68 46 65 Q50.4 68 54 64 M46 65 V80 M40 76 Q46 79 52 76', BRONZE_DARK, 1),
      shade('M50 56 Q55 56 57.4 58 Q58.6 66 58 88 Q54 89 50 89 Z', '#000000', 0.12),
      stroke('M37 58 Q40 62.6 41.4 58', '#fde7b0', 1.1),
    ],
    overTorso: [shape('M33 55.6 Q37.6 53 42 55.4 L40.4 61 Q36.4 60 33 55.6 Z', 'cat-dark'), dot(41.2, 57.8, 1.8, GOLD)],
    held: [weapon === 'spear' ? HELD.spear() : sword, shield(device)],
    headScale: 1.02,
    head: {
      back: [stroke('M31.8 44 Q30.6 50 32 54', hairColor, 3)],
      base: headBase(skin),
      features: nose(skin, 1.05),
      eyes: TOON_EYES,
      brows: darker(hairColor, 0.1),
      beforeMouth: facial && BEARD[facial](hairColor),
      mouth: { anchor: [47.5, 47.6] },
      hat: [
        shape('M33 26 Q32 9 47 6.6 Q61.6 8 62 21 Q55 14.6 47 14.8 Q39 15.6 33 26 Z', 'cat'),
        stroke('M36 20 Q40 12.6 47 11.4 M42 14.4 Q47 10.8 53.6 12.6 M47 9.6 Q54 9 58.6 14.6', crestStripe, 1, { opacity: 0.6 }),
        shape('M29.6 41 Q28.6 22.6 46 21.6 Q62.4 22.6 62.4 35.6 L58 36 Q57 29.6 46 29.6 Q36.4 30 35 37 L35.6 52 Q30.4 50 29.6 41 Z', BRONZE),
        stroke('M33 34.6 Q46 26.6 61.4 33.4', BRONZE_DARK, 1.2), stroke('M34 27 Q40 24 46 23.8', '#fde7b0', 1.2),
        box(44.6, 14.8, 4.4, 7.6, BRONZE_DARK, { rx: 1 }),
      ],
    },
  };
}

/** A muse: a flowing chiton in the category color with a pale shawl, long wavy hair and a flower crown; a lyre, a scroll, a mask or a flute. */
function muse(look) {
  const random = rngOf(look);
  const skin = pick(SKINS, random);
  const hairColor = pick(HAIR_COLORS, random);
  const shawl = pick(['#fbf6ea', '#f3e7c9', '#e6edf3'], random);
  const held = pickWeighted([['lyre', 45], ['scroll', 25], ['mask', 15], ['pipes', 15]], random);
  const flowers = pick([['#f9a8d4', '#fde047'], ['#ffffff', '#f9a8d4'], ['#c4b5fd', '#ffffff'], ['#fda4af', '#fef08a']], random);
  const hair = HAIR.longWavy(hairColor);
  const legs = { trousers: 'cat', feet: 'sandal', shoes: GOLD_DARK, skin, width: 6 };
  return {
    shadowWidth: 17,
    legBack: leg('back', legs),
    legFront: leg('front', legs),
    armBack: arm('back', { style: 'bare', hand: skin, width: 5.6 }),
    armFront: arm('front', { style: 'bare', hand: skin, width: 5.6, cuff: GOLD }),
    torso: [
      shape(longGarmentPath('slim', { hem: 108, flare: 10 }), 'cat'),
      shade('M50 57 L56 66 L65.6 108 Q58 109.4 53 109.4 Z', '#000000', 0.1),
      stroke('M38 76 Q36 92 33.6 107 M44 78 Q43.4 94 42.4 108.6 M50 77 Q51.6 93 53.6 108.4', 'cat-dark', 0.9),
      shape('M33.4 56.4 Q38 53.6 43 55.4 L58.6 84 Q55 92 51 94 L37 66 Z', shawl, { stroke: '#cbbfa6' }),
      stroke('M38 60 L52.6 88 M41 58 L56 86', '#d9cfbb', 0.8),
      stroke('M36.6 74 Q46 77 55.4 74', GOLD, 1.4),
    ],
    held: HELD[held](),
    headScale: 1,
    head: {
      back: hair.back,
      base: headBase(skin),
      features: nose(skin, 0.85),
      eyes: TOON_EYES,
      brows: darker(hairColor, 0.15),
      mouth: { anchor: [47.5, 47.4] },
      front: hair.front,
      hat: [stroke('M31.6 35 Q46 24.6 60.6 33.6', '#5f8a44', 1.6),
        ...[[33, 33.4, 0], [37.4, 29.6, 1], [42, 27.6, 0], [46.6, 27, 1], [51.2, 27.8, 0], [55.6, 29.8, 1], [59.4, 32.6, 0]].map(([x, y, which]) =>
          [dot(x, y, 2.2, flowers[which], { 'stroke-width': 0.5 }), circle(x, y, 0.8, which ? '#f59e0b' : '#fde047')])],
      cheeks: '#f4a3a3',
    },
  };
}

/** A faun: goat legs with hooves, small horns, curly hair and pointed ears, a drape in the category color; pan pipes, grapes or a wine cup. */
function faun(look) {
  const random = rngOf(look);
  const skin = pick(SKINS.slice(0, 5), random);
  const fur = pick(['#7a5232', '#5f4128', '#8a6a4a', '#4a3424', '#a07850'], random);
  const hairColor = pick(['#3d2614', '#5a3a22', '#8a4b26', '#1f1a17'], random);
  const held = pickWeighted([['pipes', 55], ['grapes', 25], ['cup', 20]], random);
  const hair = HAIR.curlyMop(hairColor);
  const hoof = '#2e231a';
  const goatLeg = ([hipX, hipY], [kneeX, kneeY], [hockX, hockY], [footX, footY]) => [
    limb(hipX, hipY, kneeX, kneeY, 8, fur), limb(kneeX, kneeY, hockX, hockY, 5.6, fur), limb(hockX, hockY, footX, footY - 1.6, 4, fur),
    shape(`M${footX - 3.4} ${footY - 2.4} H${footX + 3.6} L${footX + 4.2} ${footY + 1} H${footX - 3.8} Z`, hoof),
    stroke(`M${footX} ${footY - 2.2} V${footY + 1}`, '#8a7a6a', 0.6),
    stroke(`M${kneeX - 3} ${kneeY - 4} l-1.6 1 M${kneeX + 3.4} ${kneeY - 2} l1.6 1 M${hockX - 2.6} ${hockY - 2} l-1.6 0.6`, darker(fur, 0.3), 1)];
  return {
    shadowWidth: 17,
    behind: shape('M36 86 Q29 84 28 77 Q32 82 37 82 Z', fur),
    legBack: goatLeg([41, 88], [44, 98], [39.4, 105], [41.2, 111]),
    legFront: goatLeg([51, 88], [54.4, 98], [50, 105], [52, 111]),
    armBack: arm('back', { style: 'bare', hand: skin, width: 6 }),
    armFront: arm('front', { style: 'bare', hand: skin, width: 6 }),
    torso: [
      shape('M36 86 Q46 90 56 86 L57.6 96 Q46 99.6 34.4 96 Z', fur),
      stroke('M37 92 l1.6 2 M41 94 l1.4 2 M46 94.6 V97 M50.6 94 l-1.4 2 M55 92 l-1.6 2', darker(fur, 0.3), 1),
      shape(torsoPath('slim', { bottom: 90 }), skin),
      stroke('M44 64 Q47 66 50 64', darker(skin, 0.25), 0.8),
      shape('M35.4 56.4 Q40 53.6 44 55.6 L56.4 80 L54 88 Q48 89 46 86 L37 64 Z', 'cat'),
      stroke('M39 58 L50 82 M42 57 L54 81', 'cat-dark', 0.8),
      stroke('M35 88 Q46 91.6 57 88', '#5f8a44', 1.6), ...[[38, 89], [44, 90.6], [51, 90.2]].map(([x, y]) => shape(`M${x} ${y} q2.4 -3 4.6 0 q-2.4 2.4 -4.6 0 Z`, '#76a052')),
    ],
    held: HELD[held](),
    headScale: 1.04,
    head: {
      back: hair.back,
      base: headBase(skin, { ears: 'pointed' }),
      features: nose(skin, 1),
      eyes: TOON_EYES,
      brows: darker(hairColor, 0.1),
      beforeMouth: shape('M44 51 Q47.6 52.6 51 50.6 Q50 56.6 47.4 58 Q45 56 44 51 Z', hairColor),
      mouth: { anchor: [47.5, 47.2] },
      front: [hair.front,
        shape('M36.6 29.6 Q32.6 22 35.6 15.6 Q37 22.4 40.4 27.6 Z', '#e8d9b8'), shape('M53.6 27.6 Q56.4 20.4 61.6 18.4 Q58.4 23.6 57 29 Z', '#e8d9b8'),
        stroke('M35 22 l2 -0.4 M35.6 25 l2 -0.6 M56.6 23.4 l1.8 1 M55.6 26 l1.8 0.8', '#b8a07a', 0.7)],
      cheeks: '#f0a08a',
    },
  };
}

/** A one-eyed smith of the divine forge: huge and broad, a felt cap, a leather apron in the category color, a bushy beard, a hammer or tongs. */
function cyclops(look) {
  const random = rngOf(look);
  const skin = pick(['#d9a77c', '#c48c60', '#a8714a', '#b8a088', '#9aa07e'], random);
  const beardColor = pick(['#3d2614', '#1f1a17', '#5a3a22', '#7a3a1a', '#6b6b6b'], random);
  const cap = pick(['#8a6a4a', '#6b4a2e', '#7a6a5a'], random);
  const held = pickWeighted([['hammer', 65], ['tongs', 35]], random);
  const build = random() < 0.6 ? 'broad' : 'round';
  const eye = [[48.4, 38.6], [48.4, 38.6]];
  const legs = { trousers: '#6b4a2e', length: 'knee', lower: skin, feet: 'sandal', shoes: '#4a3424', skin, width: 8.4 };
  return {
    shadowWidth: 21,
    legBack: leg('back', legs),
    legFront: leg('front', legs),
    armBack: arm('back', { style: 'bare', hand: skin, width: 8, handSize: 4 }),
    armFront: arm('front', { style: 'bare', hand: skin, width: 8, handSize: 4, cuff: '#4a3424' }),
    torso: [
      shape(torsoPath(build, { bottom: 93 }), skin),
      shape('M35.4 60 Q46 57.4 56.6 60 L59 99 Q46 103 33 99 Z', 'cat'),
      shade('M47 59 Q52 59 56.6 60 L59 99 Q53 101.4 47.6 101.6 Z', '#000000', 0.14),
      stroke('M36 60 L40.6 55.6 M56 60 L51.4 55.6', 'cat-dark', 1.6),
      box(41, 78, 10, 7, 'cat-dark', { rx: 1.2 }),
      belt(build, 72, '#4a3424', BRONZE),
      path('M38 90 q2 -1.6 4 0 M48 94 q1.6 -1.2 3.2 0', 'none', { stroke: '#000000', 'stroke-opacity': 0.25, 'stroke-width': 1.2 }),
    ],
    held: HELD[held](),
    headScale: 1.06,
    head: {
      back: null,
      base: headBase(skin),
      features: [circle(48.4, 38.6, 6, darker(skin, 0.06), { stroke: darker(skin, 0.35), 'stroke-width': 0.9 }), nose(skin, 1.3)],
      eyes: { anchors: eye, style: 'big', color: '#2a1a0e' },
      brows: darker(beardColor, 0.1),
      beforeMouth: [curlyBeard(beardColor)],
      mouth: { anchor: [47.8, 49.4] },
      front: BEARD.mustache(beardColor),
      hat: [shape('M31 34.6 Q31.6 18 46 14 Q60.4 18 61 33.6 Q46 30 31 34.6 Z', cap), stroke('M31.4 33.6 Q46 29.4 60.6 32.8', darker(cap, 0.3), 1.6)],
    },
  };
}

// ---------------------------------------------------------------------------
// Furniture (world-layout.js ART sizes)
// ---------------------------------------------------------------------------

/** A fluted column (x, from top to bottom), with a capital and a base. */
const column = (x, top, bottom, width = 8) => [
  rect(x - width / 2, top + 4, width, bottom - top - 7, MARBLE, { stroke: MARBLE_EDGE, 'stroke-width': 0.8 }),
  path(`M${x - width / 4} ${top + 5} V${bottom - 4} M${x} ${top + 5} V${bottom - 4} M${x + width / 4} ${top + 5} V${bottom - 4}`, 'none', { stroke: MARBLE_SHADE, 'stroke-width': 0.7 }),
  rect(x + width / 4, top + 4, width / 4, bottom - top - 7, '#000000', { 'fill-opacity': 0.06 }),
  rect(x - width / 2 - 2, top, width + 4, 4, '#f6efe2', { stroke: MARBLE_EDGE, 'stroke-width': 0.8 }),
  circle(x - width / 2 - 1, top + 4.6, 1.6, '#f6efe2', { stroke: MARBLE_EDGE, 'stroke-width': 0.6 }), circle(x + width / 2 + 1, top + 4.6, 1.6, '#f6efe2', { stroke: MARBLE_EDGE, 'stroke-width': 0.6 }),
  rect(x - width / 2 - 1.6, bottom - 3.4, width + 3.2, 3.4, '#f6efe2', { stroke: MARBLE_EDGE, 'stroke-width': 0.8 }),
];

/** A Greek key (meander) band from x to x + width at y (height 4). */
function meander(x, y, width, color) {
  const parts = [];
  for (let left = x; left + 6 <= x + width; left += 6) parts.push(`M${left} ${y + 4} V${y} H${left + 4.4} V${y + 2.6} H${left + 2} V${y + 1.4}`);
  return path(parts.join(' '), 'none', { stroke: color, 'stroke-width': 0.8 });
}

/** An amphora standing on y (its foot), centered on x. */
function amphora(x, y, height, body = '#d9763e', bands = '#2a1a12') {
  const top = y - height;
  return [
    path(`M${x - 2.6} ${top} H${x + 2.6} L${x + 2} ${top + height * 0.2} Q${x + height * 0.34} ${top + height * 0.36} ${x + height * 0.22} ${top + height * 0.78} L${x + 2.4} ${y - 2} H${x + 3.4} V${y} H${x - 3.4} V${y - 2} H${x - 2.4} L${x - height * 0.22} ${top + height * 0.78} Q${x - height * 0.34} ${top + height * 0.36} ${x - 2} ${top + height * 0.2} Z`, body, { stroke: darker(body, 0.4), 'stroke-width': 0.7 }),
    path(`M${x - 2.4} ${top + height * 0.14} Q${x - height * 0.3} ${top + height * 0.12} ${x - height * 0.24} ${top + height * 0.34} M${x + 2.4} ${top + height * 0.14} Q${x + height * 0.3} ${top + height * 0.12} ${x + height * 0.24} ${top + height * 0.34}`, 'none', { stroke: darker(body, 0.4), 'stroke-width': 1 }),
    path(`M${x - height * 0.27} ${top + height * 0.42} H${x + height * 0.27} M${x - height * 0.25} ${top + height * 0.62} H${x + height * 0.25}`, 'none', { stroke: bands, 'stroke-width': 1.4 }),
    path(`M${x - height * 0.22} ${top + height * 0.52} l1.6 -1.6 l1.6 1.6 l1.6 -1.6 l1.6 1.6 l1.6 -1.6 l1.6 1.6`, 'none', { stroke: bands, 'stroke-width': 0.7 }),
  ];
}

const pot = (x, top, width, height, color) => [
  path(`M${x} ${top} H${x + width} L${x + width - 3.4} ${top + height} H${x + 3.4} Z`, color, { stroke: darker(color, 0.4), 'stroke-width': 1.1 }),
  rect(x - 2, top - 3, width + 4, 5, lighter(color, 0.1), { rx: 1.4, stroke: darker(color, 0.4), 'stroke-width': 1 }),
  meander(x + 2, top + height * 0.36, width - 4, '#f3e2c0'),
];

const decor = {
  // Bronze temple doors between two marble columns, under a small pediment.
  door: () => [
    rect(8, 16, 34, 76, '#2a1d14'),
    rect(9.6, 18, 15, 74, BRONZE, { stroke: BRONZE_DARK, 'stroke-width': 0.9 }), rect(25.4, 18, 15, 74, BRONZE, { stroke: BRONZE_DARK, 'stroke-width': 0.9 }),
    ...[[11.6, 21], [27.4, 21], [11.6, 45], [27.4, 45], [11.6, 69], [27.4, 69]].map(([x, y]) => rect(x, y, 11, 20, '#b07a34', { stroke: BRONZE_DARK, 'stroke-width': 0.8, rx: 0.8 })),
    ...[[17.1, 31], [32.9, 31], [17.1, 55], [32.9, 55], [17.1, 79], [32.9, 79]].map(([x, y]) => circle(x, y, 2.2, '#e8b84a', { stroke: BRONZE_DARK, 'stroke-width': 0.6 })),
    path('M24.6 18 V92', 'none', { stroke: '#4a3010', 'stroke-width': 1.2 }),
    circle(21.4, 60, 2.6, 'none', { stroke: GOLD, 'stroke-width': 1.3 }), circle(28.6, 60, 2.6, 'none', { stroke: GOLD, 'stroke-width': 1.3 }),
    path('M10.6 19 V90', 'none', { stroke: '#f0c070', 'stroke-width': 1, 'stroke-opacity': 0.6 }),
    ...column(4.6, 14, 92, 8), ...column(45.4, 14, 92, 8),
    rect(-2, 6, 54, 8, '#f6efe2', { stroke: MARBLE_EDGE, 'stroke-width': 1 }),
    meander(0, 8, 50, GOLD_DARK),
    path('M-3 6 L25 -8 L53 6 Z', '#f6efe2', { stroke: MARBLE_EDGE, 'stroke-width': 1 }),
    path('M-3 6 L25 -8 L53 6', 'none', { stroke: GOLD, 'stroke-width': 1.6, 'stroke-linejoin': 'round' }),
    circle(25, -1, 2.6, GOLD, { stroke: GOLD_DARK, 'stroke-width': 0.6 }),
    rect(-3, 89.6, 56, 3, '#e8dcc6', { stroke: MARBLE_EDGE, 'stroke-width': 0.8 }),
  ],
  // A marble shelf: scrolls, amphorae and a cup, a scroll box, under a small pediment.
  shelf: () => [
    rect(2, 10, 60, 82, MARBLE, { stroke: MARBLE_EDGE, 'stroke-width': 1.2 }),
    rect(7, 14, 50, 74, '#e2d6c2'),
    path('M0 10 L32 -2 L64 10 Z', '#f6efe2', { stroke: MARBLE_EDGE, 'stroke-width': 1 }), path('M0 10 L32 -2 L64 10', 'none', { stroke: GOLD, 'stroke-width': 1.4 }),
    circle(32, 4.6, 2, GOLD),
    ...[36, 62].map(y => rect(4, y, 56, 3.4, '#f6efe2', { stroke: MARBLE_EDGE, 'stroke-width': 0.7 })),
    meander(6, 11.4, 52, GOLD_DARK),
    // Scrolls stacked in a pyramid.
    ...[[13, 33], [21, 33], [29, 33], [17, 28], [25, 28], [21, 23]].map(([x, y]) => [ellipse(x, y, 4, 2.6, '#f3e7c9', { stroke: '#b9a47e', 'stroke-width': 0.7 }), circle(x, y, 1, '#c9b48a')]),
    ...amphora(44, 36, 18, '#2a1a12', '#d9763e'), ...amphora(53, 36, 13, '#d9763e'),
    // Amphorae and a cup.
    ...amphora(15, 62, 20, '#d9763e'), ...amphora(30, 62, 23, '#2a1a12', '#d9763e'), ...amphora(45, 62, 17, '#c96a34'),
    path('M50 56 H58 Q58 60 54 60.6 Q50 60 50 56 Z M53.4 60.6 V62 M51.6 62 H56.4', '#e8b84a', { stroke: GOLD_DARK, 'stroke-width': 0.6 }),
    // A round scroll box.
    rect(10, 72, 18, 16, '#9a6a3c', { rx: 1.4, stroke: '#5a3b22', 'stroke-width': 0.8 }), ellipse(19, 72, 9, 2.4, '#b07a48', { stroke: '#5a3b22', 'stroke-width': 0.8 }),
    ...[[15, 69], [19, 67.6], [23, 69.4]].map(([x, y]) => [rect(x - 1.4, y, 2.8, 4, '#f3e7c9'), circle(x, y, 1.4, '#e6d6b0', { stroke: '#b9a47e', 'stroke-width': 0.5 })]),
    path('M10 79 H28', 'none', { stroke: GOLD, 'stroke-width': 1 }),
    path('M34 88 V76 Q34 70 40 70 H50 Q56 70 56 76 V88 Z', '#c2a07a', { stroke: '#8a6a44', 'stroke-width': 0.8 }),
    ...[38, 42, 46, 50].map(x => path(`M${x} 88 V73`, 'none', { stroke: '#f3e7c9', 'stroke-width': 0.8 })),
    path('M34 70 Q45 62 56 70', 'none', { stroke: GOLD, 'stroke-width': 1.6 }),
  ],
  // A marble bench with lion-paw feet, volute arms and three purple cushions.
  sofa: () => [
    path('M10 34 V16 Q10 12 14 12 H136 Q140 12 140 16 V34 Z', MARBLE, { stroke: MARBLE_EDGE, 'stroke-width': 1.2 }),
    meander(16, 15, 118, GOLD_DARK),
    path('M14 24 H136', 'none', { stroke: MARBLE_SHADE, 'stroke-width': 1 }),
    rect(4, 32, 142, 11, '#f6efe2', { rx: 2, stroke: MARBLE_EDGE, 'stroke-width': 1.2 }),
    path('M6 41 H144', 'none', { stroke: MARBLE_SHADE, 'stroke-width': 1.4 }),
    ...[34, 75, 116].map(x => rect(x - 19.5, 26, 39, 10, '#6b2a6b', { rx: 4.6, stroke: '#3e1440', 'stroke-width': 1 })),
    ...[34, 75, 116].map(x => path(`M${x - 15} 28.6 Q${x} 26.8 ${x + 15} 28.6 M${x - 17} 33.4 H${x + 17}`, 'none', { stroke: GOLD, 'stroke-width': 1, 'stroke-linecap': 'round' })),
    ...[[14.5, 34], [135.5, 34]].map(([x, y]) => circle(x, y, 1.6, GOLD)),
    path('M0 44 V24 Q0 14 9 15 Q15 16 14 24 Q13 30 7 29 Q3 28 4 23 V44 Z', MARBLE, { stroke: MARBLE_EDGE, 'stroke-width': 1.1 }),
    path('M150 44 V24 Q150 14 141 15 Q135 16 136 24 Q137 30 143 29 Q147 28 146 23 V44 Z', MARBLE, { stroke: MARBLE_EDGE, 'stroke-width': 1.1 }),
    circle(8.6, 22.4, 2.2, 'none', { stroke: GOLD, 'stroke-width': 1 }), circle(141.4, 22.4, 2.2, 'none', { stroke: GOLD, 'stroke-width': 1 }),
    ...[10, 75, 140].map(x => [path(`M${x - 5} 43 H${x + 5} L${x + 4} 54 Q${x + 7} 56 ${x + 6} 60 H${x - 6} Q${x - 7} 56 ${x - 4} 54 Z`, '#ede3d2', { stroke: MARBLE_EDGE, 'stroke-width': 0.9 }),
      path(`M${x - 3} 60 V57 M${x} 60 V57 M${x + 3} 60 V57`, 'none', { stroke: MARBLE_EDGE, 'stroke-width': 0.7 })]),
  ],
  // A mosaic: a terracotta border, a Greek key band, a cream field with a star rosette.
  rug: () => [
    rect(2, 2, 196, 36, '#b5562e', { rx: 3, stroke: '#7a3418', 'stroke-width': 1 }),
    rect(6, 5, 188, 30, '#f3e9d6', { rx: 2 }),
    meander(8, 7, 184, '#3a2a1e'), meander(8, 29, 184, '#3a2a1e'),
    rect(10, 13, 180, 14, '#e8d8bb', { rx: 1 }),
    path('M10 20 H190', 'none', { stroke: '#d9c4a0', 'stroke-width': 13, 'stroke-dasharray': '1.6 0.7', 'stroke-opacity': 0.5 }),
    path('M100 13.4 L104 18 L111 20 L104 22 L100 26.6 L96 22 L89 20 L96 18 Z', '#c0682f', { stroke: '#7a3418', 'stroke-width': 0.7 }),
    circle(100, 20, 2.6, GOLD),
    ...[50, 150].map(x => [path(`M${x} 14.6 L${x + 9} 20 L${x} 25.4 L${x - 9} 20 Z`, '#4a7a8a', { stroke: '#2a4a5a', 'stroke-width': 0.6 }), circle(x, 20, 1.8, '#f3e9d6')]),
    ...[22, 75, 125, 178].map(x => circle(x, 20, 2.4, '#b5562e')),
  ],
  // A krater of golden nectar on a marble stand, with a ladle; golden cups on a ledge.
  coffee: () => [
    rect(12, 62, 32, 30, MARBLE, { stroke: MARBLE_EDGE, 'stroke-width': 1 }),
    rect(9, 58, 38, 5, '#f6efe2', { stroke: MARBLE_EDGE, 'stroke-width': 1 }), rect(9, 88, 38, 4, '#f6efe2', { stroke: MARBLE_EDGE, 'stroke-width': 1 }),
    meander(14, 70, 28, GOLD_DARK),
    path('M18 58 L20 52 H36 L38 58 Z', '#d9763e', { stroke: '#8a3e18', 'stroke-width': 0.8 }),
    path('M8 30 H48 Q47 46 36 51 H20 Q9 46 8 30 Z', '#d9763e', { stroke: '#8a3e18', 'stroke-width': 1 }),
    path('M10 36 H46 M12.6 44 H43.4', 'none', { stroke: '#2a1a12', 'stroke-width': 1.6 }),
    path('M14 40 l2 -2 l2 2 l2 -2 l2 2 l2 -2 l2 2 l2 -2 l2 2 l2 -2 l2 2 l2 -2 l2 2 l2 -2 l2 2', 'none', { stroke: '#2a1a12', 'stroke-width': 0.8 }),
    path('M8 31 Q2 34 6 42 M48 31 Q54 34 50 42', 'none', { stroke: '#8a3e18', 'stroke-width': 1.6 }),
    ellipse(28, 30, 20, 3.6, '#c2702f', { stroke: '#8a3e18', 'stroke-width': 0.9 }),
    ellipse(28, 30.4, 17, 2.6, '#fcd34d', { class: 'p-glow' }),
    ellipse(24, 30, 6, 0.9, '#fff7d6', { 'fill-opacity': 0.9 }),
    circle(28, 26, 12, '#fde68a', { 'fill-opacity': 0.18, class: 'p-glow' }),
    path('M34 30 Q40 18 46 16', 'none', { stroke: GOLD_DARK, 'stroke-width': 1.6, 'stroke-linecap': 'round' }),
    ...[[50, 56], [5, 56]].map(([x, y]) => [path(`M${x - 4.4} ${y - 5} H${x + 4.4} Q${x + 4.4} ${y - 1} ${x} ${y - 0.4} Q${x - 4.4} ${y - 1} ${x - 4.4} ${y - 5} Z`, GOLD, { stroke: GOLD_DARK, 'stroke-width': 0.6 }),
      path(`M${x} ${y - 0.4} V${y + 1.6} M${x - 2} ${y + 2} H${x + 2}`, 'none', { stroke: GOLD_DARK, 'stroke-width': 1 })]),
  ],
  // A marble fountain: a bronze lion head spouts water into a shell basin.
  cooler: () => [
    rect(10, 10, 16, 58, MARBLE, { stroke: MARBLE_EDGE, 'stroke-width': 1 }),
    path('M14 14 V64 M18 14 V64 M22 14 V64', 'none', { stroke: MARBLE_SHADE, 'stroke-width': 0.7 }),
    path('M6 10 L18 2 L30 10 Z', '#f6efe2', { stroke: MARBLE_EDGE, 'stroke-width': 1 }), path('M6 10 L18 2 L30 10', 'none', { stroke: GOLD, 'stroke-width': 1.2 }),
    circle(18, 30, 8, '#c58b3e', { stroke: BRONZE_DARK, 'stroke-width': 1 }),
    ...[0, 1, 2, 3, 4, 5, 6, 7].map(index => {
      const angle = (index * Math.PI) / 4;
      return circle(fixed(18 + Math.cos(angle) * 7.4), fixed(30 + Math.sin(angle) * 7.4), 2.6, '#a8722e', { stroke: BRONZE_DARK, 'stroke-width': 0.6 });
    }),
    circle(18, 30, 5.6, '#d9a04a', { stroke: BRONZE_DARK, 'stroke-width': 0.8 }),
    circle(16, 28.6, 0.9, '#3a2410'), circle(20, 28.6, 0.9, '#3a2410'), ellipse(18, 32.6, 2, 1.4, '#3a2410'),
    path('M18 34 Q19.4 46 18.6 59', 'none', { stroke: '#8ec5e8', 'stroke-width': 2, 'stroke-dasharray': '2.4 2', class: 'p-pour' }),
    path('M2 60 Q18 54 34 60 L30 70 Q18 75 6 70 Z', '#f6efe2', { stroke: MARBLE_EDGE, 'stroke-width': 1 }),
    path('M8 61 L10 69 M13 59.6 L14 71 M18 59 V72 M23 59.6 L22 71 M28 61 L26 69', 'none', { stroke: MARBLE_SHADE, 'stroke-width': 0.8 }),
    ellipse(18, 60.4, 14, 2.4, '#7cc4e8', { stroke: MARBLE_EDGE, 'stroke-width': 0.6 }),
    path('M11 60 q2.4 -1 4.8 0 M20 60.8 q2.4 -1 4.8 0', 'none', { stroke: '#e0f2fe', 'stroke-width': 0.8 }),
    rect(13.4, 71, 9.2, 17, MARBLE, { stroke: MARBLE_EDGE, 'stroke-width': 1 }),
    rect(8, 87, 20, 5, '#e8dcc6', { stroke: MARBLE_EDGE, 'stroke-width': 0.8 }),
  ],
  // 0: an olive tree in a big terracotta jar (the lounge corner); 1: a laurel bush in a bronze-banded pot (by the door).
  plant: variant => variant % 2 === 0
    ? [
      path('M21 48 Q20 40 16 34 Q12 28 16 22 M22 48 Q24 38 30 32 Q34 28 32 22', 'none', { stroke: '#7a6250', 'stroke-width': 2.6, 'stroke-linecap': 'round' }),
      group('p-sway',
        ...[[10, 22, 10, 6], [22, 14, 12, 7], [33, 21, 10, 6], [16, 30, 8, 5], [30, 30, 8, 5], [24, 24, 9, 5]].map(([cx, cy, rx, ry], index) =>
          ellipse(cx, cy, rx, ry, index % 2 ? '#8fa47a' : '#a3b48c', { stroke: '#6f8460', 'stroke-width': 0.7 })),
        ...[[12, 20], [20, 12], [30, 18], [26, 26], [16, 28], [34, 24]].map(([x, y]) => ellipse(x, y, 1.4, 1, '#4a5a32'))),
      ...pot(8, 46, 28, 24, TERRACOTTA),
    ]
    : [
      group('p-sway p-sway-2',
        ...[[22, 14, 10], [13, 22, 9], [31, 22, 9], [17, 32, 9], [28, 32, 9], [22, 25, 9]].map(([cx, cy, r], index) =>
          circle(cx, cy, r, index % 2 ? '#5f8a44' : '#6f9a4a', { stroke: '#3f6a2a', 'stroke-width': 0.8 })),
        ...[[18, 12], [26, 16], [12, 24], [32, 26], [20, 30]].map(([x, y]) => ellipse(x, y, 2.6, 1.2, '#86b062', { transform: `rotate(-30 ${x} ${y})` }))),
      path('M10 46 H34 Q36 58 30 70 H14 Q8 58 10 46 Z', BRONZE, { stroke: BRONZE_DARK, 'stroke-width': 1.1 }),
      path('M10 46 Q4 48 7 54 M34 46 Q40 48 37 54', 'none', { stroke: BRONZE_DARK, 'stroke-width': 1.6 }),
      rect(8, 43, 28, 4.4, '#d9a04a', { rx: 1.4, stroke: BRONZE_DARK, 'stroke-width': 0.9 }),
      meander(12, 54, 20, '#5a3a14'),
    ],
};

// ---------------------------------------------------------------------------
// Stations (viewBox 68 20 72 96, floor at y = 112)
// ---------------------------------------------------------------------------

const stations = {
  // A marble altar with a garland, a bronze bowl of fire on top, offerings of grapes, pomegranates and a small amphora.
  altar: () => [
    rect(78, 108, 48, 4, '#e8dcc6', { stroke: MARBLE_EDGE, 'stroke-width': 0.9 }),
    rect(81, 86, 42, 22, MARBLE, { stroke: MARBLE_EDGE, 'stroke-width': 1 }),
    rect(78, 82, 48, 5, '#f6efe2', { stroke: MARBLE_EDGE, 'stroke-width': 1 }),
    circle(80, 82, 3, '#f6efe2', { stroke: MARBLE_EDGE, 'stroke-width': 0.8 }), circle(124, 82, 3, '#f6efe2', { stroke: MARBLE_EDGE, 'stroke-width': 0.8 }),
    circle(80, 82, 1.2, 'none', { stroke: GOLD_DARK, 'stroke-width': 0.6 }), circle(124, 82, 1.2, 'none', { stroke: GOLD_DARK, 'stroke-width': 0.6 }),
    path('M84 91 Q93 100 102 91 Q111 100 120 91', 'none', { stroke: LAUREL, 'stroke-width': 2.4, 'stroke-linecap': 'round' }),
    ...[[88, 95.4], [93, 96.6], [98, 95], [106, 95.4], [111, 96.6], [116, 95]].map(([x, y]) => ellipse(x, y, 1.8, 1, '#86b062')),
    circle(84, 91, 1.6, '#dc2626'), circle(102, 91, 1.6, '#dc2626'), circle(120, 91, 1.6, '#dc2626'),
    meander(83, 102, 38, GOLD_DARK),
    // The fire bowl.
    circle(102, 66, 14, '#fde68a', { 'fill-opacity': 0.25, class: 'p-glow' }),
    path('M92 74 H112 Q110 81.6 102 82 Q94 81.6 92 74 Z', BRONZE, { stroke: BRONZE_DARK, 'stroke-width': 1 }),
    path('M94 74 Q92 66 97 60 Q97 67 100 68 Q99 60 103 54 Q104 62 107 64 Q108 60 110 58 Q112 66 110 74 Z', '#fb923c', { class: 'flame' }),
    path('M97 74 Q96 69 99 65 Q99.6 69 101.4 70 Q102 64 104.4 61 Q106 68 107 74 Z', '#fde047', { class: 'flame' }),
    ...[[96, 52], [104, 48], [110, 54]].map(([x, y]) => circle(x, y, 1, '#fde68a', { class: 'p-spark' })),
    // Offerings.
    ...[[84, 79], [87.4, 79], [85.6, 76.4], [82.4, 76.4], [84, 73.8]].map(([x, y]) => dot(x, y, 1.8, '#7c3aed', { 'stroke-width': 0.5 })),
    shape('M85 72.4 Q88 68 91.6 70 Q88.6 73.6 85.6 73.4 Z', '#5f8a44'),
    dot(116, 79.6, 2.6, '#b91c1c', { 'stroke-width': 0.6 }), dot(120.6, 79.8, 2.4, '#c2410c', { 'stroke-width': 0.6 }), path('M116 77 l0 -1.6 M120.6 77.4 l0 -1.4', 'none', { stroke: '#4a2a14', 'stroke-width': 0.8 }),
    ...amphora(132, 112, 17, '#d9763e'),
  ],
  // The divine forge: a bronze anvil on a stone block, a glowing ingot, sparks, tongs, a stone furnace with a fiery mouth.
  anvil: () => [
    path('M114 112 V70 Q114 58 127 58 Q140 58 140 70 V112 Z', '#9a8f80', { stroke: '#5f574d', 'stroke-width': 1.1 }),
    path('M114 80 H140 M114 96 H140 M121 58.6 V80 M133 58.6 V80 M127 80 V96 M118 96 V112 M136 96 V112', 'none', { stroke: '#6f665a', 'stroke-width': 0.8 }),
    path('M119 112 V96 Q119 88 127 88 Q135 88 135 96 V112 Z', '#3a1e10'),
    circle(127, 102, 12, '#fb923c', { 'fill-opacity': 0.35, class: 'p-glow' }),
    path('M120 112 Q120 104 123 100 Q124 105 126 106 Q126 98 129.6 94 Q130 101 132.4 103 Q134 100 134 98 Q136 106 134 112 Z', '#f97316', { class: 'flame' }),
    path('M123 112 Q123 107 125 105 Q126 108 127.4 108 Q128 102 130.4 100 Q131.4 106 131 112 Z', '#fde047', { class: 'flame' }),
    rect(84, 96, 26, 16, '#a39c92', { stroke: '#5f574d', 'stroke-width': 1 }),
    path('M84 104 H110 M97 96 V104', 'none', { stroke: '#7a7268', 'stroke-width': 0.8 }),
    path('M86 95 H106 L103 88 H110 Q117 88 120 83 Q110 81 103 81.4 H88 Q84 85 88 88 Z', BRONZE, { stroke: BRONZE_DARK, 'stroke-width': 1 }),
    path('M89 83 H103', 'none', { stroke: '#f0c070', 'stroke-width': 1 }),
    rect(90, 78.4, 18, 3, '#fbbf24', { rx: 1, class: 'p-glow' }), rect(90, 78.4, 18, 3, '#fff7d6', { rx: 1, 'fill-opacity': 0.5 }),
    ...[[99, 70], [106, 66], [93, 68], [112, 72], [102, 62]].map(([x, y]) => path(`M${x} ${y - 2.4} l0.8 1.6 l1.6 0.8 l-1.6 0.8 l-0.8 1.6 l-0.8 -1.6 l-1.6 -0.8 l1.6 -0.8 Z`, '#fde047', { class: 'p-spark' })),
    line(76, 112, 84, 92, '#57534e', 1.6), line(80, 112, 85, 92, '#57534e', 1.6),
  ],
};

export default Object.freeze({
  archetypes: { god, goddess, hero, muse, faun, cyclops },
  decor,
  stations,
});
