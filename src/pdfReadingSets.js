import bank from './n3PracticeBank.json' with { type: 'json' };
import { practiceCategories } from './practiceCategories.js';

// Standard booklets place reading comprehension after grammar Q1–23.
// N3-22 has a different layout and its reading items still await extraction.
export const pdfReadingSets = practiceCategories(bank)
  .filter(set => set.id !== 'n3-22')
  .map(set => ({ ...set, questions: set.questions
    .filter(q => q.topic === 'Grammar & reading' && q.number >= 24)
    .map(q => ({ ...q, openSource: true })) }))
  .filter(set => set.questions.length);

export const pdfReadingQuestionCount = pdfReadingSets.reduce((total, set) => total + set.questions.length, 0);
