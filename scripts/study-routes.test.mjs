import test from "node:test";
import assert from "node:assert/strict";
import { studyRoutes, studyTabFromPath, routesForLevel } from "../src/studyRoutes.js";

test("every study tab resolves from its direct URL, including trailing slashes", () => {
  for (const [tab, path] of Object.entries(studyRoutes)) {
    assert.equal(studyTabFromPath(path), tab);
    assert.equal(studyTabFromPath(`${path}/`), tab);
  }
});

test("N2 and N3 direct links select their own tab after a refresh", () => {
  for (const level of ['n2', 'n3']) {
    for (const [tab, path] of Object.entries(routesForLevel(level))) {
      assert.equal(studyTabFromPath(path), tab, path);
      assert.equal(studyTabFromPath(`${path}/`), tab, `${path}/`);
    }
  }
  assert.equal(studyTabFromPath('/n2/practice'), 'Vocab', 'Practice is available only for N3');
});

test("root and unrecognized paths fall back to vocabulary", () => {
  assert.equal(studyTabFromPath("/"), "Vocab");
  assert.equal(studyTabFromPath("/unknown"), "Vocab");
});
