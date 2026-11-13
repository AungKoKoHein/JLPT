// With kanji hidden, show kana readings without their surrounding parentheses.
export const displayKanji = (text = "", showKanji = true) =>
  showKanji
    ? text
    : text
        .replace(/[\p{Script=Han}\u3005\u3006]/gu, "")
        .replace(/\uff08([\p{Script=Hiragana}\p{Script=Katakana}\u30fc\s]+)\uff09/gu, "$1")
        .replace(/\(([\p{Script=Hiragana}\p{Script=Katakana}\u30fc\s]+)\)/gu, "$1");
// Only kana annotations attached to a Japanese word are readings. Parenthesized
// translations, grammar notes, and numbering must remain visible.
export const hideReadings = (text = "") =>
  text.replace(
    /([\p{Script=Han}々〆\p{Script=Hiragana}\p{Script=Katakana}])[（(][\p{Script=Hiragana}\p{Script=Katakana}ー][\p{Script=Hiragana}\p{Script=Katakana}ー\s]*[）)]/gu,
    "$1",
  );

