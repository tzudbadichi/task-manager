// The world art gallery: everything a themed world draws, big, on one page (dev only, not deployed).
// ?world=<key>  - the world (default middle-earth)
import { createCharacterArt, createDecorArt, createStationArt } from '../../src/js/art.js';
import { lookOf } from '../../src/js/people-model.js';
import { ART } from '../../src/js/world-layout.js';
import { getWorld } from '../../src/js/worlds/index.js';

const params = new URLSearchParams(location.search);
const world = getWorld(params.get('world') ?? 'middle-earth');
const gallery = document.getElementById('gallery');
const CATEGORY_COLORS = ['#2563eb', '#db2777', '#16a34a', '#ea580c', '#7c3aed', '#0891b2', '#ca8a04', '#64748b'];
const MOODS = ['working', 'idle', 'celebrating', 'waiting', 'sweating', 'bored', 'sleeping', 'working'];
const POSES = ['look', 'walk', 'work', 'think', 'sip', 'wait', 'chat', 'sit', 'sleep', 'dance'];

function element(tag, attributes = {}, ...children) {
  const node = document.createElement(tag);
  for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, value);
  node.append(...children.filter(Boolean));
  return node;
}

function character(look, { mood = 'working', pose = 'look', color = CATEGORY_COLORS[0], facing = 'right' } = {}) {
  const persona = { look, mood, activity: 'coding', worldKey: world.key, status: 'in_progress' };
  const node = element('div', { class: 'character', 'data-pose': pose, 'data-mood': mood, 'data-activity': 'world', 'data-kind': look.kind, 'data-facing': facing });
  node.style.setProperty('--cat-color', color);
  node.append(createCharacterArt(persona, { activityProps: false }));
  return node;
}

function section(title, ...content) {
  gallery.append(element('h2', {}, title), ...content);
}

gallery.append(element('h1', {}, `${world.label} (${world.key})`));

// The panorama as drawn, and how a room shows it on a desktop and on a phone.
const backdropUrl = `../../src/img/worlds/${world.key}/backdrop.svg`;
section('Backdrop (whole panorama, 2400 x 400)', element('img', { class: 'panorama', src: backdropUrl, alt: '' }));

function roomSim(width, height, wallHeight, compact) {
  const room = element('div', { class: `people-world room-sim${compact ? ' is-compact' : ''}`, 'data-world': world.key });
  room.style.setProperty('width', `${width}px`);
  room.style.setProperty('height', `${height}px`);
  room.style.setProperty('--wall-h', `${wallHeight}px`);
  room.append(element('div', { class: 'world-backdrop' }));
  // A few characters standing on the ground, to judge contrast.
  const archetypes = world.cast.archetypes ?? [];
  const scale = compact ? 0.66 : 0.88;
  archetypes.slice(0, compact ? 3 : 6).forEach((archetype, index) => {
    const look = lookOf(`${archetype.key}-room-${index}`, { archetypes: [archetype] });
    const node = character(look, { mood: MOODS[index % MOODS.length], color: CATEGORY_COLORS[index % CATEGORY_COLORS.length] });
    node.style.setProperty('position', 'absolute');
    node.style.setProperty('--character-w', `${92 * scale * look.size}px`);
    node.style.setProperty('width', `${92 * scale * look.size}px`);
    const x = width * ((index + 1) / ((compact ? 3 : 6) + 1));
    const y = wallHeight + 30 + (index % 2) * 60;
    node.style.setProperty('transform', `translate(${x - 46 * scale * look.size}px, ${y - 112 * scale * look.size}px)`);
    node.style.setProperty('z-index', String(Math.round(y)));
    room.append(node);
  });
  return room;
}
section('Rooms: desktop (1300 wide) and phone (375 wide)',
  element('div', { class: 'rooms' }, roomSim(1300, 420, 205, false), roomSim(375, 330, 140, true)));

// The ground tile, repeated, to check its seams.
const tile = element('div', { class: 'people-world tile-check', 'data-world': world.key });
tile.style.setProperty('position', 'relative');
section('Ground (240 x 240 tile, repeated)', tile);

// Every archetype, in many variations (seeds), moods and category colors.
const archetypes = world.cast.archetypes ?? [];
if (archetypes.length === 0) section('Characters', element('p', { class: 'missing' }, 'No cast.archetypes in this world yet.'));
for (const archetype of archetypes) {
  const row = element('div', { class: 'cast' });
  for (let index = 0; index < 8; index += 1) {
    const look = lookOf(`${archetype.key}-${index}`, { archetypes: [archetype] });
    const mood = MOODS[index % MOODS.length];
    row.append(element('div', { class: 'cell' }, character(look, { mood, color: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }), element('small', {}, mood)));
  }
  section(`Archetype: ${archetype.key} (kind ${archetype.kind ?? 'human'}, size ${archetype.size ?? 1}, weight ${archetype.weight})`, row);
}

// One look of each archetype in every pose (CSS animates them).
if (archetypes.length > 0) {
  const poses = element('div', { class: 'cast' });
  for (const archetype of archetypes) {
    const look = lookOf(`${archetype.key}-poses`, { archetypes: [archetype] });
    for (const pose of POSES) {
      const mood = pose === 'sleep' ? 'sleeping' : pose === 'dance' ? 'celebrating' : 'working';
      poses.append(element('div', { class: 'cell' }, character(look, { mood, pose }), element('small', {}, `${archetype.key}: ${pose}`)));
    }
  }
  section('Poses (one look per archetype)', poses);
}

// Furniture and stations, big.
const SCALE = 2.4;
function piece(svgElement, label, width) {
  svgElement.setAttribute('width', String(width * SCALE));
  return element('div', { class: 'piece' }, svgElement, element('small', {}, label));
}
const furniture = element('div', { class: 'pieces' });
for (const [kind, variant] of [['door', 0], ['shelf', 0], ['sofa', 0], ['rug', 0], ['coffee', 0], ['cooler', 0], ['plant', 0], ['plant', 1]]) {
  furniture.append(piece(createDecorArt(kind, ART[kind], { variant, worldKey: world.key }), `${kind} ${variant}`, ART[kind].width));
}
section('Furniture (world-layout ART sizes)', furniture);

const stationRow = element('div', { class: 'pieces' });
for (const [label, activity] of [['desk', 'coding'], ['craft', 'fixing']]) {
  const key = world.stations?.[label];
  for (const done of [false, true]) {
    const holder = element('div', { class: `station${done ? '' : ' is-busy'}` });
    holder.style.setProperty('position', 'relative');
    holder.style.setProperty('width', `${72 * SCALE}px`);
    holder.append(createStationArt(activity, { done, worldStation: key, worldKey: world.key }));
    stationRow.append(element('div', { class: 'piece' }, holder, element('small', {}, `${label}: ${key}${done ? ' (done)' : ' (busy)'}`)));
  }
}
section('Stations', stationRow);
document.body.dataset.ready = 'true';
