export const CONTENT_PATH = "jlpt/content";
export const emptyContent = {
  baselineChapters: [],
  baselineKanjiChapters: [],
  baselineExercises: [],
  cards: [],
  exercises: [],
  subchapters: [],
  deletedSubchapters: [],
  deletedChapters: [],
  cardOverrides: {},
  exerciseOverrides: {},
  deletedCards: [],
  deletedExercises: [],
  chapterOverrides: {},
  chapters: [],
  groups: [],
  kanjiCards: [],
  kanjiOverrides: {},
  deletedKanjiCards: [],
  cardOrders: {},
};

const isObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

export function normalizeContent(value = {}) {
  if (!isObject(value)) throw new Error("Study content must be an object.");
  const content = structuredClone(emptyContent);
  for (const [key, fallback] of Object.entries(emptyContent)) {
    const field = value[key] ?? fallback;
    if (Array.isArray(fallback) ? !Array.isArray(field) : !isObject(field)) {
      throw new Error(`Invalid study content field: ${key}.`);
    }
    if (Array.isArray(field)) {
      if (
        !field.every(
          key.startsWith("deleted")
            ? (item) => typeof item === "string"
            : isObject,
        )
      ) {
        throw new Error(`Invalid records in ${key}.`);
      }
    } else if (
      !Object.values(field).every(
        key === "cardOrders"
          ? (item) =>
              Array.isArray(item) && item.every((id) => typeof id === "string")
          : isObject,
      )
    ) {
      throw new Error(`Invalid records in ${key}.`);
    }
    content[key] = field;
  }
  return content;
}

export function decodeSnapshot(value) {
  if (value === null)
    return { content: structuredClone(emptyContent), revision: 0 };
  if (
    !isObject(value) ||
    value.schemaVersion !== 1 ||
    !Number.isSafeInteger(value.revision) ||
    value.revision < 1 ||
    typeof value.payload !== "string"
  ) {
    throw new Error(
      "Cloud content has an unsupported format. No changes were saved.",
    );
  }
  return {
    content: normalizeContent(JSON.parse(value.payload)),
    revision: value.revision,
  };
}

// A JSON payload preserves empty arrays and existing IDs/order keys containing
// periods or brackets, which cannot be used as Realtime Database child keys.
export function createCloudUpdate(
  current,
  expectedRevision,
  nextContent,
  uid,
  timestamp,
) {
  if ((current?.revision ?? 0) !== expectedRevision) return undefined;
  return {
    schemaVersion: 1,
    revision: expectedRevision + 1,
    payload: JSON.stringify(normalizeContent(nextContent)),
    updatedBy: uid,
    updatedAt: timestamp,
  };
}
