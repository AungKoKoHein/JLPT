import test from "node:test";
import assert from "node:assert/strict";
import { hasVisibleChapterContent } from "../src/chapterVisibility.js";

for (const studyTab of ["Vocab", "Grammar", "Kanji", "Listening", "Reading", "Mock exam"]) {
  test(`${studyTab}: hides empty Not grouped destinations without hiding surviving content`, () => {
    const chapter = { id: `ungrouped-${studyTab}`, studyTab };
    const card = { chapterId: chapter.id, studyTab };
    assert.equal(hasVisibleChapterContent(chapter, [], []), false);
    assert.equal(hasVisibleChapterContent(chapter, [card], []), true);
    assert.equal(hasVisibleChapterContent(chapter, [], [card]), true);
    assert.equal(hasVisibleChapterContent(chapter, [{ ...card, studyTab: "Other" }], []), false);
    const section = { id: "section", parentChapterId: chapter.id };
    assert.equal(hasVisibleChapterContent(chapter, [], [], [section]), false);
    assert.equal(hasVisibleChapterContent(chapter, [{ chapterId: section.id, studyTab }], [], [section]), true);
    assert.equal(hasVisibleChapterContent({ ...chapter, subchapters: [section] }, [{ chapterId: section.id, studyTab }], []), true);
    assert.equal(hasVisibleChapterContent({ id: "ordinary", studyTab }, [], []), true);
  });
}
