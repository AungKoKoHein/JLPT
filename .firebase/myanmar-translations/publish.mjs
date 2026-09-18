import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import {isDeepStrictEqual} from 'node:util';
import assert from 'node:assert/strict';
import {decodeSnapshot,normalizeContent} from '../../src/cloudContent.js';
import './validate.mjs';

// Use the installed Firebase CLI's authenticated session. Never print or persist tokens.
const cliRoot=process.env.JLPT_FIREBASE_CLI_ROOT;
assert(cliRoot,'Set JLPT_FIREBASE_CLI_ROOT to the installed firebase-tools directory.');
const require=createRequire(import.meta.url);
const {configstore}=require(`${cliRoot}/lib/configstore.js`);
const {requireAuth}=require(`${cliRoot}/lib/requireAuth.js`);
const {getAccessToken}=require(`${cliRoot}/lib/apiv2.js`);
const user=configstore.get('user');
await requireAuth({project:'akkh-jlpt',user,tokens:configstore.get('tokens'),nonInteractive:true});
const token=await getAccessToken();
const headers={Authorization:`Bearer ${token}`,'Content-Type':'application/json'};
const request=async(url,options={})=>{
  const response=await fetch(url,{...options,headers:{...headers,...options.headers}});
  if(!response.ok)throw Error(`Firebase request failed with HTTP ${response.status}${response.status===412?' (concurrent edit; nothing overwritten)':''}`);
  return response;
};
const permissionResponse=await request('https://cloudresourcemanager.googleapis.com/v1/projects/akkh-jlpt:testIamPermissions',{
  method:'POST',body:JSON.stringify({permissions:['firebasedatabase.instances.get','firebasedatabase.instances.update']})
});
const permissions=(await permissionResponse.json()).permissions??[];
assert(permissions.includes('firebasedatabase.instances.update'),'The signed-in account does not have database write access.');
const folder=new URL('./',import.meta.url);
const baseline=decodeSnapshot(JSON.parse(await readFile(new URL('before.json',folder),'utf8'))).content;
const prepared=normalizeContent(JSON.parse(await readFile(new URL('prepared-content.json',folder),'utf8')));
const url='https://akkh-jlpt-default-rtdb.asia-southeast1.firebasedatabase.app/jlpt/content.json';
const response=await request(url,{headers:{'X-Firebase-ETag':'true'}});
const etag=response.headers.get('etag');
assert(etag,'Firebase did not return an ETag; cannot safely publish.');
const currentSnapshot=await response.json();
const current=decodeSnapshot(currentSnapshot);
const merged=structuredClone(current.content);
let changes=0;
for(const field of ['cardOverrides','exerciseOverrides'])for(const[id,record]of Object.entries(prepared[field])){
  if(isDeepStrictEqual(record,baseline[field][id]))continue;
  assert(!id.startsWith('part-1-chapter-1:'),'Do not change Chapter 1.');
  assert(/^part-[12]-chapter-\d+:(card|exercise):\d+$/.test(id),'Unexpected record ID.');
  const deletedField=field==='cardOverrides'?'deletedCards':'deletedExercises';
  assert(!current.content[deletedField].includes(id),`Record deleted while preparing: ${id}`);
  for(const[key,value]of Object.entries(record)){
    if(isDeepStrictEqual(value,baseline[field][id]?.[key]))continue;
    assert(['exampleJapanese','exampleMyanmar','term','question','answer','questionMyanmar','answerMyanmar'].includes(key),'Unexpected field '+key);
    const live=current.content[field][id]?.[key];
    assert(isDeepStrictEqual(live,baseline[field][id]?.[key])||isDeepStrictEqual(live,value),`Conflicting edit: ${id}.${key}`);
    merged[field][id]={...merged[field][id],[key]:value};
    if(!isDeepStrictEqual(live,value))changes++;
  }
}
normalizeContent(merged);
console.log(JSON.stringify({writeAccess:true,currentRevision:current.revision,changedFields:changes,mode:process.argv.includes('--apply')?'publish':'check'}));
if(!process.argv.includes('--apply')||changes===0)process.exit(0);
await writeFile(new URL(`pre-publish-revision-${current.revision}.json`,folder),JSON.stringify(currentSnapshot,null,2)+'\n');
const nextSnapshot={schemaVersion:1,revision:current.revision+1,payload:JSON.stringify(merged),updatedBy:`firebase-cli:${user.email}`,updatedAt:{'.sv':'timestamp'}};
await request(url,{method:'PUT',headers:{'if-match':etag},body:JSON.stringify(nextSnapshot)});
// A public read checks the same snapshot that the website receives.
const publicResponse=await fetch(url,{headers:{'Cache-Control':'no-cache'}});
assert(publicResponse.ok,'Readback failed.');
const savedSnapshot=await publicResponse.json();
const saved=decodeSnapshot(savedSnapshot);
assert(saved.revision>=nextSnapshot.revision,'Saved revision is missing.');
for(const field of ['cardOverrides','exerciseOverrides'])for(const[id,record]of Object.entries(merged[field]))assert.deepEqual(saved.content[field][id],record,`Readback mismatch: ${id}`);
for(const field of Object.keys(current.content))if(!['cardOverrides','exerciseOverrides'].includes(field))assert.deepEqual(saved.content[field],current.content[field],field);
await writeFile(new URL('published.json',folder),JSON.stringify(savedSnapshot,null,2)+'\n');
await writeFile(new URL('publish-result.json',folder),JSON.stringify({revision:saved.revision,changedFields:changes,verified:true,publishedAt:savedSnapshot.updatedAt},null,2)+'\n');
console.log(JSON.stringify({published:true,revision:saved.revision,verified:true}));
