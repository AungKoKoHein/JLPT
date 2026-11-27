import { scoreExam, skills } from './mockExamRecords.js';

const labels = {Vocabulary:'文字・語彙',Grammar:'文法',Reading:'読解'};
export function buildScoreReport({questions=[],answers={},scores:storedScores}) {
  const scores=questions.length ? scoreExam(questions,answers) : storedScores || {};
  const total=skills.reduce((sum,skill)=>sum+(scores[skill]?.total||0),0);
  const correct=skills.reduce((sum,skill)=>sum+(scores[skill]?.correct||0),0);
  const groups=['Vocabulary','Grammar','Reading'].map(section=> {
    const skillNames=section==='Vocabulary'?['Kanji','Vocabulary']:[section];
    const score=skillNames.reduce((sum,skill)=>({correct:sum.correct+(scores[skill]?.correct||0),total:sum.total+(scores[skill]?.total||0)}),{correct:0,total:0});
    const items=questions.filter(question=>question.section===section);
    const types=[...new Set(items.map(question=>question.type||section))];
    const rows=types.map(type=> {
      const subset=items.filter(question=>(question.type||section)===type);
      return {label:type,correct:subset.filter(question=>answers[question.id]===question.answer).length,total:subset.length};
    });
    if(!rows.length && section==='Vocabulary') for(const skill of skillNames) if(scores[skill]?.total) rows.push({label:skill,...scores[skill]});
    return {label:section,japanese:labels[section],...score,rows};
  }).filter(group=>group.total>0);
  const kanji=scores.Kanji||{correct:0,total:0};
  return {correct,total,groups,overallPercent:total?Math.round(correct/total*100):null,kanjiPercent:kanji.total?Math.round(kanji.correct/kanji.total*100):null};
}

export function reportDate(timestamp) {
  return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Rangoon',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(timestamp));
}
