# JLPT N3 Vocabulary - static site

This frontend has no API, database, login, or backend. Its chapter data is bundled into `src/data/n3Vocabulary.js`.

## Run locally

The Exercises tab uses 385 sentences and matching answer keys imported from the supplied Word documents. Use **Answer key: OFF / ON** to hide or show answers beneath each sentence. Answers reset to hidden when changing chapters.

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
