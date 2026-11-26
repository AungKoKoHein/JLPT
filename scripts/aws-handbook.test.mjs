import test from 'node:test';
import assert from 'node:assert/strict';
import { awsChapters } from '../src/awsChapters.js';

test('Part 1 has exactly nine complete chapters in handbook order', () => {
  assert.deepEqual(awsChapters.map(chapter => chapter.id), [1,2,3,4,5,6,7,8,9]);
  assert.deepEqual(awsChapters[0].pages, [2,26]);
  assert.deepEqual(awsChapters.at(-1).pages, [259,286]);
  for (let i=1; i<awsChapters.length; i++) assert.equal(awsChapters[i].pages[0], awsChapters[i-1].pages[1]+1);
});

test('All chapters have foundations, detailed explanations, comparison tables and Japanese section notes', () => {
  for (const chapter of awsChapters) {
    const blocks = chapter.blocks;
    assert.ok(blocks.length >= 60, 'Expanded chapter '+chapter.id);
    assert.ok(blocks.filter(block => block.type === 'h2').length >= 6);
    assert.ok(blocks.filter(block => block.type === 'table').length >= 2);
    assert.ok(blocks.filter(block => block.text === '\u65e5\u672c\u8a9e\u30ce\u30fc\u30c8').length >= 4);
    assert.ok(blocks.filter(block => block.lang === 'ja').length >= 16);
    assert.ok(blocks.filter(block => block.type === 'p').length >= 20);
    for (const block of blocks) {
      if (block.type === 'table') {
        assert.ok(block.rows.length > 0);
        for (const row of block.rows) assert.equal(row.length, block.headers.length);
      } else assert.ok(block.text.trim());
    }
  }
});

test('Chapter 1 retains the attached document tables and its end-to-end request walkthrough', () => {
  const blocks=awsChapters[0].blocks;
  assert.equal(blocks.filter(block => block.type === 'table').length,4);
  const text=blocks.map(block => block.text || '').join(' ');
  for (const topic of ['RPO','RTO','Well-Architected','DNS Lookup','TCP Connection','Durable Commit','Shared Responsibility']) assert.ok(text.includes(topic),topic);
});
