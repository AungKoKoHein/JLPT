import React, { useEffect, useRef, useState } from 'react';
import { StudyAccountControls } from './StudyAccount.jsx';
import StudySessionView from './StudySessionView.jsx';
import AwsPracticeSession from './AwsPracticeSession.jsx';
import { awsPracticeTitle, awsQuestions } from './awsPractice.js';
import { routesForLevel, studyTabFromPath } from './studyRoutes.js';
import SidebarToggle from './SidebarToggle.jsx';
import useChapterSidebarViewport from './useChapterSidebarViewport.js';
import Exercises from './Exercises.jsx';
import { awsHandbookSource as source, awsHandbookChapters, awsPart1Lessons, awsLessonExercises } from './awsHandbookPart1.js';
import { awsBeginnerNotes, awsTermDefinitions } from './awsBeginnerNotes.js';
import './dashboard.css';
import './awsHandbook.css';

const tabs = ['Part 1', 'Part 2', 'Part 3', 'Part 4', 'Practice'];

export default function AwsApp() {
  const [active, setActive] = useState(false);
  const [tab, setTab] = useState(() => location.pathname.startsWith('/aws') ? studyTabFromPath(location.pathname) : 'Part 1');
  const [lessonId, setLessonId] = useState('1.1');
  const [view, setView] = useState('lesson');
  const [showSidebar, setShowSidebar] = useState(true);
  const lessonHeading = useRef(null);
  const layoutRef = useRef(null);
  useChapterSidebarViewport(layoutRef, `${tab}:${active}:${showSidebar}`);
  const lesson = awsPart1Lessons.find(item => item.id === lessonId) || awsPart1Lessons[0];
  const lessonIndex = awsPart1Lessons.indexOf(lesson);
  const [beginnerIntro, beginnerTerms] = awsBeginnerNotes[lesson.id];
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
        <div className="aws-course-intro"><div><span className="aws-kicker">PART 1 · DESIGN SECURE ARCHITECTURES</span><h2 lang="my">လုံခြုံသော AWS စနစ်ကို အဆင့်ဆင့် တည်ဆောက်ခြင်း</h2></div><p lang="my">အခန်း ၉ ခန်း · သင်ခန်းစာ ၃၆ ခု<br /><span lang="ja">ミャンマー語の解説と日本語の要点</span></p></div>
        <div className="layout aws-learning-layout" ref={layoutRef}>
          <aside aria-label="Part 1 lessons"><div className="sidebar-heading"><p className="count" lang="my">သင်ခန်းစာ ၃၆ ခု</p><SidebarToggle expanded={showSidebar} onToggle={() => setShowSidebar(value => !value)} controls="aws-lesson-list" /></div>
            <div className="chapter-group" id="aws-lesson-list">{awsHandbookChapters.map(chapter => <div className="chapter-group-block" key={chapter.id}>
              <p className="chapter-group-label"><span className="chapter-group-title" lang="my">{chapter.id}. {chapter.my}</span><span className="chapter-group-range" lang="ja">{chapter.ja}</span></p>
              <div className="chapter-group-cards">{awsPart1Lessons.filter(item => item.id.startsWith(`${chapter.id}.`)).map(item => <button type="button" key={item.id} data-aws-lesson={item.id} className={lesson.id === item.id ? 'active' : ''} aria-current={lesson.id === item.id ? 'step' : undefined} aria-label={`${item.id} ${item.my}`} title={`${item.id} ${item.my}`} onClick={() => selectLesson(item.id)}><span className="chapter-compact-number" aria-hidden="true">{item.id}</span><span className="chapter-full-label">LESSON {item.id}</span><strong lang="my">{item.my}</strong></button>)}</div>
            </div>)}</div>
          </aside>
          <article className="aws-lesson-panel">
            <div className="aws-lesson-header"><span className="aws-kicker">LESSON {lesson.id} · {lesson.title}</span><h2 ref={lessonHeading} tabIndex={-1} lang="my">{lesson.my}</h2><p lang="ja">{lesson.ja}</p><small>Handbook pp. {lesson.pages.join('–')}</small></div>
            <div className="aws-lesson-views" role="tablist" aria-label="Lesson view">{[['lesson','သင်ခန်းစာ'],['exercises','Exercises · 2']].map(([key,label],index) => <button key={key} id={`aws-${key}-tab`} type="button" role="tab" aria-selected={view === key} aria-controls={`aws-${key}-panel`} tabIndex={view === key ? 0 : -1} onClick={() => setView(key)} onKeyDown={event => { if (['ArrowRight','ArrowLeft','Home','End'].includes(event.key)) { event.preventDefault(); const next = event.key === 'Home' ? 'lesson' : event.key === 'End' ? 'exercises' : index === 0 ? 'exercises' : 'lesson'; setView(next); document.getElementById(`aws-${next}-tab`)?.focus(); } }}>{label}</button>)}</div>
            {view === 'lesson' ? <section id="aws-lesson-panel" role="tabpanel" aria-labelledby="aws-lesson-tab" key={lesson.id}>
              <section className="aws-beginner-notes" lang="my" aria-label="Beginner explanation">
                <h3>အခြေခံမှ စနားလည်ကြမယ်</h3><p>{beginnerIntro}</p>
                <details open><summary>ဒီသင်ခန်းစာအတွက် သိထားရမည့် Technical Terms <span>({beginnerTerms.length})</span></summary><dl>{beginnerTerms.map(term => <div key={term}><dt lang="en">{term}</dt><dd>{awsTermDefinitions[term]}</dd></div>)}</dl></details>
              </section>
              {lesson.goal && <p className="aws-lesson-goal" lang="my">{lesson.goal}</p>}
              <ol className="aws-steps">{lesson.steps.map(([title, body], index) => <li key={title}><span className="aws-step-number" aria-hidden="true">{index + 1}</span><div lang="my"><h3>{title}</h3><p>{body}</p></div></li>)}</ol>
              <div className="aws-study-notes"><section lang="my"><h3>ဥပမာဖြင့် လေ့လာခြင်း</h3><p><strong>{lesson.example[0]}</strong></p><p>{lesson.example[1]}</p></section><section lang="ja"><span className="aws-kicker">日本語ノート</span><h3>覚えておくポイント</h3><ul>{lesson.notes.map(note => <li key={note}>{note}</li>)}</ul></section></div>
              <p className="aws-lesson-trap" lang="my"><strong>သတိပြုရန်</strong> {lesson.trap}</p>
            </section> : <div id="aws-exercises-panel" role="tabpanel" aria-labelledby="aws-exercises-tab"><Exercises key={lesson.id} exercises={awsLessonExercises(lesson)} showReadings showMyanmar assignmentLabel={`Lesson ${lesson.id}`} /></div>}
            <nav className="aws-lesson-pagination" aria-label="Lesson navigation"><button type="button" disabled={lessonIndex === 0} onClick={() => selectLesson(awsPart1Lessons[lessonIndex - 1].id)}>← ရှေ့သင်ခန်းစာ</button><span>{lessonIndex + 1} / 36</span><button type="button" disabled={lessonIndex === awsPart1Lessons.length - 1} onClick={() => selectLesson(awsPart1Lessons[lessonIndex + 1].id)}>နောက်သင်ခန်းစာ →</button></nav>
          </article>
        </div>
        <footer className="aws-handbook-credit"><p><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a> · {source.edition} · {source.copyright} · {source.author} · <a href={source.licenseUrl} target="_blank" rel="noreferrer">{source.license}</a></p><p lang="my">မူရင်း handbook ကို အခြေခံ၍ မြန်မာရှင်းလင်းချက်၊ ဂျပန်မှတ်စု၊ အကျဉ်းချုပ်ဥပမာနှင့် ကိုယ်တိုင်စစ်ဆေးရန် မေးခွန်းများအဖြစ် ပြန်လည်ရေးသားထားပါသည်။ စာမျက်နှာနံပါတ်များသည် စာအုပ်တွင် ပုံနှိပ်ထားသော နံပါတ်များဖြစ်သည်။</p><p>Adapted study material · Noncommercial use · Not official AWS exam questions.</p></footer>
      </>}
    </section>
  </main>;
}
