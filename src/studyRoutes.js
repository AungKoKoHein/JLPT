export const studyRoutes = {
  Vocab: "/vocab",
  Grammar: "/grammar",
  Kanji: "/kanji",
  Reading: "/reading",
  "Mock exam": "/mock-exam",
};

export function studyTabFromPath(pathname) {
  const level = levelFromPath(pathname);
  if (level === 'aws') return Object.entries(routesForLevel('aws')).find(([, route]) => route === pathname.replace(/\/+$/, ''))?.[0] || 'Part 1';
  const path = pathname.replace(/^\/n[23](?=\/|$)/, "").replace(/\/+$/, "") || "/";
  const routes = routesForLevel(level);
  return Object.keys(routes).find((tab) => routes[tab] === `/${level}${path}`) || "Vocab";
}

export function levelFromPath(pathname) {
  if (/^\/aws(?:\/|$)/.test(pathname)) return 'aws';
  return /^\/n2(?:\/|$)/.test(pathname) ? "n2" : "n3";
}
export function routesForLevel(level) {
  if (level === 'aws') return { 'Part 1': '/aws/part-1', 'Part 2': '/aws/part-2', 'Part 3': '/aws/part-3', 'Part 4': '/aws/part-4', Practice: '/aws/practice' };
  if (!["n2", "n3"].includes(level)) throw new Error("Unknown JLPT level");
  const routes = Object.fromEntries(Object.entries(studyRoutes).map(([tab, path]) => [tab, '/' + level + path]));
  if (level === "n3") routes.Practice = "/n3/practice";
  return routes;
}
export function contentPathForLevel(level) {
  if (!["n2", "n3"].includes(level)) throw new Error("Unknown JLPT level");
  return level === "n3" ? "jlpt/content" : "jlpt/n2/content";
}
