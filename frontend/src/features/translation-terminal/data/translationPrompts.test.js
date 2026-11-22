// Objective 3.2 — >=30 challenges per bank, spread across the course's four
// topics: basic programming, conditionals, loops and functions.
//
// An earlier bank held 30 prompts *between* its two halves, most of them on one
// topic. Counting alone therefore proved nothing about coverage, which is what
// these tests exist to fix.

import { practiceBank, testBank, coverageOf, TOPICS } from './translationPrompts';

const banks = [
    ['practiceBank', practiceBank, /^P2-\d{2}$/],
    ['testBank', testBank, /^T2-\d{2}$/],
];

describe.each(banks)('%s (Objective 3.2)', (name, bank, idPattern) => {
    it('holds at least 30 challenges on its own', () => {
        expect(bank.length).toBeGreaterThanOrEqual(30);
    });

    it('uses second-set ids, so results never mix with the first question set', () => {
        bank.forEach((p) => expect(p.id).toMatch(idPattern));
    });

    it('covers each of the four course topics', () => {
        const coverage = coverageOf(bank);
        TOPICS.forEach((topic) => {
            expect(coverage[topic]).toBeGreaterThan(0);
        });
    });

    it('is not dominated by any single topic', () => {
        const coverage = coverageOf(bank);
        const most = Math.max(...Object.values(coverage));
        // Before the rebalance one topic held ~57% of the bank.
        expect(most / bank.length).toBeLessThanOrEqual(0.34);
    });

    it('tags every prompt with a known topic', () => {
        bank.forEach((p) => {
            expect(TOPICS).toContain(p.topic);
        });
    });

    it('gives every prompt a unique id, a prompt and a solution', () => {
        const ids = bank.map((p) => p.id);
        expect(new Set(ids).size).toBe(ids.length);
        bank.forEach((p) => {
            expect(p.prompt.length).toBeGreaterThan(0);
            expect(p.solution.length).toBeGreaterThan(0);
        });
    });
});

it('keeps the practice and test banks disjoint so practice cannot leak answers', () => {
    const testSolutions = new Set(testBank.map((p) => p.solution));
    const leaked = practiceBank.filter((p) => testSolutions.has(p.solution));
    expect(leaked.map((p) => p.id)).toEqual([]);
});
