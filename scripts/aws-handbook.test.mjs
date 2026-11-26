import test from 'node:test';
import assert from 'node:assert/strict';
import { awsPart1Lessons, awsHandbookChapters, awsLessonExercises } from '../src/awsHandbookPart1.js';
import { groupExercisesByType } from '../src/exercisePresentation.js';
import { awsBeginnerNotes, awsTermDefinitions } from '../src/awsBeginnerNotes.js';

test('Every lesson introduces its subject and defines its prerequisite technical terms', () => {
  assert.deepEqual(Object.keys(awsBeginnerNotes).sort(), awsPart1Lessons.map(item => item.id).sort());
  for (const lesson of awsPart1Lessons) {
    const [intro, terms] = awsBeginnerNotes[lesson.id];
    assert.match(intro, /\p{Script=Myanmar}/u);
    assert.ok(terms.length >= 3, lesson.id);
    assert.equal(new Set(terms).size, terms.length);
    for (const term of terms) assert.match(awsTermDefinitions[term] || '', /\p{Script=Myanmar}/u, `${lesson.id}: ${term}`);
  }
});

test('Part I follows all 36 handbook sections, in page order', () => {
  assert.equal(awsHandbookChapters.length, 9);
  assert.deepEqual(awsPart1Lessons.map(item => item.id), Array.from({length:9}, (_, chapter) => Array.from({length:4}, (_, section) => `${chapter+1}.${section+1}`)).flat());
  assert.deepEqual(awsPart1Lessons[0].pages, [2,7]);
  assert.deepEqual(awsPart1Lessons.at(-1).pages, [280,286]);
  for (let i=1; i<awsPart1Lessons.length; i++) assert.equal(awsPart1Lessons[i].pages[0], awsPart1Lessons[i-1].pages[1]+1);
});

test('Every lesson has Myanmar steps, a worked example, Japanese notes and independently revealable exercises', () => {
  const ids = new Set();
  for (const lesson of awsPart1Lessons) {
    assert.match(lesson.my, /\p{Script=Myanmar}/u);
    assert.equal(lesson.steps.length, 3, lesson.id);
    for (const step of lesson.steps) for (const text of step) assert.match(text, /\p{Script=Myanmar}/u);
    assert.equal(lesson.example.length, 2);
    assert.equal(lesson.notes.length, 2);
    for (const note of lesson.notes) assert.match(note, /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u);
    const exercises = awsLessonExercises(lesson);
    assert.equal(exercises.length, 2);
    const groups = groupExercisesByType(exercises, true);
    assert.equal(groups.length, 1, `One shared question heading for ${lesson.id}`);
    for (const exercise of groups[0].items) {
      assert.ok(!ids.has(exercise._id)); ids.add(exercise._id);
      assert.ok(exercise.question && exercise.answer);
      assert.match(exercise.questionMyanmar, /\p{Script=Myanmar}/u);
      assert.match(exercise.answerMyanmar, /\p{Script=Myanmar}/u);
      assert.deepEqual(exercise.sourceReferences[0].pages, lesson.pages);
    }
  }
  assert.equal(ids.size, 72);
});
