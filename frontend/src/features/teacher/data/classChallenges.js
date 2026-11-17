// Class challenges: questions a teacher makes for one of their classes, played
// in one of the study games. Only students who joined that class can see them.
//
// The checks here mirror ClassChallengeItems on the server so the editor can
// point at the field that's wrong before saving. The server still decides, and
// its message is shown whenever it disagrees.

import { authFetch } from "../../../shared/api/authFetch";

export const LIMITS = {
    TITLE: 120,
    INSTRUCTIONS: 1000,
    MAX_ITEMS: 50,
    MIN_BUG_SMASHER_ITEMS: 4,
    MAX_ATTEMPTS: 100,
    SNIPER_TITLE: 80,
    SNIPER_CODE: 1000,
    PROMPT: 300,
    SOLUTION: 300,
    LINE: 200,
    CATEGORY: 60,
};

export const GAMES = {
    SNIPER: {
        key: "SNIPER",
        label: "Syntax Sniper",
        color: "#9C5BE3",
        description: "Students fill in the missing characters in C code. Type _ wherever they should type a character.",
    },
    FALLING: {
        key: "FALLING",
        label: "Bug Smasher",
        color: "#C8456D",
        description: "Buggy lines of C fall down the screen; students type each fix before it lands. Needs at least 4 lines.",
    },
    TRANSLATION: {
        key: "TRANSLATION",
        label: "Translation Terminal",
        color: "#E0A800",
        description: "Students read an instruction in plain English and type the C code that does it.",
    },
};

export const GAME_KEYS = ["SNIPER", "FALLING", "TRANSLATION"];
export const DIFFICULTIES = ["easy", "medium", "hard"];

export const emptyForm = () => ({
    title: "",
    instructions: "",
    limitAttempts: false,
    maxAttempts: "",
    visible: false,
    items: [],
});

export function blankItem(game) {
    switch (game) {
        case "SNIPER": return { title: "", code: "", answers: [], difficulty: "medium" };
        case "FALLING": return { buggy: "", correct: "", category: "" };
        case "TRANSLATION": return { prompt: "", solution: "", difficulty: "medium" };
        default: throw new Error(`Unknown game: ${game}`);
    }
}

// Syntax Sniper treats every "_" as a blank and checks one key per blank.
export const countBlanks = (code) => ((code || "").match(/_/g) || []).length;

// Keeps one answer per blank as the teacher edits the code.
export const syncAnswers = (code, answers) =>
    Array.from({ length: countBlanks(code) }, (_, i) => (answers || [])[i] ?? "");

const text = (value) => (value ?? "").trim();

function requiredText(value, max) {
    const v = text(value);
    if (!v) return "Required.";
    if (v.length > max) return `At most ${max} characters.`;
    return null;
}

function itemErrors(game, item) {
    const errors = {};
    const put = (field, message) => { if (message) errors[field] = message; };

    if (game === "SNIPER") {
        put("title", requiredText(item.title, LIMITS.SNIPER_TITLE));
        put("code", requiredText(item.code, LIMITS.SNIPER_CODE));
        if (!errors.code && countBlanks(item.code) === 0) {
            errors.code = "Add at least one _ blank.";
        }
        const answers = item.answers || [];
        if (answers.some((a) => typeof a !== "string" || a.length !== 1 || !a.trim())) {
            errors.answers = "Each answer must be exactly one character.";
        } else if (!errors.code && answers.length !== countBlanks(item.code)) {
            errors.answers = `The code has ${countBlanks(item.code)} blanks but ${answers.length} answers.`;
        }
    } else if (game === "FALLING") {
        put("buggy", requiredText(item.buggy, LIMITS.LINE));
        put("correct", requiredText(item.correct, LIMITS.LINE));
        if (!errors.buggy && !errors.correct && text(item.buggy) === text(item.correct)) {
            errors.correct = "The fix must differ from the buggy line.";
        }
        if (text(item.category).length > LIMITS.CATEGORY) {
            errors.category = `At most ${LIMITS.CATEGORY} characters.`;
        }
    } else if (game === "TRANSLATION") {
        put("prompt", requiredText(item.prompt, LIMITS.PROMPT));
        put("solution", requiredText(item.solution, LIMITS.SOLUTION));
    }
    return errors;
}

/**
 * Field-level errors for the editor. `items` has one entry per question (empty
 * when that question is fine); `list` is about the questions as a whole.
 */
export function validateChallenge(game, form) {
    const result = { items: form.items.map((item) => itemErrors(game, item)) };

    const title = text(form.title);
    if (!title) result.title = "Title is required.";
    else if (title.length > LIMITS.TITLE) result.title = `Title must be at most ${LIMITS.TITLE} characters.`;

    if (text(form.instructions).length > LIMITS.INSTRUCTIONS) {
        result.instructions = `At most ${LIMITS.INSTRUCTIONS} characters.`;
    }

    if (form.limitAttempts) {
        const n = Number(form.maxAttempts);
        if (!Number.isInteger(n) || n < 1 || n > LIMITS.MAX_ATTEMPTS) {
            result.maxAttempts = `Enter a number from 1 to ${LIMITS.MAX_ATTEMPTS}.`;
        }
    }

    if (form.items.length === 0) result.list = "Add at least one question.";
    else if (form.items.length > LIMITS.MAX_ITEMS) result.list = `At most ${LIMITS.MAX_ITEMS} questions.`;
    else if (game === "FALLING" && form.items.length < LIMITS.MIN_BUG_SMASHER_ITEMS) {
        result.list = `Bug Smasher needs at least ${LIMITS.MIN_BUG_SMASHER_ITEMS} questions.`;
    }

    result.valid = !result.title && !result.instructions && !result.maxAttempts && !result.list
        && result.items.every((e) => Object.keys(e).length === 0);
    return result;
}

function cleanItem(game, item) {
    switch (game) {
        case "SNIPER":
            return { title: text(item.title), code: text(item.code), answers: [...(item.answers || [])], difficulty: item.difficulty };
        case "FALLING":
            return { buggy: text(item.buggy), correct: text(item.correct), category: text(item.category) };
        case "TRANSLATION":
            return {
                prompt: text(item.prompt),
                solution: text(item.solution),
                difficulty: item.difficulty,
                ...(item.topic ? { topic: item.topic } : {}),
            };
        default:
            throw new Error(`Unknown game: ${game}`);
    }
}

/** The body for POST and PUT. PUT replaces the challenge, so this is always complete. */
export function toRequest(game, form) {
    return {
        game,
        title: text(form.title),
        instructions: text(form.instructions),
        maxAttempts: form.limitAttempts ? Number(form.maxAttempts) : null,
        visible: !!form.visible,
        items: form.items.map((item) => cleanItem(game, item)),
    };
}

// The server stores "custom" for a Bug Smasher line left without a kind of bug;
// the editor shows that as the empty field the teacher left it.
const formItem = (game, item) => {
    const merged = { ...blankItem(game), ...item };
    return game === "FALLING" && merged.category === "custom" ? { ...merged, category: "" } : merged;
};

/** The editor's form for a challenge loaded from the server. */
export function fromChallenge(challenge) {
    return {
        title: challenge.title ?? "",
        instructions: challenge.instructions ?? "",
        limitAttempts: challenge.maxAttempts != null,
        maxAttempts: challenge.maxAttempts != null ? String(challenge.maxAttempts) : "",
        visible: !!challenge.visible,
        items: (challenge.items || []).map((item) => formItem(challenge.game, item)),
    };
}

// ── API ──────────────────────────────────────────────────────────────────

const NETWORK_ERROR = "Couldn't reach the server. Check your connection and try again.";

const FALLBACK = {
    403: "You don't have access to this class.",
    404: "That challenge or class no longer exists.",
};

async function call(path, options) {
    let res;
    try {
        res = options ? await authFetch(path, options) : await authFetch(path);
    } catch {
        return { ok: false, message: NETWORK_ERROR };
    }
    const body = await res.json().catch(() => null);
    if (res.ok) return { ok: true, data: body };
    return {
        ok: false,
        status: res.status,
        message: body?.message || FALLBACK[res.status] || "Something went wrong. Please try again.",
    };
}

const json = (method, body) => ({
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
});

const base = (classroomId) => `/api/classes/${classroomId}/challenges`;

export const listChallenges = (classroomId) => call(base(classroomId));
export const getChallenge = (classroomId, id) => call(`${base(classroomId)}/${id}`);
export const createChallenge = (classroomId, body) => call(base(classroomId), json("POST", body));
export const updateChallenge = (classroomId, id, body) => call(`${base(classroomId)}/${id}`, json("PUT", body));
export const deleteChallenge = (classroomId, id) => call(`${base(classroomId)}/${id}`, { method: "DELETE" });
export const getResults = (classroomId, id) => call(`${base(classroomId)}/${id}/results`);

/** Show or hide a challenge. PUT replaces it, so the saved challenge is resent with only `visible` changed. */
export async function setVisibility(classroomId, id, visible) {
    const current = await getChallenge(classroomId, id);
    if (!current.ok) return current;
    const body = { ...toRequest(current.data.game, fromChallenge(current.data)), visible };
    return updateChallenge(classroomId, id, body);
}
