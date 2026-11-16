// The form's checklist mirrors PasswordChangeService so people see what's wrong
// before submitting. The case worth pinning is the byte limit: '€' is one
// character but three bytes, so a check that counted characters would let a
// password through that the server then rejects.

import { authFetch } from "../../../shared/api/authFetch";
import { setAuthToken } from "../../../shared/auth/AuthUtils";
import {
    characterCount, utf8ByteLength, checkNewPassword, changeOwnPassword,
} from "./passwordChange";

jest.mock("../../../shared/api/authFetch", () => ({ authFetch: jest.fn() }));
jest.mock("../../../shared/auth/AuthUtils", () => ({ setAuthToken: jest.fn() }));

const response = (status, body) => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
});

beforeEach(() => jest.clearAllMocks());

describe("counting", () => {
    test("counts UTF-8 bytes the way the server does", () => {
        expect(utf8ByteLength("abc")).toBe(3);
        expect(utf8ByteLength("é")).toBe(2);
        expect(utf8ByteLength("€")).toBe(3);
        expect(utf8ByteLength("😀")).toBe(4);
    });

    test("counts an emoji as one character, not two UTF-16 units", () => {
        expect(characterCount("😀😀")).toBe(2);
    });
});

describe("checkNewPassword", () => {
    const valid = { current: "old-password", next: "brand-new-pass", confirm: "brand-new-pass" };

    test("accepts a password that meets every rule", () => {
        expect(checkNewPassword(valid).valid).toBe(true);
    });

    test("needs at least 8 characters", () => {
        const result = checkNewPassword({ ...valid, next: "short7!", confirm: "short7!" });
        expect(result.longEnough).toBe(false);
        expect(result.valid).toBe(false);
        expect(checkNewPassword({ ...valid, next: "exactly8", confirm: "exactly8" }).longEnough).toBe(true);
    });

    test("rejects more than 72 bytes even when under 72 characters", () => {
        const euros = "€".repeat(25);
        const result = checkNewPassword({ ...valid, next: euros, confirm: euros });
        expect(result.tooLong).toBe(true);
        expect(result.valid).toBe(false);
    });

    test("must differ from the current password", () => {
        const result = checkNewPassword({ current: "same-password", next: "same-password", confirm: "same-password" });
        expect(result.different).toBe(false);
        expect(result.valid).toBe(false);
    });

    test("must match the confirmation", () => {
        const result = checkNewPassword({ ...valid, confirm: "brand-new-pasS" });
        expect(result.matches).toBe(false);
        expect(result.valid).toBe(false);
    });

    test("an empty form satisfies nothing", () => {
        const result = checkNewPassword({ current: "", next: "", confirm: "" });
        expect(result).toMatchObject({ longEnough: false, different: false, matches: false, valid: false });
    });

    test("needs the current password", () => {
        expect(checkNewPassword({ ...valid, current: "" }).valid).toBe(false);
    });
});

describe("changeOwnPassword", () => {
    test("sends both passwords in the body, never the URL", async () => {
        authFetch.mockResolvedValue(response(200, { token: "fresh-token" }));

        await changeOwnPassword("old-password", "brand-new-pass");

        const [path, options] = authFetch.mock.calls[0];
        expect(path).toBe("/api/users/me/password");
        expect(path).not.toContain("brand-new-pass");
        expect(options.method).toBe("PATCH");
        expect(JSON.parse(options.body)).toEqual({
            currentPassword: "old-password",
            newPassword: "brand-new-pass",
        });
    });

    test("stores the new token, because the change ended the old one", async () => {
        authFetch.mockResolvedValue(response(200, { token: "fresh-token" }));

        const result = await changeOwnPassword("old-password", "brand-new-pass");

        expect(result).toEqual({ ok: true });
        expect(setAuthToken).toHaveBeenCalledWith("fresh-token");
    });

    test("shows the server's reason and keeps the current token", async () => {
        authFetch.mockResolvedValue(response(400, { message: "Current password is incorrect." }));

        const result = await changeOwnPassword("wrong", "brand-new-pass");

        expect(result).toEqual({ ok: false, status: 400, message: "Current password is incorrect." });
        expect(setAuthToken).not.toHaveBeenCalled();
    });

    test("passes on the lockout message", async () => {
        authFetch.mockResolvedValue(response(429, {
            message: "Too many failed attempts for this account. Please wait a few minutes and try again.",
        }));

        const result = await changeOwnPassword("wrong", "brand-new-pass");

        expect(result.status).toBe(429);
        expect(result.message).toMatch(/Too many failed attempts/);
    });

    test("explains an expired session instead of a bare 403", async () => {
        authFetch.mockResolvedValue(response(403, null));

        const result = await changeOwnPassword("old-password", "brand-new-pass");

        expect(result.message).toBe("Your session has expired. Please log in again.");
    });

    test("survives a network failure", async () => {
        authFetch.mockRejectedValue(new TypeError("Failed to fetch"));

        const result = await changeOwnPassword("old-password", "brand-new-pass");

        expect(result.ok).toBe(false);
        expect(result.message).toMatch(/Check your connection/);
    });
});
