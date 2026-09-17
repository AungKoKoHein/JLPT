import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import kuromoji from "kuromoji";

const dataPath = resolve("src/data/n3Vocabulary.js");
const tokenizer = await new Promise((resolveTokenizer, reject) => {
  kuromoji
    .builder({ dicPath: resolve("node_modules/kuromoji/dict") })
    .build((error, built) => (error ? reject(error) : resolveTokenizer(built)));
});
const hira = (reading) =>
  reading.replace(/[ァ-ヶ]/g, (char) =>
    String.fromCharCode(char.charCodeAt(0) - 0x60),
  );
const hasKanji = (text) => /[々〆〤一-龯]/.test(text);
function addReadings(text) {
  // Existing Word furigana pairs stay untouched. Only plain kanji gains reading.
  const protectedPairs = [];
  const unannotated = text.replace(/[々〆〤一-龯]+（[^）]*）/g, (pair) => {
    const marker = `§FURIGANA${protectedPairs.length}§`;
    protectedPairs.push(pair);
    return marker;
  });
  const annotated = hasKanji(unannotated)
    ? tokenizer
        .tokenize(unannotated)
        .map((token) => {
          const surface = token.surface_form;
          return hasKanji(surface) && token.reading && token.reading !== "*"
            ? `${surface}（${hira(token.reading)}）`
            : surface;
        })
        .join("")
    : unannotated;
  return annotated.replace(
    /§FURIGANA(\d+)§/g,
    (_, index) => protectedPairs[Number(index)],
  );
}
const moduleText = await readFile(dataPath, "utf8");
const marker = "export const chapters = ";
const source = JSON.parse(
  moduleText
    .slice(moduleText.indexOf(marker) + marker.length)
    .replace(/;\s*$/, ""),
);
for (const chapter of source) {
  chapter.title = addReadings(chapter.title);
  for (const section of chapter.subchapters ?? []) {
    section.title = addReadings(section.title);
  }
  for (const card of chapter.cards) {
    card.term = addReadings(card.term);
    card.context = addReadings(card.context);
    card.exampleJapanese = addReadings(card.exampleJapanese);
  }
  for (const exercise of [
    ...chapter.sourceExercises,
    ...chapter.generatedExercises,
  ])
    exercise.question = addReadings(exercise.question);
}
await writeFile(
  dataPath,
  `// Generated from the user-provided Word document and annotated with Kuromoji readings.\nexport const chapters = ${JSON.stringify(source, null, 2)};\n`,
  "utf8",
);
console.log("Added hiragana readings to all Japanese text.");
