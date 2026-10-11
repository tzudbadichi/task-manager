// The themed worlds' own art, by world key (worlds/<key>.js holds the data, world-art/<key>.js the drawing):
//   archetypes: { key: look => figure }   characters, drawn with the figure kit (figure-kit.js composeFigure);
//                                         worlds/<key>.js cast.archetypes says which appear and how often
//   decor:      { kind: variant => parts } furniture in world-layout.js ART sizes (door, shelf, sofa, coffee,
//                                         cooler, plant, rug)
//   stations:   { key: () => parts }       work stations (viewBox 68 20 72 96, floor at y = 112), by the keys
//                                         of worlds/<key>.js stations
// The painted backdrop and the ground of each world are SVG files in img/worlds/<key>/ (css/worlds.css).

import critters from './critters.js';
import cyber from './cyber.js';
import dinos from './dinos.js';
import heroes from './heroes.js';
import kitchen from './kitchen.js';
import middleEarth from './middle-earth.js';
import olympus from './olympus.js';
import pirates from './pirates.js';
import shuk from './shuk.js';
import space from './space.js';
import spies from './spies.js';
import starKnights from './star-knights.js';
import underwater from './underwater.js';
import west from './west.js';
import wizards from './wizards.js';

const WORLD_ART = Object.freeze({
  critters, cyber, dinos, heroes, kitchen, 'middle-earth': middleEarth, olympus, pirates, shuk, space, spies,
  'star-knights': starKnights, underwater, west, wizards,
});

/** The art of a themed world, or null (the office, or an unknown key). */
export function worldArtOf(worldKey) {
  return WORLD_ART[worldKey] ?? null;
}
