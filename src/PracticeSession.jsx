import React, { useEffect, useRef, useState } from "react";
import { practiceText } from "./practiceText.js";
import QuestionPrompt from "./QuestionPrompt.jsx";
import StarAnswer from "./StarAnswer.jsx";
import { practiceQuestionGroups, problemInstruction, scrollToQuestion, starLayout } from "./questionPresentation.js";

export default function PracticeSession({ questions, title, showReadings = false, showKanji = true, autoScroll = false }) {
  const display = (text) => practiceText(text, showReadings, showKanji);
  const [selected, setSelected] = useState(0);
  const [answers, setAnswers] = useState({});
  const [checked, setChecked] = useState({});
  const [results, setResults] = useState(false);
  const [sourcePage, setSourcePage] = useState(null);
  const [arrangements, setArrangements] = useState({});
  const questionCard = useRef(null);
  useEffect(() => { if (autoScroll) scrollToQuestion(questionCard.current); }, [autoScroll]);
  const question = questions[selected];
  const completed = questions.filter((item) => checked[item.id]).length;
  const correct = questions.filter((item) => checked[item.id] && answers[item.id] === item.answer).length;
  const isChecked = Boolean(checked[question.id]);
  const isCorrect = answers[question.id] === question.answer;
  const scoreable = questions.filter((item) => Number.isInteger(item.answer));
  const displayedPage = question.sourcePages?.find((page) => page.number === (sourcePage ?? question.sourcePage)) || question.sourcePages?.[0];
  const select = (index) => { setSelected(index); setResults(false); setSourcePage(null); };
  const restart = () => { setAnswers({}); setChecked({}); setArrangements({}); select(0); scrollToQuestion(questionCard.current); };

  const compactChoices = !question.passage && !question.questionImage && question.choices.every(choice => choice.length <= 45);

  return <article className="reading-practice practice-session">
    <div className="reading-practice-heading">
      <div><div className="reading-eyebrow">{title}</div><h2>{results ? "Practice results" : "Practice questions"}</h2></div>
      <div className="practice-session-progress"><span>Question {selected + 1} of {questions.length}</span><progress value={completed} max={questions.length} aria-label="Practice progress" /></div><div className="practice-session-status"><div className="reading-content-meta"><span>Question {selected + 1} of {questions.length}</span>{question.pages && <span>PDF page {question.pages}</span>}</div><div className="reading-progress"><strong>{completed} / {questions.length}</strong><span>checked</span></div></div>
    </div>
    {results ? <>
      <p className="reading-score">Correct: <strong>{correct} / {scoreable.length}</strong> · Checked: {completed} / {questions.length}</p>
      <div className="reading-result-list">{questions.map((item, index) => <section key={item.id}>
        <h3 lang="ja">Q{item.number} · {display(item.topic)}</h3>
        <button type="button" onClick={() => select(index)}><span>{index + 1}</span><span lang="ja">{display(item.prompt)}</span><strong>{!checked[item.id] ? "Unchecked" : item.answer == null ? "Unscored" : answers[item.id] === item.answer ? "Correct" : "Review"}</strong></button>
      </section>)}</div>
      <div className="reading-actions"><button type="button" className="secondary-button" onClick={() => setResults(false)}>Back to questions</button><button type="button" className="primary-button" onClick={restart}>Try again</button></div>
    </> : <div className="reading-practice-layout">

      <section className="reading-content">
        <section className="reading-question-card practice-question-card" ref={questionCard} tabIndex={-1}>
          <div className="practice-prompt-panel"><div className="reading-question-topline"><div className="practice-prompt-label"><strong>Q{question.number}</strong><span lang="ja">{display(question.topic)}</span></div><details className="practice-navigation-menu"><summary>Topics &amp; questions</summary><nav className="reading-passage-nav" aria-label="Practice questions">
        <h3>Topics</h3>
        {[...new Set(questions.map((item) => item.topic))].map((topic) => <button type="button" key={topic} className={question.topic === topic ? "active" : ""} onClick={() => select(questions.findIndex((item) => item.topic === topic))}><strong>{display(topic)}</strong><small>{questions.filter((item) => item.topic === topic).length} questions</small></button>)}
        <div className="reading-all-questions practice-question-palette"><strong>Questions</strong><div className="practice-question-groups">{practiceQuestionGroups(questions).map(group => <section key={group.key} className={`practice-question-group${group.questions.some(item => item.index === selected) ? " current" : ""}`} aria-label={`${group.topic} · ${group.label}`}>
          <span className="practice-question-group-topic">{display(group.topic)}</span>
          <h4 lang="ja">{display(group.label)}</h4>
          <div className="practice-question-group-grid">{group.questions.map(({ question: item, index }) => <button type="button" key={item.id} className={`${selected === index ? "active " : ""}${checked[item.id] ? "done" : ""}`} aria-label={`${item.topic}, question ${item.number}${checked[item.id] ? ", checked" : ""}`} onClick={() => select(index)}>{item.number}</button>)}</div>
        </section>)}</div></div>
        <button type="button" className="reading-finish-button" onClick={() => setResults(true)}>Finish and view results</button>
      </nav></details></div>
          {question.problem && <h4 lang="ja" className="practice-problem-heading">{display(problemInstruction(question))}</h4>}
          <h4 lang="ja" className="practice-question-prompt"><QuestionPrompt question={question} showReadings={showReadings} showKanji={showKanji} /></h4>
          {question.questionImage && <img className="practice-key-image" src={question.questionImage} alt={`Question ${question.number} and its four choices`} />}
          {displayedPage && <details className="practice-source-page" open={question.openSource || (!question.individualItem && !question.questionImage)}>
            <summary>View original page / reading passage</summary>
            <div className="practice-source-controls"><label>Source page <select value={displayedPage.number} onChange={(event) => setSourcePage(Number(event.target.value))}>{question.sourcePages.map((page) => <option key={page.number} value={page.number}>{page.number}{page.number === question.sourcePage ? " · question" : ""}</option>)}</select></label><button type="button" className="secondary-button" onClick={() => setSourcePage(question.sourcePage)}>Question page</button><a href={displayedPage.src} target="_blank" rel="noreferrer">Enlarge page ↗</a></div>
            <img src={displayedPage.src} alt={`Original PDF page ${displayedPage.number}; ${question.topic} question ${question.number}`} />
          </details>}
          {question.sourceIssue && <p className="reading-note" role="note">{question.sourceIssue}</p>}
          {question.passage && <div className="reading-passage-text" lang="ja">{display(question.passage)}</div>}
          {question.target && <p className="mock-target" lang="ja">{display(question.target)}</p>}
          </div><div className="practice-response-panel"><div className="practice-response-heading"><strong>Choose your answer</strong><span>Practice mode</span></div>
          {starLayout(question.prompt) ? <StarAnswer key={question.id} question={question} value={arrangements[question.id]} disabled={isChecked} checked={isChecked} display={display} onChange={(order, answer) => { setArrangements(current => ({ ...current, [question.id]: order })); setAnswers(current => ({ ...current, [question.id]: answer })); if (order.every(item => item != null)) setChecked(current => ({ ...current, [question.id]: true })); }} /> : <fieldset className={`reading-answer-list${compactChoices ? " practice-short-answers" : ""}`} disabled={isChecked}>
            <legend>Select one answer</legend>
            {question.choices.map((choice, index) => <label key={index} className={`${answers[question.id] === index ? "selected" : ""}${isChecked && index === question.answer ? " correct" : ""}${isChecked && answers[question.id] === index && !isCorrect ? " incorrect" : ""}`}>
              <input type="radio" name={question.id} checked={answers[question.id] === index} onChange={() => { setAnswers(current => ({ ...current, [question.id]: index })); setChecked(current => ({ ...current, [question.id]: true })); }} />
              <span className="reading-option-letter">{question.sourcePages ? "①②③④"[index] : index+1}</span><span lang="ja">{display(choice)}</span>
            </label>)}
          </fieldset>}
          <div className="reading-question-actions">
            <button type="button" className="secondary-button" disabled={selected === 0} onClick={() => select(selected - 1)}>← Previous</button>
            <button type="button" className="secondary-button" onClick={() => setResults(true)}>Results ({completed}/{questions.length})</button>
            <button type="button" className="primary-button" onClick={() => selected === questions.length - 1 ? setResults(true) : select(selected + 1)}>{selected === questions.length - 1 ? "Finish →" : "Next →"}</button>
          </div>
          </div>
        </section>
      </section>
    </div>}
  </article>;
}
