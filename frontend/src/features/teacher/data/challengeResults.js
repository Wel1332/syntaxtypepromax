// What a teacher sees about one class challenge: each student's best and latest
// attempt, a summary of the class, and every attempt as a CSV.

/** Highest score wins; on a tie, the better accuracy. Attempts arrive newest first. */
function bestOf(attempts) {
    return attempts.reduce((top, a) => {
        if (!top || a.score > top.score) return a;
        if (a.score === top.score && a.accuracy > top.accuracy) return a;
        return top;
    }, null);
}

/** One row per student: those who played by best score, then the rest by name. */
export function studentRows(students) {
    const rows = (students || []).map((s) => {
        const attempts = s.attempts || [];
        return { ...s, attempts, best: bestOf(attempts), latest: attempts[0] ?? null };
    });
    const byName = (a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    return rows.sort((a, b) => {
        if (!!a.best !== !!b.best) return a.best ? -1 : 1;
        if (a.best && b.best && a.best.score !== b.best.score) return b.best.score - a.best.score;
        return byName(a, b);
    });
}

const average = (values) => (values.length ? Math.round(values.reduce((sum, v) => sum + v, 0) / values.length) : null);

/** Counts students in the class now; a student who left still shows in the table. */
export function classSummary(rows) {
    const inClass = rows.filter((r) => r.enrolled);
    const played = inClass.filter((r) => r.best);
    return {
        inClass: inClass.length,
        played: played.length,
        attempts: rows.reduce((n, r) => n + r.attempts.length, 0),
        averageBestScore: average(played.map((r) => r.best.score)),
        averageAccuracy: average(played.map((r) => r.best.accuracy)),
    };
}

export function formatDuration(seconds) {
    const s = Math.max(0, Math.round(seconds || 0));
    if (s < 60) return `${s}s`;
    const pad = (n) => String(n).padStart(2, "0");
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return h ? `${h}:${pad(m)}:${pad(s % 60)}` : `${m}:${pad(s % 60)}`;
}

/** "2026-11-17 14:05" in the teacher's own time zone, for spreadsheets. */
export function localStamp(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Names are typed by students. A cell starting with = + - @ would run as a
// formula when the teacher opens the file, so it is prefixed to stay text.
export function csvCell(value) {
    if (value == null) return "";
    let text = String(value);
    if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

const CSV_HEADERS = ["Student", "Username", "In class", "Attempt", "Score", "Correct", "Total", "Accuracy (%)", "Time (s)", "Submitted"];

/** Every attempt, oldest first per student; a student who hasn't played gets one blank row. */
export function resultsCsv(rows) {
    const lines = [CSV_HEADERS];
    for (const r of rows) {
        const who = [r.name, r.username, r.enrolled ? "yes" : "no"];
        if (r.attempts.length === 0) {
            lines.push([...who, "", "", "", "", "", "", ""]);
            continue;
        }
        [...r.attempts].reverse().forEach((a, i) => {
            lines.push([...who, i + 1, a.score, a.correctCount, a.totalCount, a.accuracy, a.durationSeconds, localStamp(a.submittedAt)]);
        });
    }
    return lines.map((line) => line.map(csvCell).join(",")).join("\r\n");
}

export const csvFileName = (title) =>
    `${(title || "challenge").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "challenge"}-results.csv`;
