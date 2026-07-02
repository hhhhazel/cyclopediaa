/**
 * Field item drag — ported from public/script.js attachCyberflingItemEvents().
 * Positions are kept in percent on the client until the page reloads.
 */
export function bindFieldItemDrag(item, options) {
  if (!item) {
    return function () {};
  }

  const shouldBlockDrag = options?.shouldBlockDrag || function () {
    return false;
  };

  let isDragging = false;
  let hasMoved = false;
  let startDragX = 0;
  let startDragY = 0;
  let startLeft = 0;
  let startTop = 0;

  function onPointerDown(event) {
    if (shouldBlockDrag()) {
      return;
    }

    if (event.target.closest(".floating-arrow")) {
      return;
    }

    isDragging = true;
    hasMoved = false;
    item.classList.add("dragging");

    const rect = item.getBoundingClientRect();
    const parentRect = item.parentElement.getBoundingClientRect();

    startDragX = event.clientX;
    startDragY = event.clientY;
    startLeft = rect.left - parentRect.left + rect.width / 2;
    startTop = rect.top - parentRect.top + rect.height / 2;

    item.setPointerCapture(event.pointerId);
    options?.onDragStart?.();
  }

  function onPointerMove(event) {
    if (!isDragging) {
      return;
    }

    const dx = event.clientX - startDragX;
    const dy = event.clientY - startDragY;

    item.style.left = startLeft + dx + "px";
    item.style.top = startTop + dy + "px";

    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      hasMoved = true;
      options?.onDragMove?.();
    }
  }

  function finishDrag(event) {
    if (!isDragging) {
      return;
    }

    isDragging = false;
    item.classList.remove("dragging");

    if (hasMoved) {
      const parentRect = item.parentElement.getBoundingClientRect();
      const currentLeft = parseFloat(item.style.left);
      const currentTop = parseFloat(item.style.top);

      if (!Number.isNaN(currentLeft) && !Number.isNaN(currentTop)) {
        const xPercent = (currentLeft / parentRect.width) * 100;
        const yPercent = (currentTop / parentRect.height) * 100;

        item.dataset.fieldLeft = xPercent + "%";
        item.dataset.fieldTop = yPercent + "%";
        options?.onPositionChange?.(xPercent, yPercent);
      }
    }

    hasMoved = false;

    if (event && item.hasPointerCapture(event.pointerId)) {
      item.releasePointerCapture(event.pointerId);
    }

    options?.onDragEnd?.();
  }

  function onPointerUp(event) {
    finishDrag(event);
  }

  function onPointerCancel() {
    finishDrag(null);
  }

  item.addEventListener("pointerdown", onPointerDown);
  item.addEventListener("pointermove", onPointerMove);
  item.addEventListener("pointerup", onPointerUp);
  item.addEventListener("pointercancel", onPointerCancel);

  return function () {
    item.removeEventListener("pointerdown", onPointerDown);
    item.removeEventListener("pointermove", onPointerMove);
    item.removeEventListener("pointerup", onPointerUp);
    item.removeEventListener("pointercancel", onPointerCancel);
    item.classList.remove("dragging");
  };
}
