import {
    MEME_CHAR_LAYOUTS,
    MEME_CHAR_LAYOUT_WEIGHTS,
    MEME_CHAR_SCALE_MAX,
    MEME_CHAR_SCALE_MIN,
    MEME_CHAR_WHEEL_ZOOM_IN,
    MEME_CHAR_WHEEL_ZOOM_OUT,
    MEME_POOL_HISTORY_LIMIT,
  } from "./layouts.js";
  import { pickWeightedMemePoolItem } from "./pool.js";
  
  export function applyMemeCharacterTransform(el) {
    if (!el) return;
  
    const scale = parseFloat(el.dataset.memeScale || "1") || 1;
    const flip = el.classList.contains("meme-template-character--flip");
    let transform = "translate(-50%, -50%) scale(" + scale.toFixed(3) + ")";
  
    if (flip) {
      transform += " scaleX(-1)";
    }
  
    el.style.transform = transform;
  }
  
  function getMemeCharDragBounds(el) {
    const scale = parseFloat(el.dataset.memeScale || "1") || 1;
    const wPct = parseFloat(el.style.width) || 50;
    const extra = wPct * scale * 0.52;
  
    return { min: -extra, max: 100 + extra };
  }
  
  export function clampMemeCharPercent(value, el) {
    const bounds = getMemeCharDragBounds(el);
    return Math.max(bounds.min, Math.min(bounds.max, value));
  }
  
  export function renderMemeCharacters(refs, state, specs) {
    if (!refs.charsLayer || !state.memeGifSrc || !specs) return;
  
    refs.charsLayer.innerHTML = "";
  
    function memeCharDepthKey(spec) {
      if (!spec.ghost && !spec.fade) return 10;
      if (spec.ghostLevel === "faint") return 0;
      if (spec.ghostLevel === "mid") return 1;
      if (spec.ghost) return 2;
      if (spec.fade) return (spec.opacity || 1) < 0.55 ? 0 : 1;
  
      return 5;
    }
  
    const sorted = specs.slice().sort(function (a, b) {
      return memeCharDepthKey(a) - memeCharDepthKey(b);
    });
  
    sorted.forEach(function (spec) {
      const wrap = document.createElement("div");
      wrap.className = "meme-template-character";
      wrap.dataset.charId = spec.id;
      wrap.dataset.memeScale = "1";
      wrap.style.width = spec.w + "%";
      wrap.style.left = spec.left + "%";
      wrap.style.top = spec.top + "%";
  
      if (spec.ghost) {
        wrap.classList.add("meme-template-character--ghost");
  
        if (spec.ghostLevel === "faint") {
          wrap.classList.add("meme-template-character--ghost-faint");
          wrap.style.zIndex = "0";
        } else if (spec.ghostLevel === "mid") {
          wrap.classList.add("meme-template-character--ghost-mid");
          wrap.style.zIndex = "1";
        } else {
          wrap.style.zIndex = "0";
        }
      } else if (spec.fade) {
        wrap.classList.add("meme-template-character--fade");
        wrap.style.zIndex = String(Math.round((spec.opacity || 1) * 10));
      } else {
        wrap.style.zIndex = "2";
      }
  
      if (spec.flip) wrap.classList.add("meme-template-character--flip");
      if (spec.blur) wrap.classList.add("meme-template-character--blur");
      if (spec.opacity != null && !spec.ghostLevel) {
        wrap.style.opacity = String(spec.opacity);
      }
  
      const img = document.createElement("img");
      img.src = state.memeGifSrc;
      img.alt = "";
      img.draggable = false;
      img.crossOrigin = "anonymous";
      wrap.appendChild(img);
      refs.charsLayer.appendChild(wrap);
      applyMemeCharacterTransform(wrap);
    });
  }
  
  function pickMemeCharLayout(state) {
    const layoutId = pickWeightedMemePoolItem(
      MEME_CHAR_LAYOUT_WEIGHTS,
      state.memeCharHistory,
      MEME_POOL_HISTORY_LIMIT
    );
    const layout = MEME_CHAR_LAYOUTS.find(function (entry) {
      return entry.id === layoutId;
    });
  
    return layout || MEME_CHAR_LAYOUTS[0];
  }
  
  export function applyMemeCharacterLayer(refs, state) {
    if (!state.memeGifSrc) return;
  
    const layout = pickMemeCharLayout(state);
  
    state.memeCharLayoutId = layout.id;
    renderMemeCharacters(refs, state, layout.specs());
  }
  
  export function setMemeCharacterScale(el, nextScale) {
    if (!el) return;
  
    const scale = Math.max(
      MEME_CHAR_SCALE_MIN,
      Math.min(MEME_CHAR_SCALE_MAX, nextScale)
    );
  
    el.dataset.memeScale = String(scale);
    applyMemeCharacterTransform(el);
    clampMemeCharacterPosition(el);
  }
  
  function clampMemeCharacterPosition(el) {
    if (!el) return;
  
    const left = parseFloat(el.style.left) || 50;
    const top = parseFloat(el.style.top) || 50;
  
    el.style.left = clampMemeCharPercent(left, el) + "%";
    el.style.top = clampMemeCharPercent(top, el) + "%";
  }
  
  export function nudgeMemeCharacterScale(el, direction) {
    const current = parseFloat(el.dataset.memeScale || "1") || 1;
    const factor = direction < 0 ? MEME_CHAR_WHEEL_ZOOM_IN : MEME_CHAR_WHEEL_ZOOM_OUT;
    setMemeCharacterScale(el, current * factor);
  }
  