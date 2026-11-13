import assert from 'node:assert/strict';
import test from 'node:test';
import { readingCollections, originalReadingCollection } from '../src/readingCollections.js';
import { pdfReadingSets } from '../src/pdfReadingSets.js';

test('passage layout preserves all PDF questions once, in source order', () => {
  assert.equal(readingCollections.length, 23);
  for (const collection of readingCollections) {
    const source = pdfReadingSets.find(set => set.id === collection.id);
    const questions = collection.passages.flatMap(p => p.questions);
    assert.deepEqual(questions.map(q => q.id), source.questions.map(q => q.id));
    for (const passage of collection.passages) {
      assert.ok(passage.questions.length);
      if (passage.text) assert.doesNotMatch(passage.text, /[［\[「]\d{2}[］\]」]/);
      for (const question of passage.questions) {
        assert.equal(question.answer, source.questions.find(q => q.id === question.id).answer);
        assert.equal(question.choices.length, 4);
      }
    }
  }
  assert.ok(readingCollections.flatMap(s => s.passages).filter(p => p.text).length > 140);
  assert.equal(originalReadingCollection.passages.flatMap(p => p.questions).length, 8);
});

test('source passage and fourth choice remain separate', () => {
  const last = readingCollections.find(s => s.id === 'n3-26');
  const first = last.passages[0];
  assert.match(first.text, /レストラン/);
  assert.doesNotMatch(first.questions[0].choices[3], /医療の現場/);
  assert.match(last.passages[1].text, /医療の現場/);
});
