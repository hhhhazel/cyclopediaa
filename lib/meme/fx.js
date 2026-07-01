import { pickMemePoolItem } from "./pool.js";
import { MEME_FX_MODES, MEME_POOL_HISTORY_LIMIT } from "./layouts.js";

export function syncMemeRainbowBarsDecor(refs, mode) {
  const show = mode === "rainbow-bars";

  if (refs.rainbowTop) {
    refs.rainbowTop.classList.toggle("is-visible", show);
  }

  if (refs.rainbowBottom) {
    refs.rainbowBottom.classList.toggle("is-visible", show);
  }
}

export function stopMemeTemplateFx(refs, state) {
  state.memeTemplateFxMode = null;
  syncMemeRainbowBarsDecor(refs, null);

  if (state.memeTemplateFxRaf) {
    window.cancelAnimationFrame(state.memeTemplateFxRaf);
    state.memeTemplateFxRaf = null;
  }

  if (refs.fx) {
    const ctx = refs.fx.getContext("2d");
    ctx.clearRect(0, 0, refs.fx.width, refs.fx.height);
  }
}

export function resizeMemeTemplateFx(refs) {
  if (!refs.fx || !refs.stage) return;

  const rect = refs.stage.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  refs.fx.width = Math.floor(rect.width * dpr);
  refs.fx.height = Math.floor(rect.height * dpr);
  refs.fx.style.width = rect.width + "px";
  refs.fx.style.height = rect.height + "px";

  const ctx = refs.fx.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function drawMemeAsteriskStar(ctx, x, y, size, alpha) {
  const rays = [0, 45, 90, 135, 180, 225, 270, 315];

  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255," + alpha + ")";
  ctx.lineWidth = Math.max(0.65, size * 0.15);
  ctx.lineCap = "round";

  rays.forEach(function (deg, index) {
    const rad = (deg * Math.PI) / 180;
    const len = index % 2 === 0 ? size : size * 0.42;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(rad) * len, y + Math.sin(rad) * len);
    ctx.stroke();
  });

  ctx.restore();
}

function drawMemeLightningBolt(ctx, x1, y1, x2, y2, depth, seed) {
  if (depth <= 0) {
    ctx.lineTo(x2, y2);
    return;
  }

  const jitter = function (n) {
    const value = Math.sin(seed + n * 127.1) * 43758.5453;
    return value - Math.floor(value);
  };
  const mx = (x1 + x2) * 0.5 + (jitter(depth) - 0.5) * 42;
  const my = (y1 + y2) * 0.5 + (jitter(depth + 7) - 0.5) * 28;

  drawMemeLightningBolt(ctx, x1, y1, mx, my, depth - 1, seed);
  drawMemeLightningBolt(ctx, mx, my, x2, y2, depth - 1, seed);
}

function drawMemeTemplateFxFrame(refs, state) {
  if (!refs.fx || !state.memeTemplateFxMode) return;

  const ctx = refs.fx.getContext("2d");
  const w = refs.stage.clientWidth;
  const h = refs.stage.clientHeight;
  const t = Date.now();

  ctx.clearRect(0, 0, w, h);

  if (state.memeTemplateFxMode === "fire") {
    const baseY = h * 0.55;
    const fireGrad = ctx.createLinearGradient(0, baseY, 0, h);
    fireGrad.addColorStop(0, "rgba(255,120,0,0)");
    fireGrad.addColorStop(0.35, "rgba(255,80,0,0.55)");
    fireGrad.addColorStop(1, "rgba(120,0,0,0.85)");
    ctx.fillStyle = fireGrad;
    ctx.fillRect(0, baseY, w, h - baseY);

    for (let i = 0; i < 32; i++) {
      const x = (Math.sin(t * 0.002 + i * 1.7) * 0.5 + 0.5) * w;
      const y = h - ((t * 0.09 + i * 28) % (h * 0.55));
      const r = 5 + (i % 6) * 2;
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, r * 3);
      gradient.addColorStop(0, "rgba(255,240,120,0.9)");
      gradient.addColorStop(0.45, "rgba(255,80,0,0.5)");
      gradient.addColorStop(1, "rgba(80,0,0,0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, r * 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "rgba(40,20,10,0.35)";
    ctx.fillRect(0, 0, w, h * 0.22);
  } else if (state.memeTemplateFxMode === "stars") {
    for (let i = 0; i < 110; i++) {
      const seed = i * 9973 + 41;
      const x = (((seed * 13) % 10007) / 10007) * w;
      const y = (((seed * 17) % 10007) / 10007) * h;
      const twinkle =
        0.22 +
        0.58 *
          (0.5 + 0.5 * Math.sin(t * 0.0028 + seed * 0.01 + i * 0.4));
      const arm = 1.8 + (seed % 6) * 1.1;
      const alpha = twinkle * (0.35 + (seed % 9) / 18);

      drawMemeAsteriskStar(ctx, x, y, arm, alpha);
    }
  } else if (state.memeTemplateFxMode === "rainbow") {
    const cx = w * 0.52;
    const cy = h * 1.04;
    const baseR = Math.min(w, h) * 0.92;
    const bands = [
      "rgba(255,0,0,0.42)",
      "rgba(255,127,0,0.4)",
      "rgba(255,255,0,0.38)",
      "rgba(0,200,80,0.36)",
      "rgba(0,120,255,0.38)",
      "rgba(75,0,130,0.36)",
      "rgba(148,0,211,0.34)",
    ];

    ctx.lineCap = "round";
    bands.forEach(function (color, i) {
      ctx.beginPath();
      ctx.arc(cx, cy, baseR - i * 7, Math.PI * 1.04, Math.PI * 1.96);
      ctx.strokeStyle = color;
      ctx.lineWidth = 8;
      ctx.stroke();
    });
  } else if (state.memeTemplateFxMode === "lightning") {
    const cycle = (t * 0.0012) % 6;
    const flash = cycle > 5.2 ? (cycle - 5.2) / 0.8 : 0;

    if (flash > 0) {
      ctx.fillStyle = "rgba(220,230,255," + Math.min(0.55, flash * 0.7) + ")";
      ctx.fillRect(0, 0, w, h);

      const boltX = w * (0.35 + (Math.sin(t * 0.0007) * 0.5 + 0.5) * 0.3);
      const boltSeed = Math.floor(t / 120);

      ctx.strokeStyle = "rgba(255,255,255,0.95)";
      ctx.lineWidth = 2.5;
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(boltX, 0);
      drawMemeLightningBolt(ctx, boltX, 0, boltX + 18, h * 0.42, 5, boltSeed);
      ctx.stroke();

      ctx.strokeStyle = "rgba(180,200,255,0.75)";
      ctx.lineWidth = 6;
      ctx.globalCompositeOperation = "lighter";
      ctx.beginPath();
      ctx.moveTo(boltX, 0);
      drawMemeLightningBolt(ctx, boltX, 0, boltX + 18, h * 0.42, 4, boltSeed + 17);
      ctx.stroke();
      ctx.globalCompositeOperation = "source-over";
    }
  }

  state.memeTemplateFxRaf = window.requestAnimationFrame(function () {
    drawMemeTemplateFxFrame(refs, state);
  });
}

export function startMemeTemplateFx(refs, state, mode) {
  stopMemeTemplateFx(refs, state);
  resizeMemeTemplateFx(refs);

  if (mode) {
    state.memeTemplateFxMode = mode;
    syncMemeRainbowBarsDecor(refs, mode);

    if (mode !== "rainbow-bars") {
      state.memeTemplateFxRaf = window.requestAnimationFrame(function () {
        drawMemeTemplateFxFrame(refs, state);
      });
    }
  }
}

export function applyMemeFxLayer(refs, state) {
  const mode = pickMemePoolItem(
    MEME_FX_MODES,
    state.memeFxHistory,
    MEME_POOL_HISTORY_LIMIT
  );
  startMemeTemplateFx(refs, state, mode.id);
}
