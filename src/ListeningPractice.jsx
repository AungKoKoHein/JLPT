import React, { useEffect, useRef, useState } from 'react';
import { listeningCollections } from './listeningCollections.js';
import './listening.css';

const asset = path => `${import.meta.env.BASE_URL}${path}`;
const clock = seconds => `${Math.floor(seconds/60)}:${String(Math.floor(seconds%60)).padStart(2,'0')}`;
const selectedSetKey = 'jlpt-n3-listening-selected-set';

function readProgress(collection) {
  const questions=collection.sections.flatMap(section=>section.questions);
  const storageKey=`jlpt-${collection.id}-v1`;
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
    return Object.fromEntries(questions.map(question=> {
      const value=saved?.[question.id];
      return [question.id,{choice:Number.isInteger(value?.choice) && value.choice>=0 && value.choice<question.options.length ? value.choice : null,
        note:typeof value?.note==='string' ? value.note : ''}];
    }));
  } catch { return {}; }
}

export default function ListeningPractice() {
  const [setId,setSetId]=useState(()=> {
    try { const saved=localStorage.getItem(selectedSetKey);return listeningCollections.some(set=>set.id===saved)?saved:listeningCollections[0].id; }
    catch { return listeningCollections[0].id; }
  });
  const collection=listeningCollections.find(set=>set.id===setId)||listeningCollections[0];
  function selectSet(id) {
    if(!listeningCollections.some(set=>set.id===id)) return;
    setSetId(id);
    try { localStorage.setItem(selectedSetKey,id); } catch { /* Selection still works for this session. */ }
  }
  return <ListeningSet key={collection.id} collection={collection} onSelectSet={selectSet} />;
}

function ListeningSet({collection,onSelectSet}) {
  const questions=collection.sections.flatMap(section=>section.questions);
  const storageKey=`jlpt-${collection.id}-v1`;
  const [selected,setSelected] = useState(questions[0].id);
  const [mode,setMode] = useState('question');
  const [speed,setSpeed] = useState(1);
  const [progress,setProgress] = useState(()=>readProgress(collection));
  const [audioError,setAudioError] = useState(false);
  const [storageError,setStorageError] = useState(false);
  const audio = useRef(null);
  const question = questions.find(item=>item.id===selected) || questions[0];
  const section = collection.sections.find(item=>item.number===question.section);
  const index = questions.indexOf(question);
  const state = progress[question.id] || {choice:null,note:''};
  const answered = questions.filter(item=>Number.isInteger(progress[item.id]?.choice)).length;
  const track = mode==='full' ? {audio:collection.audio,start:0,end:collection.duration} : mode==='intro' ? section.intro : question;
  const trackTitle = mode==='full' ? '全体の音声 · Full recording' : mode==='intro' ? `問題${section.number} · 説明・例` : `問題${section.number} · ${question.number}番`;
  useEffect(()=> {
    try { localStorage.setItem(storageKey,JSON.stringify(progress)); setStorageError(false); }
    catch { setStorageError(true); }
  },[progress]);
  useEffect(()=> {
    const player=audio.current;
    if(player) { player.pause(); player.playbackRate=speed; }
    setAudioError(false);
    return ()=>player?.pause();
  },[track.audio]);
  useEffect(()=> { if(audio.current) audio.current.playbackRate=speed; },[speed]);
  function select(id) { audio.current?.pause(); setSelected(id); setMode('question'); }
  function update(values) { setProgress(current=>({...current,[question.id]:{...current[question.id],...values}})); }
  function replay() { if(audio.current) { audio.current.currentTime=0; audio.current.play().catch(()=>setAudioError(true)); } }
  return <article className="listening-practice">
    <header className="listening-header">
      <div><p className="listening-eyebrow">JLPT N3 · 聴解</p><h2>Listening practice</h2><label className="listening-set-picker">Choose an exam<select value={collection.id} onChange={event=>onSelectSet(event.target.value)}>{listeningCollections.map(set=><option key={set.id} value={set.id}>{set.title}</option>)}</select></label></div>
      <div className="listening-summary"><span><strong>{questions.length}</strong> questions</span><span><strong>{collection.sections.length}</strong> sections</span><span><strong>{clock(collection.duration)}</strong> audio</span></div>
    </header>
    <nav className="listening-sections" aria-label="Listening sections">{collection.sections.map(item=><button type="button" key={item.number} aria-pressed={item.number===section.number} onClick={()=>select(item.questions[0].id)}><span>問題 {item.number}</span><strong lang="ja">{item.title}</strong><small>{item.questions.length} questions</small></button>)}</nav>
    <div className="listening-workspace">
      <div className="listening-question-nav" role="navigation" aria-label="Listening questions">
        <div className="listening-nav-heading"><h3 lang="ja">問題{section.number}</h3><span>{answered} / {questions.length} answered</span></div>
        <div className="listening-question-buttons">{section.questions.map(item=><button key={item.id} type="button" aria-current={mode==='question' && item.id===question.id ? 'step' : undefined} onClick={()=>select(item.id)}><span>{item.number}番</span>{Number.isInteger(progress[item.id]?.choice) && <span className="listening-saved-mark" aria-label="Answer selected">✓</span>}</button>)}</div>
        <p className="listening-directions" lang="ja">{section.directions}</p>
        <div className="listening-source-actions">{section.intro && <button type="button" aria-pressed={mode==='intro'} onClick={()=>setMode('intro')}>説明を聞く</button>}<button type="button" aria-pressed={mode==='full'} onClick={()=>setMode('full')}>Full recording</button><a href={asset(collection.pdf)} target="_blank" rel="noreferrer">Open listening PDF ↗</a></div>
      </div>
      <section className="listening-question-panel" aria-label={trackTitle}>
        <div className="listening-track-heading"><div><p className="listening-eyebrow">{mode==='question' ? 'QUESTION AUDIO' : 'SOURCE AUDIO'}</p><h3 lang="ja">{trackTitle}</h3></div><span>{clock(track.end-track.start)}</span></div>
        <div className="listening-player">
          <audio key={track.audio} ref={audio} src={asset(track.audio)} controls preload="metadata" aria-label={trackTitle} onLoadedMetadata={()=>{if(audio.current) audio.current.playbackRate=speed;}} onError={()=>setAudioError(true)} />
          <div className="listening-player-tools"><button type="button" onClick={replay}>↺ Replay</button><label>Speed <select value={speed} onChange={event=>setSpeed(Number(event.target.value))}>{[0.75,1,1.25,1.5].map(value=><option key={value} value={value}>{value}×</option>)}</select></label><span>Original {clock(track.start)}–{clock(track.end)}</span></div>
          {audioError && <p role="alert">Audio could not play. <button type="button" onClick={()=>{setAudioError(false);audio.current?.load();}}>Reload audio</button></p>}
        </div>
        {mode==='question' ? <>
          <div className="listening-question-meta"><span lang="ja">{section.title}</span><span>Source PDF p. {question.pdfPages?.join(', ')||question.pdfPage}</span></div>
          {question.image && <figure className="listening-figure"><a href={asset(question.image)} target="_blank" rel="noreferrer" aria-label="Open question image at full size"><img src={asset(question.image)} alt={question.imageAlt} /></a><figcaption>Original question image · click to enlarge</figcaption></figure>}
          {question.printedChoices && !question.options.some(Boolean) ? <p className="listening-audio-only" lang="ja">図を見て、番号を一つ選んでください。<span lang="en">Choose the matching numbered picture above.</span></p> : !question.options.some(Boolean) && <p className="listening-audio-only" lang="ja">選択肢は音声で流れます。聞いて、番号を一つ選んでください。<span lang="en">The choices are spoken in the recording.</span></p>}
          <fieldset className="listening-options"><legend lang="ja">答えを一つ選んでください</legend>{question.options.map((text,choice)=><label key={choice} data-selected={state.choice===choice}><input type="radio" name={question.id} checked={state.choice===choice} onChange={()=>update({choice})} /><span className="listening-option-number">{choice+1}</span>{text && <span lang="ja">{text}</span>}</label>)}</fieldset>
          <label className="listening-notes">メモ · Your notes<textarea value={state.note} onChange={event=>update({note:event.target.value})} placeholder="聞き取ったことを書いてみましょう。" rows={3} /></label>
          <div className="listening-review-footer"><p>{storageError ? 'Browser storage is unavailable. Answers are kept for this session.' : 'Answers and notes are saved in this browser.'}</p><button type="button" onClick={()=>update({choice:null,note:''})}>Clear this question</button></div>
          <p className="listening-key-note">The supplied PDF does not include an answer key. Your choices are saved for review.</p>
        </> : <div className="listening-introduction"><p lang="ja">{mode==='intro' ? section.directions : '全体の音声です。問題ごとに練習するには、左の番号を選んでください。'}</p><button type="button" onClick={()=>setMode('question')}>Back to {question.number}番</button></div>}
        <nav className="listening-pagination" aria-label="Listening question navigation"><button type="button" disabled={index===0} onClick={()=>select(questions[index-1].id)}>← Previous</button><span>{index+1} / {questions.length}</span><button type="button" disabled={index===questions.length-1} onClick={()=>select(questions[index+1].id)}>Next →</button></nav>
      </section>
    </div>
    <footer className="listening-credit">Your supplied files: {collection.sourceAudio} · {collection.sourcePdf}, pages {collection.pdfPages.join(', ')}. Original question pictures and printed choices preserved.</footer>
  </article>;
}
