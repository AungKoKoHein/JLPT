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
      res.end(await server.transformIndexHtml('/__practice-check', `<html><body><div id="root"></div><script type="module">import React from 'react';import{createRoot}from'react-dom/client';import Practice from '/src/Practice.jsx';import '/src/app.css';createRoot(document.getElementById('root')).render(React.createElement(Practice));</script></body></html>`));
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
  await until(`document.querySelectorAll('.mock-exam-set-card').length===26`);
  await click('Start N3-1');
  await until(`document.querySelectorAll('input[type=radio]').length===4`);
  await until(`document.querySelector('.practice-source-page img')?.naturalWidth>0`);
  assert.equal(await evaluate(`document.querySelector('.reading-question-actions .primary-button').disabled`), true);
  await evaluate(`document.querySelectorAll('input[type=radio]')[2].click()`);
  await click('Check answer');
  await until(`document.querySelector('.reading-feedback')?.textContent.includes('Correct.')`);
  await click('Next →');
  await until(`document.querySelector('.reading-question-topline strong').textContent==='Q2'`);
  await click('← Previous');
  assert.equal(await evaluate(`document.querySelectorAll('input[type=radio]')[2].checked`), true);
  assert.equal(await evaluate(`document.querySelector('fieldset').disabled`), true);
  await click('Results (1/74)');
  await until(`document.querySelector('h2')?.textContent==='Practice results'`);
  assert.equal(await evaluate(`document.querySelector('.reading-score strong').textContent`), '1 / 73');
  await click('Try again');
  assert.equal(await evaluate(`document.querySelectorAll('input:checked').length`), 0);
  await cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await until(`document.querySelector('.practice-source-page img')?.naturalWidth>0`);
  assert.equal(await evaluate(`document.documentElement.scrollWidth<=document.documentElement.clientWidth`), true);
  await click('← All 26 categories');
  assert.equal(await evaluate(`document.querySelectorAll('.mock-exam-set-card').length`), 26);
  console.log('PASS: 26 category cards, PDF page loads, check answer, navigation retention, results, retry, and mobile width.');
} finally {
  socket?.close();
  chrome.kill();
  await server.close();
}
