# Myanmar study translations — 18 September 2026

Published directly to the `akkh-jlpt` Realtime Database at `/jlpt/content`.

- Revision: 108 → 109, verified by public readback.
- Coverage: all 1,754 vocabulary cards and 369 existing exercises after Chapter 1 (28 chapters, including Part 2).
- Full Myanmar example sentences, translated exercise blanks, and Myanmar answer meanings.
- Corrected malformed Japanese examples and answer keys encountered during review.
- Chapter 1, Kanji, chapter assignments, ordering, deletions, and other content preserved.
- No frontend or bundled source-data changes are required to display the translations.

`before.json` and `pre-publish-revision-108.json` contain backups. `published.json` contains the verified saved snapshot. `validation.json` and `publish-result.json` record the checks and result.

`translations.mjs`, `exercise-translations.mjs`, and `card-examples.mjs` contain the authored translations and corrections. `prepare.mjs` assembles the database payload, and `validate.mjs` checks coverage, blank counts, language content, and preservation of unrelated data. `publish.mjs` merges only changed fields into a fresh snapshot and uses an ETag to reject concurrent changes; it never writes unless invoked with `--apply`.

These files do not contain Firebase login credentials. The publisher uses the Firebase CLI's locally authenticated session.
