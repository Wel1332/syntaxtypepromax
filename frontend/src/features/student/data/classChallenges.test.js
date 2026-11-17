// What a student sees about each class challenge (attempts, whether it can be
// played) and what gets sent when a round ends.

import { authFetch } from "../../../shared/api/authFetch";
import {
    attemptsInfo, attemptsLabel, playState, groupByClass, attemptBody, questionLabel,
    listMyChallenges, getMyChallenge, submitAttempt, isFinalRefusal,
} from "./classChallenges";

jest.mock("../../../shared/api/authFetch", () => ({ authFetch: jest.fn() }));

const response = (status, body) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
const challenge = (extra = {}) => ({
    challengeId: 7, classroomId: 1, classroomName: "BSIT 1A", game: "SNIPER",
    title: "Week 3", itemCount: 5, maxAttempts: null, attemptsUsed: 0, ...extra,
});

beforeEach(() => jest.clearAllMocks());

describe("attempts", () => {
    test("unlimited when the teacher set no limit", () => {
        expect(attemptsInfo(challenge({ attemptsUsed: 4 }))).toEqual({ used: 4, max: null, remaining: null, exhausted: false });
        expect(attemptsLabel(challenge())).toBe("Unlimited attempts");
        expect(attemptsLabel(challenge({ attemptsUsed: 1 }))).toBe("Unlimited attempts · played 1 time");
    });

    test("counts down to the limit", () => {
        expect(attemptsLabel(challenge({ maxAttempts: 3, attemptsUsed: 1 }))).toBe("2 of 3 attempts left");
        expect(attemptsLabel(challenge({ maxAttempts: 1, attemptsUsed: 0 }))).toBe("1 of 1 attempt left");
        expect(attemptsLabel(challenge({ maxAttempts: 2, attemptsUsed: 2 }))).toBe("All 2 attempts used");
        expect(attemptsInfo(challenge({ maxAttempts: 2, attemptsUsed: 5 })).remaining).toBe(0);
    });
});

describe("playState", () => {
    test("all three study games can be played", () => {
        expect(playState(challenge()).canPlay).toBe(true);
        expect(playState(challenge({ game: "TRANSLATION" })).canPlay).toBe(true);
        expect(playState(challenge({ game: "FALLING" })).canPlay).toBe(true);
    });

    test("a game this page doesn't know yet says so instead of breaking", () => {
        expect(playState(challenge({ game: "GALAXY" }))).toEqual({ canPlay: false, reason: "This game can't be played here yet." });
    });

    test("no attempts left", () => {
        expect(playState(challenge({ maxAttempts: 1, attemptsUsed: 1 }))).toEqual({ canPlay: false, reason: "You've used all 1 attempt." });
    });
});

test("result labels name the question without its answer", () => {
    expect(questionLabel("SNIPER", { title: "Print", code: "x_", answers: [";"] })).toBe("Print");
    expect(questionLabel("TRANSLATION", { prompt: "Declare x", solution: "int x;" })).toBe("Declare x");
    expect(questionLabel("FALLING", { buggy: "int a", correct: "int a;", category: "missing semicolon" })).toBe("int a (missing semicolon)");
    expect(questionLabel("FALLING", { buggy: "int a", correct: "int a;", category: "custom" })).toBe("int a");
    expect(questionLabel("FALLING", { buggy: "int a", correct: "int a;" })).toBe("int a");
});

test("groups by class, keeping the newest-first order", () => {
    const list = [
        challenge({ challengeId: 3, classroomId: 2, classroomName: "BSCS 2B" }),
        challenge({ challengeId: 2 }),
        challenge({ challengeId: 1, classroomId: 2, classroomName: "BSCS 2B" }),
    ];
    expect(groupByClass(list).map((g) => [g.classroomName, g.challenges.map((c) => c.challengeId)])).toEqual([
        ["BSCS 2B", [3, 1]],
        ["BSIT 1A", [2]],
    ]);
});

test("the attempt sent stays inside the server's bounds", () => {
    expect(attemptBody({ score: 345, correct: 4, total: 5, accuracy: 80 }, 61.4)).toEqual({
        score: 345, correctCount: 4, totalCount: 5, accuracy: 80, durationSeconds: 61,
    });
    expect(attemptBody({ score: -3, correct: 0, total: 1, accuracy: 120 }, 1e9)).toMatchObject({
        score: 0, accuracy: 100, durationSeconds: 86400,
    });
});

describe("API", () => {
    test("lists and opens the student's challenges", async () => {
        authFetch.mockResolvedValueOnce(response(200, [challenge()]));
        expect(await listMyChallenges()).toEqual({ ok: true, data: [challenge()] });
        expect(authFetch).toHaveBeenLastCalledWith("/api/class-challenges");

        authFetch.mockResolvedValueOnce(response(200, challenge({ items: [] })));
        await getMyChallenge(7);
        expect(authFetch).toHaveBeenLastCalledWith("/api/class-challenges/7");
    });

    test("submits an attempt as JSON", async () => {
        authFetch.mockResolvedValueOnce(response(200, { attemptsUsed: 1, attemptsRemaining: 2 }));
        const body = { score: 10, correctCount: 1, totalCount: 2, accuracy: 50, durationSeconds: 30 };
        expect(await submitAttempt(7, body)).toEqual({ ok: true, data: { attemptsUsed: 1, attemptsRemaining: 2 } });
        const [path, options] = authFetch.mock.calls[0];
        expect(path).toBe("/api/class-challenges/7/attempts");
        expect(options.method).toBe("POST");
        expect(JSON.parse(options.body)).toEqual(body);
    });

    test("shows the server's reason, and knows a used-up limit can't be retried", async () => {
        authFetch.mockResolvedValueOnce(response(409, { message: "You have used all 2 attempts for this challenge." }));
        const result = await submitAttempt(7, {});
        expect(result).toEqual({ ok: false, status: 409, message: "You have used all 2 attempts for this challenge." });
        expect(isFinalRefusal(result)).toBe(true);
    });

    test("a hidden challenge gets a plain explanation, not the server's bare 'not found'", async () => {
        authFetch.mockResolvedValueOnce(response(404, { message: "Challenge not found." }));
        expect((await getMyChallenge(7)).message).toBe("This challenge isn't available any more. Your teacher may have hidden it.");
    });

    test("a network failure can be retried", async () => {
        authFetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));
        const result = await submitAttempt(7, {});
        expect(result.ok).toBe(false);
        expect(isFinalRefusal(result)).toBe(false);
        expect(result.message).toMatch(/Couldn't reach the server/);
    });
});
