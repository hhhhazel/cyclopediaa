/**
 * Cyclopedia (wiki article) search — ported from public/script.js.
 */
import { PENDING_CYCLopedia_SEARCH_KEY } from "./constants";
import {
  getMeaningfulSearchTokens,
  normalizeSearchText,
} from "./text";

let wikiSearchHighlightTimer = null;

function getHelloWikiRoot() {
  return document.querySelector("#hello .wiki-vector");
}

export function flashWikiSearchMiss(searchInput) {
  if (!searchInput) return;

  searchInput.classList.remove("wiki-search-miss");
  void searchInput.offsetWidth;
  searchInput.classList.add("wiki-search-miss");
}

function clearWikiSearchHighlights() {
  const helloWikiRoot = getHelloWikiRoot();
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

function scrollWikiSection(targetSelector) {
  const wikiMainScroll = document.getElementById("wikiMainScroll");
  if (!wikiMainScroll) return;

  const target = document.querySelector(targetSelector);
  if (!target) return;

  const containerTop = wikiMainScroll.getBoundingClientRect().top;
  const targetTop = target.getBoundingClientRect().top;
  const nextTop = wikiMainScroll.scrollTop + (targetTop - containerTop) - 10;

  wikiMainScroll.scrollTo({
    top: Math.max(0, nextTop),
    behavior: "smooth",
  });
}

function scrollToWikiSearchTarget(target) {
  if (!target) return;

  const wikiMainScroll = document.getElementById("wikiMainScroll");
  const helloSection = document.getElementById("hello");

  if (target.id && wikiMainScroll) {
    scrollWikiSection("#" + target.id);
    return;
  }

  if (wikiMainScroll && wikiMainScroll.contains(target)) {
    const containerTop = wikiMainScroll.getBoundingClientRect().top;
    const targetTop = target.getBoundingClientRect().top;

    wikiMainScroll.scrollTo({
      top: wikiMainScroll.scrollTop + (targetTop - containerTop) - 36,
      behavior: "smooth",
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

    if (
      textTokens.some(function (word) {
        return word === token;
      })
    ) {
      return 85;
    }

    if (
      textTokens.some(function (word) {
        return word.startsWith(token) && token.length >= 3;
      })
    ) {
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
  const helloWikiRoot = getHelloWikiRoot();
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
    const score = scoreWikiSearchMatch(
      heading.textContent || "",
      queryNorm,
      queryTokens
    );

    if (score > bestScore) {
      bestScore = score;
      bestTarget = heading;
    }
  });

  return bestTarget;
}

export function runCyclopediaSearchOnHello(query, searchInput) {
  const helloWikiRoot = getHelloWikiRoot();
  if (!helloWikiRoot) return false;

  const target = findWikiSearchTarget(query);

  if (!target) {
    flashWikiSearchMiss(searchInput);
    return false;
  }

  scrollToWikiSearchTarget(target);
  flashWikiSearchTarget(target);
  return true;
}

export function performCyclopediaSearch(query, options) {
  const pathname = options?.pathname || "";
  const router = options?.router;
  const searchInput = options?.searchInput;

  if (pathname !== "/") {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(PENDING_CYCLopedia_SEARCH_KEY, query);
    }

    router?.push("/");
    return true;
  }

  return runCyclopediaSearchOnHello(query, searchInput);
}

export function consumePendingCyclopediaSearch(searchInput) {
  if (typeof window === "undefined") return false;

  const query = sessionStorage.getItem(PENDING_CYCLopedia_SEARCH_KEY);
  if (!query) return false;

  sessionStorage.removeItem(PENDING_CYCLopedia_SEARCH_KEY);

  requestAnimationFrame(function () {
    runCyclopediaSearchOnHello(query, searchInput);
  });

  return true;
}
