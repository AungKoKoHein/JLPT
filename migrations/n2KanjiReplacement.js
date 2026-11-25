import { normalizeContent } from '../src/cloudContent.js';

export function replaceN2Kanji(value, catalog) {
  const content = normalizeContent(value);
  const chapters = catalog.baselineKanjiChapters;
  if (chapters?.length !== 8 || chapters.flatMap(c => c.cards).length !== 739 || catalog.baselineExercises?.length !== 739) throw Error('A complete reviewed 739-card catalog is required.');
  // A completed import is a no-op on rerun, retaining edits made afterward.
  if (JSON.stringify(content.baselineKanjiChapters) === JSON.stringify(chapters)) return content;
  const chapterIds = new Set([
    ...content.baselineKanjiChapters.map(c => c.id),
    ...content.chapters.filter(c => c.studyTab === 'Kanji').map(c => c.id),
  ]);
  const sectionIds = new Set(content.subchapters.filter(s => s.studyTab === 'Kanji' || chapterIds.has(s.parentChapterId)).map(s => s.id));
  for (const chapter of content.baselineKanjiChapters) for (const section of chapter.sections || []) sectionIds.add(`${chapter.id}-section-${section.page}`);
  const owns = id => typeof id === 'string' && (chapterIds.has(id) || sectionIds.has(id) || [...chapterIds].some(chapterId => id.startsWith(`${chapterId}:`) || id.startsWith(`${chapterId}-section-`)));
  const isKanji = item => item.studyTab === 'Kanji' || (!item.studyTab && (owns(item.chapterId) || owns(item.parentChapterId) || owns(item.subchapterId)));
  const removedCardIds = new Set(content.cards.filter(isKanji).map(c => c._id || c.id));
  const removedExerciseIds = new Set([...content.baselineExercises, ...content.exercises].filter(e => isKanji({ ...e, ...content.exerciseOverrides[e._id] })).map(e => e._id));
  const keepMap = (map, remove) => Object.fromEntries(Object.entries(map).filter(([key, item]) => !remove(key, item)));
  content.baselineKanjiChapters = structuredClone(chapters);
  content.kanjiCards = [];
  content.kanjiOverrides = {};
  content.deletedKanjiCards = [];
  content.chapters = content.chapters.filter(c => !chapterIds.has(c.id) && c.studyTab !== 'Kanji');
  content.subchapters = content.subchapters.filter(s => !sectionIds.has(s.id));
  content.groups = content.groups.filter(g => g.studyTab !== 'Kanji');
  content.cards = content.cards.filter(c => !removedCardIds.has(c._id || c.id));
  content.cardOverrides = keepMap(content.cardOverrides, (key, item) => removedCardIds.has(key) || owns(key) || item.studyTab === 'Kanji');
  content.exerciseOverrides = keepMap(content.exerciseOverrides, (key, item) => removedExerciseIds.has(key) || owns(key) || item.studyTab === 'Kanji');
  content.chapterOverrides = keepMap(content.chapterOverrides, (key, item) => owns(key) || item.studyTab === 'Kanji');
  content.deletedChapters = content.deletedChapters.filter(id => !owns(id));
  content.deletedSubchapters = content.deletedSubchapters.filter(id => !owns(id));
  content.deletedCards = content.deletedCards.filter(id => !removedCardIds.has(id) && !owns(id));
  content.deletedExercises = content.deletedExercises.filter(id => !removedExerciseIds.has(id) && !owns(id));
  content.cardOrders = keepMap(content.cardOrders, key => {
    try { const [tab, chapter] = JSON.parse(key); return tab === 'Kanji' || owns(chapter); } catch { return owns(key); }
  });
  content.baselineExercises = [...content.baselineExercises.filter(e => !removedExerciseIds.has(e._id)), ...structuredClone(catalog.baselineExercises)];
  content.exercises = content.exercises.filter(e => !removedExerciseIds.has(e._id));
  return normalizeContent(content);
}
