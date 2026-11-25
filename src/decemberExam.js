import bank from './n3PracticeBank.json' with { type: 'json' };
import { practiceCategories } from './practiceCategories.js';
import { readingCollections } from './readingCollections.js';
import { starLayout } from './questionPresentation.js';
import { textGrammarPassages } from './textGrammarPassages.js';
import { questionSkill } from './mockExamRecords.js';

const valid = q => q.individualItem && Number.isInteger(q.answer) && q.answer >= 0 && q.answer < 4 && q.choices.length === 4 && q.choices.every(c => c.trim() && !/^[①②③④]$/.test(c));
const practice = practiceCategories(bank).flatMap(set => set.questions);
const problemNumber = q => ({ I: 1, II: 2, III: 3, IV: 4, V: 5 }[q.problem?.normalize('NFKC').replace(/^問題\s*/, '')] || Number(q.problem?.normalize('NFKC').replace(/^問題\s*/, '')));
export const decemberExamStructure = [
  { section: 'Vocabulary', type: 'Kanji reading', count: 8, problem: 1 },
  { section: 'Vocabulary', type: 'Orthography', count: 6, problem: 2 },
  { section: 'Vocabulary', type: 'Context vocabulary', count: 11, problem: 3 },
  { section: 'Vocabulary', type: 'Paraphrase', count: 5, problem: 4 },
  { section: 'Vocabulary', type: 'Word usage', count: 5, problem: 5 },
  { section: 'Grammar', type: 'Grammar forms', count: 13 },
  { section: 'Grammar', type: 'Sentence order · ★', count: 5 },
  { section: 'Grammar', type: 'Text grammar', count: 5 },
  { section: 'Reading', type: 'Short passage', count: 4 },
  { section: 'Reading', type: 'Mid-size passage', count: 6 },
  { section: 'Reading', type: 'Long passage', count: 4 },
  { section: 'Reading', type: 'Information retrieval', count: 2 },
];
function sample(items, count, random) {
  if (items.length < count) throw new Error(`Not enough questions for the December exam: need ${count}, found ${items.length}.`);
  const pool = [...items];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}
const textGroups = textGrammarPassages.map(passage => bank.find(set => set.id === passage.setId).questions
  .filter(q => q.topic === 'Grammar & reading' && q.number >= 19 && q.number <= 23)
  .sort((a, b) => a.number - b.number)
  .map(q => ({ ...q, passage: passage.text, passageId: `${passage.setId}-text-grammar` })))
  .filter(group => group.length === 5 && group.every(valid));
const passages = readingCollections.flatMap(set => set.passages)
  .filter(p => p.text && p.questions.every(valid));

export function createDecemberExam(random = Math.random) {
  const questions = decemberExamStructure.flatMap(group => {
    let selected;
    if (group.section === 'Vocabulary') {
      selected = sample(practice.filter(q => q.topic === 'Vocabulary' && valid(q) && problemNumber(q) === group.problem), group.count, random);
    } else if (group.type === 'Text grammar') {
      selected = sample(textGroups, 1, random)[0];
    } else if (group.section === 'Grammar') {
      const sentenceOrder = group.type === 'Sentence order · ★';
      selected = sample(practice.filter(q => q.topic === 'Grammar & reading' && valid(q) && problemNumber(q) === (sentenceOrder ? 2 : 1) && Boolean(starLayout(q.prompt)) === sentenceOrder), group.count, random);
    } else {
      // Draw complete passages: four short, two medium, one long, one lookup.
      const perPassage = { 'Short passage': 1, 'Mid-size passage': 3, 'Long passage': 4, 'Information retrieval': 2 }[group.type];
      selected = sample(passages.filter(p => p.type === group.type && p.questions.length === perPassage), group.count / perPassage, random)
        .flatMap(p => [...p.questions].sort((a, b) => a.number - b.number).map(q => ({ ...q, passage: p.text, passageId: p.id })));
    }
    return selected.map(q => ({ ...q, section: group.section, type: group.type }));
  });
  return { id: 'dec-exam', title: 'For Dec Exam', durationMinutes: 100,
    sourceNote: 'Random N3 written mock · fixed question-type structure · 35 vocabulary, 23 grammar, 16 reading · listening not included',
    structure: decemberExamStructure, questions };
}

export const focusedExamSkills = ['Vocabulary', 'Grammar', 'Reading', 'Kanji'];
export function createFocusedExam(skill, random = Math.random) {
  if (!focusedExamSkills.includes(skill)) throw new Error(`Unknown exam skill: ${skill}`);
  const exam = createDecemberExam(random);
  const questions = exam.questions.filter(question => questionSkill(question) === skill);
  const structure = exam.structure.filter(group => questions.some(question => question.section === group.section && question.type === group.type));
  return {
    id: `focused-${skill.toLowerCase()}`, title: `${skill} Exam`, skill,
    durationMinutes: { Vocabulary: 20, Grammar: 30, Reading: 35, Kanji: 15 }[skill],
    sourceNote: `Random ${skill.toLowerCase()} questions from the N3 practice bank. Fresh questions each time.`,
    structure, questions,
  };
}
