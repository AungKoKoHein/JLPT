import test from 'node:test';
import assert from 'node:assert/strict';
import catalog from '../migrations/n2-soumatome-catalog.json' with { type: 'json' };
import { getN2KanjiLessons, n2KanjiLessonExercises } from '../src/n2KanjiLessons.js';
import { hideReadings } from '../src/studyText.js';
import { normalizeContent } from '../src/cloudContent.js';
import { resolveExercises, exercisesForView } from '../src/exerciseContent.js';

test('all 56 existing N2 daily/column sections have two translated sentences and the correct source exercises', () => {
  let sentenceCount = 0;
  const sourcePages = new Set();
  for (const chapter of catalog.baselineKanjiChapters) {
    const before = JSON.stringify(chapter);
    const lessons = getN2KanjiLessons(chapter);
    assert.equal(lessons.length, 7);
    assert.deepEqual(lessons.map(lesson => lesson.id), chapter.sections.map(section => `${chapter.id}-section-${section.page}`));
    for (const lesson of lessons) {
      assert.equal(lesson.examples.length, 2);
      for (const example of lesson.examples) {
        sentenceCount++;
        assert.match(example.japanese, /。$/);
        assert.match(example.myanmar, /\p{Script=Myanmar}/u);
        assert.equal(hideReadings(example.annotated), example.japanese, 'reading toggle preserves the original sentence');
        const uncovered = example.annotated.replace(/[\p{Script=Han}々〆\p{Script=Hiragana}\p{Script=Katakana}ー]+（[ぁ-ゖー]+）/gu, '');
        assert.doesNotMatch(uncovered, /\p{Script=Han}/u, 'every Kanji has a reading');
      }
      assert.equal(lesson.exercises.length, lesson.day === 7 ? 1 : 2);
      const expectedPage = lesson.day === 7 ? lesson.page - 1 : lesson.page + ([70,118].includes(lesson.page) ? 2 : 1);
      for (const exercise of lesson.exercises) {
        sourcePages.add(exercise.sourceReferences[0].page);
        assert.equal(exercise.sourceReferences[0].page, expectedPage);
        assert.equal(exercise.chapterId, chapter.id);
        assert.equal(exercise.subchapterId, lesson.id);
        assert.equal(typeof exercise.question, 'string');
        assert.ok(exercise.answer);
        assert.match(exercise.questionMyanmar, /\p{Script=Myanmar}/u);
        assert.equal(exercise.imageSrc, undefined, 'N3 format is text, never scans');
        if (lesson.day === 7) assert.match(exercise.question, /\|[^|]+\|/);
        else assert.ok(exercise.question.includes(hideReadings(exercise.answer)), 'the choice answer exists in the original question');
      }
    }
    assert.equal(JSON.stringify(chapter), before, 'no imported cards or owner data are modified');
  }
  assert.equal(sentenceCount, 112);
  assert.equal(sourcePages.size, 56);
  const exercises = n2KanjiLessonExercises(catalog.baselineKanjiChapters);
  assert.equal(exercises.length, 104);
  assert.equal(new Set(exercises.map(item => item._id)).size, 104);
});

test('supplements cannot leak into N3, unrelated N2 chapters, or custom sections', () => {
  for (const chapter of [null, { id: 'kanji-1' }, { id: 'n3-kanji-master-chapter-1' }, { id: 'owner-chapter' }]) {
    assert.deepEqual(getN2KanjiLessons(chapter), []);
  }
  assert.deepEqual(getN2KanjiLessons({ id: 'n2-soumatome-week-1', sections: [{ page: 999, title: 'Custom' }] }), []);
});

test('new exercises use the existing N3 resolution, assignment, editing and deletion behavior', () => {
  const content = normalizeContent(catalog);
  const original = JSON.stringify(content.baselineExercises);
  const extras = n2KanjiLessonExercises(content.baselineKanjiChapters);
  const base = [...extras, ...content.baselineExercises];
  const subchapters = content.baselineKanjiChapters.flatMap(chapter => chapter.sections.map(section => ({ id: `${chapter.id}-section-${section.page}`, parentChapterId: chapter.id })));
  let resolved = resolveExercises(base, content, subchapters);
  const first = extras[0];
  assert.ok(exercisesForView(resolved, 'Kanji', first.chapterId, first.subchapterId).some(item => item._id === first._id));
  content.exerciseOverrides[first._id] = { answer: 'Owner correction', subchapterId: subchapters[1].id };
  resolved = resolveExercises(base, content, subchapters);
  assert.equal(resolved.find(item => item._id === first._id).answer, 'Owner correction');
  assert.ok(exercisesForView(resolved, 'Kanji', first.chapterId, subchapters[1].id).some(item => item._id === first._id));
  assert.ok(!exercisesForView(resolved, 'Kanji', first.chapterId, first.subchapterId).some(item => item._id === first._id));
  content.deletedExercises.push(first._id);
  assert.ok(!resolveExercises(base, content, subchapters).some(item => item._id === first._id));
  assert.equal(JSON.stringify(content.baselineExercises), original, 'existing 739 drills are preserved');
});
