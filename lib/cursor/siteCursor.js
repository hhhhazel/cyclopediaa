export const RUNNER_CURSOR_SRC = "/images/cyberclone-run.gif";

const CLICKABLE_SELECTOR =
  'a[href], button, input:not([type="hidden"]), select, textarea, label, summary, [role="button"], [role="link"], [role="menuitem"], [role="tab"]';

const RUNNER_PROXIMITY_OFFSETS = [
  [0, 0],
  [14, 0],
  [-14, 0],
  [0, 14],
  [0, -14],
  [10, 10],
  [-10, 10],
  [10, -10],
  [-10, -10],
];

export function isFlyswatterActive() {
  if (typeof document === "undefined") {
    return false;
  }

  return document.body.classList.contains("wiki-flyswatter-active");
}

export function isFinePointerDevice() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia("(pointer: fine)").matches;
}

export function computeRunnerRotation(lastX, lastY, x, y, previousRotation) {
  if (lastX === null || lastY === null) {
    return previousRotation;
  }

  const dx = x - lastX;
  const dy = y - lastY;

  if (Math.hypot(dx, dy) <= 1.5) {
    return previousRotation;
  }

  return Math.atan2(dy, dx) * (180 / Math.PI) + 90;
}

function isElementDisabled(element) {
  if (!element) {
    return true;
  }

  if (element.closest("[disabled], [aria-disabled='true']")) {
    return true;
  }

  if (element.closest(".wiki-browser-btn--disabled")) {
    return true;
  }

  return false;
}

function isVisibleInteractive(element) {
  if (!element || isElementDisabled(element)) {
    return false;
  }

  const rect = element.getBoundingClientRect();

  if (rect.width <= 0 || rect.height <= 0) {
    return false;
  }

  return true;
}

function isWikiInlineArticleLink(element) {
  if (!element) {
    return false;
  }

  const link = element.closest("a.wiki-inline-link");

  if (!link) {
    return false;
  }

  return !!link.closest(".wiki-vector-content, .wiki-vector-main, #wikiMainScroll");
}

function matchesRunnerTriggerTarget(element) {
  if (!element) {
    return false;
  }

  if (
    element.closest(
      ".wiki-flyswatter-cursor, .wiki-image-clone, .wiki-image-clone-layer"
    )
  ) {
    return false;
  }

  if (isWikiInlineArticleLink(element)) {
    return false;
  }

  const clickable = element.closest(CLICKABLE_SELECTOR);

  if (!clickable || !isVisibleInteractive(clickable)) {
    return false;
  }

  if (clickable.tagName === "A" && !clickable.getAttribute("href")) {
    const hasHandler =
      clickable.hasAttribute("onclick") ||
      clickable.getAttribute("role") === "button";

    if (!hasHandler) {
      return false;
    }
  }

  if (clickable.tagName === "LABEL") {
    const forId = clickable.getAttribute("for");

    if (!forId) {
      return false;
    }
  }

  return true;
}

export function shouldUseRunnerCursorAt(x, y) {
  if (typeof document === "undefined") {
    return false;
  }

  for (let i = 0; i < RUNNER_PROXIMITY_OFFSETS.length; i += 1) {
    const offset = RUNNER_PROXIMITY_OFFSETS[i];
    const sampleX = x + offset[0];
    const sampleY = y + offset[1];
    const target = document.elementFromPoint(sampleX, sampleY);

    if (matchesRunnerTriggerTarget(target)) {
      return true;
    }
  }

  return false;
}
