// The results page ranks students, sums up the class and exports a CSV a
// teacher can open safely in a spreadsheet.

import {
    studentRows, classSummary, formatDuration, localStamp, csvCell, resultsCsv, csvFileName,
} from "./challengeResults";

const attempt = (score, accuracy = 50, extra = {}) => ({
    score, accuracy, correctCount: 1, totalCount: 2, durationSeconds: 30, submittedAt: null, ...extra,
});
const student = (name, attempts, extra = {}) => ({
    studentId: name.length, name, username: name.toLowerCase(), enrolled: true, attempts, ...extra,
});

describe("studentRows", () => {
    test("played students by best score, then the rest by name", () => {
        const rows = studentRows([
            student("Zed", []),
            student("Ann", [attempt(40)]),
            student("bea", []),
            student("Cy", [attempt(10), attempt(90)]),
        ]);
        expect(rows.map((r) => r.name)).toEqual(["Cy", "Ann", "bea", "Zed"]);
    });

    test("best is the highest score, then the better accuracy; latest is the newest", () => {
        const [row] = studentRows([student("Ann", [attempt(70, 60), attempt(90, 50), attempt(90, 80)])]);
        expect(row.best).toMatchObject({ score: 90, accuracy: 80 });
        expect(row.latest).toMatchObject({ score: 70 });
        expect(studentRows([student("Bo", [])])[0]).toMatchObject({ best: null, latest: null });
    });
});

test("the summary counts students in the class now and averages their best attempts", () => {
    const rows = studentRows([
        student("Ann", [attempt(100, 80), attempt(20, 10)]),
        student("Bo", [attempt(50, 60)]),
        student("Cy", []),
        student("Dee", [attempt(999, 100)], { enrolled: false }),
    ]);
    expect(classSummary(rows)).toEqual({ inClass: 3, played: 2, attempts: 4, averageBestScore: 75, averageAccuracy: 70 });
    expect(classSummary(studentRows([student("Cy", [])]))).toMatchObject({ played: 0, averageBestScore: null, averageAccuracy: null });
});

test("durations read naturally", () => {
    expect(formatDuration(45)).toBe("45s");
    expect(formatDuration(65)).toBe("1:05");
    expect(formatDuration(3725)).toBe("1:02:05");
    expect(formatDuration(null)).toBe("0s");
});

test("submitted times are local and spreadsheet-friendly", () => {
    expect(localStamp(new Date(2026, 10, 7, 9, 5).toISOString())).toBe("2026-11-07 09:05");
    expect(localStamp(null)).toBe("");
});

describe("CSV", () => {
    test("quotes commas, quotes and line breaks", () => {
        expect(csvCell('Ann "A", B')).toBe('"Ann ""A"", B"');
        expect(csvCell("line\nbreak")).toBe('"line\nbreak"');
        expect(csvCell(42)).toBe("42");
        expect(csvCell(null)).toBe("");
    });

    test("a name that looks like a formula stays text", () => {
        expect(csvCell("=HYPERLINK(\"http://x\")")).toBe("\"'=HYPERLINK(\"\"http://x\"\")\"");
        expect(csvCell("+1")).toBe("'+1");
        expect(csvCell("-2")).toBe("'-2");
        expect(csvCell("@cmd")).toBe("'@cmd");
    });

    test("one row per attempt, oldest first, and a blank row for a student who hasn't played", () => {
        const rows = studentRows([
            student("Ann", [attempt(90, 100, { durationSeconds: 61 }), attempt(40, 50)]),
            student("Bo", [], { enrolled: false }),
        ]);
        expect(resultsCsv(rows).split("\r\n")).toEqual([
            "Student,Username,In class,Attempt,Score,Correct,Total,Accuracy (%),Time (s),Submitted",
            "Ann,ann,yes,1,40,1,2,50,30,",
            "Ann,ann,yes,2,90,1,2,100,61,",
            "Bo,bo,no,,,,,,,",
        ]);
    });

    test("file names are safe", () => {
        expect(csvFileName("Week 3: Pointers!")).toBe("week-3-pointers-results.csv");
        expect(csvFileName("")).toBe("challenge-results.csv");
        expect(csvFileName("???")).toBe("challenge-results.csv");
    });
});
