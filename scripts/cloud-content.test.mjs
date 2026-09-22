import assert from "node:assert/strict";
import test from "node:test";
import {
  createCloudUpdate,
  decodeSnapshot,
  emptyContent,
  normalizeContent,
} from "../src/cloudContent.js";

test("an empty database returns empty content without creating cloud data", () => {
  assert.deepEqual(decodeSnapshot(null), {
    content: emptyContent,
    revision: 0,
  });
});

test("cloud round trip retains added content, overrides, deletions, and order keys", () => {
  const content = structuredClone(emptyContent);
  content.cards.push({ _id: "user-card-1", term: "日本", meaning: "Japan" });
  content.cardOverrides["part-1-chapter-1:card:0"] = { term: "Edited" };
  content.deletedCards.push("part-1-chapter-1:card:1");
  content.cardOrders['["Vocab","part-1-chapter-1"]'] = ["user-card-1"];
  content.kanjiCards.push({
    _id: "custom-kanji",
    kanji: "日",
    readings: [],
    words: [],
  });
  content.subchapters.push({ id: "custom-subchapter", title: "Practice" });
  content.exercises.push({
    _id: "custom-exercise",
    question: "Question",
    answer: "Answer",
  });
  const saved = createCloudUpdate(null, 0, content, "owner", 123);
  assert.equal(saved.revision, 1);
  assert.equal(saved.updatedBy, "owner");
  assert.equal(saved.updatedAt, 123);
  assert.deepEqual(
    decodeSnapshot(JSON.parse(JSON.stringify(saved))).content,
    content,
  );
  // The special characters stay inside a string, not Firebase child keys.
  assert.equal(typeof saved.payload, "string");
});

test("a stale device cannot overwrite a newer save", () => {
  const first = createCloudUpdate(null, 0, emptyContent, "owner", 1);
  const second = createCloudUpdate(
    first,
    1,
    { ...emptyContent, deletedCards: ["card"] },
    "owner",
    2,
  );
  assert.equal(
    createCloudUpdate(second, 1, emptyContent, "owner", 3),
    undefined,
  );
  assert.equal(
    createCloudUpdate(first, 0, emptyContent, "owner", 3),
    undefined,
  );
  assert.equal(second.revision, 2);
  assert.deepEqual(decodeSnapshot(second).content.deletedCards, ["card"]);
});

test("legacy local saves get defaults and invalid cloud data is rejected", () => {
  assert.deepEqual(normalizeContent({ cards: [] }), emptyContent);
  assert.throws(() => normalizeContent({ cards: {} }));
  assert.throws(() => normalizeContent({ cards: [null] }));
  assert.throws(() => normalizeContent({ cardOverrides: { bad: null } }));
  assert.throws(() => normalizeContent({ cardOrders: { bad: "wrong" } }));
  assert.throws(() =>
    decodeSnapshot({ schemaVersion: 2, revision: 1, payload: "{}" }),
  );
  assert.throws(() =>
    decodeSnapshot({ schemaVersion: 1, revision: 1, payload: "invalid" }),
  );
});
