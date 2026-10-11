import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { DEFAULT_WORLD_KEY, WORLDS, WORLD_KEYS, getWorld, worldStationFor } from '../src/js/worlds/index.js';
import { CHARACTER_PARTS, createCharacterArt, createDecorArt, createStationArt } from '../src/js/art.js';
import { worldArtOf } from '../src/js/world-art/index.js';
import { ART } from '../src/js/world-layout.js';
import { installFakeDocument, walk } from './fixtures/fake-svg-dom.js';
import { LINE_PLACEHOLDERS, buildPersona, composeConversation, composeMonologue, composePoseLine, lookOf } from '../src/js/people-model.js';
import { deriveTaskStatus } from '../src/js/statuses.js';

const office = getWorld(DEFAULT_WORLD_KEY);
const WORLDS_CSS = readFileSync(new URL('../src/css/worlds.css', import.meta.url), 'utf8');
// Furniture a world draws in its own style (the office wall items are hidden in a painted scene).
const DECOR_KINDS = ['door', 'shelf', 'sofa', 'coffee', 'cooler', 'plant', 'rug'];
const MOODS = ['idle', 'working', 'sweating', 'waiting', 'bored', 'sleeping', 'celebrating'];

installFakeDocument();

const COLOR_VALUE = /^(#[0-9a-f]{3}|#[0-9a-f]{6}|#[0-9a-f]{8}|none|currentColor|transparent|url\(#[\w-]+\)|rgba?\([\d., ]+\))$/i;
const COLOR_ATTRIBUTES = new Set(['fill', 'stroke', 'stop-color']);
const NUMBER_ATTRIBUTES = new Set(['x', 'y', 'cx', 'cy', 'r', 'rx', 'ry', 'width', 'height', 'x1', 'y1', 'x2', 'y2', 'stroke-width', 'opacity', 'fill-opacity', 'stroke-opacity']);

/**
 * A drawn SVG tree has no broken values: no NaN / undefined / null anywhere, colors that are colors and
 * numbers that are numbers (a typo in the art, or a category color fed to darker(), makes them).
 */
function assertDrawn(svgNode, label) {
  assert.ok(svgNode && svgNode.tagName === 'svg', `${label}: no svg`);
  let count = 0;
  walk(svgNode, node => {
    count += 1;
    for (const [name, value] of node.attributes) {
      const where = `${label}: <${node.tagName} ${name}="${value}">`;
      assert.doesNotMatch(value, /NaN|undefined|null|\[object/, where);
      if (COLOR_ATTRIBUTES.has(name)) assert.match(value, COLOR_VALUE, where);
      if (NUMBER_ATTRIBUTES.has(name)) assert.ok(Number.isFinite(Number(value)), where);
    }
  });
  assert.ok(count > 3, `${label}: nothing drawn`);
}
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
    test(`${world.key}: accent, scene, furniture and stations exist`, () => {
      assert.match(world.key, /^[a-z-]+$/);
      assert.ok(world.label.trim());
      if (world === office) {
        assert.equal(world.accent, null);
        assert.equal(world.stations, null);
        assert.equal(world.scene, null);
        assert.equal(worldArtOf(world.key), null);
      } else {
        assert.match(world.accent.light, /^#[0-9a-f]{6}$/);
        assert.match(world.accent.dark, /^#[0-9a-f]{6}$/);
        assert.ok(world.scene.wallScale >= 1 && world.scene.wallScale <= 2.2, `${world.key}: scene.wallScale`);
        const art = worldArtOf(world.key);
        assert.ok(art, `${world.key}: no world-art module`);
        for (const station of [world.stations.desk, world.stations.craft]) {
          assert.equal(typeof art.stations?.[station], 'function', `${world.key}: no art for station "${station}"`);
        }
        // Every piece of furniture of the layout, in the world's own style (the office's otherwise).
        assert.deepEqual(Object.keys(art.decor).sort(), [...DECOR_KINDS].sort(), `${world.key}: decor pieces`);
      }
    });

    if (world !== office) {
      test(`${world.key}: the painted backdrop and the ground tile are safe SVG files of the right size`, () => {
        for (const [file, width, height] of [['backdrop.svg', 2400, 400], ['floor.svg', 240, 240]]) {
          const url = new URL(`../src/img/worlds/${world.key}/${file}`, import.meta.url);
          assert.ok(existsSync(url), `${world.key}/${file} is missing`);
          const source = readFileSync(url, 'utf8');
          assert.match(source, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/, `${world.key}/${file}: must start with <svg xmlns=...>`);
          assert.match(source, new RegExp(`<svg[^>]*\\swidth="${width}"[^>]*\\sheight="${height}"`), `${world.key}/${file}: width="${width}" height="${height}"`);
          assert.match(source, new RegExp(`viewBox="0 0 ${width} ${height}"`), `${world.key}/${file}: viewBox`);
          // An SVG shown as an image runs no scripts, but keep the files plain drawings anyway.
          assert.doesNotMatch(source, /<script|<foreignObject|<image|\son[a-z]+=|javascript:/i, `${world.key}/${file}: scripts, images or handlers`);
          assert.doesNotMatch(source.replace(/xmlns(:xlink)?="[^"]*"/g, ''), /https?:/, `${world.key}/${file}: no external references`);
          assert.ok(WORLDS_CSS.includes(`img/worlds/${world.key}/${file}`), `worlds.css does not use ${world.key}/${file}`);
        }
      });

      test(`${world.key}: every archetype, piece of furniture and station draws without broken values`, () => {
        const art = worldArtOf(world.key);
        const archetypes = world.cast.archetypes;
        assert.ok(Array.isArray(archetypes) && archetypes.length >= 3, `${world.key}: cast.archetypes (at least 3)`);
        assert.equal(new Set(archetypes.map(entry => entry.key)).size, archetypes.length);
        for (const entry of archetypes) {
          assert.equal(typeof art.archetypes[entry.key], 'function', `${world.key}: no art for archetype "${entry.key}"`);
          assert.ok(entry.weight > 0 && typeof entry.kind === 'string' && entry.size >= 0.6 && entry.size <= 1.5, `${world.key}: archetype "${entry.key}" weight / kind / size`);
          for (let index = 0; index < 24; index += 1) {
            const look = lookOf(`${entry.key}-${index}`, { archetypes: [entry] });
            assert.equal(look.archetype, entry.key);
            for (const mood of MOODS) {
              assertDrawn(createCharacterArt({ look, mood, activity: 'coding', worldKey: world.key }, { seasonKey: index % 3 === 0 ? 'purim' : null }), `${world.key} ${entry.key} #${index} ${mood}`);
            }
          }
        }
        for (const [kind, size] of Object.entries(ART)) {
          if (!DECOR_KINDS.includes(kind)) continue;
          for (const variant of [0, 1]) assertDrawn(createDecorArt(kind, size, { variant, worldKey: world.key }), `${world.key} decor ${kind} ${variant}`);
        }
        for (const station of new Set([world.stations.desk, world.stations.craft])) {
          for (const done of [false, true]) assertDrawn(createStationArt('coding', { done, worldStation: station, worldKey: world.key }), `${world.key} station ${station}`);
        }
      });
    }

    test(`${world.key}: the cast picks looks the art can draw`, () => {
      const { cast } = world;
      if (cast.archetypes) {
        const keys = new Set(cast.archetypes.map(entry => entry.key));
        for (let index = 0; index < 40; index += 1) {
          const look = lookOf(`${world.key}-${index}`, cast);
          assert.ok(keys.has(look.archetype));
          assert.ok(look.size > 0.5 && look.size < 1.6 && look.pace >= 0 && look.pace < 1);
        }
        return;
      }
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
