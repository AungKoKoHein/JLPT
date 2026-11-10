import React, { useEffect, useState } from "react";
import { onValue, ref, set } from "firebase/database";
import { database } from "./firebase.js";

const emptyLabels = Array.from({ length: 26 }, (_, index) => ({ id: `n3-${index + 1}`, title: `N3-${index + 1}`, questions: [] }));

function validateBank(value) {
  const sets = Array.isArray(value) ? value : value?.sets;
  if (!Array.isArray(sets) || sets.length !== 26) throw new Error("The JSON must contain exactly 26 sets in a top-level array or a `sets` property.");
  for (const [index, setItem] of sets.entries()) {
    if (!setItem || !Array.isArray(setItem.questions) || !setItem.questions.length) throw new Error(`Set ${index + 1} has no questions.`);
    for (const [questionIndex, question] of setItem.questions.entries()) {
      if (!question.prompt || !Array.isArray(question.choices) || question.choices.length !== 4 || !Number.isInteger(question.answer) || question.answer < 0 || question.answer > 3) {
        throw new Error(`Set ${index + 1}, question ${questionIndex + 1} needs a prompt, four choices, and an answer number from 0 to 3.`);
      }
    }
  }
  return sets.map((item, index) => ({ id: item.id || `n3-${index + 1}`, title: item.title || `N3-${index + 1}`, questions: item.questions }));
}

export default function Practice({ isEditor = false }) {
  const [sets, setSets] = useState([]);
  const [selectedId, setSelectedId] = useState("n3-1");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState(null);
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [importing, setImporting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => onValue(ref(database, "n3Practice/sets"), (snapshot) => {
    const value = snapshot.val();
    setSets(Array.isArray(value) ? value.filter(Boolean) : Object.values(value || {}));
    setLoading(false);
    setError("");
  }, (reason) => { setError(reason.message || "Could not load the private practice bank. Check Firebase access rules."); setLoading(false); }), []);

  const categories = sets.length ? sets : emptyLabels;
  const category = categories.find((item) => item.id === selectedId) || categories[0];
  const questions = category?.questions || [];
  const question = questions[questionIndex];
  const selectSet = (id) => { setSelectedId(id); setQuestionIndex(0); setAnswer(null); setChecked(false); setMessage(""); };
  const selectQuestion = (index) => { setQuestionIndex(index); setAnswer(null); setChecked(false); };

  const importBank = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImporting(true); setError(""); setMessage("");
    try {
      const bank = validateBank(JSON.parse(await file.text()));
      if (sets.length && !window.confirm("Replace the current 26-set private practice bank with this file?")) return;
      await set(ref(database, "n3Practice/sets"), bank);
      setSelectedId(bank[0].id);
      setQuestionIndex(0);
      setAnswer(null);
      setChecked(false);
      setMessage(`Imported ${bank.length} categories to the sign-in-protected database.`);
      event.target.value = "";
    } catch (reason) {
      setError(reason.message || "Could not import this practice bank.");
    } finally { setImporting(false); }
  };

  return (
    <article className="practice-panel">
      <div className="practice-heading">
        <div><p className="practice-eyebrow">JLPT N3 · Practice</p><h2>Practice questions</h2><p>Choose a category, answer one question at a time, and check the answer with its explanation.</p></div>
        <span className="practice-set-count">{sets.length || 26} categories</span>
      </div>
      {isEditor && <details className="practice-import">
        <summary>{importing ? "Importing…" : "Import the 26-set question bank"}</summary>
        <div><p>Import a JSON bank with 26 named sets. Question content is stored in Firebase under the sign-in rules and is not added to the public app bundle.</p><label className="practice-file-label">Choose JSON file<input type="file" accept="application/json,.json" onChange={importBank} disabled={importing} /></label></div>
      </details>}
      {error && <p className="practice-access-error" role="alert">{error}</p>}
      {message && <p className="practice-access-message" role="status">{message}</p>}
      {loading ? <p className="practice-empty">Loading the private question bank…</p> : !sets.length ? (
        <div className="practice-empty"><h3>Question bank not loaded yet</h3><p>The app is ready for the 26 categories. Sign in with the Google editor account and import the question bank after its source is cleared for private online use.</p></div>
      ) : (
        <div className="practice-layout">
          <nav className="practice-category-list" aria-label="Practice categories"><h3>Categories</h3>
            {categories.map((item, index) => <button type="button" key={item.id} className={item.id === category.id ? "active" : ""} onClick={() => selectSet(item.id)}><span>{item.title || `N3-${index + 1}`}</span><small>{item.questions.length} questions</small></button>)}
          </nav>
          <section className="practice-workspace">
            <div className="practice-workspace-heading"><div><span>Category</span><h3>{category.title}</h3></div><span>{questions.length ? `Question ${questionIndex + 1} of ${questions.length}` : "No questions"}</span></div>
            {question ? <>
              {question.passage && <div className="practice-passage" lang="ja">{question.passage}</div>}
              <section className="practice-question-card"><h4 lang="ja">{question.prompt}</h4>
                <fieldset className="practice-answer-list" disabled={checked}><legend>Select one answer</legend>{question.choices.map((choice, index) => <label key={`${index}-${choice}`} className={`${answer === index ? "selected" : ""}${checked && index === question.answer ? " correct" : ""}${checked && answer === index && answer !== question.answer ? " incorrect" : ""}`}>
                  <input type="radio" name={`${category.id}-question-${questionIndex}`} checked={answer === index} onChange={() => setAnswer(index)} /><span className="practice-option-letter">{"ABCD"[index]}</span><span lang="ja">{choice}</span>{checked && index === question.answer && <strong>Correct answer</strong>}{checked && answer === index && answer !== question.answer && <strong>Your answer</strong>}
                </label>)}</fieldset>
                {checked && <p className={`practice-feedback ${answer === question.answer ? "correct" : "incorrect"}`} lang="my"><strong>{answer === question.answer ? "မှန်ပါတယ်။ " : "မမှန်သေးပါ။ "}</strong>{question.explanation || ""}</p>}
                <div className="practice-question-actions"><button type="button" className="secondary-button" disabled={questionIndex === 0} onClick={() => selectQuestion(questionIndex - 1)}>← Previous</button>
                  {!checked ? <button type="button" className="primary-button" disabled={answer == null} onClick={() => setChecked(true)}>Check answer</button> : <button type="button" className="primary-button" onClick={() => selectQuestion((questionIndex + 1) % questions.length)}>Next question →</button>}
                </div>
              </section>
            </> : <p className="practice-empty">No questions in this category.</p>}
          </section>
        </div>
      )}
    </article>
  );
}
