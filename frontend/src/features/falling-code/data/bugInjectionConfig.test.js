// Objective 1.1 — the corruption rate must be configurable and must span 15-40%.
//
// Before this config existed the rate was two literals inline in the spawn loop,
// capped at 30%, so the objective failed on both the range and the "configurable"
// requirement. These tests pin both.

import {
    BUG_INJECTION_LIMITS,
    bugInjectionChance,
    getBugInjectionConfig,
    resetBugInjectionConfig,
    setBugInjectionConfig,
} from './bugInjectionConfig';

describe('bug injection configuration (Objective 1.1)', () => {
    afterEach(() => resetBugInjectionConfig());

    it('spans the full 15-40% band the objective specifies', () => {
        expect(BUG_INJECTION_LIMITS.minRate).toBe(0.15);
        expect(BUG_INJECTION_LIMITS.maxRate).toBe(0.40);
    });

    it('injects nothing until the unlock threshold is reached', () => {
        const { unlockAfterWords } = getBugInjectionConfig();
        expect(bugInjectionChance(unlockAfterWords - 1)).toBe(0);
        expect(bugInjectionChance(unlockAfterWords)).toBeGreaterThan(0);
    });

    it('starts at the configured minimum and ramps upward', () => {
        const { unlockAfterWords, minRate } = getBugInjectionConfig();
        expect(bugInjectionChance(unlockAfterWords)).toBeCloseTo(minRate, 5);
        expect(bugInjectionChance(unlockAfterWords + 20))
            .toBeGreaterThan(bugInjectionChance(unlockAfterWords));
    });

    it('reaches 40% rather than stopping at the old 30% ceiling', () => {
        // Enough cleared words that the ramp is well past 0.30.
        expect(bugInjectionChance(1000)).toBeCloseTo(0.40, 5);
    });

    it('never exceeds the configured maximum', () => {
        setBugInjectionConfig({ maxRate: 0.25 });
        expect(bugInjectionChance(1000)).toBeCloseTo(0.25, 5);
    });

    it('is configurable at runtime', () => {
        setBugInjectionConfig({ minRate: 0.30, unlockAfterWords: 0 });
        expect(bugInjectionChance(0)).toBeCloseTo(0.30, 5);
    });

    it('clamps out-of-band rates instead of producing an unplayable round', () => {
        setBugInjectionConfig({ minRate: 0.99, maxRate: 2 });
        const cfg = getBugInjectionConfig();
        expect(cfg.minRate).toBeLessThanOrEqual(BUG_INJECTION_LIMITS.maxRate);
        expect(cfg.maxRate).toBeLessThanOrEqual(BUG_INJECTION_LIMITS.maxRate);

        setBugInjectionConfig({ minRate: -1, maxRate: -1 });
        expect(getBugInjectionConfig().minRate).toBeGreaterThanOrEqual(BUG_INJECTION_LIMITS.minRate);
    });

    it('ignores non-numeric input rather than producing NaN chances', () => {
        setBugInjectionConfig({ minRate: 'nonsense', rampPerWord: undefined });
        expect(Number.isFinite(bugInjectionChance(50))).toBe(true);
    });
});
