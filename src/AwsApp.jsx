import React, { useEffect } from "react";
import { StudyAccountControls } from "./StudyAccount.jsx";

export default function AwsApp() {
  useEffect(() => { document.title = "AWS · Practice"; }, []);

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
        <h2>Practice</h2>
        <p className="reading-note" lang="ja">問題はまだ追加されていません。</p>
      </article>
    </section>
  </main>;
}
