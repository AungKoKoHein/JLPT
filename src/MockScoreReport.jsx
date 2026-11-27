import React, { useContext, useRef } from 'react';
import { StudyAccountContext } from './StudyAccount.jsx';
import { buildScoreReport, reportDate } from './mockScoreReport.js';
import './mockScoreReport.css';

function ScoreBar({correct,total,label}) {
  const percent=total?correct/total*100:0;
  return <div className="score-report-bar" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={total||1} aria-valuenow={correct} aria-valuetext={`${correct} of ${total} correct`}><span style={{width:`${percent}%`}} /></div>;
}

export default function MockScoreReport({title,completedAt,questions=[],answers={},scores,reportId}) {
  const account=useContext(StudyAccountContext);
  const created=useRef(Date.now());
  const report=useRef(null);
  const date=completedAt||created.current;
  const model=buildScoreReport({questions,answers,scores});
  const name=account?.displayName||account?.username||'Local learner';
  const email=account?.email||(account?.username?.includes('@')?account.username:'—');
  function printReport() {
    const target=report.current;
    target.classList.add('mock-report-print-target');
    try { window.print(); } finally { target.classList.remove('mock-report-print-target'); }
  }
  return <section ref={report} className="mock-score-report" aria-label="Mock exam score report">
    <div className="score-report-topline"><div><h2 lang="ja">成績表</h2><p>Score report</p></div><div className="score-report-brand"><strong>JLPT <span>N3</span></strong><small>AKKH STUDY · MOCK EXAM</small></div></div>
    <div className="score-report-intro"><p lang="ja">模擬試験の結果は以下の通りです。</p><p>Your mock exam results are as follows.</p></div>
    <div className="score-report-details"><table><caption className="score-report-sr-only">Exam and learner information</caption><tbody>
      <tr><th scope="col">受験日 / Exam date</th><th scope="col" colSpan={2}>試験 / Examination</th></tr>
      <tr><td>{reportDate(date)}</td><td colSpan={2}>{title}</td></tr>
      <tr><th scope="col">ID</th><th scope="col">氏名 / Name</th><th scope="col">メール / Email</th></tr>
      <tr><td>{reportId||`N3-${date.toString(36).toUpperCase()}`}</td><td>{name}</td><td>{email}</td></tr>
    </tbody></table></div>
    <p className="score-report-tests"><span lang="ja">受験科目：</span>{model.groups.map(group=>group.japanese).join('、')}<span> · {model.correct} / {model.total} correct</span></p>
    <div className="score-report-groups">{model.groups.map(group=><div className="score-report-group" key={group.label}>
      <div className="score-report-group-label"><strong lang="ja">{group.japanese}</strong><span>{group.label}</span></div>
      <div className="score-report-group-body"><div className="score-report-row score-report-group-total"><span className="score-report-fraction">{group.correct} / {group.total}</span><ScoreBar {...group} label={`${group.label} total`} /></div>
        {group.rows.length>1 && <div className="score-report-subrows">{group.rows.map(row=><div className="score-report-row" key={row.label}><span className="score-report-type">{row.label}</span><span className="score-report-fraction">{row.correct} / {row.total}</span><ScoreBar {...row} label={row.label} /></div>)}</div>}
      </div>
    </div>)}</div>
    <div className="score-report-summary"><div><p lang="ja">全体の正答率</p><small>Overall accuracy</small><strong>{model.overallPercent===null?'—':`${model.overallPercent}%`}</strong><span>{model.correct} / {model.total} correct</span></div><div><p lang="ja">漢字の正答率</p><small>Kanji accuracy</small><strong>{model.kanjiPercent===null?'—':`${model.kanjiPercent}%`}</strong><span>{model.kanjiPercent===null?'Not tested':'Kanji questions only'}</span></div></div>
    <div className="score-report-footer"><p>Raw correct-answer counts and percentages. Unanswered questions count as incorrect.<br />Written mock exam · Listening not assessed · No official JLPT or TTBJ scaled score.</p><button type="button" onClick={printReport}>Print / Save PDF</button></div>
  </section>;
}
