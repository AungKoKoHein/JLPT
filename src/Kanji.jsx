import React, { useState } from "react";
import { kanjiChapter1 } from "./data/kanjiChapter1.js";
import { kanjiChapter2 } from "./data/kanjiChapter2.js";
import { kanjiChapter3 } from "./data/kanjiChapter3.js";
import { kanjiChapter4 } from "./data/kanjiChapter4.js";
import { kanjiChapter5 } from "./data/kanjiChapter5.js";
import { kanjiChapter6 } from "./data/kanjiChapter6.js";
import { kanjiChapter7 } from "./data/kanjiChapter7.js";

const chapters = [
  kanjiChapter1,
  kanjiChapter2,
  kanjiChapter3,
  kanjiChapter4,
  kanjiChapter5,
  kanjiChapter6,
  kanjiChapter7,
];

export const kanjiChapterOptions = chapters.map(({ id, number, title, sections }) => ({
  id,
  number,
  title,
  studyTab: "Kanji",
  subchapters: id === "kanji-1"
    ? [{
        id: "kanji-1-subchapter-1l1",
        number: "1l1",
        title: "1l1",
        studyTab: "Kanji",
        parentChapterId: id,
      }]
    : (sections ?? []).map((section) => ({
    id: `${id}-section-${section.page}`,
    number: section.page,
    title: section.title,
    studyTab: "Kanji",
    parentChapterId: id,
    })),
}));

const displayText = (text, showReadings) =>
  showReadings ? text : text.replace(/（[^）]*）/g, "");

function KanjiCard({ card, showReadings, showKanjiReadings }) {
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
          <strong
            lang="ja"
            className={card.term ? "kanji-word-title" : "kanji-character"}
          >
            {displayText(card.term ?? card.kanji, showReadings)}
          </strong>
          <span className="meaning" lang="my">
            {card.meaning}
          </span>
          {showKanjiReadings &&
            card.readings?.map((reading) => (
              <span className="kanji-reading-summary" key={reading.kanji}>
                <span className="label" data-japanese>
                  On’yomi (音読み)
                </span>
                <span className="example" lang="ja" data-japanese>
                  {reading.on || "None listed"}
                </span>
                <span className="label" data-japanese>
                  Kun’yomi (訓読み)
                </span>
                <span className="example" lang="ja" data-japanese>
                  {reading.kun || "None listed"}
                </span>
              </span>
            ))}
          <span className="hint">
            {card.strokes ? `${card.strokes} strokes` : `Page ${card.page}`}
          </span>
        </span>
        <span className="face back" aria-hidden={!flipped}>
          <strong className="jp" lang="ja">
            {displayText(card.term ?? card.kanji, showReadings)}
            {card.strokes ? ` · ${card.strokes} strokes` : ""}
          </strong>
          {card.sentence && (
            <>
              <span className="label" data-japanese>
                Japanese sentence
              </span>
              <span className="example" lang="ja">
                {displayText(card.sentence, showReadings)}
              </span>
            </>
          )}
          <span className="label" lang={card.examples ? "en" : "my"}>
            {card.examples
              ? "Example sentences"
              : "စကားလုံးများနှင့် အဓိပ္ပာယ်ရှင်းလင်းချက်"}
          </span>
          {card.words.map((word) => (
            <span className="kanji-word" key={word.term}>
              <span className="example" lang="ja">
                {displayText(word.sentence ?? word.term, showReadings)}
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

function KanjiExercises({ chapter, showReadings, customExercises, manageMode, onEdit, onDelete }) {
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
      {customExercises?.length > 0 && (
        <section className="exercise-section">
          <h3>Added exercises</h3>
          <ol>
            {customExercises.map((item) => (
              <li key={item._id}>
                <p className="exercise-question">{displayText(item.question, showReadings)}</p>
                {showAnswers && (
                  <p className="exercise-answer">
                    <strong>Answer:</strong> {displayText(item.answer, showReadings)}
                  </p>
                )}
                {manageMode && (
                  <div className="item-actions">
                    <button type="button" onClick={() => onEdit(item)}>Edit</button>
                    <button type="button" onClick={() => onDelete(item)}>Delete</button>
                  </div>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}
      {chapter.extraWords?.map((word) => (
        <p className="note" key={word.term}>
          {displayText(word.term, showReadings)} ·{" "}
          <span lang="my">{word.explanation}</span>
        </p>
      ))}
    </section>
  );
}

export default function Kanji({
  showReadings,
  showKanjiReadings,
  manageMode,
  content,
  openEditor,
  deleteRecord,
  deleteSubchapter,
  onChapterChange,
  setManageMode,
}) {
  const [chapterQuery, setChapterQuery] = useState("");
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("kanji");
  const [active, setActive] = useState("kanji-1");
  const allChapters = [
    ...chapters.map((chapter) => ({
      ...chapter,
      ...(content.chapterOverrides ?? {})[chapter.id],
    })),
    ...(content.chapters ?? []).filter((chapter) => chapter.studyTab === "Kanji"),
  ];
  const filteredChapters = allChapters.filter((chapter) =>
    `${chapter.number} ${chapter.title}`.includes(chapterQuery.trim()),
  );
  const selected =
    filteredChapters.find((chapter) => chapter.id === active) ??
    filteredChapters[0];
  const baseCards = (selected?.cards ?? []).map((card, index) => ({
    ...card,
    _id: `${selected.id}:kanji:${index}`,
    ...(content.kanjiOverrides ?? {})[`${selected.id}:kanji:${index}`],
    chapterId: (content.kanjiOverrides ?? {})[`${selected.id}:kanji:${index}`]?.chapterId ?? selected.id,
  })).filter((card) => card.chapterId === selected?.id && !card.subchapterId);
  const customCards = (content.kanjiCards ?? [])
    .map((card) => ({ ...card, ...(content.kanjiOverrides ?? {})[card._id] }))
    .filter((card) => card.chapterId === selected?.id && !card.subchapterId);
  const customSubchapters = (content.subchapters ?? []).filter(
    (subchapter) => subchapter.parentChapterId === selected?.id && subchapter.studyTab === "Kanji",
  );
  const customCardsForSubchapter = (subchapterId) =>
    (content.kanjiCards ?? [])
      .map((card) => ({ ...card, ...(content.kanjiOverrides ?? {})[card._id] }))
      .filter((card) => card.chapterId === subchapterId || card.subchapterId === subchapterId)
      .filter((card) => !(content.deletedKanjiCards ?? []).includes(card._id));
  const customExercises = (content.exercises ?? [])
    .filter((item) => item.studyTab === "Kanji")
    .filter((item) =>
      item.chapterId === selected?.id ||
      item.parentChapterId === selected?.id ||
      customSubchapters.some((subchapter) => subchapter.id === item.chapterId),
    )
    .map((item) => ({ ...item, ...(content.exerciseOverrides ?? {})[item._id] }))
    .filter((item) => !(content.deletedExercises ?? []).includes(item._id));
  const cards = [...baseCards, ...customCards]
    .filter((card) => !(content.deletedKanjiCards ?? []).includes(card._id))
    .filter((card) =>
      [
        card.kanji,
        ...(card.readings ?? []).flatMap(({ kanji, on, kun }) => [kanji, on, kun]),
        card.meaning,
        card.sentence,
        card.lesson,
        ...(card.words ?? []).flatMap((word) => [
          word.term,
          word.sentence,
          word.explanation,
        ]),
      ]
        .join(" ")
        .toLocaleLowerCase()
        .includes(query.trim().toLocaleLowerCase()),
    );
  const renderCard = (card) => (
      <div className={`managed-item card-layout-${card.layout || "standard"}`} key={card._id ?? card.id ?? card.kanji}>
        <KanjiCard card={card} showReadings={showReadings} showKanjiReadings={showKanjiReadings} />
        {manageMode && (
          <div className="item-actions">
            <button type="button" onClick={() => openEditor("kanji", "edit", card)}>Edit</button>
            <button type="button" onClick={() => deleteRecord("kanji", card)}>Delete</button>
          </div>
        )}
      </div>
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
                onChapterChange?.();
              }}
            >
              <span>Chapter {chapter.number}</span>
              <strong lang="ja">
                {displayText(chapter.title, showReadings)}
              </strong>
            </button>
          ))}
        </aside>
        <article>
          {selected ? (
            <>
              <p className="eyebrow">Chapter {selected.number} · Kanji</p>
              <h2 lang="ja">{displayText(selected.title, showReadings)}</h2>
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
                <button
                  type="button"
                  className={manageMode ? "selected" : ""}
                  aria-pressed={manageMode}
                  onClick={() => setManageMode((value) => !value)}
                >
                  Manage: {manageMode ? "ON" : "OFF"}
                </button>
                {manageMode && (
                  <>
                    <button type="button" onClick={() => openEditor("chapter", "edit", { ...selected, studyTab: "Kanji" })}>
                      Edit chapter
                    </button>
                    <button type="button" onClick={() => openEditor("subchapter", "add", { studyTab: "Kanji", chapterId: selected.id })}>
                      + Subchapter
                    </button>
                    <button type="button" onClick={() => openEditor("exercise", "add", { studyTab: "Kanji", chapterId: selected.id })}>
                      + Exercise
                    </button>
                  </>
                )}
              </div>
              {query.trim() || tab === "kanji" ? (
                <>
                  <p className="note">{cards.length} kanji cards</p>
                  {selected.id === "kanji-1" ? (
                    <section className="vocab-section kanji-subchapter-section">
                      <div className="vocab-section-heading">
                        <div>
                          <p className="eyebrow">Subchapter 1l1</p>
                          <h3 lang="ja">1l1</h3>
                        </div>
                        {manageMode && (
                          <button
                            type="button"
                            className="section-exercise-button"
                            onClick={() => openEditor("subchapter", "edit", {
                              id: "kanji-1-subchapter-1l1",
                              chapterId: selected.id,
                              studyTab: "Kanji",
                              number: "1l1",
                              title: "1l1",
                            })}
                          >
                            Edit
                          </button>
                        )}
                      </div>
                      <p className="note">{cards.length} kanji cards</p>
                      <section className="cards">
                        {cards.map(renderCard)}
                      </section>
                    </section>
                  ) : selected.groupCardsByLesson ? (
                    selected.sections
                      .filter((section) => !section.review)
                      .map((section) => {
                        const lessonCards = cards.filter(
                          (card) => card.page === section.page,
                        );
                        if (!lessonCards.length) return null;
                        return (
                          <section
                            key={section.page}
                            className="kanji-lesson-group"
                          >
                            <h3 lang="ja">
                              {displayText(section.title, false)}
                            </h3>
                            <p className="note" lang="ja">
                              {lessonCards.map((card) => card.kanji).join("、")}
                            </p>
                            <div className="cards">
                              {lessonCards.map(renderCard)}
                            </div>
                          </section>
                        );
                      })
                  ) : (
                    <section className="cards">
                      {cards.map(renderCard)}
                    </section>
                  )}
                  {customSubchapters.map((subchapter) => {
                    const subchapterCards = customCardsForSubchapter(subchapter.id).filter((card) =>
                      [
                        card.kanji,
                        ...(card.readings ?? []).flatMap(({ kanji, on, kun }) => [kanji, on, kun]),
                        card.meaning,
                        card.sentence,
                      ].join(" ").toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
                    );
                    return (
                      <section className="kanji-lesson-group vocab-section" key={subchapter.id}>
                        <div className="vocab-section-heading">
                          <div>
                            <p className="eyebrow">Subchapter {subchapter.number}</p>
                            <h3 lang="ja">{displayText(subchapter.title, showReadings)}</h3>
                          </div>
                          {manageMode && (
                            <div className="item-actions">
                              <button type="button" onClick={() => openEditor("subchapter", "edit", { ...subchapter, chapterId: selected.id })}>Edit</button>
                              <button type="button" onClick={() => deleteSubchapter(subchapter)}>Delete</button>
                            </div>
                          )}
                        </div>
                        <p className="note">{subchapterCards.length} kanji cards</p>
                        <section className="cards">{subchapterCards.map(renderCard)}</section>
                      </section>
                    );
                  })}
                  {!cards.length && <p>No matching kanji found.</p>}
                  <p className="note">
                    Character readings:{" "}
                    <a href="https://www.edrdg.org/wiki/index.php/KANJIDIC_Project">
                      KANJIDIC / EDRDG
                    </a>{" "}
                    via{" "}
                    <a href="https://github.com/davidluzgouveia/kanji-data">
                      kanji-data
                    </a>{" "}
                    (
                    <a href="https://www.edrdg.org/edrdg/licence.html">
                      CC BY-SA 4.0
                    </a>
                    ). Includes uncommon readings; word readings appear above
                    each card’s examples.
                  </p>
                </>
              ) : (
                <KanjiExercises
                  key={selected.id}
                  chapter={selected}
                  showReadings={showReadings}
                  customExercises={customExercises}
                  manageMode={manageMode}
                  onEdit={(item) => openEditor("exercise", "edit", item)}
                  onDelete={(item) => deleteRecord("exercise", item)}
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
