export const vocabularyGroups = [
      {
        id: "topics",
        label: "実力養成編 (じつりょくようせいへん) : 第1部 : 話題別に言葉を学ぼう (わだいべつにことばをまなぼう)",
        range: "chapter 1 - 21",
      },
      {
        id: "strengthening",
        label: "実力養成編 (じつりょくようせいへん) : 第2部 : (だいにぶ) 性質別に言葉を学ぼう (せいしつべつにことばをまなぼう)",
        range: "chapter 1 - 8",
      },
    ];

export function chapterGroup(chapter) {
  if (chapter.groupTitle?.trim()) return { label: chapter.groupTitle.trim(), range: chapter.groupRange?.trim() || "" };
  if ((chapter.studyTab || "Vocab") === "Vocab") {
    return vocabularyGroups[String(chapter.number).includes(".") ? 1 : 0];
  }
  return { label: `${chapter.studyTab} chapters`, range: "" };
}

export function groupChapters(chapters, savedGroups = []) {
  const groups = new Map();
  for (const group of savedGroups) {
    const label = group.title.trim();
    if (label && !groups.has(label)) groups.set(label, { id: label, label, chapters: [] });
  }
  for (const chapter of chapters) {
    const { label } = chapterGroup(chapter);
    if (!groups.has(label)) groups.set(label, { id: label, label, chapters: [] });
    groups.get(label).chapters.push(chapter);
  }
  return sortChapters([...groups.values()].filter((group) => !["Not grouped", "Ungrouped chapters"].includes(group.label) || group.chapters.length > 0).map((group) => ({ ...group, title: group.label }))).map((group) => ({
    ...group,
    chapters: sortChapters(group.chapters),
    range: `${group.chapters.length} ${group.chapters.length === 1 ? "chapter" : "chapters"}`,
  }));
}

export function sortChapters(chapters) {
  const numbers = (chapter) => String(chapter.number || chapter.title || "").normalize("NFKC").match(/\d+/g)?.map(Number);
  return [...chapters].sort((a, b) => {
    const left = numbers(a), right = numbers(b);
    if (!left || !right) return left ? -1 : right ? 1 : 0;
    for (let i = 0; i < Math.max(left.length, right.length); i++) {
      const diff = (left[i] || 0) - (right[i] || 0);
      if (diff) return diff;
    }
    return 0;
  });
}

export function renameChapterGroup(content, chapters, studyTab, oldTitle, newTitle) {
  const title = newTitle.trim();
  if (!title || title === oldTitle) return content;
  const ids = new Set(chapters.filter((chapter) => chapter.studyTab === studyTab && chapterGroup(chapter).label === oldTitle).map((chapter) => chapter.id));
  const overrides = { ...content.chapterOverrides };
  for (const id of ids) overrides[id] = { ...overrides[id], groupTitle: title };
  const groups = (content.groups || []).filter((group) => !(group.studyTab === studyTab && group.title === oldTitle));
  if (!groups.some((group) => group.studyTab === studyTab && group.title === title)) groups.push({ id: `group-${Date.now()}`, studyTab, title });
  return { ...content, groups, chapterOverrides: overrides, chapters: content.chapters.map((chapter) => ids.has(chapter.id) ? { ...chapter, groupTitle: title } : chapter) };
}
