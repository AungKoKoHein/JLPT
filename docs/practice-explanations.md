# Saved Practice explanations

N3-1 is the first completed batch: 74 questions (35 vocabulary and 39
grammar/reading), with a Myanmar summary and individual explanations for all
296 choices. The four JSON files in `src/practiceExplanations/` are ordinary
editable, bundled content. Opening **Show explanations** makes no AI request,
requires no AI credentials, and does not depend on localStorage.

Unrelated choices have their meanings explained and their mismatch identified.
Near misses explain the specific reading, spelling, grammar or context issue.
Sentence-order questions include the full order and the position of each piece;
the non-star pieces are not incorrectly described as ungrammatical. Reading
explanations use the original passages and PDF pages as evidence.

Each entry retains a snapshot of the source prompt, choices and answer. Imported
questions resolve through `sourceQuestionId`. Edited questions receive a clear
source-mismatch message instead of a stale explanation. Sets not yet authored
show a Myanmar notice identifying N3-1 as the currently available batch. There
is no fallback to on-click AI generation.

## Source issues

- Vocabulary 12: the prompt uses 発明 where the context calls for 発表.
- Vocabulary 25: 授業科 appears where 授業料 is intended.
- Vocabulary 14: two printed choices repeat 中文; both are explained.
- Grammar 5: ような can be grammatical under another interpretation; the note
  explains why the supplied key prefers とおりの instead of claiming an absolute
  grammar error.
- Grammar 13: the supplied key marks 行ってもらいます, but the invited speaker's
  suitable acceptance is 行かせてもらいます. `suggestedAnswer` marks that suitable
  choice inside the explanation modal, and the original key is explicitly
  flagged. Scoring remains unchanged and the note tells the learner this.
- Grammar 23: the original image has actual sentence choices while the imported
  bank stores only numbered symbols. `choiceLabels` displays the original
  Japanese choices in the explanation modal.
- Grammar 39: `choiceLabels` removes OCR table spillover from the displayed
  explanation choice. The explanation shows 25 + 20 + 2 = 47 and why the
  double-points day does not apply.

The runtime AI integration and model configuration have been removed. Previously
enabled Firebase services have not been changed or disabled as part of this
content update.

## Checks

```sh
node scripts/practice-explanations.test.mjs
node scripts/practice-explanations-browser.mjs
npm test
npm run typecheck
npm run build
```

The browser check uses the real saved explanations, blocks AI endpoints, and
checks wrong/correct selections, source-key warnings, image-only choices,
unwritten sets, focus restoration, Close/Escape, and mobile widths.
