"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  HAND_CURSOR_SRC,
  RUNNER_CURSOR_SRC,
  computeRunnerRotation,
  isFinePointerDevice,
  isFlyswatterActive,
  isNearClickableTarget,
} from "../../lib/cursor/siteCursor";

const BODY_ACTIVE_CLASS = "site-custom-cursor-active";

export default function SiteCursor() {
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState("runner");
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);

  const cursorRef = useRef(null);
  const lastPositionRef = useRef(null);
  const rotationRef = useRef(0);
  const rafRef = useRef(null);
  const pendingPointRef = useRef(null);

  useEffect(function () {
    setEnabled(isFinePointerDevice());
  }, []);

  useEffect(
    function () {
      if (!enabled) {
        return undefined;
      }

      function setBodyActive(active) {
        document.body.classList.toggle(BODY_ACTIVE_CLASS, active);
      }

      function applyPointer(clientX, clientY) {
        if (isFlyswatterActive()) {
          setVisible(false);
          setBodyActive(false);
          return;
        }

        const cursorRoot = cursorRef.current;
        const useHand = isNearClickableTarget(clientX, clientY, cursorRoot);
        const nextMode = useHand ? "hand" : "runner";

        if (nextMode === "runner") {
          const nextRotation = computeRunnerRotation(
            lastPositionRef.current?.x ?? null,
            lastPositionRef.current?.y ?? null,
            clientX,
            clientY,
            rotationRef.current
          );

          rotationRef.current = nextRotation;
          setRotation(nextRotation);
        }

        lastPositionRef.current = { x: clientX, y: clientY };
        setMode(nextMode);
        setPosition({ x: clientX, y: clientY });
        setVisible(true);
        setBodyActive(true);
      }

      function flushPointer() {
        rafRef.current = null;

        const point = pendingPointRef.current;

        if (!point) {
          return;
        }

        applyPointer(point.x, point.y);
      }

      function queuePointer(clientX, clientY) {
        pendingPointRef.current = { x: clientX, y: clientY };

        if (rafRef.current) {
          return;
        }

        rafRef.current = window.requestAnimationFrame(flushPointer);
      }

      function handlePointerMove(event) {
        queuePointer(event.clientX, event.clientY);
      }

      function handlePointerLeave() {
        pendingPointRef.current = null;
        lastPositionRef.current = null;
        rotationRef.current = 0;
        setVisible(false);
        setBodyActive(false);
        setRotation(0);
      }

      function handlePointerEnter(event) {
        queuePointer(event.clientX, event.clientY);
      }

      [RUNNER_CURSOR_SRC, HAND_CURSOR_SRC].forEach(function (src) {
        const img = new Image();
        img.src = src;
      });

      window.addEventListener("pointermove", handlePointerMove, { passive: true });
      window.addEventListener("pointerleave", handlePointerLeave);
      window.addEventListener("pointerenter", handlePointerEnter);

      return function () {
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerleave", handlePointerLeave);
        window.removeEventListener("pointerenter", handlePointerEnter);

        if (rafRef.current) {
          window.cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }

        setBodyActive(false);
      };
    },
    [enabled]
  );

  if (!enabled || !visible || typeof document === "undefined") {
    return null;
  }

  const className =
    mode === "hand"
      ? "custom-cursor--hand"
      : "custom-cursor--runner";

  return createPortal(
    <img
      ref={cursorRef}
      id="customCursor"
      className={className}
      src={mode === "hand" ? HAND_CURSOR_SRC : RUNNER_CURSOR_SRC}
      style={{
        left: position.x + "px",
        top: position.y + "px",
        display: "block",
        ...(mode === "runner"
          ? { "--cursor-rotate": rotation + "deg" }
          : { "--cursor-rotate": "0deg" }),
      }}
      alt=""
      draggable={false}
    />,
    document.body
  );
}
