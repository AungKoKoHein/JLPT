import React, { useEffect, useState } from "react";
import { onValue, ref, set } from "firebase/database";
import { database } from "./firebase.js";
import ConfirmDialog from "./ConfirmDialog.jsx";
import StartStudyDialog from "./StartStudyDialog.jsx";
import PracticeSession from "./PracticeSession.jsx";
import StudySessionView from "./StudySessionView.jsx";
import "./mockExamDesign.css";
import "./practiceDesign.css";
import sourceSets from "./n3PracticeBank.json";
import { practiceCategories } from "./practiceCategories.js";
import useN3FlaggedQuestions from './useN3FlaggedQuestions.jsx';
import { flaggedCollections } from './n3FlaggedQuestions.js';

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
  const { questions: flaggedQuestions } = useN3FlaggedQuestions();
  const [activeFlagged, setActiveFlagged] = useState(null);
  const [sets, setSets] = useState(bundledSets);
  const [selectedId, setSelectedId] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [startSelection, setStartSelection] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [importing, setImporting] = useState(false);
  const [pendingBank, setPendingBank] = useState(null);
  useEffect(() => onValue(ref(database, "n3Practice/sets"), (snapshot) => {
    const value = snapshot.val();
    if (!value) { setSets(bundledSets); return; }
    try { setSets(validateBank(Array.isArray(value) ? value : Object.values(value))); setError(""); }
    catch { setError("The cloud question bank could not be used. Showing the imported PDF collection."); }
  }, () => { setSets(bundledSets); }), []);

  const availableSets = sets.filter(item => item.questions.length > 0);
  const selected = availableSets.find((item) => item.id === selectedId);
  const active = activeFlagged || sets.find((item) => item.id === activeId);
  const importBank = async (event) => {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) return;
    setImporting(true); setError(""); setMessage("");
    try {
      const bank = validateBank(JSON.parse(await file.text()));
      setPendingBank(bank);
    } catch (reason) { setError(reason.message || "Could not import the question bank."); }
    finally { setImporting(false); input.value = ""; }
  };

  const confirmImport = async () => {
    if (importing || !pendingBank) return;
    const bank = pendingBank;
    setPendingBank(null);
    setImporting(true);
    try {
      await set(ref(database, "n3Practice/sets"), bank);
      setActiveId(null); setSelectedId(null);
      setMessage("Imported all 26 categories.");
    } catch (reason) { setError(reason.message || "Could not import the question bank."); }
    finally { setImporting(false); }
  };

  if (active?.questions.length) return <StudySessionView label="Practice" onQuit={() => { setActiveId(null); setActiveFlagged(null); }}>
    <PracticeSession key={active.id} autoScroll showReadings={showReadings} showKanji={showKanji} questions={active.questions} title={`JLPT N3 · ${active.title}`} source={active.sourceRange ? `FULL-26-DE-日本語能力試験N3.pdf · pages ${active.sourceRange}` : null} />
  </StudySessionView>;

  if (!availableSets.length) return <article className="mock-exam-panel"><h2>Practice categories</h2><p>No questions available.</p></article>;

  return <article className="mock-exam-panel mock-exam-lobby practice-lobby">
    {startSelection && <StartStudyDialog title={startSelection.title} count={startSelection.questions.length} onClose={() => setStartSelection(null)} onStart={() => { setActiveFlagged(null); setActiveId(startSelection.id); setStartSelection(null); }} />}
    {pendingBank && <ConfirmDialog title="Replace the practice bank?" message="Replace the cloud practice bank with these 26 sets?" confirmLabel="Replace practice bank" onClose={() => setPendingBank(null)} onConfirm={confirmImport} />}
    <header className="mock-lobby-hero practice-lobby-hero" lang="my">
      <div><div className="mock-exam-eyebrow">JLPT N3 · လေ့ကျင့်ခန်းများ</div><h2>နေ့တိုင်း လေ့ကျင့်ရင်း ပိုကျွမ်းကျင်လာမယ်။</h2><p>လေ့ကျင့်ခန်းတစ်စုံ ရွေးပြီး ကိုယ့်အချိန်နဲ့ကိုယ် လေ့လာပါ။ အဖြေတစ်ခုချင်းစီကို စစ်ဆေးနိုင်ပါတယ်။</p></div>
      <span className="mock-lobby-symbol" aria-hidden="true"><svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M24 12c-5-5-13-5-19-2v28c6-3 14-3 19 2 5-5 13-5 19-2V10c-6-3-14-3-19 2Zm0 0v28M11 17h7m-7 7h7m12-7h7m-7 7h7" /></svg></span>
    </header>
    <div className="mock-lobby-section-heading" lang="my"><h3>လေ့ကျင့်ခန်း ရွေးချယ်ပါ</h3><p>ဝေါဟာရ၊ သဒ္ဒါနဲ့ စာဖတ်စွမ်းရည်ကို တစ်ဆင့်ချင်း မြှင့်တင်လိုက်ပါ။</p></div>
    <section aria-label="Flagged practice"><h3>မှတ်သားထားသော မေးခွန်းများကို ပြန်လေ့လာရန်</h3><p>လေ့ကျင့်ခန်း သို့မဟုတ် အစမ်းစာမေးပွဲတွင် ပြန်လေ့လာရန် မှတ်သားထားသော မေးခွန်းများဖြစ်ပါသည်။ ဤဘရောက်ဇာတွင် သိမ်းထားပါသည်။</p><div className="mock-exam-set-grid">{flaggedCollections(flaggedQuestions).map(set => <button type="button" className="mock-exam-set-card flagged-practice-card" key={set.id} disabled={!set.questions.length} onClick={() => { setActiveId(null); setActiveFlagged(set); }}><strong>{set.title}</strong><span>{set.questions.length} questions</span></button>)}</div>{!flaggedQuestions.length && <p>ဤနေရာတွင် ပြန်လေ့လာနိုင်ရန် လေ့ကျင့်နေစဉ် သို့မဟုတ် ဖြေဆိုနေစဉ် မေးခွန်းကို မှတ်သားထားပါ။</p>}</section>
    {selected && <div className="mock-exam-actions"><button type="button" className="primary-button" onClick={() => setActiveId(selected.id)}>{selected.title} · စတင်လေ့ကျင့်မည်</button><span>မေးခွန်း {selected.questions.length} ခု</span></div>}
    {isEditor && <details className="practice-import"><summary>{importing ? "Importing…" : "Import a replacement 26-set JSON bank"}</summary><p>PDF မေးခွန်းစုကို အသင့်အသုံးပြုနိုင်ပါသည်။ မေးခွန်းစုအသစ် တင်သွင်းပါက အကောင့်ဝင်ထားသူများအတွက် မူလမေးခွန်းစုကို အစားထိုးပါမည်။</p><input type="file" accept="application/json,.json" onChange={importBank} disabled={importing} /></details>}
    {error && <p role="alert">{error}</p>}
    {message && <p role="status">{message}</p>}
    <div className="mock-exam-set-grid" aria-label="Practice categories">{availableSets.map((item) => <button type="button" key={item.id} className={`mock-exam-set-card${selected?.id === item.id ? " selected" : ""}`} aria-pressed={selected?.id === item.id} onClick={() => { setSelectedId(item.id); setStartSelection(item); }}>
      <strong>{item.title}</strong>{!item.questions.length && item.duplicateCount > 0 && <small>Repeated PDF set: {item.duplicateCategories.join(", ")}</small>}<span>{item.questions.length} questions · Vocabulary, Grammar, Reading</span>
      {item.sourceRange && <small>PDF pages {item.sourceRange}{item.printedLabel !== item.title ? ` · printed as ${item.printedLabel}` : ""}</small>}
    </button>)}</div>
    {selected && <h3 className="mock-exam-selected-title">{selected.title}</h3>}
    {selected?.duplicateCount > 0 && <p className="reading-note">{selected.duplicateCount} repeated questions · {selected.duplicateCategories.join(", ")}</p>}
    {selected?.reviewCount > 0 && <p className="reading-note">{selected.reviewCount} source items awaiting review.</p>}
    {selected && <div className="mock-exam-overview"><div><strong>{selected.questions.length}</strong><span>လေ့ကျင့်ရန် မေးခွန်းများ</span></div><div><strong>{availableSets.length}</strong><span>လေ့ကျင့်ခန်း အစုံအရေအတွက်</span></div><div><strong>အချိန်မကန့်သတ်</strong><span>အဖြေတစ်ခုချင်း စစ်ဆေးနိုင်သည်</span></div></div>}
  </article>;
}
