// The people view: every visible task is a little animated character at its station, and from time
// to time two of them chat in speech bubbles. people-model.js decides what they do and say, art.js
// draws them, and the animations are CSS (styles.css, "People view").
//
// The scene is updated in place, keyed by task id: a character is rebuilt only when something it shows
// changed, so the periodic re-render does not restart every animation.

import { h } from './dom.js';
import { icon } from './icons.js';
import { STATUSES } from './statuses.js';
import { createCharacterArt, createSeasonEmblem } from './art.js';
import { composeConversation, composeMonologue } from './people-model.js';
import { UNCATEGORIZED_COLOR } from './render.js';

// Beyond this many characters the scene gets heavy; the rest are listed as hidden (filters narrow it down).
export const MAX_PEOPLE = 48;

const CONVERSATION_GAP_MS = Object.freeze([5000, 9000]);
const LINE_BASE_MS = 2200;
const LINE_PER_CHAR_MS = 45;
const LINE_MAX_MS = 5200;
const LINE_PAUSE_MS = 350;
const CHEER_MS = 1800;
const NEAREST_LISTENERS = 3;
// The figure's head is at a third of its stage's width (art.js); bubbles point there (styles.css: .bubble { left: 33% }).
const HEAD_POSITION = 0.33;
const BUBBLE_EDGE_MARGIN_PX = 6;

function timeOfDay(hour) {
  if (hour >= 5 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 17) return 'day';
  if (hour >= 17 && hour < 20) return 'evening';
  return 'night';
}

function signatureOf(persona, seasonKey) {
  return JSON.stringify([
    persona.title, persona.subtaskTitle, persona.status, persona.mood, persona.activity, persona.categoryColor,
    persona.categoryName, persona.progress.done, persona.progress.total, persona.dustLevel, persona.isMyDay,
    Boolean(persona.elapsedLabel), seasonKey,
  ]);
}

function buildPerson(persona, signature, seasonKey) {
  const { label } = STATUSES[persona.status];
  const { done, total } = persona.progress;
  const busyWith = persona.status === 'done' ? '' : `\nעכשיו: ${persona.subtaskTitle}`;
  return h('button', {
    type: 'button',
    class: 'person',
    cssVars: { '--cat-color': persona.categoryColor ?? UNCATEGORIZED_COLOR },
    dataset: {
      action: 'open-task', taskId: persona.taskId, focusKey: `person-${persona.taskId}`, signature,
      status: persona.status, mood: persona.mood, activity: persona.activity, dust: persona.dustLevel || null,
    },
    title: `${persona.title}${busyWith}`,
    'aria-label': `${persona.title}. ${label}, ${done} מתוך ${total} תתי משימות הושלמו. לחיצה פותחת את המשימה`,
  },
  h('span', { class: 'person-stage' }, createCharacterArt(persona, { seasonKey })),
  persona.dustLevel >= 2 && h('span', { class: 'person-cobweb', 'aria-hidden': 'true' }),
  h('span', { class: 'person-tag' },
    h('span', { class: 'person-title' },
      persona.isMyDay && h('span', { class: 'person-myday', title: 'ב"היום שלי"' }, icon('sun', { size: 13 })),
      persona.title),
    h('span', { class: 'person-meta' },
      h('span', { class: 'person-status' }, h('span', { class: 'dot', 'aria-hidden': 'true' }), label),
      h('span', { dir: 'ltr' }, `${done}/${total}`),
      persona.elapsedLabel && h('span', { class: 'person-since' }, persona.elapsedLabel))));
}

/**
 * personas: buildPersona results in display order (at most MAX_PEOPLE). hiddenCount: visible tasks left out.
 * The container keeps a "sky" header, the floor of characters and a note.
 */
export function renderPeopleScene(container, personas, { seasonKey = null, hiddenCount = 0, hour = new Date().getHours() } = {}) {
  let sky = container.querySelector(':scope > .scene-sky');
  let floor = container.querySelector(':scope > .scene-floor');
  let note = container.querySelector(':scope > .scene-note');
  if (!sky || !floor || !note) {
    sky = h('div', { class: 'scene-sky' });
    floor = h('div', { class: 'scene-floor' });
    note = h('p', { class: 'scene-note' });
    container.replaceChildren(sky, floor, note);
  }

  const skyKey = `${timeOfDay(hour)}|${seasonKey ?? ''}|${personas.length}`;
  if (sky.dataset.key !== skyKey) {
    sky.dataset.key = skyKey;
    sky.dataset.time = timeOfDay(hour);
    sky.replaceChildren(
      h('span', { class: 'scene-celestial', 'aria-hidden': 'true' }),
      h('span', { class: 'scene-cloud scene-cloud-1', 'aria-hidden': 'true' }),
      h('span', { class: 'scene-cloud scene-cloud-2', 'aria-hidden': 'true' }),
      h('span', { class: 'scene-title' }, 'המשרד של המשימות'),
      h('span', { class: 'scene-count' }, personas.length === 1 ? 'דמות אחת' : `${personas.length} דמויות`),
      seasonKey && createSeasonEmblem(seasonKey, { size: 30 }));
  }

  // Keep the characters whose look did not change; rebuild the others.
  const existing = new Map([...floor.children].map(element => [element.dataset.taskId, element]));
  const wanted = personas.map(persona => {
    const signature = signatureOf(persona, seasonKey);
    const current = existing.get(persona.taskId);
    if (current && current.dataset.signature === signature) {
      existing.delete(persona.taskId);
      const since = current.querySelector('.person-since');
      if (since && persona.elapsedLabel && since.textContent !== persona.elapsedLabel) since.textContent = persona.elapsedLabel;
      return current;
    }
    return buildPerson(persona, signature, seasonKey);
  });
  for (const stale of existing.values()) stale.remove();
  // Move only what is out of place: re-inserting an element restarts its animations.
  wanted.forEach((element, index) => {
    if (floor.children[index] !== element) floor.insertBefore(element, floor.children[index] ?? null);
  });

  note.hidden = hiddenCount === 0;
  note.textContent = hiddenCount > 0
    ? `מוצגות ${personas.length} דמויות. עוד ${hiddenCount} משימות לא מוצגות כאן - אפשר לצמצם עם הסינון, או לעבור לתצוגת ריבועים בהגדרות.`
    : '';
}

/**
 * Background chatter: every few seconds two characters (the second one of the nearest) talk.
 * getPersona(taskId) gives the up-to-date persona; canTalk() pauses it (say, while a dialog is open);
 * getGreeting() returns the holiday greeting or null.
 */
export function createChatter({ scene, getPersona, canTalk = () => true, getGreeting = () => null }) {
  let timer = null;
  let isRunning = false;
  let isConversing = false;
  const pendingTimers = new Set();

  const later = (callback, delayMs) => {
    const id = setTimeout(() => {
      pendingTimers.delete(id);
      callback();
    }, delayMs);
    pendingTimers.add(id);
  };
  const personElement = taskId => scene.querySelector(`.person[data-task-id="${CSS.escape(taskId)}"]`);
  const lineDuration = text => Math.min(LINE_MAX_MS, LINE_BASE_MS + text.length * LINE_PER_CHAR_MS);
  const centerOf = element => {
    const rect = element.getBoundingClientRect();
    // The figure stands in the left third of its stage (the station is on the right).
    return { x: rect.left + rect.width * HEAD_POSITION, y: rect.top + rect.height / 2 };
  };

  // A bubble over a character at the edge of the room would be cut off: slide it inside.
  function keepInsideScene(bubble, person) {
    const sceneRect = scene.getBoundingClientRect();
    const headX = centerOf(person).x;
    const halfWidth = bubble.offsetWidth / 2;
    const overflowStart = sceneRect.left + BUBBLE_EDGE_MARGIN_PX - (headX - halfWidth);
    const overflowEnd = headX + halfWidth - (sceneRect.right - BUBBLE_EDGE_MARGIN_PX);
    const shift = overflowStart > 0 ? overflowStart : (overflowEnd > 0 ? -overflowEnd : 0);
    if (shift !== 0) bubble.style.setProperty('--bubble-shift', `${Math.round(shift)}px`);
  }

  function showBubble(taskId, text, durationMs) {
    const person = personElement(taskId);
    if (!person) return;
    person.querySelector(':scope > .bubble')?.remove();
    const bubble = h('span', { class: 'bubble', 'aria-hidden': 'true' }, text);
    person.append(bubble);
    keepInsideScene(bubble, person);
    person.classList.add('is-talking');
    later(() => {
      bubble.remove();
      if (!person.querySelector(':scope > .bubble')) person.classList.remove('is-talking');
    }, durationMs);
  }

  function faceEachOther(speakerElement, listenerElement) {
    const speakerX = centerOf(speakerElement).x;
    const listenerX = centerOf(listenerElement).x;
    speakerElement.dataset.facing = listenerX < speakerX ? 'left' : 'right';
    listenerElement.dataset.facing = speakerX < listenerX ? 'left' : 'right';
  }

  function nearestListener(speakerElement, people) {
    const from = centerOf(speakerElement);
    const others = people
      .filter(element => element !== speakerElement)
      .map(element => {
        const to = centerOf(element);
        return { element, distance: Math.hypot(to.x - from.x, to.y - from.y) };
      })
      .sort((a, b) => a.distance - b.distance)
      .slice(0, NEAREST_LISTENERS);
    return others[Math.floor(Math.random() * others.length)]?.element ?? null;
  }

  function speak(lines, speakerId, listenerId) {
    isConversing = true;
    let delay = 0;
    for (const line of lines) {
      const taskId = line.from === 0 ? speakerId : listenerId;
      const duration = lineDuration(line.text);
      later(() => showBubble(taskId, line.text, duration), delay);
      delay += duration + LINE_PAUSE_MS;
    }
    later(() => {
      isConversing = false;
      for (const taskId of [speakerId, listenerId]) {
        if (taskId) delete personElement(taskId)?.dataset.facing;
      }
    }, delay);
  }

  function converse() {
    const people = [...scene.querySelectorAll('.person')];
    if (people.length === 0) return;
    const speakerElement = people[Math.floor(Math.random() * people.length)];
    const speaker = getPersona(speakerElement.dataset.taskId);
    if (!speaker) return;
    const greeting = getGreeting();
    const listenerElement = nearestListener(speakerElement, people);
    const listener = listenerElement ? getPersona(listenerElement.dataset.taskId) : null;
    if (!listener) {
      speak(composeMonologue(speaker, { greeting }), speaker.taskId, null);
      return;
    }
    faceEachOther(speakerElement, listenerElement);
    speak(composeConversation(speaker, listener, { greeting }), speaker.taskId, listener.taskId);
  }

  function schedule() {
    const [min, max] = CONVERSATION_GAP_MS;
    timer = setTimeout(tick, min + Math.random() * (max - min));
  }

  function tick() {
    if (!isRunning) return;
    try {
      if (document.visibilityState === 'visible' && !isConversing && canTalk()) converse();
    } finally {
      schedule(); // one failed conversation must not silence the room for good
    }
  }

  return {
    start() {
      if (isRunning) return;
      isRunning = true;
      schedule();
    },
    stop() {
      if (!isRunning) return;
      isRunning = false;
      isConversing = false;
      clearTimeout(timer);
      for (const id of pendingTimers) clearTimeout(id);
      pendingTimers.clear();
      for (const bubble of scene.querySelectorAll('.bubble')) bubble.remove();
      for (const person of scene.querySelectorAll('.person')) {
        person.classList.remove('is-talking');
        delete person.dataset.facing;
      }
    },
    /** A character says something about its own task (on hover), unless it is already talking. */
    sayAbout(taskId) {
      const person = personElement(taskId);
      const persona = getPersona(taskId);
      if (!person || !persona || person.classList.contains('is-talking')) return;
      const [line] = composeMonologue(persona, { greeting: getGreeting() });
      showBubble(taskId, line.text, lineDuration(line.text));
    },
    /** A short victory jump (a task was just finished). */
    cheer(taskId) {
      const person = personElement(taskId);
      if (!person) return;
      person.classList.add('is-cheering');
      setTimeout(() => person.classList.remove('is-cheering'), CHEER_MS);
    },
  };
}
