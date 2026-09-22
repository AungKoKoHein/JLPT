import { normalizeContent } from "../src/cloudContent.js";

// Keep IDs and the owner's overlays intact so existing edits, ordering,
// section assignments and deletions continue to resolve exactly as before.
export function addN3Catalog(content, catalog) {
  const next = normalizeContent(content);
  for (const key of ["baselineChapters", "baselineKanjiChapters", "baselineExercises"]) {
    if (!Array.isArray(catalog[key]) || !catalog[key].length) {
      throw new Error(`Missing migration catalog field: ${key}`);
    }
    if (!next[key].length) next[key] = structuredClone(catalog[key]);
  }
  return normalizeContent(next);
}
