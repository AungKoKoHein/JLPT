import test from "node:test";
import assert from "node:assert/strict";
import { hideReadings } from "../src/studyText.js";

test("hide readings preserves Myanmar notes and grammar explanations", () => {
  assert.equal(hideReadings("学校（がっこう）へ行（い）く。"), "学校へ行く。");
  assert.equal(hideReadings("学校(がっこう)"), "学校");
  assert.equal(hideReadings("စာသင် (ကာလ) သစ်"), "စာသင် (ကာလ) သစ်");
  assert.equal(hideReadings("（例）学校（がっこう） (1)"), "（例）学校 (1)");
  assert.equal(hideReadings("動詞（辞書形）＋こと"), "動詞（辞書形）＋こと");
  assert.equal(hideReadings("何（ ）何（    ）"), "何（ ）何（    ）");
});
