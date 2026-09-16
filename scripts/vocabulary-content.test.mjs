import assert from "node:assert/strict";
import test from "node:test";
import { moveVocabularyCard, resolveVocabularyCards } from "../src/vocabularyContent.js";

const chapters = [
  { id: "first", cards: [{ term: "Original" }, { term: "Unchanged" }] },
  { id: "second", cards: [] },
];
const saved = (overrides = {}) => ({ cards: [], cardOverrides: overrides, deletedCards: [] });

test("reordering whole cards persists and does not change their fields", () => {
  const original = saved();
  const moved = moveVocabularyCard(chapters, original, "first:card:0", 1);
  const restored = JSON.parse(JSON.stringify(moved));
  assert.deepEqual(resolveVocabularyCards(chapters, restored).map((card) => card.term), ["Unchanged", "Original"]);
  assert.deepEqual(moved.cardOverrides, original.cardOverrides);
  assert.equal(original.cardOrders, undefined);
  const reversed = moveVocabularyCard(chapters, restored, "first:card:0", -1);
  assert.deepEqual(resolveVocabularyCards(chapters, reversed), resolveVocabularyCards(chapters, original));
});

test("subchapter positions stay within their section and stop at the ends", () => {
  const content = saved({ "first:card:0": { chapterId: "subchapter" } });
  content.cards.push(
    { _id: "custom", chapterId: "subchapter", term: "Custom", layout: "wide" },
    { _id: "other", chapterId: "other-subchapter", term: "Other" },
  );
  assert.equal(moveVocabularyCard(chapters, content, "first:card:0", -1), content);
  assert.equal(moveVocabularyCard(chapters, content, "custom", 1), content);
  const moved = moveVocabularyCard(chapters, content, "custom", -1);
  const cards = resolveVocabularyCards(chapters, moved);
  assert.deepEqual(cards.filter((card) => card.chapterId === "subchapter").map((card) => card._id), ["custom", "first:card:0"]);
  assert.equal(cards.find((card) => card._id === "custom").layout, "wide");
  assert.equal(cards.find((card) => card._id === "other").chapterId, "other-subchapter");
  moved.deletedCards.push("first:card:0");
  moved.cards.push({ _id: "new", chapterId: "subchapter", term: "New" });
  assert.deepEqual(resolveVocabularyCards(chapters, moved).filter((card) => card.chapterId === "subchapter").map((card) => card._id), ["custom", "new"]);
});

test("built-in card edits survive moves and storage reloads without changing other cards", () => {
  for (const chapterId of ["second", "custom-chapter", "custom-subchapter"]) {
    const changes = {
      chapterId, parentChapterId: "second", subchapterId: chapterId === "custom-subchapter" ? chapterId : "",
      term: "Updated", meaning: "Meaning", exampleJapanese: "Example",
      exampleMyanmar: "Explanation", layout: "wide", studyTab: "Vocab",
    };
    const content = JSON.parse(JSON.stringify(saved({ "first:card:0": changes })));
    const cards = resolveVocabularyCards(chapters, content);
    assert.equal(cards.length, 2);
    assert.deepEqual(cards.find((card) => card.chapterId === chapterId), { ...changes, _id: "first:card:0" });
    assert.equal(cards.find((card) => card.chapterId === "first").term, "Unchanged");
  }
});

test("tab moves apply to built-in and added cards before grouping", () => {
  const content = saved({
    "first:card:0": { studyTab: "Grammar", chapterId: "" },
    custom: { studyTab: "Reading", chapterId: "" },
  });
  content.cards.push({ _id: "custom", studyTab: "Vocab", chapterId: "first", term: "Custom" });
  const cards = resolveVocabularyCards(chapters, content);
  assert.equal(cards.filter((card) => card.studyTab === "Vocab").length, 1);
  assert.equal(cards.find((card) => card.studyTab === "Grammar")._id, "first:card:0");
  assert.equal(cards.find((card) => card.studyTab === "Reading")._id, "custom");
});

test("deleted cards remain hidden after moving", () => {
  const content = saved({ "first:card:0": { chapterId: "second" } });
  content.deletedCards.push("first:card:0");
  assert.deepEqual(resolveVocabularyCards(chapters, content).map((card) => card.term), ["Unchanged"]);
});
