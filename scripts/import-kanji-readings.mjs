import { readFile, writeFile } from "node:fs/promises";

// Supply a local kanji-data JSON file, or download the current upstream copy.
const source =
  "https://raw.githubusercontent.com/davidluzgouveia/kanji-data/master/kanji.json";
const input = process.argv[2];
let dictionary;
if (input) {
  dictionary = JSON.parse(await readFile(input, "utf8"));
} else {
  const response = await fetch(source);
  if (!response.ok)
    throw new Error(`Dictionary download failed: ${response.status}`);
  dictionary = await response.json();
}

const characters = new Set();
for (let number = 1; number <= 7; number++) {
  const module = await import(`../src/data/kanjiChapter${number}.js`);
  for (const card of module[`kanjiChapter${number}`].cards) {
    for (const kanji of card.kanji.match(/\p{Script=Han}/gu) ?? []) {
      characters.add(kanji);
    }
  }
}

const katakana = (text) =>
  text.replace(/[ぁ-ゖ]/g, (char) =>
    String.fromCharCode(char.charCodeAt(0) + 0x60),
  );
const normalize = (readings, convert = (text) => text) => [
  ...new Set(readings.map((reading) => convert(reading.replaceAll(".", "")))),
];
const data = {};
for (const kanji of characters) {
  const entry = dictionary[kanji];
  if (!entry) throw new Error(`Missing dictionary entry: ${kanji}`);
  data[kanji] = {
    on: normalize(entry.readings_on, katakana),
    kun: normalize(entry.readings_kun),
  };
}
// Keep the approved textbook sample's three kun readings for 起.
data["起"].kun = ["おきる", "おこる", "おこす"];
await writeFile(
  new URL("../src/data/kanjiReadings.json", import.meta.url),
  `${JSON.stringify(data, null, 2)}\n`,
);
console.log(`Imported readings for ${characters.size} kanji.`);
