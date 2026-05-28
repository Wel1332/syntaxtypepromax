// Tokenized whitespace-normalising comparator for C code (SDD §3.1.4 M3).
//
// The original SRS specified a tokenized comparison with configurable
// whitespace/stylistic tolerance and a side-by-side diff for mismatches.
// This module provides the comparator primitives. Pair with <CodeDiffView />
// to render the diff.

const PUNCTUATION = new Set([
    "(", ")", "{", "}", "[", "]",
    ";", ",", ".",
    "+", "-", "*", "/", "%",
    "=", "!", "<", ">",
    "&", "|", "^", "~", "?", ":",
]);

const MULTI_CHAR_OPS = [
    "<<=", ">>=", "...",
    "==", "!=", "<=", ">=",
    "&&", "||",
    "<<", ">>",
    "+=", "-=", "*=", "/=", "%=", "&=", "|=", "^=",
    "++", "--",
    "->",
];

/**
 * Tokenize a C source string into an array of token strings.
 * Whitespace is treated only as a separator — never emitted as a token.
 * String literals, character literals, identifiers, numbers, and
 * operator/punctuation glyphs each become a single token.
 */
export function tokenize(src) {
    if (!src) return [];
    const tokens = [];
    let i = 0;
    const n = src.length;

    while (i < n) {
        const ch = src[i];

        // Skip whitespace
        if (/\s/.test(ch)) { i++; continue; }

        // Line comment
        if (ch === "/" && src[i + 1] === "/") {
            while (i < n && src[i] !== "\n") i++;
            continue;
        }
        // Block comment
        if (ch === "/" && src[i + 1] === "*") {
            i += 2;
            while (i < n && !(src[i] === "*" && src[i + 1] === "/")) i++;
            i += 2;
            continue;
        }

        // String literal
        if (ch === '"' || ch === "'") {
            const quote = ch;
            let j = i + 1;
            while (j < n && src[j] !== quote) {
                if (src[j] === "\\") j += 2;
                else j++;
            }
            tokens.push(src.slice(i, Math.min(j + 1, n)));
            i = j + 1;
            continue;
        }

        // Identifier or number
        if (/[A-Za-z_0-9#]/.test(ch)) {
            let j = i + 1;
            while (j < n && /[A-Za-z_0-9.]/.test(src[j])) j++;
            tokens.push(src.slice(i, j));
            i = j;
            continue;
        }

        // Multi-char operators
        let matched = false;
        for (const op of MULTI_CHAR_OPS) {
            if (src.slice(i, i + op.length) === op) {
                tokens.push(op);
                i += op.length;
                matched = true;
                break;
            }
        }
        if (matched) continue;

        // Single-char punctuation
        if (PUNCTUATION.has(ch)) {
            tokens.push(ch);
            i++;
            continue;
        }

        // Unknown — emit as single char so we don't loop
        tokens.push(ch);
        i++;
    }

    return tokens;
}

/**
 * Whitespace-normalising token equality. Two source strings are considered
 * equivalent iff their token streams are identical.
 *
 *   { caseSensitive: true } (default) — identifiers/keywords case-matters.
 *     C is case-sensitive so leave this true unless you want pedagogical tolerance.
 *   { ignoreSemicolons: false } — when true, trailing-semicolon style is normalized.
 */
export function tokensEqual(expected, actual, opts = {}) {
    const { caseSensitive = true, ignoreSemicolons = false } = opts;
    const norm = (t) => {
        let x = t;
        if (!caseSensitive) x = x.toLowerCase();
        return x;
    };
    let a = tokenize(expected).map(norm);
    let b = tokenize(actual).map(norm);
    if (ignoreSemicolons) {
        a = a.filter(t => t !== ";");
        b = b.filter(t => t !== ";");
    }
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
}

/**
 * Line-level diff using a simple LCS table. Returns an array of rows:
 *   { kind: "equal"|"insert"|"delete"|"replace", left, right }
 * where `left` and `right` are the expected and actual line strings
 * (one may be null). Whitespace within each line is collapsed for comparison
 * but the original line is preserved for display.
 */
export function diffLines(expected, actual) {
    const left = (expected ?? "").split("\n");
    const right = (actual ?? "").split("\n");
    const norm = (s) => s.replace(/\s+/g, " ").trim();
    const a = left.map(norm);
    const b = right.map(norm);

    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) {
            dp[i + 1][j + 1] = a[i] === b[j]
                ? dp[i][j] + 1
                : Math.max(dp[i][j + 1], dp[i + 1][j]);
        }
    }

    const rows = [];
    let i = m, j = n;
    while (i > 0 && j > 0) {
        if (a[i - 1] === b[j - 1]) {
            rows.push({ kind: "equal", left: left[i - 1], right: right[j - 1] });
            i--; j--;
        } else if (dp[i - 1][j] >= dp[i][j - 1]) {
            rows.push({ kind: "delete", left: left[i - 1], right: null });
            i--;
        } else {
            rows.push({ kind: "insert", left: null, right: right[j - 1] });
            j--;
        }
    }
    while (i > 0) { rows.push({ kind: "delete", left: left[i - 1], right: null }); i--; }
    while (j > 0) { rows.push({ kind: "insert", left: null, right: right[j - 1] }); j--; }
    return rows.reverse();
}
