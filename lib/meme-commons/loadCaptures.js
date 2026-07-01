import { supabase } from "../supabase";
import {
  MEME_COMMONS_BUCKET,
  MEME_COMMONS_SELECT,
  MEME_COMMONS_TABLE,
} from "./constants";

function formatDisplayCaption(codename, caption) {
  const text = String(caption || "").trim();
  const name = String(codename || "anonymous").trim() || "anonymous";

  if (!text) {
    return name === "anonymous" ? "" : name + ":";
  }

  if (name === "anonymous") {
    return text;
  }

  return name + ": " + text;
}

function getPublicUrl(imagePath) {
  if (!imagePath) {
    return "";
  }

  const { data } = supabase.storage
    .from(MEME_COMMONS_BUCKET)
    .getPublicUrl(imagePath);

  return data.publicUrl || "";
}

function normalizeRecord(row) {
  if (!row) {
    return null;
  }

  const codename = row.codename || "anonymous";
  const caption = row.caption || "";
  const image_url = getPublicUrl(row.image_path);

  if (!image_url) {
    return null;
  }

  return {
    id: row.id,
    image_path: row.image_path || "",
    image_url,
    caption,
    codename,
    display_caption: formatDisplayCaption(codename, caption),
    source: row.source || "capture",
    created_at: row.created_at || "",
  };
}

export async function loadMemeCommonsCaptures() {
  const fullResult = await supabase
    .from(MEME_COMMONS_TABLE)
    .select(MEME_COMMONS_SELECT)
    .order("created_at", { ascending: false });

  if (!fullResult.error) {
    return (fullResult.data || [])
      .map(normalizeRecord)
      .filter(Boolean);
  }

  const legacyResult = await supabase
    .from(MEME_COMMONS_TABLE)
    .select("id, image_path, caption, source, created_at")
    .order("created_at", { ascending: false });

  if (legacyResult.error) {
    throw legacyResult.error;
  }

  return (legacyResult.data || [])
    .map(function (row) {
      return normalizeRecord({
        ...row,
        codename: row.codename || "anonymous",
      });
    })
    .filter(Boolean);
}
