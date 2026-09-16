import readings from "./kanjiReadings.json" with { type: "json" };

// Character readings, not compound pronunciations. See source/kanji-readings-LICENSE.md.
export const getKanjiReadings = (term) =>
  [...new Set(term.match(/\p{Script=Han}/gu) ?? [])].map((kanji) => {
    const entry = readings[kanji];
    if (!entry) throw new Error(`Missing kanji readings: ${kanji}`);
    return { kanji, on: entry.on.join("・"), kun: entry.kun.join("・") };
  });
