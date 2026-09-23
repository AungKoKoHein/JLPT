Act as a senior frontend engineer. Build a complete, working Japanese JLPT study website for Myanmar-speaking learners. Implement the application, styling, data handling, owner editing, tests, and setup documentation. Do not stop at a plan or a visual mockup.

Use this specification as the source of truth. If an existing reference project is supplied, inspect it and preserve its intended behavior. Fix defects rather than reproducing them. Do not connect to or modify the reference project's live database. Use a new Firebase project supplied by me.

Project name: [YOUR PROJECT NAME]
Firebase project: [YOUR NEW FIREBASE PROJECT CONFIGURATION]
Authorized editor UID: [YOUR FIREBASE AUTH USER UID]
Study source files: [PROVIDED JAPANESE/MYANMAR DOCUMENTS OR JSON, IF ANY]
Hosting target: [VERCEL OR ANOTHER STATIC HOST]

1. Purpose and scope

Create a responsive study application supporting JLPT N3 and N2. Both levels must use the same components, features, controls, permissions, and behavior. Only their level labels, URLs, and study content differ. Keep chapters, subchapters, groups, cards, exercises, edits, deletions, assignments, and saved ordering isolated by level.

Each level has six study tabs: Vocab, Grammar, Kanji, Listening, Reading, and Mock exam. Listening, Reading, and Mock exam use the shared chapter, card/book, and exercise system. Their names do not imply an audio player, automatic grading, timed examination, or additional features unless separately requested.

Visitors can study without signing in. Only authorized owners can modify shared content. Saved changes become available to all visitors.

2. Technology and organization

Use React, Vite, JavaScript/JSX with TypeScript checking, and ordinary CSS. Use Firebase Authentication with Google sign-in and Firebase Realtime Database for shared content. Keep dependencies minimal and use compatible stable versions with a lockfile.

Separate application navigation, study components, editor forms, exercise rendering, search normalization, content resolution, ordering, deletion behavior, and cloud synchronization into maintainable modules. Use shared code for N2 and N3; never duplicate the entire application by level. Avoid unnecessary backend services, Firestore, SQL, AI generation, or payment features.

Provide npm scripts for development, production build, preview, tests, and type checking. Use environment variables for the new Firebase web configuration and provide an .env.example. Never include service-account credentials in the browser bundle.

3. Routes and navigation

Support these routes for both /n3 and /n2:

- /vocab
- /grammar
- /kanji
- /listening
- /reading
- /mock-exam

For example, /n2/kanji and /n3/kanji open the corresponding level's Kanji tab. The root defaults to N3 vocabulary. Legacy unprefixed topic URLs can resolve to N3 for compatibility. Level switching preserves the selected study tab. Set the browser title to the active JLPT level.

Direct links, refreshes, browser back/forward, and trailing slashes must work. Configure static entry pages or hosting rewrites accordingly. Switching tabs resets temporary searches and selections appropriately without altering saved study content.

4. Appearance and responsive layout

Use a light lavender background, an indigo-to-purple gradient header, white or softly tinted surfaces, rounded corners, subtle shadows, and clear selected states. Keep the content centered at approximately 1400px maximum width.

The header includes the project/level title, N3/N2 switching, and owner controls where permitted. Show study tabs prominently. Place chapter search and study-content search above a desktop layout with a chapter sidebar and a main study area. Support grouped chapter navigation, chapter counts, active chapter highlighting, subchapter jump navigation, and a collapsible sidebar where applicable.

Use responsive card grids and readable numbered book lists. On small screens, stack controls and content without horizontal overflow. Long Japanese and Myanmar content must remain accessible. Support standard, double-width, and wide layouts for ordinary and grammar cards, collapsing sensibly on mobile.

Use fonts that correctly display Japanese and Unicode Myanmar. Supply licensed font assets or appropriate fallbacks. Preserve Unicode source text. Add floating Study Controls and a Back to Top button that appears after scrolling.

5. Study controls

Provide Card mode and Book mode, Japanese visibility, Myanmar visibility, and reading-annotation visibility. Prevent both language toggles from being off simultaneously. Disable the reading toggle when Japanese is hidden. For non-Kanji book views, provide an example-sentence visibility toggle. For Kanji, provide a separate On/Kun readings toggle.

Persist Japanese, Myanmar, and book-example preferences locally. Use the same preference behavior for both levels. Default Vocab and Kanji to Book mode and Grammar to Card mode when entering those tabs. Reading annotations start hidden; Kanji On/Kun readings start visible.

Shuffle changes presentation order without overwriting saved card order. Keep shuffled order stable during unrelated rerenders. Clearing shuffle restores the normal order. Owner position controls persist deliberate reordering separately from shuffle.

6. Vocabulary and shared study cards

Ordinary flashcards flip on click or keyboard activation. The front shows the Japanese term and its Myanmar meaning according to visibility settings. The back shows the Japanese example and Myanmar translation/explanation. Reading annotations such as 漢字（かんじ） can be shown or hidden without modifying stored content.

Book mode displays a numbered list with the term, Myanmar meaning, and optional example/translation beneath it. Search results include chapter context when combining results from multiple chapters. Preserve card identities and all fields during moves and reordering.

7. Grammar

Grammar cards display the grammar pattern, Myanmar meaning, multiple paired Japanese/Myanmar examples, and a separate Myanmar grammar explanation together in a readable panel. They do not need the vocabulary flip interaction.

Grammar book mode presents the same content as a numbered reading list. The editor supports adding and removing example pairs, editing the explanation, and choosing standard, double-width, or wide card layouts.

8. Kanji — required final layout

Use one shared Kanji component for N2 and N3.

In Card mode, the FRONT contains:

- The large kanji character or expression.
- Its Myanmar meaning when enabled.
- Stroke count if supplied.
- On’yomi (音読み) and Kun’yomi (訓読み), controlled by the On/Kun visibility setting. Support multiple reading records and display a dash when a reading is unavailable.

Do not display “Click to show readings and examples” or similar instructional text on each card.

The BACK contains only the Japanese example sentences and their Myanmar translations, respecting visibility settings. Do not repeat the large kanji heading, On’yomi, or Kun’yomi on the back.

Example: for 起, the character and readings belong on the front. The back can show:

休日はいつもより遅く起きる。
အားလပ်ရက်တွင် အမြဲတမ်းထက် နောက်ကျမှ အိပ်ရာထသည်။

昨夜、小さなじしんが起こった。
မနေ့ညက ငလျင်အသေးလေးတစ်ခု လှုပ်ခတ်ခဲ့သည်။

Kanji Book mode remains a straightforward reading layout: kanji and Myanmar meaning at the top, On/Kun readings below, then a numbered list of Japanese examples and Myanmar translations. Do not apply the card-front/back rearrangement to book mode. If a reference is supplied, preserve its Kanji book layout.

The editor supports multiple Kanji example pairs. Preserve legacy single-example content when normalizing imported data. Show relevant attribution and license information if third-party reading data is supplied.

9. Search

Provide independent chapter and study-content search. Normalize Unicode width, kana variants, whitespace, and relevant punctuation so Japanese searches behave naturally.

Vocabulary search matches the written term and reading, including continuous readings across annotations. Do not return vocabulary matches solely because text appears in an example sentence or chapter metadata. Vocabulary search can search across chapters within the active level and tab, with chapter context in results.

Kanji search covers the character, On/Kun readings, meaning, and example content within the selected chapter. Chapter search filters chapter navigation. Give visible feedback for matches and no results, with a clear “No searched record found” state. Searching must never alter saved content or ordering.

10. Exercises

Provide a Words/Vocabulary and Exercises switch for supported chapter views. Group exercises by section and display numbered questions, optional illustrations with alt text, optional Myanmar translations, and Japanese/Myanmar answers.

The Answer Key toggle starts off and reveals answers when enabled. Preserve underlined question targets, including imported structured question parts and a documented |underlined text| notation.

Exercises can belong to a main chapter and be assigned to a subchapter. Main-chapter views include their exercises; subchapter views filter the same underlying records. Assignment must not duplicate records. Editing an exercise from either view updates that same exercise. Unassigning preserves it in the main chapter; deleting everywhere removes it from all views.

Show useful empty states and a way back from dedicated exercise views. Owners can add, edit, assign, reassign, unassign, and delete exercises.

11. Owner editing and content organization

Support Google sign-in and sign-out. Identify authorized editors using an editor UID allowlist stored in the database. Signing in alone must not grant write access.

Provide New, Manage, and appropriate edit/delete controls for groups, chapters, subchapters, flashcards, Kanji cards, and exercises. Visitors must not see active editing controls. Editors can select the study tab, chapter, and subchapter in forms. New content remains within the active level.

Chapters have optional numbers, Japanese titles, Myanmar translations, and group assignments. Sort chapter numbers naturally rather than lexicographically. Group ranges update from their chapters. Renaming a group preserves membership; empty manually created groups remain selectable.

Keep imported baseline records and owner-created records editable through the same interface. Use stable IDs, overlays/overrides, and deletion records where needed so later normalization does not restore deleted items or lose edits.

Owner Positions mode allows moving ordinary cards within their current section. Disable moves past the first or last position. Do not silently move cards across sections. Reordering persists after refresh without changing card text.

Deletion dialogs must describe the actual effect. Deleting a group removes grouping without deleting study content. Deleting a chapter preserves its surviving subchapters, cards, and exercises in a visible “Not grouped” destination. Deleting a subchapter preserves cards in the parent chapter and removes exercise assignments to that subchapter. Deleting an individual card or exercise hides/removes that record consistently. Preserve changes after cloud reloads.

12. Cloud persistence and permissions

Use Firebase Realtime Database as the source of truth. For reference compatibility, N3 content can live at /jlpt/content and N2 content at /jlpt/n2/content. Store editor authorization separately at /editors/{uid}.

Each level uses a versioned content record with schemaVersion, revision, payload, updatedBy, and updatedAt. A serialized JSON payload may be used to preserve empty arrays and stable IDs containing characters unsuitable for database child keys. Validate and normalize loaded content.

Include baseline chapters, baseline Kanji chapters, baseline exercises, custom records, groups, subchapters, overrides, deletion markers, assignments, and order maps. An empty database yields a valid empty content structure.

Use realtime subscriptions and transaction-based revision checks. A stale client must not overwrite newer changes. Show a clear conflict message instead. Report success only after the save is committed. Avoid duplicate submissions and warn before navigation while a save remains pending.

Maintain a separate local read cache per level. Cached study content may be viewed offline, but editing requires an authorized account, successfully loaded data, a live connection, and no save already in progress. Show loading, connecting, saving, pending, error, retry, and view-only states accurately.

Database rules must enforce public study reads, authorized editor writes, valid record structure, sequential revision updates, matching updatedBy identity, and a server timestamp. Clients cannot grant themselves editor status. Rules for N2 and N3 must be equivalent.

For a fresh project, do not add a level-specific legacy-import button. If migrating the reference project's old browser edits, treat its N3-only import as an optional migration tool and never import those records into N2.

13. Content and migration

Do not invent a full curriculum or copy N3 data into N2. Import only supplied content and preserve Japanese text, Myanmar translations, example order, question underlines, section structure, and required attribution. Start a level empty if no content is supplied; make first-chapter creation work.

Keep document extraction and initial imports separate from npm run dev and npm run build. Production study content comes from the database, not a silently reseeded bundled catalog. Migration fixtures may remain outside the runtime bundle for tests.

If migration is needed, make it explicit, repeatable, backed up, and revision-aware. Preserve owner edits, stable IDs, deletions, assignments, and ordering. Never overwrite existing destination content merely because an import script runs again.

14. Accessibility and quality

Use semantic controls, associated form labels, visible focus, keyboard-accessible navigation, and appropriate aria states. Flip cards expose only their visible face to assistive technology. Respect reduced-motion preferences. Use lang="ja" and lang="my" on relevant text. Ensure long content remains scrollable and does not become unreachable through vertical centering or clipping.

Validate required fields and show actionable save errors while preserving form input. Build a correctly typed shared input/textarea component; do not suppress type errors to make checks pass.

15. Verification and delivery

Run meaningful automated tests for routes, level isolation, search, content normalization, persistent ordering, exercise identity/assignment, deletion preservation, migration idempotence, and stale-save rejection. Run type checking and a production build.

Test both levels in desktop and mobile browser views. Check card flipping, book layouts, controls, searches, empty states, navigation, refreshes, and keyboard use. Specifically verify the latest Kanji layout in both levels and that book mode remains unchanged. Use isolated fixtures or an emulator for editing/save/delete tests; never modify real study data just to test.

Provide the finished source, configuration examples, database rules, tests, and README instructions covering local startup, Firebase setup, editor authorization, content import, and static hosting. Configure deep-link refresh support.

If Firebase credentials or source documents are missing, complete the independent application work and clearly identify the remaining setup. Do not claim live authentication, synchronization, or deployment was verified unless it actually was. Do not deploy or write to an existing production database without authorization.

Finish with a concise report of implemented features, checks performed, and any remaining limitations. The result must be a working application whose N2 and N3 behavior stays identical through shared code, with separate content for each level.
