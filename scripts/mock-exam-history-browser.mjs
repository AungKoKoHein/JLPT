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
      res.end(await server.transformIndexHtml('/__practice-check', `<html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><div id="root"></div><script type="module">import React from 'react';import{createRoot}from'react-dom/client';import{ExamPerformance,OverallPerformance}from'/src/MockExamHistory.jsx';import'/src/app.css';import'/src/design.css';const records=[{id:'a',examTitle:'Old exam',completedAt:1000,correct:1,total:1,scores:{Grammar:{correct:1,total:1}}},{id:'b',examTitle:'Middle exam',completedAt:2000,correct:5,total:10,scores:{Grammar:{correct:5,total:10}}},{id:'c',examTitle:'Newest exam',completedAt:3000,correct:8,total:10,review:JSON.stringify({questions:[{id:1,section:'Grammar',prompt:'Saved question',choices:['First','Second','Third','Fourth'],answer:1,explanation:'Saved explanation'},{id:2,section:'Reading',prompt:'Second saved question',choices:['One','Two','Three','Four'],answer:0}],answers:{1:0}}),scores:{Grammar:{correct:8,total:10}}}];createRoot(document.getElementById('root')).render(React.createElement('article',{className:'mock-exam-panel'},React.createElement(OverallPerformance,{records}),React.createElement(ExamPerformance,{records,onDelete:record=>{window.deletedRecord=record.id}})));</script></body></html>`));
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
  await until(`document.querySelector('.exam-performance-detail') !== null`);
  const detail = () => evaluate(`document.querySelector('.exam-performance-detail').textContent`);
  assert.match(await detail(),/Newest exam/);
  assert.match(await detail(),/80%/);
  assert.match(await detail(),/Strong/);
  assert.match(await detail(),/\+30 percentage points/);
  await click('Previous exams');
  assert.match(await detail(),/Middle exam/);
  assert.match(await detail(),/50%/);
  await evaluate(`const select=document.querySelector('.exam-history-select select');select.value='a';select.dispatchEvent(new Event('change',{bubbles:true}))`);
  await until(`document.querySelector('.exam-performance-detail').textContent.includes('Old exam')`);
  assert.match(await detail(),/100%/);
  const overall = () => evaluate(`document.querySelector('.exam-overall-performance').textContent`);
  assert.match(await overall(),/3 completed exams/);
  assert.match(await overall(),/67%/);
  assert.match(await overall(),/Developing/);
  assert.doesNotMatch(await overall(),/Overall strengths and weaknesses|Your overall performance will appear/);
  assert.match(await overall(),/Not tested/);
  assert.equal(await evaluate(`document.querySelector('.mock-exam-panel').firstElementChild.className`),'exam-overall-performance');
  await evaluate(`document.querySelectorAll('tbody tr')[0].querySelector('button').click()`);
  await until(`document.querySelector('.exam-performance-detail h4').textContent.includes('Latest exam')`);
  assert.match(await overall(),/67%/);
  assert.match(await evaluate("document.querySelector('[aria-label=\"Saved exam questions\"]').textContent"), /Saved question/);
  assert.match(await evaluate("document.querySelector('[aria-label=\"Saved exam questions\"]').textContent"), /Your answer: A/);
  await evaluate("document.querySelector('tbody tr button').click()");
  await until("document.querySelector('[aria-label=\"Saved exam questions\"]') === null");
  assert.equal(await evaluate("document.querySelector('tbody tr button').getAttribute('aria-expanded')"), 'false');
  await evaluate("document.querySelector('tbody tr button').click()");
  await until("document.querySelector('[aria-label=\"Saved exam questions\"]') !== null");
  assert.equal(await evaluate("document.querySelector('tbody tr button').getAttribute('aria-expanded')"), 'true');
  await click('Next question');
  assert.match(await evaluate("document.querySelector('[aria-label=\"Saved exam questions\"]').textContent"), /Second saved question/);
  await evaluate("document.querySelector('tbody tr button[aria-label^=\"Delete\"]').click()");
  assert.equal(await evaluate('window.deletedRecord'),'c');
  for(const width of [1440,768,393,360]){
    await cdp('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<600});
    assert.ok(await evaluate(`document.documentElement.scrollWidth<=document.documentElement.clientWidth`),`History fits at ${width}px`);
  }
  console.log('PASS: Latest/previous/overall views, selecting older attempts, improvement comparisons, weighted overall scores, per-exam links, and responsive layouts.');
} finally {socket?.close();chrome.kill();await server.close();}
