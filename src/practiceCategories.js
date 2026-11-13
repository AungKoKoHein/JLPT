// Keep the PDF bank intact for source review; suppress repeated exercises in play.
export function practiceCategories(sets) {
  const seen = new Map();
  const collections = new Map();
  return sets.map((set) => {
    const playable = set.questions.filter(q => !q.sourcePages || q.individualItem || q.questionImage);
    const key = q => JSON.stringify([q.topic, q.prompt.replace(/^\s*[［\[]\d+[］\]]\s*/, '').replace(/\s+/g, ''), q.choices.map(c => c.replace(/\s+/g, ''))]);
    const textItems = playable.filter(q => q.individualItem || !q.sourcePages);
    const signature = JSON.stringify(textItems.map(key));
    const duplicateOf = textItems.length ? collections.get(signature) : null;
    if (textItems.length && !duplicateOf) collections.set(signature, set.title);
    const duplicateCategories = new Set();
    const questions = playable.filter(q => {
      if (duplicateOf) { duplicateCategories.add(duplicateOf); return false; }
      if (!q.individualItem && q.sourcePages) return true;
      const fingerprint = key(q);
      const original = seen.get(fingerprint);
      if (original) { duplicateCategories.add(original); return false; }
      seen.set(fingerprint, set.title);
      return true;
    });
    return { ...set, questions, reviewCount: set.questions.length - playable.length,
      duplicateCount: playable.length - questions.length, duplicateCategories: [...duplicateCategories] };
  });
}
