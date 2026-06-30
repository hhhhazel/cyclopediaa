import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";


/* ===============================
   素材路径
   =============================== */

function assetUrl(path) {
  const normalized = String(path || "").replace(/^\//, "");
  return import.meta.env.BASE_URL + normalized;
}

const LAB_MODEL_PATH = assetUrl("models/lab.gltf");
const BOOK_PREVIEW_GIF = assetUrl("images/book-preview.gif");
const CYBERCLONE_AD_GIF = assetUrl("images/ad.gif");
const HELLO_RUNNER_CURSOR_GIF = assetUrl("images/cyberclone-run.gif");
const HELLO_HAND_CURSOR_IMG = assetUrl("images/hand-cursor.png");

const LAB_TOOL_CURSORS = {
  pipette: {
    src: assetUrl("images/pipette.png"),
    width: 548,
    height: 574,
    hotspotX: 51,
    hotspotY: 516
  },
  syringe: {
    src: assetUrl("images/syringe.png"),
    width: 470,
    height: 522,
    hotspotX: 103,
    hotspotY: 96
  },
  "tube-rack": {
    src: assetUrl("images/tube-rack.png"),
    width: 726,
    height: 496,
    hotspotX: 394,
    hotspotY: 192
  },
  "petri-dish": {
    src: assetUrl("images/petri-dish.png"),
    width: 407,
    height: 413,
    hotspotX: 203,
    hotspotY: 194
  }
};

const LAB_TOOL_CURSOR_DISPLAY_MAX = 120;

let activeLabTool = null;


/* ===============================
   Supabase
   =============================== */

const SUPABASE_URL = "https://najaaxfkmlgtnhjaftpy.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_qERey-8ZpanYVCvrTtiOPA_H93GkxJz";

const SUPABASE_TABLE_NAME = "cyberclone_field";

let supabaseClient = null;

if (window.supabase) {
  supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );
} else {
  console.error("Supabase library has not loaded. Check index.html CDN script.");
}


/* ===============================
   自定义鼠标
   =============================== */

const customCursor = document.getElementById("customCursor");

let lastCursorX = null;
let lastCursorY = null;
let cursorRotationDeg = 0;

function isHelloPrimarySection() {
  const hello = document.getElementById("hello");

  if (!hello || !hello.classList.contains("active")) {
    return false;
  }

  if (hello.classList.contains("home-fade-out")) {
    return false;
  }

  return !document.querySelector(".section.active:not(#hello)");
}

function getHelloCursorMode() {
  if (!isHelloPrimarySection()) {
    return null;
  }

  if (activeLabTool) {
    return "tool";
  }

  if (document.body.classList.contains("wiki-mobile-preview-active")) {
    return "hand";
  }

  return "runner";
}

function getActiveLabToolCursorSrc() {
  if (!activeLabTool) {
    return "";
  }

  const config = LAB_TOOL_CURSORS[activeLabTool];

  return config ? config.src : "";
}

function getLabToolCursorLayout(toolId) {
  const config = LAB_TOOL_CURSORS[toolId];

  if (!config) {
    return null;
  }

  const scale = LAB_TOOL_CURSOR_DISPLAY_MAX / Math.max(config.width, config.height);

  return {
    width: config.width * scale,
    height: config.height * scale,
    hotspotX: config.hotspotX * scale,
    hotspotY: config.hotspotY * scale
  };
}

function resetCustomCursorLayout() {
  if (!customCursor) {
    return;
  }

  customCursor.style.removeProperty("width");
  customCursor.style.removeProperty("height");
}

function isSyringeToolActive() {
  return activeLabTool === "syringe";
}

function isPetriDishToolActive() {
  return activeLabTool === "petri-dish";
}

function syncLabToolBodyClass() {
  document.body.classList.toggle("lab-tool-syringe-active", isSyringeToolActive());
  document.body.classList.toggle("lab-tool-petri-active", isPetriDishToolActive());
}

function resetHelloCursorMotion() {
  lastCursorX = null;
  lastCursorY = null;
  cursorRotationDeg = 0;

  if (customCursor) {
    customCursor.style.setProperty("--cursor-rotate", "0deg");
  }
}

function syncHelloCustomCursorBodyClass() {
  const isHelloPrimary = isHelloPrimarySection();

  document.body.classList.toggle("hello-custom-cursor-active", isHelloPrimary);

  if (!isHelloPrimary) {
    resetHelloCursorMotion();

    if (customCursor) {
      customCursor.style.display = "none";
    }
  }
}

function updateCustomCursor(event) {
  if (!customCursor) return;

  const mode = getHelloCursorMode();

  if (!mode) {
    customCursor.style.display = "none";
    resetCustomCursorLayout();
    customCursor.classList.remove(
      "custom-cursor--runner",
      "custom-cursor--hand",
      "custom-cursor--tool"
    );
    return;
  }

  if (mode === "tool") {
    const toolSrc = getActiveLabToolCursorSrc();
    const layout = activeLabTool ? getLabToolCursorLayout(activeLabTool) : null;

    if (toolSrc && customCursor.getAttribute("src") !== toolSrc) {
      customCursor.setAttribute("src", toolSrc);
    }

    customCursor.classList.add("custom-cursor--tool");
    customCursor.classList.remove("custom-cursor--runner", "custom-cursor--hand");
    customCursor.style.setProperty("--cursor-rotate", "0deg");

    if (layout) {
      customCursor.style.width = layout.width + "px";
      customCursor.style.height = layout.height + "px";
      customCursor.style.left = event.clientX - layout.hotspotX + "px";
      customCursor.style.top = event.clientY - layout.hotspotY + "px";
    }
  } else if (mode === "hand") {
    resetCustomCursorLayout();

    if (customCursor.getAttribute("src") !== HELLO_HAND_CURSOR_IMG) {
      customCursor.setAttribute("src", HELLO_HAND_CURSOR_IMG);
    }

    customCursor.classList.add("custom-cursor--hand");
    customCursor.classList.remove("custom-cursor--runner", "custom-cursor--tool");
    customCursor.style.setProperty("--cursor-rotate", "0deg");
    customCursor.style.left = event.clientX + "px";
    customCursor.style.top = event.clientY + "px";
  } else {
    resetCustomCursorLayout();

    if (customCursor.getAttribute("src") !== HELLO_RUNNER_CURSOR_GIF) {
      customCursor.setAttribute("src", HELLO_RUNNER_CURSOR_GIF);
    }

    customCursor.classList.add("custom-cursor--runner");
    customCursor.classList.remove("custom-cursor--hand", "custom-cursor--tool");

    if (lastCursorX !== null && lastCursorY !== null) {
      const dx = event.clientX - lastCursorX;
      const dy = event.clientY - lastCursorY;

      if (Math.hypot(dx, dy) > 1.5) {
        cursorRotationDeg = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
        customCursor.style.setProperty("--cursor-rotate", cursorRotationDeg + "deg");
      }
    }

    customCursor.style.left = event.clientX + "px";
    customCursor.style.top = event.clientY + "px";
  }

  lastCursorX = event.clientX;
  lastCursorY = event.clientY;
  customCursor.style.display = "block";
}

window.addEventListener("mousemove", updateCustomCursor);

window.addEventListener("mouseleave", function () {
  if (!customCursor) return;
  customCursor.style.display = "none";
  resetHelloCursorMotion();
});

window.addEventListener("mouseenter", function (event) {
  if (!customCursor || !getHelloCursorMode()) return;
  updateCustomCursor(event);
});


/* ===============================
   页面切换
   =============================== */

const sections = document.querySelectorAll(".section");
const sectionNavButtons = document.querySelectorAll(".bottom-dock [data-section]");
const labToolButtons = document.querySelectorAll(".bottom-tool-dock [data-lab-tool]");
const pageShell = document.querySelector(".page-shell");
const wikiMediaViewer = document.getElementById("wikiMediaViewer");

let wikiMediaItems = [];
let wikiMediaViewerState = null;

function findThumbArticleAnchor(link) {
  let node = link.closest("figure");

  while (node) {
    if (node.previousElementSibling) {
      node = node.previousElementSibling;

      if (node.id && node.id.indexOf("wiki-sec") === 0) {
        return node.id;
      }
    } else {
      break;
    }
  }

  return "";
}

function collectWikiMediaItems() {
  const root = document.querySelector("#hello .wiki-vector");

  if (!root) {
    return [];
  }

  const items = [];

  root.querySelectorAll(".wiki-thumb-image-link[data-section-link]").forEach(function (link) {
    const sectionId = link.dataset.sectionLink;
    const img = link.querySelector("img");
    const figure = link.closest("figure");
    const captionEl = figure ? figure.querySelector(".wiki-thumb-caption") : null;
    const caption = captionEl ? captionEl.textContent.trim() : "";
    const title = img ? img.getAttribute("alt") || caption || sectionId : sectionId;
    const width = img ? parseInt(img.getAttribute("width"), 10) || 220 : 220;
    const height = img ? parseInt(img.getAttribute("height"), 10) || 165 : 165;

    items.push({
      sectionId: sectionId,
      title: title,
      caption: caption,
      articleAnchor: findThumbArticleAnchor(link),
      width: width,
      height: height,
      viewerProfile:
        sectionId === "lab"
          ? "wide"
          : sectionId === "test"
            ? "minimal"
            : "thumb"
    });
  });

  return items;
}

function closeWikiMediaViewer() {
  if (!wikiMediaViewerState) {
    return;
  }

  wikiMediaViewerState = null;

  if (pageShell) {
    pageShell.classList.remove("wiki-media-viewer-active");
    pageShell.style.removeProperty("--wiki-viewer-stage-left");
    pageShell.style.removeProperty("--wiki-viewer-stage-top");
    pageShell.style.removeProperty("--wiki-viewer-stage-width");
    pageShell.style.removeProperty("--wiki-viewer-stage-height");
    pageShell.style.removeProperty("--wiki-viewer-side-width");
  }

  if (wikiMediaViewer) {
    wikiMediaViewer.classList.add("hidden");
    wikiMediaViewer.setAttribute("aria-hidden", "true");
  }

  setTimeout(function () {
    resizeAllCanvases();
  }, 60);
}

function computeWikiViewerStage(item, availW, availH) {
  if (item.viewerProfile === "wide") {
    const sideInset = Math.max(28, availW * 0.045);

    return {
      stageW: availW - sideInset * 2,
      stageH: availH
    };
  }

  if (item.viewerProfile === "minimal") {
    const sideInset = Math.max(16, availW * 0.012);

    return {
      stageW: availW - sideInset * 2,
      stageH: availH
    };
  }

  const aspect = item.width / item.height;
  let stageW = availW;
  let stageH = stageW / aspect;

  if (stageH > availH) {
    stageH = availH;
    stageW = stageH * aspect;
  }

  return { stageW: stageW, stageH: stageH };
}

function updateWikiMediaViewerLayout() {
  if (!wikiMediaViewer || !wikiMediaViewerState || !pageShell) {
    return;
  }

  const item = wikiMediaItems[wikiMediaViewerState.index];

  if (!item) {
    return;
  }

  const headerEl = document.getElementById("siteGlobalHeader");
  const metaEl = wikiMediaViewer.querySelector(".wiki-media-viewer-metadata");
  const headerPx = headerEl ? headerEl.getBoundingClientRect().height : 52;
  const metaPx = metaEl ? metaEl.offsetHeight : 80;
  const availW = window.innerWidth;
  const availH = window.innerHeight - headerPx - metaPx;
  const stage = computeWikiViewerStage(item, availW, availH);
  const stageLeft = Math.max(0, (availW - stage.stageW) / 2);
  const stageTop = headerPx + Math.max(0, (availH - stage.stageH) / 2);

  pageShell.style.setProperty("--wiki-viewer-stage-left", stageLeft + "px");
  pageShell.style.setProperty("--wiki-viewer-stage-top", stageTop + "px");
  pageShell.style.setProperty("--wiki-viewer-stage-width", stage.stageW + "px");
  pageShell.style.setProperty("--wiki-viewer-stage-height", stage.stageH + "px");
  pageShell.style.setProperty("--wiki-viewer-side-width", stageLeft + "px");

  wikiMediaViewer.style.setProperty("--wiki-viewer-header-offset", headerPx + "px");
  wikiMediaViewer.style.setProperty("--wiki-viewer-metadata-height", metaPx + "px");
  wikiMediaViewer.style.setProperty("--wiki-viewer-side-width", stageLeft + "px");

  resizeAllCanvases();
}

function refreshWikiMediaViewerChrome(item, itemIndex) {
  if (!wikiMediaViewer || !item) {
    return;
  }

  const titleEl = wikiMediaViewer.querySelector(".wiki-media-viewer-title");
  const attrEl = wikiMediaViewer.querySelector(".wiki-media-viewer-attribution");
  const counterEl = wikiMediaViewer.querySelector(".wiki-media-viewer-counter");

  if (titleEl) {
    titleEl.textContent = item.title;
  }

  if (attrEl) {
    attrEl.textContent = item.caption;
  }

  if (counterEl) {
    counterEl.textContent = itemIndex + 1 + " / " + wikiMediaItems.length;
  }
}

function openWikiMediaViewer(itemIndex) {
  const item = wikiMediaItems[itemIndex];

  if (!item || !wikiMediaViewer || !pageShell) {
    return;
  }

  wikiMediaViewerState = {
    index: itemIndex,
    profile: item.viewerProfile
  };

  refreshWikiMediaViewerChrome(item, itemIndex);
  pageShell.classList.add("wiki-media-viewer-active");
  wikiMediaViewer.classList.remove("hidden");
  wikiMediaViewer.setAttribute("aria-hidden", "false");
  showSection(item.sectionId, { keepMediaViewer: true });

  requestAnimationFrame(updateWikiMediaViewerLayout);
  setTimeout(updateWikiMediaViewerLayout, 60);
  setTimeout(updateWikiMediaViewerLayout, 260);
}

function navigateWikiMediaViewer(delta) {
  if (!wikiMediaViewerState || !wikiMediaItems.length) {
    return;
  }

  let nextIndex = wikiMediaViewerState.index + delta;

  if (nextIndex < 0) {
    nextIndex = wikiMediaItems.length - 1;
  }

  if (nextIndex >= wikiMediaItems.length) {
    nextIndex = 0;
  }

  openWikiMediaViewer(nextIndex);
}

function initWikiMediaViewer() {
  wikiMediaItems = collectWikiMediaItems();

  if (!wikiMediaViewer) {
    return;
  }

  const closeBtn = wikiMediaViewer.querySelector(".wiki-media-viewer-close");
  const prevBtn = wikiMediaViewer.querySelector(".wiki-media-viewer-nav--prev");
  const nextBtn = wikiMediaViewer.querySelector(".wiki-media-viewer-nav--next");
  const detailsBtn = wikiMediaViewer.querySelector(".wiki-media-viewer-details");

  if (closeBtn) {
    closeBtn.addEventListener("click", function () {
      closeWikiMediaViewer();
      showSection("hello");
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", function () {
      navigateWikiMediaViewer(-1);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", function () {
      navigateWikiMediaViewer(1);
    });
  }

  if (detailsBtn) {
    detailsBtn.addEventListener("click", function () {
      const anchor =
        wikiMediaViewerState && wikiMediaItems[wikiMediaViewerState.index]
          ? wikiMediaItems[wikiMediaViewerState.index].articleAnchor
          : "";

      closeWikiMediaViewer();
      showSection("hello");

      if (!anchor) {
        return;
      }

      setTimeout(function () {
        const target = document.getElementById(anchor);

        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 120);
    });
  }

  window.addEventListener("resize", function () {
    updateWikiMediaViewerLayout();
  });
}

initWikiMediaViewer();

function updateNavigationState(id) {
  sectionNavButtons.forEach(function (button) {
    button.classList.remove("active");
  });

  const targetButton = document.querySelector(`[data-section="${id}"]`);

  if (targetButton) {
    targetButton.classList.add("active");
  }
}

function runSectionSideEffects(id) {
  updateSiteSearchPlaceholder(id);

  if (id === "hello") {
    resetHomeGridView();
    syncWikiMobilePreviewState();
  }

  if (id === "statement") {
    setTimeout(function () {
      restartStatementPhysics();
    }, 80);
  } else {
    stopStatementPhysics();
  }

  if (id === "test") {
    prepareCybercloneTestSection();
    refreshCybercloneField();
  }

  if (id === "lab") {
    setTimeout(function () {
      resizeAllCanvases();
      moveLabCameraTo("Microscope");
      snapLabCameraView();
    }, 80);
  }

  setTimeout(function () {
    resizeAllCanvases();
  }, 50);

  setTimeout(function () {
    resizeAllCanvases();
  }, 250);
}

function showSection(id, options) {
  const targetSection = document.getElementById(id);

  if (!targetSection) return;

  const currentSection = document.querySelector(".section.active");

  if (currentSection && currentSection.id === id) {
    if (options && options.keepMediaViewer && wikiMediaViewerState) {
      updateWikiMediaViewerLayout();
    }

    return;
  }

  if (!(options && options.keepMediaViewer)) {
    closeWikiMediaViewer();
  }

  sections.forEach(function (section) {
    section.classList.remove("active");
    section.classList.remove("section-under-home");
    section.classList.remove("home-fade-out");
  });

  targetSection.classList.add("active");

  updateNavigationState(id);
  syncHelloCustomCursorBodyClass();
  runSectionSideEffects(id);
}

function bindWikiThumbLinks(root) {
  if (!root) return;

  root.querySelectorAll(".wiki-thumb-image-link[data-section-link]").forEach(function (link) {
    if (link.dataset.thumbBound === "true") return;

    link.dataset.thumbBound = "true";

    link.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();

      const sectionId = link.dataset.sectionLink;
      const itemIndex = wikiMediaItems.findIndex(function (item) {
        return item.sectionId === sectionId;
      });

      if (itemIndex >= 0) {
        openWikiMediaViewer(itemIndex);
      } else if (sectionId) {
        showSection(sectionId);
      }
    });
  });
}

sectionNavButtons.forEach(function (button) {
  button.addEventListener("click", function () {
    showSection(button.dataset.section);
  });
});

labToolButtons.forEach(function (button) {
  button.addEventListener("click", function () {
    const toolId = button.dataset.labTool;

    if (!toolId) {
      return;
    }

    if (activeLabTool === toolId) {
      activeLabTool = null;
      button.classList.remove("active");
    } else {
      activeLabTool = toolId;
      labToolButtons.forEach(function (item) {
        item.classList.remove("active");
      });
      button.classList.add("active");
    }

    resetHelloCursorMotion();
    syncLabToolBodyClass();
  });
});

const enterLabBtn = document.getElementById("enterLabBtn");

if (enterLabBtn) {
  enterLabBtn.addEventListener("click", function () {
    showSection("lab");
  });
}

/* ===============================
   全站公共网格拖动与缩放
   =============================== */

let isDraggingGrid = false;
let startX = 0;
let startY = 0;

let gridRotateZ = 0;
let gridZoom = 1;
let gridTop = 60;
let gridOffsetX = 0;
let gridOffsetY = 0;

function updateGridCSSVariables() {
  document.documentElement.style.setProperty("--grid-rotate-z", gridRotateZ + "deg");
  document.documentElement.style.setProperty("--grid-zoom", gridZoom);
  document.documentElement.style.setProperty("--grid-top", gridTop + "%");
  document.documentElement.style.setProperty("--grid-offset-x", gridOffsetX + "px");
  document.documentElement.style.setProperty("--grid-offset-y", gridOffsetY + "px");
}

function isWikiMediaViewerActive() {
  return !!(pageShell && pageShell.classList.contains("wiki-media-viewer-active"));
}

function isGridDragBlockedTarget(target) {
  if (!(target instanceof Element)) {
    return true;
  }

  return !!(
    target.closest("button") ||
    target.closest("input") ||
    target.closest("#hello") ||
    target.closest(".wiki-vector") ||
    target.closest(".bottom-dock") ||
    target.closest(".top-marquee") ||
    target.closest(".site-global-header") ||
    target.closest(".hello-cell-field") ||
    target.closest("#homeRecallClones") ||
    target.closest(".wiki-thumb-image-link") ||
    target.closest(".cyberfling-item") ||
    target.closest(".statement-physics-stage") ||
    target.closest(".cyberclone-test-panel") ||
    target.closest(".formation-toggle-button") ||
    target.closest(".wiki-media-viewer-nav") ||
    target.closest(".wiki-media-viewer-close") ||
    target.closest(".wiki-media-viewer-metadata") ||
    target.closest(".archive-item") ||
    target.closest(".archive-upload-panel") ||
    target.closest(".lab-arrow")
  );
}

function isInsideWikiViewerStage(target) {
  if (!(target instanceof Element)) {
    return false;
  }

  const stage = target.closest("#lab, #archive, #test");

  return !!(stage && stage.classList.contains("active"));
}

function shouldStartGridDrag(target) {
  if (!(target instanceof Element)) {
    return false;
  }

  if (isGridDragBlockedTarget(target)) {
    return false;
  }

  if (isWikiMediaViewerActive()) {
    return isInsideWikiViewerStage(target);
  }

  if (target.closest("#test") || target.closest(".archive-section")) {
    return false;
  }

  return true;
}

function resetHomeGridView() {
  gridRotateZ = 0;
  gridZoom = 1;
  gridTop = 60;
  gridOffsetX = 0;
  gridOffsetY = 0;
  updateGridCSSVariables();
}


/* ===============================
   首页文字克隆
   =============================== */

const helloWikiRoot = document.querySelector("#hello .wiki-vector");
const homeRecallClones = document.getElementById("homeRecallClones");

let homeCellCounter = 0;

const WIKI_CLONE_SKIP_SELECTOR =
  ".site-ui-float, .site-ui-bottom-row, .site-ui-hint, .bottom-dock, .wiki-logo-slot, .wiki-search-form, .wiki-search-button, .wiki-header-links, .wiki-thumb-image-link, .wiki-inline-link, .wiki-mobile-chrome-top, .wiki-mobile-browser-bar, script, style";

const WIKI_CLONE_CONTENT_SELECTOR = "#hello .wiki-vector";

const WIKI_SHORT_WORDS = new Set([
  "a", "an", "the", "in", "on", "at", "of", "to", "for", "from", "but", "and",
  "or", "as", "is", "if", "by", "be", "are", "was", "not", "also", "how", "it",
  "its", "you", "can", "we", "they", "this", "that", "with", "into", "over",
  "than", "then", "when", "who", "what", "your", "our", "all", "any", "do"
]);

function cleanWikiWord(word) {
  return word.replace(/^[^\w]+|[^\w]+$/g, "");
}

function pickHelloCellShape(text) {
  const words = text.trim().split(/\s+/);
  const wordCount = words.length;

  if (wordCount === 1) {
    if (/^[\d.]+$/.test(words[0])) {
      return "square";
    }

    const core = cleanWikiWord(words[0]);

    if (core.length <= 1) {
      return "circle";
    }

    if (core.length <= 4 || WIKI_SHORT_WORDS.has(core.toLowerCase())) {
      return "square";
    }

    if (core.length <= 11) {
      return "rect";
    }

    return "pill";
  }

  if (wordCount === 2 && text.length <= 18) {
    return "rect";
  }

  if (text.length <= 26) {
    return "pill";
  }

  return "oval";
}

function stablePhraseRoll(rawWords, index) {
  let h = 2166136261;
  const s = rawWords.join(" ") + "|" + index;

  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }

  return (h >>> 0) % 100;
}

function peekMergeLength(rawWords, index, maxWords, maxChars) {
  let phrase = rawWords[index];
  let nextIndex = index + 1;

  while (nextIndex < rawWords.length) {
    const nextWord = rawWords[nextIndex];
    const nextBare = cleanWikiWord(nextWord).toLowerCase();

    if (
      nextIndex > index &&
      (WIKI_SHORT_WORDS.has(nextBare) || cleanWikiWord(nextWord).length <= 2)
    ) {
      break;
    }

    if (/[.!?:;]$/.test(rawWords[nextIndex - 1])) {
      break;
    }

    phrase += " " + nextWord;
    nextIndex += 1;

    if (nextIndex - index >= maxWords || phrase.length > maxChars) {
      break;
    }
  }

  return nextIndex - index;
}

function groupTextIntoPhrases(text) {
  const rawWords = text.trim().split(/\s+/).filter(Boolean);

  if (!rawWords.length) {
    return [];
  }

  const groups = [];
  let index = 0;

  while (index < rawWords.length) {
    const word = rawWords[index];

    if (/^[\d.]+$/.test(word)) {
      groups.push({ text: word, shape: pickHelloCellShape(word) });
      index += 1;
      continue;
    }

    const bare = cleanWikiWord(word).toLowerCase();

    if (WIKI_SHORT_WORDS.has(bare) || cleanWikiWord(word).length <= 2) {
      groups.push({ text: word, shape: pickHelloCellShape(word) });
      index += 1;
      continue;
    }

    const canMerge = peekMergeLength(rawWords, index, 3, 28);

    if (canMerge < 2) {
      groups.push({ text: word, shape: pickHelloCellShape(word) });
      index += 1;
      continue;
    }

    const roll = stablePhraseRoll(rawWords, index);

    if (roll >= 63) {
      groups.push({ text: word, shape: pickHelloCellShape(word) });
      index += 1;
      continue;
    }

    const take =
      canMerge >= 3 && roll < 32 ? 3 : Math.min(2, canMerge);
    const phrase = rawWords.slice(index, index + take).join(" ");

    groups.push({
      text: phrase,
      shape: pickHelloCellShape(phrase)
    });

    index += take;
  }

  return groups;
}

function wrapTextNodeAsCloneCells(textNode) {
  const parent = textNode.parentElement;

  if (!parent || parent.closest(WIKI_CLONE_SKIP_SELECTOR)) return;
  if (parent.classList.contains("hello-cell")) return;

  const text = textNode.textContent;

  if (!text || !text.trim()) return;

  const groups = groupTextIntoPhrases(text);
  const fragment = document.createDocumentFragment();

  groups.forEach(function (group, index) {
    const cell = document.createElement("span");
    cell.className = "hello-cell " + group.shape;
    cell.textContent = group.text;
    fragment.appendChild(cell);

    if (index < groups.length - 1) {
      fragment.appendChild(document.createTextNode(" "));
    }
  });

  parent.replaceChild(fragment, textNode);
}

function initializeWikiTextCloning(root) {
  if (!root) return;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: function (node) {
      const parent = node.parentElement;

      if (!parent) return NodeFilter.FILTER_REJECT;
      if (parent.closest(WIKI_CLONE_SKIP_SELECTOR)) return NodeFilter.FILTER_REJECT;
      if (parent.classList.contains("hello-cell")) return NodeFilter.FILTER_REJECT;
      if (!node.textContent || !node.textContent.trim()) {
        return NodeFilter.FILTER_REJECT;
      }

      return NodeFilter.FILTER_ACCEPT;
    }
  });

  const textNodes = [];

  while (walker.nextNode()) {
    textNodes.push(walker.currentNode);
  }

  textNodes.forEach(wrapTextNodeAsCloneCells);
}

function assignHomeCellId(cell) {
  if (!cell.dataset.cellId) {
    homeCellCounter += 1;
    cell.dataset.cellId = "home-cell-" + homeCellCounter;
  }

  return cell.dataset.cellId;
}

function makeHomeCellCloneable(cell) {
  if (cell.dataset.cloneBound === "true") return;

  ensureCloneTextDataset(cell);
  assignHomeCellId(cell);
  cell.dataset.cloneBound = "true";
}

const CLONE_WORDART_STYLES = [
  "wordart-make",
  "wordart-free",
  "wordart-rainbow",
  "wordart-classy",
  "wordart-win95",
  "wordart-outline-black",
  "wordart-outline-blue",
  "wordart-outline-purple",
  "wordart-deep-gray",
  "wordart-deep-orange",
  "wordart-deep-cyan",
  "wordart-oblique-up",
  "wordart-oblique-perspective",
  "wordart-jazz",
  "wordart-logos",
  "wordart-arch-up",
  "wordart-arch-rainbow",
  "wordart-wave",
  "wordart-flag",
  "wordart-taper-left",
  "wordart-marble",
  "wordart-neon-pink",
  "wordart-underline-slab"
];

const WORDART_CURVED_STYLES = {
  "wordart-arch-up": 7,
  "wordart-arch-rainbow": 9
};

const WORDART_WAVE_STYLES = {
  "wordart-wave": 1,
  "wordart-flag": 1.45
};

const WORDART_STYLE_BASE_TRANSFORM = {
  "wordart-oblique-up": "skewX(-18deg) rotate(-6deg)",
  "wordart-oblique-perspective": "perspective(120px) rotateY(-28deg) skewX(-8deg)",
  "wordart-jazz": "skewX(-12deg) rotate(-4deg)",
  "wordart-logos": "skewX(-16deg)",
  "wordart-taper-left": "perspective(160px) rotateY(24deg)"
};

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

function ensureCloneTextDataset(cell) {
  if (!cell.dataset.cloneText) {
    cell.dataset.cloneText = cell.textContent.trim();
  }
}

function restoreClonePlainText(clone) {
  if (clone.dataset.cloneText) {
    clone.textContent = clone.dataset.cloneText;
  }
}

function archifyCloneText(clone, intensity, rainbow) {
  const text = clone.dataset.cloneText || clone.textContent;
  const chars = Array.from(text);
  const mid = (chars.length - 1) / 2;
  const rainbowColors = [
    "#ff2a2a",
    "#ff7a00",
    "#ffe600",
    "#2ecc40",
    "#2f7bff",
    "#9b35ff"
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

function waveifyCloneText(clone, strength) {
  const text = clone.dataset.cloneText || clone.textContent;
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

function clearCloneWordArtStyle(clone) {
  CLONE_WORDART_STYLES.forEach(function (styleName) {
    clone.classList.remove(styleName);
  });

  restoreClonePlainText(clone);

  clone.style.background = "";
  clone.style.color = "";
  clone.style.border = "";
  clone.style.boxShadow = "";
  clone.style.webkitTextStroke = "";
  clone.style.webkitTextFillColor = "";
  clone.style.backgroundClip = "";
  clone.style.fontFamily = "";
  clone.style.fontWeight = "";
  clone.style.fontStyle = "";
  clone.style.letterSpacing = "";
  clone.style.transform = "";
  clone.style.transformOrigin = "";
  clone.style.filter = "";
  clone.style.writingMode = "";
  clone.style.textOrientation = "";
  clone.style.textShadow = "";
}

function applyRandomWordArtStyle(clone) {
  clearCloneWordArtStyle(clone);
  ensureCloneTextDataset(clone);

  const styleName =
    CLONE_WORDART_STYLES[
      Math.floor(Math.random() * CLONE_WORDART_STYLES.length)
    ];

  clone.classList.add(styleName);

  if (styleName === "wordart-arch-rainbow") {
    archifyCloneText(clone, WORDART_CURVED_STYLES[styleName], true);
  } else if (WORDART_CURVED_STYLES[styleName]) {
    archifyCloneText(clone, WORDART_CURVED_STYLES[styleName], false);
  } else if (styleName === "wordart-wave") {
    waveifyCloneText(clone, 1);
  } else if (styleName === "wordart-flag") {
    waveifyCloneText(clone, 1.45);
  }

  applyCloneGlyphStretch(clone, styleName);
}

function createHomeCellClone(sourceCell) {
  if (!sourceCell) return;

  const sourceId = assignHomeCellId(sourceCell);
  const clone = sourceCell.cloneNode(true);

  clone.classList.add("home-clone");
  clone.classList.remove("is-recalling");
  clone.dataset.clone = "true";
  clone.dataset.sourceId = sourceId;
  clone.dataset.cloneBound = "true";

  assignHomeCellId(clone);
  clearCloneWordArtStyle(clone);
  applyRandomWordArtStyle(clone);

  sourceCell.insertAdjacentElement("afterend", clone);

  makeHomeCellCloneable(clone);

  requestAnimationFrame(function () {
    clone.classList.remove("home-clone");
    void clone.offsetWidth;
    clone.classList.add("home-clone");
    applyRandomWordArtStyle(clone);
  });
}

const PETRI_TEXT_LINE_COVER_MS = 980;
const PETRI_LINE_BLOCK_SELECTOR =
  "p, h1, h2, h3, .wiki-heading, .wiki-lead, li, .wiki-thumb-caption, figcaption, .wiki-nav-link, .wiki-tools-title, .wiki-toc-link, .wiki-appearance-label, .wiki-appearance-btn, .wiki-toc-head";

function getPetriFloodBounds() {
  const body = document.querySelector("#hello .wiki-vector-body");

  if (!body) {
    return null;
  }

  const rect = body.getBoundingClientRect();
  const header = document.getElementById("siteGlobalHeader");
  const headerBottom = header ? header.getBoundingClientRect().bottom : 0;
  const visibleTop = Math.max(rect.top, headerBottom);
  const visibleBottom = Math.min(rect.bottom, window.innerHeight);
  const visibleLeft = Math.max(rect.left, 0);
  const visibleRight = Math.min(rect.right, window.innerWidth);
  const width = visibleRight - visibleLeft;
  const height = visibleBottom - visibleTop;

  if (width < 40 || height < 40) {
    return null;
  }

  return {
    left: visibleLeft,
    top: visibleTop,
    width: width,
    height: height,
    right: visibleRight,
    bottom: visibleBottom
  };
}

function assignPetriSourceId(element) {
  if (!element) {
    return "";
  }

  return assignHomeCellId(element);
}

function applyPetriFloodTransform(clone, placement, options) {
  const isLineText = options && options.lineText;

  clone.style.left = placement.left + "px";
  clone.style.top = placement.top + "px";

  if (isLineText) {
    clone.style.setProperty("--petri-opacity", String(placement.opacity || 0.94));
    return;
  }

  clone.style.setProperty("--petri-rot", placement.rotation + "deg");
  clone.style.setProperty("--petri-scale", String(placement.scale));
  clone.style.setProperty("--petri-opacity", String(placement.opacity));
}

function measurePetriFloodTextWidth(sourceCell) {
  const probe = document.createElement("span");

  probe.className = "hello-cell petri-flood-clone petri-flood-clone--line";
  probe.textContent = sourceCell.textContent;
  probe.style.visibility = "hidden";
  probe.style.position = "fixed";
  probe.style.left = "-9999px";
  probe.style.top = "0";
  applyPetriFloodSourceStyle(probe, sourceCell);
  document.body.appendChild(probe);

  const width = probe.getBoundingClientRect().width;

  probe.remove();

  return Math.max(12, width);
}

function collectPetriFloodLineRects(bounds) {
  const root = document.querySelector("#hello .wiki-vector-body");

  if (!root || !bounds) {
    return [];
  }

  const lineRects = [];

  root.querySelectorAll(PETRI_LINE_BLOCK_SELECTOR).forEach(function (block) {
    const range = document.createRange();

    range.selectNodeContents(block);

    Array.from(range.getClientRects()).forEach(function (rect) {
      if (rect.width < 8 || rect.height < 4) {
        return;
      }

      if (rect.bottom < bounds.top || rect.top > bounds.bottom) {
        return;
      }

      if (rect.right < bounds.left || rect.left > bounds.right) {
        return;
      }

      lineRects.push({
        top: rect.top,
        left: Math.max(rect.left, bounds.left),
        width:
          Math.min(rect.right, bounds.right) -
          Math.max(rect.left, bounds.left),
        height: rect.height
      });
    });
  });

  lineRects.sort(function (a, b) {
    if (Math.abs(a.top - b.top) > 2) {
      return a.top - b.top;
    }

    return a.left - b.left;
  });

  return lineRects;
}

function buildPetriTextLineCoverPlacements(sourceCell, bounds) {
  const lines = collectPetriFloodLineRects(bounds);

  if (!lines.length) {
    const sourceRect = sourceCell.getBoundingClientRect();

    lines.push({
      top: sourceRect.top,
      left: Math.max(sourceRect.left, bounds.left),
      width: Math.max(
        48,
        Math.min(sourceRect.right, bounds.right) -
          Math.max(sourceRect.left, bounds.left)
      ),
      height: Math.max(14, sourceRect.height)
    });
  }

  const tileWidth = measurePetriFloodTextWidth(sourceCell) + 3;
  const placements = [];

  lines.forEach(function (line, lineIndex) {
    let x = line.left;
    let tileIndex = 0;

    while (x + tileWidth * 0.35 < line.left + line.width) {
      placements.push({
        left: x,
        top: line.top,
        lineIndex: lineIndex,
        tileIndex: tileIndex,
        opacity: 0.93
      });

      x += tileWidth;
      tileIndex += 1;
    }
  });

  return placements;
}

function resolvePetriFloodImageDisplaySize(sourceEl, src) {
  const sourceImg = sourceEl instanceof HTMLImageElement ? sourceEl : null;

  if (sourceImg) {
    const rect = sourceImg.getBoundingClientRect();

    if (rect.width > 0 && rect.height > 0) {
      return {
        width: rect.width,
        height: rect.height
      };
    }

    if (sourceImg.naturalWidth > 0 && sourceImg.naturalHeight > 0) {
      return {
        width: sourceImg.naturalWidth,
        height: sourceImg.naturalHeight
      };
    }
  }

  return fitPetriPreviewImageSize(280, 165);
}

function fitPetriPreviewImageSize(naturalWidth, naturalHeight) {
  const maxW = Math.min(280, window.innerWidth * 0.72);
  const maxH = Math.min(220, window.innerHeight * 0.42);
  let width = naturalWidth;
  let height = naturalHeight;

  if (width > maxW) {
    height = height * (maxW / width);
    width = maxW;
  }

  if (height > maxH) {
    width = width * (maxH / height);
    height = maxH;
  }

  return {
    width: Math.max(24, width),
    height: Math.max(24, height)
  };
}

function loadPetriFloodImageDisplaySize(src) {
  return new Promise(function (resolve) {
    const img = new Image();

    img.onload = function () {
      resolve(
        fitPetriPreviewImageSize(
          img.naturalWidth || 280,
          img.naturalHeight || 165
        )
      );
    };

    img.onerror = function () {
      resolve(fitPetriPreviewImageSize(220, 165));
    };

    img.src = src;
  });
}

function buildPetriImageLineCoverPlacements(bounds, imageSize) {
  const lines = collectPetriFloodLineRects(bounds);
  const tileGap = 4;
  const tileWidth = imageSize.width + tileGap;
  const placements = [];

  lines.forEach(function (line, lineIndex) {
    let x = line.left;
    let tileIndex = 0;
    const top =
      line.top + Math.max(0, (line.height - imageSize.height) * 0.5);

    while (x + imageSize.width * 0.35 < line.left + line.width) {
      placements.push({
        left: x,
        top: top,
        width: imageSize.width,
        height: imageSize.height,
        lineIndex: lineIndex,
        tileIndex: tileIndex,
        opacity: 1
      });

      x += tileWidth;
      tileIndex += 1;
    }
  });

  return placements;
}

function spawnPetriLineCoverPlacements(sourceEl, placements, createClone) {
  if (!placements.length) {
    return;
  }

  const lineCount =
    placements[placements.length - 1].lineIndex + 1;
  const lineStepMs = PETRI_TEXT_LINE_COVER_MS / Math.max(1, lineCount);

  placements.forEach(function (placement) {
    const delay =
      placement.lineIndex * lineStepMs + placement.tileIndex * 18;

    window.setTimeout(function () {
      createClone(placement);
    }, Math.round(delay));
  });
}

function spawnPetriDishImageLineCover(sourceEl, src, imageSize) {
  const bounds = getPetriFloodBounds();

  if (!bounds || !src) {
    return;
  }

  const placements = buildPetriImageLineCoverPlacements(bounds, imageSize);

  spawnPetriLineCoverPlacements(sourceEl, placements, function (placement) {
    createPetriFloodImageClone(sourceEl, placement, src);
  });
}

function getPetriFloodLayer() {
  const helloSection = document.getElementById("hello");

  if (!helloSection) {
    return document.body;
  }

  let layer = helloSection.querySelector(".petri-dish-flood-layer");

  if (!layer) {
    layer = document.createElement("div");
    layer.className = "petri-dish-flood-layer";
    layer.setAttribute("aria-hidden", "true");
    helloSection.appendChild(layer);
  }

  return layer;
}

function applyPetriFloodSourceStyle(clone, sourceCell) {
  clearCloneWordArtStyle(clone);

  const appearanceBtn = sourceCell.closest(".wiki-appearance-btn");
  const styleSource = appearanceBtn || sourceCell;
  const textStyles = window.getComputedStyle(sourceCell);
  const boxStyles = window.getComputedStyle(styleSource);

  clone.style.fontFamily = textStyles.fontFamily;
  clone.style.fontSize = textStyles.fontSize;
  clone.style.fontWeight = textStyles.fontWeight;
  clone.style.fontStyle = textStyles.fontStyle;
  clone.style.letterSpacing = textStyles.letterSpacing;
  clone.style.textTransform = textStyles.textTransform;
  clone.style.lineHeight = textStyles.lineHeight;
  clone.style.color = textStyles.color;
  clone.style.textDecoration = textStyles.textDecoration;
  clone.style.webkitTextStroke = "";
  clone.style.webkitTextFillColor = "";
  clone.style.background = "";
  clone.style.backgroundClip = "";
  clone.style.filter = "";
  clone.style.transform = "";
  clone.style.writingMode = "";
  clone.style.textOrientation = "";
  clone.style.textShadow = "";

  if (appearanceBtn) {
    clone.classList.add("petri-flood-clone--appearance");
    clone.style.background = boxStyles.backgroundColor;
    clone.style.border = boxStyles.border;
    clone.style.borderRadius = boxStyles.borderRadius;
    clone.style.padding = boxStyles.padding;
  }
}

function createPetriFloodTextClone(sourceCell, placement) {
  const sourceId = assignPetriSourceId(sourceCell);
  const clone = document.createElement("span");

  clone.className = "hello-cell petri-flood-clone petri-flood-clone--line";
  clone.textContent = sourceCell.textContent;
  clone.dataset.clone = "true";
  clone.dataset.sourceId = sourceId;
  clone.dataset.petriFlood = "true";

  applyPetriFloodSourceStyle(clone, sourceCell);
  applyPetriFloodTransform(clone, placement, { lineText: true });

  getPetriFloodLayer().appendChild(clone);

  return clone;
}

function isSectionThumbImage(img) {
  return !!(
    img &&
    img.closest(".wiki-thumb-image-link[data-section-link]")
  );
}

function createPetriFloodImageClone(sourceEl, placement, srcOverride) {
  const sourceImg = sourceEl instanceof HTMLImageElement ? sourceEl : null;
  const sourceLink = sourceImg
    ? sourceImg.closest(".wiki-thumb-image-link")
    : null;
  const sourceForId = sourceLink || sourceEl;
  const sourceId = assignPetriSourceId(sourceForId);
  const clone = document.createElement("div");
  const img = document.createElement("img");
  const src =
    srcOverride ||
    (sourceImg ? sourceImg.currentSrc || sourceImg.src : "");

  clone.className =
    "petri-flood-clone petri-flood-clone--image petri-flood-clone--line";
  clone.dataset.clone = "true";
  clone.dataset.sourceId = sourceId;
  clone.dataset.petriFlood = "true";

  img.src = src;
  img.alt = "";
  img.draggable = false;

  clone.style.width = placement.width + "px";
  clone.style.height = placement.height + "px";
  applyPetriFloodTransform(clone, placement, { lineText: true });
  clone.appendChild(img);

  getPetriFloodLayer().appendChild(clone);

  return clone;
}

function spawnPetriDishFloodFromCell(sourceCell) {
  if (!sourceCell) {
    return;
  }

  const bounds = getPetriFloodBounds();

  if (!bounds) {
    return;
  }

  const placements = buildPetriTextLineCoverPlacements(sourceCell, bounds);

  spawnPetriLineCoverPlacements(sourceCell, placements, function (placement) {
    createPetriFloodTextClone(sourceCell, placement);
  });
}

function spawnPetriDishFloodFromImage(sourceImg) {
  if (!sourceImg || isSectionThumbImage(sourceImg)) {
    return;
  }

  const src = sourceImg.currentSrc || sourceImg.src;
  const imageSize = resolvePetriFloodImageDisplaySize(sourceImg, src);

  spawnPetriDishImageLineCover(sourceImg, src, imageSize);
}

function spawnPetriDishFloodFromPreviewLink(link) {
  const src = resolveWikiLinkPreviewSrc(link);

  if (!link || !src) {
    return;
  }

  hideWikiLinkPreview();

  loadPetriFloodImageDisplaySize(src).then(function (imageSize) {
    spawnPetriDishImageLineCover(link, src, imageSize);
  });
}

function bindAllHelloCells(root) {
  if (!root) return;

  root.querySelectorAll(".hello-cell").forEach(function (cell) {
    makeHomeCellCloneable(cell);
  });
}

function recallHomeClones() {
  recallWikiLinkPreviews();

  const clones = Array.from(
    document.querySelectorAll(
      ".hello-cell[data-clone='true'], .petri-flood-clone[data-clone='true']"
    )
  );

  if (!clones.length) {
    if (homeRecallClones) {
      homeRecallClones.classList.remove("recall-pulse");
      void homeRecallClones.offsetWidth;
      homeRecallClones.classList.add("recall-pulse");
    }

    return;
  }

  clones.forEach(function (clone) {
    const sourceId = clone.dataset.sourceId;
    const source = sourceId
      ? document.querySelector(`[data-cell-id="${sourceId}"]`)
      : null;

    const cloneRect = clone.getBoundingClientRect();
    const sourceRect = source
      ? source.getBoundingClientRect()
      : cloneRect;

    const cloneCenterX = cloneRect.left + cloneRect.width / 2;
    const cloneCenterY = cloneRect.top + cloneRect.height / 2;
    const sourceCenterX = sourceRect.left + sourceRect.width / 2;
    const sourceCenterY = sourceRect.top + sourceRect.height / 2;

    clone.style.setProperty("--recall-x", sourceCenterX - cloneCenterX + "px");
    clone.style.setProperty("--recall-y", sourceCenterY - cloneCenterY + "px");

    clone.classList.add("is-recalling");

    clone.addEventListener(
      "animationend",
      function () {
        clone.remove();
      },
      { once: true }
    );
  });
}

function initializeWikiCloneContent() {
  document.querySelectorAll(WIKI_CLONE_CONTENT_SELECTOR).forEach(function (root) {
    initializeWikiTextCloning(root);
    bindAllHelloCells(root);
  });
}

if (helloWikiRoot) {
  initializeWikiCloneContent();
  bindWikiThumbLinks(helloWikiRoot);

  helloWikiRoot.addEventListener("click", function (event) {
    if (isPetriDishToolActive()) {
      const articleImg = event.target.closest(".wiki-vector-content img");

      if (
        articleImg &&
        helloWikiRoot.contains(articleImg) &&
        !isSectionThumbImage(articleImg)
      ) {
        event.preventDefault();
        event.stopPropagation();
        spawnPetriDishFloodFromImage(articleImg);
        return;
      }

      const cell = event.target.closest(".hello-cell");

      if (
        cell &&
        helloWikiRoot.contains(cell) &&
        !cell.closest(".wiki-inline-link") &&
        !cell.closest(WIKI_CLONE_SKIP_SELECTOR) &&
        cell.dataset.clone !== "true"
      ) {
        event.preventDefault();
        event.stopPropagation();
        spawnPetriDishFloodFromCell(cell);
      }

      return;
    }

    if (event.target.closest(".wiki-inline-link")) return;

    if (!isSyringeToolActive()) return;

    const cell = event.target.closest(".hello-cell");

    if (!cell || !helloWikiRoot.contains(cell)) return;
    if (cell.closest(WIKI_CLONE_SKIP_SELECTOR)) return;

    event.preventDefault();
    event.stopPropagation();
    createHomeCellClone(cell);
  });
}

const siteGlobalHeader = document.getElementById("siteGlobalHeader");
const siteGlobalHeaderInner = siteGlobalHeader
  ? siteGlobalHeader.querySelector(".wiki-vector-header-inner")
  : null;

function protectWikiSearchControls() {
  const searchButton = document.querySelector(".wiki-search-button");

  if (!searchButton) {
    return;
  }

  const searchCell = searchButton.querySelector(".hello-cell");

  if (searchCell) {
    searchButton.textContent = searchCell.textContent;
  }
}

if (siteGlobalHeaderInner) {
  protectWikiSearchControls();
  initializeWikiTextCloning(siteGlobalHeaderInner);
  bindAllHelloCells(siteGlobalHeaderInner);
}

if (siteGlobalHeader) {
  siteGlobalHeader.addEventListener("click", function (event) {
    if (event.target.closest(".wiki-search-form, .wiki-header-links")) {
      return;
    }

    if (!isSyringeToolActive()) {
      return;
    }

    const cell = event.target.closest(".hello-cell");

    if (!cell || !siteGlobalHeader.contains(cell)) return;
    if (cell.closest(WIKI_CLONE_SKIP_SELECTOR)) return;

    event.preventDefault();
    event.stopPropagation();
    createHomeCellClone(cell);
  });
}

if (homeRecallClones) {
  homeRecallClones.addEventListener("click", function (event) {
    event.stopPropagation();
    recallHomeClones();
  });
}

const helloSection = document.getElementById("hello");
const WIKI_MOBILE_PREVIEW_CLASS = "wiki-mobile-preview-active";
const WIKI_MOBILE_BREAKPOINT = 860;

function syncWikiMobilePreviewState() {
  if (!helloSection) return;

  const shouldUseMobileLayout = window.innerWidth <= WIKI_MOBILE_BREAKPOINT;

  helloSection.classList.toggle(WIKI_MOBILE_PREVIEW_CLASS, shouldUseMobileLayout);
  document.body.classList.toggle(WIKI_MOBILE_PREVIEW_CLASS, shouldUseMobileLayout);

  if (customCursor && !getHelloCursorMode()) {
    customCursor.style.display = "none";
  }
}

if (helloSection) {
  window.addEventListener("resize", syncWikiMobilePreviewState);
  syncWikiMobilePreviewState();
}

syncHelloCustomCursorBodyClass();


/* ===============================
   首页维基目录 / 侧栏滚动
   =============================== */

const wikiMainScroll = document.getElementById("wikiMainScroll");
const wikiTocHide = document.getElementById("wikiTocHide");
const wikiTocNav = document.getElementById("wikiTocNav");
const wikiSearchForm = document.getElementById("wikiSearchForm");
const wikiSearchInput = document.getElementById("wikiSearchInput");

let wikiSearchHighlightTimer = null;
let codenameSearchHighlightTimer = null;

function getActiveSectionId() {
  const activeSection = document.querySelector(".section.active");
  return activeSection ? activeSection.id : "hello";
}

function updateSiteSearchPlaceholder(sectionId) {
  if (!wikiSearchInput) return;

  if (sectionId === "test") {
    wikiSearchInput.placeholder = "Search codename";
    wikiSearchInput.setAttribute("aria-label", "Search codename");
    return;
  }

  wikiSearchInput.placeholder = "Search Cyclopedia";
  wikiSearchInput.setAttribute("aria-label", "Search Cyclopedia");
}

function flashWikiSearchMiss() {
  if (!wikiSearchInput) return;

  wikiSearchInput.classList.remove("wiki-search-miss");
  void wikiSearchInput.offsetWidth;
  wikiSearchInput.classList.add("wiki-search-miss");
}

function normalizeSearchText(text) {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

function isMeaninglessSearchToken(token) {
  const bare = cleanWikiWord(token).toLowerCase();

  if (!bare) return true;
  if (WIKI_SHORT_WORDS.has(bare)) return true;
  if (bare.length <= 2 && !/^[\d.]+$/.test(bare)) return true;

  return false;
}

function getMeaningfulSearchTokens(text) {
  return text
    .trim()
    .split(/\s+/)
    .filter(function (token) {
      return !isMeaninglessSearchToken(token);
    });
}

function clearWikiSearchHighlights() {
  if (!helloWikiRoot) return;

  helloWikiRoot
    .querySelectorAll(".wiki-search-hit")
    .forEach(function (node) {
      node.classList.remove("wiki-search-hit");
    });
}

function flashWikiSearchTarget(target) {
  if (!target) return;

  clearWikiSearchHighlights();
  target.classList.add("wiki-search-hit");

  if (wikiSearchHighlightTimer) {
    clearTimeout(wikiSearchHighlightTimer);
  }

  wikiSearchHighlightTimer = setTimeout(function () {
    target.classList.remove("wiki-search-hit");
  }, 2400);
}

function scrollToWikiSearchTarget(target) {
  if (!target) return;

  if (target.id && wikiMainScroll) {
    scrollWikiSection("#" + target.id);
    return;
  }

  if (wikiMainScroll && wikiMainScroll.contains(target)) {
    const containerTop = wikiMainScroll.getBoundingClientRect().top;
    const targetTop = target.getBoundingClientRect().top;

    wikiMainScroll.scrollTo({
      top: wikiMainScroll.scrollTop + (targetTop - containerTop) - 36,
      behavior: "smooth"
    });
    return;
  }

  if (helloSection && helloSection.classList.contains("wiki-mobile-preview-active")) {
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  target.scrollIntoView({ behavior: "smooth", block: "center" });
}

function scoreWikiSearchMatch(text, queryNorm, queryTokens) {
  const textNorm = normalizeSearchText(text);

  if (!textNorm) return 0;

  const textTokens = getMeaningfulSearchTokens(text);

  if (textTokens.length === 0) return 0;
  if (textNorm === queryNorm) return 120;
  if (textNorm.includes(queryNorm)) return 100;

  if (queryTokens.length === 1) {
    const token = queryTokens[0];

    if (textTokens.some(function (word) {
      return word === token;
    })) {
      return 85;
    }

    if (textTokens.some(function (word) {
      return word.startsWith(token) && token.length >= 3;
    })) {
      return 70;
    }
  }

  if (
    queryTokens.length > 1 &&
    queryTokens.every(function (token) {
      return textTokens.includes(token);
    })
  ) {
    return 90;
  }

  return 0;
}

function findWikiSearchTarget(query) {
  if (!helloWikiRoot) return null;

  const queryNorm = normalizeSearchText(query);

  if (!queryNorm) return null;

  const queryTokens = getMeaningfulSearchTokens(queryNorm);

  if (!queryTokens.length) return null;

  let bestTarget = null;
  let bestScore = 0;

  helloWikiRoot.querySelectorAll(".hello-cell").forEach(function (cell) {
    const text = cell.dataset.cloneText || cell.textContent || "";
    const score = scoreWikiSearchMatch(text, queryNorm, queryTokens);

    if (score > bestScore) {
      bestScore = score;
      bestTarget = cell;
    }
  });

  helloWikiRoot.querySelectorAll(".wiki-heading").forEach(function (heading) {
    const score = scoreWikiSearchMatch(heading.textContent || "", queryNorm, queryTokens);

    if (score > bestScore) {
      bestScore = score;
      bestTarget = heading;
    }
  });

  return bestTarget;
}

function runCyclopediaSearchOnHello(query) {
  if (!helloWikiRoot) return false;

  const target = findWikiSearchTarget(query);

  if (!target) {
    flashWikiSearchMiss();
    return false;
  }

  scrollToWikiSearchTarget(target);
  flashWikiSearchTarget(target);
  return true;
}

function performCyclopediaSearch(query) {
  const currentSectionId = getActiveSectionId();

  if (currentSectionId !== "hello") {
    showSection("hello");

    requestAnimationFrame(function () {
      runCyclopediaSearchOnHello(query);
    });

    return true;
  }

  return runCyclopediaSearchOnHello(query);
}

function scoreCodenameSearchMatch(codename, queryNorm) {
  const codenameNorm = normalizeSearchText(codename);

  if (!codenameNorm || codenameNorm === "anonymous") return 0;
  if (codenameNorm === queryNorm) return 120;
  if (codenameNorm.includes(queryNorm)) return 100;

  if (codenameNorm.startsWith(queryNorm) && queryNorm.length >= 2) {
    return 85;
  }

  return 0;
}

function findCodenameRecordMatch(query) {
  const queryNorm = normalizeSearchText(query);

  if (!queryNorm) return null;

  let bestRecord = null;
  let bestScore = 0;

  latestCybercloneRecords.forEach(function (record) {
    const score = scoreCodenameSearchMatch(record.codename, queryNorm);

    if (score > bestScore) {
      bestScore = score;
      bestRecord = record;
    }
  });

  return bestRecord;
}

function findCodenameSearchItem(query) {
  const queryNorm = normalizeSearchText(query);
  const scene = document.getElementById("cyberflingScene");

  if (!queryNorm || !scene) return null;

  let bestItem = null;
  let bestScore = 0;

  scene.querySelectorAll(".cyberfling-item").forEach(function (item) {
    const score = scoreCodenameSearchMatch(item.dataset.codename || "", queryNorm);

    if (score > bestScore) {
      bestScore = score;
      bestItem = item;
    }
  });

  return bestItem;
}

function clearCodenameSearchHighlights() {
  const scene = document.getElementById("cyberflingScene");

  if (!scene) return;

  scene.querySelectorAll(".codename-search-hit").forEach(function (item) {
    item.classList.remove("codename-search-hit");
  });
}

function buildCodenameSearchRecord(item) {
  if (!item) return null;

  return {
    id: item.dataset.id || "",
    clone_number: Number(item.dataset.cloneNumber || 0),
    level: Number(item.dataset.level || 1),
    codename: item.dataset.codename || "anonymous",
    created_at: item.dataset.createdAt || ""
  };
}

function flashCodenameSearchTarget(item) {
  if (!item) return;

  clearCodenameSearchHighlights();
  item.classList.add("codename-search-hit");

  const gif = item.querySelector(".cyberfling-gif");

  if (gif && gif.dataset.gif) {
    gif.src = gif.dataset.gif + "?t=" + Date.now();
  }

  if (typeof showCybercloneInfoPanel === "function") {
    showCybercloneInfoPanel(buildCodenameSearchRecord(item));
  }

  if (codenameSearchHighlightTimer) {
    clearTimeout(codenameSearchHighlightTimer);
  }

  codenameSearchHighlightTimer = setTimeout(function () {
    item.classList.remove("codename-search-hit");
  }, 3200);
}

function focusCodenameSearchTarget(item) {
  if (!item) return;

  const testSection = document.getElementById("test");

  if (!testSection) return;

  testSection.scrollLeft = 0;

  const itemRect = item.getBoundingClientRect();
  const sectionRect = testSection.getBoundingClientRect();
  const itemCenterY = itemRect.top + itemRect.height / 2;
  const sectionCenterY = sectionRect.top + sectionRect.height / 2;

  testSection.scrollTo({
    top: Math.max(0, testSection.scrollTop + (itemCenterY - sectionCenterY)),
    left: 0,
    behavior: "smooth"
  });
}

async function performCodenameSearch(query) {
  const queryNorm = normalizeSearchText(query);
  const scene = document.getElementById("cyberflingScene");
  const panel = document.getElementById("cybercloneTestPanel");
  const formationButton = document.getElementById("formationToggleButton");
  const testSection = document.getElementById("test");

  if (!queryNorm) {
    flashWikiSearchMiss();
    return false;
  }

  let targetItem = findCodenameSearchItem(query);

  if (!targetItem && scene && scene.classList.contains("field-hidden")) {
    const matchedRecord = findCodenameRecordMatch(query);

    if (matchedRecord) {
      await enterFieldOnly();
      targetItem = findCodenameSearchItem(query);
    }
  }

  if (!targetItem) {
    flashWikiSearchMiss();
    return false;
  }

  if (panel) {
    panel.classList.add("hidden");
  }

  if (scene) {
    scene.classList.remove("field-hidden");
  }

  if (formationButton) {
    formationButton.classList.remove("hidden");
  }

  if (testSection) {
    testSection.scrollLeft = 0;
  }

  focusCodenameSearchTarget(targetItem);
  flashCodenameSearchTarget(targetItem);
  return true;
}

function performSiteSearch(query) {
  if (getActiveSectionId() === "test") {
    return performCodenameSearch(query);
  }

  return performCyclopediaSearch(query);
}

if (wikiSearchForm && wikiSearchInput) {
  wikiSearchForm.addEventListener("submit", function (event) {
    event.preventDefault();
    performSiteSearch(wikiSearchInput.value);
  });
}

function scrollWikiSection(targetSelector) {
  if (!wikiMainScroll) return;

  const target = document.querySelector(targetSelector);

  if (!target) return;

  const containerTop = wikiMainScroll.getBoundingClientRect().top;
  const targetTop = target.getBoundingClientRect().top;
  const nextTop = wikiMainScroll.scrollTop + (targetTop - containerTop) - 10;

  wikiMainScroll.scrollTo({
    top: Math.max(0, nextTop),
    behavior: "smooth"
  });
}

document.querySelectorAll(".wiki-toc-link, .wiki-nav-link").forEach(function (link) {
  link.addEventListener("click", function (event) {
    if (event.target.closest(".hello-cell")) return;

    const href = link.getAttribute("href");

    if (!href || !href.startsWith("#")) return;

    event.preventDefault();
    scrollWikiSection(href);
  });
});

function getWikiPreviewImagePath(index) {
  return assetUrl("images/wiki/show (" + index + ").png");
}

function resolveWikiLinkPreviewSrc(link) {
  if (!link) {
    return "";
  }

  if (link.dataset.preview) {
    return link.dataset.preview;
  }

  const index = parseInt(link.dataset.previewIndex, 10);

  if (!Number.isFinite(index) || index < 1) {
    return "";
  }

  return getWikiPreviewImagePath(index);
}

const wikiLinkPreviewLayer = document.getElementById("wikiLinkPreviewLayer");
const wikiLinkPreview = document.getElementById("wikiLinkPreview");
const wikiLinkPreviewPins = document.getElementById("wikiLinkPreviewPins");
const wikiLinkPreviewImg = wikiLinkPreview
  ? wikiLinkPreview.querySelector("img")
  : null;
const WIKI_PREVIEW_STACK_OFFSET = 14;
let wikiLinkPreviewHoverLink = null;
let wikiLinkPreviewLoadedSrc = "";
let wikiPinnedPreviewCount = 0;

function getWikiPreviewStackIndex() {
  return wikiPinnedPreviewCount;
}

function positionWikiPreviewAtCenter(previewEl, stackIndex) {
  if (!previewEl) {
    return;
  }

  const offset = stackIndex * WIKI_PREVIEW_STACK_OFFSET;
  previewEl.style.left = "50%";
  previewEl.style.top = "50%";
  previewEl.style.transform =
    "translate(calc(-50% + " + offset + "px), calc(-50% + " + offset + "px))";
  previewEl.style.zIndex = String(100 + stackIndex);
}

function hideWikiLinkPreview() {
  if (!wikiLinkPreview) {
    return;
  }

  wikiLinkPreview.classList.add("hidden");
  wikiLinkPreviewHoverLink = null;
}

function showWikiLinkPreview(link) {
  if (!wikiLinkPreview || !wikiLinkPreviewImg || !link) {
    return;
  }

  const src = resolveWikiLinkPreviewSrc(link);

  if (!src) {
    return;
  }

  wikiLinkPreviewHoverLink = link;

  if (wikiLinkPreviewLoadedSrc !== src) {
    wikiLinkPreviewImg.src = src;
    wikiLinkPreviewLoadedSrc = src;
  }

  if (wikiLinkPreviewLayer) {
    wikiLinkPreviewLayer.setAttribute("aria-hidden", "false");
  }

  wikiLinkPreview.classList.remove("hidden");
  positionWikiPreviewAtCenter(wikiLinkPreview, getWikiPreviewStackIndex());

  requestAnimationFrame(function () {
    positionWikiPreviewAtCenter(wikiLinkPreview, getWikiPreviewStackIndex());
  });
}

function appendWikiPreviewPin(src, previewIndex) {
  if (!wikiLinkPreviewPins || !src) {
    return null;
  }

  const stackIndex = wikiPinnedPreviewCount;
  const pinEl = document.createElement("div");
  pinEl.className = "wiki-link-preview wiki-link-preview--pinned";

  if (previewIndex) {
    pinEl.dataset.previewIndex = previewIndex;
  }

  const img = document.createElement("img");
  img.src = src;
  img.alt = "";
  img.draggable = false;
  pinEl.appendChild(img);

  wikiLinkPreviewPins.appendChild(pinEl);
  positionWikiPreviewAtCenter(pinEl, stackIndex);
  wikiPinnedPreviewCount += 1;

  if (wikiLinkPreviewLayer) {
    wikiLinkPreviewLayer.setAttribute("aria-hidden", "false");
  }

  return pinEl;
}

function recallWikiLinkPreviews() {
  hideWikiLinkPreview();
  wikiLinkPreviewLoadedSrc = "";

  if (wikiLinkPreviewPins) {
    wikiLinkPreviewPins.innerHTML = "";
  }

  wikiPinnedPreviewCount = 0;

  if (wikiLinkPreviewLayer) {
    wikiLinkPreviewLayer.setAttribute("aria-hidden", "true");
  }
}

function cloneWikiPreviewPin(sourcePreview) {
  if (!sourcePreview) {
    return;
  }

  const sourceImg = sourcePreview.querySelector("img");

  if (!sourceImg || !sourceImg.src) {
    return;
  }

  appendWikiPreviewPin(sourceImg.src, sourcePreview.dataset.previewIndex || "");
  hideWikiLinkPreview();
}

function pinWikiLinkPreview(link) {
  if (!link) {
    return;
  }

  const src = resolveWikiLinkPreviewSrc(link);

  if (!src) {
    return;
  }

  appendWikiPreviewPin(src, link.dataset.previewIndex || "");
  hideWikiLinkPreview();
}

function initWikiLinkPreviews(root) {
  if (!root || !wikiLinkPreview || !wikiLinkPreviewImg) {
    return;
  }

  root
    .querySelectorAll(".wiki-inline-link[data-preview], .wiki-inline-link[data-preview-index]")
    .forEach(function (link) {
    if (link.dataset.previewBound === "true") {
      return;
    }

    link.dataset.previewBound = "true";

    link.addEventListener("mouseenter", function () {
      showWikiLinkPreview(link);
    });

    link.addEventListener("mouseleave", function () {
      hideWikiLinkPreview();
    });

    link.addEventListener("focus", function () {
      showWikiLinkPreview(link);
    });

    link.addEventListener("blur", function () {
      hideWikiLinkPreview();
    });

    link.addEventListener("click", function (event) {
      event.preventDefault();

      if (isPetriDishToolActive()) {
        event.stopPropagation();
        spawnPetriDishFloodFromPreviewLink(link);
        return;
      }

      pinWikiLinkPreview(link);
    });
  });
}

if (wikiMainScroll) {
  initWikiLinkPreviews(wikiMainScroll);
}

if (wikiLinkPreviewLayer) {
  wikiLinkPreviewLayer.addEventListener(
    "click",
    function (event) {
      if (!isSyringeToolActive()) {
        return;
      }

      const preview = event.target.closest(
        ".wiki-link-preview--pinned, .wiki-link-preview--hover"
      );

      if (!preview || preview.classList.contains("hidden")) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      cloneWikiPreviewPin(preview);
    },
    true
  );
}

syncLabToolBodyClass();

if (wikiTocHide && wikiTocNav) {
  wikiTocHide.addEventListener("click", function (event) {
    if (event.target.closest(".hello-cell")) return;

    const isHidden = wikiTocNav.classList.toggle("wiki-toc-nav--hidden");
    wikiTocHide.textContent = isHidden ? "show" : "hide";
    initializeWikiTextCloning(wikiTocHide);
    bindAllHelloCells(wikiTocHide);
  });
}

const wikiVector = document.querySelector("#hello .wiki-vector");
const wikiAppearanceButtons = document.querySelectorAll(".wiki-appearance-btn");

wikiAppearanceButtons.forEach(function (button) {
  button.addEventListener("click", function (event) {
    if (event.target.closest(".hello-cell")) return;
    if (!wikiVector) return;

    const group = button.closest(".wiki-appearance-group");
    const label = group
      ? group.querySelector(".wiki-appearance-label")
      : null;

    group
      .querySelectorAll(".wiki-appearance-btn")
      .forEach(function (item) {
        item.classList.remove("wiki-appearance-btn--active");
      });

    button.classList.add("wiki-appearance-btn--active");

    if (!label) return;

    if (label.textContent === "Text") {
      wikiVector.classList.remove("wiki-text-small", "wiki-text-large");

      if (button.textContent === "Small") {
        wikiVector.classList.add("wiki-text-small");
      } else if (button.textContent === "Large") {
        wikiVector.classList.add("wiki-text-large");
      }
    }

    if (label.textContent === "Width") {
      wikiVector.classList.toggle("wiki-width-wide", button.textContent === "Wide");
    }
  });
});

resetHomeGridView();

/* ===============================
   通用 3D 工具
   =============================== */

const loader = new GLTFLoader();


/* ===============================
   3D 实验室
   =============================== */

const labCanvas = document.getElementById("labCanvas");

const labScene = new THREE.Scene();
labScene.background = null;

const labCamera = new THREE.PerspectiveCamera(42, 1, 0.1, 1000);
labCamera.position.set(0, 7, 26);

let labRenderer = null;

try {
  labRenderer = new THREE.WebGLRenderer({
    canvas: labCanvas,
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true,
    premultipliedAlpha: false
  });

  labRenderer.setPixelRatio(window.devicePixelRatio);
  labRenderer.setClearColor(0x000000, 0);
  labRenderer.autoClear = true;
} catch (error) {
  console.warn("Lab WebGL renderer unavailable:", error);
}

labScene.add(new THREE.AmbientLight("#ffffff", 1.2));

const labDirectionalLight1 = new THREE.DirectionalLight("#ffffff", 3.2);
labDirectionalLight1.position.set(8, 12, 10);
labScene.add(labDirectionalLight1);

const labDirectionalLight2 = new THREE.DirectionalLight("#ffffff", 1.6);
labDirectionalLight2.position.set(-10, 4, -6);
labScene.add(labDirectionalLight2);

const labPointLight1 = new THREE.PointLight("#ffffff", 4.2);
labPointLight1.position.set(0, 8, 8);
labScene.add(labPointLight1);

const labPointLight2 = new THREE.PointLight("#66ff99", 3.2);
labPointLight2.position.set(0, 2, 0);
labScene.add(labPointLight2);

let labModel = null;

let labTargetCameraPosition = new THREE.Vector3(0, 7, 26);
let labTargetLookAt = new THREE.Vector3(0, 0, 0);
let labCurrentLookAt = new THREE.Vector3(0, 0, 0);

loader.load(
  LAB_MODEL_PATH,

  function (gltf) {
    labModel = gltf.scene;

    labModel.position.set(0, -2.6, 0);
    labModel.scale.setScalar(8.5);

    labModel.traverse(function (object) {
      object.frustumCulled = false;
    });

    labScene.add(labModel);
    console.log("lab.gltf 加载成功");

    resizeAllCanvases();
  },

  undefined,

  function (error) {
    console.error("lab.gltf 加载失败：", error);
  }
);

document.querySelectorAll(".lab-arrow").forEach(function (button) {
  button.addEventListener("click", function () {
    const targetName = button.dataset.target;
    moveLabCameraTo(targetName);
  });
});

function moveLabCameraTo(targetName) {
  if (!labModel) {
    console.warn("lab.gltf 还没加载完成");
    return;
  }

  const targetObject = labModel.getObjectByName(targetName);
  const worldPosition = new THREE.Vector3();

  if (targetObject) {
    targetObject.getWorldPosition(worldPosition);
  } else {
    console.warn("模型中没有找到对象：", targetName);
    worldPosition.set(0, 0, 0);
  }

  const offsetMap = {
    Microscope: new THREE.Vector3(0, 2.8, 6.8),
    Phone: new THREE.Vector3(0, 2.4, 6.2),
    Iphone: new THREE.Vector3(0, 2.4, 6.2),
    CloneCabinet: new THREE.Vector3(0, 3.2, 7.8),
    SpecimenBox: new THREE.Vector3(0, 2.5, 6.5)
  };

  const offset = offsetMap[targetName] || new THREE.Vector3(0, 2.8, 7);

  labTargetCameraPosition = worldPosition.clone().add(offset);
  labTargetLookAt = worldPosition.clone();
}

function snapLabCameraView() {
  labCamera.position.copy(labTargetCameraPosition);
  labCurrentLookAt.copy(labTargetLookAt);
  labCamera.lookAt(labCurrentLookAt);
}

function animateLab() {
  requestAnimationFrame(animateLab);

  if (!labRenderer) return;

  labCamera.position.lerp(labTargetCameraPosition, 0.08);
  labCurrentLookAt.lerp(labTargetLookAt, 0.09);
  labCamera.lookAt(labCurrentLookAt);

  labRenderer.render(labScene, labCamera);
}

animateLab();


/* ===============================
   Statement：Matter.js 物理手机
   =============================== */

const statementPhysicsStage = document.getElementById("statementPhysicsStage");

let statementEngine = null;
let statementAnimationFrame = null;
let statementDropTimers = [];
let statementPhoneObjects = [];
let activePhysicsPhone = null;

let pinnedPhoneZIndex = 6000;

const STATEMENT_PHONE_COUNT = 32;
const PHONE_PDF_SRC =
  assetUrl("files/statement.pdf") + "#toolbar=0&navpanes=0&scrollbar=1";

function createPhonePdfFrame(index) {
  const pdfFrame = document.createElement("iframe");

  pdfFrame.className = "phone-pdf";
  pdfFrame.src = PHONE_PDF_SRC;
  pdfFrame.title = "Cyberclone Statement PDF " + index;

  return pdfFrame;
}

function attachPdfToPhone(phoneElement) {
  const screen = phoneElement.querySelector(".phone-screen");

  if (!screen) return;

  if (phoneElement.dataset.pdfAttached === "true") {
    return;
  }

  const index = phoneElement.dataset.index || "";
  const pdfFrame = createPhonePdfFrame(index);

  screen.appendChild(pdfFrame);
  phoneElement.dataset.pdfAttached = "true";
}

function bringPinnedPhoneToFront(phoneElement) {
  pinnedPhoneZIndex += 1;

  statementPhysicsStage
    .querySelectorAll(".physics-phone.reading")
    .forEach(function (item) {
      item.classList.remove("reading");
    });

  phoneElement.classList.add("reading");
  phoneElement.style.zIndex = String(pinnedPhoneZIndex);
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function stopStatementPhysics() {
  statementDropTimers.forEach(function (timer) {
    clearTimeout(timer);
  });

  statementDropTimers = [];

  if (statementAnimationFrame) {
    cancelAnimationFrame(statementAnimationFrame);
    statementAnimationFrame = null;
  }

  if (statementEngine && window.Matter) {
    window.Matter.World.clear(statementEngine.world, false);
    window.Matter.Engine.clear(statementEngine);
  }

  statementEngine = null;
  statementPhoneObjects = [];
  activePhysicsPhone = null;
  pinnedPhoneZIndex = 6000;

  if (statementPhysicsStage) {
    statementPhysicsStage.innerHTML = "";
  }
}

function restartStatementPhysics() {
  stopStatementPhysics();

  if (!statementPhysicsStage) return;

  requestAnimationFrame(function () {
    buildStatementPhysics();
  });
}

function buildStatementPhysics() {
  if (!statementPhysicsStage) return;

  const MatterLib = window.Matter;

  if (!MatterLib) {
    console.error("Matter.js 没有加载成功。检查 index.html 里 Matter.js 的 script。");
    return;
  }

  const Engine = MatterLib.Engine;
  const World = MatterLib.World;
  const Bodies = MatterLib.Bodies;

  const rect = statementPhysicsStage.getBoundingClientRect();
  const stageWidth = rect.width || window.innerWidth;
  const stageHeight = rect.height || window.innerHeight - 50;

  statementPhysicsStage.innerHTML = "";
  statementPhoneObjects = [];
  activePhysicsPhone = null;
  pinnedPhoneZIndex = 6000;

  statementEngine = Engine.create({
    enableSleeping: true
  });

  statementEngine.gravity.x = 0;
  statementEngine.gravity.y = 1.15;

  const floorY = stageHeight - 86;

  const floor = Bodies.rectangle(
    stageWidth / 2,
    floorY + 40,
    stageWidth + 240,
    80,
    {
      isStatic: true,
      friction: 1,
      restitution: 0
    }
  );

  const leftWall = Bodies.rectangle(
    12,
    stageHeight / 2,
    24,
    stageHeight * 2,
    {
      isStatic: true,
      friction: 1,
      restitution: 0.02
    }
  );

  const rightWall = Bodies.rectangle(
    stageWidth - 12,
    stageHeight / 2,
    24,
    stageHeight * 2,
    {
      isStatic: true,
      friction: 1,
      restitution: 0.02
    }
  );

  const ceiling = Bodies.rectangle(
    stageWidth / 2,
    -260,
    stageWidth + 400,
    40,
    {
      isStatic: true
    }
  );

  World.add(statementEngine.world, [
    floor,
    leftWall,
    rightWall,
    ceiling
  ]);

  for (let i = 0; i < STATEMENT_PHONE_COUNT; i++) {
    const timer = setTimeout(function () {
      spawnPhysicsPhone(i, stageWidth, stageHeight, floorY);
    }, i * 145);

    statementDropTimers.push(timer);
  }

  animateStatementPhysics();
}

function spawnPhysicsPhone(index, stageWidth, stageHeight, floorY) {
  if (!statementEngine || !statementPhysicsStage || !window.Matter) return;

  const MatterLib = window.Matter;
  const Bodies = MatterLib.Bodies;
  const Body = MatterLib.Body;
  const World = MatterLib.World;

  const phoneWidth = 700;
  const phoneThickness = 40;
  const phoneFaceHeight = 1900;

  const safeXMin = phoneWidth / 2 + 38;
  const safeXMax = Math.max(safeXMin + 10, stageWidth - phoneWidth / 2 - 38);

  const startX = randomBetween(safeXMin, safeXMax);
  const startY = randomBetween(-360, -80);

  const body = Bodies.rectangle(
    startX,
    startY,
    phoneWidth,
    phoneThickness,
    {
      chamfer: {
        radius: phoneThickness / 2
      },
      restitution: 0.11,
      friction: 0.92,
      frictionStatic: 0.95,
      frictionAir: 0.012,
      density: 0.0022,
      sleepThreshold: 48
    }
  );

  Body.setAngle(body, randomBetween(-0.28, 0.28));
  Body.setVelocity(body, {
    x: randomBetween(-1.6, 1.6),
    y: randomBetween(0.2, 2.2)
  });
  Body.setAngularVelocity(body, randomBetween(-0.055, 0.055));

  World.add(statementEngine.world, body);

  const phoneElement = document.createElement("div");

  phoneElement.className = "physics-phone";
  phoneElement.dataset.index = String(index);
  phoneElement.dataset.pdfAttached = "false";
  phoneElement.tabIndex = 0;

  phoneElement.style.setProperty("--phone-width", `${phoneWidth}px`);
  phoneElement.style.setProperty("--phone-thickness", `${phoneThickness}px`);
  phoneElement.style.setProperty("--phone-face-height", `${phoneFaceHeight}px`);

  phoneElement.innerHTML = `
    <span class="phone-object">
      <span class="phone-side">
        <span class="phone-mute"></span>
        <span class="phone-volume-one"></span>
        <span class="phone-volume-two"></span>
        <span class="phone-port"></span>
      </span>

      <span class="phone-face">
        <span class="phone-screen"></span>
        <span class="phone-speaker"></span>
        <span class="phone-camera"></span>
        <span class="phone-glass"></span>
      </span>
    </span>
  `;

  phoneElement.addEventListener("click", function (event) {
    event.stopPropagation();
    pinPhysicsPhone(body, phoneElement);
  });

  statementPhysicsStage.appendChild(phoneElement);

  statementPhoneObjects.push({
    body: body,
    element: phoneElement,
    width: phoneWidth,
    thickness: phoneThickness,
    faceHeight: phoneFaceHeight
  });

  requestAnimationFrame(function () {
    phoneElement.classList.add("visible");
  });
}

function pinPhysicsPhone(body, element) {
  if (!window.Matter) return;

  const Body = window.Matter.Body;

  Body.setVelocity(body, { x: 0, y: 0 });
  Body.setAngularVelocity(body, 0);
  Body.setStatic(body, true);

  element.classList.add("pinned");

  attachPdfToPhone(element);
  bringPinnedPhoneToFront(element);

  activePhysicsPhone = {
    body: body,
    element: element
  };
}

function animateStatementPhysics() {
  if (!statementEngine || !statementPhysicsStage || !window.Matter) return;

  const Engine = window.Matter.Engine;

  Engine.update(statementEngine, 1000 / 60);

  statementPhoneObjects.forEach(function (item) {
    const body = item.body;
    const element = item.element;

    const x = body.position.x;
    const y = body.position.y;
    const angle = body.angle;

    element.style.transform =
      `translate(${x}px, ${y}px) translate(-50%, -50%) rotate(${angle}rad)`;

    if (!element.classList.contains("pinned")) {
      element.style.zIndex = String(100 + Math.floor(y));
    }
  });

  statementAnimationFrame = requestAnimationFrame(animateStatementPhysics);
}


/* ===============================
   Cyberclone Archive
   =============================== */

const archiveFileInput = document.getElementById("archiveFileInput");
const archiveGrid = document.getElementById("archiveGrid");
const archivePreviewOverlay = document.getElementById("archivePreviewOverlay");
const archivePreviewContent = document.getElementById("archivePreviewContent");
const archivePreviewClose = document.getElementById("archivePreviewClose");

const ARCHIVE_DB_NAME = "CybercloneArchiveDB";
const ARCHIVE_DB_VERSION = 2;
const ARCHIVE_STORE_NAME = "archiveFiles";

const MAX_IMAGE_WIDTH = 1400;
const IMAGE_QUALITY = 0.78;
const MAX_GIF_SIZE_MB = 18;

let archiveDB = null;

function openArchiveDB() {
  return new Promise(function (resolve, reject) {
    const request = indexedDB.open(ARCHIVE_DB_NAME, ARCHIVE_DB_VERSION);

    request.onupgradeneeded = function (event) {
      const db = event.target.result;

      if (!db.objectStoreNames.contains(ARCHIVE_STORE_NAME)) {
        const store = db.createObjectStore(ARCHIVE_STORE_NAME, {
          keyPath: "id",
          autoIncrement: true
        });

        store.createIndex("createdAt", "createdAt", {
          unique: false
        });
      }
    };

    request.onsuccess = function (event) {
      archiveDB = event.target.result;
      resolve(archiveDB);
    };

    request.onerror = function () {
      reject(request.error);
    };
  });
}

function compressImageFile(file) {
  return new Promise(function (resolve, reject) {
    const imageURL = URL.createObjectURL(file);
    const img = new Image();

    img.onload = function () {
      const originalWidth = img.naturalWidth;
      const originalHeight = img.naturalHeight;

      let targetWidth = originalWidth;
      let targetHeight = originalHeight;

      if (originalWidth > MAX_IMAGE_WIDTH) {
        targetWidth = MAX_IMAGE_WIDTH;
        targetHeight = Math.round((originalHeight / originalWidth) * targetWidth);
      }

      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      canvas.toBlob(
        function (blob) {
          URL.revokeObjectURL(imageURL);

          if (!blob) {
            reject(new Error("Image compression failed."));
            return;
          }

          const compressedFile = new File(
            [blob],
            file.name.replace(/\.[^/.]+$/, "") + ".jpg",
            {
              type: "image/jpeg",
              lastModified: Date.now()
            }
          );

          resolve(compressedFile);
        },
        "image/jpeg",
        IMAGE_QUALITY
      );
    };

    img.onerror = function () {
      URL.revokeObjectURL(imageURL);
      reject(new Error("Image load failed."));
    };

    img.src = imageURL;
  });
}

function saveArchiveFile(file) {
  return new Promise(function (resolve, reject) {
    if (!archiveDB) {
      reject(new Error("Archive DB is not open."));
      return;
    }

    const transaction = archiveDB.transaction(ARCHIVE_STORE_NAME, "readwrite");
    const store = transaction.objectStore(ARCHIVE_STORE_NAME);

    const record = {
      name: file.name,
      type: file.type || "application/octet-stream",
      blob: file,
      createdAt: Date.now()
    };

    const request = store.add(record);

    request.onsuccess = function () {
      record.id = request.result;
      resolve(record);
    };

    request.onerror = function () {
      reject(request.error);
    };
  });
}

function loadArchiveFiles() {
  return new Promise(function (resolve, reject) {
    if (!archiveDB) {
      reject(new Error("Archive DB is not open."));
      return;
    }

    const transaction = archiveDB.transaction(ARCHIVE_STORE_NAME, "readonly");
    const store = transaction.objectStore(ARCHIVE_STORE_NAME);
    const request = store.getAll();

    request.onsuccess = function () {
      const records = request.result || [];

      records.sort(function (a, b) {
        return a.createdAt - b.createdAt;
      });

      resolve(records);
    };

    request.onerror = function () {
      reject(request.error);
    };
  });
}

function createArchiveItemFromRecord(record) {
  if (!archiveGrid || !record || !record.blob) return;

  const fileURL = URL.createObjectURL(record.blob);

  const item = document.createElement("div");
  item.className = "archive-item";
  item.dataset.archiveId = record.id || "";

  let mediaElement;

  if (record.type.startsWith("video/")) {
    mediaElement = document.createElement("video");
    mediaElement.src = fileURL;
    mediaElement.muted = true;
    mediaElement.loop = true;
    mediaElement.playsInline = true;
    mediaElement.autoplay = true;
    mediaElement.controls = false;
  } else {
    mediaElement = document.createElement("img");
    mediaElement.src = fileURL;
    mediaElement.alt = record.name || "";
  }

  mediaElement.dataset.fullSrc = fileURL;
  mediaElement.dataset.fileType = record.type;
  mediaElement.dataset.fileName = record.name || "";

  item.appendChild(mediaElement);
  archiveGrid.appendChild(item);

  item.addEventListener("click", function () {
    openArchivePreview(fileURL, record.type, record.name);
  });
}

function createTemporaryVideoItem(file) {
  if (!archiveGrid) return;

  const fileURL = URL.createObjectURL(file);

  const item = document.createElement("div");
  item.className = "archive-item archive-item-temporary";

  const video = document.createElement("video");
  video.src = fileURL;
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.autoplay = true;
  video.controls = false;

  item.appendChild(video);
  archiveGrid.appendChild(item);

  item.addEventListener("click", function () {
    openArchivePreview(fileURL, file.type, file.name);
  });
}

function openArchivePreview(src, fileType, fileName) {
  if (!archivePreviewOverlay || !archivePreviewContent) return;

  archivePreviewContent.innerHTML = "";

  let previewElement;

  if (fileType.startsWith("video/")) {
    previewElement = document.createElement("video");
    previewElement.src = src;
    previewElement.controls = true;
    previewElement.autoplay = true;
    previewElement.loop = true;
    previewElement.playsInline = true;
  } else {
    previewElement = document.createElement("img");
    previewElement.src = src;
    previewElement.alt = fileName || "";
  }

  archivePreviewContent.appendChild(previewElement);
  archivePreviewOverlay.classList.remove("hidden");
}

function closeArchivePreview() {
  if (!archivePreviewOverlay || !archivePreviewContent) return;

  archivePreviewOverlay.classList.add("hidden");
  archivePreviewContent.innerHTML = "";
}

async function handleArchiveFile(file) {
  const fileName = file.name.toLowerCase();
  const fileSizeMB = file.size / 1024 / 1024;

  const isGif = file.type === "image/gif" || fileName.endsWith(".gif");
  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");

  if (isVideo) {
    createTemporaryVideoItem(file);
    alert("视频已显示，但不会保存。刷新页面后视频会消失。");
    return;
  }

  if (isGif) {
    if (fileSizeMB > MAX_GIF_SIZE_MB) {
      alert("这个 GIF 太大了，没有保存。建议压缩到 " + MAX_GIF_SIZE_MB + "MB 以下。");
      return;
    }

    try {
      const record = await saveArchiveFile(file);
      createArchiveItemFromRecord(record);
    } catch (error) {
      console.error("GIF save failed:", error);
      alert("GIF 没有保存成功，可能是浏览器本地存储空间满了。");
    }

    return;
  }

  if (isImage) {
    try {
      const compressedFile = await compressImageFile(file);
      const record = await saveArchiveFile(compressedFile);
      createArchiveItemFromRecord(record);
    } catch (error) {
      console.error("Image save failed:", error);
      alert("图片没有保存成功，可能是文件太大或浏览器本地存储空间满了。");
    }

    return;
  }

  alert("这个文件格式不支持。");
}

async function initializeArchive() {
  try {
    await openArchiveDB();

    const records = await loadArchiveFiles();

    records.forEach(function (record) {
      createArchiveItemFromRecord(record);
    });

    console.log("Archive IndexedDB loaded with compressed image support.");
  } catch (error) {
    console.error("Archive IndexedDB failed:", error);
  }
}

if (archiveFileInput) {
  archiveFileInput.addEventListener("change", async function (event) {
    const files = Array.from(event.target.files || []);

    for (const file of files) {
      await handleArchiveFile(file);
    }

    archiveFileInput.value = "";
  });
}

if (archivePreviewClose) {
  archivePreviewClose.addEventListener("click", function (event) {
    event.stopPropagation();
    closeArchivePreview();
  });
}

if (archivePreviewOverlay) {
  archivePreviewOverlay.addEventListener("click", function (event) {
    if (event.target === archivePreviewOverlay) {
      closeArchivePreview();
    }
  });
}

window.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    closeArchivePreview();
  }
});

initializeArchive();


/* ===============================
   第四部分：Cyberclone Test + Supabase Field
   =============================== */

const CYBERCLONE_ASSETS = [
  { gifName: "cyberclone-01.gif", gif: assetUrl("images/cyberclone-01.gif"), still: assetUrl("images/1_0000.png") },
  { gifName: "cyberclone-02.gif", gif: assetUrl("images/cyberclone-02.gif"), still: assetUrl("images/2_0000.png") },
  { gifName: "cyberclone-03.gif", gif: assetUrl("images/cyberclone-03.gif"), still: assetUrl("images/3_0030.png") },
  { gifName: "cyberclone-04.gif", gif: assetUrl("images/cyberclone-04.gif"), still: assetUrl("images/4_0010.png") },
  { gifName: "cyberclone-05.gif", gif: assetUrl("images/cyberclone-05.gif"), still: assetUrl("images/5_0010.png") },
  { gifName: "cyberclone-06.gif", gif: assetUrl("images/cyberclone-06.gif"), still: assetUrl("images/6_0050.png") },
  { gifName: "cyberclone-07.gif", gif: assetUrl("images/cyberclone-07.gif"), still: assetUrl("images/7_0030.png") },
  { gifName: "cyberclone-08.gif", gif: assetUrl("images/cyberclone-08.gif"), still: assetUrl("images/8_0020.png") }
];

const CYBERCLONE_QUESTIONS = [
  "Do you use memes to express your emotions?",
  "Have you ever repeated a phrase because it became popular online?",
  "Have you ever copied a pose, face, filter, or gesture from the internet?",
  "Have you ever joined a trend even when you did not fully understand it?",
  "Do memes affect the way you see yourself or other people?"
];

const CYBERCLONE_TEST_ASSETS = CYBERCLONE_ASSETS.slice(0, 5);

const CYBERCLONE_AD_STEPS = [
  { phase: "intro", layout: "layout-intro", labelText: "Advertisement", closePos: "top" },
  { phase: "question", layout: "layout-1", questionIndex: 0, labelText: "Advertisement", closePos: "top" },
  { phase: "question", layout: "layout-2", questionIndex: 1, labelText: "Sponsored", labelAlign: "left", closePos: "top" },
  { phase: "question", layout: "layout-3", questionIndex: 2, labelText: "Ad", labelAlign: "right", closePos: "bottom" },
  { phase: "question", layout: "layout-4", questionIndex: 3, labelText: "ADVERTISEMENT", labelAlign: "right", closePos: "top" },
  { phase: "question", layout: "layout-5", questionIndex: 4, labelText: "advertisement", labelAlign: "minimal", closePos: "bottom" },
  { phase: "result", layout: "layout-result", labelText: "Advertisement", closePos: "top" },
  { phase: "book", layout: "layout-book", labelText: "", closePos: "top", closeStyle: "pink" }
];

const cybercloneAdLabel = document.getElementById("cybercloneAdLabel");

const cybercloneTestPanel = document.getElementById("cybercloneTestPanel");
const cybercloneAdOverlay = document.getElementById("cybercloneAdOverlay");
const cybercloneAdPopup = document.getElementById("cybercloneAdPopup");
const cybercloneAdClose = document.getElementById("cybercloneAdClose");
const cybercloneAdCloseHint = document.getElementById("cybercloneAdCloseHint");
const cybercloneAdMeta = document.getElementById("cybercloneAdMeta");
const cybercloneAdHeadline = document.getElementById("cybercloneAdHeadline");
const cybercloneAdSubtext = document.getElementById("cybercloneAdSubtext");
const cybercloneAdVisual = document.getElementById("cybercloneAdVisual");
const cybercloneAdVisualImage = document.getElementById("cybercloneAdVisualImage");
const cybercloneAdVisualTag = document.getElementById("cybercloneAdVisualTag");
const cybercloneAdVisualCaption = document.getElementById("cybercloneAdVisualCaption");
const cybercloneAdIntroExtra = document.getElementById("cybercloneAdIntroExtra");
const cybercloneAdStandardLayout = document.getElementById("cybercloneAdStandardLayout");
const cybercloneAdResultLayout = document.getElementById("cybercloneAdResultLayout");
const cybercloneAdBookLayout = document.getElementById("cybercloneAdBookLayout");
const cybercloneAdBookPreview = document.getElementById("cybercloneAdBookPreview");
const cybercloneAdNav = document.getElementById("cybercloneAdNav");
const cybercloneAdNavPrev = document.getElementById("cybercloneAdNavPrev");
const cybercloneAdNavNext = document.getElementById("cybercloneAdNavNext");
const cybercloneAdResultGreeting = document.getElementById("cybercloneAdResultGreeting");
const cybercloneAdResultLevel = document.getElementById("cybercloneAdResultLevel");
const cybercloneAdActionsIntro = document.getElementById("cybercloneAdActionsIntro");
const cybercloneAdActionsQuestion = document.getElementById("cybercloneAdActionsQuestion");
const cybercloneAdActionsResult = document.getElementById("cybercloneAdActionsResult");

const cybercloneCodenameInput = document.getElementById("cybercloneCodenameInput");
const startCybercloneTest = document.getElementById("startCybercloneTest");
const cybercloneYesButton = document.getElementById("cybercloneYesButton");
const cybercloneNoButton = document.getElementById("cybercloneNoButton");

const cybercloneResultSpecimen = document.getElementById("cybercloneResultSpecimen");
const cybercloneResultImage = document.getElementById("cybercloneResultImage");
const cybercloneResultText = document.getElementById("cybercloneResultText");

const downloadCyberclonePdf = document.getElementById("downloadCyberclonePdf");
const releaseCybercloneField = document.getElementById("releaseCybercloneField");
const restartCybercloneTest = document.getElementById("restartCybercloneTest");
const cyberflingScene = document.getElementById("cyberflingScene");
const cybercloneInfoPanel = document.getElementById("cybercloneInfoPanel");
const formationToggleButton = document.getElementById("formationToggleButton");

let currentCybercloneQuestion = 0;
let cybercloneAdStep = 0;
let cybercloneAdMaxReached = 0;
let cybercloneAnswers = [null, null, null, null, null];
let cybercloneResultPrepared = false;
let cybercloneScore = 0;
let generatedCybercloneAsset = null;
let generatedCybercloneLevel = 0;
let generatedCybercloneCodename = "anonymous";
let generatedCybercloneNumber = 0;
let formationMode = false;
let latestCybercloneRecords = [];
let cybercloneAdTransitionTimer = null;
let cybercloneAdCloseHintTimer = null;
let cybercloneAdAnswering = false;

function clearCybercloneAdTimers() {
  if (cybercloneAdTransitionTimer) {
    window.clearTimeout(cybercloneAdTransitionTimer);
    cybercloneAdTransitionTimer = null;
  }

  if (cybercloneAdCloseHintTimer) {
    window.clearTimeout(cybercloneAdCloseHintTimer);
    cybercloneAdCloseHintTimer = null;
  }
}

function setCybercloneAdActionGroup(phase) {
  if (cybercloneAdActionsIntro) {
    cybercloneAdActionsIntro.classList.toggle("hidden", phase !== "intro");
  }

  if (cybercloneAdActionsQuestion) {
    cybercloneAdActionsQuestion.classList.toggle("hidden", phase !== "question");
  }

  if (cybercloneAdActionsResult) {
    cybercloneAdActionsResult.classList.toggle("hidden", phase !== "result");
  }

  if (cybercloneAdIntroExtra) {
    cybercloneAdIntroExtra.classList.toggle("hidden", phase !== "intro");
  }
}

function recalculateCybercloneScore() {
  cybercloneScore = cybercloneAnswers.reduce(function (total, answer) {
    return total + (answer === true ? 1 : 0);
  }, 0);
}

function updateCybercloneAdNav() {
  if (!cybercloneAdNav || !cybercloneAdNavPrev || !cybercloneAdNavNext) {
    return;
  }

  cybercloneAdNav.classList.remove("hidden");

  const canGoPrev = cybercloneAdStep > 0;
  const canGoNext = cybercloneAdStep < cybercloneAdMaxReached;

  cybercloneAdNavPrev.disabled = !canGoPrev;
  cybercloneAdNavNext.disabled = !canGoNext;
}

function navigateCybercloneAd(direction) {
  const delta = direction === "prev" ? -1 : 1;
  const nextStep = cybercloneAdStep + delta;

  if (nextStep < 0 || nextStep > cybercloneAdMaxReached) {
    return;
  }

  transitionToNextCybercloneAd(function () {
    showCybercloneAdAtStep(nextStep);
  });
}

function openCybercloneBookletAd() {
  if (generatedCybercloneLevel <= 0) {
    return;
  }

  cybercloneAdMaxReached = Math.max(cybercloneAdMaxReached, 7);

  transitionToNextCybercloneAd(function () {
    showCybercloneAdAtStep(7);
  });
}

function showCybercloneBookAdContent() {
  if (cybercloneAdBookPreview) {
    cybercloneAdBookPreview.src = BOOK_PREVIEW_GIF;
  }

  showCybercloneAdOverlay();
  popCybercloneAdContent();
}

function showCybercloneResultAdView() {
  showCybercloneAdOverlay();
  popCybercloneAdContent();
}

function popCybercloneAdContent() {
  const targets = document.querySelectorAll(
    "#cybercloneAdPopup .cyberclone-ad-content, #cybercloneAdResultLayout, #cybercloneAdBookLayout"
  );

  targets.forEach(function (content) {
    if (!content || content.classList.contains("hidden")) {
      return;
    }

    content.classList.remove("cyberclone-ad-text-pop");
    void content.offsetWidth;
    content.classList.add("cyberclone-ad-text-pop");
  });
}

function hideCybercloneAdOverlay() {
  clearCybercloneAdTimers();
  cybercloneAdAnswering = false;

  if (cybercloneAdOverlay) {
    cybercloneAdOverlay.classList.add("hidden");
    cybercloneAdOverlay.setAttribute("aria-hidden", "true");
  }
}

function showCybercloneAdOverlay() {
  if (!cybercloneAdOverlay) {
    return;
  }

  if (cybercloneTestPanel) {
    cybercloneTestPanel.classList.remove("hidden");
    cybercloneTestPanel.classList.add("cyberclone-test-panel--ad-active");
  }

  cybercloneAdOverlay.classList.remove("hidden");
  cybercloneAdOverlay.setAttribute("aria-hidden", "false");
  cybercloneAdAnswering = false;
}

function getNextCybercloneNumber(records) {
  const list = records || latestCybercloneRecords || [];

  if (!list.length) {
    return 1;
  }

  return (
    list.reduce(function (max, record) {
      return Math.max(max, Number(record.clone_number) || 0);
    }, 0) + 1
  );
}

function formatCybercloneNumberLabel(value) {
  const number = Number(value) || 0;

  return number > 0 ? String(number) : "0";
}

function buildCybercloneBookletGreetingText(cloneNumber) {
  return "Hello, Cyberclone No." + formatCybercloneNumberLabel(cloneNumber);
}

async function showCybercloneResultAdContent() {
  populateCybercloneResultData();

  let cloneNumber = 1;

  try {
    const records = await loadCybercloneFieldRecords();
    cloneNumber = getNextCybercloneNumber(records);
  } catch (error) {
    cloneNumber = getNextCybercloneNumber(latestCybercloneRecords);
  }

  generatedCybercloneNumber = cloneNumber;
  cybercloneResultPrepared = true;

  if (cybercloneAdResultGreeting) {
    cybercloneAdResultGreeting.textContent = "";
    cybercloneAdResultGreeting.classList.add("hidden");
  }

  if (cybercloneAdResultLevel) {
    cybercloneAdResultLevel.classList.add("hidden");
    cybercloneAdResultLevel.textContent = "";
  }

  if (downloadCyberclonePdf) {
    downloadCyberclonePdf.disabled = generatedCybercloneLevel <= 0;
    downloadCyberclonePdf.classList.toggle("hidden", generatedCybercloneLevel <= 0);
  }

  if (generatedCybercloneLevel > 0) {
    if (cybercloneAdResultGreeting) {
      cybercloneAdResultGreeting.textContent =
        buildCybercloneBookletGreetingText(cloneNumber);
      cybercloneAdResultGreeting.classList.remove("hidden");
    }

    if (cybercloneAdResultLevel) {
      cybercloneAdResultLevel.textContent =
        "You Are A Level " + generatedCybercloneLevel + " Cyberclone.";
      cybercloneAdResultLevel.classList.remove("hidden");
    }

    if (cybercloneResultText) {
      cybercloneResultText.textContent =
        "Your test result becomes the cover of your clone booklet.";
      cybercloneResultText.classList.remove("hidden");
    }
  } else {
    if (cybercloneAdResultGreeting) {
      cybercloneAdResultGreeting.textContent = "You Are Not A Cyberclone.";
      cybercloneAdResultGreeting.classList.remove("hidden");
    }

    if (cybercloneAdResultLevel) {
      cybercloneAdResultLevel.classList.add("hidden");
      cybercloneAdResultLevel.textContent = "";
    }

    if (cybercloneResultText) {
      cybercloneResultText.textContent =
        "Enter the field to browse other specimens, or retake the test.";
      cybercloneResultText.classList.remove("hidden");
    }
  }

  showCybercloneResultAdView();
}

function populateCybercloneResultData() {
  generatedCybercloneLevel = cybercloneScore;

  if (generatedCybercloneLevel > 0) {
    generatedCybercloneAsset = chooseRandomCybercloneAsset();

    if (cybercloneResultSpecimen) {
      cybercloneResultSpecimen.className =
        "cyberclone-result-specimen level-" + generatedCybercloneLevel;
    }

    if (cybercloneResultImage) {
      cybercloneResultImage.src = generatedCybercloneAsset.gif;
      cybercloneResultImage.dataset.still = generatedCybercloneAsset.still;
      cybercloneResultImage.dataset.gif = generatedCybercloneAsset.gif;
    }

    if (cybercloneResultText) {
      cybercloneResultText.classList.add("hidden");
    }

    if (releaseCybercloneField) {
      releaseCybercloneField.textContent = "Release Into Field";
    }
  } else {
    generatedCybercloneAsset = null;

    if (cybercloneResultSpecimen) {
      cybercloneResultSpecimen.className = "cyberclone-result-specimen hidden";
    }

    if (cybercloneResultImage) {
      cybercloneResultImage.src = "";
      cybercloneResultImage.removeAttribute("data-still");
      cybercloneResultImage.removeAttribute("data-gif");
    }

    if (releaseCybercloneField) {
      releaseCybercloneField.textContent = "Enter Field";
    }
  }
}

function applyCybercloneAdChrome(step) {
  if (cybercloneAdOverlay) {
    cybercloneAdOverlay.classList.remove(
      "cyberclone-ad-overlay--label-left",
      "cyberclone-ad-overlay--label-right",
      "cyberclone-ad-overlay--label-minimal"
    );

    if (step.labelAlign) {
      cybercloneAdOverlay.classList.add(
        "cyberclone-ad-overlay--label-" + step.labelAlign
      );
    }
  }

  if (cybercloneAdLabel) {
    if (step.labelText) {
      cybercloneAdLabel.textContent = step.labelText;
    }

    cybercloneAdLabel.classList.toggle("hidden", step.phase === "book");
  }

  if (cybercloneAdPopup) {
    cybercloneAdPopup.classList.toggle(
      "cyberclone-ad-popup--close-bottom",
      step.closePos === "bottom"
    );
    cybercloneAdPopup.classList.toggle(
      "cyberclone-ad-popup--no-choices",
      step.phase === "result" || step.phase === "book"
    );
    cybercloneAdPopup.classList.toggle(
      "cyberclone-ad-popup--close-pink",
      step.closeStyle === "pink"
    );
  }
}

function showCybercloneAdAtStep(stepIndex) {
  const step = CYBERCLONE_AD_STEPS[stepIndex];

  if (!step || !cybercloneAdPopup) {
    return;
  }

  cybercloneAdStep = stepIndex;
  cybercloneAdPopup.className =
    "cyberclone-ad-popup cyberclone-ad-popup--" + step.layout;

  applyCybercloneAdChrome(step);

  if (cybercloneAdStandardLayout) {
    cybercloneAdStandardLayout.classList.toggle(
      "hidden",
      step.phase === "result" || step.phase === "book"
    );
  }

  if (cybercloneAdResultLayout) {
    const isResult = step.phase === "result";

    cybercloneAdResultLayout.classList.toggle("hidden", !isResult);
    cybercloneAdResultLayout.setAttribute("aria-hidden", isResult ? "false" : "true");
  }

  if (cybercloneAdBookLayout) {
    const isBook = step.phase === "book";

    cybercloneAdBookLayout.classList.toggle("hidden", !isBook);
    cybercloneAdBookLayout.setAttribute("aria-hidden", isBook ? "false" : "true");
  }

  if (cybercloneAdMeta) {
    cybercloneAdMeta.textContent = "";
  }

  if (cybercloneAdHeadline) {
    cybercloneAdHeadline.textContent = "";
  }

  if (cybercloneAdSubtext) {
    cybercloneAdSubtext.textContent = "";
  }

  if (cybercloneAdVisual) {
    cybercloneAdVisual.classList.add("hidden");
    cybercloneAdVisual.setAttribute("aria-hidden", "true");
  }

  if (cybercloneAdVisualImage) {
    cybercloneAdVisualImage.classList.add("hidden");
    cybercloneAdVisualImage.src = "";
    cybercloneAdVisualImage.alt = "";
  }

  if (cybercloneAdVisualTag) {
    cybercloneAdVisualTag.classList.add("hidden");
    cybercloneAdVisualTag.textContent = "";
  }

  if (cybercloneAdVisualCaption) {
    cybercloneAdVisualCaption.classList.add("hidden");
    cybercloneAdVisualCaption.textContent = "";
  }

  if (cybercloneAdCloseHint) {
    cybercloneAdCloseHint.classList.add("hidden");
  }

  setCybercloneAdActionGroup(step.phase);

  if (step.phase === "intro") {
    if (cybercloneAdMeta) {
      cybercloneAdMeta.textContent = "Cyberclone Diagnostic";
    }

    if (cybercloneAdHeadline) {
      cybercloneAdHeadline.textContent = "Are You A Cyberclone?";
    }

    if (cybercloneAdSubtext) {
      cybercloneAdSubtext.textContent =
        "This test measures your level of meme exposure through five simple yes or no questions. Each yes produces one level of cybercloning.";
    }
  } else if (step.phase === "question") {
    const questionIndex = step.questionIndex;

    if (cybercloneAdHeadline) {
      cybercloneAdHeadline.textContent = CYBERCLONE_QUESTIONS[questionIndex];
    }

    if (cybercloneAdSubtext) {
      cybercloneAdSubtext.textContent =
        "Answer yes or no to continue this sponsored meme exposure check.";
    }

    if (
      (step.layout === "layout-1" || step.layout === "layout-3") &&
      cybercloneAdVisual
    ) {
      cybercloneAdVisual.classList.remove("hidden");
      cybercloneAdVisual.setAttribute("aria-hidden", "false");

      if (cybercloneAdVisualImage) {
        cybercloneAdVisualImage.src = CYBERCLONE_AD_GIF;
        cybercloneAdVisualImage.alt = "Advertisement";
        cybercloneAdVisualImage.classList.remove("hidden");
      }

      if (cybercloneAdVisualTag) {
        cybercloneAdVisualTag.textContent =
          step.layout === "layout-1" ? "SAVE 50%" : "SPONSORED";
        cybercloneAdVisualTag.classList.remove("hidden");
      }

      if (cybercloneAdVisualCaption) {
        cybercloneAdVisualCaption.textContent =
          step.layout === "layout-1"
            ? "Sponsored meme exposure check — answer yes or no to continue."
            : "Meme replication may exceed the space of the screen.";
        cybercloneAdVisualCaption.classList.remove("hidden");
      }
    }
  } else if (step.phase === "result") {
    if (!cybercloneResultPrepared) {
      void showCybercloneResultAdContent();
    } else {
      showCybercloneResultAdView();
    }

    updateCybercloneAdNav();
    return;
  } else if (step.phase === "book") {
    showCybercloneBookAdContent();
    updateCybercloneAdNav();
    return;
  }

  updateCybercloneAdNav();
  showCybercloneAdOverlay();
  popCybercloneAdContent();
}

function openCybercloneIntroAd() {
  currentCybercloneQuestion = 0;
  cybercloneAdStep = 0;
  cybercloneAdMaxReached = 0;
  cybercloneAnswers = [null, null, null, null, null];
  cybercloneResultPrepared = false;
  showCybercloneAdAtStep(0);
}

function showCybercloneAdCloseHint(message) {
  if (!cybercloneAdCloseHint) {
    return;
  }

  cybercloneAdCloseHint.textContent = message;
  cybercloneAdCloseHint.classList.remove("hidden");

  if (cybercloneAdCloseHintTimer) {
    window.clearTimeout(cybercloneAdCloseHintTimer);
  }

  cybercloneAdCloseHintTimer = window.setTimeout(function () {
    if (cybercloneAdCloseHint) {
      cybercloneAdCloseHint.classList.add("hidden");
    }

    cybercloneAdCloseHintTimer = null;
  }, 1800);
}

function shakeCybercloneAdPopup() {
  if (!cybercloneAdPopup) {
    return;
  }

  cybercloneAdPopup.classList.remove("cyberclone-ad-popup--shake");
  void cybercloneAdPopup.offsetWidth;
  cybercloneAdPopup.classList.add("cyberclone-ad-popup--shake");

  const step = CYBERCLONE_AD_STEPS[cybercloneAdStep];
  let message = "Continue to proceed.";

  if (step && step.phase === "intro") {
    message = "Start the test to continue.";
  } else if (step && step.phase === "question") {
    message = "Answer the question to continue.";
  } else if (step && step.phase === "result") {
    message = "Choose an action below to continue.";
  } else if (step && step.phase === "book") {
    message = "Close to return to your result.";
  }

  showCybercloneAdCloseHint(message);
}

function transitionToNextCybercloneAd(afterTransition) {
  if (!cybercloneAdPopup) {
    if (afterTransition) {
      afterTransition();
    }
    return;
  }

  cybercloneAdPopup.classList.add("cyberclone-ad-popup--exit");

  if (cybercloneAdTransitionTimer) {
    window.clearTimeout(cybercloneAdTransitionTimer);
  }

  cybercloneAdTransitionTimer = window.setTimeout(function () {
    cybercloneAdPopup.classList.remove("cyberclone-ad-popup--exit");
    cybercloneAdTransitionTimer = null;

    if (afterTransition) {
      afterTransition();
    }
  }, 200);
}

function sanitizeCodename(value) {
  const cleaned = String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 24);

  return cleaned || "anonymous";
}

function resetCybercloneField() {
  formationMode = false;

  if (cyberflingScene) {
    cyberflingScene.classList.add("field-hidden");
    cyberflingScene.classList.remove("formation-mode");
  }

  if (formationToggleButton) {
    formationToggleButton.classList.add("hidden");
    formationToggleButton.textContent = "FORMATION";
  }

  hideCybercloneInfoPanel();
}

function prepareCybercloneTestSection() {
  const panel = document.getElementById("cybercloneTestPanel");
  const scene = document.getElementById("cyberflingScene");
  const formationButton = document.getElementById("formationToggleButton");

  if (!panel || !scene) return;

  const fieldIsVisible = !scene.classList.contains("field-hidden");

  if (fieldIsVisible) {
    panel.classList.add("hidden");

    if (formationButton) {
      formationButton.classList.remove("hidden");
    }

    return;
  }

  panel.classList.remove("hidden");
  panel.classList.add("cyberclone-test-panel--ad-active");

  if (formationButton) {
    formationButton.classList.add("hidden");
    formationButton.textContent = "FORMATION";
  }

  const adActive = cybercloneAdOverlay && !cybercloneAdOverlay.classList.contains("hidden");

  if (!adActive) {
    openCybercloneIntroAd();
  }
}

function resetCybercloneTest() {
  currentCybercloneQuestion = 0;
  cybercloneAdStep = 0;
  cybercloneAdMaxReached = 0;
  cybercloneAnswers = [null, null, null, null, null];
  cybercloneResultPrepared = false;
  cybercloneScore = 0;
  generatedCybercloneAsset = null;
  generatedCybercloneLevel = 0;
  generatedCybercloneCodename = "anonymous";
  generatedCybercloneNumber = 0;

  if (cybercloneCodenameInput) {
    cybercloneCodenameInput.value = "";
  }

  if (cybercloneResultSpecimen) {
    cybercloneResultSpecimen.className = "cyberclone-result-specimen hidden";
  }

  if (cybercloneResultImage) {
    cybercloneResultImage.src = "";
    cybercloneResultImage.removeAttribute("data-still");
    cybercloneResultImage.removeAttribute("data-gif");
  }

  if (cybercloneResultText) {
    cybercloneResultText.textContent = "You Are Not A Cyberclone.";
    cybercloneResultText.classList.add("hidden");
  }

  if (releaseCybercloneField) {
    releaseCybercloneField.textContent = "Release Into Field";
    releaseCybercloneField.disabled = false;
  }

  resetCybercloneField();

  if (cybercloneTestPanel) {
    cybercloneTestPanel.classList.remove("hidden");
  }

  openCybercloneIntroAd();
}

function startTestQuestions() {
  generatedCybercloneCodename = sanitizeCodename(
    (document.getElementById("cybercloneCodenameInput") || {}).value || ""
  );

  currentCybercloneQuestion = 0;
  cybercloneScore = 0;
  cybercloneAnswers = [null, null, null, null, null];
  cybercloneResultPrepared = false;
  cybercloneAdMaxReached = 1;

  transitionToNextCybercloneAd(function () {
    showCybercloneAdAtStep(1);
  });
}

function answerCybercloneQuestion(isYes) {
  if (cybercloneAdAnswering) {
    return;
  }

  const step = CYBERCLONE_AD_STEPS[cybercloneAdStep];

  if (!step || step.phase !== "question") {
    return;
  }

  cybercloneAdAnswering = true;

  const questionIndex = step.questionIndex;
  cybercloneAnswers[questionIndex] = isYes;
  recalculateCybercloneScore();
  cybercloneResultPrepared = false;

  if (questionIndex !== currentCybercloneQuestion) {
    cybercloneAdAnswering = false;
    return;
  }

  currentCybercloneQuestion += 1;

  if (currentCybercloneQuestion >= CYBERCLONE_QUESTIONS.length) {
    cybercloneAdMaxReached = Math.max(cybercloneAdMaxReached, 6);

    transitionToNextCybercloneAd(function () {
      showCybercloneAdAtStep(6);
    });
    return;
  }

  const nextStep = questionIndex + 2;
  cybercloneAdMaxReached = Math.max(cybercloneAdMaxReached, nextStep);

  transitionToNextCybercloneAd(function () {
    showCybercloneAdAtStep(nextStep);
  });
}

function chooseRandomCybercloneAsset() {
  const randomIndex = Math.floor(Math.random() * CYBERCLONE_TEST_ASSETS.length);
  return CYBERCLONE_TEST_ASSETS[randomIndex];
}

function getAssetByGifName(gifName) {
  return CYBERCLONE_ASSETS.find(function (asset) {
    return asset.gifName === gifName;
  });
}

function getLevelClass(level) {
  const safeLevel = Math.max(1, Math.min(5, Number(level) || 1));
  return "depth-level-" + safeLevel;
}

function handleCybercloneAdCloseClick(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  const step = CYBERCLONE_AD_STEPS[cybercloneAdStep];

  if (step && step.phase === "book") {
    navigateCybercloneAd("prev");
    return;
  }

  shakeCybercloneAdPopup();
}

function bindCybercloneTestPanel() {
  const panel = document.getElementById("cybercloneTestPanel");

  if (!panel || panel.dataset.bound === "1") return;

  panel.dataset.bound = "1";

  panel.addEventListener("click", function (event) {
    const button = event.target.closest("button");

    if (!button || !panel.contains(button)) return;

    switch (button.id) {
      case "startCybercloneTest":
        event.preventDefault();
        startTestQuestions();
        break;
      case "cybercloneYesButton":
        event.preventDefault();
        answerCybercloneQuestion(true);
        break;
      case "cybercloneNoButton":
        event.preventDefault();
        answerCybercloneQuestion(false);
        break;
      case "cybercloneAdClose":
        event.preventDefault();
        handleCybercloneAdCloseClick(event);
        break;
      case "cybercloneAdNavPrev":
        event.preventDefault();
        navigateCybercloneAd("prev");
        break;
      case "cybercloneAdNavNext":
        event.preventDefault();
        navigateCybercloneAd("next");
        break;
      case "downloadCyberclonePdf":
        event.preventDefault();
        openCybercloneBookletAd();
        break;
      case "releaseCybercloneField":
        event.preventDefault();
        releaseCybercloneIntoField();
        break;
      case "restartCybercloneTest":
        event.preventDefault();
        resetCybercloneTest();
        break;
      default:
        break;
    }
  });
}

window.cybercloneUI = {
  startTestQuestions: startTestQuestions,
  answerCybercloneQuestion: answerCybercloneQuestion,
  releaseCybercloneIntoField: releaseCybercloneIntoField,
  resetCybercloneTest: resetCybercloneTest
};

bindCybercloneTestPanel();

function getRandomFieldPosition(existingRecords) {
  const records = existingRecords || [];

  let bestPosition = {
    x: Math.round((12 + Math.random() * 76) * 100) / 100,
    y: Math.round((32 + Math.random() * 46) * 100) / 100
  };

  let bestScore = -Infinity;

  for (let attempt = 0; attempt < 35; attempt++) {
    const candidate = {
      x: Math.round((12 + Math.random() * 76) * 100) / 100,
      y: Math.round((30 + Math.random() * 48) * 100) / 100
    };

    let nearestDistance = Infinity;

    records.forEach(function (record) {
      const dx = candidate.x - Number(record.x || 0);
      const dy = candidate.y - Number(record.y || 0);
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < nearestDistance) {
        nearestDistance = distance;
      }
    });

    const edgePenalty =
      Math.abs(candidate.x - 50) * 0.05 +
      Math.abs(candidate.y - 54) * 0.03;

    const score = nearestDistance - edgePenalty;

    if (score > bestScore) {
      bestScore = score;
      bestPosition = candidate;
    }
  }

  return bestPosition;
}

function normalizeCybercloneRecords(records) {
  return (records || []).map(function (record, index) {
    return {
      id: record.id,
      clone_number: record.clone_number || index + 1,
      gif_name: record.gif_name,
      level: Number(record.level || 1),
      x: Number(record.x || 50),
      y: Number(record.y || 50),
      source: record.source || "visitor",
      codename:
        record.codename ||
        (record.source === "seed"
          ? "seed-" + String(index + 1).padStart(2, "0")
          : "anonymous"),
      created_at: record.created_at || ""
    };
  });
}

async function saveCybercloneToSupabase(existingRecords) {
  if (!supabaseClient) {
    console.error("Supabase client is not ready.");
    alert("Supabase is not connected.");
    return null;
  }

  if (generatedCybercloneLevel <= 0 || !generatedCybercloneAsset) {
    console.log("Level 0 result. Nothing will be saved.");
    return null;
  }

  const position = getRandomFieldPosition(existingRecords || latestCybercloneRecords);

  const fullRecord = {
    gif_name: generatedCybercloneAsset.gifName,
    level: generatedCybercloneLevel,
    x: position.x,
    y: position.y,
    source: "visitor",
    codename: generatedCybercloneCodename
  };

  const { data, error } = await supabaseClient
    .from(SUPABASE_TABLE_NAME)
    .insert(fullRecord)
    .select()
    .single();

  if (!error) {
    return data;
  }

  console.warn("Full insert failed. Trying legacy insert:", error);

  const legacyRecord = {
    gif_name: generatedCybercloneAsset.gifName,
    level: generatedCybercloneLevel,
    x: position.x,
    y: position.y,
    source: "visitor"
  };

  const legacyResult = await supabaseClient
    .from(SUPABASE_TABLE_NAME)
    .insert(legacyRecord)
    .select()
    .single();

  if (legacyResult.error) {
    console.error("Failed to save cyberclone:", legacyResult.error);
    alert("This cyberclone was not saved. Check Supabase settings.");
    return null;
  }

  return legacyResult.data;
}

async function loadCybercloneFieldRecords() {
  if (!supabaseClient) {
    console.error("Supabase client is not ready.");
    return [];
  }

  const fullResult = await supabaseClient
    .from(SUPABASE_TABLE_NAME)
    .select("id, clone_number, gif_name, level, x, y, source, codename, created_at")
    .order("created_at", { ascending: true });

  if (!fullResult.error) {
    latestCybercloneRecords = normalizeCybercloneRecords(fullResult.data || []);
    return latestCybercloneRecords;
  }

  console.warn("Full select failed. Trying legacy select:", fullResult.error);

  const legacyResult = await supabaseClient
    .from(SUPABASE_TABLE_NAME)
    .select("id, gif_name, level, x, y, source, created_at")
    .order("created_at", { ascending: true });

  if (legacyResult.error) {
    console.error("Failed to load cyberclone field:", legacyResult.error);
    return [];
  }

  latestCybercloneRecords = normalizeCybercloneRecords(legacyResult.data || []);
  return latestCybercloneRecords;
}

function formatCybercloneNumber(value) {
  return String(value || 0).padStart(3, "0");
}

function formatCybercloneLevel(value) {
  return String(value || 0).padStart(2, "0");
}

function formatReleasedTime(value) {
  if (!value) return "unknown";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });

  const parts = formatter.formatToParts(date);
  const map = {};

  parts.forEach(function (part) {
    map[part.type] = part.value;
  });

  return (
    map.day +
    " " +
    String(map.month || "").toLowerCase() +
    " " +
    map.year +
    ", " +
    map.hour +
    ":" +
    map.minute
  );
}

function showCybercloneInfoPanel(record) {
  if (!cybercloneInfoPanel || !record) return;

  cybercloneInfoPanel.innerHTML = `
    <p>cyberclone no. ${formatCybercloneNumber(record.clone_number)}</p>
    <p>codename: ${escapeHTML(record.codename || "anonymous")}</p>
    <p>level: ${formatCybercloneLevel(record.level)}</p>
    <p>released: ${formatReleasedTime(record.created_at)}</p>
  `;

  cybercloneInfoPanel.classList.remove("hidden");
}

function hideCybercloneInfoPanel() {
  if (!cybercloneInfoPanel) return;

  cybercloneInfoPanel.innerHTML = `
    <p>cyberclone field</p>
    <p>hover over a specimen</p>
  `;

  cybercloneInfoPanel.classList.add("hidden");
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderCybercloneField(records) {
  if (!cyberflingScene) return;

  cyberflingScene.innerHTML = "";

  records.forEach(function (record) {
    const asset = getAssetByGifName(record.gif_name);

    if (!asset) {
      console.warn("Missing asset for:", record.gif_name);
      return;
    }

    const item = document.createElement("div");

    item.className =
      "cyberfling-item saved-cyberclone-item " + getLevelClass(record.level);

    item.dataset.id = record.id || "";
    item.dataset.cloneNumber = String(record.clone_number || "");
    item.dataset.level = String(record.level || "");
    item.dataset.source = record.source || "visitor";
    item.dataset.codename = record.codename || "anonymous";
    item.dataset.createdAt = record.created_at || "";
    item.dataset.fieldLeft = record.x + "%";
    item.dataset.fieldTop = record.y + "%";

    item.style.left = record.x + "%";
    item.style.top = record.y + "%";

    item.innerHTML = `
      <button class="floating-arrow" type="button">▲</button>

      <div class="arrow-mini-dialog">
        <img
          class="book-preview-gif"
          src=""
          data-book-gif="${BOOK_PREVIEW_GIF}"
          alt=""
          draggable="false"
        />
      </div>

      <img
        class="cyberfling-gif"
        src="${asset.still}"
        data-still="${asset.still}"
        data-gif="${asset.gif}"
        alt="Cyberclone Level ${record.level}"
        draggable="false"
      />
    `;

    cyberflingScene.appendChild(item);
    attachCyberflingItemEvents(item, record);
  });

  if (formationMode) {
    applyFormationLayout();
  }
}

async function refreshCybercloneField() {
  const records = await loadCybercloneFieldRecords();
  renderCybercloneField(records);
}

async function enterFieldOnly() {
  await refreshCybercloneField();
  hideCybercloneAdOverlay();

  if (cybercloneTestPanel) {
    cybercloneTestPanel.classList.add("hidden");
  }

  if (cyberflingScene) {
    cyberflingScene.classList.remove("field-hidden");
  }

  if (formationToggleButton) {
    formationToggleButton.classList.remove("hidden");
  }
}

async function releaseCybercloneIntoField() {
  if (releaseCybercloneField) {
    releaseCybercloneField.disabled = true;
    releaseCybercloneField.textContent =
      generatedCybercloneLevel > 0 ? "Releasing..." : "Entering...";
  }

  if (generatedCybercloneLevel <= 0 || !generatedCybercloneAsset) {
    console.log("Level 0 result. Entering field without saving.");

    await enterFieldOnly();

    if (releaseCybercloneField) {
      releaseCybercloneField.disabled = false;
      releaseCybercloneField.textContent = "Enter Field";
    }

    return;
  }

  const existingRecords = await loadCybercloneFieldRecords();

  await saveCybercloneToSupabase(existingRecords);
  await refreshCybercloneField();
  hideCybercloneAdOverlay();

  if (cybercloneTestPanel) {
    cybercloneTestPanel.classList.add("hidden");
  }

  if (cyberflingScene) {
    cyberflingScene.classList.remove("field-hidden");
  }

  if (formationToggleButton) {
    formationToggleButton.classList.remove("hidden");
  }

  if (releaseCybercloneField) {
    releaseCybercloneField.disabled = false;
    releaseCybercloneField.textContent = "Release Into Field";
  }
}

function attachCyberflingItemEvents(item, record) {
  const gif = item.querySelector(".cyberfling-gif");
  const arrow = item.querySelector(".floating-arrow");

  if (gif) {
    gif.addEventListener("mouseenter", function () {
      const gifSrc = gif.dataset.gif;

      if (gifSrc) {
        gif.src = gifSrc + "?t=" + Date.now();
      }

      showCybercloneInfoPanel(record);
    });

    gif.addEventListener("mouseleave", function () {
      const stillSrc = gif.dataset.still;

      if (stillSrc) {
        gif.src = stillSrc;
      }

      hideCybercloneInfoPanel();
    });
  }

  if (arrow) {
    arrow.addEventListener("click", function (event) {
      event.stopPropagation();

      const currentItem = arrow.closest(".cyberfling-item");

      if (!currentItem) return;

      document.querySelectorAll(".cyberfling-item.dialog-open").forEach(function (openItem) {
        if (openItem !== currentItem) {
          openItem.classList.remove("dialog-open");

          const oldBook = openItem.querySelector(".book-preview-gif");
          if (oldBook) oldBook.src = "";
        }
      });

      currentItem.classList.toggle("dialog-open");

      const bookGif = currentItem.querySelector(".book-preview-gif");

      if (bookGif) {
        if (currentItem.classList.contains("dialog-open")) {
          bookGif.src = bookGif.dataset.bookGif + "?t=" + Date.now();
        } else {
          bookGif.src = "";
        }
      }
    });
  }

  let isDraggingItem = false;
  let startDragX = 0;
  let startDragY = 0;
  let startLeft = 0;
  let startTop = 0;

  item.addEventListener("pointerdown", function (event) {
    if (event.target.closest(".floating-arrow")) {
      return;
    }

    if (cyberflingScene && cyberflingScene.classList.contains("formation-mode")) {
      return;
    }

    isDraggingItem = true;
    item.classList.add("dragging");

    const rect = item.getBoundingClientRect();
    const parentRect = item.parentElement.getBoundingClientRect();

    startDragX = event.clientX;
    startDragY = event.clientY;

    startLeft = rect.left - parentRect.left + rect.width / 2;
    startTop = rect.top - parentRect.top + rect.height / 2;

    item.setPointerCapture(event.pointerId);
  });

  item.addEventListener("pointermove", function (event) {
    if (!isDraggingItem) return;

    const dx = event.clientX - startDragX;
    const dy = event.clientY - startDragY;

    item.style.left = startLeft + dx + "px";
    item.style.top = startTop + dy + "px";
  });

  item.addEventListener("pointerup", function (event) {
    if (!isDraggingItem) return;

    isDraggingItem = false;
    item.classList.remove("dragging");

    const parentRect = item.parentElement.getBoundingClientRect();
    const currentLeft = parseFloat(item.style.left);
    const currentTop = parseFloat(item.style.top);

    if (!Number.isNaN(currentLeft) && !Number.isNaN(currentTop)) {
      const xPercent = (currentLeft / parentRect.width) * 100;
      const yPercent = (currentTop / parentRect.height) * 100;

      item.dataset.fieldLeft = xPercent + "%";
      item.dataset.fieldTop = yPercent + "%";
    }

    item.releasePointerCapture(event.pointerId);
  });

  item.addEventListener("pointercancel", function () {
    isDraggingItem = false;
    item.classList.remove("dragging");
  });
}

function getFormationPosition(index) {
  const cycleIndex = index % 7;
  const cycleNumber = Math.floor(index / 7);

  let row;
  let column;
  let columnsInRow;

  if (cycleIndex < 4) {
    row = cycleNumber * 2;
    column = cycleIndex;
    columnsInRow = 4;
  } else {
    row = cycleNumber * 2 + 1;
    column = cycleIndex - 4;
    columnsInRow = 3;
  }

  const fourColumnX = [18, 39, 60, 81];
  const threeColumnX = [29, 50, 71];

  const x =
    columnsInRow === 4
      ? fourColumnX[column]
      : threeColumnX[column];

  const y = 20 + row * 24;

  return {
    x: x,
    y: y,
    row: row
  };
}

function applyFormationLayout() {
  if (!cyberflingScene) return;

  const items = Array.from(cyberflingScene.querySelectorAll(".cyberfling-item"));

  items.sort(function (a, b) {
    const aNumber = Number(a.dataset.cloneNumber || 999999);
    const bNumber = Number(b.dataset.cloneNumber || 999999);
    return aNumber - bNumber;
  });

  let maxRow = 0;

  items.forEach(function (item, index) {
    const position = getFormationPosition(index);

    maxRow = Math.max(maxRow, position.row);

    item.style.left = position.x + "%";
    item.style.top = position.y + "vh";
  });

  const totalFormationHeight = 20 + maxRow * 24 + 80;

  cyberflingScene.style.setProperty("--formation-start", "110vh");
  cyberflingScene.style.setProperty(
    "--formation-end",
    "-" + totalFormationHeight + "vh"
  );

  cyberflingScene.classList.add("formation-mode");

  if (formationToggleButton) {
    formationToggleButton.textContent = "FIELD";
  }
}

function restoreFieldLayout() {
  if (!cyberflingScene) return;

  const items = Array.from(cyberflingScene.querySelectorAll(".cyberfling-item"));

  items.forEach(function (item) {
    item.style.left = item.dataset.fieldLeft || item.style.left;
    item.style.top = item.dataset.fieldTop || item.style.top;
  });

  cyberflingScene.classList.remove("formation-mode");

  if (formationToggleButton) {
    formationToggleButton.textContent = "FORMATION";
  }
}

function toggleFormationMode() {
  formationMode = !formationMode;

  closeAllBookDialogs();

  if (formationMode) {
    applyFormationLayout();
  } else {
    restoreFieldLayout();
  }
}

function closeAllBookDialogs() {
  document.querySelectorAll(".cyberfling-item.dialog-open").forEach(function (item) {
    item.classList.remove("dialog-open");

    const book = item.querySelector(".book-preview-gif");
    if (book) book.src = "";
  });
}

if (formationToggleButton) {
  formationToggleButton.addEventListener("click", function () {
    toggleFormationMode();
  });
}

if (cybercloneResultImage) {
  cybercloneResultImage.addEventListener("mouseenter", function () {
    const gifSrc = cybercloneResultImage.dataset.gif;

    if (gifSrc) {
      cybercloneResultImage.src = gifSrc + "?t=" + Date.now();
    }
  });

  cybercloneResultImage.addEventListener("mouseleave", function () {
    const stillSrc = cybercloneResultImage.dataset.still;

    if (stillSrc) {
      cybercloneResultImage.src = stillSrc;
    }
  });
}

window.addEventListener("pointerdown", function (event) {
  const target = event.target;

  if (!(target instanceof Element)) return;

  if (
    target.closest(".floating-arrow") ||
    target.closest(".arrow-mini-dialog") ||
    target.closest(".formation-toggle-button")
  ) {
    return;
  }

  closeAllBookDialogs();
});

refreshCybercloneField();


window.addEventListener("pointerdown", function (event) {
  const target = event.target;

  if (!shouldStartGridDrag(target)) {
    return;
  }

  isDraggingGrid = true;
  startX = event.clientX;
  startY = event.clientY;
});

window.addEventListener("pointerup", function () {
  isDraggingGrid = false;
});

window.addEventListener("pointermove", function (event) {
  if (!isDraggingGrid) return;

  const deltaX = event.clientX - startX;
  const deltaY = event.clientY - startY;

  gridRotateZ += deltaX * 0.045;
  gridTop += deltaY * 0.012;

  if (gridTop < 55) gridTop = 55;
  if (gridTop > 66) gridTop = 66;

  startX = event.clientX;
  startY = event.clientY;

  updateGridCSSVariables();
});

window.addEventListener(
  "wheel",
  function (event) {
    const target = event.target;

    if (!shouldStartGridDrag(target)) {
      return;
    }

    event.preventDefault();

    gridZoom += event.deltaY * 0.001;

    if (gridZoom < 0.45) gridZoom = 0.45;
    if (gridZoom > 2.8) gridZoom = 2.8;

    updateGridCSSVariables();
  },
  { passive: false }
);

updateGridCSSVariables();


/* ===============================
   尺寸适配
   =============================== */

function resizeAllCanvases() {
  if (labCanvas && labRenderer) {
    const width = labCanvas.clientWidth || window.innerWidth;
    const height = labCanvas.clientHeight || window.innerHeight;

    if (width > 0 && height > 0) {
      labCamera.aspect = width / height;
      labCamera.updateProjectionMatrix();
      labRenderer.setSize(width, height, false);
    }
  }
}

window.addEventListener("resize", function () {
  resizeAllCanvases();

  const statementSection = document.getElementById("statement");

  if (statementSection && statementSection.classList.contains("active")) {
    restartStatementPhysics();
  }

  if (formationMode) {
    applyFormationLayout();
  }
});

resizeAllCanvases();
updateSiteSearchPlaceholder("hello");
showSection("hello");

console.log("Cyberclone website is running. Supabase field is active.");