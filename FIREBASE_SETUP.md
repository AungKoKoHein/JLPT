# Firebase setup

The app uses the existing `akkh-jlpt` project, Google sign-in, and Firebase Realtime Database. N2 is a separate section of the same database, not a new database or project.

## Paths and access

- N3 content: `/jlpt/content`
- N2 content: `/jlpt/n2/content`
- Authorized owners: `/editors/<Firebase UID> = true`

Both content paths allow public reads. Writes require an authorized owner, valid record fields, and an incremented revision. The browser cannot grant editor access. Both levels share the same owner permissions.

Enable Google as a sign-in provider and authorize the site's domain and localhost in Firebase Authentication. Use Owner Sign In with Google in the app; signing in alone does not grant editor access.

The rules are in [database.rules.json](database.rules.json). Deploy updates using:

```sh
npx --yes firebase-tools@latest deploy --only database --project akkh-jlpt
```

## Content storage

Each level stores a schema-versioned record with a revision, JSON payload, updater, and timestamp. JSON preserves IDs containing periods and empty arrays. Revision-checked transactions prevent stale saves from overwriting newer edits.

The complete N3 catalog is stored in the payload alongside owner additions and overrides. The app does not load source-file study data. N2 starts with empty arrays and has all the same study and editing controls.

Caches are level-specific. Editing requires loaded data, owner permission, and a live connection. Keep the page open while a save is pending. Failed saves retain the open editor and show an error.

## One-time N3 migration

`migrations/upload-catalog.mjs` reads credentials from an existing Firebase CLI login, backs up the current records and rules, and merges `migrations/n3-catalog.json` without replacing owner edits. It uses conditional ETag writes, verifies saved content, initializes N2 only if absent, and adds N2 rules while preserving existing rules.

Run it with the installed firebase-tools package directory as its first argument. Without `--apply` it performs a read-only check; with `--apply` it uploads. Backups are stored locally in ignored `.migration-backups/`. The migration snapshot is retained for regression tests and is excluded from the frontend bundle.

Reference: [Firebase conditional writes](https://firebase.google.com/docs/database/rest/save-data).
