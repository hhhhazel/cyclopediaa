import html2canvas from "html2canvas";

function waitAnimationFrames(count) {
  return new Promise(function (resolve) {
    let remaining = count;

    function step() {
      remaining -= 1;

      if (remaining <= 0) {
        resolve();
        return;
      }

      requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  });
}

function getMemeStageRelativeRect(el, stageRect) {
  const rect = el.getBoundingClientRect();

  return {
    x: rect.left - stageRect.left,
    y: rect.top - stageRect.top,
    width: rect.width,
    height: rect.height,
  };
}

async function rasterizeMemeBackgroundLayer(el, scale) {
  return html2canvas(el, {
    backgroundColor: null,
    scale: scale,
    logging: false,
    useCORS: true,
    width: el.offsetWidth,
    height: el.offsetHeight,
  });
}

async function rasterizeMemeTextLayer(el, scale) {
  return html2canvas(el, {
    backgroundColor: null,
    scale: scale,
    logging: false,
    useCORS: true,
    width: el.offsetWidth,
    height: el.offsetHeight,
  });
}

function drawMemeRainbowBars(ctx, width, height) {
  const barH = Math.max(6, Math.round(height * 0.014));
  const gradient = ctx.createLinearGradient(0, 0, width, 0);

  gradient.addColorStop(0, "#ff0000");
  gradient.addColorStop(0.16, "#ff7f00");
  gradient.addColorStop(0.33, "#ffff00");
  gradient.addColorStop(0.5, "#00c878");
  gradient.addColorStop(0.66, "#0078ff");
  gradient.addColorStop(0.83, "#4b0082");
  gradient.addColorStop(1, "#9400d3");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, barH);
  ctx.fillRect(0, height - barH, width, barH);
}

function drawMemeFxLayer(ctx, refs, state, width, height) {
  if (state.memeTemplateFxMode === "rainbow-bars") {
    drawMemeRainbowBars(ctx, width, height);
    return;
  }

  if (!refs.fx || !refs.fx.width) return;

  ctx.drawImage(refs.fx, 0, 0, width, height);
}

function drawMemeCharacterLayer(ctx, stage, stageRect, dpr) {
  const characters = Array.from(
    stage.querySelectorAll(".meme-template-character")
  ).sort(function (a, b) {
    return (
      (parseInt(getComputedStyle(a).zIndex, 10) || 0) -
      (parseInt(getComputedStyle(b).zIndex, 10) || 0)
    );
  });

  characters.forEach(function (wrap) {
    const img = wrap.querySelector("img");

    if (!img || !img.complete || !img.naturalWidth) return;

    const rect = getMemeStageRelativeRect(wrap, stageRect);

    if (rect.width <= 0 || rect.height <= 0) return;

    const x = rect.x * dpr;
    const y = rect.y * dpr;
    const w = rect.width * dpr;
    const h = rect.height * dpr;

    ctx.save();

    const opacity = parseFloat(getComputedStyle(wrap).opacity) || 1;
    ctx.globalAlpha = opacity;

    const filter = getComputedStyle(wrap).filter;

    if (filter && filter !== "none") {
      ctx.filter = filter;
    }

    if (wrap.classList.contains("meme-template-character--flip")) {
      ctx.translate(x + w, y);
      ctx.scale(-1, 1);
      ctx.drawImage(img, 0, 0, w, h);
    } else {
      ctx.drawImage(img, x, y, w, h);
    }

    ctx.restore();
  });
}

async function drawMemeTextLayers(ctx, stage, stageRect, dpr) {
  const wraps = stage.querySelectorAll(".meme-wordart-wrap");

  for (let i = 0; i < wraps.length; i++) {
    const el = wraps[i];
    const pos = getMemeStageRelativeRect(el, stageRect);

    if (pos.width <= 0 || pos.height <= 0) continue;

    const layerCanvas = await rasterizeMemeTextLayer(el, dpr);

    ctx.drawImage(
      layerCanvas,
      0,
      0,
      layerCanvas.width,
      layerCanvas.height,
      pos.x * dpr,
      pos.y * dpr,
      pos.width * dpr,
      pos.height * dpr
    );
  }
}

export async function composeMemeStageScreenshot(refs, state) {
  if (!refs.stage) return null;

  const stage = refs.stage;
  const width = stage.clientWidth;
  const height = stage.clientHeight;

  if (width <= 0 || height <= 0) return null;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const stageRect = stage.getBoundingClientRect();
  const outWidth = Math.round(width * dpr);
  const outHeight = Math.round(height * dpr);

  await document.fonts.ready.catch(function () {});
  await waitAnimationFrames(2);

  const out = document.createElement("canvas");
  out.width = outWidth;
  out.height = outHeight;
  const ctx = out.getContext("2d");

  if (refs.bg) {
    try {
      const bgCanvas = await rasterizeMemeBackgroundLayer(refs.bg, dpr);
      ctx.drawImage(bgCanvas, 0, 0, outWidth, outHeight);
    } catch (error) {
      console.warn("Meme background layer failed:", error);
      ctx.fillStyle = getComputedStyle(refs.bg).backgroundColor || "#e8e8ee";
      ctx.fillRect(0, 0, outWidth, outHeight);
    }
  } else {
    ctx.fillStyle = "#e8e8ee";
    ctx.fillRect(0, 0, outWidth, outHeight);
  }

  drawMemeFxLayer(ctx, refs, state, outWidth, outHeight);
  drawMemeCharacterLayer(ctx, stage, stageRect, dpr);
  await drawMemeTextLayers(ctx, stage, stageRect, dpr);

  return out;
}

export async function captureMemeTemplateScreenshot(refs, state) {
  const canvas = await composeMemeStageScreenshot(refs, state);

  if (!canvas) {
    throw new Error("Could not capture this frame.");
  }

  return new Promise(function (resolve, reject) {
    canvas.toBlob(function (blob) {
      if (!blob) {
        reject(new Error("Could not create capture blob."));
        return;
      }

      resolve(blob);
    }, "image/png");
  });
}
