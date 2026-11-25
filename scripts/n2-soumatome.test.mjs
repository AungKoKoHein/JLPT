import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import catalog from '../migrations/n2-soumatome-catalog.json' with { type: 'json' };
import { emptyContent } from '../src/cloudContent.js';
import { replaceN2Kanji } from '../migrations/n2KanjiReplacement.js';
import { kanjiExampleText } from '../src/kanjiContent.js';

test('N2 import contains exactly 739 unique numbered Kanji with Myanmar, readings and examples', () => {
  const cards = catalog.baselineKanjiChapters.flatMap(chapter => chapter.cards);
  assert.equal(catalog.baselineKanjiChapters.length, 8);
  assert.deepEqual(cards.map(c => c.sourceNumber), Array.from({ length: 739 }, (_, i) => i + 1));
  assert.equal(new Set(cards.map(c => c.kanji)).size, 739);
  assert.equal(cards[222].kanji, '必');
  assert.equal(cards[738].kanji, '並');
  assert.equal(cards[0].sourceReferences[0].page, 13);
  assert.equal(cards[738].sourceReferences[0].page, 139);
  assert.equal(catalog.baselineKanjiChapters.flatMap(c => c.sections).length, 56);
  for (const card of cards) {
    assert.match(card.kanji, /^\p{Script=Han}$/u);
    assert.match(card.meaning, /\p{Script=Myanmar}/u);
    assert.ok(card.strokes > 0);
    assert.ok(card.readings.some(r => r.on || r.kun));
    assert.ok(card.examples.length);
    assert.ok(card.examples.some(e => e.japanese.includes(card.kanji)));
    assert.ok(catalog.baselineKanjiChapters.some(ch => ch.cards.includes(card) && ch.sections.some(s => s.page === card.page)));
  }
  for (const chapter of catalog.baselineKanjiChapters) for (const section of chapter.sections) for (const page of section.sourcePages) assert.ok(fs.existsSync(new URL(`../public${page.src}`, import.meta.url)));
  assert.equal(catalog.baselineExercises.length, 739);
  catalog.baselineExercises.forEach(e => assert.match(e.answer, /^[ぁ-ゖー]+$/));
});

test('replacement removes old Kanji including overlays but preserves all other study sections', () => {
  const old = structuredClone(emptyContent);
  old.baselineKanjiChapters = [{ id: 'old-kanji', cards: [{ kanji: '火' }], sections: [{ page: 1 }] }];
  old.chapters = [{ id: 'grammar', studyTab: 'Grammar' }, { id: 'custom-kanji', studyTab: 'Kanji' }];
  old.subchapters = [{ id: 'k-child', parentChapterId: 'custom-kanji', studyTab: 'Kanji' }, { id: 'g-child', parentChapterId: 'grammar', studyTab: 'Grammar' }];
  old.cards = [{ _id: 'g-card', chapterId: 'grammar', studyTab: 'Grammar' }];
  old.kanjiCards = [{ _id: 'k-card', kanji: '水', chapterId: 'custom-kanji' }];
  old.kanjiOverrides = { 'k-card': { meaning: 'old edit' } };
  old.baselineExercises = [{ _id: 'g-exercise', studyTab: 'Grammar' }, { _id: 'k-exercise', studyTab: 'Kanji' }];
  old.exercises = [{ _id: 'custom-k', studyTab: 'Kanji' }, { _id: 'reading', studyTab: 'Reading' }];
  old.exerciseOverrides = { 'k-exercise': { answer: 'old' }, 'g-exercise': { answer: 'preserve' } };
  old.deletedChapters = ['old-kanji', 'grammar-deleted'];
  old.deletedSubchapters = ['old-kanji-section-1', 'grammar-deleted-section'];
  old.cardOrders = { '["Kanji","custom-kanji"]': ['k-card'], '["Grammar","grammar"]': ['g-card'] };
  const next = replaceN2Kanji(old, catalog);
  assert.deepEqual(next.cards, old.cards);
  assert.deepEqual(next.chapters, [old.chapters[0]]);
  assert.deepEqual(next.subchapters, [old.subchapters[1]]);
  assert.deepEqual(next.kanjiCards, []);
  assert.deepEqual(next.kanjiOverrides, {});
  assert.deepEqual(next.exercises, [old.exercises[1]]);
  assert.deepEqual(next.exerciseOverrides, { 'g-exercise': old.exerciseOverrides['g-exercise'] });
  assert.deepEqual(next.deletedChapters, ['grammar-deleted']);
  assert.deepEqual(next.deletedSubchapters, ['grammar-deleted-section']);
  assert.deepEqual(next.cardOrders, { '["Grammar","grammar"]': ['g-card'] });
  assert.equal(next.baselineExercises.filter(e => e.studyTab === 'Kanji').length, 739);
  assert.deepEqual(next.baselineExercises.filter(e => e.studyTab !== 'Kanji'), [old.baselineExercises[0]]);
  assert.deepEqual(old.baselineKanjiChapters[0].cards, [{ kanji: '火' }]);
  next.kanjiCards.push({ _id: 'new-owner-card', kanji: '空' });
  assert.deepEqual(replaceN2Kanji(next, catalog), next, 'rerunning must preserve post-import owner additions');
});

test('complete word readings are not corrupted by an individual character reading', () => {
  assert.equal(kanjiExampleText({ kanji: '禁', readings: [{ kanji: '禁', on: 'キン' }] }, { japanese: '禁煙（きんえん）' }), '禁煙（きんえん）');
  assert.equal(kanjiExampleText({ kanji: '申', kun: 'もうす' }, { japanese: '申し込む（もうしこむ）' }), '申し込む（もうしこむ）');
});
