// Attempt limits are a study control: the Pre-Test is meant to be one shot and
// the Post-Test two. Before these were reconciled against the server they lived
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
        // Post-Test allows two; both are spent.
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

describe("Post-Test gating is unaffected", () => {
    test("Post-Test stays locked until a Pre-Test exists on the server", async () => {
        authFetch.mockResolvedValue(okResponse([]));
        await modes.syncAttemptsFromServer();
        expect(modes.isModeLocked(modes.GAME.SNIPER, modes.MODE.POST_TEST)).toBe(true);

        authFetch.mockResolvedValue(okResponse([score("SYNTAX_SAVER", "PRE_TEST")]));
        await modes.syncAttemptsFromServer();
        expect(modes.isModeLocked(modes.GAME.SNIPER, modes.MODE.POST_TEST)).toBe(false);
    });
});
