import React, { useState } from 'react';
import { awsPracticeSample as question, awsPracticeTitle } from './awsPracticeSample.js';
import './awsPractice.css';

export default function AwsPracticeSession() {
  const [selected, setSelected] = useState([]);
  const [checked, setChecked] = useState(false);
  const [results, setResults] = useState(false);
  const correct = selected.length === question.answers.length && question.answers.every(letter => selected.includes(letter));
  const restart = () => { setSelected([]); setChecked(false); setResults(false); };

  return <article className="aws-practice-session">
    <div className="aws-session-heading">
      <div><p className="reading-eyebrow">AWS · Practice sample</p><h2>{awsPracticeTitle}</h2></div>
      <div className="aws-progress"><span>Question 1 of 1</span><progress value={checked ? 1 : 0} max="1" aria-label="Practice progress" /></div>
    </div>
    {results ? <section className="aws-results">
      <h3>Practice results</h3>
      <p>{checked ? `Correct: ${correct ? 1 : 0} / 1` : 'No answers checked yet.'}</p>
      <p>Question #18 · {checked ? correct ? 'Correct' : 'Review' : 'Unchecked'}</p>
      <div className="aws-actions"><button className="secondary-button" onClick={() => setResults(false)}>Review question</button><button className="primary-button" onClick={restart}>Try again</button></div>
    </section> : <>
      <section className="aws-source-card" aria-labelledby="aws-question-heading">
        <header><h3 id="aws-question-heading">Question #{question.number}</h3><span>{question.topic}</span></header>
        <div className="aws-source-body">
          <div className="aws-prompt">{question.prompt.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
          <ol className="aws-source-options" type="A">{question.choices.map((choice, index) => <li key={index}>{choice}</li>)}</ol>
        </div>
      </section>
      <section className="aws-answer-panel" aria-label="Answer selection">
        <fieldset disabled={checked}>
          <legend>Choose two answers</legend>
          <div className="aws-answer-buttons">{question.choices.map((_, index) => {
            const letter = String.fromCharCode(65 + index);
            return <button type="button" key={letter} aria-pressed={selected.includes(letter)} className={`aws-answer-letter${selected.includes(letter) ? ' selected' : ''}${checked && question.answers.includes(letter) ? ' correct' : ''}${checked && selected.includes(letter) && !question.answers.includes(letter) ? ' incorrect' : ''}`} disabled={!selected.includes(letter) && selected.length >= question.selectCount} onClick={() => setSelected(current => current.includes(letter) ? current.filter(value => value !== letter) : [...current, letter])}>{letter}</button>;
          })}</div>
        </fieldset>
        <p className="aws-selection-count" role="status">{selected.length} of {question.selectCount} selected</p>
        {checked && <div className="aws-answer-feedback" role="status"><strong>{correct ? 'Correct' : 'Review your answer'}</strong><p>Your answer: {selected.join(', ')} · Correct answer: {question.answers.join(', ')}</p></div>}
        {checked && <details className="aws-explanation"><summary>Show explanation</summary><p>{question.explanation}</p><p>Sample answer checked against AWS documentation; the PDF does not include an answer key.</p><ul>{question.references.map(reference => <li key={reference.url}><a href={reference.url} target="_blank" rel="noreferrer">{reference.title}</a></li>)}</ul></details>}
        <div className="aws-actions">
          {!checked && <button type="button" className="primary-button" disabled={selected.length !== question.selectCount} onClick={() => setChecked(true)}>Check answer</button>}
          <button type="button" className="secondary-button" onClick={() => setResults(true)}>Results ({checked ? 1 : 0}/1)</button>
          {checked && <button type="button" className="secondary-button" onClick={restart}>Try again</button>}
        </div>
      </section>
    </>}
  </article>;
}
