import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { chapters } from "./data/n3Vocabulary.js";
import { exercisesByChapter } from "./data/exercises.js";
import { moveVocabularyCard, resolveVocabularyCards } from "./vocabularyContent.js";
import Kanji, { kanjiChapterOptions } from "./Kanji.jsx";
import "./styles.css";
import "./extras.css";

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
const contains = (value, query) =>
  value.toLocaleLowerCase().includes(query.toLocaleLowerCase());
const parentNumber = (number) => String(number).split(".")[0];
const emptyContent = {
  cards: [],
  exercises: [],
  subchapters: [],
  cardOverrides: {},
  exerciseOverrides: {},
  deletedCards: [],
  deletedExercises: [],
  chapterOverrides: {},
  chapters: [],
  kanjiCards: [],
  kanjiOverrides: {},
  deletedKanjiCards: [],
};
const readContent = () => {
  try {
    const saved = JSON.parse(localStorage.getItem("jlpt-user-content") || "{}");
    return {
      ...emptyContent,
      ...saved,
      chapters: saved.chapters ?? [],
      kanjiCards: saved.kanjiCards ?? [],
      kanjiOverrides: saved.kanjiOverrides ?? {},
      deletedKanjiCards: saved.deletedKanjiCards ?? [],
      chapterOverrides: saved.chapterOverrides ?? {},
      cardOverrides: saved.cardOverrides ?? {},
      exerciseOverrides: saved.exerciseOverrides ?? {},
      subchapters: saved.subchapters ?? [],
      cards: saved.cards ?? [],
      exercises: saved.exercises ?? [],
      deletedCards: saved.deletedCards ?? [],
      deletedExercises: saved.deletedExercises ?? [],
    };
  } catch {
    return emptyContent;
  }
};

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
      aria-label="Back to top"
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
      <span aria-hidden="true" width="1em" height="1em">
        ▲
      </span>
    </button>
  );
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
            Japanese example
          </span>
          <span className="example" lang="ja">
            {display(card.exampleJapanese)}
          </span>
          {showMyanmar && (
            <>
              <span className="label" data-myanmar>
                Myanmar explanation
              </span>
              <span className="mm sentence" lang="my">
                {display(card.exampleMyanmar) ||
                  "အထက်ပါ ဝါကျတွင် စကားလုံး၏ အဓိပ္ပာယ်နှင့် အသုံးပြုပုံကို လေ့လာပါ။"}
              </span>
            </>
          )}
          <span className="source-note">
            {card.generated
              ? "Study explanation added for this card"
              : "Example from your Word study file"}
          </span>
        </span>
      </span>
    </button>
  );
}

function Exercises({ exercises, showReadings, onEdit, onDelete }) {
  const [showAnswers, setShowAnswers] = useState(false);
  const display = (text) =>
    showReadings
      ? text
      : text
          .replace(/（[ぁ-ゖァ-ヶー]+）/g, "")
          .replace(/\s*\([ぁ-ゖァ-ヶー]+\)/g, "");
  return (
    <section className="exercises" aria-label="Exercises">
      <div className="tools exercise-toolbar">
        <p>{exercises.length} sentences · Fill in the blanks</p>
      </div>
      <button
        type="button"
        className="reading-toggle answer-key-toggle"
        aria-label="Show answer key"
        aria-pressed={showAnswers}
        onClick={() => setShowAnswers((value) => !value)}
      >
        Answer key: {showAnswers ? "ON" : "OFF"}
      </button>
      {[...new Set(exercises.map((item) => item.section))].map((section) => (
        <section key={section} className="exercise-section">
          <h3>Practice {section}</h3>
          <ol>
            {exercises
              .filter((item) => item.section === section)
              .map((item, index) => (
                <li key={index}>
                  <p className="exercise-question">{display(item.question)}</p>
                  {showAnswers && (
                    <p className="exercise-answer">
                      <strong>Answer:</strong> {display(item.answer)}
                    </p>
                  )}
                  {(onEdit || onDelete) && (
                    <div className="item-actions">
                      {onEdit && <button type="button" onClick={() => onEdit(item)}>Edit</button>}
                      {onDelete && <button type="button" onClick={() => onDelete(item)}>Delete</button>}
                    </div>
                  )}
                </li>
              ))}
          </ol>
        </section>
      ))}
      {!exercises.length && <p>No exercises for this chapter yet.</p>}
    </section>
  );
}

function ContentEditor({ editor, setEditor, chapterOptions, studyTabs, onSave, onClose }) {
  const set = (field, value) => setEditor((current) => ({ ...current, [field]: value }));
  const chapters = chapterOptions.filter((chapter) => chapter.studyTab === editor.studyTab);
  const selectedChapter = chapters.find((chapter) => chapter.id === editor.chapterId);
  const subchapters = selectedChapter?.subchapters ?? [];
  const submit = (event) => {
    event.preventDefault();
    onSave(editor);
  };
  return (
    <div className="editor-backdrop" role="presentation" onMouseDown={onClose}>
      <form className="editor" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()}>
        <div className="editor-heading">
          <div>
            <p className="eyebrow">Study content</p>
            <h2>{editor.mode === "edit" ? "Edit item" : "Add item"}</h2>
          </div>
          <button type="button" className="icon-button" aria-label="Close editor" onClick={onClose}>
            ×
          </button>
          {editor.type === "subchapter" && editor.mode === "edit" && (
            <button
              type="button"
              className="secondary-button"
              onClick={() => setEditor((current) => ({
                ...current,
                mode: "add",
                id: undefined,
                number: `${selectedChapter?.number ?? ""}.new`,
                title: "",
              }))}
            >
              New subchapter
            </button>
          )}
        </div>
        <div className="editor-grid">
          <label>
            Type
            <select value={editor.type} onChange={(event) => set("type", event.target.value)} disabled={editor.mode === "edit"}>
              <option value="card">Flashcard</option>
              <option value="kanji">Kanji card</option>
              <option value="exercise">Exercise</option>
              <option value="chapter">Chapter</option>
              <option value="subchapter">Subchapter</option>
            </select>
          </label>
          <label>
            Study tab
            <select value={editor.studyTab} onChange={(event) => {
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
          {editor.type !== "chapter" && <label>
            Chapter
            <select value={editor.chapterId} disabled={!chapters.length} onChange={(event) => {
              const chapterId = event.target.value;
              const chapter = chapters.find((item) => item.id === chapterId);
              setEditor((current) => ({
                ...current,
                chapterId,
                subchapterId: "",
                number: current.type === "subchapter" ? `${chapter?.number ?? ""}.new` : current.number,
                title: current.type === "subchapter" ? "" : current.title,
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
              Existing chapter
              <select value={editor.chapterId} onChange={(event) => {
                const chapter = chapters.find((item) => item.id === event.target.value);
                setEditor((current) => ({
                  ...current,
                  chapterId: event.target.value,
                  number: chapter?.number ?? current.number,
                  title: chapter?.title ?? current.title,
                }));
              }}>
                {chapters.map((chapter) => (
                  <option value={chapter.id} key={chapter.id}>Chapter {chapter.number}: {chapter.title}</option>
                ))}
              </select>
            </label>
          )}
          {editor.type !== "subchapter" && editor.type !== "chapter" && (
            <label>
              Subchapter (optional)
              <select value={editor.subchapterId} onChange={(event) => set("subchapterId", event.target.value)}>
                <option value="">Main chapter</option>
                {subchapters.map((subchapter) => (
                  <option value={subchapter.id} key={subchapter.id}>Subchapter {subchapter.number}: {subchapter.title}</option>
                ))}
              </select>
            </label>
          )}
          {editor.type === "subchapter" && (
            <>
              <label>
                Subchapter
                <select value={editor.subchapterId} onChange={(event) => {
                  const subchapterId = event.target.value;
                  const subchapter = subchapters.find((item) => item.id === subchapterId);
                  setEditor((current) => ({
                    ...current,
                    subchapterId,
                    number: subchapter?.number ?? `${selectedChapter?.number ?? ""}.new`,
                    title: subchapter?.title ?? "",
                  }));
                }}>
                  <option value="">New subchapter</option>
                  {subchapters.map((subchapter) => (
                    <option value={subchapter.id} key={subchapter.id}>Subchapter {subchapter.number}: {subchapter.title}</option>
                  ))}
                </select>
              </label>
              <label>Subchapter number<input value={editor.number} onChange={(event) => set("number", event.target.value)} placeholder={`${selectedChapter?.number}.new`} required /></label>
              <label>Subchapter title<input value={editor.title} onChange={(event) => set("title", event.target.value)} placeholder="家族と友達" required /></label>
            </>
          )}
          {editor.type === "chapter" && (
            <>
              <label>Chapter number<input value={editor.number} onChange={(event) => set("number", event.target.value)} placeholder="new" required /></label>
              <label>Chapter title<input value={editor.title} onChange={(event) => set("title", event.target.value)} placeholder="新しい章" required /></label>
            </>
          )}
          {editor.type === "card" && (
            <>
              <label>
                Flashcard layout
                <select value={editor.layout} onChange={(event) => set("layout", event.target.value)}>
                  <option value="standard">Standard</option>
                  <option value="double">Double width (2 cards)</option>
                  <option value="wide">Wide (3 cards)</option>
                </select>
              </label>
              <label>Flashcard front<input value={editor.term} onChange={(event) => set("term", event.target.value)} placeholder="Japanese word（reading）" required /></label>
              <label>Myanmar meaning<input value={editor.meaning} onChange={(event) => set("meaning", event.target.value)} required /></label>
              <label>Japanese example<textarea value={editor.exampleJapanese} onChange={(event) => set("exampleJapanese", event.target.value)} required /></label>
              <label>Myanmar explanation<textarea value={editor.exampleMyanmar} onChange={(event) => set("exampleMyanmar", event.target.value)} /></label>
            </>
          )}
          {editor.type === "kanji" && (
            <>
              <label>
                Flashcard layout
                <select value={editor.layout} onChange={(event) => set("layout", event.target.value)}>
                  <option value="standard">Standard</option>
                  <option value="double">Double width (2 cards)</option>
                  <option value="wide">Wide (3 cards)</option>
                </select>
              </label>
              <label>Kanji front<input value={editor.kanji} onChange={(event) => set("kanji", event.target.value)} placeholder="漢字" required /></label>
              <label>Myanmar meaning<input value={editor.meaning} onChange={(event) => set("meaning", event.target.value)} required /></label>
              <label>On’yomi (音読み)<input value={editor.on} onChange={(event) => set("on", event.target.value)} placeholder="オンヨミ" /></label>
              <label>Kun’yomi (訓読み)<input value={editor.kun} onChange={(event) => set("kun", event.target.value)} placeholder="くんよみ" /></label>
              <label>Japanese sentence<textarea value={editor.sentence} onChange={(event) => set("sentence", event.target.value)} /></label>
              <label>Myanmar explanation<textarea value={editor.exampleMyanmar} onChange={(event) => set("exampleMyanmar", event.target.value)} /></label>
            </>
          )}
          {editor.type === "exercise" && (
            <>
              <label>Exercise group<input value={editor.section} onChange={(event) => set("section", event.target.value)} placeholder="1-3" required /></label>
              <label>Sentence / question<textarea value={editor.question} onChange={(event) => set("question", event.target.value)} required /></label>
              <label>Answer key<textarea value={editor.answer} onChange={(event) => set("answer", event.target.value)} required /></label>
            </>
          )}
        </div>
        <div className="editor-actions">
          <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
          <button type="submit" className="primary-button">{editor.mode === "edit" ? "Save changes" : "Add"}</button>
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

function App() {
  const [studyTab, setStudyTab] = useState("Vocab");
  const [chapterQuery, setChapterQuery] = useState("");
  const [vocabQuery, setVocabQuery] = useState("");
  const [active, setActive] = useState(chapters[0]?.id ?? "");
  const [tab, setTab] = useState("vocabulary");
  const [showReadings, setShowReadings] = useState(true);
  const [showKanjiReadings, setShowKanjiReadings] = useState(() => {
    try {
      return localStorage.getItem("jlpt-show-kanji-readings") !== "false";
    } catch {
      return true;
    }
  });
  const [showJapanese, setShowJapanese] = useState(() => {
    try {
      return localStorage.getItem("jlpt-show-japanese") !== "false";
    } catch {
      return true;
    }
  });
  const [showSidebar, setShowSidebar] = useState(true);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [manageMode, setManageMode] = useState(false);
  const [positionMode, setPositionMode] = useState(false);
  const [exerciseSectionId, setExerciseSectionId] = useState(null);
  const [content, setContent] = useState(readContent);
  const [editor, setEditor] = useState(null);
  const controlsRef = useRef(null);
  const exercisePageRef = useRef(null);
  const chapterContentRef = useRef(null);
  const focusChapterContent = () => {
    window.requestAnimationFrame(() => {
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
      localStorage.setItem("jlpt-show-kanji-readings", String(showKanjiReadings));
    } catch {}
  }, [showKanjiReadings]);
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
    try {
      localStorage.setItem("jlpt-user-content", JSON.stringify(content));
    } catch {}
  }, [content]);
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
    () => resolveVocabularyCards(chapters, content),
    [content],
  );
  const moveCard = (cardId, direction) => {
    setContent((current) => moveVocabularyCard(chapters, current, cardId, direction));
  };
  const userChapters = useMemo(
    () => [
      ...chapters.map((chapter) => ({
        ...chapter,
        ...content.chapterOverrides[chapter.id],
        subchapters: content.subchapters.filter(
          (subchapter) => subchapter.parentChapterId === chapter.id &&
            (subchapter.studyTab ?? "Vocab") === "Vocab",
        ),
        cards: allVocabularyCards.filter((card) => card.chapterId === chapter.id && (!card.studyTab || card.studyTab === "Vocab")),
      })),
      ...(content.chapters ?? []).filter((chapter) => (chapter.studyTab ?? "Vocab") === "Vocab").map((chapter) => ({
        ...chapter,
        subchapters: content.subchapters.filter(
          (subchapter) => subchapter.parentChapterId === chapter.id && (subchapter.studyTab ?? "Vocab") === "Vocab",
        ),
        cards: allVocabularyCards.filter((card) => card.chapterId === chapter.id && (!card.studyTab || card.studyTab === "Vocab")),
      })),
    ],
    [content, allVocabularyCards],
  );
  const chapterOptions = useMemo(
    () => [
      ...userChapters.map((chapter) => ({ ...chapter, studyTab: "Vocab" })),
      ...kanjiChapterOptions.map((chapter) => ({
        ...chapter,
        subchapters: [
          ...chapter.subchapters,
          ...content.subchapters.filter(
            (subchapter) => subchapter.parentChapterId === chapter.id && subchapter.studyTab === "Kanji",
          ),
        ],
      })),
      ...(content.chapters ?? []).filter((chapter) => chapter.studyTab === "Kanji"),
    ],
    [content, userChapters],
  );

  const filteredChapters = useMemo(
    () =>
      chapterQuery.trim()
        ? userChapters.filter((c) => contains(c.title, chapterQuery))
        : userChapters,
    [chapterQuery, userChapters],
  );
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
          .filter((card) => card.chapterId === subchapter.id && (!card.studyTab || card.studyTab === "Vocab"))
          .map((card) => ({ card, chapter: subchapter }))),
      ])
      .filter(({ card, chapter }) =>
        contains(
          [
            chapter.title,
            card.term,
            card.meaning,
            card.exampleJapanese,
            card.exampleMyanmar,
          ].join(" "),
          q,
        ),
      );
  }, [vocabQuery, selected, userChapters, allVocabularyCards]);
  const vocabSections = selected
    ? [
        { chapter: selected, isSubchapter: false, cards: selected.cards.map((card) => ({ card, chapter: selected })) },
        ...selected.subchapters.map((subchapter) => ({
          chapter: subchapter,
          isSubchapter: true,
          cards: allVocabularyCards
            .filter((card) => card.chapterId === subchapter.id && (!card.studyTab || card.studyTab === "Vocab"))
            .map((card) => ({ card, chapter: subchapter })),
        })),
      ]
    : [];
  const exercises = selected ? [
    ...(exercisesByChapter[selected.id] ?? []).map((item, index) => ({
      ...item,
      _id: `${selected.id}:exercise:${index}`,
      chapterId: selected.id,
    })),
    ...content.exercises.filter(
      (item) => item.parentChapterId === selected.id ||
        item.chapterId === selected.id ||
        selected.subchapters.some((subchapter) => subchapter.id === item.chapterId),
    ),
  ].map((item) => ({ ...item, ...content.exerciseOverrides[item._id] }))
    .filter((item) => !content.deletedExercises.includes(item._id)) : [];
  const exercisesForSection = (section) => {
    if (section.id === selected?.id) {
      return exercises.filter((item) => item.chapterId === selected.id || item.parentChapterId === selected.id);
    }
    return content.exercises
      .filter((item) => item.chapterId === section.id)
      .map((item) => ({ ...item, ...content.exerciseOverrides[item._id] }))
      .filter((item) => !content.deletedExercises.includes(item._id));
  };
  const exerciseSection = vocabSections.find(
    ({ chapter }) => chapter.id === exerciseSectionId,
  );
  const isGlobalSearch = Boolean(vocabQuery.trim());

  const openEditor = (type, mode = "add", record = {}) => {
    const selectedTab = record.studyTab ?? (studyTab === "Vocab" ? "Vocab" : studyTab);
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
      layout: "standard",
      number: `${chapter?.number ?? "1"}.${(chapter?.subchapters?.length ?? 0) + 1}`,
      title: "",
      term: "",
      meaning: "",
      exampleJapanese: "",
      exampleMyanmar: "",
      section: "1-3",
      question: "",
      answer: "",
      kanji: "",
      on: "",
      kun: "",
      sentence: "",
      ...record,
      studyTab: selectedTab,
      chapterId: recordSubchapter?.parentChapterId ?? chapter?.id ?? "",
      subchapterId,
      id: record._id ?? record.id,
    });
  };
  const saveContent = (draft) => {
    if (draft.type === "card") {
      setStudyTab(draft.studyTab);
      setActive(draft.chapterId);
      setChapterQuery("");
      setVocabQuery("");
      setExerciseSectionId(null);
      setTab("vocabulary");
    }
    setContent((current) => {
      if (draft.type === "chapter") {
        const id = draft.id || `user-chapter-${Date.now()}`;
        const chapter = { id, number: draft.number, title: draft.title, studyTab: draft.studyTab, subchapters: [] };
        setActive(id);
        if (draft.mode === "edit") {
          if ((current.chapters ?? []).some((item) => item.id === id)) {
            return { ...current, chapters: current.chapters.map((item) => item.id === id ? { ...item, number: draft.number, title: draft.title } : item) };
          }
          return { ...current, chapterOverrides: { ...current.chapterOverrides, [id]: { number: draft.number, title: draft.title } } };
        }
        return { ...current, chapters: [...(current.chapters ?? []), chapter] };
      }
      if (draft.type === "subchapter" && draft.mode === "edit") {
        const subchapterId = draft.subchapterId || draft.id;
        if (current.subchapters.some((item) => item.id === subchapterId)) {
          return { ...current, subchapters: current.subchapters.map((item) => item.id === subchapterId ? { ...item, parentChapterId: draft.chapterId, studyTab: draft.studyTab, number: draft.number, title: draft.title } : item) };
        }
        return { ...current, chapterOverrides: { ...current.chapterOverrides, [draft.id]: { number: draft.number, title: draft.title } } };
      }
      if (draft.type === "subchapter") {
        const id = `user-${Date.now()}`;
        setActive(id);
        return { ...current, subchapters: [...current.subchapters, { id, parentChapterId: draft.chapterId, studyTab: draft.studyTab, number: draft.number, title: draft.title, cards: [] }] };
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
          sentence: draft.sentence,
          words: draft.exampleMyanmar ? [{ term: draft.kanji, explanation: draft.exampleMyanmar }] : [],
        };
        if (draft.mode === "edit") return { ...current, kanjiOverrides: { ...current.kanjiOverrides, [draft.id]: item } };
        return { ...current, kanjiCards: [...current.kanjiCards, item] };
      }
      if (draft.type === "card") {
        const id = draft.id || `user-card-${Date.now()}`;
        const item = { id, _id: id, chapterId: draft.subchapterId || draft.chapterId, subchapterId: draft.subchapterId || "", parentChapterId: draft.chapterId, studyTab: draft.studyTab, layout: draft.layout, term: draft.term, meaning: draft.meaning, exampleJapanese: draft.exampleJapanese, exampleMyanmar: draft.exampleMyanmar, generated: true };
        if (draft.mode === "edit") return { ...current, cardOverrides: { ...current.cardOverrides, [draft.id]: item } };
        return { ...current, cards: [...current.cards, item] };
      }
      const id = draft.id || `user-exercise-${Date.now()}`;
      const item = { id, _id: id, chapterId: draft.subchapterId || draft.chapterId, parentChapterId: draft.chapterId, studyTab: draft.studyTab, section: draft.section, question: draft.question, answer: draft.answer };
      if (draft.mode === "edit") return { ...current, exerciseOverrides: { ...current.exerciseOverrides, [draft.id]: item } };
      return { ...current, exercises: [...current.exercises, item] };
    });
    setEditor(null);
  };
  const deleteRecord = (type, record) => {
    const label = type === "card" ? record.term : type === "kanji" ? record.kanji : record.question;
    if (!window.confirm(`Are you sure you want to delete ${label}?`)) return;
    setContent((current) => ({
      ...current,
      ...(type === "card" ? { deletedCards: [...new Set([...current.deletedCards, record._id])] } : type === "kanji" ? { deletedKanjiCards: [...new Set([...current.deletedKanjiCards, record._id])] } : { deletedExercises: [...new Set([...current.deletedExercises, record._id])] }),
    }));
  };
  const deleteSubchapter = (chapter) => {
    if (!window.confirm(`Are you sure you want to delete ${chapter.title} and its related content?`)) return;
    setContent((current) => ({
      ...current,
      subchapters: current.subchapters.filter((item) => item.id !== chapter.id),
      cards: current.cards.filter((item) => item.chapterId !== chapter.id),
      exercises: current.exercises.filter((item) => item.chapterId !== chapter.id),
    }));
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
          <h1>JLPT N3</h1>
          <p className="subtitle">Japanese · Myanmar · flashcards by chapter</p>
        </div>
        <div className="content-actions" aria-label="Manage study content">
          <button type="button" onClick={() => openEditor(studyTab === "Kanji" ? "kanji" : "card", "add", { studyTab })}>+ Add {studyTab}</button>
          {studyTab !== "Kanji" && (
            <>
              <button type="button" onClick={() => selected && openEditor("chapter", "edit", { ...selected, studyTab })} disabled={!selected}>Edit chapter</button>
              <button type="button" onClick={() => selected && openEditor("subchapter", "edit", selected)} disabled={!selected}>Edit subchapter</button>
            </>
          )}
          <button type="button" onClick={() => selected && content.subchapters.some((item) => item.id === selected.id) && deleteSubchapter(selected)} disabled={!selected || !content.subchapters.some((item) => item.id === selected.id)}>Delete subchapter</button>
        </div>
      </header>
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
        id="study-panel-0"
        aria-labelledby="study-tab-0"
        hidden={studyTab !== "Vocab"}
        tabIndex={0}
      >
        <section className="search-grid">
          <label htmlFor="chapter-search">
            Search chapters
            <input
              id="chapter-search"
              value={chapterQuery}
              onChange={(e) => setChapterQuery(e.target.value)}
              placeholder="例：家族、性格"
            />
          </label>
          <label htmlFor="vocab-search">
            Search every vocabulary card
            <input
              id="vocab-search"
              value={vocabQuery}
              onChange={(e) => setVocabQuery(e.target.value)}
              placeholder="例：冷蔵庫、れいぞうこ、冷蔵庫の説明"
            />
          </label>
        </section>
        <div className="layout">
          <aside>
            <div className="sidebar-heading">
              <p className="count">{filteredChapters.length} chapters</p>
              <button type="button" className="sidebar-toggle" onClick={() => setShowSidebar(!showSidebar)} aria-label={showSidebar ? "Hide chapter sidebar" : "Show chapter sidebar"}>
                {showSidebar ? "＜" : "＞"}
              </button>
            </div>
            <div className="chapter-group">
              {filteredChapters.map((chapter) => (
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
                  <strong>{chapterTitle(chapter.title, showMyanmar, showReadings, showJapanese)}</strong>
                </button>
              ))}
            </div>
          </aside>
          <article ref={chapterContentRef}>
            {selected ? (
              <>
                <p className="eyebrow">
                  {isGlobalSearch
                    ? "Vocabulary search"
                    : `Chapter ${selected.number}`}
                </p>
                <h2>
                  {isGlobalSearch
                    ? `Results for “${vocabQuery}”`
                    : `Chapter ${selected.number} vocabulary`}
                </h2>
                <p className="note">
                  {isGlobalSearch
                    ? vocabResults.length
                    : vocabSections.reduce((total, section) => total + section.cards.length, 0)}{" "}
                  {isGlobalSearch
                    ? "matching cards across all chapters"
                    : "flashcards"}
                </p>
                {!isGlobalSearch && (
                  <div className="tools">
                    <button
                      className={tab === "vocabulary" ? "selected" : ""}
                      onClick={() => setTab("vocabulary")}
                    >
                      Vocabulary
                    </button>
                    <button
                      className={tab === "exercises" ? "selected" : ""}
                      onClick={() => setTab("exercises")}
                    >
                      Exercises
                    </button>
                    <button
                      type="button"
                      className={manageMode ? "selected manage-toggle" : "manage-toggle"}
                      aria-pressed={manageMode}
                      onClick={() => setManageMode((value) => !value)}
                    >
                      Manage: {manageMode ? "ON" : "OFF"}
                    </button>
                    <button
                      type="button"
                      className={positionMode ? "selected" : ""}
                      aria-pressed={positionMode}
                      onClick={() => setPositionMode((value) => !value)}
                    >
                      Positions: {positionMode ? "ON" : "OFF"}
                    </button>
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
                      <button
                        type="button"
                        className="back-to-vocabulary"
                        onClick={() => setExerciseSectionId(null)}
                      >
                        ← Back to vocabulary
                      </button>
                      <p className="eyebrow">
                        {exerciseSection.isSubchapter ? "Subchapter" : "Chapter"} {exerciseSection.chapter.number}
                      </p>
                      <h2 lang="ja">
                        {chapterTitle(exerciseSection.chapter.title, showMyanmar, showReadings, showJapanese)}
                      </h2>
                      <Exercises
                        exercises={exercisesForSection(exerciseSection.chapter)}
                        showReadings={showReadings}
                        onEdit={manageMode ? (item) => openEditor("exercise", "edit", { ...item, studyTab: "Vocab" }) : undefined}
                        onDelete={manageMode ? (item) => deleteRecord("exercise", item) : undefined}
                      />
                    </section>
                  ) : isGlobalSearch ? (
                    <section className="cards">
                      {vocabResults.map(({ card, chapter }, i) => (
                        <div className={`managed-item card-layout-${card.layout || "standard"}`} key={`${chapter.id}-${card._id ?? card.term}-${i}`}>
                          <Flashcard card={card} showReadings={showReadings} showMyanmar={showMyanmar} showJapanese={showJapanese} chapterLabel={chapter.title} />
                          {manageMode && (
                            <div className="item-actions">
                              <button type="button" onClick={() => openEditor("card", "edit", card)}>Edit</button>
                              <button type="button" onClick={() => deleteRecord("card", card)}>Delete</button>
                            </div>
                          )}
                        </div>
                      ))}
                    </section>
                  ) : (
                    <div className="vocab-sections">
                      {vocabSections.map(({ chapter, isSubchapter, cards: sectionCards }) => (
                        <section className="vocab-section" key={chapter.id}>
                          <div className="vocab-section-heading">
                            <div>
                              <p className="eyebrow">{isSubchapter ? `Subchapter ${chapter.number}` : `Chapter ${chapter.number}`}</p>
                              <h3 lang="ja">{chapterTitle(chapter.title, showMyanmar, showReadings, showJapanese)}</h3>
                            </div>
                            <div className="vocab-section-actions">
                              <button
                                type="button"
                                className={`section-exercise-button ${exerciseSectionId === chapter.id ? "active" : ""}`}
                                aria-label={`Show exercises for ${chapter.title}`}
                                aria-pressed={exerciseSectionId === chapter.id}
                                onClick={() => setExerciseSectionId((current) => current === chapter.id ? null : chapter.id)}
                              >
                                <span aria-hidden="true">▤</span>
                                <span className="sr-only">Exercises</span>
                              </button>
                              {isSubchapter && manageMode && (
                                <div className="item-actions">
                                <button type="button" onClick={() => openEditor("subchapter", "edit", { ...chapter, chapterId: chapter.parentChapterId })}>Edit</button>
                                <button type="button" onClick={() => deleteSubchapter(chapter)}>Delete</button>
                                </div>
                              )}
                            </div>
                          </div>
                          <p className="note">{sectionCards.length} flashcards</p>
                          <section className="cards">
                            {sectionCards.map(({ card }, i) => (
                              <div className={`managed-item card-layout-${card.layout || "standard"}`} key={card._id}>
                                <Flashcard card={card} showReadings={showReadings} showMyanmar={showMyanmar} showJapanese={showJapanese} />
                                {positionMode && (
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
                                {manageMode && (
                                  <div className="item-actions">
                                    <button type="button" onClick={() => openEditor("card", "edit", card)}>Edit</button>
                                    <button type="button" onClick={() => deleteRecord("card", card)}>Delete</button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </section>
                        </section>
                      ))}
                    </div>
                  )
                ) : (
                  <Exercises
                    key={selected.id}
                    exercises={exercises}
                    showReadings={showReadings}
                    onEdit={manageMode ? (item) => openEditor("exercise", "edit", item) : undefined}
                    onDelete={manageMode ? (item) => deleteRecord("exercise", item) : undefined}
                  />
                )}
              </>
            ) : (
              <p>No matching chapter found.</p>
            )}
          </article>
        </div>
      </section>
      {studyTabs.slice(1).map((label, index) => (
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
              showReadings={showReadings}
              showKanjiReadings={showKanjiReadings}
              manageMode={manageMode}
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
                <button
                  type="button"
                  className={manageMode ? "selected" : ""}
                  aria-pressed={manageMode}
                  onClick={() => setManageMode((value) => !value)}
                >
                  Manage: {manageMode ? "ON" : "OFF"}
                </button>
              </div>
              {customCardsByTab[label]?.length ? (
                <section className="cards">
                  {customCardsByTab[label].map((card) => (
                    <div className={`managed-item card-layout-${card.layout || "standard"}`} key={card._id}>
                      <Flashcard card={card} showReadings={showReadings} showMyanmar={showMyanmar} showJapanese={showJapanese} />
                      {manageMode && (
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
      {editor && <ContentEditor editor={editor} setEditor={setEditor} chapterOptions={chapterOptions} studyTabs={studyTabs} onSave={saveContent} onClose={() => setEditor(null)} />}
      <div className="study-controls" ref={controlsRef}>
        {controlsOpen && (
          <div className="controls-panel" id="study-controls-panel">
            <p className="controls-title">Study view</p>
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
            <button
              type="button"
              aria-pressed={showKanjiReadings}
              onClick={() => setShowKanjiReadings(!showKanjiReadings)}
            >
              Kanji On/Kun <span>{showKanjiReadings ? "Shown" : "Hidden"}</span>
            </button>
            <button
              type="button"
              aria-pressed={showSidebar}
              onClick={() => setShowSidebar(!showSidebar)}
            >
              Chapter sidebar <span>{showSidebar ? "Shown" : "Hidden"}</span>
            </button>
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
            {controlsOpen ? "Close controls" : "? Study controls"}{" "}
          </button>
        </div>
      </div>
    </main>
  );
}
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
