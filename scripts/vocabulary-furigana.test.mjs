import test from 'node:test';
import assert from 'node:assert/strict';
import readings from '../src/vocabularyFurigana.json' with {type:'json'};
import {vocabularyText} from '../src/vocabularyText.js';
import {hideReadings} from '../src/studyText.js';

test('all audited N3 vocabulary fields have furigana without changing the underlying text',()=> {
  assert.ok(Object.keys(readings).length>=3700);
  for(const [original,annotated] of Object.entries(readings)) {
    assert.equal(hideReadings(annotated),hideReadings(original),original);
    const uncovered=annotated.replace(/[\p{Script=Han}々〆ぁ-ゖァ-ヶー\s]+[（(][ぁ-ゖァ-ヶー\s]+(?:[/／][ぁ-ゖァ-ヶー\s]+)*[）)]/gu,'');
    assert.doesNotMatch(uncovered,/\p{Script=Han}/u,annotated);
    assert.equal(vocabularyText(original,false,true),hideReadings(original));
    assert.equal(vocabularyText(original,true,true),annotated);
  }
});

test('the reported airplane example has readings on every occurrence and on 故障 and 多い',()=> {
  const sentence='その飛行機（ひこうき）は、 最新（さいしん） の飛行機なのに、故障が多い。';
  assert.equal(vocabularyText(sentence,true),'その飛行機（ひこうき）は、 最新（さいしん） の飛行機（ひこうき）なのに、故障（こしょう）が多（おお）い。');
  assert.equal(vocabularyText(sentence,false),'その飛行機は、 最新 の飛行機なのに、故障が多い。');
  assert.equal(vocabularyText(sentence,false,false),'そのひこうきは、 さいしん のひこうきなのに、こしょうがおおい。');
});

test('authored readings survive and added cloud text can use the existing shared fallback',()=> {
  const authored='今日（きょう）は学校（がっこう）へ行（い）きます。';
  assert.equal(vocabularyText(authored,true),authored);
  assert.equal(vocabularyText(undefined,true),'');
  assert.equal(vocabularyText('私の友人',true),'私（わたし）の友人（ゆうじん）');
});
