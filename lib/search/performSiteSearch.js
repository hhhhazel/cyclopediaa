/**
 * Site-wide search entry — ported from public/script.js performSiteSearch().
 */
import { performCodenameSearch } from "./codenameSearch";
import { performCyclopediaSearch } from "./cyclopediaSearch";

export function isFieldSearchRoute(pathname) {
  return pathname === "/field";
}

export function updateSiteSearchPlaceholder(pathname, searchInput) {
  if (!searchInput) return;

  if (isFieldSearchRoute(pathname)) {
    searchInput.placeholder = "Search codename";
    searchInput.setAttribute("aria-label", "Search codename");
    return;
  }

  searchInput.placeholder = "Search Cyclopedia";
  searchInput.setAttribute("aria-label", "Search Cyclopedia");
}

export function performSiteSearch(query, options) {
  const pathname = options?.pathname || "";

  if (isFieldSearchRoute(pathname)) {
    return performCodenameSearch(query, options);
  }

  return performCyclopediaSearch(query, options);
}
