import readings from "./practiceFurigana.json" with { type: "json" };
import { annotateKanjiFurigana } from "./kanjiFurigana.js";
import { displayKanji, hideReadings } from "./studyText.js";

// Exact sentence entries preserve the tokenizer's contextual word readings.
// Existing explicit readings take priority; the shared dictionary supports
// additional cloud-imported questions without changing the saved question bank.
export function practiceText(text = "", showReadings = false, showKanji = true) {
  let annotated = readings[text] ?? annotateKanjiFurigana(text);
  if (!showKanji) {
    // Special calendar readings cover the numeral too: 3日（みっか）→みっか.
    annotated = annotated.replace(/[0-9０-９]+\s*日（([^（）]+)）/gu, (value, reading) =>
      reading !== "にち" && /(?:か|にち)$/.test(reading) ? reading : value);
  }
  return displayKanji(showReadings ? annotated : hideReadings(annotated), showKanji);
}
