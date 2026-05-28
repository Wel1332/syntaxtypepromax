import React, { useState, useEffect, useRef, useMemo } from "react";
import {
    Box, Card, CardContent, Stack, Typography, Button, Chip, LinearProgress, useTheme,
} from "@mui/material";
import TerminalIcon from "@mui/icons-material/Terminal";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import translationPrompts, { enemies } from "../data/translationPrompts";
import { tokensEqual } from "../../../shared/utils/codeCompare";

/**
 * Translation Terminal — English→C combat.
 * Each round shows an English prompt. The student types the exact C syntax
 * under a timer. tokensEqual handles whitespace/formatting tolerance.
 * Correct + in time → damage enemy. Wrong / timeout → enemy hits you.
 * Defeat the enemy to win. Recall is from memory; nothing is shown to copy.
 */

const ROUND_SECONDS = 12;

function pickPromptForEnemy(enemy, alreadyUsed) {
    const pool = translationPrompts.filter(p => !alreadyUsed.includes(p.id));
    if (pool.length === 0) {
        // Recycle if we ran out
        return translationPrompts[Math.floor(Math.random() * translationPrompts.length)];
    }
    // Bias toward enemy tier
    const easier = enemy.hp < 50;
    const filtered = pool.filter(p =>
        easier ? p.difficulty !== "hard" : true
    );
    const final = filtered.length ? filtered : pool;
    return final[Math.floor(Math.random() * final.length)];
}

export default function TranslationTerminal() {
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";

    const [view, setView] = useState("picker"); // picker | combat | victory | defeat
    const [enemyIdx, setEnemyIdx] = useState(0);
    const [enemyHp, setEnemyHp] = useState(0);
    const [playerHp, setPlayerHp] = useState(100);
    const [playerMaxHp] = useState(100);
    const [prompt, setPrompt] = useState(null);
    const [answer, setAnswer] = useState("");
    const [time, setTime] = useState(ROUND_SECONDS);
    const [usedIds, setUsedIds] = useState([]);
    const [flash, setFlash] = useState(null); // 'hit' | 'miss' | null
    const [combo, setCombo] = useState(0);

    const inputRef = useRef(null);
    const viewRef = useRef(view);
    useEffect(() => { viewRef.current = view; }, [view]);

    const enemy = enemies[enemyIdx];

    const startCombat = (idx) => {
        const e = enemies[idx];
        if (!e) return;
        setEnemyIdx(idx);
        setEnemyHp(e.hp);
        setPlayerHp(playerMaxHp);
        setCombo(0);
        const used = [];
        setUsedIds(used);
        const p = pickPromptForEnemy(e, used);
        setUsedIds([p.id]);
        setPrompt(p);
        setAnswer("");
        setTime(ROUND_SECONDS);
        setView("combat");
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    const restart = () => startCombat(enemyIdx);

    // Round timer
    useEffect(() => {
        if (view !== "combat") return;
        const t = setInterval(() => {
            setTime(prev => {
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
        setPlayerHp(prev => {
            const next = Math.max(0, prev - dmg);
            if (next === 0) setView("defeat");
            return next;
        });
        // Next prompt
        nextPrompt();
    };

    const nextPrompt = () => {
        const e = enemies[enemyIdx];
        setUsedIds(used => {
            const next = pickPromptForEnemy(e, used);
            setPrompt(next);
            return [...used, next.id];
        });
        setAnswer("");
        setTime(ROUND_SECONDS);
    };

    const onSubmit = () => {
        if (view !== "combat" || !prompt) return;
        if (tokensEqual(prompt.solution, answer)) {
            // Hit
            const newCombo = combo + 1;
            const multiplier = 1 + Math.floor(newCombo / 3);
            const dmg = prompt.damage * multiplier;
            setCombo(newCombo);
            setFlash("hit");
            setTimeout(() => setFlash(null), 300);
            setEnemyHp(prev => {
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

    const enemyHpPct = enemy ? (enemyHp / enemy.hp) * 100 : 0;
    const playerHpPct = (playerHp / playerMaxHp) * 100;

    return (
        <Box
            sx={{
                minHeight: "100vh",
                bgcolor: "background.default",
                py: 4, px: { xs: 2, md: 4 },
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
                </Stack>
                <Typography variant="body2" sx={{ mb: 3, color: "text.secondary" }}>
                    Read the prompt in English. Type the C syntax from memory before the timer runs out. Defeat the enemy.
                </Typography>

                {view === "picker" && (
                    <Card>
                        <CardContent>
                            <Typography variant="h6" sx={{ mb: 2 }}>Choose your enemy</Typography>
                            <Stack
                                direction="row"
                                spacing={2}
                                sx={{ flexWrap: "wrap", "& > *": { mb: 2 } }}
                            >
                                {enemies.map((e, i) => (
                                    <Card key={e.id} variant="outlined" sx={{ width: 240, cursor: "pointer", "&:hover": { borderColor: e.color } }} onClick={() => startCombat(i)}>
                                        <CardContent sx={{ textAlign: "center" }}>
                                            {e.sprite ? (
                                                <Box
                                                    component="img"
                                                    src={e.sprite}
                                                    alt={e.name}
                                                    sx={{
                                                        width: 96,
                                                        height: 96,
                                                        imageRendering: "pixelated",
                                                        objectFit: "contain",
                                                        display: "block",
                                                        mx: "auto",
                                                    }}
                                                />
                                            ) : (
                                                <Typography sx={{ fontSize: 48 }}>{e.emoji}</Typography>
                                            )}
                                            <Typography variant="h6" sx={{ color: e.color }}>{e.name}</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                HP {e.hp} · ATK {e.attack}
                                            </Typography>
                                            <Button variant="contained" sx={{ mt: 2, bgcolor: e.color, "&:hover": { bgcolor: e.color, opacity: 0.85 } }} fullWidth>
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
                                        <Box
                                            component="img"
                                            src={enemy.sprite}
                                            alt={enemy.name}
                                            sx={{ width: 64, height: 64, imageRendering: "pixelated", objectFit: "contain" }}
                                        />
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
                                    <Box
                                        component="img"
                                        src="/assets/enemies/student.png"
                                        alt="You"
                                        sx={{ width: 64, height: 64, imageRendering: "pixelated", objectFit: "contain" }}
                                    />
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
                                    onChange={e => setAnswer(e.target.value)}
                                    onKeyDown={onKey}
                                    spellCheck={false}
                                    placeholder="Type the C code here, then press Enter…"
                                    style={{
                                        width: "100%",
                                        minHeight: 80,
                                        padding: 12,
                                        fontFamily: "'JetBrains Mono', monospace",
                                        fontSize: 15,
                                        lineHeight: 1.5,
                                        border: "2px solid",
                                        borderColor: isDark ? "#2a2a3e" : "#d0d0e0",
                                        borderRadius: 6,
                                        background: isDark ? "#0F0F1E" : "#fff",
                                        color: isDark ? "#fff" : "#1a1a2e",
                                        outline: "none",
                                        resize: "vertical",
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
                            <Typography variant="h4" sx={{ fontFamily: "'Pixelify Sans', sans-serif", mb: 2 }}>
                                {view === "victory" ? "Victory!" : "Defeated."}
                            </Typography>
                            <Typography sx={{ mb: 3 }}>
                                {view === "victory"
                                    ? `You defeated the ${enemy?.name}. ${enemyIdx + 1 < enemies.length ? "Take on the next foe." : "All enemies cleared."}`
                                    : `The ${enemy?.name} got the better of you. Try again.`}
                            </Typography>
                            <Stack direction="row" spacing={2} justifyContent="center">
                                <Button startIcon={<RestartAltIcon />} variant="outlined" onClick={restart}>
                                    Rematch
                                </Button>
                                {view === "victory" && enemyIdx + 1 < enemies.length && (
                                    <Button variant="contained" color="primary" onClick={() => startCombat(enemyIdx + 1)}>
                                        Next enemy →
                                    </Button>
                                )}
                                <Button onClick={() => setView("picker")}>
                                    Back to picker
                                </Button>
                            </Stack>
                        </CardContent>
                    </Card>
                )}
            </Box>
        </Box>
    );
}
