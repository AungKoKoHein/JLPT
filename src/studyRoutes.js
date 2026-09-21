export const studyRoutes = {
  Vocab: "/vocab",
  Grammar: "/grammar",
  Kanji: "/kanji",
  Listening: "/listening",
  Reading: "/reading",
  "Mock exam": "/mock-exam",
};

export function studyTabFromPath(pathname) {
  const path = pathname.replace(/\/+$/, "") || "/";
  return Object.keys(studyRoutes).find((tab) => studyRoutes[tab] === path) || "Vocab";
}
