import test from "node:test";
import assert from "node:assert/strict";
import { kanjiCardReadings } from "../src/kanjiContent.js";
import catalog from "../migrations/n3-catalog.json" with { type: "json" };

test("起 has the requested on and all four kun readings", () => {
  for (const card of [{ kanji: "起" }, { kanji: "起", readings: [{ kanji: "起", on: "キ", kun: "おきる・おこる・おこす" }] }]) {
    assert.deepEqual(kanjiCardReadings(card), [{ kanji: "起", on: "き", kun: "おこす・おこる・たつ・おきる" }]);
  }
});

test("all bundled kanji cards recover readings when saved fields are missing", () => {
  for (const chapter of catalog.baselineKanjiChapters) {
    for (const card of chapter.cards) {
      const recovered = kanjiCardReadings({ kanji: card.kanji });
      assert.ok(recovered.length, card.kanji);
      assert.ok(recovered.every(entry => entry.on || entry.kun), card.kanji);
    }
  }
});

test("partial readings fill blanks while preserving authored values", () => {
  const readings = kanjiCardReadings({ kanji: "押", readings: [{ kanji: "押", on: "custom", kun: "—" }] });
  assert.equal(readings[0].on, "custom");
  assert.ok(readings[0].kun.includes("おす"));
});
