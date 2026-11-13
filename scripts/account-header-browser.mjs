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
        export function onAuthStateChanged(_auth, callback){window.restoreAuth=callback;return ()=>{};}
        export function ref(_db,path){return path;}
        export function onValue(path, callback){window.claimCallbacks||={};window.claimCallbacks[path]=callback;return ()=>{};}
        export async function getIdTokenResult(){return {claims:{auth_time:Math.floor(Date.now()/1000)}};}
        export async function get(){return {val:()=>({})};}
        export async function runTransaction(){await new Promise(resolve=>window.finishDevice=resolve);return {committed:true};}
        export async function signOut(){window.restoreAuth(null);}
        export async function signInWithEmailAndPassword(){} export async function signInWithPopup(){}
        export async function createUserWithEmailAndPassword(){} export async function deleteUser(){}
        export async function updateProfile(){} export async function set(){} export async function update(){}
      `;
const mainSource = fs.readFileSync(new URL('../src/main.jsx', import.meta.url), 'utf8');
const start = mainSource.indexOf('<header className="study-page-header">');
const header = mainSource.slice(start, mainSource.indexOf('</header>', start) + '</header>'.length);
const previewPath = path.resolve('.tmp-account-header-preview.jsx');
fs.writeFileSync(previewPath, `import React from 'react';import{StudyAccountControls}from'/src/StudyAccount.jsx';import{routesForLevel}from'/src/studyRoutes.js';export default function Preview(){const level='n3',studyTab='Reading',cloud={isEditor:false};return <main id="study-content">${header}</main>;}`);
const server = await createServer({ configFile: false, logLevel: 'error', plugins: [react(), {
  name: 'access-check-page',
  enforce: 'pre',
  resolveId(id) { if (id === '/__access-mock') return '\0access-mock'; },
  load(id) { if (id === '\0access-mock') return accessMock; },
  transform(code, id) {
    if (!id.replaceAll('\\', '/').endsWith('/src/StudyAccess.jsx')) return;
    return code.replaceAll('from "firebase/auth"', 'from "/__access-mock"').replaceAll('from "firebase/database"', 'from "/__access-mock"').replaceAll('from "./firebase.js"', 'from "/__access-mock"');
  },
  configureServer(server) {
    server.middlewares.use('/__practice-check' , async (_req, res) => {
      res.setHeader('Content-Type', 'text/html');
      res.end(await server.transformIndexHtml('/__practice-check', `<html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><div id="root"></div><script type="module">import React from 'react';import{createRoot}from'react-dom/client';import StudyAccess from '/src/StudyAccess.jsx';import Preview from '/.tmp-account-header-preview.jsx';import '/src/app.css';createRoot(document.getElementById('root')).render(React.createElement(StudyAccess,null,React.createElement(Preview)));</script></body></html>`));
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
  assert.equal(await evaluate(`document.querySelector('.study-access-bar')`), null, 'No separate account strip');
  assert.equal(await evaluate(`document.querySelectorAll('.study-signout-button').length`), 1);
  assert.ok(await evaluate(`document.querySelector('.study-page-header').contains(document.querySelector('.study-signout-button'))`));
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('.study-signout-button')).backgroundColor`), 'rgb(40, 124, 101)');
  for (const width of [1440,800,393,320]) {
    await cdp('Emulation.setDeviceMetricsOverride', {width,height:900,deviceScaleFactor:1,mobile:width<600});
    await new Promise(resolve=>setTimeout(resolve,120));
    assert.ok(await evaluate(`document.documentElement.scrollWidth<=document.documentElement.clientWidth`), `Overflow at ${width}`);
    const screenshot = await cdp('Page.captureScreenshot', {format:'png'});
    fs.writeFileSync(new URL(`../.tmp-python/account-${width}.png`,import.meta.url),Buffer.from(screenshot.data,'base64'));
  }
  await evaluate(`window.claimCallbacks['practiceUsers/viewer']({val:()=>({active:true,username:'a_very_long_account_name_that_should_fit'})})`);
  await new Promise(resolve=>setTimeout(resolve,100));
  assert.ok(await evaluate(`document.documentElement.scrollWidth<=document.documentElement.clientWidth`),'Long names fit phone');
  await evaluate(`document.querySelector('.study-signout-button').click()`);
  await until(`document.querySelector('.study-access-form') !== null`);
  assert.equal(await evaluate(`document.querySelector('#study-content')`), null);
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('.study-access-form button')).backgroundColor`), 'rgb(40, 124, 101)');
  assert.ok(await evaluate(`document.documentElement.scrollWidth<=document.documentElement.clientWidth`),'Login fits phone');
  const loginShot=await cdp('Page.captureScreenshot',{format:'png'});
  fs.writeFileSync(new URL('../.tmp-python/account-login.png',import.meta.url),Buffer.from(loginShot.data,'base64'));
  console.log('PASS: account controls inside title, green buttons, long usernames, sign out, session restoration, and desktop/tablet/phone layouts.');
} finally {socket?.close();chrome.kill();await server.close();fs.unlinkSync(previewPath);}
