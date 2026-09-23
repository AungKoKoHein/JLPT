import test from "node:test";
import assert from "node:assert/strict";
import { emptyContent, normalizeContent } from "../src/cloudContent.js";
import { removeChapter, removeSubchapter } from "../src/deleteContainers.js";
import { resolveVocabularyCards, resolveVocabularySubchapters } from "../src/vocabularyContent.js";
import { resolveExercises } from "../src/exerciseContent.js";

for (const studyTab of ["Vocab", "Grammar", "Kanji", "Listening", "Reading", "Mock exam"]) {
  test(`${studyTab}: whole-folder deletion removes descendants and preserves unrelated records after reload`, () => {
    const original = structuredClone(emptyContent);
    const section = { id: "s", sourceId: "legacy-s", parentChapterId: "c", studyTab };
    original.subchapters = [section, { id: "other-s", parentChapterId: "other", studyTab }];
    const cards = [
      { _id: "direct", chapterId: "c", studyTab },
      { _id: "nested", chapterId: "s", parentChapterId: "c", studyTab },
      { _id: "outside", chapterId: "other", studyTab },
      { _id: "other-tab", chapterId: "c", studyTab: "Different" },
    ];
    const exercises = [
      { _id: "assigned", chapterId: "c", subchapterId: "s", studyTab },
      { _id: "main", chapterId: "c", studyTab },
      { _id: "unrelated", chapterId: "other", studyTab },
    ];
    const key = studyTab === "Kanji" ? "deletedKanjiCards" : "deletedCards";
    const next = normalizeContent(removeChapter(original, { id: "c", studyTab, subchapters: [section] }, cards, exercises, true));
    assert.deepEqual(next[key], ["direct", "nested"]);
    assert.deepEqual(next.deletedExercises, ["assigned", "main"]);
    assert.deepEqual(next.deletedChapters, ["c"]);
    assert.deepEqual(next.deletedSubchapters, ["s", "legacy-s"]);
    assert.equal(next.subchapters[0].id, "other-s");
    assert.equal(next.chapters.length, 0);
    assert.deepEqual(original.deletedExercises, []);
    const subOnly = normalizeContent(removeSubchapter(original, section, cards, exercises, true));
    assert.deepEqual(subOnly[key], ["nested"]);
    assert.deepEqual(subOnly.deletedExercises, ["assigned"]);
    assert.deepEqual(subOnly.deletedChapters, []);
    assert.deepEqual(removeChapter(next, { id: "c", studyTab, subchapters: [section] }, cards, exercises, true), next);
  });
}

test("deleting a bundled chapter preserves sections, cards, and exercise assignments after reload", () => {
  const section = { id: "s", sourceId: "s", parentChapterId: "c", title: "Section" };
  const base = [{ id: "c", subchapters: [section], cards: [{ term: "Term", sourceSubchapterId: "s" }] }];
  const exercises = [{ _id: "e", chapterId: "c", subchapterId: "s", studyTab: "Vocab" }];
  const original = structuredClone(emptyContent);
  const cards = resolveVocabularyCards(base, original);
  const next = normalizeContent(removeChapter(original, { id: "c", studyTab: "Vocab", subchapters: [section] }, cards, exercises));
  const sections = resolveVocabularySubchapters(base, next);
  assert.equal(sections[0].parentChapterId, "ungrouped-Vocab");
  assert.equal(resolveVocabularyCards(base, next)[0].parentChapterId, "ungrouped-Vocab");
  const resolved = resolveExercises(exercises, next, sections);
  assert.equal(resolved[0].chapterId, "ungrouped-Vocab");
  assert.equal(resolved[0].subchapterId, "s");
  const final = removeSubchapter(next, sections[0], resolveVocabularyCards(base, next), resolved);
  assert.equal(resolveVocabularyCards(base, final)[0].chapterId, "ungrouped-Vocab");
  assert.equal(resolveExercises(exercises, final, [])[0].subchapterId, "");
  assert.deepEqual(final.deletedCards, []);
  assert.deepEqual(final.deletedExercises, []);
});


test("Kanji container deletion preserves cards through kanji overrides", () => {
  const original = structuredClone(emptyContent);
  const section = { id: "ks", parentChapterId: "kc", studyTab: "Kanji" };
  const card = { _id: "k", chapterId: "kc", subchapterId: "ks", studyTab: "Kanji" };
  const moved = removeChapter(original, { id: "kc", studyTab: "Kanji", subchapters: [section] }, [card], []);
  assert.equal(moved.kanjiOverrides.k.chapterId, "ks");
  assert.equal(moved.kanjiOverrides.k.parentChapterId, "ungrouped-Kanji");
  const detached = removeSubchapter(moved, { ...section, parentChapterId: "ungrouped-Kanji" }, [{ ...card, ...moved.kanjiOverrides.k }], []);
  assert.equal(detached.kanjiOverrides.k.chapterId, "ungrouped-Kanji");
  assert.equal(detached.kanjiOverrides.k.subchapterId, "");
  assert.deepEqual(detached.deletedKanjiCards, []);
});
