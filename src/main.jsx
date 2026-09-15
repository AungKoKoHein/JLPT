import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { chapters } from "./data/n3Vocabulary.js";
import { exercisesByChapter } from "./data/exercises.js";
import "./styles.css";
import "./extras.css";

const hideReadings = (value) => value.replace(/（[^）]*）/g, "");
const contains = (value, query) =>
  value.toLocaleLowerCase().includes(query.toLocaleLowerCase());

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

function App() {
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
          <h1>JLPT N3 Vocabulary</h1>
          <p className="subtitle">Japanese · Myanmar · flashcards by chapter</p>
        </div>
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
      </header>
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
    </main>
  );
}
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
