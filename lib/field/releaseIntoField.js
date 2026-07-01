import { loadCybercloneFieldRecords } from "./loadRecords";
import { saveCybercloneToSupabase } from "./saveRecord";

/**
 * Mirrors original releaseCybercloneIntoField().
 *
 * Level > 0: insert into Supabase, return saved row.
 * Level 0:   skip insert, return null.
 */
export async function releaseIntoField(result) {
  const level = Number(result.level) || 0;

  if (level <= 0 || !result.asset) {
    return { saved: null, enteredOnly: true };
  }

  const existingRecords = await loadCybercloneFieldRecords();
  const saved = await saveCybercloneToSupabase(existingRecords, result);

  return { saved, enteredOnly: false };
}
