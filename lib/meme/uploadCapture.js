import { supabase } from "../supabase.js";
import { MEME_COMMONS_BUCKET, MEME_COMMONS_TABLE } from "./constants.js";
import { getVisitorCodename, sanitizeCodename } from "./codename.js";
import { loadMemeCommonsCaptures } from "./loadCommons.js";

function getMemeCommonsPublicUrl(imagePath) {
  if (!imagePath) return "";

  const { data } = supabase.storage
    .from(MEME_COMMONS_BUCKET)
    .getPublicUrl(imagePath);

  return data.publicUrl || "";
}

function normalizeMemeCommonsRecord(row, safeCodename) {
  if (!row) return null;

  const codename = row.codename || safeCodename || "anonymous";
  const caption = row.caption || "";

  return {
    id: row.id,
    image_path: row.image_path || "",
    image_url: getMemeCommonsPublicUrl(row.image_path),
    caption: caption,
    codename: codename,
    source: row.source || "capture",
    created_at: row.created_at || "",
  };
}

export async function saveMemeCommonsCapture(blob, source, caption, codename) {
  if (!blob) {
    throw new Error("No capture blob.");
  }

  const safeCodename = sanitizeCodename(codename || getVisitorCodename());
  const filePath =
    "captures/" +
    Date.now() +
    "-" +
    Math.random().toString(36).slice(2, 10) +
    ".png";

  const { error: uploadError } = await supabase.storage
    .from(MEME_COMMONS_BUCKET)
    .upload(filePath, blob, {
      contentType: blob.type || "image/png",
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    throw uploadError;
  }

  const insertPayload = {
    image_path: filePath,
    caption: caption || "",
    codename: safeCodename,
    source: source || "capture",
  };

  let result = await supabase
    .from(MEME_COMMONS_TABLE)
    .insert(insertPayload)
    .select("id, image_path, caption, codename, source, created_at")
    .single();

  if (result.error) {
    result = await supabase
      .from(MEME_COMMONS_TABLE)
      .insert({
        image_path: filePath,
        caption: caption || "",
        source: source || "capture",
      })
      .select("id, image_path, caption, source, created_at")
      .single();

    if (!result.error && result.data) {
      result.data.codename = safeCodename;
    }
  }

  if (result.error) {
    throw result.error;
  }

  return normalizeMemeCommonsRecord(result.data, safeCodename);
}

export { loadMemeCommonsCaptures };
