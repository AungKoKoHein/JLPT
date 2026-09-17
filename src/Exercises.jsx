import React, { useState } from "react";

export default function Exercises({
  exercises,
  showReadings,
  showMyanmar,
  setShowMyanmar,
  onEdit,
  onDelete,
  onAdd,
  assignmentLabel,
}) {
  const [showAnswers, setShowAnswers] = useState(false);
  const display = (text = "") =>
    showReadings
      ? text
      : text
          .replace(/（[ぁ-ゖァ-ヶー]+）/g, "")
          .replace(/\s*\([ぁ-ゖァ-ヶー]+\)/g, "");
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
          onClick={() => setShowAnswers((value) => !value)}
        >
          Answer Key: {showAnswers ? "ON" : "OFF"}
        </button>
        <button
          type="button"
          className="reading-toggle"
          aria-label="Show Myanmar exercise text"
          aria-pressed={showMyanmar}
          onClick={() => setShowMyanmar(!showMyanmar)}
        >
          Myanmar: {showMyanmar ? "ON" : "OFF"}
        </button>
      </div>
      {[...new Set(exercises.map((item) => item.section))].map((section) => (
        <section key={section} className="exercise-section">
          <h3>{display(String(section))}</h3>
          <ol>
            {exercises
              .filter((item) => item.section === section)
              .map((item) => (
                <li key={item._id} data-exercise-id={item._id}>
                  {item.imageSrc && (
                    <img className="exercise-illustration" src={`${import.meta.env.BASE_URL}${item.imageSrc}`} alt={item.imageAlt ?? "Exercise illustration"} loading="lazy" />
                  )}
                  <p className="exercise-question" lang="ja">
                    {question(item)}
                  </p>
                  {showMyanmar && item.questionMyanmar && (
                    <p className="exercise-translation" lang="my">
                      {item.questionMyanmar}
                    </p>
                  )}
                  {showAnswers && (
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
                  )}
                  {(onEdit || onDelete) && (
                    <div className="item-actions">
                      {onEdit && (
                        <button type="button" onClick={() => onEdit(item)}>
                          Edit
                        </button>
                      )}
                      {onDelete && (
                        <button type="button" onClick={() => onDelete(item)}>
                          Delete Everywhere
                        </button>
                      )}
                    </div>
                  )}
                </li>
              ))}
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
