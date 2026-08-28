// Bug-injection frequency for the Bug Smasher module (Objective 1.1).
//
// The objective specifies a *configurable* 15-40% corruption frequency. The rate
// used to be two magic numbers inline in the spawn loop, capped at 30%, with no
// way to change it short of editing the component — so the objective was not met
// on either count.
//
// The rate ramps from minRate to maxRate as the player clears words, so an early
// round stays readable and the back half is meaningfully harder. Injection does
// not begin at all until unlockAfterWords have been cleared, which gives the
// player a calibration period before the first corrupted line appears.
//
// setBugInjectionConfig() is the seam the teacher dashboard drives once drill
// content moves server-side; until then it is also what the test suite uses to
// pin a deterministic rate.

export const BUG_INJECTION_LIMITS = Object.freeze({
    minRate: 0.15,
    maxRate: 0.40,
});

export const BUG_INJECTION_DEFAULTS = Object.freeze({
    // Fraction of spawns that are corrupted when injection first unlocks.
    minRate: 0.15,
    // Ceiling the ramp approaches. The objective's upper bound.
    maxRate: 0.40,
    // Added to the rate per word cleared beyond unlockAfterWords.
    rampPerWord: 0.008,
    // Words the player must clear before any corruption appears.
    unlockAfterWords: 5,
});

const clamp = (value, low, high) => Math.min(high, Math.max(low, value));

let active = { ...BUG_INJECTION_DEFAULTS };

export const getBugInjectionConfig = () => ({ ...active });

/**
 * Override any subset of the configuration. Rates are clamped into the 15-40%
 * band the objective specifies, so a bad value from the dashboard degrades to
 * the nearest legal setting rather than producing an unplayable round.
 *
 * Returns the resulting active config.
 */
export const setBugInjectionConfig = (partial = {}) => {
    const next = { ...active, ...partial };

    next.minRate = clamp(
        Number.isFinite(next.minRate) ? next.minRate : BUG_INJECTION_DEFAULTS.minRate,
        BUG_INJECTION_LIMITS.minRate,
        BUG_INJECTION_LIMITS.maxRate,
    );
    next.maxRate = clamp(
        Number.isFinite(next.maxRate) ? next.maxRate : BUG_INJECTION_DEFAULTS.maxRate,
        BUG_INJECTION_LIMITS.minRate,
        BUG_INJECTION_LIMITS.maxRate,
    );
    // An inverted band would make the ramp run backwards; collapse it instead.
    if (next.maxRate < next.minRate) next.maxRate = next.minRate;

    next.rampPerWord = Math.max(0, Number.isFinite(next.rampPerWord)
        ? next.rampPerWord
        : BUG_INJECTION_DEFAULTS.rampPerWord);
    next.unlockAfterWords = Math.max(0, Math.floor(Number.isFinite(next.unlockAfterWords)
        ? next.unlockAfterWords
        : BUG_INJECTION_DEFAULTS.unlockAfterWords));

    active = next;
    return getBugInjectionConfig();
};

export const resetBugInjectionConfig = () => setBugInjectionConfig(BUG_INJECTION_DEFAULTS);

/**
 * Probability that the next spawn is a corrupted word or line, given how many
 * words the player has cleared this round. Zero until the unlock threshold.
 */
export const bugInjectionChance = (wordsCleared) => {
    const { minRate, maxRate, rampPerWord, unlockAfterWords } = active;
    if (wordsCleared < unlockAfterWords) return 0;
    return Math.min(maxRate, minRate + (wordsCleared - unlockAfterWords) * rampPerWord);
};
