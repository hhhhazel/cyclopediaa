import {
    MEME_CHAR_WHEEL_ZOOM_IN,
    MEME_CHAR_WHEEL_ZOOM_OUT,
    MEME_TEXT_SCALE_MAX,
    MEME_TEXT_SCALE_MIN,
  } from "./layouts.js";
  import {
    clampMemeCharPercent,
    nudgeMemeCharacterScale,
  } from "./characterLayer.js";
  import {
    applyMemeTextWrapLayout,
    clampMemeTextPercent,
  } from "./textLayer.js";
  
  function nudgeMemeTextScale(wrap, slotId, state, direction) {
    if (!wrap) return;
  
    const current = parseFloat(wrap.dataset.memeTextScale || "1") || 1;
    const factor = direction < 0 ? MEME_CHAR_WHEEL_ZOOM_IN : MEME_CHAR_WHEEL_ZOOM_OUT;
    const next = Math.max(
      MEME_TEXT_SCALE_MIN,
      Math.min(MEME_TEXT_SCALE_MAX, current * factor)
    );
  
    wrap.dataset.memeTextScale = String(next);
    applyMemeTextWrapLayout(wrap, slotId, state);
  }
  
  export function bindMemeEditorDrag(refs, state) {
    if (!refs.charsLayer || !refs.textLayer || !refs.stage) {
      return function () {};
    }
  
    function onCharPointerDown(event) {
      if (state.memeDragMode !== "gif") return;
  
      const target = event.target.closest(".meme-template-character");
      if (!target) return;
  
      state.memeCharacterDrag = {
        el: target,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        originLeft: parseFloat(target.style.left) || 50,
        originTop: parseFloat(target.style.top) || 50,
      };
  
      target.classList.add("is-dragging");
      target.setPointerCapture(event.pointerId);
      event.preventDefault();
    }
  
    function onCharPointerMove(event) {
      if (
        !state.memeCharacterDrag ||
        state.memeCharacterDrag.pointerId !== event.pointerId
      ) {
        return;
      }
  
      const rect = refs.stage.getBoundingClientRect();
      const dx =
        ((event.clientX - state.memeCharacterDrag.startX) / rect.width) * 100;
      const dy =
        ((event.clientY - state.memeCharacterDrag.startY) / rect.height) * 100;
      const el = state.memeCharacterDrag.el;
  
      el.style.left =
        clampMemeCharPercent(state.memeCharacterDrag.originLeft + dx, el) + "%";
      el.style.top =
        clampMemeCharPercent(state.memeCharacterDrag.originTop + dy, el) + "%";
    }
  
    function endCharDrag(event) {
      if (
        !state.memeCharacterDrag ||
        state.memeCharacterDrag.pointerId !== event.pointerId
      ) {
        return;
      }
  
      const el = state.memeCharacterDrag.el;
      state.memeCharacterDrag = null;
      el.classList.remove("is-dragging");
  
      if (el.hasPointerCapture(event.pointerId)) {
        el.releasePointerCapture(event.pointerId);
      }
    }
  
    function onTextPointerDown(event) {
      if (state.memeDragMode !== "text") return;
  
      const target = event.target.closest(".meme-wordart-wrap");
      if (!target) return;
  
      const slotId = target.dataset.memeSlot;
      const pos = state.memeTextPositions[slotId] || { left: 50, top: 50 };
  
      state.memeTextDrag = {
        el: target,
        slotId: slotId,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        originLeft: pos.left,
        originTop: pos.top,
      };
  
      target.classList.add("is-dragging");
      target.setPointerCapture(event.pointerId);
      event.preventDefault();
    }
  
    function onTextPointerMove(event) {
      if (!state.memeTextDrag || state.memeTextDrag.pointerId !== event.pointerId) {
        return;
      }
  
      const rect = refs.stage.getBoundingClientRect();
      const dx = ((event.clientX - state.memeTextDrag.startX) / rect.width) * 100;
      const dy = ((event.clientY - state.memeTextDrag.startY) / rect.height) * 100;
      const left = clampMemeTextPercent(state.memeTextDrag.originLeft + dx);
      const top = clampMemeTextPercent(state.memeTextDrag.originTop + dy);
  
      state.memeTextPositions[state.memeTextDrag.slotId] = { left: left, top: top };
      applyMemeTextWrapLayout(state.memeTextDrag.el, state.memeTextDrag.slotId, state);
    }
  
    function endTextDrag(event) {
      if (!state.memeTextDrag || state.memeTextDrag.pointerId !== event.pointerId) {
        return;
      }
  
      const el = state.memeTextDrag.el;
      state.memeTextDrag = null;
      el.classList.remove("is-dragging");
  
      if (el.hasPointerCapture(event.pointerId)) {
        el.releasePointerCapture(event.pointerId);
      }
    }
  
    function onTextWheel(event) {
      if (state.memeDragMode !== "text") return;
  
      const wrap = event.target.closest(".meme-wordart-wrap");
      if (!wrap) return;
  
      event.preventDefault();
      nudgeMemeTextScale(wrap, wrap.dataset.memeSlot, state, event.deltaY);
      wrap.classList.add("is-scaling");
      window.clearTimeout(wrap._memeTextScaleTimer);
      wrap._memeTextScaleTimer = window.setTimeout(function () {
        wrap.classList.remove("is-scaling");
      }, 180);
    }
  
    function onCharWheel(event) {
      if (state.memeDragMode !== "gif") return;
  
      const target = event.target.closest(".meme-template-character");
      if (!target) return;
  
      event.preventDefault();
      nudgeMemeCharacterScale(target, event.deltaY);
      target.classList.add("is-scaling");
      window.clearTimeout(target._memeScaleTimer);
      target._memeScaleTimer = window.setTimeout(function () {
        target.classList.remove("is-scaling");
      }, 180);
    }
  
    refs.charsLayer.addEventListener("pointerdown", onCharPointerDown);
    refs.charsLayer.addEventListener("pointermove", onCharPointerMove);
    refs.charsLayer.addEventListener("pointerup", endCharDrag);
    refs.charsLayer.addEventListener("pointercancel", endCharDrag);
    refs.charsLayer.addEventListener("wheel", onCharWheel, { passive: false });
  
    refs.textLayer.addEventListener("pointerdown", onTextPointerDown);
    refs.textLayer.addEventListener("pointermove", onTextPointerMove);
    refs.textLayer.addEventListener("pointerup", endTextDrag);
    refs.textLayer.addEventListener("pointercancel", endTextDrag);
    refs.textLayer.addEventListener("wheel", onTextWheel, { passive: false });
  
    return function unbindMemeEditorDrag() {
      refs.charsLayer.removeEventListener("pointerdown", onCharPointerDown);
      refs.charsLayer.removeEventListener("pointermove", onCharPointerMove);
      refs.charsLayer.removeEventListener("pointerup", endCharDrag);
      refs.charsLayer.removeEventListener("pointercancel", endCharDrag);
      refs.charsLayer.removeEventListener("wheel", onCharWheel);
  
      refs.textLayer.removeEventListener("pointerdown", onTextPointerDown);
      refs.textLayer.removeEventListener("pointermove", onTextPointerMove);
      refs.textLayer.removeEventListener("pointerup", endTextDrag);
      refs.textLayer.removeEventListener("pointercancel", endTextDrag);
      refs.textLayer.removeEventListener("wheel", onTextWheel);
  
      state.memeCharacterDrag = null;
      state.memeTextDrag = null;
    };
  }
  