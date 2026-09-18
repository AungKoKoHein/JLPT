import { readFile, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { chapters } from '../../src/data/n3Vocabulary.js';
import { exercisesByChapter } from '../../src/data/exercises.js';
import { decodeSnapshot, normalizeContent } from '../../src/cloudContent.js';
import { translations } from './translations.mjs';
import { exerciseTranslations } from './exercise-translations.mjs';
import { cardExamples, cardLinks } from './card-examples.mjs';

const folder = new URL('./', import.meta.url);
const snapshot = JSON.parse(await readFile(new URL('before.json', folder), 'utf8'));
const {content} = decodeSnapshot(snapshot);
const next = structuredClone(content);
export const plain = s => s.replace(/（[ぁ-ゖァ-ヶー]+）/g, '').replace(/\s*\([ぁ-ゖァ-ヶー]+\)/g, '').replace(/\(added\)/g,'').replace(/\s/g,'');
const canon = s => plain(s).replace(/[（）()]/g,'').replace(/_+/g,'_').replace(/[。、，,.]/g,'');
const cleanJapanese = s => s.trim().replace(/^[①-⑳㉑-㉟㊱-㊿]\s*/, '').replace(/（([ぁ-ゖァ-ヶー]+)）(?:（\1）)+/g,'（$1）');
const unresolved = [];
const report = [];
for (const chapter of chapters.slice(1)) {
  const unique = [...new Set(chapter.cards.filter(c => c.generated).map(c => c.exampleJapanese))];
  const rows = translations[chapter.number];
  assert.equal(rows.length, unique.length, chapter.number);
  const seen = new Set();
  rows.forEach(r => { assert(!seen.has(r.index)); seen.add(r.index); assert(r.myanmar && /[က-အ]/u.test(r.myanmar)); });
  chapter.cards.forEach((card, i) => {
    if (!card.generated) return;
    const row = rows.find(r => r.index === unique.indexOf(card.exampleJapanese));
    assert(row, `${chapter.number}:${i}`);
    const id = `${chapter.id}:card:${i}`;
    if (next.deletedCards.includes(id)) return;
    const japanese = cleanJapanese(row.japanese ?? card.exampleJapanese);
    next.cardOverrides[id] = {...next.cardOverrides[id], exampleJapanese: /[。！？]$/.test(japanese) ? japanese : japanese+'。', exampleMyanmar: row.myanmar};
  });
  const sources = chapter.sourceExercises.map(source => {
    const jp = source.question.replace(/([一-龯々][ぁ-ゖ]*)（[ぁ-ゖァ-ヶー]+）/g, '$1').replace(/\s/g,'');
    const groups = [...jp.matchAll(/（([^（）]+)）/g)];
    const mm = [...source.answer.matchAll(/\(([^()]+)\)/g)];
    return {source, key:canon(jp.replace(/（[^（）]+）/g, '（_______）')), groups, mm};
  });
  let translated = 0;
  (exercisesByChapter[chapter.id] ?? []).forEach((ex, i) => {
    const id = `${chapter.id}:exercise:${i}`;
    if (next.deletedExercises.includes(id)) return;
    const manual = exerciseTranslations[chapter.number]?.[i];
    const matches = sources.filter(s => s.key === canon(ex.question));
    let patch = manual;
    if (!patch && matches.length === 1 && matches[0].groups.length === 1 && matches[0].mm.length === 1) {
      const s = matches[0];
      patch = {questionMyanmar:s.source.answer.replace(/\([^()]+\)/,'(_______)'),answerMyanmar:s.mm[0][1]};
    }
    if (!patch) { unresolved.push({chapter:chapter.number,index:i,question:plain(ex.question),answer:plain(ex.answer),possible:matches.map(s=>s.source)}); return; }
    assert(patch.questionMyanmar && patch.answerMyanmar, id);
    assert(!ex.question.includes('_______') || (patch.question ?? ex.question).includes('_______'), id);
    assert(!(patch.question ?? ex.question).includes('_______') || patch.questionMyanmar.includes('_______'), id);
    next.exerciseOverrides[id] = {...next.exerciseOverrides[id], ...patch};
    translated++;
  });
  chapter.cards.forEach((card, i) => {
    const id = `${chapter.id}:card:${i}`;
    if(next.deletedCards.includes(id)) return;
    const manual = cardExamples[chapter.number]?.[i];
    if(manual) {next.cardOverrides[id]={...next.cardOverrides[id], ...manual}; return;}
    const linked = cardLinks[chapter.number]?.[i];
    if(card.generated && linked === undefined) return;
    const source = sources.find(s => s.source.question === card.exampleJapanese);
    const matches = linked !== undefined ? [{e:exercisesByChapter[chapter.id][linked],i:linked}] : source ? (exercisesByChapter[chapter.id]??[]).map((e,i)=>({e,i})).filter(({e})=>canon(e.question)===source.key) : [];
    if(matches.length !== 1) return;
    const {e,i:ei}=matches[0];
    const patch = next.exerciseOverrides[`${chapter.id}:exercise:${ei}`];
    if(!patch) return;
    const question = patch.question ?? e.question;
    if((question.match(/_+/g)??[]).length !== 1) return;
    const answer = (patch.answer ?? e.answer).split(/\s*\/\s*/)[0].replace(/\s*\(([ぁ-ゖァ-ヶー]+)\)/g,'（$1）');
    const japanese=cleanJapanese(question.replace(/（_+）|\(_+\)|_+/g, answer).replace(/\s*\(added\)/gi,''));
    next.cardOverrides[id]={...next.cardOverrides[id],exampleJapanese:japanese,exampleMyanmar:patch.questionMyanmar.replace(/\(_+\)|_+/g,patch.answerMyanmar)};
  });
  report.push({chapter:chapter.number,cards:chapter.cards.length,exercises:(exercisesByChapter[chapter.id]??[]).length,translatedExercises:translated});
}
normalizeContent(next);
for (const field of Object.keys(content)) {
  if (field !== 'cardOverrides' && field !== 'exerciseOverrides') assert.deepEqual(next[field], content[field], field);
}
for(const field of ['cardOverrides','exerciseOverrides']) for(const [id,value] of Object.entries(content[field])) {
  if(id.startsWith('part-1-chapter-1:')) assert.deepEqual(next[field][id],value,'Preserve Chapter 1 '+id);
}
await writeFile(new URL('prepared-content.json', folder), JSON.stringify(next,null,2)+'\n');
await writeFile(new URL('unresolved-exercises.json', folder), JSON.stringify(unresolved,null,2)+'\n');
await writeFile(new URL('report.json', folder), JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({chapters:report.length,translatedCards:Object.keys(next.cardOverrides).length-Object.keys(content.cardOverrides).length,translatedExercises:report.reduce((n,r)=>n+r.translatedExercises,0),unresolved:unresolved.length}));
