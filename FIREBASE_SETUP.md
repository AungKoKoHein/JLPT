# Firebase setup

The app uses the existing `akkh-jlpt` project and Firebase Realtime Database. Viewer accounts use usernames and passwords managed in the site owner's user table. Firebase Auth uses an internal, non-deliverable alias for each username; viewers do not need a real email address. Existing Google sign-in remains the editor sign-in. N2 is a separate section of the same database, not a new database or project.

## Paths and access

- N3 content: `/jlpt/content`
- N2 content: `/jlpt/n2/content`
- Authorized owners: `/editors/<Firebase UID> = true`
- Viewer account table: `/practiceUsers/<Firebase UID>`
- Device sessions: `/practiceSessions/<Firebase UID>` (maximum five)
- Private N3 Practice bank: `/n3Practice/sets`

The app requires an approved username/password account or an authorized Google editor account to view any page. Sign-in expires after seven days; database rules also reject older Firebase sign-ins. Each account can register up to five browser/device sessions. Realtime Database reads for N2/N3 study content and the Practice bank are limited to approved viewers or editors. Writes require an authorized owner, valid record fields, and an incremented revision. The browser cannot grant editor access. Both levels share the same owner permissions.

Enable Google and Email/Password once in Firebase Authentication → Sign-in method. Email/Password is the Firebase provider behind username accounts; the app does not verify or email those aliases. Add the current Vercel domain and localhost under Authorized domains. Existing Google editors can sign in as before. The Google editor account can add viewer accounts from **Manage viewer accounts**; viewer records do not store passwords. Removing a viewer disables access but keeps the record so access can be restored later. Provide passwords to viewers directly; no email reset is available for username-only accounts.

After changing Authentication providers, deploy the updated Realtime Database rules below. Vercel builds do not deploy Firebase rules. This setup uses Firebase Authentication and Realtime Database; Spark quotas still apply. Viewer account edits and permanent deletion use a protected Vercel API endpoint. No Firebase Cloud Functions are required. New viewers can then sign in with the username and password supplied by the editor. A viewer who loses access is blocked on the next database access check.

The rules are in [database.rules.json](database.rules.json). Deploy updates using:

```sh
npx --yes firebase-tools@latest deploy --only database --project akkh-jlpt
```

The Practice tab reads its 26-set JSON bank from `/n3Practice/sets`. Only a Google editor can import or replace that bank from the tab; the question content is stored in Realtime Database rather than the frontend bundle.

## Content storage

Each level stores a schema-versioned record with a revision, JSON payload, updater, and timestamp. JSON preserves IDs containing periods and empty arrays. Revision-checked transactions prevent stale saves from overwriting newer edits.

The complete N3 catalog is stored in the payload alongside owner additions and overrides. The app does not load source-file study data. N2 starts with empty arrays and has all the same study and editing controls.

Caches are level-specific. Editing requires loaded data, owner permission, and a live connection. Keep the page open while a save is pending. Failed saves retain the open editor and show an error.

## One-time N3 migration

`migrations/upload-catalog.mjs` reads credentials from an existing Firebase CLI login, backs up the current records and rules, and merges `migrations/n3-catalog.json` without replacing owner edits. It uses conditional ETag writes, verifies saved content, initializes N2 only if absent, and adds N2 rules while preserving existing rules.

Run it with the installed firebase-tools package directory as its first argument. Without `--apply` it performs a read-only check; with `--apply` it uploads. Backups are stored locally in ignored `.migration-backups/`. The migration snapshot is retained for regression tests and is excluded from the frontend bundle.

Reference: [Firebase conditional writes](https://firebase.google.com/docs/database/rest/save-data).


## Editing and permanently deleting viewer accounts

Each viewer row has **Edit** and **Delete permanently** actions, using in-page modal dialogs. Edit updates the internal Firebase Auth email when the username changes, and changes the password only when a new password is supplied. The Firebase UID stays the same, preserving exam records. Passwords are never stored in the viewer table. Permanent deletion requires typing the username and removes Firebase Auth, `/practiceUsers/<uid>`, `/practiceSessions/<uid>`, and `/mockExamRecords/<uid>`.

`/api/viewer-accounts` verifies the manager's Firebase ID token, the seven-day sign-in limit, and current editor/admin permissions. It only accepts password-based viewer accounts with the internal username email domain. Google accounts and the current manager are protected. Database operations use the caller's Firebase credentials and rules. Partial deletion can be retried to finish record cleanup.

The Vercel production endpoint uses OIDC workload identity federation with the `viewer-manager@akkh-jlpt.iam.gserviceaccount.com` service account. The identity provider accepts only the existing JLPT project's production deployment. Its custom role grants only Firebase Auth user read, update, and delete permissions. No private service-account keys are created or stored. One-time setup is in `scripts/setup-viewer-management.mjs`; pass the installed Firebase CLI directory, using an authorized CLI login. Development and preview deployments do not receive this production privilege.
