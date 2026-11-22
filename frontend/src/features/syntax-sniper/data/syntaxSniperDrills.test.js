import { practiceBank, testBank } from "./syntaxSniperDrills";
import { TOPICS } from "../../../shared/assessment/topics";

const SESSION_LENGTH = 6;

describe.each([
    ["practiceBank", practiceBank, /^P2-\d{2}$/],
    ["testBank", testBank, /^T2-\d{2}$/],
])("%s", (name, bank, idPattern) => {
    it("can fill a whole session", () => {
        expect(bank.length).toBeGreaterThanOrEqual(SESSION_LENGTH);
    });

    it("has one answer for every blank, and only ; or , as answers", () => {
        bank.forEach((d) => {
            expect([d.id, (d.code.match(/_/g) || []).length]).toEqual([d.id, d.answers.length]);
            d.answers.forEach((a) => expect([";", ","]).toContain(a));
        });
    });

    it("uses unique second-set ids, since each played drill is stored by id", () => {
        const ids = bank.map((d) => d.id);
        expect(new Set(ids).size).toBe(ids.length);
        ids.forEach((id) => expect(id).toMatch(idPattern));
    });

    it("spreads evenly over the four course topics", () => {
        const counts = TOPICS.map((t) => bank.filter((d) => d.topic === t).length);
        expect(counts.every((c) => c === bank.length / TOPICS.length)).toBe(true);
        bank.forEach((d) => expect(TOPICS).toContain(d.topic));
    });

    it("tags every drill with a known difficulty", () => {
        bank.forEach((d) => expect(["easy", "medium", "hard"]).toContain(d.difficulty));
    });
});

it("keeps the practice and test drills different so practice cannot leak the test", () => {
    const testCode = new Set(testBank.map((d) => d.code));
    expect(practiceBank.filter((d) => testCode.has(d.code)).map((d) => d.id)).toEqual([]);
});
