"use client";

import { useEffect, useRef, useState } from "react";
import WikiLinkPreviewLayer from "../components/WikiLinkPreviewLayer";
import WikiLogoCarousel from "../components/WikiLogoCarousel";
import WikiProfileInfobox from "../components/WikiProfileInfobox";
import WikiLabThumbCanvas from "../components/WikiLabThumbCanvas";
import WikiTocNav from "../components/WikiTocNav";
import WikiGestureCaptcha from "../components/WikiGestureCaptcha";
import Link from "next/link";

const WORDART_PHRASES_PER_VERSION = 10;
const WORDART_VERSION_INTERVAL_MS = 1000;
const WORDART_SCROLL_RESUME_DELAY_MS = 2000;

const WIKI_SHORT_WORDS = new Set([
  "a", "an", "the", "in", "on", "at", "of", "to", "for", "from", "but", "and",
  "or", "as", "is", "if", "by", "be", "are", "was", "not", "also", "how", "it",
  "its", "you", "can", "we", "they", "this", "that", "with", "into", "over",
  "than", "then", "when", "who", "what", "your", "our", "all", "any", "do"
]);

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

const WORDART_STYLE_BASE_TRANSFORM = {
  "wordart-oblique-up": "skewX(-18deg) rotate(-6deg)",
  "wordart-oblique-perspective": "perspective(120px) rotateY(-28deg) skewX(-8deg)",
  "wordart-jazz": "skewX(-12deg) rotate(-4deg)",
  "wordart-logos": "skewX(-16deg)",
  "wordart-taper-left": "perspective(160px) rotateY(24deg)"
};

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

    const take = canMerge >= 3 && roll < 32 ? 3 : Math.min(2, canMerge);
    const phrase = rawWords.slice(index, index + take).join(" ");

    groups.push({
      text: phrase,
      shape: pickHelloCellShape(phrase)
    });

    index += take;
  }

  return groups;
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
  const scale = "scale(" + scaleX.toFixed(3) + ", " + scaleY.toFixed(3) + ")";
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

  clone.classList.remove("home-clone");
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
    CLONE_WORDART_STYLES[Math.floor(Math.random() * CLONE_WORDART_STYLES.length)];

  clone.classList.add("home-clone", styleName);

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

function wrapTextNodeAsCloneCells(textNode) {
  const parent = textNode.parentElement;

  if (
    !parent ||
    parent.closest("a, button, script, style, .hello-cell, figure, .wiki-profile-infobox")
  ) {
    return;
  }

  const text = textNode.textContent;

  if (!text || !text.trim()) {
    return;
  }

  const leadingSpace = text.match(/^\s*/)[0];
  const trailingSpace = text.match(/\s*$/)[0];
  const groups = groupTextIntoPhrases(text);
  const fragment = document.createDocumentFragment();

  if (leadingSpace) {
    fragment.appendChild(document.createTextNode(leadingSpace));
  }

  groups.forEach(function (group, index) {
    const cell = document.createElement("span");
    cell.className = "hello-cell " + group.shape;
    cell.textContent = group.text;
    cell.dataset.cloneText = group.text;
    fragment.appendChild(cell);

    if (index < groups.length - 1) {
      fragment.appendChild(document.createTextNode(" "));
    }
  });

  if (trailingSpace) {
    fragment.appendChild(document.createTextNode(trailingSpace));
  }

  parent.replaceChild(fragment, textNode);
}

function initializeWikiTextCloning(root) {
  if (!root) {
    return;
  }

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: function (node) {
      const parent = node.parentElement;

      if (!parent) {
        return NodeFilter.FILTER_REJECT;
      }

      if (parent.closest("a, button, script, style, .hello-cell, figure, .wiki-profile-infobox")) {
        return NodeFilter.FILTER_REJECT;
      }

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

function hasWordArtStyle(cell) {
  return CLONE_WORDART_STYLES.some(function (styleName) {
    return cell.classList.contains(styleName);
  });
}

function collectWordArtCells(root) {
  return Array.from(root.querySelectorAll(".hello-cell")).filter(function (cell) {
    return cell.textContent && cell.textContent.trim();
  });
}

function addRandomWordArtPhrases(root, phraseCount) {
  const cells = Array.from(root.querySelectorAll(".hello-cell")).filter(function (cell) {
    return cell.textContent && cell.textContent.trim() && !hasWordArtStyle(cell);
  });

  if (!cells.length) {
    return 0;
  }

  const selectedCells = [];
  const availableCells = cells.slice();
  const takeCount = Math.min(phraseCount, availableCells.length);

  while (selectedCells.length < takeCount) {
    const index = Math.floor(Math.random() * availableCells.length);
    selectedCells.push(availableCells.splice(index, 1)[0]);
  }

  selectedCells.forEach(function (cell) {
    applyRandomWordArtStyle(cell);
  });

  return selectedCells.length;
}

function applyRandomWordArtCount(root, phraseCount) {
  const cells = collectWordArtCells(root);
  const selectedCells = [];
  const availableCells = cells.slice();
  const takeCount = Math.min(phraseCount, availableCells.length);

  cells.forEach(clearCloneWordArtStyle);

  while (selectedCells.length < takeCount) {
    const index = Math.floor(Math.random() * availableCells.length);
    selectedCells.push(availableCells.splice(index, 1)[0]);
  }

  selectedCells.forEach(function (cell) {
    applyRandomWordArtStyle(cell);
  });

  return selectedCells.length;
}

function formatWordArtVersionTime(date) {
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

export default function Home() {
  const [wordArtVersions, setWordArtVersions] = useState([]);
  const [selectedWordArtVersionId, setSelectedWordArtVersionId] = useState("");
  const [isWordArtStopped, setIsWordArtStopped] = useState(false);
  const [isTocHidden, setIsTocHidden] = useState(false);
  const wordArtRootRef = useRef(null);
  const wordArtVersionsRef = useRef([]);
  const wordArtIntervalRef = useRef(null);
  const latestChangedCountRef = useRef(0);
  const versionIndexRef = useRef(0);
  const latestWordArtVersionIdRef = useRef("");
  const selectedWordArtVersionIdRef = useRef("");
  const isWordArtManuallyStoppedRef = useRef(false);
  const wordArtScrollResumeTimeoutRef = useRef(null);

  function clearWordArtVersionInterval() {
    if (wordArtIntervalRef.current) {
      window.clearInterval(wordArtIntervalRef.current);
      wordArtIntervalRef.current = null;
    }
  }

  function canResumeWordArtVersionInterval() {
    if (isWordArtManuallyStoppedRef.current) {
      return false;
    }

    const root = wordArtRootRef.current;

    if (!root) {
      return false;
    }

    const totalCells = collectWordArtCells(root).length;

    return Boolean(totalCells) && latestChangedCountRef.current < totalCells;
  }

  function handleWordArtVersionSelect(version) {
    const root = wordArtRootRef.current;

    selectedWordArtVersionIdRef.current = version.id;
    setSelectedWordArtVersionId(version.id);

    if (root) {
      applyRandomWordArtCount(root, version.changedCount);
    }
  }

  function stopWordArtVersionInterval() {
    clearWordArtVersionInterval();
    isWordArtManuallyStoppedRef.current = true;
    setIsWordArtStopped(true);
  }

  function runWordArtVersionTick() {
    const root = wordArtRootRef.current;

    if (!root) {
      stopWordArtVersionInterval();
      return;
    }

    const totalCells = collectWordArtCells(root).length;

    if (!totalCells || latestChangedCountRef.current >= totalCells) {
      stopWordArtVersionInterval();
      return;
    }

    const previousLatestVersionId = latestWordArtVersionIdRef.current;
    const wasViewingLatest =
      selectedWordArtVersionIdRef.current === previousLatestVersionId;
    const addedCount = addRandomWordArtPhrases(root, WORDART_PHRASES_PER_VERSION);

    if (!addedCount) {
      stopWordArtVersionInterval();
      return;
    }

    latestChangedCountRef.current = Math.min(
      latestChangedCountRef.current + addedCount,
      totalCells
    );
    versionIndexRef.current += 1;

    const nextVersion = {
      id: "wordart-version-" + versionIndexRef.current,
      label: formatWordArtVersionTime(new Date()),
      changedCount: latestChangedCountRef.current
    };

    latestWordArtVersionIdRef.current = nextVersion.id;
    setWordArtVersions(function (versions) {
      const nextVersions = [nextVersion].concat(versions);

      wordArtVersionsRef.current = nextVersions;

      return nextVersions;
    });

    if (wasViewingLatest) {
      selectedWordArtVersionIdRef.current = nextVersion.id;
      setSelectedWordArtVersionId(nextVersion.id);
    } else {
      const selectedVersion = wordArtVersionsRef.current.find(function (version) {
        return version.id === selectedWordArtVersionIdRef.current;
      });

      if (selectedVersion) {
        applyRandomWordArtCount(root, selectedVersion.changedCount);
      }
    }
  }

  function startWordArtVersionInterval() {
    if (wordArtIntervalRef.current || !canResumeWordArtVersionInterval()) {
      return;
    }

    isWordArtManuallyStoppedRef.current = false;
    setIsWordArtStopped(false);
    wordArtIntervalRef.current = window.setInterval(
      runWordArtVersionTick,
      WORDART_VERSION_INTERVAL_MS
    );
  }

  function pauseWordArtVersionIntervalForScroll() {
    clearWordArtVersionInterval();
  }

  function scheduleWordArtResumeAfterScroll() {
    if (wordArtScrollResumeTimeoutRef.current) {
      window.clearTimeout(wordArtScrollResumeTimeoutRef.current);
    }

    wordArtScrollResumeTimeoutRef.current = window.setTimeout(function () {
      wordArtScrollResumeTimeoutRef.current = null;
      startWordArtVersionInterval();
    }, WORDART_SCROLL_RESUME_DELAY_MS);
  }

  function handleWordArtScroll() {
    pauseWordArtVersionIntervalForScroll();
    scheduleWordArtResumeAfterScroll();
  }

  function handleToggleWordArtVersions() {
    if (wordArtIntervalRef.current) {
      stopWordArtVersionInterval();
      return;
    }

    startWordArtVersionInterval();
  }

  useEffect(function () {
    if (window.location.hash.startsWith("#wiki-sec")) {
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search
      );
    }
  }, []);

  useEffect(function () {
    const root = document.querySelector("#hello .wiki-vector-content");

    if (!root) {
      return undefined;
    }

    const initialVersion = {
      id: "wordart-version-0",
      label: "Initial",
      changedCount: 0
    };

    wordArtRootRef.current = root;
    wordArtVersionsRef.current = [initialVersion];
    latestChangedCountRef.current = 0;
    versionIndexRef.current = 0;
    latestWordArtVersionIdRef.current = initialVersion.id;
    selectedWordArtVersionIdRef.current = initialVersion.id;
    setWordArtVersions([initialVersion]);
    setSelectedWordArtVersionId(initialVersion.id);
    isWordArtManuallyStoppedRef.current = false;
    setIsWordArtStopped(false);

    initializeWikiTextCloning(root);
    applyRandomWordArtCount(root, initialVersion.changedCount);
    startWordArtVersionInterval();

    const scrollRoots = [
      document.querySelector("#wikiMainScroll"),
      document.querySelector("#hello")
    ].filter(Boolean);

    scrollRoots.forEach(function (scrollRoot) {
      scrollRoot.addEventListener("scroll", handleWordArtScroll, { passive: true });
    });

    return function () {
      clearWordArtVersionInterval();

      if (wordArtScrollResumeTimeoutRef.current) {
        window.clearTimeout(wordArtScrollResumeTimeoutRef.current);
        wordArtScrollResumeTimeoutRef.current = null;
      }

      scrollRoots.forEach(function (scrollRoot) {
        scrollRoot.removeEventListener("scroll", handleWordArtScroll);
      });

      wordArtRootRef.current = null;
    };
  }, []);

  return (
  <div className="page-shell">
    {/* 全站搜索顶栏：搜索框 + Donate 等（不含 Recall clones） */}
    <header className="site-global-header wiki-vector-header" id="siteGlobalHeader">
      <div className="wiki-vector-header-inner">
        <div className="wiki-logo-slot">
          <WikiLogoCarousel />
        </div>

        <form className="wiki-search-form" id="wikiSearchForm" action="#" method="get">
          <input
            className="wiki-search-input"
            id="wikiSearchInput"
            type="search"
            name="search"
            placeholder="Search Cyclopedia"
            aria-label="Search Cyclopedia"
          />
          <button className="wiki-search-button" type="submit">Search</button>
        </form>

        <nav className="wiki-header-links" aria-label="Personal tools">
          <a href="#">Donate</a>
          <a href="#">Create account</a>
          <a href="#">Log in</a>
        </nav>
      </div>
    </header>

    {/* 首页：Cyclopedia Vector 三栏版式 */}
    <section
      id="hello"
      className={"section active" + (isTocHidden ? " wiki-toc-collapsed" : "")}
    >
      <div className="wiki-mobile-shell">
        <div className="wiki-mobile-chrome-top" aria-hidden="true">
          <div className="wiki-mobile-status">
            <span className="wiki-mobile-time">19:23</span>
            <span className="wiki-mobile-status-icons">▮▮▮ ▮ WiFi 🔋</span>
          </div>
          <div className="wiki-dynamic-island"></div>
          <div className="wiki-mobile-url-bar">
            <span className="wiki-mobile-url-icon">Aa</span>
            <span className="wiki-mobile-url-text">en.cyclopedia.org</span>
            <span className="wiki-mobile-url-refresh">↻</span>
          </div>
        </div>

      <div className="wiki-vector">
        <div className="wiki-vector-body">
          <aside className="wiki-vector-toc" aria-label="Table of contents">
            <div className="wiki-toc-head">
              <strong>Contents</strong>
              <button
                type="button"
                className="wiki-toc-hide"
                id="wikiTocHide"
                onClick={function () {
                  setIsTocHidden(function (hidden) {
                    return !hidden;
                  });
                }}
              >
                {isTocHidden ? "show" : "hide"}
              </button>
            </div>

            <WikiTocNav id="wikiTocNav" />
          </aside>

          <main className="wiki-vector-main">
            <div className="wiki-article-title-row">
              <div className="wiki-toc-hover-anchor">
                <button
                  type="button"
                  className="wiki-toc-toggle"
                  aria-label="Show table of contents"
                >
                  <span className="wiki-toc-toggle-icon" aria-hidden="true"></span>
                </button>
                <div className="wiki-toc-popover" role="navigation" aria-label="Table of contents">
                  <div className="wiki-toc-popover-head">
                    <strong>Contents</strong>
                  </div>
                  <WikiTocNav className="wiki-toc-nav wiki-toc-nav--popover" />
                </div>
              </div>
              <h1 className="wiki-article-title">Cyberclone</h1>
            </div>

            <div className="wiki-article-tools">
              <div className="wiki-article-tabs">
                <span className="wiki-tab wiki-tab--active">Article</span>
                <a className="wiki-tab" href="#">Talk</a>
              </div>
              <div className="wiki-article-views">
                <span className="wiki-view wiki-view--active">Read</span>
                <a className="wiki-view" href="#">View source</a>
                <a className="wiki-view" href="#">View history</a>
              </div>
            </div>

            <hr className="wiki-article-divider" />

            <article className="wiki-vector-content" id="wikiMainScroll">
              <WikiProfileInfobox />

              <p className="wiki-lead">
                <strong>Cyberclone: The Internet, Memes, and Mass Imitation</strong><br />
                By collecting internet images related to Kardashian family memes from 2007 to 2026, this website
                examines how meme-driven imitation influences consumption, identity, embodiment, etc.
              </p>

              <h2 id="wiki-sec-abstract" className="wiki-heading">Abstract</h2>
              <p>
                This essay proposes Cyberclone as a way to describe how <a className="wiki-inline-link" href="#" data-preview-index="1">internet memes</a> move beyond digital images
                and begin to shape real bodies, language, identities, and forms of consumption. Cyberclone does
                not refer to biological cloning. It refers to a cultural process in which <a className="wiki-inline-link" href="#" data-preview-index="2">memes act</a> like repeatable
                templates. Through viewing, sharing, editing, remixing, performing, buying, dressing up, using
                filters, and imitating body gestures, users gradually become living variations following the same
                cultural pattern. The essay takes Kardashian-related memes as its main case study. These memes are
                not treated as simple jokes or isolated images. They are understood as viral cultural systems that
                connect celebrity culture, social media performance, amateur video production, beauty tutorials,
                profile pictures, body modification, filters, and meme products.
              </p>

              <h2 id="wiki-sec-1" className="wiki-heading">What Is Cyberclone?</h2>

              <h3 id="wiki-sec-1-1" className="wiki-heading">Concept</h3>
              <p>
                Cyberclone is a speculative concept. It borrows from the idea of reproductive cloning, where an
                existing life form can be used as a model for producing another similar life form. In this essay,
                however, cloning is not used in a biological sense. It is used as <a className="wiki-inline-link" href="#" data-preview-index="3">a cultural metaphor</a>. A meme is
                understood as a kind of cultural gene, and the public approaches this cultural gene through joking,
                sharing, imitation, consumption, performance, and bodily practice. Through these repeated actions,
                users may become cultural clones within cyberspace: Cyberclones.
              </p>
              <p>
                Cyberclone describes a process in which a meme does not remain a single image, video, or phrase.
                Once a meme enters the internet, it becomes part of a larger loop of screenshots, reposts, edits,
                remixes, voiceovers, beauty tutorials, filters, costumes, products, and bodily imitation. It gains
                new versions each time it is used. It creates new branches each time it is changed. The meme survives
                because it is copied, and it grows because each copy is slightly different.
              </p>
              <p>
                People still keep their own faces, names, and identities, but their ways of speaking, posing,
                dressing, reacting, consuming, and presenting bodies gradually follow <a className="wiki-inline-link" href="#" data-preview-index="4">the same public pattern</a>.
                Cyberclone produces cultural similarity. The meme becomes a model, and the user becomes a living
                variation of that model.
              </p>
              <p>
                The &ldquo;clone&rdquo; in this essay is not an identical copy, but a cultural variant shaped by
                the same memetic structure. A Cyberclone is therefore a user whose speech, gestures, profile image,
                make-up, body image, style, or <a className="wiki-inline-link" href="#" data-preview-index="7">consumer behavior</a> has been partially reorganized by a meme.
              </p>

              <h3 id="wiki-sec-1-2" className="wiki-heading">Core Argument</h3>
              <p>
                The central question of Cyberclone is: How do memes affect contemporary life?
              </p>
              <p>
                Memes are usually understood as humorous, ironic, or exaggerated forms of online communication that
                transform social events, emotions, and opinions into easily shareable images, phrases, sounds, and
                symbols. However, this essay is more concerned with what happens when memes are repeatedly viewed,
                used, edited, reenacted, and uploaded again. In this process, memes <a className="wiki-inline-link" href="#" data-preview-index="5">exceed the space of the screen</a>
                and enter everyday language, posture, consumption, bodily expression, and identity formation. In
                this sense, Cybercloning describes a process through which users gradually <a className="wiki-inline-link" href="#" data-preview-index="6">approach a shared cultural
                template</a>, blurring virtual and physical boundaries.
              </p>
              <WikiLabThumbCanvas />
              {/* <figure className="wiki-thumb wiki-thumb-lab">
                <div className="wiki-thumb-inner">
                  <a
                    className="wiki-thumb-image-link"
                    href="#lab"
                    data-section-link="lab"
                    aria-label="Open Cyberclone Laboratory"
                  >
                    <img src="/wiki/show (28).png" alt="Cyberclone Laboratory" width="220" height="165" draggable={false} />
                  </a>
                  <figcaption className="wiki-thumb-caption">
                    Kris Jenner Memes
                  </figcaption>
                </div>
              </figure> */}

              <h3 id="wiki-sec-1-3" className="wiki-heading">Meme</h3>
              <p>
                The term &ldquo;meme&rdquo; was introduced by Richard Dawkins in <em>The Selfish Gene</em>. Dawkins
                described the meme as a unit of cultural transmission that spreads through imitation, in a way
                comparable to how genes replicate biologically (Dawkins 1976). Melodies, catchphrases, fashion
                trends, beliefs, and ideas can all be understood as examples of memes in this broader cultural sense
                (Dawkins 1976).
              </p>
              <p>
                Internet memes differ from ordinary images because they are participatory, editable, authorless, and
                continuously transformable. Limor Shifman defines an internet meme not as a single successful image or
                joke, but as a group of <a className="wiki-inline-link" href="#" data-preview-index="8">digital items</a> that share characteristics of content, form, or stance, are
                created with awareness of each other, and are circulated, imitated, or transformed by many users
                online (Shifman 2014, 41&ndash;42). This definition is important because it shifts the meme from a
                single object to a changing group of related versions.
              </p>
              <p>
                In the digital environment, images, sounds, texts, and videos can be captured, edited, renamed,
                remixed, and returned to the communication circuit almost immediately. <em>Eternal September</em>
                describes this condition as one in which the metamorphic nature of cultural products increases
                because any content can be edited in real time and fed back into circulation (VV.AA. 2014, 8). As a
                result, the viewer is no longer only a receiver of content, but becomes one of the nodes through
                which the meme continues to reproduce.
              </p>
              <p>
                Therefore, <a className="wiki-inline-link" href="#" data-preview-index="9">the popularity of memes</a> today is not simply the popularity of images. It is a form of mass
                imitation. People do not only repost funny images in chats; they answer with meme phrases, pose
                photographs according to meme formats, purchase meme products, shoot short imitation videos, copy
                meme sounds, and participate in meme trends. This essay calls this meme-based embodied imitation,
                extended into consumption, language, and bodily practice, Cyberclone.
              </p>

              <Link href="/lab">
              <figure className="wiki-thumb wiki-thumb-lab">
                <div className="wiki-thumb-inner">
                 
                    <img src="/public/images/hello-gif.gif" alt="Cyberclone Laboratory" draggable={false} />
                
                  <figcaption className="wiki-thumb-caption">
                    Cyberclone Laboratory, used for observing meme replication and cultivating specimens in a simulated research environment.
                  </figcaption>
                </div>
              </figure>

              </Link>

              <h2 id="wiki-sec-2" className="wiki-heading">Meme, Imitation, and Clone</h2>

              <h3 id="wiki-sec-2-1" className="wiki-heading">Imitation</h3>

              <p>
                The Greek word mimema, meaning &ldquo;<a className="wiki-inline-link" href="#" data-preview-index="10">that which is imitated</a>,&rdquo; is the linguistic root of the word
                meme. Imitation has long existed as a mechanism of survival, learning, and social formation. Gabriel
                Tarde argued that society is fundamentally organized through imitation, and that social phenomena such
                as fashion, religion, custom, and collective behavior spread through repeated acts of copying (Tarde
                1903). Human beings learn language, gestures, manners, and social norms through imitation. Many animals
                also use imitation for protection, camouflage, adaptation, or hunting.
              </p>
              <p>
                <a className="wiki-inline-link" href="#" data-preview-index="11">Imitation is a natural mechanism</a> of replication: it allows an individual to repeat an existing pattern
                and enter a surrounding environment more quickly. In the biological world, mimicry is one of the most
                typical visual forms of imitation. Some organisms gradually come to resemble the appearance, behavior, or
                survival strategies of other organisms through long-term evolution. For example, <a className="wiki-inline-link" href="#" data-preview-index="12">the mimic octopus</a> can
                imitate the forms and movements of sea snakes, lionfish, and other marine animals in order to gain
                protection or approach prey (Norman, Finn, and Tregenza 2001). In this case, imitation appears as a
                movement toward an external object.
              </p>
              <p>
                Imitation can also appear as convergence within a group. When a large number of individuals live in
                similar environments for long periods of time, they may gradually come to share similar colors, forms,
                and behavioral characteristics. As a visual analogy, the repeated stripe patterns and highly similar
                bodily forms of clownfish can make the group appear as if it were continuously generated <a className="wiki-inline-link" href="#" data-preview-index="13">from the same
                template</a>. In this situation, the object of imitation is no longer a single external individual, but the
                group itself.
              </p>
              <p>
                For Cyberclone, these two forms of imitation also exist within the internet environment. On the one
                hand, users actively imitate recognizable and highly iconic memes. Like mimetic organisms imitating a
                &ldquo;sea snake,&rdquo; they move closer to an already recognized image in order to obtain attention,
                traffic, and a symbolic form of <a className="wiki-inline-link" href="#" data-preview-index="14">&ldquo;protection.&rdquo;</a> Imitation helps individuals integrate into
                their environment. However, this environment is no longer a biological ecosystem, but <a className="wiki-inline-link" href="#" data-preview-index="15">a cybernetic
                space composed</a> of images, language, platforms, and algorithms. Within this space, individuals are
                expected to constantly shape their own distinct online identities and images, while at the same time
                relying on shared cultural symbols to shape their gestures and phrases to complete their expressions. In
                other words, users may appear to display individuality through memes, but in practice they often depend
                on templates that have already been widely <a className="wiki-inline-link" href="#" data-preview-index="16">circulated by others</a>.
              </p>
              <p>
                This contradiction is related to the logic of &ldquo;<a className="wiki-inline-link" href="#" data-preview-index="17">networked individualism</a>.&rdquo; In an increasingly
                individualized contemporary society, people are expected to construct a unique self and display their
                difference through images, videos, profile pictures, language, and consumer choices. At the same time,
                however, expression on social networks depends heavily on shared cultural symbols. When users upload
                self-made videos, edited images, or memes, they may seem to demonstrate digital literacy, creativity,
                and personal style; yet their text, posture, and visual form often point back to a common memetic
                template that has already been widely circulated. Therefore, when certain memes, gestures, or phrases
                become default markers of trend awareness, individuals repeatedly reproduce these templated expressions
                in order to show that they &ldquo;know the meme&rdquo; and can be recognized as part of the group. When
                more and more people move toward the same cultural gene in pursuit of visibility and belonging,
                imitation is no longer merely scattered individual behavior. It gradually develops into a large-scale
                phenomenon of cultural cloning.
              </p>

              <h3 id="wiki-sec-2-2" className="wiki-heading">Mass Imitation</h3>
              <p>
                Mass imitation did not begin with the internet. In the early twentieth century, audiences did not only
                watch Chaplin films; they copied his costume, posture, walk, and <a className="wiki-inline-link" href="#" data-preview-index="19">comic gestures</a>. This suggests that
                imitation is not limited to visual repetition. It can also produce consumer goods, impersonation
                contests, costumes, music, identity performance, and shared <a className="wiki-inline-link" href="#" data-preview-index="20">aesthetic taste</a>.
              </p>
              <p>
                The internet did not invent imitation, but it changed its speed, scale, and feedback structure. Before
                the internet, imitation usually spread through cinema, magazines, dance halls, commodities, celebrity
                culture, or physical gatherings. On the internet, an image, sound, phrase, or video fragment can be
                clipped, edited, uploaded, circulated, reenacted, and returned to the platform within a very short
                time. <a className="wiki-inline-link" href="#" data-preview-index="21">Every viewer can immediately</a> become another imitator, editor, performer. Charlie Chaplin&rsquo;s
                image generated a large wave of public imitation, often described as &ldquo;Chaplinitis&rdquo; or
                &ldquo;<a className="wiki-inline-link" href="#" data-preview-index="18">Chaplin fever</a>.&rdquo;
              </p>
              <p>
                This is why Cyberclone focuses on meme culture as a contemporary form of mass imitation. Meme culture
                does not simply repeat older forms of celebrity imitation; it accelerates them. The meme becomes <a className="wiki-inline-link" href="#" data-preview-index="22">a
                template</a>, the platform becomes a circulation machine, and the user becomes both audience and producer.
              </p>

              <h3 id="wiki-sec-2-3" className="wiki-heading">Clone</h3>
              <p>
                In the internet age, imitation is amplified globally and synchronously. When imitation becomes highly
                repetitive, platform-driven, and technically reproducible, it begins to approach a cultural form of
                cloning. The clone in this essay is therefore not a biological copy, but a cultural figure produced
                through repeated proximity to the same template.
              </p>
              <p>
                In biology, <a className="wiki-inline-link" href="#" data-preview-index="23">Dolly</a> the sheep became famous as the first mammal cloned from an adult cell. Dolly&rsquo;s
                birth made cloning visible to a wide public and showed that an existing living organism could become the
                template for another highly similar organism (National Museums Scotland n.d.). The cultural imagination
                of cloning has since been associated with questions of identity, individuality, freedom, and the
                disappearance of difference.
              </p>
              <p>
                This essay borrows the concept of cloning in order to ask a different question: when a cultural gene
                can be copied repeatedly across global platforms, are people&rsquo;s expressions, gestures, identities,
                and bodies also <a className="wiki-inline-link" href="#" data-preview-index="24">being cloned</a>? Even if no biological life is being reproduced, cultural life may still
                be organized through replication. Cyberclone names this process.
              </p>

              <WikiGestureCaptcha />

              <h3 id="wiki-sec-2-4" className="wiki-heading">The Kardashians</h3>
              <p>
                This essay uses a series of memes related to The Kardashians to examine Cyberclone. Kardashian memes
                often appear light, comic, excessive, or unserious, but they carry specific emotions, values,
                lifestyles, and cultural fantasies. They invite users not only to watch or laugh, but also to reproduce,
                embody, and perform.
              </p>
              <p>
                When users repeatedly encounter <a className="wiki-inline-link" href="#" data-preview-index="25">Kardashian-related memes</a>, they may begin to imitate the same set of
                gestures, poses, phrases, make-up styles, clothes, or body ideals. They may quote Kardashian-style lines
                in conversation, use Kardashian images as profile pictures, imitate Kardashian facial expressions,
                purchase similar products, or temporarily construct themselves as a &ldquo;Kardashian-style&rdquo; girl.
                In this process, the meme does not remain a digital joke. It becomes a cultural gene that organizes
                images, bodies, identities, and commodities.
              </p>
              <p>
                Cyberclone is therefore not concerned with a single act of imitation. It is concerned with how repeated
                cultural genes accumulate, circulate, and intensify until they produce a systematic cloning effect.
              </p>

              <h2 id="wiki-sec-3" className="wiki-heading">Memes Are Not Only Memes</h2>
              <p>
                Dawkins noted that memes do not necessarily spread in isolation; they may combine with other ideas,
                images, beliefs, and behaviors to form larger cultural structures (Dawkins 1976). In contemporary
                internet culture, what circulates is rarely only the meme itself. A meme may also carry desires, values,
                <a className="wiki-inline-link" href="#" data-preview-index="26">identities, social fantasies</a>, and models of lifestyle.
              </p>
              <p>
                This is especially clear in the case of Kardashian-related memes. When users engage with Kardashian
                memes, they are not only circulating pictures of Kim Kardashian or Kris Jenner. They are also
                circulating fantasies of wealth, celebrity, media visibility, beauty, bodily transformation, family power,
                and success. This is why memes should be understood not only as visual content, but as cultural
                structures that connect images to ways of living.
              </p>
              <p>
                <em>Buffalo Viral</em> <a className="wiki-inline-link" href="#" data-preview-index="27">frames virality</a> as a broader contemporary condition that includes memes,
                influencers, make-up tutorials, and social media experiments (<em>Buffalo Zine</em> 2021). This broader
                framework is useful for Kardashian memes because they do not remain inside the category of the joke. They
                move across <a className="wiki-inline-link" href="#" data-preview-index="28">profile pictures</a>, make-up tutorials, short videos, filters, fashion, avatars, pet celebrities,
                and consumer products.
              </p>

              <h3 id="wiki-sec-3-1" className="wiki-heading">#KrisJennerPFP Trend</h3>
              <p>
                The #KrisJennerPFP Trend became visible in Chinese social media contexts around 2026. In this trend,
                users edited images of Kris Jenner and used them as social media profile pictures. These edits often
                included <a className="wiki-inline-link" href="#" data-preview-index="60">visual symbols related to wealth</a>, such as money, skyscrapers, wine glasses, luxury restaurants,
                offices, lawyers, financial workers, bosses, and successful professionals. In many discussions, users
                connected this practice to manifestation, imagining that repeated exposure to Kris Jenner&rsquo;s image
                could attract wealth, career opportunities, or a more desirable lifestyle.
              </p>
              <p>
                As the trend spread, more users began to use <a className="wiki-inline-link" href="#" data-preview-index="29">similar Kris Jenner profile pictures</a>. In group chats, comment
                sections, and social media feeds, multiple edited Kris Jenner avatars could appear on the same screen at
                once. Although each avatar might have a different background or wealth symbol, the repeated face produced
                a strong visual impression of multiplication. The screen began to look as if many versions of Kris Jenner
                were communicating with each other.
              </p>
              <p>
                This trend also extended into <a className="wiki-inline-link" href="#" data-preview-index="30">bodily practice</a>. Users began to upload Kris Jenner <a className="wiki-inline-link" href="#" data-preview-index="31">make-up videos</a>,
                imitating her hairstyle, facial expression, pose, and photographic style. In this process, Kris Jenner
                ceased to be only an image used as a profile picture. She became a bodily template that could be dressed,
                performed, and temporarily inhabited.
              </p>

              <h3 id="wiki-sec-3-2" className="wiki-heading"><a className="wiki-inline-link" href="#" data-preview-index="32">#Krissed</a></h3>
              <p>
                #Krissed began as a form of online prank. The meme usually interrupts a normal video, image, or narrative
                by suddenly inserting Kris Jenner dancing in a green sequin dress, often accompanied by the phrase
                &ldquo;You&rsquo;ve been Krissed.&rdquo; Know Your Meme traces the visual source of the green dress clip
                to an amateur Kardashian family music video posted by Kendall and Kylie Jenner, in which Kris Jenner
                appears dancing and lipsyncing in the dress (Know Your Meme 2022a).
              </p>
              <p>
                As the meme spread, the green sequin dress gradually separated from its original context and became a
                highly recognizable visual sign. Users produced reaction images, edited clips, screenshots, and reposted
                versions of the same visual structure. The meme then moved from screen-based circulation into physical
                life. Many users began to imitate the Kris Jenner look. Participants often wore short black wigs,
                oversized sunglasses, and green sequin dresses. At first, these imitations appeared as single-person photos
                or short videos. Later, they developed into <a className="wiki-inline-link" href="#" data-preview-index="33">group performances</a> in which several people appeared together
                in matching costumes.
              </p>
              <p>
                In these images, the repetition of clothing, hair, sunglasses, and facial expression creates an almost
                <a className="wiki-inline-link" href="#" data-preview-index="34">cloned visual effect</a>. Several &ldquo;Kris Jenners&rdquo; appear in the same frame, turning the meme into a
                scene of replicated bodies. The photos are then screenshotted, collaged, and reposted, returning the
                bodily imitation back into the digital loop.
              </p>

              <h2 id="wiki-sec-4" className="wiki-heading">Attention, Prestige, and Self-Commodification</h2>
              <p>
                The Kardashians are such a template. Through reality television, tabloid coverage, social media exposure,
                beauty branding, and <a className="wiki-inline-link" href="#" data-preview-index="35">celebrity circulation</a>, their faces, voices, bodies, gestures, and lifestyles have been
                repeatedly recorded and redistributed. This media saturation makes them easy to recognize and easy to
                imitate. Their public image becomes a collection of fragments that can be clipped, quoted, performed, and
                remixed.
              </p>
              <p>
                The spread of memes depends not only on content, but also on prestige and attention. People are more likely
                to <a className="wiki-inline-link" href="#" data-preview-index="36">notice, imitate, and share figures</a> that already possess visibility or symbolic status. A person or
                object that is socially recognizable is therefore more likely to become a reproducible cultural template.
              </p>
              <p>
                This mechanism is visible in creators such as TikTok creators Angelo and Lexi. Their Kardashian-related
                videos do not aim for exact professional reproduction. Instead, they often use exaggerated mannerisms and
                comic timing to reenact Kardashian meme fragments. Even when gender, age, body type, <a className="wiki-inline-link" href="#" data-preview-index="37">long nails</a>, or appearance does not
                match the Kardashian family members, viewers can still identify the source through voice, timing,
                gestures, and dialogue. In online culture, amateur aesthetics can function as proof of immediacy,
                authenticity, enthusiasm, and participation (VV.AA. 2014, 9).
              </p>
              <p>
                The meme therefore survives not through physical identity, but through recognizable performance codes. This
                phenomenon is closely connected to the <a className="wiki-inline-link" href="#" data-preview-index="38">attention economy of social media platforms</a>. For online creators,
                remaking a popular meme is often more efficient than inventing a completely new narrative. Once one user
                gains attention through a meme reenactment, other users can see the possibility of success and join the
                chain of imitation. The meme becomes not an image being shared, but an entrance point for visibility.
              </p>
              <p>
                From the perspective of Cyberclone, platforms function like <a className="wiki-inline-link" href="#" data-preview-index="39">a cultural cloning chamber</a>. The more attention
                a meme receives, the more imitations and variations it generates. In order to gain similar attention,
                creators insert themselves into the meme&rsquo;s production chain. They imitate successful formats,
                gestures, voices, and editing styles. Through this repeated process, they gradually become Cyberclones of
                the meme.
              </p>

              <h2 id="wiki-sec-5" className="wiki-heading">The Embodiment of Meme</h2>

              <h3 id="wiki-sec-5-1" className="wiki-heading">Virtuality and Reality</h3>
              <p>
                Memes are produced and circulated through virtual networks, but the imitations they generate connect
                digital images to real bodies. A meme may begin as an image or a video file, yet its reproduction often
                requires bodies to perform posture, expression, voice, rhythm, costume, make-up, and gesture. When a user
                imitates a meme image or video, the body must be adjusted. The angle of the head, the bend of the back, the
                placement of the hands, the movement of the mouth, the direction of the eyes, and the style of clothing or
                make-up may all become part of the imitation. This is especially important in video memes, because video
                memes contain not only visual composition but also rhythm, voice, pauses, and bodily timing.
              </p>
              <p>
                A video that enters the internet can detach from its original context and be renamed, clipped, imitated,
                redistributed, and misunderstood. In <em>Eternal September</em>, Matthias Fritsch describes how a video
                that goes viral can leave the author&rsquo;s control, circulate under different titles, and become
                meaningful through community reactions and reinterpretations (Fritsch in VV.AA. 2014, 26&ndash;29). This
                logic is essential for understanding Kardashian memes: their meaning is not fixed by the original television
                scene, but regenerated through imitation.
              </p>

              <h3 id="wiki-sec-5-2" className="wiki-heading">#<a className="wiki-inline-link" href="#" data-preview-index="40">If You Know How I Feel, Why Would You Say That</a></h3>
              <p>
                This meme comes from a crying scene featuring Kim Kardashian. In the scene, Kim says, &ldquo;If you know how
                I feel, why would you say that.&rdquo; The scene later separated from its original television context and
                became a reaction image, GIF, and short-video reference. <em>Teen Vogue</em> describes the &ldquo;crying Kim
                Kardashian&rdquo; face as a widely recognized meme that has been reproduced through make-up and visual art.
              </p>
              <p>
                In this case, each imitation video includes acts of watching, learning, rehearsing, and filming. Users study
                Kim Kardashian&rsquo;s <a className="wiki-inline-link" href="#" data-preview-index="41">facial expression</a>, the angle of the eyebrows, the direction of the eyes, the movement
                of the lips, the rhythm of the voice, and the gesture of wiping away tears. Some imitators may also use wigs,
                make-up, clothing, and other styling elements to approach her appearance and reproduce the original scene.
                They then film and upload the result back to the platform.
              </p>
              <p>
                The meme therefore does not spread only as a video file. It spreads as a repeated emotional script. A
                specific way of crying, speaking, pausing, and looking becomes transferable between bodies. The meme is no
                longer only Kim Kardashian&rsquo;s face; it becomes a reproducible structure of emotional performance.
              </p>

              <h3 id="wiki-sec-5-3" className="wiki-heading">#Never Go Against the Family</h3>
              <p>
                It is associated with a line spoken by Khlo&eacute; Kardashian and Kris Jenner in the trailer for
                Hulu&rsquo;s <em>The Kardashians</em>, and it became a TikTok sound used in ironic lip-dub videos (Know Your
                Meme 2022b). In Kardashian-related meme culture, the phrase also connects to the family&rsquo;s long-standing
                public image as a coordinated family unit about <a className="wiki-inline-link" href="#" data-preview-index="42">power</a>, loyalty, and collective defensiveness.
              </p>
              <p>
                Unlike memes centered on one individual expression, this meme is concerned with how a group appears
                together. It reproduces not only a face or gesture, but a structure of collective presence. Users imitate the
                Kardashian family&rsquo;s coordinated visual language through group posing, shared color schemes,
                <a className="wiki-inline-link" href="#" data-preview-index="43">synchronized movement</a>, dramatic entrance, and direct gazes toward the camera. Participants organize
                themselves in the frame, adjust distance and hierarchy, and perform a collective image.
              </p>
              <p>
                In this cloned bodily process, what is repeated is not one fixed pose. It is a visual structure of family
                unity and bodily power. At this point, embodiment is not only individual imitation, but also a collective
                process. Users repeat the same meme through different bodies, voices, cameras, and situations, turning
                themselves from passive viewers into active producers (VV.AA. 2014, 8&ndash;9). Each version is slightly
                different, but together they form a recognizable <a className="wiki-inline-link" href="#" data-preview-index="44">collective body</a> of the meme.
              </p>

              <h3 id="wiki-sec-5-4" className="wiki-heading">#You&rsquo;re Doing Amazing, Sweetie</h3>
              <p>
                It comes from a 2007 episode of <em>Keeping Up with the Kardashians</em>, in which Kris Jenner photographs and
                encourages Kim Kardashian during a Playboy shoot (Dictionary.com 2018). Online, the phrase became a
                catchphrase and reaction image used to <a className="wiki-inline-link" href="#" data-preview-index="45">express exaggerated encouragement</a> (Know Your Meme 2016).
              </p>
              <p>
                This meme is not only linguistic. It also contains <a className="wiki-inline-link" href="#" data-preview-index="46">a media posture</a>. Kris Jenner&rsquo;s act of holding a
                camera, approaching the subject, watching intensely, and recording the moment becomes part of the meme&rsquo;s
                structure. When users repeat the phrase while filming a friend, pet, family member, or ordinary daily action,
                they also imitate a way of looking and recording others. The meme transforms encouragement into a
                performative act of mediated attention.
              </p>

              <h3 id="wiki-sec-5-5" className="wiki-heading"><a className="wiki-inline-link" href="#" data-preview-index="47">Imitative Inertia</a></h3>
              
              <Link href="/archive">
              <figure className="wiki-thumb wiki-thumb-archive">
                <div className="wiki-thumb-inner">
               
                    <img src="/public/images/book-preview.gif" alt="Cyberclone Archive" draggable={false} />
              
                  <figcaption className="wiki-thumb-caption">
                    Cyberclone Archive stores all Kardashian family meme imagery from 2007 to 2026.
                  </figcaption>
                </div>
              </figure>
              </Link>
              <p>
                Many classic meme sounds, gestures, and phrases detach from their original scenes and enter everyday life.
                Kardashianintonation, raspy tones, exaggerated pauses, dragged-out vocal habits, and performative gestures can
                appear in joking conversations between friends. In these situations, users are drawing a memetic reservoir
                of speech and dramatic expression without always consciously reenacting a complete scene.
              </p>
              <p>
                &ldquo;You&rsquo;re Doing Amazing, Sweetie&rdquo; is a useful example. On the surface, it is a phrase of
                encouragement. In actual use, however, it often carries the distance and irony produced by meme culture. A
                situation that might have required <a className="wiki-inline-link" href="#" data-preview-index="48">a specific emotional response can be replaced</a> by ready-made internet
                phrases.
              </p>

              <h2 id="wiki-sec-6" className="wiki-heading">Identity and Participatory Popularity</h2>


              <Link href="/test">
              <figure className="wiki-thumb wiki-thumb-left">
                <div className="wiki-thumb-inner">
                
                    <img src="/public/images/cyberclone-07.gif" alt="Cyberclone Test" draggable={false} />
               
                  <figcaption className="wiki-thumb-caption">
                    Cyberclone Test measures the degree to which users are influenced by memes.
                  </figcaption>
                </div>
              </figure>
              </Link>

              <h3 id="wiki-sec-6-1" className="wiki-heading">Participatory Popularity</h3>
              <p>
                Cyberclone is a participatory form of identity replication. Users often imitate memes not because they are
                deeply committed to the content itself, but because participation in <a className="wiki-inline-link" href="#" data-preview-index="49">the trend</a> becomes a form of social
                presence. By gesture, pose, repeating a shared body feature, or phrase, the user proves to a wider audience
                that they belong to a particular online moment.
              </p>
              <p>
                When bodily imitation becomes a mass trend, it also produces new forms of markets for tools, cosmetics,
                clothing, filters, shaping devices, and even medical or cosmetic services. In this way, imitation and
                consumption become bound together. The desire to repeat a popular bodily style can generate entire commercial
                ecosystems.
              </p>

              <h3 id="wiki-sec-6-2" className="wiki-heading">#Kylie Jenner Lip Challenge</h3>
              <p>
                Participants used bottles, cups, or other suction-based objects to temporarily swell their lips in order to
                imitate Kylie Jenner&rsquo;s signature <a className="wiki-inline-link" href="#" data-preview-index="50">lip shape</a>. It became a viral trend in 2015. Medical professionals
                warned that this practice could cause bruising, blistering, swelling, infection, and tissue damage (Global
                News 2015; ABC News 2015).
              </p>
              <p>
                The challenge is important for Cyberclone because the body becomes the surface on which the meme is
                performed. Most participants were not necessarily committed to mainstream <a className="wiki-inline-link" href="#" data-preview-index="52">beauty standards</a> or the lip shape as a permanent aesthetic ideal.
                Instead, the temporary swelling functioned as proof of participation. Once the challenge became visible, more
                users joined not only because they wanted to imitate Kylie Jenner, but because participation itself became
                part of the viral event. The act of trying the challenge, filming the result, and uploading it became a way
                to show that one was aware of the trend online. In this sense, the challenge was less about permanently
                changing the body than about briefly following, performing, and displaying <a className="wiki-inline-link" href="#" data-preview-index="51">a shared internet moment</a>.
              </p>
              <p>
                Even if many users treated the challenge as a joke or temporary experiment, the repeated circulation of swollen
                lips still reinforced the visibility of a specific facial feature. In this sense, the meme did not simply imitate
                an existing aesthetic; it also helped normalize and amplify that aesthetic through mass participation.
              </p>
              <p>
                As the trend continued, the tools used in imitation also changed. At first, many participants used ordinary
                objects such as shot glasses, small cups, or bottles. As the challenge became more visible, organized and
                <a className="wiki-inline-link" href="#" data-preview-index="53">product-oriented</a> solutions emerged. Users were no longer only following the challenge casually; some began to
                seek a clearer, more controlled, or more dramatic result for the camera. This opened the challenge to <a className="wiki-inline-link" href="#" data-preview-index="54">a small
                consumer logic</a>. Suction-based lip plumping products offered a more &ldquo;professional&rdquo; version of the
                same bodily imitation. Instead of simply using a random cup, users could purchase devices designed
                specifically to produce fuller lips. The meme did not only create a visual trend; it also helped turn a
                temporary bodily performance into a market for lip-plumping devices and beauty products (303 Magazine 2015).
              </p>

              <h3 id="wiki-sec-6-3" className="wiki-heading">#Kardashian-Style Body</h3>
              <p>
                Kim Kardashian&rsquo;s body image can be understood as a meme, although it is not a meme in the form of a
                single captioned image or reaction GIF. What circulates is a recognizable bodily template: a narrow waist,
                emphasized hips, rounded buttocks, smooth skin, and highly staged photographic pose. Because this bodily
                template has become so recognizable and repeatedly circulated, many people begin to imitate it.
              </p>
              <p>
                Unlike many internet memes that can be reproduced through text, cropping, or reenactment, the Kardashian-style
                <a className="wiki-inline-link" href="#" data-preview-index="55">requires material assistance</a>. Users may rely on shapewear, <a className="wiki-inline-link" href="#" data-preview-index="56">padded underwear</a>, butt-lifting leggings, and
                contour clothing. At the same time, this meme may also reshape aesthetic desire itself, first through
                photo-editing apps and filters, then through dieting, gym routines, and surgery.
              </p>
              <p>
                This process turns bodily imitation into a consumer system. Products described through terms such as
                &ldquo;<a className="wiki-inline-link" href="#" data-preview-index="61">Kardashian butt,</a>&rdquo; &ldquo;Kardashian-style body,&rdquo; &ldquo;BBL effect,&rdquo; or
                &ldquo;hourglass figure&rdquo; translate the meme into purchasable objects and services. The goal is not only
                beauty, but proximity to a public memetic form. Through these products, the Kardashian-style body moves from
                celebrity image to meme, from meme to bodily desire, and from bodily desire to consumer practice.
              </p>

              <h2 id="wiki-sec-7" className="wiki-heading"><a className="wiki-inline-link" href="#" data-preview-index="57">Supermeme</a> and Merchandise</h2>

              <h3 id="wiki-sec-7-1" className="wiki-heading">Supermeme</h3>
              <p>
                This essay uses the term supermeme to describe a meme that exceeds short-term online circulation and enters
                broader systems of advertising, merchandise, physical display, and consumer culture. This term is used here as
                an analytical extension of Shifman&rsquo;s definition of internet memes as groups of digital items that are
                circulated, imitated, and transformed by multiple users (Shifman 2014, 41&ndash;42).
              </p>
              <p>
                A supermeme is not only shared online; it becomes a format for objects, products, and everyday performances.
                Supermemes move across media and enter consumer culture. They can become peripheral products such as stickers,
                T-shirts, mugs, and other exaggerated objects or public surfaces. Merchandise encourages people to purchase,
                collect, display, and repost memetic imagery offline. At the same time, supermemes can also be digitally
                applied to buses, airplanes, billboards, and <a className="wiki-inline-link" href="#" data-preview-index="63">advertising images</a>.
              </p>

              <h3 id="wiki-sec-7-2" className="wiki-heading">#Kim Kardashian Crying</h3>
              <p>
                The Kim Kardashian crying meme has been widely circulated as a reaction image and has also been reproduced in
                commercial and material forms. Online meme generators and <a className="wiki-inline-link" href="#" data-preview-index="58">image-sharing platforms</a> make it easy to reuse the
                crying Kim template, while merchandise platforms show how the image can be turned into stickers and other
                <a className="wiki-inline-link" href="#" data-preview-index="62">products</a> (Imgflip n.d.; Etsy n.d.).
              </p>
              <p>
                This process reveals another layer of Cyberclone. What is copied is not only Kim Kardashian&rsquo;s crying
                face, but also a way of using that face. Users cut it out, paste it onto unrelated scenes, print it on
                products, buy similar merchandise, photograph the object, and upload the photograph again. The image moves
                from screen to commodity and then back to screen.
              </p>
              <p>
                In this loop, the consumer is not only a buyer. The consumer becomes an executor of memetic reproduction. Each
                purchase, photograph, and upload creates another version of the same image template. The meme gains a material
                body through merchandise, and the merchandise becomes another path for the meme to reproduce.
              </p>

              <h2 id="wiki-sec-8" className="wiki-heading">Conclusion</h2>
              <p>
                Cyberclone is not the replication of a single meme image. It is a viral cultural system produced through
                viewing, sharing, editing, reenactment, imitation, consumption, embodiment, and redistribution. In this
                system, memes move from digital files into language, posture, identity, make-up, filters, commodities, and
                bodily modification.
              </p>
              <p>
                The Kardashian-related memes discussed in this essay show how a meme can become more than an online joke. A meme
                can become a profile picture, a group costume, a performance script, a vocal style, a body ideal, a beauty
                filter, or a commercial object. Each version remains different, but each remains connected to the same
                cultural template.
              </p>
              <p>
                A Cyberclone is therefore not an identical copy. It is a living variant shaped by a repeated memetic form.
                Cyberclone describes the moment when users no longer simply circulate memes, but become the bodies, voices,
                images, and consumers through which memes continue to live.
              </p>

              <h3 id="wiki-sec-8-refs" className="wiki-heading"><a className="wiki-inline-link" href="#" data-preview-index="59">References</a></h3>
              <ol className="wiki-references">
                <li>Dawkins, Richard. 1976. <em>The Selfish Gene</em>. Oxford: Oxford University Press.</li>
                <li>Shifman, Limor. 2014. <em>Memes in Digital Culture</em>. Cambridge, MA: MIT Press.</li>
                <li>Tarde, Gabriel. 1903. <em>The Laws of Imitation</em>. Translated by Elsie Clews Parsons. New York: Henry Holt and Company.</li>
                <li>VV.AA. 2014. <em>Eternal September: The Rise of Amateur Culture</em>. Edited by Domenico Quaranta. Brescia and Ljubljana: Link Editions and Aksioma.</li>
                <li><em>Buffalo Zine</em>. 2021. Issue Buffalo Viral.</li>
                <li>Dictionary.com. 2018. &ldquo;You&rsquo;re Doing Amazing, Sweetie.&rdquo;</li>
                <li>Global News. 2015. &ldquo;Kylie Jenner Lip Challenge Dangerous.&rdquo;</li>
                <li>ABC News. 2015. &ldquo;Kylie Jenner Lip Challenge Poses Serious Health Risks.&rdquo;</li>
                <li>303 Magazine. 2015. &ldquo;The Commercial Aftermath of the Kylie Jenner Lip Challenge.&rdquo;</li>
                <li>Know Your Meme. 2016. &ldquo;You&rsquo;re Doing Amazing, Sweetie.&rdquo;</li>
                <li>Know Your Meme. 2022a. &ldquo;Krissed.&rdquo;</li>
                <li>Know Your Meme. 2022b. &ldquo;Never Go Against the Family.&rdquo;</li>
                <li>Norman, Mark, Julian Finn, and Tom Tregenza. 2001. &ldquo;Dynamic Mimicry in an Octopus.&rdquo; <em>Proceedings of the Royal Society B</em>.</li>
                <li>Rainie, Lee, and Barry Wellman. 2012. <em>Networked: The New Social Operating System</em>. MIT Press.</li>
                <li>National Museums Scotland. n.d. Dolly the Sheep Archive.</li>
                <li>Imgflip. n.d. Meme Template Library.</li>
                <li>Etsy. n.d. Meme Merchandise Creator Guidelines.</li>
              </ol>
            </article>
          </main>

          <aside className="wiki-vector-tools" aria-label="Site navigation">
            <div className="wiki-tools-panel">
           

              <h2 className="wiki-tools-title">Appearance</h2>
              <form className="wiki-version-form" aria-label="WordArt version history">
                <div className="wiki-version-options">
                  {wordArtVersions.map(function (version) {
                    return (
                      <label className="wiki-version-option" key={version.id}>
                        <input
                          className="wiki-version-radio"
                          type="radio"
                          name="wordart-version"
                          checked={selectedWordArtVersionId === version.id}
                          onChange={function () {
                            handleWordArtVersionSelect(version);
                          }}
                        />
                        <span className="wiki-version-control" aria-hidden="true"></span>
                        <span className="wiki-version-copy">
                          <span className="wiki-version-time">{version.label}</span>
                          <span className="wiki-version-count">
                            Page Cloned ({version.changedCount} phrases)
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </form>
              <button
                className="wiki-version-stop"
                type="button"
                onClick={handleToggleWordArtVersions}
              >
                {isWordArtStopped ? "Start again" : "Stop cloning"}
              </button>
            </div>
          </aside>
        </div>
      </div>

        <nav className="wiki-mobile-browser-bar" aria-label="Mobile browser tools">
          <button type="button" className="wiki-browser-btn" aria-label="Back">‹</button>
          <button type="button" className="wiki-browser-btn wiki-browser-btn--disabled" aria-label="Forward" disabled>›</button>
          <button type="button" className="wiki-browser-btn" aria-label="Share">↑</button>
          <button type="button" className="wiki-browser-btn wiki-browser-btn--plus" aria-label="New tab">+</button>
          <button type="button" className="wiki-browser-btn wiki-browser-btn--tabs" aria-label="Tabs">19</button>
          <button type="button" className="wiki-browser-btn" aria-label="More">⋯</button>
        </nav>
      </div>
    </section>
    <WikiLinkPreviewLayer />
  </div>
  );
}
