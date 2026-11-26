import fs from 'node:fs/promises';
import kuromoji from 'kuromoji';
const filename = new URL('../src/n2KanjiLessonExamples.json', import.meta.url);
const examples = JSON.parse(await fs.readFile(filename, 'utf8'));
const tokenizer = await new Promise((resolve, reject) => kuromoji.builder({ dicPath: 'node_modules/kuromoji/dict' }).build((error, value) => error ? reject(error) : resolve(value)));
const hira = text => text.replace(/[ァ-ヶ]/g, char => String.fromCharCode(char.charCodeAt(0) - 0x60));
const readings = { '六': 'ろく', '歳': 'さい', '一': 'いっ', '冊': 'さつ', '方': 'ほう' };
for (const rows of Object.values(examples)) for (const row of rows) {
  row[2] = tokenizer.tokenize(row[0]).map(token => {
    if (!/\p{Script=Han}/u.test(token.surface_form)) return token.surface_form;
    const reading = readings[token.surface_form] || (token.reading && hira(token.reading));
    if (!reading) throw Error(`Missing reading: ${token.surface_form}`);
    return `${token.surface_form}（${reading}）`;
  }).join('');
}
await fs.writeFile(filename, JSON.stringify(examples, null, 2) + '\n');
const exercisesFilename = new URL('../src/n2KanjiLessonExercises.json', import.meta.url);
const exercises = JSON.parse(await fs.readFile(exercisesFilename, 'utf8'));
for (const rows of Object.values(exercises)) for (const row of rows) {
  row[4] = tokenizer.tokenize(row[1]).map(token => {
    if (!/\p{Script=Han}/u.test(token.surface_form)) return token.surface_form;
    const reading = readings[token.surface_form] || (token.reading && hira(token.reading));
    if (!reading) throw Error(`Missing answer reading: ${token.surface_form}`);
    return `${token.surface_form}（${reading}）`;
  }).join('');
}
await fs.writeFile(exercisesFilename, JSON.stringify(exercises, null, 2) + '\n');
console.log('Annotated 112 supplementary N2 example sentences.');
