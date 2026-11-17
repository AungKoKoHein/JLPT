import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { createServer } from "vite";
import react from "@vitejs/plugin-react";

// Real saved content, no fixture explanations and no AI service credentials.
const profile = fs.mkdtempSync(
  path.resolve("node_modules/.cache/explanations-chrome-"),
);
const server = await createServer({
  configFile: false,
  logLevel: "error",
  plugins: [
    react(),
    {
      name: "saved-explanation-check-page",
      configureServer(server) {
        server.middlewares.use("/__explanations-check", async (_req, res) => {
          res.setHeader("Content-Type", "text/html");
          res.end(
            await server.transformIndexHtml(
              "/__explanations-check",
              `<html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module">import React from 'react';import{createRoot}from'react-dom/client';import PracticeSession from '/src/PracticeSession.jsx';import StudySessionView from '/src/StudySessionView.jsx';import bank from '/src/n3PracticeBank.json';import '/src/app.css';const questions=[...bank[0].questions.slice(0,2),...['n3-1-grammar-13','n3-1-grammar-23','n3-1-grammar-39'].map(id=>bank[0].questions.find(q=>q.id===id)),bank[2].questions[0]];createRoot(document.getElementById('root')).render(React.createElement(StudySessionView,{label:'Practice',onQuit:()=>{}},React.createElement(PracticeSession,{questions,title:'Saved explanations check'})));</script></body></html>`,
            ),
          );
        });
      },
    },
  ],
  server: { host: "127.0.0.1", port: 0 },
});
await server.listen();
const chrome = spawn(
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "--remote-debugging-port=0",
    `--user-data-dir=${profile}`,
    "about:blank",
  ],
  { windowsHide: true, stdio: ["ignore", "ignore", "pipe"] },
);
let socket;
const aiRequests = [];
try {
  const endpoint = await new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(Error("Chrome startup timeout")),
      20000,
    );
    chrome.on("error", reject);
    chrome.stderr.on("data", (data) => {
      const match = String(data).match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) {
        clearTimeout(timeout);
        resolve(match[1]);
      }
    });
  });
  socket = new WebSocket(endpoint);
  await new Promise((resolve, reject) => {
    socket.onopen = resolve;
    socket.onerror = reject;
  });
  let id = 0;
  const pending = new Map();
  socket.onmessage = ({ data }) => {
    const msg = JSON.parse(data);
    if (
      msg.method === "Network.requestWillBeSent" &&
      /firebasevertexai|firebaseappcheck|recaptcha|generativelanguage/.test(
        msg.params.request.url,
      )
    )
      aiRequests.push(msg.params.request.url);
    if (msg.id) {
      const task = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? task.reject(msg.error) : task.resolve(msg.result);
    }
  };
  const send = (method, params = {}, sessionId) =>
    new Promise((resolve, reject) => {
      pending.set(++id, { resolve, reject });
      socket.send(
        JSON.stringify({
          id,
          method,
          params,
          ...(sessionId ? { sessionId } : {}),
        }),
      );
    });
  const { targetId } = await send("Target.createTarget", {
    url: "about:blank",
  });
  const { sessionId } = await send("Target.attachToTarget", {
    targetId,
    flatten: true,
  });
  const cdp = (method, params) => send(method, params, sessionId);
  const evaluate = async (expression) => {
    const result = await cdp("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (result.exceptionDetails)
      throw Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  const until = async (expression) => {
    for (let i = 0; i < 100; i++) {
      if (await evaluate(expression)) return;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw Error(`Timed out: ${expression}`);
  };
  const click = (text) =>
    evaluate(
      `[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===${JSON.stringify(text)}).click()`,
    );
  const answer = (index) =>
    evaluate(
      `document.querySelectorAll('input[type=radio]')[${index}].click()`,
    );
  const open = async () => {
    await click("Show explanations");
    await until(
      `document.querySelectorAll('.practice-choice-explanations li').length===4`,
    );
  };
  await cdp("Page.enable");
  await cdp("Network.enable");
  await cdp("Network.setBlockedURLs", {
    urls: [
      "*://*.googleapis.com/*",
      "*://*.recaptcha.net/*",
      "*://www.google.com/recaptcha/*",
    ],
  });
  await cdp("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await cdp("Page.navigate", {
    url: `http://127.0.0.1:${server.config.server.port}/__explanations-check`,
  });
  await until(`document.querySelectorAll('input[type=radio]').length===4`);
  assert.equal(
    await evaluate(
      `document.querySelector('.practice-explanation-button').disabled`,
    ),
    true,
  );
  await answer(0);
  assert.equal(
    await evaluate(`Boolean(document.querySelector('dialog'))`),
    false,
    "Wrong answers do not auto-open explanations",
  );
  await open();
  assert.ok(
    await evaluate(
      `document.querySelector('.practice-explanation-summary').textContent.includes('比べる')`,
    ),
  );
  assert.ok(
    await evaluate(
      `document.querySelector('.practice-choice-explanations li p').textContent.includes('並べて')`,
    ),
    "Wrong choice has its own meaning and reason",
  );
  assert.equal(
    await evaluate(`document.querySelectorAll('.answer-correct').length`),
    1,
  );
  const savedSummary = await evaluate(
    `document.querySelector('.practice-explanation-summary').textContent`,
  );
  for (const width of [1440, 768, 390, 360]) {
    await cdp("Emulation.setDeviceMetricsOverride", {
      width,
      height: 844,
      deviceScaleFactor: 1,
      mobile: width < 600,
    });
    assert.ok(
      await evaluate(
        `document.querySelector('dialog').scrollWidth<=document.querySelector('dialog').clientWidth`,
      ),
      `Modal fits ${width}px`,
    );
    if (width === 390) {
      const screenshot = await cdp("Page.captureScreenshot", { format: "png" });
      fs.mkdirSync(".tmp-python", { recursive: true });
      fs.writeFileSync(
        ".tmp-python/practice-explanations-mobile.png",
        Buffer.from(screenshot.data, "base64"),
      );
    }
  }
  await click("Close");
  await until(`!document.querySelector('dialog')`);
  assert.equal(
    await evaluate(
      `document.activeElement.classList.contains('practice-explanation-button')`,
    ),
    true,
  );
  assert.equal(
    await evaluate(`document.querySelectorAll('input[type=radio]')[0].checked`),
    true,
  );
  await open();
  assert.equal(
    await evaluate(
      `document.querySelector('.practice-explanation-summary').textContent`,
    ),
    savedSummary,
  );
  await cdp("Input.dispatchKeyEvent", {
    type: "keyDown",
    key: "Escape",
    code: "Escape",
    windowsVirtualKeyCode: 27,
  });
  await cdp("Input.dispatchKeyEvent", {
    type: "keyUp",
    key: "Escape",
    code: "Escape",
    windowsVirtualKeyCode: 27,
  });
  await until(`!document.querySelector('dialog')`);
  await click("Next →");
  await answer(1);
  assert.equal(
    await evaluate(`Boolean(document.querySelector('dialog'))`),
    false,
    "Correct answers do not auto-open explanations",
  );
  await open();
  assert.ok(
    await evaluate(
      `document.querySelector('.practice-explanation-summary').textContent.includes('親しい')`,
    ),
  );
  await click("Close");
  await click("Next →");
  await answer(2);
  await open();
  assert.ok(
    await evaluate(
      `document.querySelector('.reading-note').textContent.includes('②')`,
    ),
  );
  assert.ok(
    await evaluate(
      `document.querySelectorAll('.practice-choice-explanations li')[1].classList.contains('answer-correct')`,
    ),
    "Suitable answer is distinguished from the faulty source key",
  );
  assert.ok(
    await evaluate(
      `document.querySelectorAll('.practice-choice-explanations li')[2].textContent.includes('မူရင်းအဖြေညွှန်း')`,
    ),
  );
  await click("Close");
  await click("Next →");
  await answer(2);
  await open();
  assert.ok(
    await evaluate(
      `document.querySelectorAll('.practice-explanation-choice strong')[2].textContent.includes('なりたいと思っています')`,
    ),
  );
  await click("Close");
  await click("Next →");
  await answer(3);
  await open();
  assert.equal(
    await evaluate(
      `document.querySelectorAll('.practice-explanation-choice strong')[3].textContent.trim()`,
    ),
    "4. 47 ポイント",
  );
  await click("Close");
  await click("Next →");
  await answer(0);
  await click("Show explanations");
  await until(`Boolean(document.querySelector('[role=alert]'))`);
  assert.ok(
    await evaluate(
      `document.querySelector('[role=alert]').textContent.includes('N3-1')`,
    ),
  );
  assert.equal(
    await evaluate(
      `[...document.querySelectorAll('dialog button')].some(b=>b.textContent.trim()==='Try again')`,
    ),
    false,
    "Unwritten content is not presented as a retryable network failure",
  );
  assert.deepEqual(aiRequests, [], "No AI, App Check, or reCAPTCHA requests");
  console.log(
    "PASS: Real saved Myanmar explanations, wrong/correct answers, source-key warning, image choices, points calculation, unavailable sets, Close/Escape, mobile widths, and no AI requests.",
  );
} finally {
  socket?.close();
  chrome.kill();
  await server.close();
}
