import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_ACTIVITY, buildPersona, composeConversation, composeMonologue, detectActivity, getMood, lookOf,
} from '../src/js/people-model.js';
import { deriveTaskStatus } from '../src/js/statuses.js';

const NOW = Date.UTC(2026, 9, 7, 12, 0, 0);
const HOUR = 60 * 60_000;
const DAY = 24 * HOUR;

let idCounter = 0;
function subtask(title, status = 'todo', statusChangedAt = NOW - HOUR, extra = {}) {
  idCounter += 1;
  return { id: `s-${idCounter}`, title, status, statusChangedAt, createdAt: NOW - DAY, updatedAt: statusChangedAt, ...extra };
}
function task(title, subtasks, extra = {}) {
  idCounter += 1;
  return {
    id: `t-${idCounter}`, title, description: '', categoryId: null, status: deriveTaskStatus(subtasks), subtasks,
    statusChangedAt: NOW - HOUR, createdAt: NOW - DAY, updatedAt: NOW - HOUR, ...extra,
  };
}
// A predictable "random": cycles through the given values.
const sequence = (...values) => {
  let index = 0;
  return () => values[index++ % values.length];
};

describe('what a character does', () => {
  test('the activity comes from keywords, most specific text first', () => {
    assert.equal(detectActivity(['להתקשר ללקוח', 'פיתוח אתר']), 'phone');
    assert.equal(detectActivity(['', 'לתקן באג בשרת']), 'coding');
    assert.equal(detectActivity(['לשלוח מייל לספק']), 'email');
    assert.equal(detectActivity(['Fix the deploy script']), 'coding');
    assert.equal(detectActivity(['לקנות מתנה']), 'shopping');
    assert.equal(detectActivity(['משהו כללי', null, 'HR']), 'people', 'the category name is the last hint');
    assert.equal(detectActivity(['משהו כללי']), DEFAULT_ACTIVITY);
  });

  test('Hebrew whole-word keywords and Latin word starts avoid false matches', () => {
    assert.equal(detectActivity(['לכתוב קוד']), 'coding');
    assert.equal(detectActivity(['קודם כל לנוח']), DEFAULT_ACTIVITY, '"קודם" is not "קוד"');
    assert.equal(detectActivity(['build pipeline']), DEFAULT_ACTIVITY, '"ui" inside "build" does not count');
  });

  test('the first specific keyword in the text wins; generic words count only when nothing specific appears', () => {
    assert.equal(detectActivity(['לקנות מתנה לצוות']), 'shopping', 'the verb comes first; "team" is generic');
    assert.equal(detectActivity(['לתקן באג בשרת']), 'coding', '"to fix" is generic, "bug" is specific');
    assert.equal(detectActivity(['לתקן מזגן']), 'fixing');
    assert.equal(detectActivity(['הזמנת ציוד']), 'shopping');
    assert.equal(detectActivity(['להתקשר ללקוח לגבי האתר']), 'phone');
  });

  test('the mood follows the status, how long it lasts, and the dust', () => {
    const working = subtask('x', 'in_progress', NOW - HOUR);
    assert.equal(getMood(task('t', [working]), working, NOW, 0), 'working');
    const longWork = subtask('x', 'in_progress', NOW - 3 * DAY);
    assert.equal(getMood(task('t', [longWork]), longWork, NOW, 0), 'sweating');
    const waiting = subtask('x', 'waiting', NOW - DAY);
    assert.equal(getMood(task('t', [waiting]), waiting, NOW, 0), 'waiting');
    const longWait = subtask('x', 'waiting', NOW - 4 * DAY);
    assert.equal(getMood(task('t', [longWait]), longWait, NOW, 0), 'bored');
    const todo = subtask('x');
    assert.equal(getMood(task('t', [todo]), todo, NOW, 0), 'idle');
    assert.equal(getMood(task('t', [todo]), todo, NOW, 2), 'sleeping');
    const done = subtask('x', 'done');
    assert.equal(getMood(task('t', [done]), done, NOW, 0), 'celebrating');
  });

  test('every task keeps the same look', () => {
    assert.deepEqual(lookOf('task-1'), lookOf('task-1'));
    assert.ok(lookOf('task-1').skin.startsWith('#'));
  });

  test('buildPersona describes the task through the subtask it is busy with', () => {
    const busy = subtask('להתקשר לספק', 'in_progress', NOW - 2 * HOUR, { myDay: '2026-10-07' });
    const persona = buildPersona(task('הזמנת ציוד', [subtask('לבחור דגם', 'done'), busy]), { name: 'רכש', color: '#16a34a' },
      { now: NOW, today: '2026-10-07' });
    assert.equal(persona.subtaskTitle, 'להתקשר לספק');
    assert.equal(persona.activity, 'phone');
    assert.equal(persona.mood, 'working');
    assert.deepEqual(persona.progress, { done: 1, total: 2 });
    assert.equal(persona.elapsedLabel, 'שעתיים');
    assert.equal(persona.isMyDay, true);
    assert.equal(persona.categoryColor, '#16a34a');
  });
});

describe('what characters say', () => {
  const persona = (overrides = {}) => ({
    taskId: 'a', title: 'הקמת סביבת בדיקות', subtaskTitle: 'לבקש הרשאות', mood: 'waiting', categoryName: 'פיתוח',
    progress: { done: 1, total: 3 }, elapsedLabel: 'יומיים', idleLabel: null, isMyDay: false, ...overrides,
  });

  test('a conversation: the speaker talks about its task and the listener answers', () => {
    const lines = composeConversation(persona(), persona({ taskId: 'b', categoryName: 'HR', mood: 'working' }),
      { random: sequence(0.9, 0.0, 0.0, 0.9) });
    assert.equal(lines[0].from, 0);
    assert.equal(lines[0].text, 'שלחתי, ועכשיו מחכים לתשובה על "לבקש הרשאות"');
    assert.equal(lines[1].from, 1);
    assert.ok(lines[1].text.length > 0);
  });

  test('characters of the same category may team up; holiday greetings are exchanged', () => {
    const sameCategory = composeConversation(persona(), persona({ taskId: 'b' }), { random: sequence(0.9, 0.0, 0.0) });
    assert.equal(sameCategory[1].text, 'גם אני בפיתוח. נעבוד ביחד');
    const greeting = composeConversation(persona(), persona({ taskId: 'b' }), { random: sequence(0.9, 0.1), greeting: 'חג אורים שמח' });
    assert.deepEqual(greeting, [{ from: 0, text: 'חג אורים שמח!' }, { from: 1, text: 'חג אורים שמח גם לך!' }]);
  });

  test('a monologue fills in the details and shortens long titles', () => {
    const [line] = composeMonologue(persona({ mood: 'bored', elapsedLabel: '5 ימים', subtaskTitle: 'א'.repeat(40) }), { random: () => 0 });
    assert.equal(line.text, `5 ימים בלי תשובה על "${'א'.repeat(23)}…". אולי תזכורת?`);
    const [sleepy] = composeMonologue(persona({ mood: 'sleeping', idleLabel: '40 ימים' }), { random: () => 0 });
    assert.equal(sleepy.text, 'לא נגעו בי 40 ימים. זוכרים אותי?');
  });

  test('titles are inserted as they are, even with "$&" or a placeholder in them', () => {
    const [line] = composeMonologue(persona({ mood: 'idle', subtaskTitle: 'pay $& now {total}' }), { random: () => 0 });
    assert.equal(line.text, 'מתי מתחילים עם "pay $& now {total}"?');
  });
});
