import test from 'node:test';
import assert from 'node:assert/strict';
import {createDecemberExam, createFocusedExam, focusedExamSkills, decemberExamStructure} from '../src/decemberExam.js';
import {questionSkill} from '../src/mockExamRecords.js';
const seeded = seed => () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);

test('focused exams isolate each skill, keep passage groups, and draw fresh practice selections', () => {
  const counts = { Vocabulary: 21, Grammar: 23, Reading: 16, Kanji: 14 };
  for (const skill of focusedExamSkills) {
    for (let seed = 0; seed < 20; seed++) {
      const exam = createFocusedExam(skill, seeded(seed));
      assert.equal(exam.questions.length, counts[skill]);
      assert.equal(new Set(exam.questions.map(q => q.id)).size, counts[skill]);
      assert.ok(exam.questions.every(q => questionSkill(q) === skill));
      const full = createDecemberExam(seeded(seed));
      assert.deepEqual(exam.questions, full.questions.filter(q => questionSkill(q) === skill));
      assert.equal(exam.structure.reduce((sum, group) => sum + group.count, 0), counts[skill]);
    }
    const ids = seed => createFocusedExam(skill, seeded(seed)).questions.map(q => q.id);
    assert.deepEqual(ids(42), ids(42));
    assert.notDeepEqual(ids(42), ids(43));
  }
});
test('random December exams always preserve every N3 written question-type quota', () => {
  for(let seed=0;seed<100;seed++) {
    const {questions}=createDecemberExam(seeded(seed));
    assert.equal(questions.length,74);
    assert.equal(new Set(questions.map(q=>q.id)).size,74);
    for(const group of decemberExamStructure) assert.equal(questions.filter(q=>q.section===group.section&&q.type===group.type).length,group.count,group.type);
    assert.equal(questions.filter(q=>questionSkill(q)==='Kanji').length,14);
    for(const q of questions) { assert.equal(q.choices.length,4); assert.ok(q.answer>=0&&q.answer<4); }
    for(const type of ['Text grammar','Short passage','Mid-size passage','Long passage','Information retrieval']) {
      const groups=Map.groupBy(questions.filter(q=>q.type===type),q=>q.passageId);
      const expected={'Text grammar':5,'Short passage':1,'Mid-size passage':3,'Long passage':4,'Information retrieval':2}[type];
      for(const [id,group] of groups) { assert.ok(id); assert.equal(group.length,expected); assert.ok(group.every(q=>q.passage&&q.passage===group[0].passage)); }
    }
    const grammar=questions.filter(q=>q.type==='Text grammar');
    for(const q of grammar) assert.ok(q.passage.includes(`[${q.number}]`));
  }
});
test('different seeds produce fresh exams and identical seeds reproduce selections',()=>{
  const ids=seed=>createDecemberExam(seeded(seed)).questions.map(q=>q.id);
  assert.deepEqual(ids(42),ids(42));
  assert.notDeepEqual(ids(42),ids(43));
});
