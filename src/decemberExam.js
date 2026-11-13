import bank from './n3PracticeBank.json' with { type: 'json' };
import { practiceCategories } from './practiceCategories.js';
import { readingCollections } from './readingCollections.js';
import { starLayout } from './questionPresentation.js';

const valid = q => q.individualItem && Number.isInteger(q.answer) && q.choices.length === 4 && q.choices.every(c => c.trim() && !/^[①②③④]$/.test(c));
const practice = practiceCategories(bank).flatMap(set => set.questions);
const vocabulary = practice.filter(q => q.topic === 'Vocabulary' && valid(q)).map(q => ({ ...q, section: 'Vocabulary', type: q.problem || 'Vocabulary' }));
const grammar = practice.filter(q => q.topic === 'Grammar & reading' && q.number <= 18 && valid(q)).map(q => ({ ...q, section: 'Grammar', type: starLayout(q.prompt) ? 'Sentence order · ★' : 'Grammar' }));
const reading = readingCollections.flatMap(set => set.passages.filter(p => p.text).flatMap(p => p.questions.filter(valid).map(q => ({ ...q, section: 'Reading', type: p.type, passage: p.text }))));

function sample(items, count, random) {
  const pool = [...items];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

export function createDecemberExam(random = Math.random) {
  return { id: 'dec-exam', title: 'For Dec Exam', durationMinutes: 100,
    sourceNote: 'Practice collection · new selection each attempt',
    questions: [...sample(vocabulary, 35, random), ...sample(grammar, 23, random), ...sample(reading, 16, random)] };
}
