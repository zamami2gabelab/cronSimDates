import { loadConfig } from "./config.js";
import { fetchAllUsage } from "./hisClient.js";
import { upsertUsageRows } from "./sheetsClient.js";
import { nowJst } from "./time.js";

function summarize(records) {
  const ok = records.filter((r) => r.status === "ok").length;
  const failed = records.length - ok;
  return { total: records.length, ok, failed };
}

async function main() {
  const config = loadConfig();
  const meta = nowJst();

  console.log(`[start] date_jst=${meta.dateJst} fetched_at_jst=${meta.fetchedAtJst}`);
  const rows = await fetchAllUsage(config);
  await upsertUsageRows(config, rows, meta);

  const s = summarize(rows);
  console.log(`[done] total=${s.total} ok=${s.ok} failed=${s.failed}`);
}

main().catch((err) => {
  console.error("[fatal]", err?.stack ?? String(err));
  process.exitCode = 1;
});
