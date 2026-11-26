import React, { useEffect, useRef, useState } from 'react';
import { StudyAccountControls } from './StudyAccount.jsx';
import StudySessionView from './StudySessionView.jsx';
import AwsPracticeSession from './AwsPracticeSession.jsx';
import { awsPracticeTitle, awsQuestions } from './awsPractice.js';
import { routesForLevel, studyTabFromPath } from './studyRoutes.js';
import SidebarToggle from './SidebarToggle.jsx';
import useChapterSidebarViewport from './useChapterSidebarViewport.js';
import { awsHandbookSource as source, awsChapters } from './awsChapters.js';
import AwsChapterBody from './AwsChapterBody.jsx';
import './dashboard.css';
import './awsHandbook.css';

const tabs = ['Part 1', 'Part 2', 'Part 3', 'Part 4', 'Practice'];

export default function AwsApp() {
  const [active, setActive] = useState(false);
  const [tab, setTab] = useState(() => location.pathname.startsWith('/aws') ? studyTabFromPath(location.pathname) : 'Part 1');
  const [lessonId, setLessonId] = useState(1);
  const [showSidebar, setShowSidebar] = useState(true);
  const lessonHeading = useRef(null);
  const layoutRef = useRef(null);
  useChapterSidebarViewport(layoutRef, `${tab}:${active}:${showSidebar}`);
  const lesson = awsChapters.find(item => item.id === lessonId) || awsChapters[0];
  const lessonIndex = awsChapters.indexOf(lesson);
  useEffect(() => { document.title = `AWS SAA-C03 · ${tab}`; }, [tab]);
  useEffect(() => {
    const onBack = () => { setTab(studyTabFromPath(location.pathname)); setActive(false); };
    window.addEventListener('popstate', onBack);
    return () => window.removeEventListener('popstate', onBack);
  }, []);
  useEffect(() => {
    const reveal = () => revealLesson(lessonId);
    const frame = requestAnimationFrame(reveal);
    const observer = new ResizeObserver(reveal);
    const list = document.getElementById('aws-lesson-list');
    if (list) observer.observe(list);
    window.addEventListener('resize', reveal);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener('resize', reveal); };
  }, [lessonId, showSidebar, tab]);
  function revealLesson(id) {
    const list = document.getElementById('aws-lesson-list');
    const button = document.querySelector(`[data-aws-lesson="${id}"]`);
    if (!list || !button) return;
    const bounds = list.getBoundingClientRect();
    const item = button.getBoundingClientRect();
    if (list.scrollWidth > list.clientWidth) list.scrollLeft += item.left < bounds.left ? item.left - bounds.left : item.right > bounds.right ? item.right - bounds.right : 0;
    else list.scrollTop += item.top < bounds.top ? item.top - bounds.top : item.bottom > bounds.bottom ? item.bottom - bounds.bottom : 0;
  }
  function selectTab(next) {
    history.pushState({}, '', routesForLevel('aws')[next]);
    setTab(next);
  }
  function selectLesson(id) {
    setLessonId(id);
    requestAnimationFrame(() => {
      lessonHeading.current?.focus({ preventScroll: true });
      lessonHeading.current?.scrollIntoView({ block: 'nearest' });
      revealLesson(id);
    });
  }
  if (active) return <StudySessionView label="Practice" onQuit={() => setActive(false)}><AwsPracticeSession /></StudySessionView>;

  return <main className="study-dashboard aws-study-dashboard" data-show-sidebar={showSidebar}>
    <header className="study-page-header"><div className="study-page-heading">
      <div className="study-header-topline"><p className="eyebrow" lang="ja">自分用学習ノート</p><StudyAccountControls /></div>
      <h1>AWS SAA-C03</h1>
      <nav className="level-switch" aria-label="Study subject"><a href="/n3/vocab">JLPT N3</a><a href="/n2/vocab">JLPT N2</a><a href="/aws/part-1" aria-current="page">AWS</a></nav>
      <p className="subtitle">Solutions Architect Associate</p>
    </div></header>
    <nav className="study-tabs" role="tablist" aria-label="AWS study sections">
      {tabs.map((item, index) => <button key={item} type="button" role="tab" id={`aws-tab-${index}`} aria-selected={tab === item} tabIndex={tab === item ? 0 : -1} aria-controls="aws-study-panel"
        onClick={() => selectTab(item)} onKeyDown={event => {
          const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : event.key === 'ArrowRight' ? (index + 1) % tabs.length : event.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length : null;
          if (next !== null) { event.preventDefault(); selectTab(tabs[next]); document.getElementById(`aws-tab-${next}`)?.focus(); }
        }}>{item}</button>)}
    </nav>
    <section role="tabpanel" id="aws-study-panel" aria-labelledby={`aws-tab-${tabs.indexOf(tab)}`}>
      {tab === 'Practice' ? <article className="mock-exam-panel">
        <div className="mock-exam-eyebrow">AWS SAA-C03</div><h2>{awsPracticeTitle}</h2>
        <p>All {awsQuestions.length} questions from the PDF, including policy diagrams and multiple-answer questions.</p>
        <div className="mock-exam-overview"><div><strong>{awsQuestions.length}</strong><span>practice questions</span></div><div><strong>A–F</strong><span>Only each question’s options</span></div><div><strong>At your pace</strong><span>Letter-only answers</span></div></div>
        <p className="reading-note">All questions include answer checking. Keys come from your solution notes, with missing answers supplemented using AWS documentation.</p>
        <div className="mock-exam-actions"><button type="button" className="primary-button" onClick={() => setActive(true)}>Start practice</button><span>Topic 1 · Questions 1–684</span></div>
      </article> : tab !== 'Part 1' ? <article className="aws-empty-part"><span className="aws-kicker">AWS SAA-C03 · {tab}</span><h2>{tab}</h2><p lang="my">ဤအပိုင်းတွင် သင်ခန်းစာများ မထည့်ရသေးပါ။</p></article> : <>
        <div className="aws-course-intro"><div><span className="aws-kicker">PART 1 · DESIGN SECURE ARCHITECTURES</span><h2 lang="my">လုံခြုံသော AWS စနစ်ကို အဆင့်ဆင့် တည်ဆောက်ခြင်း</h2></div><p lang="my">အခန်း ၉ ခန်း<br /><span lang="ja">ミャンマー語の解説と日本語の要点</span></p></div>
        <div className="layout aws-learning-layout" ref={layoutRef}>
          <aside aria-label="Part 1 chapters"><div className="sidebar-heading"><p className="count" lang="my">အခန်း ၉ ခန်း</p><SidebarToggle expanded={showSidebar} onToggle={() => setShowSidebar(value => !value)} controls="aws-lesson-list" /></div>
            <div className="chapter-group" id="aws-lesson-list"><div className="chapter-group-block"><div className="chapter-group-cards">{awsChapters.map(chapter => <button type="button" key={chapter.id} data-aws-lesson={chapter.id} className={lesson.id === chapter.id ? 'active' : ''} aria-current={lesson.id === chapter.id ? 'step' : undefined} aria-label={`Chapter ${chapter.id}: ${chapter.en}`} title={chapter.en} onClick={() => selectLesson(chapter.id)}><span className="chapter-compact-number" aria-hidden="true">{chapter.id}</span><span className="chapter-full-label">CHAPTER {chapter.id}</span><strong lang="my">{chapter.my}</strong></button>)}</div></div></div>
          </aside>
          <article className="aws-lesson-panel">
            <div className="aws-lesson-header"><span className="aws-kicker">CHAPTER {lesson.id} · {lesson.en}</span><h2 ref={lessonHeading} tabIndex={-1} lang="my">{lesson.my}</h2><p lang="ja">{lesson.ja}</p><small>Handbook pp. {lesson.pages.join('–')}</small></div>
            <AwsChapterBody key={lesson.id} blocks={lesson.blocks} />
            <nav className="aws-lesson-pagination" aria-label="Chapter navigation"><button type="button" disabled={lessonIndex === 0} onClick={() => selectLesson(awsChapters[lessonIndex - 1].id)}>ရှေ့အခန်း</button><span>{lessonIndex + 1} / 9</span><button type="button" disabled={lessonIndex === awsChapters.length - 1} onClick={() => selectLesson(awsChapters[lessonIndex + 1].id)}>နောက်အခန်း</button></nav>
          </article>
        </div>
        <footer className="aws-handbook-credit"><p><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a> · {source.edition} · {source.copyright} · {source.author} · <a href={source.licenseUrl} target="_blank" rel="noreferrer">{source.license}</a></p><p lang="my">Chapter 1 ကို ပေးထားသော chapter1.docx မှ ထည့်သွင်းပြီး Chapter 2–9 ကို မူရင်း handbook အပေါ် အခြေခံ၍ အသေးစိတ် မြန်မာရှင်းလင်းချက်၊ လက်တွေ့ဥပမာနှင့် ဂျပန်မှတ်စုများအဖြစ် ပြန်လည်ရေးသားထားပါသည်။ စာမျက်နှာနံပါတ်များသည် စာအုပ်တွင် ပုံနှိပ်ထားသော နံပါတ်များဖြစ်သည်။</p><p>Expanded and adapted study material · Noncommercial use · Not official AWS exam questions.</p></footer>
      </>}
    </section>
  </main>;
}
