"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  RUNNER_CURSOR_SRC,
  computeRunnerRotation,
  isFinePointerDevice,
  isFlyswatterActive,
} from "../../lib/cursor/siteCursor";

const BODY_ACTIVE_CLASS = "site-custom-cursor-active";

export default function SiteCursor() {
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);

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

        const nextRotation = computeRunnerRotation(
          lastPositionRef.current?.x ?? null,
          lastPositionRef.current?.y ?? null,
          clientX,
          clientY,
          rotationRef.current
        );

        rotationRef.current = nextRotation;
        setRotation(nextRotation);
        lastPositionRef.current = { x: clientX, y: clientY };
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

      const runnerImage = new Image();
      runnerImage.src = RUNNER_CURSOR_SRC;

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

  return createPortal(
    <img
      id="customCursor"
      className="custom-cursor--runner"
      src={RUNNER_CURSOR_SRC}
      style={{
        left: position.x + "px",
        top: position.y + "px",
        display: "block",
        "--cursor-rotate": rotation + "deg",
      }}
      alt=""
      draggable={false}
    />,
    document.body
  );
}
