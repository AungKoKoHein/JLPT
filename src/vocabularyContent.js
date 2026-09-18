const cardGroup = (card) => JSON.stringify([card.studyTab || "Vocab", card.chapterId]);

// Reuse manually created sections (including the owner's Chapter 1) by number.
// sourceId keeps the book assignment stable when a saved section has its own ID.
export function resolveVocabularySubchapters(chapters, content, studyTab = "Vocab") {
  const custom = (content.subchapters ?? []).filter((section) => (section.studyTab ?? "Vocab") === studyTab);
  const used = new Set();
  const deleted = new Set(content.deletedSubchapters ?? []);
  const sections = chapters.flatMap((chapter) => (chapter.subchapters ?? []).map((section) => {
    const saved = custom.find((item) => item.id === section.id || item.sourceId === section.id) ?? custom.find((item) =>
      !used.has(item.id) && item.parentChapterId === chapter.id && String(item.number) === String(section.number),
    );
    if (saved) used.add(saved.id);
    return {
      ...section,
      ...saved,
      ...content.chapterOverrides?.[saved?.id ?? section.id],
      sourceId: section.id,
    };
  }));
  return [...sections, ...custom.filter((section) => !used.has(section.id))]
    .filter((section) => !deleted.has(section.id) && !deleted.has(section.sourceId));
}

export function resolveVocabularyCards(chapters, content) {
  const sections = new Map(resolveVocabularySubchapters(chapters, content).map((section) => [section.sourceId, section]));
  const cards = [
    ...chapters.flatMap((chapter) => chapter.cards.map((card, index) => {
      const section = sections.get(card.sourceSubchapterId);
      return {
        ...card,
        _id: `${chapter.id}:card:${index}`,
        chapterId: section?.id ?? chapter.id,
        ...(section ? { subchapterId: section.id, parentChapterId: section.parentChapterId } : {}),
        studyTab: "Vocab",
      };
    })),
    ...content.cards,
  ]
    .map((card) => ({ ...card, ...content.cardOverrides[card._id], _id: card._id }))
    .filter((card) => !content.deletedCards.includes(card._id));
  const groups = new Map();
  for (const card of cards) {
    const key = cardGroup(card);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(card);
  }
  return [...groups.entries()].flatMap(([key, group]) => {
    const positions = new Map((content.cardOrders?.[key] ?? []).map((id, index) => [id, index]));
    return group.sort((a, b) => (positions.get(a._id) ?? Infinity) - (positions.get(b._id) ?? Infinity));
  });
}

export function moveVocabularyCard(chapters, content, cardId, direction) {
  if (direction !== -1 && direction !== 1) return content;
  const cards = resolveVocabularyCards(chapters, content);
  const card = cards.find((item) => item._id === cardId);
  if (!card) return content;
  const key = cardGroup(card);
  const ids = cards.filter((item) => cardGroup(item) === key).map((item) => item._id);
  const index = ids.indexOf(cardId);
  const destination = index + direction;
  if (destination < 0 || destination >= ids.length) return content;
  [ids[index], ids[destination]] = [ids[destination], ids[index]];
  return { ...content, cardOrders: { ...content.cardOrders, [key]: ids } };
}
