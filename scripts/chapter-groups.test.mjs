import test from "node:test";
import assert from "node:assert/strict";
import { groupChapters, sortChapters, renameChapterGroup } from "../src/chapterGroups.js";

test("existing vocabulary groups retain their chapter assignments", () => {
  const groups = groupChapters([{ number: "1" }, { number: "2" }, { number: "1.1" }]);
  assert.deepEqual(groups.map((group) => group.chapters.length), [2, 1]);
  assert.deepEqual(groups.map((group) => group.range), ["2 chapters", "1 chapter"]);
});

test("manual groups combine chapters and allow reassignment without changing titles", () => {
  const cards = [
    { number: "1", title: "First", studyTab: "Grammar", groupTitle: "Patterns", groupRange: "1 - 2" },
    { number: "2", title: "Second", studyTab: "Grammar", groupTitle: "Patterns", groupRange: "1 - 2" },
  ];
  assert.equal(groupChapters(cards).length, 1);
  assert.equal(groupChapters(cards)[0].chapters[1].title, "Second");
  assert.equal(groupChapters([cards[0], { ...cards[1], groupTitle: "Other" }]).length, 2);
});


test("saved empty groups remain available and old ranges do not split a group", () => {
  const groups = groupChapters([
    { groupTitle: "Patterns", groupRange: "old" },
    { groupTitle: "Patterns", groupRange: "different" },
  ], [{ title: "Patterns" }, { title: "Second group" }]);
  assert.equal(groups.length, 2);
  assert.equal(groups[0].range, "2 chapters");
  assert.equal(groups[1].range, "0 chapters");
});


test("numeric sorting handles multi-digit chapters and puts unnumbered titles last", () => {
  const chapters = [{ title: "Extra" }, { number: "10" }, { number: "2" }, { number: "1.10" }, { number: "1.2" }];
  assert.deepEqual(sortChapters(chapters).map((chapter) => chapter.number || chapter.title), ["1.2", "1.10", "2", "10", "Extra"]);
});

test("renaming a group updates bundled and custom chapters without losing overrides", () => {
  const content = { groups: [], chapters: [{ id: "custom", studyTab: "Grammar", groupTitle: "Old" }], chapterOverrides: { bundled: { title: "Keep" } } };
  const chapters = [{ id: "bundled", studyTab: "Grammar", groupTitle: "Old" }, ...content.chapters];
  const result = renameChapterGroup(content, chapters, "Grammar", "Old", "New");
  assert.equal(result.chapters[0].groupTitle, "New");
  assert.deepEqual(result.chapterOverrides.bundled, { title: "Keep", groupTitle: "New" });
  assert.equal(result.groups[0].title, "New");
});


test("empty ungrouped headings stay hidden while ordinary empty groups remain available", () => {
  const groups = [{ title: "Not grouped" }, { title: "Ungrouped chapters" }, { title: "New group" }];
  assert.deepEqual(groupChapters([], groups).map((group) => group.label), ["New group"]);
  assert.ok(groupChapters([{ groupTitle: "Not grouped", number: "1" }], groups).some((group) => group.label === "Not grouped"));
});
