// A student's view of class challenges: the ones their teachers made visible in
// the classes they joined. Attempts are saved to the class only; they never
// reach the leaderboard or the study's pre/post-test scores.

import { authFetch } from "../../../shared/api/authFetch";

export const PLAYABLE_GAMES = ["SNIPER", "TRANSLATION"];

export const LIMITS = {
    MAX_SCORE: 1_000_000,
    MAX_SECONDS: 86_400,
};

export const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

export function attemptsInfo(challenge) {
    const used = challenge.attemptsUsed ?? 0;
    const max = challenge.maxAttempts ?? null;
    const remaining = max == null ? null : Math.max(0, max - used);
    return { used, max, remaining, exhausted: remaining === 0 };
}

export function attemptsLabel(challenge) {
    const { used, max, remaining } = attemptsInfo(challenge);
    if (max == null) return used === 0 ? "Unlimited attempts" : `Unlimited attempts · played ${plural(used, "time")}`;
    if (remaining === 0) return `All ${plural(max, "attempt")} used`;
    return `${remaining} of ${plural(max, "attempt")} left`;
}

/** Whether the student can start a round now, and if not, why. */
export function playState(challenge) {
    if (!PLAYABLE_GAMES.includes(challenge.game)) {
        return { canPlay: false, reason: "Bug Smasher challenges open soon." };
    }
    const { max, exhausted } = attemptsInfo(challenge);
    if (exhausted) return { canPlay: false, reason: `You've used all ${plural(max, "attempt")}.` };
    return { canPlay: true, reason: null };
}

/** Groups challenges by class, keeping the server's newest-first order. */
export function groupByClass(challenges) {
    const groups = new Map();
    for (const challenge of challenges) {
        if (!groups.has(challenge.classroomId)) {
            groups.set(challenge.classroomId, {
                classroomId: challenge.classroomId,
                classroomName: challenge.classroomName,
                challenges: [],
            });
        }
        groups.get(challenge.classroomId).challenges.push(challenge);
    }
    return [...groups.values()];
}

const clamp = (n, min, max) => Math.min(max, Math.max(min, Math.round(n)));

export const attemptBody = ({ score, correct, total, accuracy }, seconds) => ({
    score: clamp(score, 0, LIMITS.MAX_SCORE),
    correctCount: correct,
    totalCount: total,
    accuracy: clamp(accuracy, 0, 100),
    durationSeconds: clamp(seconds, 0, LIMITS.MAX_SECONDS),
});

// ── API ──────────────────────────────────────────────────────────────────

const NETWORK_ERROR = "Couldn't reach the server. Check your connection and try again.";

// The server says only "Challenge not found." so an outsider can't tell a
// hidden challenge from a missing one; a student is better served by the likely reason.
const NOT_AVAILABLE = "This challenge isn't available any more. Your teacher may have hidden it.";

const FALLBACK = {
    409: "You have used all your attempts for this challenge.",
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
    if (res.status === 404) return { ok: false, status: 404, message: NOT_AVAILABLE };
    return {
        ok: false,
        status: res.status,
        message: body?.message || FALLBACK[res.status] || "Something went wrong. Please try again.",
    };
}

export const listMyChallenges = () => call("/api/class-challenges");
export const listEnrolledClasses = () => call("/api/classes/enrolled");
export const getMyChallenge = (id) => call(`/api/class-challenges/${id}`);
export const submitAttempt = (id, body) => call(`/api/class-challenges/${id}/attempts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
});

/** A refusal the student can't fix by retrying: the limit is reached, or the challenge is gone. */
export const isFinalRefusal = (result) => [400, 403, 404, 409].includes(result.status);
