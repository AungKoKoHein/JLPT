import { annotateKanjiFurigana } from "./kanjiFurigana.js";

// @ts-check
/** @typedef {{ japanese: string, myanmar: string }} KanjiExample */

const toHiragana = (value = "") => String(value).replace(/[ァ-ヶ]/g, (character) =>
  String.fromCharCode(character.charCodeAt(0) - 0x60),
);
const firstReading = (value = "") =>
  toHiragana(String(value).split(/[・、,／\/]/)[0].trim());

/**
 * Add a card's reading to its target word in an example when furigana is not
 * already present. The existing reading toggle can then show or hide it.
 */
export function kanjiExampleText(card, example) {
  let text = String(example?.japanese ?? "");
  const candidates = [];
  const addCandidate = (term, reading) => {
    term = String(term ?? "").trim();
    reading = firstReading(reading);
    if (term && reading && !candidates.some((item) => item.term === term)) {
      candidates.push({ term, reading });
    }
  };

  addCandidate(example?.term, example?.reading ?? example?.furigana);
  for (const word of card.words ?? []) {
    addCandidate(word.term ?? word.word, word.reading ?? word.furigana ?? word.kana);
  }

  const primaryTerm = card.kanji ?? "";
  const matchingReading = (card.readings ?? []).find(
    (reading) => !reading.kanji || reading.kanji === primaryTerm,
  ) ?? card.readings?.[0];
  const primaryReading =
    matchingReading?.kun || matchingReading?.on || card.kun || card.on || "";
  addCandidate(primaryTerm, primaryReading);

  for (const { term, reading } of candidates) {
    let cursor = 0;
    let result = "";
    while (cursor < text.length) {
      const index = text.indexOf(term, cursor);
      if (index < 0) break;

      result += text.slice(cursor, index);
      const after = text.slice(index + term.length);
      if (/^[（(][ぁ-ゖァ-ヶー]+[）)]/.test(after) || /^[ぁ-ゖ]+[（(][ぁ-ゖァ-ヶー]+[）)]/.test(after)) {
        result += term;
        cursor = index + term.length;
        continue;
      }

      let inlineReading = reading;
      let okurigana = "";
      if (/^\p{Script=Han}$/u.test(term)) {
        const kanaRun = after.match(/^[\p{Script=Hiragana}]+/u)?.[0] ?? "";
        for (let length = kanaRun.length; length > 0; length -= 1) {
          const suffix = kanaRun.slice(0, length);
          if (reading.endsWith(suffix) && reading.length > suffix.length) {
            inlineReading = reading.slice(0, -suffix.length);
            okurigana = suffix;
            break;
          }
        }
      }
      result += `${term}（${inlineReading}）${okurigana}`;
      cursor = index + term.length + okurigana.length;
    }
    text = result + text.slice(cursor);
  }
  return annotateKanjiFurigana(text);
}

/**
 * Normalize saved examples and the original sentence/words format without
 * dropping any examples when an existing card is opened in the editor.
 * @param {{ examples?: (KanjiExample | string[])[] | boolean, sentence?: string, exampleMyanmar?: string, words?: { sentence?: string, term?: string, explanation?: string, reading?: string, furigana?: string, kana?: string }[] }} card
 * @returns {KanjiExample[]}
 */
export function kanjiExamples(card) {
  if (Array.isArray(card.examples) && card.examples.length) {
    return card.examples.map((example) => {
      if (Array.isArray(example)) {
        const [sentence = "", reading = "", myanmar = ""] = example;
        return {
          japanese: sentence.replace(
            /\|([^|]+)\|/g,
            (_, term) => `${term}${reading ? `（${reading}）` : ""}`,
          ),
          myanmar,
        };
      }
      return {
        ...example,
        japanese: example.japanese || "",
        myanmar: example.myanmar || "",
      };
    });
  }
  const sentences = (card.words || []).filter((word) => word.sentence);
  if (sentences.length)
    return sentences.map((word) => ({
      japanese: word.sentence || "",
      myanmar: word.explanation || "",
      term: word.term || word.word || "",
      reading: word.reading || word.furigana || word.kana || "",
    }));
  if (card.sentence)
    return [
      {
        japanese: card.sentence,
        myanmar: card.exampleMyanmar || card.words?.[0]?.explanation || "",
      },
    ];
  return [{ japanese: "", myanmar: card.exampleMyanmar || "" }];
}
