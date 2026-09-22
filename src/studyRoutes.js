export const studyRoutes = {
  Vocab: "/vocab",
  Grammar: "/grammar",
  Kanji: "/kanji",
  Listening: "/listening",
  Reading: "/reading",
  "Mock exam": "/mock-exam",
};

export function studyTabFromPath(pathname) {
  const path = pathname.replace(/^\/n[23](?=\/|$)/, "").replace(/\/+$/, "") || "/";
  return Object.keys(studyRoutes).find((tab) => studyRoutes[tab] === path) || "Vocab";
}

export function levelFromPath(pathname) {
  return /^\/n2(?:\/|$)/.test(pathname) ? "n2" : "n3";
}
export function routesForLevel(level) {
  if (!["n2", "n3"].includes(level)) throw new Error("Unknown JLPT level");
  return Object.fromEntries(Object.entries(studyRoutes).map(([tab, path]) => [tab, '/' + level + path]));
}
export function contentPathForLevel(level) {
  if (!["n2", "n3"].includes(level)) throw new Error("Unknown JLPT level");
  return level === "n3" ? "jlpt/content" : "jlpt/n2/content";
}
