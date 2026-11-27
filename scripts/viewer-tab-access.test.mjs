import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {canViewTab,canViewPath,effectiveTabAccess,permittedTabs,validateTabAccess,viewerTabGroups} from '../src/viewerTabAccess.js';
import {validateAccountEdit} from '../server/viewerAccountValidation.js';

test('legacy viewers retain access, explicit restrictions are subject-specific, and malformed policies fail closed',()=> {
  assert.equal(permittedTabs(undefined).length,17);
  const access={mode:'selected',tabs:{'n3-listening':true,'aws-part-3':true,'n3-vocab':false}};
  assert.deepEqual(permittedTabs(access).map(tab=>tab.path),['/n3/listening','/aws/part-3']);
  assert.equal(canViewTab(access,'n3','Listening'),true);
  assert.equal(canViewTab(access,'n2','Vocab'),false);
  assert.equal(canViewTab(access,'aws','Part 4'),false);
  assert.equal(canViewPath(access,'/n3/listening/'),true);
  assert.equal(canViewPath(access,'/n3/vocab'),false);
  assert.equal(canViewPath(access,'/aws/part-3'),true);
  assert.equal(canViewPath(access,'/aws/part-4'),false);
  assert.equal(permittedTabs({mode:'selected'}).length,0);
  for(const malformed of [false,[],{mode:'unknown'},{mode:'selected',tabs:{'n3-vocab':'true'}},{mode:'all',admin:true}]) {
    assert.throws(()=>validateTabAccess(malformed));
    assert.deepEqual(effectiveTabAccess(malformed),{mode:'selected',tabs:{}});
  }
});

test('edit validation accepts only known boolean tab keys and does not accept privilege changes',()=> {
  const base={uid:'viewer',username:'test'};
  assert.deepEqual(validateAccountEdit({...base,tabAccess:{mode:'selected',tabs:{'n3-grammar':true}}},'PATCH').tabAccess,{mode:'selected',tabs:{'n3-grammar':true}});
  for(const tabAccess of [{mode:'selected',tabs:{admin:true}},{mode:'selected',tabs:{'n3-vocab':1}},{mode:'selected',tabs:['n3-vocab']},{mode:'all',editor:true}]) assert.throws(()=>validateAccountEdit({...base,tabAccess},'PATCH'));
});

test('database profile rules keep tab permissions manager-writable and validate every known tab key',()=> {
  const rules=JSON.parse(fs.readFileSync('database.rules.json','utf8')).rules.practiceUsers.$uid;
  assert.match(rules['.write'],/editors/);assert.match(rules['.write'],/practiceAdmins/);
  assert.doesNotMatch(rules['.write'],/auth\.uid === \$uid/);
  assert.equal(rules.tabAccess.$other['.validate'],false);
  for(const group of viewerTabGroups) for(const tab of group.tabs) assert.ok(rules.tabAccess.tabs.$tab['.validate'].includes(`'${tab.key}'`));
  assert.match(rules.tabAccess.tabs.$tab['.validate'],/isBoolean/);
});
