import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';

// Exercise the real practice components independently of account sign-in.
const profile = fs.mkdtempSync(path.resolve('node_modules/.cache/practice-chrome-'));
const server = await createServer({ configFile: false, logLevel: 'error', plugins: [react(), {
  name: 'practice-check-page',
  configureServer(server) {
    server.middlewares.use('/__practice-check', async (_req, res) => {
      res.setHeader('Content-Type', 'text/html');
      res.end(await server.transformIndexHtml('/__practice-check', `<html><body><div id="root"></div><script type="module">import React from 'react';import{createRoot}from'react-dom/client';import PracticeSession from '/src/PracticeSession.jsx';import ReadingPractice from '/src/ReadingPractice.jsx';import bank from '/src/n3PracticeBank.json';import '/src/app.css';function Check(){const[on,setOn]=React.useState(false);window.toggleReadings=()=>setOn(v=>!v);return React.createElement(React.Fragment,null,React.createElement(ReadingPractice,{showReadings:on}),React.createElement(PracticeSession,{questions:bank[0].questions,title:'Practice',showReadings:on}));}createRoot(document.getElementById('root')).render(React.createElement(Check));</script></body></html>`));
    });
  },
}], server: { host: '127.0.0.1', port: 0 } });
await server.listen();
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
let socket;
try {
  const endpoint = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(Error('Chrome startup timeout')), 20000);
    chrome.on('error', reject);
    chrome.stderr.on('data', (data) => { const match = String(data).match(/DevTools listening on (ws:\/\/[^\s]+)/); if (match) { clearTimeout(timeout); resolve(match[1]); } });
  });
  socket = new WebSocket(endpoint);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let id = 0;
  const pending = new Map();
  socket.onmessage = ({ data }) => { const msg = JSON.parse(data); if (msg.id) { const handler = pending.get(msg.id); pending.delete(msg.id); msg.error ? handler.reject(msg.error) : handler.resolve(msg.result); } };
  const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => { pending.set(++id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) })); });
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  const cdp = (method, params) => send(method, params, sessionId);
  const evaluate = async (expression) => { const result = await cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (result.exceptionDetails) throw Error(JSON.stringify(result.exceptionDetails)); return result.result.value; };
  const until = async (expression) => { for (let i = 0; i < 100; i++) { if (await evaluate(expression)) return; await new Promise(resolve => setTimeout(resolve, 100)); } throw Error(`Timed out: ${expression}`); };
  const click = (text) => evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===${JSON.stringify(text)}).click()`);
  await cdp('Page.enable');
  await cdp('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await cdp('Page.navigate', { url: `http://127.0.0.1:${server.config.server.port}/__practice-check` });
  await until(`document.querySelectorAll('.reading-practice').length === 2`);
  await until(`document.querySelector('.reading-passage-text') !== null`);
  assert.equal(await evaluate(`document.querySelectorAll('.reading-collection h2').length`), 1, 'Reading has a single shared title');
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('.reading-collection-header')).backgroundImage`), 'none', 'Reading header uses the shared paper surface');
  assert.ok(await evaluate(`document.querySelector('.reading-collection').contains(document.querySelector('.reading-practice'))`), 'Header and practice share one panel');
  assert.ok(await evaluate(`document.querySelector('.reading-passage-text').textContent.includes('市役所')`), 'PDF passage uses readable text');
  assert.equal(await evaluate(`document.querySelector('.reading-passage-text img')`), null, 'Default passage does not require a PDF image');
  const pdfOriginal = await evaluate(`document.querySelector('.reading-passage-text').textContent`);
  await evaluate(`window.toggleReadings()`);
  await until(`document.querySelector('.reading-passage-text').textContent.includes('差出人（さしだしにん）')`);
  const annotatedPdf = await evaluate(`document.querySelector('.reading-passage-text').textContent`);
  assert.doesNotMatch(annotatedPdf.replace(/[\p{Script=Han}々〆\p{Script=Hiragana}\p{Script=Katakana}ー]+[（(][\p{Script=Hiragana}\p{Script=Katakana}ー]+[）)]/gu, ''), /\p{Script=Han}/u, 'Every PDF passage kanji has furigana');
  assert.match(annotatedPdf, /講演（こうえん）/u);
  assert.match(annotatedPdf, /ご都合（つごう）/u);
  await evaluate(`window.toggleReadings()`);
  await until(`!document.querySelector('.reading-passage-text').textContent.includes('差出人（')`);
  assert.equal(await evaluate(`document.querySelector('.reading-passage-text').textContent`), pdfOriginal);
  await evaluate(`document.querySelectorAll('.reading-practice')[0].querySelectorAll('.reading-all-questions button')[10].click()`);
  await evaluate(`[...document.querySelectorAll('.reading-practice')[0].querySelectorAll('button')].find(b=>b.textContent.includes('Previous')).click()`);
  assert.match(await evaluate(`document.querySelector('.reading-question-topline').textContent`), /Question 10 of 16/);
  assert.match(await evaluate(`document.querySelector('.reading-question-topline').textContent`), /3 of 3 for this passage/);
  await evaluate(`document.querySelector('#reading-collection-select').value='original';document.querySelector('#reading-collection-select').dispatchEvent(new Event('change',{bubbles:true}))`);
  await until(`document.querySelector('.reading-passage-text').textContent.includes('図書館')`);
  const passage = () => evaluate(`document.querySelector('.reading-passage-text').textContent`);
  const prompt = () => evaluate(`document.querySelector('.practice-question-prompt').textContent`);
  const originalPassage = await passage();
  const originalPrompt = await prompt();
  assert.ok(!originalPassage.includes('（'));
  await evaluate(`document.querySelectorAll('.reading-practice')[1].querySelectorAll('input[type=radio]')[2].click()`);
  await evaluate(`window.toggleReadings()`);
  await until(`document.querySelector('.reading-passage-text').textContent.includes('図書館（としょかん）')`);
  assert.match(await prompt(), /比（くら）べ/u);
  assert.ok(await evaluate(`document.querySelectorAll('.reading-practice')[1].querySelectorAll('input[type=radio]')[2].checked`));
  await evaluate(`[...document.querySelectorAll('.reading-practice')[1].querySelectorAll('button')].find(b=>b.textContent==='Check answer').click()`);
  await until(`document.querySelectorAll('.reading-practice')[1].querySelector('.reading-feedback') !== null`);
  assert.match(await evaluate(`document.querySelectorAll('.reading-practice')[1].querySelector('.reading-feedback').textContent`), /正解（せいかい）/u);
  await evaluate(`window.toggleReadings()`);
  await until(`!document.querySelector('.reading-passage-text').textContent.includes('（')`);
  assert.equal(await passage(), originalPassage);
  assert.equal(await prompt(), originalPrompt);
  assert.ok(await evaluate(`document.querySelectorAll('.reading-practice')[1].querySelector('fieldset').disabled`));
  await evaluate(`window.toggleReadings()`);
  await cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  assert.ok(await evaluate(`document.documentElement.scrollWidth <= document.documentElement.clientWidth`));
  await evaluate(`[...document.querySelectorAll('.reading-practice')[0].querySelectorAll('button')].find(b=>b.textContent==='Finish and view results').click()`);
  await until(`document.querySelector('.reading-result-list') !== null`);
  assert.match(await evaluate(`document.querySelector('.reading-result-list').textContent`), /図書館（としょかん）/u);
  console.log('PASS: Reading and Practice furigana ON/OFF, review screen, answer feedback, preserved selection and checked state, mobile width.');
} finally {
  socket?.close();
  chrome.kill();
  await server.close();
}
