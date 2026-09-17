import assert from "node:assert/strict";
import test from "node:test";
import {
  emptyContent,
  createCloudUpdate,
  decodeSnapshot,
} from "../src/cloudContent.js";
import {
  vocabularyExercises,
  kanjiExercises,
  resolveExercises,
  exercisesForView,
  saveExercise,
  unassignExercises,
} from "../src/exerciseContent.js";

const base = vocabularyExercises({
  main: [
    { section: "1", question: "Original", answer: "Answer" },
    { section: "1", question: "Unassigned", answer: "Other answer" },
  ],
});
const sections = [
  { id: "sub", parentChapterId: "main", studyTab: "Vocab" },
  { id: "sub2", parentChapterId: "main", studyTab: "Vocab" },
];
const resolve = (content) => resolveExercises(base, content, sections);
const draft = {
  id: "main:exercise:0",
  mode: "edit",
  chapterId: "main",
  subchapterId: "sub",
  studyTab: "Vocab",
  section: "1",
  question: "Updated",
  answer: "New answer",
  questionMyanmar: "မေးခွန်း",
  answerMyanmar: "အဖြေ",
};

test("assigning a built-in sentence links the same record in main and subchapter", () => {
  const content = saveExercise(structuredClone(emptyContent), draft);
  const all = resolve(content);
  const main = exercisesForView(all, "Vocab", "main");
  const sub = exercisesForView(all, "Vocab", "main", "sub");
  assert.equal(main.length, 2);
  assert.equal(sub.length, 1);
  assert.equal(main[0], sub[0]);
  assert.equal(sub[0]._id, "main:exercise:0");
  assert.equal(content.exercises.length, 0);
  assert.equal(sub[0].questionMyanmar, draft.questionMyanmar);
  assert.equal(sub[0].answerMyanmar, draft.answerMyanmar);
});

test("editing from a subchapter, reassignment, and unassignment preserve identity", () => {
  let content = saveExercise(structuredClone(emptyContent), draft);
  content = saveExercise(content, {
    ...draft,
    question: "Edited from subchapter",
    subchapterId: "sub2",
  });
  let all = resolve(content);
  assert.equal(exercisesForView(all, "Vocab", "main", "sub").length, 0);
  assert.equal(
    exercisesForView(all, "Vocab", "main", "sub2")[0].question,
    "Edited from subchapter",
  );
  assert.equal(exercisesForView(all, "Vocab", "main").length, 2);
  content = saveExercise(content, { ...draft, subchapterId: "" });
  all = resolve(content);
  assert.equal(exercisesForView(all, "Vocab", "main", "sub").length, 0);
  assert.equal(exercisesForView(all, "Vocab", "main").length, 2);
});

test("added exercises are not duplicated; legacy assignments and cloud reloads work", () => {
  const content = structuredClone(emptyContent);
  content.exercises.push({
    _id: "custom",
    chapterId: "sub",
    parentChapterId: "main",
    studyTab: "Vocab",
    section: "1",
    question: "Legacy",
    answer: "Answer",
  });
  content.exerciseOverrides["main:exercise:0"] = {
    chapterId: "sub",
    parentChapterId: "main",
  };
  const restored = decodeSnapshot(
    createCloudUpdate(null, 0, content, "owner", 1),
  ).content;
  const all = resolve(restored);
  assert.equal(exercisesForView(all, "Vocab", "main").length, 3);
  assert.equal(exercisesForView(all, "Vocab", "main", "sub").length, 2);
});

test("deleting a subchapter unassigns its exercises; deleting an exercise hides it everywhere", () => {
  let content = saveExercise(structuredClone(emptyContent), draft);
  content = unassignExercises(content, "sub", resolve(content));
  assert.equal(
    exercisesForView(resolve(content), "Vocab", "main", "sub").length,
    0,
  );
  assert.equal(exercisesForView(resolve(content), "Vocab", "main").length, 2);
  content = saveExercise(content, draft);
  content.deletedExercises.push(draft.id);
  assert.equal(
    exercisesForView(resolve(content), "Vocab", "main", "sub").length,
    0,
  );
  assert.equal(exercisesForView(resolve(content), "Vocab", "main").length, 1);
});

test("Kanji reading and writing rows have stable IDs and preserve underlines", () => {
  const base = kanjiExercises([
    {
      id: "kanji-1",
      title: "Lesson",
      reading: [["Before", "target", "After", "answer"]],
      writing: [["", "write", "", "answer"]],
    },
  ]);
  assert.equal(base.length, 2);
  assert.notEqual(base[0]._id, base[1]._id);
  assert.equal(base[0].questionParts.join(""), base[0].question);
  const content = saveExercise(structuredClone(emptyContent), {
    ...draft,
    id: base[0]._id,
    studyTab: "Kanji",
    chapterId: "kanji-1",
    subchapterId: "kanji-sub",
  });
  const all = resolveExercises(base, content, [
    { id: "kanji-sub", parentChapterId: "kanji-1" },
  ]);
  assert.equal(exercisesForView(all, "Kanji", "kanji-1").length, 2);
  assert.equal(
    exercisesForView(all, "Kanji", "kanji-1", "kanji-sub").length,
    1,
  );
  assert.equal(exercisesForView(all, "Vocab", "kanji-1").length, 0);
  assert.deepEqual(kanjiExercises([{ id: "new", title: "Empty" }]), []);
});

test("moving to another main chapter applies overrides before filtering", () => {
  const content = saveExercise(structuredClone(emptyContent), {
    ...draft,
    chapterId: "other",
    subchapterId: "",
  });
  assert.equal(exercisesForView(resolve(content), "Vocab", "main").length, 1);
  assert.equal(exercisesForView(resolve(content), "Vocab", "other").length, 1);
});
