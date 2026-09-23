import useShuffledCards from "./useShuffledCards.js";
import DeleteDialog from "./DeleteDialog.jsx";
import { removeChapter, removeSubchapter } from "./deleteContainers.js";
import { hasVisibleChapterContent } from "./chapterVisibility.js";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { chapterGroup, groupChapters, sortChapters, renameChapterGroup } from "./chapterGroups.js";
import { routesForLevel, levelFromPath, studyTabFromPath } from "./studyRoutes.js";
import { moveVocabularyCard, resolveVocabularyCards, resolveVocabularySubchapters } from "./vocabularyContent.js";
import Exercises from "./Exercises.jsx";
import SubchapterNav, { subchapterTargetId } from "./SubchapterNav.jsx";
import { resolveExercises, exercisesForView, saveExercise, unassignExercises } from "./exerciseContent.js";
import Kanji, { getKanjiChapterOptions, resolveKanjiCards } from "./Kanji.jsx";
import { useCloudContent } from "./useCloudContent.js";
import CloudStatus from "./CloudStatus.jsx";
import "./app.css";
import TextField from "./TextField.jsx";
import SearchFeedback from "./SearchFeedback.jsx";
import { kanjiExamples } from "./kanjiContent.js";
import { matchesVocabulary, vocabularySearchPlaceholder } from "./vocabularySearch.js";

const hideReadings = (value = "") =>
  value
    .replace(/（[^）]*）/g, "")
    .replace(/\([^)]*\)/g, "");
const chapterTitle = (
  title,
  showMyanmar,
  showReadings,
  showJapanese = true,
) => {
  const visible = showMyanmar
    ? title
    : title
        .split(" / ")
        .filter((part) => !/\p{Script=Myanmar}/u.test(part))
        .join(" / ");
  const text = showJapanese
    ? visible
    : visible
        .split(" / ")
        .filter((part) => /\p{Script=Myanmar}/u.test(part))
        .join(" / ");
  return showReadings ? text : hideReadings(text);
};
const localizedChapterTitle = (chapter, showMyanmar, showReadings, showJapanese = true) =>
  chapterTitle(
    [chapter.title, chapter.titleMyanmar].filter(Boolean).join(" / "),
    showMyanmar,
    showReadings,
    showJapanese,
  );
const normalizeSearchText = (value = "") =>
  String(value)
    .normalize("NFKC")
    .replace(/[\u30A1-\u30F6]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0x60))
    .replace(/[\uFF66-\uFF9D]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xF6))
    .replace(/[\u3000\s\n\r\t]+/g, " ")
    .replace(/[（）()\[\]{}「」『』、。！？・!?.、]/g, " ")
    .trim()
    .toLocaleLowerCase();
const contains = (value, query) => {
  const q = normalizeSearchText(query);
  if (!q) return true;
  return normalizeSearchText(value).includes(q);
};
const parentNumber = (number) => String(number).split(".")[0];

function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const updateVisibility = () => setVisible(window.scrollY > 300);
    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    return () => window.removeEventListener("scroll", updateVisibility);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      className="reading-toggle back-to-top"
      aria-label="Back to Top"
      onClick={() => {
        document
          .querySelector('.study-tabs [aria-selected="true"]')
          ?.focus({ preventScroll: true });
        window.scrollTo({
          top: 0,
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches
            ? "instant"
            : "smooth",
        });
      }}
    >
      <span className="back-to-top-icon" aria-hidden="true" />
    </button>
  );
}

const grammarExamples = (card) => card.examples?.length
  ? card.examples
  : [{ japanese: card.exampleJapanese || "", myanmar: card.exampleMyanmar || "" }];

function GrammarDetails({ card, showReadings, showMyanmar, showJapanese, showExamples = true }) {
  const display = (value) => showReadings ? value : hideReadings(value);
  return <>
    {showExamples && grammarExamples(card).map((example, index) => (
      <div className="grammar-example" key={index}>
        {showJapanese && example.japanese && <p lang="ja">{display(example.japanese)}</p>}
        {showMyanmar && example.myanmar && <p lang="my">{display(example.myanmar)}</p>}
      </div>
    ))}
    {showMyanmar && card.grammarExplanation && <p className="grammar-explanation" lang="my">{card.grammarExplanation}</p>}
  </>;
}

function Flashcard({
  card,
  showReadings,
  showMyanmar,
  showJapanese,
  chapterLabel,
}) {
  const [flipped, setFlipped] = useState(false);
  const display = (value) => (showReadings ? value : hideReadings(value));
  if (card.studyTab === "Grammar") return (
    <div className="grammar-card">
      {chapterLabel && <p className="chapter-tag">{chapterTitle(chapterLabel, showMyanmar, showReadings, showJapanese)}</p>}
      <p className="grammar-heading">
        {showJapanese && <strong className="grammar-pattern" lang="ja">{display(card.term)}</strong>}
        {showJapanese && showMyanmar && card.meaning && " - "}
        {showMyanmar && <span lang="my">{card.meaning}</span>}
      </p>
      <GrammarDetails card={card} showReadings={showReadings} showMyanmar={showMyanmar} showJapanese={showJapanese} />
    </div>
  );
  return (
    <button
      className={`flashcard vocab-card ${flipped ? "flipped" : ""}`}
      onClick={() => setFlipped((v) => !v)}
      aria-label={`${card.term} flashcard`}
    >
      <span className="flash-inner">
        <span className="face front">
          {chapterLabel && (
            <span className="chapter-tag">
              {chapterTitle(
                chapterLabel,
                showMyanmar,
                showReadings,
                showJapanese,
              )}
            </span>
          )}
          <strong lang="ja">{display(card.term)}</strong>
          {showMyanmar && (
            <span className="meaning" lang="my">
              {card.meaning}
            </span>
          )}
        </span>
        <span className="face back">
          <span className="label" data-japanese>
            Japanese Example
          </span>
          <span className="example" lang="ja">
            {display(card.exampleJapanese)}
          </span>
          {showMyanmar && (
            <>
              <span className="label" data-myanmar>
                Myanmar Explanation
              </span>
              <span className="mm sentence" lang="my">
                {display(card.exampleMyanmar) ||
                  "အထက်ပါ ဝါကျတွင် စကားလုံး၏ အဓိပ္ပာယ်နှင့် အသုံးပြုပုံကို လေ့လာပါ။"}
              </span>
            </>
          )}
          {!card.generated && (
            <span className="source-note">Example from your Word study file</span>
          )}
        </span>
      </span>
    </button>
  );
}

function VocabularyBook({ entries, showReadings, showMyanmar, showJapanese, showExamples = true, showChapterLabels = false, manageMode = false, isEditor = false, onEdit, onDelete }) {
  const display = (value = "") => showReadings ? value : hideReadings(value);
  return (
    <ol className="vocabulary-book">
      {entries.map(({ card, chapter }) => (
        <li key={card._id} className="book-entry">
          {showChapterLabels && chapter && (
            <p className="book-chapter-label">{localizedChapterTitle(chapter, showMyanmar, showReadings, showJapanese)}</p>
          )}
          <p className="book-term">
            {showJapanese && <strong lang="ja">{display(card.term)}</strong>}
            {showJapanese && showMyanmar && card.meaning && " — "}
            {showMyanmar && <span lang="my">{card.meaning}</span>}
          </p>
          {card.studyTab === "Grammar" ? <GrammarDetails card={card} showReadings={showReadings} showMyanmar={showMyanmar} showJapanese={showJapanese} showExamples={showExamples} /> : <>
          {showExamples && showJapanese && card.exampleJapanese && (
            <p className="book-example" lang="ja">e.g. {display(card.exampleJapanese)}</p>
          )}
          {showExamples && showMyanmar && card.exampleMyanmar && (
            <p className="book-translation" lang="my">{display(card.exampleMyanmar)}</p>
          )}
          </>}
          {manageMode && isEditor && (
            <div className="item-actions">
              <button type="button" onClick={() => onEdit?.(card)}>Edit</button>
              <button type="button" onClick={() => onDelete?.(card)}>Delete</button>
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}

function ContentEditor({ editor, setEditor, chapterOptions, groups, studyTabs, onSave, onClose, saving, canSave, error }) {
  const set = (field, value) => setEditor((current) => ({ ...current, [field]: value }));
  const chapters = sortChapters(chapterOptions.filter((chapter) => chapter.studyTab === editor.studyTab));
  const availableGroups = groupChapters(chapters, groups.filter((group) => group.studyTab === editor.studyTab));
  const selectedChapter = chapters.find((chapter) => chapter.id === editor.chapterId);
  const subchapters = sortChapters(selectedChapter?.subchapters ?? []);
  const submit = (event) => {
    event.preventDefault();
    onSave(editor);
  };
  const editorTitle =
    editor.mode === "edit"
      ? {
          card: "Edit Flashcard",
          kanji: "Edit Kanji Card",
          exercise: "Edit Exercise",
          group: "Edit Group Title",
          chapter: "Edit Chapter",
          subchapter: "Edit Sub Chapter",
        }[editor.type] ?? "Edit Item"
      : {
          card: "Add Flashcard",
          kanji: "Add Kanji Card",
          exercise: "Add Exercise",
          group: "Add Group",
          chapter: "Add Chapter",
          subchapter: "Add Sub Chapter",
        }[editor.type] ?? "Add Item";
  return (
    <div className="editor-backdrop" role="presentation" onMouseDown={onClose}>
      <form className="editor" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()}>
        <div className="editor-heading">
          <div>
            <p className="eyebrow">Study Content</p>
            <h2>{editorTitle}</h2>
          </div>
          <button type="button" className="icon-button" aria-label="Close editor" onClick={onClose}>
            ×
          </button>

        </div>
        <fieldset className="editor-grid" disabled={saving}>
          <label>
            Type
            <select value={editor.type} onChange={(event) => {
              const type = event.target.value;
              setEditor((current) => ({ ...current, type, ...(type === "group" ? { title: "" } : {}) }));
            }} disabled={editor.mode === "edit"}>
              {editor.studyTab !== "Kanji" && <option value="card">Flashcard</option>}
              {editor.studyTab === "Kanji" && <option value="kanji">Kanji Card</option>}
              <option value="exercise">Exercise</option>
              <option value="group">Group Title</option>
              <option value="chapter">Chapter</option>
              <option value="subchapter">Sub Chapter</option>
            </select>
          </label>
          <label>
            Study Tab
            <select disabled value={editor.studyTab} onChange={(event) => {
              const studyTab = event.target.value;
              const firstChapter = chapterOptions.find((chapter) => chapter.studyTab === studyTab);
              setEditor((current) => ({
                ...current,
                studyTab,
                chapterId: firstChapter?.id ?? "",
                subchapterId: "",
              }));
            }}>
              {studyTabs.filter((label) => editor.type !== "card" || label !== "Kanji").map((label) => (
                <option value={label} key={label}>{label}</option>
              ))}
            </select>
          </label>
          {!["chapter", "group"].includes(editor.type) && <label>
            Chapter
            <select value={editor.chapterId} disabled={!chapters.length} onChange={(event) => {
              const chapterId = event.target.value;
              const chapter = chapters.find((item) => item.id === chapterId);
              setEditor((current) => ({
                ...current,
                chapterId,
                subchapterId: "",
                ...(current.type === "subchapter" ? { mode: "add", id: undefined, sourceId: undefined } : {}),
                number: current.type === "subchapter" ? `${chapter?.number ?? ""}.new` : current.number,
                title: current.type === "subchapter" ? "" : current.title,
                titleMyanmar: current.type === "subchapter" ? "" : current.titleMyanmar,
              }));
            }}>
              {!chapters.length && <option value="">No chapters in this tab</option>}
              {chapters.map((chapter) => (
                <option value={chapter.id} key={chapter.id}>Chapter {chapter.number}: {chapter.title}</option>
              ))}
            </select>
          </label>}
          {editor.type === "chapter" && editor.mode === "edit" && (
            <label>
              Existing Chapter
              <select value={editor.chapterId} onChange={(event) => {
                const chapter = chapters.find((item) => item.id === event.target.value);
                setEditor((current) => ({
                  ...current,
                  chapterId: event.target.value,
                  id: event.target.value,
                  groupTitle: chapter ? chapterGroup(chapter).label : "",
                  groupRange: chapter ? chapterGroup(chapter).range : "",
                  number: chapter?.number ?? current.number,
                  title: chapter?.title ?? current.title,
                  titleMyanmar: chapter?.titleMyanmar ?? current.titleMyanmar,
                }));
              }}>
                {chapters.map((chapter) => (
                  <option value={chapter.id} key={chapter.id}>Chapter {chapter.number}: {chapter.title}</option>
                ))}
              </select>
            </label>
          )}
          {!["subchapter", "chapter", "group"].includes(editor.type) && (
            <label>
              {editor.type === "exercise" ? "Assign to Sub Chapter (Optional)" : "Sub Chapter (Optional)"}
              <select value={editor.subchapterId} onChange={(event) => set("subchapterId", event.target.value)}>
                <option value="">{editor.type === "exercise" ? "Unassigned - Main Exercises Only" : "Main Chapter"}</option>
                {subchapters.map((subchapter) => (
                  <option value={subchapter.id} key={subchapter.id}>Sub Chapter {subchapter.number}: {subchapter.title}</option>
                ))}
              </select>
            </label>
          )}
          {editor.type === "subchapter" && (
            <>
              <label>
                Sub Chapter
                <select value={editor.subchapterId} onChange={(event) => {
                  const subchapterId = event.target.value;
                  const subchapter = subchapters.find((item) => item.id === subchapterId);
                  setEditor((current) => ({
                    ...current,
                    subchapterId,
                    id: subchapterId || undefined,
                    sourceId: subchapter?.sourceId,
                    mode: subchapterId ? "edit" : "add",
                    number: subchapter?.number ?? `${selectedChapter?.number ?? ""}.new`,
                    title: subchapter?.title ?? "",
                    titleMyanmar: subchapter?.titleMyanmar ?? "",
                  }));
                }}>
                  <option value="">New Sub Chapter</option>
                  {subchapters.map((subchapter) => (
                    <option value={subchapter.id} key={subchapter.id}>Sub Chapter {subchapter.number}: {subchapter.title}</option>
                  ))}
                </select>
              </label>
              <label>Sub Chapter Number<TextField fullWidth variant="outlined" size="small" value={editor.number} onChange={(event) => set("number", event.target.value)} placeholder="Optional" /></label>
              <label>Sub Chapter Title<TextField fullWidth variant="outlined" size="small" value={editor.title} onChange={(event) => set("title", event.target.value)} placeholder="家族と友達" required /></label>
              <label>Myanmar Translation<TextField fullWidth variant="outlined" size="small" lang="my" value={editor.titleMyanmar} onChange={(event) => set("titleMyanmar", event.target.value)} placeholder="မိသားစုနှင့် သူငယ်ချင်းများ" /></label>
            </>
          )}
          {editor.type === "group" && <>
            {editor.mode === "edit" && <label>Existing Group<select value={editor.originalGroupTitle || ""} onChange={(event) => setEditor((current) => ({ ...current, originalGroupTitle: event.target.value, title: event.target.value }))}>
              {availableGroups.map((group) => <option key={group.id} value={group.label}>{group.label}</option>)}
            </select></label>}
            <label>Group Title<TextField fullWidth variant="outlined" size="small" value={editor.title} onChange={(event) => set("title", event.target.value)} required /></label>
            <p className="editor-help">After saving, choose this group when adding or editing chapters. The chapter range updates automatically.</p>
          </>}
          {editor.type === "chapter" && (
            <>
              <label>Group Title<select value={editor.groupTitle || ""} onChange={(event) => set("groupTitle", event.target.value)}>
                <option value="">Default group</option>
                {availableGroups.map((group) => <option value={group.label} key={group.id}>{group.label}</option>)}
              </select></label>
              <p className="editor-help">All groups are listed above. To create a group, choose Group Title in Type when adding a new item. Chapter ranges are counted automatically from the chapters in each group.</p>
              <label>Chapter Number<TextField fullWidth variant="outlined" size="small" value={editor.number} onChange={(event) => set("number", event.target.value)} placeholder="Optional" /></label>
              <label>Chapter Title<TextField fullWidth variant="outlined" size="small" value={editor.title} onChange={(event) => set("title", event.target.value)} placeholder="新しい章" required /></label>
              <label>Myanmar Translation<TextField fullWidth variant="outlined" size="small" lang="my" value={editor.titleMyanmar} onChange={(event) => set("titleMyanmar", event.target.value)} placeholder="အခန်း၏ မြန်မာဘာသာပြန်" /></label>
            </>
          )}
          {editor.type === "card" && (
            <>
              <label>
                {editor.studyTab === "Grammar" ? "Card Layout" : "Flashcard Layout"}
                <select value={editor.layout} onChange={(event) => set("layout", event.target.value)}>
                  <option value="standard">Standard</option>
                  <option value="double">Double width (2 cards)</option>
                  <option value="wide">Wide (3 cards)</option>
                </select>
              </label>
              <label>{editor.studyTab === "Grammar" ? "Grammar Pattern" : "Flashcard Front"}<TextField fullWidth variant="outlined" size="small" value={editor.term} onChange={(event) => set("term", event.target.value)} placeholder="Japanese word（reading）" required /></label>
              <label>Myanmar Meaning<TextField fullWidth variant="outlined" size="small" value={editor.meaning} onChange={(event) => set("meaning", event.target.value)} required /></label>
              {editor.studyTab === "Grammar" ? <>
                <div className="grammar-example-editor">
                  {(editor.examples || grammarExamples(editor)).map((example, index, examples) => <fieldset key={index}>
                    <legend>Example {index + 1}</legend>
                    <label>Japanese Sentence<TextField fullWidth variant="outlined" size="small" multiline value={example.japanese} onChange={(event) => set("examples", examples.map((item, i) => i === index ? { ...item, japanese: event.target.value } : item))} required /></label>
                    <label>Myanmar Translation<TextField fullWidth variant="outlined" size="small" multiline lang="my" value={example.myanmar} onChange={(event) => set("examples", examples.map((item, i) => i === index ? { ...item, myanmar: event.target.value } : item))} /></label>
                    {examples.length > 1 && <button type="button" onClick={() => set("examples", examples.filter((_, i) => i !== index))}>Remove Example</button>}
                  </fieldset>)}
                  <button type="button" onClick={() => set("examples", [...(editor.examples || grammarExamples(editor)), { japanese: "", myanmar: "" }])}>+ Add Example</button>
                </div>
                <label className="grammar-explanation-editor">Myanmar Grammar Explanation<TextField fullWidth variant="outlined" size="small" multiline lang="my" value={editor.grammarExplanation || ""} onChange={(event) => set("grammarExplanation", event.target.value)} placeholder="Explain the grammar pattern in Myanmar" /></label>
              </> : <>
                <label>Japanese Example<TextField fullWidth variant="outlined" size="small" multiline value={editor.exampleJapanese} onChange={(event) => set("exampleJapanese", event.target.value)} required /></label>
                <label>Myanmar Explanation<TextField fullWidth variant="outlined" size="small" multiline value={editor.exampleMyanmar} onChange={(event) => set("exampleMyanmar", event.target.value)} /></label>
              </>}
            </>
          )}
          {editor.type === "kanji" && (
            <>
              <label>Kanji Front<TextField fullWidth variant="outlined" size="small" value={editor.kanji} onChange={(event) => set("kanji", event.target.value)} placeholder="漢字" required /></label>
              <label>Myanmar Meaning<TextField fullWidth variant="outlined" size="small" value={editor.meaning} onChange={(event) => set("meaning", event.target.value)} required /></label>
              <label>On’yomi (音読み)<TextField fullWidth variant="outlined" size="small" value={editor.on} onChange={(event) => set("on", event.target.value)} placeholder="オンヨミ" /></label>
              <label>Kun’yomi (訓読み)<TextField fullWidth variant="outlined" size="small" value={editor.kun} onChange={(event) => set("kun", event.target.value)} placeholder="くんよみ" /></label>
              <div className="grammar-example-editor">
                {kanjiExamples(editor).map((example, index, examples) => <fieldset key={index}>
                  <legend>Example {index + 1}</legend>
                  <label>Japanese Sentence<TextField fullWidth variant="outlined" size="small" value={example.japanese} onChange={(event) => set("examples", examples.map((item, i) => i === index ? { ...item, japanese: event.target.value } : item))} required /></label>
                  <label>Myanmar Translation<TextField fullWidth variant="outlined" size="small" lang="my" value={example.myanmar} onChange={(event) => set("examples", examples.map((item, i) => i === index ? { ...item, myanmar: event.target.value } : item))} /></label>
                  <button type="button" disabled={examples.length === 1} onClick={() => set("examples", examples.filter((_, i) => i !== index))}>Remove Example</button>
                </fieldset>)}
                <button type="button" onClick={() => set("examples", [...kanjiExamples(editor), { japanese: "", myanmar: "" }])}>+ Add Example</button>
              </div>
            </>
          )}
          {editor.type === "exercise" && (
            <>
              <p className="editor-help">Exercises always remain in the main chapter list. Assign a sub chapter to show the same exercise there too. Edits update both places. Clear the assignment to remove it from the sub chapter.</p>
              <label>Exercise Group<TextField fullWidth variant="outlined" size="small" value={editor.section} onChange={(event) => set("section", event.target.value)} placeholder="1-3" required /></label>
              <label>Sentence / Question<TextField fullWidth variant="outlined" size="small" multiline value={editor.question} onChange={(event) => set("question", event.target.value)} required /></label>
              <label>Myanmar Sentence / Question<TextField fullWidth variant="outlined" size="small" multiline lang="my" value={editor.questionMyanmar} onChange={(event) => set("questionMyanmar", event.target.value)} /></label>
              <label>Answer Key<TextField fullWidth variant="outlined" size="small" multiline value={editor.answer} onChange={(event) => set("answer", event.target.value)} required /></label>
              <label>Myanmar Answer / Explanation<TextField fullWidth variant="outlined" size="small" multiline lang="my" value={editor.answerMyanmar} onChange={(event) => set("answerMyanmar", event.target.value)} /></label>
              <p className="editor-help">Myanmar fields are optional. Use |text| in a Japanese question to underline it.</p>
            </>
          )}
        </fieldset>
        {error && <p className="cloud-error" role="alert">{error}</p>}
        <div className="editor-actions">
          <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
          <button type="submit" className="primary-button" disabled={saving || !canSave}>{saving ? "Saving..." : editor.mode === "edit" ? "Save Changes" : "Add"}</button>
        </div>
      </form>
    </div>
  );
}

const studyTabs = [
  "Vocab",
  "Grammar",
  "Kanji",
  "Listening",
  "Reading",
  "Mock exam",
];

function App({ level }) {
  const studyRoutes = routesForLevel(level);
  useEffect(() => { document.title = `JLPT ${level.toUpperCase()}`; }, [level]);
  useEffect(() => {
    const closeMenusOutside = (event) => {
      document.querySelectorAll("details.content-edit-menu[open]").forEach((menu) => {
        if (!menu.contains(event.target)) menu.removeAttribute("open");
      });
    };
    document.addEventListener("pointerdown", closeMenusOutside);
    return () => document.removeEventListener("pointerdown", closeMenusOutside);
  }, []);
  const [deleteType, setDeleteType] = useState(null);
  const [deleteId, setDeleteId] = useState("");
  const [studyTab, updateStudyTab] = useState(() => studyTabFromPath(window.location.pathname));
  const setStudyTab = (label) => {
    if (window.location.pathname !== studyRoutes[label]) {
      window.history.pushState(null, "", studyRoutes[label] + window.location.search);
    }
    updateStudyTab(label);
    window.requestAnimationFrame(() => {
      document.getElementById(`study-panel-${studyTabs.indexOf(label)}`)?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
        block: "start",
      });
    });
  };
  useEffect(() => {
    const onPopState = () => updateStudyTab(studyTabFromPath(window.location.pathname));
    window.addEventListener("popstate", onPopState);
    if (window.location.pathname === "/") {
      window.history.replaceState(null, "", studyRoutes.Vocab + window.location.search + window.location.hash);
    }
    return () => window.removeEventListener("popstate", onPopState);
  }, []);
  const isChapterStudy = studyTab !== "Kanji";
  const studyLabel = studyTab === "Vocab" ? "vocabulary" : studyTab.toLowerCase();
  useEffect(() => {
    setChapterQuery("");
    setVocabQuery("");
    setActive("");
    setExerciseSectionId(null);
    setTab("vocabulary");
    setEditor(null);
    setDeleteType(null);
    setShowReadings(false);
    setShowKanjiReadings(studyTab === "Kanji");
    if (studyTab === "Grammar") setGrammarMode("card");
    if (studyTab === "Vocab") setVocabMode("book");
    if (studyTab === "Kanji") setKanjiMode("book");
  }, [studyTab]);
  const [chapterQuery, setChapterQuery] = useState("");
  const [vocabQuery, setVocabQuery] = useState("");
  const [active, setActive] = useState("");
  const [tab, setTab] = useState("vocabulary");
  const [vocabMode, setVocabMode] = useState("book");
  const [grammarMode, setGrammarMode] = useState("card");
  const [kanjiMode, setKanjiMode] = useState("book");
  const bookMode = (studyTab === "Kanji" ? kanjiMode : studyTab === "Grammar" ? grammarMode : vocabMode) === "book";
  const setStudyMode = studyTab === "Kanji" ? setKanjiMode : studyTab === "Grammar" ? setGrammarMode : setVocabMode;
  const [showReadings, setShowReadings] = useState(false);
  const [showKanjiReadings, setShowKanjiReadings] = useState(true);
  const [showJapanese, setShowJapanese] = useState(() => {
    try {
      return localStorage.getItem("jlpt-show-japanese") !== "false";
    } catch {
      return true;
    }
  });
  const [showBookExamples, setShowBookExamples] = useState(() => {
    try {
      return localStorage.getItem("jlpt-show-book-examples") !== "false";
    } catch {
      return true;
    }
  });
  const [showSidebar, setShowSidebar] = useState(true);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [manageMode, setManageMode] = useState(false);
  const [shuffleMode, setShuffleMode] = useState(false);
  const [positionMode, setPositionMode] = useState(false);
  const [exerciseSectionId, setExerciseSectionId] = useState(null);
  const cloud = useCloudContent(level);
  const { content, updateContent: setContent } = cloud;
  const chapters = content.baselineChapters;
  const kanjiChapterOptions = getKanjiChapterOptions(content.baselineKanjiChapters);
  const [editor, setEditor] = useState(null);
  useEffect(() => {
    if (!cloud.isEditor) {
      setManageMode(false);
      setPositionMode(false);
      setEditor(null);
    }
  }, [cloud.isEditor]);
  const controlsRef = useRef(null);
  const exercisePageRef = useRef(null);
  const chapterContentRef = useRef(null);
  const focusChapterContent = () => {
    window.requestAnimationFrame(() => {
      if (window.innerWidth <= 800) {
        chapterContentRef.current?.scrollIntoView({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
          block: "start",
        });
        return;
      }
      const visiblePanel = [...document.querySelectorAll('[role="tabpanel"]')]
        .find((panel) => !panel.hidden);
      (visiblePanel ?? chapterContentRef.current)?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "start",
      });
    });
  };
  useEffect(() => {
    try {
      localStorage.setItem("jlpt-show-japanese", String(showJapanese));
    } catch {}
  }, [showJapanese]);
  useEffect(() => {
    try {
      localStorage.setItem("jlpt-show-book-examples", String(showBookExamples));
    } catch {}
  }, [showBookExamples]);
  const [showMyanmar, setShowMyanmar] = useState(() => {
    try {
      return localStorage.getItem("jlpt-show-myanmar") !== "false";
    } catch {
      return true;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem("jlpt-show-myanmar", String(showMyanmar));
    } catch {
      // The toggle still works when browser storage is unavailable.
    }
  }, [showMyanmar]);
  useEffect(() => {
    if (!controlsOpen) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!controlsRef.current?.contains(event.target)) setControlsOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, [controlsOpen]);
  useEffect(() => {
    if (!exerciseSectionId || window.innerWidth <= 800) return undefined;
    const frame = window.requestAnimationFrame(() => {
      exercisePageRef.current?.focus({ preventScroll: true });
      exercisePageRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [exerciseSectionId]);

  const allVocabularyCards = useMemo(
    () => resolveVocabularyCards(chapters, content).filter((card) => !(content.deletedChapters || []).includes(card.parentChapterId || card.chapterId)),
    [content],
  );
  const vocabularySubchapters = useMemo(
    () => resolveVocabularySubchapters(chapters, content),
    [content],
  );
  const grammarSubchapters = useMemo(
    () => resolveVocabularySubchapters([], content, "Grammar"),
    [content],
  );
  const moveCard = (cardId, direction) => {
    setContent((current) => moveVocabularyCard(chapters, current, cardId, direction));
  };
  const vocabularyChapters = useMemo(
    () => [
      ...chapters.map((chapter) => ({
        ...chapter,
        ...content.chapterOverrides[chapter.id],
        subchapters: vocabularySubchapters.filter(
          (subchapter) => subchapter.parentChapterId === chapter.id &&
            (subchapter.studyTab ?? "Vocab") === "Vocab",
        ),
        cards: allVocabularyCards.filter((card) => card.chapterId === chapter.id && (!card.studyTab || card.studyTab === "Vocab")),
      })),
      ...(content.chapters ?? []).filter((chapter) => (chapter.studyTab ?? "Vocab") === "Vocab").map((chapter) => ({
        ...chapter,
        subchapters: vocabularySubchapters.filter(
          (subchapter) => subchapter.parentChapterId === chapter.id && (subchapter.studyTab ?? "Vocab") === "Vocab",
        ),
        cards: allVocabularyCards.filter((card) => card.chapterId === chapter.id && (!card.studyTab || card.studyTab === "Vocab")),
      })),
    ],
    [content, allVocabularyCards, vocabularySubchapters],
  );
  const chapterOptions = useMemo(
    () => [
      ...vocabularyChapters.map((chapter) => ({ ...chapter, studyTab: "Vocab" })),
      ...kanjiChapterOptions.map((chapter) => ({
        ...chapter,
        ...content.chapterOverrides[chapter.id],
        subchapters: [
          ...chapter.subchapters.filter((section) => !content.deletedSubchapters.includes(section.id) && !content.subchapters.some((item) => item.id === section.id)),
          ...content.subchapters.filter(
            (subchapter) => subchapter.parentChapterId === chapter.id && subchapter.studyTab === "Kanji",
          ),
        ],
      })),
      ...(content.chapters ?? []).filter((chapter) => chapter.studyTab !== "Vocab" && chapter.studyTab != null).map((chapter) => ({
        ...chapter,
        subchapters: (chapter.studyTab === "Grammar" ? grammarSubchapters : content.subchapters.filter((item) => item.studyTab === chapter.studyTab))
          .filter((item) => item.parentChapterId === chapter.id && !content.deletedSubchapters.includes(item.id)),
      })),
    ].filter((chapter) => !(content.deletedChapters || []).includes(chapter.id)),
    [content, vocabularyChapters, grammarSubchapters],
  );

  const allExercises = useMemo(() => resolveExercises(
    content.baselineExercises,
    content,
    chapterOptions.flatMap((chapter) => chapter.subchapters ?? []),
  ), [content, chapterOptions]);
  const userChapters = useMemo(() => chapterOptions
    .filter((chapter) => chapter.studyTab === studyTab)
    .filter((chapter) => hasVisibleChapterContent(chapter, allVocabularyCards, allExercises))
    .map((chapter) => ({ ...chapter, cards: allVocabularyCards.filter((card) => card.chapterId === chapter.id && (card.studyTab ?? "Vocab") === studyTab) })),
    [chapterOptions, allVocabularyCards, allExercises, studyTab]);

  const filteredChapters = useMemo(
    () =>
      chapterQuery.trim()
        ? userChapters.filter((c) => contains(c.title, chapterQuery))
        : userChapters,
    [chapterQuery, userChapters],
  );
  const chapterGroups = useMemo(() => groupChapters(userChapters, (content.groups || []).filter((group) => group.studyTab === studyTab))
    .map((group) => ({ ...group, chapters: group.chapters.filter((chapter) => filteredChapters.some((item) => item.id === chapter.id)) }))
    .filter((group) => !chapterQuery.trim() || group.chapters.length), [userChapters, content.groups, studyTab, filteredChapters, chapterQuery]);
  const selected =
    userChapters.find((c) => c.id === active) ?? filteredChapters[0] ?? userChapters[0];
  const vocabResults = useMemo(() => {
    const q = vocabQuery.trim();
    if (!q)
      return selected?.cards.map((card) => ({ card, chapter: selected })) ?? [];
    return userChapters
      .flatMap((chapter) => [
        ...chapter.cards.map((card) => ({ card, chapter })),
        ...chapter.subchapters.flatMap((subchapter) => allVocabularyCards
          .filter((card) => card.chapterId === subchapter.id && (card.studyTab ?? "Vocab") === studyTab)
          .map((card) => ({ card, chapter: subchapter }))),
      ])
      .filter(({ card }) => matchesVocabulary(card, q));
  }, [vocabQuery, selected, userChapters, allVocabularyCards, studyTab]);
  const vocabSections = selected
    ? [
        { chapter: selected, isSubchapter: false, cards: selected.cards.map((card) => ({ card, chapter: selected })) },
        ...sortChapters(selected.subchapters).map((subchapter) => ({
          chapter: subchapter,
          isSubchapter: true,
          cards: allVocabularyCards
            .filter((card) => card.chapterId === subchapter.id && (card.studyTab ?? "Vocab") === studyTab)
            .map((card) => ({ card, chapter: subchapter })),
        })),
      ]
    : [];
  const shuffleVocabulary = shuffleMode && studyTab === "Vocab";
  const shuffledVocabulary = useShuffledCards(vocabSections.flatMap((section) => section.cards), shuffleVocabulary, (entry) => entry.card._id);
  const displayedVocabSections = shuffleVocabulary && selected
    ? [{ chapter: selected, isSubchapter: false, cards: shuffledVocabulary }]
    : vocabSections.filter((section) => section.isSubchapter || section.cards.length > 0);
  const exercises = selected ? exercisesForView(allExercises, studyTab, selected.id) : [];
  const exercisesForSection = (section) => exercisesForView(
    allExercises, studyTab, selected?.id, section.id === selected?.id ? "" : section.id,
  );
  const exerciseSection = vocabSections.find(
    ({ chapter }) => chapter.id === exerciseSectionId,
  );
  const isGlobalSearch = Boolean(vocabQuery.trim());

  const openEditor = (type, mode = "add", record = {}) => {
    if (!cloud.canEdit) return;
    const selectedTab = studyTab;
    if (record.studyTab && record.studyTab !== selectedTab) return;
    const optionsForTab = chapterOptions.filter((item) => item.studyTab === selectedTab);
    const recordSubchapter = optionsForTab
      .flatMap((chapter) => chapter.subchapters ?? [])
      .find((subchapter) => subchapter.id === record.subchapterId || subchapter.id === record.chapterId);
    const chapter = optionsForTab.find((item) => item.id === (recordSubchapter?.parentChapterId ?? record.parentChapterId ?? record.chapterId ?? selected?.id)) ?? optionsForTab[0];
    const subchapterId = record.subchapterId ?? recordSubchapter?.id ?? (type === "subchapter" ? record.id : "");
    setEditor({
      mode,
      type,
      chapterId: chapter?.id ?? "",
      subchapterId,
      id: record._id ?? record.id,
      studyTab: selectedTab,
      groupTitle: chapter ? chapterGroup(chapter).label : "",
      groupRange: chapter ? chapterGroup(chapter).range : "",
      layout: "standard",
      number: `${chapter?.number ?? "1"}.${(chapter?.subchapters?.length ?? 0) + 1}`,
      title: "",
      titleMyanmar: "",
      term: "",
      meaning: "",
      exampleJapanese: "",
      exampleMyanmar: "",
      section: "1-3",
      question: "",
      answer: "",
      questionMyanmar: "",
      answerMyanmar: "",
      kanji: "",
      on: "",
      kun: "",
      sentence: "",
      ...record,
      ...(type === "kanji" ? { examples: kanjiExamples(record), on: record.readings?.map((r) => r.on).filter(Boolean).join("・") || record.on || "", kun: record.readings?.map((r) => r.kun).filter(Boolean).join("・") || record.kun || "" } : {}),
      studyTab: selectedTab,
      chapterId: recordSubchapter?.parentChapterId ?? chapter?.id ?? "",
      subchapterId,
      id: record._id ?? record.id,
    });
  };
  const saveContent = async (draft) => {
    if (!cloud.canEdit || draft.studyTab !== studyTab) return;
    if (!["chapter", "group"].includes(draft.type) && !chapterOptions.some((chapter) => chapter.id === draft.chapterId && chapter.studyTab === studyTab)) return;
    if (draft.type === "card") {
      setStudyTab(draft.studyTab);
      setActive(draft.chapterId);
      setChapterQuery("");
      setVocabQuery("");
      setExerciseSectionId(null);
      setTab("vocabulary");
    }
    const saved = await setContent((current) => {
      if (draft.type === "group") {
        const title = draft.title.trim();
        if (draft.mode === "edit") return renameChapterGroup(current, chapterOptions, draft.studyTab, draft.originalGroupTitle, title);
        if (!title || (current.groups || []).some((group) => group.studyTab === draft.studyTab && group.title === title)) return current;
        return { ...current, groups: [...(current.groups || []), { id: `group-${Date.now()}`, title, studyTab: draft.studyTab }] };
      }
      if (draft.type === "chapter") {
        const id = draft.mode === "edit" ? draft.chapterId : `user-chapter-${Date.now()}`;
        const fields = { number: draft.number, title: draft.title, titleMyanmar: draft.titleMyanmar, groupTitle: (draft.groupTitle || "").trim() };
        const chapter = { id, ...fields, studyTab: draft.studyTab, subchapters: [] };
        setActive(id);
        if (draft.mode === "edit") {
          if ((current.chapters ?? []).some((item) => item.id === id)) {
            return { ...current, chapters: current.chapters.map((item) => item.id === id ? { ...item, ...fields } : item) };
          }
          return { ...current, chapterOverrides: { ...current.chapterOverrides, [id]: { ...current.chapterOverrides[id], ...fields } } };
        }
        return { ...current, chapters: [...(current.chapters ?? []), chapter] };
      }
      if (draft.type === "subchapter" && draft.mode === "edit") {
        const subchapterId = draft.subchapterId || draft.id;
        if (current.subchapters.some((item) => item.id === subchapterId)) {
          return { ...current, subchapters: current.subchapters.map((item) => item.id === subchapterId ? { ...item, ...(draft.sourceId ? { sourceId: draft.sourceId } : {}), parentChapterId: draft.chapterId, studyTab: draft.studyTab, number: draft.number, title: draft.title, titleMyanmar: draft.titleMyanmar } : item) };
        }
        return { ...current, chapterOverrides: { ...current.chapterOverrides, [subchapterId]: { number: draft.number, title: draft.title, titleMyanmar: draft.titleMyanmar } } };
      }
      if (draft.type === "subchapter") {
        const id = `user-${Date.now()}`;
        setActive(draft.chapterId);
        return { ...current, subchapters: [...current.subchapters, { id, parentChapterId: draft.chapterId, studyTab: draft.studyTab, number: draft.number, title: draft.title, titleMyanmar: draft.titleMyanmar, cards: [] }] };
      }
      if (draft.type === "kanji") {
        const id = draft.id || `user-kanji-${Date.now()}`;
        const item = {
          id,
          _id: id,
          chapterId: draft.chapterId,
          subchapterId: draft.subchapterId,
          studyTab: "Kanji",
          kanji: draft.kanji,
          meaning: draft.meaning,
          readings: [{ kanji: draft.kanji, on: draft.on, kun: draft.kun }],
          examples: kanjiExamples(draft),
          term: draft.kanji,
          layout: draft.layout,
          sentence: kanjiExamples(draft)[0].japanese,
          words: kanjiExamples(draft).map((example) => ({ sentence: example.japanese, explanation: example.myanmar })),
        };
        if (draft.mode === "edit") return { ...current, kanjiOverrides: { ...current.kanjiOverrides, [draft.id]: item } };
        return { ...current, kanjiCards: [...current.kanjiCards, item] };
      }
      if (draft.type === "card") {
        const id = draft.id || `user-card-${Date.now()}`;
        const item = { id, _id: id, chapterId: draft.subchapterId || draft.chapterId, subchapterId: draft.subchapterId || "", parentChapterId: draft.chapterId, studyTab: draft.studyTab, layout: draft.layout, term: draft.term, meaning: draft.meaning, exampleJapanese: draft.exampleJapanese, exampleMyanmar: draft.exampleMyanmar, ...(draft.studyTab === "Grammar" ? { examples: grammarExamples(draft), grammarExplanation: draft.grammarExplanation || "" } : {}), generated: true };
        if (draft.mode === "edit") return { ...current, cardOverrides: { ...current.cardOverrides, [draft.id]: item } };
        return { ...current, cards: [...current.cards, item] };
      }
      return saveExercise(current, draft);
    });
    if (saved) setEditor(null);
  };
  const allKanjiCards = resolveKanjiCards(content);
  const deleteRecord = (type, record) => {
    if (!cloud.canEdit) return;
    setDeleteType(type); setDeleteId(record._id);
  };
  const deleteSubchapter = (chapter) => {
    if (!cloud.canEdit) return;
    setDeleteType("subchapter"); setDeleteId(chapter.id);
  };
  const deletionChapters = chapterOptions.filter((chapter) => chapter.studyTab === studyTab);
  const deletionGroups = groupChapters(deletionChapters, (content.groups || []).filter((group) => group.studyTab === studyTab));
  const deletionChapterById = new Map(deletionChapters.map((chapter) => [chapter.id, chapter]));
  const deletionSubchapterById = new Map(deletionChapters.flatMap((chapter) => (chapter.subchapters || []).map((subchapter) => [subchapter.id, { ...subchapter, chapter }])));
  const deletionOptions = deleteType === "group" ? deletionGroups.filter((group) => group.label !== "Not grouped").map((group) => ({ id: group.label, label: group.label }))
    : deleteType === "chapter" ? sortChapters(deletionChapters).filter((chapter) => chapter.id !== `ungrouped-${studyTab}`).map((chapter) => ({ id: chapter.id, label: `${chapter.number}: ${chapter.title}`, record: chapter }))
    : deleteType === "subchapter" ? deletionChapters.flatMap((chapter) => sortChapters(chapter.subchapters || []).map((section) => ({ id: section.id, label: `${chapter.title} / ${section.number}: ${section.title}`, record: section })))
    : (deleteType === "exercise" ? allExercises : deleteType === "kanji" ? allKanjiCards : allVocabularyCards).filter((record) => (record.studyTab || "Vocab") === studyTab).map((record) => {
      const subchapter = deletionSubchapterById.get(record.subchapterId);
      const chapter = deletionChapterById.get(record.parentChapterId || subchapter?.chapter?.id || record.chapterId);
      return {
        id: record._id,
        label: `${chapter?.title || ""} / ${record.term || record.kanji || record.question}`,
        chapterId: chapter?.id,
        chapterLabel: chapter ? `${chapter.number}: ${chapter.title}` : "",
        subchapterId: subchapter?.id,
        subchapterLabel: subchapter ? `${subchapter.number}: ${subchapter.title}` : "",
        record,
      };
    });
  const deleteSelected = async (deleteContents = false) => {
    if (!cloud.canEdit) return;
    const option = deletionOptions.find((item) => item.id === deleteId);
    if (!option) return;
    if (deleteType === "group") {
      const saved = await setContent((current) => {
        const groupedChapters = deletionGroups.find((group) => group.label === option.id)?.chapters || [];
        const removed = deleteContents ? groupedChapters.reduce((next, chapter) => removeChapter(next, chapter, studyTab === "Kanji" ? allKanjiCards : allVocabularyCards, allExercises, true), current) : current;
        const next = deleteContents ? removed : renameChapterGroup(removed, chapterOptions, studyTab, option.id, "Not grouped");
        return { ...next, groups: next.groups.filter((group) => !(group.studyTab === studyTab && group.title === option.id)) };
      });
      if (saved) setDeleteType(null);
    } else if (deleteType === "chapter") {
      const saved = await setContent((current) => removeChapter(current, option.record, studyTab === "Kanji" ? allKanjiCards : allVocabularyCards, allExercises, deleteContents));
      if (saved) { setDeleteType(null); setActive(""); setExerciseSectionId(null); }
    } else {
      const saved = await setContent((current) => {
        if (deleteType === "subchapter") return removeSubchapter(current, { ...option.record, studyTab }, studyTab === "Kanji" ? allKanjiCards : allVocabularyCards, allExercises, deleteContents);
        const key = deleteType === "exercise" ? "deletedExercises" : deleteType === "kanji" ? "deletedKanjiCards" : "deletedCards";
        return { ...current, [key]: [...new Set([...current[key], option.id])] };
      });
      if (saved) setDeleteType(null);
    }
  };
  const customCardsByTab = useMemo(
    () => Object.fromEntries(
      studyTabs
        .filter((label) => label !== "Vocab" && label !== "Kanji")
        .map((label) => [
          label,
          allVocabularyCards.filter((card) => card.studyTab === label),
        ]),
    ),
    [allVocabularyCards],
  );

  return (
    <main
      data-show-myanmar={showMyanmar}
      data-show-japanese={showJapanese}
      data-show-sidebar={showSidebar}
    >
      <header>
        <div>
          <p className="eyebrow" lang="ja">
            自分用学習ノート
          </p>
          <h1>JLPT {level.toUpperCase()}</h1>
          <nav className="level-switch" aria-label="JLPT level">
            {["n3", "n2"].map((item) => <a key={item} href={routesForLevel(item)[studyTab]} aria-current={item === level ? "page" : undefined}>JLPT {item.toUpperCase()}</a>)}
          </nav>
          <p className="subtitle">Japanese · Myanmar · flashcards by chapter</p>
        </div>
        {cloud.isEditor && <fieldset className="content-actions" aria-label="Manage study content" disabled={!cloud.canEdit}>
          <button type="button" onClick={() => openEditor(!chapterOptions.some((chapter) => chapter.studyTab === studyTab) ? "chapter" : studyTab === "Kanji" ? "kanji" : "subchapter", "add", { studyTab })}>New</button>
          {<details className="content-edit-menu" name="study-content-actions">
            <summary>Edit</summary>
            <div className="content-edit-options" onClick={(event) => { if (event.target.closest("button")) event.currentTarget.parentElement.removeAttribute("open"); }}>
              <button type="button" disabled={!chapterGroups.length} onClick={() => openEditor("group", "edit", { title: chapterGroups[0]?.label || "", originalGroupTitle: chapterGroups[0]?.label || "", studyTab })}>Edit Group Title</button>
              <button type="button" onClick={() => selected && openEditor("chapter", "edit", { ...selected, studyTab })} disabled={!selected}>Edit Chapter</button>
              <button type="button" onClick={() => selected && openEditor("subchapter", "edit", { studyTab, chapterId: selected.id, ...(selected.subchapters[0] || {}) })} disabled={!selected}>Edit Subchapter</button>
            </div>
          </details>}
          {<details className="content-edit-menu" name="study-content-actions">
            <summary>Delete</summary>
            <div className="content-edit-options">
              {[["group", "Group Title"], ["chapter", "Chapter"], ["subchapter", "Subchapter"], [studyTab === "Kanji" ? "kanji" : "card", "Flashcard"], ["exercise", "Exercise"]].map(([type, label]) => <button key={type} type="button" onClick={(event) => { setDeleteType(type); setDeleteId(""); event.currentTarget.closest("details").removeAttribute("open"); }}>Delete {label}</button>)}
            </div>
          </details>}
        </fieldset>}
      </header>
      <CloudStatus cloud={cloud} />
      <div className="study-tabs" role="tablist" aria-label="Study topics">
        {studyTabs.map((label, index) => (
          <button
            key={label}
            type="button"
            role="tab"
            id={`study-tab-${index}`}
            aria-controls={`study-panel-${index}`}
            aria-selected={studyTab === label}
            tabIndex={studyTab === label ? 0 : -1}
            onClick={() => setStudyTab(label)}
            onKeyDown={(event) => {
              let next;
              if (event.key === "ArrowRight")
                next = (index + 1) % studyTabs.length;
              else if (event.key === "ArrowLeft")
                next = (index + studyTabs.length - 1) % studyTabs.length;
              else if (event.key === "Home") next = 0;
              else if (event.key === "End") next = studyTabs.length - 1;
              else return;
              event.preventDefault();
              setStudyTab(studyTabs[next]);
              document.getElementById(`study-tab-${next}`).focus();
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <section
        role="tabpanel"
        id={`study-panel-${isChapterStudy ? studyTabs.indexOf(studyTab) : 0}`}
        aria-labelledby={`study-tab-${isChapterStudy ? studyTabs.indexOf(studyTab) : 0}`}
        hidden={!isChapterStudy}
        tabIndex={0}
      >
        <section className="search-grid">
          <label htmlFor="chapter-search">
            Search Chapters
            <input
              id="chapter-search"
              className={chapterQuery.trim() ? (filteredChapters.length ? "search-box has-results" : "search-box no-results") : "search-box"}
              value={chapterQuery}
              onChange={(e) => setChapterQuery(e.target.value)}
              placeholder="例：家族、性格"
            />
            <SearchFeedback query={chapterQuery} count={filteredChapters.length} noun="chapter" />
          </label>
          <label htmlFor="vocab-search" className="desktop-vocab-search">
            Search every {studyLabel} card
            <input
              id="vocab-search"
              className={`${vocabQuery.trim() ? (vocabResults.length ? "search-box has-results" : "search-box no-results") : "search-box"}${tab === "exercises" ? " search-box-readonly" : ""}`}
              value={vocabQuery}
              onChange={(e) => setVocabQuery(e.target.value)}
              placeholder="例：冷蔵庫、れいぞうこ、冷蔵庫の説明"
              readOnly={tab === "exercises"}
              aria-readonly={tab === "exercises"}
            />
            <SearchFeedback query={tab === "exercises" ? "" : vocabQuery} count={vocabResults.length} />
          </label>
        </section>
        <div className="layout">
          <aside>
            <div className="sidebar-heading">
              <p className="count">Total {filteredChapters.length} chapters</p>
              <button type="button" className="sidebar-toggle" onClick={() => setShowSidebar(!showSidebar)} aria-label={showSidebar ? "Hide chapter sidebar" : "Show chapter sidebar"}>
                <span className={`sidebar-toggle-icon ${showSidebar ? "collapse" : "expand"}`} aria-hidden="true" />
              </button>
            </div>
            <div className="chapter-group">
              {chapterGroups.length ? (
                chapterGroups.map((group) => (
                  <div className="chapter-group-block" key={group.id}>
                    <p className="chapter-group-label">
                      <span className="chapter-group-title">{chapterTitle(group.label, false, showReadings, true)}</span>
                      <span className="chapter-group-range">{showReadings ? group.range : hideReadings(group.range)}</span>
                    </p>
                    <div className="chapter-group-cards">
                    {group.chapters.map((chapter) => (
                      <button
                        className={chapter.id === selected?.id ? "active" : ""}
                        onClick={() => {
                          setActive(chapter.id);
                          setVocabQuery("");
                          focusChapterContent();
                        }}
                        key={chapter.id}
                      >
                        <span>Chapter {chapter.number}</span>
                        <strong>{localizedChapterTitle(chapter, false, showReadings, true)}</strong>
                      </button>
                    ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty search-empty">
                  <p>No searched record found.</p>
                </div>
              )}
            </div>
          </aside>
          <label htmlFor="mobile-vocab-search" className="mobile-vocab-search">
            Search every {studyLabel} card
            <input
              id="mobile-vocab-search"
              className={`${vocabQuery.trim() ? (vocabResults.length ? "search-box has-results" : "search-box no-results") : "search-box"}${tab === "exercises" ? " search-box-readonly" : ""}`}
              value={vocabQuery}
              onChange={(e) => setVocabQuery(e.target.value)}
              placeholder={vocabularySearchPlaceholder}
              readOnly={tab === "exercises"}
              aria-readonly={tab === "exercises"}
            />
            <SearchFeedback query={tab === "exercises" ? "" : vocabQuery} count={vocabResults.length} />
          </label>
          <article ref={chapterContentRef}>
            {selected ? (
              <>
                <p className="eyebrow">
                  {isGlobalSearch
                    ? `${studyLabel} search`
                    : `Chapter ${selected.number}`}
                </p>
                <h2>
                  {isGlobalSearch
                    ? `Results for “${vocabQuery}”`
                    : localizedChapterTitle(selected, showMyanmar, showReadings, showJapanese)}
                </h2>
                <p className="note">
                  Total {" "}
                  {isGlobalSearch
                    ? vocabResults.length
                    : vocabSections.reduce((total, section) => total + section.cards.length, 0)}{" "}
                  {isGlobalSearch
                    ? `matching ${bookMode ? "entries" : "cards"} across all chapters`
                    : bookMode ? `${studyLabel} entries` : "flashcards"}
                </p>
                {!isGlobalSearch && (
                  <div className="tools">
                    <button
                      className={tab === "vocabulary" ? "selected" : ""}
                      onClick={() => setTab("vocabulary")}
                    >
                      {studyTab === "Grammar" ? "Grammar" : "Vocabulary"}
                    </button>
                    <button
                      className={tab === "exercises" ? "selected" : ""}
                      onClick={() => setTab("exercises")}
                    >
                      Exercises
                    </button>
                    {studyTab === "Vocab" && <button
                      type="button"
                      className={shuffleMode ? "selected manage-toggle" : "manage-toggle"}
                      aria-pressed={shuffleMode}
                      onClick={() => { setShuffleMode((value) => !value); setExerciseSectionId(null); }}
                    >
                      Shuffle: {shuffleMode ? "ON" : "OFF"}
                    </button>}
                    {cloud.isEditor && (<button
                      type="button"
                      className={`${manageMode ? "selected " : ""}${studyTab === "Vocab" ? "" : "manage-toggle"}`}
                      aria-pressed={manageMode}
                      disabled={!cloud.canEdit}
                      onClick={() => setManageMode((value) => !value)}
                    >
                      Manage: {manageMode ? "ON" : "OFF"}
                    </button>)}
                    {!bookMode && cloud.isEditor && (<button
                      type="button"
                      className={positionMode ? "selected" : ""}
                      aria-pressed={positionMode}
                      disabled={!cloud.canEdit}
                      onClick={() => setPositionMode((value) => !value)}
                    >
                      Positions: {positionMode ? "ON" : "OFF"}
                    </button>)}
                  </div>
                )}
                {isGlobalSearch || tab === "vocabulary" ? (
                  exerciseSection ? (
                    <section
                      className="dedicated-exercise-page"
                      ref={exercisePageRef}
                      tabIndex={-1}
                      aria-label="Dedicated exercises"
                    >
                      {!exerciseSection.isSubchapter && <p className="eyebrow">
                        Chapter {exerciseSection.chapter.number}
                      </p>}
                      <h2 lang="ja">
                        {localizedChapterTitle(exerciseSection.chapter, showMyanmar, showReadings, showJapanese)}
                      </h2>
                      <Exercises
                        key={exerciseSection.chapter.id}
                        exercises={exercisesForSection(exerciseSection.chapter)}
                        showReadings={showReadings}
                        showMyanmar={showMyanmar}
                        assignmentLabel={exerciseSection.isSubchapter ? localizedChapterTitle(exerciseSection.chapter, showMyanmar, showReadings, showJapanese) : undefined}
                        onAdd={!bookMode && cloud.canEdit ? () => openEditor("exercise", "add", { studyTab, chapterId: selected.id, subchapterId: exerciseSection.isSubchapter ? exerciseSection.chapter.id : "" }) : undefined}
                        onEdit={!bookMode && manageMode && cloud.isEditor ? (item) => openEditor("exercise", "edit", { ...item, studyTab }) : undefined}
                        onDelete={!bookMode && manageMode && cloud.isEditor ? (item) => deleteRecord("exercise", item) : undefined}
                      />
                    </section>
                  ) : isGlobalSearch ? (
                    vocabResults.length ? (
                      bookMode ? (
                        <VocabularyBook entries={vocabResults} showReadings={showReadings} showMyanmar={showMyanmar} showJapanese={showJapanese} showExamples showChapterLabels manageMode={manageMode} isEditor={cloud.isEditor} onEdit={(card) => openEditor("card", "edit", card)} onDelete={(card) => deleteRecord("card", card)} />
                      ) : (
                      <section className="cards">
                        {vocabResults.map(({ card, chapter }, i) => (
                          <div className={`managed-item card-layout-${card.layout || "standard"} search-hit`} key={`${chapter.id}-${card._id ?? card.term}-${i}`}>
                            <Flashcard card={card} showReadings={showReadings} showMyanmar={showMyanmar} showJapanese={showJapanese} chapterLabel={chapter.title} />
                            {manageMode && cloud.isEditor && (
                              <div className="item-actions">
                                <button type="button" onClick={() => openEditor("card", "edit", card)}>Edit</button>
                                <button type="button" onClick={() => deleteRecord("card", card)}>Delete</button>
                              </div>
                            )}
                          </div>
                        ))}
                      </section>
                      )
                    ) : (
                      <div className="empty search-empty">
                        <p>No searched record found.</p>
                      </div>
                    )
                  ) : (
                    <div className="vocab-sections">
                      {!shuffleVocabulary && <SubchapterNav sections={vocabSections.filter((section) => section.isSubchapter).map((section) => section.chapter)} />}
                      {displayedVocabSections.map(({ chapter, isSubchapter, cards: sectionCards }) => (
                        <section className="vocab-section" key={chapter.id}>
                          {isSubchapter && <div className="vocab-section-heading">
                            <div>
                              <h3 lang="ja" id={isSubchapter ? subchapterTargetId(chapter.id) : undefined} tabIndex={isSubchapter ? -1 : undefined}>{localizedChapterTitle(chapter, showMyanmar, showReadings, showJapanese)}</h3>
                            </div>
                            <div className="vocab-section-actions">
                              {isSubchapter && <button
                                type="button"
                                className={`section-exercise-button ${exerciseSectionId === chapter.id ? "active" : ""}`}
                                aria-label={`Show Exercises For ${chapter.title}`}
                                aria-pressed={exerciseSectionId === chapter.id}
                                onClick={() => setExerciseSectionId((current) => current === chapter.id ? null : chapter.id)}
                              >
                                <span aria-hidden="true">▤</span>
                                <span className="sr-only">Exercises</span>
                              </button>}
                              {!bookMode && isSubchapter && manageMode && cloud.isEditor && (
                                <div className="item-actions">
                                <button type="button" onClick={() => openEditor("subchapter", "edit", { ...chapter, chapterId: chapter.parentChapterId })}>Edit</button>
                                <button type="button" onClick={() => deleteSubchapter(chapter)}>Delete</button>
                                </div>
                              )}
                            </div>
                          </div>}
                          {sectionCards.length > 0 && isSubchapter && <p className="note">{sectionCards.length} {bookMode ? `${studyLabel} entries` : "flashcards"}</p>}
                          {bookMode ? (
                            <VocabularyBook entries={sectionCards} showReadings={showReadings} showMyanmar={showMyanmar} showJapanese={showJapanese} showExamples={showBookExamples} manageMode={manageMode} isEditor={cloud.isEditor} onEdit={(card) => openEditor("card", "edit", card)} onDelete={(card) => deleteRecord("card", card)} />
                          ) : (
                          <section className="cards">
                            {sectionCards.map(({ card }, i) => (
                              <div className={`managed-item card-layout-${card.layout || "standard"}`} key={card._id}>
                                <Flashcard card={card} showReadings={showReadings} showMyanmar={showMyanmar} showJapanese={showJapanese} />
                                {positionMode && !shuffleVocabulary && cloud.isEditor && (
                                  <div className="card-position-actions" role="group" aria-label={`Position of ${card.term}`}>
                                    <button type="button" disabled={i === 0} onClick={() => moveCard(card._id, -1)} aria-label={`Move ${card.term} backward`}>
                                      ← Backward
                                    </button>
                                    <span aria-live="polite">{i + 1} / {sectionCards.length}</span>
                                    <button type="button" disabled={i === sectionCards.length - 1} onClick={() => moveCard(card._id, 1)} aria-label={`Move ${card.term} forward`}>
                                      Forward →
                                    </button>
                                  </div>
                                )}
                                {manageMode && cloud.isEditor && (
                                  <div className="item-actions">
                                    <button type="button" onClick={() => openEditor("card", "edit", card)}>Edit</button>
                                    <button type="button" onClick={() => deleteRecord("card", card)}>Delete</button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </section>
                          )}
                        </section>
                      ))}
                    </div>
                  )
                ) : (
                  <Exercises
                    key={selected.id}
                    exercises={exercises}
                    showReadings={showReadings}
                    showMyanmar={showMyanmar}
                    onAdd={!bookMode && cloud.canEdit ? () => openEditor("exercise", "add", { studyTab, chapterId: selected.id }) : undefined}
                    onEdit={!bookMode && manageMode && cloud.isEditor ? (item) => openEditor("exercise", "edit", item) : undefined}
                    onDelete={!bookMode && manageMode && cloud.isEditor ? (item) => deleteRecord("exercise", item) : undefined}
                  />
                )}
              </>
            ) : (
              <div className="empty search-empty">
                <p>{studyTab === "Grammar" && !userChapters.length ? "No grammar chapters yet. An owner can use + Add Grammar to create the first chapter." : !userChapters.length ? `No ${studyLabel} chapters yet. The owner can use New to add the first chapter.` : "No searched record found."}</p>
              </div>
            )}
          </article>
        </div>
      </section>
      {studyTabs.slice(1).map((label, index) => label !== "Kanji" ? null : (
        <section
          key={label}
          role="tabpanel"
          id={`study-panel-${index + 1}`}
          aria-labelledby={`study-tab-${index + 1}`}
          hidden={studyTab !== label}
          tabIndex={0}
        >
          {label === "Kanji" ? (
            <Kanji
              isActive={studyTab === "Kanji"}
              mode={kanjiMode}
              allExercises={allExercises}
              showMyanmar={showMyanmar}
              showReadings={showReadings}
              showKanjiReadings={showKanjiReadings}
              manageMode={manageMode && cloud.isEditor}
              canEdit={cloud.canEdit}
              isEditor={cloud.isEditor}
              setManageMode={setManageMode}
              content={content}
              openEditor={openEditor}
              deleteRecord={deleteRecord}
              deleteSubchapter={deleteSubchapter}
              onChapterChange={focusChapterContent}
            />
          ) : (
            <article className="custom-study-panel">
              <p className="eyebrow">{label}</p>
              <h2>{label} study cards</h2>
              <div className="tools">
                {cloud.isEditor && (<button
                  type="button"
                  className={manageMode ? "selected" : ""}
                  aria-pressed={manageMode}
                  disabled={!cloud.canEdit}
                      onClick={() => setManageMode((value) => !value)}
                >
                  Manage: {manageMode ? "ON" : "OFF"}
                </button>)}
              </div>
              {customCardsByTab[label]?.length ? (
                <section className="cards">
                  {customCardsByTab[label].map((card) => (
                    <div className={`managed-item card-layout-${card.layout || "standard"}`} key={card._id}>
                      <Flashcard card={card} showReadings={showReadings} showMyanmar={showMyanmar} showJapanese={showJapanese} />
                      {manageMode && cloud.isEditor && (
                        <div className="item-actions">
                          <button type="button" onClick={() => openEditor("card", "edit", card)}>Edit</button>
                          <button type="button" onClick={() => deleteRecord("card", card)}>Delete</button>
                        </div>
                      )}
                    </div>
                  ))}
                </section>
              ) : (
                <div className="empty study-placeholder">
                  <p>No {label.toLowerCase()} cards yet. Use “+ Add {label}” above to create one.</p>
                </div>
              )}
            </article>
          )}
        </section>
      ))}
      {deleteType && cloud.isEditor && <DeleteDialog key={`${studyTab}-${deleteType}`} type={deleteType} options={deletionOptions} selectedId={deleteId} onSelect={setDeleteId} onClose={() => setDeleteType(null)} onDelete={deleteSelected} saving={cloud.saving} canDelete={cloud.canEdit} error={cloud.error} />}
      {editor && cloud.isEditor && <ContentEditor saving={cloud.saving} canSave={cloud.canEdit} error={cloud.error || (!cloud.connected ? "Connection lost. Keep this form open and reconnect to save." : "")} editor={editor} setEditor={setEditor} chapterOptions={chapterOptions} groups={content.groups || []} studyTabs={studyTabs} onSave={saveContent} onClose={() => setEditor(null)} />}
      {studyTab === "Vocab" && selected && !isGlobalSearch && (tab === "exercises" || exerciseSection) && <button
        type="button" className="back-to-vocabulary"
        onClick={() => { setTab("vocabulary"); setExerciseSectionId(null); focusChapterContent(); }}
      >← Back to Vocabulary</button>}
      <div className="study-controls" ref={controlsRef}>
        {controlsOpen && (
          <div className="controls-panel" id="study-controls-panel">
            <p className="controls-title">Study View</p>
              <div className="vocab-mode-switch" role="group" aria-label={`${studyTab} display mode`}>
                <button type="button" aria-pressed={!bookMode} onClick={() => setStudyMode("card")}>Card mode</button>
                <button type="button" aria-pressed={bookMode} onClick={() => setStudyMode("book")}>Book mode</button>
              </div>
            <button
              type="button"
              aria-pressed={showJapanese}
              onClick={() => {
                setShowJapanese(!showJapanese);
                if (showJapanese) setShowMyanmar(true);
              }}
            >
              Japanese <span>{showJapanese ? "ON" : "OFF"}</span>
            </button>
            <button
              type="button"
              aria-pressed={showMyanmar}
              onClick={() => {
                setShowMyanmar(!showMyanmar);
                if (showMyanmar) setShowJapanese(true);
              }}
            >
              Myanmar <span>{showMyanmar ? "ON" : "OFF"}</span>
            </button>
            <button
              type="button"
              aria-pressed={showReadings}
              disabled={!showJapanese}
              onClick={() => setShowReadings(!showReadings)}
            >
              Readings <span>{showReadings ? "ON" : "OFF"}</span>
            </button>
            {isChapterStudy && bookMode && (
              <button
                type="button"
                aria-pressed={showBookExamples}
                onClick={() => setShowBookExamples(!showBookExamples)}
              >
                Example sentences <span>{showBookExamples ? "Shown" : "Hidden"}</span>
              </button>
            )}
            {studyTab === "Kanji" && (
              <button
                type="button"
                aria-pressed={showKanjiReadings}
                onClick={() => setShowKanjiReadings(!showKanjiReadings)}
              >
                Kanji On/Kun <span>{showKanjiReadings ? "Shown" : "Hidden"}</span>
              </button>
            )}
          </div>
        )}
        <div className="controls-actions">
          <BackToTop />
          <button
            type="button"
            className="controls-launcher"
            aria-expanded={controlsOpen}
            aria-controls="study-controls-panel"
            onClick={() => setControlsOpen(!controlsOpen)}
          >
            {" "}
            {controlsOpen ? "Close Controls" : "? Study Controls"}{" "}
          </button>
        </div>
      </div>
    </main>
  );
}
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App level={levelFromPath(window.location.pathname)} />
  </React.StrictMode>,
);
