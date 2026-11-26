import test from 'node:test';
import assert from 'node:assert/strict';
import { exerciseGuides, presentExercise, groupExercisesByType } from '../src/exercisePresentation.js';

test('shared reading and writing prompts become one guide without losing their targets', () => {
  const exercises = [
    { question: '「禁止」の読み方をひらがなで書いてください。', questionMyanmar: 'ဤစကားလုံး၏ ဖတ်ပုံကို ဟိရဂနဖြင့် ရေးပါ။' },
    { question: '「禁煙」の読み方をひらがなで書いてください。', questionMyanmar: 'ဤစကားလုံး၏ ဖတ်ပုံကို ဟိရဂနဖြင့် ရေးပါ။' },
  ];
  const before = structuredClone(exercises);
  const presented = exercises.map(presentExercise);
  assert.deepEqual(presented.map(item => item.question), ['|禁止|', '|禁煙|']);
  assert.deepEqual(exerciseGuides(presented).map(item => item.lang), ['ja', 'my']);
  assert.ok(presented.every(item => item.questionMyanmar === ''));
  assert.deepEqual(exercises, before, 'stored records must stay editable in their original form');
  assert.equal(presentExercise({ question: '次の漢字の読み方を書いてください：学校' }).question, '|学校|');
  assert.equal(presentExercise({ question: '次の読み方を漢字で書いてください：がっこう' }).question, '|がっこう|');
});

test('choice instructions occur once across sections while real translations remain beside questions', () => {
  const instruction = 'ကွင်းထဲမှ မှန်ကန်သော စကားလုံးကို ရွေးပါ။';
  const items = [
    { section: 'A', question: 'A', questionMyanmar: instruction },
    { section: 'B', question: 'B', questionMyanmar: instruction },
    { section: 'B', question: 'C', questionMyanmar: 'စာကြည့်တိုက်မှာ စာအုပ် ဖတ်ခဲ့တယ်။' },
    { section: 'Grammar', question: 'D', questionMyanmar: '「という」သဒ္ဒါပုံစံကို အသုံးပြုပြီး ဥပမာစာကြောင်းရေးပါ။' },
  ].map(presentExercise);
  assert.equal(exerciseGuides(items).filter(item => item.text === instruction).length, 1);
  assert.equal(items[2].questionMyanmar, 'စာကြည့်တိုက်မှာ စာအုပ် ဖတ်ခဲ့တယ်။');
  assert.ok(items[3].questionMyanmar.includes('という'), 'question-specific grammar targets are preserved');
});

test('existing sentence underlining, images, and answer data are preserved', () => {
  const item = { _id: 'original', question: '私は学生です。', questionParts: ['私は', '学生', 'です。'], imageSrc: 'diagram.png', answer: 'がくせい', answerMyanmar: 'ကျောင်းသား' };
  const result = presentExercise(item);
  for (const key of ['_id','question','questionParts','imageSrc','answer','answerMyanmar']) assert.deepEqual(result[key], item[key]);
});

test('grammar-writing instructions are shared while each pattern and meaning stay visible', () => {
  const presented = [
    { question: '「အကြောင်း」を表す文を、「について」を使って作ってください。', questionMyanmar: '「について」သဒ္ဒါပုံစံကို အသုံးပြုပြီး ဥပမာစာကြောင်းရေးပါ။' },
    { question: '「အဖြစ်」を表す文を、「として」を使って作ってください。', questionMyanmar: '「として」သဒ္ဒါပုံစံကို အသုံးပြုပြီး ဥပမာစာကြောင်းရေးပါ။' },
  ].map(presentExercise);
  assert.equal(exerciseGuides(presented).length, 2);
  assert.ok(presented[0].question.includes('について'));
  assert.ok(presented[0].question.includes('အကြောင်း'));
  assert.ok(presented.every(item => item.questionMyanmar === ''));
});

test('equivalent reading instructions form one titled group across sections and languages', () => {
  const inputs = [
    { _id:'choice', section:'Day 1', question:'（a. 火　b. 水）', questionMyanmar:'ကွင်းထဲမှ မှန်ကန်သော စကားလုံးကို ရွေးပါ။' },
    { _id:'reading-1', section:'Day 1', question:'|水|', questionMyanmar:'မျဉ်းတားထားသော စကားလုံး၏ ဖတ်ပုံကို ဟိရဂနဖြင့် ရေးပါ။' },
    { _id:'reading-2', section:'Day 2', question:'「火」の読み方をひらがなで書いてください。', questionMyanmar:'ဤစကားလုံး၏ ဖတ်ပုံကို ဟိရဂနဖြင့် ရေးပါ။' },
    { _id:'reading-3', section:'Read the kanji', question:'|木|', questionMyanmar:'' },
  ];
  const groups = groupExercisesByType(inputs);
  assert.deepEqual(groups.map(group=>group.key), ['choice','reading']);
  assert.equal(groups[1].lang,'my');
  assert.deepEqual(groups[1].items.map(item=>item._id), ['reading-1','reading-2','reading-3']);
  assert.equal(groups[1].sectionCount,3);
  assert.equal(groupExercisesByType(inputs,false)[1].lang,'ja');
  assert.equal(inputs[2].question,'「火」の読み方をひらがなで書いてください。');
});

test('writing, grammar, and unclassified exercises retain separate types and every record', () => {
  const inputs = [
    { _id:'write',section:'Write the kanji',question:'次の読み方を漢字で書いてください：みず',questionMyanmar:'အောက်ပါဖတ်ပုံကို ကန်ဂျီဖြင့် ရေးပါ။' },
    { _id:'grammar',section:'Grammar',question:'「အဖြစ်」を表す文を、「として」を使って作ってください。' },
    { _id:'other',section:'Original exercise',question:'自由な質問',questionMyanmar:'ဘာသာပြန်စာသား' },
  ];
  const groups = groupExercisesByType(inputs);
  assert.deepEqual(groups.slice(0,2).map(group=>group.key),['writing','grammar']);
  assert.equal(groups[2].title,'Original exercise');
  assert.equal(groups.flatMap(group=>group.items).length,3);
});
