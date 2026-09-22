import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { addN3Catalog } from "./catalogMigration.js";
import { createCloudUpdate, decodeSnapshot, emptyContent } from "../src/cloudContent.js";

// Uses the Firebase CLI's existing login; credentials are never printed or stored here.
const cliDirectory = process.argv[2];
if (!cliDirectory) throw new Error("Pass the installed firebase-tools directory.");
const require = createRequire(path.resolve(cliDirectory, "package.json"));
const auth = require(path.resolve(cliDirectory, "lib/auth.js"));
const account = auth.getGlobalDefaultAccount();
if (!account) throw new Error("Complete Firebase CLI login first.");
const token = account.tokens.access_token && account.tokens.expires_at > Date.now() + 60_000
  ? account.tokens
  : await auth.getAccessToken(account.tokens.refresh_token, account.tokens.scopes);
const origin = "https://akkh-jlpt-default-rtdb.asia-southeast1.firebasedatabase.app";
const backup = path.resolve(".migration-backups", new Date().toISOString().replaceAll(":", "-"));
await fs.mkdir(backup, { recursive: true });
async function request(location, options = {}) {
  const response = await fetch(`${origin}/${location}.json`, {
    ...options,
    headers: { Authorization: `Bearer ${token.access_token}`, ...options.headers },
  });
  if (!response.ok) throw new Error(`Firebase ${location}: HTTP ${response.status}; migration stopped.`);
  return response;
}
async function read(location, filename) {
  const response = await request(location, { headers: { "X-Firebase-ETag": "true" } });
  const value = await response.json();
  await fs.writeFile(path.join(backup, filename), JSON.stringify(value));
  return { value, etag: response.headers.get("etag") };
}
async function write(location, original, value) {
  if (!original.etag) throw new Error("Missing ETag; refusing an unprotected content write.");
  await request(location, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "if-match": original.etag },
    body: JSON.stringify(value),
  });
  const saved = await (await request(location)).json();
  if (saved.payload !== value.payload || saved.revision !== value.revision) {
    throw new Error(`Verification failed for ${location}. Backup: ${backup}`);
  }
}
const catalog = JSON.parse(await fs.readFile(new URL("./n3-catalog.json", import.meta.url), "utf8"));
const n3 = await read("jlpt/content", "n3-before.json");
const n2 = await read("jlpt/n2/content", "n2-before.json");
const liveRules = await (await request(".settings/rules")).json();
await fs.writeFile(path.join(backup, "rules-before.json"), JSON.stringify(liveRules, null, 2));
const expected = JSON.parse(await fs.readFile(new URL("../database.rules.json", import.meta.url), "utf8"));
const n2Rules = liveRules.rules?.jlpt?.n2?.content;
if (n2Rules && JSON.stringify(n2Rules) !== JSON.stringify(expected.rules.jlpt.n2.content)) {
  throw new Error("N2 already has different rules; review the saved rules before proceeding.");
}
const decoded = decodeSnapshot(n3.value);
const migrated = addN3Catalog(decoded.content, catalog);
console.log(JSON.stringify({ n3Revision: decoded.revision, vocabularyChapters: migrated.baselineChapters.length, kanjiChapters: migrated.baselineKanjiChapters.length, exercises: migrated.baselineExercises.length, n2Exists: n2.value !== null, backup }));
if (!process.argv.includes("--apply")) {
  console.log("Read-only migration check complete. Pass --apply to upload.");
  process.exit(0);
}
if (JSON.stringify(migrated) !== JSON.stringify(decoded.content)) {
  await write("jlpt/content", n3, createCloudUpdate(n3.value, decoded.revision, migrated, "firebase-cli-catalog-migration", { ".sv": "timestamp" }));
}
if (n2.value === null) {
  await write("jlpt/n2/content", n2, createCloudUpdate(null, 0, emptyContent, "firebase-cli-catalog-migration", { ".sv": "timestamp" }));
}
// Preserve all existing live rules and editor permissions, adding only N2.
liveRules.rules.jlpt ??= {};
liveRules.rules.jlpt.n2 ??= {};
liveRules.rules.jlpt.n2.content = expected.rules.jlpt.n2.content;
await request(".settings/rules", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(liveRules) });
await fs.writeFile(new URL("../database.rules.json", import.meta.url), JSON.stringify(liveRules, null, 2) + "\n");
console.log("N3 upload verified; N2 initialized without study data; N2 rules published in the existing database.");
