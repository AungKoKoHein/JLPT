import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import ConfirmDialog from './ConfirmDialog.jsx';
import QuestionPrompt from './QuestionPrompt.jsx';
import { practiceText } from './practiceText.js';
import { deleteExamRecord, localExamRecords, subscribeExamRecords } from './mockExamStore.js';
import { performanceView, skills, skillSummary } from './mockExamRecords.js';
import MockScoreReport from './MockScoreReport.jsx';

const completedDate = record => new Date(record.completedAt).toLocaleString();
function reportReview(record) {
  try {
    const review=JSON.parse(record.review||'null');
    return {questions:review?.questions||[],answers:review?.answers||{}};
  } catch { return {}; }
}
export function SkillScores({ scores, comparison = null }) {
  return <div className="exam-skill-grid">{skills.map(skill => {
    const { correct, total, percent, status } = skillSummary(scores[skill]);
    const previous = skillSummary(comparison?.[skill]);
    const change = percent !== null && previous.percent !== null ? percent - previous.percent : null;
    return <div className="exam-skill" key={skill}><strong>{skill}</strong><span>{total ? `${percent}% · ${correct}/${total}` : 'မေးခွန်း မရှိသေးပါ'}</span><progress max="100" value={percent ?? 0} aria-label={`${skill} accuracy`} /><span>{status}</span>{comparison && <small>{change === null ? 'ယခင်စာမေးပွဲတွင် နှိုင်းယှဉ်နိုင်သော အမှတ် မရှိပါ' : change === 0 ? 'ယခင်စာမေးပွဲနှင့် အမှတ်တူပါသည်' : `${change > 0 ? '+' : ''}${change} percentage points from the earlier exam`}</small>}</div>;
  })}</div>;
}
export function OverallPerformance({ records }) {
  const overall = performanceView(records, 'overall');
  return <section className="exam-overall-performance" aria-label="Overall performance">{overall.count > 0 && <p>Overall ? {overall.count} completed {overall.count === 1 ? 'exam' : 'exams'}</p>}<SkillScores scores={overall.scores} /></section>;
}
function SavedExamReview({ record }) {
  const [index, setIndex] = useState(0);
  let review;
  try { review = JSON.parse(record.review || 'null'); } catch { review = null; }
  if (!review?.questions?.length) return <p>ဤစာမေးပွဲဟောင်းအတွက် မေးခွန်းများ သိမ်းဆည်းထားခြင်း မရှိပါ။ ယခုမှ ပြီးဆုံးသော စာမေးပွဲများတွင် မေးခွန်းများကို ပြန်ကြည့်နိုင်ပါသည်။</p>;
  const question = review.questions[index];
  const selected = review.answers?.[question.id];
  const display = text => practiceText(text || '', false, true);
  return <section className="mock-question-card" aria-label="Saved exam questions">
    <h4>Question {index + 1} of {review.questions.length} · {question.section}</h4>
    {question.passage && <div className="mock-reading-passage" lang="ja">{display(question.passage)}</div>}
    <h4 lang="ja"><QuestionPrompt question={question} /></h4>
    {question.target && <p lang="ja">{display(question.target)}</p>}
    <p>{selected == null ? 'You did not answer this question.' : `Your answer: ${'ABCD'[selected]}`}</p>
    <div className="mock-review-options saved-exam-options">{question.choices.map((choice, option) => <div key={option} className={`mock-review-option${option === question.answer ? ' correct' : ''}${option === selected && option !== question.answer ? ' incorrect' : ''}`}><span>{'ABCD'[option]}. {display(choice)}{option === question.answer ? ' — Correct answer' : ''}{option === selected ? ' — Your answer' : ''}</span></div>)}</div>
    {question.explanation && <p className="mock-explanation">{display(question.explanation)}</p>}
    <div className="mock-review-controls"><button type="button" className="secondary-button" disabled={index === 0} onClick={() => setIndex(index - 1)}>Previous question</button><span>{index + 1} / {review.questions.length}</span><button type="button" className="secondary-button" disabled={index === review.questions.length - 1} onClick={() => setIndex(index + 1)}>Next question</button></div>
  </section>;
}
export function ExamPerformance({ records, onDelete, deletingId = '', initialView = 'latest', hideViewButtons = false }) {
  const [view, setView] = useState(initialView);
  const [selectedId, setSelectedId] = useState('');
  const [reviewId, setReviewId] = useState('');
  const ordered = [...records].sort((a, b) => b.completedAt - a.completedAt || String(a.id).localeCompare(String(b.id)));
  const result = performanceView(ordered, view, selectedId);
  const older = ordered.slice(1);
  if (!ordered.length) return <p>Complete a mock exam to start your personal history and skill breakdown.</p>;
  const showRecord = record => {
    setReviewId(current => current === record.id ? '' : record.id);
    setSelectedId(record.id);
    setView(record.id === ordered[0].id ? 'latest' : 'previous');
  };
  return <>
    {!hideViewButtons && <div className="exam-history-views" role="group" aria-label="Performance period">{[['latest', 'Latest exam'], ['previous', 'Previous exams']].map(([value, label]) => <button type="button" className={view === value ? 'primary-button' : 'secondary-button'} aria-pressed={view === value} key={value} onClick={() => setView(value)}>{label}</button>)}</div>}
    {view === 'previous' && older.length > 0 && <label className="exam-history-select">Choose a previous exam<select value={result.record?.id || ''} onChange={event => setSelectedId(event.target.value)}>{older.map(record => <option key={record.id} value={record.id}>{completedDate(record)} · {record.examTitle}</option>)}</select></label>}
    <div className="exam-performance-detail" aria-live="polite">
      <h4>{view === 'previous' ? 'Previous exam strengths and weaknesses' : 'Latest exam strengths and weaknesses'}</h4>
      {!result.count ? <p>No previous exams yet. Complete another exam to compare your performance.</p> : <>
        <p>{view === 'overall' ? `ပြီးဆုံးခဲ့သော စာမေးပွဲ ${result.count} ခု၏ ရလဒ်ဖြစ်ပြီး ကျွမ်းကျင်မှုတစ်ခုစီရှိ မေးခွန်းအရေအတွက်အလိုက် တွက်ချက်ထားပါသည်။` : `${result.record.examTitle} · ${completedDate(result.record)} · ${result.record.correct}/${result.record.total} correct`}</p>
        {result.previous && <p>Changes compare this exam with {result.previous.examTitle} on {completedDate(result.previous)}.</p>}
        <SkillScores scores={result.scores} comparison={result.previous?.scores} />
        {reviewId === result.record.id && <><MockScoreReport title={result.record.examTitle} completedAt={result.record.completedAt} scores={result.record.scores} reportId={result.record.id} {...reportReview(result.record)} /><SavedExamReview key={result.record.id} record={result.record} /></>}
      </>}
    </div>
    <p>၈၀% နှင့်အထက် — အားကောင်း၊ ၆၀–၇၉% — တိုးတက်ဆဲ၊ ၆၀% အောက် — ထပ်လေ့ကျင့်ရန် လိုအပ်။ မဖြေထားသော မေးခွန်းများကို အမှားအဖြစ် သတ်မှတ်ပါသည်။ ဤရလဒ်သည် တရားဝင် JLPT အမှတ် မဟုတ်ပါ။</p>
    <h4>All completed exams</h4>
    <div className="practice-user-table-wrap"><table className="practice-user-table"><thead><tr><th>Completed</th><th>Exam</th><th>Score</th>{skills.map(skill => <th key={skill}>{skill}</th>)}<th>Breakdown</th></tr></thead><tbody>{ordered.map(record => <tr key={record.id}><td>{completedDate(record)}</td><td>{record.examTitle}</td><td>{record.correct} / {record.total}</td>{skills.map(skill => {
      const summary = skillSummary(record.scores?.[skill]);
      return <td key={skill}>{summary.percent === null ? 'Not tested' : <>{summary.percent}%<small>{summary.status}</small></>}</td>;
    })}<td><div className="exam-record-actions"><button type="button" className="secondary-button" onClick={() => showRecord(record)} aria-expanded={reviewId === record.id && result.record?.id === record.id} aria-label={`View skill breakdown for ${record.examTitle} on ${completedDate(record)}`}>View skills</button>{onDelete && <button type="button" className="secondary-button" disabled={Boolean(deletingId)} onClick={() => onDelete(record)} aria-label={`Delete ${record.examTitle} on ${completedDate(record)}`}>{deletingId === record.id ? 'Deleting…' : 'Delete'}</button>}</div></td></tr>)}</tbody></table></div>
  </>;
}
function ExamHistoryModal({ view, onClose, children }) {
  const dialog = useRef(null);
  useEffect(() => {
    const previousFocus = document.activeElement;
    const overflow = document.body.style.overflow;
    const modal = dialog.current;
    modal.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      modal.close();
      document.body.style.overflow = overflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);
  return createPortal(<dialog ref={dialog} className="exam-history-modal mock-exam-panel" aria-labelledby="exam-history-title" onCancel={event => { event.preventDefault(); onClose(); }}>
    <header className="exam-history-modal-header"><h2 id="exam-history-title">{view === 'latest' ? 'Latest exam' : 'Previous exams'}</h2><button type="button" className="secondary-button" onClick={onClose} autoFocus>Close</button></header>
    {children}
  </dialog>, document.body);
}
export default function MockExamHistory({ uid, overallOnly = false, dashboard = false }) {
  const [modalView, setModalView] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deletingId, setDeletingId] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const deleteRecord = async () => {
    const record = pendingDelete;
    setPendingDelete(null);
    setDeletingId(record.id);
    setDeleteError('');
    try { await deleteExamRecord(uid, record.id); }
    catch (error) { setDeleteError(String(error.code).toLowerCase().includes('permission')
      ? 'The database denied deletion. This result has not been deleted. The updated exam database rules must be installed in the connected development environment to allow deletion.'
      : 'Could not delete the exam. The result has not been deleted. Please check your connection and try again.'); }
    finally { setDeletingId(''); }
  };
  const [state, setState] = useState({ uid: null, records: [], loading: true, error: '' });
  useEffect(() => {
    if (!uid) return;
    setState({ uid, records: [], loading: true, error: '' });
    return subscribeExamRecords(uid, records => setState({ uid, records, loading: false, error: '' }), () => setState({ uid, records: [], loading: false, error: localExamRecords ? 'Could not load local exam records. Check that browser storage is available.' : 'Could not load exam history. Please check your connection and try again.' }));
  }, [uid]);
  if (!uid) return <p>စာမေးပွဲမှတ်တမ်းများ သိမ်းဆည်းရန် အကောင့်ဝင်ပါ။</p>;
  if (state.uid !== uid || state.loading) return <p role="status">Loading your exam history…</p>;
  if (state.error) return <p role="alert">{state.error}</p>;
  if (overallOnly) return <OverallPerformance records={state.records} />;
  if (dashboard) return <>
    <div className="exam-history-topbar">
      {localExamRecords && <p>စမ်းသပ်မှတ်တမ်းများကို ဤဘရောက်ဇာတွင် သိမ်းဆည်းပါသည်။ အကောင့်ရှိ မူရင်းမှတ်တမ်းများကို မပြောင်းလဲပါ။</p>}
      <div className="exam-history-top-actions" role="group" aria-label="Exam records">
        <button type="button" className="secondary-button" aria-haspopup="dialog" onClick={() => setModalView('latest')}>Latest exam</button>
        <button type="button" className="secondary-button" aria-haspopup="dialog" onClick={() => setModalView('previous')}>Previous exams</button>
      </div>
    </div>
    <OverallPerformance records={state.records} />
    {modalView && <ExamHistoryModal key={modalView} view={modalView} onClose={() => { setModalView(null); setPendingDelete(null); }}>
      {deleteError && <p role="alert">{deleteError}</p>}
      <ExamPerformance key={uid} records={state.records} initialView={modalView} hideViewButtons onDelete={setPendingDelete} deletingId={deletingId} />
    </ExamHistoryModal>}
    {pendingDelete && <ConfirmDialog title="Delete completed exam?" message={`Delete ${pendingDelete.examTitle}, its result and saved questions? Overall performance will be recalculated. This cannot be undone.`} confirmLabel="Delete exam" onConfirm={deleteRecord} onClose={() => setPendingDelete(null)} />}
  </>;
  return <section className="exam-history"><h3>Your exam records</h3>{deleteError && <p role="alert">{deleteError}</p>}<ExamPerformance key={uid} records={state.records} onDelete={setPendingDelete} deletingId={deletingId} />{pendingDelete && <ConfirmDialog title="Delete completed exam?" message={`Delete ${pendingDelete.examTitle}, its result and saved questions? Overall performance will be recalculated. This cannot be undone.`} confirmLabel="Delete exam" onConfirm={deleteRecord} onClose={() => setPendingDelete(null)} />}</section>;
}
