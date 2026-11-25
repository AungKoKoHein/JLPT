import { savedPracticeExplanation } from "./savedPracticeExplanations.js";

// All explanations are bundled study content. Opening this modal never calls AI.
export async function loadPracticeExplanation(question) {
  const result = savedPracticeExplanation(question);
  if (result) return result;
  const error = new Error("explanation-not-ready");
  error.code = "explanation-not-ready";
  throw error;
}

export function explanationError(error) {
  if (error?.code === "explanation-source-changed")
    return "မေးခွန်း သို့မဟုတ် အဖြေရွေးချယ်စရာများကို ပြင်ထားသဖြင့် သိမ်းထားသောရှင်းလင်းချက်နှင့် မကိုက်ညီတော့ပါ။ ရှင်းလင်းချက်ကို ပြန်စစ်ဆေးရန် လိုအပ်ပါသည်။";
  if (error?.code === "explanation-not-ready")
    return "ဤမေးခွန်းအတွက် မြန်မာရှင်းလင်းချက်ကို မထည့်ရသေးပါ။ လက်ရှိတွင် N3-1 နှင့် N3-3 မေးခွန်း ၁၄၆ ခုအတွက် ရှင်းလင်းချက်များ ရရှိနိုင်ပါသည်။";
  return "ရှင်းလင်းချက်ကို ဖတ်၍မရသေးပါ။ ပြန်ကြိုးစားပါ။";
}
