import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const bank = JSON.parse(fs.readFileSync(new URL('../src/n3PracticeBank.json', import.meta.url)));

test('PDF collection exposes 26 complete sets and unique question IDs', () => {
  assert.equal(bank.length, 26);
  assert.deepEqual(bank.map(set => set.title), Array.from({ length: 26 }, (_, i) => `N3-${i+1}`));
  const ids = bank.flatMap(set => set.questions.map(question => question.id));
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(ids.length, 1940);
  for (const set of bank) {
    assert.equal(set.questions.length, set.id === 'n3-22' ? 90 : 74);
    for (const question of set.questions) {
      assert.equal(question.choices.length, 4);
      assert.ok(question.answer === null || Number.isInteger(question.answer) && question.answer >= 0 && question.answer <= 3);
      assert.ok(question.sourcePages.some(page => page.number === question.sourcePage));
      for (const page of [...question.sourcePages, ...question.keyPages]) {
        assert.match(page.src, /^\/practice-n3\/page-\d+\.png$/);
        assert.ok(fs.existsSync(new URL(`../public${page.src}`, import.meta.url)), page.src);
      }
    }
  }
});

test('answer keys preserve source exceptions and cross-page continuation', () => {
  assert.equal(bank[0].questions[0].answer, 2);
  assert.equal(bank[0].questions[37].answer, null, 'PDF prints invalid option 5 for grammar Q3');
  const exceptional = bank[21].questions.filter(question => question.topic === 'Grammar & reading');
  assert.deepEqual(exceptional.slice(27, 33).map(question => question.answer), [0,3,2,0,3,1]);
  assert.equal(bank[22].questions.at(-3).answer, 3, 'offset cell is option 4 for grammar Q37');
});
