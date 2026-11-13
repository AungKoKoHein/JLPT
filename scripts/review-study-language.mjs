import fs from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { decodeSnapshot } from "../src/cloudContent.js";

// Read-only audit: download public content without modifying the database.
const directory = ".migration-backups/language-review";
await fs.mkdir(directory, { recursive: true });
let headers = {};
if (process.argv[2]) {
  const cli = path.resolve(process.argv[2]);
  const require = createRequire(path.join(cli, "package.json"));
  const auth = require(path.join(cli, "lib/auth.js"));
  const account = auth.getGlobalDefaultAccount();
  if (account) {
    const tokens = account.tokens.expires_at > Date.now() + 60_000
      ? account.tokens
      : await auth.getAccessToken(account.tokens.refresh_token, account.tokens.scopes);
    headers = { Authorization: `Bearer ${tokens.access_token}` };
  }
}
for (const [level, location] of [["n3", "jlpt/content"], ["n2", "jlpt/n2/content"]]) {
  let source = "live database";
  let snapshot;
  try {
    const response = await fetch(`https://akkh-jlpt-default-rtdb.asia-southeast1.firebasedatabase.app/${location}.json`, { headers });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    snapshot = await response.json();
    await fs.writeFile(`${directory}/${level}.json`, JSON.stringify(snapshot));
  } catch (error) {
    source = `local migration catalog (live read failed: ${error.message})`;
    snapshot = JSON.parse(await fs.readFile(`migrations/${level}-catalog.json`, "utf8"));
  }
  const findings = [];
  let strings = 0;
  const counts = {};
  function flag(path, issue, value) {
    counts[issue] = (counts[issue] || 0) + 1;
    findings.push({ path, issue, value });
  }
  function walk(value, path = "root") {
    if (Array.isArray(value)) return value.forEach((item, index) => walk(item, `${path}[${index}]`));
    if (value && typeof value === "object") {
      if ("japanese" in value && "myanmar" in value && value.japanese && !value.myanmar) flag(path, "missing Myanmar example", value.japanese);
      for (const [key, item] of Object.entries(value)) walk(item, `${path}.${key}`);
    } else if (typeof value === "string" && value) {
      strings++;
      if (value.includes("\ufffd")) flag(path, "replacement character", value);
      if (/[\u200b\ufeff]/u.test(value)) flag(path, "invisible character (review)", value);
      if (/（[^）]*$|^[^（]*）/u.test(value)) flag(path, "unbalanced full-width parentheses (review)", value);
      if (/\p{Script=Han}[（(][^）)]*\p{Script=Han}[^）)]*[）)]/u.test(value)) flag(path, "kanji inside reading or explanatory note (review)", value);
      if (/\.(japanese|exampleJapanese|sentence|question|answer|text|term|title)$/u.test(path) && /\p{Script=Han}/u.test(value) && !/[（(][\p{Script=Hiragana}\p{Script=Katakana}ー]+[）)]/u.test(value)) flag(path, "Japanese has kanji without inline readings (review)", value);
    }
  }
  walk(source === "live database" ? decodeSnapshot(snapshot).content : snapshot);
  await fs.writeFile(`${directory}/${level}-findings.json`, JSON.stringify({ level, source, strings, counts, findings }, null, 2));
  console.log(JSON.stringify({ level, source, strings, counts }));
}
