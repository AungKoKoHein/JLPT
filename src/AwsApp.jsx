import React, { useEffect, useState } from "react";
import { StudyAccountControls } from "./StudyAccount.jsx";
import StudySessionView from "./StudySessionView.jsx";
import AwsPracticeSession from "./AwsPracticeSession.jsx";
import { awsPracticeTitle, awsQuestions } from "./awsPractice.js";

export default function AwsApp() {
  const [active, setActive] = useState(false);
  useEffect(() => { document.title = awsPracticeTitle; }, []);

  if (active) return <StudySessionView label="Practice" onQuit={() => setActive(false)}><AwsPracticeSession /></StudySessionView>;

  return <main>
    <header className="study-page-header">
      <div className="study-page-heading">
        <div className="study-header-topline"><p className="eyebrow" lang="ja">自分用学習ノート</p><StudyAccountControls /></div>
        <h1>AWS</h1>
        <nav className="level-switch" aria-label="Study subject">
          <a href="/n3/vocab">JLPT N3</a>
          <a href="/n2/vocab">JLPT N2</a>
          <a href="/aws/practice" aria-current="page">AWS</a>
        </nav>
        <p className="subtitle">Solutions Architect Associate · SAA-C03</p>
      </div>
    </header>
    <nav className="study-tabs" role="tablist" aria-label="AWS study sections">
      <button type="button" role="tab" id="aws-practice-tab" aria-selected="true" aria-controls="aws-practice-panel">Practice</button>
    </nav>
    <section role="tabpanel" id="aws-practice-panel" aria-labelledby="aws-practice-tab">
      <article className="mock-exam-panel">
        <div className="mock-exam-eyebrow">AWS SAA-C03</div>
        <h2 style={{ overflowWrap: 'anywhere' }}>{awsPracticeTitle}</h2>
        <p>All {awsQuestions.length} questions from the PDF, including policy diagrams and multiple-answer questions.</p>
        <div className="mock-exam-overview"><div><strong>{awsQuestions.length}</strong><span>practice questions</span></div><div><strong>A–F</strong><span>Only each question’s options</span></div><div><strong>At your pace</strong><span>Letter-only answers</span></div></div>
        <p className="reading-note">All questions include answer checking. Keys come from your solution notes, with missing answers supplemented using AWS documentation.</p>
        <div className="mock-exam-actions"><button type="button" className="primary-button" onClick={() => setActive(true)}>Start practice</button><span>Topic 1 · Questions 1–684</span></div>
      </article>
    </section>
  </main>;
}
