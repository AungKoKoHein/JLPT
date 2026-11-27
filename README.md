# JLPT N3 and N2

Both levels use the same study and editing features, with independent content in the existing Firebase Realtime Database.

- N3: /n3/vocab (legacy /vocab, /grammar, and other topic links still work).
- N2: /n2/vocab, initially empty.
- Each level includes vocabulary, grammar, Kanji, listening, reading, and mock exams.
- Use the level links in the header to switch levels. Only the authorized owner can edit.

## Development

The AWS section at `/aws/part-1` through `/aws/part-4` includes a Lesson / Exercises switch for each of its 30 chapters. Each chapter has five questions (150 total): three original handbook reviews and two shortened, translated adaptations of related questions from the existing 684-question AWS Practice bank. Each adaptation shows its original Practice number and source PDF pages; assumptions are clarified where needed. Questions, choices, feedback, and explanations are available in Myanmar, English, and Japanese. Exercises initially use Japanese, and the language selector remembers later choices in this browser. Answers remain selected while switching languages, chapters, or parts during the current session; Reset this chapter clears only that chapter. Show answer key reveals explanations without grading unanswered questions. The full original questions remain available in AWS Practice.

```sh
npm install
npm run dev
```

Development starts Vite directly. Production builds use `npm run build`. Neither command imports documents, adds readings, or generates study data. All study content comes from Firebase; a separate cache for each level supports previously loaded content offline.

## Database

N3 Listening at `/n3/listening` includes the supplied December 2016, 2017 and 2018 sets: 84 individually split MP3 question tracks, 17 original PDF illustrations, printed choices, and the listening-only PDF excerpt. An exam selector keeps browser-local answers and notes separate for each set; the supplied PDFs have no answer keys. The full source recording is also available. To reproduce the import with PyAV and PyMuPDF installed, run `python scripts/import-n3-listening.py <audio.mp3> <questions.pdf> scripts/fixtures/n3-listening-2016-12-timings.json`.

Vocabulary book and flashcard views fill missing furigana from `src/vocabularyFurigana.json`, preserving the saved sentences and explicit authored readings. Its offline generator is `node scripts/build-vocabulary-furigana.mjs [read-only-n3-snapshot.json]`; it audits the migration catalog plus the optional current-content snapshot. The dictionary is not loaded into the browser. The current audit covers 1,796 visible vocabulary cards and 1,223 distinct example sentences.

The existing `akkh-jlpt` project and database are used:

| Level | Content path |
| --- | --- |
| N3 | /jlpt/content |
| N2 | /jlpt/n2/content |

Chapters, cards, exercises, edits, deletions, assignments, and ordering are stored in each level's versioned content record. N3's migrated catalog preserves original IDs and owner edits. N2 has no initial study data. Create its first chapter using New while signed in as the owner.

See [FIREBASE_SETUP.md](FIREBASE_SETUP.md) for authentication and access rules.

Account managers open **Manage viewer accounts** in a modal. New accounts and existing accounts (using **Tab access**) can allow all tabs or selected tabs across N3, N2, and AWS. Existing viewers without a policy retain all tabs; a selected policy with no tabs grants no study pages. Editors and account managers remain unrestricted. Changes are stored in the manager-writable viewer profile and applied live; navigation and direct page URLs respect the assignment. These are application tab restrictions, not per-tab data isolation: the shared catalog and publicly hosted static media are still shared resources. Profile validation for the new `tabAccess` field is included in `database.rules.json` for deployment with the application.

## Migration and source archive

`migrations/n3-catalog.json` is a one-time migration snapshot and regression-test fixture. It is not imported by the app or included in the site build. Original source documents remain in `source/` for reference. Content is maintained through the site's owner controls.

The migration utility preserves existing content, checks revisions with Firebase ETags, and creates local backups under ignored `.migration-backups/`. Re-running it does not reseed an existing catalog or overwrite N2 data.

## Validation and hosting

Run `npm test`, `npm run typecheck`, and `npm run build`. The build emits entry pages for both levels and all study tabs so direct links and refreshes work on static hosting. Vercel rewrites are also configured.
