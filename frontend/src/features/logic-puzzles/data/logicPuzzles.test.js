// Objective 5.2 — >=40 logic puzzle challenges tied to C constructs.
//
// This module had no implementation at all before, so these tests double as the
// specification: the count, the construct tagging, and the internal consistency
// that stops a puzzle shipping with an answer index pointing at nothing.

import {
    logicPuzzles,
    CONSTRUCTS,
    DIFFICULTIES,
    coverageByConstruct,
    shuffled,
} from './logicPuzzles';

describe('logic puzzle bank (Objective 5.2)', () => {
    it('delivers at least 40 challenges', () => {
        expect(logicPuzzles.length).toBeGreaterThanOrEqual(40);
    });

    it('ties every puzzle to a known C construct', () => {
        logicPuzzles.forEach((p) => {
            expect(CONSTRUCTS).toContain(p.construct);
        });
    });

    it('covers every construct', () => {
        const coverage = coverageByConstruct();
        CONSTRUCTS.forEach((c) => {
            expect(coverage[c]).toBeGreaterThan(0);
        });
    });

    it('uses only known difficulty levels', () => {
        logicPuzzles.forEach((p) => {
            expect(DIFFICULTIES).toContain(p.difficulty);
        });
    });

    it('gives every puzzle a unique id', () => {
        const ids = logicPuzzles.map((p) => p.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    it('points every answer at a real choice', () => {
        logicPuzzles.forEach((p) => {
            expect(Number.isInteger(p.answer)).toBe(true);
            expect(p.answer).toBeGreaterThanOrEqual(0);
            expect(p.answer).toBeLessThan(p.choices.length);
        });
    });

    it('offers at least two distinct choices per puzzle', () => {
        logicPuzzles.forEach((p) => {
            expect(p.choices.length).toBeGreaterThanOrEqual(2);
            expect(new Set(p.choices).size).toBe(p.choices.length);
        });
    });

    it('explains every answer, because a wrong answer with no explanation teaches nothing', () => {
        logicPuzzles.forEach((p) => {
            expect(p.why.length).toBeGreaterThan(20);
            expect(p.code.length).toBeGreaterThan(0);
            expect(p.question.length).toBeGreaterThan(0);
        });
    });

    it('does not park the correct answer in the same slot every time', () => {
        // A bank where the answer is always choices[0] is guessable without
        // reading the code, which would measure nothing.
        const slots = new Set(logicPuzzles.map((p) => p.answer));
        expect(slots.size).toBeGreaterThan(1);
    });

    it('shuffles without losing or duplicating puzzles', () => {
        const out = shuffled();
        expect(out).toHaveLength(logicPuzzles.length);
        expect(new Set(out.map((p) => p.id)).size).toBe(logicPuzzles.length);
    });
});
