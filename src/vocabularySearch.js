export const vocabularySearchPlaceholder = "例：冷蔵庫、れいぞうこ、冷蔵庫の説明";

const normalize = (value) => String(value ?? "")
  .normalize("NFKC")
  .replace(/[\u30a1-\u30f6]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0x60))
  .replace(/\s+/g, "")
  .toLowerCase();

export function matchesVocabulary(card, query) {
  const term = normalize(card.term);
  const forms = [
    term,
    term.replace(/\([^)]*\)/g, ""),
    term.replace(/[\p{Script=Han}々]+\(([^)]+)\)/gu, "$1").replace(/[()]/g, ""),
    normalize(card.meaning),
  ];
  const search = normalize(query);
  return forms.some((value) => value.includes(search));
}
