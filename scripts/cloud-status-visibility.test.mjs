import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { transformWithOxc } from 'vite';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const source = fs.readFileSync(new URL('../src/CloudStatus.jsx', import.meta.url), 'utf8');
const { code } = await transformWithOxc(source, 'CloudStatus.jsx');
const compiled = code.replace(/from ["'](react(?:\/jsx-runtime)?)["']/g, (_, name) => `from ${JSON.stringify(import.meta.resolve(name))}`);
const { default: CloudStatus } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const base = { connected: true, loaded: true, message: '', error: '', level: 'n3', revision: 1 };
const render = cloud => renderToStaticMarkup(React.createElement(CloudStatus, { cloud: { ...base, ...cloud } }));

test('viewer accounts never see cloud account details or extra sign-out controls', () => {
  for (const providerId of ['password', 'google.com']) {
    assert.equal(render({ isEditor: false, user: { email: 'viewer@example.test', uid: 'viewer-id', providerData: [{ providerId }] } }), '');
  }
  assert.equal(render({ isEditor: true, user: { providerData: [{ providerId: 'password' }] } }), '');
  assert.equal(render({ isEditor: false, user: null }), '');
});

test('authorized Google editor keeps status and recovery actions, with one global sign-out location', () => {
  const html = render({ isEditor: true, user: { email: 'editor@gmail.com', providerData: [{ providerId: 'google.com' }] }, error: 'Offline', revision: 0, canEdit: true });
  assert.match(html, /editor@gmail.com/);
  assert.match(html, /Retry Connection/);
  assert.match(html, /Publish Previous Browser Edits/);
  assert.doesNotMatch(html, /Sign Out|Sign out|Firebase user ID|no editing permission/);
});
