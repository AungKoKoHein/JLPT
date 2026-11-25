import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { createCloudUpdate, decodeSnapshot } from '../src/cloudContent.js';
import { replaceN2Kanji } from './n2KanjiReplacement.js';

const cliDirectory = process.argv[2];
if (!cliDirectory) throw Error('Pass the installed firebase-tools directory. Use --apply only after reviewing the preview.');
const require = createRequire(path.resolve(cliDirectory, 'package.json'));
const cliAuth = require(path.resolve(cliDirectory, 'lib/auth.js'));
const account = cliAuth.getGlobalDefaultAccount();
if (!account) throw Error('Sign in to the Firebase CLI first.');
const tokens = account.tokens.access_token && account.tokens.expires_at > Date.now() + 60000 ? account.tokens : await cliAuth.getAccessToken(account.tokens.refresh_token, account.tokens.scopes);
// This migration can write only this N2 content record, never rules or N3.
const url = 'https://akkh-jlpt-default-rtdb.asia-southeast1.firebasedatabase.app/jlpt/n2/content.json';
const request = async (options = {}) => {
  const response = await fetch(url, { ...options, headers: { Authorization: `Bearer ${tokens.access_token}`, ...options.headers }, signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw Error(`N2 content HTTP ${response.status}; stopped without retrying.`);
  return response;
};
const response = await request({ headers: { 'X-Firebase-ETag': 'true' } });
const original = await response.json();
const etag = response.headers.get('etag');
const { content, revision } = decodeSnapshot(original);
const catalog = JSON.parse(await fs.readFile(new URL('./n2-soumatome-catalog.json', import.meta.url), 'utf8'));
const next = replaceN2Kanji(content, catalog);
const backup = path.resolve('.migration-backups', `n2-kanji-${new Date().toISOString().replaceAll(':', '-')}`);
await fs.mkdir(backup, { recursive: true });
await fs.writeFile(path.join(backup, 'before.json'), JSON.stringify(original));
await fs.writeFile(path.join(backup, 'planned-content.json'), JSON.stringify(next));
console.log(JSON.stringify({ revision, previousKanjiCards: content.baselineKanjiChapters.reduce((n, c) => n + c.cards.length, 0) + content.kanjiCards.length, replacementKanjiCards: 739, chapters: 8, sections: 56, unchangedGrammarCards: next.cards.filter(c => c.studyTab === 'Grammar').length, backup }));
if (JSON.stringify(next) === JSON.stringify(content)) { console.log('Already imported; owner edits preserved.'); process.exit(0); }
if (!process.argv.includes('--apply')) { console.log('Read-only preview complete. No cloud content changed.'); process.exit(0); }
if (!etag) throw Error('Missing ETag; refusing an unprotected write.');
const update = createCloudUpdate(original, revision, next, 'firebase-cli-n2-soumatome-replacement', { '.sv': 'timestamp' });
await request({ method: 'PUT', headers: { 'Content-Type': 'application/json', 'if-match': etag }, body: JSON.stringify(update) });
const saved = await (await request()).json();
if (saved.payload !== update.payload || saved.revision !== revision + 1) throw Error(`Verification failed. Restore from backup if necessary: ${backup}`);
await fs.writeFile(path.join(backup, 'after.json'), JSON.stringify(saved));
console.log(`Verified N2 Kanji replacement at revision ${saved.revision}. Other study sections preserved.`);
