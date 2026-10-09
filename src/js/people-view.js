// The people view: a shared office where every visible task is a little animated character. Each has a
// desk (its station) where it works while its task is in progress; otherwise it lives its life - roams
// the office, takes coffee breaks, sits on the sofa, looks out of the window, dances when its task is
// done - and characters walk over to each other to chat in speech bubbles. A task that joins the view
// comes in through the door, and one that leaves it walks out.
//
// The office can be a themed world (worlds/*.js: a wizard castle, a pirate ship...) with its own room,
// scenery, stations, characters and lines; the office itself is the default world.
//
// people-model.js decides who each character is and what it does next, world-layout.js where everything
// is, art.js and art-worlds.js draw it, and styles.css ("People view") animates the poses. This module runs the office:
// it keeps the characters across renders (keyed by task id), moves them on every animation frame
// (positions through CSSOM transforms, allowed by the CSP), and orchestrates the conversations.

import { h } from './dom.js';
import { icon } from './icons.js';
import { STATUSES } from './statuses.js';
import { createCharacterArt, createDecorArt, createSeasonEmblem, createStationArt, setClockTime } from './art.js';
import { composeConversation, composeMonologue, composePoseLine, nextBehavior } from './people-model.js';
import { ART, computeWorldLayout } from './world-layout.js';
import { UNCATEGORIZED_COLOR } from './render.js';
import { truncate } from './utils.js';
import { WORLDS, getWorld, worldStationFor } from './worlds/index.js';

// Beyond this many characters the office gets crowded; the rest are listed as hidden (filters narrow it down).
export const MAX_PEOPLE = 48;

// More arrivals (or departures) at once than this skip the walk through the door, so a filter change
// does not turn into a long parade.
const DOOR_CROWD = 6;
const BASE_SPEED_PX = 46; // walking speed at the regular size; pace adds up to half again
const REGULAR_UNIT = 0.88;
const HOME_DISTANCE_PX = 8;
const LEAVE_TIMEOUT_MS = 10000;
const APPROACH_TIMEOUT_MS = 9000;
const CHAT_GAP_MS = Object.freeze([3500, 7500]);
const MAX_CONVERSATIONS = 2;
const POSE_LINE_CHANCE = 0.3;
const NEAREST_LISTENERS = 3;
const CHAT_DISTANCE_UNITS = 34; // how far apart two characters stand while talking
const LINE_BASE_MS = 2200;
const LINE_PER_CHAR_MS = 45;
const LINE_MAX_MS = 5200;
const LINE_PAUSE_MS = 350;
const CHEER_MS = 1800;
const BUBBLE_EDGE_MARGIN_PX = 6;
const TALKING_Z = 100000; // a talking character (and its bubble) stays on top
const TAG_LENGTH = 22;
// Poses a character can comment on by itself.
const POSES_WITH_LINES = new Set(['sip', 'sit', 'look', 'think', 'work', 'wait', 'dance', 'sleep']);

function timeOfDay(hour) {
  if (hour >= 5 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 17) return 'day';
  if (hour >= 17 && hour < 20) return 'evening';
  return 'night';
}

const randomBetween = (min, max) => min + Math.random() * (max - min);
const pickRandom = list => list[Math.floor(Math.random() * list.length)];
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

function signatureOf(persona, seasonKey) {
  return JSON.stringify([
    persona.title, persona.subtaskTitle, persona.status, persona.mood, persona.activity, persona.categoryColor,
    persona.progress.done, persona.progress.total, persona.dustLevel, persona.isMyDay, persona.worldKey, seasonKey,
  ]);
}

/**
 * The office inside container. getPersona(taskId) gives the up-to-date persona (for conversations);
 * canTalk() allows conversations right now; getGreeting() is the holiday greeting or null;
 * reducedMotion() true keeps everyone in place (no walking).
 * Returns { update, relayout, clear, sayAbout, cheer }.
 */
export function createPeopleWorld(container, { getPersona, canTalk = () => true, getGreeting = () => null, reducedMotion = () => false }) {
  const root = h('div', { class: 'people-root' });
  const bar = h('div', { class: 'scene-bar' });
  const room = h('div', { class: 'people-world' });
  const note = h('p', { class: 'scene-note', hidden: true });
  root.append(bar, room, note);

  const characters = new Map(); // taskId -> character
  const leaving = new Set(); // characters walking out through the door
  const stations = new Map(); // taskId -> { element, signature }
  const conversations = new Set();
  const timers = new Set();
  let layout = null;
  let layoutKey = '';
  let decorElements = [];
  let clock = null;
  let seats = []; // the taskId sitting on each sofa seat, or null
  let barKey = '';
  let frameId = 0;
  let lastFrameAt = 0;
  let chatTimer = 0;
  let isRunning = false;
  let hasPopulated = false; // the first fill places everyone directly (no parade through the door)
  let current = { personas: [], options: {} };
  let world = getWorld(null); // the themed world shown now (the office by default)
  let relayoutFrame = 0;
  const resizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(() => scheduleRelayout()) : null;

  const later = (callback, delayMs) => {
    const id = setTimeout(() => {
      timers.delete(id);
      callback();
    }, delayMs);
    timers.add(id);
    return id;
  };

  // ---------------------------------------------------------------------------
  // Layout: the room, the furniture and the desks
  // ---------------------------------------------------------------------------

  function placeElement(element, left, top, width, z) {
    element.style.setProperty('width', `${width.toFixed(1)}px`);
    element.style.setProperty('transform', `translate3d(${left.toFixed(1)}px, ${top.toFixed(1)}px, 0)`);
    element.style.setProperty('z-index', String(Math.round(z)));
  }

  function drawDecor() {
    for (const element of decorElements) element.remove();
    decorElements = layout.decor.map(item => {
      const size = ART[item.kind];
      const art = createDecorArt(item.kind, size, { variant: item.variant ?? 0, theme: world.decor?.[item.kind] ?? null });
      const element = h('div', { class: ['decor', `decor-${item.kind}`], 'aria-hidden': 'true' }, art);
      const height = item.width * (size.height / size.width);
      placeElement(element, item.left, item.top ?? item.floorY - height, item.width, item.z);
      if (item.kind === 'clock') clock = element.firstElementChild;
      return element;
    });
    room.prepend(...decorElements);
  }

  /** Recomputes the layout when the size or the number of desks changed. False while the office has no width yet. */
  function applyLayout(count) {
    const width = room.clientWidth;
    if (width <= 0) return false;
    const isFullscreen = container.classList.contains('is-fullscreen');
    const minHeight = isFullscreen ? Math.max(0, container.clientHeight - bar.offsetHeight - (note.hidden ? 0 : note.offsetHeight)) : 0;
    const key = `${width}|${count}|${Math.round(minHeight)}|${world.key}`;
    if (key === layoutKey) return true;
    const previous = layout;
    layout = computeWorldLayout({ width, count, minHeight });
    layoutKey = key;
    room.style.setProperty('height', `${layout.height}px`);
    room.style.setProperty('--wall-h', `${layout.wallHeight}px`);
    room.classList.toggle('is-compact', layout.compact);
    room.dataset.room = world.room;
    room.dataset.world = world.key;
    drawDecor();
    seats = layout.spots.seats.map(() => null);
    for (const character of [...characters.values(), ...leaving]) {
      character.seat = null;
      sizeCharacter(character);
      if (previous) moveIntoNewLayout(character, previous);
    }
    return true;
  }

  // After a resize: keep everyone where they were, in proportion, and let them pick their next step.
  function moveIntoNewLayout(character, previous) {
    const scaleY = value => layout.bounds.minY + ((value - previous.bounds.minY) / Math.max(1, previous.bounds.maxY - previous.bounds.minY)) * (layout.bounds.maxY - layout.bounds.minY);
    character.x = clampX(character.x * (layout.width / previous.width));
    character.y = clampY(scaleY(character.y));
    character.zBias = 0;
    if (character.mode === 'leaving') {
      walkTo(character, layout.spots.door, () => removeCharacter(character));
    } else {
      stopWalking(character);
      if (character.mode === 'free') character.until = 0;
    }
    placeCharacter(character);
  }

  function upsertStation(persona, index) {
    let station = stations.get(persona.taskId);
    if (!station) {
      station = { element: h('div', { class: 'station', 'aria-hidden': 'true' }), signature: '' };
      stations.set(persona.taskId, station);
      room.append(station.element);
    }
    const isDone = persona.status === 'done';
    const worldStation = worldStationFor(world, persona.activity);
    const signature = `${persona.activity}|${isDone}|${worldStation}`;
    if (station.signature !== signature) {
      station.element.replaceChildren(createStationArt(persona.activity, { done: isDone, worldStation }));
      station.signature = signature;
    }
    station.element.classList.toggle('is-busy', persona.mood === 'working' || persona.mood === 'sweating');
    station.element.classList.toggle('is-dusty', persona.dustLevel >= 2);
    const slot = layout.stations[index];
    const top = slot.floorY - (ART.station.floorY - ART.station.top) * layout.unit;
    placeElement(station.element, slot.left, top, ART.station.width * layout.unit, slot.floorY);
  }

  const clampX = x => Math.min(layout.bounds.maxX, Math.max(layout.bounds.minX, x));
  const clampY = y => Math.min(layout.bounds.maxY, Math.max(layout.bounds.minY, y));
  const randomFloorPoint = () => ({
    x: randomBetween(layout.bounds.minX, layout.bounds.maxX),
    y: randomBetween(layout.bounds.minY + 20, layout.bounds.maxY),
  });

  // ---------------------------------------------------------------------------
  // Characters
  // ---------------------------------------------------------------------------

  function renderCharacterContent(character, seasonKey) {
    const { persona, element } = character;
    const { label } = STATUSES[persona.status];
    const { done, total } = persona.progress;
    element.style.setProperty('--cat-color', persona.categoryColor ?? UNCATEGORIZED_COLOR);
    // The office's activity poses (phone at the ear, sweeping...) go with its activity props; a themed
    // world's characters work at their themed station with a general working pose.
    const isOffice = world.stations === null;
    Object.assign(element.dataset, {
      status: persona.status, mood: persona.mood, activity: isOffice ? persona.activity : 'world', kind: persona.look.kind,
    });
    if (persona.dustLevel) element.dataset.dust = String(persona.dustLevel);
    else delete element.dataset.dust;
    element.title = persona.status === 'done' ? persona.title : `${persona.title}\nעכשיו: ${persona.subtaskTitle}`;
    element.setAttribute('aria-label', `${persona.title}. ${label}, ${done} מתוך ${total} תתי משימות הושלמו. לחיצה פותחת את המשימה`);
    element.replaceChildren(
      createCharacterArt(persona, { seasonKey, activityProps: isOffice }),
      h('span', { class: 'character-tag' },
        persona.isMyDay && icon('sun', { size: 11 }),
        h('span', { class: 'dot', 'aria-hidden': 'true' }),
        h('span', { class: 'character-tag-text' }, truncate(persona.title, TAG_LENGTH))));
    element.classList.remove('is-talking');
    character.isTalking = false;
  }

  function createCharacter(persona, signature, seasonKey) {
    const element = h('button', {
      type: 'button', class: 'character',
      dataset: { action: 'open-task', taskId: persona.taskId, focusKey: `person-${persona.taskId}`, pose: 'look', facing: 'right' },
    });
    const character = {
      taskId: persona.taskId, element, persona, signature, look: persona.look,
      x: 0, y: 0, zBias: 0, facing: 'right', pose: 'look',
      walking: false, target: null, onArrive: null, until: 0,
      mode: 'free', // free | approach | held | chat | leaving
      seat: null, stationIndex: 0, isTalking: false,
      speedFactor: 1 + persona.look.pace * 0.5,
    };
    renderCharacterContent(character, seasonKey);
    room.append(element);
    return character;
  }

  function sizeCharacter(character) {
    character.element.style.setProperty('--character-w', `${(ART.character.width * layout.unit * character.look.size).toFixed(1)}px`);
  }

  function placeCharacter(character) {
    const scale = layout.unit * character.look.size;
    const left = character.x - ART.character.centerX * scale;
    const top = character.y - ART.character.feetY * scale;
    character.element.style.setProperty('transform', `translate3d(${left.toFixed(1)}px, ${top.toFixed(1)}px, 0)`);
    character.element.style.setProperty('z-index', String(character.isTalking ? TALKING_Z : Math.round(character.y + character.zBias) + 2));
  }

  function setPose(character, pose) {
    character.pose = pose;
    character.element.dataset.pose = pose;
  }

  function setFacing(character, facing) {
    if (character.facing === facing) return;
    character.facing = facing;
    character.element.dataset.facing = facing;
  }

  const homeOf = character => layout.stations[character.stationIndex]?.home ?? { x: layout.width / 2, y: layout.bounds.maxY };

  function releaseSeat(character) {
    if (character.seat !== null && seats[character.seat] === character.taskId) seats[character.seat] = null;
    character.seat = null;
    character.zBias = 0;
  }

  /** A place to go to, for a behavior's "go" (people-model.js nextBehavior). */
  function destinationFor(character, go) {
    const jitter = amount => (Math.random() - 0.5) * 2 * amount;
    const { spots } = layout;
    switch (go) {
      case 'home': return { ...homeOf(character), facing: 'right' };
      case 'nearHome': {
        const home = homeOf(character);
        return { x: clampX(home.x + jitter(36)), y: clampY(home.y + jitter(10)) };
      }
      case 'party': return { x: randomBetween(spots.party.minX, spots.party.maxX), y: randomBetween(spots.party.minY, spots.party.maxY) };
      case 'coffee': return { x: spots.coffee.x + jitter(6), y: spots.coffee.y + jitter(4), facing: 'right' };
      case 'cooler': return { x: spots.cooler.x + jitter(5), y: spots.cooler.y + jitter(4), facing: 'right' };
      case 'window': {
        const window = pickRandom(spots.windows);
        return { x: clampX(window.x + jitter(22)), y: window.y + jitter(4) };
      }
      case 'shelf': return { x: spots.shelf.x + jitter(6), y: spots.shelf.y + jitter(4), facing: 'left' };
      case 'plant': {
        const plant = pickRandom(spots.plants);
        return { x: clampX(plant.x + jitter(8)), y: plant.y + jitter(4) };
      }
      case 'sofa': {
        const index = seats.findIndex(occupant => occupant === null);
        if (index === -1) return randomFloorPoint();
        seats[index] = character.taskId;
        character.seat = index;
        const seat = spots.seats[index];
        return { x: seat.x, y: seat.y, zBias: seat.z - seat.y, facing: Math.random() < 0.5 ? 'left' : 'right' };
      }
      default: return randomFloorPoint(); // wander
    }
  }

  function stopWalking(character) {
    character.walking = false;
    character.target = null;
    character.onArrive = null;
  }

  function walkTo(character, point, onArrive) {
    if (reducedMotion()) {
      character.x = point.x;
      character.y = point.y;
      placeCharacter(character);
      onArrive?.();
      return;
    }
    character.walking = true;
    character.target = { x: point.x, y: point.y };
    character.onArrive = onArrive;
    setPose(character, 'walk');
  }

  function arriveAndHold(character, destination, pose, durationMs) {
    if (destination?.zBias) character.zBias = destination.zBias;
    if (destination?.facing) setFacing(character, destination.facing);
    setPose(character, pose);
    character.until = performance.now() + durationMs;
    placeCharacter(character);
  }

  /** Picks the character's next activity and starts it (walking there first if needed). */
  function decide(character) {
    const atHome = distance(character, homeOf(character)) < HOME_DISTANCE_PX;
    const plan = nextBehavior(character.persona.mood, { atHome, seatFree: seats.some(occupant => occupant === null) });
    releaseSeat(character);
    const destination = plan.go ? destinationFor(character, plan.go) : null;
    // Hold off the next decision while walking; arrival sets the real end of this activity.
    character.until = Number.POSITIVE_INFINITY;
    if (!destination) {
      arriveAndHold(character, null, plan.pose, plan.durationMs);
      return;
    }
    walkTo(character, destination, () => arriveAndHold(character, destination, plan.pose, plan.durationMs));
  }

  /** Where a new character appears: at the door (walking in), or right where its first activity is. */
  function spawn(character, viaDoor) {
    sizeCharacter(character);
    if (viaDoor) {
      character.x = layout.spots.door.x;
      character.y = layout.spots.door.y;
      placeCharacter(character);
      decide(character);
      return;
    }
    const plan = nextBehavior(character.persona.mood, { atHome: true, seatFree: seats.some(occupant => occupant === null) });
    const destination = plan.go && plan.go !== 'home' ? destinationFor(character, plan.go) : { ...homeOf(character), facing: 'right' };
    character.x = destination.x;
    character.y = destination.y;
    arriveAndHold(character, destination, plan.pose, plan.durationMs * Math.random());
  }

  function removeCharacter(character) {
    leaving.delete(character);
    character.element.remove();
  }

  /** The task left the view: its character walks out through the door (or just goes, in a crowd). */
  function depart(character, walkOut) {
    characters.delete(character.taskId);
    endConversationsOf(character);
    releaseSeat(character);
    character.mode = 'leaving';
    character.element.classList.add('is-leaving');
    character.element.setAttribute('tabindex', '-1');
    character.element.setAttribute('aria-hidden', 'true');
    if (!walkOut || reducedMotion()) {
      character.element.remove();
      return;
    }
    leaving.add(character);
    walkTo(character, layout.spots.door, () => removeCharacter(character));
    later(() => removeCharacter(character), LEAVE_TIMEOUT_MS);
  }

  // ---------------------------------------------------------------------------
  // The animation loop
  // ---------------------------------------------------------------------------

  function step(character, seconds) {
    const moodFactor = character.persona.mood === 'celebrating' ? 1.25 : (character.persona.mood === 'sweating' ? 0.85 : 1);
    const speed = BASE_SPEED_PX * (layout.unit / REGULAR_UNIT) * character.speedFactor * moodFactor;
    const dx = character.target.x - character.x;
    const dy = character.target.y - character.y;
    const remaining = Math.hypot(dx, dy);
    const stride = speed * seconds;
    if (remaining <= Math.max(1, stride)) {
      character.x = character.target.x;
      character.y = character.target.y;
      const onArrive = character.onArrive;
      stopWalking(character);
      placeCharacter(character);
      onArrive?.();
      return;
    }
    character.x += (dx / remaining) * stride;
    character.y += (dy / remaining) * stride;
    if (Math.abs(dx) > 1) setFacing(character, dx < 0 ? 'left' : 'right');
    placeCharacter(character);
  }

  function frame(timestamp) {
    frameId = 0;
    if (!isRunning) return;
    // A hidden tab gets no frames; after it, skip ahead instead of teleporting across the room.
    const seconds = lastFrameAt ? Math.min(0.1, (timestamp - lastFrameAt) / 1000) : 0;
    lastFrameAt = timestamp;
    for (const character of [...characters.values(), ...leaving]) {
      if (character.walking) step(character, seconds);
      else if (character.mode === 'free' && timestamp >= character.until) decide(character);
    }
    frameId = requestAnimationFrame(frame);
  }

  // ---------------------------------------------------------------------------
  // Conversations and speech bubbles
  // ---------------------------------------------------------------------------

  const lineDuration = text => Math.min(LINE_MAX_MS, LINE_BASE_MS + text.length * LINE_PER_CHAR_MS);

  function showBubble(character, text, durationMs) {
    if (!character.element.isConnected) return;
    character.element.querySelector(':scope > .bubble')?.remove();
    const bubble = h('span', { class: 'bubble', 'aria-hidden': 'true' }, text);
    character.element.append(bubble);
    // A bubble over a character near a wall would be cut off: slide it inside the office.
    const halfWidth = bubble.offsetWidth / 2;
    const overflowStart = BUBBLE_EDGE_MARGIN_PX - (character.x - halfWidth);
    const overflowEnd = character.x + halfWidth - (layout.width - BUBBLE_EDGE_MARGIN_PX);
    const shift = overflowStart > 0 ? overflowStart : (overflowEnd > 0 ? -overflowEnd : 0);
    if (shift !== 0) bubble.style.setProperty('--bubble-shift', `${Math.round(shift)}px`);
    character.element.classList.add('is-talking');
    character.isTalking = true;
    placeCharacter(character);
    later(() => {
      bubble.remove();
      if (character.element.querySelector(':scope > .bubble')) return;
      character.element.classList.remove('is-talking');
      character.isTalking = false;
      if (character.element.isConnected) placeCharacter(character);
    }, durationMs);
  }

  const canWalkOver = character => character.mode === 'free' && character.persona.mood !== 'sleeping';
  const canListen = character => character.mode === 'free' && character.persona.mood !== 'sleeping';

  function faceEachOther(first, second) {
    setFacing(first, second.x < first.x ? 'left' : 'right');
    setFacing(second, first.x < second.x ? 'left' : 'right');
  }

  /** A character walks over to one of the nearest others; once there, they talk. */
  function startConversation() {
    const everyone = [...characters.values()];
    const speaker = pickRandom(everyone.filter(canWalkOver));
    if (!speaker) return;
    const speakerPersona = getPersona(speaker.taskId);
    if (!speakerPersona) return;
    const listener = pickRandom(everyone
      .filter(character => character !== speaker && canListen(character))
      .sort((a, b) => distance(a, speaker) - distance(b, speaker))
      .slice(0, NEAREST_LISTENERS));
    const greeting = getGreeting();
    if (!listener) {
      const [line] = composeMonologue(speakerPersona, { greeting, lines: world.lines });
      showBubble(speaker, line.text, lineDuration(line.text));
      return;
    }
    const listenerPersona = getPersona(listener.taskId);
    if (!listenerPersona) return;
    const conversation = { speaker, listener, lines: composeConversation(speakerPersona, listenerPersona, { greeting, lines: world.lines }) };
    conversations.add(conversation);
    releaseSeat(speaker);
    speaker.mode = 'approach';
    listener.mode = 'held';
    if (listener.walking) {
      stopWalking(listener);
      setPose(listener, 'look');
    }
    const side = speaker.x < listener.x ? -1 : 1;
    const gap = CHAT_DISTANCE_UNITS * layout.unit * ((speaker.look.size + listener.look.size) / 2);
    const spot = { x: clampX(listener.x + side * gap), y: clampY(listener.y + 1) };
    walkTo(speaker, spot, () => beginConversation(conversation));
    later(() => {
      if (conversations.has(conversation) && speaker.mode === 'approach') endConversation(conversation);
    }, APPROACH_TIMEOUT_MS);
  }

  function beginConversation(conversation) {
    if (!conversations.has(conversation)) return;
    const { speaker, listener, lines } = conversation;
    speaker.mode = 'chat';
    listener.mode = 'chat';
    setPose(speaker, 'chat');
    // Someone working or sitting keeps doing it while answering.
    if (!['work', 'sit', 'sip'].includes(listener.pose)) setPose(listener, 'chat');
    faceEachOther(speaker, listener);
    let delay = 0;
    for (const line of lines) {
      const character = line.from === 0 ? speaker : listener;
      const duration = lineDuration(line.text);
      later(() => {
        if (conversations.has(conversation)) showBubble(character, line.text, duration);
      }, delay);
      delay += duration + LINE_PAUSE_MS;
    }
    later(() => endConversation(conversation), delay);
  }

  function endConversation(conversation) {
    if (!conversations.delete(conversation)) return;
    for (const character of [conversation.speaker, conversation.listener]) {
      if (character.mode === 'leaving') continue;
      character.mode = 'free';
      // The speaker moves on; the listener goes back to work (or its seat) or picks something new.
      if (character === conversation.speaker || !['work', 'sit'].includes(character.pose)) character.until = 0;
      else if (character.pose === 'work') setFacing(character, 'right');
    }
  }

  function endAllConversations() {
    for (const conversation of [...conversations]) endConversation(conversation);
  }

  function endConversationsOf(character) {
    for (const conversation of [...conversations]) {
      if (conversation.speaker === character || conversation.listener === character) endConversation(conversation);
    }
  }

  // Now and then someone comments on what it is doing - a coffee break, the sofa, the view.
  function sayPoseLine() {
    const candidate = pickRandom([...characters.values()].filter(character =>
      character.mode === 'free' && !character.walking && !character.isTalking && POSES_WITH_LINES.has(character.pose)));
    const persona = candidate && getPersona(candidate.taskId);
    const text = persona && composePoseLine(candidate.pose, persona, { lines: world.lines });
    if (text) showBubble(candidate, text, lineDuration(text));
  }

  function chatTick() {
    chatTimer = 0;
    try {
      if (isRunning && document.visibilityState === 'visible' && canTalk()) {
        if (Math.random() < POSE_LINE_CHANCE) sayPoseLine();
        else if (conversations.size < MAX_CONVERSATIONS) startConversation();
      }
    } finally {
      // One failed conversation must not silence the office for good.
      if (isRunning) chatTimer = setTimeout(chatTick, randomBetween(...CHAT_GAP_MS));
    }
  }

  // ---------------------------------------------------------------------------
  // Running, updating and clearing
  // ---------------------------------------------------------------------------

  function start() {
    if (isRunning) return;
    isRunning = true;
    lastFrameAt = 0;
    frameId = requestAnimationFrame(frame);
    chatTimer = setTimeout(chatTick, randomBetween(...CHAT_GAP_MS));
  }

  function stop() {
    isRunning = false;
    cancelAnimationFrame(frameId);
    clearTimeout(chatTimer);
    frameId = 0;
    chatTimer = 0;
  }

  function renderBar(count, seasonKey, isFullscreen) {
    const key = `${count}|${seasonKey ?? ''}|${isFullscreen}|${world.key}`;
    if (key === barKey) return;
    barKey = key;
    // Native replaceChildren would write "null" for a missing emblem, so the list is filtered.
    bar.replaceChildren(...[
      h('span', { class: 'scene-title' }, world.stations ? world.label : 'המשרד של המשימות'),
      h('span', { class: 'scene-count' }, count === 1 ? 'דמות אחת' : `${count} דמויות`),
      seasonKey && createSeasonEmblem(seasonKey, { size: 24 }),
      h('span', { class: 'spacer' }),
      h('label', { class: 'world-picker' },
        h('span', { class: 'world-picker-label' }, 'ערכת נושא'),
        h('select', { class: 'select', value: world.key, dataset: { action: 'set-world', focusKey: 'world-picker' }, 'aria-label': 'ערכת נושא למשרד' },
          ...WORLDS.map(item => h('option', { value: item.key }, item.label)))),
      h('button', {
        type: 'button', class: 'btn btn-soft btn-sm',
        dataset: { action: 'people-fullscreen', focusKey: 'people-fullscreen' }, 'aria-pressed': String(isFullscreen),
        title: isFullscreen ? 'חזרה לתצוגה הרגילה (Escape)' : 'המשרד על כל המסך',
      }, icon(isFullscreen ? 'minimize' : 'maximize', { size: 16 }), isFullscreen ? 'יציאה ממסך מלא' : 'מסך מלא'),
    ].filter(Boolean));
  }

  /**
   * Shows these personas (display order, at most MAX_PEOPLE). options: { world, seasonKey, hiddenCount, now };
   * world is a themed world (worlds/*.js) - its personas' looks must come from it (buildPersona).
   * Characters and desks are kept by task id; only what changed is redrawn.
   */
  function update(personas, options = {}) {
    const { seasonKey = null, hiddenCount = 0, now = Date.now() } = options;
    current = { personas, options };
    if (options.world && options.world !== world) {
      world = options.world;
      endAllConversations();
    }
    if (root.parentElement !== container) {
      container.replaceChildren(root);
      resizeObserver?.observe(room);
    }
    renderBar(personas.length, seasonKey, container.classList.contains('is-fullscreen'));
    note.hidden = hiddenCount === 0;
    note.textContent = hiddenCount > 0
      ? `במשרד ${personas.length} דמויות. עוד ${hiddenCount} משימות לא מוצגות כאן - אפשר לצמצם עם הסינון, או לעבור לתצוגת ריבועים בהגדרות.`
      : '';
    if (!applyLayout(personas.length)) return;

    const date = new Date(now);
    room.dataset.time = timeOfDay(date.getHours());
    if (clock) setClockTime(clock, date);

    const wanted = new Set(personas.map(persona => persona.taskId));
    for (const [taskId, station] of stations) {
      if (!wanted.has(taskId)) {
        station.element.remove();
        stations.delete(taskId);
      }
    }
    personas.forEach((persona, index) => upsertStation(persona, index));

    const departing = [...characters.values()].filter(character => !wanted.has(character.taskId));
    const arrivals = personas.filter(persona => !characters.has(persona.taskId)).length;
    const walkOut = departing.length <= DOOR_CROWD;
    const viaDoor = hasPopulated && arrivals <= DOOR_CROWD && !reducedMotion();
    for (const character of departing) depart(character, walkOut);

    personas.forEach((persona, index) => {
      const signature = signatureOf(persona, seasonKey);
      let character = characters.get(persona.taskId);
      if (!character) {
        character = createCharacter(persona, signature, seasonKey);
        character.stationIndex = index;
        characters.set(persona.taskId, character);
        spawn(character, viaDoor);
        return;
      }
      const hasNewMood = character.persona.mood !== persona.mood;
      const hasNewDesk = character.stationIndex !== index;
      character.persona = persona;
      character.stationIndex = index;
      if (character.signature !== signature) {
        character.signature = signature;
        endConversationsOf(character);
        renderCharacterContent(character, seasonKey);
        placeCharacter(character);
      }
      // A new mood (or desk) means a new routine - start it now.
      if ((hasNewMood || hasNewDesk) && character.mode === 'free') {
        stopWalking(character);
        releaseSeat(character);
        character.until = 0;
      }
    });
    if (personas.length > 0) hasPopulated = true;
    start();
  }

  function scheduleRelayout() {
    if (relayoutFrame) return;
    relayoutFrame = requestAnimationFrame(() => {
      relayoutFrame = 0;
      if (root.parentElement === container) update(current.personas, current.options);
    });
  }

  /** Empties the office (switching to tiles, or nothing to show). */
  function clear() {
    stop();
    for (const id of timers) clearTimeout(id);
    timers.clear();
    resizeObserver?.disconnect();
    conversations.clear();
    characters.clear();
    leaving.clear();
    stations.clear();
    room.replaceChildren();
    decorElements = [];
    clock = null;
    seats = [];
    layout = null;
    layoutKey = '';
    barKey = '';
    hasPopulated = false;
    root.remove();
  }

  return {
    update,
    clear,
    /** Re-measures the office (after entering or leaving full screen). */
    relayout: scheduleRelayout,
    /** A character says something about its own task (on hover), unless it is already talking. */
    sayAbout(taskId) {
      const character = characters.get(taskId);
      const persona = character && getPersona(taskId);
      if (!persona || character.isTalking) return;
      const [line] = composeMonologue(persona, { greeting: getGreeting(), lines: world.lines });
      showBubble(character, line.text, lineDuration(line.text));
    },
    /** A short victory jump (its task was just finished). */
    cheer(taskId) {
      const character = characters.get(taskId);
      if (!character) return;
      character.element.classList.add('is-cheering');
      later(() => character.element.classList.remove('is-cheering'), CHEER_MS);
    },
  };
}
