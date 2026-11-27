import React, { useContext, useEffect, useRef, useState } from 'react';
import { StudyAccountControls, StudyAccountContext } from './StudyAccount.jsx';
import StudySessionView from './StudySessionView.jsx';
import AwsPracticeSession from './AwsPracticeSession.jsx';
import { awsPracticeTitle, awsQuestions } from './awsPractice.js';
import { routesForLevel, studyTabFromPath } from './studyRoutes.js';
import SidebarToggle from './SidebarToggle.jsx';
import useChapterSidebarViewport from './useChapterSidebarViewport.js';
import { awsHandbookSource as source, awsChapters } from './awsChapters.js';
import { awsPart2Chapters } from './awsPart2Chapters.js';
import { awsPart3Chapters, awsPart4Chapters } from './awsPerformanceCostChapters.js';
import AwsChapterBody from './AwsChapterBody.jsx';
import AwsExercises from './AwsExercises.jsx';
import './dashboard.css';
import './awsHandbook.css';

const allTabs = ['Part 1', 'Part 2', 'Part 3', 'Part 4', 'Practice'];
const parts = {
  'Part 1': { chapters:awsChapters, title:'DESIGN SECURE ARCHITECTURES', my:'လုံခြုံသော AWS စနစ်ကို အဆင့်ဆင့် တည်ဆောက်ခြင်း', count:'အခန်း ၉ ခန်း' },
  'Part 2': { chapters:awsPart2Chapters, title:'DESIGN RESILIENT ARCHITECTURES', my:'Failure ဖြစ်သော်လည်း ဆက်လက်အသုံးပြုနိုင်သော AWS စနစ် တည်ဆောက်ခြင်း', count:'အခန်း ၈ ခန်း · Chapter 10–17' },
  'Part 3': { chapters:awsPart3Chapters, title:'DESIGN HIGH-PERFORMING ARCHITECTURES', my:'စွမ်းဆောင်ရည်ကောင်းသော AWS စနစ် တည်ဆောက်ခြင်း', count:'အခန်း ၈ ခန်း · Chapter 18–25' },
  'Part 4': { chapters:awsPart4Chapters, title:'DESIGN COST-OPTIMIZED ARCHITECTURES', my:'ကုန်ကျစရိတ်ကို ထိရောက်စွာ စီမံထားသော AWS စနစ် တည်ဆောက်ခြင်း', count:'အခန်း ၅ ခန်း · Chapter 26–30' },
};

export default function AwsApp() {
  const account=useContext(StudyAccountContext);
  const canView=(level,tab)=>account?.canViewTab?account.canViewTab(level,tab):true;
  const tabs=allTabs.filter(tab=>canView('aws',tab));
  const [active, setActive] = useState(false);
  const [tab, setTab] = useState(() => location.pathname.startsWith('/aws') ? studyTabFromPath(location.pathname) : 'Part 1');
  const [selectedChapters, setSelectedChapters] = useState({'Part 1':1,'Part 2':10,'Part 3':18,'Part 4':26});
  const [showSidebar, setShowSidebar] = useState(true);
  const [lessonView, setLessonView] = useState('lesson');
  const [exerciseLanguage, setExerciseLanguage] = useState(() => {
    try { const saved = localStorage.getItem('aws-exercise-language'); return ['my','en','ja'].includes(saved) ? saved : 'ja'; }
    catch { return 'ja'; }
  });
  const [exerciseProgress, setExerciseProgress] = useState({});
  useEffect(() => { try { localStorage.setItem('aws-exercise-language',exerciseLanguage); } catch { /* Language switching works without storage. */ } },[exerciseLanguage]);
  const lessonHeading = useRef(null);
  const layoutRef = useRef(null);
  useChapterSidebarViewport(layoutRef, `${tab}:${active}:${showSidebar}`);
  const part = parts[tab];
  const chapters = part?.chapters || [];
  const lesson = chapters.find(item => item.id === selectedChapters[tab]) || chapters[0];
  const lessonId = lesson?.id;
  const lessonIndex = chapters.indexOf(lesson);
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
    if(!canView('aws',next)) return;
    history.pushState({}, '', routesForLevel('aws')[next]);
    window.dispatchEvent(new Event('study-navigation'));
    setTab(next);
  }
  function selectLesson(id) {
    setSelectedChapters(current => ({...current,[tab]:id}));
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
      <nav className="level-switch" aria-label="Study subject">{['n3','n2','aws'].map(level=>{const route=Object.entries(routesForLevel(level)).find(([tab])=>canView(level,tab));return route&&<a key={level} href={route[1]} aria-current={level==='aws'?'page':undefined}>{level==='aws'?'AWS':`JLPT ${level.toUpperCase()}`}</a>;})}</nav>
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
      </article> : !part ? <article className="aws-empty-part"><span className="aws-kicker">AWS SAA-C03 · {tab}</span><h2>{tab}</h2><p lang="my">ဤအပိုင်းတွင် သင်ခန်းစာများ မထည့်ရသေးပါ။</p></article> : <>
        <div className="aws-course-intro"><div><span className="aws-kicker">{tab.toUpperCase()} · {part.title}</span><h2 lang="my">{part.my}</h2></div><p lang="my">{part.count}<br /><span lang="ja">ミャンマー語の解説と日本語の要点</span></p></div>
        <div className="layout aws-learning-layout" ref={layoutRef}>
          <aside aria-label={`${tab} chapters`}><div className="sidebar-heading"><p className="count" lang="my">{part.count}</p><SidebarToggle expanded={showSidebar} onToggle={() => setShowSidebar(value => !value)} controls="aws-lesson-list" /></div>
            <div className="chapter-group" id="aws-lesson-list"><div className="chapter-group-block"><div className="chapter-group-cards">{chapters.map(chapter => <button type="button" key={chapter.id} data-aws-lesson={chapter.id} className={lesson.id === chapter.id ? 'active' : ''} aria-current={lesson.id === chapter.id ? 'step' : undefined} aria-label={`Chapter ${chapter.id}: ${chapter.en}`} title={chapter.en} onClick={() => selectLesson(chapter.id)}><span className="chapter-compact-number" aria-hidden="true">{chapter.id}</span><span className="chapter-full-label">CHAPTER {chapter.id}</span><strong lang="my">{chapter.my}</strong></button>)}</div></div></div>
          </aside>
          <article className="aws-lesson-panel">
            <div className="aws-lesson-header"><span className="aws-kicker">CHAPTER {lesson.id} · {lesson.en}</span><h2 ref={lessonHeading} tabIndex={-1} lang="my">{lesson.my}</h2><p lang="ja">{lesson.ja}</p><small>Handbook pp. {lesson.pages.join('–')}</small></div>
            <div className="aws-lesson-views" role="tablist" aria-label="Chapter view">
              <button type="button" id="aws-view-lesson" role="tab" aria-selected={lessonView==='lesson'} aria-controls="aws-chapter-view" tabIndex={lessonView==='lesson'?0:-1}
                onClick={() => setLessonView('lesson')} onKeyDown={event => { if (['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) { event.preventDefault(); const view=event.key==='Home'?'lesson':'exercises'; setLessonView(view); document.getElementById(`aws-view-${view}`)?.focus(); } }}>Lesson</button>
              <button type="button" id="aws-view-exercises" role="tab" aria-selected={lessonView==='exercises'} aria-controls="aws-chapter-view" tabIndex={lessonView==='exercises'?0:-1}
                onClick={() => setLessonView('exercises')} onKeyDown={event => { if (['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) { event.preventDefault(); const view=event.key==='End'?'exercises':'lesson'; setLessonView(view); document.getElementById(`aws-view-${view}`)?.focus(); } }}>{({my:'လေ့ကျင့်ခန်းများ',en:'Exercises',ja:'練習問題'})[exerciseLanguage]}</button>
            </div>
            <div id="aws-chapter-view" role="tabpanel" aria-labelledby={`aws-view-${lessonView}`}>
              {lessonView==='lesson' ? <AwsChapterBody key={lesson.id} blocks={lesson.blocks} /> :
                <AwsExercises chapter={lesson} language={exerciseLanguage} onLanguageChange={setExerciseLanguage} progress={exerciseProgress} onProgressChange={setExerciseProgress} />}
            </div>
            <nav className="aws-lesson-pagination" aria-label="Chapter navigation"><button type="button" disabled={lessonIndex === 0} onClick={() => selectLesson(chapters[lessonIndex - 1].id)}>ရှေ့အခန်း</button><span>{lessonIndex + 1} / {chapters.length}</span><button type="button" disabled={lessonIndex === chapters.length - 1} onClick={() => selectLesson(chapters[lessonIndex + 1].id)}>နောက်အခန်း</button></nav>
          </article>
        </div>
        <footer className="aws-handbook-credit"><p><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a> · {source.edition} · {source.copyright} · {source.author} · <a href={source.licenseUrl} target="_blank" rel="noreferrer">{source.license}</a></p><p lang="my">{tab === 'Part 1' ? 'Chapter 1 ကို ပေးထားသော chapter1.docx မှ ထည့်သွင်းပြီး Chapter 2–9 ကို မူရင်း handbook အပေါ် အခြေခံ၍ အသေးစိတ် မြန်မာရှင်းလင်းချက်၊ လက်တွေ့ဥပမာနှင့် ဂျပန်မှတ်စုများအဖြစ် ပြန်လည်ရေးသားထားပါသည်။' : `${tab} Chapter ${chapters[0].id}–${chapters.at(-1).id} · Handbook pp. ${chapters[0].pages[0]}–${chapters.at(-1).pages[1]} အပေါ် အခြေခံ၍ အသေးစိတ် မြန်မာရှင်းလင်းချက်၊ လက်တွေ့ဥပမာနှင့် ဂျပန်မှတ်စုများအဖြစ် ပြန်လည်ရေးသားထားပါသည်။`} စာမျက်နှာနံပါတ်များသည် စာအုပ်တွင် ပုံနှိပ်ထားသော နံပါတ်များဖြစ်သည်။</p><p>Expanded and adapted study material · Noncommercial use · Not official AWS exam questions.</p></footer>
      </>}
    </section>
  </main>;
}
