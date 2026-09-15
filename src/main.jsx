import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { chapters } from "./data/n3Vocabulary.js";
import { exercisesByChapter } from "./data/exercises.js";
import Kanji from "./Kanji.jsx";
import "./styles.css";
import "./extras.css";

const hideReadings = (value) => value.replace(/（[^）]*）/g, "");
const contains = (value, query) =>
  value.toLocaleLowerCase().includes(query.toLocaleLowerCase());

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

function Flashcard({ card, showReadings, chapterLabel }) {
  const [flipped, setFlipped] = useState(false);
  const display = (value) => (showReadings ? value : hideReadings(value));
  return (
    <button
      className={`flashcard ${flipped ? "flipped" : ""}`}
      onClick={() => setFlipped((v) => !v)}
      aria-label={`${card.term} flashcard`}
    >
      <span className="flash-inner">
        <span className="face front">
          <span className="hint">Tap to reveal</span>
          {chapterLabel && (
            <span className="chapter-tag">{display(chapterLabel)}</span>
          )}
          <strong>{display(card.term)}</strong>
          <span className="meaning">{card.meaning}</span>
        </span>
        <span className="face back">
          <span className="label">Japanese example</span>
          <span className="example">{display(card.exampleJapanese)}</span>
          <span className="label">Myanmar explanation</span>
          <span className="mm sentence">
            {display(card.exampleMyanmar) ||
              "အထက်ပါ ဝါကျတွင် စကားလုံး၏ အဓိပ္ပာယ်နှင့် အသုံးပြုပုံကို လေ့လာပါ။"}
          </span>
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

function Exercises({ exercises, showReadings }) {
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
                </li>
              ))}
          </ol>
        </section>
      ))}
      {!exercises.length && <p>No exercises for this chapter yet.</p>}
    </section>
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

  const filteredChapters = useMemo(
    () =>
      chapterQuery.trim()
        ? chapters.filter((c) => contains(c.title, chapterQuery))
        : chapters,
    [chapterQuery],
  );
  const selected =
    chapters.find((c) => c.id === active) ?? filteredChapters[0] ?? chapters[0];
  const vocabResults = useMemo(() => {
    const q = vocabQuery.trim();
    if (!q)
      return selected?.cards.map((card) => ({ card, chapter: selected })) ?? [];
    return chapters
      .flatMap((chapter) => chapter.cards.map((card) => ({ card, chapter })))
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
  }, [vocabQuery, selected]);
  const exercises = exercisesByChapter[selected?.id] ?? [];
  const isGlobalSearch = Boolean(vocabQuery.trim());

  return (
    <main>
      <header>
        <div>
          <p className="eyebrow">自分用学習ノート</p>
          <h1>JLPT N3</h1>
          <p className="subtitle">Japanese · Myanmar · flashcards by chapter</p>
        </div>
        {(studyTab === "Vocab" || studyTab === "Kanji") && (
          <button
            type="button"
            className="reading-toggle"
            aria-label="Show readings"
            aria-pressed={showReadings}
            onClick={() => setShowReadings((value) => !value)}
          >
            {showReadings
              ? "Reading: ON (漢字＋かな)"
              : "Reading: OFF (漢字のみ)"}
          </button>
        )}
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
            <p className="count">{filteredChapters.length} chapters</p>
            {filteredChapters.map((chapter) => (
              <button
                className={chapter.id === selected?.id ? "active" : ""}
                onClick={() => {
                  setActive(chapter.id);
                  setVocabQuery("");
                }}
                key={chapter.id}
              >
                <span>Chapter {chapter.number}</span>
                <strong>
                  {showReadings ? chapter.title : hideReadings(chapter.title)}
                </strong>
              </button>
            ))}
          </aside>
          <article>
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
                    : showReadings
                      ? selected.title
                      : hideReadings(selected.title)}
                </h2>
                <p className="note">
                  {vocabResults.length}{" "}
                  {isGlobalSearch
                    ? "matching cards across all chapters"
                    : "flashcards · tap a card to read its explanation"}
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
                  </div>
                )}
                {isGlobalSearch || tab === "vocabulary" ? (
                  <section className="cards">
                    {vocabResults.map(({ card, chapter }, i) => (
                      <Flashcard
                        card={card}
                        showReadings={showReadings}
                        chapterLabel={isGlobalSearch ? chapter.title : ""}
                        key={`${chapter.id}-${card.term}-${i}`}
                      />
                    ))}
                  </section>
                ) : (
                  <Exercises
                    key={selected.id}
                    exercises={exercises}
                    showReadings={showReadings}
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
            <Kanji showReadings={showReadings} />
          ) : (
            <div className="empty study-placeholder">
              <h2>{label}</h2>
              <p>No content yet.</p>
            </div>
          )}
        </section>
      ))}
      <BackToTop />
    </main>
  );
}
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
