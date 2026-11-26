import React from 'react';
import { displayKanji } from './studyText.js';
import './n2KanjiLessons.css';

export function N2LessonExamples({ lesson, showJapanese, showMyanmar, showReadings, showKanji, onExercises }) {
  if (!lesson) return null;
  return <section className="n2-lesson-examples" aria-label={`${lesson.title} example sentences`}>
    <div className="n2-lesson-content-heading"><div><h4 lang="my">ဝါကျနမူနာများ</h4><p lang="my">ယခုသင်ခန်းစာအတွက် ထပ်ဖြည့်ထားသော နမူနာဝါကျများ</p></div>
      <button type="button" className="secondary-button" onClick={onExercises} lang="my">သက်ဆိုင်ရာ လေ့ကျင့်ခန်းများ</button></div>
    <ol>{lesson.examples.map((example, index) => <li key={index}>
      {showJapanese && <p lang="ja">{displayKanji(showReadings || !showKanji ? example.annotated : example.japanese, showKanji)}</p>}
      {showMyanmar && <p lang="my">{example.myanmar}</p>}
    </li>)}</ol>
  </section>;
}
