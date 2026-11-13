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
      res.end(await server.transformIndexHtml('/__practice-check', `<html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><div id="root"></div><script type="module">import React from 'react';import{createRoot}from'react-dom/client';import Practice from '/src/ReadingPractice.jsx';import StudyControlsHost from '/src/StudyControlsHost.jsx';import '/src/app.css';createRoot(document.getElementById('root')).render(React.createElement(React.Fragment,null,React.createElement(Practice),React.createElement(StudyControlsHost,null,React.createElement('button',{className:'session-controls-check',onClick:()=>window.controlsClicked=true},'Study Controls'))));</script></body></html>`));
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
  await until(`document.querySelector('#reading-collection-select') !== null`);
  await evaluate(`const picker=document.querySelector('#reading-collection-select');picker.value='original';picker.dispatchEvent(new Event('change',{bubbles:true}))`);
  await evaluate(`document.querySelectorAll('.reading-passage-cards button')[1].click()`);
  await until(`document.querySelector('.reading-session .reading-answer-list') !== null`);
  await until(`document.querySelector('[data-session-controls] .session-controls-check') !== null`);
  await click('Study Controls');
  assert.equal(await evaluate(`window.controlsClicked`),true);
  assert.equal(await evaluate(`document.querySelectorAll('input[type=radio]').length`),4);
  assert.ok(await evaluate(`document.querySelector('.reading-content-meta').textContent.includes('Passage 2 of')`), 'Passage card opens its own passage');
  await click('Next →');
  assert.equal(await evaluate(`document.querySelectorAll('input:checked').length`),0,'Skip leaves question unanswered');
  await evaluate(`document.querySelector('.reading-question-actions .secondary-button').click()`);
  await evaluate(`document.querySelector('input[type=radio]').click()`);
  await until(`document.querySelector('.reading-answer-list').disabled`);
  assert.ok(await evaluate(`Boolean(document.querySelector('.reading-answer-list .correct'))`),'Correct answer is highlighted automatically');
  assert.equal(await evaluate(`document.querySelector('.reading-feedback')`),null,'No extra answer feedback');
  for (const width of [1440,1024,800,600,390,360]) {
    await cdp('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:width<600});
    assert.ok(await evaluate(`document.querySelector('.study-session-content').scrollWidth <= document.querySelector('.study-session-content').clientWidth`),`Reading fits at ${width}px`);
  }
  await evaluate(`document.querySelector('.practice-navigation-menu').open=true`);
  await evaluate(`document.querySelector('button[aria-label="Question 1"]').click()`);
  await evaluate(`document.querySelector('.practice-navigation-menu').open=false`);
  await click('Quit reading');
  await until(`document.querySelector('.study-session-view') === null`);
  assert.ok(await evaluate(`Boolean(document.querySelector('#reading-collection-select'))`));
  console.log('PASS: Reading start, full-screen layout, controls, skip, automatic checking, passage navigation, quit, and desktop/mobile widths.');

} finally {
  socket?.close();
  chrome.kill();
  await server.close();
}
