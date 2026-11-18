import { practiceBank, testBank, buildChallengeForMode } from "./fallingBanks";

const CATEGORIES = ["missing-terminator", "mismatched-delimiter", "incorrect-keyword", "malformed-declaration", "wrong-operator"];

describe.each([
    ["practiceBank", practiceBank],
    ["testBank", testBank],
])("%s", (name, bank) => {
    it("fills every pool", () => {
        ["words", "wrongWords", "codeLines", "buggyLines", "sequenceBlocks"].forEach((pool) => {
            expect([pool, bank[pool].length > 0]).toEqual([pool, true]);
        });
    });

    it("covers at least four kinds of bug (OBJ1)", () => {
        const kinds = new Set(bank.buggyLines.map((b) => b.category));
        expect(kinds.size).toBeGreaterThanOrEqual(4);
        kinds.forEach((k) => expect(CATEGORIES).toContain(k));
    });

    it("shows something different from the fix on every bug line and misspelling", () => {
        [...bank.buggyLines, ...bank.wrongWords].forEach((b) => expect(b.buggy).not.toBe(b.correct));
    });

    it("has sequences of two or three lines", () => {
        bank.sequenceBlocks.forEach((s) => expect([2, 3]).toContain(s.length));
    });
});

it("keeps everything but the keyword list different between practice and the test", () => {
    const shared = (a, b) => a.filter((x) => b.includes(x));
    expect(shared(practiceBank.codeLines, testBank.codeLines)).toEqual([]);
    expect(shared(practiceBank.buggyLines.map((b) => b.correct), testBank.buggyLines.map((b) => b.correct))).toEqual([]);
    expect(shared(practiceBank.wrongWords.map((w) => w.buggy), testBank.wrongWords.map((w) => w.buggy))).toEqual([]);
    expect(shared(practiceBank.sequenceBlocks.map(String), testBank.sequenceBlocks.map(String))).toEqual([]);
});

describe("buildChallengeForMode", () => {
    it("plays Practice from the practice bank and both tests from the test bank", () => {
        expect(buildChallengeForMode("PRACTICE").codeLines).toBe(practiceBank.codeLines);
        expect(buildChallengeForMode("PRE_TEST").codeLines).toBe(testBank.codeLines);
        expect(buildChallengeForMode("POST_TEST").buggyLines).toBe(testBank.buggyLines);
    });

    it("keeps the timer and lives as before", () => {
        expect(buildChallengeForMode("PRACTICE")).toMatchObject({ testTimer: 90, maxLives: 5 });
        expect(buildChallengeForMode("PRE_TEST")).toMatchObject({ testTimer: 60, maxLives: 3 });
    });

    it("lets faculty-authored bug lines replace only that pool", () => {
        const authored = [{ buggy: "a", correct: "a;", category: "missing-terminator" }];
        const c = buildChallengeForMode("PRE_TEST", { buggyLines: authored });
        expect(c.buggyLines).toBe(authored);
        expect(c.codeLines).toBe(testBank.codeLines);
    });
});
