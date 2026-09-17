# JLPT N3 Vocabulary - static site

This frontend uses Firebase Realtime Database for shared edits and Google sign-in for owner-only editing. Its baseline chapter data is bundled into `src/data/n3Vocabulary.js`; the site still runs on GitHub Pages without a custom server.

Follow [FIREBASE_SETUP.md](FIREBASE_SETUP.md) to enable Google sign-in, publish the database rules, and grant your account editing access. Everyone else can read the shared content.

## Run locally

The vocabulary Exercises tab uses 385 sentences and matching answer keys imported from the supplied Word documents. Vocabulary and Kanji exercise views support **Answer key: OFF / ON** and **Myanmar: OFF / ON**. Myanmar question text appears with the question; Myanmar answer text appears only while the answer key is on. The existing readings toggle still controls Japanese readings.

While signed in as the owner, turn **Manage: ON**, then **Edit** an exercise to add its optional **Myanmar sentence / question** and **Myanmar answer / explanation**. Built-in Kanji exercises can also be edited. Use **+ Exercise** to add one.

**Assign to subchapter** links the same exercise to that subchapter; it always remains in its main chapter's Exercises tab. Both views share the same question, answer, and translations. Unassigned exercises appear only in the main list. Select **Unassigned - main exercises only** to remove the link. **Delete everywhere** removes an exercise from both views; deleting a subchapter only removes its assignment and keeps the exercise in the main list.

For vocabulary, open a subchapter's exercise button. For Kanji, use **Exercises → Show exercises for** to choose the main list or an assigned subchapter. Existing exercises are not automatically assigned. Translations are entered by the owner, not generated automatically.

Extracted document text is stored in `source/exercise-sentences.txt` and `source/exercise-answers.txt`. `scripts/import-exercises.mjs` validates chapter/section counts and rebuilds `src/data/exercises.js` during development and production builds.

```bash
npm install
npm run dev
```

## GitHub Pages

1. Create a **private** GitHub repository and upload this folder.
2. Push it to the `main` branch.
3. In GitHub: **Settings -> Pages -> Build and deployment -> Source**, choose **GitHub Actions**.
4. After the workflow completes, open the URL shown in the Actions deployment.

The PDF-derived content is stored locally in the project. Before making the repository public, confirm that you have copyright permission to redistribute the source material.
