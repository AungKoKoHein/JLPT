import test from "node:test";
import assert from "node:assert/strict";
import catalog from "../migrations/n3-catalog.json" with { type: "json" };
import { addN3Catalog } from "../migrations/catalogMigration.js";
import { emptyContent, normalizeContent, createCloudUpdate, decodeSnapshot } from "../src/cloudContent.js";
import { levelFromPath, routesForLevel, studyTabFromPath, contentPathForLevel } from "../src/studyRoutes.js";
import { resolveVocabularyCards } from "../src/vocabularyContent.js";

test("both levels retain their level and study tab on every direct route", () => {
  for (const level of ["n2", "n3"]) {
    for (const [tab, path] of Object.entries(routesForLevel(level))) {
      assert.equal(levelFromPath(path), level);
      assert.equal(studyTabFromPath(path), tab);
      assert.equal(studyTabFromPath(path + "/"), tab);
    }
  }
  assert.equal(levelFromPath("/grammar"), "n3");
  assert.notEqual(contentPathForLevel("n2"), contentPathForLevel("n3"));
  assert.throws(() => contentPathForLevel("n1"));
});

test("N3 migration preserves all owner changes and is idempotent", () => {
  const id = `${catalog.baselineChapters[0].id}:card:0`;
  const old = normalizeContent({
    cards: [{ _id: "custom", chapterId: "custom-chapter", term: "saved" }],
    cardOverrides: { [id]: { meaning: "Owner translation" } },
    deletedCards: [`${catalog.baselineChapters[0].id}:card:1`],
    cardOrders: { '["Vocab","custom-chapter"]': ["custom"] },
  });
  const migrated = addN3Catalog(old, catalog);
  for (const key of Object.keys(old).filter(key => !key.startsWith("baseline"))) {
    assert.deepEqual(migrated[key], old[key]);
  }
  assert.deepEqual(addN3Catalog(migrated, catalog), migrated);
  assert.deepEqual(resolveVocabularyCards(migrated.baselineChapters, migrated), resolveVocabularyCards(catalog.baselineChapters, old));
  const record = createCloudUpdate({ revision: 7 }, 7, migrated, "owner", 123);
  assert.deepEqual(decodeSnapshot(record).content, migrated);
});

test("empty N2 has no N3 chapters, cards or exercises", () => {
  const n2 = decodeSnapshot(null).content;
  addN3Catalog(emptyContent, catalog);
  assert.deepEqual(n2, emptyContent);
  assert.deepEqual(resolveVocabularyCards(n2.baselineChapters, n2), []);
  for (const key of ["baselineChapters", "baselineKanjiChapters", "baselineExercises", "chapters", "cards", "kanjiCards", "exercises"]) assert.equal(n2[key].length, 0);
});
