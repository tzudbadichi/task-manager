// The "people" view: every task is a little animated character doing something related to the task.
// This module decides WHAT each character does and says; people-view.js and art.js draw it.
// Pure (no DOM), covered by tests/people-model.test.js.

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

const SKIN_TONES = Object.freeze(['#f9d7bd', '#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#ffe0c4']);
const HAIR_COLORS = Object.freeze(['#2d1b0e', '#4a2c16', '#8b5a2b', '#d4a017', '#1f1f1f', '#a0522d', '#6b4423', '#c0392b']);
const PANTS_COLORS = Object.freeze(['#334155', '#1e3a8a', '#3f3f46', '#14532d', '#4c1d95']);
export const HAIR_STYLE_COUNT = 4;

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

/** A stable look per task: skin tone, hair color and style, pants. */
export function lookOf(taskId) {
  const hash = hashString(String(taskId));
  return {
    skin: SKIN_TONES[hash % SKIN_TONES.length],
    hair: HAIR_COLORS[(hash >>> 4) % HAIR_COLORS.length],
    hairStyle: (hash >>> 8) % HAIR_STYLE_COUNT,
    pants: PANTS_COLORS[(hash >>> 12) % PANTS_COLORS.length],
  };
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
