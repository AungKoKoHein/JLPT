import sentences from './n2KanjiLessonExamples.json' with { type: 'json' };
import questions from './n2KanjiLessonExercises.json' with { type: 'json' };
export function getN2KanjiLessons(chapter) {
  const match = chapter?.id?.match(/^n2-soumatome-week-([1-8])$/);
  if (!match) return [];
  const week = Number(match[1]);
  return (chapter.sections || []).flatMap(section => {
    const firstPage = 13 + (week - 1) * 16;
    const day = section.page === firstPage + 13 ? 7 : (section.page - firstPage + 1) / 2 + 1;
    if (!Number.isInteger(day) || day < 1 || day > 7 || !sentences[section.page]) return [];
    // The column lesson uses the preceding weekly review, not invented PDF questions.
    return [{
      id: `${chapter.id}-section-${section.page}`, week, day, page: section.page,
      title: section.title, weeklyReview: day === 7,
      examples: sentences[section.page].map(([japanese, myanmar, annotated]) => ({ japanese, myanmar, annotated: annotated || japanese })),
      exercises: (questions[section.page] || []).map(([question, answer, sourcePage, sourceQuestion, annotatedAnswer]) => ({
        _id: `n2-soumatome-text-${sourcePage}-${sourceQuestion}`,
        chapterId: chapter.id, subchapterId: `${chapter.id}-section-${section.page}`,
        studyTab: 'Kanji', section: `${section.title} · ${day === 7 ? '復習・読み方' : '正しい言葉を選ぶ'}`,
        question, answer: annotatedAnswer || answer,
        questionMyanmar: day === 7 ? 'မျဉ်းတားထားသော စကားလုံး၏ ဖတ်ပုံကို ဟိရဂနဖြင့် ရေးပါ။' : 'ကွင်းထဲမှ မှန်ကန်သော စကားလုံးကို ရွေးပါ။',
        answerMyanmar: '',
        sourceReferences: [{ book: '[studyjapanese.net]_Nihongo_SouMatome_N2-Kanji.pdf', page: sourcePage, question: sourceQuestion }],
        provenance: day === 7 ? 'textbook-reading-question-adapted-to-written-answer' : 'reviewed-textbook-exercise-transcription',
      })),
    }];
  });
}

export const n2KanjiLessonExercises = chapters => (chapters || []).flatMap(chapter => getN2KanjiLessons(chapter).flatMap(lesson => lesson.exercises));
