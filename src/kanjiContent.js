// @ts-check
/** @typedef {{ japanese: string, myanmar: string }} KanjiExample */
const toHiragana = (value = "") => String(value).replace(/[ァ-ヶ]/g, (character) =>
  String.fromCharCode(character.charCodeAt(0) - 0x60),
);
const firstReading = (value = "") => toHiragana(String(value).split(/[・、,／/]/)[0].trim());
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\
/**
 * Normalize saved examples and the original sentence/words format");

/**
 * Add the active card's reading to its word in an example when the source
 * sentence does not already include furigana. The UI can then show or hide
 * the parenthesized reading with the existing reading toggle.
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
  const primaryReading = String(
    matchingReading?.kun || matchingReading?.on || card.kun || card.on || "",
  ).split(/[・、,／/]/)[0].trim();
  addCandidate(primaryTerm, primaryReading);

  for (const { term, reading } of candidates) {
    const matcher = new RegExp(escapeRegExp(term), "gu");
    text = text.replace(matcher, (match, offset, whole) => {
      const after = whole.slice(offset + match.length);
      if (/^[（(][^）)]*[）)]/.test(after)) return match;

      let inlineReading = reading;
      let okurigana = "";
      if (/^\p{Script=Han}$/u.test(term)) {
        okurigana = after.match(/^[\p{Script=Hiragana}]+/u)?.[0] ?? "";
        if (okurigana && reading.endsWith(okurigana) && reading.length > okurigana.length) {
          inlineReading = reading.slice(0, -okurigana.length);
        } else {
          okurigana = "";
        }
      }
      return `${match}（${inlineReading}）${okurigana}`;
    });
  }
  return text;
}

/**
 * Normalize saved examples and the original sentence/words format without
 * dropping any examples when an existing card is opened in the editor.
 * @param {{ examples?: (KanjiExample | string[])[] | boolean, sentence?: string, exampleMyanmar?: string, words?: { sentence?: string, term?: string, explanation?: string }[] }} card
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
