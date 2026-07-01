import {
    MEME_BG_SCENES,
    MEME_GRAD_KINDS,
    MEME_GRAD_PALETTES,
  } from "./layouts.js";
  
  export function rememberMemeBg(state, entry) {
    state.memeBgHistory.push(entry);
  
    if (state.memeBgHistory.length > state.memeBgHistoryLimit) {
      state.memeBgHistory.shift();
    }
  }
  
  function pickMemeBgFromPool(state, pool) {
    const recentIds = state.memeBgHistory.map(function (e) {
      return e.id;
    });
    let candidates = pool.filter(function (item) {
      return !recentIds.includes(item.id);
    });
  
    if (!candidates.length) {
      candidates = pool.filter(function (item) {
        return item.id !== recentIds[recentIds.length - 1];
      });
    }
  
    if (!candidates.length) {
      candidates = pool.slice();
    }
  
    return candidates[Math.floor(Math.random() * candidates.length)];
  }
  
  function pickMemeBgCategory(state) {
    const recent = state.memeBgHistory.slice(-4);
    const gradCount = recent.filter(function (e) {
      return e.category === "gradient";
    }).length;
    const sceneCount = recent.filter(function (e) {
      return e.category === "scene";
    }).length;
  
    if (gradCount > sceneCount) {
      return Math.random() < 0.78 ? "scene" : "gradient";
    }
  
    if (sceneCount > gradCount) {
      return Math.random() < 0.78 ? "gradient" : "scene";
    }
  
    return Math.random() < 0.5 ? "gradient" : "scene";
  }
  
  function buildMemeGradientCss(colors, kind) {
    const c = colors.slice();
    const angle = Math.floor(Math.random() * 360);
    const cornerX = Math.random() < 0.5 ? "0%" : "100%";
    const cornerY = Math.random() < 0.5 ? "0%" : "100%";
  
    if (kind === "linear-v") {
      return "linear-gradient(180deg, " + c.join(", ") + ")";
    }
  
    if (kind === "linear-h") {
      return "linear-gradient(90deg, " + c.join(", ") + ")";
    }
  
    if (kind === "linear-diag") {
      return "linear-gradient(" + angle + "deg, " + c.join(", ") + ")";
    }
  
    if (kind === "radial-center") {
      return "radial-gradient(circle at 50% 50%, " + c.join(", ") + ")";
    }
  
    if (kind === "radial-corner") {
      return (
        "radial-gradient(circle at " + cornerX + " " + cornerY + ", " + c.join(", ") + ")"
      );
    }
  
    if (kind === "stripe-diag") {
      const stripe =
        "repeating-linear-gradient(" +
        angle +
        "deg, " +
        c[0] +
        " 0 14px, " +
        (c[1] || c[0]) +
        " 14px 28px" +
        (c[2] ? ", " + c[2] + " 28px 42px" : "") +
        ")";
      const wash =
        "linear-gradient(" +
        (angle + 90) +
        "deg, " +
        c[c.length - 1] +
        " 0%, " +
        c[0] +
        " 100%)";
      return stripe + ", " + wash;
    }
  
    if (kind === "stripe-v") {
      const stripe =
        "repeating-linear-gradient(90deg, " +
        c.join(" 0 16px, ") +
        " 0 16px)";
      const wash = "linear-gradient(180deg, " + c.join(", ") + ")";
      return stripe + ", " + wash;
    }
  
    return "linear-gradient(180deg, " + c.join(", ") + ")";
  }
  
  export function clearMemeTemplateBg(refs) {
    if (!refs.bg) return;
  
    refs.bg.className = "meme-template-bg";
    refs.bg.style.background = "";
    refs.bg.style.backgroundImage = "";
  }
  
  function applyMemeGradientBackground(refs, state) {
    const palette = pickMemeBgFromPool(state, MEME_GRAD_PALETTES);
    const kind =
      MEME_GRAD_KINDS[Math.floor(Math.random() * MEME_GRAD_KINDS.length)];
    const entryId = palette.id + ":" + kind;
  
    clearMemeTemplateBg(refs);
    refs.bg.classList.add("meme-template-bg--gradient");
    refs.bg.style.background = buildMemeGradientCss(palette.colors, kind);
    rememberMemeBg(state, { category: "gradient", id: entryId });
  }
  
  function applyMemeSceneBackground(refs, state) {
    const scene = pickMemeBgFromPool(state, MEME_BG_SCENES);
  
    clearMemeTemplateBg(refs);
    refs.bg.classList.add("meme-bg-scene", scene.className);
    rememberMemeBg(state, { category: "scene", id: scene.id });
  }
  
  export function applyMemeBackground(refs, state) {
    if (!refs.bg) return;
  
    if (pickMemeBgCategory(state) === "scene") {
      applyMemeSceneBackground(refs, state);
    } else {
      applyMemeGradientBackground(refs, state);
    }
  }
  