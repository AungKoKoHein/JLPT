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
      res.end(await server.transformIndexHtml('/__practice-check', `<html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><div id="root"></div><script type="module">import React from 'react';import{createRoot}from'react-dom/client';import Practice from '/src/Practice.jsx';import StudyControlsHost from '/src/StudyControlsHost.jsx';import '/src/app.css';createRoot(document.getElementById('root')).render(React.createElement(React.Fragment,null,React.createElement(Practice),React.createElement(StudyControlsHost,null,React.createElement('button',{className:'session-controls-check',onClick:()=>window.controlsClicked=true},'Study Controls'))));</script></body></html>`));
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
  await until(`document.querySelectorAll('.mock-exam-set-card').length===24`);
  assert.equal(await evaluate(`[...document.querySelectorAll('.mock-exam-set-card strong')].some(e=>['N3-2','N3-17'].includes(e.textContent))`), false, 'Empty categories are hidden');
  assert.equal(await evaluate(`document.querySelector('.mock-exam-actions').compareDocumentPosition(document.querySelector('.mock-exam-set-grid')) & Node.DOCUMENT_POSITION_FOLLOWING`), 4, 'Start is above the category grid');
  await evaluate(`const scrollIntoView=Element.prototype.scrollIntoView;Element.prototype.scrollIntoView=function(options){window.lastScrollTarget=this.className;return scrollIntoView.call(this,options)}`);
  await click('Start N3-1');
  await until(`document.querySelectorAll('input[type=radio]').length===4`);
  await until(`document.querySelector('[data-session-controls] .session-controls-check') !== null`);
  await click('Study Controls');
  assert.equal(await evaluate(`window.controlsClicked`), true, 'Controls remain interactive in the session toolbar');
  await cdp('Emulation.setDeviceMetricsOverride', { width: 1366, height: 600, deviceScaleFactor: 1, mobile: false });
  assert.equal(await evaluate(`(() => { const content = document.querySelector('.study-session-content'); return content.scrollHeight <= content.clientHeight + 1; })()`), true, 'Short questions fit a 600px-high screen without scrolling');
  await cdp('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await until(`window.lastScrollTarget?.includes('practice-question-card')`);
  await click('Next →');
  await until(`document.querySelector('.reading-question-topline strong').textContent==='Q2'`);
  assert.equal(await evaluate(`document.querySelectorAll('input:checked').length`), 0, 'Skipping does not select an answer');
  assert.equal(await evaluate(`document.querySelector('.reading-progress strong').textContent.trim()`), '0 / 74', 'Skipped question stays unchecked');
  await click('← Previous');
  assert.equal(await evaluate(`document.querySelector('.pdf-question-underline').textContent`), '比べて');
  assert.ok(await evaluate(`Number(getComputedStyle(document.querySelector('.practice-question-prompt')).fontWeight)>=700`));
  assert.match(await evaluate(`document.querySelector('.practice-problem-heading').textContent.trim()`), /言葉の読み方.*選びなさい/);
  assert.equal(await evaluate(`document.querySelector('.practice-question-prompt').textContent.trim()`), '［1］ どちらのほうが大きいか、比べてみましょう。');
  assert.deepEqual(await evaluate(`[...document.querySelectorAll('.practice-question-group h4')].slice(0,3).map(e=>e.textContent)`), ['問題 1', '問題 2', '問題 3']);
  assert.equal(await evaluate(`document.querySelector('.practice-source-page').open`), false, 'Whole source page is collapsed');
  assert.equal(await evaluate(`document.querySelectorAll('.reading-answer-list label')[2].textContent.trim()`), '③くらべて');
  await until(`document.querySelector('.practice-source-page img')?.naturalWidth>0`);
  assert.equal(await evaluate(`[...document.querySelectorAll('button')].some(button => button.textContent.trim() === 'Check answer')`), false);
  await evaluate(`document.querySelectorAll('input[type=radio]')[2].click()`);
  await until(`document.querySelector('.reading-answer-list label.correct') !== null`);
  await click('Next →');
  await until(`document.querySelector('.reading-question-topline strong').textContent==='Q2'`);
  await click('← Previous');
  assert.equal(await evaluate(`document.querySelectorAll('input[type=radio]')[2].checked`), true);
  assert.equal(await evaluate(`document.querySelector('fieldset').disabled`), true);
  await click('Results (1/74)');
  await until(`document.querySelector('h2')?.textContent==='Practice results'`);
  assert.equal(await evaluate(`document.querySelector('.reading-score strong').textContent`), '1 / 74');
  await click('Try again');
  assert.equal(await evaluate(`document.querySelectorAll('input:checked').length`), 0);
  await evaluate(`document.querySelector('.practice-navigation-menu').open = true`);
  await evaluate(`document.querySelector('button[aria-label="Grammar & reading, question 17"]').click()`);
  await evaluate(`document.querySelector('.practice-navigation-menu').open = false`);
  await until(`document.querySelectorAll('.star-answer-slot').length===4`);
  assert.equal(await evaluate(`document.querySelector('.star-answer-slot.star-position').getAttribute('aria-label')`), 'Position 3, star');
  await evaluate(`document.querySelectorAll('.star-answer-options button')[0].click()`);
  assert.equal(await evaluate(`document.querySelector('.star-answer-slot.star-position strong').textContent`), '済んだ');
  assert.equal(await evaluate(`Boolean(document.querySelector('.reading-feedback'))`), false, 'Sentence arrangement stays editable until complete');
  for (const index of [1, 2, 3]) await evaluate(`document.querySelectorAll('.star-answer-options button')[${index}].click()`);
  await until(`document.querySelector('.star-answer-slot.correct') !== null`);
  assert.ok(await evaluate(`document.querySelector('.star-answer').disabled`));
  await cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await until(`document.querySelector('.practice-source-page img')?.naturalWidth>0`);
  assert.equal(await evaluate(`document.documentElement.scrollWidth<=document.documentElement.clientWidth`), true);
  assert.equal(await evaluate(`Boolean(document.querySelector('.study-session-view'))`), true, 'Practice opens in a dedicated full-screen view');
  assert.equal(await evaluate(`getComputedStyle(document.body).overflow`), 'hidden', 'Background scrolling is locked');
  await click('Quit practice');
  assert.equal(await evaluate(`Boolean(document.querySelector('.study-session-view'))`), false, 'Quit closes the full-screen view');
  assert.equal(await evaluate(`document.querySelectorAll('.mock-exam-set-card').length`), 24);
  console.log('PASS: Start above categories, individual Japanese question, highlighted PDF answer, collapsed source page, navigation, results, retry, and mobile width.');
} finally {
  socket?.close();
  chrome.kill();
  await server.close();
}
