const cardGroup = (card) => JSON.stringify([card.studyTab || "Vocab", card.chapterId]);

export function resolveVocabularyCards(chapters, content) {
  const cards = [
    ...chapters.flatMap((chapter) => chapter.cards.map((card, index) => ({
      ...card,
      _id: `${chapter.id}:card:${index}`,
      chapterId: chapter.id,
      studyTab: "Vocab",
    }))),
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
