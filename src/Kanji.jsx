import React, { useState } from "react";
import { kanjiChapter1 } from "./data/kanjiChapter1.js";
import { kanjiChapter2 } from "./data/kanjiChapter2.js";
import { kanjiChapter3 } from "./data/kanjiChapter3.js";

const chapters = [kanjiChapter1, kanjiChapter2, kanjiChapter3];

const displayText = (text, showReadings) =>
  showReadings ? text : text.replace(/（[^）]*）/g, "");

function KanjiCard({ card, showReadings }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <button
      type="button"
      className={`flashcard kanji-card ${flipped ? "flipped" : ""}`}
      onClick={() => setFlipped((value) => !value)}
      aria-label={`${card.kanji}: ${flipped ? "show kanji" : "show readings and examples"}`}
    >
      <span className="flash-inner">
        <span className="face front" aria-hidden={flipped}>
          <span className="hint">Tap to reveal</span>
          {card.lesson && (
            <span className="chapter-tag">
              {displayText(card.lesson, showReadings)}
            </span>
          )}
          <strong
            className={card.term ? "kanji-word-title" : "kanji-character"}
          >
            {displayText(card.term ?? card.kanji, showReadings)}
          </strong>
          <span className="meaning" lang="my">
            {card.meaning}
          </span>
          <span className="hint">
            {card.strokes ? `${card.strokes} strokes` : `Page ${card.page}`}
          </span>
        </span>
        <span className="face back" aria-hidden={!flipped}>
          <strong className="jp">
            {displayText(card.term ?? card.kanji, showReadings)}
            {card.strokes ? ` · ${card.strokes} strokes` : ""}
          </strong>
          {showReadings && card.kun && (
            <>
              <span className="label">Kun reading</span>
              <span className="example">{card.kun}</span>
              <span className="label">On reading</span>
              <span className="example">{card.on}</span>
            </>
          )}
          {card.sentence && (
            <>
              <span className="label">Japanese sentence</span>
              <span className="example" lang="ja">
                {displayText(card.sentence, showReadings)}
              </span>
            </>
          )}
          <span className="label" lang="my">
            စကားလုံးများနှင့် အဓိပ္ပာယ်ရှင်းလင်းချက်
          </span>
          {card.words.map((word) => (
            <span className="kanji-word" key={word.term}>
              <span className="example" lang="ja">
                {displayText(word.term, showReadings)}
              </span>
              <span className="kanji-word-explanation" lang="my">
                {word.explanation}
              </span>
            </span>
          ))}
        </span>
      </span>
    </button>
  );
}

function KanjiExercises({ chapter, showReadings }) {
  const [showAnswers, setShowAnswers] = useState(false);
  const sections = chapter.sections ?? [
    {
      title: chapter.title,
      reading: chapter.reading,
      writing: chapter.writing,
    },
  ];
  const count = sections.reduce(
    (sum, section) => sum + section.reading.length + section.writing.length,
    0,
  );
  return (
    <section className="exercises" aria-label="Kanji exercises">
      <p className="note">
        {count} sentences · Read the underlined kanji or write the matching
        kanji.
      </p>
      <button
        type="button"
        className="reading-toggle answer-key-toggle"
        aria-label="Show answer key"
        aria-pressed={showAnswers}
        onClick={() => setShowAnswers((value) => !value)}
      >
        Answer key: {showAnswers ? "ON" : "OFF"}
      </button>
      {sections
        .flatMap((section) => [
          [
            `${displayText(section.title, showReadings)} · Read the kanji · 漢字を読みましょう`,
            section.reading,
          ],
          [
            `${displayText(section.title, showReadings)} · Write the kanji · 漢字を書きましょう`,
            section.writing,
          ],
        ])
        .map(([title, questions]) => (
          <section className="exercise-section" key={title}>
            <h3>{title}</h3>
            <ol>
              {questions.map(([before, target, after, answer], index) => (
                <li key={index}>
                  <p className="exercise-question">
                    {displayText(before, showReadings)}
                    <u>{target}</u>
                    {displayText(after, showReadings)}
                  </p>
                  {showAnswers && (
                    <p className="exercise-answer">
                      <strong>Answer:</strong> {answer}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          </section>
        ))}
      {chapter.extraWords?.map((word) => (
        <p className="note" key={word.term}>
          {displayText(word.term, showReadings)} ·{" "}
          <span lang="my">{word.explanation}</span>
        </p>
      ))}
    </section>
  );
}

export default function Kanji({ showReadings }) {
  const [chapterQuery, setChapterQuery] = useState("");
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("kanji");
  const [active, setActive] = useState("kanji-1");
  const filteredChapters = chapters.filter((chapter) =>
    `${chapter.number} ${chapter.title}`.includes(chapterQuery.trim()),
  );
  const selected =
    filteredChapters.find((chapter) => chapter.id === active) ??
    filteredChapters[0];
  const cards = (selected?.cards ?? []).filter((card) =>
    [
      card.kanji,
      card.kun,
      card.on,
      card.meaning,
      card.sentence,
      card.lesson,
      ...card.words.flatMap((word) => [word.term, word.explanation]),
    ]
      .join(" ")
      .toLocaleLowerCase()
      .includes(query.trim().toLocaleLowerCase()),
  );
  return (
    <>
      <section className="search-grid">
        <label htmlFor="kanji-chapter-search">
          Search chapters
          <input
            id="kanji-chapter-search"
            value={chapterQuery}
            onChange={(event) => setChapterQuery(event.target.value)}
            placeholder="例：生活、せいかつ"
          />
        </label>
        <label htmlFor="kanji-search">
          Search kanji
          <input
            id="kanji-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="例：起、おきる、အိပ်"
          />
        </label>
      </section>
      <div className="layout">
        <aside>
          <p className="count">{filteredChapters.length} chapters</p>
          {filteredChapters.map((chapter) => (
            <button
              key={chapter.id}
              type="button"
              className={selected?.id === chapter.id ? "active" : ""}
              onClick={() => {
                setActive(chapter.id);
                setQuery("");
              }}
            >
              <span>Chapter {chapter.number}</span>
              <strong>{displayText(chapter.title, showReadings)}</strong>
            </button>
          ))}
        </aside>
        <article>
          {selected ? (
            <>
              <p className="eyebrow">Chapter {selected.number} · Kanji</p>
              <h2>{displayText(selected.title, showReadings)}</h2>
              <div className="tools">
                <button
                  type="button"
                  className={tab === "kanji" ? "selected" : ""}
                  aria-pressed={tab === "kanji"}
                  onClick={() => setTab("kanji")}
                >
                  Words
                </button>
                <button
                  type="button"
                  className={tab === "exercises" ? "selected" : ""}
                  aria-pressed={tab === "exercises"}
                  onClick={() => {
                    setTab("exercises");
                    setQuery("");
                  }}
                >
                  Exercises
                </button>
              </div>
              {query.trim() || tab === "kanji" ? (
                <>
                  <p className="note">
                    {cards.length} kanji cards · tap to see readings and words
                  </p>
                  <section className="cards">
                    {cards.map((card) => (
                      <KanjiCard
                        key={card.id ?? card.kanji}
                        card={card}
                        showReadings={showReadings}
                      />
                    ))}
                  </section>
                  {!cards.length && <p>No matching kanji found.</p>}
                </>
              ) : (
                <KanjiExercises
                  key={selected.id}
                  chapter={selected}
                  showReadings={showReadings}
                />
              )}
            </>
          ) : (
            <p>No matching chapter found.</p>
          )}
        </article>
      </div>
    </>
  );
}
