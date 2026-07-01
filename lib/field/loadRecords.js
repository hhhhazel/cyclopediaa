import { supabase } from "../supabase";
import { CYBERCLONE_FIELD_SELECT, CYBERCLONE_FIELD_TABLE } from "./constants";

export function normalizeCybercloneRecords(records) {
  return (records || []).map(function (record, index) {
    return {
      id: record.id,
      clone_number: record.clone_number || index + 1,
      gif_name: record.gif_name,
      level: Number(record.level || 1),
      x: Number(record.x || 50),
      y: Number(record.y || 50),
      source: record.source || "visitor",
      codename:
        record.codename ||
        (record.source === "seed"
          ? "seed-" + String(index + 1).padStart(2, "0")
          : "anonymous"),
      created_at: record.created_at || "",
    };
  });
}

export async function loadCybercloneFieldRecords() {
  const fullResult = await supabase
    .from(CYBERCLONE_FIELD_TABLE)
    .select(CYBERCLONE_FIELD_SELECT)
    .order("created_at", { ascending: true });

  if (!fullResult.error) {
    return normalizeCybercloneRecords(fullResult.data || []);
  }

  console.warn("Full select failed. Trying legacy select:", fullResult.error);

  const legacyResult = await supabase
    .from(CYBERCLONE_FIELD_TABLE)
    .select("id, gif_name, level, x, y, source, created_at")
    .order("created_at", { ascending: true });

  if (legacyResult.error) {
    throw legacyResult.error;
  }

  return normalizeCybercloneRecords(legacyResult.data || []);
}
