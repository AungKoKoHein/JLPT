import originals from './readingPassages.js';
import extracted from './pdfReadingPassages.json' with { type: 'json' };
import { pdfReadingSets } from './pdfReadingSets.js';

export const readingCollections = pdfReadingSets.map(set => {
  const source = extracted.find(item => item.id === set.id);
  const remaining = new Map(set.questions.map(q => [q.id, q]));
  const passages = [];
  for (const passage of source?.passages || []) {
    const questions = passage.questions.filter(q => remaining.has(q.id)).map(q => ({ ...remaining.get(q.id), ...q }));
    if (!questions.length) continue;
    questions.forEach(q => remaining.delete(q.id));
    passages.push({ ...passage, questions });
  }
  for (const question of remaining.values()) {
    const shared = passages.find(p => p.sourcePages.includes(question.sourcePage)
      && question.number >= p.questions[0].number
      && question.number <= p.questions.at(-1).number + 1);
    if (shared) {
      shared.questions.push(question);
      shared.questions.sort((a, b) => a.number - b.number);
      continue;
    }
    passages.push({ id: `${question.id}-passage`, title: `${set.title} · Q${question.number}`,
      type: 'Source passage', text: '', sourcePages: [question.sourcePage], questions: [question] });
  }
  passages.sort((a, b) => a.questions[0].number - b.questions[0].number);
  return { ...set, passages };
});

export const originalReadingCollection = { id: 'original', title: 'Original practice', passages: originals };
