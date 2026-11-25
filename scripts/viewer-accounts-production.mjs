// Production integration check using disposable accounts only; no credentials logged.
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import { randomBytes } from 'node:crypto';
const cliDirectory=process.argv[2];
if(!cliDirectory)throw new Error('Pass the installed firebase-tools directory.');
const require=createRequire(path.resolve(cliDirectory,'package.json'));
const cli=require(path.resolve(cliDirectory,'lib/auth.js'));
const account=cli.getGlobalDefaultAccount();
const tokens=account.tokens.access_token&&account.tokens.expires_at>Date.now()+60000?account.tokens:await cli.getAccessToken(account.tokens.refresh_token,account.tokens.scopes);
const config=await fs.readFile(new URL('../src/firebase.js',import.meta.url),'utf8');
const apiKey=config.match(/apiKey:\s*"([^"]+)"/)[1];
const dbOrigin='https://akkh-jlpt-default-rtdb.asia-southeast1.firebasedatabase.app';
const site='https://japanese-study-akkh.vercel.app';
const records=[];
async function identity(action,body,admin=false){
 const url=admin?`https://identitytoolkit.googleapis.com/v1/projects/akkh-jlpt/accounts:${action}`:`https://identitytoolkit.googleapis.com/v1/accounts:${action}?key=${apiKey}`;
 const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json',...(admin?{Authorization:`Bearer ${tokens.access_token}`}:{})},body:JSON.stringify(body)});
 const result=await response.json();return {status:response.status,result};
}
async function db(location,method='GET',body){
 const response=await fetch(`${dbOrigin}/${location}.json`,{method,headers:{Authorization:`Bearer ${tokens.access_token}`,'Content-Type':'application/json'},...(body!==undefined?{body:JSON.stringify(body)}:{})});
 assert.ok(response.ok,`Database check failed: ${response.status}`);return response.json();
}
async function create(username){
 const password=randomBytes(20).toString('base64url');
 const {status,result}=await identity('signUp',{email:`${username}@users.akkh-jlpt.invalid`,password,returnSecureToken:true});
 assert.equal(status,200,'Disposable account creation failed');records.push(result.localId);
 await db(`practiceUsers/${result.localId}`,'PUT',{username,active:true,createdAt:Date.now(),createdBy:'viewer-management-integration-check'});
 return {uid:result.localId,token:result.idToken,password,username};
}
async function endpoint(method,body,token){
 const response=await fetch(`${site}/api/viewer-accounts`,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify(body)});
 const text=await response.text();let result;try{result=JSON.parse(text);}catch{throw new Error(`Endpoint returned HTTP ${response.status}, not JSON`);}
 return {status:response.status,result};
}
try{
 assert.equal((await endpoint('PATCH',{uid:'none',username:'none'})).status,401);
 const suffix=randomBytes(5).toString('hex');
 const manager=await create(`qa_mgr_${suffix}`);const viewer=await create(`qa_user_${suffix}`);
 assert.equal((await endpoint('PATCH',{uid:viewer.uid,username:viewer.username},viewer.token)).status,403);
 await db(`practiceAdmins/${manager.uid}`,'PUT',true);
 const record={examId:'qa',examTitle:'Disposable integration check',completedAt:Date.now(),correct:1,total:1,scores:{Kanji:{correct:1,total:1},Vocabulary:{correct:0,total:0},Grammar:{correct:0,total:0},Reading:{correct:0,total:0}}};
 await db(`mockExamRecords/${viewer.uid}/integration-check`,'PUT',record);
 await db(`practiceSessions/${viewer.uid}/slots/0`,'PUT',{sessionId:'integration-check',startedAt:Date.now(),device:'browser'});
 const renamed=`qa_new_${suffix}`;const newPassword=randomBytes(20).toString('base64url');
 const edited=await endpoint('PATCH',{uid:viewer.uid,username:renamed,password:newPassword},manager.token);
 assert.equal(edited.status,200,`Editing failed: ${edited.result.error}`);
 const login=await identity('signInWithPassword',{email:`${renamed}@users.akkh-jlpt.invalid`,password:newPassword,returnSecureToken:true});assert.equal(login.status,200,'Updated login failed');assert.equal(login.result.localId,viewer.uid);
 assert.notEqual((await identity('signInWithPassword',{email:`${viewer.username}@users.akkh-jlpt.invalid`,password:viewer.password,returnSecureToken:true})).status,200,'Old login should stop working');
 assert.equal((await db(`practiceUsers/${viewer.uid}`)).username,renamed);assert.deepEqual(await db(`mockExamRecords/${viewer.uid}/integration-check`),record);
 const passwordUnchanged=await endpoint('PATCH',{uid:viewer.uid,username:renamed,password:''},manager.token);assert.equal(passwordUnchanged.status,200);
 assert.equal((await identity('signInWithPassword',{email:`${renamed}@users.akkh-jlpt.invalid`,password:newPassword,returnSecureToken:true})).status,200);
 assert.equal((await endpoint('PATCH',{uid:viewer.uid,username:manager.username},manager.token)).status,409,'Duplicate username rejected');
 const deleted=await endpoint('DELETE',{uid:viewer.uid},manager.token);assert.equal(deleted.status,200,`Deletion failed: ${deleted.result.error}`);
 for(const location of ['practiceUsers','practiceSessions','mockExamRecords']) assert.equal(await db(`${location}/${viewer.uid}`),null,`${location} removed`);
 const lookup=await identity('lookup',{localId:[viewer.uid]},true);assert.equal(lookup.status,200);assert.equal(lookup.result.users?.length||0,0);
 console.log('PASS: production rejects unauthorized users, edits username/password with the same UID, preserves exam history, keeps blank passwords unchanged, rejects duplicates, and permanently deletes Auth/profile/sessions/history.');
}finally{
 for(const uid of records){
  const deleted=await identity('delete',{localId:uid},true);
  if(deleted.status!==200&&!/USER_NOT_FOUND/.test(deleted.result.error?.message||''))throw new Error('Disposable Auth account cleanup failed.');
  for(const location of ['practiceAdmins','practiceUsers','practiceSessions','mockExamRecords'])await db(`${location}/${uid}`,'DELETE');
 }
 console.log('Disposable account cleanup complete.');
}
