# Start here for cloud work

Repository: `AungKoKoHein/JLPT`

Required starting branch: `codex/jlpt-cloud-baseline-20261117`

`main` does not contain this baseline until its draft pull request is merged.
Connecting GitHub grants access to repository content; it does not upload a PC's
uncommitted working files. Always verify the branch and these files before
claiming that a cloud task can continue the prepared work.

## Included work

- Corrected PDF-space furigana generation and regenerated saved readings.
- Mock Exam text no longer reveals readings through study toggles.
- Kanji reading fallbacks, corrected 起 readings, and `(on)` / `(kun)` labels.
- Click-only Practice explanation modal with saved Myanmar explanations for
  N3-1's 74 questions and all 296 choices. There is no runtime AI dependency.
- Notes for faulty source keys, including grammar 13; scoring is unchanged.
- The remaining queue: 23 playable sets, 1,613 questions, 6,452 choices.

## Continue the batches

Read these files in order:

1. `docs/practice-explanation-cloud-schedule.md` — proposed times and cloud task
   prompt. No schedule has been activated by uploading this branch.
2. `docs/practice-explanation-progress.json` — completed and remaining sets.
3. `docs/practice-explanation-batch-prompt.md` — writing and validation rules.
4. `docs/practice-explanations.md` — saved-content implementation and source issues.

For an explicitly scheduled cloud run, commit and push each verified completed
batch to this baseline branch so later runs retain it. This branch-only cloud
instruction overrides the batch prompt's local-only restriction. Do not merge
to `main`, force-push, or deploy production without separate authorization.

Keep runs sequential, at most four daily and at least five hours apart. One
complete set per run; retry an incomplete set instead of skipping it. Stop
when the queue is empty. Never claim a schedule is active without a verified
registered cloud task.

## Environment

Use Node.js 22+ and install dependencies with `npm ci`. All study source text and
page images needed for explanations are in this repository. No PC-local files,
Gemini keys, Firebase administrator credentials or previous chat are needed.

Run `npm test`, `npm run typecheck`, and `npm run build`. The optional browser
script currently launches Windows Chrome; on Linux cloud workers use an
available browser tool or adapt only that launch configuration, rather than
claiming the Windows browser script passed there.
