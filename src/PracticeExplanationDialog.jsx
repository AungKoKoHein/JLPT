import React, { useEffect, useId, useRef, useState } from "react";
import {
  loadPracticeExplanation,
  explanationError,
} from "./practiceExplanations.js";

export default function PracticeExplanationDialog({
  question,
  selectedAnswer,
  display,
  onClose,
  returnFocusRef,
}) {
  const dialog = useRef(null);
  const titleId = useId();
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({ loading: true });
  useEffect(() => {
    const previous = returnFocusRef?.current || document.activeElement;
    dialog.current.showModal();
    return () => {
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, []);
  useEffect(() => {
    let current = true;
    setState({ loading: true });
    loadPracticeExplanation(question).then(
      (result) => {
        if (current) setState({ result });
      },
      (error) => {
        if (current)
          setState({
            error: explanationError(error),
            retryable: ![
              "explanation-not-ready",
              "explanation-source-changed",
            ].includes(error?.code),
          });
      },
    );
    return () => {
      current = false;
    };
  }, [question, attempt]);
  return (
    <dialog
      ref={dialog}
      className="practice-explanation-dialog"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <header className="practice-explanation-header">
        <div>
          <h2 id={titleId} lang="my">
            အဖြေရှင်းလင်းချက်များ
          </h2>
          <span>Question {question.number}</span>
        </div>
        <button
          type="button"
          className="secondary-button"
          autoFocus
          onClick={onClose}
        >
          Close
        </button>
      </header>
      <div
        className="practice-explanation-body"
        aria-busy={state.loading || undefined}
      >
        <p className="practice-explanation-prompt" lang="ja">
          {display(question.prompt)}
        </p>
        {state.loading && (
          <p role="status" lang="my">
            အဖြေတစ်ခုချင်းစီအတွက် မြန်မာရှင်းလင်းချက်များ ပြင်ဆင်နေပါသည်…
          </p>
        )}
        {state.error && (
          <div role="alert">
            <p lang="my">{state.error}</p>
            {state.retryable && (
              <button
                type="button"
                className="primary-button"
                onClick={() => setAttempt((value) => value + 1)}
              >
                Try again
              </button>
            )}
          </div>
        )}
        {state.result && (
          <>
            <p className="practice-explanation-summary" lang="my">
              {state.result.summary}
            </p>
            {state.result.keyIssue && (
              <p className="reading-note" lang="my">
                {state.result.keyIssue}
              </p>
            )}
            <ol className="practice-choice-explanations">
              {state.result.choices.map(({ index, explanation, label }) => (
                <li
                  key={index}
                  className={
                    index === (state.result.suggestedAnswer ?? question.answer)
                      ? "answer-correct"
                      : ""
                  }
                >
                  <div className="practice-explanation-choice">
                    <strong lang="ja">
                      {index + 1}. {display(label || question.choices[index])}
                    </strong>
                    <span lang="my">
                      {index ===
                      (state.result.suggestedAnswer ?? question.answer)
                        ? "အဖြေမှန်"
                        : index === question.answer &&
                            state.result.suggestedAnswer != null
                          ? "မူရင်းအဖြေညွှန်း · အမှားရှိ"
                          : "အခြားရွေးချယ်စရာ"}
                      {index === selectedAnswer ? " · သင်ရွေးထားသောအဖြေ" : ""}
                    </span>
                  </div>
                  <p lang="my">{explanation}</p>
                </li>
              ))}
            </ol>
          </>
        )}
      </div>
    </dialog>
  );
}
