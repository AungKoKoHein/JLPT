import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { mockQuestions } from "./mockExamQuestions.js";
import { archivePracticeSets, shuffledQuestions } from "./mockExamArchivePractice.js";
import { createDecemberExam, createFocusedExam, focusedExamSkills } from "./decemberExam.js";
import { practiceText } from "./practiceText.js";
import ConfirmDialog from "./ConfirmDialog.jsx";
import StartStudyDialog from "./StartStudyDialog.jsx";
import StudySessionView from "./StudySessionView.jsx";
import QuestionPrompt from "./QuestionPrompt.jsx";
import StarAnswer from "./StarAnswer.jsx";
import { problemInstruction, scrollToQuestion, starLayout } from "./questionPresentation.js";

import { examRecordPath, localExamRecords, saveExamRecord } from "./mockExamStore.js";
import { StudyAccountContext } from "./StudyAccount.jsx";
import MockExamHistory, { SkillScores } from "./MockExamHistory.jsx";
import { scoreExam } from "./mockExamRecords.js";
import MockScoreReport from './MockScoreReport.jsx';
import useN3FlaggedQuestions from "./useN3FlaggedQuestions.jsx";
import { flaggedCollections } from "./n3FlaggedQuestions.js";
import './n3QuestionLayout.css';
import './mockExamDesign.css';
import useQuestionNavigation from './useQuestionNavigation.js';

const sections = ["Vocabulary", "Grammar", "Reading"];
const formatTime = (seconds) => `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
const extraExam = { id: "extra-mini", title: "Extra 24-question mini mock", questions: mockQuestions, sourceNote: "မေးခွန်း ၂၄ ခု ပါဝင်သော N3 အစမ်းစာမေးပွဲ။" };
const archiveQuestionPool = archivePracticeSets.flatMap((set) => set.questions);
const examChoices = [extraExam, createDecemberExam(), ...focusedExamSkills.map(skill => createFocusedExam(skill)), ...archivePracticeSets, { id: "random-60", title: "Random mixed mock · 60 questions", questions: shuffledQuestions(archiveQuestionPool), sourceNote: "N3 လေ့ကျင့်ခန်း လေးစုံမှ ကျပန်း ရွေးချယ်ထားသော မေးခွန်းများ။" }];

export default function MockExam() {
  const account = useContext(StudyAccountContext);
  const { questions: flaggedQuestions, isFlagged, toggleFlag, error: flagError } = useN3FlaggedQuestions();
  const attempt = useRef(null);
  const [recordStatus, setRecordStatus] = useState("");
  const [recordError, setRecordError] = useState(false);
  const saveRecord = async () => {
    const current = attempt.current;
    if (!current?.record || !current.path || current.saving || current.saved) return;
    current.saving = true;
    setRecordError(false);
    setRecordStatus("Saving exam record…");
    try {
      await saveExamRecord(current.path, current.record);
      current.saved = true;
      if (attempt.current === current) setRecordStatus(localExamRecords ? "Exam record saved in this browser for local testing." : "Exam record saved to your account.");
    } catch (error) {
      if (attempt.current !== current) return;
      setRecordError(true);
      setRecordStatus(String(error.code).toLowerCase().includes('permission')
        ? "Exam record was not saved: the database denied access. The updated exam database rules must be installed in the connected development environment before results with saved questions can be stored."
        : "Exam record could not be saved. Check your connection and retry before leaving.");
    } finally { current.saving = false; }
  };
  // Exam questions must not reveal readings through the global study controls.
  const showReadings = false;
  const showKanji = true;
  const display = text => practiceText(text, showReadings, showKanji);
  const [mode, setMode] = useState("intro");
  const [activeExam, setActiveExam] = useState(null);
  const [startSelection, setStartSelection] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [secondsLeft, setSecondsLeft] = useState(36 * 60);
  const [paused, setPaused] = useState(false);
  const [hideTimer, setHideTimer] = useState(false);
  const [reviewSection, setReviewSection] = useState("All");
  const [reviewIndex, setReviewIndex] = useState(0);
  const [confirmation, setConfirmation] = useState(null);
  const [arrangements, setArrangements] = useState({});
  const [navigationOpen, setNavigationOpen] = useState(false);
  const questionCard = useRef(null);
  useQuestionNavigation(questionCard, questionIndex, mode === "attempt");
  useEffect(() => { if (mode === "attempt") scrollToQuestion(questionCard.current); }, [mode, questionIndex]);


  useEffect(() => {
    if (mode !== "attempt" || paused) return undefined;
    const interval = window.setInterval(() => {
      setSecondsLeft((current) => current <= 1 ? 0 : current - 1);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [mode, paused]);
  useEffect(() => {
    if (mode === "attempt" && secondsLeft === 0) setMode("results");
  }, [mode, secondsLeft]);

  const examQuestions = activeExam?.questions || [];
  const examSections = sections.filter(section => examQuestions.some(question => question.section === section));
  const sectionLabel = activeExam?.skill || examSections.join(' · ');
  const examSeconds = activeExam?.durationMinutes ? activeExam.durationMinutes * 60 : examQuestions.length >= 60 ? 75 * 60 : examQuestions.length >= 24 ? 36 * 60 : 23 * 60;
  const question = examQuestions[questionIndex];
  const reviewQuestions = useMemo(
    () => examQuestions.map((item, index) => ({ ...item, index })).filter((item) => reviewSection === "All" || item.section === reviewSection),
    [examQuestions, reviewSection],
  );
  const reviewQuestion = reviewQuestions[Math.min(reviewIndex, reviewQuestions.length - 1)];
  const correctCounts = useMemo(() => sections.reduce((counts, section) => {
    const items = examQuestions.filter((item) => item.section === section);
    counts[section] = { correct: items.filter((item) => answers[item.id] === item.answer).length, total: items.length };
    return counts;
  }, {}), [answers, examQuestions]);
  const correctTotal = sections.reduce((total, section) => total + correctCounts[section].correct, 0);
  const answeredCount = Object.values(answers).filter(answer => answer != null).length;

  useEffect(() => {
    if (mode !== "results" || !attempt.current || attempt.current.record) return;
    const scores = scoreExam(examQuestions, answers);
    attempt.current.record = { examId: activeExam.id, examTitle: activeExam.title, completedAt: Date.now(), correct: correctTotal, total: examQuestions.length, scores, review: JSON.stringify({ questions: examQuestions, answers }) };
    if (attempt.current.path) saveRecord();
    else setRecordStatus("Sign in to save exam records.");
  }, [mode, answers, examQuestions, activeExam, correctTotal]);

  const startExam = (selection = activeExam) => {
    if (!selection) return;
    if (selection.flaggedSet) {
      selection = flaggedCollections(flaggedQuestions).find(exam => exam.id === selection.id);
      if (!selection?.questions.length) return;
    }
    const exam = selection.skill ? createFocusedExam(selection.skill) : selection.id === "dec-exam" ? createDecemberExam() : selection.id === "random-60" ? { ...selection, questions: shuffledQuestions(archiveQuestionPool) } : selection;
    attempt.current = { path: account?.uid ? examRecordPath(account.uid) : null };
    setRecordStatus("");
    setRecordError(false);
    setActiveExam(exam);
    setAnswers({});
    setArrangements({});
    setConfirmation(null);
    setQuestionIndex(0);
    setSecondsLeft(exam.durationMinutes ? exam.durationMinutes * 60 : exam.questions.length >= 60 ? 75 * 60 : exam.questions.length >= 24 ? 36 * 60 : 23 * 60);
    setPaused(false);
    setHideTimer(false);
    setMode("attempt");
  };
  const completeExam = () => {
    setConfirmation(null);
    setPaused(false);
    setMode("results");
    setReviewSection("All");
    setReviewIndex(0);
  };
  const finishExam = () => setConfirmation({ title: "Finish this exam?", message: `${answeredCount} of ${examQuestions.length} answered${answeredCount < examQuestions.length ? ` · ${examQuestions.length - answeredCount} unanswered` : ""}.`, confirmLabel: "Finish and view results", action: completeExam });

  if (mode === "intro") return (
    <article className="mock-exam-panel mock-exam-lobby">
      {startSelection && <StartStudyDialog title={startSelection.title} count={startSelection.questions.length} minutes={startSelection.durationMinutes || (startSelection.questions.length >= 60 ? 75 : startSelection.questions.length >= 24 ? 36 : 23)} onClose={() => setStartSelection(null)} onStart={() => { startExam(startSelection); setStartSelection(null); }} />}
      {recordError && <div role="alert"><p>{recordStatus}</p><button type="button" className="secondary-button" onClick={saveRecord}>Retry saving record</button></div>}
      <header className="mock-lobby-hero">
        <div><div className="mock-exam-eyebrow">JLPT N3 · EXAM PRACTICE</div><h2>နောက်တစ်ကြိမ် ပိုကောင်းအောင် ဖြေဆိုကြမယ်။</h2><p>စာမေးပွဲတစ်ခု ရွေးပြီး လေ့ကျင့်ရင်း ထပ်လေ့လာဖို့ လိုအပ်တဲ့အပိုင်းတွေကို ရှာဖွေပါ။</p></div>
        <span className="mock-lobby-symbol" aria-hidden="true"><svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="10" y="9" width="28" height="33" rx="5" /><rect x="18" y="5" width="12" height="8" rx="3" /><path d="m17 23 3 3 5-6m-8 14h14m-3-11h3" /></svg></span>
      </header>
      <div className="mock-lobby-history"><MockExamHistory uid={account?.uid} dashboard /></div>
      <div className="mock-lobby-section-heading"><h3>လေ့ကျင့်မည့် စာမေးပွဲကို ရွေးပါ</h3><p>အချိန်တို လေ့ကျင့်မှု၊ ကျွမ်းကျင်မှုတစ်ခုချင်း သို့မဟုတ် စာမေးပွဲအပြည့်ကို ရွေးနိုင်ပါသည်။</p></div>
      <section aria-label="Flagged exams"><h3>မှတ်သားထားသော မေးခွန်းများကို ပြန်လေ့လာရန်</h3><p>ပြန်လေ့လာရန် မှတ်သားထားသော မေးခွန်းများဖြင့်သာ ဖြေဆိုပါ။ မှတ်သားမှုများကို ဤဘရောက်ဇာတွင် သိမ်းထားပါသည်။</p><div className="mock-exam-set-grid">{flaggedCollections(flaggedQuestions).map(exam => <button type="button" className="mock-exam-set-card flagged-exam-card" key={exam.id} disabled={!exam.questions.length} onClick={() => startExam(exam)}><strong>{exam.title}</strong><span>{exam.questions.length} questions · {exam.durationMinutes} min</span></button>)}</div>{!flaggedQuestions.length && <p>ဤနေရာတွင် ပြန်လေ့လာနိုင်ရန် လေ့ကျင့်နေစဉ် သို့မဟုတ် ဖြေဆိုနေစဉ် မေးခွန်းကို မှတ်သားထားပါ။</p>}</section>
      {activeExam && <div className="mock-exam-actions">
        <button type="button" className="primary-button" onClick={() => startExam()}>Start {activeExam.title}</button>
      </div>}
      <div className="mock-exam-set-grid">{examChoices.map((exam) => <button type="button" key={exam.id} className={`mock-exam-set-card${activeExam?.id === exam.id ? " selected" : ""}`} aria-pressed={activeExam?.id === exam.id} onClick={() => { setActiveExam(exam); setStartSelection(exam); }}><strong>{exam.title}</strong><span>{exam.questions.length} questions · {exam.skill || 'Vocabulary, Grammar, Reading'}</span>{exam.id !== "extra-mini" && <small>{exam.sourceNote}</small>}</button>)}<button type="button" className="secondary-button mock-choose-another" onClick={() => { const others = examChoices.filter(exam => exam.id !== activeExam?.id); const choice = others[Math.floor(Math.random() * others.length)]; setActiveExam(choice); setStartSelection(choice); }}>Choose another test</button></div>
      {activeExam && <h3 className="mock-exam-selected-title">{activeExam.title}</h3>}
      {activeExam?.structure && <section className="exam-history" aria-label="Exam structure"><h3>ပုံစံတူ၊ မေးခွန်းအသစ်များ</h3><p>{activeExam.skill ? `${activeExam.questions.length} ခု ပါဝင်သော ${activeExam.skill} မေးခွန်းများ။ စတင်ချိန်နှင့် ပြန်ဖြေချိန်တိုင်း မေးခွန်းအသစ်များကို ရွေးချယ်ပေးပါသည်။` : 'မေးခွန်း ၇၄ ခု — ဝေါဟာရ (ခန်းဂျီးအပါအဝင်) ၄၇%၊ သဒ္ဒါ ၃၁%၊ စာဖတ် ၂၂%။ အရေးဖြေ လေ့ကျင့်မှုသာဖြစ်ပြီး နားထောင်ခြင်း မပါဝင်ပါ။'}</p><div className="exam-skill-grid">{examSections.map(section => <div className="exam-skill" key={section}><strong>{activeExam.skill || section}</strong>{activeExam.structure.filter(group => group.section === section).map(group => <span key={group.type}>{group.type}: {group.count}</span>)}</div>)}</div><p>အမျိုးအစားတစ်ခုစီမှ မေးခွန်းများကို ကျပန်းရွေးချယ်ပါသည်။ စာပိုဒ်နှင့် သက်ဆိုင်ရာ မေးခွန်းများကို အတူတကွ ထားရှိပါသည်။</p></section>}

      {activeExam && <div className="mock-exam-overview">
        <div><strong>{activeExam.questions.length}</strong><span>N3 practice questions</span></div>
        <div><strong>{examSeconds / 60} min</strong><span>practice timer</span></div>
        <div><strong>{activeExam.skill ? "1 skill" : `${examSections.length} sections`}</strong><span>{sectionLabel}</span></div>
      </div>}
    </article>
  );

  if (mode === "results") {
    const item = reviewQuestion || examQuestions[0];
    return (
      <StudySessionView label="Mock exam" onQuit={() => setMode("intro")}><article className="mock-exam-panel mock-results">
        <MockScoreReport title={activeExam.title} completedAt={attempt.current?.record?.completedAt} questions={examQuestions} answers={answers} />
        <section aria-label="Current exam strengths and weaknesses">
          <h3>Current exam strengths and weaknesses</h3>
          <SkillScores scores={scoreExam(examQuestions, answers)} />
        </section>
        <p role="status">{recordStatus}</p>
        {recordError && <button type="button" className="secondary-button" onClick={saveRecord}>Retry saving record</button>}
        <div className="mock-review-heading">
          <div><h3>Answer review</h3></div>
          <label>Section <select value={reviewSection} onChange={(event) => { setReviewSection(event.target.value); setReviewIndex(0); }}><option>All</option>{sections.map((section) => <option key={section}>{section}</option>)}</select></label>
        </div>
        <div className="mock-review-layout">
          <nav className="mock-review-nav" aria-label="Review questions">
            {reviewQuestions.map((entry, index) => <button type="button" className={index === reviewIndex ? "current" : ""} key={entry.id} onClick={() => setReviewIndex(index)} aria-label={`Review question ${entry.index + 1}`}>
              {entry.index + 1}<span className={answers[entry.id] === entry.answer ? "review-correct" : "review-incorrect"} aria-label={answers[entry.id] === entry.answer ? "Correct" : "Incorrect or unanswered"}>{answers[entry.id] === entry.answer ? "✓" : "×"}</span>
            </button>)}
          </nav>
          <section className="mock-question-card">
            <div className="mock-question-meta"><span>{item.section}</span><span>{display(item.type)}</span><strong>Question {reviewQuestion.index + 1} of {examQuestions.length}</strong></div>
            {problemInstruction(item) && <p className="mock-problem-instruction" lang="ja">{display(problemInstruction(item))}</p>}
            {item.passage && <div className="mock-reading-passage" lang="ja">{display(item.passage)}</div>}
            <h4 lang="ja"><QuestionPrompt question={item} showReadings={showReadings} showKanji={showKanji} /></h4>
            {item.target && !item.prompt.includes(item.target) && <p className="mock-target" lang="ja">{display(item.target)}</p>}
            <div className="mock-review-options">{item.choices.map((choice, index) => {
              const selected = answers[item.id] === index;
              const correct = item.answer === index;
              return <div key={index} className={`mock-review-option${correct ? " correct" : ""}${selected && !correct ? " incorrect" : ""}`}><span className="mock-option-letter">{"ABCD"[index]}</span><span lang="ja">{display(choice)}</span></div>;
            })}</div>
            <p className="mock-explanation" lang="my"><strong>ရှင်းလင်းချက် — </strong>{display(item.explanation)}</p>
            <div className="mock-review-controls"><button type="button" className="secondary-button" disabled={reviewIndex === 0} onClick={() => setReviewIndex((index) => index - 1)}>← Previous</button><span>{reviewIndex + 1} / {reviewQuestions.length}</span><button type="button" className="secondary-button" disabled={reviewIndex === reviewQuestions.length - 1} onClick={() => setReviewIndex((index) => index + 1)}>Next →</button></div>
          </section>
        </div>
        <div className="mock-exam-actions"><button type="button" className="primary-button" onClick={() => startExam(activeExam)}>Try again</button><button type="button" className="secondary-button" onClick={() => { setMode("intro"); setActiveExam(null); }}>Choose another test</button></div>
      </article></StudySessionView>
    );
  }

  return (
    <StudySessionView label="Mock exam" onQuit={() => setConfirmation({ title: "Quit this exam?", message: "Your current answers will be cleared when you start another exam.", confirmLabel: "Quit exam", action: () => { setConfirmation(null); setMode("intro"); } })}><article className="mock-exam-panel mock-attempt n3-letter-layout">
      <div className="mock-exam-topline">
        <div><div className="mock-exam-eyebrow">JLPT N3 · {activeExam.title}</div><h2>Question {questionIndex + 1} of {examQuestions.length}</h2></div>
        <div className="mock-timer-block">
          {!hideTimer && <div className={`mock-timer${secondsLeft < 300 ? " low-time" : ""}`} aria-live="off"><span>Time remaining</span><strong>{formatTime(secondsLeft)}</strong></div>}
          <div className="mock-timer-controls"><button type="button" className="secondary-button" onClick={() => setPaused((value) => !value)}>{paused ? "Resume" : "Pause"} timer</button><button type="button" className="secondary-button" onClick={() => { setSecondsLeft(examSeconds); setPaused(false); }}>Reset timer</button></div>
          <label className="mock-hide-timer"><input type="checkbox" checked={hideTimer} onChange={(event) => setHideTimer(event.target.checked)} /> Hide timer</label>
        </div>
      </div>
      <div className="mock-progress" aria-label={`Question ${questionIndex + 1} of ${examQuestions.length}`}><div style={{ width: `${((questionIndex + 1) / examQuestions.length) * 100}%` }} /></div>
      <div className="mock-attempt-grid">
        <section className="mock-question-card mock-split-question" aria-label={`Question ${questionIndex + 1}`} ref={questionCard} tabIndex={-1}><div className="practice-prompt-panel">
          <div className="n3-question-header"><div className="mock-question-meta"><span>{question.section}</span><span>{display(question.type)}</span><strong>Answered {answeredCount} / {examQuestions.length}</strong></div>
        <aside className="mock-question-nav">
          <details className="mock-navigation-drawer" open={navigationOpen} onToggle={event => setNavigationOpen(event.currentTarget.open)}>
          <summary>Question navigation <span>{answeredCount} / {examQuestions.length}</span></summary>
          <div className="mock-question-palette">{examQuestions.map((item, index) => <button type="button" key={item.id} className={`${index === questionIndex ? "current " : ""}${answers[item.id] != null ? "answered " : ""}${isFlagged(item) ? "flagged" : ""}`} onClick={() => setQuestionIndex(index)} aria-label={`Question ${index + 1}${answers[item.id] != null ? ", answered" : ", unanswered"}${isFlagged(item) ? ", flagged for review" : ""}`}>
            {index + 1}{isFlagged(item) && <span aria-hidden="true">⚑</span>}
          </button>)}</div>
          <div className="mock-nav-legend"><span><i className="answered" /> Answered</span><span><i className="flagged" /> Flagged</span></div>
          </details>
        </aside></div>
          {problemInstruction(question) && <p className="mock-problem-instruction" lang="ja">{display(problemInstruction(question))}</p>}
          {question.passage && <div className="mock-reading-passage" lang="ja">{display(question.passage)}</div>}
          <h3 lang="ja"><QuestionPrompt question={question} showReadings={showReadings} showKanji={showKanji} /></h3>
          {question.target && !question.prompt.includes(question.target) && <p className="mock-target" lang="ja">{display(question.target)}</p>}
          {!starLayout(question.prompt) && <ol className="n3-source-options" type="A" lang="ja">{question.choices.map((choice, index) => <li key={index}>{display(choice)}</li>)}</ol>}
          </div><div className="practice-response-panel"><div className="practice-response-heading"><strong>အဖြေကို ရွေးပါ</strong><span>Exam mode</span></div>
          {starLayout(question.prompt) ? <StarAnswer key={question.id} question={question} value={arrangements[question.id]} display={display} onChange={(order, answer) => { setArrangements(current => ({ ...current, [question.id]: order })); setAnswers(current => ({ ...current, [question.id]: answer })); }} /> : <fieldset className={`mock-answer-list${question.choices.every(choice => choice.length <= 45) ? " mock-short-answers" : ""}`}>
            <legend>အဖြေတစ်ခု ရွေးပါ</legend>
            {question.choices.map((choice, index) => <label key={index} className={`mock-answer-option${answers[question.id] === index ? " selected" : ""}`}>
              <input type="radio" name={`question-${question.id}`} checked={answers[question.id] === index} onChange={() => setAnswers((current) => ({ ...current, [question.id]: index }))} />
              <span className="mock-option-letter">{"ABCD"[index]}</span><span className="n3-answer-accessible" lang="ja">{display(choice)}</span>
            </label>)}
          </fieldset>}
          <div className="mock-question-actions"><label className="mock-flag"><input type="checkbox" checked={isFlagged(question)} onChange={() => toggleFlag(question)} /> Flag for review</label><button type="button" className="text-button" onClick={() => { setAnswers((current) => { const next = { ...current }; delete next[question.id]; return next; }); setArrangements(current => { const next = { ...current }; delete next[question.id]; return next; }); }} disabled={answers[question.id] == null}>Clear answer</button></div>
          {flagError && <p role="alert">{flagError}</p>}
          <div className="mock-navigation-controls"><button type="button" className="secondary-button" disabled={questionIndex === 0} onClick={() => setQuestionIndex((index) => index - 1)}>← Back</button><span>{questionIndex + 1} / {examQuestions.length}</span>{questionIndex < examQuestions.length - 1 ? <button type="button" className="primary-button" onClick={() => setQuestionIndex((index) => index + 1)}>Next →</button> : <button type="button" className="primary-button" onClick={finishExam}>Finish exam</button>}</div>
          {questionIndex < examQuestions.length - 1 && <button type="button" className="mock-finish-button" onClick={finishExam}>Finish exam</button>}
          </div>
        </section>

      </div>
      {confirmation && <ConfirmDialog title={confirmation.title} message={confirmation.message} confirmLabel={confirmation.confirmLabel} onClose={() => setConfirmation(null)} onConfirm={confirmation.action} />}
    </article></StudySessionView>
  );
}
