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

test("AWS opens Part 1 and preserves direct links to each part and Practice", () => {
  assert.deepEqual(Object.keys(routesForLevel('aws')), ['Part 1','Part 2','Part 3','Part 4','Practice']);
  assert.equal(studyTabFromPath('/aws'), 'Part 1');
  for (const [tab, route] of Object.entries(routesForLevel('aws'))) {
    assert.equal(studyTabFromPath(route), tab);
    assert.equal(studyTabFromPath(`${route}/`), tab);
  }
  assert.equal(studyTabFromPath('/aws/practice'), 'Practice');
  assert.equal(studyTabFromPath('/aws/practice/'), 'Practice');
});
