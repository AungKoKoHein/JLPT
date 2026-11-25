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
      res.end(await server.transformIndexHtml('/__practice-check', `<html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><div id="root"></div><script type="module">import React from 'react';import{createRoot}from'react-dom/client';import AwsApp from '/src/AwsApp.jsx';import '/src/app.css';import '/src/design.css';createRoot(document.getElementById('root')).render(React.createElement(AwsApp));</script></body></html>`));
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
  await until(`document.querySelector('button') !== null`);
  await click('Start sample practice');
  await until(`document.querySelector('.aws-source-card') !== null`);
  assert.equal(await evaluate(`document.querySelectorAll('.aws-source-options li').length`),5);
  assert.deepEqual(await evaluate(`[...document.querySelectorAll('.aws-answer-letter')].map(b=>b.textContent)`),['A','B','C','D','E']);
  assert.equal(await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent==='Check answer').disabled`),true);
  await click('A');await click('C');
  assert.equal(await evaluate(`[...document.querySelectorAll('.aws-answer-letter')].find(b=>b.textContent==='B').disabled`),true);
  await click('C');await click('B');await click('Check answer');
  assert.ok(await evaluate(`document.querySelector('.aws-answer-feedback').textContent.includes('Correct answer: A, B')`));
  await click('Results (1/1)');
  assert.ok(await evaluate(`document.querySelector('.aws-results').textContent.includes('Correct: 1 / 1')`));
  await click('Try again');
  assert.equal(await evaluate(`document.querySelectorAll('.aws-answer-letter[aria-pressed=true]').length`),0);
  for(const width of [1440,768,393,360]){
    await cdp('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<600});
    assert.ok(await evaluate(`document.querySelector('.study-session-content').scrollWidth<=innerWidth`),`No overflow at ${width}px`);
    await cdp('Page.captureScreenshot',{format:'png'}).then(({data})=>fs.writeFileSync(path.resolve(`.tmp-python/aws-sample-${width}.png`),Buffer.from(data,'base64')));
  }
  await click('Quit practice');
  await until(`document.querySelector('.study-session-view') === null`);
  console.log('PASS: AWS sample source choices, letter-only multi-select, selection limits, grading, results, retry, quit, and responsive layouts.');
} finally {socket?.close();chrome.kill();await server.close();}
