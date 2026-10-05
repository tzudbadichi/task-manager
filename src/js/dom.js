// Tiny DOM builder. User text is always inserted as text nodes (never as HTML),
// so task titles or imported backups cannot inject markup or scripts.

/**
 * h('button', { class: ['btn', isActive && 'is-active'], dataset: { action: 'x' } }, 'label')
 * Special props: class (string | array, falsy entries dropped), dataset, cssVars (CSS custom properties),
 * value (set after children so <select> picks the right option). null / undefined / false props are skipped.
 */
export function h(tag, props, ...children) {
  const element = document.createElement(tag);
  let deferredValue;
  for (const [key, value] of Object.entries(props ?? {})) {
    if (value === null || value === undefined || value === false) continue;
    switch (key) {
      case 'class':
        element.className = Array.isArray(value) ? value.filter(Boolean).join(' ') : value;
        break;
      case 'dataset':
        for (const [name, dataValue] of Object.entries(value)) {
          if (dataValue !== null && dataValue !== undefined) element.dataset[name] = String(dataValue);
        }
        break;
      case 'cssVars':
        // CSSOM (not a style attribute), so it works under the strict Content-Security-Policy.
        for (const [name, cssValue] of Object.entries(value)) element.style.setProperty(name, cssValue);
        break;
      case 'value':
        deferredValue = value;
        break;
      case 'checked':
      case 'disabled':
      case 'hidden':
        element[key] = true;
        break;
      default:
        element.setAttribute(key, value === true ? '' : String(value));
    }
  }
  appendChildren(element, children);
  if (deferredValue !== undefined) element.value = deferredValue;
  return element;
}

function appendChildren(element, children) {
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false || child === '') continue;
    element.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
}
