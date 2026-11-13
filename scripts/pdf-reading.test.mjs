import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { pdfReadingSets, pdfReadingQuestionCount } from '../src/pdfReadingSets.js';

test('Reading includes available PDF comprehension questions with passages and keys', () => {
  assert.equal(pdfReadingSets.length, 23);
  assert.equal(pdfReadingQuestionCount, 345);
  assert.ok(!pdfReadingSets.some(set => ['n3-2', 'n3-17', 'n3-22'].includes(set.id)));
  for (const set of pdfReadingSets) for (const question of set.questions) {
    assert.equal(question.topic, 'Grammar & reading');
    assert.ok(question.number >= 24);
    assert.equal(question.openSource, true);
    assert.ok(question.individualItem || question.questionImage);
    assert.ok(question.sourcePages.some(page => page.number === question.sourcePage));
    assert.ok(question.keyPages.length);
    for (const page of [...question.sourcePages, ...question.keyPages]) {
      assert.ok(fs.existsSync(new URL(`../public${page.src}`, import.meta.url)));
    }
  }
  assert.deepEqual(pdfReadingSets[0].questions.map(q => q.number), Array.from({ length: 16 }, (_, i) => i + 24));
});
