// The "people" view: every task is a little animated character living in a shared office - working at
// its desk on something related to the task, taking breaks, wandering, chatting with the others.
// This module decides WHO each character is, WHAT it does next and what it SAYS; people-view.js runs the
// office and art.js draws it. Pure (no DOM), covered by tests/people-model.test.js.

import { STATUSES } from './statuses.js';
import { findFocusSubtask, getDustLevel } from './selectors.js';
import { DAY_MS, formatElapsed, hashString, truncate } from './utils.js';
import OFFICE_WORLD from './worlds/office.js';

// What a character does, found by keywords in the task's texts. "keywords" are specific (a bug, a
// supplier email); "weak" ones are generic words ("to fix", "team") that count only when no specific
// keyword appears. Among the matches, the one that appears first in the text wins - Hebrew task
// titles usually start with the verb ("לקנות מתנה לצוות" is shopping, not HR). Ties go by this order.
// Hebrew keywords match anywhere (so prefixes like ה/ל/ב/ו still match) - a trailing space marks a
// whole-word ending, so "קוד " matches "בקוד" but not "קודם". Latin keywords must start a word.
export const ACTIVITIES = Object.freeze([
  { key: 'phone', keywords: ['טלפון', 'להתקשר', 'התקשר', 'שיחה', 'שיחת', 'פגישה', 'זום', 'zoom', 'call', 'meeting', 'teams'], weak: ['לקבוע'] },
  { key: 'email', keywords: ['מייל', 'דוא"ל', 'לשלוח', 'מכתב', 'וואטסאפ', 'email', 'mail', 'whatsapp', 'outlook'], weak: ['לענות', 'הודעה'] },
  { key: 'coding', keywords: ['קוד ', 'באג', 'פיתוח', 'לפתח', 'דיפלוי', 'שרת', 'סקריפט', 'אפליקציה', 'אתר ', 'דאטה', 'מסד נתונים', 'code', 'bug', 'deploy', 'server', 'git', 'api', 'script', 'sql', 'python', 'javascript', 'backend', 'frontend', 'dev'], weak: [] },
  { key: 'testing', keywords: ['בדיקה', 'בדיקות', 'לבדוק', 'לחקור', 'מחקר', 'ניתוח', 'לנתח', 'test', 'qa', 'research', 'review'], weak: [] },
  { key: 'writing', keywords: ['מסמך', 'חוזה', 'דוח', 'מצגת', 'סיכום', 'תיעוד', 'אפיון', 'איפיון', 'doc', 'report', 'spec', 'slides'], weak: ['לכתוב', 'טופס', 'הצעה'] },
  { key: 'design', keywords: ['עיצוב', 'לעצב', 'לוגו', 'באנר', 'סרטון', 'וידאו', 'תמונה', 'design', 'figma', 'logo', 'ui', 'ux'], weak: [] },
  { key: 'money', keywords: ['תשלום', 'לשלם', 'חשבונית', 'כסף', 'תקציב', 'מחיר', 'בנק', 'משכורת', 'מס ', 'invoice', 'budget', 'pay'], weak: [] },
  { key: 'people', keywords: ['ראיון', 'גיוס', 'מועמד', 'הדרכה', 'קליטה', 'hr', 'interview', 'onboarding'], weak: ['עובד', 'משוב', 'צוות'] },
  { key: 'cleaning', keywords: ['לנקות', 'ניקיון', 'לפנות', 'clean'], weak: ['לסדר', 'סידור', 'לארגן', 'ארגון'] },
  { key: 'shopping', keywords: ['לקנות', 'קניות', 'להזמין', 'הזמנה', 'הזמנת', 'סופר', 'מתנה', 'buy', 'order', 'shop'], weak: [] },
  { key: 'travel', keywords: ['נסיעה', 'לנסוע', 'טיסה', 'חופשה', 'מלון', 'travel', 'flight', 'trip'], weak: [] },
  { key: 'sport', keywords: ['אימון', 'ספורט', 'ריצה', 'כושר', 'הליכה', 'gym', 'run', 'workout'], weak: [] },
  { key: 'fixing', keywords: ['להתקין', 'התקנה', 'תחזוקה', 'install', 'repair'], weak: ['לתקן', 'תיקון', 'להגדיר', 'הגדרה', 'fix', 'setup'] },
  { key: 'delivery', keywords: ['משלוח', 'לאסוף', 'חבילה', 'delivery', 'ship'], weak: ['להעביר', 'להביא'] },
]);
export const DEFAULT_ACTIVITY = 'coffee';

// When an in-progress item starts to "sweat", and a waiting one starts to doze off.
const SWEAT_AFTER_MS = 2 * DAY_MS;
const BORED_AFTER_MS = 3 * DAY_MS;

// ---------------------------------------------------------------------------
// Looks: every task gets its own character, drawn from many independent traits (kind, build, size,
// hair, outfit, glasses, hat...) with a random generator seeded by the task id - so it is the same
// character on every render and every device.
// ---------------------------------------------------------------------------

// Kinds and how often they appear (weights).
const KIND_WEIGHTS = Object.freeze([
  ['human', 50], ['cat', 6], ['dog', 6], ['bear', 4], ['fox', 4], ['panda', 4], ['rabbit', 4],
  ['penguin', 4], ['frog', 3], ['monkey', 4], ['robot', 6], ['alien', 5],
]);
export const CHARACTER_KINDS = Object.freeze(KIND_WEIGHTS.map(([kind]) => kind));

const SKIN_TONES = Object.freeze(['#ffe0c4', '#f9d7bd', '#f1c27d', '#e0ac69', '#c68642', '#a0662f', '#8d5524', '#5c3a1e']);
const HAIR_COLORS = Object.freeze(['#1f1f1f', '#2d1b0e', '#4a2c16', '#8b5a2b', '#a0522d', '#c0392b', '#d4a017', '#f3d27a', '#9ca3af', '#e5e7eb']);
const DYED_HAIR_COLORS = Object.freeze(['#3b82f6', '#ec4899', '#8b5cf6', '#10b981']);
const FUR_COLORS = Object.freeze({
  owl: ['#a16207', '#78716c', '#d6d3d1', '#92400e'],
  ghost: ['#f8fafc', '#e0f2fe'],
  tree: ['#92400e', '#78350f', '#a16207'],
  parrot: ['#ef4444', '#22c55e', '#3b82f6', '#f59e0b'],
  octopus: ['#f472b6', '#a855f7', '#fb923c', '#ef4444'],
  fish: ['#f97316', '#38bdf8', '#facc15', '#a3e635', '#f472b6'],
  turtle: ['#65a30d', '#16a34a', '#84cc16'],
  dino: ['#22c55e', '#84cc16', '#14b8a6', '#a855f7', '#f97316'],
  horse: ['#92400e', '#78350f', '#f5f5f4', '#374151', '#d6a46c'],
  droid: ['#e2e8f0', '#cbd5e1', '#94a3b8', '#fde68a'],
  yeti: ['#92400e', '#f5f5f4', '#a8a29e', '#78350f'],
  critter: ['#facc15', '#f472b6', '#60a5fa', '#4ade80', '#fb923c', '#c084fc'],
  cat: ['#f59e0b', '#9ca3af', '#4b5563', '#f3f4f6', '#fde68a', '#a16207'],
  dog: ['#a16207', '#d4a017', '#374151', '#f5f5f4', '#92400e', '#e7c18f'],
  bear: ['#92400e', '#78350f', '#f1f5f9', '#b45309', '#57534e'],
  fox: ['#ea580c', '#c2410c', '#f97316'],
  panda: ['#f8fafc'],
  rabbit: ['#f8fafc', '#d6d3d1', '#a8a29e', '#c8a27a'],
  penguin: ['#1f2937'],
  frog: ['#22c55e', '#16a34a', '#84cc16'],
  monkey: ['#92400e', '#78350f', '#a16207'],
  robot: ['#94a3b8', '#cbd5e1', '#a8a29e', '#7dd3fc'],
  alien: ['#4ade80', '#2dd4bf', '#a78bfa', '#f472b6'],
});
const PANTS_COLORS = Object.freeze(['#1e3a8a', '#334155', '#111827', '#6b7280', '#a3825a', '#78350f', '#1e293b', '#3f6212', '#7f1d1d']);
const SHOE_COLORS = Object.freeze(['#111827', '#f8fafc', '#dc2626', '#78350f', '#2563eb', '#f59e0b']);
const ACCENT_COLORS = Object.freeze(['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#facc15']);
export const HAIR_STYLE_COUNT = 12;
const OUTFITS = Object.freeze(['tee', 'hoodie', 'suit', 'dress', 'overalls', 'labcoat', 'stripes', 'sweater', 'vest']);
const BUILDS = Object.freeze(['slim', 'regular', 'regular', 'broad']);
const HEAD_SIZES = Object.freeze([13.5, 15, 15, 16.5]);
// [value, weight] - most characters have none.
const HEADWEAR = Object.freeze([[null, 62], ['cap', 7], ['beanie', 6], ['headphones', 7], ['bow', 5], ['flower', 5], ['hardhat', 4], ['crown', 2], ['tophat', 2]]);
const EYEWEAR = Object.freeze([[null, 66], ['round', 13], ['square', 12], ['sun', 9]]);
const FACIAL_HAIR = Object.freeze([[null, 74], ['beard', 11], ['mustache', 9], ['goatee', 6]]);
const ACCESSORIES = Object.freeze([[null, 46], ['scarf', 12], ['bowtie', 10], ['necklace', 10], ['badge', 12], ['tie', 10]]);
// Kinds with a human face (human skin tones, beards); glasses fit them and a few animals.
const HUMANLIKE_KINDS = new Set(['human', 'elf', 'dwarf', 'hobbit', 'merfolk']);
const EYEWEAR_KINDS = new Set([...HUMANLIKE_KINDS, 'cat', 'dog', 'bear', 'fox', 'panda', 'rabbit', 'monkey']);
// Some folk are small (or big) whatever their size.
const KIND_SIZE = Object.freeze({ hobbit: 0.82, dwarf: 0.87, critter: 0.8, yeti: 1.08 });
// Hair styles (HAIR_STYLES order in art.js) that suit a kind: elves and merfolk long, hobbits curly.
const KIND_HAIR_STYLES = Object.freeze({ elf: [1, 5, 2], merfolk: [1, 5], hobbit: [10, 4] });
const DYED_HAIR_SHARE = 0.08;
// Share of characters that dress up for a holiday (the rest keep their own hats, for variety).
const FESTIVE_SHARE = 0.65;

/** A small seeded random generator (mulberry32): the same seed gives the same sequence. */
function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

const pickFrom = (list, random) => list[Math.floor(random() * list.length) % list.length];
function pickWeightedValue(entries, random) {
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let remaining = random() * total;
  for (const [value, weight] of entries) {
    remaining -= weight;
    if (remaining < 0) return value;
  }
  return entries[entries.length - 1][0];
}

const LATIN_KEYWORD = /^[a-z]/;

/** Where a keyword first appears in the text (-1 if nowhere). The text is padded with spaces. */
function keywordIndex(text, keyword) {
  if (!LATIN_KEYWORD.test(keyword)) return text.indexOf(keyword);
  let index = text.indexOf(keyword);
  while (index !== -1) {
    if (!/[a-z0-9]/.test(text[index - 1])) return index;
    index = text.indexOf(keyword, index + 1);
  }
  return -1;
}

/** The activity whose keyword (of the given list: 'keywords' or 'weak') appears first in the text, or null. */
function earliestActivity(text, list) {
  let best = null;
  for (const activity of ACTIVITIES) {
    for (const keyword of activity[list]) {
      const index = keywordIndex(text, keyword);
      if (index !== -1 && (best === null || index < best.index)) best = { index, key: activity.key };
    }
  }
  return best?.key ?? null;
}

/** The activity of the first text (most specific first: the current subtask, the task, its category) that hints at one. */
export function detectActivity(texts) {
  for (const rawText of texts) {
    const trimmed = String(rawText ?? '').toLowerCase().trim();
    if (!trimmed) continue;
    const text = ` ${trimmed} `; // so keywords that end with a space also match at the very end
    const activity = earliestActivity(text, 'keywords') ?? earliestActivity(text, 'weak');
    if (activity) return activity;
  }
  return DEFAULT_ACTIVITY;
}

/**
 * The character's mood: finished tasks celebrate; a task gathering dust (two levels and up) sleeps;
 * otherwise the status of the subtask it is busy with, and for how long, decides.
 */
export function getMood(task, focusSubtask, now, dustLevel) {
  if (task.status === 'done') return 'celebrating';
  if (dustLevel >= 2) return 'sleeping';
  const elapsed = now - focusSubtask.statusChangedAt;
  switch (focusSubtask.status) {
    case 'in_progress': return elapsed >= SWEAT_AFTER_MS ? 'sweating' : 'working';
    case 'waiting': return elapsed >= BORED_AFTER_MS ? 'bored' : 'waiting';
    default: return 'idle';
  }
}

/**
 * A stable, varied look per task. cast: the world's choices (worlds/*.js "cast": weighted kinds, outfits,
 * headwear, eyewear and held items); anything it leaves out comes from the office's defaults.
 * kind: human, a fantasy folk, an animal, a robot, an alien...; skin is the skin tone (human faces) or the
 * fur / feathers / metal color; size scales the whole character; pace is its walking speed (0-1).
 */
export function lookOf(taskId, cast = {}) {
  const random = seededRandom(hashString(String(taskId)));
  const kind = pickWeightedValue(cast.kinds ?? KIND_WEIGHTS, random);
  const hasHumanFace = HUMANLIKE_KINDS.has(kind);
  const look = {
    kind,
    skin: hasHumanFace ? pickFrom(SKIN_TONES, random) : pickFrom(FUR_COLORS[kind] ?? FUR_COLORS.cat, random),
    hair: random() < (cast.dyedHairShare ?? DYED_HAIR_SHARE) ? pickFrom(DYED_HAIR_COLORS, random) : pickFrom(HAIR_COLORS, random),
    hairStyle: Math.floor(random() * HAIR_STYLE_COUNT),
    build: pickFrom(BUILDS, random),
    headSize: pickFrom(HEAD_SIZES, random),
    size: 0.86 + random() * 0.26,
    outfit: cast.outfits ? pickWeightedValue(cast.outfits, random) : pickFrom(OUTFITS, random),
    pants: pickFrom(PANTS_COLORS, random),
    shoes: pickFrom(SHOE_COLORS, random),
    accent: pickFrom(ACCENT_COLORS, random),
    headwear: pickWeightedValue(cast.headwear ?? HEADWEAR, random),
    eyewear: pickWeightedValue(cast.eyewear ?? EYEWEAR, random),
    facialHair: pickWeightedValue(FACIAL_HAIR, random),
    accessory: pickWeightedValue(ACCESSORIES, random),
    held: pickWeightedValue(cast.held ?? [[null, 1]], random),
    spotted: random() < 0.3,
    festive: random() < FESTIVE_SHARE,
    pace: random(),
  };
  if (!hasHumanFace) look.facialHair = null;
  if (!EYEWEAR_KINDS.has(kind)) look.eyewear = null;
  if (KIND_HAIR_STYLES[kind]) look.hairStyle = KIND_HAIR_STYLES[kind][look.hairStyle % KIND_HAIR_STYLES[kind].length];
  if (kind === 'dwarf') {
    look.facialHair = 'bigbeard';
    look.build = 'broad';
  }
  if (kind === 'elf') look.build = 'slim';
  look.size *= KIND_SIZE[kind] ?? 1;
  return look;
}

// ---------------------------------------------------------------------------
// Behavior: what a character does next, by its mood. The office (people-view.js) turns "go" into a
// place, walks there, then holds the pose for the duration.
//   go: 'home' (its desk) | 'nearHome' | 'wander' (anywhere) | 'party' | 'coffee' | 'cooler' | 'sofa' |
//       'window' | 'shelf' | 'plant' | null (stay)
//   pose: 'work' | 'look' | 'think' | 'sip' | 'wait' | 'sit' | 'sleep' | 'dance'
// ---------------------------------------------------------------------------

const between = (random, minMs, maxMs) => Math.round(minMs + random() * (maxMs - minMs));

/** context: { atHome, seatFree }. Returns { go, pose, durationMs }. */
export function nextBehavior(mood, { atHome = false, seatFree = false } = {}, random = Math.random) {
  const roll = random();
  switch (mood) {
    case 'working':
    case 'sweating': {
      if (!atHome) return { go: 'home', pose: 'work', durationMs: between(random, 9000, 16000) };
      const breakChance = mood === 'sweating' ? 0.3 : 0.2;
      if (roll < breakChance) return { go: random() < 0.6 ? 'coffee' : 'cooler', pose: 'sip', durationMs: between(random, 4000, 7000) };
      return { go: null, pose: 'work', durationMs: between(random, 8000, 16000) };
    }
    case 'waiting':
      if (roll < 0.22) return { go: 'cooler', pose: 'sip', durationMs: between(random, 4000, 6000) };
      if (roll < 0.36) return { go: 'window', pose: 'look', durationMs: between(random, 3000, 5000) };
      if (!atHome && roll < 0.7) return { go: 'home', pose: 'wait', durationMs: between(random, 5000, 9000) };
      return { go: 'nearHome', pose: 'wait', durationMs: between(random, 5000, 10000) };
    case 'bored':
      if (seatFree && roll < 0.7) return { go: 'sofa', pose: 'sit', durationMs: between(random, 15000, 30000) };
      return { go: 'nearHome', pose: 'wait', durationMs: between(random, 6000, 10000) };
    case 'sleeping':
      return { go: atHome ? null : 'home', pose: 'sleep', durationMs: 60000 };
    case 'celebrating':
      if (roll < 0.6) return { go: 'party', pose: 'dance', durationMs: between(random, 4000, 7000) };
      return { go: 'wander', pose: 'dance', durationMs: between(random, 3000, 5000) };
    default: // idle (to-do): roams the office
      if (roll < 0.4) return { go: 'wander', pose: 'look', durationMs: between(random, 2000, 4000) };
      if (roll < 0.55) return { go: pickFrom(['window', 'shelf', 'plant'], random), pose: 'look', durationMs: between(random, 3000, 5000) };
      if (roll < 0.68) return { go: random() < 0.6 ? 'coffee' : 'cooler', pose: 'sip', durationMs: between(random, 3000, 6000) };
      if (roll < 0.82) return { go: 'home', pose: 'think', durationMs: between(random, 3000, 6000) };
      return { go: null, pose: 'look', durationMs: between(random, 2000, 3000) };
  }
}

/**
 * Everything the view and the chatter need to know about one task's character.
 * world: the themed world (worlds/*.js) its look comes from; the office by default.
 */
export function buildPersona(task, category, { now, today, world = OFFICE_WORLD }) {
  const focus = findFocusSubtask(task);
  const dustLevel = getDustLevel(task, now);
  const doneCount = task.subtasks.filter(subtask => subtask.status === 'done').length;
  const isTimed = Boolean(STATUSES[focus.status].since);
  return {
    taskId: task.id,
    title: task.title,
    subtaskTitle: focus.title,
    status: task.status,
    focusStatus: focus.status,
    mood: getMood(task, focus, now, dustLevel),
    activity: detectActivity([focus.title, task.title, task.description, category?.name]),
    categoryName: category?.name ?? null,
    categoryColor: category?.color ?? null,
    progress: { done: doneCount, total: task.subtasks.length },
    elapsedLabel: isTimed ? formatElapsed(now - focus.statusChangedAt) : null,
    idleLabel: dustLevel > 0 ? formatElapsed(now - task.updatedAt) : null,
    dustLevel,
    isMyDay: task.subtasks.some(subtask => subtask.myDay === today && subtask.status !== 'done'),
    look: lookOf(task.id, world.cast),
    worldKey: world.key,
  };
}

// ---------------------------------------------------------------------------
// Conversations. Lines are written without gendered verb forms (first person past/future,
// impersonal plural), since any character may be anyone.
// ---------------------------------------------------------------------------

const TITLE_LENGTH = 24;

// The lines themselves live in the worlds (worlds/<key>.js "lines"); the office's are the default.
const OFFICE_LINES = OFFICE_WORLD.lines;

const SMALL_TALK_CHANCE = 0.12;
const MY_DAY_CHANCE = 0.5;
const SEASON_CHANCE = 0.35;
const SAME_CATEGORY_CHANCE = 0.5;

function choose(list, random) {
  return list[Math.floor(random() * list.length) % list.length];
}

// One pass with a function, so a title that contains "$&" or "{total}" is inserted as is.
function fill(template, persona, { greeting = '' } = {}) {
  const values = {
    sub: truncate(persona.subtaskTitle, TITLE_LENGTH),
    task: truncate(persona.title, TITLE_LENGTH),
    done: String(persona.progress.done),
    total: String(persona.progress.total),
    elapsed: persona.elapsedLabel ?? 'הרבה זמן',
    idle: persona.idleLabel ?? 'הרבה זמן',
    category: truncate(persona.categoryName ?? '', 16),
    greeting,
  };
  return template.replace(/\{(sub|task|done|total|elapsed|idle|category|greeting)\}/g, (_, key) => values[key]);
}

/** The placeholders a world's lines may use (tests/worlds.test.js checks them). */
export const LINE_PLACEHOLDERS = Object.freeze(['sub', 'task', 'done', 'total', 'elapsed', 'idle', 'category', 'greeting']);

/**
 * A line for what the character is doing right now (null when there is nothing to say about it).
 * lines: the world's lines (worlds/*.js); the office's by default - as for the functions below.
 */
export function composePoseLine(pose, persona, { random = Math.random, lines = OFFICE_LINES } = {}) {
  const poseLines = lines.poses?.[pose];
  return poseLines?.length ? fill(choose(poseLines, random), persona) : null;
}

/** What a character says about itself (a hover, or a character alone on the floor). */
export function composeMonologue(persona, { random = Math.random, greeting = null, lines = OFFICE_LINES } = {}) {
  if (greeting && random() < SEASON_CHANCE) return [{ from: 0, text: `${greeting}!` }];
  if (persona.isMyDay && persona.mood !== 'celebrating' && random() < MY_DAY_CHANCE) {
    return [{ from: 0, text: fill(lines.myDay, persona) }];
  }
  return [{ from: 0, text: fill(choose(lines.openers[persona.mood] ?? lines.openers.idle, random), persona) }];
}

/**
 * A short exchange between two characters: [{ from: 0 | 1, text }]. The first speaks about its task,
 * the second answers (and sometimes mentions what it is busy with itself).
 */
export function composeConversation(speaker, listener, { random = Math.random, greeting = null, lines = OFFICE_LINES } = {}) {
  if (random() < SMALL_TALK_CHANCE) {
    const [question, answer] = choose(lines.smallTalk, random);
    return [{ from: 0, text: question }, { from: 1, text: answer }];
  }
  if (greeting && random() < SEASON_CHANCE) {
    return [{ from: 0, text: `${greeting}!` }, { from: 1, text: fill(lines.greetingReply, speaker, { greeting }) }];
  }
  const exchange = composeMonologue(speaker, { random, lines });
  const isSameCategory = speaker.categoryName && speaker.categoryName === listener.categoryName;
  if (isSameCategory && random() < SAME_CATEGORY_CHANCE) {
    exchange.push({ from: 1, text: fill(lines.sameCategory, speaker) });
  } else {
    exchange.push({ from: 1, text: fill(choose(lines.replies[speaker.mood] ?? lines.replies.idle, random), speaker) });
  }
  // Now and then the listener shares what it is stuck with, too.
  if (listener.mood !== 'celebrating' && listener.mood !== 'sleeping' && random() < 0.3) {
    exchange.push({ from: 1, text: fill(lines.listenerBusy, listener) });
  }
  return exchange;
}
