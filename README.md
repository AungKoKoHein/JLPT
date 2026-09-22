# JLPT N3 and N2

Both levels use the same study and editing features, with independent content in the existing Firebase Realtime Database.

- N3: /n3/vocab (legacy /vocab, /grammar, and other topic links still work).
- N2: /n2/vocab, initially empty.
- Each level includes vocabulary, grammar, Kanji, listening, reading, and mock exams.
- Use the level links in the header to switch levels. Only the authorized owner can edit.

## Development

```sh
npm install
npm run dev
```

Development starts Vite directly. Production builds use `npm run build`. Neither command imports documents, adds readings, or generates study data. All study content comes from Firebase; a separate cache for each level supports previously loaded content offline.

## Database

The existing `akkh-jlpt` project and database are used:

| Level | Content path |
| --- | --- |
| N3 | /jlpt/content |
| N2 | /jlpt/n2/content |

Chapters, cards, exercises, edits, deletions, assignments, and ordering are stored in each level's versioned content record. N3's migrated catalog preserves original IDs and owner edits. N2 has no initial study data. Create its first chapter using New while signed in as the owner.

See [FIREBASE_SETUP.md](FIREBASE_SETUP.md) for authentication and access rules.

## Migration and source archive

`migrations/n3-catalog.json` is a one-time migration snapshot and regression-test fixture. It is not imported by the app or included in the site build. Original source documents remain in `source/` for reference. Content is maintained through the site's owner controls.

The migration utility preserves existing content, checks revisions with Firebase ETags, and creates local backups under ignored `.migration-backups/`. Re-running it does not reseed an existing catalog or overwrite N2 data.

## Validation and hosting

Run `npm test`, `npm run typecheck`, and `npm run build`. The build emits entry pages for both levels and all study tabs so direct links and refreshes work on static hosting. Vercel rewrites are also configured.
