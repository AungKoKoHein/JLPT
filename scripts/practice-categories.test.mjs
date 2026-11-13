import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { practiceCategories } from '../src/practiceCategories.js';

const bank = JSON.parse(fs.readFileSync(new URL('../src/n3PracticeBank.json', import.meta.url)));

test('source repeats are explained and excluded from playable categories', () => {
  const before = JSON.stringify(bank);
  const categories = practiceCategories(bank);
  assert.equal(categories.length, 26);
  for (const [index, original] of [[1, 'N3-1'], [16, 'N3-16']]) {
    assert.equal(categories[index].questions.length, 0);
    assert.ok(categories[index].duplicateCount >= 72);
    assert.deepEqual(categories[index].duplicateCategories, [original]);
  }
  assert.equal(categories[5].duplicateCount, 1);
  assert.equal(categories[11].duplicateCount, 8);
  const keys = categories.flatMap(s => s.questions.filter(q => q.individualItem).map(q =>
    JSON.stringify([q.topic, q.prompt.replace(/^\s*[［\[]\d+[］\]]\s*/, '').replace(/\s+/g, ''), q.choices.map(c => c.replace(/\s+/g, ''))])));
  assert.equal(new Set(keys).size, keys.length);
  assert.equal(JSON.stringify(bank), before, 'source questions and answer keys stay intact');
});

test('cloud questions deduplicate despite numbering and spacing, while different choices remain', () => {
  const question = { prompt: '［1］ 日本 語', choices: ['a', 'b', 'c', 'd'], topic: 'Vocabulary' };
  const categories = practiceCategories([
    { title: 'A', questions: [question] },
    { title: 'B', questions: [{ ...question, prompt: '［2］日本語' }, { ...question, choices: ['e', 'f', 'g', 'h'] }] },
  ]);
  assert.equal(categories[1].questions.length, 1);
  assert.equal(categories[1].duplicateCount, 1);
  assert.deepEqual(categories[1].questions[0].choices, ['e', 'f', 'g', 'h']);
});
