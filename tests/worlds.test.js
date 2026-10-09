import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DEFAULT_WORLD_KEY, WORLDS, WORLD_KEYS, getWorld, worldStationFor } from '../src/js/worlds/index.js';
import { CHARACTER_PARTS, OFFICE_SCENERY_KEYS } from '../src/js/art.js';
import { WORLD_SCENERY_KEYS } from '../src/js/art-worlds.js';
import { LINE_PLACEHOLDERS, buildPersona, composeConversation, composeMonologue, composePoseLine, lookOf } from '../src/js/people-model.js';
import { deriveTaskStatus } from '../src/js/statuses.js';

const office = getWorld(DEFAULT_WORLD_KEY);
const themed = WORLDS.filter(world => world !== office);
const STYLES = readFileSync(new URL('../src/css/styles.css', import.meta.url), 'utf8');
const MAX_LINE_LENGTH = 60; // a speech bubble is 200px wide; longer lines wrap into a tall bubble
const placeholdersIn = text => [...text.matchAll(/\{([a-z]+)\}/g)].map(match => match[1]);
const withoutPlaceholders = text => text.replace(/\{[a-z]+\}/g, '');

/** Every line of a world with where it is used: [{ where, text }]. */
function linesOf(world) {
  const { openers, replies, poses, smallTalk, myDay, sameCategory, listenerBusy, greetingReply } = world.lines;
  return [
    ...Object.entries(openers).flatMap(([mood, list]) => list.map(text => ({ where: `openers.${mood}`, text }))),
    ...Object.entries(replies).flatMap(([mood, list]) => list.map(text => ({ where: `replies.${mood}`, text }))),
    ...Object.entries(poses).flatMap(([pose, list]) => list.map(text => ({ where: `poses.${pose}`, text }))),
    ...smallTalk.flat().map(text => ({ where: 'smallTalk', text })),
    { where: 'myDay', text: myDay },
    { where: 'sameCategory', text: sameCategory },
    { where: 'listenerBusy', text: listenerBusy },
    { where: 'greetingReply', text: greetingReply },
  ];
}

const isWeightTable = table => Array.isArray(table) && table.length > 0 && table.every(([, weight]) => typeof weight === 'number' && weight > 0);

describe('the worlds list', () => {
  test('keys are unique, the office is the default and comes first', () => {
    assert.equal(new Set(WORLD_KEYS).size, WORLDS.length);
    assert.equal(WORLDS[0].key, DEFAULT_WORLD_KEY);
    assert.equal(DEFAULT_WORLD_KEY, 'office');
    assert.ok(WORLDS.length >= 16);
    assert.equal(new Set(WORLDS.map(world => world.label)).size, WORLDS.length);
  });

  test('getWorld falls back to the office', () => {
    assert.equal(getWorld('pirates').key, 'pirates');
    assert.equal(getWorld('no-such-world'), office);
    assert.equal(getWorld(null), office);
  });

  test('worldStationFor: hands-on activities use the craft station, the rest the desk; the office has none', () => {
    const pirates = getWorld('pirates');
    assert.equal(worldStationFor(pirates, 'fixing'), pirates.stations.craft);
    assert.equal(worldStationFor(pirates, 'computer'), pirates.stations.desk);
    assert.equal(worldStationFor(office, 'fixing'), null);
    assert.equal(worldStationFor(null, 'fixing'), null);
  });
});

describe('each world can be drawn', () => {
  for (const world of WORLDS) {
    test(`${world.key}: room, accent, scenery and stations exist`, () => {
      assert.match(world.key, /^[a-z-]+$/);
      assert.ok(world.label.trim());
      if (world === office) {
        assert.equal(world.accent, null);
        assert.equal(world.stations, null);
      } else {
        assert.match(world.accent.light, /^#[0-9a-f]{6}$/);
        assert.match(world.accent.dark, /^#[0-9a-f]{6}$/);
        assert.ok(STYLES.includes(`[data-room="${world.room}"]`), `styles.css has no room "${world.room}"`);
        for (const station of [world.stations.desk, world.stations.craft]) {
          assert.ok(WORLD_SCENERY_KEYS.stations.includes(station), `unknown station ${station}`);
        }
      }
      for (const kind of Object.keys(OFFICE_SCENERY_KEYS)) {
        const variant = world.decor[kind];
        const known = [...OFFICE_SCENERY_KEYS[kind], ...(WORLD_SCENERY_KEYS[kind] ?? [])];
        assert.ok(known.includes(variant), `${world.key}: unknown ${kind} "${variant}"`);
      }
    });

    test(`${world.key}: the cast uses parts the art can draw`, () => {
      const { cast } = world;
      // Kinds and outfits are the world's own; a missing hat / eyewear / held table means the office's defaults.
      assert.ok(cast.kinds && cast.outfits, `${world.key}: the cast needs kinds and outfits`);
      const tables = { kinds: 'kinds', outfits: 'outfits', headwear: 'headwear', eyewear: 'eyewear', held: 'held' };
      for (const [castKey, partsKey] of Object.entries(tables)) {
        if (cast[castKey] === undefined) continue;
        assert.ok(isWeightTable(cast[castKey]), `${world.key}: cast.${castKey} is not a weight table`);
        for (const [value] of cast[castKey]) {
          if (value === null && castKey !== 'kinds' && castKey !== 'outfits') continue;
          assert.ok(CHARACTER_PARTS[partsKey].includes(value), `${world.key}: unknown ${castKey} "${value}"`);
        }
      }
      const castKinds = new Set(cast.kinds.map(([kind]) => kind));
      for (let index = 0; index < 40; index += 1) {
        const look = lookOf(`${world.key}-${index}`, cast);
        assert.ok(castKinds.has(look.kind));
        assert.ok(look.size > 0.5 && look.size < 1.5);
      }
    });
  }
});

describe('each world has a full pool of lines', () => {
  for (const world of WORLDS) {
    test(`${world.key}: every mood and pose has lines, like the office`, () => {
      const { lines } = world;
      for (const group of ['openers', 'replies', 'poses']) {
        assert.deepEqual(Object.keys(lines[group]).sort(), Object.keys(office.lines[group]).sort(), `${world.key}.${group}`);
        for (const [key, list] of Object.entries(lines[group])) assert.ok(list.length >= 3, `${world.key}.${group}.${key}`);
      }
      assert.ok(lines.smallTalk.length >= 6);
      for (const pair of lines.smallTalk) assert.equal(pair.length, 2);
      const all = linesOf(world);
      assert.ok(all.length >= 90, `${world.key} has ${all.length} lines`);
      assert.equal(new Set(all.map(line => line.text)).size, all.length, `${world.key} repeats a line`);
    });

    test(`${world.key}: lines are Hebrew, short and use only the placeholders their place fills`, () => {
      for (const { where, text } of linesOf(world)) {
        const label = `${world.key} ${where}: ${text}`;
        assert.equal(typeof text, 'string', label);
        assert.ok(text.trim() && text.length <= MAX_LINE_LENGTH, label);
        assert.doesNotMatch(withoutPlaceholders(text), /[A-Za-z]/, label);
        assert.doesNotMatch(text, /\p{Extended_Pictographic}/u, label);
        const used = placeholdersIn(text);
        for (const name of used) assert.ok(LINE_PLACEHOLDERS.includes(name), label);
        if (where === 'smallTalk') assert.deepEqual(used, [], label);
        if (where !== 'greetingReply') assert.ok(!used.includes('greeting'), label);
        if (where !== 'sameCategory') assert.ok(!used.includes('category'), label);
      }
      assert.ok(world.lines.sameCategory.includes('{category}'));
      assert.ok(world.lines.listenerBusy.includes('{sub}'));
      assert.ok(world.lines.greetingReply.includes('{greeting}'));
    });
  }
});

describe('a world through the model', () => {
  const NOW = Date.UTC(2026, 9, 7, 12, 0, 0);
  const HOUR = 3_600_000;
  const subtasks = [{ id: 's1', title: 'לאסוף נתונים', status: 'in_progress', statusChangedAt: NOW - HOUR, createdAt: NOW - HOUR, updatedAt: NOW - HOUR }];
  const task = {
    id: 'task-1', title: 'דוח רבעוני', description: '', categoryId: 'c1', status: deriveTaskStatus(subtasks), subtasks,
    statusChangedAt: NOW - HOUR, createdAt: NOW - HOUR, updatedAt: NOW - HOUR,
  };
  const category = { id: 'c1', name: 'עבודה', color: '#2563eb' };

  test('buildPersona draws the look from the world cast and records the world', () => {
    const pirates = getWorld('pirates');
    const persona = buildPersona(task, category, { now: NOW, today: '2026-10-07', world: pirates });
    assert.equal(persona.worldKey, 'pirates');
    assert.deepEqual(persona.look, lookOf(task.id, pirates.cast));
    assert.equal(buildPersona(task, category, { now: NOW, today: '2026-10-07' }).worldKey, 'office');
  });

  test('the world lines are what the characters say', () => {
    const spies = getWorld('spies');
    const persona = buildPersona(task, category, { now: NOW, today: '2026-10-07', world: spies });
    const said = composeMonologue(persona, { random: () => 0.99, lines: spies.lines })[0].text;
    const pool = spies.lines.openers[persona.mood];
    assert.ok(pool.some(template => said.startsWith(withoutPlaceholders(template).slice(0, 4))), said);
    assert.ok(composePoseLine('think', persona, { random: () => 0, lines: spies.lines }));
    const exchange = composeConversation(persona, persona, { random: () => 0.99, lines: spies.lines });
    assert.ok(exchange.length >= 2);
    assert.doesNotMatch(exchange.map(line => line.text).join(' '), /\{[a-z]+\}/);
  });
});
