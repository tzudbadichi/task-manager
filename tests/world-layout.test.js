import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { COMPACT_MAX_WIDTH, computeWorldLayout } from '../src/js/world-layout.js';

describe('computeWorldLayout (the people view office)', () => {
  test('one desk per task, laid out right to left and row by row', () => {
    const layout = computeWorldLayout({ width: 1200, count: 10 });
    assert.equal(layout.stations.length, 10);
    const [first, second] = layout.stations;
    assert.ok(first.left > second.left, 'the first desk is the rightmost');
    assert.equal(first.floorY, second.floorY);
    const columns = layout.stations.filter(station => station.floorY === first.floorY).length;
    const nextRow = layout.stations[columns];
    assert.ok(nextRow.floorY > first.floorY, 'the next row is lower');
    assert.ok(Math.abs(nextRow.left - first.left) < 1, 'and starts again on the right');
    for (const station of layout.stations) {
      assert.ok(station.home.x < station.left, 'a character works on the left side of its desk');
      assert.ok(station.home.x > 0 && station.left < layout.width);
    }
  });

  test('more desks make a taller office; a full screen stretches it and spreads the rows', () => {
    const few = computeWorldLayout({ width: 1200, count: 3 });
    const many = computeWorldLayout({ width: 1200, count: 40 });
    assert.ok(many.height > few.height);
    const stretched = computeWorldLayout({ width: 1200, count: 3, minHeight: few.height + 300 });
    assert.equal(stretched.height, few.height + 300);
    assert.ok(stretched.stations[0].floorY > few.stations[0].floorY);
  });

  test('phones get the compact sizes', () => {
    assert.equal(computeWorldLayout({ width: COMPACT_MAX_WIDTH, count: 4 }).compact, true);
    const regular = computeWorldLayout({ width: COMPACT_MAX_WIDTH + 1, count: 4 });
    assert.equal(regular.compact, false);
    assert.ok(computeWorldLayout({ width: 380, count: 4 }).unit < regular.unit);
  });

  test('every spot a character walks to is inside the office, below the wall', () => {
    for (const width of [380, 800, 1400]) {
      const layout = computeWorldLayout({ width, count: 12 });
      const { spots, bounds } = layout;
      const points = [spots.coffee, spots.cooler, spots.shelf, spots.door, ...spots.windows, ...spots.plants, ...spots.seats];
      for (const point of points) {
        assert.ok(point.x > 0 && point.x < width, 'x inside the office');
        assert.ok(point.y > layout.wallHeight && point.y < layout.height, 'y on the floor');
      }
      assert.equal(spots.seats.length, 3);
      assert.ok(bounds.minX < bounds.maxX && bounds.minY < bounds.maxY);
      assert.ok(spots.party.minX < spots.party.maxX && spots.party.minY < spots.party.maxY);
      assert.ok(layout.decor.some(item => item.kind === 'door') && layout.decor.some(item => item.kind === 'sofa'));
    }
  });
});
