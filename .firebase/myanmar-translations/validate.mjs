import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';
import {chapters} from '../../src/data/n3Vocabulary.js';
import {exercisesByChapter} from '../../src/data/exercises.js';
import {decodeSnapshot, normalizeContent} from '../../src/cloudContent.js';
import {resolveVocabularyCards} from '../../src/vocabularyContent.js';
import {resolveExercises, vocabularyExercises} from '../../src/exerciseContent.js';
import {resolveVocabularySubchapters} from '../../src/vocabularyContent.js';

const folder = new URL('./',import.meta.url);
const before=decodeSnapshot(JSON.parse(await readFile(new URL('before.json',folder),'utf8'))).content;
const content=normalizeContent(JSON.parse(await readFile(new URL('prepared-content.json',folder),'utf8')));
const cards=resolveVocabularyCards(chapters,content);
const exercises=resolveExercises(vocabularyExercises(exercisesByChapter),content,resolveVocabularySubchapters(chapters,content));
const targetIds=new Set(chapters.slice(1).map(c=>c.id));
const targetCards=cards.filter(c=>targetIds.has(c.parentChapterId??c.chapterId));
const targetExercises=exercises.filter(e=>targetIds.has(e.chapterId));
assert.equal(targetCards.length,1754);
assert.equal(targetExercises.length,369);
for(const card of targetCards){
  assert(card.exampleJapanese.trim().length>5,card._id);
  assert(!/_{3,}|※|➔|\\rightarrow|အဓိပ္ပာယ်ရသည်/.test(card.exampleJapanese+card.exampleMyanmar),card._id);
  assert(/[က-အ]/u.test(card.exampleMyanmar),card._id);
  assert(!/[^\p{Script=Myanmar}\p{Script=Latin}\p{Script=Common}\p{Script=Inherited}]/u.test(card.exampleMyanmar),card._id);
  assert(!card.exampleMyanmar.includes('_______'),card._id);
}
for(const ex of targetExercises){
  assert(/[က-အ]/u.test(ex.questionMyanmar)&&/[က-အ]/u.test(ex.answerMyanmar),ex._id);
  assert.equal((ex.question.match(/_+/g)??[]).length,(ex.questionMyanmar.match(/_+/g)??[]).length,ex._id+' blank counts');
  assert(!/[^\p{Script=Myanmar}\p{Script=Latin}\p{Script=Common}\p{Script=Inherited}]/u.test(ex.questionMyanmar+ex.answerMyanmar),ex._id);
}
for(const field of Object.keys(before)){
  if(!['cardOverrides','exerciseOverrides'].includes(field)) assert.deepEqual(content[field],before[field],field);
  else for(const [id,value] of Object.entries(before[field])) if(id.startsWith('part-1-chapter-1:'))assert.deepEqual(content[field][id],value,id);
}
const report={chapters:targetIds.size,cards:targetCards.length,exercises:targetExercises.length,chapter1Preserved:true,otherContentPreserved:true};
await writeFile(new URL('validation.json',folder),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
