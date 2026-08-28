// Game content loading (Objective 4.2).
//
// Drills, prompts and bug templates used to be static modules compiled into this
// bundle, so faculty could not change them without a code change and a redeploy.
// They now live in the database and are loaded through this module.
//
// Every loader falls back to the built-in bank when the database has no content
// for that game — an empty table, a cold backend, a network failure. That
// matters for two reasons. Merging this must not break the games before anyone
// has run the import, and a participant mid-study must never be handed an empty
// deck because the backend was spinning up on Render's free tier.
//
// The fallback is deliberate behaviour, not defensive noise: the games are the
// instrument the capstone measures with, and an empty round would be recorded as
// a real score.

// authFetch already resolves REACT_APP_API_BASE_URL, so paths here stay relative.
import { authFetch } from './authFetch';

export const CONTENT_GAME = Object.freeze({
    FALLING: 'FALLING',
    SNIPER: 'SNIPER',
    TRANSLATION: 'TRANSLATION',
});

export const CONTENT_BANK = Object.freeze({
    PRACTICE: 'PRACTICE',
    TEST: 'TEST',
});

const parsePayload = (row) => {
    let fields = {};
    try {
        fields = JSON.parse(row.payload) ?? {};
    } catch {
        // A malformed payload is one bad row, not a broken round — skip it.
        return null;
    }
    return {
        ...fields,
        id: row.externalId ?? `db-${row.contentId}`,
        contentId: row.contentId,
        itemType: row.itemType,
        topic: row.topic ?? fields.topic,
        difficulty: row.difficulty ?? fields.difficulty,
    };
};

/** Raw rows for a game+bank. Returns [] on any failure — callers fall back. */
export async function fetchContent(game, bank) {
    try {
        const res = await authFetch(
            `/api/game-content?game=${encodeURIComponent(game)}&bank=${encodeURIComponent(bank)}`,
        );
        if (!res.ok) return [];
        const rows = await res.json();
        return Array.isArray(rows) ? rows.map(parsePayload).filter(Boolean) : [];
    } catch {
        return [];
    }
}

/**
 * Items of one shape for a game+bank, or `fallback` when the database has none.
 * `minimum` guards against a half-finished import leaving a bank too thin to
 * assess with — below it, the built-in bank is used instead.
 */
export async function loadItems(game, bank, itemType, fallback, minimum = 1) {
    const rows = await fetchContent(game, bank);
    const matching = rows.filter((r) => r.itemType === itemType);
    return matching.length >= minimum ? matching : fallback;
}

/** Whether database content is being used, for the authoring screen to show. */
export async function contentCounts(game) {
    try {
        const res = await authFetch(`/api/game-content/counts?game=${encodeURIComponent(game)}`);
        if (!res.ok) return { PRACTICE: 0, TEST: 0 };
        return await res.json();
    } catch {
        return { PRACTICE: 0, TEST: 0 };
    }
}

// ── Authoring ────────────────────────────────────────────────────────────────

export async function listForAuthoring(game) {
    const res = await authFetch(`/api/game-content/manage?game=${encodeURIComponent(game)}`);
    if (!res.ok) throw new Error('Could not load content');
    return res.json();
}

export async function createContent(dto) {
    const res = await authFetch(`/api/game-content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
    });
    if (!res.ok) throw new Error('Could not save');
    return res.json();
}

export async function updateContent(contentId, dto) {
    const res = await authFetch(`/api/game-content/${contentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
    });
    if (!res.ok) throw new Error('Could not save');
    return res.json();
}

export async function deactivateContent(contentId) {
    const res = await authFetch(`/api/game-content/${contentId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Could not remove');
}

export async function importContent(items, overwrite = false) {
    const res = await authFetch(`/api/game-content/import?overwrite=${overwrite}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(items),
    });
    if (!res.ok) throw new Error('Import failed');
    return res.json();
}

/**
 * Turn a built-in bank into import rows. Shape-specific fields go into payload;
 * the columns the authoring screen filters on are lifted out alongside it.
 */
export function toImportRows(game, bank, itemType, items, pick = (x) => x) {
    return items.map((item, i) => {
        const { id, topic, difficulty, ...rest } = pick(item);
        return {
            game,
            bank,
            itemType,
            externalId: id ?? `${itemType}-${i + 1}`,
            topic: topic ?? null,
            difficulty: difficulty ?? null,
            payload: JSON.stringify(rest),
            active: true,
            position: i,
        };
    });
}
