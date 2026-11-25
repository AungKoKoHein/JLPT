import assert from 'node:assert/strict';
import test from 'node:test';
import { flaggedQuestionKey, flaggedQuestionSnapshot, flaggedCollections } from '../src/n3FlaggedQuestions.js';

test('flagged review sets contain only the marked questions in each section', () => {
  const questions = [
    { id: 1, section: 'Vocabulary', prompt: 'Vocabulary', choices: ['A', 'B'], answer: 0 },
    { id: 'grammar', number: 5, topic: 'Grammar & reading', prompt: 'Grammar', choices: ['A', 'B'], answer: 1, passage: 'Context' },
    { id: 'reading', number: 24, topic: 'Grammar & reading', prompt: 'Reading', choices: ['A', 'B'], answer: 0 },
  ].map(flaggedQuestionSnapshot);
  const [all, vocabulary, grammar] = flaggedCollections(questions);
  assert.deepEqual(all.questions, questions);
  assert.deepEqual(vocabulary.questions.map(q => q.id), [1]);
  assert.deepEqual(grammar.questions.map(q => q.id), ['grammar']);
  assert.equal(grammar.questions[0].passage, 'Context');
  assert.equal(vocabulary.questions[0].number, 1);
  assert.equal(vocabulary.questions[0].topic, 'Vocabulary');
  assert.ok(flaggedCollections([]).every(set => set.questions.length === 0));
});

test('the same question has the same flag identity across imported and bundled sets', () => {
  assert.equal(flaggedQuestionKey({ id: 'cloud-question', sourceQuestionId: 'original' }), flaggedQuestionKey({ id: 'original' }));
  assert.equal(flaggedQuestionKey({ id: 1 }), '1');
});
