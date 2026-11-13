import React from 'react';
import { practiceText } from './practiceText.js';
import { promptUnderlines } from './questionPresentation.js';

export default function QuestionPrompt({ question, showReadings = false, showKanji = true }) {
  const display = text => practiceText(text, showReadings, showKanji);
  // Slice the fully annotated sentence so contextual readings survive markup.
  const annotated = practiceText(question.prompt, true, true);
  const offsets = [0];
  let position = 0;
  for (let index = 0; index < question.prompt.length; index++) {
    if (annotated[position] !== question.prompt[index]) break;
    position++;
    const reading = annotated.slice(position).match(/^[（(][\p{Script=Hiragana}\p{Script=Katakana}ー]+[）)]/u)?.[0];
    if (reading && question.prompt[index + 1] !== annotated[position]) position += reading.length;
    offsets.push(position);
  }
  const part = (start, end) => offsets.length === question.prompt.length + 1
    ? display(annotated.slice(offsets[start], offsets[end])) : display(question.prompt.slice(start, end));
  const parts = [];
  let cursor = 0;
  for (const { start, end } of promptUnderlines(question)) {
    parts.push(part(cursor, start));
    parts.push(<u className="pdf-question-underline" key={start}>{part(start, end)}</u>);
    cursor = end;
  }
  parts.push(part(cursor, question.prompt.length));
  return <>{parts}</>;
}
