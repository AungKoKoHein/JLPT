export const flaggedQuestionKey = question => String(question.sourceQuestionId || question.id);

export function flaggedQuestionSnapshot(question) {
  const section = question.section || (question.topic === 'Vocabulary' ? 'Vocabulary' : question.number >= 24 ? 'Reading' : 'Grammar');
  return { ...question, number: question.number ?? question.id, topic: question.topic || section, section, type: question.type || question.problem || section };
}

export function flaggedCollections(questions) {
  return [
    { id: 'flagged-all', label: 'Flagged Questions', questions },
    { id: 'flagged-vocabulary', label: 'Flagged Vocabulary', questions: questions.filter(q => q.section === 'Vocabulary') },
    { id: 'flagged-grammar', label: 'Flagged Grammar', questions: questions.filter(q => q.section === 'Grammar') },
  ].map(set => ({ ...set, title: set.label, flaggedSet: true, durationMinutes: Math.max(5, Math.ceil(set.questions.length * 1.5)), sourceNote: 'Your flagged questions saved in this browser.' }));
}
