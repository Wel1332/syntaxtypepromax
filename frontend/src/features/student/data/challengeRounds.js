// How a class challenge round plays. The study games keep their own engines and
// banks untouched; a class round plays the teacher's questions once each, in the
// teacher's order, so everyone in the class answers the same set.
//
// Each round is a pure reducer: keys, ticks and answers go in, the next state
// comes out. The page only wires the keyboard and the clock to it.

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
    const correct = state.results.filter((r) => r.correct).length;
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
