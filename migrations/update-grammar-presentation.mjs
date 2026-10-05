import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { grammarTopics } from "./grammarCatalog.js";
import { createCloudUpdate, decodeSnapshot } from "../src/cloudContent.js";
import { resolveVocabularyCards } from "../src/vocabularyContent.js";

const cliDirectory = process.argv[2];
if (!cliDirectory)
  throw new Error("Pass the existing firebase-tools directory.");
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
      `Firebase ${location}: HTTP ${response.status}; write stopped.`,
    );
  return response;
}
const response = await request("jlpt/content", {
  headers: { "X-Firebase-ETag": "true" },
});
const current = await response.json();
const etag = response.headers.get("etag");
const { content, revision } = decodeSnapshot(current);
const next = structuredClone(content);
const n2Before = await (await request("jlpt/n2/content")).json();
const chapterNumbers = new Map(
  grammarTopics.map(([topic], index) => [
    `n3-grammar-${topic}`,
    String(index + 1),
  ]),
);
for (const chapter of next.chapters) {
  if (chapter.studyTab !== "Grammar" || !chapterNumbers.has(chapter.id))
    continue;
  chapter.number = chapterNumbers.get(chapter.id);
  if (next.chapterOverrides[chapter.id]?.number !== undefined) {
    next.chapterOverrides[chapter.id].number = chapter.number;
  }
}
const grammarCards = resolveVocabularyCards(
  content.baselineChapters,
  content,
).filter((card) => card.studyTab === "Grammar");
const grammarIds = new Set(grammarCards.map((card) => card._id));
const customIds = new Set(next.cards.map((card) => card._id));
for (const card of next.cards) {
  if (grammarIds.has(card._id)) card.layout = "wide";
}
for (const id of grammarIds) {
  if (next.cardOverrides[id] || !customIds.has(id)) {
    next.cardOverrides[id] = { ...next.cardOverrides[id], layout: "wide" };
  }
}
// Verify only the requested numbering and card layout fields change.
const stripped = structuredClone(next);
for (let index = 0; index < content.chapters.length; index++) {
  const original = content.chapters[index];
  if (chapterNumbers.has(original.id) && original.studyTab === "Grammar") {
    stripped.chapters[index] = {
      ...stripped.chapters[index],
      number: original.number,
    };
    if (content.chapterOverrides[original.id]?.number !== undefined) {
      stripped.chapterOverrides[original.id].number =
        content.chapterOverrides[original.id].number;
    }
  }
}
for (let index = 0; index < content.cards.length; index++) {
  stripped.cards[index] = { ...content.cards[index], ...stripped.cards[index] };
  if (grammarIds.has(content.cards[index]._id)) {
    if (Object.hasOwn(content.cards[index], "layout"))
      stripped.cards[index].layout = content.cards[index].layout;
    else delete stripped.cards[index].layout;
  }
}
stripped.cardOverrides = structuredClone(content.cardOverrides);
assert.deepEqual(stripped, content);
for (const [id, original] of Object.entries(content.cardOverrides)) {
  assert.deepEqual(
    next.cardOverrides[id],
    grammarIds.has(id) ? { ...original, layout: "wide" } : original,
  );
}
const visible = resolveVocabularyCards(next.baselineChapters, next).filter(
  (card) => card.studyTab === "Grammar",
);
assert.equal(visible.length, grammarCards.length);
assert.ok(visible.every((card) => card.layout === "wide"));
for (const [id, number] of chapterNumbers) {
  const chapter = next.chapters.find((item) => item.id === id);
  assert.ok(chapter, `Missing imported chapter ${id}`);
  assert.equal(next.chapterOverrides[id]?.number ?? chapter.number, number);
}
const backup = path.resolve(
  ".migration-backups",
  `grammar-presentation-${new Date().toISOString().replaceAll(":", "-")}`,
);
await fs.mkdir(backup, { recursive: true });
await fs.writeFile(
  path.join(backup, "n3-before.json"),
  JSON.stringify(current),
);
await fs.writeFile(
  path.join(backup, "n3-proposed-content.json"),
  JSON.stringify(next),
);
console.log(
  JSON.stringify({
    revision,
    grammarCards: visible.length,
    layoutsChanged: grammarCards.filter((card) => card.layout !== "wide")
      .length,
    chapterNumbers: [...chapterNumbers.values()],
    backup,
  }),
);
if (!process.argv.includes("--apply")) process.exit(0);
if (JSON.stringify(content) === JSON.stringify(next)) {
  console.log("Chapter numbering and Wide layouts are already correct.");
  process.exit(0);
}
if (!etag) throw new Error("Missing ETag; refusing an unprotected write.");
const update = createCloudUpdate(
  current,
  revision,
  next,
  "firebase-cli-grammar-presentation",
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
assert.deepEqual(await (await request("jlpt/n2/content")).json(), n2Before);
await fs.writeFile(path.join(backup, "n3-after.json"), JSON.stringify(saved));
console.log(
  `Verified chapters 1–19 and ${visible.length} Wide grammar cards; N3 revision ${saved.revision}.`,
);
