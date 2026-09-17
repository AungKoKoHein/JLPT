import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { chapters } from "../src/data/n3Vocabulary.js";
import { exercisesByChapter } from "../src/data/exercises.js";
import { emptyContent, normalizeContent } from "../src/cloudContent.js";
import { resolveVocabularyCards, resolveVocabularySubchapters } from "../src/vocabularyContent.js";
import { exercisesForView, resolveExercises, unassignExercises, vocabularyExercises } from "../src/exerciseContent.js";

const structure = JSON.parse(await readFile(new URL("../source/vocabulary-structure.json", import.meta.url), "utf8"));
const baseExercises = vocabularyExercises(exercisesByChapter);
const withoutReadings = (text) => text.replace(/（[ぁ-ゖー]+）/g, "");

test("all book chapters retain both numbered sections, card order, and matching exercises", () => {
  const sections = resolveVocabularySubchapters(chapters, emptyContent);
  const cards = resolveVocabularyCards(chapters, emptyContent);
  const exercises = resolveExercises(baseExercises, emptyContent, sections);
  assert.equal(chapters.length, 29);
  assert.equal(sections.length, 58);
  assert.equal(exercises.length, 391);
  assert.equal(new Set(cards.map((card) => card._id)).size, cards.length);
  chapters.forEach((chapter, chapterIndex) => {
    const reference = structure.chapters[chapterIndex];
    assert.equal(chapter.sourceNumber, reference.key);
    assert.equal(withoutReadings(chapter.title), `${Number(reference.key.split(".")[1])}課：${reference.title}`);
    const chapterSections = sections.filter((section) => section.parentChapterId === chapter.id);
    assert.deepEqual(chapterSections.map((section) => withoutReadings(section.title)), reference.sections);
    for (const section of chapterSections) {
      const expectedIds = chapter.cards.flatMap((card, index) => card.sourceSubchapterId === section.id ? [`${chapter.id}:card:${index}`] : []);
      assert(expectedIds.length > 0, section.id);
      assert.deepEqual(cards.filter((card) => card.chapterId === section.id).map((card) => card._id), expectedIds);
      const assigned = exercisesForView(exercises, "Vocab", chapter.id, section.id);
      assert(assigned.length > 0, section.id);
      assert(assigned.every((item) => item.section.startsWith(`${section.number}-`)));
    }
    assert.equal(cards.filter((card) => card.chapterId === chapter.id).length, 0);
  });
});

test("manual Chapter 1 sections are reused without duplicating or replacing saved content", () => {
  const chapter = chapters[0];
  const content = normalizeContent({
    subchapters: chapter.subchapters.map((section) => ({ ...section, id: `manual-${section.number}`, title: `Owner title ${section.number}` })),
    cardOverrides: { [`${chapter.id}:card:0`]: { chapterId: "manual-1", subchapterId: "manual-1", term: "Owner term", exampleMyanmar: "Owner translation", layout: "wide" } },
    exerciseOverrides: { [`${chapter.id}:exercise:0`]: { subchapterId: "manual-1", questionMyanmar: "Owner question", answerMyanmar: "Owner answer" } },
  });
  const sections = resolveVocabularySubchapters(chapters, content);
  assert.equal(sections.length, 58);
  assert.deepEqual(sections.slice(0, 2).map((section) => section.id), ["manual-1", "manual-2"]);
  const cards = resolveVocabularyCards(chapters, content);
  assert.equal(cards[0].term, "Owner term");
  assert.equal(cards[0].layout, "wide");
  assert.equal(cards[0].exampleMyanmar, "Owner translation");
  assert.equal(cards.filter((card) => card.chapterId.startsWith("manual-")).length, chapter.cards.length);
  const exercises = resolveExercises(baseExercises, content, sections);
  assert.equal(exercises[0].questionMyanmar, "Owner question");
  assert.equal(exercises[0].answerMyanmar, "Owner answer");
  assert(exercisesForView(exercises, "Vocab", chapter.id).every((item) => item.subchapterId.startsWith("manual-")));
  // Once edited, a section's source link survives changes to its displayed number.
  content.subchapters[0] = { ...content.subchapters[0], sourceId: chapter.subchapters[0].id, number: "changed" };
  assert.equal(resolveVocabularySubchapters(chapters, content).length, 58);
});

test("explicit card moves and exercise unassignment override book defaults", () => {
  const chapter = chapters[1];
  const content = normalizeContent({
    cardOverrides: { [`${chapter.id}:card:0`]: { chapterId: chapter.id, subchapterId: "", parentChapterId: chapter.id } },
    exerciseOverrides: { [`${chapter.id}:exercise:0`]: { subchapterId: "" } },
  });
  const sections = resolveVocabularySubchapters(chapters, content);
  assert.equal(resolveVocabularyCards(chapters, content).find((card) => card._id === `${chapter.id}:card:0`).chapterId, chapter.id);
  const exercises = resolveExercises(baseExercises, content, sections);
  assert.equal(exercises.find((item) => item._id === `${chapter.id}:exercise:0`).subchapterId, "");
  assert.equal(exercisesForView(exercises, "Vocab", chapter.id).length, exercisesByChapter[chapter.id].length);
});

test("book section edits and deletion persist without losing its main-list exercises", () => {
  const chapter = chapters[1];
  const section = chapter.subchapters[0];
  const content = normalizeContent({ chapterOverrides: { [section.id]: { title: "Edited heading", number: "3" } } });
  let sections = resolveVocabularySubchapters(chapters, content);
  assert.equal(sections.find((item) => item.id === section.id).title, "Edited heading");
  const exercises = resolveExercises(baseExercises, content, sections);
  Object.assign(content, unassignExercises(content, section.id, exercises));
  content.deletedCards = resolveVocabularyCards(chapters, content).filter((card) => card.chapterId === section.id).map((card) => card._id);
  content.deletedSubchapters.push(section.id);
  const restored = normalizeContent(JSON.parse(JSON.stringify(content)));
  sections = resolveVocabularySubchapters(chapters, restored);
  assert(!sections.some((item) => item.id === section.id));
  assert(!resolveVocabularyCards(chapters, restored).some((card) => card.sourceSubchapterId === section.id));
  const remaining = resolveExercises(baseExercises, restored, sections);
  assert.equal(exercisesForView(remaining, "Vocab", chapter.id).length, exercisesByChapter[chapter.id].length);
  assert(remaining.filter((item) => item.chapterId === chapter.id && item.section.startsWith("1-")).every((item) => item.subchapterId === ""));
});

test("the alternate extracted heading restores the transitive verbs after the original cards", () => {
  const chapter = chapters.find((item) => item.sourceNumber === "2.1");
  assert.equal(chapter.cards.length, 82);
  assert.equal(chapter.cards.filter((card) => card.sourceSubchapterId === chapter.subchapters[0].id).length, 36);
  assert.equal(chapter.cards.filter((card) => card.sourceSubchapterId === chapter.subchapters[1].id).length, 46);
});
