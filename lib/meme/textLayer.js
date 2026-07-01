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
    applyWordArtStyle(line, state.memeSlotStyles[slot.id], MEME_WORDART_POOL, {
      stretch: false,
    });
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
  