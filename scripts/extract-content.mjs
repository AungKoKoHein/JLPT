import { readFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import assert from "node:assert/strict";

const structure = JSON.parse(await readFile("source/vocabulary-structure.json", "utf8"));

const raw = await readFile(
  resolve(process.argv[2] ?? "source/n3-vocab.txt"),
  "utf8",
);
const output = resolve("src/data/n3Vocabulary.js");
const blocks = raw
  .split(/(?=^Chapter\s+[-\d]+)/m)
  .filter((block) => /^Chapter\s+[-\d]+/m.test(block));
const stripReading = (value) =>
  value.replace(/（[^）]*）/g, "").replace(/[()（）\s]/g, "");
const splitPractice = (value) => {
  const afterGloss = value.replace(/^[^(]*\([^)]*\)\s*/, "");
  const mmStart = afterGloss.search(/[\u1000-\u109f]/);
  return {
    question: (mmStart >= 0 ? afterGloss.slice(0, mmStart) : afterGloss).trim(),
    answer: (mmStart >= 0 ? afterGloss.slice(mmStart) : "").trim(),
  };
};
const isContext = (line) => /^[①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳]/.test(line);
// Some extracted headings say 言語, and Chapter 13 repeats 1-2 on page two.
// Use heading order for section numbers, verified against the scanned book.
const isHeading = (line) => /^\d+[-－]\d+\s*言[葉語]/.test(line);
const isPracticeHeading = (line) => /やっ.*みよう/.test(line);

function parseChapter(block, index, part, number) {
  const lines = block
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const id = `part-${part}-chapter-${index + 1}`;
  const sourceNumber = `${part}.${number}`;
  const documentChapter = structure.chapters.find((chapter) => chapter.key === sourceNumber);
  assert(documentChapter, `Missing book structure for ${sourceNumber}`);
  const subchapters = documentChapter.sections.map((title, sectionIndex) => ({
    id: `${id}-subchapter-${sectionIndex + 1}`,
    number: String(sectionIndex + 1),
    title,
    titleMyanmar: documentChapter.sectionTranslations?.[sectionIndex] ?? "",
    parentChapterId: id,
    studyTab: "Vocab",
    sourcePage: documentChapter.page + sectionIndex,
  }));
  const cards = [],
    practiceLines = [];
  let context = "",
    practiceMode = false,
    sectionIndex = -1;
  for (const line of lines.slice(1)) {
    if (isHeading(line)) {
      sectionIndex += 1;
      assert(subchapters[sectionIndex], `Unexpected vocabulary heading: ${sourceNumber}: ${line}`);
      practiceMode = false;
      context = "";
      continue;
    }
    if (isPracticeHeading(line)) {
      practiceMode = true;
      continue;
    }
    if (practiceMode) {
      practiceLines.push(line);
      continue;
    }
    if (isContext(line)) {
      context = line;
      continue;
    }
    const split = line.split(/\s+[–-]\s+/);
    if (split.length < 2) continue;
    const term = split.shift().trim(),
      meaning = split.join(" – ").trim();
    if (term && meaning)
      cards.push({
        sourceSubchapterId: subchapters[sectionIndex].id,
        term,
        meaning,
        context,
        exampleJapanese: "",
        exampleMyanmar: "",
        generated: false,
      });
  }
  assert.equal(sectionIndex + 1, subchapters.length, `Missing vocabulary section in ${sourceNumber}`);
  for (const section of subchapters) {
    assert(cards.some((card) => card.sourceSubchapterId === section.id), `Empty vocabulary section: ${section.id}`);
  }
  const sourceExercises = practiceLines
    .map(splitPractice)
    .filter((item) => item.question);
  for (const card of cards) {
    const bare = stripReading(card.term);
    const practice = practiceLines.find(
      (line) =>
        line.includes(card.term) || (bare.length >= 2 && line.includes(bare)),
    );
    if (practice) {
      const example = splitPractice(practice);
      card.exampleJapanese = example.question;
      card.exampleMyanmar = example.answer;
    } else {
      card.exampleJapanese = card.context.includes("____")
        ? card.context.replace(/_+/g, card.term)
        : card.context || `${card.term} を使う表現です。`;
      card.exampleMyanmar = `「${card.term}」 သည် “${card.meaning}” ဟု အဓိပ္ပာယ်ရသည်။`;
      card.generated = true;
    }
  }
  const generatedExercises =
    sourceExercises.length || !cards.length
      ? []
      : [
          {
            question: `${cards[0].term} の意味は何ですか。`,
            answer: `${cards[0].meaning} (added)`,
            added: true,
          },
        ];
  return {
    id,
    number: part === 1 ? String(number) : sourceNumber,
    sourceNumber,
    title: `${number}課：${documentChapter.title}`,
    subchapters,
    cards,
    sourceExercises,
    generatedExercises,
  };
}

let part = 1,
  previous = 0;
const chapters = blocks.map((block, index) => {
  const number = Math.abs(
    Number(block.match(/^Chapter\s+(-?\d+)/m)?.[1] ?? index + 1),
  );
  if (number <= previous) part += 1;
  previous = number;
  return parseChapter(block, index, part, number || index + 1);
});
await mkdir(dirname(output), { recursive: true });
await writeFile(
  output,
  `// Generated from the user-provided Word document.\nexport const chapters = ${JSON.stringify(chapters, null, 2)};\n`,
  "utf8",
);
console.log(
  `Generated ${chapters.length} chapters and ${chapters.reduce((n, c) => n + c.cards.length, 0)} cards.`,
);
