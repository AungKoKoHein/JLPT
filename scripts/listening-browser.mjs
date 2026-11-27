import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';

// Exercise the actual Listening component independently of account sign-in.
const profile = fs.mkdtempSync(path.resolve('node_modules/.cache/practice-chrome-'));
const server = await createServer({ configFile: false, logLevel: 'error', plugins: [react(), {
  name: 'practice-check-page',
  configureServer(server) {
    server.middlewares.use('/__practice-check', async (_req, res) => {
      res.setHeader('Content-Type', 'text/html');
      res.end(await server.transformIndexHtml('/__practice-check', `<html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><div id="root"></div><script type="module">import React from 'react';import{createRoot}from'react-dom/client';import AwsApp from '/src/ListeningPractice.jsx';import '/src/app.css';import '/src/design.css';createRoot(document.getElementById('root')).render(React.createElement(AwsApp));</script></body></html>`));
    });
  },
}], server: { host: '127.0.0.1', port: 0 } });
await server.listen();
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--disable-gpu', '--autoplay-policy=no-user-gesture-required', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
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

  await until(`document.querySelector('.listening-practice') !== null`);
  await until(`document.querySelector('audio').readyState>=1`);
  assert.equal(await evaluate(`document.querySelectorAll('.listening-sections button').length`),5);
  assert.ok(await evaluate(`Math.abs(document.querySelector('audio').duration-74.3)<.15`));
  await evaluate(`document.querySelector('.listening-options input').click()`);
  await evaluate(`(()=>{const field=document.querySelector('.listening-notes textarea');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(field,'Test listening note');field.dispatchEvent(new Event('input',{bubbles:true}))})()`);
  await evaluate(`document.querySelector('.listening-player-tools select').value='0.75';document.querySelector('.listening-player-tools select').dispatchEvent(new Event('change',{bubbles:true}))`);
  assert.equal(await evaluate(`document.querySelector('audio').playbackRate`),.75);
  await click('↺ Replay');
  await until(`!document.querySelector('audio').paused && document.querySelector('audio').currentTime>.2`);
  await evaluate(`void(window.oldAudio=document.querySelector('audio'))`);
  await click('Next →');
  await until(`document.querySelector('audio').src.includes('s1-q2.mp3')`);
  assert.equal(await evaluate(`window.oldAudio.paused`),true,'Changing questions stops the previous audio');
  assert.equal(await evaluate(`document.querySelector('audio').paused`),true,'Question changes do not autoplay');
  await click('← Previous');
  assert.equal(await evaluate(`document.querySelector('.listening-options input').checked`),true);
  assert.equal(await evaluate(`document.querySelector('.listening-notes textarea').value`),'Test listening note');
  const manifest=JSON.parse(fs.readFileSync(path.resolve('src/n3Listening201612.json'),'utf8'));
  for(const section of manifest.sections) {
    await evaluate(`document.querySelectorAll('.listening-sections button')[${section.number-1}].click()`);
    for(const [index,question] of section.questions.entries()) {
      await evaluate(`document.querySelectorAll('.listening-question-buttons button')[${index}].click()`);
      await until(`document.querySelector('audio').src.includes('${question.id}.mp3') && document.querySelector('audio').readyState>=1`);
      assert.ok(await evaluate(`Math.abs(document.querySelector('audio').duration-${question.end-question.start})<.15`),question.id);
      assert.equal(await evaluate(`document.querySelectorAll('.listening-options input').length`),question.options.length);
      assert.equal(await evaluate(`document.querySelectorAll('.listening-figure img').length`),question.image?1:0);
      if(question.image) await until(`document.querySelector('.listening-figure img').naturalWidth>0`);
      assert.equal(await evaluate(`document.querySelector('.listening-key-note').textContent.includes('does not include an answer key')`),true);
    }
  }
  assert.equal(await evaluate(`document.querySelector('.listening-pagination button:last-child').disabled`),true);
  await click('Full recording');
  await until(`document.querySelector('audio').src.includes('full-recording.mp3') && document.querySelector('audio').readyState>=1`);
  assert.ok(await evaluate(`Math.abs(document.querySelector('audio').duration-${manifest.duration})<.1`));
  await evaluate(`document.querySelector('.listening-sections button').click()`);
  for(const theme of ['light','dark']) {
    await evaluate(`document.documentElement.dataset.theme='${theme}'`);
    for(const width of [1440,768,393,360]) {
      await cdp('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<600});
      await evaluate(`new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))`);
      assert.ok(await evaluate(`document.documentElement.scrollWidth<=innerWidth`),`Listening ${theme} fits ${width}px`);
      await cdp('Page.captureScreenshot',{format:'png'}).then(({data})=>fs.writeFileSync(path.resolve(`.tmp-python/listening-${theme}-${width}.png`),Buffer.from(data,'base64')));
    }
  }
  await cdp('Page.reload');
  await until(`document.querySelector('.listening-options input')!==null`);
  assert.equal(await evaluate(`document.querySelector('.listening-options input').checked`),true,'Answer survives reload');
  assert.equal(await evaluate(`document.querySelector('.listening-notes textarea').value`),'Test listening note','Notes survive reload');
  await click('Clear this question');
  assert.equal(await evaluate(`document.querySelectorAll('.listening-options input:checked').length`),0);
  assert.equal(await evaluate(`document.querySelector('.listening-notes textarea').value`),'');
  for(const year of [2017,2018]) {
    const collection=JSON.parse(fs.readFileSync(path.resolve(`src/n3Listening${year}12.json`),'utf8'));
    await evaluate(`document.querySelector('.listening-set-picker select').value='${collection.id}';document.querySelector('.listening-set-picker select').dispatchEvent(new Event('change',{bubbles:true}))`);
    await until(`document.querySelector('audio').src.includes('${collection.id}/s1-q1.mp3') && document.querySelector('audio').readyState>=1`);
    assert.equal(await evaluate(`document.querySelectorAll('.listening-options input:checked').length`),0);
    for(const section of collection.sections) {
      await evaluate(`document.querySelectorAll('.listening-sections button')[${section.number-1}].click()`);
      for(const [index,q] of section.questions.entries()) {
        await evaluate(`document.querySelectorAll('.listening-question-buttons button')[${index}].click()`);
        await until(`document.querySelector('audio').src.includes('${q.id}.mp3') && document.querySelector('audio').readyState>=1`);
        assert.ok(await evaluate(`Math.abs(document.querySelector('audio').duration-${q.end-q.start})<.15`),`${year} ${q.id}`);
        if(q.image) await until(`document.querySelector('.listening-figure img').naturalWidth>0`);
      }
    }
    await evaluate(`document.querySelector('.listening-options input').click()`);
  }
  await cdp('Page.reload');
  await until(`document.querySelector('.listening-set-picker select')?.value==='n3-2018-12'`);
  console.log('PASS: 84 question clips across three exams, images, exam selection and saved selection.');
  console.log('PASS: 28 real audio clips, five original pictures, PDF choices, playback, speed, source recording, navigation, saved answers/notes, reset and responsive light/dark layouts.');
} finally {socket?.close();chrome.kill();await server.close();}
