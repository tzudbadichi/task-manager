// Geometry of the people view's office: where the wall, the desks (one per task), the lounge and the
// furniture are, and the spots characters walk to. Pure (no DOM), covered by tests/world-layout.test.js.
//
// All values are pixels inside the office element. y is a "floor line": the feet of a character or the
// bottom of a piece of furniture; it also orders them in depth (lower on screen = in front).
// The art (art.js) is drawn in "units"; `unit` is how many pixels one unit takes here.

const SIZES = Object.freeze({
  regular: { unit: 0.88, pad: 28, wallHeight: 128, aisle: 44, cellWidth: 150, cellHeight: 128, loungeHeight: 196 },
  compact: { unit: 0.66, pad: 12, wallHeight: 100, aisle: 30, cellWidth: 112, cellHeight: 106, loungeHeight: 160 },
});

// Art sizes in units (viewBox widths and heights of art.js).
export const ART = Object.freeze({
  character: { width: 92, height: 124, feetY: 112, centerX: 46 },
  station: { left: 68, top: 20, width: 72, height: 96, floorY: 112 },
  window: { width: 100, height: 72 },
  clock: { width: 40, height: 40 },
  picture: { width: 44, height: 34 },
  door: { width: 50, height: 92 },
  shelf: { width: 64, height: 92 },
  sofa: { width: 150, height: 66 },
  coffee: { width: 56, height: 92 },
  cooler: { width: 36, height: 92 },
  plant: { width: 44, height: 70 },
  rug: { width: 200, height: 40 },
});

// A character working at its desk stands this many units left of the desk art's left edge.
const HOME_OFFSET_UNITS = ART.station.left - ART.character.centerX + 2;
// Up to this width the office uses the compact sizes (phones).
export const COMPACT_MAX_WIDTH = 700;
const WINDOW_EVERY_PX = 320;

/**
 * width: the office width; count: how many desks; minHeight: stretch to at least this (full screen).
 * Desks are laid out in reading order for a right-to-left page: the first desk is top right.
 */
export function computeWorldLayout({ width, count, minHeight = 0 }) {
  const compact = width <= COMPACT_MAX_WIDTH;
  const size = compact ? SIZES.compact : SIZES.regular;
  const { unit, pad, wallHeight, aisle, cellWidth, cellHeight, loungeHeight } = size;
  const columns = Math.max(1, Math.floor((width - pad * 2) / cellWidth));
  const rows = Math.ceil(count / columns);
  const naturalHeight = wallHeight + aisle + rows * cellHeight + loungeHeight;
  const height = Math.round(Math.max(naturalHeight, minHeight));
  // Spare height (a tall full screen) spreads the rows of desks apart.
  const rowGap = rows > 0 ? Math.min((height - naturalHeight) / (rows + 1), cellHeight) : 0;
  const gridWidth = columns * cellWidth;
  const gridRight = width - (width - gridWidth) / 2;

  const stationWidth = ART.station.width * unit;
  const stations = Array.from({ length: count }, (_, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const cellRight = gridRight - column * cellWidth;
    const floorY = wallHeight + aisle + rowGap * (row + 1) + (row + 1) * cellHeight - 18;
    const left = cellRight - stationWidth - 10;
    return {
      left,
      floorY,
      home: { x: left - HOME_OFFSET_UNITS * unit, y: floorY },
    };
  });

  const loungeTop = height - loungeHeight;
  const decor = [];
  const spots = { windows: [], plants: [], seats: [] };

  // The back wall: windows, a picture or two, a clock, the door (right) and a bookshelf (left).
  const windowWidth = ART.window.width * unit * 1.05;
  const windowCount = Math.max(1, Math.min(4, Math.floor(width / WINDOW_EVERY_PX)));
  for (let index = 0; index < windowCount; index += 1) {
    const centerX = width * ((index + 1) / (windowCount + 1)) - (compact ? 0 : width * 0.04);
    decor.push({ kind: 'window', left: centerX - windowWidth / 2, top: 16, width: windowWidth, z: 1 });
    spots.windows.push({ x: centerX, y: wallHeight + 16 });
    if (!compact && index < windowCount - 1) {
      const pictureX = width * ((index + 1.5) / (windowCount + 1)) - width * 0.04;
      decor.push({ kind: 'picture', variant: index, left: pictureX - 22 * unit, top: 30, width: ART.picture.width * unit, z: 1 });
    }
  }
  const clockWidth = ART.clock.width * unit * 1.2;
  const doorWidth = ART.door.width * unit * 1.15;
  const doorLeft = width - pad - doorWidth;
  decor.push({ kind: 'clock', left: doorLeft - clockWidth - (compact ? 10 : 34), top: 22, width: clockWidth, z: 1 });
  decor.push({ kind: 'door', left: doorLeft, floorY: wallHeight + 2, width: doorWidth, z: 2 });
  spots.door = { x: doorLeft + doorWidth / 2, y: wallHeight + 8 };
  const shelfWidth = ART.shelf.width * unit;
  decor.push({ kind: 'shelf', left: pad, floorY: wallHeight + 10, width: shelfWidth, z: wallHeight + 10 });
  spots.shelf = { x: pad + shelfWidth + 12, y: wallHeight + 20 };

  // The lounge: a sofa on a rug, the coffee machine, the water cooler, plants in the corners.
  const sofaWidth = ART.sofa.width * unit * (compact ? 0.95 : 1.1);
  const sofaLeft = compact ? pad + 26 : width * 0.18;
  const sofaFloor = height - 30;
  const sofaUnit = sofaWidth / ART.sofa.width;
  decor.push({ kind: 'rug', left: sofaLeft - sofaWidth * 0.12, floorY: sofaFloor + 18, width: sofaWidth * 1.24, z: 0 });
  decor.push({ kind: 'sofa', left: sofaLeft, floorY: sofaFloor, width: sofaWidth, z: sofaFloor });
  for (const seatX of [34, 75, 116]) spots.seats.push({ x: sofaLeft + seatX * sofaUnit, y: sofaFloor - 10 * sofaUnit, z: sofaFloor + 1 });

  const coffeeWidth = ART.coffee.width * unit;
  const coolerWidth = ART.cooler.width * unit;
  const coolerLeft = width - pad - (compact ? coolerWidth + 6 : width * 0.12);
  const coffeeLeft = coolerLeft - coffeeWidth - (compact ? 22 : 70);
  decor.push({ kind: 'coffee', left: coffeeLeft, floorY: height - 34, width: coffeeWidth, z: height - 34 });
  decor.push({ kind: 'cooler', left: coolerLeft, floorY: height - 30, width: coolerWidth, z: height - 30 });
  spots.coffee = { x: coffeeLeft - 6, y: height - 30 };
  spots.cooler = { x: coolerLeft - 6, y: height - 28 };

  const plantWidth = ART.plant.width * unit;
  if (!compact) {
    decor.push({ kind: 'plant', variant: 0, left: pad - 6, floorY: height - 14, width: plantWidth, z: height - 14 });
    spots.plants.push({ x: pad + plantWidth + 6, y: height - 30 });
  }
  // A plant against the wall, next to the door.
  const wallPlantLeft = doorLeft - plantWidth - 6;
  decor.push({ kind: 'plant', variant: 1, left: wallPlantLeft, floorY: wallHeight + 8, width: plantWidth, z: wallHeight + 8 });
  spots.plants.push({ x: wallPlantLeft + plantWidth / 2, y: wallHeight + 24 });

  // Room for the name tag under a character's feet (and half of it beside the side walls).
  const tagRoom = compact ? 34 : 40;
  const bounds = { minX: pad + tagRoom, maxX: width - pad - tagRoom, minY: wallHeight + 12, maxY: height - 28 };
  spots.party = {
    minX: compact ? width * 0.15 : width * 0.32, maxX: compact ? width * 0.85 : width * 0.62,
    minY: loungeTop + 24, maxY: height - 50,
  };

  return { width, height, compact, unit, wallHeight, loungeTop, stations, decor, spots, bounds };
}
