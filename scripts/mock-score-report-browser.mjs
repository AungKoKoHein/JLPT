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
      res.end(await server.transformIndexHtml('/__practice-check', `<html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><div id="root"></div><script type="module">import React from 'react';import{createRoot}from'react-dom/client';import AwsApp from '/src/MockScoreReport.jsx';import {StudyAccountContext} from '/src/StudyAccount.jsx';import '/src/app.css';import '/src/design.css';const questions=[];const answers={};for(const section of ['Vocabulary','Grammar','Reading'])for(let i=0;i<8;i++){const id=section+i;questions.push({id,section,type:section==='Vocabulary'?(i<4?'Kanji reading':'Word meaning'):section==='Grammar'?(i<4?'Sentence grammar':'Text grammar'):'Reading comprehension',answer:0});if(i<6)answers[id]=0;}window.print=()=>{window.printRequested=!!document.querySelector('.mock-report-print-target');};createRoot(document.getElementById('root')).render(React.createElement(StudyAccountContext.Provider,{value:{username:'Preview learner'}},React.createElement('article',{className:'mock-exam-panel mock-results'},React.createElement(AwsApp,{title:'N3 practice exam',questions,answers,completedAt:1795746600000}),React.createElement('p',{id:'unprinted-review'},'Answer review stays on screen'))));</script></body></html>`));
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

  await until(`document.querySelector('.mock-score-report')!==null`);
  assert.equal(await evaluate(`document.querySelectorAll('.score-report-group').length`),3);
  assert.ok(await evaluate(`document.querySelector('.score-report-tests').textContent.includes('18 / 24 correct')`));
  assert.deepEqual(await evaluate(`[...document.querySelectorAll('.score-report-summary strong')].map(e=>e.textContent)`),['75%','100%']);
  assert.ok(await evaluate(`document.querySelector('.score-report-details').textContent.includes('Preview learner')`));
  assert.equal(await evaluate(`document.querySelector('.mock-score-report').textContent.includes('Myint Thu Htay')`),false,'Reference personal information is not copied');
  for(const theme of ['light','dark']) {
    await evaluate(`document.documentElement.dataset.theme='${theme}'`);
    for(const width of [1440,768,393,360]) {
      await cdp('Emulation.setDeviceMetricsOverride',{width,height:1100,deviceScaleFactor:1,mobile:width<600});
      await evaluate(`new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))`);
      assert.ok(await evaluate(`document.documentElement.scrollWidth<=innerWidth`),`${theme} report fits ${width}px`);
      await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:true}).then(({data})=>fs.writeFileSync(path.resolve(`.tmp-python/mock-report-${theme}-${width}.png`),Buffer.from(data,'base64')));
    }
  }
  await click('Print / Save PDF');
  assert.equal(await evaluate(`window.printRequested`),true);
  assert.equal(await evaluate(`document.querySelector('.mock-report-print-target')===null`),true,'Print-only state is cleaned up');
  await evaluate(`document.querySelector('.mock-score-report').classList.add('mock-report-print-target')`);
  const pdf=await cdp('Page.printToPDF',{printBackground:true,preferCSSPageSize:true});
  fs.writeFileSync(path.resolve('.tmp-python/mock-report-preview.pdf'),Buffer.from(pdf.data,'base64'));
  await cdp('Emulation.setEmulatedMedia',{media:'print'});
  assert.equal(await evaluate(`getComputedStyle(document.getElementById('unprinted-review')).display`),'none','PDF excludes the answer review');
  console.log('PASS: actual report scores, learner metadata, section bars, responsive light/dark layouts and isolated PDF printing.');
} finally {socket?.close();chrome.kill();await server.close();}
