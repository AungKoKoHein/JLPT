import React, { useRef, useState } from 'react';
import { awsQuestions, awsPracticeTitle, awsAnswerStatus, toggleAwsAnswer } from './awsPractice.js';
import './awsPractice.css';

export default function AwsPracticeSession() {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState({});
  const [results, setResults] = useState(false);
  const [filter, setFilter] = useState('all');
  const card = useRef(null);
  const question = awsQuestions[index];
  const selected = answers[question.id] || [];
  const checked = Boolean(submitted[question.id]);
  const completed = Object.values(submitted).filter(Boolean).length;
  const graded = awsQuestions.filter(item => submitted[item.id] && Array.isArray(item.answers));
  const correct = graded.filter(item => awsAnswerStatus(item, answers[item.id] || [], true) === 'Correct').length;
  const status = awsAnswerStatus(question, selected, checked);
  const select = nextIndex => {
    setIndex(nextIndex); setResults(false);
    requestAnimationFrame(() => { card.current?.focus({ preventScroll: true }); card.current?.scrollIntoView({ block: 'start' }); });
  };
  const restart = () => { setAnswers({}); setSubmitted({}); select(0); };
  const visibleResults = awsQuestions.filter(item => filter === 'all' || (filter === 'unchecked' ? !submitted[item.id] : submitted[item.id]));

  return <article className="aws-practice-session">
    <div className="aws-session-heading">
      <div><p className="reading-eyebrow">AWS · Practice</p><h2>{awsPracticeTitle}</h2></div>
      <div className="aws-progress"><span>Question {index + 1} of {awsQuestions.length}</span><progress value={completed} max={awsQuestions.length} aria-label="Practice progress" /><span>{completed} submitted</span></div>
    </div>
    {results ? <section className="aws-results">
      <h3>Practice results</h3>
      <p>{completed} / {awsQuestions.length} submitted · Correct: {correct} / {graded.length} graded · {completed - graded.length} ungraded</p>
      <p>The PDF has no answer key. Ungraded submissions do not count as correct or incorrect.</p>
      <label>Show <select value={filter} onChange={event => setFilter(event.target.value)}><option value="all">All questions</option><option value="submitted">Submitted</option><option value="unchecked">Unchecked</option></select></label>
      <div className="aws-result-list">{visibleResults.map(item => <button key={item.id} type="button" onClick={() => select(item.number - 1)}><strong>Question #{item.number}</strong><span>{item.prompt.join(' ')}</span><small>{awsAnswerStatus(item, answers[item.id] || [], submitted[item.id])}{submitted[item.id] ? ` · ${(answers[item.id] || []).join(', ')}` : ''}</small></button>)}</div>
      {!visibleResults.length && <p>No questions in this view.</p>}
      <div className="aws-actions"><button type="button" className="secondary-button" onClick={() => setResults(false)}>Back to questions</button><button type="button" className="primary-button" onClick={restart}>Start over</button></div>
    </section> : <div className="aws-practice-layout">
      <section className="aws-source-card" aria-labelledby="aws-question-heading" ref={card} tabIndex={-1}>
        <header><h3 id="aws-question-heading">Question #{question.number}</h3><span>{question.topic}</span></header>
        <div className="aws-source-body">
          <div className="aws-prompt">{question.prompt.map((paragraph, paragraphIndex) => <p key={paragraphIndex}>{paragraph}</p>)}</div>
          {question.promptImages.map(asset => <img key={asset.src} className="aws-policy-image" src={asset.src} alt={asset.alt} />)}
          <ol className="aws-source-options" type="A">{question.choices.map((choice, choiceIndex) => {
            const asset = question.choiceImages[String.fromCharCode(65 + choiceIndex)];
            return <li key={choiceIndex}>{choice}{asset && <img className="aws-policy-image" src={asset.src} alt={asset.alt} />}</li>;
          })}</ol>
          {question.sourceIssue && <p className="reading-note">{question.sourceIssue}</p>}
        </div>
      </section>
      <section className="aws-answer-panel" aria-label="Answer selection">
        <div className="aws-question-jump"><label htmlFor="aws-question-select">Go to question</label><select id="aws-question-select" value={index} onChange={event => select(Number(event.target.value))}>{awsQuestions.map((item, itemIndex) => <option key={item.id} value={itemIndex}>#{item.number}{submitted[item.id] ? ' · submitted' : ''}</option>)}</select><small>PDF page {question.sourcePages.join('–')}</small></div>
        <fieldset disabled={checked}>
          <legend>Choose {question.selectCount === 1 ? 'one answer' : question.selectCount === 2 ? 'two answers' : 'three answers'}</legend>
          <div className="aws-answer-buttons">{question.choices.map((_, choiceIndex) => {
            const letter = String.fromCharCode(65 + choiceIndex);
            return <button type="button" key={letter} aria-pressed={selected.includes(letter)} className={`aws-answer-letter${selected.includes(letter) ? ' selected' : ''}${checked && question.answers?.includes(letter) ? ' correct' : ''}${status === 'Review' && selected.includes(letter) && !question.answers?.includes(letter) ? ' incorrect' : ''}`} disabled={question.selectCount > 1 && !selected.includes(letter) && selected.length >= question.selectCount} onClick={() => setAnswers(current => ({ ...current, [question.id]: toggleAwsAnswer(current[question.id] || [], letter, question.selectCount) }))}>{letter}</button>;
          })}</div>
        </fieldset>
        <p className="aws-selection-count" role="status">{selected.length} of {question.selectCount} selected</p>
        {checked && <div className="aws-answer-feedback" role="status"><strong>{status === 'Ungraded' ? 'Answer saved · ungraded' : status === 'Correct' ? 'Correct' : 'Review your answer'}</strong><p>Your answer: {selected.join(', ')}{question.answers ? ` · Correct answer: ${question.answers.join(', ')}` : ''}</p>{!question.answers && <p>No answer key is included in the PDF for this question.</p>}</div>}
        {checked && question.explanation && <details key={question.id} className="aws-explanation"><summary>Show explanation</summary><p>{question.explanation}</p><p>This answer was checked against AWS documentation; the PDF does not include an answer key.</p><ul>{question.references.map(reference => <li key={reference.url}><a href={reference.url} target="_blank" rel="noreferrer">{reference.title}</a></li>)}</ul></details>}
        <div className="aws-actions">
          {!checked && <button type="button" className="primary-button" disabled={selected.length !== question.selectCount} onClick={() => setSubmitted(current => ({ ...current, [question.id]: true }))}>{question.answers ? 'Check answer' : 'Submit answer'}</button>}
          {checked && <button type="button" className="secondary-button" onClick={() => { setAnswers(current => ({ ...current, [question.id]: [] })); setSubmitted(current => ({ ...current, [question.id]: false })); }}>Try again</button>}
        </div>
        <div className="aws-question-navigation"><button type="button" className="secondary-button" disabled={index === 0} onClick={() => select(index - 1)}>Previous</button><button type="button" className="primary-button" onClick={() => index === awsQuestions.length - 1 ? setResults(true) : select(index + 1)}>{index === awsQuestions.length - 1 ? 'Finish' : 'Next'}</button></div>
        <button type="button" className="secondary-button aws-results-button" onClick={() => setResults(true)}>Results ({completed}/{awsQuestions.length})</button>
      </section>
    </div>}
  </article>;
}
