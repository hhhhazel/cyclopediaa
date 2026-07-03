"use client";

import { useEffect, useRef, useState } from "react";
import { captureMemeTemplateScreenshot } from "../../../lib/meme/capture.js";
import { bindMemeEditorDrag } from "../../../lib/meme/drag.js";
import {
  buildMemeEditorRefs,
  closeMemeEditor,
  createMemeEditorState,
  openMemeEditor,
  setMemeDragMode,
  shuffleMemeLayout,
} from "../../../lib/meme/editorController.js";
import { resizeMemeTemplateFx } from "../../../lib/meme/fx.js";
import { getMemeCaptureCaptionText } from "../../../lib/meme/textLayer.js";
import MemeCaptureAd from "./MemeCaptureAd.js";
import "./meme-editor.css";

export default function MemeEditor({ gifSrc, onClose, onUploadSuccess }) {
  const overlayRef = useRef(null);
  const stateRef = useRef(null);
  const captureAdOpenRef = useRef(false);
  const zoomHintTimerRef = useRef(null);
  const [captureAd, setCaptureAd] = useState(null);
  const [showZoomHint, setShowZoomHint] = useState(false);

  if (!stateRef.current) {
    stateRef.current = createMemeEditorState();
  }

  captureAdOpenRef.current = !!captureAd;

  useEffect(
    function () {
      const root = overlayRef.current;
      if (!root || !gifSrc) return;

      const refs = buildMemeEditorRefs(root);
      const state = stateRef.current;

      openMemeEditor(refs, state, gifSrc);
      const unbindDrag = bindMemeEditorDrag(refs, state);

      function handleResize() {
        resizeMemeTemplateFx(refs);
      }

      function handleKeyDown(event) {
        if (event.key === "Escape" && !captureAdOpenRef.current && onClose) {
          onClose();
        }
      }

      window.addEventListener("resize", handleResize);
      window.addEventListener("keydown", handleKeyDown);

      return function () {
        window.removeEventListener("resize", handleResize);
        window.removeEventListener("keydown", handleKeyDown);
        unbindDrag();
        closeMemeEditor(refs, state);
      };
    },
    [gifSrc, onClose]
  );

  function handleShuffle() {
    const refs = buildMemeEditorRefs(overlayRef.current);
    shuffleMemeLayout(refs, stateRef.current);
  }

  function showMoveZoomHint() {
    if (zoomHintTimerRef.current) {
      clearTimeout(zoomHintTimerRef.current);
    }

    setShowZoomHint(true);

    zoomHintTimerRef.current = setTimeout(function () {
      setShowZoomHint(false);
      zoomHintTimerRef.current = null;
    }, 5000);
  }

  useEffect(function () {
    return function () {
      if (zoomHintTimerRef.current) {
        clearTimeout(zoomHintTimerRef.current);
      }
    };
  }, []);

  function handleDragGif() {
    const refs = buildMemeEditorRefs(overlayRef.current);
    setMemeDragMode(refs, stateRef.current, "gif");
    showMoveZoomHint();
  }

  function handleDragText() {
    const refs = buildMemeEditorRefs(overlayRef.current);
    setMemeDragMode(refs, stateRef.current, "text");
    showMoveZoomHint();
  }

  async function handleCapture() {
    const refs = buildMemeEditorRefs(overlayRef.current);

    try {
      const blob = await captureMemeTemplateScreenshot(refs, stateRef.current);
      setCaptureAd({
        blob: blob,
        caption: getMemeCaptureCaptionText(stateRef.current),
      });
    } catch (error) {
      console.warn("Meme capture failed:", error);
      window.alert("Could not capture this frame. Try again.");
    }
  }

  function handleOverlayClick(event) {
    if (event.target === overlayRef.current && onClose && !captureAd) {
      onClose();
    }
  }

  return (
    <>
      <div
        ref={overlayRef}
        className="meme-template-overlay"
        aria-hidden="false"
        onClick={handleOverlayClick}
      >
        <div className="meme-template-shell">
          <div className="meme-template-toolbar">
            <button
              type="button"
              id="memeTemplateDragGif"
              className="meme-template-tool-btn site-ui-glow is-active"
              aria-pressed="true"
              title="Click to move Cyberclone"
              onClick={handleDragGif}
            >
              Click to move Cyberclone
            </button>
            <button
              type="button"
              id="memeTemplateDragText"
              className="meme-template-tool-btn site-ui-glow"
              aria-pressed="false"
              title="Click to move text"
              onClick={handleDragText}
            >
              Click to move text
            </button>
            <button
              type="button"
              id="memeTemplateShuffle"
              className="meme-template-tool-btn site-ui-glow"
              title="Random changes"
              onClick={handleShuffle}
            >
              Random changes
            </button>
            <button
              type="button"
              id="memeTemplateCapture"
              className="meme-template-tool-btn meme-template-tool-btn--photo site-ui-glow"
              title="Capture this frame"
              onClick={handleCapture}
            >
              Photo
            </button>
          </div>

          <div className="meme-template-stage-wrap">
            <button
              type="button"
              className="meme-template-stage-close"
              aria-label="Close meme editor"
              onClick={onClose}
            >
              ×
            </button>
            {showZoomHint ? (
              <div className="meme-template-zoom-hint" role="status" aria-live="polite">
                <p>
                  Try the mouse wheel to zoom in / out
                  <span className="meme-template-zoom-hint-sub">
                    Drag to move · scroll to resize
                  </span>
                </p>
              </div>
            ) : null}
            <div
              id="memeTemplateStage"
              className="meme-template-stage meme-layout-classic meme-drag-mode-gif"
              role="img"
              aria-label="Meme template"
            >
            <canvas
              id="memeTemplateFx"
              className="meme-template-fx"
              aria-hidden="true"
            />
            <div
              id="memeTemplateBg"
              className="meme-template-bg"
              aria-hidden="true"
            />
            <div
              className="meme-template-decor meme-template-decor--rainbow-top"
              aria-hidden="true"
            />
            <div
              className="meme-template-decor meme-template-decor--rainbow-bottom"
              aria-hidden="true"
            />
            <div
              className="meme-template-decor meme-template-decor--scanlines"
              aria-hidden="true"
            />
            <div
              className="meme-template-decor meme-template-decor--channel"
              id="memeTemplateChannelWrap"
              aria-hidden="true"
            >
              <span id="memeTemplateChannel">CYBERCLONE CHANNEL</span>
              <span id="memeTemplateKicker">MEME EXPOSURE FORECAST</span>
            </div>
            <div
              className="meme-template-decor meme-template-decor--ticker"
              id="memeTemplateTickerWrap"
              aria-hidden="true"
            />
            <div
              className="meme-template-bubbles"
              id="memeTemplateBubbles"
              aria-hidden="true"
            />
            <div id="memeTemplateTextLayer" className="meme-template-text-layer" />
            <div id="memeTemplateCharsLayer" className="meme-template-chars-layer" />
            </div>
          </div>

          <div id="memeTemplateEditPanel" className="meme-template-edit-panel" />
        </div>
      </div>

      {captureAd ? (
        <MemeCaptureAd
          blob={captureAd.blob}
          caption={captureAd.caption}
          source="meme"
          onClose={function () {
            setCaptureAd(null);
          }}
          onUploadSuccess={function () {
            setCaptureAd(null);
            onUploadSuccess?.();
          }}
        />
      ) : null}
    </>
  );
}
