import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';

// Exercise the actual Listening component independently of account sign-in.
const profile = fs.mkdtempSync(path.resolve('node_modules/.cache/practice-chrome-'));
const server = await createServer({ configFile: false, logLevel: 'error', plugins: [react(), {
  name: 'vocabulary-validation-page',
  enforce:'pre',
  transform(code,id) {
    if(id.includes('/src/main.jsx') && id.includes('vocab-check')) {
      const start=code.lastIndexOf('createRoot(document.getElementById("root")).render(');
      return code.slice(0,start)+'export {Flashcard,VocabularyBook};';
    }
  },
  configureServer(server) {
    server.middlewares.use('/__practice-check', async (_req, res) => {
      res.setHeader('Content-Type', 'text/html');
      res.end(await server.transformIndexHtml('/__practice-check', `<html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><div id="root"></div><script type="module">import React from 'react';import{createRoot}from'react-dom/client';import {Flashcard,VocabularyBook} from '/src/main.jsx?vocab-check';import '/src/app.css';import '/src/design.css';const card={_id:'test-vocab',studyTab:'Vocab',term:"\u6700\u65b0\uff08\u3055\u3044\u3057\u3093\uff09",exampleJapanese:"\u305d\u306e\u98db\u884c\u6a5f\uff08\u3072\u3053\u3046\u304d\uff09\u306f\u3001 \u6700\u65b0\uff08\u3055\u3044\u3057\u3093\uff09 \u306e\u98db\u884c\u6a5f\u306a\u306e\u306b\u3001\u6545\u969c\u304c\u591a\u3044\u3002",generated:true};function Preview(){const[mode,setMode]=React.useState('book');const[readings,setReadings]=React.useState(true);const[kanji,setKanji]=React.useState(true);const props={showReadings:readings,showKanji:kanji,showJapanese:true,showMyanmar:false};return React.createElement('main',null,React.createElement('button',{onClick:()=>setMode(mode==='book'?'card':'book')},'Switch view'),React.createElement('button',{onClick:()=>setReadings(!readings)},'Toggle furigana'),React.createElement('button',{onClick:()=>setKanji(!kanji)},'Toggle kanji'),mode==='book'?React.createElement(VocabularyBook,{...props,entries:[{card}]}):React.createElement(Flashcard,{...props,card}));}createRoot(document.getElementById('root')).render(React.createElement(Preview));</script></body></html>`));
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

  await until(`document.querySelector('.book-example')!==null`);
  for(const mode of ['book','card']) {
    if(mode==='card') { await click('Switch view'); await evaluate(`document.querySelector('.flashcard').click()`); }
    const selector=mode==='book'?'.book-example':'.example';
    const text=await evaluate(`document.querySelector('${selector}').textContent`);
    assert.ok(text.includes("\u6545\u969c\uff08\u3053\u3057\u3087\u3046\uff09\u304c\u591a\uff08\u304a\u304a\uff09\u3044"));
    assert.equal(text.split("\u98db\u884c\u6a5f\uff08\u3072\u3053\u3046\u304d\uff09").length-1,2);
    await click('Toggle furigana');
    assert.ok(await evaluate(`document.querySelector('${selector}').textContent.includes("\u6545\u969c\u304c\u591a\u3044")`));
    assert.equal(await evaluate(`document.querySelector('${selector}').textContent.includes('\uff08')`),false);
    await click('Toggle kanji');
    assert.ok(await evaluate(`document.querySelector('${selector}').textContent.includes("\u3053\u3057\u3087\u3046\u304c\u304a\u304a\u3044")`));
    await click('Toggle kanji'); await click('Toggle furigana');
  }
  console.log('PASS: actual vocabulary book and flashcard render complete readings, furigana OFF and kana-only mode.');
} finally {socket?.close();chrome.kill();await server.close();}
