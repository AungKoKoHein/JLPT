// Only hide the automatic recovery destination; ordinary empty chapters remain editable.
export function hasVisibleChapterContent(chapter, cards, exercises, subchapters = []) {
  const tab = chapter.studyTab || "Vocab";
  if (chapter.id !== `ungrouped-${tab}`) return true;
  const sectionIds = new Set([
    ...(chapter.subchapters || []),
    ...subchapters.filter((section) => section.parentChapterId === chapter.id),
  ].map((section) => section.id));
  return [...cards, ...exercises].some((item) =>
    (item.studyTab || "Vocab") === tab && (
      item.chapterId === chapter.id || item.parentChapterId === chapter.id ||
      sectionIds.has(item.chapterId) || sectionIds.has(item.subchapterId)
    ),
  );
}
