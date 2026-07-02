"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  FLYSWATTER_CURSOR_IDLE,
  FLYSWATTER_CURSOR_SWING,
  FRAME_MS,
  IMAGE_CLONE_PACE_MS,
  SPAWN_IMMUNITY_MS,
  SWING_GIF_MS,
  applySwatterRepel,
  averageVelocity,
  boxesOverlap,
  canSpawnCloneNow,
  clampVelocity,
  inheritVelocity,
  isPointerNearImageCloneControl,
  loadSpriteMetrics,
  pickSwatterVictims,
  placementForEdgeClone,
  randomDownwardVelocity,
  randomWikiImageIndex,
  separateSprites,
  wikiPreviewImagePath,
} from "../../lib/wiki/imageClone";

export default function WikiImageCloneLayer({ cloning, onCountChange }) {
  const [sprites, setSprites] = useState([]);
  const [swatterVisible, setSwatterVisible] = useState(false);
  const [swatterPos, setSwatterPos] = useState({ x: 0, y: 0 });
  const [isSwatterSwing, setIsSwatterSwing] = useState(false);
  const [swatterSwingKey, setSwatterSwingKey] = useState(0);

  const spritesRef = useRef([]);
  const frameRef = useRef(null);
  const cloningRef = useRef(cloning);
  const spriteIdRef = useRef(0);
  const lastGlobalCloneAtRef = useRef(0);
  const lastFrameTimeRef = useRef(0);
  const swingTimeoutRef = useRef(null);
  const mouseRef = useRef({
    x: 0,
    y: 0,
    active: false,
  });

  function ensureImmuneSource(sprites) {
    if (!sprites.length) {
      return sprites;
    }

    if (
      sprites.some(function (sprite) {
        return sprite.swatterImmune;
      })
    ) {
      return sprites;
    }

    let keeperIndex = 0;
    let oldestSpawn = sprites[0].spawnedAt || 0;

    sprites.forEach(function (sprite, index) {
      const spawnedAt = sprite.spawnedAt || 0;

      if (spawnedAt <= oldestSpawn) {
        oldestSpawn = spawnedAt;
        keeperIndex = index;
      }
    });

    return sprites.map(function (sprite, index) {
      if (index !== keeperIndex) {
        return sprite;
      }

      return { ...sprite, swatterImmune: true };
    });
  }

  function syncSprites(nextSprites, notifyCount) {
    const previousCount = spritesRef.current.length;
    const sprites = ensureImmuneSource(nextSprites);
    spritesRef.current = sprites;
    setSprites(sprites);
    refreshFlyswatterUi(
      sprites.length > 0,
      cloningRef.current,
      mouseRef.current.x,
      mouseRef.current.y
    );

    const countChanged = sprites.length !== previousCount;

    if (
      typeof onCountChange === "function" &&
      (notifyCount !== false || countChanged)
    ) {
      onCountChange(sprites.length);
    }
  }

  function buildClone(source, x, y, velocity, now) {
    return {
      id: "wiki-image-clone-" + spriteIdRef.current++,
      src: source.src,
      width: source.width,
      height: source.height,
      x: x,
      y: y,
      vx: velocity.vx,
      vy: velocity.vy,
      opacity: 1,
      lastEdgeCloneAt: 0,
      spawnedAt: now,
    };
  }

  async function createSprite(options) {
    const metrics = await loadSpriteMetrics(options.src);
    const viewportWidth = window.innerWidth;
    const velocity =
      options.velocity || inheritVelocity({ vx: 0, vy: 1.35 });
    const now = performance.now();

    return {
      id: "wiki-image-clone-" + spriteIdRef.current++,
      src: metrics.src,
      width: metrics.width,
      height: metrics.height,
      x:
        options.x ??
        Math.random() * Math.max(viewportWidth - metrics.width, 0),
      y: options.y ?? 0,
      vx: velocity.vx,
      vy: velocity.vy,
      opacity: 1,
      lastEdgeCloneAt: 0,
      spawnedAt: now,
      swatterImmune: Boolean(options.swatterImmune),
    };
  }

  async function spawnSeedSprite() {
    const sprite = await createSprite({
      src: wikiPreviewImagePath(randomWikiImageIndex()),
      y: 0,
      velocity: randomDownwardVelocity(),
      swatterImmune: true,
    });

    sprite.x =
      Math.random() * Math.max(window.innerWidth - sprite.width, 0);

    return sprite;
  }

  function trySpawnOneClone(nextSprites, now, buildSpawn) {
    if (now - lastGlobalCloneAtRef.current < IMAGE_CLONE_PACE_MS) {
      return nextSprites;
    }

    const spawn = buildSpawn();

    if (!spawn) {
      return nextSprites;
    }

    lastGlobalCloneAtRef.current = now;
    spawn.source.lastEdgeCloneAt = now;

    return nextSprites.concat(
      buildClone(
        spawn.source,
        spawn.x,
        spawn.y,
        spawn.velocity,
        now
      )
    );
  }

  function removeSpritesNearSwatter(clickX, clickY) {
    const removeIds = new Set(
      pickSwatterVictims(spritesRef.current, clickX, clickY)
    );

    if (!removeIds.size) {
      return;
    }

    syncSprites(
      spritesRef.current.filter(function (sprite) {
        return !removeIds.has(sprite.id);
      })
    );
  }

  function playSwatterSwing(clickX, clickY) {
    setIsSwatterSwing(true);
    setSwatterSwingKey(function (value) {
      return value + 1;
    });
    removeSpritesNearSwatter(clickX, clickY);

    if (swingTimeoutRef.current) {
      window.clearTimeout(swingTimeoutRef.current);
    }

    swingTimeoutRef.current = window.setTimeout(function () {
      setIsSwatterSwing(false);
      swingTimeoutRef.current = null;
    }, SWING_GIF_MS);
  }

  function refreshFlyswatterUi(hasSprites, isCloning, pointerX, pointerY) {
    const sessionActive = isCloning || hasSprites;
    const nearControl = isPointerNearImageCloneControl(pointerX, pointerY);
    const showFlyswatter = sessionActive && !nearControl;

    setSwatterVisible(showFlyswatter);
    document.body.classList.toggle("wiki-flyswatter-active", showFlyswatter);

    if (showFlyswatter) {
      setSwatterPos({ x: pointerX, y: pointerY });
    }
  }

  function stepSprites(frameScale) {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const now = performance.now();
    const isCloning = cloningRef.current;
    const mouse = mouseRef.current;
    const nearControl = isPointerNearImageCloneControl(mouse.x, mouse.y);
    const flyswatterMode =
      (isCloning || spritesRef.current.length > 0) &&
      !nearControl &&
      mouse.active;

    let nextSprites = spritesRef.current.map(function (sprite) {
      return { ...sprite };
    });
    let edgeSpawnCandidate = null;

    nextSprites.forEach(function (sprite) {
      if (flyswatterMode && !sprite.swatterImmune) {
        applySwatterRepel(sprite, frameScale, mouse.x, mouse.y);
      }

      sprite.x += sprite.vx * frameScale;
      sprite.y += sprite.vy * frameScale;

      if (sprite.x <= 0) {
        sprite.x = 0;
        sprite.vx = Math.abs(sprite.vx);

        if (
          isCloning &&
          !edgeSpawnCandidate &&
          canSpawnCloneNow(
            now,
            sprite,
            lastGlobalCloneAtRef.current,
            nextSprites.length
          )
        ) {
          edgeSpawnCandidate = { source: sprite, edge: "left" };
        }
      } else if (sprite.x + sprite.width >= viewportWidth) {
        sprite.x = viewportWidth - sprite.width;
        sprite.vx = -Math.abs(sprite.vx);

        if (
          isCloning &&
          !edgeSpawnCandidate &&
          canSpawnCloneNow(
            now,
            sprite,
            lastGlobalCloneAtRef.current,
            nextSprites.length
          )
        ) {
          edgeSpawnCandidate = { source: sprite, edge: "right" };
        }
      }

      if (sprite.y + sprite.height >= viewportHeight) {
        sprite.y = viewportHeight - sprite.height;
        sprite.vy = -Math.abs(sprite.vy);

        if (
          isCloning &&
          !edgeSpawnCandidate &&
          canSpawnCloneNow(
            now,
            sprite,
            lastGlobalCloneAtRef.current,
            nextSprites.length
          )
        ) {
          edgeSpawnCandidate = { source: sprite, edge: "bottom" };
        }
      } else if (sprite.y <= 0) {
        sprite.y = 0;
        sprite.vy = Math.abs(sprite.vy);
      }
    });

    for (let i = 0; i < nextSprites.length; i += 1) {
      for (let j = i + 1; j < nextSprites.length; j += 1) {
        if (boxesOverlap(nextSprites[i], nextSprites[j])) {
          separateSprites(nextSprites[i], nextSprites[j]);
        }
      }
    }

    if (isCloning && edgeSpawnCandidate) {
      const candidate = edgeSpawnCandidate;
      const placement = placementForEdgeClone(
        candidate.source,
        candidate.edge,
        viewportWidth,
        viewportHeight
      );

      nextSprites = trySpawnOneClone(nextSprites, now, function () {
        return {
          source: candidate.source,
          x: placement.x,
          y: placement.y,
          velocity: placement.velocity,
        };
      });
    } else if (
      isCloning &&
      now - lastGlobalCloneAtRef.current >= IMAGE_CLONE_PACE_MS
    ) {
      for (let i = 0; i < nextSprites.length; i += 1) {
        let spawned = false;

        for (let j = i + 1; j < nextSprites.length; j += 1) {
          const a = nextSprites[i];
          const b = nextSprites[j];

          if (now - a.spawnedAt < SPAWN_IMMUNITY_MS) {
            continue;
          }

          if (now - b.spawnedAt < SPAWN_IMMUNITY_MS) {
            continue;
          }

          if (!boxesOverlap(a, b)) {
            continue;
          }

          nextSprites = trySpawnOneClone(nextSprites, now, function () {
            return {
              source: a,
              x: Math.min(
                viewportWidth - a.width,
                Math.max(0, (a.x + b.x) / 2)
              ),
              y: Math.min(
                viewportHeight - a.height,
                Math.max(0, (a.y + b.y) / 2)
              ),
              velocity: averageVelocity(a, b),
            };
          });

          spawned = true;
          break;
        }

        if (spawned) {
          break;
        }
      }
    }

    syncSprites(nextSprites, false);
  }

  function tick(now) {
    const hasSprites = spritesRef.current.length > 0;

    if (!cloningRef.current && !hasSprites) {
      stopLoop();
      return;
    }

    const previousTime = lastFrameTimeRef.current || now;
    const delta = Math.min(now - previousTime, 48);
    lastFrameTimeRef.current = now;

    stepSprites(delta / FRAME_MS);
    frameRef.current = window.requestAnimationFrame(tick);
  }

  function startLoop() {
    if (frameRef.current) {
      return;
    }

    lastFrameTimeRef.current = 0;
    frameRef.current = window.requestAnimationFrame(tick);
  }

  function stopLoop() {
    if (frameRef.current) {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    lastFrameTimeRef.current = 0;
  }

  useEffect(function () {
    [FLYSWATTER_CURSOR_IDLE, FLYSWATTER_CURSOR_SWING].forEach(function (src) {
      const img = new Image();
      img.src = src;
    });
  }, []);

  useEffect(function () {
    function handlePointerMove(event) {
      const mouse = mouseRef.current;

      mouse.x = event.clientX;
      mouse.y = event.clientY;
      mouse.active = true;

      refreshFlyswatterUi(
        spritesRef.current.length > 0,
        cloningRef.current,
        event.clientX,
        event.clientY
      );
    }

    function handlePointerDown(event) {
      if (
        event.target.closest(
          "#wiki-image-clone-toggle, .wiki-appearance-btn"
        )
      ) {
        return;
      }

      if (isPointerNearImageCloneControl(event.clientX, event.clientY)) {
        return;
      }

      if (!cloningRef.current && spritesRef.current.length === 0) {
        return;
      }

      setSwatterPos({ x: event.clientX, y: event.clientY });
      playSwatterSwing(event.clientX, event.clientY);
    }

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerdown", handlePointerDown);

    return function () {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerdown", handlePointerDown);
      document.body.classList.remove("wiki-flyswatter-active");

      if (swingTimeoutRef.current) {
        window.clearTimeout(swingTimeoutRef.current);
        swingTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(
    function () {
      cloningRef.current = cloning;

      refreshFlyswatterUi(
        spritesRef.current.length > 0,
        cloning,
        mouseRef.current.x,
        mouseRef.current.y
      );

      if (cloning && spritesRef.current.length === 0) {
        let cancelled = false;

        spawnSeedSprite()
          .then(function (seed) {
            if (cancelled) {
              return;
            }

            syncSprites([seed]);
            startLoop();
          })
          .catch(function () {
            if (!cancelled) {
              startLoop();
            }
          });

        return function () {
          cancelled = true;
        };
      }

      if (cloning || spritesRef.current.length > 0) {
        startLoop();
      }

      return undefined;
    },
    [cloning]
  );

  useEffect(function () {
    return function () {
      stopLoop();
      document.body.classList.remove("wiki-flyswatter-active");
    };
  }, []);

  return (
    <>
      {sprites.length > 0 ? (
        <div className="wiki-image-clone-layer" aria-hidden="true">
          {sprites.map(function (sprite) {
            return (
              <div
                key={sprite.id}
                className="wiki-image-clone"
                style={{
                  left: sprite.x + "px",
                  top: sprite.y + "px",
                  width: sprite.width + "px",
                  height: sprite.height + "px",
                  opacity: sprite.opacity ?? 1,
                }}
              >
                <img src={sprite.src} alt="" draggable={false} />
              </div>
            );
          })}
        </div>
      ) : null}
      {swatterVisible && typeof document !== "undefined"
        ? createPortal(
            <img
              key={isSwatterSwing ? "swing-" + swatterSwingKey : "idle"}
              className={
                "wiki-flyswatter-cursor" +
                (isSwatterSwing ? " wiki-flyswatter-cursor--swing" : "")
              }
              src={
                isSwatterSwing
                  ? FLYSWATTER_CURSOR_SWING
                  : FLYSWATTER_CURSOR_IDLE
              }
              style={{
                left: swatterPos.x + "px",
                top: swatterPos.y + "px",
              }}
              alt=""
              draggable={false}
            />,
            document.body
          )
        : null}
    </>
  );
}
