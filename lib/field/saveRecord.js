import { supabase } from "../supabase";
import { CYBERCLONE_FIELD_TABLE } from "./constants";
import { getNextCloneNumber } from "./cloneNumber";
import { getRandomFieldPosition } from "./position";

function getGifNameFromResult(result) {
  if (result.asset?.gifName) {
    return result.asset.gifName;
  }

  if (result.image) {
    const parts = result.image.split("/");
    return parts[parts.length - 1] || "";
  }

  return "";
}

export async function saveCybercloneToSupabase(existingRecords, result) {
  const level = Number(result.level) || 0;
  const gifName = getGifNameFromResult(result);

  if (level <= 0 || !gifName) {
    return null;
  }

  const position = getRandomFieldPosition(existingRecords, level);
  const codename = (result.codename || "anonymous").trim() || "anonymous";
  const cloneNumber =
    Number(result.cloneNumber) || getNextCloneNumber(existingRecords);

  const fullRecord = {
    clone_number: cloneNumber,
    gif_name: gifName,
    level,
    x: position.x,
    y: position.y,
    source: "visitor",
    codename,
  };

  const fullResult = await supabase
    .from(CYBERCLONE_FIELD_TABLE)
    .insert(fullRecord)
    .select()
    .single();

  if (!fullResult.error) {
    return fullResult.data;
  }

  console.warn("Full insert failed. Trying legacy insert:", fullResult.error);

  const legacyResult = await supabase
    .from(CYBERCLONE_FIELD_TABLE)
    .insert({
      gif_name: gifName,
      level,
      x: position.x,
      y: position.y,
      source: "visitor",
    })
    .select()
    .single();

  if (legacyResult.error) {
    throw legacyResult.error;
  }

  return legacyResult.data;
}
