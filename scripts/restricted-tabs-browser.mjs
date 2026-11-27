import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';

// Exercise the actual Listening component independently of account sign-in.
// Render the actual app with viewer policies and read-only local content fixtures.
const profile = fs.mkdtempSync(path.resolve('node_modules/.cache/tab-access-chrome-'));
const server = await createServer({configFile:false,logLevel:'error',plugins:[react(),{
 name:'restricted-app-check',enforce:'pre',
 resolveId(id){if(id==='/__cloud')return '\0cloud';if(id==='/__db')return '\0db';},
 load(id){
  if(id==='\0cloud')return `import{normalizeContent}from'/src/cloudContent.js';import n3 from'/migrations/n3-catalog.json';import n2 from'/migrations/n2-soumatome-catalog.json';const content={n3:normalizeContent(n3),n2:normalizeContent(n2)};export function useCloudContent(level){return {content:content[level],loaded:true,connected:true,isEditor:false,canEdit:false,updateContent:()=>{},user:null};}`;
  if(id==='\0db')return `export const getDatabase=()=>({});export const ref=(_db,path)=>path;export function onValue(_ref,cb){cb({val:()=>null,exists:()=>false});return ()=>{};}export async function get(){return {val:()=>null};}export async function set(){}export async function remove(){}export async function update(){}export function push(){return 'test';}export async function runTransaction(){return {committed:true};}`;
 },
 transform(code,id){
  if(id.includes('/src/main.jsx')&&id.includes('restricted-check')){const end=code.lastIndexOf('createRoot(document.getElementById("root")).render(');return code.slice(0,end).replace('"./useCloudContent.js"','"/__cloud"')+'export {App};';}
  if(id.includes('/src/'))return code.replace(/from (["'])firebase\/database\1/g,'from "/__db"');
 },
 configureServer(server){server.middlewares.use('/__restricted-check',async(_req,res)=>{
  res.setHeader('Content-Type','text/html');res.end(await server.transformIndexHtml('/__restricted-check',`<html><body><div id="root"></div><script type="module">
import React from'react';import{createRoot}from'react-dom/client';import{App}from'/src/main.jsx?restricted-check';import AwsApp from'/src/AwsApp.jsx';import{StudyAccountContext}from'/src/StudyAccount.jsx';import{canViewTab}from'/src/viewerTabAccess.js';
const params=new URLSearchParams(location.search),level=params.get('level'),path=params.get('path'),tabs=params.get('tabs').split(',');history.replaceState(null,'',path);const policy={mode:'selected',tabs:Object.fromEntries(tabs.map(key=>[key,true]))};const account={uid:'test-viewer',username:'test-viewer',canViewTab:(l,t)=>canViewTab(policy,l,t),logout:()=>{}};createRoot(document.getElementById('root')).render(React.createElement(StudyAccountContext.Provider,{value:account},React.createElement(level==='aws'?AwsApp:App,{level})));
</script></body></html>`));});}
}],server:{host:'127.0.0.1',port:0}});
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
  const errors=[];socket.addEventListener('message',({data})=>{const msg=JSON.parse(data);if(msg.method==='Runtime.exceptionThrown')errors.push(msg.params.exceptionDetails);});
  await cdp('Runtime.enable');
  const {viewerTabGroups}=await import('../src/viewerTabAccess.js');
  for(const group of viewerTabGroups) for(const tab of group.tabs){
    const url=`http://127.0.0.1:${server.config.server.port}/__restricted-check?${new URLSearchParams({level:group.level,path:tab.path,tabs:tab.key})}`;
    await cdp('Page.navigate',{url});
    await until(`document.querySelector('[role="tab"][aria-selected="true"]')!==null`);
    const details=await evaluate(`(()=>{const tab=document.querySelector('[role="tab"][aria-selected="true"]');const panel=document.getElementById(tab.getAttribute('aria-controls'));return {label:tab.textContent.trim(),panels:document.querySelectorAll('#'+tab.getAttribute('aria-controls')).length,visible:!!panel&&!panel.hidden,text:panel?.textContent.trim().length,tabs:[...document.querySelectorAll('.study-tabs [role="tab"]')].map(t=>t.textContent.trim())}})()`);
    assert.equal(details.label,tab.label,JSON.stringify({tab,details}));
    assert.equal(details.panels,1,tab.key+' has exactly one linked panel');
    assert.ok(details.visible&&details.text>20,tab.key+' has visible content');
    if(group.level!=='aws')assert.deepEqual(details.tabs,[tab.label]);
    if(tab.label==='Kanji')assert.ok(await evaluate(`document.querySelectorAll('.kanji-study-card,.kanji-card').length>0`),tab.key+' renders actual Kanji');
    console.log('PASS:',tab.key);
  }
  for(const [level,labels] of [['n3',['Kanji','Listening']],['n3',['Grammar','Kanji','Mock exam']],['n2',['Kanji','Mock exam']],['aws',['Part 3','Practice']],...viewerTabGroups.map(g=>[g.level,g.tabs.map(t=>t.label)])]) {
    const group=viewerTabGroups.find(g=>g.level===level);
    const allowed=group.tabs.filter(t=>labels.includes(t.label));
    const url=`http://127.0.0.1:${server.config.server.port}/__restricted-check?${new URLSearchParams({level,path:allowed[0].path,tabs:allowed.map(t=>t.key).join(',')})}`;
    await cdp('Page.navigate',{url});
    await until(`document.querySelectorAll('.study-tabs [role="tab"]').length===${allowed.length}`);
    assert.deepEqual(await evaluate(`[...document.querySelectorAll('.study-tabs [role="tab"]')].map(t=>t.textContent.trim())`),allowed.map(t=>t.label));
    for(const [index,tab] of allowed.entries()) {
      await evaluate(`document.querySelectorAll('.study-tabs [role="tab"]')[${index}].click()`);
      await until(`document.querySelectorAll('.study-tabs [role="tab"]')[${index}].getAttribute('aria-selected')==='true'`);
      assert.ok(await evaluate(`(()=>{const tab=document.querySelector('.study-tabs [aria-selected="true"]');const id=tab.getAttribute('aria-controls');const panel=document.getElementById(id);return document.querySelectorAll('#'+id).length===1&&panel&&!panel.hidden&&panel.textContent.trim().length>20&&location.pathname==='${tab.path}'})()`),`${level}: ${labels.join(',')} -> ${tab.label}`);
    }
    await evaluate(`document.querySelector('.study-tabs [aria-selected="true"]').dispatchEvent(new KeyboardEvent('keydown',{key:'Home',bubbles:true}))`);
    await until(`document.querySelector('.study-tabs [aria-selected="true"]').textContent.trim()===${JSON.stringify(allowed[0].label)}`);
  }
  console.log('PASS: mixed permissions, full access, tab changes, panel IDs and keyboard navigation.');
  assert.deepEqual(errors,[],'No app rendering errors for any restricted tab');
  console.log('PASS: all 17 single-tab viewer policies render visible content with correct panel links.');
} finally {socket?.close();chrome.kill();await server.close();}
