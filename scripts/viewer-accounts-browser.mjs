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
      res.end(await server.transformIndexHtml('/__practice-check', `<html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><div id="root"></div><script type="module">import React from 'react';import{createRoot}from'react-dom/client';import ViewerAccountDialog from '/src/ViewerAccountDialog.jsx';import '/src/app.css';import '/src/design.css';function Check(){const[mode,setMode]=React.useState(null);return React.createElement(React.Fragment,null,React.createElement('button',{onClick:()=>setMode('edit')},'Edit'),React.createElement('button',{onClick:()=>setMode('delete')},'Delete'),mode&&React.createElement(ViewerAccountDialog,{key:mode,user:{uid:'fixture-user',username:'fixture'},mode,onClose:()=>setMode(null),onSaved:()=>setMode(null)}));}window.alert=window.confirm=window.prompt=()=>{throw Error('Native dialogs are forbidden')};createRoot(document.getElementById('root')).render(React.createElement(Check));</script></body></html>`));
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
  await click('Edit');
  await until(`document.querySelector('dialog')?.open`);
  assert.equal(await evaluate(`document.querySelector('dialog').matches(':modal')`),true);
  assert.equal(await evaluate(`document.querySelector('input[type=password]').value`),'');
  assert.equal(await evaluate(`document.querySelector('input[type=password]').required`),false);
  assert.equal(await evaluate(`document.activeElement.tagName`),'INPUT');
  await click('Cancel');
  await until(`document.querySelector('dialog') === null`);
  await click('Delete');
  await until(`document.querySelector('dialog')?.open`);
  assert.equal(await evaluate(`document.querySelector('button[type=submit]').disabled`),true);
  assert.ok(await evaluate(`document.querySelector('dialog').textContent.includes('all mock exam records')`));
  await evaluate(`Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(document.querySelector('dialog input'),'fixture');document.querySelector('dialog input').dispatchEvent(new Event('input',{bubbles:true}))`);
  await until(`!document.querySelector('button[type=submit]').disabled`);
  for(const width of [1440,768,393,360]){
    await cdp('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<600});
    assert.ok(await evaluate(`document.querySelector('dialog').getBoundingClientRect().width<=innerWidth`),`Modal fits at ${width}px`);
  }
  await cdp('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
  await cdp('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
  await until(`document.querySelector('dialog') === null`);
  console.log('PASS: Edit/Delete use actual modal dialogs, focus inputs, keep blank passwords optional, require username confirmation, support Escape/cancel, and fit mobile/desktop screens.');
} finally {socket?.close();chrome.kill();await server.close();}
