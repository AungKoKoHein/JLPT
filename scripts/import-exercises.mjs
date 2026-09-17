import { readFile, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { chapters } from "../src/data/n3Vocabulary.js";

// Extracted Word paragraphs are kept in source/ so builds need no original DOCX files.
function parse(text, answers = false) {
  const groups = new Map();
  let part = 1,
    chapter,
    section;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("Main Chapter 2")) part = 2;
    const heading = line.match(/(?:^Chapter| - Chapter) (\d+)/);
    if (heading) {
      chapter = `${part}.${Number(heading[1])}`;
      section = undefined;
    }
    const subsection = line.match(/\b([12]-[23])\b/);
    if (subsection) {
      section = subsection[1];
      const key = `${chapter}/${section}`;
      assert(!groups.has(key), `Duplicate section ${key}`);
      groups.set(key, []);
      continue;
    }
    if (heading || line.startsWith("Main Chapter")) continue;
    if (
      answers ||
      line.startsWith("Sentence:") ||
      (part === 1 &&
        Number(chapter.split(".")[1]) <= 7 &&
        /_{3,}|（）/.test(line))
    ) {
      assert(chapter && section, `Missing heading for ${line}`);
      groups
        .get(`${chapter}/${section}`)
        .push(line.replace(/^Sentence:\s*/, ""));
    }
  }
  return groups;
}

const questions = parse(
  await readFile("source/exercise-sentences.txt", "utf8"),
);
const answers = parse(
  await readFile("source/exercise-answers.txt", "utf8"),
  true,
);
assert.deepEqual(
  [...questions.keys()],
  [...answers.keys()],
  "Document sections must match",
);
const data = Object.fromEntries(chapters.map((chapter) => [chapter.id, []]));
for (const [key, sentences] of questions) {
  const [number, section] = key.split("/");
  const chapter = chapters.find((item) => (item.sourceNumber ?? item.number) === number);
  assert(chapter, `Unknown chapter ${number}`);
  const keys = answers.get(key);
  const subchapter = chapter.subchapters.find((item) => item.number === section.split("-")[0]);
  assert(subchapter, `Missing vocabulary subchapter for exercise section ${key}`);
  assert.equal(
    sentences.length,
    keys.length,
    `Answer count mismatch in ${key}`,
  );
  sentences.forEach((question, index) =>
    data[chapter.id].push({ section, subchapterId: subchapter.id, question, answer: keys[index] }),
  );
}
assert(
  Object.values(data).every((items) => items.length),
  "Every chapter must have exercises",
);
const pictureExercises = JSON.parse(await readFile("source/vocabulary-picture-exercises.json", "utf8"));
for (const [number, items] of Object.entries(pictureExercises.chapters)) {
  const chapter = chapters.find((item) => item.sourceNumber === number);
  assert(chapter, `Unknown picture-exercise chapter ${number}`);
  for (const item of items) {
    const section = chapter.subchapters.find((section) => section.number === item.section.split("-")[0]);
    assert(section, `Unknown picture-exercise section ${number}/${item.section}`);
    // Append to preserve all existing exercise IDs and owner edits.
    data[chapter.id].push({ ...item, subchapterId: section.id });
  }
}
await writeFile(
  "src/data/exercises.js",
  `// Imported from the exercise sentences and answer key Word documents.\nexport const exercisesByChapter = ${JSON.stringify(data, null, 2)};\n`,
);
console.log(
  `Imported ${Object.values(data).flat().length} exercises across ${chapters.length} chapters; all section answer counts match.`,
);
