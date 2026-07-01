import {
    CLONE_WORDART_STYLES,
    WORDART_CURVED_STYLES,
    WORDART_STYLE_BASE_TRANSFORM,
  } from "./wordartStyles.js";
  
  export function getWordArtPlainText(el) {
    return el.dataset.wordArtText || el.dataset.cloneText || el.textContent;
  }
  
  export function setWordArtPlainText(el, text) {
    const value = String(text || "").trim();
    el.dataset.wordArtText = value;
    el.dataset.cloneText = value;
  }
  
  export function archifyCloneText(clone, intensity, rainbow) {
    const text = getWordArtPlainText(clone);
    const chars = Array.from(text);
    const mid = (chars.length - 1) / 2;
    const rainbowColors = [
      "#ff2a2a",
      "#ff7a00",
      "#ffe600",
      "#2ecc40",
      "#2f7bff",
      "#9b35ff",
    ];
  
    clone.textContent = "";
  
    chars.forEach(function (ch, index) {
      const span = document.createElement("span");
      span.style.display = "inline-block";
      span.style.transformOrigin = "bottom center";
  
      if (ch === " ") {
        span.textContent = "\u00a0";
        span.style.width = "0.3em";
        clone.appendChild(span);
        return;
      }
  
      span.textContent = ch;
      const angle = (index - mid) * intensity;
      const lift = -Math.pow(Math.abs(index - mid), 1.35) * 1.15;
      span.style.transform =
        "rotate(" + angle + "deg) translateY(" + lift + "px)";
  
      if (rainbow) {
        span.style.color = rainbowColors[index % rainbowColors.length];
        span.style.fontWeight = "900";
      }
  
      clone.appendChild(span);
    });
  }
  
  export function waveifyCloneText(clone, strength) {
    const text = getWordArtPlainText(clone);
    const chars = Array.from(text);
  
    clone.textContent = "";
  
    chars.forEach(function (ch, index) {
      const span = document.createElement("span");
      span.style.display = "inline-block";
      span.style.transformOrigin = "center center";
  
      if (ch === " ") {
        span.textContent = "\u00a0";
        span.style.width = "0.3em";
        clone.appendChild(span);
        return;
      }
  
      span.textContent = ch;
      const y = Math.sin(index * 0.85 * strength) * 4.5 * strength;
      const rot = Math.sin(index * 0.72 * strength) * 14 * strength;
      span.style.transform =
        "translateY(" + y + "px) rotate(" + rot + "deg)";
      clone.appendChild(span);
    });
  }
  
  export function clearWordArtStyle(el) {
    CLONE_WORDART_STYLES.forEach(function (styleName) {
      el.classList.remove(styleName);
    });
  
    if (el.dataset.cloneText) {
      el.textContent = el.dataset.cloneText;
    } else if (el.dataset.wordArtText) {
      el.textContent = el.dataset.wordArtText;
    }
  
    el.style.background = "";
    el.style.color = "";
    el.style.border = "";
    el.style.boxShadow = "";
    el.style.webkitTextStroke = "";
    el.style.webkitTextFillColor = "";
    el.style.backgroundClip = "";
    el.style.fontFamily = "";
    el.style.fontWeight = "";
    el.style.fontStyle = "";
    el.style.letterSpacing = "";
    el.style.transform = "";
    el.style.transformOrigin = "";
    el.style.filter = "";
    el.style.writingMode = "";
    el.style.textOrientation = "";
    el.style.textShadow = "";
  }
  
  function stableCloneMetricRoll(clone, salt) {
    const s = (clone.dataset.cloneText || clone.textContent || "") + "|" + salt;
    let h = 2166136261;
  
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
  
    return h >>> 0;
  }
  
  function applyCloneGlyphStretch(clone, styleName) {
    const roll = stableCloneMetricRoll(clone, styleName);
    const scaleY =
      styleName === "wordart-logos"
        ? 1.08 + (roll % 6) * 0.01
        : 1.04 + (roll % 7) * 0.01;
    const scaleX = 0.99 + (Math.floor(roll / 7) % 3) * 0.01;
    const scale =
      "scale(" + scaleX.toFixed(3) + ", " + scaleY.toFixed(3) + ")";
    const base = WORDART_STYLE_BASE_TRANSFORM[styleName];
  
    if (base) {
      clone.style.transform = base + " " + scale;
      clone.style.transformOrigin =
        styleName === "wordart-taper-left" ? "left center" : "center bottom";
      return;
    }
  
    clone.style.transform = scale;
    clone.style.transformOrigin = "center bottom";
  }
  
  export function pickWordArtStyleName(pool) {
    const styles = Array.isArray(pool) && pool.length ? pool : CLONE_WORDART_STYLES;
    return styles[Math.floor(Math.random() * styles.length)];
  }
  
  export function applyWordArtStyle(el, styleName, pool, options) {
    clearWordArtStyle(el);
  
    if (el.dataset.cloneText || el.dataset.wordArtText) {
      el.textContent = getWordArtPlainText(el);
    } else {
      setWordArtPlainText(el, el.textContent.trim());
    }
  
    if (!styleName) {
      styleName = pickWordArtStyleName(pool);
    }
  
    el.classList.add(styleName);
  
    if (styleName === "wordart-arch-rainbow") {
      archifyCloneText(el, WORDART_CURVED_STYLES[styleName], true);
    } else if (WORDART_CURVED_STYLES[styleName]) {
      archifyCloneText(el, WORDART_CURVED_STYLES[styleName], false);
    } else if (styleName === "wordart-wave") {
      waveifyCloneText(el, 1);
    } else if (styleName === "wordart-flag") {
      waveifyCloneText(el, 1.45);
    }
  
    if (!options || options.stretch !== false) {
      applyCloneGlyphStretch(el, styleName);
    }
  }
  