import React, { useEffect, useState } from "react";
import { onValue, ref, set } from "firebase/database";
import { database } from "./firebase.js";
import PracticeSession from "./PracticeSession.jsx";
import StudySessionView from "./StudySessionView.jsx";
import sourceSets from "./n3PracticeBank.json";
import { practiceCategories } from "./practiceCategories.js";

const bundledSets = practiceCategories(sourceSets);

function validateBank(value) {
  const sets = Array.isArray(value) ? value : value?.sets;
  if (!Array.isArray(sets) || sets.length !== 26) throw new Error("Import a JSON bank containing exactly 26 sets.");
  return practiceCategories(sets.map((item, index) => {
    if (!item || !Array.isArray(item.questions) || !item.questions.length) throw new Error(`Set ${index + 1} has no questions.`);
    const questions = item.questions.map((question, questionIndex) => {
      if (!question.prompt || !Array.isArray(question.choices) || question.choices.length !== 4 || !(question.answer === null && question.sourceIssue) && (!Number.isInteger(question.answer) || question.answer < 0 || question.answer > 3)) throw new Error(`Set ${index + 1}, question ${questionIndex + 1} needs a prompt, four choices, and an answer from 0 to 3.`);
      const legacySourceItem = question.sourcePages && question.choices.every((choice) => /^[①②③④]$/.test(choice));
      const corrected = legacySourceItem ? sourceSets[index].questions.find((entry) => entry.id === question.id)
        || sourceSets[index].questions.find((entry) => entry.number === question.number && entry.topic === question.topic)
        || sourceSets[index].questions[questionIndex] : null;
      const sourceReference = corrected || sourceSets[index].questions.find(entry => entry.prompt === question.prompt && entry.number === question.number && entry.topic === question.topic);
      return { ...(corrected || question), sourceQuestionId: sourceReference?.id || question.sourceQuestionId || question.id, id: `n3-${index + 1}-question-${questionIndex + 1}`, number: question.number || questionIndex + 1, topic: question.topic || item.title || `N3-${index + 1}` };
    });
    return { ...item, id: item.id || `n3-${index + 1}`, title: item.title || `N3-${index + 1}`, questions };
  }));
}

export default function Practice({ isEditor = false, showReadings = false, showKanji = true }) {
  const [sets, setSets] = useState(bundledSets);
  const [selectedId, setSelectedId] = useState(bundledSets[0].id);
  const [activeId, setActiveId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [importing, setImporting] = useState(false);
  useEffect(() => onValue(ref(database, "n3Practice/sets"), (snapshot) => {
    const value = snapshot.val();
    if (!value) { setSets(bundledSets); return; }
    try { setSets(validateBank(Array.isArray(value) ? value : Object.values(value))); setError(""); }
    catch { setError("The cloud question bank could not be used. Showing the imported PDF collection."); }
  }, () => { setSets(bundledSets); }), []);

  const availableSets = sets.filter(item => item.questions.length > 0);
  const selected = availableSets.find((item) => item.id === selectedId) || availableSets[0];
  const active = sets.find((item) => item.id === activeId);
  const importBank = async (event) => {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) return;
    setImporting(true); setError(""); setMessage("");
    try {
      const bank = validateBank(JSON.parse(await file.text()));
      if (!window.confirm("Replace the cloud practice bank with these 26 sets?")) return;
      await set(ref(database, "n3Practice/sets"), bank);
      setActiveId(null); setSelectedId(bank[0].id);
      setMessage("Imported all 26 categories.");
    } catch (reason) { setError(reason.message || "Could not import the question bank."); }
    finally { setImporting(false); input.value = ""; }
  };

  if (active?.questions.length) return <StudySessionView label="Practice" onQuit={() => setActiveId(null)}>
    <PracticeSession key={active.id} autoScroll showReadings={showReadings} showKanji={showKanji} questions={active.questions} title={`JLPT N3 · ${active.title}`} source={active.sourceRange ? `FULL-26-DE-日本語能力試験N3.pdf · pages ${active.sourceRange}` : null} />
  </StudySessionView>;

  if (!selected) return <article className="mock-exam-panel"><h2>Practice categories</h2><p>No questions available.</p></article>;

  return <article className="mock-exam-panel">
    <div className="mock-exam-eyebrow">JLPT N3 · Practice</div>
    <h2>Practice categories</h2>
    <div className="mock-exam-actions"><button type="button" className="primary-button" onClick={() => setActiveId(selected.id)}>Start {selected.title}</button><span>{selected.questions.length} questions</span></div>
    {isEditor && <details className="practice-import"><summary>{importing ? "Importing…" : "Import a replacement 26-set JSON bank"}</summary><p>The PDF collection is already available. An imported cloud bank replaces it for signed-in users.</p><input type="file" accept="application/json,.json" onChange={importBank} disabled={importing} /></details>}
    {error && <p role="alert">{error}</p>}
    {message && <p role="status">{message}</p>}
    <div className="mock-exam-set-grid" aria-label="Practice categories">{availableSets.map((item) => <button type="button" key={item.id} className={`mock-exam-set-card${selected.id === item.id ? " selected" : ""}`} aria-pressed={selected.id === item.id} onClick={() => setSelectedId(item.id)}>
      <strong>{item.title}</strong>{!item.questions.length && item.duplicateCount > 0 && <small>Repeated PDF set: {item.duplicateCategories.join(", ")}</small>}<span>{item.questions.length} questions · Vocabulary, Grammar, Reading</span>
      {item.sourceRange && <small>PDF pages {item.sourceRange}{item.printedLabel !== item.title ? ` · printed as ${item.printedLabel}` : ""}</small>}
    </button>)}</div>
    <h3 className="mock-exam-selected-title">{selected.title}</h3>
    {selected.duplicateCount > 0 && <p className="reading-note">{selected.duplicateCount} repeated questions · {selected.duplicateCategories.join(", ")}</p>}
    {selected.reviewCount > 0 && <p className="reading-note">{selected.reviewCount} source items awaiting review.</p>}
    <div className="mock-exam-overview"><div><strong>{selected.questions.length}</strong><span>practice questions</span></div><div><strong>{availableSets.length}</strong><span>categories</span></div><div><strong>At your pace</strong><span>Check answers individually</span></div></div>
  </article>;
}
