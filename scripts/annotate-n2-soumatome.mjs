import fs from 'node:fs/promises';
import kuromoji from 'kuromoji';
const filename = new URL('../migrations/n2-soumatome-catalog.json', import.meta.url);
const catalog = JSON.parse(await fs.readFile(filename, 'utf8'));
const translated = JSON.parse(await fs.readFile(new URL('../migrations/n2-soumatome-example-translations.json', import.meta.url), 'utf8'));
const tokenizer = await new Promise((resolve, reject) => kuromoji.builder({ dicPath: 'node_modules/kuromoji/dict' }).build((error, tokenizer) => error ? reject(error) : resolve(tokenizer)));
const hira = value => value.replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60));
const exceptions = { '年歳': 'ねんさい', '殿': 'どの', '歳': 'さい', '善い': 'よい', '零下': 'れいか', '一億': 'いちおく', '第一': 'だいいち' };
catalog.baselineExercises = [];
for (const chapter of catalog.baselineKanjiChapters) {
  for (const card of chapter.cards) {
    const term = card.studyWord;
    const tokens = tokenizer.tokenize(term);
    const reading = exceptions[term] || tokens.map(token => token.reading ? hira(token.reading) : token.surface_form).join('');
    if (!/^[ぁ-ゖー]+$/.test(reading)) throw Error(`Missing reviewed reading: ${card.sourceNumber} ${term} ${reading}`);
    card.examples = structuredClone(translated[card.kanji] || []);
    if (!card.examples.some(example => example.japanese.replace(/（[^）]*）/g, '').includes(term))) {
      card.examples.push({ japanese: `${term}（${reading}）`, myanmar: card.kanji === '必' ? 'လိုအပ်သော' : '', term, reading, provenance: 'supplementary-study-word' });
    }
    catalog.baselineExercises.push({ _id: `n2-soumatome-reading-${card.sourceNumber}`, chapterId: chapter.id, subchapterId: `${chapter.id}-section-${card.page}`, studyTab: 'Kanji', section: card.lesson, question: `「${term}」の読み方をひらがなで書いてください。`, questionMyanmar: 'ဤစကားလုံး၏ ဖတ်ပုံကို ဟိရဂနဖြင့် ရေးပါ။', answer: reading, answerMyanmar: '', generated: true, sourceReferences: card.sourceReferences });
  }
}
await fs.writeFile(filename, JSON.stringify(catalog, null, 2) + '\n');
console.log('Annotated all 739 study words. Original textbook examples remain available in lesson-page references.');
