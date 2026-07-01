import { MEME_LAYOUTS } from "./layouts.js";
import { applyMemeBackground, clearMemeTemplateBg } from "./backgrounds.js";
import { applyMemeCharacterLayer } from "./characterLayer.js";
import { applyMemeFxLayer, resizeMemeTemplateFx, stopMemeTemplateFx } from "./fx.js";
import {
  applyMemeTextLayer,
  syncMemeTicker,
} from "./textLayer.js";

export function createMemeEditorState() {
  return {
    memeLayoutId: "classic",
    memeTemplateFxRaf: null,
    memeTemplateFxMode: null,
    memeGifSrc: "",
    memeSlotTexts: {},
    memeSlotStyles: {},
    memeBgHistory: [],
    memeCharHistory: [],
    memeFxHistory: [],
    memeCharLayoutId: null,
    memeTextCountHistory: [],
    memeWordArtHistory: [],
    memeActiveTextSlots: [],
    memeTextCountId: null,
    memeTextPositions: {},
    memeDragMode: "gif",
    memeBgHistoryLimit: 5,
    memeCharacterDrag: null,
    memeTextDrag: null,
  };
}

export function getMemeLayout(layoutId) {
  return MEME_LAYOUTS.find(function (entry) {
    return entry.id === layoutId;
  });
}

export function pickRandomMemeLayout() {
  return MEME_LAYOUTS[Math.floor(Math.random() * MEME_LAYOUTS.length)];
}

export function setMemeDragMode(refs, state, mode) {
  state.memeDragMode = mode === "text" ? "text" : "gif";

  if (refs.stage) {
    refs.stage.classList.remove("meme-drag-mode-gif", "meme-drag-mode-text");
    refs.stage.classList.add(
      state.memeDragMode === "text" ? "meme-drag-mode-text" : "meme-drag-mode-gif"
    );
  }

  if (refs.dragGifBtn) {
    refs.dragGifBtn.classList.toggle("is-active", state.memeDragMode === "gif");
    refs.dragGifBtn.setAttribute(
      "aria-pressed",
      state.memeDragMode === "gif" ? "true" : "false"
    );
  }

  if (refs.dragTextBtn) {
    refs.dragTextBtn.classList.toggle("is-active", state.memeDragMode === "text");
    refs.dragTextBtn.setAttribute(
      "aria-pressed",
      state.memeDragMode === "text" ? "true" : "false"
    );
  }
}

export function applyMemeLayout(refs, state, layout) {
  if (!layout || !refs.stage) return;

  state.memeLayoutId = layout.id;

  MEME_LAYOUTS.forEach(function (entry) {
    refs.stage.classList.remove("meme-layout-" + entry.id);
  });

  refs.stage.classList.add("meme-layout-" + layout.id);
  applyMemeBackground(refs, state);

  if (refs.channel) refs.channel.textContent = layout.channel;
  if (refs.kicker) refs.kicker.textContent = layout.kicker;

  if (refs.channelWrap) {
    refs.channelWrap.classList.toggle("is-visible", !!layout.channelBar);
  }

  if (refs.tickerWrap) {
    refs.tickerWrap.classList.toggle("is-visible", !!layout.ticker);
    if (!layout.ticker) refs.tickerWrap.textContent = "";
  }

  if (refs.bubbles) {
    refs.bubbles.innerHTML = "";
    refs.bubbles.classList.remove("is-visible");
  }

  applyMemeTextLayer(refs, state);
  applyMemeCharacterLayer(refs, state);
  syncMemeTicker(refs, state, layout);
  applyMemeFxLayer(refs, state);
}

export function openMemeEditor(refs, state, gifSrc) {
  if (!gifSrc) return;

  const base = gifSrc.split("?")[0];
  state.memeGifSrc = base + "?t=" + Date.now();

  applyMemeLayout(refs, state, pickRandomMemeLayout());
  setMemeDragMode(refs, state, "gif");
  resizeMemeTemplateFx(refs);
}

export function shuffleMemeLayout(refs, state) {
  applyMemeLayout(refs, state, pickRandomMemeLayout());
}

export function closeMemeEditor(refs, state) {
  stopMemeTemplateFx(refs, state);
  state.memeGifSrc = "";
  state.memeBgHistory = [];
  state.memeCharHistory = [];
  state.memeFxHistory = [];
  state.memeCharLayoutId = null;
  state.memeTextCountHistory = [];
  state.memeWordArtHistory = [];
  state.memeActiveTextSlots = [];
  state.memeTextCountId = null;
  state.memeTextPositions = {};
  state.memeDragMode = "gif";
  state.memeCharacterDrag = null;
  state.memeTextDrag = null;

  clearMemeTemplateBg(refs);
  if (refs.charsLayer) refs.charsLayer.innerHTML = "";
  if (refs.textLayer) refs.textLayer.innerHTML = "";
  if (refs.editPanel) refs.editPanel.innerHTML = "";
}

export function buildMemeEditorRefs(root) {
  if (!root) return null;

  return {
    overlay: root,
    stage: root.querySelector(".meme-template-stage"),
    fx: root.querySelector(".meme-template-fx"),
    bg: root.querySelector(".meme-template-bg"),
    channel: root.querySelector("#memeTemplateChannel"),
    kicker: root.querySelector("#memeTemplateKicker"),
    channelWrap: root.querySelector("#memeTemplateChannelWrap"),
    tickerWrap: root.querySelector("#memeTemplateTickerWrap"),
    bubbles: root.querySelector("#memeTemplateBubbles"),
    textLayer: root.querySelector("#memeTemplateTextLayer"),
    charsLayer: root.querySelector("#memeTemplateCharsLayer"),
    editPanel: root.querySelector("#memeTemplateEditPanel"),
    rainbowTop: root.querySelector(".meme-template-decor--rainbow-top"),
    rainbowBottom: root.querySelector(".meme-template-decor--rainbow-bottom"),
    dragGifBtn: root.querySelector("#memeTemplateDragGif"),
    dragTextBtn: root.querySelector("#memeTemplateDragText"),
  };
}
