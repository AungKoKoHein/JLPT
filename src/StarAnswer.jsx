import React, { useState } from 'react';
import { starLayout } from './questionPresentation.js';

export default function StarAnswer({ question, value = [null, null, null, null], onChange, disabled = false, display = text => text, checked = false }) {
  const layout = starLayout(question.prompt);
  const [active, setActive] = useState(layout.starIndex);
  const choose = option => {
    const next = [...value];
    const previous = next.indexOf(option);
    if (previous >= 0) next[previous] = next[active];
    next[active] = option;
    onChange(next, next[layout.starIndex]);
    const empty = next.findIndex(item => item == null);
    if (empty >= 0) setActive(empty);
  };
  return <fieldset className="star-answer" disabled={disabled}>
    <legend>{display('★ に入るもの')}</legend>
    <div className="star-answer-slots" role="group" aria-label="Sentence order">
      {value.map((option, index) => <button type="button" key={index} className={`star-answer-slot${index === layout.starIndex ? ' star-position' : ''}${active === index ? ' active' : ''}${checked && index === layout.starIndex ? (option === question.answer ? ' correct' : ' incorrect') : ''}`} aria-label={`Position ${index + 1}${index === layout.starIndex ? ', star' : ''}`} aria-pressed={active === index} onClick={() => setActive(index)}>
        <span>{index === layout.starIndex ? '★' : index + 1}</span><strong lang="ja">{option == null ? '＿＿＿' : display(question.choices[option])}</strong>
      </button>)}
    </div>
    <div className="star-answer-options">{question.choices.map((choice, index) => <button type="button" key={index} onClick={() => choose(index)} className={value.includes(index) ? 'placed' : ''} aria-label={`Option ${index + 1}: ${choice}`}><span>{index + 1}</span><span lang="ja">{display(choice)}</span></button>)}</div>
    <button type="button" className="star-answer-clear" onClick={() => { onChange([null, null, null, null], null); setActive(layout.starIndex); }}>Clear arrangement</button>
  </fieldset>;
}
