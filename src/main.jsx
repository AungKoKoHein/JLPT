import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { chapters } from "./data/n3Vocabulary.js";
import { exercisesByChapter } from "./data/exercises.js";
import { moveVocabularyCard, resolveVocabularyCards, resolveVocabularySubchapters } from "./vocabularyContent.js";
import Exercises from "./Exercises.jsx";
import SubchapterNav, { subchapterTargetId } from "./SubchapterNav.jsx";
import { vocabularyExercises, resolveExercises, exercisesForView, saveExercise, unassignExercises } from "./exerciseContent.js";
import Kanji, { kanjiChapterOptions, baseKanjiExercises } from "./Kanji.jsx";
import { useCloudContent } from "./useCloudContent.js";
import CloudStatus from "./CloudStatus.jsx";
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
          {showExamples && showJapanese && card.exampleJapanese && (
            <p className="book-example" lang="ja">e.g. {display(card.exampleJapanese)}</p>
          )}
          {showExamples && showMyanmar && card.exampleMyanmar && (
            <p className="book-translation" lang="my">{display(card.exampleMyanmar)}</p>
          )}
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

function ContentEditor({ editor, setEditor, chapterOptions, studyTabs, onSave, onClose, saving, canSave, error }) {
  const set = (field, value) => setEditor((current) => ({ ...current, [field]: value }));
  const chapters = chapterOptions.filter((chapter) => chapter.studyTab === editor.studyTab);
  const selectedChapter = chapters.find((chapter) => chapter.id === editor.chapterId);
  const subchapters = selectedChapter?.subchapters ?? [];
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
          chapter: "Edit Chapter",
          subchapter: "Edit Sub Chapter",
        }[editor.type] ?? "Edit Item"
      : {
          card: "Add Flashcard",
          kanji: "Add Kanji Card",
          exercise: "Add Exercise",
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
                titleMyanmar: "",
              }))}
            >
              New Sub Chapter
            </button>
          )}
        </div>
        <fieldset className="editor-grid" disabled={saving}>
          <label>
            Type
            <select value={editor.type} onChange={(event) => {
              const type = event.target.value;
              if (type === "exercise" && !["Vocab", "Kanji"].includes(editor.studyTab)) {
                setEditor((current) => ({ ...current, type, studyTab: "Vocab", chapterId: chapterOptions.find((chapter) => chapter.studyTab === "Vocab")?.id ?? "", subchapterId: "" }));
              } else set("type", type);
            }} disabled={editor.mode === "edit"}>
              <option value="card">Flashcard</option>
              <option value="kanji">Kanji Card</option>
              <option value="exercise">Exercise</option>
              <option value="chapter">Chapter</option>
              <option value="subchapter">Sub Chapter</option>
            </select>
          </label>
          <label>
            Study Tab
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
              {studyTabs.filter((label) => editor.type === "exercise" ? ["Vocab", "Kanji"].includes(label) : editor.type !== "card" || label !== "Kanji").map((label) => (
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
          {editor.type !== "subchapter" && editor.type !== "chapter" && (
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
              <label>Sub Chapter Number<input value={editor.number} onChange={(event) => set("number", event.target.value)} placeholder={`${selectedChapter?.number}.new`} required /></label>
              <label>Sub Chapter Title<input value={editor.title} onChange={(event) => set("title", event.target.value)} placeholder="家族と友達" required /></label>
              <label>Myanmar Translation<input lang="my" value={editor.titleMyanmar} onChange={(event) => set("titleMyanmar", event.target.value)} placeholder="မိသားစုနှင့် သူငယ်ချင်းများ" /></label>
            </>
          )}
          {editor.type === "chapter" && (
            <>
              <label>Chapter Number<input value={editor.number} onChange={(event) => set("number", event.target.value)} placeholder="new" required /></label>
              <label>Chapter Title<input value={editor.title} onChange={(event) => set("title", event.target.value)} placeholder="新しい章" required /></label>
              <label>Myanmar Translation<input lang="my" value={editor.titleMyanmar} onChange={(event) => set("titleMyanmar", event.target.value)} placeholder="အခန်း၏ မြန်မာဘာသာပြန်" /></label>
            </>
          )}
          {editor.type === "card" && (
            <>
              <label>
                Flashcard Layout
                <select value={editor.layout} onChange={(event) => set("layout", event.target.value)}>
                  <option value="standard">Standard</option>
                  <option value="double">Double width (2 cards)</option>
                  <option value="wide">Wide (3 cards)</option>
                </select>
              </label>
              <label>Flashcard Front<input value={editor.term} onChange={(event) => set("term", event.target.value)} placeholder="Japanese word（reading）" required /></label>
              <label>Myanmar Meaning<input value={editor.meaning} onChange={(event) => set("meaning", event.target.value)} required /></label>
              <label>Japanese Example<textarea value={editor.exampleJapanese} onChange={(event) => set("exampleJapanese", event.target.value)} required /></label>
              <label>Myanmar Explanation<textarea value={editor.exampleMyanmar} onChange={(event) => set("exampleMyanmar", event.target.value)} /></label>
            </>
          )}
          {editor.type === "kanji" && (
            <>
              <label>
                Flashcard Layout
                <select value={editor.layout} onChange={(event) => set("layout", event.target.value)}>
                  <option value="standard">Standard</option>
                  <option value="double">Double width (2 cards)</option>
                  <option value="wide">Wide (3 cards)</option>
                </select>
              </label>
              <label>Kanji Front<input value={editor.kanji} onChange={(event) => set("kanji", event.target.value)} placeholder="漢字" required /></label>
              <label>Myanmar Meaning<input value={editor.meaning} onChange={(event) => set("meaning", event.target.value)} required /></label>
              <label>On’yomi (音読み)<input value={editor.on} onChange={(event) => set("on", event.target.value)} placeholder="オンヨミ" /></label>
              <label>Kun’yomi (訓読み)<input value={editor.kun} onChange={(event) => set("kun", event.target.value)} placeholder="くんよみ" /></label>
              <label>Japanese Sentence<textarea value={editor.sentence} onChange={(event) => set("sentence", event.target.value)} /></label>
              <label>Myanmar Explanation<textarea value={editor.exampleMyanmar} onChange={(event) => set("exampleMyanmar", event.target.value)} /></label>
            </>
          )}
          {editor.type === "exercise" && (
            <>
              <p className="editor-help">Exercises always remain in the main chapter list. Assign a sub chapter to show the same exercise there too. Edits update both places. Clear the assignment to remove it from the sub chapter.</p>
              <label>Exercise Group<input value={editor.section} onChange={(event) => set("section", event.target.value)} placeholder="1-3" required /></label>
              <label>Sentence / Question<textarea value={editor.question} onChange={(event) => set("question", event.target.value)} required /></label>
              <label>Myanmar Sentence / Question<textarea lang="my" value={editor.questionMyanmar} onChange={(event) => set("questionMyanmar", event.target.value)} /></label>
              <label>Answer Key<textarea value={editor.answer} onChange={(event) => set("answer", event.target.value)} required /></label>
              <label>Myanmar Answer / Explanation<textarea lang="my" value={editor.answerMyanmar} onChange={(event) => set("answerMyanmar", event.target.value)} /></label>
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

function App() {
  const [studyTab, setStudyTab] = useState("Vocab");
  const [chapterQuery, setChapterQuery] = useState("");
  const [vocabQuery, setVocabQuery] = useState("");
  const [active, setActive] = useState(chapters[0]?.id ?? "");
  const [tab, setTab] = useState("vocabulary");
  const [vocabMode, setVocabMode] = useState(() => {
    try {
      return localStorage.getItem("jlpt-vocab-mode") === "book" ? "book" : "card";
    } catch {
      return "card";
    }
  });
  const bookMode = vocabMode === "book";
  useEffect(() => {
    try {
      localStorage.setItem("jlpt-vocab-mode", vocabMode);
    } catch {}
  }, [vocabMode]);
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
  const [positionMode, setPositionMode] = useState(false);
  const [exerciseSectionId, setExerciseSectionId] = useState(null);
  const cloud = useCloudContent();
  const { content, updateContent: setContent } = cloud;
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
  const setExerciseMyanmar = (value) => {
    setShowMyanmar(value);
    if (!value) setShowJapanese(true);
  };
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
    () => resolveVocabularyCards(chapters, content),
    [content],
  );
  const vocabularySubchapters = useMemo(
    () => resolveVocabularySubchapters(chapters, content),
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
      ...(content.chapters ?? []).filter((chapter) => chapter.studyTab === "Kanji").map((chapter) => ({
        ...chapter, subchapters: content.subchapters.filter((item) => item.parentChapterId === chapter.id),
      })),
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
  const chapterGroups = useMemo(() => {
    const groups = [
      {
        id: "topics",
        label: "実力養成編 (じつりょくようせいへん) : 第1部 : 話題別に言葉を学ぼう (わだいべつにことばをまなぼう)",
        range: "chapter 1 - 21",
        chapters: [],
      },
      {
        id: "strengthening",
        label: "実力養成編 (じつりょくようせいへん) : 第2部 : (だいにぶ) 性質別に言葉を学ぼう (せいしつべつにことばをまなぼう)",
        range: "chapter 1 - 8",
        chapters: [],
      },
    ];

    for (const chapter of filteredChapters) {
      const isPartTwo = String(chapter.number).includes(".");
      const group = isPartTwo ? groups[1] : groups[0];
      group.chapters.push(chapter);
    }

    return groups.filter((group) => group.chapters.length > 0);
  }, [filteredChapters]);
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
            chapter.titleMyanmar,
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
  const allExercises = useMemo(() => resolveExercises(
    [...vocabularyExercises(exercisesByChapter), ...baseKanjiExercises],
    content,
    chapterOptions.flatMap((chapter) => chapter.subchapters ?? []),
  ), [content, chapterOptions]);
  const exercises = selected ? exercisesForView(allExercises, "Vocab", selected.id) : [];
  const exercisesForSection = (section) => exercisesForView(
    allExercises, "Vocab", selected?.id, section.id === selected?.id ? "" : section.id,
  );
  const exerciseSection = vocabSections.find(
    ({ chapter }) => chapter.id === exerciseSectionId,
  );
  const isGlobalSearch = Boolean(vocabQuery.trim());

  const openEditor = (type, mode = "add", record = {}) => {
    if (!cloud.canEdit) return;
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
      studyTab: selectedTab,
      chapterId: recordSubchapter?.parentChapterId ?? chapter?.id ?? "",
      subchapterId,
      id: record._id ?? record.id,
    });
  };
  const saveContent = async (draft) => {
    if (!cloud.canEdit) return;
    if (draft.type === "card") {
      setStudyTab(draft.studyTab);
      setActive(draft.chapterId);
      setChapterQuery("");
      setVocabQuery("");
      setExerciseSectionId(null);
      setTab("vocabulary");
    }
    const saved = await setContent((current) => {
      if (draft.type === "chapter") {
        const id = draft.id || `user-chapter-${Date.now()}`;
        const chapter = { id, number: draft.number, title: draft.title, titleMyanmar: draft.titleMyanmar, studyTab: draft.studyTab, subchapters: [] };
        setActive(id);
        if (draft.mode === "edit") {
          if ((current.chapters ?? []).some((item) => item.id === id)) {
            return { ...current, chapters: current.chapters.map((item) => item.id === id ? { ...item, number: draft.number, title: draft.title, titleMyanmar: draft.titleMyanmar } : item) };
          }
          return { ...current, chapterOverrides: { ...current.chapterOverrides, [id]: { number: draft.number, title: draft.title, titleMyanmar: draft.titleMyanmar } } };
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
        setActive(id);
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
      return saveExercise(current, draft);
    });
    if (saved) setEditor(null);
  };
  const deleteRecord = (type, record) => {
    if (!cloud.canEdit) return;
    const label = type === "card" ? record.term : type === "kanji" ? record.kanji : record.question;
    if (!window.confirm(type === "exercise" ? `Delete this exercise from the main list and every assigned subchapter?\n${label}` : `Are you sure you want to delete ${label}?`)) return;
    setContent((current) => ({
      ...current,
      ...(type === "card" ? { deletedCards: [...new Set([...current.deletedCards, record._id])] } : type === "kanji" ? { deletedKanjiCards: [...new Set([...current.deletedKanjiCards, record._id])] } : { deletedExercises: [...new Set([...current.deletedExercises, record._id])] }),
    }));
  };
  const deleteSubchapter = (chapter) => {
    if (!cloud.canEdit) return;
    if (!window.confirm(`Delete ${chapter.title} and its cards? Its exercises will remain in the main chapter list without this assignment.`)) return;
    setContent((current) => ({
      ...current,
      ...unassignExercises(current, chapter.id, allExercises),
      ...(chapter.studyTab === "Vocab" ? {
        deletedSubchapters: [...new Set([...(current.deletedSubchapters ?? []), chapter.id, ...(chapter.sourceId ? [chapter.sourceId] : [])])],
        deletedCards: [...new Set([...current.deletedCards, ...resolveVocabularyCards(chapters, current).filter((card) => card.chapterId === chapter.id).map((card) => card._id)])],
      } : {}),
      subchapters: current.subchapters.filter((item) => item.id !== chapter.id),
      cards: current.cards.filter((item) => item.chapterId !== chapter.id),
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
        {cloud.isEditor && <fieldset className="content-actions" aria-label="Manage study content" disabled={!cloud.canEdit}>
          <button type="button" onClick={() => openEditor(studyTab === "Kanji" ? "kanji" : "card", "add", { studyTab })}>+ Add {studyTab}</button>
          {studyTab !== "Kanji" && (
            <>
              <button type="button" onClick={() => selected && openEditor("chapter", "edit", { ...selected, studyTab })} disabled={!selected}>Edit Chapter</button>
              <button type="button" onClick={() => selected && openEditor("subchapter", "edit", { studyTab, chapterId: selected.id })} disabled={!selected}>Edit Sub Chapter</button>
            </>
          )}
          <button type="button" onClick={() => selected && content.subchapters.some((item) => item.id === selected.id) && deleteSubchapter(selected)} disabled={!selected || !content.subchapters.some((item) => item.id === selected.id)}>Delete Sub Chapter</button>
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
        id="study-panel-0"
        aria-labelledby="study-tab-0"
        hidden={studyTab !== "Vocab"}
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
          </label>
          <label htmlFor="vocab-search" className="desktop-vocab-search">
            Search every vocabulary card
            <input
              id="vocab-search"
              className={vocabQuery.trim() ? (vocabResults.length ? "search-box has-results" : "search-box no-results") : "search-box"}
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
                <span className={`sidebar-toggle-icon ${showSidebar ? "collapse" : "expand"}`} aria-hidden="true" />
              </button>
            </div>
            <div className="chapter-group">
              {filteredChapters.length ? (
                chapterGroups.map((group) => (
                  <div className="chapter-group-block" key={group.id}>
                    <p className="chapter-group-label">
                      <span className="chapter-group-title">{chapterTitle(group.label, showMyanmar, showReadings, showJapanese)}</span>
                      <span className="chapter-group-range">{showReadings ? group.range : hideReadings(group.range)}</span>
                    </p>
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
                        <strong>{localizedChapterTitle(chapter, showMyanmar, showReadings, showJapanese)}</strong>
                      </button>
                    ))}
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
            Search every vocabulary card
            <input
              id="mobile-vocab-search"
              className={vocabQuery.trim() ? (vocabResults.length ? "search-box has-results" : "search-box no-results") : "search-box"}
              value={vocabQuery}
              onChange={(e) => setVocabQuery(e.target.value)}
              placeholder="Search vocabulary"
            />
          </label>
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
                    ? `matching ${bookMode ? "entries" : "cards"} across all chapters`
                    : bookMode ? "vocabulary entries" : "flashcards"}
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
                    {cloud.isEditor && (<button
                      type="button"
                      className={manageMode ? "selected manage-toggle" : "manage-toggle"}
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
                      <button
                        type="button"
                        className="back-to-vocabulary"
                        onClick={() => setExerciseSectionId(null)}
                      >
                        ← Back to Vocabulary
                      </button>
                      <p className="eyebrow">
                        {exerciseSection.isSubchapter ? "Sub Chapter" : "Chapter"} {exerciseSection.chapter.number}
                      </p>
                      <h2 lang="ja">
                        {localizedChapterTitle(exerciseSection.chapter, showMyanmar, showReadings, showJapanese)}
                      </h2>
                      <Exercises
                        key={exerciseSection.chapter.id}
                        exercises={exercisesForSection(exerciseSection.chapter)}
                        showReadings={showReadings}
                        showMyanmar={showMyanmar}
                        setShowMyanmar={setExerciseMyanmar}
                        assignmentLabel={exerciseSection.isSubchapter ? localizedChapterTitle(exerciseSection.chapter, showMyanmar, showReadings, showJapanese) : undefined}
                        onAdd={!bookMode && cloud.canEdit ? () => openEditor("exercise", "add", { studyTab: "Vocab", chapterId: selected.id, subchapterId: exerciseSection.isSubchapter ? exerciseSection.chapter.id : "" }) : undefined}
                        onEdit={!bookMode && manageMode && cloud.isEditor ? (item) => openEditor("exercise", "edit", { ...item, studyTab: "Vocab" }) : undefined}
                        onDelete={!bookMode && manageMode && cloud.isEditor ? (item) => deleteRecord("exercise", item) : undefined}
                      />
                    </section>
                  ) : isGlobalSearch ? (
                    vocabResults.length ? (
                      bookMode ? (
                        <VocabularyBook entries={vocabResults} showReadings={showReadings} showMyanmar={showMyanmar} showJapanese={showJapanese} showExamples={showBookExamples} showChapterLabels manageMode={manageMode} isEditor={cloud.isEditor} onEdit={(card) => openEditor("card", "edit", card)} onDelete={(card) => deleteRecord("card", card)} />
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
                      <SubchapterNav sections={vocabSections.filter((section) => section.isSubchapter).map((section) => section.chapter)} />
                      {vocabSections.map(({ chapter, isSubchapter, cards: sectionCards }) => (
                        <section className="vocab-section" key={chapter.id}>
                          <div className="vocab-section-heading">
                            <div>
                              <p className="eyebrow">{isSubchapter ? `Sub Chapter ${chapter.number}` : `Chapter ${chapter.number}`}</p>
                              <h3 lang="ja" id={isSubchapter ? subchapterTargetId(chapter.id) : undefined} tabIndex={isSubchapter ? -1 : undefined}>{localizedChapterTitle(chapter, showMyanmar, showReadings, showJapanese)}</h3>
                            </div>
                            <div className="vocab-section-actions">
                              <button
                                type="button"
                                className={`section-exercise-button ${exerciseSectionId === chapter.id ? "active" : ""}`}
                                aria-label={`Show Exercises For ${chapter.title}`}
                                aria-pressed={exerciseSectionId === chapter.id}
                                onClick={() => setExerciseSectionId((current) => current === chapter.id ? null : chapter.id)}
                              >
                                <span aria-hidden="true">▤</span>
                                <span className="sr-only">Exercises</span>
                              </button>
                              {!bookMode && isSubchapter && manageMode && cloud.isEditor && (
                                <div className="item-actions">
                                <button type="button" onClick={() => openEditor("subchapter", "edit", { ...chapter, chapterId: chapter.parentChapterId })}>Edit</button>
                                <button type="button" onClick={() => deleteSubchapter(chapter)}>Delete</button>
                                </div>
                              )}
                            </div>
                          </div>
                          <p className="note">{sectionCards.length} {bookMode ? "vocabulary entries" : "flashcards"}</p>
                          {bookMode ? (
                            <VocabularyBook entries={sectionCards} showReadings={showReadings} showMyanmar={showMyanmar} showJapanese={showJapanese} showExamples={showBookExamples} manageMode={manageMode} isEditor={cloud.isEditor} onEdit={(card) => openEditor("card", "edit", card)} onDelete={(card) => deleteRecord("card", card)} />
                          ) : (
                          <section className="cards">
                            {sectionCards.map(({ card }, i) => (
                              <div className={`managed-item card-layout-${card.layout || "standard"}`} key={card._id}>
                                <Flashcard card={card} showReadings={showReadings} showMyanmar={showMyanmar} showJapanese={showJapanese} />
                                {positionMode && cloud.isEditor && (
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
                    setShowMyanmar={setExerciseMyanmar}
                    onAdd={!bookMode && cloud.canEdit ? () => openEditor("exercise", "add", { studyTab: "Vocab", chapterId: selected.id }) : undefined}
                    onEdit={!bookMode && manageMode && cloud.isEditor ? (item) => openEditor("exercise", "edit", item) : undefined}
                    onDelete={!bookMode && manageMode && cloud.isEditor ? (item) => deleteRecord("exercise", item) : undefined}
                  />
                )}
              </>
            ) : (
              <div className="empty search-empty">
                <p>No searched record found.</p>
              </div>
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
              allExercises={allExercises}
              showMyanmar={showMyanmar}
              setShowMyanmar={setExerciseMyanmar}
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
      {editor && cloud.isEditor && <ContentEditor saving={cloud.saving} canSave={cloud.canEdit} error={cloud.error || (!cloud.connected ? "Connection lost. Keep this form open and reconnect to save." : "")} editor={editor} setEditor={setEditor} chapterOptions={chapterOptions} studyTabs={studyTabs} onSave={saveContent} onClose={() => setEditor(null)} />}
      <div className="study-controls" ref={controlsRef}>
        {controlsOpen && (
          <div className="controls-panel" id="study-controls-panel">
            <p className="controls-title">Study View</p>
            {studyTab === "Vocab" && (
              <div className="vocab-mode-switch" role="group" aria-label="Vocabulary display mode">
                <button type="button" aria-pressed={!bookMode} onClick={() => setVocabMode("card")}>Card mode</button>
                <button type="button" aria-pressed={bookMode} onClick={() => setVocabMode("book")}>Book mode</button>
              </div>
            )}
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
            {studyTab === "Vocab" && bookMode && (
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
    <App />
  </React.StrictMode>,
);
