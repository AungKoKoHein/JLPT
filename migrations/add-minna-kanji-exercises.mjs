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

const kanjiMeanings = {
  "関係": "ဆက်နွယ်မှု၊ ပတ်သက်မှု",
  "仲間": "အဖော်၊ အပေါင်းအသင်း",
  "他人": "အခြားသူ",
  "意見": "အမြင်၊ သဘောထား",
  "仲裁": "ကြားဝင်ဖျန်ဖြေခြင်း",
  "単独": "တစ်ဦးတည်း၊ သီးခြား",
  "簡単": "လွယ်ကူသော",
  "複数": "အများအပြား",
  "重複": "ထပ်တူဖြစ်ခြင်း",
  "平均": "ပျမ်းမျှ",
  "児童": "ကျောင်းနေအရွယ်ကလေး",
  "教師": "ဆရာ၊ ဆရာမ",
  "教室": "စာသင်ခန်း",
  "担任": "အတန်းပိုင်ဆရာ",
  "学級": "အတန်း",
  "受験": "စာမေးပွဲဖြေဆိုခြင်း",
  "希望": "မျှော်လင့်ချက်",
  "面接": "လူတွေ့မေးမြန်းခြင်း",
  "合格": "စာမေးပွဲအောင်ခြင်း",
  "成績": "အမှတ်၊ ပညာရေးရလဒ်",
  "授業": "သင်ခန်းစာ၊ အတန်းချိန်",
  "欠席": "ပျက်ကွက်ခြင်း",
  "復習": "ပြန်လည်လေ့လာခြင်း",
  "解説": "ရှင်းလင်းချက်",
  "卒業": "ကျောင်းပြီးခြင်း",
  "地球": "ကမ္ဘာဂြိုဟ်",
  "生物": "သက်ရှိ",
  "種類": "အမျိုးအစား",
  "存在": "တည်ရှိမှု",
  "地形": "မြေမျက်နှာသွင်ပြင်",
  "旅行": "ခရီးသွားခြင်း",
  "準備": "ပြင်ဆင်မှု",
  "飛行機": "လေယာဉ်",
  "移動": "ရွှေ့ပြောင်းသွားလာခြင်း",
  "宿泊": "တည်းခိုခြင်း",
  "交通": "ယာဉ်အသွားအလာ၊ သွားလာရေး",
  "道路": "လမ်းမ",
  "交差点": "လမ်းဆုံ",
  "直進": "တည့်တည့်သွားခြင်း",
  "横断": "ဖြတ်ကူးခြင်း",
  "仕事": "အလုပ်",
  "求職": "အလုပ်ရှာဖွေခြင်း",
  "求人": "အလုပ်ခေါ်ယူမှု",
  "職場": "အလုပ်ခွင်",
  "収入": "ဝင်ငွေ",
  "会議": "အစည်းအဝေး",
  "賛成": "သဘောတူခြင်း",
  "反対": "ဆန့်ကျင်ခြင်း",
  "判定": "ဆုံးဖြတ်သတ်မှတ်ခြင်း",
  "確認": "စစ်ဆေးအတည်ပြုခြင်း",
  "会社": "ကုမ္ပဏီ",
  "管理職": "စီမံခန့်ခွဲရေးရာထူး",
  "予算": "ဘတ်ဂျက်၊ အသုံးစရိတ်ခန့်မှန်းချက်",
  "費用": "ကုန်ကျစရိတ်",
  "供給": "ထောက်ပံ့ပေးခြင်း",
  "産業": "စက်မှုလုပ်ငန်း",
  "貿易": "နိုင်ငံခြားကုန်သွယ်ရေး",
  "商業": "ကူးသန်းရောင်းဝယ်ရေး",
  "機械": "စက်ယန္တရား",
  "技術": "နည်းပညာ",
  "法律": "ဥပဒေ",
  "規則": "စည်းမျဉ်း",
  "禁止": "တားမြစ်ခြင်း",
  "許可": "ခွင့်ပြုချက်",
  "犯罪": "ရာဇဝတ်မှု",
};

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

function kanjiFlashcard(lesson, chapterId, [term, reading]) {
  const id = `n3-kanji-master-card:${String(lesson.number).padStart(2, "0")}:${term}`;
  const onReading = reading.replace(/[ぁ-ゖ]/g, (character) =>
    String.fromCharCode(character.charCodeAt(0) + 0x60),
  );
  const meaning = kanjiMeanings[term];
  if (!meaning) throw new Error(`Missing Burmese meaning for Kanji Master term: ${term}`);
  return {
    id,
    _id: id,
    chapterId,
    studyTab: "Kanji",
    kanji: term,
    meaning,
    lesson: lesson.title,
    readings: [{ kanji: term, on: onReading, kun: "" }],
    examples: [{ japanese: `${term}（${reading}）`, myanmar: meaning }],
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
const existingKanjiCardIds = new Set([
  ...next.kanjiCards.map((card) => card._id),
  ...next.deletedKanjiCards,
]);
const grammarCards = next.cards.filter((card) => card.studyTab === "Grammar");
assert.equal(grammarCards.length, 71, "Expected the 71 Minna grammar cards to be present.");

const additions = [];
for (const card of grammarCards) {
  const exercise = grammarPractice(card, 0);
  if (!existingIds.has(exercise._id)) additions.push(exercise);
}

const newChapters = [];
const kanjiCardsToAdd = [];
for (const lesson of kanjiLessons) {
  const chapterId = `n3-kanji-master-chapter-${String(lesson.number).padStart(2, "0")}`;
  if (!existingChapterIds.has(chapterId)) {
    newChapters.push({
      id: chapterId,
      number: String(lesson.number),
      title: lesson.title,
      titleMyanmar: lesson.titleMyanmar,
      studyTab: "Kanji",
      subchapters: [],
    });
    existingChapterIds.add(chapterId);
  }
  for (const word of lesson.words) {
    const card = kanjiFlashcard(lesson, chapterId, word);
    if (!existingKanjiCardIds.has(card._id)) {
      kanjiCardsToAdd.push(card);
      existingKanjiCardIds.add(card._id);
    }
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
next.kanjiCards = [...next.kanjiCards, ...kanjiCardsToAdd];
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
  kanjiFlashcardsToAdd: kanjiCardsToAdd.length,
  totalExercisesToAdd: additions.length,
  backup,
}, null, 2));

if (!process.argv.includes("--apply")) {
  console.log("Preview only. Run again with --apply to add these exercises and chapters.");
  process.exit(0);
}
if (!additions.length && !newChapters.length && !kanjiCardsToAdd.length) {
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
console.log(`Verified ${grammarCount} Grammar and ${kanjiCount} Kanji exercises, ${kanjiCardsToAdd.length} Kanji flashcards, and ${newChapters.length} Kanji chapters. Revision ${saved.revision}.`);
