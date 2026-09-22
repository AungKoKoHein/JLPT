// @ts-check
/** @typedef {{ japanese: string, myanmar: string }} KanjiExample */
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
