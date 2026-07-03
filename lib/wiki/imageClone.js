export const FLYSWATTER_CURSOR_IDLE = "/images/flyswatter.gif";
export const FLYSWATTER_CURSOR_SWING = "/images/flyswatter-swing.gif";

export const WIKI_IMAGE_CLONE_MAX = 60;
export const WIKI_IMAGE_COUNT = 63;
export const WIKI_IMAGE_CLONE_INDICES = [2, 5, 8, 9, 14, 27, 59, 60, 61];
export const IMAGE_CLONE_PACE_MS = 1000;
export const SPAWN_IMMUNITY_MS = IMAGE_CLONE_PACE_MS;
export const MIN_LONG_EDGE = 22;
export const MAX_LONG_EDGE = 34;
export const MIN_SPEED = 1.35;
export const MAX_SPEED = 2.35;
export const HERD_MAX_SPEED = 1.85;
export const REPEL_RADIUS = 130;
export const REPEL_STRENGTH = 0.42;
export const SWATT_RADIUS = 110;
export const SWATT_KILL_MIN = 3;
export const SWATT_KILL_MAX = 4;
export const SWING_GIF_MS = 650;
export const IMAGE_CLONE_CONTROL_PAD = 48;
export const FRAME_MS = 1000 / 60;

export function wikiPreviewImagePath(index) {
  return "/wiki/show (" + index + ").png";
}

export function randomWikiImageIndex() {
  const pool = WIKI_IMAGE_CLONE_INDICES.length
    ? WIKI_IMAGE_CLONE_INDICES
    : Array.from({ length: WIKI_IMAGE_COUNT }, function (_, i) {
        return i + 1;
      });

  return pool[Math.floor(Math.random() * pool.length)];
}

export function isPointerNearImageCloneControl(clientX, clientY) {
  if (typeof document === "undefined") {
    return false;
  }

  const button = document.getElementById("wiki-image-clone-toggle");

  if (!button) {
    return false;
  }

  const rect = button.getBoundingClientRect();

  return (
    clientX >= rect.left - IMAGE_CLONE_CONTROL_PAD &&
    clientX <= rect.right + IMAGE_CLONE_CONTROL_PAD &&
    clientY >= rect.top - IMAGE_CLONE_CONTROL_PAD &&
    clientY <= rect.bottom + IMAGE_CLONE_CONTROL_PAD
  );
}

export function clampVelocity(vx, vy) {
  const speed = Math.hypot(vx, vy) || MIN_SPEED;
  const target = MIN_SPEED + Math.random() * (MAX_SPEED - MIN_SPEED);
  const scale = target / speed;

  return {
    vx: vx * scale,
    vy: vy * scale,
  };
}

export function clampHerdVelocity(vx, vy) {
  const speed = Math.hypot(vx, vy) || 0.01;

  if (speed <= HERD_MAX_SPEED) {
    return { vx: vx, vy: vy };
  }

  const scale = HERD_MAX_SPEED / speed;

  return {
    vx: vx * scale,
    vy: vy * scale,
  };
}

export function randomDownwardVelocity() {
  return {
    vx: (Math.random() - 0.5) * 0.45,
    vy: 2.25 + Math.random() * 0.85,
  };
}

export function inheritVelocity(source) {
  return clampVelocity(
    source.vx + (Math.random() - 0.5) * 0.22,
    source.vy + (Math.random() - 0.5) * 0.22
  );
}

export function averageVelocity(a, b) {
  return clampVelocity((a.vx + b.vx) / 2, (a.vy + b.vy) / 2);
}

export function loadSpriteMetrics(src) {
  return new Promise(function (resolve, reject) {
    const img = new Image();

    img.onload = function () {
      const naturalWidth = img.naturalWidth || 1;
      const naturalHeight = img.naturalHeight || 1;
      const longEdge = Math.max(naturalWidth, naturalHeight);
      const targetLong =
        MIN_LONG_EDGE + Math.random() * (MAX_LONG_EDGE - MIN_LONG_EDGE);
      const scale = targetLong / longEdge;

      resolve({
        src: src,
        width: naturalWidth * scale,
        height: naturalHeight * scale,
      });
    };

    img.onerror = reject;
    img.src = src;
  });
}

export function boxesOverlap(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export function separateSprites(a, b) {
  const overlapX =
    Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
  const overlapY =
    Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);

  if (overlapX <= 0 || overlapY <= 0) {
    return;
  }

  if (overlapX < overlapY) {
    const push = overlapX / 2 + 1;

    if (a.x <= b.x) {
      a.x -= push;
      b.x += push;
    } else {
      a.x += push;
      b.x -= push;
    }

    a.vx = -Math.abs(a.vx);
    b.vx = Math.abs(b.vx);
  } else {
    const push = overlapY / 2 + 1;

    if (a.y <= b.y) {
      a.y -= push;
      b.y += push;
    } else {
      a.y += push;
      b.y -= push;
    }

    a.vy = -Math.abs(a.vy);
    b.vy = Math.abs(b.vy);
  }
}

export function placementForEdgeClone(source, edge, viewportWidth, viewportHeight) {
  const gap = Math.max(source.width, source.height) + 10;

  if (edge === "bottom") {
    const goLeft = Math.random() < 0.5;
    const x = goLeft
      ? Math.max(0, source.x - gap)
      : Math.min(viewportWidth - source.width, source.x + gap);

    return {
      x: x,
      y: Math.max(0, source.y - source.height - 8),
      velocity: clampVelocity(
        goLeft ? -MIN_SPEED * 0.7 : MIN_SPEED * 0.7,
        -MIN_SPEED * 0.55
      ),
    };
  }

  if (edge === "left") {
    return {
      x: Math.min(viewportWidth - source.width, source.x + gap),
      y: source.y,
      velocity: clampVelocity(MIN_SPEED * 0.75, (Math.random() - 0.5) * 0.35),
    };
  }

  return {
    x: Math.max(0, source.x - gap),
    y: source.y,
    velocity: clampVelocity(-MIN_SPEED * 0.75, (Math.random() - 0.5) * 0.35),
  };
}

export function applySwatterRepel(sprite, frameScale, mouseX, mouseY) {
  const centerX = sprite.x + sprite.width / 2;
  const centerY = sprite.y + sprite.height / 2;
  const dx = centerX - mouseX;
  const dy = centerY - mouseY;
  const distance = Math.hypot(dx, dy) || 1;

  if (distance >= REPEL_RADIUS) {
    return;
  }

  const force = (1 - distance / REPEL_RADIUS) * REPEL_STRENGTH;

  sprite.vx += (dx / distance) * force * frameScale * 16;
  sprite.vy += (dy / distance) * force * frameScale * 16;

  const clamped = clampHerdVelocity(sprite.vx, sprite.vy);
  sprite.vx = clamped.vx;
  sprite.vy = clamped.vy;
}

export function pickSwatterVictims(sprites, clickX, clickY) {
  const killCount =
    SWATT_KILL_MIN +
    Math.floor(Math.random() * (SWATT_KILL_MAX - SWATT_KILL_MIN + 1));

  return sprites
    .filter(function (sprite) {
      return !sprite.swatterImmune;
    })
    .map(function (sprite) {
      const centerX = sprite.x + sprite.width / 2;
      const centerY = sprite.y + sprite.height / 2;

      return {
        id: sprite.id,
        distance: Math.hypot(centerX - clickX, centerY - clickY),
      };
    })
    .filter(function (entry) {
      return entry.distance <= SWATT_RADIUS;
    })
    .sort(function (a, b) {
      return a.distance - b.distance;
    })
    .slice(0, killCount)
    .map(function (entry) {
      return entry.id;
    });
}

export function canSpawnCloneNow(now, sprite, lastGlobalCloneAt, spriteCount) {
  if (spriteCount >= WIKI_IMAGE_CLONE_MAX) {
    return false;
  }

  if (now - lastGlobalCloneAt < IMAGE_CLONE_PACE_MS) {
    return false;
  }

  if (now - sprite.lastEdgeCloneAt < IMAGE_CLONE_PACE_MS) {
    return false;
  }

  return true;
}
