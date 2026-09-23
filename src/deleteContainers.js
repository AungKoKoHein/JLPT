function removeContents(content, container, sections, cards, exercises, isChapter) {
  const studyTab = container.studyTab || "Vocab";
  const sectionIds = new Set(sections.flatMap((section) => [section.id, section.sourceId].filter(Boolean)));
  const belongs = (item) => (item.studyTab || "Vocab") === studyTab && (
    sectionIds.has(item.chapterId) || sectionIds.has(item.subchapterId) ||
    (isChapter && (item.chapterId === container.id || item.parentChapterId === container.id))
  );
  const cardKey = studyTab === "Kanji" ? "deletedKanjiCards" : "deletedCards";
  return {
    ...content,
    [cardKey]: [...new Set([...content[cardKey], ...cards.filter(belongs).map((item) => item._id)])],
    deletedExercises: [...new Set([...content.deletedExercises, ...exercises.filter(belongs).map((item) => item._id)])],
    deletedSubchapters: [...new Set([...content.deletedSubchapters, ...sectionIds])],
    subchapters: content.subchapters.filter((item) => !sectionIds.has(item.id)),
    ...(isChapter ? { deletedChapters: [...new Set([...content.deletedChapters, container.id])] } : {}),
  };
}

export function removeSubchapter(content, section, cards, exercises, deleteContents = false) {
  if (deleteContents) return removeContents(content, section, [section], cards, exercises, false);
  const cardKey = section.studyTab === "Kanji" ? "kanjiOverrides" : "cardOverrides";
  const cardOverrides = { ...content[cardKey] };
  const exerciseOverrides = { ...content.exerciseOverrides };
  for (const card of cards.filter((item) => item.chapterId === section.id || item.subchapterId === section.id)) {
    cardOverrides[card._id] = { ...cardOverrides[card._id], chapterId: section.parentChapterId, parentChapterId: section.parentChapterId, subchapterId: "" };
  }
  for (const exercise of exercises.filter((item) => item.subchapterId === section.id)) {
    exerciseOverrides[exercise._id] = { ...exerciseOverrides[exercise._id], subchapterId: "" };
  }
  return { ...content, [cardKey]: cardOverrides, exerciseOverrides,
    deletedSubchapters: [...new Set([...content.deletedSubchapters, section.id, ...(section.sourceId ? [section.sourceId] : [])])],
    subchapters: content.subchapters.filter((item) => item.id !== section.id),
  };
}

export function removeChapter(content, chapter, cards, exercises, deleteContents = false) {
  if (deleteContents) return removeContents(content, chapter, chapter.subchapters || [], cards, exercises, true);
  const destination = `ungrouped-${chapter.studyTab}`;
  const sections = chapter.subchapters || [];
  const sectionIds = new Set(sections.map((section) => section.id));
  const cardKey = chapter.studyTab === "Kanji" ? "kanjiOverrides" : "cardOverrides";
  const cardOverrides = { ...content[cardKey] };
  const exerciseOverrides = { ...content.exerciseOverrides };
  for (const card of cards.filter((item) => item.chapterId === chapter.id || sectionIds.has(item.chapterId) || item.parentChapterId === chapter.id)) {
    const sectionId = sectionIds.has(card.subchapterId) ? card.subchapterId : sectionIds.has(card.chapterId) ? card.chapterId : "";
    cardOverrides[card._id] = { ...cardOverrides[card._id], chapterId: sectionId || destination, parentChapterId: destination, subchapterId: sectionId };
  }
  for (const exercise of exercises.filter((item) => item.chapterId === chapter.id && item.studyTab === chapter.studyTab)) {
    exerciseOverrides[exercise._id] = { ...exerciseOverrides[exercise._id], chapterId: destination, parentChapterId: destination, subchapterId: exercise.subchapterId || "" };
  }
  return { ...content, [cardKey]: cardOverrides, exerciseOverrides,
    deletedChapters: [...new Set([...(content.deletedChapters || []), chapter.id])],
    chapters: content.chapters.some((item) => item.id === destination) ? content.chapters : [...content.chapters, { id: destination, studyTab: chapter.studyTab, number: "", title: "Not grouped", groupTitle: "Not grouped", subchapters: [] }],
    subchapters: [...content.subchapters.filter((item) => !sectionIds.has(item.id)), ...sections.map((section) => ({ ...section, parentChapterId: destination, studyTab: chapter.studyTab }))],
  };
}
