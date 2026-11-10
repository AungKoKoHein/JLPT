import React, { useEffect, useMemo, useState } from "react";
import { mockQuestions } from "./mockExamQuestions.js";

const EXAM_SECONDS = 100 * 60;
const sections = ["Vocabulary", "Grammar", "Reading"];
const formatTime = (seconds) => `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

export default function MockExam() {
  const [mode, setMode] = useState("intro");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState([]);
  const [secondsLeft, setSecondsLeft] = useState(EXAM_SECONDS);
  const [paused, setPaused] = useState(false);
  const [hideTimer, setHideTimer] = useState(false);
  const [reviewSection, setReviewSection] = useState("All");
  const [reviewIndex, setReviewIndex] = useState(0);

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

  const question = mockQuestions[questionIndex];
  const reviewQuestions = useMemo(
    () => mockQuestions.map((item, index) => ({ ...item, index })).filter((item) => reviewSection === "All" || item.section === reviewSection),
    [reviewSection],
  );
  const reviewQuestion = reviewQuestions[Math.min(reviewIndex, reviewQuestions.length - 1)];
  const correctCounts = useMemo(() => sections.reduce((counts, section) => {
    const items = mockQuestions.filter((item) => item.section === section);
    counts[section] = { correct: items.filter((item) => answers[item.id] === item.answer).length, total: items.length };
    return counts;
  }, {}), [answers]);
  const correctTotal = sections.reduce((total, section) => total + correctCounts[section].correct, 0);
  const answeredCount = Object.keys(answers).length;

  const startExam = () => {
    setAnswers({});
    setFlagged([]);
    setQuestionIndex(0);
    setSecondsLeft(EXAM_SECONDS);
    setPaused(false);
    setHideTimer(false);
    setMode("attempt");
  };
  const finishExam = () => {
    if (answeredCount < mockQuestions.length && !window.confirm(`You have ${mockQuestions.length - answeredCount} unanswered questions. Finish the exam now?`)) return;
    setPaused(false);
    setMode("results");
    setReviewSection("All");
    setReviewIndex(0);
  };
  const toggleFlag = (id) => setFlagged((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);

  if (mode === "intro") return (
    <article className="mock-exam-panel">
      <div className="mock-exam-eyebrow">JLPT N3 · Practice mock</div>
      <h2>Mock Exam</h2>
      <p className="mock-exam-lead">A timed practice set covering vocabulary, grammar, and reading.</p>
      <div className="mock-exam-overview">
        <div><strong>{mockQuestions.length}</strong><span>original questions</span></div>
        <div><strong>100 min</strong><span>practice timer</span></div>
        <div><strong>3 sections</strong><span>Vocabulary · Grammar · Reading</span></div>
      </div>
      <ul className="mock-exam-notes">
        <li>Choose one answer for each question. You can move between questions and flag items to revisit.</li>
        <li>When you finish, see your raw score by section, correct answers, and short explanations in Burmese.</li>
        <li>This is an original practice set based on published JLPT N3 item types. It is not an official test or score estimate. Listening is not included.</li>
      </ul>
      <div className="mock-exam-actions">
        <button type="button" className="primary-button" onClick={startExam}>Start mock exam</button>
        <a href="https://samplequestions.jlpt.jp/e/guideline/pdf/n3_e.pdf" target="_blank" rel="noreferrer">Official JLPT N3 item type guide ↗</a>
      </div>
    </article>
  );

  if (mode === "results") {
    const item = reviewQuestion || mockQuestions[0];
    return (
      <article className="mock-exam-panel mock-results">
        <div className="mock-exam-eyebrow">JLPT N3 · Results</div>
        <h2>Practice result</h2>
        <div className="mock-score-summary">
          <div className="mock-score-total"><strong>{correctTotal}<span> / {mockQuestions.length}</span></strong><small>raw correct answers</small></div>
          <div className="mock-section-scores">{sections.map((section) => <div key={section}><span>{section}</span><strong>{correctCounts[section].correct} / {correctCounts[section].total}</strong></div>)}</div>
        </div>
        <p className="mock-score-disclaimer">JLPT results use scaled scoring. This raw practice score is not an official score or pass/fail prediction.</p>
        <div className="mock-review-heading">
          <div><h3>Answer review</h3><p>Check the correct answer and explanation for each question.</p></div>
          <label>Section <select value={reviewSection} onChange={(event) => { setReviewSection(event.target.value); setReviewIndex(0); }}><option>All</option>{sections.map((section) => <option key={section}>{section}</option>)}</select></label>
        </div>
        <div className="mock-review-layout">
          <nav className="mock-review-nav" aria-label="Review questions">
            {reviewQuestions.map((entry, index) => <button type="button" className={index === reviewIndex ? "current" : ""} key={entry.id} onClick={() => setReviewIndex(index)} aria-label={`Review question ${entry.id}`}>
              {entry.id}<span className={answers[entry.id] === entry.answer ? "review-correct" : "review-incorrect"} aria-label={answers[entry.id] === entry.answer ? "Correct" : "Incorrect or unanswered"}>{answers[entry.id] === entry.answer ? "✓" : "×"}</span>
            </button>)}
          </nav>
          <section className="mock-question-card">
            <div className="mock-question-meta"><span>{item.section}</span><span>{item.type}</span><strong>Question {item.id} of {mockQuestions.length}</strong></div>
            {item.passage && <div className="mock-reading-passage" lang="ja">{item.passage}</div>}
            <h4 lang="ja">{item.prompt}</h4>
            {item.target && <p className="mock-target" lang="ja">{item.target}</p>}
            <div className="mock-review-options">{item.choices.map((choice, index) => {
              const selected = answers[item.id] === index;
              const correct = item.answer === index;
              return <div key={choice} className={`mock-review-option${correct ? " correct" : ""}${selected && !correct ? " incorrect" : ""}`}><span className="mock-option-letter">{"ABCD"[index]}</span><span lang="ja">{choice}</span><span className="mock-option-status">{correct ? "Correct answer" : selected ? "Your answer" : ""}</span></div>;
            })}</div>
            <p className="mock-explanation" lang="my"><strong>ရှင်းလင်းချက် — </strong>{item.explanation}</p>
            <div className="mock-review-controls"><button type="button" className="secondary-button" disabled={reviewIndex === 0} onClick={() => setReviewIndex((index) => index - 1)}>← Previous</button><span>{reviewIndex + 1} / {reviewQuestions.length}</span><button type="button" className="secondary-button" disabled={reviewIndex === reviewQuestions.length - 1} onClick={() => setReviewIndex((index) => index + 1)}>Next →</button></div>
          </section>
        </div>
        <div className="mock-exam-actions"><button type="button" className="primary-button" onClick={startExam}>Try again</button></div>
      </article>
    );
  }

  return (
    <article className="mock-exam-panel mock-attempt">
      <div className="mock-exam-topline">
        <div><div className="mock-exam-eyebrow">JLPT N3 · Mock Exam</div><h2>Question {questionIndex + 1} of {mockQuestions.length}</h2></div>
        <div className="mock-timer-block">
          {!hideTimer && <div className={`mock-timer${secondsLeft < 300 ? " low-time" : ""}`} aria-live="off"><span>Time remaining</span><strong>{formatTime(secondsLeft)}</strong></div>}
          <div className="mock-timer-controls"><button type="button" className="secondary-button" onClick={() => setPaused((value) => !value)}>{paused ? "Resume" : "Pause"} timer</button><button type="button" className="secondary-button" onClick={() => { setSecondsLeft(EXAM_SECONDS); setPaused(false); }}>Reset timer</button></div>
          <label className="mock-hide-timer"><input type="checkbox" checked={hideTimer} onChange={(event) => setHideTimer(event.target.checked)} /> Hide timer</label>
        </div>
      </div>
      <div className="mock-progress" aria-label={`Question ${questionIndex + 1} of ${mockQuestions.length}`}><div style={{ width: `${((questionIndex + 1) / mockQuestions.length) * 100}%` }} /></div>
      <div className="mock-attempt-grid">
        <section className="mock-question-card" aria-label={`Question ${questionIndex + 1}`}>
          <div className="mock-question-meta"><span>{question.section}</span><span>{question.type}</span><strong>Answered {answeredCount} / {mockQuestions.length}</strong></div>
          {question.passage && <div className="mock-reading-passage" lang="ja">{question.passage}</div>}
          <h3 lang="ja">{question.prompt}</h3>
          {question.target && <p className="mock-target" lang="ja">{question.target}</p>}
          <fieldset className="mock-answer-list">
            <legend>Select one answer</legend>
            {question.choices.map((choice, index) => <label key={choice} className={`mock-answer-option${answers[question.id] === index ? " selected" : ""}`}>
              <input type="radio" name={`question-${question.id}`} checked={answers[question.id] === index} onChange={() => setAnswers((current) => ({ ...current, [question.id]: index }))} />
              <span className="mock-option-letter">{"ABCD"[index]}</span><span lang="ja">{choice}</span>
            </label>)}
          </fieldset>
          <div className="mock-question-actions"><label className="mock-flag"><input type="checkbox" checked={flagged.includes(question.id)} onChange={() => toggleFlag(question.id)} /> Flag for review</label><button type="button" className="text-button" onClick={() => setAnswers((current) => { const next = { ...current }; delete next[question.id]; return next; })} disabled={answers[question.id] == null}>Clear answer</button></div>
          <div className="mock-navigation-controls"><button type="button" className="secondary-button" disabled={questionIndex === 0} onClick={() => setQuestionIndex((index) => index - 1)}>← Back</button><span>{questionIndex + 1} / {mockQuestions.length}</span>{questionIndex < mockQuestions.length - 1 ? <button type="button" className="primary-button" onClick={() => setQuestionIndex((index) => index + 1)}>Next →</button> : <button type="button" className="primary-button" onClick={finishExam}>Finish exam</button>}</div>
        </section>
        <aside className="mock-question-nav">
          <h3>Question navigation</h3>
          <p>Choose a number to jump to it.</p>
          <div className="mock-question-palette">{mockQuestions.map((item, index) => <button type="button" key={item.id} className={`${index === questionIndex ? "current " : ""}${answers[item.id] != null ? "answered " : ""}${flagged.includes(item.id) ? "flagged" : ""}`} onClick={() => setQuestionIndex(index)} aria-label={`Question ${item.id}${answers[item.id] != null ? ", answered" : ", unanswered"}${flagged.includes(item.id) ? ", flagged for review" : ""}`}>
            {item.id}{flagged.includes(item.id) && <span aria-hidden="true">⚑</span>}
          </button>)}</div>
          <div className="mock-nav-legend"><span><i className="answered" /> Answered</span><span><i className="flagged" /> Flagged</span></div>
          <button type="button" className="mock-finish-button" onClick={finishExam}>Finish exam</button>
        </aside>
      </div>
    </article>
  );
}
