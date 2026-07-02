import { WIKI_SHORT_WORDS } from "./constants";

export function cleanWikiWord(word) {
  return word.replace(/^[^\w]+|[^\w]+$/g, "");
}

export function normalizeSearchText(text) {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

export function isMeaninglessSearchToken(token) {
  const bare = cleanWikiWord(token).toLowerCase();

  if (!bare) return true;
  if (WIKI_SHORT_WORDS.has(bare)) return true;
  if (bare.length <= 2 && !/^[\d.]+$/.test(bare)) return true;

  return false;
}

export function getMeaningfulSearchTokens(text) {
  return text
    .trim()
    .split(/\s+/)
    .filter(function (token) {
      return !isMeaninglessSearchToken(token);
    });
}
