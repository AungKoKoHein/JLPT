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
  await click('Start practice');
  await until(`document.querySelector('.aws-source-card') !== null`);
  const jump = async number => {
    await evaluate(`document.querySelector('#aws-question-select').value=${number-1};document.querySelector('#aws-question-select').dispatchEvent(new Event('change',{bubbles:true}))`);
    await until(`document.querySelector('#aws-question-heading').textContent==='Question #${number}'`);
  };
  assert.equal(await evaluate(`document.querySelectorAll('#aws-question-select option').length`),684);
  assert.equal(await evaluate(`document.querySelector('#aws-question-select').closest('header') !== null`),true);
  assert.equal(await evaluate(`document.body.textContent.includes('Go to question')`),false);
  assert.equal(await evaluate(`document.querySelector('.aws-source-page')`),null);
  assert.deepEqual(await evaluate(`[...document.querySelectorAll('.aws-answer-letter')].map(b=>b.textContent)`),['A','B','C','D']);
  assert.equal(await evaluate(`[...document.querySelectorAll('button')].some(b=>['Check answer','Submit answer'].includes(b.textContent.trim()))`),false);
  await click('D');
  assert.deepEqual(await evaluate(`[...document.querySelectorAll('.aws-answer-letter[aria-pressed=true]')].map(b=>b.textContent)`),['D']);
  assert.equal(await evaluate(`document.querySelector('.aws-answer-letter.correct').textContent`),'A');
  assert.equal(await evaluate(`document.querySelector('.aws-answer-letter.incorrect').textContent`),'D');
  assert.equal(await evaluate(`document.querySelector('.aws-answer-feedback, .aws-key-source')`),null);
  assert.equal(await evaluate(`document.body.textContent.includes('Your answer:') || document.body.textContent.includes('Answer key: supplied solution notes.')`),false);
  await click('A');
  assert.equal(await evaluate(`document.querySelector('.aws-answer-letter[aria-pressed=true]').textContent`),'D');
  await click('Try again');
  assert.equal(await evaluate(`document.querySelector('.aws-answer-panel fieldset').disabled`),false);
  await click('D');
  await click('Next');await click('Previous');
  assert.equal(await evaluate(`document.querySelector('.aws-answer-letter[aria-pressed=true]').textContent`),'D');
  await jump(18);
  assert.deepEqual(await evaluate(`[...document.querySelectorAll('.aws-answer-letter')].map(b=>b.textContent)`),['A','B','C','D','E']);
  await click('C');
  assert.equal(await evaluate(`document.querySelector('.aws-answer-panel fieldset').disabled`),false);
  await click('C');
  assert.equal(await evaluate(`document.querySelectorAll('.aws-answer-letter[aria-pressed=true]').length`),0);
  await click('A');
  assert.equal(await evaluate(`document.querySelector('.aws-answer-panel fieldset').disabled`),false);
  await click('B');
  assert.deepEqual(await evaluate(`[...document.querySelectorAll('.aws-answer-letter.correct')].map(b=>b.textContent)`),['A','B']);
  assert.equal(await evaluate(`document.querySelector('.aws-answer-panel fieldset').disabled`),true);
  await click('Results (2/684)');
  assert.ok(await evaluate(`document.querySelector('.aws-results').textContent.includes('Correct: 1 / 2 graded') && document.querySelector('.aws-results').textContent.includes('0 ungraded')`));
  await click('Back to questions');
  await jump(679);
  assert.deepEqual(await evaluate(`[...document.querySelectorAll('.aws-answer-letter')].map(b=>b.textContent)`),['A','B','C','D','E','F']);
  await click('A');await click('B');
  assert.equal(await evaluate(`document.querySelector('.aws-answer-panel fieldset').disabled`),false);
  await click('F');
  assert.equal(await evaluate(`document.querySelector('.aws-answer-panel fieldset').disabled`),true);
  await jump(477);
  await until(`[...document.querySelectorAll('.aws-policy-image')].every(i=>i.complete&&i.naturalWidth>0)`);
  assert.equal(await evaluate(`document.querySelectorAll('.aws-policy-image').length`),5);
  for(const width of [1440,768,393,360]){
    await cdp('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<600});
    assert.ok(await evaluate(`document.querySelector('.study-session-content').scrollWidth<=innerWidth`),`No overflow at ${width}px`);
    if(width===1440) assert.ok(await evaluate(`document.querySelector('.aws-answer-panel').getBoundingClientRect().left>document.querySelector('.aws-source-card').getBoundingClientRect().right`),'Side-by-side on desktop');
    await cdp('Page.captureScreenshot',{format:'png'}).then(({data})=>fs.writeFileSync(path.resolve(`.tmp-python/aws-full-${width}.png`),Buffer.from(data,'base64')));
  }
  await jump(684);await click('Finish');
  assert.ok(await evaluate(`document.querySelector('.aws-results').textContent.includes('3 / 684 submitted')`));
  await click('Start over');
  assert.equal(await evaluate(`document.querySelector('#aws-question-heading').textContent`),'Question #1');
  assert.equal(await evaluate(`document.querySelectorAll('.aws-answer-letter[aria-pressed=true]').length`),0);
  await click('Quit practice');
  await until(`document.querySelector('.study-session-view') === null`);
  console.log('PASS: All 684 questions, per-question A-D/A-E/A-F choices, one/two/three selection limits, navigation and answer retention, ungraded results, verified answer grading, policy image options, desktop columns, mobile layouts, finish, restart and quit.');
} finally {socket?.close();chrome.kill();await server.close();}
