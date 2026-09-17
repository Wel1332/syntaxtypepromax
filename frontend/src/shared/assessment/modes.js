// Assessment mode primitives shared by SyntaxSniper, TranslationTerminal,
// and FallingTypingTest. Mode metadata, attempt limits, score history, and
// the canonical "remarks" tiering all live here so every game tells the
// student the same story.
//
// localStorage is a CACHE, not the record. The authoritative attempt count is
// on the server: every finished Pre/Post-Test attempt writes a Score row
// carrying its modeType, so "how many attempts has this student used" is just
// "how many of their Score rows match this game + mode". Call
// syncAttemptsFromServer() on mount before trusting the local count —
// see the comment on that function for why.

import { getUserId } from "../auth/JwtUtils";
import { getAuthToken } from "../auth/AuthUtils";
import { API_BASE } from "../api/client";
import { authFetch } from "../api/authFetch";

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

// Scope every key by the logged-in user id so pre/post-test attempts and
// scores never carry over between accounts sharing the same browser. Falls
// back to "anon" when no one is logged in.
const userScope = () => {
    const id = getUserId(getAuthToken());
    return id != null ? `u${id}` : "anon";
};

const ATTEMPTS_KEY = (game, mode) => `assess:${userScope()}:attempts:${game}:${mode}`;
const SCORES_KEY = (game, mode) => `assess:${userScope()}:scores:${game}:${mode}`;
// Last server-side attempt count observed by syncAttemptsFromServer().
const SERVER_SEEN_KEY = (game, mode) => `assess:${userScope()}:seen:${game}:${mode}`;
// Server count at the moment a teacher last reset this mode. Server rows are
// never deleted, so a reset cannot lower the server's count — it records where
// to start counting from instead. See resetMode().
const RESET_BASE_KEY = (game, mode) => `assess:${userScope()}:resetbase:${game}:${mode}`;

// One-time cleanup of legacy un-scoped keys (`assess:attempts:…` /
// `assess:scores:…`) left by the pre-user-scoping version. These were the
// source of cross-account carry-over; new keys always have a user-scope
// segment, so this pattern only matches the old format.
(() => {
    try {
        const legacy = /^assess:(attempts|scores):/;
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key && legacy.test(key)) localStorage.removeItem(key);
        }
    } catch {}
})();

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

// True once the student has completed at least one Pre-Test for this game.
export const isPreTestComplete = (game) => getAttempts(game, MODE.PRE_TEST) > 0;

// The Post-Test is gated behind the Pre-Test: a student must establish a
// baseline before they can be graded. Pre-Test and Practice are never locked.
export const isModeLocked = (game, mode) =>
    mode === MODE.POST_TEST && !isPreTestComplete(game);

export const canStartMode = (game, mode) =>
    !isModeLocked(game, mode) && attemptsRemaining(game, mode) > 0;

// Maps a GAME to the challengeType its scores are submitted under, so a
// server-side Score row can be attributed back to the game that produced it.
// These strings are the contract with the backend — they must match the
// literals the games pass to submitScore().
const CHALLENGE_TYPE = {
    [GAME.SNIPER]: "SYNTAX_SAVER",
    [GAME.TRANSLATION]: "CODE_CHALLENGES",
    [GAME.FALLING]: "FALLING_WORDS",
};

// Modes whose attempt count is capped and therefore worth reconciling.
// PRACTICE is unlimited, so counting it would be wasted work.
const LIMITED_MODES = [MODE.PRE_TEST, MODE.POST_TEST];

/**
 * Reconcile the local attempt counters against the student's own score rows.
 *
 * Without this, attempt limits are per-BROWSER rather than per-student: a
 * student who opened the site on a phone, a lab machine, or a fresh profile
 * got a clean set of Pre-Test and Post-Test attempts, because the only record
 * of the attempts they had already used lived in the other device's
 * localStorage. That silently breaks the "one shot" Pre-Test the study
 * depends on.
 *
 * Counts only ever move UP. If the local counter is higher than the server's,
 * an attempt was played whose score submission failed — that is still an
 * attempt, and lowering the count to match the server would hand the student a
 * free retry.
 *
 * Returns true when the counters were reconciled, false when the fetch failed
 * (offline, expired token). On false the caller keeps the local counts: a
 * network blip must not unlock a fresh Pre-Test.
 */
export const syncAttemptsFromServer = async () => {
    let scores;
    try {
        const res = await authFetch(`${API_BASE}/api/scores/me`);
        if (!res.ok) return false;
        scores = await res.json();
    } catch {
        return false;
    }
    if (!Array.isArray(scores)) return false;

    const rowsByKey = new Map();
    for (const s of scores) {
        if (!s?.challengeType || !s?.modeType) continue;
        const key = `${s.challengeType}|${s.modeType}`;
        if (!rowsByKey.has(key)) rowsByKey.set(key, []);
        rowsByKey.get(key).push(s);
    }

    for (const game of Object.values(GAME)) {
        const challengeType = CHALLENGE_TYPE[game];
        if (!challengeType) continue;
        for (const mode of LIMITED_MODES) {
            const rows = rowsByKey.get(`${challengeType}|${mode}`) || [];
            // Remember what the server reported so a later teacher reset can
            // use it as its baseline.
            safeWrite(SERVER_SEEN_KEY(game, mode), String(rows.length));

            // Oldest first, so dropping the pre-reset rows drops the right ones.
            const base = Number(safeRead(RESET_BASE_KEY(game, mode), "0")) || 0;
            const ordered = rows
                .map((r) => ({ score: Number(r.score) || 0, at: Date.parse(r.submittedAt) || 0 }))
                .sort((a, b) => a.at - b.at)
                .slice(base);

            if (ordered.length > getAttempts(game, mode)) {
                safeWrite(ATTEMPTS_KEY(game, mode), String(ordered.length));
            }
            // Rebuild the Best/Low history too, so the picker shows the same
            // record on every device rather than only what this browser saw.
            // Guarded the same way as the counter: a local history longer than
            // the server's holds attempts whose submission failed.
            if (ordered.length > getScores(game, mode).length) {
                safeWrite(SCORES_KEY(game, mode), JSON.stringify(ordered));
            }
        }
    }
    return true;
};

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

// Teacher override. The student's Score rows stay on the server — they are
// study data and are never deleted from here — so clearing the local counter
// alone would be undone by the next syncAttemptsFromServer(). Recording the
// current server count as a baseline lets the sync count only attempts made
// AFTER the reset, which is what "reset their attempts" is meant to mean.
export const resetMode = (game, mode) => {
    try {
        const seen = safeRead(SERVER_SEEN_KEY(game, mode), null);
        // Fall back to the local count when no sync has run yet this session;
        // it is the best available estimate of what the server holds.
        const baseline = seen != null ? seen : String(getAttempts(game, mode));
        localStorage.removeItem(ATTEMPTS_KEY(game, mode));
        localStorage.removeItem(SCORES_KEY(game, mode));
        safeWrite(RESET_BASE_KEY(game, mode), baseline);
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
