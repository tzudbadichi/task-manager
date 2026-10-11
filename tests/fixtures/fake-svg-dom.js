// A tiny stand-in for the DOM, enough for svg-kit.js (createElementNS, setAttribute, append), so the
// art modules can be drawn in Node tests and their output inspected. installFakeDocument() puts it on
// globalThis.document (once); walk() visits every node of a drawn tree.

class FakeNode {
  constructor(tagName) {
    this.tagName = tagName;
    this.attributes = new Map();
    this.children = [];
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }

  append(...nodes) {
    this.children.push(...nodes);
  }
}

export function installFakeDocument() {
  if (globalThis.document) return;
  globalThis.document = { createElementNS: (namespace, tagName) => new FakeNode(tagName) };
}

/** Calls visit(node) for the node and all its descendants. */
export function walk(node, visit) {
  visit(node);
  for (const child of node.children ?? []) walk(child, visit);
}
