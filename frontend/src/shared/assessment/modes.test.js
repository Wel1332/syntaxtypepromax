// Attempt limits are a study control: the Pre-Test and Post-Test are one shot
// each. Before these were reconciled against the server they lived
// only in localStorage, so switching device handed the student a fresh set.
// These tests pin the reconcile rules, including the ones that are easy to get
// backwards — counts must never move down, and a teacher reset must survive the
// next sync even though the server's rows are never deleted.

import { authFetch } from "../api/authFetch";
import * as modes from "./modes";

jest.mock("../api/authFetch", () => ({ authFetch: jest.fn() }));
jest.mock("../api/client", () => ({ API_BASE: "" }));
jest.mock("../auth/AuthUtils", () => ({ getAuthToken: () => "test-token" }));
jest.mock("../auth/JwtUtils", () => ({ getUserId: () => 42 }));

let clock = 0;
const score = (challengeType, modeType, value = 0) => ({
    challengeType,
    modeType,
    score: value,
    // Distinct, increasing timestamps: the reconcile orders rows oldest-first.
    submittedAt: new Date(Date.UTC(2026, 0, 1, 0, 0, clock++)).toISOString(),
});
const okResponse = (body) => ({ ok: true, json: async () => body });

// modes.js keeps no module-level state — every counter is read from
// localStorage on demand — so clearing storage fully isolates each test.
// (Resetting the module registry here would hand modes.js a different
// authFetch mock than the one these assertions drive.)
beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    clock = 0;
});

describe("syncAttemptsFromServer", () => {
    test("counts the student's server-side scores as used attempts", async () => {
        authFetch.mockResolvedValue(okResponse([score("FALLING_WORDS", "PRE_TEST")]));

        expect(modes.canStartMode(modes.GAME.FALLING, modes.MODE.PRE_TEST)).toBe(true);
        await expect(modes.syncAttemptsFromServer()).resolves.toBe(true);

        // Pre-Test allows exactly one attempt, and the server says it was used.
        expect(modes.getAttempts(modes.GAME.FALLING, modes.MODE.PRE_TEST)).toBe(1);
        expect(modes.canStartMode(modes.GAME.FALLING, modes.MODE.PRE_TEST)).toBe(false);
    });

    test("this is the device-switch fix: a fresh browser still sees the attempt", async () => {
        // Nothing in localStorage — exactly the state of a second device.
        authFetch.mockResolvedValue(okResponse([
            score("SYNTAX_SAVER", "PRE_TEST"),
            score("SYNTAX_SAVER", "POST_TEST"),
            score("SYNTAX_SAVER", "POST_TEST"),
        ]));
        await modes.syncAttemptsFromServer();

        expect(modes.canStartMode(modes.GAME.SNIPER, modes.MODE.PRE_TEST)).toBe(false);
        // Post-Test allows one; it is spent.
        expect(modes.attemptsRemaining(modes.GAME.SNIPER, modes.MODE.POST_TEST)).toBe(0);
    });

    test("never lowers a local count, so a failed submission still costs an attempt", async () => {
        modes.recordAttempt(modes.GAME.TRANSLATION, modes.MODE.PRE_TEST, { score: 10 });
        authFetch.mockResolvedValue(okResponse([])); // submission never reached the server

        await modes.syncAttemptsFromServer();

        expect(modes.getAttempts(modes.GAME.TRANSLATION, modes.MODE.PRE_TEST)).toBe(1);
    });

    test("a failed fetch reports false and does not unlock anything", async () => {
        modes.recordAttempt(modes.GAME.FALLING, modes.MODE.PRE_TEST, { score: 5 });
        authFetch.mockRejectedValue(new Error("offline"));

        await expect(modes.syncAttemptsFromServer()).resolves.toBe(false);
        expect(modes.canStartMode(modes.GAME.FALLING, modes.MODE.PRE_TEST)).toBe(false);
    });

    test("a non-OK response reports false and leaves counts alone", async () => {
        authFetch.mockResolvedValue({ ok: false, json: async () => [] });
        await expect(modes.syncAttemptsFromServer()).resolves.toBe(false);
    });

    test("ignores scores with no modeType (ordinary non-assessment plays)", async () => {
        authFetch.mockResolvedValue(okResponse([
            score("FALLING_WORDS", null),
            score("FALLING_WORDS", "PRACTICE"),
        ]));
        await modes.syncAttemptsFromServer();

        expect(modes.canStartMode(modes.GAME.FALLING, modes.MODE.PRE_TEST)).toBe(true);
    });

    test("does not let one game's scores consume another game's attempts", async () => {
        authFetch.mockResolvedValue(okResponse([score("FALLING_WORDS", "PRE_TEST")]));
        await modes.syncAttemptsFromServer();

        expect(modes.canStartMode(modes.GAME.FALLING, modes.MODE.PRE_TEST)).toBe(false);
        expect(modes.canStartMode(modes.GAME.SNIPER, modes.MODE.PRE_TEST)).toBe(true);
        expect(modes.canStartMode(modes.GAME.TRANSLATION, modes.MODE.PRE_TEST)).toBe(true);
    });
});

describe("score history follows the student across devices", () => {
    test("rebuilds Best/Low from the server on a browser that has never played", () => {
        authFetch.mockResolvedValue(okResponse([
            score("SYNTAX_SAVER", "POST_TEST", 40),
            score("SYNTAX_SAVER", "POST_TEST", 90),
        ]));

        expect(modes.getHighLow(modes.GAME.SNIPER, modes.MODE.POST_TEST).count).toBe(0);

        return modes.syncAttemptsFromServer().then(() => {
            const stats = modes.getHighLow(modes.GAME.SNIPER, modes.MODE.POST_TEST);
            expect(stats).toMatchObject({ highest: 90, lowest: 40, count: 2, latest: 90 });
        });
    });

    test("does not discard a longer local history", async () => {
        modes.recordAttempt(modes.GAME.SNIPER, modes.MODE.POST_TEST, { score: 55 });
        modes.recordAttempt(modes.GAME.SNIPER, modes.MODE.POST_TEST, { score: 65 });
        authFetch.mockResolvedValue(okResponse([score("SYNTAX_SAVER", "POST_TEST", 55)]));

        await modes.syncAttemptsFromServer();

        expect(modes.getHighLow(modes.GAME.SNIPER, modes.MODE.POST_TEST).count).toBe(2);
    });
});

describe("teacher reset survives the next sync", () => {
    test("resetMode gives a fresh attempt even though the score row remains", async () => {
        const server = [score("FALLING_WORDS", "PRE_TEST")];
        authFetch.mockResolvedValue(okResponse(server));

        await modes.syncAttemptsFromServer();
        expect(modes.canStartMode(modes.GAME.FALLING, modes.MODE.PRE_TEST)).toBe(false);

        modes.resetMode(modes.GAME.FALLING, modes.MODE.PRE_TEST);
        expect(modes.canStartMode(modes.GAME.FALLING, modes.MODE.PRE_TEST)).toBe(true);

        // The row is still on the server; the reset must not be undone by sync.
        await modes.syncAttemptsFromServer();
        expect(modes.canStartMode(modes.GAME.FALLING, modes.MODE.PRE_TEST)).toBe(true);
    });

    test("an attempt made AFTER a reset is counted again", async () => {
        authFetch.mockResolvedValue(okResponse([score("FALLING_WORDS", "PRE_TEST")]));
        await modes.syncAttemptsFromServer();
        modes.resetMode(modes.GAME.FALLING, modes.MODE.PRE_TEST);

        // Student plays again; the server now holds two rows.
        authFetch.mockResolvedValue(okResponse([
            score("FALLING_WORDS", "PRE_TEST"),
            score("FALLING_WORDS", "PRE_TEST"),
        ]));
        await modes.syncAttemptsFromServer();

        expect(modes.getAttempts(modes.GAME.FALLING, modes.MODE.PRE_TEST)).toBe(1);
        expect(modes.canStartMode(modes.GAME.FALLING, modes.MODE.PRE_TEST)).toBe(false);
    });
});

// The study order, per game: Pre-Test (1 attempt) -> exactly N Practice rounds
// -> Post-Test (1 attempt) -> unlimited Practice.
describe("mode order: Pre-Test, then N Practice rounds, then Post-Test", () => {
    const { GAME, MODE, LOCK } = modes;
    const N = modes.REQUIRED_PRACTICE_ROUNDS;
    const practise = (game, times) => {
        for (let i = 0; i < times; i++) modes.recordAttempt(game, MODE.PRACTICE, { score: i });
    };
    const rows = (challengeType, mode, times) =>
        Array.from({ length: times }, () => score(challengeType, mode));

    test("the required number of practice rounds is 20", () => {
        expect(N).toBe(20);
    });

    test("a new student can start only the Pre-Test", () => {
        expect(modes.canStartMode(GAME.SNIPER, MODE.PRE_TEST)).toBe(true);
        expect(modes.getLockReason(GAME.SNIPER, MODE.PRACTICE)).toBe(LOCK.NEED_PRE_TEST);
        expect(modes.getLockReason(GAME.SNIPER, MODE.POST_TEST)).toBe(LOCK.NEED_PRE_TEST);
    });

    test("finishing the Pre-Test opens Practice, with N rounds to do", () => {
        modes.recordAttempt(GAME.SNIPER, MODE.PRE_TEST, { score: 10 });

        expect(modes.canStartMode(GAME.SNIPER, MODE.PRACTICE)).toBe(true);
        expect(modes.attemptsRemaining(GAME.SNIPER, MODE.PRACTICE)).toBe(N);
        expect(modes.getLockReason(GAME.SNIPER, MODE.POST_TEST)).toBe(LOCK.NEED_PRACTICE);
    });

    test("one round short of N, the Post-Test is still locked", () => {
        modes.recordAttempt(GAME.SNIPER, MODE.PRE_TEST, { score: 10 });
        practise(GAME.SNIPER, N - 1);

        expect(modes.getLockReason(GAME.SNIPER, MODE.POST_TEST)).toBe(LOCK.NEED_PRACTICE);
        expect(modes.getPracticeProgress(GAME.SNIPER)).toMatchObject({ done: N - 1, required: N });
    });

    test("after N rounds the Post-Test opens and Practice pauses", () => {
        modes.recordAttempt(GAME.SNIPER, MODE.PRE_TEST, { score: 10 });
        practise(GAME.SNIPER, N);

        expect(modes.canStartMode(GAME.SNIPER, MODE.POST_TEST)).toBe(true);
        // Practice is capped at N so every student reaches the Post-Test with
        // the same amount of practice.
        expect(modes.getLockReason(GAME.SNIPER, MODE.PRACTICE)).toBe(LOCK.PRACTICE_DONE_TAKE_POST);
        expect(modes.canStartMode(GAME.SNIPER, MODE.PRACTICE)).toBe(false);
        expect(modes.nextStepMessage(GAME.SNIPER, MODE.PRACTICE)).toMatch(/Post-Test is unlocked/);
    });

    test("the Post-Test is one attempt, and Practice becomes unlimited after it", () => {
        modes.recordAttempt(GAME.SNIPER, MODE.PRE_TEST, { score: 10 });
        practise(GAME.SNIPER, N);
        modes.recordAttempt(GAME.SNIPER, MODE.POST_TEST, { score: 30 });

        expect(modes.canStartMode(GAME.SNIPER, MODE.POST_TEST)).toBe(false);
        expect(modes.getLockReason(GAME.SNIPER, MODE.PRACTICE)).toBeNull();
        expect(modes.attemptsRemaining(GAME.SNIPER, MODE.PRACTICE)).toBe(Infinity);
        expect(modes.getPracticeProgress(GAME.SNIPER).unlimited).toBe(true);
        expect(modes.nextStepMessage(GAME.SNIPER, MODE.POST_TEST)).toMatch(/unlimited/);
    });

    test("the Pre-Test result screen points the student to Practice", () => {
        modes.recordAttempt(GAME.SNIPER, MODE.PRE_TEST, { score: 10 });
        expect(modes.nextStepMessage(GAME.SNIPER, MODE.PRE_TEST)).toMatch(/Practice is now unlocked/);
        // A round that can be replayed shows no message.
        expect(modes.nextStepMessage(GAME.SNIPER, MODE.PRACTICE)).toBeNull();
    });

    test("practice played before the Pre-Test does not count toward N", () => {
        // Possible for students who played before the order was enforced.
        practise(GAME.SNIPER, N);
        modes.recordAttempt(GAME.SNIPER, MODE.PRE_TEST, { score: 10 });

        expect(modes.getPracticeProgress(GAME.SNIPER).done).toBe(0);
        expect(modes.getLockReason(GAME.SNIPER, MODE.POST_TEST)).toBe(LOCK.NEED_PRACTICE);
    });

    test("practice without a Pre-Test never unlocks the Post-Test", () => {
        practise(GAME.SNIPER, N);
        expect(modes.getLockReason(GAME.SNIPER, MODE.POST_TEST)).toBe(LOCK.NEED_PRE_TEST);
    });

    test("the order is per game: progress in one game unlocks nothing in another", () => {
        modes.recordAttempt(GAME.FALLING, MODE.PRE_TEST, { score: 10 });
        practise(GAME.FALLING, N);

        expect(modes.canStartMode(GAME.FALLING, MODE.POST_TEST)).toBe(true);
        expect(modes.getLockReason(GAME.TRANSLATION, MODE.PRACTICE)).toBe(LOCK.NEED_PRE_TEST);
        expect(modes.getLockReason(GAME.TRANSLATION, MODE.POST_TEST)).toBe(LOCK.NEED_PRE_TEST);
    });

    test("N practice rounds done on another device unlock the Post-Test here", async () => {
        authFetch.mockResolvedValue(okResponse([
            score("SYNTAX_SAVER", "PRE_TEST"),
            ...rows("SYNTAX_SAVER", "PRACTICE", N),
        ]));
        await modes.syncAttemptsFromServer();

        expect(modes.canStartMode(GAME.SNIPER, MODE.POST_TEST)).toBe(true);
        expect(modes.canStartMode(GAME.SNIPER, MODE.PRACTICE)).toBe(false);
    });

    test("on the server too, only practice after the Pre-Test counts", async () => {
        authFetch.mockResolvedValue(okResponse([
            ...rows("SYNTAX_SAVER", "PRACTICE", N), // before the Pre-Test
            score("SYNTAX_SAVER", "PRE_TEST"),
            ...rows("SYNTAX_SAVER", "PRACTICE", 3), // after it
        ]));
        await modes.syncAttemptsFromServer();

        expect(modes.getPracticeProgress(GAME.SNIPER).done).toBe(3);
        expect(modes.getLockReason(GAME.SNIPER, MODE.POST_TEST)).toBe(LOCK.NEED_PRACTICE);
    });

    test("server timestamps with microseconds are ordered correctly", async () => {
        // The backend sends LocalDateTime with more than 3 fractional digits.
        const at = (s) => `2026-01-01T00:00:${s}.123456`;
        authFetch.mockResolvedValue(okResponse([
            { challengeType: "SYNTAX_SAVER", modeType: "PRACTICE", score: 0, submittedAt: at("01") },
            { challengeType: "SYNTAX_SAVER", modeType: "PRE_TEST", score: 0, submittedAt: at("02") },
            { challengeType: "SYNTAX_SAVER", modeType: "PRACTICE", score: 0, submittedAt: at("03") },
        ]));
        await modes.syncAttemptsFromServer();

        expect(modes.getPracticeProgress(GAME.SNIPER).done).toBe(1);
    });

    test("a Pre-Test alone on the server leaves the Post-Test locked", async () => {
        authFetch.mockResolvedValue(okResponse([score("SYNTAX_SAVER", "PRE_TEST")]));
        await modes.syncAttemptsFromServer();

        expect(modes.canStartMode(GAME.SNIPER, MODE.PRACTICE)).toBe(true);
        expect(modes.getLockReason(GAME.SNIPER, MODE.POST_TEST)).toBe(LOCK.NEED_PRACTICE);
    });

    test("a teacher reset of the Pre-Test restarts the practice count", async () => {
        authFetch.mockResolvedValue(okResponse([
            score("SYNTAX_SAVER", "PRE_TEST"),
            ...rows("SYNTAX_SAVER", "PRACTICE", N),
        ]));
        await modes.syncAttemptsFromServer();
        expect(modes.canStartMode(GAME.SNIPER, MODE.POST_TEST)).toBe(true);

        modes.resetMode(GAME.SNIPER, MODE.PRE_TEST);
        await modes.syncAttemptsFromServer();

        // The old practice belongs to the old baseline: it must not carry over.
        expect(modes.getLockReason(GAME.SNIPER, MODE.PRACTICE)).toBe(LOCK.NEED_PRE_TEST);
        expect(modes.getPracticeProgress(GAME.SNIPER).done).toBe(0);
    });
});
