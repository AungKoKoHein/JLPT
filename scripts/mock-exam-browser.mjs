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
      res.end(await server.transformIndexHtml('/__practice-check', `<html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><div id="root"></div><script type="module">import React from 'react';import{createRoot}from'react-dom/client';import Practice from '/src/MockExam.jsx';import '/src/app.css';function Check(){const[readings,setReadings]=React.useState(false);window.toggleReadings=()=>setReadings(v=>!v);return React.createElement(Practice,{showReadings:readings});}createRoot(document.getElementById('root')).render(React.createElement(Check));</script></body></html>`));
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
  await until(`document.querySelectorAll('.mock-exam-set-card').length===7`);
  await evaluate(`window.confirm=()=>{throw Error('Browser confirmation must not be used')};window.alert=()=>{throw Error('Browser alert must not be used')}`);
  await evaluate(`[...document.querySelectorAll('.mock-exam-set-card')].find(b=>b.querySelector('strong').textContent==='For Dec Exam').click()`);
  await click('Start For Dec Exam');
  await until(`document.querySelectorAll('.mock-question-palette button').length===74`);
  assert.match(await evaluate(`document.querySelector('.mock-problem-instruction').textContent`), /(?:なさい|ください)/, 'Mock questions show full PDF section directions');
  assert.equal(await evaluate(`document.querySelectorAll('input[type=radio]').length`),4);
  await evaluate(`document.querySelector('input[type=radio]').click()`);
  assert.equal(await evaluate(`document.querySelectorAll('.mock-attempt .correct, .mock-attempt .incorrect').length`), 0, 'Exam selection does not reveal correctness');
  assert.equal(await evaluate(`document.querySelector('.mock-answer-list').disabled`), false, 'Exam answers remain editable');
  assert.ok(await evaluate(`parseFloat(getComputedStyle(document.querySelector('.mock-answer-option span[lang="ja"]')).fontSize) >= 18`), 'Answer text is enlarged');
  for (const width of [1440,1024,800,768,600,393,360]) {
    await cdp('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<600});
    await new Promise(resolve=>setTimeout(resolve,150));
    assert.ok(await evaluate(`document.documentElement.scrollWidth<=document.documentElement.clientWidth`),`Horizontal overflow at ${width}px`);
    assert.ok(await evaluate(`document.querySelector('.mock-question-card').getBoundingClientRect().width<=innerWidth`),`Question fits at ${width}px`);
    assert.ok(await evaluate(`document.querySelector('.mock-answer-option').getBoundingClientRect().height>=44`),`Touch target at ${width}px`);
    if (process.env.CAPTURE_MOCK_UI === '1' && [1440, 800, 360].includes(width)) {
      const screenshot = await cdp('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(new URL(`../.tmp-python/mock-${width}.png`, import.meta.url), Buffer.from(screenshot.data, 'base64'));
    }
  }
  assert.equal(await evaluate(`document.querySelector('.mock-navigation-drawer').open`),false);
  await evaluate(`document.querySelector('.mock-navigation-drawer summary').click()`);
  await evaluate(`document.querySelectorAll('.mock-question-palette button')[58].click()`);
  await until(`document.querySelector('.mock-reading-passage') !== null`);
  assert.ok(await evaluate(`document.querySelector('.mock-reading-passage').textContent.length>50`));
  const originalReading = await evaluate(`document.querySelector('.mock-reading-passage').textContent`);
  await evaluate(`window.toggleReadings()`);
  await until(`document.querySelector('.mock-reading-passage').textContent.includes('（')`);
  const readingText = await evaluate(`document.querySelector('.mock-reading-passage').textContent`);
  assert.doesNotMatch(readingText.replace(/[\p{Script=Han}々〆\p{Script=Hiragana}\p{Script=Katakana}ー]+[（(][\p{Script=Hiragana}\p{Script=Katakana}ー]+[）)]/gu, ''), /\p{Script=Han}/u, 'Mock reading also has complete furigana');
  await evaluate(`window.toggleReadings()`);
  await until(`document.querySelector('.mock-reading-passage').textContent===${JSON.stringify(originalReading)}`);
  await click('Finish exam');
  await until(`document.querySelector('dialog')?.open`);
  assert.match(await evaluate(`document.querySelector('dialog').textContent`),/73 unanswered/);
  await cdp('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
  await cdp('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
  await until(`document.querySelector('dialog')===null`);
  assert.match(await evaluate(`document.querySelector('.mock-question-meta').textContent`),/Answered 1 \/ 74/);
  await click('Finish exam');
  await click('Finish and view results');
  await until(`document.querySelector('.mock-results') !== null`);
  assert.equal(await evaluate(`document.querySelectorAll('.mock-review-nav button').length`),74);
  assert.ok(await evaluate(`document.documentElement.scrollWidth<=document.documentElement.clientWidth`),'Results fit phone width');
  await click('Try again');
  await until(`document.querySelector('.mock-attempt') !== null`);
  assert.match(await evaluate(`document.querySelector('.mock-question-meta').textContent`),/Answered 0 \/ 74/);
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('.study-session-view')).position`), 'fixed');
  await click('Quit exam');
  await until(`document.querySelector('dialog')?.open`);
  await evaluate(`[...document.querySelectorAll('dialog button')].find(button => button.textContent.trim() === 'Quit exam').click()`);
  await until(`document.querySelector('.study-session-view') === null`);
  await until(`document.body.style.overflow === ''`);
  assert.equal(await evaluate(`document.body.style.overflow`), '', 'Quit restores background scrolling');
  console.log('PASS: Full-screen session and quit, December mock, 74 PDF questions, reading context, modal finish/cancel, retry, and 1440/1024/800/768/600/393/360px layouts.');
} finally {socket?.close();chrome.kill();await server.close();}
