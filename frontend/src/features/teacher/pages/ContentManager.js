import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    Box, Card, CardContent, Stack, Typography, Button, Chip, TextField,
    MenuItem, Alert, Snackbar, Divider, IconButton, Tooltip, LinearProgress,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import {
    listForAuthoring, createContent, updateContent, deactivateContent,
    importContent, toImportRows, CONTENT_GAME, CONTENT_BANK,
} from "../../../shared/api/gameContent";
import {
    practiceBank as sniperPractice, testBank as sniperTest,
} from "../../syntax-sniper/data/syntaxSniperDrills";
import {
    practiceBank as ttPractice, testBank as ttTest,
} from "../../translation-terminal/data/translationPrompts";
import {
    practiceBank as fallPractice, testBank as fallTest,
} from "../../falling-code/data/fallingBanks";

/**
 * Faculty content authoring (Objective 4.2).
 *
 * Drills, prompts and bug templates used to be static modules compiled into the
 * frontend bundle. Editing one meant a code change and a redeploy, so the
 * objective's "faculty CRUD, reflected in the UI" was not achievable at all.
 *
 * The shape-specific fields are edited as JSON. That is a deliberate trade: a
 * bespoke form per content type would be friendlier, but there are seven shapes
 * across three games and the shapes are still moving. The JSON is validated
 * before save, so a malformed edit is refused here rather than breaking a round
 * for a participant.
 */

const GAMES = [
    { value: CONTENT_GAME.SNIPER, label: "Syntax Sniper", types: ["DRILL"] },
    { value: CONTENT_GAME.TRANSLATION, label: "Translation Terminal", types: ["PROMPT"] },
    {
        value: CONTENT_GAME.FALLING, label: "Bug Smasher (Falling Code)",
        types: ["BUGGY_LINE", "WRONG_WORD", "WORD", "CODE_LINE", "SEQUENCE"],
    },
];

const EMPTY = {
    contentId: null,
    game: CONTENT_GAME.SNIPER,
    bank: CONTENT_BANK.PRACTICE,
    itemType: "DRILL",
    externalId: "",
    topic: "",
    difficulty: "medium",
    payload: "{}",
    active: true,
    position: null,
};

/** Built-in banks, shaped for import. Mirrors what each game ships with. */
function builtInRows(game) {
    const G = CONTENT_GAME;
    const B = CONTENT_BANK;
    if (game === G.SNIPER) {
        return [
            ...toImportRows(game, B.PRACTICE, "DRILL", sniperPractice),
            ...toImportRows(game, B.TEST, "DRILL", sniperTest),
        ];
    }
    if (game === G.TRANSLATION) {
        return [
            ...toImportRows(game, B.PRACTICE, "PROMPT", ttPractice),
            ...toImportRows(game, B.TEST, "PROMPT", ttTest),
        ];
    }
    // Falling Code's bank is an object of pools rather than a flat list, so each
    // pool imports under its own itemType. Plain-string pools are wrapped so
    // every payload is a JSON object.
    const pools = [
        ["WORD", "words", (w) => ({ id: null, value: w })],
        ["WRONG_WORD", "wrongWords", (x) => x],
        ["CODE_LINE", "codeLines", (l) => ({ id: null, value: l })],
        ["BUGGY_LINE", "buggyLines", (x) => x],
        ["SEQUENCE", "sequenceBlocks", (b) => ({ id: null, lines: b })],
    ];
    const out = [];
    for (const [type, key, shape] of pools) {
        out.push(...toImportRows(game, B.PRACTICE, type, (fallPractice[key] || []).map(shape)));
        out.push(...toImportRows(game, B.TEST, type, (fallTest[key] || []).map(shape)));
    }
    return out;
}

export default function ContentManager() {
    const [game, setGame] = useState(CONTENT_GAME.SNIPER);
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [draft, setDraft] = useState(null);
    const [toast, setToast] = useState(null);

    const gameMeta = useMemo(() => GAMES.find((g) => g.value === game), [game]);

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            setRows(await listForAuthoring(game));
        } catch (e) {
            setToast({ severity: "error", text: e.message });
        } finally {
            setLoading(false);
        }
    }, [game]);

    useEffect(() => { refresh(); }, [refresh]);

    const startNew = () => setDraft({
        ...EMPTY,
        game,
        itemType: gameMeta.types[0],
    });

    const startEdit = (row) => setDraft({
        ...row,
        topic: row.topic ?? "",
        difficulty: row.difficulty ?? "",
        externalId: row.externalId ?? "",
    });

    const save = async () => {
        // Validate here so a malformed payload is refused at authoring time
        // rather than silently breaking a participant's round later.
        try {
            JSON.parse(draft.payload);
        } catch {
            setToast({ severity: "error", text: "Payload is not valid JSON." });
            return;
        }
        try {
            const dto = { ...draft, topic: draft.topic || null, difficulty: draft.difficulty || null };
            if (draft.contentId) await updateContent(draft.contentId, dto);
            else await createContent(dto);
            setDraft(null);
            setToast({ severity: "success", text: "Saved. Players pick it up on their next round." });
            refresh();
        } catch (e) {
            setToast({ severity: "error", text: e.message });
        }
    };

    const remove = async (row) => {
        try {
            await deactivateContent(row.contentId);
            setToast({ severity: "success", text: "Removed from play. The record is kept." });
            refresh();
        } catch (e) {
            setToast({ severity: "error", text: e.message });
        }
    };

    const runImport = async () => {
        try {
            const result = await importContent(builtInRows(game), false);
            setToast({
                severity: "success",
                text: `Imported ${result.written} item(s). Existing items were left untouched.`,
            });
            refresh();
        } catch (e) {
            setToast({ severity: "error", text: e.message });
        }
    };

    const active = rows.filter((r) => r.active);

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1100, mx: "auto" }}>
            <Stack spacing={2}>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>Game Content</Typography>
                <Typography sx={{ color: "text.secondary" }}>
                    Drills, prompts and bug templates the games load at the start of a round.
                    A game falls back to its built-in bank until a full bank exists here, so
                    partial edits never leave a student with an empty round.
                </Typography>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
                    <TextField
                        select label="Game" value={game} size="small" sx={{ minWidth: 260 }}
                        onChange={(e) => { setDraft(null); setGame(e.target.value); }}
                    >
                        {GAMES.map((g) => <MenuItem key={g.value} value={g.value}>{g.label}</MenuItem>)}
                    </TextField>
                    <Button startIcon={<AddIcon />} variant="contained" onClick={startNew}>New item</Button>
                    <Tooltip title="Copy the built-in bank into the database. Existing items are not overwritten.">
                        <Button startIcon={<CloudUploadIcon />} variant="outlined" onClick={runImport}>
                            Import built-in content
                        </Button>
                    </Tooltip>
                    <Chip label={`${active.length} active / ${rows.length} total`} size="small" />
                </Stack>

                {loading && <LinearProgress />}

                {draft && (
                    <Card variant="outlined">
                        <CardContent>
                            <Stack spacing={2}>
                                <Typography sx={{ fontWeight: 700 }}>
                                    {draft.contentId ? `Edit ${draft.externalId || draft.contentId}` : "New item"}
                                </Typography>
                                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                                    <TextField select label="Bank" size="small" sx={{ minWidth: 140 }}
                                        value={draft.bank}
                                        onChange={(e) => setDraft({ ...draft, bank: e.target.value })}>
                                        <MenuItem value={CONTENT_BANK.PRACTICE}>Practice</MenuItem>
                                        <MenuItem value={CONTENT_BANK.TEST}>Test</MenuItem>
                                    </TextField>
                                    <TextField select label="Type" size="small" sx={{ minWidth: 160 }}
                                        value={draft.itemType}
                                        onChange={(e) => setDraft({ ...draft, itemType: e.target.value })}>
                                        {gameMeta.types.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                                    </TextField>
                                    <TextField label="Reference id" size="small" value={draft.externalId}
                                        onChange={(e) => setDraft({ ...draft, externalId: e.target.value })} />
                                    <TextField label="Topic / category" size="small" value={draft.topic}
                                        onChange={(e) => setDraft({ ...draft, topic: e.target.value })} />
                                    <TextField label="Difficulty" size="small" value={draft.difficulty}
                                        onChange={(e) => setDraft({ ...draft, difficulty: e.target.value })} />
                                </Stack>
                                <TextField
                                    label="Content (JSON)" multiline minRows={6} value={draft.payload}
                                    onChange={(e) => setDraft({ ...draft, payload: e.target.value })}
                                    InputProps={{ sx: { fontFamily: "monospace", fontSize: 13 } }}
                                    helperText='Prompt example: {"prompt":"Declare an int named n set to 0.","solution":"int n = 0;","damage":10}'
                                />
                                <Stack direction="row" spacing={1}>
                                    <Button variant="contained" onClick={save}>Save</Button>
                                    <Button onClick={() => setDraft(null)}>Cancel</Button>
                                </Stack>
                            </Stack>
                        </CardContent>
                    </Card>
                )}

                <Card variant="outlined">
                    <CardContent>
                        {rows.length === 0 && !loading && (
                            <Alert severity="info">
                                Nothing authored yet — this game is using its built-in bank.
                                Use <strong>Import built-in content</strong> to bring it in and edit from there.
                            </Alert>
                        )}
                        <Stack divider={<Divider />}>
                            {rows.map((r) => (
                                <Stack key={r.contentId} direction="row" spacing={2} alignItems="center" sx={{ py: 1 }}>
                                    <Chip size="small" label={r.bank} />
                                    <Chip size="small" label={r.itemType} variant="outlined" />
                                    <Typography sx={{ minWidth: 90, fontFamily: "monospace", fontSize: 13 }}>
                                        {r.externalId || `#${r.contentId}`}
                                    </Typography>
                                    <Typography sx={{
                                        flexGrow: 1, fontFamily: "monospace", fontSize: 12,
                                        color: r.active ? "text.secondary" : "text.disabled",
                                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                    }}>
                                        {r.payload}
                                    </Typography>
                                    {!r.active && <Chip size="small" color="warning" label="removed" />}
                                    <IconButton size="small" onClick={() => startEdit(r)}><EditIcon fontSize="small" /></IconButton>
                                    <IconButton size="small" onClick={() => remove(r)} disabled={!r.active}>
                                        <DeleteOutlineIcon fontSize="small" />
                                    </IconButton>
                                </Stack>
                            ))}
                        </Stack>
                    </CardContent>
                </Card>
            </Stack>

            <Snackbar open={!!toast} autoHideDuration={5000} onClose={() => setToast(null)}>
                <Alert severity={toast?.severity} onClose={() => setToast(null)}>{toast?.text}</Alert>
            </Snackbar>
        </Box>
    );
}
