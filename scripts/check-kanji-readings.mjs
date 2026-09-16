import assert from "node:assert/strict";
import { getKanjiReadings } from "../src/data/kanjiReadings.js";

let count = 0;
const characters = new Set();
for (let number = 1; number <= 7; number++) {
  const module = await import(`../src/data/kanjiChapter${number}.js`);
  const chapter = module[`kanjiChapter${number}`];
  for (const card of chapter.cards) {
    const expected = [...new Set(card.kanji.match(/\p{Script=Han}/gu) ?? [])];
    assert.ok(expected.length, `No kanji in ${card.id}`);
    assert.deepEqual(
      card.readings.map((entry) => entry.kanji),
      expected,
      card.id,
    );
    for (const entry of card.readings) {
      assert.ok(entry.on || entry.kun, `No readings for ${entry.kanji}`);
      assert.match(entry.on, /^[ァ-ヺー・-]*$/u);
      // KANJIDIC also lists katakana loanword readings for some characters.
      assert.match(entry.kun, /^[ぁ-ゖァ-ヺー・-]*$/u);
      characters.add(entry.kanji);
    }
    count++;
  }
}
assert.deepEqual(getKanjiReadings("起きる"), [
  { kanji: "起", on: "キ", kun: "おきる・おこる・おこす" },
]);
assert.equal(getKanjiReadings("曜日")[0].kun, "");
assert.equal(getKanjiReadings("日日").length, 1);
assert.deepEqual(getKanjiReadings("かな"), []);
assert.throws(() => getKanjiReadings("鬱"), /Missing kanji readings/);
console.log(
  `Validated ${count} flashcards and ${characters.size} distinct kanji across Chapters 1–7.`,
);
