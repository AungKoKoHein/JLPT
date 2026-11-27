import test from 'node:test';
import assert from 'node:assert/strict';
import {buildScoreReport,reportDate} from '../src/mockScoreReport.js';

test('report bars and summary use actual questions, including unanswered items',()=> {
  const questions=[
    {id:'k',section:'Vocabulary',type:'Kanji reading',answer:0},
    {id:'v',section:'Vocabulary',type:'Word meaning',answer:1},
    {id:'g',section:'Grammar',type:'Grammar',answer:2},
    {id:'r',section:'Reading',type:'Short passage',answer:0},
  ];
  const report=buildScoreReport({questions,answers:{k:0,v:3,g:2}});
  assert.equal(report.correct,2); assert.equal(report.total,4);
  assert.equal(report.overallPercent,50); assert.equal(report.kanjiPercent,100);
  assert.deepEqual(report.groups.map(g=>[g.label,g.correct,g.total]),[['Vocabulary',1,2],['Grammar',1,1],['Reading',0,1]]);
  assert.deepEqual(report.groups[0].rows.map(r=>[r.label,r.correct,r.total]),[['Kanji reading',1,1],['Word meaning',0,1]]);
});
test('focused and older reports omit untested sections and show no invented kanji score',()=> {
  const report=buildScoreReport({scores:{Grammar:{correct:3,total:5}}});
  assert.equal(report.groups.length,1); assert.equal(report.groups[0].label,'Grammar');
  assert.equal(report.overallPercent,60); assert.equal(report.kanjiPercent,null);
  assert.equal(buildScoreReport({}).overallPercent,null);
  assert.equal(reportDate(Date.parse('2026-11-26T20:00:00Z')),'2026-11-27');
});
