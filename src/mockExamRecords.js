export const skills = ['Kanji', 'Vocabulary', 'Grammar', 'Reading'];
export function questionSkill(question) {
  if (question.section !== 'Vocabulary') return question.section;
  return /kanji|orthography/i.test(question.type || '') || /^問題(?:Ⅰ|Ⅱ|II?|[１２12])$/.test(question.problem || question.type || '') ? 'Kanji' : 'Vocabulary';
}
export function scoreExam(questions, answers) {
  const scores = Object.fromEntries(skills.map(skill => [skill, { correct: 0, total: 0 }]));
  for (const question of questions) {
    const score = scores[questionSkill(question)];
    if (!score) continue;
    score.total++;
    if (answers[question.id] === question.answer) score.correct++;
  }
  return scores;
}
export function combinedScores(records) {
  return Object.fromEntries(skills.map(skill => [skill, records.reduce((sum, record) => ({ correct: sum.correct + (record.scores?.[skill]?.correct || 0), total: sum.total + (record.scores?.[skill]?.total || 0) }), { correct: 0, total: 0 })]));
}
export function skillSummary(score) {
  const { correct = 0, total = 0 } = score || {};
  const accuracy = total ? correct / total * 100 : null;
  return { correct, total, percent: accuracy === null ? null : Math.round(accuracy), status: accuracy === null ? 'Not tested' : accuracy >= 80 ? 'Strong' : accuracy < 60 ? 'Needs practice' : 'Developing' };
}
export function performanceView(records, view = 'latest', selectedId = '') {
  const ordered = [...records].sort((a, b) => b.completedAt - a.completedAt || String(a.id).localeCompare(String(b.id)));
  if (view === 'overall') return { scores: combinedScores(ordered), count: ordered.length, record: null, previous: null };
  const index = view === 'previous' ? Math.max(1, ordered.findIndex(record => record.id === selectedId)) : 0;
  const record = ordered[index] || null;
  return { scores: combinedScores(record ? [record] : []), count: record ? 1 : 0, record, previous: ordered[index + 1] || null };
}
