import React, { useId } from 'react';
import { awsExercisesByChapter, exerciseText as t } from './awsExercises.js';

const labels = {
  title:t('လေ့ကျင့်ခန်းများ','Exercises','練習問題'),
  source:t('Handbook အပေါ်အခြေခံသော မေးခွန်းအသစ်များနှင့် သက်ဆိုင်ရာ Practice bank မေးခွန်းများမှ အတိုချုံးပြန်လည်ရေးသားထားသော လေ့ကျင့်ခန်းများ။ Practice မှလာသော မေးခွန်းတွင် မူရင်းနံပါတ် ဖော်ပြထားသည်။ တရားဝင် AWS စာမေးပွဲမေးခွန်းများ မဟုတ်ပါ။','Original handbook reviews and shortened, translated adaptations of related Practice-bank questions. Adapted questions show their original Practice number. These are not official AWS exam questions.','ハンドブックの新規復習問題と、関連するPractice問題を短縮・翻訳した問題です。改作には元のPractice問題番号を表示します。AWS公式試験問題ではありません。'),
  language:t('လေ့ကျင့်ခန်း ဘာသာစကား','Exercise language','練習問題の言語'),
  count:t('မေးခွန်း','questions','問'),
  show:t('အဖြေကြည့်မည်','Show answer','解答を表示'),
  hide:t('အဖြေဖျောက်မည်','Hide answer','解答を隠す'),
  all:t('အဖြေများအားလုံးကြည့်မည်','Show answer key','全解答を表示'),
  hideAll:t('အဖြေများအားလုံးဖျောက်မည်','Hide answer key','全解答を隠す'),
  correct:t('မှန်ပါသည်','Correct','正解'),
  incorrect:t('မမှန်သေးပါ','Incorrect','不正解'),
  answer:t('အဖြေမှန်','Correct answer','正しい解答'),
  explanation:t('ရှင်းလင်းချက်','Explanation','解説'),
  reset:t('ဤအခန်းကို ပြန်ဖြေမည်','Reset this chapter','この章をリセット'),
  choose:t('အဖြေတစ်ခုရွေးပြီး အဖြေကြည့်မည်ကို နှိပ်ပါ။','Choose an option, then select Show answer.','選択肢を選び「解答を表示」を押してください。'),
  score:t('စစ်ပြီးအဖြေများတွင် မှန်ကန်မှု','Correct among checked answers','確認済みの正解数'),
  reference:t('သက်ဆိုင်ရာ handbook စာမျက်နှာ','Related handbook pages','関連するハンドブックのページ'),
  adapted:t('Practice မှ ပြန်လည်ရေးသားထားသော မေးခွန်း','Adapted from Practice question','Practice問題を改作'),
  pdfPages:t('မူရင်း PDF စာမျက်နှာ','Source PDF pages','元PDFのページ'),
};

export default function AwsExercises({ chapter, language, onLanguageChange, progress, onProgressChange }) {
  const prefix = useId();
  const items = awsExercisesByChapter[chapter.id] || [];
  const text = key => labels[key][language];
  const checked = items.filter(item => progress[item.id]?.checked);
  const correct = checked.filter(item => progress[item.id]?.choice === item.answer).length;
  const allShown = items.every(item => progress[item.id]?.revealed);
  const update = (id, values) => onProgressChange(current => ({...current,[id]:{...current[id],...values}}));
  function revealAll() {
    onProgressChange(current => {
      const next = {...current};
      for (const item of items) next[item.id] = {...next[item.id],revealed:!allShown,
        checked:!allShown && next[item.id]?.choice!==undefined ? true : Boolean(next[item.id]?.checked)};
      return next;
    });
  }
  function reset() {
    onProgressChange(current => {
      const next = {...current};
      for (const item of items) delete next[item.id];
      return next;
    });
  }
  return <section className="aws-exercises exercises" lang={language} aria-label={text('title')}>
    <div className="aws-exercise-toolbar">
      <h3>{text('title')} · {items.length} {text('count')}</h3>
      <label className="aws-exercise-language">{text('language')}
        <select value={language} onChange={event => onLanguageChange(event.target.value)}>
          <option value="my" lang="my">မြန်မာ</option>
          <option value="en" lang="en">English</option>
          <option value="ja" lang="ja">日本語</option>
        </select>
      </label>
    </div>
    <p className="aws-exercise-source">{text('source')}</p>
    <p className="aws-exercise-reference">{text('reference')}: {chapter.pages.join('–')}</p>
    <div className="aws-exercise-actions">
      <button type="button" aria-pressed={allShown} onClick={revealAll}>{text(allShown?'hideAll':'all')}</button>
      <button type="button" onClick={reset}>{text('reset')}</button>
      <p className="aws-exercise-score" role="status">{text('score')}: {correct} / {checked.length}</p>
    </div>
    <p>{text('choose')}</p>
    <ol className="aws-exercise-list">
      {items.map((item, index) => {
        const state = progress[item.id] || {};
        const feedbackId = `${prefix}-${item.id}-feedback`;
        return <li key={item.id} data-aws-exercise={item.id}>
          {item.practiceQuestionNumber && <p className="aws-exercise-reference" data-practice-source={item.practiceQuestionNumber}>{text('adapted')} #{item.practiceQuestionNumber} · {text('pdfPages')}: {item.practiceSourcePages.join(', ')}</p>}
          <fieldset>
            <legend><span>{index+1}. </span>{item.question[language]}</legend>
            <div className="aws-exercise-options">{item.options.map((option, optionIndex) => <label key={optionIndex} data-selected={state.choice===optionIndex}>
              <input type="radio" name={`${prefix}-${item.id}`} value={optionIndex} checked={state.choice===optionIndex}
                onChange={() => update(item.id,{choice:optionIndex,checked:false, revealed:false})} />
              <span><strong>{String.fromCharCode(65+optionIndex)}.</strong> {option[language]}</span>
            </label>)}</div>
          </fieldset>
          <div className="aws-exercise-actions">
            <button type="button" aria-expanded={Boolean(state.revealed)} aria-controls={feedbackId} onClick={() => update(item.id,{revealed:!state.revealed,
              checked:!state.revealed && state.choice!==undefined ? true : Boolean(state.checked)})}>{text(state.revealed?'hide':'show')}</button>
          </div>
          <div id={feedbackId} hidden={!state.revealed} className="aws-exercise-feedback" data-correct={state.checked ? state.choice===item.answer : undefined}>
            {state.checked && <p role="status"><strong>{text(state.choice===item.answer?'correct':'incorrect')}</strong></p>}
            <p><strong>{text('answer')}: {String.fromCharCode(65+item.answer)}.</strong> {item.options[item.answer][language]}</p>
            <p><strong>{text('explanation')}:</strong> {item.explanation[language]}</p>
          </div>
        </li>;
      })}
    </ol>
  </section>;
}
