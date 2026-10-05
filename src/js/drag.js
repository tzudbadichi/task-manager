// Drag-and-drop reordering for the task grid - mouse, and long press on touch screens.
//
// Direction-agnostic, so it behaves the same in this right-to-left grid: while dragging, a
// placeholder takes the DOM position of whichever tile is under the pointer. Gaps between
// tiles are ignored, so passing over them never sends the tile to the end of the grid.
// On touch, a quick swipe still scrolls the page; holding a tile for a moment picks it up.

const MOUSE_DRAG_THRESHOLD_PX = 5;
const TOUCH_HOLD_MS = 250;
const TOUCH_MOVE_TOLERANCE_PX = 8;
const AUTO_SCROLL_EDGE_PX = 70;
const AUTO_SCROLL_MAX_STEP_PX = 18;
const MOVE_ANIMATION_MS = 160;
// The release that ends a drag can be followed by a click (mouse) or a delayed tap (touch).
const SUPPRESS_CLICK_MS = 450;

/**
 * itemSelector: the draggable children of container. ignoreSelector: controls inside an item
 * that must stay clickable (no drag starts on them). onReorder(orderedIds) is called after a
 * drop that changed the order; onDragEnd({ changed }) after every drag (also cancelled ones).
 */
export function enableGridDrag(container, { itemSelector, ignoreSelector, idOf, onDragStart, onDragEnd, onReorder }) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let pending = null; // pressed, not dragging yet: { item, pointerId, pointerType, startX, startY, holdTimer }
  let drag = null; // dragging: { item, placeholder, pointerId, pointerType, offsetX, offsetY, x, y, originalOrder, scrollFrame, settleUntil }
  // The tile that was just dropped (by id - the grid re-renders on drop), and until when a click on it is ignored.
  let justDropped = { id: null, until: 0 };

  const currentOrder = () => [...container.querySelectorAll(itemSelector)].map(idOf);

  function onPointerDown(event) {
    if (drag || pending || !event.isPrimary) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const item = event.target.closest(itemSelector);
    if (!item || !container.contains(item) || event.target.closest(ignoreSelector)) return;
    pending = { item, pointerId: event.pointerId, pointerType: event.pointerType, startX: event.clientX, startY: event.clientY, holdTimer: null };
    if (event.pointerType !== 'mouse') {
      pending.holdTimer = setTimeout(() => pending && startDrag(pending.startX, pending.startY), TOUCH_HOLD_MS);
    }
    addListeners();
  }

  function onPointerMove(event) {
    if (pending && event.pointerId === pending.pointerId) {
      const distance = Math.hypot(event.clientX - pending.startX, event.clientY - pending.startY);
      if (pending.pointerType === 'mouse') {
        if (distance >= MOUSE_DRAG_THRESHOLD_PX) startDrag(event.clientX, event.clientY);
      } else if (distance > TOUCH_MOVE_TOLERANCE_PX) {
        cancelPending(); // moved before the hold time: this is a scroll, not a pick-up
      }
    }
    if (drag && event.pointerId === drag.pointerId) {
      event.preventDefault();
      moveDrag(event.clientX, event.clientY);
    }
  }

  // Touch: once a tile is picked up, stop the page from scrolling and follow the finger.
  function onTouchMove(event) {
    if (!drag || drag.pointerType !== 'touch') return;
    event.preventDefault();
    const touch = event.touches[0];
    if (touch) moveDrag(touch.clientX, touch.clientY);
  }

  function onPointerUp(event) {
    if (pending && event.pointerId === pending.pointerId) cancelPending();
    else if (drag && event.pointerId === drag.pointerId) finishDrag(true);
  }

  function onPointerCancel(event) {
    if (pending && event.pointerId === pending.pointerId) cancelPending();
    // Touch drags are ended by touchend/touchcancel instead: some browsers send pointercancel
    // as soon as the finger moves, even though the touchmove is being prevented.
    else if (drag && event.pointerId === drag.pointerId && drag.pointerType !== 'touch') finishDrag(false);
  }

  function onTouchEnd(event) {
    if (drag && drag.pointerType === 'touch') finishDrag(event.type === 'touchend');
  }

  function onKeyDown(event) {
    if (drag && event.key === 'Escape') {
      event.preventDefault();
      finishDrag(false);
    }
  }

  // A long press would otherwise open the context menu / text selection on phones.
  function onContextMenu(event) {
    if (pending || drag) event.preventDefault();
  }

  function addListeners() {
    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerCancel);
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd);
    document.addEventListener('touchcancel', onTouchEnd);
    document.addEventListener('keydown', onKeyDown);
  }

  function removeListeners() {
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointercancel', onPointerCancel);
    document.removeEventListener('touchmove', onTouchMove);
    document.removeEventListener('touchend', onTouchEnd);
    document.removeEventListener('touchcancel', onTouchEnd);
    document.removeEventListener('keydown', onKeyDown);
  }

  function cancelPending() {
    clearTimeout(pending.holdTimer);
    pending = null;
    removeListeners();
  }

  function startDrag(x, y) {
    const { item, pointerId, pointerType } = pending;
    clearTimeout(pending.holdTimer);
    pending = null;

    const rect = item.getBoundingClientRect();
    const placeholder = document.createElement('div');
    placeholder.className = 'tile-placeholder';
    placeholder.setAttribute('aria-hidden', 'true');
    item.before(placeholder);

    // The tile itself floats under the pointer (styles via CSSOM, allowed by the CSP).
    item.classList.add('is-floating');
    item.style.setProperty('width', `${rect.width}px`);
    item.style.setProperty('height', `${rect.height}px`);
    document.body.classList.add('is-dragging-tile');

    drag = {
      item, placeholder, pointerId, pointerType,
      offsetX: x - rect.left, offsetY: y - rect.top, x, y,
      originalOrder: currentOrder(), scrollFrame: 0, settleUntil: 0,
    };
    positionFloatingItem();
    onDragStart?.();
    drag.scrollFrame = requestAnimationFrame(autoScroll);
  }

  function positionFloatingItem() {
    drag.item.style.setProperty('left', `${drag.x - drag.offsetX}px`);
    drag.item.style.setProperty('top', `${drag.y - drag.offsetY}px`);
  }

  function moveDrag(x, y) {
    drag.x = x;
    drag.y = y;
    positionFloatingItem();
    // While tiles are still sliding into their new places, hit-testing would see stale positions.
    if (performance.now() < drag.settleUntil) return;
    const target = document.elementFromPoint(x, y)?.closest(itemSelector);
    if (!target || target === drag.item || !container.contains(target)) return;
    const children = [...container.children];
    const movesForward = children.indexOf(drag.placeholder) < children.indexOf(target);
    animateLayout(() => (movesForward ? target.after(drag.placeholder) : target.before(drag.placeholder)));
  }

  // FLIP: measure, move in the DOM, then animate every tile from its old spot to the new one.
  function animateLayout(mutate) {
    if (reducedMotion.matches) {
      mutate();
      return;
    }
    const items = [...container.querySelectorAll(itemSelector)].filter(element => element !== drag.item);
    const before = new Map(items.map(element => [element, element.getBoundingClientRect()]));
    mutate();
    for (const element of items) {
      const from = before.get(element);
      const to = element.getBoundingClientRect();
      const dx = from.left - to.left;
      const dy = from.top - to.top;
      if (dx === 0 && dy === 0) continue;
      element.animate(
        [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }],
        { duration: MOVE_ANIMATION_MS, easing: 'ease-out' },
      );
    }
    drag.settleUntil = performance.now() + MOVE_ANIMATION_MS;
  }

  // Scroll the page while the pointer is held near the top or bottom edge.
  function autoScroll() {
    if (!drag) return;
    const { y } = drag;
    let step = 0;
    if (y < AUTO_SCROLL_EDGE_PX) step = -Math.ceil(((AUTO_SCROLL_EDGE_PX - y) / AUTO_SCROLL_EDGE_PX) * AUTO_SCROLL_MAX_STEP_PX);
    else if (y > window.innerHeight - AUTO_SCROLL_EDGE_PX) {
      step = Math.ceil(((y - (window.innerHeight - AUTO_SCROLL_EDGE_PX)) / AUTO_SCROLL_EDGE_PX) * AUTO_SCROLL_MAX_STEP_PX);
    }
    if (step !== 0) {
      window.scrollBy(0, step);
      moveDrag(drag.x, drag.y);
    }
    drag.scrollFrame = requestAnimationFrame(autoScroll);
  }

  function finishDrag(commit) {
    const { item, placeholder, originalOrder, scrollFrame } = drag;
    cancelAnimationFrame(scrollFrame);
    placeholder.replaceWith(item);
    item.classList.remove('is-floating');
    for (const property of ['width', 'height', 'left', 'top']) item.style.removeProperty(property);
    document.body.classList.remove('is-dragging-tile');
    drag = null;
    removeListeners();
    // A drag (or a cancelled one) must never also open the task it started on.
    justDropped = { id: idOf(item), until: performance.now() + SUPPRESS_CLICK_MS };

    const order = currentOrder();
    const changed = commit && order.join('\n') !== originalOrder.join('\n');
    onDragEnd?.({ changed });
    if (changed) onReorder(order);
  }

  function onClickCapture(event) {
    if (performance.now() >= justDropped.until) return;
    const clickedItem = event.target.closest(itemSelector);
    if (clickedItem && idOf(clickedItem) === justDropped.id) {
      event.stopPropagation();
      event.preventDefault();
    }
  }

  container.addEventListener('pointerdown', onPointerDown);
  container.addEventListener('click', onClickCapture, true);
  container.addEventListener('contextmenu', onContextMenu);
}
