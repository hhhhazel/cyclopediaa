/**
 * Field codename search — ported from public/script.js.
 */
import { loadCybercloneFieldRecords } from "../field/loadRecords";
import { PENDING_CODENAME_SEARCH_KEY } from "./constants";
import { normalizeSearchText } from "./text";
import { flashWikiSearchMiss } from "./cyclopediaSearch";

let codenameSearchHighlightTimer = null;

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

export function findCodenameRecordMatch(records, query) {
  const queryNorm = normalizeSearchText(query);
  if (!queryNorm) return null;

  let bestRecord = null;
  let bestScore = 0;

  (records || []).forEach(function (record) {
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
  const scene = document.querySelector(".cyberfling-scene");

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
  const scene = document.querySelector(".cyberfling-scene");
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
    created_at: item.dataset.createdAt || "",
  };
}

function flashCodenameSearchTarget(item, onSelectRecord) {
  if (!item) return;

  clearCodenameSearchHighlights();
  item.classList.add("codename-search-hit");

  const gif = item.querySelector(".cyberfling-gif");

  if (gif && gif.dataset.gif) {
    gif.src = gif.dataset.gif + "?t=" + Date.now();
  }

  const record = buildCodenameSearchRecord(item);
  if (record) {
    if (typeof onSelectRecord === "function") {
      onSelectRecord(record);
    }

    window.dispatchEvent(
      new CustomEvent("cyberpedia:codename-search-hit", { detail: record })
    );
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

  item.scrollIntoView({ behavior: "smooth", block: "center" });
}

export function runCodenameSearchOnField(query, options) {
  const searchInput = options?.searchInput;
  const onSelectRecord = options?.onSelectRecord;
  const queryNorm = normalizeSearchText(query);

  if (!queryNorm) {
    flashWikiSearchMiss(searchInput);
    return false;
  }

  const targetItem = findCodenameSearchItem(query);

  if (!targetItem) {
    flashWikiSearchMiss(searchInput);
    return false;
  }

  focusCodenameSearchTarget(targetItem);
  flashCodenameSearchTarget(targetItem, onSelectRecord);
  return true;
}

export async function performCodenameSearch(query, options) {
  const pathname = options?.pathname || "";
  const router = options?.router;
  const searchInput = options?.searchInput;
  const onSelectRecord = options?.onSelectRecord;
  const queryNorm = normalizeSearchText(query);

  if (!queryNorm) {
    flashWikiSearchMiss(searchInput);
    return false;
  }

  if (pathname === "/field") {
    return runCodenameSearchOnField(query, { searchInput, onSelectRecord });
  }

  try {
    const records = await loadCybercloneFieldRecords();
    const matchedRecord = findCodenameRecordMatch(records, query);

    if (!matchedRecord) {
      flashWikiSearchMiss(searchInput);
      return false;
    }

    if (typeof window !== "undefined") {
      sessionStorage.setItem(PENDING_CODENAME_SEARCH_KEY, query);
    }

    router?.push("/field");
    return true;
  } catch (error) {
    console.warn("Codename search failed:", error);
    flashWikiSearchMiss(searchInput);
    return false;
  }
}

export function consumePendingCodenameSearch(options) {
  if (typeof window === "undefined") return false;

  const query = sessionStorage.getItem(PENDING_CODENAME_SEARCH_KEY);
  if (!query) return false;

  sessionStorage.removeItem(PENDING_CODENAME_SEARCH_KEY);

  requestAnimationFrame(function () {
    runCodenameSearchOnField(query, options);
  });

  return true;
}
