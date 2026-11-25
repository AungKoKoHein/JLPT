import test from 'node:test';
import assert from 'node:assert/strict';
import { createViewerAccountHandler } from '../server/viewerAccounts.js';
import { validateAccountEdit } from '../server/viewerAccountValidation.js';
function setup({ manager = true, profileFailure = false, userMissing = false } = {}) {
  const uid = 'viewer-uid';
  const user = { uid, email: 'old@users.akkh-jlpt.invalid', providerData: [{ providerId: 'password' }] };
  const calls = [];
  const auth = {
    verifyIdToken: async () => ({ uid: 'manager-uid', auth_time: Date.now() / 1000 }),
    getUser: async () => { if (userMissing) throw Object.assign(new Error(), { code: 'auth/user-not-found' }); return user; },
    updateUser: async (id, data) => { calls.push({ action: 'auth-update', id, data }); },
    deleteUser: async id => { calls.push({ action: 'auth-delete', id }); },
  };
  const request = async (url, options = {}) => {
    const location = new URL(url).pathname;
    calls.push({ action: options.method || 'GET', location, body: options.body && JSON.parse(options.body) });
    if (location === '/editors/manager-uid.json') return Response.json(manager);
    if (location === '/practiceAdmins/manager-uid.json') return Response.json(false);
    if (options.method) return profileFailure ? Response.json({}, { status: 503 }) : Response.json(null);
    return Response.json({ username: 'old', active: true });
  };
  const handler = createViewerAccountHandler({ getAuth: () => auth, request });
  const run = async (method = 'PATCH', body = { uid, username: 'NEW', password: '' }, token = 'test-token') => {
    const response = { headers: {}, setHeader(k,v) { this.headers[k]=v; }, status(value) { this.code = value; return this; }, json(value) { this.body=value; return this; } };
    await handler({ method, headers: token ? { authorization: `Bearer ${token}` } : {}, body }, response);
    return response;
  };
  return { run, calls, user, auth };
}
test('rejects missing authentication, non-managers and unsupported methods before writes', async()=>{
  for(const config of [{token:''},{manager:false},{method:'GET'}]) {
    const {run,calls}=setup(config);const result=await run(config.method,undefined,config.token);
    assert.ok([401,403,405].includes(result.code)); assert.ok(calls.every(c=>c.action==='GET'));
  }
});
test('validates login fields and rejects unrequested profile or privilege fields',()=>{
  assert.deepEqual(validateAccountEdit({uid:'u',username:' New ',password:''},'PATCH'),{uid:'u',username:'new',password:''});
  for(const data of [{uid:'u',username:'bad/name'},{uid:'u',username:'new',password:'short'},{uid:'u',username:'new',admin:true},{uid:'../u',username:'new'}]) assert.throws(()=>validateAccountEdit(data,'PATCH'));
});
test('renames the same UID and keeps the password unchanged when blank',async()=>{
  const {run,calls}=setup();const result=await run();assert.equal(result.code,200);
  assert.deepEqual(calls.filter(c=>c.action==='auth-update'),[{action:'auth-update',id:'viewer-uid',data:{email:'new@users.akkh-jlpt.invalid'}}]);
  assert.ok(calls.some(c=>c.action==='PATCH'&&c.body.username==='new'));
});
test('changes the password only in Firebase Auth, never the profile or response',async()=>{
  const {run,calls}=setup();const result=await run('PATCH',{uid:'viewer-uid',username:'old',password:'secret123'});assert.equal(result.code,200);
  assert.deepEqual(calls.find(c=>c.action==='auth-update').data,{password:'secret123'});
  assert.ok(!JSON.stringify(calls.filter(c=>c.action==='PATCH')).includes('secret123'));
  assert.ok(!JSON.stringify(result.body).includes('secret123'));
});
test('rolls back a login rename if saving the account profile fails',async()=>{
  const {run,calls}=setup({profileFailure:true});assert.equal((await run()).code,503);
  assert.deepEqual(calls.filter(c=>c.action==='auth-update').map(c=>c.data.email),['new@users.akkh-jlpt.invalid','old@users.akkh-jlpt.invalid']);
});
test('protects Google accounts and the signed-in manager from edit and deletion',async()=>{
  for(const change of [user=>user.providerData=[{providerId:'google.com'}],user=>user.uid='manager-uid']) {
    const {run,calls,user}=setup();change(user);assert.equal((await run('DELETE',{uid:'viewer-uid'})).code,403);assert.ok(!calls.some(c=>c.action==='auth-delete'));
  }
});
test('permanent deletion removes Auth and atomically deletes profile, sessions and exam records',async()=>{
  const {run,calls}=setup();assert.equal((await run('DELETE',{uid:'viewer-uid'})).code,200);
  assert.ok(calls.some(c=>c.action==='auth-delete'));
  assert.deepEqual(calls.find(c=>c.action==='PATCH').body,{'practiceUsers/viewer-uid':null,'practiceSessions/viewer-uid':null,'mockExamRecords/viewer-uid':null});
});
test('retries record cleanup when the Auth account has already been deleted',async()=>{
  const {run,calls}=setup({userMissing:true});assert.equal((await run('DELETE',{uid:'viewer-uid'})).code,200);assert.ok(!calls.some(c=>c.action==='auth-delete'));assert.ok(calls.some(c=>c.action==='PATCH'));
});
