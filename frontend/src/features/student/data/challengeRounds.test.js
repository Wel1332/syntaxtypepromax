// A class round must play every teacher question exactly once, in order, and
// score it the way the study games do. These tests drive the reducers the way
// the keyboard and the clock do.

import {
    sniperSeconds, translationSeconds, sniperSegments, roundSummary,
    startSniper, sniperReducer, startTranslation, translationReducer, WRONG_KEY_PENALTY,
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

test("an empty round scores zero instead of dividing by zero", () => {
    expect(roundSummary({ items: [], results: [], score: 0 })).toEqual({ score: 0, correct: 0, total: 0, accuracy: 0 });
});
