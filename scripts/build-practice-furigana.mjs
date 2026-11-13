// Offline generation keeps the morphological dictionary out of the browser.
import fs from "node:fs/promises";
import kuromoji from "kuromoji";
import bank from "../src/n3PracticeBank.json" with { type: "json" };
import passages from "../src/readingPassages.js";
import pdfPassages from "../src/pdfReadingPassages.json" with { type: "json" };
import { mockQuestions } from "../src/mockExamQuestions.js";
import { archivePracticeSets } from "../src/mockExamArchivePractice.js";

const tokenizer = await new Promise((resolve, reject) =>
  kuromoji.builder({ dicPath: "node_modules/kuromoji/dict" }).build((error, result) => error ? reject(error) : resolve(result)),
);
const hiragana = (text) => text.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
const han = /[\p{Script=Han}々〆]/u;
const unknown = new Set();
const output = {};
// Isolated stems occur where the PDF extraction inserted spaces inside words.
// Rare characters in distractors retain readings of the actual printed kanji.
const stemReadings = {
  担: "かつ", 突: "つ", 引: "ひ", 払: "はら", 燃: "も", 受: "う",
  貯: "た", 請: "せい", 習: "なら", 置: "お", 疲: "つか", 悲: "かな",
  違: "ちが", 思: "おも", 支: "ささ", 押: "お", 落: "お", 危: "あぶ",
  忙: "いそが", 扱: "あつか", 読: "よ", 換: "か", 購: "こう", 必: "かなら",
  捨: "す", 逃: "に", 働: "はたら", 輸: "ゆ", 愉: "ゆ", 牣: "じん",
  牞: "きゅう", 踏: "ふ", 騒: "さわ", 囲: "かこ", 遊: "あそ", 浮: "う",
  邑: "ゆう", 每: "まい", 添: "そ", 示: "しめ", 聞: "き", 沈: "しず",
  笄: "こうがい", 壊: "こわ", 備: "そな", 蒸: "む", 混: "ま", 誘: "さそ",
  憶: "おく", 予: "よ", 貨: "か", 疋: "ひき", 閉: "し", 閑: "かん",
  忚: "けい", 沿: "ぞ", 吸: "す", 儒: "じゅ", 争: "あらそ", 悩: "なや",
  忘: "わす", 慣: "な", 召: "め", 疫: "えき", 招: "まね", 飼: "か", 迷: "まよ",
  批: "ひ", 慢: "まん", 絡: "から", 戒: "かい",
};
const dayReadings = { 1: 'ついたち', 2: 'ふつか', 3: 'みっか', 4: 'よっか', 5: 'いつか', 6: 'むいか', 7: 'なのか', 8: 'ようか', 9: 'ここのか', 10: 'とおか', 14: 'じゅうよっか', 20: 'はつか', 24: 'にじゅうよっか' };
const units = ['', 'いち', 'に', 'さん', 'よん', 'ご', 'ろく', 'しち', 'はち', 'く'];
function calendarReading(day) {
  return dayReadings[day] || `${day >= 30 ? 'さんじゅう' : day >= 20 ? 'にじゅう' : 'じゅう'}${units[day % 10]}にち`;
}
function annotate(text) {
  let result = "";
  let cursor = 0;
  let tokenCursor = 0;
  for (const token of tokenizer.tokenize(text)) {
    const word = token.surface_form;
    const position = text.indexOf(word, tokenCursor);
    if (position < 0) throw new Error(`Tokenizer text mismatch: ${word}`);
    tokenCursor = position + word.length;
    if (position < cursor) continue;
    result += text.slice(cursor, position);
    const prefix = text.slice(0, position);
    const date = text.slice(position).match(/^([0-9０-９]{1,2})\s*日/u);
    if (date && /月\s*$/.test(prefix)) {
      const day = Number(date[1].normalize('NFKC'));
      if (day >= 1 && day <= 31) {
        result += `${date[0]}（${calendarReading(day)}）`;
        cursor = position + date[0].length;
        continue;
      }
    }
    if (han.test(word)) {
      let reading = token.reading ? hiragana(token.reading) : stemReadings[word];
      // PDF layout spaces must not turn date/time counters into standalone nouns.
      const counter = /[0-9０-９XＸ]\s*$/.test(prefix);
      if (counter) reading = ({ 年: 'ねん', 月: 'がつ', 時: 'じ', 歳: 'さい' })[word] || reading;
      // Two PDF glyph substitutions occur in the source; retain its text.
      if (word === '尐') reading = /多\s*$/.test(prefix) ? 'しょう' : /^し/.test(text.slice(position + word.length)) ? 'すこ' : 'すく';
      if (!reading) { unknown.add(word); result += word; }
      else {
        // Keep okurigana outside the annotation: 歩（ある）いて.
        const suffix = word.match(/[ぁ-ゖ]+$/u)?.[0] || "";
        if (suffix && reading.endsWith(suffix) && reading.length > suffix.length)
          result += `${word.slice(0, -suffix.length)}（${reading.slice(0, -suffix.length)}）${suffix}`;
        else result += `${word}（${reading}）`;
      }
    } else result += word;
    cursor = position + word.length;
  }
  return result + text.slice(cursor);
}
function visit(value) {
  if (typeof value === "string" && han.test(value)) {
    // Preserve explicitly authored kana annotations.
    const annotated = value.split(/([\p{Script=Han}々〆ぁ-ゖァ-ヶ]+[（(][ぁ-ゖァ-ヶー]+[）)])/u)
      .map((part) => /[（(][ぁ-ゖァ-ヶー]+[）)]$/u.test(part) ? part : annotate(part)).join("");
    output[value] = annotated;
  } else if (Array.isArray(value)) value.forEach(visit);
  else if (value && typeof value === "object") {
    for (const key of ["title", "text", "passages", "questions", "prompt", "choices", "explanation", "topic", "problem", "passage", "target"]) {
      if (key in value) visit(value[key]);
    }
  }
}
visit(passages);
visit(bank);
visit(pdfPassages);
visit(mockQuestions);
visit(archivePracticeSets);
visit("正解");
console.log(JSON.stringify({ strings: Object.keys(output).length, unknown: [...unknown] }));
if (unknown.size) throw new Error("Add reviewed readings for the unknown tokens above.");
await fs.writeFile("src/practiceFurigana.json", JSON.stringify(output, null, 2) + "\n");
