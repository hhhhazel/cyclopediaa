import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(__dirname, "..", "index.html");

const phrases = [
  "internet memes",
  "memes act",
  "a cultural metaphor",
  "the same public pattern",
  "exceed the space of the screen",
  "approach a shared cultural template",
  "consumer behavior",
  "digital items",
  "the popularity of memes",
  "that which is imitated",
  "imitation is a natural mechanism",
  "the mimic octopus",
  "from the same template",
  "&ldquo;protection.&rdquo;",
  "a cybernetic space composed",
  "circulated by others",
  "networked individualism",
  "Chaplin fever",
  "comic gestures",
  "aesthetic taste",
  "Every viewer can immediately",
  "a template",
  "Dolly",
  "being cloned",
  "Kardashian-related memes",
  "identities, social fantasies",
  "frames virality",
  "profile pictures",
  "similar Kris Jenner profile pictures",
  "bodily practice",
  "make-up videos",
  "#Krissed",
  "group performances",
  "cloned visual effect",
  "celebrity circulation",
  "notice, imitate, and share figures",
  "long nails",
  "attention economy of social media platforms",
  "a cultural cloning chamber",
  "If you know how I feel, why would you say that",
  "facial expression",
  "power",
  "synchronized movement",
  "collective body",
  "express exaggerated encouragement",
  "a media posture",
  "Imitative Inertia",
  "a specific emotional response can be replaced",
  "the trend",
  "lip shape",
  "a shared internet moment",
  "beauty standards",
  "product-oriented",
  "a small consumer logic",
  "requires material assistance",
  "padded underwear",
  "visual symbols related to wealth",
  "Kardashian butt,",
  "Supermeme",
  "products",
  "advertising images",
  "image-sharing platforms",
  "References"
];

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function phraseToPattern(phrase) {
  const words = phrase
    .trim()
    .replace(/[?.,;:"'']/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .map(escapeRegex);

  if (!words.length) {
    return null;
  }

  const between = "(?:<[^>]+>|\\s|&[^;]+;|[\u201c\u201d,.?!\"''])";
  return words.join(between + "*");
}

function findPhraseMatchFrom(html, phrase, fromIndex) {
  const pattern = phraseToPattern(phrase);

  if (!pattern) {
    return null;
  }

  const re = new RegExp(pattern, "gi");
  let match;

  while ((match = re.exec(html.slice(fromIndex))) !== null) {
    const globalIndex = fromIndex + match.index;
    const before = html.slice(Math.max(0, globalIndex - 120), globalIndex);

    if (before.includes('<a class="wiki-inline-link"') && !before.slice(before.lastIndexOf("<a")).includes("</a>")) {
      continue;
    }

    return {
      index: globalIndex,
      length: match[0].length,
      text: match[0]
    };
  }

  return null;
}

function findPhraseMatchAny(html, phrase) {
  return findPhraseMatchFrom(html, phrase, 0);
}

let html = fs.readFileSync(htmlPath, "utf8");
const articleStart = html.indexOf('<article class="wiki-vector-content" id="wikiMainScroll">');
const articleEnd = html.indexOf("</article>", articleStart);

if (articleStart < 0 || articleEnd < 0) {
  throw new Error("Could not find wiki article block.");
}

let article = html.slice(articleStart, articleEnd);

article = article.replace(
  /<a class="wiki-inline-link" href="#" data-preview-index="\d+">([\s\S]*?)<\/a>/g,
  "$1"
);

const missing = [];
let cursor = 0;

phrases.forEach(function (phrase, index) {
  const previewIndex = index + 1;
  let match = findPhraseMatchFrom(article, phrase, cursor);

  if (!match) {
    match = findPhraseMatchAny(article, phrase);
  }

  if (!match) {
    missing.push({ previewIndex: previewIndex, phrase: phrase });
    return;
  }

  const linkHtml =
    '<a class="wiki-inline-link" href="#" data-preview-index="' +
    previewIndex +
    '">' +
    match.text +
    "</a>";

  article =
    article.slice(0, match.index) +
    linkHtml +
    article.slice(match.index + match.length);

  cursor = match.index + linkHtml.length;
});

html = html.slice(0, articleStart) + article + html.slice(articleEnd);
fs.writeFileSync(htmlPath, html, "utf8");

console.log("Applied", phrases.length - missing.length, "of", phrases.length, "wiki preview links.");

if (missing.length) {
  console.warn("Missing phrases:");
  missing.forEach(function (item) {
    console.warn(item.previewIndex, item.phrase);
  });
}
