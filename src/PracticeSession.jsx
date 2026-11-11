import React, { useState } from "react";

export default function PracticeSession({ questions, title, description, source }) {
  const [selected, setSelected] = useState(0);
  const [answers, setAnswers] = useState({});
  const [checked, setChecked] = useState({});
  const [results, setResults] = useState(false);
  const [sourcePage, setSourcePage] = useState(null);
  const question = questions[selected];
  const completed = questions.filter((item) => checked[item.id]).length;
  const correct = questions.filter((item) => checked[item.id] && answers[item.id] === item.answer).length;
  const isChecked = Boolean(checked[question.id]);
  const isCorrect = answers[question.id] === question.answer;
  const scoreable = questions.filter((item) => Number.isInteger(item.answer));
  const hasKey = Number.isInteger(question.answer);
  const displayedPage = question.sourcePages?.find((page) => page.number === (sourcePage ?? question.sourcePage)) || question.sourcePages?.[0];
  const select = (index) => { setSelected(index); setResults(false); setSourcePage(null); };
  const restart = () => { setAnswers({}); setChecked({}); select(0); };

  return <article className="reading-practice" style={{ marginTop: 20 }}>
    <div className="reading-practice-heading">
      <div><div className="reading-eyebrow">{title}</div><h2>{results ? "Practice results" : "Practice questions"}</h2><p>{description}</p></div>
      <div className="reading-progress"><strong>{completed} / {questions.length}</strong><span>checked</span></div>
    </div>
    {results ? <>
      <p className="reading-score">Correct: <strong>{correct} / {scoreable.length}</strong> · Checked: {completed} / {questions.length}</p>
      <p className="reading-note">Unchecked questions are excluded from your correct total. Select a question to review it.</p>
      <div className="reading-result-list">{questions.map((item, index) => <section key={item.id}>
        <h3 lang="ja">Q{item.number} · {item.topic}</h3>
        <button type="button" onClick={() => select(index)}><span>{index + 1}</span><span lang="ja">{item.prompt}</span><strong>{!checked[item.id] ? "Unchecked" : item.answer == null ? "Unscored" : answers[item.id] === item.answer ? "Correct" : "Review"}</strong></button>
      </section>)}</div>
      <div className="reading-actions"><button type="button" className="secondary-button" onClick={() => setResults(false)}>Back to questions</button><button type="button" className="primary-button" onClick={restart}>Try again</button></div>
    </> : <div className="reading-practice-layout">
      <nav className="reading-passage-nav" aria-label="Practice questions">
        <h3>Topics</h3>
        {[...new Set(questions.map((item) => item.topic))].map((topic) => <button type="button" key={topic} className={question.topic === topic ? "active" : ""} onClick={() => select(questions.findIndex((item) => item.topic === topic))}><strong>{topic}</strong><small>{questions.filter((item) => item.topic === topic).length} questions</small></button>)}
        <div className="reading-all-questions practice-question-palette"><strong>Questions</strong><div>{questions.map((item, index) => <button type="button" key={item.id} className={`${selected === index ? "active " : ""}${checked[item.id] ? "done" : ""}`} aria-label={`${item.topic}, question ${item.number}${checked[item.id] ? ", checked" : ""}`} onClick={() => select(index)}>{index+1}</button>)}</div></div>
        <button type="button" className="reading-finish-button" onClick={() => setResults(true)}>Finish and view results</button>
      </nav>
      <section className="reading-content">
        <div className="reading-content-meta"><span>Question {selected + 1} of {questions.length}</span>{question.pages && <span>PDF page {question.pages}</span>}</div>
        <h3 lang="ja">{question.topic}</h3>
        <section className="reading-question-card">
          <div className="reading-question-topline"><strong>Q{question.number}</strong><span>Select one answer</span></div>
          <h4 lang="ja" style={{ whiteSpace: "pre-line" }}>{question.problem && `${question.problem}：`} {question.prompt}</h4>
          {question.questionImage && <img className="practice-key-image" src={question.questionImage} alt={`Question ${question.number} and its four choices`} />}
          {displayedPage && <details className="practice-source-page" open={!question.individualItem && !question.questionImage}>
            <summary>View original page / reading passage</summary>
            <div className="practice-source-controls"><label>Source page <select value={displayedPage.number} onChange={(event) => setSourcePage(Number(event.target.value))}>{question.sourcePages.map((page) => <option key={page.number} value={page.number}>{page.number}{page.number === question.sourcePage ? " · question" : ""}</option>)}</select></label><button type="button" className="secondary-button" onClick={() => setSourcePage(question.sourcePage)}>Question page</button><a href={displayedPage.src} target="_blank" rel="noreferrer">Enlarge page ↗</a></div>
            <p className="reading-note">Read {question.topic.toLowerCase()} question {question.number} and its four choices below. Use the page selector for passages on earlier pages.</p>
            <img src={displayedPage.src} alt={`Original PDF page ${displayedPage.number}; ${question.topic} question ${question.number}`} />
          </details>}
          {question.sourceIssue && <p className="reading-note" role="note">{question.sourceIssue}</p>}
          {question.passage && <div className="reading-passage-text" lang="ja">{question.passage}</div>}
          {question.target && <p className="mock-target" lang="ja">{question.target}</p>}
          <fieldset className="reading-answer-list" disabled={isChecked}>
            <legend>Select one answer</legend>
            {question.choices.map((choice, index) => <label key={index} className={`${answers[question.id] === index ? "selected" : ""}${isChecked && index === question.answer ? " correct" : ""}${isChecked && answers[question.id] === index && !isCorrect ? " incorrect" : ""}`}>
              <input type="radio" name={question.id} checked={answers[question.id] === index} onChange={() => setAnswers((current) => ({ ...current, [question.id]: index }))} />
              <span className="reading-option-letter">{question.sourcePages ? "①②③④"[index] : index+1}</span><span lang="ja">{choice}</span>
              {isChecked && index === question.answer && <strong>Correct answer</strong>}
              {isChecked && answers[question.id] === index && !isCorrect && <strong>Your answer</strong>}
            </label>)}
          </fieldset>
          {isChecked && <div className={`reading-feedback ${hasKey && isCorrect ? "correct" : "incorrect"}`} role="status"><strong>{!hasKey ? "Unscored. " : isCorrect ? "Correct. " : "Not quite. "}</strong>{hasKey && <span lang="ja">正解：{question.sourcePages ? "①②③④"[question.answer] : `${question.answer+1})`} {question.choices[question.answer]}</span>}<p style={{ whiteSpace: "pre-line" }}>{hasKey ? question.explanation : "The source key needs review. This question is excluded from your score."}</p>{question.keyPages && <details><summary>View original answer key</summary>{question.keyPages.map((page) => <a key={page.number} href={page.src} target="_blank" rel="noreferrer"><img className="practice-key-image" src={page.src} alt={`Answer key, PDF page ${page.number}`} loading="lazy" /></a>)}</details>}</div>}
          <div className="reading-question-actions">
            <button type="button" className="secondary-button" disabled={selected === 0} onClick={() => select(selected - 1)}>← Previous</button>
            <button type="button" className="secondary-button" onClick={() => setResults(true)}>Results ({completed}/{questions.length})</button>
            {!isChecked ? <button type="button" className="primary-button" disabled={answers[question.id] == null} onClick={() => setChecked((current) => ({ ...current, [question.id]: true }))}>Check answer</button> : <button type="button" className="primary-button" onClick={() => selected === questions.length - 1 ? setResults(true) : select(selected + 1)}>{selected === questions.length - 1 ? "Finish →" : "Next →"}</button>}
          </div>
        </section>
      </section>
    </div>}
    {source && <p className="reading-note">Source: {source} · {questions.length} questions.</p>}
  </article>;
}
