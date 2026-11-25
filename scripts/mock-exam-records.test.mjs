import test from 'node:test';
import assert from 'node:assert/strict';
import { scoreExam, combinedScores, questionSkill } from '../src/mockExamRecords.js';
test('kanji classification includes reading, spelling and both PDF numbering formats', () => {
  for (const type of ['Kanji reading', 'Orthography', '問題Ⅰ', '問題Ⅱ', '問題II', '問題１', '問題２']) assert.equal(questionSkill({ section: 'Vocabulary', type }), 'Kanji');
  assert.equal(questionSkill({ section: 'Vocabulary', type: '問題III' }), 'Vocabulary');
  assert.equal(questionSkill({ section: 'Grammar', type: 'Grammar' }), 'Grammar');
});
test('unanswered questions count as incorrect and aggregation weights question counts', () => {
  const scores = scoreExam([{ id: 1, section: 'Vocabulary', type: 'Kanji reading', answer: 0 }, { id: 2, section: 'Grammar', answer: 1 }, { id: 3, section: 'Grammar', answer: 0 }], { 1: 0, 2: 0 });
  assert.deepEqual(scores.Kanji, { correct: 1, total: 1 });
  assert.deepEqual(scores.Grammar, { correct: 0, total: 2 });
  assert.deepEqual(combinedScores([{ scores }, { scores }]).Grammar, { correct: 0, total: 4 });
  assert.deepEqual(scores.Reading, { correct: 0, total: 0 });
});
import { performanceView, skillSummary } from '../src/mockExamRecords.js';
test('latest and previous views select individual attempts in chronological order', () => {
  const records = [
    { id: 'old', completedAt: 10, scores: { Grammar: { correct: 1, total: 10 } } },
    { id: 'latest', completedAt: 30, scores: { Grammar: { correct: 8, total: 10 } } },
    { id: 'middle', completedAt: 20, scores: { Grammar: { correct: 5, total: 10 } } },
  ];
  const latest = performanceView(records);
  assert.equal(latest.record.id, 'latest');
  assert.equal(latest.previous.id, 'middle');
  assert.equal(latest.scores.Grammar.correct, 8);
  assert.equal(performanceView(records, 'previous').record.id, 'middle');
  assert.equal(performanceView(records, 'previous', 'old').previous, null);
  assert.equal(performanceView(records, 'previous', 'missing').record.id, 'middle');
  assert.equal(performanceView([records[0]], 'previous').count, 0);
  assert.equal(performanceView([], 'latest').count, 0);
});
test('overall combines question counts and handles untested skills and status thresholds', () => {
  const result = performanceView([{ scores: { Grammar: { correct: 1, total: 1 } } }, { scores: { Grammar: { correct: 1, total: 9 } } }], 'overall');
  assert.equal(result.count, 2);
  assert.equal(skillSummary(result.scores.Grammar).percent, 20);
  assert.equal(skillSummary(result.scores.Kanji).status, 'Not tested');
  assert.equal(skillSummary({correct: 4, total: 5}).status, 'Strong');
  assert.equal(skillSummary({correct: 3, total: 5}).status, 'Developing');
  assert.equal(skillSummary({correct: 2, total: 5}).status, 'Needs practice');
});
