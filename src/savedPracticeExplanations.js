import vocabularyFirst from "./practiceExplanations/n3-1-vocabulary-1-14.json" with { type: "json" };
import vocabularyRest from "./practiceExplanations/n3-1-vocabulary-15-35.json" with { type: "json" };
import grammar from "./practiceExplanations/n3-1-grammar-1-18.json" with { type: "json" };
import reading from "./practiceExplanations/n3-1-grammar-19-39.json" with { type: "json" };
import n3ThreeVocabulary from "./practiceExplanations/n3-3-vocabulary.json" with { type: "json" };
import n3ThreeGrammar from "./practiceExplanations/n3-3-grammar.json" with { type: "json" };

export const savedExplanations = {
  ...vocabularyFirst,
  ...vocabularyRest,
  ...grammar,
  ...reading,
  ...n3ThreeVocabulary,
  ...n3ThreeGrammar,
};

export function savedPracticeExplanation(question) {
  const entry = savedExplanations[question.sourceQuestionId || question.id];
  if (!entry) return null;
  if (
    entry.source.prompt !== question.prompt ||
    entry.source.answer !== question.answer ||
    JSON.stringify(entry.source.choices) !== JSON.stringify(question.choices)
  ) {
    const error = new Error("explanation-source-changed");
    error.code = "explanation-source-changed";
    throw error;
  }
  return {
    summary: entry.summary,
    choices: entry.explanations.map((explanation, index) => ({
      index,
      explanation,
      label: entry.choiceLabels?.[index],
    })),
    keyIssue: entry.keyIssue || "",
    suggestedAnswer: entry.suggestedAnswer,
    source: "saved",
  };
}
