export function vocabularyExercises(byChapter) {
  return Object.entries(byChapter).flatMap(([chapterId, items]) =>
    items.map((item, index) => ({
      ...item,
      _id: `${chapterId}:exercise:${index}`,
      chapterId,
      studyTab: "Vocab",
    })),
  );
}

export function kanjiExercises(chapters) {
  return chapters.flatMap((chapter) =>
    (chapter.sections ?? [chapter]).flatMap((section, sectionIndex) =>
      ["reading", "writing"].flatMap((kind) =>
        (section[kind] ?? []).map(([before, target, after, answer], index) => ({
          _id: `${chapter.id}:exercise:${sectionIndex}:${kind}:${index}`,
          chapterId: chapter.id,
          studyTab: "Kanji",
          section: `${section.title ?? chapter.title} · ${kind === "reading" ? "Read the kanji" : "Write the kanji"}`,
          question: `${before}${target}${after}`,
          questionParts: [before, target, after],
          answer,
        })),
      ),
    ),
  );
}

// All views select from these same records. Assignment is a link, not a copy.
export function resolveExercises(base, content, subchapters = []) {
  const sections = new Map(subchapters.map((item) => [item.id, item]));
  const records = new Map(
    [...base, ...content.exercises].map((item) => [item._id, item]),
  );
  return [...records.values()]
    .filter((item) => !content.deletedExercises.includes(item._id))
    .map((item) => {
      const record = {
        ...item,
        ...content.exerciseOverrides[item._id],
        _id: item._id,
      };
      const legacySection = sections.get(record.chapterId);
      const chapterId =
        record.parentChapterId ||
        legacySection?.parentChapterId ||
        record.chapterId;
      const assignedId = record.subchapterId ?? legacySection?.id ?? "";
      const assigned = sections.get(assignedId);
      return {
        ...record,
        chapterId,
        parentChapterId: chapterId,
        studyTab: record.studyTab ?? "Vocab",
        subchapterId: assigned?.parentChapterId === chapterId ? assignedId : "",
        questionMyanmar: record.questionMyanmar ?? "",
        answerMyanmar: record.answerMyanmar ?? "",
      };
    });
}

export function exercisesForView(
  exercises,
  studyTab,
  chapterId,
  subchapterId = "",
) {
  return exercises.filter(
    (item) =>
      item.studyTab === studyTab &&
      item.chapterId === chapterId &&
      (!subchapterId || item.subchapterId === subchapterId),
  );
}

export function saveExercise(content, draft) {
  const id = draft.id || `user-exercise-${crypto.randomUUID()}`;
  const item = {
    id,
    _id: id,
    chapterId: draft.chapterId,
    parentChapterId: draft.chapterId,
    subchapterId: draft.subchapterId || "",
    studyTab: draft.studyTab,
    section: draft.section,
    question: draft.question,
    answer: draft.answer,
    questionMyanmar: draft.questionMyanmar ?? "",
    answerMyanmar: draft.answerMyanmar ?? "",
  };
  return draft.mode === "edit"
    ? {
        ...content,
        exerciseOverrides: { ...content.exerciseOverrides, [id]: item },
      }
    : { ...content, exercises: [...content.exercises, item] };
}

export function unassignExercises(content, subchapterId, resolved) {
  const overrides = { ...content.exerciseOverrides };
  for (const item of resolved.filter(
    (record) => record.subchapterId === subchapterId,
  )) {
    overrides[item._id] = {
      ...overrides[item._id],
      chapterId: item.chapterId,
      parentChapterId: item.chapterId,
      subchapterId: "",
    };
  }
  return { ...content, exerciseOverrides: overrides };
}
