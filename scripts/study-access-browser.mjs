import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';

// Exercise the real practice components independently of account sign-in.
const profile = fs.mkdtempSync(path.resolve('node_modules/.cache/practice-chrome-'));
const accessMock = `
        export const auth={},database={},googleProvider={},practiceProvisioningAuth={};
        export function onAuthStateChanged(_auth, callback){window.restoreAuth=user=>{auth.currentUser=user;callback(user);};return ()=>{};}
        export function ref(_db,path){return path;}
        export function onValue(path, callback){window.claimCallbacks||={};window.claimCallbacks[path]=callback;return ()=>{};}
        export async function getIdTokenResult(){return {claims:{auth_time:Math.floor(Date.now()/1000)}};}
        export async function get(){return {val:()=>({})};}
        export async function runTransaction(){await new Promise(resolve=>window.finishDevice=resolve);return {committed:true};}
        export async function signOut(){window.restoreAuth(null);}
        export async function signInWithEmailAndPassword(){} export async function signInWithPopup(){}
        export async function createUserWithEmailAndPassword(){} export async function deleteUser(){}
        export async function updateProfile(){} export async function set(){} export async function update(path,value){window.accountWrites||=[];window.accountWrites.push({path,value});}
      `;
const server = await createServer({ configFile: false, logLevel: 'error', plugins: [react(), {
  name: 'access-check-page',
  enforce: 'pre',
  resolveId(id) { if (id === '/__access-mock') return '\0access-mock'; },
  load(id) { if (id === '\0access-mock') return accessMock; },
  transform(code, id) {
    if (!['StudyAccess.jsx','ViewerAccountDialog.jsx'].some(name=>id.replaceAll('\\', '/').endsWith(`/src/${name}`))) return;
    return code.replaceAll('from "firebase/auth"', 'from "/__access-mock"').replaceAll('from "firebase/database"', 'from "/__access-mock"').replaceAll('from "./firebase.js"', 'from "/__access-mock"').replaceAll("from './firebase.js'",'from "/__access-mock"').replaceAll("from 'firebase/database'",'from "/__access-mock"');
  },
  configureServer(server) {
    server.middlewares.use('/__practice-check' , async (_req, res) => {
      res.setHeader('Content-Type', 'text/html');
      res.end(await server.transformIndexHtml('/__practice-check', `<html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><div id="root"></div><script type="module">import React from 'react';import{createRoot}from'react-dom/client';import StudyAccess from '/src/StudyAccess.jsx';import{StudyAccountControls}from'/src/StudyAccount.jsx';import '/src/app.css';import '/src/design.css';createRoot(document.getElementById('root')).render(React.createElement(StudyAccess,null,React.createElement('div',{id:'study-content'},'Study page',React.createElement(StudyAccountControls))));</script></body></html>`));
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
  await until(`typeof window.restoreAuth==='function'`);
  const isLoading=()=>evaluate(`!!document.querySelector('[role="status"]') && !document.querySelector('.study-access-form')`);
  assert.ok(await isLoading(), 'Wait for auth restoration instead of flashing login');
  await evaluate(`window.restoreAuth({uid:'viewer',email:'viewer@example.test'})`);
  await until(`window.claimCallbacks?.['practiceUsers/viewer']`);
  assert.ok(await isLoading(), 'Wait for restored account permissions');
  await evaluate(`window.claimCallbacks['practiceUsers/viewer']({val:()=>({active:true,username:'viewer'})});window.claimCallbacks['editors/viewer']({val:()=>false});window.claimCallbacks['practiceAdmins/viewer']({val:()=>false})`);
  await until(`typeof window.finishDevice==='function'`);
  assert.ok(await isLoading(), 'Wait for device validation without displaying access denied');
  await evaluate(`window.finishDevice()`);
  await until(`document.querySelector('#study-content') !== null`);
  assert.equal(await evaluate(`document.querySelector('.study-access-form')`), null);
  await evaluate(`window.claimCallbacks['practiceUsers/viewer']({val:()=>({active:true,username:'viewer',tabAccess:{mode:'selected',tabs:{'n3-listening':true}}})})`);
  await until(`document.querySelector('.study-tab-restricted')!==null`);
  assert.deepEqual(await evaluate(`[...document.querySelectorAll('.study-tab-restricted nav a')].map(a=>a.getAttribute('href'))`),['/n3/listening']);
  await evaluate(`history.pushState(null,'','/n3/listening');window.dispatchEvent(new Event('study-navigation'))`);
  await until(`document.querySelector('#study-content')!==null`);
  await evaluate(`history.pushState(null,'','/n3/grammar');window.dispatchEvent(new PopStateEvent('popstate'))`);
  await until(`document.querySelector('.study-tab-restricted')!==null`);
  assert.equal(await evaluate(`document.querySelector('#study-content')`),null,'Direct URLs cannot mount an unassigned tab');
  await evaluate(`window.claimCallbacks['practiceUsers/viewer']({val:()=>({active:true,username:'viewer',tabAccess:{mode:'selected',tabs:{'aws-part-3':true}}})});history.pushState(null,'','/aws/part-3');window.dispatchEvent(new Event('study-navigation'))`);
  await until(`document.querySelector('#study-content')!==null`);
  await evaluate(`window.claimCallbacks['practiceUsers/viewer']({val:()=>({active:true,username:'viewer',tabAccess:{mode:'selected'}})})`);
  await until(`document.querySelector('.study-tab-restricted')!==null`);
  assert.equal(await evaluate(`document.querySelectorAll('.study-tab-restricted nav a').length`),0,'No selected tabs means no app access');
  await evaluate(`window.claimCallbacks['editors/viewer']({val:()=>true})`);
  await until(`document.querySelector('#study-content')!==null`);
  await click('Manage viewer accounts');
  await until(`document.querySelector('.viewer-manager-modal')?.open`);
  assert.equal(await evaluate(`document.body.style.overflow`),'hidden');
  await until(`typeof window.claimCallbacks['practiceUsers']==='function'`);
  await evaluate(`window.claimCallbacks['practiceUsers']({val:()=>({'fixture-user':{username:'fixture',active:true,createdAt:1,createdBy:'manager'}})})`);
  await until(`document.querySelector('.practice-user-table tbody tr')!==null`);
  assert.ok(await evaluate(`document.querySelector('.viewer-access-summary').textContent==='All tabs'`),'Existing viewers retain all tabs');
  await click('Tab access');
  await until(`document.querySelector('.viewer-account-dialog')?.open`);
  await evaluate(`[...document.querySelectorAll('.viewer-account-dialog label')].find(label=>label.textContent.trim()==='Selected tabs only').querySelector('input').click()`);
  await evaluate(`[...document.querySelectorAll('.viewer-account-dialog .viewer-tab-group:first-child label')].find(label=>label.textContent.trim()==='Listening').querySelector('input').click()`);
  await click('Save changes');
  await until(`document.querySelector('.viewer-account-dialog')===null`);
  assert.deepEqual(await evaluate(`window.accountWrites.at(-1).value.tabAccess`),{mode:'selected',tabs:{'n3-listening':true}});
  await evaluate(`window.claimCallbacks['practiceUsers']({val:()=>({'fixture-user':{username:'fixture',active:true,tabAccess:window.accountWrites.at(-1).value.tabAccess}})})`);
  await until(`document.querySelector('.viewer-access-summary').textContent==='JLPT N3: Listening'`);
  assert.equal(await evaluate(`document.querySelector('.viewer-manager-modal').open`),true,'Closing nested access dialog keeps manager open');
  for(const width of [1440,768,393,360]) {
    await cdp('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<600});
    await evaluate(`new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))`);
    assert.ok(await evaluate(`document.querySelector('.viewer-manager-modal').getBoundingClientRect().width<=innerWidth`));
    assert.ok(await evaluate(`document.querySelector('.viewer-manager-modal').scrollWidth<=document.querySelector('.viewer-manager-modal').clientWidth+1`),'Manager content fits');
    await cdp('Page.captureScreenshot',{format:'png'}).then(({data})=>fs.writeFileSync(path.resolve(`.tmp-python/viewer-manager-${width}.png`),Buffer.from(data,'base64')));
  }
  await click('Close');
  await until(`document.querySelector('.viewer-manager-modal')===null`);
  assert.equal(await evaluate(`document.body.style.overflow`),'');
  assert.equal(await evaluate(`document.activeElement.textContent`),'Manage viewer accounts');
  await evaluate(`window.claimCallbacks['editors/viewer']({val:()=>false});window.claimCallbacks['practiceUsers/viewer']({val:()=>({active:true,username:'viewer'})})`);
  await until(`document.querySelector('#study-content')!==null`);
  await evaluate(`window.restoreAuth(null)`);
  await until(`document.querySelector('.study-access-form') !== null`);
  assert.equal(await evaluate(`document.querySelector('#study-content')`), null);
  console.log('PASS: auth restoration, device validation, live tab permissions, blocked direct URLs, empty access, editor bypass, manager modal, nested access editing, saved settings and mobile layouts.');
} finally {socket?.close();chrome.kill();await server.close();}
