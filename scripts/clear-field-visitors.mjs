import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const { data: before, error: beforeError } = await supabase
  .from("cyberclone_field")
  .select("id, source")
  .order("created_at", { ascending: true });

if (beforeError) {
  console.error("Could not read field records:", beforeError.message);
  process.exit(1);
}

const visitorCount = (before || []).filter(function (row) {
  return row.source === "visitor";
}).length;

const { error: deleteError } = await supabase
  .from("cyberclone_field")
  .delete()
  .eq("source", "visitor");

if (deleteError) {
  console.error("Could not delete visitor records:", deleteError.message);
  process.exit(1);
}

const { data: after, error: afterError } = await supabase
  .from("cyberclone_field")
  .select("id, clone_number, source, codename")
  .order("created_at", { ascending: true });

if (afterError) {
  console.error("Deleted visitors, but could not verify:", afterError.message);
  process.exit(1);
}

console.log("Removed visitor records:", visitorCount);
console.log("Remaining records:", (after || []).length);
console.log(after || []);
