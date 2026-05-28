import React, { useState, useEffect, useRef } from "react";
import {
    Box, Card, CardContent, Stack, Typography, Button, Chip, LinearProgress,
    Alert, useTheme, IconButton, Tooltip,
} from "@mui/material";
import TerminalIcon from "@mui/icons-material/Terminal";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { practiceBank, testBank, enemies } from "../data/translationPrompts";
import { tokensEqual } from "../../../shared/utils/codeCompare";
import ModePickerCard from "../../../shared/assessment/ModePickerCard";
import { useScoreSubmission } from "../../../shared/hooks/useScoreSubmission";
import {
    MODE, GAME, MODE_META, canStartMode, recordAttempt, getHighLow, getRemark,
} from "../../../shared/assessment/modes";

/**
 * Translation Terminal — English→C combat.
 *
 * Flow: mode picker → enemy picker → combat → victory/defeat results.
 * Mode determines (a) which prompt bank is in play, (b) attempt limit, and
 * (c) the remarks tier on the result screen. `enemies` is shared across modes
 * — only the prompt content differs.
 */

const ROUND_SECONDS = 20;
const TUTORIAL_SEEN_KEY = "tt:tutorial_seen";
const TUTORIAL_TOTAL = 4;

function pickPromptForEnemy(bank, enemy, alreadyUsed) {
    const pool = bank.filter((p) => !alreadyUsed.includes(p.id));
    if (pool.length === 0) {
        return bank[Math.floor(Math.random() * bank.length)];
    }
    const easier = enemy.hp < 50;
    const filtered = pool.filter((p) => (easier ? p.difficulty !== "hard" : true));
    const final = filtered.length ? filtered : pool;
    return final[Math.floor(Math.random() * final.length)];
}

export default function TranslationTerminal() {
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";

    const [view, setView] = useState("mode"); // mode | tutorial | picker | combat | victory | defeat
    const [tutorialStep, setTutorialStep] = useState(0);
    const [mode, setMode] = useState(null);
    const [enemyIdx, setEnemyIdx] = useState(0);
    const [enemyHp, setEnemyHp] = useState(0);
    const [playerHp, setPlayerHp] = useState(100);
    const [playerMaxHp] = useState(100);
    const [prompt, setPrompt] = useState(null);
    const [answer, setAnswer] = useState("");
    const [time, setTime] = useState(ROUND_SECONDS);
    const [usedIds, setUsedIds] = useState([]);
    const [flash, setFlash] = useState(null);
    const [combo, setCombo] = useState(0);
    const [promptsAnswered, setPromptsAnswered] = useState(0);
    const [promptsCorrect, setPromptsCorrect] = useState(0);
    const [recorded, setRecorded] = useState(false);

    const { submitScore } = useScoreSubmission();

    const inputRef = useRef(null);
    const viewRef = useRef(view);
    const recordedRef = useRef(recorded);
    useEffect(() => { viewRef.current = view; }, [view]);
    useEffect(() => { recordedRef.current = recorded; }, [recorded]);

    const enemy = enemies[enemyIdx];
    const bank = mode === MODE.PRACTICE ? practiceBank : testBank;

    const onPickMode = (m) => {
        if (!canStartMode(GAME.TRANSLATION, m)) return;
        setMode(m);
        try {
            if (!localStorage.getItem(TUTORIAL_SEEN_KEY)) {
                setTutorialStep(0);
                setView("tutorial");
                return;
            }
        } catch {}
        setView("picker");
    };

    const finishTutorial = () => {
        try { localStorage.setItem(TUTORIAL_SEEN_KEY, "1"); } catch {}
        setTutorialStep(0);
        setView("picker");
    };

    const openTutorial = () => {
        setTutorialStep(0);
        setView("tutorial");
    };

    const startCombat = (idx) => {
        const e = enemies[idx];
        if (!e) return;
        setEnemyIdx(idx);
        setEnemyHp(e.hp);
        setPlayerHp(playerMaxHp);
        setCombo(0);
        setPromptsAnswered(0);
        setPromptsCorrect(0);
        setRecorded(false);
        const used = [];
        const p = pickPromptForEnemy(bank, e, used);
        setUsedIds([p.id]);
        setPrompt(p);
        setAnswer("");
        setTime(ROUND_SECONDS);
        setView("combat");
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    const restart = () => startCombat(enemyIdx);

    const backToModePicker = () => {
        setView("mode");
        setMode(null);
    };

    // Round timer
    useEffect(() => {
        if (view !== "combat") return;
        const t = setInterval(() => {
            setTime((prev) => {
                if (prev <= 0.1) {
                    onMiss(true);
                    return ROUND_SECONDS;
                }
                return prev - 0.1;
            });
        }, 100);
        return () => clearInterval(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [view, prompt]);

    const onMiss = (timeout) => {
        if (viewRef.current !== "combat") return;
        const dmg = enemy.attack;
        setFlash("miss");
        setTimeout(() => setFlash(null), 300);
        setCombo(0);
        setPromptsAnswered((n) => n + 1);
        setPlayerHp((prev) => {
            const next = Math.max(0, prev - dmg);
            if (next === 0) setView("defeat");
            return next;
        });
        nextPrompt();
    };

    const nextPrompt = () => {
        const e = enemies[enemyIdx];
        setUsedIds((used) => {
            const next = pickPromptForEnemy(bank, e, used);
            setPrompt(next);
            return [...used, next.id];
        });
        setAnswer("");
        setTime(ROUND_SECONDS);
    };

    const onSubmit = () => {
        if (view !== "combat" || !prompt) return;
        if (tokensEqual(prompt.solution, answer)) {
            const newCombo = combo + 1;
            const multiplier = 1 + Math.floor(newCombo / 3);
            const dmg = prompt.damage * multiplier;
            setCombo(newCombo);
            setFlash("hit");
            setTimeout(() => setFlash(null), 300);
            setPromptsAnswered((n) => n + 1);
            setPromptsCorrect((n) => n + 1);
            setEnemyHp((prev) => {
                const next = Math.max(0, prev - dmg);
                if (next === 0) setView("victory");
                return next;
            });
            nextPrompt();
        } else {
            onMiss(false);
        }
    };

    const onKey = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
        }
    };

    // Record the run once when entering victory/defeat. Score = HP remaining +
    // 5 × prompts cleared correctly. Percent = correct / answered for remarks.
    useEffect(() => {
        if ((view === "victory" || view === "defeat") && !recordedRef.current && mode) {
            const score = playerHp + promptsCorrect * 5 + (view === "victory" ? 50 : 0);
            const percent = promptsAnswered === 0
                ? 0
                : Math.round((promptsCorrect / promptsAnswered) * 100);
            recordAttempt(GAME.TRANSLATION, mode, {
                score, percent, outcome: view,
                enemy: enemy?.name, promptsAnswered, promptsCorrect,
                hpRemaining: playerHp,
            });
            submitScore("GALAXY", { score, accuracy: percent, wpm: 0 });
            setRecorded(true);
        }
    }, [view, mode, playerHp, promptsAnswered, promptsCorrect, enemy]);

    // ─── Tutorial slides ──────────────────────────────────────────────────────
    const renderTutorial = () => {
        const mono = { fontFamily: "'JetBrains Mono', monospace" };
        const codeBox = (text, accent) => (
            <Box sx={{
                ...mono, fontSize: "0.9rem", px: 1.5, py: 1,
                bgcolor: isDark ? "#0F0F1E" : "#f4f4f8",
                border: "1.5px solid", borderColor: accent || "divider",
                borderRadius: 1, color: accent || "text.primary",
            }}>
                {text}
            </Box>
        );

        const slides = [
            // ── Slide 0: What is this ──
            {
                badge: "🗡️",
                title: "What is Translation Terminal?",
                body: (
                    <Stack spacing={2}>
                        <Typography>
                            You're a programmer doing battle. Each enemy represents a C programming challenge.
                            Defeat it by correctly writing C code from English descriptions before the timer runs out.
                        </Typography>
                        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
                            {enemies.map((e) => (
                                <Chip
                                    key={e.id}
                                    label={`${e.emoji} ${e.name}`}
                                    variant="outlined"
                                    size="small"
                                    sx={{ borderColor: e.color, color: e.color, fontWeight: 700 }}
                                />
                            ))}
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                            Start with the Syntax Slime — it's the weakest.
                            Work your way up to the Segfault Dragon.
                        </Typography>
                    </Stack>
                ),
            },
            // ── Slide 1: How a round works ──
            {
                badge: "💡",
                title: "How a round works",
                body: (
                    <Stack spacing={2}>
                        <Typography>
                            Each round shows an English description. Read it, type the exact C code, and press Enter to attack.
                        </Typography>
                        <Box sx={{ bgcolor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)", borderRadius: 2, p: 2 }}>
                            <Typography variant="overline" color="text.secondary">Prompt</Typography>
                            <Typography variant="h6" sx={{ mt: 0.5 }}>
                                Declare an integer named score and set it to 0.
                            </Typography>
                        </Box>
                        {codeBox("int score = 0;", "#7BE093")}
                        <Typography variant="caption" color="text.secondary">
                            ↑ This is what you'd type. Then press Enter or click Attack.
                        </Typography>
                    </Stack>
                ),
            },
            // ── Slide 2: Combat rules ──
            {
                badge: "⚔️",
                title: "Combat rules",
                body: (
                    <Stack spacing={1.5}>
                        {[
                            {
                                color: "#3ecf6a", bg: "rgba(62,207,106,0.08)",
                                label: "✅ Correct answer",
                                text: "You deal damage to the enemy. Chain 3+ correct in a row for a combo multiplier.",
                            },
                            {
                                color: "#ef4444", bg: "rgba(239,68,68,0.08)",
                                label: "❌ Wrong answer or timeout",
                                text: `The enemy attacks you and your combo resets. You have ${ROUND_SECONDS} seconds per prompt.`,
                            },
                            {
                                color: "#FFC700", bg: "rgba(255,199,0,0.08)",
                                label: "⚡ Combo multiplier",
                                text: "3 correct in a row = 2× damage · 6 in a row = 3× · 9 in a row = 4×",
                            },
                        ].map(({ color, bg, label, text }) => (
                            <Box key={label} sx={{ p: 1.5, borderRadius: 1.5, bgcolor: bg, border: `1px solid ${color}` }}>
                                <Typography variant="body2" sx={{ color, fontWeight: 700 }}>{label}</Typography>
                                <Typography variant="body2" sx={{ mt: 0.5 }}>{text}</Typography>
                            </Box>
                        ))}
                    </Stack>
                ),
            },
            // ── Slide 3: Whitespace tips ──
            {
                badge: "📐",
                title: "Whitespace tolerance & tips",
                body: (
                    <Stack spacing={2}>
                        <Typography>
                            Spacing around operators and after commas doesn't matter.
                            Both of these are accepted for the same prompt:
                        </Typography>
                        <Stack spacing={1}>
                            {codeBox("int score = 0;", undefined)}
                            {codeBox("int score=0;", undefined)}
                        </Stack>
                        <Box sx={{ p: 1.5, bgcolor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)", borderRadius: 1.5 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>Things that DO matter exactly:</Typography>
                            <Typography variant="body2" component="ul" sx={{ pl: 2, m: 0 }}>
                                <li>Semicolons — <Box component="span" sx={{ ...mono, color: "#FF6B6B" }}>int score = 0</Box> is wrong; the <Box component="span" sx={{ ...mono, color: "#7BE093" }}>;</Box> is required</li>
                                <li>Variable names — spelled exactly as stated in the prompt</li>
                                <li>Types and keywords — <Box component="span" sx={mono}>int</Box> vs <Box component="span" sx={mono}>float</Box> matters</li>
                            </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                            Tip: read carefully — the prompt names the type, variable name, and value precisely.
                        </Typography>
                    </Stack>
                ),
            },
        ];

        const slide = slides[tutorialStep];

        return (
            <Card>
                <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                    {/* Header row */}
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                            <Typography sx={{ fontSize: "2rem", lineHeight: 1 }}>{slide.badge}</Typography>
                            <Box>
                                <Typography variant="overline" color="text.secondary">
                                    Step {tutorialStep + 1} of {TUTORIAL_TOTAL}
                                </Typography>
                                <Typography variant="h5" sx={{ color: "text.primary", lineHeight: 1.2 }}>
                                    {slide.title}
                                </Typography>
                            </Box>
                        </Stack>
                        <Button size="small" color="inherit" sx={{ color: "text.secondary" }} onClick={finishTutorial}>
                            Skip tutorial
                        </Button>
                    </Stack>

                    {/* Progress dots */}
                    <Stack direction="row" spacing={0.75} sx={{ mb: 3 }}>
                        {Array.from({ length: TUTORIAL_TOTAL }).map((_, i) => (
                            <Box
                                key={i}
                                onClick={() => setTutorialStep(i)}
                                sx={{
                                    width: i === tutorialStep ? 24 : 8, height: 8,
                                    borderRadius: 4,
                                    bgcolor: i === tutorialStep ? "primary.main"
                                        : i < tutorialStep ? "primary.light"
                                            : isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)",
                                    transition: "all 250ms",
                                    cursor: i !== tutorialStep ? "pointer" : "default",
                                }}
                            />
                        ))}
                    </Stack>

                    {/* Slide body */}
                    <Box sx={{ minHeight: 220 }}>
                        {slide.body}
                    </Box>

                    {/* Navigation */}
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 4 }}>
                        <Button
                            startIcon={<ArrowBackIcon />}
                            onClick={() => setTutorialStep((s) => s - 1)}
                            disabled={tutorialStep === 0}
                            color="inherit"
                            sx={{ color: "text.secondary" }}
                        >
                            Back
                        </Button>
                        {tutorialStep < TUTORIAL_TOTAL - 1 ? (
                            <Button
                                variant="contained"
                                endIcon={<ArrowForwardIcon />}
                                onClick={() => setTutorialStep((s) => s + 1)}
                            >
                                Next
                            </Button>
                        ) : (
                            <Button
                                variant="contained"
                                color="primary"
                                endIcon={<ArrowForwardIcon />}
                                onClick={finishTutorial}
                            >
                                Pick your enemy →
                            </Button>
                        )}
                    </Stack>
                </CardContent>
            </Card>
        );
    };

    const enemyHpPct = enemy ? (enemyHp / enemy.hp) * 100 : 0;
    const playerHpPct = (playerHp / playerMaxHp) * 100;

    const stats = mode ? getHighLow(GAME.TRANSLATION, mode) : { highest: null, lowest: null, count: 0 };
    const accuracyPct = promptsAnswered === 0 ? 0 : Math.round((promptsCorrect / promptsAnswered) * 100);
    const remark = getRemark(accuracyPct);

    return (
        <Box
            sx={{
                minHeight: "100vh", bgcolor: "background.default", py: 4, px: { xs: 2, md: 4 },
                position: "relative", overflow: "hidden",
                "&::before": {
                    content: '""', position: "absolute",
                    top: -120, left: -120, width: 360, height: 360, borderRadius: "50%",
                    background: "radial-gradient(circle, #C8456D 0%, transparent 70%)",
                    opacity: isDark ? 0.18 : 0.10, filter: "blur(28px)", pointerEvents: "none",
                },
                "&::after": {
                    content: '""', position: "absolute",
                    bottom: -150, right: -150, width: 420, height: 420, borderRadius: "50%",
                    background: "radial-gradient(circle, #FFC700 0%, transparent 70%)",
                    opacity: isDark ? 0.15 : 0.10, filter: "blur(32px)", pointerEvents: "none",
                },
            }}
        >
            <Box sx={{ maxWidth: 1100, mx: "auto", position: "relative", zIndex: 1 }}>
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
                    <TerminalIcon color="primary" />
                    <Typography variant="h4" sx={{ fontFamily: "'Pixelify Sans', sans-serif" }}>
                        Translation Terminal
                    </Typography>
                    {mode && (
                        <Chip
                            size="small"
                            label={MODE_META[mode].label}
                            sx={{
                                bgcolor: MODE_META[mode].color,
                                color: mode === MODE.POST_TEST ? "#000" : "#fff",
                                fontWeight: 700,
                            }}
                        />
                    )}
                </Stack>
                <Typography variant="body2" sx={{ mb: 3, color: "text.secondary" }}>
                    Read the prompt in English. Type the C syntax from memory before the timer runs out. Defeat the enemy.
                </Typography>

                {view === "tutorial" && renderTutorial()}

                {view === "mode" && (
                    <ModePickerCard
                        game={GAME.TRANSLATION}
                        onPick={onPickMode}
                        title="Translation Terminal — pick a mode"
                        subtitle="Practice uses a separate prompt bank from Pre-Test / Post-Test, so drilling won't leak the test answers."
                    />
                )}

                {view === "picker" && (
                    <Card>
                        <CardContent>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                                <Typography variant="h6">Choose your enemy</Typography>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <Tooltip title="How to play">
                                        <IconButton size="small" onClick={openTutorial} sx={{ color: "text.secondary" }}>
                                            <HelpOutlineIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    <Button size="small" onClick={backToModePicker}>Change mode</Button>
                                </Stack>
                            </Stack>
                            <Stack
                                direction="row" spacing={2}
                                sx={{ flexWrap: "wrap", "& > *": { mb: 2 } }}
                            >
                                {enemies.map((e, i) => (
                                    <Card
                                        key={e.id}
                                        variant="outlined"
                                        sx={{ width: 240, cursor: "pointer", "&:hover": { borderColor: e.color } }}
                                        onClick={() => startCombat(i)}
                                    >
                                        <CardContent sx={{ textAlign: "center" }}>
                                            {e.sprite ? (
                                                <Box
                                                    component="img"
                                                    src={e.sprite}
                                                    alt={e.name}
                                                    sx={{
                                                        width: 96, height: 96, imageRendering: "pixelated",
                                                        objectFit: "contain", display: "block", mx: "auto",
                                                    }}
                                                />
                                            ) : (
                                                <Typography sx={{ fontSize: 48 }}>{e.emoji}</Typography>
                                            )}
                                            <Typography variant="h6" sx={{ color: e.color }}>{e.name}</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                HP {e.hp} · ATK {e.attack}
                                            </Typography>
                                            <Button
                                                variant="contained"
                                                sx={{ mt: 2, bgcolor: e.color, "&:hover": { bgcolor: e.color, opacity: 0.85 } }}
                                                fullWidth
                                            >
                                                Engage
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </Stack>
                        </CardContent>
                    </Card>
                )}

                {view === "combat" && enemy && prompt && (
                    <Stack spacing={2}>
                        <Card sx={{
                            transition: "transform 150ms",
                            transform: flash === "miss" ? "translateX(-6px)" : "none",
                            border: "2px solid",
                            borderColor: flash === "hit" ? "#3ecf6a" : flash === "miss" ? "#ef4444" : "transparent",
                        }}>
                            <CardContent>
                                {/* Enemy bar */}
                                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
                                    {enemy.sprite ? (
                                        <Box component="img" src={enemy.sprite} alt={enemy.name}
                                            sx={{ width: 64, height: 64, imageRendering: "pixelated", objectFit: "contain" }} />
                                    ) : (
                                        <Typography sx={{ fontSize: 32 }}>{enemy.emoji}</Typography>
                                    )}
                                    <Box sx={{ flex: 1 }}>
                                        <Stack direction="row" justifyContent="space-between">
                                            <Typography variant="subtitle1" sx={{ color: enemy.color, fontWeight: 700 }}>{enemy.name}</Typography>
                                            <Typography variant="caption">{enemyHp} / {enemy.hp}</Typography>
                                        </Stack>
                                        <LinearProgress
                                            variant="determinate" value={enemyHpPct}
                                            sx={{ height: 10, borderRadius: 5, "& .MuiLinearProgress-bar": { bgcolor: enemy.color } }}
                                        />
                                    </Box>
                                </Stack>

                                {/* Player bar */}
                                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                                    <Box component="img" src="/assets/enemies/student.png" alt="You"
                                        sx={{ width: 64, height: 64, imageRendering: "pixelated", objectFit: "contain" }} />
                                    <Box sx={{ flex: 1 }}>
                                        <Stack direction="row" justifyContent="space-between">
                                            <Typography variant="subtitle2">You</Typography>
                                            <Typography variant="caption">{playerHp} / {playerMaxHp}</Typography>
                                        </Stack>
                                        <LinearProgress
                                            variant="determinate" value={playerHpPct} color="success"
                                            sx={{ height: 8, borderRadius: 4 }}
                                        />
                                    </Box>
                                    {combo > 0 && (
                                        <Chip
                                            icon={<FlashOnIcon />}
                                            label={`${combo}x combo`}
                                            color="warning"
                                            variant={combo >= 3 ? "filled" : "outlined"}
                                        />
                                    )}
                                </Stack>

                                <LinearProgress
                                    variant="determinate"
                                    value={(time / ROUND_SECONDS) * 100}
                                    color={time < 4 ? "error" : "primary"}
                                    sx={{ mb: 2, height: 4, borderRadius: 2 }}
                                />

                                <Typography variant="overline" color="text.secondary">Prompt</Typography>
                                <Typography variant="h6" sx={{ mb: 2 }}>{prompt.prompt}</Typography>

                                <textarea
                                    ref={inputRef}
                                    value={answer}
                                    onChange={(e) => setAnswer(e.target.value)}
                                    onKeyDown={onKey}
                                    spellCheck={false}
                                    placeholder="Type the C code here, then press Enter…"
                                    style={{
                                        width: "100%", minHeight: 80, padding: 12,
                                        fontFamily: "'JetBrains Mono', monospace", fontSize: 15, lineHeight: 1.5,
                                        border: "2px solid", borderColor: isDark ? "#2a2a3e" : "#d0d0e0",
                                        borderRadius: 6,
                                        background: isDark ? "#0F0F1E" : "#fff",
                                        color: isDark ? "#fff" : "#1a1a2e",
                                        outline: "none", resize: "vertical",
                                    }}
                                />
                                <Stack direction="row" spacing={2} justifyContent="space-between" sx={{ mt: 2 }}>
                                    <Typography variant="caption" color="text.secondary">
                                        Whitespace tolerant. Press Enter to attack.
                                    </Typography>
                                    <Button variant="contained" color="primary" onClick={onSubmit}>
                                        Attack
                                    </Button>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Stack>
                )}

                {(view === "victory" || view === "defeat") && (
                    <Card>
                        <CardContent sx={{ textAlign: "center", py: 6 }}>
                            <Typography variant="h4" sx={{ fontFamily: "'Pixelify Sans', sans-serif", mb: 1 }}>
                                {view === "victory" ? "Victory!" : "Defeated."}
                            </Typography>
                            <Alert
                                severity={remark.tone}
                                icon={false}
                                sx={{
                                    mb: 3, mx: "auto", maxWidth: 480, justifyContent: "center",
                                    "& .MuiAlert-message": { fontWeight: 700, fontSize: "1.05rem" },
                                }}
                            >
                                {remark.text}
                            </Alert>

                            <Typography sx={{ mb: 3 }}>
                                {view === "victory"
                                    ? `You defeated the ${enemy?.name} — ${promptsCorrect}/${promptsAnswered} prompts correct.`
                                    : `The ${enemy?.name} got the better of you. ${promptsCorrect}/${promptsAnswered} prompts cleared.`}
                            </Typography>

                            {mode && stats.count > 1 && (
                                <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 3 }}>
                                    <Chip
                                        icon={<EmojiEventsIcon sx={{ color: "#FFC700 !important" }} />}
                                        label={`Highest ${stats.highest}`}
                                        variant="outlined" color="primary"
                                    />
                                    <Chip label={`Lowest ${stats.lowest}`} variant="outlined" />
                                    <Chip label={`Attempt ${stats.count}`} variant="outlined" />
                                </Stack>
                            )}

                            <Stack direction="row" spacing={2} justifyContent="center">
                                <Button
                                    startIcon={<RestartAltIcon />}
                                    variant="outlined"
                                    onClick={restart}
                                    disabled={mode !== MODE.PRACTICE && !canStartMode(GAME.TRANSLATION, mode)}
                                >
                                    Rematch
                                </Button>
                                {view === "victory" && enemyIdx + 1 < enemies.length && (
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={() => startCombat(enemyIdx + 1)}
                                        disabled={mode !== MODE.PRACTICE && !canStartMode(GAME.TRANSLATION, mode)}
                                    >
                                        Next enemy →
                                    </Button>
                                )}
                                <Button onClick={backToModePicker}>Back to mode picker</Button>
                            </Stack>
                            {mode !== MODE.PRACTICE && !canStartMode(GAME.TRANSLATION, mode) && (
                                <Typography variant="caption" sx={{ mt: 2, display: "block", color: "text.secondary" }}>
                                    No attempts remaining in {MODE_META[mode]?.label}. Drill in Practice mode to keep training.
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                )}
            </Box>
        </Box>
    );
}
