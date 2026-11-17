// A class round must play every teacher question exactly once, in order, and
// score it the way the study games do. These tests drive the reducers the way
// the keyboard and the clock do.

import {
    sniperSeconds, translationSeconds, sniperSegments, roundSummary,
    startSniper, sniperReducer, startTranslation, translationReducer, WRONG_KEY_PENALTY,
    fallingSeconds, linePoints, startFalling, fallingReducer, fallingProgress, fallProgress,
} from "./challengeRounds";

const drill = (code, answers, title = "t") => ({ title, code, answers, difficulty: "medium" });
const prompt = (text, solution) => ({ prompt: text, solution, difficulty: "easy" });
const play = (reducer, state, actions) => actions.reduce(reducer, state);
const keys = (...chars) => chars.map((key) => ({ type: "key", key }));

describe("timers", () => {
    test("keep the games' base times and stretch for long questions", () => {
        expect(sniperSeconds(drill("a_b_", [";", ";"]))).toBe(25);
        expect(sniperSeconds(drill("_".repeat(10), new Array(10).fill(";")))).toBe(40);
        expect(translationSeconds(prompt("p", "int x = 0;"))).toBe(20);
        expect(translationSeconds(prompt("p", "x".repeat(100)))).toBe(60);
    });
});

test("Sniper code splits into text and numbered blanks", () => {
    expect(sniperSegments("f(x)_ g()_", [";", ";"])).toEqual([
        { kind: "text", value: "f(x)" },
        { kind: "blank", index: 0, expected: ";" },
        { kind: "text", value: " g()" },
        { kind: "blank", index: 1, expected: ";" },
    ]);
});

describe("Syntax Sniper round", () => {
    const items = [drill("int x = 0_", [";"], "first"), drill("if (x_ {_", [")", "}"], "second")];

    test("plays each drill once, in the teacher's order", () => {
        const state = play(sniperReducer, startSniper(items), keys(";", ")", "}"));
        expect(state.done).toBe(true);
        expect(state.results).toEqual([{ correct: true }, { correct: true }]);
        expect(roundSummary(state)).toMatchObject({ correct: 2, total: 2, accuracy: 100 });
    });

    test("scores like the game: 10 a key, plus 50 and 5 a second left for a cleared drill", () => {
        const state = play(sniperReducer, startSniper(items), keys(";"));
        expect(state.score).toBe(10 + 50 + 25 * 5);
        expect(state.index).toBe(1);
    });

    test("a wrong key costs half a second and doesn't move the cursor", () => {
        const state = play(sniperReducer, startSniper(items), keys("x"));
        expect(state.timeLeft).toBe(25 - WRONG_KEY_PENALTY);
        expect(state.active).toBe(0);
        expect(state.misses).toBe(1);
        expect(state.shake).toBe(1);
    });

    test("fills blanks one at a time", () => {
        const state = play(sniperReducer, startSniper(items), keys(";", ")"));
        expect(state.filled).toEqual([")", null]);
        expect(state.active).toBe(1);
    });

    test("running out of time misses the drill and moves on", () => {
        const state = play(sniperReducer, startSniper(items), [{ type: "tick", seconds: 25 }]);
        expect(state.results).toEqual([{ correct: false }]);
        expect(state.index).toBe(1);
        expect(state.score).toBe(0);
    });

    test("ignores input after the round ends", () => {
        const done = play(sniperReducer, startSniper(items), keys(";", ")", "}"));
        expect(play(sniperReducer, done, [...keys(";"), { type: "tick", seconds: 99 }])).toBe(done);
    });
});

describe("Translation Terminal round", () => {
    const items = [prompt("Declare score as 0", "int score = 0;"), prompt("Print hi", 'printf("hi");')];

    test("grades with the game's whitespace-tolerant comparison", () => {
        const state = play(translationReducer, startTranslation(items), [
            { type: "submit", answer: "int score=0;" },
            { type: "submit", answer: 'printf("hi")' },
        ]);
        expect(state.done).toBe(true);
        expect(state.results).toEqual([{ correct: true }, { correct: false }]);
        expect(roundSummary(state)).toMatchObject({ correct: 1, total: 2, accuracy: 50, score: 50 + 20 * 5 });
    });

    test("an empty answer doesn't use up the question", () => {
        const start = startTranslation(items);
        expect(translationReducer(start, { type: "submit", answer: "   " })).toBe(start);
    });

    test("running out of time marks the question wrong and says so", () => {
        const state = play(translationReducer, startTranslation(items), [{ type: "tick", seconds: 20 }]);
        expect(state.results).toEqual([{ correct: false }]);
        expect(state.feedback).toMatchObject({ correct: false, timedOut: true });
        expect(state.index).toBe(1);
    });
});

describe("Bug Smasher round", () => {
    const bug = (buggy, correct) => ({ buggy, correct, category: "" });
    const lines = [bug("int a = 1", "int a = 1;"), bug("int b = 2", "int b = 2;"), bug("return 0", "return 0;"), bug("x++", "x++;")];
    const type = (value) => ({ type: "input", value });
    const tick = (seconds) => ({ type: "tick", seconds });
    const falling = (state) => state.falling.map((f) => f.index);

    test("lines take the game's 26 seconds to fall, longer for long fixes", () => {
        expect(fallingSeconds(bug("x", "x;"))).toBe(26);
        expect(fallingSeconds(bug("x", "x".repeat(100)))).toBe(62);
    });

    test("scores like the game, doubling after five lines in a row", () => {
        expect(linePoints(lines[0], 0)).toBe(30 + 7);
        expect(linePoints(lines[0], 4)).toBe(37);
        expect(linePoints(lines[0], 5)).toBe(74);
    });

    test("drops the teacher's lines in order, two at most, six seconds apart", () => {
        const start = startFalling(lines);
        expect(falling(start)).toEqual([0]);
        expect(falling(play(fallingReducer, start, [tick(5.9)]))).toEqual([0]);
        const two = play(fallingReducer, start, [tick(6)]);
        expect(falling(two)).toEqual([0, 1]);
        expect(falling(play(fallingReducer, two, [tick(6)]))).toEqual([0, 1]);
        expect(fallProgress(two, two.falling[0])).toBeCloseTo(6 / 26);
    });

    test("two falling lines always sit in different lanes", () => {
        const lanes = (state) => state.falling.map((f) => f.lane);
        const two = play(fallingReducer, startFalling(lines), [tick(6)]);
        expect(lanes(two)).toEqual([0, 1]);
        const afterFix = play(fallingReducer, two, [type("int b = 2;"), tick(6)]);
        expect(falling(afterFix)).toEqual([0, 2]);
        expect(lanes(afterFix)).toEqual([0, 1]);
        const alone = play(fallingReducer, afterFix, [type("int a = 1;"), type("return 0;")]);
        expect(falling(alone)).toEqual([3]);
        expect(lanes(alone)).toEqual([0]);
    });

    test("typing the fix clears the line, spacing aside, and the next drops at once", () => {
        const state = play(fallingReducer, startFalling(lines), [type("int a=1;")]);
        expect(state.results[0]).toEqual({ correct: true });
        expect(state.score).toBe(37);
        expect(state.input).toBe("");
        expect(falling(state)).toEqual([1]);
        expect(state.lastEvent).toMatchObject({ index: 0, correct: true, points: 37 });
    });

    test("highlights the line being typed, and retyping the bug doesn't clear it", () => {
        const start = startFalling(lines);
        expect(fallingReducer(start, type("int  a")).target).toBe(0);
        const copied = fallingReducer(start, type("int a = 1"));
        expect(copied.target).toBe(0);
        expect(copied.results).toEqual([]);
        expect(fallingReducer(start, type("int a = 2")).target).toBeNull();
    });

    test("clears whichever falling line was fixed, not only the oldest", () => {
        const state = play(fallingReducer, startFalling(lines), [tick(6), type("int b = 2;")]);
        expect(state.results[1]).toEqual({ correct: true });
        expect(falling(state)).toEqual([0]);
    });

    test("a line that lands is missed and breaks the streak", () => {
        const state = play(fallingReducer, startFalling(lines), [type("int a = 1;"), tick(26)]);
        expect(state.results[1]).toEqual({ correct: false });
        expect(state.streak).toBe(0);
        expect(state.bestStreak).toBe(1);
        expect(fallingProgress(state)).toEqual({ fixed: 1, missed: 1, left: 2 });
        expect(falling(state)).toEqual([2]);
    });

    test("a long gap, like a hidden tab, lands what was falling and starts the next line at the top", () => {
        const state = play(fallingReducer, startFalling(lines), [tick(6), tick(1000)]);
        expect(state.results).toEqual([{ correct: false }, { correct: false }]);
        expect(state.falling).toEqual([{ index: 2, elapsed: 0, lane: 0 }]);
    });

    test("ends once every line is fixed or landed", () => {
        const state = play(fallingReducer, startFalling(lines), lines.map((l) => type(l.correct)));
        expect(state.done).toBe(true);
        expect(roundSummary(state)).toEqual({ score: 37 + 37 + 36 + 32, correct: 4, total: 4, accuracy: 100 });
        expect(play(fallingReducer, state, [type("x++;"), tick(99)])).toBe(state);
    });
});

test("an empty round scores zero instead of dividing by zero", () => {
    expect(roundSummary({ items: [], results: [], score: 0 })).toEqual({ score: 0, correct: 0, total: 0, accuracy: 0 });
});
