import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { createCloudUpdate, decodeSnapshot, normalizeContent } from "../src/cloudContent.js";

const lessonRanges = [
  [4, 8], [18, 22], [32, 36], [46, 52], [60, 64], [74, 78],
  [88, 92], [102, 106], [117, 120], [128, 134], [144, 148], [158, 162],
];
const bookName = "N3 - Minna no Nihongo (အထူ).pdf";
const databaseOrigin = "https://akkh-jlpt-default-rtdb.asia-southeast1.firebasedatabase.app";

function buildMinnaCatalog(tsv) {
  const rows = tsv.split(/\r?\n/).filter((line) => line.trim() && !line.startsWith("#"));
  const chapters = lessonRanges.map((_, index) => ({
    id: `n3-minna-grammar-lesson-${String(index + 1).padStart(2, "0")}`,
    number: String(index + 1),
    title: `第${index + 1}課`,
    titleMyanmar: `သင်ခန်းစာ ${index + 1}`,
    studyTab: "Grammar",
    groupTitle: "みんなの日本語 中級I",
    subchapters: [],
  }));
  const cards = [];
  for (const [rowIndex, line] of rows.entries()) {
    const fields = line.split("|");
    if (fields.length !== 8) throw new Error(`Source row ${rowIndex + 1}: expected 8 fields.`);
    const [topic, term, meaning, grammarExplanation, japanese, myanmar, , minnaPages] = fields;
    if (!minnaPages) continue;
    const pages = minnaPages.split(",").map(Number);
    if (!pages.every((page) => Number.isInteger(page) && page > 0 && page <= 171)) {
      throw new Error(`Invalid Minna PDF pages for ${term}: ${minnaPages}`);
    }
    const lessonIndex = pages
      .map((page) => lessonRanges.findIndex(([first, last]) => page >= first && page <= last))
      .filter((index) => index >= 0)
      .sort((a, b) => a - b)[0];
    if (lessonIndex === undefined) throw new Error(`No Minna lesson range found for ${term}.`);
    if (![term, meaning, grammarExplanation, japanese, myanmar].every((value) => value.trim())) {
      throw new Error(`Incomplete Minna grammar row: ${term}`);
    }
    const id = `n3-minna-grammar-lesson-${String(lessonIndex + 1).padStart(2, "0")}-card-${String(cards.filter((card) => card.chapterId === chapters[lessonIndex].id).length + 1).padStart(2, "0")}`;
    cards.push({
      id,
      _id: id,
      chapterId: chapters[lessonIndex].id,
      parentChapterId: chapters[lessonIndex].id,
      subchapterId: "",
      studyTab: "Grammar",
      layout: "wide",
      term,
      meaning,
      exampleJapanese: japanese,
      exampleMyanmar: myanmar,
      examples: [{ japanese, myanmar }],
      grammarExplanation,
      sourceReferences: [{ book: bookName, pageType: "pdf", pages }],
      generated: true,
      sourceTopic: topic,
    });
  }
  assert.equal(cards.length, 71, "Expected all 71 Minna-referenced grammar patterns.");
  for (const chapter of chapters) {
    if (!cards.some((card) => card.chapterId === chapter.id)) {
      throw new Error(`No sourced grammar cards found for ${chapter.title}.`);
    }
  }
  return { chapters, cards };
}

function replaceGrammarContent(current, catalog) {
  const next = normalizeContent(structuredClone(current));
  const oldChapters = next.chapters.filter((record) => record.studyTab === "Grammar");
  const oldChapterIds = new Set(oldChapters.map((record) => record.id));
  const oldSubchapters = next.subchapters.filter((record) =>
    record.studyTab === "Grammar" || oldChapterIds.has(record.parentChapterId),
  );
  const oldSubchapterIds = new Set(oldSubchapters.map((record) => record.id));
  const belongsToGrammar = (record) =>
    record?.studyTab === "Grammar" ||
    oldChapterIds.has(record?.chapterId) ||
    oldChapterIds.has(record?.parentChapterId) ||
    oldSubchapterIds.has(record?.chapterId) ||
    oldSubchapterIds.has(record?.subchapterId);
  const oldCards = next.cards.filter(belongsToGrammar);
  const oldCardIds = new Set(oldCards.flatMap((record) => [record.id, record._id]).filter(Boolean));
  const oldExercises = [...next.baselineExercises, ...next.exercises].filter(belongsToGrammar);
  const oldExerciseIds = new Set(oldExercises.map((record) => record.id ?? record._id).filter(Boolean));

  next.chapters = next.chapters.filter((record) => record.studyTab !== "Grammar");
  next.chapters.push(...structuredClone(catalog.chapters));
  next.subchapters = next.subchapters.filter((record) =>
    record.studyTab !== "Grammar" && !oldChapterIds.has(record.parentChapterId),
  );
  next.cards = next.cards.filter((record) => !belongsToGrammar(record));
  next.cards.push(...structuredClone(catalog.cards));
  next.baselineExercises = next.baselineExercises.filter((record) => !belongsToGrammar(record));
  next.exercises = next.exercises.filter((record) => !belongsToGrammar(record));
  next.exerciseOverrides = Object.fromEntries(Object.entries(next.exerciseOverrides).filter(([id, record]) =>
    !oldExerciseIds.has(id) && !belongsToGrammar(record),
  ));
  next.deletedExercises = next.deletedExercises.filter((id) => !oldExerciseIds.has(id));
  next.deletedCards = next.deletedCards.filter((id) => !oldCardIds.has(id));
  next.deletedChapters = next.deletedChapters.filter((id) => !oldChapterIds.has(id));
  next.deletedSubchapters = next.deletedSubchapters.filter((id) => !oldSubchapterIds.has(id));
  next.cardOverrides = Object.fromEntries(Object.entries(next.cardOverrides).filter(([id, record]) =>
    !oldCardIds.has(id) && !belongsToGrammar(record),
  ));
  next.chapterOverrides = Object.fromEntries(Object.entries(next.chapterOverrides).filter(([id]) =>
    !oldChapterIds.has(id) && !oldSubchapterIds.has(id),
  ));
  next.groups = next.groups.filter((record) => record.studyTab !== "Grammar");
  next.cardOrders = Object.fromEntries(Object.entries(next.cardOrders)
    .filter(([chapterId]) => !oldChapterIds.has(chapterId) && !oldSubchapterIds.has(chapterId))
    .map(([chapterId, ids]) => [chapterId, ids.filter((id) => !oldCardIds.has(id))]));
  return normalizeContent(next);
}

const cliDirectory = process.argv[2];
if (!cliDirectory) throw new Error("Pass the installed firebase-tools directory.");
const require = createRequire(path.resolve(cliDirectory, "package.json"));
const firebaseAuth = require(path.resolve(cliDirectory, "lib/auth.js"));
const account = firebaseAuth.getGlobalDefaultAccount();
if (!account) throw new Error("Complete Firebase CLI login first.");
const token = account.tokens.access_token && account.tokens.expires_at > Date.now() + 60_000
  ? account.tokens
  : await firebaseAuth.getAccessToken(account.tokens.refresh_token, account.tokens.scopes);

async function request(options = {}) {
  const response = await fetch(`${databaseOrigin}/jlpt/content.json`, {
    ...options,
    headers: { Authorization: `Bearer ${token.access_token}`, ...options.headers },
  });
  if (!response.ok) throw new Error(`Firebase content request failed: HTTP ${response.status}; no retry was attempted.`);
  return response;
}

const beforeResponse = await request({ headers: { "X-Firebase-ETag": "true" } });
const before = await beforeResponse.json();
const etag = beforeResponse.headers.get("etag");
if (!etag) throw new Error("Firebase returned no ETag; refusing an unprotected replacement.");
const { content, revision } = decodeSnapshot(before);
const source = await fs.readFile(new URL("../source/n3-grammar.tsv", import.meta.url), "utf8");
const catalog = buildMinnaCatalog(source);
const next = replaceGrammarContent(content, catalog);
const oldGrammarCards = content.cards.filter((record) => record.studyTab === "Grammar").length;
const oldGrammarChapters = content.chapters.filter((record) => record.studyTab === "Grammar").length;
const lessonCounts = catalog.chapters.map((chapter) => ({
  lesson: chapter.number,
  title: chapter.title,
  cards: catalog.cards.filter((card) => card.chapterId === chapter.id).length,
}));
const backup = path.resolve(".migration-backups", `minna-grammar-${new Date().toISOString().replaceAll(":", "-")}`);
await fs.mkdir(backup, { recursive: true });
await fs.writeFile(path.join(backup, "n3-before.json"), JSON.stringify(before, null, 2));
await fs.writeFile(path.join(backup, "n3-proposed.json"), JSON.stringify({
  revision: revision + 1,
  payload: JSON.stringify(next),
}, null, 2));
await fs.writeFile(path.join(backup, "grammar-catalog.json"), JSON.stringify(catalog, null, 2));

console.log(JSON.stringify({
  revision,
  oldGrammarChapters,
  oldGrammarCards,
  replacementChapters: catalog.chapters.length,
  replacementCards: catalog.cards.length,
  lessonCounts,
  backup,
}, null, 2));

if (!process.argv.includes("--apply")) {
  console.log("Preview only. No live records were changed. Run again with --apply after reviewing the backup and preview.");
  process.exit(0);
}

const prompt = readline.createInterface({ input, output });
const answer = await prompt.question('This will replace all current N3 Grammar chapters, cards, subchapters, and exercises. Type "REPLACE GRAMMAR" to continue: ');
prompt.close();
if (answer !== "REPLACE GRAMMAR") {
  console.log("Stopped without changing Firebase.");
  process.exit(0);
}
const latestResponse = await request({ headers: { "X-Firebase-ETag": "true" } });
const latestEtag = latestResponse.headers.get("etag");
if (!latestEtag) throw new Error("Firebase returned no ETag before the write.");
const latestValue = await latestResponse.json();
if (JSON.stringify(latestValue) !== JSON.stringify(before)) {
  throw new Error(`Firebase changed after preview; stopped without writing. Backup: ${backup}`);
}
const update = createCloudUpdate(before, revision, next, "firebase-cli-minna-grammar-replacement", { ".sv": "timestamp" });
await request({
  method: "PUT",
  headers: { "Content-Type": "application/json", "if-match": latestEtag },
  body: JSON.stringify(update),
});
const saved = await (await request()).json();
assert.equal(saved.revision, revision + 1);
assert.equal(saved.payload, update.payload);
const verified = decodeSnapshot(saved).content;
assert.equal(verified.chapters.filter((record) => record.studyTab === "Grammar").length, 12);
assert.equal(verified.cards.filter((record) => record.studyTab === "Grammar").length, 71);
assert.equal(verified.baselineChapters.length, content.baselineChapters.length);
assert.equal(verified.baselineKanjiChapters.length, content.baselineKanjiChapters.length);
await fs.writeFile(path.join(backup, "n3-after.json"), JSON.stringify(saved, null, 2));
console.log(`Verified 12 Minna grammar chapters and 71 cards at N3 revision ${saved.revision}. Backup: ${backup}`);
