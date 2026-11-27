// Offline contextual readings: no dictionary download or tokenization in the UI.
// Optional argument: a read-only Firebase snapshot, including current owner edits.
import fs from 'node:fs/promises';
import kuromoji from 'kuromoji';
import { decodeSnapshot, normalizeContent } from '../src/cloudContent.js';
import { resolveVocabularyCards } from '../src/vocabularyContent.js';
import { hideReadings } from '../src/studyText.js';

const tokenizer=await new Promise((resolve,reject)=>kuromoji.builder({dicPath:'node_modules/kuromoji/dict'}).build((error,result)=>error?reject(error):resolve(result)));
const han=/[\p{Script=Han}々〆]/u;
const hiragana=value=>value.replace(/[ァ-ヶ]/g,char=>String.fromCharCode(char.charCodeAt(0)-0x60));
const unknown=new Set();
const output={};
const reviewed={};

function annotate(text) {
  if(output[text]) return output[text];
  let cursor=0;
  const tokens=tokenizer.tokenize(text).map(token=> {
    const start=text.indexOf(token.surface_form,cursor);
    cursor=start+token.surface_form.length;
    return {...token,start,end:cursor};
  });
  // Preserve each authored reading, including a compound split by the tokenizer.
  // Do not protect an entire preceding Japanese clause just because it has ruby.
  const authored=[...text.matchAll(/[（(][ぁ-ゖァ-ヶー\s]+(?:[/／][ぁ-ゖァ-ヶー\s]+)*[）)]/gu)].map(match=> {
    const prior=tokens.findLast(token=>token.end===match.index);
    const stem=text.slice(0,match.index).match(/[\p{Script=Han}々〆]+[ぁ-ゖ]*$/u);
    const start=Math.min(prior?.start??match.index,stem?match.index-stem[0].length:match.index);
    return {start,end:match.index+match[0].length};
  });
  let result=''; cursor=0;
  for(const token of tokens) {
    const word=token.surface_form;
    result+=text.slice(cursor,token.start);
    if(!han.test(word) || authored.some(span=>token.start<span.end && token.end>span.start)) result+=word;
    else {
      const reading=reviewed[word] || (token.reading?hiragana(token.reading):null);
      if(!reading || han.test(reading)) { unknown.add(word); result+=word; }
      else {
        const suffix=word.match(/[ぁ-ゖ]+$/u)?.[0]||'';
        result+=suffix && reading.endsWith(suffix) && reading.length>suffix.length ? `${word.slice(0,-suffix.length)}（${reading.slice(0,-suffix.length)}）${suffix}` : `${word}（${reading}）`;
      }
    }
    cursor=token.end;
  }
  result+=text.slice(cursor);
  if(hideReadings(result)!==hideReadings(text)) throw Error(`Source text changed: ${text}`);
  output[text]=result;
  return result;
}

const catalog=JSON.parse(await fs.readFile('migrations/n3-catalog.json','utf8'));
const sources=[normalizeContent(catalog)];
if(process.argv[2]) {
  const snapshot=JSON.parse(await fs.readFile(process.argv[2],'utf8'));
  sources.push(snapshot.schemaVersion ? decodeSnapshot(snapshot).content : normalizeContent(snapshot));
}
let liveCards=0;
const liveExamples=new Set();
for(const content of sources) {
  const cards=resolveVocabularyCards(content.baselineChapters,content).filter(card=>(card.studyTab||'Vocab')==='Vocab');
  liveCards=cards.length;
  for(const card of cards) for(const field of ['term','exampleJapanese','context']) {
    const value=card[field];
    if(typeof value==='string' && han.test(value)) {
      annotate(value);
      if(field==='exampleJapanese' && content===sources.at(-1)) liveExamples.add(value);
    }
  }
}
console.log(JSON.stringify({liveCards,liveExampleSentences:liveExamples.size,uniqueJapaneseFields:Object.keys(output).length,unknown:[...unknown]},null,2));
if(unknown.size) throw Error('Review unknown vocabulary readings before generating the map.');
await fs.writeFile('src/vocabularyFurigana.json',JSON.stringify(output,null,2)+'\n');
