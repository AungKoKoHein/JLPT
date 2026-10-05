import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import {
  buildGrammarCatalog,
  addGrammarCatalog,
  grammarKey,
} from "../migrations/grammarCatalog.js";
import { emptyContent } from "../src/cloudContent.js";
import { resolveVocabularyCards } from "../src/vocabularyContent.js";
import { hasVisibleChapterContent } from "../src/chapterVisibility.js";

const catalog = buildGrammarCatalog(
  await fs.readFile(
    new URL("../source/n3-grammar.tsv", import.meta.url),
    "utf8",
  ),
);

test("reviewed bilingual grammar catalog renders through existing card and chapter resolvers", () => {
  assert.equal(catalog.cards.length, 146);
  assert.equal(catalog.chapters.length, 19);
  const imported = addGrammarCatalog(emptyContent, catalog);
  const resolved = resolveVocabularyCards([], imported);
  assert.equal(resolved.length, 146);
  for (const chapter of imported.chapters) {
    assert.ok(hasVisibleChapterContent(chapter, resolved, []), chapter.title);
  }
  for (const card of resolved) {
    assert.equal(card.studyTab, "Grammar");
    assert.equal(card.layout, "wide");
    assert.ok(
      card.examples.every((example) => example.japanese && example.myanmar),
    );
    assert.ok(card.grammarExplanation);
    assert.ok(card.sourceReferences.length);
  }
});

test("import preserves owner content, overlays, ordering and unrelated study tabs", () => {
  const original = structuredClone(emptyContent);
  original.chapters.push({
    id: "owner-grammar",
    studyTab: "Grammar",
    title: "Owner",
  });
  original.cards.push({
    id: "owner",
    _id: "owner",
    studyTab: "Grammar",
    term: "書(か)かれている",
    chapterId: "owner-grammar",
  });
  original.cards.push({
    id: "vocab",
    _id: "vocab",
    studyTab: "Vocab",
    term: "Existing",
  });
  original.cardOverrides.owner = { meaning: "Owner edit" };
  original.cardOrders['["Grammar","owner-grammar"]'] = ["owner"];
  original.exercises.push({ id: "exercise", studyTab: "Reading" });
  const before = structuredClone(original);
  const imported = addGrammarCatalog(original, catalog);
  assert.deepEqual(original, before);
  assert.deepEqual(imported.cards.slice(0, 2), original.cards);
  assert.deepEqual(imported.chapters.slice(0, 1), original.chapters);
  for (const key of Object.keys(original).filter(
    (key) => !["cards", "chapters"].includes(key),
  )) {
    assert.deepEqual(imported[key], original[key]);
  }
  assert.deepEqual(addGrammarCatalog(imported, catalog), imported);
});

test("existing pattern duplicates, edited cards and owner deletions are respected", () => {
  const original = structuredClone(emptyContent);
  const first = catalog.cards[0];
  original.cards.push({
    _id: "owner",
    studyTab: "Grammar",
    term: first.term.replaceAll("～", ""),
  });
  original.deletedCards.push(catalog.cards[1]._id);
  original.deletedChapters.push(catalog.chapters[1].id);
  original.cardOverrides[catalog.cards[2]._id] = { term: "Owner override" };
  const imported = addGrammarCatalog(original, catalog);
  assert.ok(!imported.cards.some((card) => card._id === first._id));
  assert.ok(!imported.cards.some((card) => card._id === catalog.cards[1]._id));
  assert.ok(!imported.cards.some((card) => card._id === catalog.cards[2]._id));
  assert.ok(
    !imported.cards.some((card) => card.chapterId === catalog.chapters[1].id),
  );
  assert.ok(
    !imported.chapters.some((chapter) => chapter.id === catalog.chapters[1].id),
  );
  assert.equal(grammarKey("～間(あいだ)"), grammarKey("間"));
  assert.notEqual(
    grammarKey("～そうだ（伝聞）"),
    grammarKey("～そうだ（様態）"),
  );
});

test("a damaged source row cannot be imported", () => {
  assert.throws(
    () => buildGrammarCatalog("time|～うちに"),
    /expected 8 fields/,
  );
});
