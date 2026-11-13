import assert from 'node:assert/strict';
import test from 'node:test';
import bank from '../src/n3PracticeBank.json' with { type: 'json' };
import { promptUnderlines, starLayout, problemInstruction } from '../src/questionPresentation.js';
import { createDecemberExam } from '../src/decemberExam.js';

test('every bundled section displays full PDF directions, including cloud question IDs', () => {
  for (const question of bank.flatMap(set => set.questions).filter(q => q.problem)) {
    const instruction = problemInstruction(question);
    assert.match(instruction, /(?:なさい|ください)/, question.id);
    assert.equal(problemInstruction({ ...question, sourceQuestionId: question.id, id: 'cloud-question' }), instruction);
  }
  const vocabulary = bank[0].questions.find(q => q.topic === 'Vocabulary' && q.problem === '問題Ⅳ');
  assert.match(problemInstruction(vocabulary), /意味が最も近いもの/);
  const grammar = bank[0].questions.find(q => q.topic !== 'Vocabulary' && q.problem === '問題Ⅰ');
  assert.match(problemInstruction(grammar), /何を入れますか/);
});

test('PDF underlines preserve target words and survive cloud question IDs', () => {
  const question = bank[0].questions[0];
  const ranges = promptUnderlines(question);
  assert.deepEqual(ranges.map(({ start, end }) => question.prompt.slice(start, end)), ['比べて']);
  assert.deepEqual(promptUnderlines({ ...question, id: 'cloud-1', sourceQuestionId: question.id }), ranges);
  assert.deepEqual(promptUnderlines({ ...question, prompt: 'A replacement question' }), []);
  const spanning = bank[7].questions[6];
  assert.ok(promptUnderlines(spanning).length, 'Target survives a PDF page break');
});

test('every extracted star question exposes four slots and the printed star position', () => {
  const questions = bank.flatMap(s => s.questions).filter(q => /[★☆]/.test(q.prompt));
  assert.equal(questions.length, 124);
  for (const question of questions) {
    const layout = starLayout(question.prompt);
    assert.ok(layout, question.id);
    assert.equal(layout.slots.length, 4);
    const star = layout.slots[layout.starIndex];
    assert.match(question.prompt.slice(star.start, star.end), /[★☆]/);
  }
  assert.equal(starLayout('An ordinary question'), null);
});

test('December mocks select new scored questions from Practice with reading context', () => {
  let seed = 17;
  const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
  const first = createDecemberExam(random);
  const second = createDecemberExam(random);
  assert.equal(first.title, 'For Dec Exam');
  assert.equal(first.questions.length, 74);
  assert.equal(new Set(first.questions.map(q => q.id)).size, 74);
  assert.notDeepEqual(first.questions.map(q => q.id), second.questions.map(q => q.id));
  assert.deepEqual(['Vocabulary', 'Grammar', 'Reading'].map(section => first.questions.filter(q => q.section === section).length), [35, 23, 16]);
  for (const question of first.questions) {
    assert.ok(Number.isInteger(question.answer));
    assert.equal(question.choices.length, 4);
    if (question.section === 'Reading') assert.ok(question.passage.length > 50);
    assert.ok(bank.some(set => set.questions.some(q => q.id === question.id)));
  }
});
