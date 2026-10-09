// The themed worlds of the people view. Each world file (worlds/<key>.js) holds its look - the room,
// the scenery and work stations (art-worlds.js keys), the cast its characters are drawn from - and its
// pool of lines. This module lists them. Pure data, covered by tests/worlds.test.js.

import office from './office.js';
import wizards from './wizards.js';
import middleEarth from './middle-earth.js';
import space from './space.js';
import pirates from './pirates.js';
import starKnights from './star-knights.js';
import heroes from './heroes.js';
import underwater from './underwater.js';
import dinos from './dinos.js';
import west from './west.js';
import shuk from './shuk.js';
import critters from './critters.js';
import kitchen from './kitchen.js';
import olympus from './olympus.js';
import cyber from './cyber.js';
import spies from './spies.js';

/** In the order shown in the theme pickers; the office (the default) first. */
export const WORLDS = Object.freeze([
  office, wizards, middleEarth, spies, space, starKnights, pirates, heroes, underwater, dinos, west, shuk, critters, kitchen, olympus, cyber,
]);
export const DEFAULT_WORLD_KEY = office.key;
export const WORLD_KEYS = Object.freeze(WORLDS.map(world => world.key));

const WORLDS_BY_KEY = new Map(WORLDS.map(world => [world.key, world]));

/** The world with that key, or the office. */
export function getWorld(key) {
  return WORLDS_BY_KEY.get(key) ?? office;
}

// Activities done with the hands (the "craft" station); everything else is desk work (the "desk" station).
const CRAFT_ACTIVITIES = new Set(['design', 'fixing', 'cleaning', 'sport', 'delivery', 'shopping', 'travel']);

/** A themed world's station key for a task's activity, or null in the office (its stations follow the activity). */
export function worldStationFor(world, activity) {
  if (!world?.stations) return null;
  return CRAFT_ACTIVITIES.has(activity) ? world.stations.craft : world.stations.desk;
}
