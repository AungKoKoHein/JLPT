import React from 'react';
import './studyLoading.css';

export default function StudyLoading({ phase = 'session' }) {
  const aws = typeof window !== 'undefined' && window.location.pathname.startsWith('/aws');
  const level = typeof window !== 'undefined' && window.location.pathname.startsWith('/n2') ? 'N2' : 'N3';
  return <main className="study-loading-screen">
    <div className="study-loading-brand"><span className="study-loading-brand-icon" aria-hidden="true">学</span><span>AKKH <span>STUDY</span></span></div>
    <section className="study-loading-content" role="status" aria-live="polite" aria-atomic="true">
      <div className="study-loading-art" aria-hidden="true">
        <div className="study-loading-orbit" />
        <div className="study-loading-sheet study-loading-sheet-back" />
        <div className="study-loading-sheet study-loading-sheet-middle" />
        <div className="study-loading-sheet study-loading-sheet-front"><span className="study-loading-sheet-label">{aws ? 'CLOUD NOTES' : '日本語ノート'}</span><strong>{aws ? '雲' : '学'}</strong><span className="study-loading-sheet-lines"><i /><i /><i /></span><span className="study-loading-seal">{aws ? 'AWS' : level}</span></div>
        <span className="study-loading-spark study-loading-spark-one">✦</span><span className="study-loading-spark study-loading-spark-two">✧</span>
      </div>
      <p className="study-loading-eyebrow">{aws ? 'YOUR CLOUD STUDY SPACE' : 'YOUR JAPANESE STUDY SPACE'}</p>
      <h1>A little closer<br />to <em>understanding.</em></h1>
      <p className="study-loading-caption" lang="ja">{aws ? '学びを、ひとつずつ。' : '一歩ずつ、自分のペースで。'}</p>
      <div className="study-loading-progress" aria-hidden="true"><span /></div>
      <p className="study-loading-status"><span aria-hidden="true" />{phase === 'session' ? 'Restoring your study session' : 'Preparing your study notes'}<span className="study-loading-dots" aria-hidden="true">…</span></p>
    </section>
    <p className="study-loading-footer">A quiet moment before your next discovery.</p>
  </main>;
}
