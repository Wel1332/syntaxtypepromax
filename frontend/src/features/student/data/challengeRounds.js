// How a class challenge round plays. The study games keep their own engines and
// banks untouched; a class round plays the teacher's questions once each, in the
// teacher's order, so everyone in the class answers the same set.
//
// Each round is a pure reducer: keys, ticks and answers go in, the next state
// comes out. The page only wires the keyboard and the clock to it. A tick
// carries the real seconds since the last one, so a throttled background tab
// can't slow a round's clock down.

import { tokensEqual } from "../../../shared/utils/codeCompare";

export const TICK_SECONDS = 0.1;
export const WRONG_KEY_PENALTY = 0.5;

// Same base times as the games (25s a drill, 20s a prompt), stretched for
// longer questions so a teacher's 10-blank drill is still winnable.
export const sniperSeconds = (item) => Math.max(25, 10 + 3 * item.answers.length);
export const translationSeconds = (item) => Math.max(20, 10 + Math.ceil(item.solution.length / 2));

const clearBonus = (timeLeft) => 50 + Math.round(timeLeft * 5);

export function sniperSegments(code, answers) {
    const segments = [];
    let start = 0;
    let blank = 0;
    for (let i = 0; i < code.length; i++) {
        if (code[i] !== "_") continue;
        if (i > start) segments.push({ kind: "text", value: code.slice(start, i) });
        segments.push({ kind: "blank", index: blank, expected: answers[blank] });
        blank++;
        start = i + 1;
    }
    if (start < code.length) segments.push({ kind: "text", value: code.slice(start) });
    return segments;
}

export function roundSummary(state) {
    const total = state.items.length;
    const correct = state.results.filter((r) => r?.correct).length;
    return {
        score: state.score,
        correct,
        total,
        accuracy: total === 0 ? 0 : Math.round((correct / total) * 100),
    };
}

// ── Syntax Sniper ────────────────────────────────────────────────────────

function enterSniperItem(state, index) {
    if (index >= state.items.length) return { ...state, index, done: true };
    const item = state.items[index];
    return {
        ...state,
        index,
        filled: new Array(item.answers.length).fill(null),
        active: 0,
        timeLeft: sniperSeconds(item),
    };
}

function finishSniperItem(state, correct) {
    return enterSniperItem({
        ...state,
        score: state.score + (correct ? clearBonus(state.timeLeft) : 0),
        results: [...state.results, { correct }],
    }, state.index + 1);
}

export const startSniper = (items) =>
    enterSniperItem({ items, index: 0, score: 0, misses: 0, shake: 0, results: [], done: false }, 0);

export function sniperReducer(state, action) {
    if (state.done) return state;
    switch (action.type) {
        case "key": {
            const item = state.items[state.index];
            if (action.key !== item.answers[state.active]) {
                return {
                    ...state,
                    misses: state.misses + 1,
                    shake: state.shake + 1,
                    timeLeft: Math.max(0, state.timeLeft - WRONG_KEY_PENALTY),
                };
            }
            const hit = {
                ...state,
                score: state.score + 10,
                filled: state.filled.map((c, i) => (i === state.active ? action.key : c)),
            };
            return state.active + 1 >= item.answers.length
                ? finishSniperItem(hit, true)
                : { ...hit, active: state.active + 1 };
        }
        case "tick": {
            const timeLeft = state.timeLeft - action.seconds;
            return timeLeft <= 0 ? finishSniperItem({ ...state, timeLeft: 0 }, false) : { ...state, timeLeft };
        }
        default:
            return state;
    }
}

// ── Translation Terminal ─────────────────────────────────────────────────

function enterTranslationItem(state, index) {
    if (index >= state.items.length) return { ...state, index, done: true };
    return { ...state, index, timeLeft: translationSeconds(state.items[index]) };
}

function finishTranslationItem(state, correct, timedOut) {
    return enterTranslationItem({
        ...state,
        score: state.score + (correct ? clearBonus(state.timeLeft) : 0),
        results: [...state.results, { correct }],
        feedback: { correct, timedOut, seq: state.results.length + 1 },
    }, state.index + 1);
}

export const startTranslation = (items) =>
    enterTranslationItem({ items, index: 0, score: 0, results: [], feedback: null, done: false }, 0);

export function translationReducer(state, action) {
    if (state.done) return state;
    switch (action.type) {
        case "submit": {
            if (!action.answer.trim()) return state;
            const correct = tokensEqual(state.items[state.index].solution, action.answer);
            return finishTranslationItem(state, correct, false);
        }
        case "tick": {
            const timeLeft = state.timeLeft - action.seconds;
            return timeLeft <= 0 ? finishTranslationItem({ ...state, timeLeft: 0 }, false, true) : { ...state, timeLeft };
        }
        default:
            return state;
    }
}

// ── Bug Smasher ──────────────────────────────────────────────────────────
//
// The teacher's buggy lines drop in order, at most two at a time, and each
// clears as soon as the typed text is its fix. There are no lives: every line
// gets its chance, and one that lands counts as missed.

// The game's line speed (7% a second, lines at 0.55x) is 26s top to bottom.
export const FALLING_BASE_SECONDS = 26;
export const MAX_FALLING = 2;
export const DROP_GAP_SECONDS = 6;
const STREAK_STEP = 5;

export const fallingSeconds = (item) => Math.max(FALLING_BASE_SECONDS, 12 + Math.ceil(item.correct.length / 2));

// The game's points for a line, times 1 more for every five lines in a row.
export const streakMultiplier = (streak) => 1 + Math.floor(streak / STREAK_STEP);
export const linePoints = (item, streak) => (30 + Math.round(item.buggy.length * 0.8)) * streakMultiplier(streak);

const compact = (code) => code.replace(/\s+/g, "");

/** The falling line the typed text is heading toward, ignoring spacing, or null. */
function targetOf(state, input) {
    const typed = compact(input);
    if (!typed) return null;
    const line = state.falling.find((f) => compact(state.items[f.index].correct).startsWith(typed));
    return line ? line.index : null;
}

// Two lanes, left and right, so a long line that wraps never covers the other one.
function dropDue(state) {
    if (state.next >= state.items.length) return state;
    const room = state.falling.length === 0
        || (state.falling.length < MAX_FALLING && state.sinceDrop >= DROP_GAP_SECONDS);
    if (!room) return state;
    const lane = state.falling.length ? 1 - state.falling[0].lane : 1 - state.lastLane;
    return {
        ...state,
        falling: [...state.falling, { index: state.next, elapsed: 0, lane }],
        next: state.next + 1,
        sinceDrop: 0,
        lastLane: lane,
    };
}

function settle(state) {
    const next = dropDue(state);
    if (next.next >= next.items.length && next.falling.length === 0) return { ...next, done: true, target: null };
    return { ...next, target: targetOf(next, next.input) };
}

function recordLine(state, index, correct, points = 0) {
    const results = [...state.results];
    results[index] = { correct };
    return { ...state, results, lastEvent: { index, correct, points, seq: (state.lastEvent?.seq ?? 0) + 1 } };
}

export const startFalling = (items) => settle({
    items, next: 0, falling: [], sinceDrop: 0, lastLane: 1, input: "", target: null,
    score: 0, streak: 0, bestStreak: 0, results: [], lastEvent: null, done: false,
});

export function fallingProgress(state) {
    const fixed = state.results.filter((r) => r?.correct).length;
    const missed = state.results.filter((r) => r && !r.correct).length;
    return { fixed, missed, left: state.items.length - fixed - missed };
}

export function fallingReducer(state, action) {
    if (state.done) return state;
    switch (action.type) {
        case "input": {
            const hit = state.falling.find((f) => tokensEqual(state.items[f.index].correct, action.value));
            if (!hit) return settle({ ...state, input: action.value });
            const points = linePoints(state.items[hit.index], state.streak);
            const streak = state.streak + 1;
            return settle(recordLine({
                ...state,
                falling: state.falling.filter((f) => f !== hit),
                score: state.score + points,
                streak,
                bestStreak: Math.max(state.bestStreak, streak),
                input: "",
            }, hit.index, true, points));
        }
        case "tick": {
            const moved = state.falling.map((f) => ({ ...f, elapsed: f.elapsed + action.seconds }));
            const lands = (f) => f.elapsed >= fallingSeconds(state.items[f.index]);
            let next = { ...state, sinceDrop: state.sinceDrop + action.seconds, falling: moved.filter((f) => !lands(f)) };
            for (const line of moved.filter(lands)) next = recordLine({ ...next, streak: 0 }, line.index, false);
            return settle(next);
        }
        default:
            return state;
    }
}

/** How far down the play area a line is, from 0 (top) to 1 (landed). */
export const fallProgress = (state, line) => Math.min(1, line.elapsed / fallingSeconds(state.items[line.index]));
