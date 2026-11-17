# Continue one saved Practice explanation batch

Work in this JLPT repository. The user authorized completing the old Practice
questions in separate batches, at most four batches per day, with at least five
hours between scheduled runs. Complete exactly ONE remaining playable set per
run, in ascending order. N3-1 is already complete. Consult
`docs/practice-explanation-progress.json` for the remaining queue, but verify
actual saved coverage before choosing a set. Do not repeat completed sets.

## The user's required content

Write and save actual Myanmar explanations, not just right/wrong labels. Each
question needs a Myanmar summary and one distinct explanation for every choice.
Explain why the correct answer fits this specific question and why each wrong
choice fails. For a totally unrelated choice, give its Myanmar meaning and a
brief explanation that it does not fit. For close choices, explain the specific
grammar, reading, spelling, or contextual difference. Do not use generic filler
or fabricate a justification for an incorrect source key.

Read the questions and choices from `src/n3PracticeBank.json`, using
`practiceCategories` from `src/practiceCategories.js` to get the playable set.
Read relevant passages from `src/pdfReadingPassages.json` and inspect original
images under `public/practice-n3/` when necessary. Source presentation and
underlines are in `src/practicePresentation.json`. Some source answer keys and
OCR text are wrong. Flag inconsistencies explicitly. Do not silently alter the
question bank or scoring. A `suggestedAnswer` can identify the suitable choice
inside the explanation modal, with a clear `keyIssue` describing the conflict.

For sentence-order questions explain the completed sentence, the full order,
and why each piece occupies its position. Non-star pieces may be valid parts of
the sentence, not ungrammatical answers. For reading questions use passage
evidence. For image-only choices provide verified `choiceLabels` containing the
actual Japanese choices. Do not guess unreadable content.

## Implementation

Follow the authored N3-1 JSON entries under `src/practiceExplanations/`. Each
entry is keyed by its original question ID, with `summary`, exactly four
`explanations`, optional `keyIssue`, optional `suggestedAnswer` and
`choiceLabels`, and a `source` snapshot of the original `prompt`, `choices`, and
`answer`. Keep source snapshots exact; they prevent stale explanations after
question edits. Add the new JSON files to `src/savedPracticeExplanations.js`.

Keep the on-click modal and offline bundled content. Never reintroduce runtime
AI generation, API keys, or network dependencies for opening explanations.
Update the availability notice in `src/practiceExplanations.js` as coverage
grows. Preserve all unrelated work; this checkout contains earlier uncommitted
study fixes. Do not reset or discard them. Do not spawn other agents.

## Verify and finish

Check every playable question in this batch has a summary, four distinct
Myanmar explanations, an exact source snapshot, and correct optional labels.
Inspect the explanations for factual and Japanese-language accuracy; passing
a length check alone is insufficient. Ensure all previous batches still work.
Update the coverage assertions in `scripts/practice-explanations.test.mjs` to
cover all completed batches without weakening the four-choice, source-match,
offline, and source-key-conflict checks. Run appropriate tests, type checking,
and the production build. Report real failures honestly.

After successful validation, move this set from `remaining` to `completed` in
`docs/practice-explanation-progress.json`. Record a concise result in
`docs/practice-explanation-last-run.md`, including the set, counts, evidence
checked, source issues and check results. If incomplete, leave it pending and
record exactly what remains; do not claim completion. Stop when the queue is
empty. Keep changes local: no Git commits, pushes, merges, or deployment unless
the user separately authorizes publication.
