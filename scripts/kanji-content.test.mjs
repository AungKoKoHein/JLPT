import test from "node:test";
import assert from "node:assert/strict";
import { kanjiExamples } from "../src/kanjiContent.js";
import catalog from "../migrations/n3-catalog.json" with { type: "json" };
const [kanjiChapter1, kanjiChapter2] = catalog.baselineKanjiChapters;

test("all original chapter-one example sentences survive normalization", () => {
  for (const card of kanjiChapter1.cards) {
    assert.deepEqual(
      kanjiExamples(card),
      card.words.map((word) => ({
        japanese: word.sentence,
        myanmar: word.explanation,
      })),
    );
  }
});

test("legacy single-sentence cards preserve their sentence and translation", () => {
  for (const card of kanjiChapter2.cards) {
    assert.deepEqual(kanjiExamples(card), [
      { japanese: card.sentence, myanmar: card.words[0].explanation },
    ]);
  }
});

test("saved multiple examples supersede legacy data without sharing mutable objects", () => {
  const examples = [
    { japanese: "一。", myanmar: "one" },
    { japanese: "二。", myanmar: "two" },
  ];
  const card = { examples, sentence: "old" };
  const result = kanjiExamples(card);
  assert.deepEqual(result, examples);
  result[0].japanese = "edited";
  assert.equal(card.examples[0].japanese, "一。");
});

test("new cards start with one empty example", () => {
  assert.deepEqual(kanjiExamples({}), [{ japanese: "", myanmar: "" }]);
});
