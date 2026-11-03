import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import {
  createCloudUpdate,
  decodeSnapshot,
  normalizeContent,
} from "../src/cloudContent.js";

const cliDirectory = process.argv[2];
if (!cliDirectory) throw new Error("Pass the installed firebase-tools directory.");
const require = createRequire(path.resolve(cliDirectory, "package.json"));
const auth = require(path.resolve(cliDirectory, "lib/auth.js"));
const account = auth.getGlobalDefaultAccount();
if (!account) throw new Error("Run firebase login first.");
const token = account.tokens.access_token && account.tokens.expires_at > Date.now() + 60_000
  ? account.tokens
  : await auth.getAccessToken(account.tokens.refresh_token, account.tokens.scopes);
const origin = "https://akkh-jlpt-default-rtdb.asia-southeast1.firebasedatabase.app";

const kanjiLessons = [
  { number: 8, title: "関係（かんけい）", titleMyanmar: "လူမှုဆက်ဆံရေး", words: [["関係", "かんけい"], ["仲間", "なかま"], ["他人", "たにん"], ["意見", "いけん"], ["仲裁", "ちゅうさい"]] },
  { number: 9, title: "単位（たんい）", titleMyanmar: "ယူနစ်နှင့် အရေအတွက်", words: [["単独", "たんどく"], ["簡単", "かんたん"], ["複数", "ふくすう"], ["重複", "ちょうふく"], ["平均", "へいきん"]] },
  { number: 10, title: "学校（がっこう）", titleMyanmar: "ကျောင်း", words: [["児童", "じどう"], ["教師", "きょうし"], ["教室", "きょうしつ"], ["担任", "たんにん"], ["学級", "がっきゅう"]] },
  { number: 11, title: "受験（じゅけん）", titleMyanmar: "ဝင်ခွင့်စာမေးပွဲ", words: [["受験", "じゅけん"], ["希望", "きぼう"], ["面接", "めんせつ"], ["合格", "ごうかく"], ["成績", "せいせき"]] },
  { number: 12, title: "授業（じゅぎょう）", titleMyanmar: "သင်ခန်းစာ", words: [["授業", "じゅぎょう"], ["欠席", "けっせき"], ["復習", "ふくしゅう"], ["解説", "かいせつ"], ["卒業", "そつぎょう"]] },
  { number: 13, title: "地球（ちきゅう）", titleMyanmar: "ကမ္ဘာ", words: [["地球", "ちきゅう"], ["生物", "せいぶつ"], ["種類", "しゅるい"], ["存在", "そんざい"], ["地形", "ちけい"]] },
  { number: 14, title: "旅行（りょこう）", titleMyanmar: "ခရီးသွားခြင်း", words: [["旅行", "りょこう"], ["準備", "じゅんび"], ["飛行機", "ひこうき"], ["移動", "いどう"], ["宿泊", "しゅくはく"]] },
  { number: 15, title: "交通（こうつう）", titleMyanmar: "ယာဉ်အသွားအလာ", words: [["交通", "こうつう"], ["道路", "どうろ"], ["交差点", "こうさてん"], ["直進", "ちょくしん"], ["横断", "おうだん"]] },
  { number: 16, title: "仕事（しごと）", titleMyanmar: "အလုပ်", words: [["仕事", "しごと"], ["求職", "きゅうしょく"], ["求人", "きゅうじん"], ["職場", "しょくば"], ["収入", "しゅうにゅう"]] },
  { number: 17, title: "会議（かいぎ）", titleMyanmar: "အစည်းအဝေး", words: [["会議", "かいぎ"], ["賛成", "さんせい"], ["反対", "はんたい"], ["判定", "はんてい"], ["確認", "かくにん"]] },
  { number: 18, title: "会社（かいしゃ）", titleMyanmar: "ကုမ္ပဏီ", words: [["会社", "かいしゃ"], ["管理職", "かんりしょく"], ["予算", "よさん"], ["費用", "ひよう"], ["供給", "きょうきゅう"]] },
  { number: 19, title: "産業（さんぎょう）", titleMyanmar: "စက်မှုလုပ်ငန်း", words: [["産業", "さんぎょう"], ["貿易", "ぼうえき"], ["商業", "しょうぎょう"], ["機械", "きかい"], ["技術", "ぎじゅつ"]] },
  { number: 20, title: "法律（ほうりつ）", titleMyanmar: "ဥပဒေ", words: [["法律", "ほうりつ"], ["規則", "きそく"], ["禁止", "きんし"], ["許可", "きょか"], ["犯罪", "はんざい"]] },
];

function grammarPractice(card, index) {
  const example = card.examples?.find((item) => item.japanese) ?? {
    japanese: card.exampleJapanese ?? "",
    myanmar: card.exampleMyanmar ?? "",
  };
  const chapterId = card.parentChapterId || card.chapterId;
  return {
    _id: `minna-grammar-practice:${card._id || card.id}:${index + 1}`,
    chapterId,
    parentChapterId: chapterId,
    subchapterId: "",
    studyTab: "Grammar",
    section: "文法パターン練習",
    question: `「${card.meaning}」を表す文を、「${card.term}」を使って作ってください。`,
    questionMyanmar: `「${card.term}」သဒ္ဒါပုံစံကို အသုံးပြုပြီး ဥပမာစာကြောင်းရေးပါ။`,
    answer: example.japanese,
    answerMyanmar: example.myanmar || card.meaning || "",
    sourceReferences: card.sourceReferences ?? [],
    generated: true,
  };
}

function kanjiPractice(lesson, chapterId, word, index, kind) {
  const [term, reading] = word;
  const readingMode = kind === "reading";
  return {
    _id: `n3-kanji-master:${lesson.number}:${kind}:${index + 1}`,
    chapterId,
    parentChapterId: chapterId,
    subchapterId: "",
    studyTab: "Kanji",
    section: readingMode ? "漢字の読み" : "漢字を書く",
    question: readingMode
      ? `次の漢字の読み方を書いてください：${term}`
      : `次の読み方を漢字で書いてください：${reading}`,
    questionMyanmar: readingMode
      ? "အောက်ပါစကားလုံး၏ ဖတ်ပုံကို ရေးပါ။"
      : "အောက်ပါဖတ်ပုံကို သင့်တော်သော ကန်ဂျီဖြင့် ရေးပါ။",
    answer: readingMode ? reading : term,
    answerMyanmar: "",
    sourceReferences: [{ book: "N3 Kanji Master.pdf", chapter: lesson.number }],
    generated: true,
  };
}

async function request(options = {}) {
  const response = await fetch(`${origin}/jlpt/content.json`, {
    ...options,
    headers: { Authorization: `Bearer ${token.access_token}`, ...options.headers },
  });
  if (!response.ok) throw new Error(`Firebase content: HTTP ${response.status}; stopped without retrying.`);
  return response;
}

const response = await request({ headers: { "X-Firebase-ETag": "true" } });
const etag = response.headers.get("etag");
const current = await response.json();
const { content: originalContent, revision } = decodeSnapshot(current);
const next = normalizeContent(originalContent);
const existingIds = new Set([
  ...next.baselineExercises.map((item) => item._id),
  ...next.exercises.map((item) => item._id),
  ...next.deletedExercises,
]);
const existingChapterIds = new Set([
  ...next.baselineKanjiChapters.map((chapter) => chapter.id),
  ...next.chapters.map((chapter) => chapter.id),
]);
const grammarCards = next.cards.filter((card) => card.studyTab === "Grammar");
assert.equal(grammarCards.length, 71, "Expected the 71 Minna grammar cards to be present.");

const additions = [];
for (const card of grammarCards) {
  const exercise = grammarPractice(card, 0);
  if (!existingIds.has(exercise._id)) additions.push(exercise);
}

const newChapters = [];
for (const lesson of kanjiLessons) {
  const chapterId = `n3-kanji-master-chapter-${String(lesson.number).padStart(2, "0")}`;
  if (!existingChapterIds.has(chapterId)) {
    newChapters.push({
      id: chapterId,
      number: String(lesson.number),
      title: lesson.title,
      titleMyanmar: lesson.titleMyanmar,
      groupTitle: "漢字マスター N3",
      studyTab: "Kanji",
      subchapters: [],
    });
    existingChapterIds.add(chapterId);
  }
  for (const [index, word] of lesson.words.entries()) {
    for (const kind of ["reading", "writing"]) {
      const exercise = kanjiPractice(lesson, chapterId, word, index, kind);
      if (!existingIds.has(exercise._id)) additions.push(exercise);
    }
  }
}

next.chapters = [...next.chapters, ...newChapters];
next.baselineExercises = [...next.baselineExercises, ...additions];
const backup = path.resolve(".migration-backups", `pdf-exercises-${new Date().toISOString().replaceAll(":", "-")}`);
await fs.mkdir(backup, { recursive: true });
await fs.writeFile(path.join(backup, "n3-before.json"), JSON.stringify(current));
await fs.writeFile(path.join(backup, "n3-proposed-content.json"), JSON.stringify(next, null, 2));

const grammarCount = additions.filter((item) => item.studyTab === "Grammar").length;
const kanjiCount = additions.filter((item) => item.studyTab === "Kanji").length;
console.log(JSON.stringify({
  revision,
  grammarCards: grammarCards.length,
  grammarExercisesToAdd: grammarCount,
  kanjiChaptersToAdd: newChapters.length,
  kanjiExercisesToAdd: kanjiCount,
  totalExercisesToAdd: additions.length,
  backup,
}, null, 2));

if (!process.argv.includes("--apply")) {
  console.log("Preview only. Run again with --apply to add these exercises and chapters.");
  process.exit(0);
}
if (!additions.length && !newChapters.length) {
  console.log("All requested chapters and exercises are already present.");
  process.exit(0);
}
if (!etag) throw new Error("Missing Firebase ETag; refusing an unprotected write.");
const update = createCloudUpdate(
  current,
  revision,
  next,
  "firebase-cli-n3-pdf-exercises",
  { ".sv": "timestamp" },
);
await request({
  method: "PUT",
  headers: { "Content-Type": "application/json", "if-match": etag },
  body: JSON.stringify(update),
});
const saved = await (await request()).json();
assert.equal(saved.revision, revision + 1);
assert.equal(saved.payload, update.payload);
await fs.writeFile(path.join(backup, "n3-after.json"), JSON.stringify(saved));
console.log(`Verified ${grammarCount} Grammar and ${kanjiCount} Kanji exercises; added ${newChapters.length} Kanji chapters. Revision ${saved.revision}.`);
