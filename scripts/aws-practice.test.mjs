import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { awsQuestions, awsPracticeTitle, toggleAwsAnswer, awsAnswerStatus } from '../src/awsPractice.js';

test('AWS PDF import includes all 684 numbered questions, choices, and policy images', () => {
  assert.equal(awsPracticeTitle, 'AWS Certified Solutions Architect Associate SAA-C03 (1).pdf');
  assert.deepEqual(awsQuestions.map(q => q.number), Array.from({ length: 684 }, (_, i) => i + 1));
  const images = [];
  const counts = { 1: 0, 2: 0, 3: 0 };
  for (const q of awsQuestions) {
    counts[q.selectCount]++;
    assert.ok(q.prompt.join('').length > 20);
    assert.ok(q.choices.length >= 4 && q.choices.length <= 6);
    assert.ok(q.sourcePage >= 2 && q.sourcePage <= 248);
    q.choices.forEach((choice, index) => assert.ok(choice || q.choiceImages[String.fromCharCode(65 + index)]));
    images.push(...q.promptImages, ...Object.values(q.choiceImages));
  }
  assert.deepEqual(counts, { 1: 598, 2: 76, 3: 10 });
  assert.equal(images.length, 11);
  images.forEach(asset => assert.ok(fs.existsSync(new URL(`../public${asset.src}`, import.meta.url))));
  assert.equal(Object.keys(awsQuestions[476].choiceImages).length, 4);
  assert.ok(awsQuestions[124].sourceIssue);
});

test('single selections replace the prior answer and multiple selections stop at the requested count', () => {
  assert.deepEqual(toggleAwsAnswer(['A'], 'D', 1), ['D']);
  assert.deepEqual(toggleAwsAnswer(['D'], 'D', 1), []);
  assert.deepEqual(toggleAwsAnswer(['A'], 'B', 2), ['A', 'B']);
  assert.deepEqual(toggleAwsAnswer(['A', 'B'], 'C', 2), ['A', 'B']);
  assert.deepEqual(toggleAwsAnswer(['A', 'B'], 'B', 2), ['A']);
  assert.deepEqual(toggleAwsAnswer(['A', 'B'], 'F', 3), ['A', 'B', 'F']);
});

test('every question has a valid answer key with exactly the required number of choices', () => {
  assert.equal(awsQuestions.filter(q => Array.isArray(q.answers)).length, 684);
  for (const question of awsQuestions) {
    assert.equal(question.answers.length, question.selectCount, `Question ${question.number}`);
    assert.equal(new Set(question.answers).size, question.answers.length);
    for (const letter of question.answers) assert.ok('ABCDEF'.slice(0, question.choices.length).includes(letter));
    assert.ok(question.answerSource);
    assert.equal(awsAnswerStatus(question, question.answers, true), 'Correct');
  }
  assert.equal(awsAnswerStatus(awsQuestions[0], ['A'], false), 'Unchecked');
  assert.equal(awsAnswerStatus(awsQuestions[0], ['A'], true), 'Correct');
  assert.equal(awsAnswerStatus(awsQuestions[0], ['D'], true), 'Review');
  assert.equal(awsAnswerStatus(awsQuestions[17], ['B', 'A'], true), 'Correct');
  assert.equal(awsAnswerStatus(awsQuestions[17], ['A'], true), 'Review');
  assert.equal(awsAnswerStatus(awsQuestions[17], ['A', 'C'], true), 'Review');
});

test('supplemented answers keep explanations and primary-source references', () => {
  const supplemented = awsQuestions.filter(q => q.answerSource === 'aws-documentation-inference');
  assert.equal(supplemented.length, 49);
  for (const question of supplemented) {
    assert.ok(question.explanation);
    assert.ok(question.references.length > 0);
    question.references.forEach(reference => assert.ok(new URL(reference.url).hostname.endsWith('aws.amazon.com')));
  }
  assert.deepEqual(awsQuestions[124].answers, ['A', 'E']);
  assert.deepEqual(awsQuestions[156].answers, ['D', 'E']);
  assert.deepEqual(awsQuestions[231].answers, ['C']);
  assert.deepEqual(awsQuestions[314].answers, ['D']);
  assert.deepEqual(awsQuestions[422].answers, ['A', 'B']);
  assert.deepEqual(awsQuestions[476].answers, ['D']);
  assert.deepEqual(awsQuestions[678].answers, ['A', 'C', 'E']);
  assert.deepEqual(awsQuestions[678].providedAnswers, ['B', 'C', 'E']);
});
