import test from "node:test";
import assert from "node:assert/strict";
import readings from "../src/practiceFurigana.json" with { type: "json" };
import bank from "../src/n3PracticeBank.json" with { type: "json" };
import passages from "../src/readingPassages.js";
import pdfPassages from "../src/pdfReadingPassages.json" with { type: "json" };
import { mockQuestions } from "../src/mockExamQuestions.js";
import { archivePracticeSets } from "../src/mockExamArchivePractice.js";
import { practiceText } from "../src/practiceText.js";
import { hideReadings } from "../src/studyText.js";

test("every bundled Reading, Practice and Mock Exam Japanese field has complete annotations", () => {
  let fields = 0;
  function visit(value) {
    if (typeof value === "string" && /\p{Script=Han}/u.test(value)) {
      fields++;
      assert.ok(readings[value], `Missing field: ${value}`);
      const uncovered = readings[value].replace(/[\p{Script=Han}々〆ぁ-ゖァ-ヶー]+[（(][ぁ-ゖァ-ヶー]+[）)]/gu, "");
      assert.doesNotMatch(uncovered, /\p{Script=Han}/u, `Uncovered kanji: ${readings[value]}`);
      assert.equal(practiceText(value, false), hideReadings(value), "OFF preserves the original text and spacing");
    } else if (Array.isArray(value)) value.forEach(visit);
    else if (value && typeof value === "object")
      for (const key of ["title", "text", "passages", "questions", "prompt", "choices", "explanation", "topic", "problem", "passage", "target"])
        if (key in value) visit(value[key]);
  }
  visit(passages);
  visit(bank);
  visit(pdfPassages);
  visit(mockQuestions);
  visit(archivePracticeSets);
  assert.ok(fields > 4000);
});

test("PDF email uses complete word readings, names, and contextual date/time counters", () => {
  const text = pdfPassages[0].passages[0].text;
  const annotated = practiceText(text, true);
  for (const word of ['宛名（あてな）', '差出人（さしだしにん）', '講演（こうえん）', '市役所（しやくしょ）', '会館（かいかん）', '都合（つごう）', '午前（ごぜん）', '生き方（いきかた）', '武田（たけだ）', '健一（けんいち）', '検討（けんとう）', '年（ねん）', '月（がつ）', '時（じ）']) {
    assert.ok(annotated.includes(word), word);
  }
  assert.match(annotated, /１０日（とおか）/u);
  assert.match(annotated, /3 日（みっか）/u);
  assert.equal(practiceText(text, false), text);
  const kanaOnly = practiceText(text, true, false);
  assert.doesNotMatch(kanaOnly, /\p{Script=Han}/u);
  assert.ok(kanaOnly.includes('みっか'));
  assert.ok(!kanaOnly.includes('3 みっか'));
});

test("toggle supports full words, okurigana, kana-only view and existing readings", () => {
  assert.match(practiceText("図書館からのお知らせ", true), /図書館（としょかん）/u);
  assert.equal(practiceText("図書館からのお知らせ", false), "図書館からのお知らせ");
  assert.doesNotMatch(practiceText(passages[0].text, true, false), /\p{Script=Han}|[（）]/u);
  assert.equal(practiceText("学校（がっこう）", true), "学校（がっこう）");
  assert.equal(practiceText("学校（がっこう）", false), "学校");
  assert.equal(practiceText("English explanation", true), "English explanation");
});
