import React, { useMemo, useState } from "react";

const passages = [
  {
    id: "library",
    title: "図書館からのお知らせ",
    type: "Short passage",
    text: "【図書館からのお知らせ】\n来週の月曜日は、本の整理をするため休館します。本を返す人は、入口の横にある返却ボックスを利用してください。火曜日からは、いつもどおり午前九時に開館します。",
    questions: [
      { prompt: "月曜日に本を返したい人は、どうすればいいですか。", choices: ["火曜日まで待つ", "入口の返却ボックスに入れる", "図書館の中に置く", "午前九時に職員に渡す"], answer: 1, explanation: "月曜日は入口横の返却ボックスを使うように書いてあります。" },
      { prompt: "図書館が月曜日に休みなのはなぜですか。", choices: ["職員がいないから", "本を整理するから", "新しい建物に移るから", "火曜日の準備をするから"], answer: 1, explanation: "休館する理由は「本の整理をするため」です。" },
    ],
  },
  {
    id: "morning-walk",
    title: "毎朝の習慣",
    type: "Mid-size passage",
    text: "私は健康のため、毎朝駅まで歩いています。前はバスに乗っていましたが、運動不足が気になり始めたからです。最初は時間がかかって大変でしたが、今は歩きながら季節の変化を見るのが楽しみになりました。雨の日だけはバスを使います。",
    questions: [
      { prompt: "筆者が毎朝駅まで歩くようになったのはなぜですか。", choices: ["バスがいつも遅れるから", "運動不足が気になったから", "季節の景色を見たかったから", "駅までの道が短くなったから"], answer: 1, explanation: "歩き始めた理由は、運動不足が気になったことです。景色を楽しむのは今の楽しみです。" },
      { prompt: "筆者は今、歩くことをどう感じていますか。", choices: ["時間がかかるのでやめたい", "雨の日も必ず歩きたい", "季節の変化を見るのが楽しい", "バスより不便だと思っている"], answer: 2, explanation: "「季節の変化を見るのが楽しみになりました」と書いてあります。" },
    ],
  },
  {
    id: "bookshop",
    title: "町の本屋",
    type: "Long passage",
    text: "先月、町の小さな本屋が店を閉めました。近くに大きな店ができたことや、インターネットで本を買う人が増えたことが理由だそうです。その本屋は、私が子どものころから通っていた場所でした。店の人は本の場所をよく覚えていて、読みたい本を伝えると、すぐに探してくれました。\n\n閉店の日、店の前には昔からの客が集まりました。店の人は「本を買うだけでなく、ここで話をする時間も好きでした」と言いました。私は、本屋は本を売る場所であると同時に、人がつながる場所でもあったのだと気づきました。これからは、町の図書館で開かれる読書会に参加してみようと思います。",
    questions: [
      { prompt: "筆者が本屋の閉店を通して気づいたことは何ですか。", choices: ["大きな店では本を見つけにくいこと", "本屋は人がつながる場所でもあったこと", "インターネットの本は安いこと", "図書館には新しい本が多いこと"], answer: 1, explanation: "筆者は、本屋が人と人をつなぐ場所でもあったと気づきました。" },
      { prompt: "筆者がこれからしようと思っていることは何ですか。", choices: ["大きな本屋を開く", "インターネットで本を売る", "町の図書館の読書会に参加する", "昔の本屋の店員になる"], answer: 2, explanation: "最後に、図書館の読書会に参加してみようと思うとあります。" },
    ],
  },
  {
    id: "classes",
    title: "春の教室案内",
    type: "Information retrieval",
    text: "【市民文化センター 春の教室】\nヨガ：火曜日 10:00〜11:00／定員20人／参加費 1,000円\n水泳：水曜日 18:30〜19:30／定員15人／参加費 1,500円\n料理：土曜日 13:00〜15:00／定員12人／参加費 2,000円\n申込み：4月5日までに電話または受付で。定員になり次第、受付を終了します。",
    questions: [
      { prompt: "平日の夜に参加できる教室はどれですか。", choices: ["火曜日のヨガ", "水曜日の水泳", "土曜日の料理", "どの教室にも参加できない"], answer: 1, explanation: "平日の夜にあるのは、水曜日18時30分からの水泳教室です。" },
      { prompt: "申込みについて正しいものはどれですか。", choices: ["4月5日を過ぎても電話で申し込める", "定員になっても申し込める", "電話か受付で申し込む", "参加費は教室のあとで決める"], answer: 2, explanation: "申込み方法は電話または受付です。定員になると受付は終了します。" },
    ],
  },
];

const questions = passages.flatMap((passage, passageIndex) => passage.questions.map((question, questionIndex) => ({
  ...question,
  passageId: passage.id,
  passageIndex,
  questionIndex,
  id: `${passage.id}-${questionIndex}`,
})));

export default function ReadingPractice() {
  const [selectedPassage, setSelectedPassage] = useState(0);
  const [selectedQuestion, setSelectedQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [checked, setChecked] = useState({});
  const [showResults, setShowResults] = useState(false);

  const passage = passages[selectedPassage];
  const question = passage.questions[selectedQuestion];
  const questionId = `${passage.id}-${selectedQuestion}`;
  const allAnswered = questions.every((item) => answers[item.id] != null);
  const completed = Object.keys(checked).length;
  const correctTotal = useMemo(() => questions.filter((item) => checked[item.id] && answers[item.id] === item.answer).length, [answers, checked]);

  const selectQuestion = (passageIndex, questionIndex) => {
    setSelectedPassage(passageIndex);
    setSelectedQuestion(questionIndex);
    setShowResults(false);
  };
  const nextQuestion = () => {
    if (selectedQuestion < passage.questions.length - 1) setSelectedQuestion((value) => value + 1);
    else if (selectedPassage < passages.length - 1) {
      setSelectedPassage((value) => value + 1);
      setSelectedQuestion(0);
    } else setShowResults(true);
  };
  const checkAnswer = () => {
    if (answers[questionId] != null) setChecked((current) => ({ ...current, [questionId]: true }));
  };
  const restart = () => {
    setAnswers({});
    setChecked({});
    setSelectedPassage(0);
    setSelectedQuestion(0);
    setShowResults(false);
  };

  if (showResults) return (
    <article className="reading-practice">
      <div className="reading-eyebrow">JLPT N3 · Reading</div>
      <h2>Reading results</h2>
      <p className="reading-score">Correct: <strong>{correctTotal} / {questions.length}</strong> · Checked: {completed} / {questions.length}</p>
      <p className="reading-note">Practice score only. These are original questions, not official JLPT items.</p>
      <div className="reading-result-list">{passages.map((item, passageIndex) => {
        const passageQuestions = questions.filter((entry) => entry.passageId === item.id);
        const correct = passageQuestions.filter((entry) => checked[entry.id] && answers[entry.id] === entry.answer).length;
        return <section key={item.id}>
          <h3>{item.title} <span>{correct} / {item.questions.length}</span></h3>
          {item.questions.map((entry, questionIndex) => {
            const id = `${item.id}-${questionIndex}`;
            return <button type="button" key={id} onClick={() => selectQuestion(passageIndex, questionIndex)}>
              <span>Q{passageIndex * 2 + questionIndex + 1}</span>{entry.prompt}<strong>{checked[id] && answers[id] === entry.answer ? "✓" : "Review"}</strong>
            </button>;
          })}
        </section>;
      })}</div>
      <div className="reading-actions"><button type="button" className="primary-button" onClick={restart}>Try again</button></div>
    </article>
  );

  const isChecked = Boolean(checked[questionId]);
  const isCorrect = isChecked && answers[questionId] === question.answer;
  const globalQuestionNumber = selectedPassage * 2 + selectedQuestion + 1;

  return (
    <article className="reading-practice">
      <div className="reading-practice-heading">
        <div><div className="reading-eyebrow">JLPT N3 · Reading</div><h2>Reading practice</h2><p>Read each original passage, then answer the questions.</p></div>
        <div className="reading-progress"><strong>{completed} / {questions.length}</strong><span>checked</span></div>
      </div>
      <div className="reading-practice-layout">
        <nav className="reading-passage-nav" aria-label="Reading passages">
          <h3>Passages</h3>
          {passages.map((item, index) => <button type="button" key={item.id} className={selectedPassage === index ? "active" : ""} onClick={() => selectQuestion(index, 0)}>
            <span>Passage {index + 1}</span><strong>{item.title}</strong><small>{item.type}</small>
          </button>)}
          <div className="reading-all-questions"><strong>Questions</strong><div>{questions.map((item, index) => {
            const active = selectedPassage === item.passageIndex && selectedQuestion === item.questionIndex;
            const done = checked[item.id];
            return <button type="button" key={item.id} className={`${active ? "active " : ""}${done ? "done" : ""}`} onClick={() => selectQuestion(item.passageIndex, item.questionIndex)} aria-label={`Question ${index + 1}${done ? ", checked" : ""}`}>{index + 1}</button>;
          })}</div></div>
          <button type="button" className="reading-finish-button" onClick={() => setShowResults(true)}>Finish and view results</button>
        </nav>
        <section className="reading-content">
          <div className="reading-content-meta"><span>Passage {selectedPassage + 1} of {passages.length}</span><span>{passage.type}</span></div>
          <h3>{passage.title}</h3>
          <div className="reading-passage-text" lang="ja">{passage.text}</div>
          <section className="reading-question-card">
            <div className="reading-question-topline"><strong>Question {globalQuestionNumber} of {questions.length}</strong><span>{selectedQuestion + 1} of {passage.questions.length} for this passage</span></div>
            <h4 lang="ja">{question.prompt}</h4>
            <fieldset className="reading-answer-list" disabled={isChecked}>
              <legend>Select one answer</legend>
              {question.choices.map((choice, index) => <label key={choice} className={`${answers[questionId] === index ? "selected" : ""}${isChecked && index === question.answer ? " correct" : ""}${isChecked && answers[questionId] === index && !isCorrect ? " incorrect" : ""}`}>
                <input type="radio" name={questionId} checked={answers[questionId] === index} onChange={() => setAnswers((current) => ({ ...current, [questionId]: index }))} />
                <span className="reading-option-letter">{"ABCD"[index]}</span><span lang="ja">{choice}</span>
                {isChecked && index === question.answer && <strong>Correct answer</strong>}
                {isChecked && answers[questionId] === index && !isCorrect && <strong>Your answer</strong>}
              </label>)}
            </fieldset>
            {isChecked && <p className={`reading-feedback ${isCorrect ? "correct" : "incorrect"}`}><strong>{isCorrect ? "Correct. " : "Not quite. "}</strong><span lang="my">{question.explanation}</span></p>}
            <div className="reading-question-actions">
              <button type="button" className="secondary-button" disabled={selectedPassage === 0 && selectedQuestion === 0} onClick={() => selectedQuestion > 0 ? setSelectedQuestion((value) => value - 1) : selectQuestion(selectedPassage - 1, 1)}>← Previous</button>
              <button type="button" className="secondary-button" onClick={() => setShowResults(true)}>Results {allAnswered ? "" : `(${completed}/${questions.length})`}</button>
              {!isChecked ? <button type="button" className="primary-button" disabled={answers[questionId] == null} onClick={checkAnswer}>Check answer</button> : <button type="button" className="primary-button" onClick={nextQuestion}>{globalQuestionNumber === questions.length ? "Finish →" : "Next →"}</button>}
            </div>
          </section>
        </section>
      </div>
    </article>
  );
}
