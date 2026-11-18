import { OPEN_GAMES, isGameLocked, lockedGameAt } from "./gameLocks";

describe("game locks", () => {
    it("keeps the three study games open", () => {
        expect(OPEN_GAMES.map((g) => g.path)).toEqual(["/syntax-sniper", "/translation-terminal", "/fallingtypingtest"]);
        OPEN_GAMES.forEach((g) => expect(isGameLocked(g.path)).toBe(false));
    });

    it.each([
        ["/typingtest", "Typing Test"],
        ["/galaxy-new", "Galaxy Mode"],
        ["/galaxy", "Galaxy Mode"],
        ["/play/galaxy/:id", "Galaxy Mode"],
        ["/logic-puzzles", "Logic Puzzles"],
        ["/grid", "Grid Game"],
        ["/bookworm", "Bookworm"],
        ["/quiz", "Quiz"],
        ["/crossword", "Quiz"],
    ])("locks %s as %s", (path, name) => {
        expect(isGameLocked(path)).toBe(true);
        expect(lockedGameAt(path).name).toBe(name);
    });

    it.each(["/dashboard", "/lessons/all", "/lessons/view/:id", "/class-challenges", "/class-challenges/:challengeId/play", "/leaderboard", "/my-stats"])(
        "leaves %s alone",
        (path) => {
            expect(isGameLocked(path)).toBe(false);
            expect(lockedGameAt(path)).toBeNull();
        },
    );

    it("matches whole paths only", () => {
        expect(isGameLocked("/typingtest/extra")).toBe(false);
        expect(isGameLocked("/grid-game")).toBe(false);
        expect(isGameLocked(undefined)).toBe(false);
    });
});
