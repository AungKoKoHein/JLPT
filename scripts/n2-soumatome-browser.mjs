import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';

const profile = fs.mkdtempSync(path.resolve('node_modules/.cache/n2-kanji-chrome-'));
const server = await createServer({ configFile: false, logLevel: 'error', plugins: [react(), {
  name: 'n2-kanji-check', configureServer(server) {
    server.middlewares.use('/__n2-kanji-check', async (_req, res) => {
      res.setHeader('Content-Type', 'text/html');
      res.end(await server.transformIndexHtml('/__n2-kanji-check', `<html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module">
import React from 'react';import{createRoot}from'react-dom/client';import Kanji,{getKanjiChapterOptions}from'/src/Kanji.jsx';import{normalizeContent}from'/src/cloudContent.js';import{resolveExercises}from'/src/exerciseContent.js';import catalog from'/migrations/n2-soumatome-catalog.json';import{n2KanjiLessonExercises}from'/src/n2KanjiLessons.js';import'/src/app.css';import'/src/design.css';import'/src/dashboard.css';document.documentElement.dataset.theme='light';
const content=normalizeContent(catalog);const sections=getKanjiChapterOptions(content.baselineKanjiChapters).flatMap(c=>c.subchapters);const exercises=resolveExercises([...n2KanjiLessonExercises(content.baselineKanjiChapters),...content.baselineExercises],content,sections);
function Check(){const[mode,setMode]=React.useState('book');const[showReadings,setReadings]=React.useState(true);const h=React.createElement;return h('main',{className:'study-dashboard','data-show-sidebar':true},h('h1',null,'N2 Kanji'),h('button',{onClick:()=>setMode('flashcards')},'Flashcards'),h('button',{onClick:()=>setMode('book')},'Book view'),h('button',{onClick:()=>setReadings(x=>!x)},'Toggle readings'),h('section',{hidden:true},sections.map(section=>h('h3',{key:section.id,id:'subchapter-title-'+section.id,tabIndex:-1},'Hidden inactive panel heading'))),h(Kanji,{isActive:true,mode,allExercises:exercises,showReadings,showKanji:true,showKanjiReadings:true,showMyanmar:true,manageMode:false,canEdit:false,isEditor:false,content}));}
createRoot(document.getElementById('root')).render(React.createElement(Check));</script></body></html>`));
    });
  },
}], server: { host: '127.0.0.1', port: 0 } });
await server.listen();
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
let socket;
try {
  const endpoint = await new Promise((resolve, reject) => { const timer = setTimeout(() => reject(Error('Chrome startup timeout')), 20000); chrome.on('error', reject); chrome.stderr.on('data', data => { const match = String(data).match(/DevTools listening on (ws:\/\/[^\s]+)/); if (match) { clearTimeout(timer); resolve(match[1]); } }); });
  socket = new WebSocket(endpoint);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let id = 0; const pending = new Map();
  socket.onmessage = ({ data }) => { const msg = JSON.parse(data); if (msg.id) { const task = pending.get(msg.id); pending.delete(msg.id); msg.error ? task.reject(msg.error) : task.resolve(msg.result); } };
  const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => { pending.set(++id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) })); });
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  const cdp = (method, params) => send(method, params, sessionId);
  const evaluate = async expression => { const result = await cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (result.exceptionDetails) throw Error(JSON.stringify(result.exceptionDetails)); return result.result.value; };
  const until = async expression => { for (let i = 0; i < 150; i++) { if (await evaluate(expression)) return; await new Promise(resolve => setTimeout(resolve, 100)); } throw Error(`Timed out: ${expression}`); };
  const click = text => evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===${JSON.stringify(text)}).click()`);
  await cdp('Page.enable');
  await cdp('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await cdp('Page.navigate', { url: `http://127.0.0.1:${server.config.server.port}/__n2-kanji-check` });
  await until(`document.querySelectorAll('.kanji-study-card').length===86`);
  assert.equal(await evaluate(`document.querySelectorAll('.n2-lesson-examples li').length`),14,'Two translated example sentences for each daily/column lesson');
  assert.equal(await evaluate(`document.querySelectorAll('.chapter-group-cards button').length`),8);
  assert.equal(await evaluate(`document.querySelectorAll('.kanji-lesson-group').length`),7);
  await cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await evaluate(`document.querySelector('.kanji-study').scrollIntoView()`);
  await until(`!document.querySelector('.subchapter-nav').hidden`);
  for (const number of [1,2,3,4,5,6,7,1]) {
    await evaluate(`document.querySelectorAll('.subchapter-nav button')[${number - 1}].click()`);
    assert.equal(await evaluate(`document.activeElement===document.querySelectorAll('.kanji-study .kanji-lesson-group h3')[${number - 1}]`), true, `Jump ${number} focuses the visible heading despite hidden duplicate IDs`);
    assert.ok(await evaluate(`Math.abs(document.activeElement.getBoundingClientRect().top)<150`),`Jump ${number} scrolls to its visible section`);
  }
  assert.ok(await evaluate(`/[\u1000-\u109f]/.test(document.querySelector('.kanji-study-heading').textContent)`));
  assert.ok(await evaluate(`document.querySelector('.kanji-examples').textContent.includes(String.fromCodePoint(0xff08))`));
  await click('Toggle readings');
  assert.equal(await evaluate(`document.querySelector('.kanji-examples').textContent.includes(String.fromCodePoint(0xff08))`),false);
  await click('Toggle readings');
  assert.equal(await evaluate(`document.querySelector('.kanji-book-source')`),null);
  assert.equal(await evaluate(`document.body.textContent.includes('Original textbook pages')`),false);
  await click('Flashcards');
  await until(`document.querySelectorAll('.flashcard.kanji-card').length===86`);
  await evaluate(`document.querySelector('.flashcard.kanji-card').click()`);
  assert.equal(await evaluate(`document.querySelector('.flashcard.kanji-card').getAttribute('aria-pressed')`),'true');
  await click('Book view');
  await evaluate(`document.querySelectorAll('.chapter-group-cards button')[2].click()`);
  await until(`document.querySelectorAll('.kanji-study-card').length===89`);
  assert.ok(await evaluate(`[...document.querySelectorAll('.kanji-study-heading strong')].some(x=>x.textContent===String.fromCodePoint(0x5fc5))`));
  await click('Exercises');
  await until(`document.querySelectorAll('[data-exercise-id]').length===102`);
  await click('Answer Key: OFF');
  assert.equal(await evaluate(`document.querySelectorAll('.exercise-answer').length`),102);
  await evaluate(`document.querySelectorAll('.chapter-group-cards button')[7].click()`);
  await click('Words');
  await until(`document.querySelectorAll('.kanji-study-card').length===88`);
  assert.ok(await evaluate(`[...document.querySelectorAll('.kanji-study-heading strong')].some(x=>x.textContent===String.fromCodePoint(0x4e26))`));
  for (const width of [1440,768,393,360]) {
    await cdp('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<600});
    assert.ok(await evaluate(`document.documentElement.scrollWidth<=innerWidth`),`No overflow at ${width}px`);
    await evaluate(`document.querySelector('.n2-lesson-examples').scrollIntoView({block:'start'})`);
    const exampleScreenshot = await cdp('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.resolve(`.tmp-python/n2-lesson-examples-${width}.png`),Buffer.from(exampleScreenshot.data,'base64'));
    await evaluate(`document.querySelector('.n2-lesson-examples button').click()`);
    await until(`document.querySelectorAll('[data-exercise-id^="n2-soumatome-text-"]').length===2`);
    assert.deepEqual(await evaluate(`[...document.querySelectorAll('[data-exercise-id^="n2-soumatome-text-"]')].map(item=>item.dataset.exerciseId)`),['n2-soumatome-text-125-1','n2-soumatome-text-125-2']);
    assert.equal(await evaluate(`document.querySelectorAll('.exercises img,.n2-original-exercises,.n2-exercise-scans').length`),0,'No PDF scans are displayed');
    assert.equal(await evaluate(`document.querySelectorAll('.exercise-answer').length`),0,'Answers use the same hidden-by-default toggle as N3');
    assert.equal(await evaluate(`document.querySelectorAll('.exercise-answer-eye').length`),16,'Each exercise has an independent eye toggle');
    assert.equal(await evaluate(`document.querySelectorAll('.exercise-translation').length`),0,'Repeated instructions are removed from individual sentences');
    assert.ok(await evaluate(`(() => { const instructions = [...document.querySelectorAll('.exercise-type-heading')].map(p=>p.textContent); return instructions.length > 0 && new Set(instructions).size===instructions.length; })()`),'Each exercise type has one instruction heading');
    await evaluate(`document.querySelectorAll('.exercise-answer-eye')[0].click()`);
    assert.equal(await evaluate(`document.querySelectorAll('.exercise-answer').length`),1,'Eye reveals only its own answer');
    await evaluate(`document.querySelectorAll('.exercise-answer-eye')[1].click();document.querySelectorAll('.exercise-answer-eye')[0].click()`);
    assert.equal(await evaluate(`document.querySelectorAll('.exercise-answer').length`),1,'Hiding one answer does not hide another');
    await click('Answer Key: OFF');
    assert.equal(await evaluate(`document.querySelectorAll('.exercise-answer').length`),16,'Existing drills and two textbook questions share the N3 answer toggle');
    await evaluate(`document.querySelectorAll('.exercise-answer-eye')[0].click()`);
    assert.equal(await evaluate(`document.querySelectorAll('.exercise-answer').length`),15,'Individual eye can hide one answer after showing all');
    await click('Answer Key: OFF');
    assert.equal(await evaluate(`document.querySelectorAll('.exercise-answer').length`),16,'Show all restores a locally hidden answer');
    assert.ok(await evaluate(`document.documentElement.scrollWidth<=innerWidth`),`Text exercises fit at ${width}px`);
    const exerciseScreenshot = await cdp('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.resolve(`.tmp-python/n2-lesson-exercises-${width}.png`),Buffer.from(exerciseScreenshot.data,'base64'));
    await click('Words');
    await until(`document.querySelectorAll('.n2-lesson-examples li').length===14`);
    const { data } = await cdp('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.resolve(`.tmp-python/n2-kanji-${width}.png`),Buffer.from(data,'base64'));
  }
  console.log('PASS: Numbered links 1-7 target visible headings, textbook dropdown hidden, native book/flashcards, Myanmar, readings, exercises, and responsive layouts.');
} finally { socket?.close(); chrome.kill(); await server.close(); }
