import React, { useMemo, useState } from "react";
import StudySessionView from "./StudySessionView.jsx";
import { practiceText } from "./practiceText.js";

import { readingCollections, originalReadingCollection } from "./readingCollections.js";
import { pdfReadingSets, pdfReadingQuestionCount } from "./pdfReadingSets.js";


export default function ReadingPractice({ showReadings = false, showKanji = true }) {
  const [collection, setCollection] = useState(pdfReadingSets[0].id);
  const [active, setActive] = useState(false);
  const [initialPassage, setInitialPassage] = useState(0);
  const selected = readingCollections.find(set => set.id === collection);
  const currentCollection = selected || originalReadingCollection;
  if (active) return <StudySessionView label="Reading" onQuit={() => setActive(false)}><PassageReadingPractice key={collection} collection={currentCollection} initialPassage={initialPassage} showReadings={showReadings} showKanji={showKanji} /></StudySessionView>;
  return <article className="reading-collection">
    <header className="reading-collection-header">
      <div className="reading-collection-intro">
      <div className="reading-eyebrow">JLPT N3 · Reading collection</div>
      <h2>Reading practice</h2>
      <div className="reading-collection-stats"><span><strong>{pdfReadingQuestionCount}</strong> PDF questions</span><span><strong>{pdfReadingSets.length}</strong> sets</span><span><strong>8</strong> original questions</span></div>
      </div>
      <div className="reading-collection-picker">
        <label htmlFor="reading-collection-select">Choose a reading set</label>
        <select id="reading-collection-select" value={collection} onChange={event => setCollection(event.target.value)}>
          {pdfReadingSets.map(set => <option key={set.id} value={set.id}>{set.title} · {set.questions.length} questions</option>)}
          <option value="original">Original practice · 8 questions</option>
        </select>
        <span>{selected ? `Source pages ${selected.sourceRange}` : "Four original passages"}</span>
      </div>
    </header>
    <nav className="reading-passage-cards" aria-label="Choose a reading passage">
      <h3>Passages</h3>
      {currentCollection.passages.map((passage, index) => <button type="button" key={passage.id} onClick={() => { setInitialPassage(index); setActive(true); }}>
        <span>Passage {index + 1}</span>
        <strong>{/^N3-\d+ ·/.test(passage.title) ? passage.type : practiceText(passage.title, showReadings, showKanji)}</strong>
        <small>{passage.questions.length} {passage.questions.length === 1 ? "question" : "questions"}</small>
      </button>)}
    </nav>
  </article>;
}

function PassageReadingPractice({ collection, initialPassage = 0, showReadings = false, showKanji = true }) {
  const passages = collection.passages;
  const questions = useMemo(() => passages.flatMap((passage, passageIndex) => passage.questions.map((question, questionIndex) => ({
    ...question, passageId: passage.id, passageIndex, questionIndex, id: `${passage.id}-${questionIndex}`,
  }))), [passages]);
  const questionNumber = (passageIndex, questionIndex) => passages.slice(0, passageIndex).reduce((total, item) => total + item.questions.length, 0) + questionIndex + 1;
  const scoreable = questions.filter(item => Number.isInteger(item.answer));
  const display = (text) => practiceText(text, showReadings, showKanji);
  const [selectedPassage, setSelectedPassage] = useState(initialPassage);
  const [selectedQuestion, setSelectedQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [checked, setChecked] = useState({});
  const [showResults, setShowResults] = useState(false);

  const passage = passages[selectedPassage];
  const question = passage.questions[selectedQuestion];
  const questionId = `${passage.id}-${selectedQuestion}`;
  const allAnswered = questions.every((item) => answers[item.id] != null);
  const completed = Object.keys(checked).length;
  const correctTotal = useMemo(() => questions.filter((item) => checked[item.id] && answers[item.id] === item.answer).length, [answers, checked]);

  const selectQuestion = (passageIndex, questionIndex) => {
    setSelectedPassage(passageIndex);
    setSelectedQuestion(questionIndex);
    setShowResults(false);
  };
  const nextQuestion = () => {
    if (selectedQuestion < passage.questions.length - 1) setSelectedQuestion((value) => value + 1);
    else if (selectedPassage < passages.length - 1) {
      setSelectedPassage((value) => value + 1);
      setSelectedQuestion(0);
    } else setShowResults(true);
  };
  const restart = () => {
    setAnswers({});
    setChecked({});
    setSelectedPassage(0);
    setSelectedQuestion(0);
    setShowResults(false);
  };

  if (showResults) return (
    <section className="reading-practice practice-session reading-session">
      <div className="reading-eyebrow">JLPT N3 · Reading</div>
      <h2>Reading results</h2>
      <p className="reading-score">Correct: <strong>{correctTotal} / {scoreable.length}</strong> · Checked: {completed} / {questions.length}</p>
      <div className="reading-result-list">{passages.map((item, passageIndex) => {
        const passageQuestions = questions.filter((entry) => entry.passageId === item.id);
        const correct = passageQuestions.filter((entry) => checked[entry.id] && answers[entry.id] === entry.answer).length;
        return <section key={item.id}>
          <h3>{display(item.title)} <span>{correct} / {item.questions.length}</span></h3>
          {item.questions.map((entry, questionIndex) => {
            const id = `${item.id}-${questionIndex}`;
            return <button type="button" key={id} onClick={() => selectQuestion(passageIndex, questionIndex)}>
              <span>Q{questionNumber(passageIndex, questionIndex)}</span>{display(entry.prompt)}<strong>{checked[id] && answers[id] === entry.answer ? "✓" : "Review"}</strong>
            </button>;
          })}
        </section>;
      })}</div>
      <div className="reading-actions"><button type="button" className="primary-button" onClick={restart}>Try again</button></div>
    </section>
  );

  const isChecked = Boolean(checked[questionId]);
  const isCorrect = isChecked && answers[questionId] === question.answer;
  const globalQuestionNumber = questionNumber(selectedPassage, selectedQuestion);

  return (
    <section className="reading-practice practice-session reading-session">
      <div className="reading-practice-heading">
        <div className="reading-session-label"><strong>{collection.title}</strong><span>{passages.length} passages</span></div>
        <div className="reading-session-progress"><div><span>Question {globalQuestionNumber} of {questions.length}</span><strong>{completed} / {questions.length}</strong></div><progress value={completed} max={questions.length} aria-label="Questions checked" /></div>
      </div>
      <div className="reading-practice-layout">

        <section className="reading-content">
          <section className="reading-question-card practice-question-card"><div className="practice-prompt-panel">
          <div className="reading-question-topline"><strong>Reading passage</strong><details className="practice-navigation-menu"><summary>Passages &amp; questions</summary>        <nav className="reading-passage-nav" aria-label="Reading passages">
          <h3>Passages</h3>
          {passages.map((item, index) => <button type="button" key={item.id} className={selectedPassage === index ? "active" : ""} onClick={() => selectQuestion(index, 0)}>
            <span>Passage {index + 1}</span><strong>{/^N3-\d+ ·/.test(item.title) ? item.type : display(item.title)}</strong><small>{item.questions.length} {item.questions.length === 1 ? "question" : "questions"}</small>
          </button>)}
          <div className="reading-all-questions"><strong>Questions</strong><div>{questions.map((item, index) => {
            const active = selectedPassage === item.passageIndex && selectedQuestion === item.questionIndex;
            const done = checked[item.id];
            return <button type="button" key={item.id} className={`${active ? "active " : ""}${done ? "done" : ""}`} onClick={() => selectQuestion(item.passageIndex, item.questionIndex)} aria-label={`Question ${index + 1}${done ? ", checked" : ""}`}>{index + 1}</button>;
          })}</div></div>
          <button type="button" className="reading-finish-button" onClick={() => setShowResults(true)}>Finish and view results</button>
        </nav></details></div>
          <div className="reading-content-meta"><span>Passage {selectedPassage + 1} of {passages.length}</span><span>{passage.type}</span></div>
          <h3>{/^N3-\d+ ·/.test(passage.title) ? `${passage.type} ${selectedPassage + 1}` : display(passage.title)}</h3>
          {passage.text ? <div className="reading-passage-text" lang="ja">{display(passage.text)}</div> : <div className="reading-passage-text">{passage.questions[0].sourcePages.filter(page => passage.sourcePages.includes(page.number) || page.number === passage.sourcePages[0] - 1).map(page => <a key={page.number} href={page.src} target="_blank" rel="noreferrer"><img className="practice-key-image" src={page.src} alt={`Reading passage, PDF page ${page.number}`} loading="lazy" /></a>)}</div>}
          {passage.text && question.sourcePages && <details className="reading-source-reference"><summary>View source pages</summary>{question.sourcePages.filter(page => passage.sourcePages.includes(page.number)).map(page => <a key={page.number} href={page.src} target="_blank" rel="noreferrer">PDF page {page.number}</a>)}</details>}
          </div><div className="practice-response-panel">
            <div className="reading-question-topline"><strong>Question {globalQuestionNumber} of {questions.length}</strong><span>{selectedQuestion + 1} of {passage.questions.length} for this passage</span></div>
            <h4 className="practice-question-prompt" lang="ja">{display(question.prompt)}</h4>
            {question.questionImage && <img className="practice-key-image" src={question.questionImage} alt="Source question and choices" />}
            <fieldset className="reading-answer-list" disabled={isChecked}>
              <legend>Select one answer</legend>
              {question.choices.map((choice, index) => <label key={choice} className={`${answers[questionId] === index ? "selected" : ""}${isChecked && index === question.answer ? " correct" : ""}${isChecked && answers[questionId] === index && !isCorrect ? " incorrect" : ""}`}>
                <input type="radio" name={questionId} checked={answers[questionId] === index} onChange={() => { setAnswers(current => ({ ...current, [questionId]: index })); setChecked(current => ({ ...current, [questionId]: true })); }} />
                <span className="reading-option-letter">{"ABCD"[index]}</span><span lang="ja">{display(choice)}</span>
              </label>)}
            </fieldset>
            <div className="reading-question-actions">
              <button type="button" className="secondary-button" disabled={selectedPassage === 0 && selectedQuestion === 0} onClick={() => selectedQuestion > 0 ? setSelectedQuestion((value) => value - 1) : selectQuestion(selectedPassage - 1, passages[selectedPassage - 1].questions.length - 1)}>← Previous</button>
              <button type="button" className="secondary-button" onClick={() => setShowResults(true)}>Results {allAnswered ? "" : `(${completed}/${questions.length})`}</button>
              <button type="button" className="primary-button" onClick={nextQuestion}>{globalQuestionNumber === questions.length ? "Finish →" : "Next →"}</button>
            </div>
          </div></section>
        </section>
      </div>
    </section>
  );
}
