import {
    MEME_FIXED_COPY,
    MEME_POOL_HISTORY_LIMIT,
    MEME_TEXT_COUNTS,
    MEME_TEXT_DEFAULT_POSITIONS,
    MEME_TEXT_SIZE_BY_ROLE,
  } from "./layouts.js";
  import { MEME_WORDART_ITEMS, MEME_WORDART_POOL } from "./wordartStyles.js";
  import { applyWordArtStyle, setWordArtPlainText } from "./wordart.js";
  import { pickMemePoolItem } from "./pool.js";

  const MEME_WORDART_COPY_PROPS = [
    "fontFamily",
    "fontWeight",
    "fontStyle",
    "color",
    "background",
    "backgroundImage",
    "backgroundClip",
    "webkitBackgroundClip",
    "webkitTextFillColor",
    "webkitTextStroke",
    "textShadow",
    "letterSpacing",
    "filter",
    "paintOrder",
    "textDecoration",
    "textDecorationColor",
    "textDecorationThickness",
    "textUnderlineOffset",
    "writingMode",
    "textOrientation",
  ];

  function getMemeWordArtSandbox() {
    if (typeof document === "undefined") {
      return null;
    }

    let sandbox = document.getElementById("memeWordArtStyleSandbox");

    if (!sandbox) {
      sandbox = document.createElement("div");
      sandbox.id = "memeWordArtStyleSandbox";
      sandbox.style.position = "fixed";
      sandbox.style.left = "-99999px";
      sandbox.style.top = "-99999px";
      sandbox.style.width = "0";
      sandbox.style.height = "0";
      sandbox.style.overflow = "hidden";
      sandbox.style.pointerEvents = "none";
      sandbox.style.visibility = "hidden";
      sandbox.innerHTML = '<div id="hello"></div>';
      document.body.appendChild(sandbox);
    }

    return sandbox.querySelector("#hello");
  }

  function copyComputedStyle(source, target) {
    if (!source || !target) {
      return;
    }

    const computed = window.getComputedStyle(source);

    MEME_WORDART_COPY_PROPS.forEach(function (prop) {
      target.style[prop] = computed[prop] || "";
    });
  }

  function syncMemeWordArtVisuals(line, styleName) {
    if (
      typeof window === "undefined" ||
      !line ||
      !styleName ||
      !line.classList.contains(styleName)
    ) {
      return;
    }

    const sandboxRoot = getMemeWordArtSandbox();

    if (!sandboxRoot) {
      return;
    }

    sandboxRoot.innerHTML = "";

    const sample = line.cloneNode(true);
    sample.className = "hello-cell home-clone " + styleName;
    sandboxRoot.appendChild(sample);

    copyComputedStyle(sample, line);

    const sampleChildren = sample.querySelectorAll("span");
    const lineChildren = line.querySelectorAll("span");
    const length = Math.min(sampleChildren.length, lineChildren.length);

    for (let i = 0; i < length; i += 1) {
      copyComputedStyle(sampleChildren[i], lineChildren[i]);
    }
  }

  function getAppliedWordArtClass(line) {
    if (!line || !line.classList) {
      return "";
    }

    const found = Array.from(line.classList).find(function (name) {
      return typeof name === "string" && name.indexOf("wordart-") === 0;
    });

    return found || "";
  }
  
  export function clampMemeTextPercent(value) {
    return Math.max(-25, Math.min(125, value));
  }
  
  export function applyMemeTextWrapLayout(wrap, slotId, state) {
    if (!wrap) return;
  
    const pos = state.memeTextPositions[slotId] || { left: 50, top: 50 };
    const scale = parseFloat(wrap.dataset.memeTextScale || "1") || 1;
  
    wrap.style.left = pos.left + "%";
    wrap.style.top = pos.top + "%";
    wrap.style.transform =
      "translate(-50%, -50%) scale(" + scale.toFixed(3) + ")";
  }
  
  export function clampMemeSlotText(text, maxLen, upper) {
    let value = String(text || "");
  
    if (upper) {
      value = value.toUpperCase();
    }
  
    return value.slice(0, maxLen);
  }
  
  function pickMemeTextSize(role) {
    const pool = MEME_TEXT_SIZE_BY_ROLE[role] || MEME_TEXT_SIZE_BY_ROLE.main;
    return pool[Math.floor(Math.random() * pool.length)];
  }
  
  function pickMemeWordArtStyle(state) {
    const pick = pickMemePoolItem(
      MEME_WORDART_ITEMS,
      state.memeWordArtHistory,
      MEME_POOL_HISTORY_LIMIT
    );
    return pick.id;
  }
  
  function buildMemeTextPlan(state) {
    const countPick = pickMemePoolItem(
      MEME_TEXT_COUNTS,
      state.memeTextCountHistory,
      MEME_POOL_HISTORY_LIMIT
    );
    const countId = countPick.id;
    const copy = MEME_FIXED_COPY[countId];
  
    state.memeTextCountId = countId;
    state.memeTextPositions = JSON.parse(
      JSON.stringify(MEME_TEXT_DEFAULT_POSITIONS[countId])
    );
  
    state.memeActiveTextSlots = copy.lines.map(function (line) {
      return {
        id: line.id,
        label: line.label,
        sizeClass: pickMemeTextSize(line.role),
        maxLen: line.maxLen,
        defaultText: line.text,
        upper: !!line.upper,
      };
    });
  
    return state.memeActiveTextSlots;
  }
  
  function seedMemeTextState(state, slots) {
    state.memeSlotTexts = {};
    state.memeSlotStyles = {};
  
    slots.forEach(function (slot) {
      state.memeSlotTexts[slot.id] = slot.defaultText;
      state.memeSlotStyles[slot.id] = pickMemeWordArtStyle(state);
    });
  }
  
  function createMemeWordartLineElement(lineText, slot, state) {
    const line = document.createElement("div");
    const value = String(lineText || "");
  
    line.className = "meme-wordart-line " + (slot.sizeClass || "");
    line.setAttribute("aria-hidden", "true");
    line.style.whiteSpace = "pre";
  
    setWordArtPlainText(line, value);
    const styleName = state.memeSlotStyles[slot.id];

    applyWordArtStyle(line, styleName, MEME_WORDART_POOL, {
      stretch: false,
    });
    syncMemeWordArtVisuals(line, getAppliedWordArtClass(line));
    line.style.whiteSpace = "pre";
  
    return line;
  }
  
  export function renderMemeTextLine(slot, state, options) {
    const preserveScale =
      options && options.preserveScale != null ? options.preserveScale : null;
    const wrap = document.createElement("div");
    wrap.className = "meme-wordart-wrap";
    wrap.dataset.memeSlot = slot.id;
    wrap.dataset.memeTextScale = preserveScale != null ? String(preserveScale) : "1";
  
    const text = clampMemeSlotText(
      state.memeSlotTexts[slot.id] || slot.defaultText,
      slot.maxLen,
      slot.upper
    );
    const lineParts = text.split("\n");
  
    if (lineParts.length === 1) {
      wrap.appendChild(createMemeWordartLineElement(lineParts[0], slot, state));
    } else {
      const stack = document.createElement("div");
      stack.className = "meme-wordart-stack";
  
      lineParts.forEach(function (lineText) {
        stack.appendChild(createMemeWordartLineElement(lineText, slot, state));
      });
  
      wrap.appendChild(stack);
    }
  
    applyMemeTextWrapLayout(wrap, slot.id, state);
    return wrap;
  }
  
  export function renderMemeTextLayer(refs, state) {
    if (!refs.textLayer) return;
  
    refs.textLayer.innerHTML = "";
  
    state.memeActiveTextSlots.forEach(function (slot) {
      refs.textLayer.appendChild(renderMemeTextLine(slot, state));
    });
  }
  
  export function buildMemeEditPanel(refs, state, syncSlot) {
    if (!refs.editPanel) return;
  
    refs.editPanel.innerHTML = "";
  
    state.memeActiveTextSlots.forEach(function (slot, index) {
      const row = document.createElement("label");
      row.className = "meme-template-edit-row";
      if (index > 0) row.classList.add("meme-template-edit-row--secondary");
  
      const label = document.createElement("span");
      label.className = "meme-template-edit-label";
      label.textContent = slot.label;
  
      const input = document.createElement("textarea");
      input.className = "meme-template-edit-input";
      input.rows = 1;
      input.maxLength = slot.maxLen;
      input.spellcheck = false;
      input.value = clampMemeSlotText(
        state.memeSlotTexts[slot.id] || slot.defaultText,
        slot.maxLen,
        slot.upper
      );
      input.dataset.memeSlot = slot.id;
  
      const counter = document.createElement("span");
      counter.className = "meme-template-edit-counter";
      counter.textContent = input.value.length + "/" + slot.maxLen;
  
      input.addEventListener("input", function () {
        let value = input.value;
  
        if (slot.upper) {
          value = value.toUpperCase();
          if (input.value !== value) input.value = value;
        }
  
        value = value.slice(0, slot.maxLen);
        state.memeSlotTexts[slot.id] = value;
        counter.textContent = value.length + "/" + slot.maxLen;
        syncSlot(slot.id);
      });
  
      input.addEventListener("keydown", function (event) {
        if (event.key !== "Enter") return;
  
        const value = input.value;
        const selectionStart = input.selectionStart;
        const selectionEnd = input.selectionEnd;
  
        if (value.length >= slot.maxLen && selectionStart === selectionEnd) {
          event.preventDefault();
        }
      });
  
      row.appendChild(label);
      row.appendChild(input);
      row.appendChild(counter);
      refs.editPanel.appendChild(row);
    });
  }
  
  export function syncMemeSlotToStage(refs, state, slotId) {
    if (!refs.textLayer) return;
  
    const slot = state.memeActiveTextSlots.find(function (entry) {
      return entry.id === slotId;
    });
  
    if (!slot) return;
  
    const existing = refs.textLayer.querySelector(
      '.meme-wordart-wrap[data-meme-slot="' + slotId + '"]'
    );
  
    if (!existing) return;
  
    const preserveScale = parseFloat(existing.dataset.memeTextScale || "1") || 1;
    const fresh = renderMemeTextLine(slot, state, { preserveScale: preserveScale });
    existing.replaceWith(fresh);
  }
  
  export function applyMemeTextLayer(refs, state) {
    const slots = buildMemeTextPlan(state);
    seedMemeTextState(state, slots);
    renderMemeTextLayer(refs, state);
    buildMemeEditPanel(refs, state, function (slotId) {
      syncMemeSlotToStage(refs, state, slotId);
    });
  }
  
  export function getMemeCaptureCaptionText(state) {
    if (!state.memeActiveTextSlots || !state.memeActiveTextSlots.length) {
      return "";
    }
  
    return state.memeActiveTextSlots
      .map(function (slot) {
        return clampMemeSlotText(
          state.memeSlotTexts[slot.id] || slot.defaultText || "",
          slot.maxLen,
          slot.upper
        );
      })
      .filter(function (line) {
        return line.length > 0;
      })
      .join("\n");
  }
  
  export function syncMemeTicker(refs, state, layout) {
    if (!refs.tickerWrap || !layout.ticker) return;
  
    const tickerSlot = layout.slots.find(function (s) {
      return s.id === "ticker";
    });
  
    if (!tickerSlot) return;
  
    refs.tickerWrap.textContent = clampMemeSlotText(
      state.memeSlotTexts.ticker || tickerSlot.defaultText,
      tickerSlot.maxLen,
      tickerSlot.upper
    );
  }
  