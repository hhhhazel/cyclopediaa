import { supabase } from "../supabase.js";
import { MEME_COMMONS_BUCKET, MEME_COMMONS_TABLE } from "./constants.js";
import {
  formatMemeCommonsDisplayCaption,
  sanitizeCodename,
} from "./codename.js";

function getMemeCommonsPublicUrl(imagePath) {
  if (!imagePath) return "";

  const { data } = supabase.storage
    .from(MEME_COMMONS_BUCKET)
    .getPublicUrl(imagePath);

  return data.publicUrl || "";
}

function normalizeMemeCommonsRecord(row) {
  if (!row) return null;

  const codename = row.codename || "anonymous";
  const caption = row.caption || "";

  return {
    id: row.id,
    image_path: row.image_path || "",
    image_url: getMemeCommonsPublicUrl(row.image_path),
    caption: caption,
    codename: codename,
    display_caption: formatMemeCommonsDisplayCaption(codename, caption),
    source: row.source || "capture",
    created_at: row.created_at || "",
  };
}

export async function loadMemeCommonsCaptures() {
  const { data, error } = await supabase
    .from(MEME_COMMONS_TABLE)
    .select("id, image_path, caption, codename, source, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    const legacy = await supabase
      .from(MEME_COMMONS_TABLE)
      .select("id, image_path, caption, source, created_at")
      .order("created_at", { ascending: false });

    if (legacy.error) {
      throw legacy.error;
    }

    return (legacy.data || [])
      .map(function (row) {
        row.codename = row.codename || "anonymous";
        return normalizeMemeCommonsRecord(row);
      })
      .filter(function (record) {
        return record && record.image_url;
      });
  }

  return (data || [])
    .map(normalizeMemeCommonsRecord)
    .filter(function (record) {
      return record && record.image_url;
    });
}
