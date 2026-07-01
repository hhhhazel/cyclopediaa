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
  const [captureAd, setCaptureAd] = useState(null);

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

  function handleDragGif() {
    const refs = buildMemeEditorRefs(overlayRef.current);
    setMemeDragMode(refs, stateRef.current, "gif");
  }

  function handleDragText() {
    const refs = buildMemeEditorRefs(overlayRef.current);
    setMemeDragMode(refs, stateRef.current, "text");
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
              className="site-candy-btn site-candy-btn--blue meme-template-tool-btn is-active"
              aria-pressed="true"
              title="Move GIF — Drag and resize clone characters on the meme canvas."
              onClick={handleDragGif}
            >
              Move GIF
            </button>
            <button
              type="button"
              id="memeTemplateDragText"
              className="site-candy-btn site-candy-btn--blue meme-template-tool-btn"
              aria-pressed="false"
              title="Move text — Drag and scale meme text layers."
              onClick={handleDragText}
            >
              Move text
            </button>
            <button
              type="button"
              id="memeTemplateShuffle"
              className="site-candy-btn site-candy-btn--blue meme-template-tool-btn"
              title="Shuffle — Randomize layout, background, characters, and effects."
              onClick={handleShuffle}
            >
              Shuffle
            </button>
            <button
              type="button"
              id="memeTemplateCapture"
              className="site-candy-btn site-candy-btn--blue meme-template-tool-btn meme-template-tool-btn--camera"
              aria-label="Capture this moment"
              title="Capture — Save a screenshot of the current meme frame."
              onClick={handleCapture}
            >
              <span aria-hidden="true">⌗</span>
            </button>
            <button
              type="button"
              id="memeTemplateClose"
              className="site-candy-btn site-candy-btn--blue meme-template-tool-btn meme-template-tool-btn--close"
              aria-label="Close"
              title="Close — Exit the meme editor."
              onClick={onClose}
            >
              ×
            </button>
          </div>

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

          <div id="memeTemplateEditPanel" className="meme-template-edit-panel" />

          <p className="meme-template-hint">
            Move GIF / Move text (scroll on text to resize) · Enter in box below for
            line breaks · ⌗ captures this frame
          </p>
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
