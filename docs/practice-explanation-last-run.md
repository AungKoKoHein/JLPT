# Saved explanation batch — 2026-11-18

Completed N3-3 locally: 72 playable questions (35 vocabulary, 37 grammar/reading),
72 Myanmar summaries and 288 distinct choice explanations. Total saved coverage
is now N3-1 plus N3-3: 146 questions and 584 choices. N3-4 is next in the queue;
the other 21 remaining sets are still pending. No scheduling or publication was
performed by this run.

Reviewed question prompts, choices, presentation underlines, extracted reading
passages, and original page images 38, 39 and 44. Page 38 supplies cloze context
and sentence orders; page 44 supplies job requirements and the actual choices
for image-only grammar 39. Source snapshots are exact and scoring is unchanged.

Flagged vocabulary 13's incorrect 領収書 key, grammar 13's が/つけっぱなし
mismatch, and grammar 38's unstated transition-time assumption at 15:00.
Grammar 39 includes verified Japanese labels. Each ordering explanation gives
the full order and explains why valid non-star pieces belong elsewhere.

Validation:

- Explanation tests: 10 passed, covering all 146 saved playable questions,
  distinct Myanmar text, exact snapshots, offline loading, key conflicts and labels.
- Full suite: 89 passed (`npm.cmd test`).
- Type checking: passed (`npm.cmd run typecheck`).
- Production build: passed (`npm.cmd run build`); bundle-size warning remains.
- Browser check: passed (saved content, source-key warning, image labels,
  unavailable N3-4, modal controls, mobile layout and no AI requests).

PowerShell's npm script policy was handled by using npm.cmd. Test runner and
build process spawning initially hit sandbox EPERM; both passed on authorized
reruns with process access. Existing unrelated working-tree changes preserved.
