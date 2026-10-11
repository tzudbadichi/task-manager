// Middle-earth: a green shire of small folk with curly hair and big bare feet, elves of the woods,
// bearded dwarves of the mountains, hooded rangers, wandering wizards and walking trees - and the
// shire's furniture: a round door in a hill, a pantry, a garden bench, an ale barrel, a water pump.
// Original designs for this app: the feel of the genre, no characters or designs from books or films.
// Coordinates: figure-kit.js (characters), world-layout.js ART (furniture), viewBox 68 20 72 96 (stations).

import { circle, darker, ellipse, line, path, rect } from '../svg-kit.js';
import {
  BEARD, HAIR, arm, belt, blob, box, buttons, cloakBack, cloakFront, dot, headBase, leg, limb, longGarmentPath,
  nose, pick, pickWeighted, rngOf, shade, shape, stroke, torsoPath,
} from '../figure-kit.js';

const TOON_EYES = Object.freeze({ anchors: [[43, 41], [52, 41]], style: 'toon' });
const WOOD = '#9a6a3c';
const WOOD_DARK = '#6e4a28';
const BRASS = '#e0b84a';
const STEEL = '#a7b0ba';
const PARCHMENT = '#efe0b8';

const HUMAN_SKINS = ['#f6d7bd', '#efc8a6', '#e2b38c', '#d29f74', '#b9845a', '#8f5f3c'];

// ---------------------------------------------------------------------------
// Things held in the back hand (at about (34,83); they swing with the arm)
// ---------------------------------------------------------------------------

const HELD = {
  stick: () => [limb(34.5, 98, 33, 52, 1.8, '#a47a4c'), dot(33, 51, 2.2, '#8a6038')],
  mug: () => [box(26.5, 76, 9, 10.5, '#9a6a3c', { rx: 1.4 }), stroke('M26.5 79 H35.5 M26.5 83 H35.5', '#6e4a28', 0.8),
    stroke('M26.5 78 q-3.4 0.6 -3.2 3.6 q0.2 2.6 3.2 2.4', '#6e4a28', 1.3), blob(31, 75.6, 5.2, 2.2, '#fbf6e6')],
  basket: () => [blob(29, 79, 3.2, 2.2, '#c98a4a'), blob(33.5, 78, 3, 2, '#b5703a'), blob(31, 77, 2.6, 1.8, '#e2b07a'),
    shape('M23 79 H39 L37 90 Q31 92 25 90 Z', '#c9a064'), stroke('M24 83 H38 M25 87 H37 M27 79 L28 90 M31 79 V91 M35 79 L34 90', '#9a7440', 0.7),
    stroke('M24 79 Q31 70 38 79', '#9a7440', 1.4)],
  bow: () => [stroke('M31 50 Q19 83 31 116', '#8a5a2e', 2.2), line(31, 50, 31, 116, '#e5e7eb', 0.6), box(29.4, 79, 3.2, 8, '#5a3b22', { rx: 1 })],
  elvenSword: () => [limb(34, 80, 34, 51, 1.8, '#e3e8ee'), stroke('M28.5 80 Q34 82.5 39.5 80', '#d8b45a', 1.6), limb(34, 82, 34, 87, 1.4, '#3b4a3a'), dot(34, 88.2, 1.3, '#d8b45a')],
  lantern: () => [line(34, 84, 34, 90, '#6b7280', 0.9), box(30.5, 90, 7, 9, '#f6d77a', { rx: 1.4, class: 'p-glow' }), stroke('M30.5 90 H37.5 M34 90 V99', '#6b5a3a', 0.9), shape('M30 90 L34 87.4 L38 90 Z', '#6b5a3a')],
  axe: () => [limb(34, 98, 34, 56, 2.2, WOOD), shape('M34 57 Q21 56.5 19 68 Q26 64 34 66 Z', STEEL), shape('M34 57 L39 55 L38.4 60 Z', STEEL), stroke('M34 60 H36', WOOD_DARK, 1.6)],
  hammer: () => [limb(34, 98, 34, 60, 2.2, WOOD), box(26, 52.5, 16, 9, '#8e98a3', { rx: 1.6 }), stroke('M26 57 H42', '#6b7480', 1.2), box(32.4, 51, 3.2, 12, BRASS, { rx: 0.8 })],
  pick: () => [limb(34, 98, 34, 58, 2.2, WOOD), shape('M20 64 Q26 55 34 55 Q42 55 48 62 Q41 58.4 34 58.6 Q27 59 20 64 Z', '#8e98a3')],
  sword: () => [limb(34, 80, 34, 50, 2.4, '#d5dbe1'), stroke('M34 52 V78', '#ffffff', 0.6), limb(28, 80.5, 40, 80.5, 1.6, '#7a6a52'), limb(34, 82, 34, 88, 1.8, '#4a3626'), dot(34, 89.5, 1.6, '#9aa3ad')],
  staff: () => [stroke('M34 114 Q33 96 34.5 80 Q35.5 62 33 46 Q31.5 40 35 36 Q39 34 39 38', '#6b4a2e', 2.6), stroke('M34 114 Q33 96 34.5 80 Q35.5 62 33 46', '#8a6440', 1.2),
    circle(36.8, 39.6, 2.8, '#e8f4ff', { class: 'p-glow' }), circle(36.8, 39.6, 5.5, '#dbeafe', { 'fill-opacity': 0.35, class: 'p-glow' })],
};

const quiver = () => [shape('M28.6 57 L36.5 54.6 L41.5 82 L33.6 84 Z', '#7a5332'), stroke('M30.4 64 L38.6 61.8 M31.6 72 L39.8 69.8', '#5a3b22', 0.9),
  ...[[30, 54.8], [33, 53.6], [35.6, 52.8]].flatMap(([x, y]) => [stroke(`M${x + 0.6} ${y + 3} L${x} ${y - 3}`, '#8a6a44', 0.9), shape(`M${x} ${y - 3} l-1.6 -3.4 l1.8 1 l1.8 -1 Z`, '#f3f4f6')])];

// ---------------------------------------------------------------------------
// Archetypes (looks: figure-kit.js composeFigure)
// ---------------------------------------------------------------------------

/** Small folk of the shire: curly hair, a waistcoat in the category color, breeches, big hairy bare feet. */
function hobbit(look) {
  const random = rngOf(look);
  const skin = pick(['#f6d3b2', '#efc39c', '#e6b48a', '#d8a072', '#c08458'], random);
  const hairColor = pick(['#5a3a1e', '#7a4a22', '#9a5b2a', '#3d2614', '#b8792f', '#c9a05a'], random);
  const shirt = pick(['#f4ecd8', '#efe3c8', '#f7f1e3', '#e6d8bb'], random);
  const breeches = pick(['#7a5a34', '#6b7f3a', '#8a6a3a', '#5f6b4a', '#9c7b3f'], random);
  const jacket = random() < 0.35 ? pick(['#2f5d3a', '#6b3b24', '#3e4f6b', '#7a6a2a', '#5a4632'], random) : null;
  const held = pickWeighted([[null, 45], ['stick', 18], ['mug', 22], ['basket', 15]], random);
  const hair = HAIR.curlyMop(hairColor);
  const sleeves = { style: jacket ? 'fitted' : 'rolled', sleeve: jacket ?? shirt, hand: skin };
  const legs = { trousers: breeches, length: 'knee', feet: 'hairy', skin, width: 7.4 };
  return {
    shadowWidth: 18,
    legBack: leg('back', legs),
    legFront: leg('front', legs),
    armBack: arm('back', sleeves),
    armFront: arm('front', sleeves),
    torso: [
      shape(torsoPath('round'), shirt),
      shape('M33.8 58 Q37 55.4 41.5 56 L45.6 69 L45.4 89.6 Q39 90.6 34.2 88.6 Q31.6 74 33.8 58 Z', 'cat'),
      shape('M58.2 58 Q55 55.4 50.5 56 L46.4 69 L46.6 89.6 Q53 90.6 58.4 88.6 Q61 74 58.2 58 Z', 'cat'),
      shade('M50.5 56 L46.4 69 L46.6 89.6 Q53 90.6 58.4 88.6 Q61 74 58.2 58 Q55 55.4 50.5 56 Z', '#000000', 0.1),
      buttons(48, [71.5, 77, 82.5], BRASS, 1.15),
      stroke('M48 77 Q53 80.4 56.6 76.8', BRASS, 0.8),
      shape('M41.4 55.4 L45.2 61.4 L46 56.2 Z', shirt), shape('M50.6 55.4 L46.8 61.4 L46 56.2 Z', shirt),
      jacket && [
        shape('M32.6 57.4 Q30.2 74 31.8 92 L38.8 92 Q37.6 76 40 57.4 Q36 56 32.6 57.4 Z', jacket),
        shape('M59.4 57.4 Q61.8 74 60.2 92 L53.2 92 Q54.4 76 52 57.4 Q56 56 59.4 57.4 Z', jacket),
        stroke('M40 57.4 L38.4 66 M52 57.4 L53.6 66', darker(jacket, 0.3), 0.9),
      ],
    ],
    held: HELD[held]?.() ?? null,
    headScale: 1.07,
    head: {
      back: hair.back,
      base: headBase(skin, { ears: 'tip' }),
      features: nose(skin),
      eyes: TOON_EYES,
      brows: darker(hairColor, 0.1),
      mouth: { anchor: [47.5, 47.6] },
      front: hair.front,
      cheeks: '#f0a08a',
    },
  };
}

/** Elves of the woods: tall and slim, long hair, pointed ears, a flowing robe and a cloak with a leaf brooch. */
function elf(look) {
  const random = rngOf(look);
  const skin = pick(['#fbe6d6', '#f6dcc8', '#f0d2b8', '#e6c3a2', '#c99a74'], random);
  const hairColor = pick(['#f4ead0', '#e9d27e', '#2a1d14', '#8a4b26', '#dcd8cc', '#5a3a22'], random);
  const cloak = pick(['#5f7454', '#8a9a8e', '#3f5a43', '#7a7055', '#55606e'], random);
  const warrior = random() < 0.32;
  const circlet = random() < 0.6 ? pick(['#e6ebf0', '#e8c766'], random) : null;
  const hair = random() < 0.72 ? HAIR.longStraight(hairColor) : HAIR.braids(hairColor);
  const held = warrior ? pickWeighted([['bow', 55], ['elvenSword', 45]], random) : pickWeighted([['bow', 30], [null, 50], ['lantern', 20]], random);
  const trim = '#e9eef2';
  const legs = warrior
    ? { trousers: '#6f7a66', feet: 'tallboot', shoes: '#6b5a45', width: 6 }
    : { trousers: 'cat-dark', feet: 'boot', shoes: '#7a6a52', width: 6 };
  const sleeves = warrior ? { sleeve: 'cat-dark', hand: skin, cuff: '#7a5a3a', width: 5.4 } : { style: 'wide', sleeve: 'cat', hand: skin };
  const leaf = shape('M43.6 59.6 Q46 54.6 48.4 59.6 Q46 62.4 43.6 59.6 Z', '#9ccf7c');
  return {
    shadowWidth: 16,
    behind: [cloakBack(cloak, { hem: warrior ? 102 : 109 }), held === 'bow' && quiver()],
    legBack: leg('back', legs),
    legFront: leg('front', legs),
    armBack: arm('back', sleeves),
    armFront: arm('front', sleeves),
    torso: warrior
      ? [shape(longGarmentPath('slim', { hem: 97, flare: 3 }), 'cat'), stroke('M37 96 Q46 99 55.6 96', trim, 1), belt('slim', 76, '#6b5236', '#e6ebf0'),
        stroke('M41 56 L46 62 L51 56', trim, 1)]
      : [shape(longGarmentPath('slim', { hem: 107, flare: 7 }), 'cat'), shade('M50 58 L55.5 66 L62.5 107 Q56 108 52 108 Z', '#000000', 0.1),
        stroke('M30 106.4 Q46 110 62 106.4', trim, 1.3), stroke('M38 77 Q46 79.4 54 77', trim, 1.1), stroke('M41 56 L46 62.6 L51 56', trim, 1.1)],
    overTorso: [cloakFront(cloak), leaf],
    held: HELD[held]?.() ?? null,
    headScale: 0.98,
    head: {
      back: hair.back,
      base: headBase(skin, { ears: 'long' }),
      features: nose(skin, 0.9),
      eyes: TOON_EYES,
      brows: darker(hairColor, 0.2),
      mouth: { anchor: [47.5, 47.4] },
      front: hair.front,
      hat: circlet && [stroke('M31.4 33.8 Q46 28 60.6 33.2', circlet, 1.3), dot(46, 30.9, 1.5, pick(['#7dd3fc', '#86efac', '#f9fafb'], random))],
    },
  };
}

/** Dwarves of the mountains: short and broad, a huge braided beard, mail, a tabard in the category color, an axe. */
function dwarf(look) {
  const random = rngOf(look);
  const skin = pick(['#f0c3a2', '#e3aa84', '#d4946e', '#c47f5a', '#a8694a'], random);
  const beardColor = pick(['#8a3b1a', '#5a3418', '#2b1d14', '#a8a29e', '#ddd8d0', '#b5651d'], random);
  const headgear = pickWeighted([['helm', 55], ['hood', 20], [null, 25]], random);
  const held = pickWeighted([['axe', 50], ['hammer', 30], ['pick', 20]], random);
  const mail = '#9aa3ad';
  const boots = pick(['#4a3626', '#3b2c22', '#5a4030'], random);
  const trousers = pick(['#5a4632', '#4b3b2b', '#6b5a3a', '#4a4a3a'], random);
  const legs = { trousers, feet: 'tallboot', shoes: boots, width: 8 };
  const sleeves = { sleeve: mail, hand: skin, cuff: '#6b4a2e', width: 6.8, handSize: 3.8 };
  const mailRings = [62, 66, 70].map(y => stroke(`M32 ${y} q2 2 4 0 q2 2 4 0 q2 2 4 0 q2 2 4 0 q2 2 4 0 q2 2 4 0 q2 2 4 0`, '#7c8692', 0.7));
  return {
    shadowWidth: 20,
    legBack: leg('back', legs),
    legFront: leg('front', legs),
    armBack: arm('back', sleeves),
    armFront: arm('front', sleeves),
    torso: [
      shape(torsoPath('broad', { bottom: 95 }), mail),
      mailRings,
      shape('M35.5 57 Q46 54 56.5 57 L58.6 93 Q46 96.4 33.4 93 Z', 'cat'),
      stroke('M35.6 58 L33.6 92.6 M56.4 58 L58.4 92.6', BRASS, 1),
      shade('M50 56 Q54 56.2 56.5 57 L58.6 93 Q54 94.4 50 94.6 Z', '#000000', 0.12),
      belt('broad', 79, '#4a3626', BRASS),
      box(43.2, 78.2, 6.6, 5.4, BRASS, { rx: 1 }),
    ],
    held: HELD[held]?.() ?? null,
    headScale: 1.06,
    head: {
      back: headgear ? null : [stroke('M31.6 46 Q30 54 31 60', beardColor, 3.4)],
      base: headBase(skin, { ears: 'round' }),
      features: [blob(52, 44.6, 3.3, 2.7, darker(skin, 0.06)), headgear ? null : HAIR.bald(beardColor).front],
      eyes: TOON_EYES,
      brows: darker(beardColor, 0.15),
      beforeMouth: BEARD.braided(beardColor, pick([BRASS, '#cbd5e1'], random)),
      mouth: { anchor: [47.6, 49.4] },
      front: shape('M40.6 47.4 q3.4 -3 6.8 -0.6 q3.4 -2.4 6.8 0.6 q-3 3.4 -6.8 1.6 q-3.8 1.8 -6.8 -1.6 Z', darker(beardColor, 0.05)),
      hat: headgear === 'helm'
        ? [shape('M30.4 37.6 A15.6 15.6 0 0 1 61.6 37.6 Z', '#8e98a3'), stroke('M46 23 V37', '#6b7480', 1.4), box(29.4, 34.6, 33.2, 4.4, '#6b7480', { rx: 1.4 }),
          box(44.6, 35, 2.8, 10.4, '#6b7480', { rx: 1 }), ...[33, 39, 53, 59].map(x => circle(x, 36.8, 0.8, '#cbd5e1'))]
        : headgear === 'hood'
          ? shape('M29 50 Q26 24 46 22 Q66 24 63 50 Q61 33 46 31.4 Q31 33 29 50 Z', 'cat-dark')
          : null,
    },
  };
}

/** A wandering wizard: tall, a long beard, a wide-brimmed pointed hat, a robe with a stole in the category color, a staff. */
function wizard(look) {
  const random = rngOf(look);
  const skin = pick(['#ecd2b8', '#e2c2a2', '#d8b08c', '#c9a07c'], random);
  const hairColor = pick(['#d9d6cf', '#c9c5bd', '#eeebe4', '#a8a29e'], random);
  const robe = pick(['#8d8f92', '#5a6a8a', '#6f5f4c', '#e7e3da', '#6b5a7a'], random);
  const hat = random() < 0.75 ? robe : darker(robe, 0.2);
  const hair = HAIR.longWavy(hairColor);
  return {
    shadowWidth: 17,
    legBack: leg('back', { trousers: robe, feet: 'boot', shoes: '#4a3a2c', width: 6 }),
    legFront: leg('front', { trousers: robe, feet: 'boot', shoes: '#4a3a2c', width: 6 }),
    armBack: arm('back', { style: 'wide', sleeve: robe, hand: skin }),
    armFront: arm('front', { style: 'wide', sleeve: robe, hand: skin }),
    torso: [
      shape(longGarmentPath('slim', { hem: 108, flare: 8 }), robe),
      shade('M50 57 L56 66 L63.5 108 Q57 109 53 109 Z', '#000000', 0.12),
      shape('M40.6 57 L44.4 57 L43.8 99 L40 99 Z', 'cat'), shape('M47.8 57 L51.6 57 L52.4 99 L48.6 99 Z', 'cat'),
      stroke('M37.2 79 Q46 82 55 79', '#c8b48a', 1.4),
      stroke('M44 80.4 L43 88', '#c8b48a', 1.1),
    ],
    overTorso: shape('M37.6 55 Q46 61.6 54.4 55 L54.6 59.6 Q46 66 37.4 59.6 Z', 'cat'),
    held: HELD.staff(),
    headScale: 1,
    head: {
      back: hair.back,
      base: headBase(skin),
      features: nose(skin, 1.2),
      eyes: TOON_EYES,
      brows: darker(hairColor, 0.08),
      beforeMouth: BEARD.long(hairColor),
      mouth: { anchor: [47.6, 48.6] },
      front: [shape('M41 47 q3.4 -2.6 6.6 -0.4 q3.4 -2.2 6.6 0.4 q-3 3 -6.6 1.4 q-3.6 1.6 -6.6 -1.4 Z', hairColor), hair.front],
      hat: [blob(46, 31, 25, 4.8, hat), shape('M33.6 30.4 Q40 22 43 9 Q45 0 55.4 -5.4 Q49 4 50.6 13 Q53 23 58.6 30.4 Q46 33 33.6 30.4 Z', hat),
        stroke('M34.6 27.6 Q46 30.4 57.6 27.6', darker(hat, 0.3), 2)],
    },
  };
}

/** A ranger of the wilds: a hooded cloak, a leather jerkin in the category color, stubble, a sword or a bow. */
function ranger(look) {
  const random = rngOf(look);
  const skin = pick(HUMAN_SKINS, random);
  const hairColor = pick(['#2b1d14', '#3d2a1c', '#5a3a22', '#1f1a17', '#7a5a3a', '#8a4b26'], random);
  const cloak = pick(['#2f4a33', '#4d3b28', '#3a3f44', '#465a3a', '#5a4a3a'], random);
  const hoodUp = random() < 0.4;
  const held = pickWeighted([['sword', 60], ['bow', 25], [null, 15]], random);
  const tunic = '#4b4a3f';
  const hair = HAIR.shaggy(hairColor);
  const legs = { trousers: pick(['#3b3a33', '#4a3f33', '#33302a'], random), feet: 'tallboot', shoes: '#5a4030', width: 7 };
  const sleeves = { sleeve: tunic, hand: skin, cuff: '#6b4a2e' };
  return {
    shadowWidth: 17,
    behind: [cloakBack(cloak), held === 'bow' && quiver()],
    legBack: leg('back', legs),
    legFront: leg('front', legs),
    armBack: arm('back', sleeves),
    armFront: arm('front', sleeves),
    torso: [
      shape(torsoPath('regular', { bottom: 94 }), tunic),
      shape('M35 58 Q38.4 55.6 42 56.4 L45.4 66 L45.6 93 Q39.6 94.4 35.4 92.6 Q33.4 76 35 58 Z', 'cat'),
      shape('M57 58 Q53.6 55.6 50 56.4 L46.6 66 L46.4 93 Q52.4 94.4 56.6 92.6 Q58.6 76 57 58 Z', 'cat'),
      stroke('M45.4 70 H46.6 M45.4 76 H46.6 M45.4 82 H46.6', '#3b2a1c', 1.6),
      belt('regular', 81, '#5a3c22', '#c0c6cc'),
      stroke('M35 60 L56.4 88', '#5a3c22', 1.8),
    ],
    overTorso: [cloakFront(cloak, '#c0c6cc'), !hoodUp && shape('M33 55.4 Q46 49 59 55.4 Q55 59.4 46 58.4 Q37 59.4 33 55.4 Z', cloak)],
    held: HELD[held]?.() ?? null,
    headScale: 1,
    head: {
      back: hoodUp ? null : hair.back,
      base: headBase(skin),
      features: nose(skin),
      eyes: TOON_EYES,
      brows: darker(hairColor, 0.05),
      beforeMouth: random() < 0.6 ? BEARD.stubble(hairColor) : BEARD.short(hairColor),
      mouth: { anchor: [47.6, 47.8] },
      front: hoodUp ? null : hair.front,
      hat: hoodUp && [shape('M27.6 54 Q23.4 24 46 19.6 Q68.6 24 64.4 54 Q62 33 46 31 Q30 33 27.6 54 Z', cloak),
        shade('M31 50 Q30.6 35 46 32.6 Q40 36 37 50 Z', '#000000', 0.18)],
    },
  };
}

/** A walking tree: a bark trunk, branch arms with twig fingers, root feet, a leafy crown and a mossy beard. */
function treefolk(look) {
  const random = rngOf(look);
  const bark = pick(['#6b4a2e', '#5c4430', '#7a5a3a', '#6a5a46'], random);
  const leaves = pick([['#4f8a34', '#68a845'], ['#6a9a3a', '#86b64e'], ['#8a9a3a', '#a8b84e'], ['#b0782a', '#d0973a']], random);
  const moss = '#7f9a52';
  const barkLines = darker(bark, 0.3);
  const twigs = ([x, y]) => stroke(`M${x} ${y} l-3 3 M${x} ${y} l0 4.4 M${x} ${y} l3 3`, bark, 1.6);
  const root = (x, y) => [limb(x, y - 20, x, y - 3, 7.4, bark), shape(`M${x - 6} ${y + 1} Q${x - 4} ${y - 5} ${x} ${y - 5} Q${x + 4} ${y - 5} ${x + 7} ${y + 1} Q${x} ${y - 1} ${x - 6} ${y + 1} Z`, bark)];
  return {
    shadowWidth: 20,
    legBack: [limb(41, 88, 40.6, 100, 8, bark), root(40.6, 112)],
    legFront: [limb(51, 88, 52, 100, 8, bark), root(52.4, 112)],
    armBack: [limb(37, 61, 34, 81, 5, bark), twigs([34, 82])],
    armFront: [limb(55, 61, 58, 81, 5, bark), twigs([58, 82])],
    torso: [
      shape('M35.4 53 Q46 50 56.6 53 L60 93 Q46 97 32 93 Z', bark),
      stroke('M39 58 Q38 74 39.6 90 M45 60 Q46 76 44.6 92 M51.6 57 Q53 74 52 91', barkLines, 0.9),
      blob(37, 86, 4, 2.4, moss, { 'fill-opacity': 0.8 }), blob(56.4, 66, 3, 2, moss, { 'fill-opacity': 0.8 }),
      stroke('M34.6 60 Q46 70 58.4 84', 'cat', 2.6),
      ...[[39, 63.4], [46, 69.4], [52.6, 76.4]].map(([x, y]) => shape(`M${x} ${y} q2.6 -3.6 5 0 q-2.6 3 -5 0 Z`, 'cat-light')),
    ],
    headScale: 1,
    head: {
      back: [[36, 24, 9.5], [46, 18, 11], [57, 23, 9.5], [30, 32, 7], [62, 31, 7], [46, 27, 10]].map(([cx, cy, r], index) =>
        dot(cx, cy, r, index % 2 ? leaves[1] : leaves[0], { 'stroke-width': 0.6 })),
      base: [shape('M33 52 Q30.6 31 46 27 Q61.4 31 59 52 Q46 57.6 33 52 Z', bark), stroke('M38 33 Q37 40 38.6 46 M54 33 Q55.4 40 53.6 47', barkLines, 0.8)],
      features: [blob(52.6, 44.4, 2.6, 2, darker(bark, 0.1))],
      eyes: { anchors: [[42.6, 40.6], [51.6, 40.6]], style: 'toon', color: '#2a1a0c' },
      brows: darker(bark, 0.35),
      beforeMouth: stroke('M38 50 Q38 58 36.4 63 M42 52 Q42.4 60 41 66 M47 53 Q47.4 61 46.6 67 M52 52 Q52.6 59 51.6 64 M56 50 Q56.6 56 55.6 60', moss, 1.6),
      mouth: { anchor: [47, 48.4] },
    },
  };
}

// ---------------------------------------------------------------------------
// Furniture (world-layout.js ART sizes)
// ---------------------------------------------------------------------------

const flowerHead = (x, y, color, r = 2.2) => [circle(x, y, r, color, { stroke: darker(color, 0.25), 'stroke-width': 0.5 }), circle(x, y, r * 0.38, '#f6d55c')];

const decor = {
  // A round door in a grassy mound, with a lantern on a post.
  door: () => [
    shape('M-5 92 Q-4 44 25 36 Q54 44 55 92 Z', '#7fb050'),
    path('M0 60 Q8 44 25 40 Q38 42 47 52', 'none', { stroke: '#a3d06f', 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-opacity': 0.7 }),
    circle(25, 66, 19.5, '#cdb995', { stroke: '#96805d', 'stroke-width': 1.2 }),
    path('M25 46.5 V51 M38.8 52.2 L35.6 55.4 M44.5 66 H40 M38.8 79.8 L35.6 76.6 M11.2 79.8 L14.4 76.6 M5.5 66 H10 M11.2 52.2 L14.4 55.4', 'none', { stroke: '#a48f6c', 'stroke-width': 1.4 }),
    circle(25, 66, 15, '#3d7a35', { stroke: '#244a20', 'stroke-width': 1.4 }),
    path('M17.5 53 V79 M25 51 V81 M32.5 53 V79', 'none', { stroke: '#000000', 'stroke-opacity': 0.16, 'stroke-width': 1.1 }),
    path('M13.4 58 A15 15 0 0 1 34 52.6', 'none', { stroke: '#ffffff', 'stroke-opacity': 0.25, 'stroke-width': 1.8, 'stroke-linecap': 'round' }),
    circle(25, 66, 2.4, '#f1cc5c', { stroke: '#8f6c16', 'stroke-width': 0.8 }),
    path('M8 85 H42 L39.6 90.6 H10.4 Z', '#b9a47e', { stroke: '#94805d', 'stroke-width': 0.8 }),
    line(2, 92, 2, 58, '#5a3b22', 1.8), line(2, 58, 7, 58, '#5a3b22', 1.4),
    rect(4.4, 59, 5.4, 7, '#ffd97a', { rx: 1, stroke: '#5a3b22', 'stroke-width': 0.8, class: 'p-glow' }),
    ...flowerHead(44, 86, '#e2566a'), ...flowerHead(48.5, 84, '#ffffff'), ...flowerHead(46.4, 88.6, '#f5c84a', 1.8),
    ...flowerHead(6, 88, '#d45ba8', 1.8),
  ],
  // A pantry dresser: preserves, a cheese wheel, bread, apples and potatoes.
  shelf: () => [
    rect(2, 6, 60, 86, '#8a5a32', { rx: 2, stroke: '#5a3b22', 'stroke-width': 1.2 }),
    path('M0 8 Q32 -2 64 8 L62 12 Q32 3 2 12 Z', '#7a4e2a', { stroke: '#5a3b22', 'stroke-width': 1 }),
    rect(6, 14, 52, 74, '#6e4626'),
    rect(5, 38, 54, 3, '#9a6a3c'), rect(5, 63, 54, 3, '#9a6a3c'),
    ...[[11, '#e6a23c'], [21, '#c0392b'], [31, '#7aa33c'], [41, '#8e5aa8'], [51, '#e6a23c']].flatMap(([x, color]) => [
      rect(x - 4, 26, 8, 12, color, { rx: 2, 'fill-opacity': 0.85, stroke: darker(color, 0.35), 'stroke-width': 0.7 }),
      rect(x - 4.4, 24, 8.8, 3, '#e8dcc0', { rx: 0.8, stroke: '#b9a47e', 'stroke-width': 0.5 }),
      rect(x - 2.6, 30, 5.2, 3.6, '#fbf6e6', { 'fill-opacity': 0.8 })]),
    path('M9 63 Q9 52 20 52 Q31 52 31 63 Z', '#f2c94c', { stroke: '#b38a1e', 'stroke-width': 0.8 }),
    path('M20 52 L31 63 H20 Z', '#f8dc7a'),
    ellipse(44, 59, 11, 5, '#d9a35a', { stroke: '#9a6a2c', 'stroke-width': 0.8 }),
    path('M37 57 l2 -2 M42 56.4 l2 -2 M47 56.4 l2 -2', 'none', { stroke: '#9a6a2c', 'stroke-width': 0.8 }),
    path('M9 88 Q8 74 20 72 Q32 74 31 88 Z', '#c9a064', { stroke: '#8a6a3a', 'stroke-width': 0.8 }),
    ...[[14, 74], [19, 72.6], [25, 74], [16.6, 70], [22, 69.6]].map(([x, y]) => circle(x, y, 3.2, '#c0392b', { stroke: '#7a2018', 'stroke-width': 0.5 })),
    path('M35 88 Q34 76 45 75 Q56 76 55 88 Z', '#a88a5a', { stroke: '#7a6038', 'stroke-width': 0.8 }),
    ...[[40, 76], [45, 74], [50, 76.4], [43, 72]].map(([x, y]) => ellipse(x, y, 3, 2.3, '#b98a52', { stroke: '#7a5a32', 'stroke-width': 0.5 })),
  ],
  // A carved garden bench with cushions, a flower pot at each end.
  sofa: () => [
    path('M10 34 Q10 10 75 8 Q140 10 140 34 Z', '#9a6a3c', { stroke: WOOD_DARK, 'stroke-width': 1.4 }),
    path('M16 32 Q17 16 75 14 Q133 16 134 32', 'none', { stroke: '#7a5030', 'stroke-width': 1 }),
    ...[36, 56, 75, 94, 114].map(x => line(x, 15, x, 33, '#7a5030', 1.1)),
    circle(75, 13.6, 3.4, '#b5854f', { stroke: WOOD_DARK, 'stroke-width': 0.8 }),
    rect(6, 33, 138, 9, '#a67442', { rx: 3, stroke: WOOD_DARK, 'stroke-width': 1.2 }),
    ...[[34, '#6f8f5a'], [75, '#b5654a'], [116, '#6f8f5a']].map(([x, color]) => rect(x - 18, 27, 36, 8, color, { rx: 4, stroke: darker(color, 0.3), 'stroke-width': 0.9 })),
    rect(10, 42, 6, 22, WOOD_DARK, { rx: 1.4 }), rect(134, 42, 6, 22, WOOD_DARK, { rx: 1.4 }), rect(72, 42, 6, 20, WOOD_DARK, { rx: 1.4 }),
    path('M0 22 Q4 18 9 22 L10 40 H0 Z', '#9a6a3c', { stroke: WOOD_DARK, 'stroke-width': 1 }),
    path('M150 22 Q146 18 141 22 L140 40 H150 Z', '#9a6a3c', { stroke: WOOD_DARK, 'stroke-width': 1 }),
  ],
  // A braided rag rug.
  rug: () => [
    ellipse(100, 20, 98, 18, '#8a5a3c'),
    ellipse(100, 20, 86, 15.4, '#d9b26a'),
    ellipse(100, 20, 72, 12.6, '#6f8f5a'),
    ellipse(100, 20, 57, 9.8, '#b5654a'),
    ellipse(100, 20, 42, 7.2, '#e8d9b8'),
    ellipse(100, 20, 26, 4.4, '#d9b26a'),
    ...[92, 79, 64.5, 49.5, 34].map((rx, index) => ellipse(100, 20, rx, rx * 0.185, 'none', { stroke: '#000000', 'stroke-opacity': 0.14, 'stroke-width': 1.4, 'stroke-dasharray': index % 2 ? '3 3' : '4 2' })),
  ],
  // An ale barrel with a brass tap, mugs on top.
  coffee: () => [
    rect(4, 82, 48, 10, '#6e4a28', { rx: 1.4 }),
    path('M8 36 Q4 60 8 84 H48 Q52 60 48 36 Z', '#a8743f', { stroke: WOOD_DARK, 'stroke-width': 1.4 }),
    path('M18 37 Q15 60 18 83 M28 36 V84 M38 37 Q41 60 38 83', 'none', { stroke: '#8a5a2e', 'stroke-width': 1 }),
    ...[42, 60, 78].map(y => path(`M${y === 60 ? 4.2 : 6} ${y} Q28 ${y + 3} ${y === 60 ? 51.8 : 50} ${y}`, 'none', { stroke: '#4a4a4a', 'stroke-width': 2.4 })),
    rect(24, 62, 8, 5, BRASS, { rx: 1, stroke: '#8f6c16', 'stroke-width': 0.6 }), rect(26.4, 66, 3.2, 5, BRASS, { stroke: '#8f6c16', 'stroke-width': 0.5 }),
    ellipse(28, 36, 20, 3.4, '#8a5a2e', { stroke: WOOD_DARK, 'stroke-width': 1 }),
    ...[[14, '#9a6a3c'], [26, '#b07a48'], [38, '#9a6a3c']].flatMap(([x, color]) => [
      rect(x - 4.4, 22, 8.8, 12, color, { rx: 1.4, stroke: WOOD_DARK, 'stroke-width': 0.8 }),
      path(`M${x + 4.4} 25 q3.4 0.4 3 3.6 q-0.2 2.6 -3 2.4`, 'none', { stroke: WOOD_DARK, 'stroke-width': 1.1 }),
      ellipse(x, 21.6, 4.8, 2, '#fbf6e6'),
    ]),
  ],
  // A water pump on a stone base, a bucket below the spout.
  cooler: () => [
    rect(2, 78, 32, 14, '#a39a88', { rx: 2, stroke: '#7a7262', 'stroke-width': 1 }),
    path('M2 84 H34 M12 78 V84 M24 84 V92', 'none', { stroke: '#8a8270', 'stroke-width': 0.8 }),
    rect(13, 26, 9, 54, '#7a5332', { rx: 1.6, stroke: '#4d321d', 'stroke-width': 1 }),
    path('M22 34 H31 L31 38 H24', '#6b7280', { stroke: '#4b5563', 'stroke-width': 0.8 }),
    line(17.5, 30, 6, 16, '#4b5563', 2.2), circle(5.4, 15.2, 2.2, '#374151'),
    path('M22 68 Q22 76 30 76 L32 92 H18 Z', 'none'),
    path('M24 60 H34 L33 76 H25 Z', '#8a6038', { stroke: '#5a3b22', 'stroke-width': 0.9 }),
    path('M24 64 H34 M24.4 71 H33.4', 'none', { stroke: '#4a4a4a', 'stroke-width': 1 }),
    ellipse(29, 60, 5, 1.4, '#8ec5e8'),
    path('M30 38 Q30.6 46 29.6 58', 'none', { stroke: '#8ec5e8', 'stroke-width': 1.4, 'stroke-dasharray': '2 3', class: 'p-pour' }),
  ],
  // 0: a half barrel of flowers (the lounge corner); 1: sunflowers in a clay pot (by the door).
  plant: variant => variant % 2 === 0
    ? [
      ...[[8, 36, '#4e8a32'], [16, 30, '#5e9b39'], [26, 31, '#4e8a32'], [35, 36, '#5e9b39'], [21, 38, '#467e2e']].map(([cx, cy, color]) => circle(cx, cy, 8, color)),
      ...flowerHead(10, 30, '#e2566a', 3), ...flowerHead(20, 25, '#ffffff', 3), ...flowerHead(30, 27, '#f5c84a', 3), ...flowerHead(36, 33, '#d45ba8', 2.6),
      ...flowerHead(15, 36, '#f08a3c', 2.6), ...flowerHead(26, 37, '#e2566a', 2.4),
      path('M4 44 H40 L37 70 H7 Z', '#a8743f', { stroke: WOOD_DARK, 'stroke-width': 1.2 }),
      path('M5.4 52 H38.6 M6.8 63 H37.2', 'none', { stroke: '#4a4a4a', 'stroke-width': 2 }),
      path('M14 44 V70 M22 44 V70 M30 44 V70', 'none', { stroke: '#8a5a2e', 'stroke-width': 0.8 }),
    ]
    : [
      ...[[14, 12, 50], [24, 4, 50], [32, 18, 50]].flatMap(([x, top, bottom]) => [line(x, bottom, x, top + 6, '#4e7a2a', 1.8),
        ellipse(x - 4, top + 22, 4, 2, '#5e9b39', { transform: `rotate(-30 ${x - 4} ${top + 22})` }), ellipse(x + 4, top + 28, 4, 2, '#5e9b39', { transform: `rotate(30 ${x + 4} ${top + 28})` })]),
      ...[[14, 14], [24, 6], [32, 20]].flatMap(([x, y]) => [
        ...Array.from({ length: 10 }, (_, index) => {
          const angle = (index * Math.PI) / 5;
          return ellipse(x + Math.cos(angle) * 5, y + Math.sin(angle) * 5, 2.8, 1.4, '#f5c518', { transform: `rotate(${(index * 36)} ${x + Math.cos(angle) * 5} ${y + Math.sin(angle) * 5})` });
        }),
        circle(x, y, 3.8, '#6b3f1e', { stroke: '#4a2a12', 'stroke-width': 0.6 }),
      ]),
      path('M8 48 H38 L34 70 H12 Z', '#c0643a', { stroke: '#8a4022', 'stroke-width': 1.2 }),
      rect(6, 46, 34, 5, '#d0744a', { rx: 1.6, stroke: '#8a4022', 'stroke-width': 1 }),
    ],
};

// ---------------------------------------------------------------------------
// Stations (viewBox 68 20 72 96, floor at y = 112)
// ---------------------------------------------------------------------------

const table = (top = 84) => [
  rect(73, top, 64, 6, '#9a6a3c', { rx: 1.6, stroke: WOOD_DARK, 'stroke-width': 1 }),
  rect(76, top + 6, 5, 112 - top - 6, WOOD_DARK, { rx: 1 }), rect(129, top + 6, 5, 112 - top - 6, WOOD_DARK, { rx: 1 }),
  rect(79, top + 16, 52, 3, '#7a5030', { rx: 1 }),
];

const stations = {
  // A map table: an unrolled map with mountains and a dotted road, ink and quill, a candle.
  maptable: () => [
    ...table(),
    path('M79 83 L119 80.4 L121.6 85.4 L81.6 88 Z', PARCHMENT, { stroke: '#b9a47e', 'stroke-width': 0.8 }),
    ellipse(80.4, 85.6, 2, 2.8, '#e2cf9e', { stroke: '#b9a47e', 'stroke-width': 0.6 }),
    path('M88 84.4 l2.2 -2.6 l2.2 2.4 M93 83.8 l2.6 -3 l2.6 2.8 M110 82.6 l2 -2.2 l2 2', 'none', { stroke: '#7a6a52', 'stroke-width': 0.8 }),
    path('M86 86.6 Q96 84 101 85 Q107 86 114 82.6', 'none', { stroke: '#b23a2a', 'stroke-width': 0.8, 'stroke-dasharray': '1.6 1.4', class: 'p-screen-line' }),
    path('M113 81.4 l2 2 M115 81.4 l-2 2', 'none', { stroke: '#b23a2a', 'stroke-width': 0.9 }),
    rect(122, 76, 6, 8, '#2b2b3a', { rx: 1.4 }), path('M125 77 Q129 66 135 60 Q132 68 126 77.4 Z', '#f3f4f6', { stroke: '#cbd5e1', 'stroke-width': 0.5 }),
    rect(129.6, 79.6, 7, 4.4, BRASS, { rx: 1 }), rect(131.4, 69, 3.4, 11, '#f8f1e0', { rx: 0.8 }),
    path('M133.1 62 q-2.6 3.4 0 6.6 q2.6 -3.2 0 -6.6 Z', '#ffb02e', { class: 'flame' }),
    circle(133.1, 66, 6, '#ffd97a', { 'fill-opacity': 0.28, class: 'p-glow' }),
  ],
  // A dwarven forge: an anvil on a stump, a glowing blade, sparks, a hammer, a small brazier.
  anvil: () => [
    path('M84 94 H112 L114 112 H82 Z', '#7a5332', { stroke: '#4d321d', 'stroke-width': 1 }),
    ellipse(98, 94, 14, 3, '#a47a4c', { stroke: '#4d321d', 'stroke-width': 0.8 }),
    path('M88 93 H106 L104 86 H112 Q118 86 122 82 Q113 80 104 80.4 H86 Q83 84 88 86 Z', '#4b5563', { stroke: '#1f2937', 'stroke-width': 1 }),
    path('M88 81.6 H104', 'none', { stroke: '#9ca3af', 'stroke-width': 0.8 }),
    rect(89, 77.6, 22, 2.4, '#fb923c', { rx: 1, class: 'p-glow' }), rect(89, 77.6, 22, 2.4, '#fde68a', { rx: 1, 'fill-opacity': 0.6 }),
    ...[[100, 70], [107, 66], [94, 68], [112, 72]].map(([x, y]) => path(`M${x} ${y - 2.4} l0.8 1.6 l1.6 0.8 l-1.6 0.8 l-0.8 1.6 l-0.8 -1.6 l-1.6 -0.8 l1.6 -0.8 Z`, '#fde047', { class: 'p-spark' })),
    line(80, 112, 86, 92, '#7a5332', 2.2), rect(81.4, 86, 9, 5.4, '#6b7280', { rx: 1, transform: 'rotate(20 86 89)' }),
    path('M118 112 L121 96 H137 L140 112 Z', '#57534e', { stroke: '#292524', 'stroke-width': 1 }),
    ellipse(129, 96, 9, 2.6, '#292524'),
    ellipse(129, 95.4, 7, 1.8, '#f97316', { class: 'p-glow' }),
    path('M125 95 q1.6 -5 4 -7 q1.4 3.4 0 7 Z M129 95 q1.4 -6 4.4 -8 q1 4.4 -1 8 Z', '#fbbf24', { class: 'flame' }),
  ],
};

export default Object.freeze({
  archetypes: { hobbit, elf, dwarf, wizard, ranger, treefolk },
  decor,
  stations,
});
