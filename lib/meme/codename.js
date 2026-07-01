import { VISITOR_CODENAME_STORAGE_KEY } from "./constants.js";

export function sanitizeCodename(value) {
  const cleaned = String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 24);

  return cleaned || "anonymous";
}

export function getVisitorCodename() {
  if (typeof window === "undefined") {
    return "anonymous";
  }

  try {
    const stored = localStorage.getItem(VISITOR_CODENAME_STORAGE_KEY);

    if (stored) {
      return sanitizeCodename(stored);
    }
  } catch (error) {
    console.warn("Could not read visitor codename:", error);
  }

  return "anonymous";
}

export function formatMemeCommonsDisplayCaption(codename, caption) {
  const text = String(caption || "").trim();
  const name = sanitizeCodename(codename || "anonymous");

  if (!text) {
    return name === "anonymous" ? "" : name + ":";
  }

  if (name === "anonymous") {
    return text;
  }

  return name + ": " + text;
}
