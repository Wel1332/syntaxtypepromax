// Assessment mode primitives shared by SyntaxSniper, TranslationTerminal,
// and FallingTypingTest. Mode metadata, attempt limits, score history, and
// the canonical "remarks" tiering all live here so every game tells the
// student the same story.
//
// Storage is localStorage-only for now — when the backend Score entity gains
// a `modeType` column (Category 2) the read/write helpers below get swapped
// for an authFetch call without touching any consumer.

export const MODE = {
    PRE_TEST: "PRE_TEST",
    PRACTICE: "PRACTICE",
    POST_TEST: "POST_TEST",
};

export const GAME = {
    SNIPER: "sniper",
    TRANSLATION: "translation",
    FALLING: "falling",
};

export const MODE_META = {
    [MODE.PRE_TEST]: {
        key: MODE.PRE_TEST,
        label: "Pre-Test",
        short: "Pre",
        description: "Measure where you're starting from. One shot, no retries.",
        color: "#9C5BE3",
        attemptLimit: 1,
        icon: "📝",
        iconSrc: "/assets/icons/pretest%20icon.png",
    },
    [MODE.PRACTICE]: {
        key: MODE.PRACTICE,
        label: "Practice",
        short: "Practice",
        description: "Drill the material until it sticks. Unlimited attempts, no record kept on the leaderboard.",
        color: "#3ECF6A",
        attemptLimit: Infinity,
        icon: "🛠️",
        iconSrc: "/assets/icons/practice%20icon.png",
    },
    [MODE.POST_TEST]: {
        key: MODE.POST_TEST,
        label: "Post-Test (Final)",
        short: "Final",
        description: "Final assessment — 2 attempts max. Best score counts.",
        color: "#FFC700",
        attemptLimit: 2,
        icon: "🏁",
        iconSrc: "/assets/icons/posttest%20icon.png",
    },
};

const ATTEMPTS_KEY = (game, mode) => `assess:attempts:${game}:${mode}`;
const SCORES_KEY = (game, mode) => `assess:scores:${game}:${mode}`;

const safeRead = (key, fallback) => {
    try {
        const raw = localStorage.getItem(key);
        return raw == null ? fallback : raw;
    } catch {
        return fallback;
    }
};
const safeWrite = (key, value) => {
    try { localStorage.setItem(key, value); } catch {}
};

export const getAttempts = (game, mode) => {
    const raw = safeRead(ATTEMPTS_KEY(game, mode), "0");
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
};

export const attemptsRemaining = (game, mode) => {
    const limit = MODE_META[mode]?.attemptLimit ?? Infinity;
    if (limit === Infinity) return Infinity;
    return Math.max(0, limit - getAttempts(game, mode));
};

export const canStartMode = (game, mode) => attemptsRemaining(game, mode) > 0;

export const getScores = (game, mode) => {
    const raw = safeRead(SCORES_KEY(game, mode), "[]");
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

// Record a finished attempt. `payload` is whatever the game wants to remember
// (score, accuracy, percent, etc.). Returns the new attempt count.
export const recordAttempt = (game, mode, payload) => {
    const next = getAttempts(game, mode) + 1;
    safeWrite(ATTEMPTS_KEY(game, mode), String(next));
    const scores = getScores(game, mode);
    scores.push({ ...payload, at: Date.now() });
    safeWrite(SCORES_KEY(game, mode), JSON.stringify(scores));
    return next;
};

export const getHighLow = (game, mode) => {
    const scores = getScores(game, mode);
    if (scores.length === 0) return { highest: null, lowest: null, count: 0, latest: null };
    const nums = scores.map((s) => Number(s.score) || 0);
    return {
        highest: Math.max(...nums),
        lowest: Math.min(...nums),
        count: scores.length,
        latest: nums[nums.length - 1],
    };
};

export const resetMode = (game, mode) => {
    try {
        localStorage.removeItem(ATTEMPTS_KEY(game, mode));
        localStorage.removeItem(SCORES_KEY(game, mode));
    } catch {}
};

// Universal remarks tiering. Pass a percent (0–100) derived in whatever way
// makes sense for the game (accuracy, completion, HP retained, …).
export const getRemark = (percent) => {
    const p = Math.max(0, Math.min(100, Number(percent) || 0));
    if (p >= 90) return { tier: "mastery",   text: "Outstanding — true mastery.",  tone: "success", color: "#3ECF6A" };
    if (p >= 80) return { tier: "excellent", text: "Excellent mastery!",           tone: "success", color: "#7BE093" };
    if (p >= 65) return { tier: "good",      text: "Good effort — keep refining.", tone: "info",    color: "#3B82F6" };
    if (p >= 50) return { tier: "ok",        text: "On track. Practice more.",     tone: "warning", color: "#FFC700" };
    return            { tier: "review",    text: "Needs review — focus on the basics.", tone: "error",   color: "#EF4444" };
};
