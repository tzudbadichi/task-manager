// Tiny SVG builder shared by the art modules (art.js, art-worlds.js). Elements are created with
// createElementNS and attributes only - no markup strings, no inline styles - so the art works under
// the strict Content-Security-Policy. Nothing touches the DOM until a function is called.

const SVG_NS = 'http://www.w3.org/2000/svg';

/** svg(tag, attributes, ...children): null / undefined / false attributes and children are skipped. */
export function svg(tag, attributes = {}, ...children) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attributes)) {
    if (value !== null && value !== undefined && value !== false) node.setAttribute(name, String(value));
  }
  for (const child of children.flat(Infinity)) if (child) node.append(child);
  return node;
}

export const group = (className, ...children) => svg('g', { class: className }, ...children);
export const rect = (x, y, width, height, fill, extra = {}) => svg('rect', { x, y, width, height, fill, ...extra });
export const circle = (cx, cy, r, fill, extra = {}) => svg('circle', { cx, cy, r, fill, ...extra });
export const ellipse = (cx, cy, rx, ry, fill, extra = {}) => svg('ellipse', { cx, cy, rx, ry, fill, ...extra });
export const path = (d, fill, extra = {}) => svg('path', { d, fill, ...extra });
export const line = (x1, y1, x2, y2, stroke, width, extra = {}) =>
  svg('line', { x1, y1, x2, y2, stroke, 'stroke-width': width, 'stroke-linecap': 'round', ...extra });

/** Mixes two #rrggbb colors; amount 0 keeps the first, 1 gives the second. */
export function mixColor(color, other, amount) {
  const channels = hex => [1, 3, 5].map(index => Number.parseInt(hex.slice(index, index + 2), 16));
  const [from, to] = [channels(color), channels(other)];
  return `#${from.map((value, index) => Math.round(value + (to[index] - value) * amount).toString(16).padStart(2, '0')).join('')}`;
}
export const lighter = (color, amount = 0.5) => mixColor(color, '#ffffff', amount);
export const darker = (color, amount = 0.3) => mixColor(color, '#000000', amount);
