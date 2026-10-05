import { normalizeContent } from "../src/cloudContent.js";

export const grammarTopics = [
  ["time", "時間(じかん)と順序(じゅんじょ)", "အချိန်နှင့် အစီအစဉ်"],
  ["relation", "関連(かんれん)と変化(へんか)", "ဆက်နွယ်မှုနှင့် ပြောင်းလဲမှု"],
  [
    "comparison",
    "比較(ひかく)と程度(ていど)",
    "နှိုင်းယှဉ်မှုနှင့် အတိုင်းအတာ",
  ],
  [
    "contrast",
    "対比(たいひ)と置(お)き換(か)え",
    "ဆန့်ကျင်မှုနှင့် အစားထိုးခြင်း",
  ],
  ["reason", "原因(げんいん)と理由(りゆう)", "အကြောင်းရင်း"],
  ["condition", "条件(じょうけん)と仮定(かてい)", "အခြေအနေနှင့် ယူဆချက်"],
  ["report", "伝聞(でんぶん)と引用(いんよう)", "ကြားသိသတင်းနှင့် ကိုးကားမှု"],
  [
    "certainty",
    "判断(はんだん)と確信(かくしん)",
    "ဆုံးဖြတ်ချက်နှင့် ယုံကြည်မှု",
  ],
  ["request", "願望(がんぼう)と依頼(いらい)", "ဆန္ဒနှင့် တောင်းဆိုမှု"],
  ["advice", "助言(じょげん)と義務(ぎむ)", "အကြံပေးချက်နှင့် တာဝန်"],
  ["intention", "意志(いし)と決定(けってい)", "ရည်ရွယ်ချက်နှင့် ဆုံးဖြတ်ခြင်း"],
  ["purpose", "目的(もくてき)と行動(こうどう)", "ရည်ရွယ်ချက်နှင့် အပြုအမူ"],
  [
    "appearance",
    "推量(すいりょう)と様子(ようす)",
    "ခန့်မှန်းချက်နှင့် ပုံသဏ္ဌာန်",
  ],
  ["limit", "限定(げんてい)と強調(きょうちょう)", "ကန့်သတ်မှုနှင့် အလေးပေးမှု"],
  ["relations", "対象(たいしょう)と立場(たちば)", "ဦးတည်ရာနှင့် အနေအထား"],
  [
    "voice",
    "受身(うけみ)・使役(しえき)と視点(してん)",
    "ခံရပုံ၊ ခိုင်းစေပုံနှင့် ရှုထောင့်",
  ],
  ["polite", "敬語(けいご)と文体(ぶんたい)", "လေးစားသည့်အသုံးနှင့် စာရေးဟန်"],
  [
    "compound",
    "複合表現(ふくごうひょうげん)と状態(じょうたい)",
    "ပေါင်းစပ်ပုံစံနှင့် အခြေအနေ",
  ],
  [
    "phrases",
    "文(ぶん)の組(く)み立(た)てと会話(かいわ)",
    "ဝါကျဖွဲ့စည်းပုံနှင့် စကားပြော",
  ],
];

export function grammarKey(term) {
  return term
    .normalize("NFKC")
    .replace(/[（(][\p{Script=Hiragana}\p{Script=Katakana}ー]+[）)]/gu, "")
    .replace(/[\s～~〜]/g, "");
}

export function buildGrammarCatalog(tsv) {
  const counts = new Map();
  const groupTitle = "N3 文法(ぶんぽう) / N3 သဒ္ဒါ";
  const chapters = grammarTopics.map(([topic, title, titleMyanmar], index) => ({
    id: `n3-grammar-${topic}`,
    number: String(index + 1),
    title,
    titleMyanmar,
    studyTab: "Grammar",
    groupTitle,
    subchapters: [],
  }));
  const chapterIds = new Map(
    grammarTopics.map(([topic], index) => [topic, chapters[index].id]),
  );
  const keys = new Set();
  const cards = tsv
    .split(/\r?\n/)
    .filter((line) => line.trim() && !line.startsWith("#"))
    .map((line, index) => {
      const fields = line.split("|");
      if (fields.length !== 8)
        throw new Error(`Grammar source row ${index + 1}: expected 8 fields.`);
      const [
        topic,
        term,
        meaning,
        grammarExplanation,
        japanese,
        myanmar,
        shinkanzen,
        minna,
      ] = fields;
      if (!chapterIds.has(topic))
        throw new Error(`Unknown grammar topic: ${topic}`);
      if (
        ![term, meaning, grammarExplanation, japanese, myanmar].every((text) =>
          text.trim(),
        )
      ) {
        throw new Error(`Incomplete grammar row: ${term}`);
      }
      if (
        ![meaning, grammarExplanation, myanmar].every((text) =>
          /\p{Script=Myanmar}/u.test(text),
        )
      ) {
        throw new Error(`Missing Myanmar content: ${term}`);
      }
      const sourceReferences = [];
      for (const [book, pages, pageType] of [
        ["N3 Shinkanzen Grammar.pdf", shinkanzen, "printed"],
        ["N3 - Minna no Nihongo (အထူ).pdf", minna, "pdf"],
      ]) {
        if (!pages) continue;
        const numbers = pages.split(",").map(Number);
        if (
          !numbers.every(
            (page) =>
              Number.isInteger(page) &&
              page > 0 &&
              page <= (pageType === "pdf" ? 171 : 159),
          )
        ) {
          throw new Error(`Invalid source pages: ${term}`);
        }
        sourceReferences.push({ book, pageType, pages: numbers });
      }
      if (!sourceReferences.length)
        throw new Error(`Missing source reference: ${term}`);
      const key = grammarKey(term);
      if (keys.has(key)) throw new Error(`Duplicate grammar pattern: ${term}`);
      keys.add(key);
      const number = (counts.get(topic) || 0) + 1;
      counts.set(topic, number);
      const id = `n3-grammar-${topic}-card-${String(number).padStart(2, "0")}`;
      const chapterId = chapterIds.get(topic);
      return {
        id,
        _id: id,
        chapterId,
        parentChapterId: chapterId,
        subchapterId: "",
        studyTab: "Grammar",
        layout: "wide",
        term,
        meaning,
        exampleJapanese: japanese,
        exampleMyanmar: myanmar,
        examples: [{ japanese, myanmar }],
        grammarExplanation,
        sourceReferences,
        generated: true,
      };
    });
  if (
    chapters.some(
      (chapter) => !cards.some((card) => card.chapterId === chapter.id),
    )
  ) {
    throw new Error("Empty grammar topic in catalog.");
  }
  return { chapters, cards };
}

// Add only missing records. Keep all owner edits, deleted records, order and
// unrelated fields intact, including when this utility is run again later.
export function addGrammarCatalog(content, catalog) {
  const next = normalizeContent(structuredClone(content));
  const cardIds = new Set(next.cards.flatMap((card) => [card.id, card._id]));
  const chapterIds = new Set(next.chapters.map((chapter) => chapter.id));
  const deletedCards = new Set(next.deletedCards);
  const deletedChapters = new Set(next.deletedChapters);
  const keys = new Set(
    [
      ...next.cards.map((card) => ({
        ...card,
        ...next.cardOverrides[card._id],
      })),
      ...Object.values(next.cardOverrides),
    ]
      .filter((card) => card.studyTab === "Grammar" && card.term)
      .map((card) => grammarKey(card.term)),
  );
  const additions = catalog.cards.filter((card) => {
    if (
      cardIds.has(card._id) ||
      next.cardOverrides[card._id] ||
      deletedCards.has(card._id) ||
      deletedChapters.has(card.chapterId) ||
      keys.has(grammarKey(card.term))
    )
      return false;
    keys.add(grammarKey(card.term));
    return true;
  });
  for (const chapter of catalog.chapters) {
    if (
      !chapterIds.has(chapter.id) &&
      additions.some((card) => card.chapterId === chapter.id)
    ) {
      next.chapters.push(structuredClone(chapter));
    }
  }
  next.cards.push(...structuredClone(additions));
  return normalizeContent(next);
}
