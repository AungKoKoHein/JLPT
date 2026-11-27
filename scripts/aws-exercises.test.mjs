import test from 'node:test';
import assert from 'node:assert/strict';
import { awsExercisesByChapter } from '../src/awsExercises.js';
import { awsChapters } from '../src/awsChapters.js';
import { awsPart2Chapters } from '../src/awsPart2Chapters.js';
import { awsPart3Chapters, awsPart4Chapters } from '../src/awsPerformanceCostChapters.js';
import { awsQuestions } from '../src/awsPractice.js';

const chapters = [...awsChapters,...awsPart2Chapters,...awsPart3Chapters,...awsPart4Chapters];

test('every handbook chapter has 5–10 exercises with complete translations and stable answer identities', () => {
  assert.deepEqual(Object.keys(awsExercisesByChapter).map(Number),chapters.map(c=>c.id));
  const ids = new Set();
  for (const chapter of chapters) {
    const exercises = awsExercisesByChapter[chapter.id];
    assert.ok(exercises.length>=5 && exercises.length<=10,`Chapter ${chapter.id} has ${exercises.length} questions`);
    assert.equal(exercises.filter(e=>e.source==='original-handbook-review').length,3);
    assert.equal(exercises.filter(e=>e.source==='adapted-practice-bank').length,2);
    assert.deepEqual(new Set(exercises.map(e=>e.answer)),new Set([0,1,2]));
    for (const exercise of exercises) {
      assert.ok(!ids.has(exercise.id)); ids.add(exercise.id);
      assert.equal(exercise.chapterId,chapter.id);
      assert.ok(['original-handbook-review','adapted-practice-bank'].includes(exercise.source));
      assert.equal(exercise.options.length,3);
      assert.ok(Number.isInteger(exercise.answer) && exercise.answer>=0 && exercise.answer<3);
      for (const field of [exercise.question,exercise.explanation,...exercise.options]) {
        assert.deepEqual(Object.keys(field).sort(),['en','ja','my']);
        for (const language of ['my','en','ja']) assert.ok(field[language].trim(),`${exercise.id} / ${language}`);
      }
      for (const language of ['my','en','ja']) {
        assert.equal(new Set(exercise.options.map(option=>option[language])).size,3);
      }
      assert.match(exercise.question.my,/[\u1000-\u109f]/u);
      assert.match(exercise.question.ja,/[\u3040-\u30ff\u4e00-\u9fff]/u);
      assert.doesNotMatch(exercise.question.en,/[\u1000-\u109f\u3040-\u30ff]/u);
    }
  }
  assert.equal(ids.size,150);
});

test('adapted exercises identify real single-answer Practice questions and preserve their source metadata', () => {
  const adapted=Object.values(awsExercisesByChapter).flat().filter(e=>e.source==='adapted-practice-bank');
  assert.equal(adapted.length,60);
  assert.equal(new Set(adapted.map(e=>e.practiceQuestionNumber)).size,60,'Every addition uses a distinct Practice source');
  for(const exercise of adapted) {
    const source=awsQuestions.find(q=>q.number===exercise.practiceQuestionNumber);
    assert.ok(source,`Source for ${exercise.id}`);
    assert.equal(source.selectCount,1);
    assert.deepEqual(exercise.practiceSourcePages,source.sourcePages);
    assert.deepEqual(exercise.practiceSourceAnswerLetters,source.answers);
    assert.ok(source.answers.length===1);
    assert.notEqual(exercise.question.en,source.prompt.join(' '),'Shortened questions are identified as adaptations');
  }
});

test('numeric answer keys retain correct units and calculations after option rotation', () => {
  for (const [id,index,expected] of [
    [16,2,'No; total recovery takes 50 minutes'],
    [18,0,'125 MiB/s'],[20,1,'20'],[22,0,'200 RCUs'],
    [26,0,'$144, excluding other charges'],[29,1,'12 months'],
    [30,1,'200 GB; viewer delivery remains 1,000 GB'],
  ]) {
    const exercise=awsExercisesByChapter[id][index];
    assert.equal(exercise.options[exercise.answer].en,expected);
  }
});
