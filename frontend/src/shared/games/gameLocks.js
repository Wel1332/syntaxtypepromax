// Which games can be played. Only the three study games are open; every other
// game is locked for every role. A locked game keeps its route, so an old link
// or bookmark explains the lock instead of landing on "Page Not Found".
//
// To unlock a game, delete its entry from LOCKED_GAMES. Menus, shortcuts and
// routes all read from here, so nothing else needs to change.

export const OPEN_GAMES = [
    { name: "Syntax Sniper", path: "/syntax-sniper" },
    { name: "Translation Terminal", path: "/translation-terminal" },
    { name: "Falling Code", path: "/fallingtypingtest" },
];

// `paths` lists every route the game uses, not just its menu entry.
const LOCKED_GAMES = [
    { name: "Typing Test", paths: ["/typingtest"] },
    { name: "Galaxy Mode", paths: ["/galaxy-new", "/galaxy", "/play/galaxy/:id"] },
    { name: "Logic Puzzles", paths: ["/logic-puzzles"] },
    { name: "Grid Game", paths: ["/grid"] },
    { name: "Bookworm", paths: ["/bookworm"] },
    { name: "Quiz", paths: ["/quiz", "/crossword"] },
];

/** The locked game a route path belongs to, or null if it isn't locked. */
export const lockedGameAt = (path) => LOCKED_GAMES.find((game) => game.paths.includes(path)) ?? null;

export const isGameLocked = (path) => lockedGameAt(path) !== null;
