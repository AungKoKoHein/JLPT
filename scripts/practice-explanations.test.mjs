import test from "node:test";
import assert from "node:assert/strict";
import bank from "../src/n3PracticeBank.json" with { type: "json" };
import { practiceCategories } from "../src/practiceCategories.js";
import {
  savedExplanations,
  savedPracticeExplanation,
} from "../src/savedPracticeExplanations.js";
import {
  loadPracticeExplanation,
  explanationError,
} from "../src/practiceExplanations.js";
import {
  explanationContext,
  explanationIdentity,
  validateExplanation,
} from "../src/practiceExplanationContext.js";

test("all completed sets have distinct, substantive Myanmar explanations for every choice", () => {
  const sets = practiceCategories(bank).filter(set => ["n3-1", "n3-3"].includes(set.id));
  assert.deepEqual(sets.map(set => [set.id, set.questions.length]), [["n3-1", 74], ["n3-3", 72]]);
  const questions = sets.flatMap(set => set.questions);
  assert.equal(Object.keys(savedExplanations).length, 146);
  let count = 0;
  for (const question of questions) {
    const result = savedPracticeExplanation(question);
    assert.deepEqual(savedExplanations[question.id].source, {
      prompt: question.prompt, choices: question.choices, answer: question.answer,
    });
    validateExplanation(result, 4);
    assert.equal(
      new Set(result.choices.map((choice) => choice.explanation)).size,
      4,
      question.id,
    );
    for (const choice of result.choices) {
      assert.ok(
        choice.explanation.length >= 40,
        `${question.id}: ${choice.index}`,
      );
      count++;
    }
  }
  assert.equal(count, 584);
});

test("bundled explanations are available without fetch, localStorage, or AI", async () => {
  const previous = globalThis.fetch;
  globalThis.fetch = () => {
    throw Error("Network must never be used");
  };
  try {
    for (const question of practiceCategories(bank).filter(set => ["n3-1", "n3-3"].includes(set.id)).flatMap(set => set.questions)) {
      const result = await loadPracticeExplanation(question);
      assert.equal(result.source, "saved");
      assert.equal(result.choices.length, 4);
    }
  } finally {
    globalThis.fetch = previous;
  }
});

test("imported IDs use the saved source ID, and edited questions do not receive stale explanations", () => {
  const question = bank[0].questions[0];
  assert.deepEqual(
    savedPracticeExplanation({
      ...question,
      id: "imported",
      sourceQuestionId: question.id,
    }),
    savedPracticeExplanation(question),
  );
  for (const edit of [
    { prompt: "changed" },
    { choices: ["changed"] },
    { answer: 0 },
  ]) {
    assert.throws(() => savedPracticeExplanation({ ...question, ...edit }), {
      code: "explanation-source-changed",
    });
  }
});

test("unwritten sets show a truthful message rather than call AI", async () => {
  const question = practiceCategories(bank).find(set => set.id === "n3-4").questions[0];
  assert.equal(savedPracticeExplanation(question), null);
  await assert.rejects(loadPracticeExplanation(question), {
    code: "explanation-not-ready",
  });
  assert.match(explanationError({ code: "explanation-not-ready" }), /N3-1/);
});

test("N3-3 preserves source conflicts, sentence order, and verified image labels", () => {
  const conflict = savedExplanations["n3-3-vocabulary-13"];
  assert.equal(conflict.source.answer, 1);
  assert.equal(conflict.suggestedAnswer, 0);
  assert.match(conflict.keyIssue, /領収書/);
  assert.match(savedExplanations["n3-3-grammar-13"].keyIssue, /つきっぱなし/);
  assert.match(savedExplanations["n3-3-grammar-38"].keyIssue, /15:00/);
  for (let n = 14; n <= 18; n++) {
    const entry = savedExplanations[`n3-3-grammar-${n}`];
    assert.match(entry.summary, /→/);
    assert.ok(entry.explanations.every(text => text.includes("နေရာ")));
  }
  assert.deepEqual(savedExplanations["n3-3-grammar-39"].choiceLabels, [
    "３月１日までに、スーパーに面接の時間を予約する。",
    "１月２０日までに、履歴書に写真をはってスーパーに持っていく。",
    "２月１２日までに、履歴書に写真をはってスーパーに送る。",
    "１月２０日までに、スーパーに電話して希望のアルバイトの種類を言う。",
  ]);
});

test("a conflicting source key is flagged, and image-only choices have actual Japanese labels", () => {
  const conflict = savedExplanations["n3-1-grammar-13"];
  assert.equal(conflict.suggestedAnswer, 1);
  assert.equal(conflict.source.answer, 2);
  assert.ok(conflict.keyIssue.includes("②"));
  assert.deepEqual(savedExplanations["n3-1-grammar-23"].choiceLabels, [
    "なると思っています",
    "なったと思っています",
    "なりたいと思っています",
    "なってほしいと思います",
  ]);
  assert.equal(
    savedExplanations["n3-1-grammar-39"].choiceLabels[3],
    "47 ポイント",
  );
});

test("every playable practice question supplies all choices and its original answer key", () => {
  const questions = practiceCategories(bank).flatMap((set) => set.questions);
  assert.ok(questions.length > 1500);
  for (const question of questions) {
    const context = explanationContext(question);
    assert.deepEqual(context.choices, question.choices);
    assert.equal(context.answer, question.answer);
    assert.ok(context.prompt);
    assert.ok(
      context.images.every((path) =>
        /^\/practice-n3\/[a-zA-Z0-9-]+\.png$/.test(path),
      ),
      question.id,
    );
    if (question.questionImage)
      assert.ok(context.images.includes(question.questionImage));
    if (question.topic === "Grammar & reading" && question.number >= 19)
      assert.ok(context.passage || context.images.length, question.id);
  }
});

test("readings include the underlined target, and imported IDs resolve original source context", () => {
  const question = bank[0].questions[0];
  const context = explanationContext(question);
  assert.deepEqual(context.underlined, ["比べて"]);
  assert.deepEqual(
    explanationContext({
      ...question,
      id: "imported-id",
      sourceQuestionId: question.id,
    }),
    context,
  );
});

test("cache identity changes when the question, passage, choices or answer changes", () => {
  const context = explanationContext(bank[0].questions[0]);
  const identity = explanationIdentity(context);
  for (const edit of [
    { prompt: "changed" },
    { passage: "changed" },
    { choices: ["changed"] },
    { answer: 0 },
  ])
    assert.notEqual(explanationIdentity({ ...context, ...edit }), identity);
});

const prose =
  "ဤစာကြောင်းတွင် အသုံးပြုထားသော စကားလုံး၏ အဓိပ္ပာယ်ကို ရှင်းပြထားပါသည်။";
const valid = () => ({
  summary: prose,
  choices: Array.from({ length: 4 }, (_, index) => ({
    index,
    explanation: prose,
  })),
  keyIssue: "",
});

test("responses must include Myanmar explanations for all four choices", () => {
  assert.equal(validateExplanation(valid(), 4).choices.length, 4);
  for (const bad of [
    { ...valid(), summary: "English only explanation" },
    { ...valid(), choices: valid().choices.slice(1) },
    {
      ...valid(),
      choices: valid().choices.map((choice) => ({ ...choice, index: 0 })),
    },
    {
      ...valid(),
      choices: valid().choices.map((choice) => ({
        ...choice,
        explanation: "Wrong",
      })),
    },
    { ...valid(), keyIssue: "English key issue" },
  ])
    assert.throws(() => validateExplanation(bad, 4));
});
