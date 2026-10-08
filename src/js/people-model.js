// The "people" view: every task is a little animated character living in a shared office - working at
// its desk on something related to the task, taking breaks, wandering, chatting with the others.
// This module decides WHO each character is, WHAT it does next and what it SAYS; people-view.js runs the
// office and art.js draws it. Pure (no DOM), covered by tests/people-model.test.js.

import { STATUSES } from './statuses.js';
import { findFocusSubtask, getDustLevel } from './selectors.js';
import { DAY_MS, formatElapsed, hashString, truncate } from './utils.js';

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
// Glasses do not fit every face.
const NO_EYEWEAR_KINDS = new Set(['frog', 'penguin', 'robot', 'alien']);
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
 * A stable, varied look per task. kind: human, an animal, a robot or an alien. skin is the skin tone
 * (humans) or the fur / metal color; size scales the whole character; pace is its walking speed (0-1).
 */
export function lookOf(taskId) {
  const random = seededRandom(hashString(String(taskId)));
  const kind = pickWeightedValue(KIND_WEIGHTS, random);
  const isHuman = kind === 'human';
  const look = {
    kind,
    skin: isHuman ? pickFrom(SKIN_TONES, random) : pickFrom(FUR_COLORS[kind], random),
    hair: random() < 0.08 ? pickFrom(DYED_HAIR_COLORS, random) : pickFrom(HAIR_COLORS, random),
    hairStyle: Math.floor(random() * HAIR_STYLE_COUNT),
    build: pickFrom(BUILDS, random),
    headSize: pickFrom(HEAD_SIZES, random),
    size: 0.86 + random() * 0.26,
    outfit: pickFrom(OUTFITS, random),
    pants: pickFrom(PANTS_COLORS, random),
    shoes: pickFrom(SHOE_COLORS, random),
    accent: pickFrom(ACCENT_COLORS, random),
    headwear: pickWeightedValue(HEADWEAR, random),
    eyewear: pickWeightedValue(EYEWEAR, random),
    facialHair: pickWeightedValue(FACIAL_HAIR, random),
    accessory: pickWeightedValue(ACCESSORIES, random),
    spotted: random() < 0.3,
    festive: random() < FESTIVE_SHARE,
    pace: random(),
  };
  if (!isHuman) look.facialHair = null;
  if (NO_EYEWEAR_KINDS.has(kind)) look.eyewear = null;
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

/** Everything the view and the chatter need to know about one task's character. */
export function buildPersona(task, category, { now, today }) {
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
    look: lookOf(task.id),
  };
}

// ---------------------------------------------------------------------------
// Conversations. Lines are written without gendered verb forms (first person past/future,
// impersonal plural), since any character may be anyone.
// ---------------------------------------------------------------------------

const TITLE_LENGTH = 24;

const OPENERS = Object.freeze({
  idle: [
    'מתי מתחילים עם "{sub}"?',
    'יש לי תוכנית: קודם "{sub}". רק צריך להתחיל',
    'מישהו יודע מה הצעד הראשון ב"{task}"?',
  ],
  working: [
    'באמצע "{sub}", לא להפריע',
    'עוד קצת ו"{sub}" מאחוריי',
    '{done} מתוך {total} כבר בכיס',
  ],
  sweating: [
    'כבר {elapsed} על "{sub}". חם פה',
    '"{sub}" לא נגמר... כבר {elapsed}',
  ],
  waiting: [
    'שלחתי, ועכשיו מחכים לתשובה על "{sub}"',
    'עדיין אין תשובה על "{sub}"',
  ],
  bored: [
    '{elapsed} בלי תשובה על "{sub}". אולי תזכורת?',
    'עוד מחכים... כבר {elapsed}',
  ],
  sleeping: [
    'לא נגעו בי {idle}. זוכרים אותי?',
    'תעירו אותי כשמתחילים עם "{task}"',
  ],
  celebrating: [
    'סיימנו את "{task}"!',
    'הכל סגור: {total} מתוך {total}',
  ],
});

const REPLIES = Object.freeze({
  idle: ['אולי עכשיו? אפשר להתחיל בקטן', 'קדימה, צעד ראשון', 'הכפתור "מה עכשיו?" יכול לבחור'],
  working: ['בהצלחה!', 'רוצה קפה?', 'איזה קצב!'],
  sweating: ['מגיעה לך הפסקה', 'אולי לפרק את זה לצעדים קטנים?'],
  waiting: ['זה יגיע, סבלנות', 'גם אצלי לפעמים לוקח זמן'],
  bored: ['אולי לשלוח תזכורת?', 'שווה להרים טלפון'],
  sleeping: ['מישהו צריך לנער פה את האבק', 'אולי פשוט לסגור את זה?'],
  celebrating: ['כל הכבוד!', 'מגיעה חגיגה', 'מתי המסיבה?'],
});

const SMALL_TALK = Object.freeze([
  ['מה נשמע?', 'יש עבודה, אין תלונות'],
  ['מי בא לקפה?', 'עוד חמש דקות'],
  ['ראיתם את המטען שלי?', 'בדיוק איפה שהשארת אותו'],
]);

const SMALL_TALK_CHANCE = 0.12;
const MY_DAY_CHANCE = 0.5;
const SEASON_CHANCE = 0.35;
const SAME_CATEGORY_CHANCE = 0.5;

function choose(list, random) {
  return list[Math.floor(random() * list.length) % list.length];
}

// One pass with a function, so a title that contains "$&" or "{total}" is inserted as is.
function fill(template, persona) {
  const values = {
    sub: truncate(persona.subtaskTitle, TITLE_LENGTH),
    task: truncate(persona.title, TITLE_LENGTH),
    done: String(persona.progress.done),
    total: String(persona.progress.total),
    elapsed: persona.elapsedLabel ?? 'הרבה זמן',
    idle: persona.idleLabel ?? 'הרבה זמן',
  };
  return template.replace(/\{(sub|task|done|total|elapsed|idle)\}/g, (_, key) => values[key]);
}

// What a character says to itself while doing something (no listener needed).
const POSE_LINES = Object.freeze({
  sip: ['רק קפה אחד וחוזרים לעבודה', 'הקפה היום חזק במיוחד', 'הפסקה קטנה, מגיעה לנו'],
  sit: ['רק דקה על הספה...', 'הספה הזו נוחה מדי'],
  sleep: ['זזז...', 'עוד חמש דקות...'],
  look: ['איזה יום בחוץ', 'מה עושים עכשיו?', 'סיבוב קטן במשרד'],
  think: ['רגע, מאיפה מתחילים עם "{sub}"?', 'צריך תוכנית ל"{task}"'],
  work: ['מתקדמים עם "{sub}"', 'עוד קצת ועוד קצת'],
  wait: ['כמה עוד אפשר לחכות?', 'אולי כבר ענו?'],
  dance: ['סיימנו! מסיבה!', 'יש! "{task}" מאחורינו'],
});

/** A line for what the character is doing right now (null when there is nothing to say about it). */
export function composePoseLine(pose, persona, { random = Math.random } = {}) {
  const lines = POSE_LINES[pose];
  return lines ? fill(choose(lines, random), persona) : null;
}

/** What a character says about itself (a hover, or a character alone on the floor). */
export function composeMonologue(persona, { random = Math.random, greeting = null } = {}) {
  if (greeting && random() < SEASON_CHANCE) return [{ from: 0, text: `${greeting}!` }];
  if (persona.isMyDay && persona.mood !== 'celebrating' && random() < MY_DAY_CHANCE) {
    return [{ from: 0, text: `"${truncate(persona.subtaskTitle, TITLE_LENGTH)}" ברשימה של היום שלי!` }];
  }
  return [{ from: 0, text: fill(choose(OPENERS[persona.mood] ?? OPENERS.idle, random), persona) }];
}

/**
 * A short exchange between two characters: [{ from: 0 | 1, text }]. The first speaks about its task,
 * the second answers (and sometimes mentions what it is busy with itself).
 */
export function composeConversation(speaker, listener, { random = Math.random, greeting = null } = {}) {
  if (random() < SMALL_TALK_CHANCE) {
    const [question, answer] = choose(SMALL_TALK, random);
    return [{ from: 0, text: question }, { from: 1, text: answer }];
  }
  if (greeting && random() < SEASON_CHANCE) {
    return [{ from: 0, text: `${greeting}!` }, { from: 1, text: `${greeting} גם לך!` }];
  }
  const lines = composeMonologue(speaker, { random });
  const isSameCategory = speaker.categoryName && speaker.categoryName === listener.categoryName;
  if (isSameCategory && random() < SAME_CATEGORY_CHANCE) {
    lines.push({ from: 1, text: `גם אני ב${truncate(speaker.categoryName, 16)}. נעבוד ביחד` });
  } else {
    lines.push({ from: 1, text: choose(REPLIES[speaker.mood] ?? REPLIES.idle, random) });
  }
  // Now and then the listener shares what it is stuck with, too.
  if (listener.mood !== 'celebrating' && listener.mood !== 'sleeping' && random() < 0.3) {
    lines.push({ from: 1, text: `ואני עוד על "${truncate(listener.subtaskTitle, TITLE_LENGTH)}"` });
  }
  return lines;
}
