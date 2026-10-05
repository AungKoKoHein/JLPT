import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { buildGrammarCatalog, addGrammarCatalog } from "./grammarCatalog.js";
import { createCloudUpdate, decodeSnapshot } from "../src/cloudContent.js";

const cliDirectory = process.argv[2];
if (!cliDirectory)
  throw new Error("Pass the existing firebase-tools package directory.");
const require = createRequire(path.resolve(cliDirectory, "package.json"));
const auth = require(path.resolve(cliDirectory, "lib/auth.js"));
const account = auth.getGlobalDefaultAccount();
if (!account) throw new Error("An existing Firebase CLI login is required.");
const token =
  account.tokens.access_token && account.tokens.expires_at > Date.now() + 60_000
    ? account.tokens
    : await auth.getAccessToken(
        account.tokens.refresh_token,
        account.tokens.scopes,
      );
const origin =
  "https://akkh-jlpt-default-rtdb.asia-southeast1.firebasedatabase.app";
async function request(location, options = {}) {
  const response = await fetch(`${origin}/${location}.json`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      ...options.headers,
    },
  });
  if (!response.ok)
    throw new Error(
      `Firebase ${location}: HTTP ${response.status}; stopped without retrying the write.`,
    );
  return response;
}
const response = await request("jlpt/content", {
  headers: { "X-Firebase-ETag": "true" },
});
const etag = response.headers.get("etag");
const current = await response.json();
const { content, revision } = decodeSnapshot(current);
const n2Before = await (await request("jlpt/n2/content")).json();
const source = await fs.readFile(
  new URL("../source/n3-grammar.tsv", import.meta.url),
  "utf8",
);
const catalog = buildGrammarCatalog(source);
const next = addGrammarCatalog(content, catalog);
// Confirm the merge is strictly additive before permitting a remote write.
for (const key of Object.keys(content)) {
  if (["cards", "chapters"].includes(key))
    assert.deepEqual(next[key].slice(0, content[key].length), content[key]);
  else assert.deepEqual(next[key], content[key]);
}
assert.deepEqual(
  addGrammarCatalog(next, catalog),
  next,
  "Import must be idempotent.",
);
const addedCards = next.cards.length - content.cards.length;
const addedChapters = next.chapters.length - content.chapters.length;
const backup = path.resolve(
  ".migration-backups",
  `grammar-${new Date().toISOString().replaceAll(":", "-")}`,
);
await fs.mkdir(backup, { recursive: true });
await fs.writeFile(
  path.join(backup, "n3-before.json"),
  JSON.stringify(current),
);
await fs.writeFile(
  path.join(backup, "n3-proposed-content.json"),
  JSON.stringify(next, null, 2),
);
await fs.writeFile(
  path.join(backup, "grammar-catalog.json"),
  JSON.stringify(catalog, null, 2),
);
console.log(
  JSON.stringify({
    revision,
    catalogCards: catalog.cards.length,
    addedCards,
    addedChapters,
    backup,
  }),
);
if (!process.argv.includes("--apply")) {
  console.log(
    "Read-only comparison complete. Use --apply to upload these additive changes.",
  );
  process.exit(0);
}
if (!addedCards && !addedChapters) {
  console.log("All grammar records are already present; no write needed.");
  process.exit(0);
}
if (!etag)
  throw new Error("Missing Firebase ETag; refusing an unprotected write.");
const update = createCloudUpdate(
  current,
  revision,
  next,
  "firebase-cli-n3-grammar-import",
  { ".sv": "timestamp" },
);
await request("jlpt/content", {
  method: "PUT",
  headers: { "Content-Type": "application/json", "if-match": etag },
  body: JSON.stringify(update),
});
const saved = await (await request("jlpt/content")).json();
assert.equal(saved.revision, revision + 1);
assert.equal(saved.payload, update.payload);
const n2After = await (await request("jlpt/n2/content")).json();
assert.deepEqual(
  n2After,
  n2Before,
  "N2 changed during the import; inspect concurrent owner activity.",
);
await fs.writeFile(path.join(backup, "n3-after.json"), JSON.stringify(saved));
console.log(
  `Verified ${addedCards} new grammar cards in ${addedChapters} chapters; N3 revision ${saved.revision}. Existing records and N2 preserved.`,
);
