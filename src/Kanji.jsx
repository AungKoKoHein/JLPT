import useShuffledCards from "./useShuffledCards.js";
import { sortChapters, groupChapters } from "./chapterGroups.js";
import React, { useState } from "react";
import Exercises from "./Exercises.jsx";
import SubchapterNav, { subchapterTargetId } from "./SubchapterNav.jsx";
import { kanjiExercises, exercisesForView } from "./exerciseContent.js";
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

export const baseKanjiExercises = kanjiExercises(chapters);

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

export function resolveKanjiCards(content) {
  return [...chapters.flatMap((chapter) => chapter.cards.map((card, index) => ({ ...card, _id: `${chapter.id}:kanji:${index}`, chapterId: chapter.id, studyTab: "Kanji" }))), ...(content.kanjiCards || [])]
    .map((card) => ({ ...card, ...content.kanjiOverrides[card._id], studyTab: "Kanji" }))
    .filter((card) => !content.deletedKanjiCards.includes(card._id));
}

const normalizeSearchText = (value = "") =>
  String(value)
    .normalize("NFKC")
    .replace(/[\u30A1-\u30F6]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0x60))
    .replace(/[\uFF66-\uFF9D]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xF6))
    .replace(/[\u3000\s\n\r\t]+/g, " ")
    .replace(/[（）()\[\]{}「」『』、。！？・!?.、]/g, " ")
    .trim()
    .toLocaleLowerCase();
const matchesSearch = (value, query) => {
  const q = normalizeSearchText(query);
  if (!q) return true;
  return normalizeSearchText(value).includes(q);
};
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
            card.readings?.map((reading, index) => (
              <span className="kanji-reading-summary" key={`${reading.kanji}-${index}`}>
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
          {card.strokes && <span className="hint">{card.strokes} strokes</span>}
        </span>
        <span className="face back" aria-hidden={!flipped}>
          <strong className="jp" lang="ja">
            {displayText(card.term ?? card.kanji, showReadings)}
            {card.strokes ? ` · ${card.strokes} strokes` : ""}
          </strong>
          {card.sentence && (
            <>
              <span className="label" data-japanese>
                Japanese Sentence
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
          {card.words.map((word, index) => (
            <span className="kanji-word" key={`${word.term}-${index}`}>
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

export default function Kanji({
  allExercises,
  showMyanmar,
  setShowMyanmar,
  showReadings,
  showKanjiReadings,
  manageMode,
  canEdit,
  isEditor,
  content,
  openEditor,
  deleteRecord,
  deleteSubchapter,
  onChapterChange,
  setManageMode,
}) {
  const [shuffleMode, setShuffleMode] = useState(false);
  const [chapterQuery, setChapterQuery] = useState("");
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("kanji");
  const [active, setActive] = useState("kanji-1");
  const [exerciseScope, setExerciseScope] = useState("");
  const allChapters = sortChapters([
    ...chapters.map((chapter) => ({
      ...chapter,
      ...(content.chapterOverrides ?? {})[chapter.id],
    })),
    ...(content.chapters ?? []).filter((chapter) => chapter.studyTab === "Kanji"),
  ].filter((chapter) => !(content.deletedChapters || []).includes(chapter.id)));
  const filteredChapters = allChapters.filter((chapter) =>
    matchesSearch(`${chapter.number} ${chapter.title}`, chapterQuery),
  );
  const selected =
    filteredChapters.find((chapter) => chapter.id === active) ??
    filteredChapters[0];
  const resolvedCards = resolveKanjiCards(content);
  const baseCards = [];
  const customCards = resolvedCards.filter((card) => card.chapterId === selected?.id && !card.subchapterId);
  const customSubchapters = (content.subchapters ?? []).filter(
    (subchapter) => subchapter.parentChapterId === selected?.id && subchapter.studyTab === "Kanji" && !content.deletedSubchapters.includes(subchapter.id),
  );
  const customCardsForSubchapter = (subchapterId) => resolvedCards.filter((card) => card.chapterId === subchapterId || card.subchapterId === subchapterId);
  const exerciseSubchapters = [
    ...(kanjiChapterOptions.find((chapter) => chapter.id === selected?.id)?.subchapters ?? []),
    ...customSubchapters,
  ].filter((section) => !content.deletedSubchapters.includes(section.id)).map((section) => ({ ...section, ...content.chapterOverrides[section.id] }));
  const exerciseAssignment = exerciseSubchapters.find((section) => section.id === exerciseScope);
  const exercises = exercisesForView(allExercises, "Kanji", selected?.id, exerciseAssignment?.id);
  const cards = [...baseCards, ...customCards, ...customSubchapters.flatMap((section) => customCardsForSubchapter(section.id))]
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
        .some((value) => matchesSearch(value, query)),
    );
  const chapterCards = cards.filter((card) => customCards.some((item) => item._id === card._id));
  const shuffledCards = useShuffledCards(cards, shuffleMode);
  const renderCard = (card) => (
      <div className={`managed-item card-layout-${card.layout || "standard"} ${query.trim() ? "search-hit" : ""}`} key={card._id ?? card.id ?? card.kanji}>
        <KanjiCard card={card} showReadings={showReadings} showKanjiReadings={showKanjiReadings} />
        {manageMode && isEditor && (
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
          Search Chapters
          <input
            id="kanji-chapter-search"
            className={chapterQuery.trim() ? (filteredChapters.length ? "search-box has-results" : "search-box no-results") : "search-box"}
            value={chapterQuery}
            onChange={(event) => setChapterQuery(event.target.value)}
            placeholder="例：生活、せいかつ"
          />
        </label>
        <label htmlFor="kanji-search">
          Search Kanji
          <input
            id="kanji-search"
            className={query.trim() ? (cards.length ? "search-box has-results" : "search-box no-results") : "search-box"}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="例：起きる、おきる、起きるの説明"
          />
        </label>
      </section>
      <div className="layout">
        <aside>
          <p className="count">{filteredChapters.length} chapters</p>
          <div className="chapter-group">{groupChapters(allChapters.map((chapter) => ({ ...chapter, studyTab: "Kanji" })), (content.groups || []).filter((group) => group.studyTab === "Kanji")).map((group) => <div className="chapter-group-block" key={group.id}>
          <p className="chapter-group-label"><span className="chapter-group-title">{displayText(group.label, showReadings)}</span><span className="chapter-group-range">{group.range}</span></p>
          {group.chapters.filter((chapter) => filteredChapters.some((item) => item.id === chapter.id)).map((chapter) => (
            <button
              key={chapter.id}
              type="button"
              className={selected?.id === chapter.id ? "active" : ""}
              onClick={() => {
                setActive(chapter.id);
                setExerciseScope("");
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
          </div>)}</div>
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
                    setExerciseScope("");
                    setQuery("");
                  }}
                >
                  Exercises
                </button>
                <button
                  type="button"
                  className={shuffleMode ? "selected manage-toggle" : "manage-toggle"}
                  aria-pressed={shuffleMode}
                  onClick={() => setShuffleMode((value) => !value)}
                >
                  Shuffle: {shuffleMode ? "ON" : "OFF"}
                </button>
                {isEditor && (<button
                  type="button"
                  className={manageMode ? "selected" : ""}
                  aria-pressed={manageMode}
                  disabled={!canEdit}
                  onClick={() => setManageMode((value) => !value)}
                >
                  Manage: {manageMode ? "ON" : "OFF"}
                </button>)}
                {manageMode && isEditor && (
                  <>
                    <button type="button" onClick={() => openEditor("chapter", "edit", { ...selected, studyTab: "Kanji" })}>
                      Edit Chapter
                    </button>
                    <button type="button" onClick={() => openEditor("subchapter", "add", { studyTab: "Kanji", chapterId: selected.id })}>
                      + Sub Chapter
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
                  {shuffleMode ? <section className="cards">{shuffledCards.map(renderCard)}</section> : <>
                  <SubchapterNav sections={[
                    ...(selected.id === "kanji-1" && !content.deletedSubchapters.includes("kanji-1-subchapter-1l1")
                      ? [{ id: "kanji-1-subchapter-1l1", title: "1l1" }]
                      : selected.groupCardsByLesson
                        ? selected.sections.filter((section) => !section.review && cards.some((card) => card.page === section.page)).map((section) => ({ id: `${selected.id}-section-${section.page}`, title: section.title }))
                        : []),
                    ...customSubchapters,
                  ]} />
                  {selected.id === "kanji-1" && !content.deletedSubchapters.includes("kanji-1-subchapter-1l1") ? (
                    <section className="vocab-section kanji-subchapter-section">
                      <div className="vocab-section-heading">
                        <div>
                          <p className="eyebrow">Sub Chapter 1l1</p>
                          <h3 lang="ja" id={subchapterTargetId("kanji-1-subchapter-1l1")} tabIndex={-1}>1l1</h3>
                        </div>
                        {manageMode && isEditor && (
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
                        {chapterCards.map(renderCard)}
                      </section>
                    </section>
                  ) : selected.groupCardsByLesson ? (
                    selected.sections
                      .filter((section) => !section.review && !content.deletedSubchapters.includes(`${selected.id}-section-${section.page}`))
                      .map((section) => {
                        const lessonCards = chapterCards.filter(
                          (card) => card.page === section.page,
                        );
                        if (!lessonCards.length) return null;
                        return (
                          <section
                            key={section.page}
                            className="kanji-lesson-group"
                          >
                            <h3 lang="ja" id={subchapterTargetId(`${selected.id}-section-${section.page}`)} tabIndex={-1}>
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
                      {chapterCards.map(renderCard)}
                    </section>
                  )}
                  {selected.groupCardsByLesson && <section className="cards">{chapterCards.filter((card) => content.deletedSubchapters.includes(`${selected.id}-section-${card.page}`)).map(renderCard)}</section>}
                  {customSubchapters.map((subchapter) => {
                    const subchapterCards = cards.filter((card) => card.chapterId === subchapter.id || card.subchapterId === subchapter.id);
                    return (
                      <section className="kanji-lesson-group vocab-section" key={subchapter.id}>
                        <div className="vocab-section-heading">
                          <div>
                            <p className="eyebrow">Sub Chapter {subchapter.number}</p>
                            <h3 lang="ja" id={subchapterTargetId(subchapter.id)} tabIndex={-1}>{displayText(subchapter.title, showReadings)}</h3>
                          </div>
                          {manageMode && isEditor && (
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
                  </>}
                  {!cards.length && (
                    <div className="empty search-empty">
                      <p>No searched record found.</p>
                    </div>
                  )}
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
                <>
                  <label className="exercise-scope">
                    Show Exercises For
                    <select value={exerciseAssignment?.id ?? ""} onChange={(event) => setExerciseScope(event.target.value)}>
                      <option value="">Main Chapter - All Exercises</option>
                      {exerciseSubchapters.map((section) => <option key={section.id} value={section.id}>Sub Chapter {section.number}: {section.title}</option>)}
                    </select>
                  </label>
                  <Exercises
                    key={`${selected.id}:${exerciseAssignment?.id ?? "all"}`}
                    exercises={exercises}
                    showReadings={showReadings}
                    showMyanmar={showMyanmar}
                    setShowMyanmar={setShowMyanmar}
                    assignmentLabel={exerciseAssignment?.title}
                    onAdd={canEdit ? () => openEditor("exercise", "add", { studyTab: "Kanji", chapterId: selected.id, subchapterId: exerciseAssignment?.id ?? "" }) : undefined}
                    onEdit={manageMode && isEditor ? (item) => openEditor("exercise", "edit", item) : undefined}
                    onDelete={manageMode && isEditor ? (item) => deleteRecord("exercise", item) : undefined}
                  />
                  {!exerciseAssignment && selected.extraWords?.map((word, index) => <p className="note" key={index}>
                    <span lang="ja">{displayText(word.term, showReadings)}</span>{" "}
                    {showMyanmar && <span lang="my">{word.explanation}</span>}
                  </p>)}
                </>
              )}
            </>
          ) : (
            <div className="empty search-empty">
              <p>No searched record found.</p>
            </div>
          )}
        </article>
      </div>
    </>
  );
}
