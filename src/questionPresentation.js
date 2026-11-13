import presentation from './practicePresentation.json' with { type: 'json' };
import instructions from './practiceInstructions.json' with { type: 'json' };

export function promptUnderlines(question) {
  const entry = presentation[question.sourceQuestionId || question.id];
  return entry?.prompt === question.prompt ? entry.underlines : [];
}

export function starLayout(prompt = '') {
  if (!/[★☆]/.test(prompt)) return null;
  const slots = [...prompt.matchAll(/[_＿]*[★☆][_＿]*|[_＿]{2,}/g)];
  if (slots.length !== 4) return null;
  const starIndex = slots.findIndex(slot => /[★☆]/.test(slot[0]));
  return { slots: slots.map(slot => ({ start: slot.index, end: slot.index + slot[0].length })), starIndex };
}

export function scrollToQuestion(element) {
  requestAnimationFrame(() => element?.scrollIntoView({ block: 'start', behavior: 'instant' }));
}

export function problemHeading(problem = '') {
  const value = problem.normalize('NFKC').replace(/^問題\s*/, '').trim();
  const roman = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10 };
  const number = roman[value] || (/^\d+$/.test(value) ? Number(value) : null);
  return number ? `問題 ${number}` : problem || 'Questions';
}

export function problemInstruction(question) {
  const sourceId = String(question.sourceQuestionId || question.id || '');
  const source = sourceId.match(/^(n3-\d+)-(vocabulary|grammar)-/);
  const number = problemHeading(question.problem).match(/^問題 (\d+)$/)?.[1];
  return (source && number && instructions[`${source[1]}:${source[2]}:${number}`]) || question.problem || '';
}

export function practiceQuestionGroups(questions) {
  const groups = new Map();
  questions.forEach((question, index) => {
    const label = problemHeading(question.problem);
    const key = `${question.topic}:${label}`;
    if (!groups.has(key)) groups.set(key, { key, topic: question.topic, label, questions: [] });
    groups.get(key).questions.push({ question, index });
  });
  return [...groups.values()];
}
