import test from 'node:test';
import assert from 'node:assert/strict';
import { awsChapters } from '../src/awsChapters.js';
import { awsPart2Chapters } from '../src/awsPart2Chapters.js';
import { awsPart3Chapters, awsPart4Chapters } from '../src/awsPerformanceCostChapters.js';

test('Parts 3 and 4 cover the remaining handbook chapters and exact printed ranges', () => {
  assert.deepEqual(awsPart3Chapters.map(c => [c.id, ...c.pages]), [
    [18,562,591],[19,592,628],[20,629,661],[21,662,694],
    [22,695,727],[23,728,760],[24,761,795],[25,796,832],
  ]);
  assert.deepEqual(awsPart4Chapters.map(c => [c.id, ...c.pages]), [
    [26,834,864],[27,865,901],[28,902,937],[29,938,970],[30,971,1006],
  ]);
  const chapters = [...awsChapters,...awsPart2Chapters,...awsPart3Chapters,...awsPart4Chapters];
  assert.deepEqual(chapters.map(c => c.id), Array.from({length:30},(_,i)=>i+1));
  for (const chapter of [...awsPart3Chapters,...awsPart4Chapters]) {
    assert.match(chapter.my, /[\u1000-\u109f]/u);
    assert.match(chapter.ja, /[\u3040-\u30ff\u4e00-\u9fff]/u);
    assert.equal(chapter.blocks.filter(b => b.type==='table').length, 2);
    assert.equal(chapter.blocks.filter(b => b.text==='日本語ノート').length, 4);
    assert.ok(chapter.blocks.filter(b => b.type==='p' && b.lang==='my').length>=17);
    for (let section=1;section<=4;section++) {
      assert.ok(chapter.blocks.some(b=>b.type==='h2' && b.text.startsWith(`${chapter.id}.${section} `)));
    }
    for (const block of chapter.blocks) {
      if (block.type==='table') for (const row of block.rows) assert.equal(row.length,block.headers.length);
      else assert.ok(block.text.trim());
    }
  }
});

test('Part 1 has exactly nine complete chapters in handbook order', () => {
  assert.deepEqual(awsChapters.map(chapter => chapter.id), [1,2,3,4,5,6,7,8,9]);
  assert.deepEqual(awsChapters[0].pages, [2,26]);
  assert.deepEqual(awsChapters.at(-1).pages, [259,286]);
  for (let i=1; i<awsChapters.length; i++) assert.equal(awsChapters[i].pages[0], awsChapters[i-1].pages[1]+1);
});

test('Both parts have foundations, detailed explanations, comparison tables and Japanese section notes', () => {
  for (const chapter of [...awsChapters,...awsPart2Chapters]) {
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

test('Part 2 follows handbook Chapters 10–17 and their complete printed page ranges', () => {
  assert.deepEqual(awsPart2Chapters.map(chapter => chapter.id),[10,11,12,13,14,15,16,17]);
  assert.deepEqual(awsPart2Chapters.map(chapter => chapter.pages),[[288,320],[321,356],[357,397],[398,431],[432,465],[466,496],[497,529],[530,560]]);
  for (let i=1; i<awsPart2Chapters.length; i++) assert.equal(awsPart2Chapters[i].pages[0],awsPart2Chapters[i-1].pages[1]+1);
  const allIds=[...awsChapters,...awsPart2Chapters].map(chapter => chapter.id);
  assert.equal(new Set(allIds).size,17,'Chapter identifiers remain unique across parts');
});

test('Chapter 1 retains the attached document tables and its end-to-end request walkthrough', () => {
  const blocks=awsChapters[0].blocks;
  assert.equal(blocks.filter(block => block.type === 'table').length,4);
  const text=blocks.map(block => block.text || '').join(' ');
  for (const topic of ['RPO','RTO','Well-Architected','DNS Lookup','TCP Connection','Durable Commit','Shared Responsibility']) assert.ok(text.includes(topic),topic);
});
