// With kanji hidden, show kana readings without their surrounding parentheses.
export const displayKanji = (text = "", showKanji = true) =>
  showKanji
    ? text
    : text
        .replace(/[\p{Script=Han}\u3005\u3006]/gu, "")
        .replace(/\uff08([\p{Script=Hiragana}\p{Script=Katakana}\u30fc\s]+)\uff09/gu, "$1")
        .replace(/\(([\p{Script=Hiragana}\p{Script=Katakana}\u30fc\s]+)\)/gu, "$1");
