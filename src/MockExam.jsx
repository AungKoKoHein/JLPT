import React, { useEffect, useMemo, useRef, useState } from "react";
import { mockQuestions } from "./mockExamQuestions.js";
import { archivePracticeSets, shuffledQuestions } from "./mockExamArchivePractice.js";
import { createDecemberExam } from "./decemberExam.js";
import { practiceText } from "./practiceText.js";
import ConfirmDialog from "./ConfirmDialog.jsx";
import StudySessionView from "./StudySessionView.jsx";
import QuestionPrompt from "./QuestionPrompt.jsx";
import StarAnswer from "./StarAnswer.jsx";
import { problemInstruction, scrollToQuestion, starLayout } from "./questionPresentation.js";

const sections = ["Vocabulary", "Grammar", "Reading"];
const formatTime = (seconds) => `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
const extraExam = { id: "extra-mini", title: "Extra 24-question mini mock", questions: mockQuestions, sourceNote: "The existing 24-question N3 practice test." };
const archiveQuestionPool = archivePracticeSets.flatMap((set) => set.questions);
const examChoices = [extraExam, createDecemberExam(), ...archivePracticeSets, { id: "random-60", title: "Random mixed mock · 60 questions", questions: shuffledQuestions(archiveQuestionPool), sourceNote: "A shuffled selection from the four N3 practice sets." }];

export default function MockExam({ showReadings = false, showKanji = true }) {
  const display = text => practiceText(text, showReadings, showKanji);
  const [mode, setMode] = useState("intro");
  const [activeExam, setActiveExam] = useState(examChoices[0]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState([]);
  const [secondsLeft, setSecondsLeft] = useState(36 * 60);
  const [paused, setPaused] = useState(false);
  const [hideTimer, setHideTimer] = useState(false);
  const [reviewSection, setReviewSection] = useState("All");
  const [reviewIndex, setReviewIndex] = useState(0);
  const [confirmation, setConfirmation] = useState(null);
  const [arrangements, setArrangements] = useState({});
  const [navigationOpen, setNavigationOpen] = useState(false);
  const questionCard = useRef(null);
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

  const examQuestions = activeExam.questions;
  const examSeconds = activeExam.durationMinutes ? activeExam.durationMinutes * 60 : examQuestions.length >= 60 ? 75 * 60 : examQuestions.length >= 24 ? 36 * 60 : 23 * 60;
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

  const startExam = (selection = activeExam) => {
    const exam = selection.id === "dec-exam" ? createDecemberExam() : selection.id === "random-60" ? { ...selection, questions: shuffledQuestions(archiveQuestionPool) } : selection;
    setActiveExam(exam);
    setAnswers({});
    setFlagged([]);
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
  const toggleFlag = (id) => setFlagged((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);

  if (mode === "intro") return (
    <article className="mock-exam-panel">
      <div className="mock-exam-eyebrow">JLPT N3 · Practice mock</div>
      <h2>Mock Exam</h2>
      <div className="mock-exam-actions">
        <button type="button" className="primary-button" onClick={() => startExam()}>Start {activeExam.title}</button>
      </div>
      <div className="mock-exam-set-grid">{examChoices.map((exam) => <button type="button" key={exam.id} className={`mock-exam-set-card${activeExam.id === exam.id ? " selected" : ""}`} onClick={() => setActiveExam(exam)}><strong>{exam.title}</strong><span>{exam.questions.length} questions · Vocabulary, Grammar, Reading</span>{exam.id !== "extra-mini" && <small>{exam.sourceNote}</small>}</button>)}</div>
      <h3 className="mock-exam-selected-title">{activeExam.title}</h3>
      <div className="mock-exam-overview">
        <div><strong>{activeExam.questions.length}</strong><span>N3 practice questions</span></div>
        <div><strong>{examSeconds / 60} min</strong><span>practice timer</span></div>
        <div><strong>3 sections</strong><span>Vocabulary · Grammar · Reading</span></div>
      </div>
    </article>
  );

  if (mode === "results") {
    const item = reviewQuestion || examQuestions[0];
    return (
      <StudySessionView label="Mock exam" onQuit={() => setMode("intro")}><article className="mock-exam-panel mock-results">
        <div className="mock-exam-eyebrow">JLPT N3 · Results</div>
        <h2>{activeExam.title} · Result</h2>
        <div className="mock-score-summary">
          <div className="mock-score-total"><strong>{correctTotal}<span> / {examQuestions.length}</span></strong><small>raw correct answers</small></div>
          <div className="mock-section-scores">{sections.map((section) => <div key={section}><span>{section}</span><strong>{correctCounts[section].correct} / {correctCounts[section].total}</strong></div>)}</div>
        </div>
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
            {item.target && <p className="mock-target" lang="ja">{display(item.target)}</p>}
            <div className="mock-review-options">{item.choices.map((choice, index) => {
              const selected = answers[item.id] === index;
              const correct = item.answer === index;
              return <div key={choice} className={`mock-review-option${correct ? " correct" : ""}${selected && !correct ? " incorrect" : ""}`}><span className="mock-option-letter">{"ABCD"[index]}</span><span lang="ja">{display(choice)}</span></div>;
            })}</div>
            <p className="mock-explanation" lang="my"><strong>ရှင်းလင်းချက် — </strong>{display(item.explanation)}</p>
            <div className="mock-review-controls"><button type="button" className="secondary-button" disabled={reviewIndex === 0} onClick={() => setReviewIndex((index) => index - 1)}>← Previous</button><span>{reviewIndex + 1} / {reviewQuestions.length}</span><button type="button" className="secondary-button" disabled={reviewIndex === reviewQuestions.length - 1} onClick={() => setReviewIndex((index) => index + 1)}>Next →</button></div>
          </section>
        </div>
        <div className="mock-exam-actions"><button type="button" className="primary-button" onClick={() => startExam(activeExam)}>Try again</button><button type="button" className="secondary-button" onClick={() => { setMode("intro"); setActiveExam(examChoices[0]); }}>Choose another test</button></div>
      </article></StudySessionView>
    );
  }

  return (
    <StudySessionView label="Mock exam" onQuit={() => setConfirmation({ title: "Quit this exam?", message: "Your current answers will be cleared when you start another exam.", confirmLabel: "Quit exam", action: () => { setConfirmation(null); setMode("intro"); } })}><article className="mock-exam-panel mock-attempt">
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
          <div className="mock-question-meta"><span>{question.section}</span><span>{display(question.type)}</span><strong>Answered {answeredCount} / {examQuestions.length}</strong></div>
        <aside className="mock-question-nav">
          <details className="mock-navigation-drawer" open={navigationOpen} onToggle={event => setNavigationOpen(event.currentTarget.open)}>
          <summary>Question navigation <span>{answeredCount} / {examQuestions.length}</span></summary>
          <div className="mock-question-palette">{examQuestions.map((item, index) => <button type="button" key={item.id} className={`${index === questionIndex ? "current " : ""}${answers[item.id] != null ? "answered " : ""}${flagged.includes(item.id) ? "flagged" : ""}`} onClick={() => setQuestionIndex(index)} aria-label={`Question ${index + 1}${answers[item.id] != null ? ", answered" : ", unanswered"}${flagged.includes(item.id) ? ", flagged for review" : ""}`}>
            {index + 1}{flagged.includes(item.id) && <span aria-hidden="true">⚑</span>}
          </button>)}</div>
          <div className="mock-nav-legend"><span><i className="answered" /> Answered</span><span><i className="flagged" /> Flagged</span></div>
          </details>
        </aside>
          {problemInstruction(question) && <p className="mock-problem-instruction" lang="ja">{display(problemInstruction(question))}</p>}
          {question.passage && <div className="mock-reading-passage" lang="ja">{display(question.passage)}</div>}
          <h3 lang="ja"><QuestionPrompt question={question} showReadings={showReadings} showKanji={showKanji} /></h3>
          {question.target && <p className="mock-target" lang="ja">{display(question.target)}</p>}
          </div><div className="practice-response-panel"><div className="practice-response-heading"><strong>Choose your answer</strong><span>Exam mode</span></div>
          {starLayout(question.prompt) ? <StarAnswer key={question.id} question={question} value={arrangements[question.id]} display={display} onChange={(order, answer) => { setArrangements(current => ({ ...current, [question.id]: order })); setAnswers(current => ({ ...current, [question.id]: answer })); }} /> : <fieldset className={`mock-answer-list${question.choices.every(choice => choice.length <= 45) ? " mock-short-answers" : ""}`}>
            <legend>Select one answer</legend>
            {question.choices.map((choice, index) => <label key={choice} className={`mock-answer-option${answers[question.id] === index ? " selected" : ""}`}>
              <input type="radio" name={`question-${question.id}`} checked={answers[question.id] === index} onChange={() => setAnswers((current) => ({ ...current, [question.id]: index }))} />
              <span className="mock-option-letter">{"ABCD"[index]}</span><span lang="ja">{display(choice)}</span>
            </label>)}
          </fieldset>}
          <div className="mock-question-actions"><label className="mock-flag"><input type="checkbox" checked={flagged.includes(question.id)} onChange={() => toggleFlag(question.id)} /> Flag for review</label><button type="button" className="text-button" onClick={() => { setAnswers((current) => { const next = { ...current }; delete next[question.id]; return next; }); setArrangements(current => { const next = { ...current }; delete next[question.id]; return next; }); }} disabled={answers[question.id] == null}>Clear answer</button></div>
          <div className="mock-navigation-controls"><button type="button" className="secondary-button" disabled={questionIndex === 0} onClick={() => setQuestionIndex((index) => index - 1)}>← Back</button><span>{questionIndex + 1} / {examQuestions.length}</span>{questionIndex < examQuestions.length - 1 ? <button type="button" className="primary-button" onClick={() => setQuestionIndex((index) => index + 1)}>Next →</button> : <button type="button" className="primary-button" onClick={finishExam}>Finish exam</button>}</div>
          {questionIndex < examQuestions.length - 1 && <button type="button" className="mock-finish-button" onClick={finishExam}>Finish exam</button>}
          </div>
        </section>

      </div>
      {confirmation && <ConfirmDialog title={confirmation.title} message={confirmation.message} confirmLabel={confirmation.confirmLabel} onClose={() => setConfirmation(null)} onConfirm={confirmation.action} />}
    </article></StudySessionView>
  );
}
