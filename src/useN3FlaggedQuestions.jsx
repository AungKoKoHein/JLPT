import { useContext, useEffect, useState } from 'react';
import { StudyAccountContext } from './StudyAccount.jsx';
import { flaggedQuestionKey, flaggedQuestionSnapshot } from './n3FlaggedQuestions.js';

const eventName = 'n3-flagged-questions-changed';
function read(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(value) ? value.filter(q => q && q.id != null && typeof q.prompt === 'string' && Array.isArray(q.choices)) : [];
  } catch { return []; }
}

export default function useN3FlaggedQuestions() {
  const account = useContext(StudyAccountContext);
  const key = `jlpt:n3:flagged:${account?.uid || 'guest'}`;
  const [saved, setSaved] = useState(() => ({ key, questions: read(key) }));
  const questions = saved.key === key ? saved.questions : read(key);
  const [error, setError] = useState('');
  useEffect(() => {
    const update = () => setSaved({ key, questions: read(key) });
    update();
    window.addEventListener(eventName, update);
    window.addEventListener('storage', update);
    return () => { window.removeEventListener(eventName, update); window.removeEventListener('storage', update); };
  }, [key]);
  const isFlagged = question => questions.some(q => flaggedQuestionKey(q) === flaggedQuestionKey(question));
  const toggleFlag = question => {
    const current = read(key);
    const id = flaggedQuestionKey(question);
    const next = current.some(q => flaggedQuestionKey(q) === id)
      ? current.filter(q => flaggedQuestionKey(q) !== id) : [...current, flaggedQuestionSnapshot(question)];
    try {
      localStorage.setItem(key, JSON.stringify(next));
      setError('');
      window.dispatchEvent(new Event(eventName));
    } catch { setError('Could not save this flag. Browser storage may be full or unavailable.'); }
  };
  return { questions, isFlagged, toggleFlag, error };
}
