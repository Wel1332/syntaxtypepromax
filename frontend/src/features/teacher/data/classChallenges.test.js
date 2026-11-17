// The editor checks a challenge before saving with the same rules as
// ClassChallengeItems on the server, so a teacher sees what's wrong next to the
// field instead of after a round trip. These tests pin those rules, the shape of
// what gets sent, and the visibility toggle, which has to resend the whole
// challenge because the API replaces it on PUT.

import { authFetch } from "../../../shared/api/authFetch";
import {
    GAMES, blankItem, countBlanks, syncAnswers, validateChallenge, toRequest, fromChallenge,
    listChallenges, createChallenge, updateChallenge, deleteChallenge, setVisibility, emptyForm,
} from "./classChallenges";

jest.mock("../../../shared/api/authFetch", () => ({ authFetch: jest.fn() }));

const response = (status, body) => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
});

beforeEach(() => jest.clearAllMocks());

const form = (game, items, extra = {}) => ({ ...emptyForm(), title: "Week 3", items, ...extra });
const sniper = (code, answers) => ({ ...blankItem("SNIPER"), title: "t", code, answers });
const bug = (buggy, correct) => ({ ...blankItem("FALLING"), buggy, correct });
const prompt = (p, s) => ({ ...blankItem("TRANSLATION"), prompt: p, solution: s });

describe("Syntax Sniper blanks", () => {
    test("every underscore is a blank", () => {
        expect(countBlanks("printf(\"hi\")_ return 0_")).toBe(2);
        expect(countBlanks("no blanks")).toBe(0);
    });

    test("answers follow the blanks: kept, padded, or trimmed", () => {
        expect(syncAnswers("a_ b_ c_", [";", ")"])).toEqual([";", ")", ""]);
        expect(syncAnswers("a_", [";", ")"])).toEqual([";"]);
    });
});

describe("validateChallenge", () => {
    test("accepts a complete challenge for each game", () => {
        expect(validateChallenge("SNIPER", form("SNIPER", [sniper("x_", [";"])])).valid).toBe(true);
        expect(validateChallenge("TRANSLATION", form("TRANSLATION", [prompt("Declare x", "int x;")])).valid).toBe(true);
        const fourBugs = [bug("a", "a;"), bug("b", "b;"), bug("c", "c;"), bug("d", "d;")];
        expect(validateChallenge("FALLING", form("FALLING", fourBugs)).valid).toBe(true);
    });

    test("needs a title", () => {
        const result = validateChallenge("TRANSLATION", form("TRANSLATION", [prompt("p", "s")], { title: "  " }));
        expect(result.valid).toBe(false);
        expect(result.title).toBe("Title is required.");
    });

    test("needs at least one question", () => {
        const result = validateChallenge("TRANSLATION", form("TRANSLATION", []));
        expect(result.list).toBe("Add at least one question.");
    });

    test("Bug Smasher needs four questions", () => {
        const result = validateChallenge("FALLING", form("FALLING", [bug("a", "a;")]));
        expect(result.list).toBe("Bug Smasher needs at least 4 questions.");
    });

    test("a Sniper answer must be one character, and every blank needs one", () => {
        const twoChars = validateChallenge("SNIPER", form("SNIPER", [sniper("x_", [";;"])]));
        expect(twoChars.items[0].answers).toBe("Each answer must be exactly one character.");

        const missing = validateChallenge("SNIPER", form("SNIPER", [sniper("x_ y_", [";", ""])]));
        expect(missing.items[0].answers).toBe("Each answer must be exactly one character.");

        const noBlanks = validateChallenge("SNIPER", form("SNIPER", [sniper("int x = 5;", [])]));
        expect(noBlanks.items[0].code).toBe("Add at least one _ blank.");
    });

    test("a Bug Smasher fix must differ from the bug", () => {
        const items = [bug("a", "a"), bug("b", "b;"), bug("c", "c;"), bug("d", "d;")];
        expect(validateChallenge("FALLING", form("FALLING", items)).items[0].correct)
            .toBe("The fix must differ from the buggy line.");
    });

    test("an attempt limit must be 1 to 100 when switched on", () => {
        const base = form("TRANSLATION", [prompt("p", "s")], { limitAttempts: true });
        expect(validateChallenge("TRANSLATION", { ...base, maxAttempts: "0" }).maxAttempts)
            .toBe("Enter a number from 1 to 100.");
        expect(validateChallenge("TRANSLATION", { ...base, maxAttempts: "3" }).valid).toBe(true);
        expect(validateChallenge("TRANSLATION", { ...base, limitAttempts: false, maxAttempts: "0" }).valid).toBe(true);
    });
});

describe("toRequest / fromChallenge", () => {
    test("sends only what the server reads, with no limit when it's switched off", () => {
        const body = toRequest("SNIPER", form("SNIPER", [sniper(" x_ ", [";"])], {
            instructions: "  Go  ", limitAttempts: false, maxAttempts: "5", visible: true,
        }));
        expect(body).toEqual({
            game: "SNIPER",
            title: "Week 3",
            instructions: "Go",
            maxAttempts: null,
            visible: true,
            items: [{ title: "t", code: "x_", answers: [";"], difficulty: "medium" }],
        });
    });

    test("an edit opens with exactly what was saved", () => {
        const saved = {
            game: "TRANSLATION", title: "Week 3", instructions: null, maxAttempts: 2, visible: false,
            items: [{ prompt: "p", solution: "s", difficulty: "easy" }],
        };
        const roundTrip = toRequest("TRANSLATION", fromChallenge(saved));
        expect(roundTrip).toEqual({ ...saved, instructions: "" });
    });
});

describe("API", () => {
    test("lists a class's challenges", async () => {
        authFetch.mockResolvedValue(response(200, [{ challengeId: 1 }]));

        const result = await listChallenges(7);

        expect(authFetch).toHaveBeenCalledWith("/api/classes/7/challenges");
        expect(result).toEqual({ ok: true, data: [{ challengeId: 1 }] });
    });

    test("creates with POST and edits with PUT", async () => {
        authFetch.mockResolvedValue(response(200, { challengeId: 3 }));

        await createChallenge(7, { title: "x" });
        await updateChallenge(7, 3, { title: "y" });

        expect(authFetch.mock.calls[0][0]).toBe("/api/classes/7/challenges");
        expect(authFetch.mock.calls[0][1].method).toBe("POST");
        expect(authFetch.mock.calls[1][0]).toBe("/api/classes/7/challenges/3");
        expect(authFetch.mock.calls[1][1].method).toBe("PUT");
    });

    test("passes on the server's reason when it refuses", async () => {
        authFetch.mockResolvedValue(response(400, { message: "Item 1: the code has 2 blanks (_) but 1 answer." }));

        const result = await createChallenge(7, {});

        expect(result).toEqual({ ok: false, status: 400, message: "Item 1: the code has 2 blanks (_) but 1 answer." });
    });

    test("deletes", async () => {
        authFetch.mockResolvedValue(response(204, null));

        const result = await deleteChallenge(7, 3);

        expect(authFetch).toHaveBeenCalledWith("/api/classes/7/challenges/3", { method: "DELETE" });
        expect(result.ok).toBe(true);
    });

    test("showing a challenge resends it whole, changing only visibility", async () => {
        const saved = {
            challengeId: 3, game: "TRANSLATION", title: "Week 3", instructions: "Go", maxAttempts: 2,
            visible: false, items: [{ prompt: "p", solution: "s", difficulty: "easy" }],
        };
        authFetch
            .mockResolvedValueOnce(response(200, saved))
            .mockResolvedValueOnce(response(200, { ...saved, visible: true }));

        const result = await setVisibility(7, 3, true);

        expect(authFetch.mock.calls[0][0]).toBe("/api/classes/7/challenges/3");
        const sent = JSON.parse(authFetch.mock.calls[1][1].body);
        expect(sent).toEqual({
            game: "TRANSLATION", title: "Week 3", instructions: "Go", maxAttempts: 2,
            visible: true, items: saved.items,
        });
        expect(result.ok).toBe(true);
    });

    test("survives a network failure", async () => {
        authFetch.mockRejectedValue(new TypeError("Failed to fetch"));

        const result = await listChallenges(7);

        expect(result.ok).toBe(false);
        expect(result.message).toMatch(/Check your connection/);
    });
});

test("every game has a label and a description for the picker", () => {
    for (const key of ["SNIPER", "FALLING", "TRANSLATION"]) {
        expect(GAMES[key].label).toBeTruthy();
        expect(GAMES[key].description).toBeTruthy();
    }
});
