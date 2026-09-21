import test from "node:test";
import assert from "node:assert/strict";
import { studyRoutes, studyTabFromPath } from "../src/studyRoutes.js";

test("every study tab resolves from its direct URL, including trailing slashes", () => {
  for (const [tab, path] of Object.entries(studyRoutes)) {
    assert.equal(studyTabFromPath(path), tab);
    assert.equal(studyTabFromPath(`${path}/`), tab);
  }
});

test("root and unrecognized paths fall back to vocabulary", () => {
  assert.equal(studyTabFromPath("/"), "Vocab");
  assert.equal(studyTabFromPath("/unknown"), "Vocab");
});
