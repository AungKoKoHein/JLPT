export const studyRoutes = {
  Vocab: "/vocab",
  Grammar: "/grammar",
  Kanji: "/kanji",
  Listening: "/listening",
  Reading: "/reading",
  "Mock exam": "/mock-exam",
};

export function studyTabFromPath(pathname) {
  const level = levelFromPath(pathname);
  const path = pathname.replace(/^\/n[23](?=\/|$)/, "").replace(/\/+$/, "") || "/";
  const routes = routesForLevel(level);
  return Object.keys(routes).find((tab) => routes[tab] === path) || "Vocab";
}

export function levelFromPath(pathname) {
  return /^\/n2(?:\/|$)/.test(pathname) ? "n2" : "n3";
}
export function routesForLevel(level) {
  if (!["n2", "n3"].includes(level)) throw new Error("Unknown JLPT level");
  const routes = Object.fromEntries(Object.entries(studyRoutes).map(([tab, path]) => [tab, '/' + level + path]));
  if (level === "n3") routes.Practice = "/n3/practice";
  return routes;
}
export function contentPathForLevel(level) {
  if (!["n2", "n3"].includes(level)) throw new Error("Unknown JLPT level");
  return level === "n3" ? "jlpt/content" : "jlpt/n2/content";
}
