import readings from './vocabularyFurigana.json' with { type:'json' };
import { annotateKanjiFurigana } from './kanjiFurigana.js';
import { displayKanji, hideReadings } from './studyText.js';

// Contextual sentence readings cover the N3 catalog and current owner edits.
// Keep saved content untouched; explicit author readings take priority.
export function vocabularyText(value = '', showReadings = false, showKanji = true) {
  const text=String(value??'');
  if(showKanji && !showReadings) return hideReadings(text);
  const annotated=readings[text] ?? annotateKanjiFurigana(text);
  return displayKanji(annotated,showKanji);
}
