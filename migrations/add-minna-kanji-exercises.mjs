import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import {
  createCloudUpdate,
  decodeSnapshot,
  normalizeContent,
} from "../src/cloudContent.js";

const cliDirectory = process.argv[2];
if (!cliDirectory) throw new Error("Pass the installed firebase-tools directory.");
const require = createRequire(path.resolve(cliDirectory, "package.json"));
const auth = require(path.resolve(cliDirectory, "lib/auth.js"));
const account = auth.getGlobalDefaultAccount();
if (!account) throw new Error("Run firebase login first.");
const token = account.tokens.access_token && account.tokens.expires_at > Date.now() + 60_000
  ? account.tokens
  : await auth.getAccessToken(account.tokens.refresh_token, account.tokens.scopes);
const origin = "https://akkh-jlpt-default-rtdb.asia-southeast1.firebasedatabase.app";

const kanjiLessons = [
  { number: 8, title: "関係（かんけい）", titleMyanmar: "လူမှုဆက်ဆံရေး", words: [["関係", "かんけい"], ["仲間", "なかま"], ["他人", "たにん"], ["意見", "いけん"], ["仲裁", "ちゅうさい"]] },
  { number: 9, title: "単位（たんい）", titleMyanmar: "ယူနစ်နှင့် အရေအတွက်", words: [["単独", "たんどく"], ["簡単", "かんたん"], ["複数", "ふくすう"], ["重複", "ちょうふく"], ["平均", "へいきん"]] },
  { number: 10, title: "学校（がっこう）", titleMyanmar: "ကျောင်း", words: [["児童", "じどう"], ["教師", "きょうし"], ["教室", "きょうしつ"], ["担任", "たんにん"], ["学級", "がっきゅう"]] },
  { number: 11, title: "受験（じゅけん）", titleMyanmar: "ဝင်ခွင့်စာမေးပွဲ", words: [["受験", "じゅけん"], ["希望", "きぼう"], ["面接", "めんせつ"], ["合格", "ごうかく"], ["成績", "せいせき"]] },
  { number: 12, title: "授業（じゅぎょう）", titleMyanmar: "သင်ခန်းစာ", words: [["授業", "じゅぎょう"], ["欠席", "けっせき"], ["復習", "ふくしゅう"], ["解説", "かいせつ"], ["卒業", "そつぎょう"]] },
  { number: 13, title: "地球（ちきゅう）", titleMyanmar: "ကမ္ဘာ", words: [["地球", "ちきゅう"], ["生物", "せいぶつ"], ["種類", "しゅるい"], ["存在", "そんざい"], ["地形", "ちけい"]] },
  { number: 14, title: "旅行（りょこう）", titleMyanmar: "ခရီးသွားခြင်း", words: [["旅行", "りょこう"], ["準備", "じゅんび"], ["飛行機", "ひこうき"], ["移動", "いどう"], ["宿泊", "しゅくはく"]] },
  { number: 15, title: "交通（こうつう）", titleMyanmar: "ယာဉ်အသွားအလာ", words: [["交通", "こうつう"], ["道路", "どうろ"], ["交差点", "こうさてん"], ["直進", "ちょくしん"], ["横断", "おうだん"]] },
  { number: 16, title: "仕事（しごと）", titleMyanmar: "အလုပ်", words: [["仕事", "しごと"], ["求職", "きゅうしょく"], ["求人", "きゅうじん"], ["職場", "しょくば"], ["収入", "しゅうにゅう"]] },
  { number: 17, title: "会議（かいぎ）", titleMyanmar: "အစည်းအဝေး", words: [["会議", "かいぎ"], ["賛成", "さんせい"], ["反対", "はんたい"], ["判定", "はんてい"], ["確認", "かくにん"]] },
  { number: 18, title: "会社（かいしゃ）", titleMyanmar: "ကုမ္ပဏီ", words: [["会社", "かいしゃ"], ["管理職", "かんりしょく"], ["予算", "よさん"], ["費用", "ひよう"], ["供給", "きょうきゅう"]] },
  { number: 19, title: "産業（さんぎょう）", titleMyanmar: "စက်မှုလုပ်ငန်း", words: [["産業", "さんぎょう"], ["貿易", "ぼうえき"], ["商業", "しょうぎょう"], ["機械", "きかい"], ["技術", "ぎじゅつ"]] },
  { number: 20, title: "法律（ほうりつ）", titleMyanmar: "ဥပဒေ", words: [["法律", "ほうりつ"], ["規則", "きそく"], ["禁止", "きんし"], ["許可", "きょか"], ["犯罪", "はんざい"]] },
];

const kanjiMeanings = {
  "関係": "ဆက်နွယ်မှု၊ ပတ်သက်မှု",
  "仲間": "အဖော်၊ အပေါင်းအသင်း",
  "他人": "အခြားသူ",
  "意見": "အမြင်၊ သဘောထား",
  "仲裁": "ကြားဝင်ဖျန်ဖြေခြင်း",
  "単独": "တစ်ဦးတည်း၊ သီးခြား",
  "簡単": "လွယ်ကူသော",
  "複数": "အများအပြား",
  "重複": "ထပ်တူဖြစ်ခြင်း",
  "平均": "ပျမ်းမျှ",
  "児童": "ကျောင်းနေအရွယ်ကလေး",
  "教師": "ဆရာ၊ ဆရာမ",
  "教室": "စာသင်ခန်း",
  "担任": "အတန်းပိုင်ဆရာ",
  "学級": "အတန်း",
  "受験": "စာမေးပွဲဖြေဆိုခြင်း",
  "希望": "မျှော်လင့်ချက်",
  "面接": "လူတွေ့မေးမြန်းခြင်း",
  "合格": "စာမေးပွဲအောင်ခြင်း",
  "成績": "အမှတ်၊ ပညာရေးရလဒ်",
  "授業": "သင်ခန်းစာ၊ အတန်းချိန်",
  "欠席": "ပျက်ကွက်ခြင်း",
  "復習": "ပြန်လည်လေ့လာခြင်း",
  "解説": "ရှင်းလင်းချက်",
  "卒業": "ကျောင်းပြီးခြင်း",
  "地球": "ကမ္ဘာဂြိုဟ်",
  "生物": "သက်ရှိ",
  "種類": "အမျိုးအစား",
  "存在": "တည်ရှိမှု",
  "地形": "မြေမျက်နှာသွင်ပြင်",
  "旅行": "ခရီးသွားခြင်း",
  "準備": "ပြင်ဆင်မှု",
  "飛行機": "လေယာဉ်",
  "移動": "ရွှေ့ပြောင်းသွားလာခြင်း",
  "宿泊": "တည်းခိုခြင်း",
  "交通": "ယာဉ်အသွားအလာ၊ သွားလာရေး",
  "道路": "လမ်းမ",
  "交差点": "လမ်းဆုံ",
  "直進": "တည့်တည့်သွားခြင်း",
  "横断": "ဖြတ်ကူးခြင်း",
  "仕事": "အလုပ်",
  "求職": "အလုပ်ရှာဖွေခြင်း",
  "求人": "အလုပ်ခေါ်ယူမှု",
  "職場": "အလုပ်ခွင်",
  "収入": "ဝင်ငွေ",
  "会議": "အစည်းအဝေး",
  "賛成": "သဘောတူခြင်း",
  "反対": "ဆန့်ကျင်ခြင်း",
  "判定": "ဆုံးဖြတ်သတ်မှတ်ခြင်း",
  "確認": "စစ်ဆေးအတည်ပြုခြင်း",
  "会社": "ကုမ္ပဏီ",
  "管理職": "စီမံခန့်ခွဲရေးရာထူး",
  "予算": "ဘတ်ဂျက်၊ အသုံးစရိတ်ခန့်မှန်းချက်",
  "費用": "ကုန်ကျစရိတ်",
  "供給": "ထောက်ပံ့ပေးခြင်း",
  "産業": "စက်မှုလုပ်ငန်း",
  "貿易": "နိုင်ငံခြားကုန်သွယ်ရေး",
  "商業": "ကူးသန်းရောင်းဝယ်ရေး",
  "機械": "စက်ယန္တရား",
  "技術": "နည်းပညာ",
  "法律": "ဥပဒေ",
  "規則": "စည်းမျဉ်း",
  "禁止": "တားမြစ်ခြင်း",
  "許可": "ခွင့်ပြုချက်",
  "犯罪": "ရာဇဝတ်မှု",
};

const kanjiExamplesByTerm = {
  "関係": [
    "友達との関係を大切にしています。",
    "ကျွန်တော် သူငယ်ချင်းတွေနဲ့ ဆက်ဆံရေးကို တန်ဖိုးထားပါတယ်။"
  ],
  "仲間": [
    "彼は同じ目標を持つ仲間です。",
    "သူက တူညီတဲ့ရည်မှန်းချက်ရှိတဲ့ အဖော်တစ်ယောက်ပါ။"
  ],
  "他人": [
    "他人の意見も聞きましょう。",
    "အခြားသူတွေရဲ့ အမြင်ကိုလည်း နားထောင်ကြရအောင်။"
  ],
  "意見": [
    "会議で自分の意見を話しました。",
    "အစည်းအဝေးမှာ ကိုယ့်အမြင်ကို ပြောခဲ့ပါတယ်။"
  ],
  "仲裁": [
    "二人のけんかを先生が仲裁しました。",
    "နှစ်ယောက်ရဲ့ ရန်ဖြစ်မှုကို ဆရာက ကြားဝင်ဖျန်ဖြေပေးခဲ့ပါတယ်။"
  ],
  "単独": [
    "彼は単独で日本へ行きました。",
    "သူက တစ်ယောက်တည်း ဂျပန်ကို သွားခဲ့ပါတယ်။"
  ],
  "簡単": [
    "この問題は思ったより簡単でした。",
    "ဒီမေးခွန်းက ထင်ထားတာထက် ပိုလွယ်ကူခဲ့ပါတယ်။"
  ],
  "複数": [
    "複数の人が同じ質問をしました。",
    "လူအများအပြားက တူညီတဲ့မေးခွန်းကို မေးခဲ့ကြပါတယ်။"
  ],
  "重複": [
    "名前が重複していないか確認してください。",
    "နာမည်တွေ ထပ်နေသလား စစ်ဆေးပေးပါ။"
  ],
  "平均": [
    "このクラスの平均点は七十点です。",
    "ဒီအတန်းရဲ့ ပျမ်းမျှအမှတ်က ၇၀ မှတ်ပါ။"
  ],
  "児童": [
    "児童たちは校庭で元気に遊んでいます。",
    "ကျောင်းနေအရွယ်ကလေးတွေက ကျောင်းဝင်းထဲမှာ ပျော်ပျော်ရွှင်ရွှင် ကစားနေကြပါတယ်။"
  ],
  "教師": [
    "あの教師は学生に人気があります。",
    "အဲဒီဆရာက ကျောင်းသားတွေကြားမှာ လူကြိုက်များပါတယ်။"
  ],
  "教室": [
    "教室で日本語を勉強しています。",
    "စာသင်ခန်းထဲမှာ ဂျပန်စာ လေ့လာနေပါတယ်။"
  ],
  "担任": [
    "田中先生は私たちのクラスの担任です。",
    "တနာကာဆရာက ကျွန်တော်တို့အတန်းရဲ့ အတန်းပိုင်ဆရာပါ။"
  ],
  "学級": [
    "この学級には三十人の児童がいます。",
    "ဒီအတန်းမှာ ကျောင်းသား ၃၀ ယောက်ရှိပါတယ်။"
  ],
  "受験": [
    "来年、日本の大学を受験します。",
    "နောက်နှစ် ဂျပန်တက္ကသိုလ် ဝင်ခွင့်စာမေးပွဲ ဖြေပါမယ်။"
  ],
  "希望": [
    "将来は日本で働くことを希望しています。",
    "အနာဂတ်မှာ ဂျပန်မှာ အလုပ်လုပ်ဖို့ မျှော်လင့်ထားပါတယ်။"
  ],
  "面接": [
    "明日、会社の面接を受けます。",
    "မနက်ဖြန် ကုမ္ပဏီမှာ လူတွေ့မေးမြန်းမှု ခံယူပါမယ်။"
  ],
  "合格": [
    "試験に合格して、とてもうれしいです。",
    "စာမေးပွဲအောင်လို့ အရမ်းဝမ်းသာပါတယ်။"
  ],
  "成績": [
    "今学期は成績が少し上がりました。",
    "ဒီစာသင်နှစ်ဝက်မှာ အမှတ်တွေ နည်းနည်းတက်လာပါတယ်။"
  ],
  "授業": [
    "今日の授業は九時に始まります。",
    "ဒီနေ့သင်ခန်းစာက ကိုးနာရီမှာ စပါမယ်။"
  ],
  "欠席": [
    "風邪をひいて授業を欠席しました。",
    "အအေးမိလို့ အတန်းပျက်ခဲ့ပါတယ်။"
  ],
  "復習": [
    "毎晩、その日の授業を復習します。",
    "ညတိုင်း အဲဒီနေ့သင်ခန်းစာကို ပြန်လည်လေ့လာပါတယ်။"
  ],
  "解説": [
    "先生が文法を分かりやすく解説しました。",
    "ဆရာက သဒ္ဒါကို နားလည်လွယ်အောင် ရှင်းပြခဲ့ပါတယ်။"
  ],
  "卒業": [
    "姉は去年、大学を卒業しました。",
    "အစ်မက မနှစ်က တက္ကသိုလ်ပြီးခဲ့ပါတယ်။"
  ],
  "地球": [
    "みんなで地球の環境を守りましょう。",
    "အားလုံးအတူ ကမ္ဘာ့ပတ်ဝန်းကျင်ကို ကာကွယ်ကြရအောင်။"
  ],
  "生物": [
    "海にはいろいろな生物がいます。",
    "ပင်လယ်ထဲမှာ သက်ရှိအမျိုးမျိုး ရှိပါတယ်။"
  ],
  "種類": [
    "この店では三種類のパンを売っています。",
    "ဒီဆိုင်မှာ ပေါင်မုန့်အမျိုးအစား သုံးမျိုး ရောင်းပါတယ်။"
  ],
  "存在": [
    "その古い建物は今も存在しています。",
    "အဲဒီအဆောက်အအုံဟောင်းက အခုထိ တည်ရှိနေဆဲပါ။"
  ],
  "地形": [
    "この地域は山が多い地形です。",
    "ဒီဒေသရဲ့ မြေမျက်နှာသွင်ပြင်မှာ တောင်တွေ များပါတယ်။"
  ],
  "旅行": [
    "夏休みに家族と旅行します。",
    "နွေရာသီကျောင်းပိတ်ရက်မှာ မိသားစုနဲ့ ခရီးသွားပါမယ်။"
  ],
  "準備": [
    "出発の前に旅行の準備をしました。",
    "မထွက်ခွာခင် ခရီးအတွက် ပြင်ဆင်ခဲ့ပါတယ်။"
  ],
  "飛行機": [
    "飛行機で東京へ行きます。",
    "လေယာဉ်နဲ့ တိုကျိုကို သွားပါမယ်။"
  ],
  "移動": [
    "駅からホテルまでバスで移動しました。",
    "ဘူတာကနေ ဟိုတယ်အထိ ဘတ်စ်ကားနဲ့ သွားခဲ့ပါတယ်။"
  ],
  "宿泊": [
    "旅行中は駅の近くのホテルに宿泊します。",
    "ခရီးသွားနေစဉ် ဘူတာအနီးက ဟိုတယ်မှာ တည်းခိုပါမယ်။"
  ],
  "交通": [
    "この町は交通が便利です。",
    "ဒီမြို့မှာ သွားလာရေး အဆင်ပြေပါတယ်။"
  ],
  "道路": [
    "雨で道路がぬれていました。",
    "မိုးကြောင့် လမ်းမက စိုနေခဲ့ပါတယ်။"
  ],
  "交差点": [
    "次の交差点を右に曲がってください。",
    "နောက်လာမယ့် လမ်းဆုံမှာ ညာဘက်ကို ကွေ့ပါ။"
  ],
  "直進": [
    "この道を二百メートル直進してください。",
    "ဒီလမ်းအတိုင်း မီတာ ၂၀၀ တည့်တည့်သွားပါ။"
  ],
  "横断": [
    "信号が青になってから道路を横断してください。",
    "မီးစိမ်းမှ လမ်းကို ဖြတ်ကူးပါ။"
  ],
  "仕事": [
    "毎朝八時に仕事を始めます。",
    "မနက်တိုင်း ရှစ်နာရီမှာ အလုပ်စပါတယ်။"
  ],
  "求職": [
    "兄は今、新しい仕事を探して求職中です。",
    "အစ်ကိုက အခု အလုပ်သစ်ရှာနေဆဲပါ။"
  ],
  "求人": [
    "求人広告を見て、その会社に応募しました。",
    "အလုပ်ခေါ်စာကို ကြည့်ပြီး အဲဒီကုမ္ပဏီကို လျှောက်ထားခဲ့ပါတယ်။"
  ],
  "職場": [
    "職場の人たちと昼ご飯を食べました。",
    "အလုပ်ခွင်က လူတွေနဲ့ နေ့လယ်စာ စားခဲ့ပါတယ်။"
  ],
  "収入": [
    "毎月、収入の一部を貯金しています。",
    "လစဉ် ဝင်ငွေရဲ့ တစ်စိတ်တစ်ပိုင်းကို စုဆောင်းပါတယ်။"
  ],
  "会議": [
    "午後から大切な会議があります。",
    "နေ့လယ်ပိုင်းမှာ အရေးကြီးတဲ့ အစည်းအဝေးရှိပါတယ်။"
  ],
  "賛成": [
    "私はその計画に賛成です。",
    "ကျွန်တော် အဲဒီအစီအစဉ်ကို သဘောတူပါတယ်။"
  ],
  "反対": [
    "私はその意見に反対しました。",
    "ကျွန်တော် အဲဒီအမြင်ကို ကန့်ကွက်ခဲ့ပါတယ်။"
  ],
  "判定": [
    "試合の勝敗は審判が判定します。",
    "ပွဲရဲ့ အနိုင်အရှုံးကို ဒိုင်လူကြီးက ဆုံးဖြတ်ပါတယ်။"
  ],
  "確認": [
    "内容を確認してから、書類に署名してください。",
    "အကြောင်းအရာကို စစ်ဆေးပြီးမှ စာရွက်စာတမ်းမှာ လက်မှတ်ထိုးပါ။"
  ],
  "会社": [
    "父は自動車の会社で働いています。",
    "အဖေက ကားကုမ္ပဏီတစ်ခုမှာ အလုပ်လုပ်ပါတယ်။"
  ],
  "管理職": [
    "彼女は三十歳で管理職になりました。",
    "သူမက အသက် ၃၀ မှာ စီမံခန့်ခွဲရေးရာထူး ရခဲ့ပါတယ်။"
  ],
  "予算": [
    "旅行の予算を十万円に決めました。",
    "ခရီးစရိတ်ဘတ်ဂျက်ကို ယန်းတစ်သိန်း သတ်မှတ်ခဲ့ပါတယ်။"
  ],
  "費用": [
    "留学には多くの費用がかかります。",
    "နိုင်ငံခြားမှာ ပညာသင်ဖို့ ကုန်ကျစရိတ် အများကြီးလိုပါတယ်။"
  ],
  "供給": [
    "この会社は町に電気を供給しています。",
    "ဒီကုမ္ပဏီက မြို့ကို လျှပ်စစ်ဓာတ်အား ပေးဝေနေပါတယ်။"
  ],
  "産業": [
    "この町では観光産業が盛んです。",
    "ဒီမြို့မှာ ခရီးသွားလုပ်ငန်း ဖွံ့ဖြိုးပါတယ်။"
  ],
  "貿易": [
    "日本とミャンマーの貿易について勉強しています。",
    "ဂျပန်နဲ့ မြန်မာနိုင်ငံကြား ကုန်သွယ်ရေးအကြောင်း လေ့လာနေပါတယ်။"
  ],
  "商業": [
    "この地域は商業の中心地です。",
    "ဒီဒေသက ကူးသန်းရောင်းဝယ်ရေးရဲ့ ဗဟိုနေရာပါ။"
  ],
  "機械": [
    "この機械の使い方を教えてください。",
    "ဒီစက်ကို ဘယ်လိုသုံးရမလဲ သင်ပေးပါ။"
  ],
  "技術": [
    "新しい技術を使って製品を作ります。",
    "နည်းပညာအသစ်ကို အသုံးပြုပြီး ထုတ်ကုန်တွေ ထုတ်လုပ်ပါတယ်။"
  ],
  "法律": [
    "日本の法律について勉強しています。",
    "ဂျပန်ဥပဒေအကြောင်း လေ့လာနေပါတယ်။"
  ],
  "規則": [
    "学校の規則を守ってください。",
    "ကျောင်းစည်းမျဉ်းတွေကို လိုက်နာပါ။"
  ],
  "禁止": [
    "この公園ではごみを捨てることが禁止されています。",
    "ဒီပန်းခြံမှာ အမှိုက်ပစ်တာကို တားမြစ်ထားပါတယ်။"
  ],
  "許可": [
    "ここで写真を撮るには許可が必要です。",
    "ဒီနေရာမှာ ဓာတ်ပုံရိုက်ဖို့ ခွင့်ပြုချက်လိုပါတယ်။"
  ],
  "犯罪": [
    "警察はその犯罪について調べています。",
    "ရဲတွေက အဲဒီရာဇဝတ်မှုနဲ့ပတ်သက်ပြီး စုံစမ်းနေပါတယ်。"
  ]
};

function grammarPractice(card, index) {
  const example = card.examples?.find((item) => item.japanese) ?? {
    japanese: card.exampleJapanese ?? "",
    myanmar: card.exampleMyanmar ?? "",
  };
  const chapterId = card.parentChapterId || card.chapterId;
  return {
    _id: `minna-grammar-practice:${card._id || card.id}:${index + 1}`,
    chapterId,
    parentChapterId: chapterId,
    subchapterId: "",
    studyTab: "Grammar",
    section: "文法パターン練習",
    question: `「${card.meaning}」を表す文を、「${card.term}」を使って作ってください。`,
    questionMyanmar: `「${card.term}」သဒ္ဒါပုံစံကို အသုံးပြုပြီး ဥပမာစာကြောင်းရေးပါ။`,
    answer: example.japanese,
    answerMyanmar: example.myanmar || card.meaning || "",
    sourceReferences: card.sourceReferences ?? [],
    generated: true,
  };
}

function kanjiPractice(lesson, chapterId, word, index, kind) {
  const [term, reading] = word;
  const readingMode = kind === "reading";
  return {
    _id: `n3-kanji-master:${lesson.number}:${kind}:${index + 1}`,
    chapterId,
    parentChapterId: chapterId,
    subchapterId: "",
    studyTab: "Kanji",
    section: readingMode ? "漢字の読み" : "漢字を書く",
    question: readingMode
      ? `次の漢字の読み方を書いてください：${term}`
      : `次の読み方を漢字で書いてください：${reading}`,
    questionMyanmar: readingMode
      ? "အောက်ပါစကားလုံး၏ ဖတ်ပုံကို ရေးပါ။"
      : "အောက်ပါဖတ်ပုံကို သင့်တော်သော ကန်ဂျီဖြင့် ရေးပါ။",
    answer: readingMode ? reading : term,
    answerMyanmar: "",
    sourceReferences: [{ book: "N3 Kanji Master.pdf", chapter: lesson.number }],
    generated: true,
  };
}

function kanjiFlashcard(lesson, chapterId, [term, reading]) {
  const id = `n3-kanji-master-card:${String(lesson.number).padStart(2, "0")}:${term}`;
  const onReading = reading.replace(/[ぁ-ゖ]/g, (character) =>
    String.fromCharCode(character.charCodeAt(0) + 0x60),
  );
  const meaning = kanjiMeanings[term];
  const example = kanjiExamplesByTerm[term];
  if (!meaning) throw new Error(`Missing Burmese meaning for Kanji Master term: ${term}`);
  if (!example) throw new Error(`Missing example sentence for Kanji Master term: ${term}`);
  return {
    id,
    _id: id,
    chapterId,
    studyTab: "Kanji",
    kanji: term,
    meaning,
    lesson: lesson.title,
    readings: [{ kanji: term, on: onReading, kun: "" }],
    examples: [{ japanese: example[0], myanmar: example[1] }],
    sourceReferences: [{ book: "N3 Kanji Master.pdf", chapter: lesson.number }],
    generated: true,
  };
}

async function request(options = {}) {
  const response = await fetch(`${origin}/jlpt/content.json`, {
    ...options,
    headers: { Authorization: `Bearer ${token.access_token}`, ...options.headers },
  });
  if (!response.ok) throw new Error(`Firebase content: HTTP ${response.status}; stopped without retrying.`);
  return response;
}

const response = await request({ headers: { "X-Firebase-ETag": "true" } });
const etag = response.headers.get("etag");
const current = await response.json();
const { content: originalContent, revision } = decodeSnapshot(current);
const next = normalizeContent(originalContent);
const existingIds = new Set([
  ...next.baselineExercises.map((item) => item._id),
  ...next.exercises.map((item) => item._id),
  ...next.deletedExercises,
]);
const existingChapterIds = new Set([
  ...next.baselineKanjiChapters.map((chapter) => chapter.id),
  ...next.chapters.map((chapter) => chapter.id),
]);
const existingKanjiCardIds = new Set([
  ...next.kanjiCards.map((card) => card._id),
  ...next.deletedKanjiCards,
]);
const grammarCards = next.cards.filter((card) => card.studyTab === "Grammar");
assert.equal(grammarCards.length, 71, "Expected the 71 Minna grammar cards to be present.");

const additions = [];
for (const card of grammarCards) {
  const exercise = grammarPractice(card, 0);
  if (!existingIds.has(exercise._id)) additions.push(exercise);
}

const newChapters = [];
const kanjiCardsToAdd = [];
const kanjiCardsToUpdate = [];
for (const lesson of kanjiLessons) {
  const chapterId = `n3-kanji-master-chapter-${String(lesson.number).padStart(2, "0")}`;
  if (!existingChapterIds.has(chapterId)) {
    newChapters.push({
      id: chapterId,
      number: String(lesson.number),
      title: lesson.title,
      titleMyanmar: lesson.titleMyanmar,
      studyTab: "Kanji",
      subchapters: [],
    });
    existingChapterIds.add(chapterId);
  }
  for (const word of lesson.words) {
    const card = kanjiFlashcard(lesson, chapterId, word);
    if (!existingKanjiCardIds.has(card._id)) {
      kanjiCardsToAdd.push(card);
      existingKanjiCardIds.add(card._id);
    } else {
      const existingCard = next.kanjiCards.find((item) => item._id === card._id);
      const currentExamples = existingCard?.examples ?? [];
      const hasOnlyPlaceholderExamples = currentExamples.length === 0
        || currentExamples.every((example) =>
          example.japanese === `${term}（${reading}）` || example.japanese === term,
        );
      if (existingCard && hasOnlyPlaceholderExamples) {
        kanjiCardsToUpdate.push({ ...existingCard, examples: card.examples });
      }
    }
  }
  for (const [index, word] of lesson.words.entries()) {
    for (const kind of ["reading", "writing"]) {
      const exercise = kanjiPractice(lesson, chapterId, word, index, kind);
      if (!existingIds.has(exercise._id)) additions.push(exercise);
    }
  }
}

next.chapters = [...next.chapters, ...newChapters];
next.baselineExercises = [...next.baselineExercises, ...additions];
const kanjiCardUpdatesById = new Map(kanjiCardsToUpdate.map((card) => [card._id, card]));
next.kanjiCards = [
  ...next.kanjiCards.map((card) => kanjiCardUpdatesById.get(card._id) ?? card),
  ...kanjiCardsToAdd,
];
const backup = path.resolve(".migration-backups", `pdf-exercises-${new Date().toISOString().replaceAll(":", "-")}`);
await fs.mkdir(backup, { recursive: true });
await fs.writeFile(path.join(backup, "n3-before.json"), JSON.stringify(current));
await fs.writeFile(path.join(backup, "n3-proposed-content.json"), JSON.stringify(next, null, 2));

const grammarCount = additions.filter((item) => item.studyTab === "Grammar").length;
const kanjiCount = additions.filter((item) => item.studyTab === "Kanji").length;
console.log(JSON.stringify({
  revision,
  grammarCards: grammarCards.length,
  grammarExercisesToAdd: grammarCount,
  kanjiChaptersToAdd: newChapters.length,
  kanjiExercisesToAdd: kanjiCount,
  kanjiFlashcardsToAdd: kanjiCardsToAdd.length,
  kanjiFlashcardsToUpdate: kanjiCardsToUpdate.length,
  totalExercisesToAdd: additions.length,
  backup,
}, null, 2));

if (!process.argv.includes("--apply")) {
  console.log("Preview only. Run again with --apply to add these exercises and chapters.");
  process.exit(0);
}
if (!additions.length && !newChapters.length && !kanjiCardsToAdd.length && !kanjiCardsToUpdate.length) {
  console.log("All requested chapters and exercises are already present.");
  process.exit(0);
}
if (!etag) throw new Error("Missing Firebase ETag; refusing an unprotected write.");
const update = createCloudUpdate(
  current,
  revision,
  next,
  "firebase-cli-n3-pdf-exercises",
  { ".sv": "timestamp" },
);
await request({
  method: "PUT",
  headers: { "Content-Type": "application/json", "if-match": etag },
  body: JSON.stringify(update),
});
const saved = await (await request()).json();
assert.equal(saved.revision, revision + 1);
assert.equal(saved.payload, update.payload);
await fs.writeFile(path.join(backup, "n3-after.json"), JSON.stringify(saved));
console.log(`Verified ${grammarCount} Grammar and ${kanjiCount} Kanji exercises, ${kanjiCardsToAdd.length} Kanji flashcards added, ${kanjiCardsToUpdate.length} Kanji flashcards updated, and ${newChapters.length} Kanji chapters. Revision ${saved.revision}.`);
