import { displayKanji } from "./studyText.js";
import React, { useId, useState } from "react";
import { groupExercisesByType } from "./exercisePresentation.js";
import "./exercises.css";

export default function Exercises({
  exercises,
  showReadings,
  showKanji = true,
  showMyanmar,
  onEdit,
  onDelete,
  onAdd,
  assignmentLabel,
}) {
  const [answerVisibility, setAnswerVisibility] = useState({});
  const answerPrefix = useId();
  const showAnswers = exercises.length > 0 && exercises.every(item => answerVisibility[item._id]);
  const groups = groupExercisesByType(exercises, showMyanmar);
  const display = (text = "") =>
    displayKanji(showReadings
      ? text
      : text
          .replace(/（[ぁ-ゖァ-ヶー]+）/g, "")
          .replace(/\s*\([ぁ-ゖァ-ヶー]+\)/g, ""), showKanji);
  const question = (item) => {
    if (item.questionParts?.join("") === item.question) {
      const [before, target, after] = item.questionParts;
      return (
        <>
          {display(before)}
          <u>{display(target)}</u>
          {display(after)}
        </>
      );
    }
    return item.question
      .split(/(\|[^|]+\|)/g)
      .map((part, index) =>
        part.startsWith("|") && part.endsWith("|") ? (
          <u key={index}>{display(part.slice(1, -1))}</u>
        ) : (
          display(part)
        ),
      );
  };
  return (
    <section className="exercises" aria-label="Exercises">
      <div className="tools exercise-toolbar">
        <p>
          {exercises.length} sentences
          {assignmentLabel
            ? ` · Assigned to ${assignmentLabel}`
            : " · All chapter exercises"}
        </p>
        {onAdd && (
          <button type="button" onClick={onAdd}>
            + Exercise
          </button>
        )}
      </div>
      <div className="exercise-language-controls">
        <button
          type="button"
          className="reading-toggle answer-key-toggle"
          aria-label="Show Answer Key"
          aria-pressed={showAnswers}
          disabled={!exercises.length}
          onClick={() => setAnswerVisibility(showAnswers ? {} : Object.fromEntries(exercises.map(item => [item._id, true])))}
        >
          Answer Key: {showAnswers ? "ON" : "OFF"}
        </button>
      </div>
      {groups.map((group) => (
        <section key={group.key} className="exercise-section" data-exercise-type={group.key}>
          <h3 lang={group.lang} className="exercise-type-heading">{display(group.title)}</h3>
          <ol>
            {group.items.map((item, index) => {
                const shown = Boolean(answerVisibility[item._id]);
                const answerId = `${answerPrefix}-answer-${encodeURIComponent(item._id)}`;
                return (
                <li key={item._id} data-exercise-id={item._id}>
                  {group.sectionCount > 1 && (index === 0 || group.items[index - 1].section !== item.section) && <p className="exercise-source-section" lang="ja">{display(String(item.section || ''))}</p>}
                  {item.imageSrc && (
                    <img className="exercise-illustration" src={`${import.meta.env.BASE_URL}${item.imageSrc}`} alt={item.imageAlt ?? "Exercise illustration"} loading="lazy" />
                  )}
                  <div className="exercise-question-row"><p className="exercise-question" lang="ja">
                    {question(item)}
                  </p>
                  <button type="button" className="exercise-answer-eye"
                    aria-label={`${shown ? 'Hide' : 'Show'} answer for question ${index + 1} in ${group.title}`}
                    title={shown ? 'အဖြေ ဖျောက်မည်' : 'အဖြေ ကြည့်မည်'}
                    aria-expanded={shown} aria-controls={answerId}
                    onClick={() => setAnswerVisibility(current => ({ ...current, [item._id]: !current[item._id] }))}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" />{shown && <path d="m3 3 18 18" />}</svg>
                  </button></div>
                  {showMyanmar && item.questionMyanmar && (
                    <p className="exercise-translation" lang="my">
                      {item.questionMyanmar}
                    </p>
                  )}
                  <div id={answerId} hidden={!shown}>{shown && (
                    <>
                      <p className="exercise-answer" lang="ja">
                        <strong>Answer:</strong> {display(item.answer)}
                      </p>
                      {showMyanmar && item.answerMyanmar && (
                        <p className="exercise-answer-translation" lang="my">
                          <strong>အဖြေ:</strong> {item.answerMyanmar}
                        </p>
                      )}
                    </>
                  )}</div>
                  {(onEdit || onDelete) && (
                    <div className="item-actions">
                      {onEdit && (
                          <button type="button" onClick={() => onEdit(exercises.find(original => original._id === item._id))}>
                          Edit
                        </button>
                      )}
                      {onDelete && (
                          <button type="button" onClick={() => onDelete(exercises.find(original => original._id === item._id))}>
                          Delete Everywhere
                        </button>
                      )}
                    </div>
                  )}
                </li>
              ); })}
          </ol>
        </section>
      ))}
      {!exercises.length && (
        <p>
          {assignmentLabel
            ? "No exercises assigned yet. Edit an exercise in the main list and choose this sub chapter."
            : "No exercises for this chapter yet."}
        </p>
      )}
    </section>
  );
}
