// Rules for a new password, mirrored from PasswordChangeService on the backend so
// the form can show what's wrong before submitting. The server still decides:
// these only drive the checklist, and its message is shown when it disagrees.

import { authFetch } from "../../../shared/api/authFetch";
import { setAuthToken } from "../../../shared/auth/AuthUtils";

export const MIN_LENGTH = 8;

// bcrypt only reads the first 72 bytes, so the server rejects anything longer.
export const MAX_BYTES = 72;

const GENERIC_ERROR = "Couldn't change your password. Check your connection and try again.";
const SESSION_EXPIRED = "Your session has expired. Please log in again.";
const INVALID_LOGIN = "Email or current password is incorrect.";

// Code points, not UTF-16 units, to match the server's codePointCount.
export const characterCount = (text) => [...text].length;

// Counted by hand because Jest 27's jsdom has no TextEncoder.
export const utf8ByteLength = (text) => {
    let bytes = 0;
    for (const ch of text) {
        const cp = ch.codePointAt(0);
        bytes += cp < 0x80 ? 1 : cp < 0x800 ? 2 : cp < 0x10000 ? 3 : 4;
    }
    return bytes;
};

export function checkNewPassword({ current, next, confirm }) {
    const longEnough = characterCount(next) >= MIN_LENGTH;
    const tooLong = utf8ByteLength(next) > MAX_BYTES;
    const different = next.length > 0 && next !== current;
    const matches = next.length > 0 && next === confirm;
    return {
        longEnough,
        tooLong,
        different,
        matches,
        valid: current.length > 0 && longEnough && !tooLong && different && matches,
    };
}

// PATCH /api/users/me/password, with the stored token unless one is given.
async function requestChange(currentPassword, newPassword, token) {
    const headers = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;

    let res;
    try {
        res = await authFetch("/api/users/me/password", {
            method: "PATCH",
            headers,
            body: JSON.stringify({ currentPassword, newPassword }),
        });
    } catch {
        return { ok: false, message: GENERIC_ERROR };
    }

    const body = await res.json().catch(() => null);
    if (res.ok) {
        return { ok: true, token: body?.token };
    }
    if (res.status === 403) {
        return { ok: false, status: 403, message: SESSION_EXPIRED };
    }
    return { ok: false, status: res.status, message: body?.message || GENERIC_ERROR };
}

/**
 * For a signed-in user. A successful change ends every other session, including
 * the token this browser holds, so the token the server returns must replace the
 * stored one or the next request would be refused.
 */
export async function changeOwnPassword(currentPassword, newPassword) {
    const result = await requestChange(currentPassword, newPassword);
    if (!result.ok) return result;
    if (result.token) setAuthToken(result.token);
    return { ok: true };
}

/**
 * From the login page, for someone who knows their current password. Logs in
 * with it to get a token, uses that token once for the change, and stores
 * nothing: they then sign in with the new password, which proves they remember
 * it. Wrong guesses here hit the login endpoint, so they count toward its lockout.
 */
export async function changePasswordBeforeLogin(email, currentPassword, newPassword) {
    let login;
    try {
        login = await authFetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password: currentPassword }),
        });
    } catch {
        return { ok: false, message: GENERIC_ERROR };
    }

    if (login.status === 401) {
        return { ok: false, status: 401, message: INVALID_LOGIN };
    }
    if (login.status === 429) {
        return { ok: false, status: 429, message: (await login.text().catch(() => "")) || GENERIC_ERROR };
    }
    const token = login.ok ? (await login.json().catch(() => null))?.token : null;
    if (!token) {
        return { ok: false, status: login.status, message: GENERIC_ERROR };
    }

    const result = await requestChange(currentPassword, newPassword, token);
    return result.ok ? { ok: true } : result;
}
