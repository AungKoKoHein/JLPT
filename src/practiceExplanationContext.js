import passages from "./pdfReadingPassages.json" with { type: "json" };
import {
  problemInstruction,
  promptUnderlines,
  starLayout,
} from "./questionPresentation.js";

const byQuestion = new Map();
for (const set of passages) {
  for (const passage of set.passages) {
    for (const question of passage.questions)
      byQuestion.set(question.id, passage);
  }
}

export function explanationContext(question) {
  const sourceId = question.sourceQuestionId || question.id;
  const passage = byQuestion.get(sourceId);
  const text = question.passage || passage?.text || "";
  const images = [];
  if (question.questionImage) images.push(question.questionImage);
  // Reading/cloze passages and image-only questions need their original page,
  // even when the extracted question itself is available as text.
  const needsPage =
    question.questionImage ||
    (question.topic === "Grammar & reading" && question.number >= 19);
  if (needsPage) {
    const pages = passage?.sourcePages?.length
      ? passage.sourcePages
      : [question.sourcePage - 1, question.sourcePage];
    for (const page of question.sourcePages ?? []) {
      if (pages.includes(page.number)) images.push(page.src);
    }
  }
  return {
    sourceId,
    number: question.number,
    topic: question.topic,
    instruction: problemInstruction(question),
    prompt: question.prompt,
    underlined: promptUnderlines(question).map(({ start, end }) =>
      question.prompt.slice(start, end),
    ),
    target: question.target || "",
    passage: text,
    choices: question.choices,
    answer: question.answer,
    sentenceOrder: Boolean(starLayout(question.prompt)),
    sourceIssue: question.sourceIssue || "",
    images: [...new Set(images)],
  };
}

export const explanationIdentity = (context) =>
  JSON.stringify({ version: 1, ...context });

export function validateExplanation(value, choiceCount) {
  const myanmar = (text) =>
    typeof text === "string" &&
    text.length >= 20 &&
    /[\u1000-\u109f]/u.test(text);
  if (
    !value ||
    !myanmar(value.summary) ||
    !Array.isArray(value.choices) ||
    value.choices.length !== choiceCount
  )
    throw new Error("invalid-explanation");
  const choices = [...value.choices].sort((a, b) => a.index - b.index);
  if (
    choices.some(
      (choice, index) => choice.index !== index || !myanmar(choice.explanation),
    )
  )
    throw new Error("invalid-explanation");
  if (value.keyIssue && !myanmar(value.keyIssue))
    throw new Error("invalid-explanation");
  return { summary: value.summary, choices, keyIssue: value.keyIssue || "" };
}
