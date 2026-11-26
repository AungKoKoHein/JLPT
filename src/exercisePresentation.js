const normalized = value => String(value || '').normalize('NFKC').replace(/\s+/g, ' ').trim();

export function presentExercise(item) {
  let question = item.question || '';
  let japaneseGuide = '';
  const reading = question.match(/^「(.+)」の読み方をひらがなで書いてください[。.]?$/);
  const prefix = question.match(/^(次の漢字の読み方を書いてください|次の読み方を漢字で書いてください)[：:]\s*(.+)$/);
  const grammar = question.match(/^「(.+)」を表す文を、?「(.+)」を使って作ってください[。.]?$/);
  if (reading) {
    question = `|${reading[1]}|`;
    japaneseGuide = '漢字の読み方をひらがなで書いてください。';
  } else if (prefix) {
    question = `|${prefix[2]}|`;
    japaneseGuide = `${prefix[1]}。`;
  } else if (grammar) {
    question = `「${grammar[2]}」 — 「${grammar[1]}」`;
    japaneseGuide = '指定した文法パターンを使って文を作ってください。';
  }
  const myanmar = String(item.questionMyanmar || '').trim();
  // Keep actual sentence translations and question-specific grammar prompts in place.
  const isMyanmarGuide = !/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}「」]/u.test(myanmar)
    && /(?:ရွေး|ရေး|ဖြည့်|ဖတ်|ဖြေဆို|တွဲဖက်).*(?:ပါ[။.]?)$/u.test(myanmar);
  return {
    ...item, question,
    ...(question !== item.question ? { questionParts: undefined } : {}),
    questionMyanmar: isMyanmarGuide || grammar ? '' : myanmar,
    japaneseGuide,
    myanmarGuide: grammar && myanmar ? 'ဖော်ပြထားသော သဒ္ဒါပုံစံကို အသုံးပြုပြီး ဝါကျတစ်ကြောင်း ရေးပါ။' : isMyanmarGuide ? myanmar : '',
  };
}

export function exerciseGuides(items) {
  const seen = new Set();
  return items.flatMap(item => [
    { text: item.japaneseGuide, lang: 'ja' },
    { text: item.myanmarGuide, lang: 'my' },
  ]).filter(guide => {
    const key = `${guide.lang}:${normalized(guide.text)}`;
    if (!guide.text || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const typeTitles = {
  choice: { my: 'ကွင်းထဲမှ မှန်ကန်သော စကားလုံးကို ရွေးပါ။', ja: '正しい言葉を選んでください。' },
  reading: { my: 'မျဉ်းတားထားသော စကားလုံး၏ ဖတ်ပုံကို ဟိရဂနဖြင့် ရေးပါ။', ja: '下線の言葉の読み方をひらがなで書いてください。' },
  writing: { my: 'ဖော်ပြထားသော ဖတ်ပုံကို သင့်တော်သော ကန်ဂျီဖြင့် ရေးပါ။', ja: '次の読み方を漢字で書いてください。' },
  grammar: { my: 'ဖော်ပြထားသော သဒ္ဒါပုံစံကို အသုံးပြုပြီး ဝါကျတစ်ကြောင်း ရေးပါ။', ja: '指定した文法パターンを使って文を作ってください。' },
};

export function groupExercisesByType(exercises, showMyanmar = true) {
  const groups = new Map();
  for (const item of exercises.map(presentExercise)) {
    const guide = `${item.japaneseGuide} ${item.myanmarGuide}`;
    const section = String(item.section || '');
    let type;
    if (/文法|သဒ္ဒါ/u.test(guide)) type = 'grammar';
    else if (/漢字で書|ကန်ဂျီဖြင့်|ကန်းဂျီးဖြင့်/u.test(guide) || /write the kanji|writing|漢字を書く/i.test(section)) type = 'writing';
    else if (/読み方|ဖတ်ပုံ/u.test(guide) || /read the kanji|reading|漢字の読み/i.test(section)) type = 'reading';
    else if (/ရွေး|選/u.test(guide) || /[aａ][.．].+[bｂ][.．]/u.test(item.question)) type = 'choice';
    const key = type || `section:${normalized(section)}:${normalized(guide)}`;
    if (!groups.has(key)) {
      const lang = showMyanmar && (type || item.myanmarGuide) ? 'my' : 'ja';
      const title = type ? typeTitles[type][lang] : (showMyanmar && item.myanmarGuide) || item.japaneseGuide || section || (showMyanmar ? 'လေ့ကျင့်ခန်းများ' : '練習');
      groups.set(key, { key, title, lang, items: [] });
    }
    groups.get(key).items.push(item);
  }
  return [...groups.values()].map(group => ({ ...group, sectionCount: new Set(group.items.map(item => item.section)).size }));
}
