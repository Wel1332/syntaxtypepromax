import React, { useState, useEffect, useRef, useMemo } from "react";
import {
    Box, Card, CardContent, Stack, Typography, Button, Chip, LinearProgress,
    Alert, useTheme,
} from "@mui/material";
import GpsFixedIcon from "@mui/icons-material/GpsFixed";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import { practiceBank, testBank } from "../data/syntaxSniperDrills";
import ModePickerCard from "../../../shared/assessment/ModePickerCard";
import {
    MODE, GAME, MODE_META, canStartMode, recordAttempt, getHighLow, getRemark,
} from "../../../shared/assessment/modes";

/**
 * Syntax Sniper — fill-in-the-blank speedrun.
 *
 * Flow: mode picker → shuffled session of drills → results screen.
 * Mode determines (a) which drill bank we pull from, (b) whether attempts are
 * limited, and (c) the remarks tier shown at the end. The deck is shuffled per
 * session so question order is non-deterministic and difficulty is mixed.
 */

const PER_DRILL_SECONDS = 25;
const SESSION_LENGTH = 6; // drills per session — keeps a Pre/Post run digestible

// Fisher-Yates — returns a shuffled copy.
const shuffled = (arr) => {
    const out = arr.slice();
    for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
};

const buildSession = (mode) => {
    const bank = mode === MODE.PRACTICE ? practiceBank : testBank;
    const deck = shuffled(bank).slice(0, Math.min(SESSION_LENGTH, bank.length));
    return deck;
};

function buildSegments(drill) {
    const segs = [];
    const code = drill.code;
    let last = 0;
    let blankIdx = 0;
    for (let i = 0; i < code.length; i++) {
        if (code[i] === "_") {
            if (i > last) segs.push({ kind: "text", value: code.slice(last, i) });
            segs.push({ kind: "blank", expected: drill.answers[blankIdx], index: blankIdx });
            blankIdx++;
            last = i + 1;
        }
    }
    if (last < code.length) segs.push({ kind: "text", value: code.slice(last) });
    return segs;
}

export default function SyntaxSniper() {
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";

    const [view, setView] = useState("mode"); // mode | playing | done
    const [mode, setMode] = useState(null);
    const [session, setSession] = useState([]);
    const [drillIdx, setDrillIdx] = useState(0);
    const [filled, setFilled] = useState([]);
    const [active, setActive] = useState(0);
    const [timeLeft, setTimeLeft] = useState(PER_DRILL_SECONDS);
    const [score, setScore] = useState(0);
    const [misses, setMisses] = useState(0);
    const [completedDrills, setCompletedDrills] = useState(0);
    const [shake, setShake] = useState(false);

    const drill = session[drillIdx];
    const segments = useMemo(() => (drill ? buildSegments(drill) : []), [drill]);

    const activeRef = useRef(active);
    const filledRef = useRef(filled);
    const viewRef = useRef(view);
    const drillIdxRef = useRef(drillIdx);
    const sessionRef = useRef(session);
    const timeLeftRef = useRef(timeLeft);
    useEffect(() => { activeRef.current = active; }, [active]);
    useEffect(() => { filledRef.current = filled; }, [filled]);
    useEffect(() => { viewRef.current = view; }, [view]);
    useEffect(() => { drillIdxRef.current = drillIdx; }, [drillIdx]);
    useEffect(() => { sessionRef.current = session; }, [session]);
    useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);

    const onPickMode = (m) => {
        if (!canStartMode(GAME.SNIPER, m)) return;
        setMode(m);
        const deck = buildSession(m);
        setSession(deck);
        setScore(0);
        setMisses(0);
        setCompletedDrills(0);
        startDrillIn(deck, 0);
    };

    const startDrillIn = (deck, idx) => {
        const d = deck[idx];
        if (!d) {
            finalise();
            return;
        }
        setDrillIdx(idx);
        setFilled(new Array(d.answers.length).fill(null));
        setActive(0);
        setTimeLeft(PER_DRILL_SECONDS);
        setView("playing");
    };

    const restart = () => {
        if (!mode) return;
        const deck = buildSession(mode);
        setSession(deck);
        setScore(0);
        setMisses(0);
        setCompletedDrills(0);
        startDrillIn(deck, 0);
    };

    const backToModePicker = () => {
        setView("mode");
        setMode(null);
        setSession([]);
    };

    // Timer
    useEffect(() => {
        if (view !== "playing") return;
        const t = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 0.1) {
                    clearInterval(t);
                    advanceDrill(false);
                    return 0;
                }
                return prev - 0.1;
            });
        }, 100);
        return () => clearInterval(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [view, drillIdx]);

    // Keyboard handler
    useEffect(() => {
        const handler = (e) => {
            if (viewRef.current !== "playing") return;
            if (e.metaKey || e.ctrlKey || e.altKey) return;
            if (e.key.length !== 1) return;

            const d = sessionRef.current[drillIdxRef.current];
            if (!d) return;
            const idx = activeRef.current;
            const expected = d.answers[idx];
            if (expected == null) return;

            e.preventDefault();
            if (e.key === expected) {
                const next = [...filledRef.current];
                next[idx] = e.key;
                setFilled(next);
                setScore((s) => s + 10);
                if (idx + 1 >= d.answers.length) {
                    advanceDrill(true);
                } else {
                    setActive(idx + 1);
                }
            } else {
                setMisses((m) => m + 1);
                setTimeLeft((t) => Math.max(0, t - 0.5));
                setShake(true);
                setTimeout(() => setShake(false), 180);
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const advanceDrill = (cleared) => {
        const tNow = timeLeftRef.current;
        let earned = 0;
        if (cleared) {
            setCompletedDrills((c) => c + 1);
            earned = 50 + Math.round(tNow * 5);
            setScore((s) => s + earned);
        }
        const nextIdx = drillIdxRef.current + 1;
        if (nextIdx >= sessionRef.current.length) {
            finalise(earned);
        } else {
            startDrillIn(sessionRef.current, nextIdx);
        }
    };

    // Compute final score with any pending advance bonus that React hasn't
    // committed yet, then persist + transition to results.
    const finalise = (pendingBonus = 0) => {
        const totalScore = score + pendingBonus;
        const totalBlanks = sessionRef.current.reduce((sum, d) => sum + d.answers.length, 0);
        const hits = Math.round(totalScore - (completedDrills * 50)) / 10; // approximate; not critical
        // Cleaner accuracy: completed-drills / total-drills as a percent for remarks.
        const percent = sessionRef.current.length === 0
            ? 0
            : Math.round(((completedDrills + (pendingBonus > 0 ? 1 : 0)) / sessionRef.current.length) * 100);

        if (mode) {
            recordAttempt(GAME.SNIPER, mode, {
                score: totalScore,
                percent,
                misses,
                drillsCleared: completedDrills + (pendingBonus > 0 ? 1 : 0),
                totalDrills: sessionRef.current.length,
                totalBlanks,
                hits,
            });
        }
        setView("done");
    };

    const accuracy = useMemo(() => {
        const hits = score / 10;
        const total = hits + misses;
        return total === 0 ? 100 : Math.round((hits / total) * 100);
    }, [score, misses]);

    const stats = mode ? getHighLow(GAME.SNIPER, mode) : { highest: null, lowest: null, count: 0 };
    const remarkPercent = session.length === 0 ? 0 : Math.round((completedDrills / session.length) * 100);
    const remark = getRemark(remarkPercent);

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
            <Box sx={{ maxWidth: 1000, mx: "auto", position: "relative", zIndex: 1 }}>
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
                    <GpsFixedIcon color="primary" />
                    <Typography variant="h4" sx={{ fontFamily: "'Pixelify Sans', sans-serif" }}>
                        Syntax Sniper
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
                    Each blank takes ONE key — semicolons, braces, parens, commas. Build punctuation muscle memory under time pressure.
                </Typography>

                {view === "mode" && (
                    <ModePickerCard
                        game={GAME.SNIPER}
                        onPick={onPickMode}
                        title="Syntax Sniper — pick a mode"
                        subtitle="Practice uses an open drill bank; Pre-Test and Post-Test pull from a separate, sealed bank."
                    />
                )}

                {view === "playing" && drill && (
                    <Card sx={{
                        animation: shake ? "snipe-shake 180ms" : "none",
                        "@keyframes snipe-shake": {
                            "0%,100%": { transform: "translateX(0)" },
                            "25%":     { transform: "translateX(-6px)" },
                            "75%":     { transform: "translateX(6px)" },
                        },
                    }}>
                        <CardContent>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                                <Typography variant="overline" color="text.secondary">
                                    Drill {drillIdx + 1} / {session.length} — {drill.title}
                                    <Chip
                                        size="small"
                                        label={drill.difficulty}
                                        sx={{ ml: 1, textTransform: "capitalize" }}
                                        color={
                                            drill.difficulty === "easy" ? "success"
                                                : drill.difficulty === "medium" ? "warning"
                                                    : "error"
                                        }
                                        variant="outlined"
                                    />
                                </Typography>
                                <Stack direction="row" spacing={2}>
                                    <Chip size="small" label={`Score ${score}`} color="primary" />
                                    <Chip size="small" label={`Misses ${misses}`} color={misses > 0 ? "error" : "default"} variant="outlined" />
                                    <Chip size="small" label={`Time ${timeLeft.toFixed(1)}s`} color="warning" />
                                </Stack>
                            </Stack>

                            <LinearProgress
                                variant="determinate"
                                value={(timeLeft / PER_DRILL_SECONDS) * 100}
                                color={timeLeft < 5 ? "error" : "primary"}
                                sx={{ mb: 2, height: 6, borderRadius: 3 }}
                            />

                            <Box
                                component="pre"
                                sx={{
                                    fontFamily: "'JetBrains Mono', monospace",
                                    fontSize: 16, lineHeight: 1.7, m: 0, p: 2,
                                    bgcolor: isDark ? "#0F0F1E" : "#fff8f0",
                                    border: "1px solid", borderColor: "divider", borderRadius: 1,
                                    whiteSpace: "pre-wrap", overflow: "auto",
                                }}
                            >
                                {segments.map((seg, i) => {
                                    if (seg.kind === "text") return <span key={i}>{seg.value}</span>;
                                    const isActive = seg.index === active;
                                    const isFilled = filled[seg.index] != null;
                                    return (
                                        <Box
                                            key={i}
                                            component="span"
                                            sx={{
                                                display: "inline-block", minWidth: "1ch", px: "2px",
                                                borderBottom: isActive ? "3px solid #C8456D" : "2px solid rgba(127,127,127,0.4)",
                                                bgcolor: isFilled
                                                    ? "rgba(62,207,106,0.18)"
                                                    : isActive ? "rgba(200,69,109,0.18)" : "transparent",
                                                color: isFilled ? "#3ecf6a" : isActive ? "#C8456D" : "inherit",
                                                fontWeight: 700,
                                                animation: isActive ? "snipe-blink 900ms infinite" : "none",
                                                "@keyframes snipe-blink": {
                                                    "0%, 100%": { opacity: 1 },
                                                    "50%":      { opacity: 0.55 },
                                                },
                                            }}
                                        >
                                            {filled[seg.index] ?? "_"}
                                        </Box>
                                    );
                                })}
                            </Box>

                            <Typography variant="caption" sx={{ mt: 2, display: "block", color: "text.secondary" }}>
                                Tip: just press the key. Wrong keys cost 0.5 seconds.
                            </Typography>
                        </CardContent>
                    </Card>
                )}

                {view === "done" && (
                    <Card>
                        <CardContent sx={{ textAlign: "center", py: 6 }}>
                            <Typography variant="h4" sx={{ fontFamily: "'Pixelify Sans', sans-serif", mb: 1 }}>
                                Session complete
                            </Typography>
                            <Alert
                                severity={remark.tone}
                                icon={false}
                                sx={{
                                    mb: 3,
                                    mx: "auto",
                                    maxWidth: 480,
                                    justifyContent: "center",
                                    "& .MuiAlert-message": { fontWeight: 700, fontSize: "1.05rem" },
                                }}
                            >
                                {remark.text}
                            </Alert>

                            <Stack direction="row" spacing={3} justifyContent="center" sx={{ mb: 3, flexWrap: "wrap" }}>
                                <Stat label="Score" value={score} />
                                <Stat label="Drills cleared" value={`${completedDrills} / ${session.length}`} />
                                <Stat label="Misses" value={misses} />
                                <Stat label="Accuracy" value={`${accuracy}%`} />
                            </Stack>

                            {mode && stats.count > 1 && (
                                <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 3 }}>
                                    <Chip
                                        icon={<EmojiEventsIcon sx={{ color: "#FFC700 !important" }} />}
                                        label={`Highest ${stats.highest}`}
                                        variant="outlined"
                                        color="primary"
                                    />
                                    <Chip label={`Lowest ${stats.lowest}`} variant="outlined" />
                                    <Chip label={`Attempt ${stats.count}`} variant="outlined" />
                                </Stack>
                            )}

                            <Stack direction="row" spacing={2} justifyContent="center">
                                <Button
                                    startIcon={<RestartAltIcon />}
                                    variant="contained"
                                    color="primary"
                                    onClick={restart}
                                    disabled={mode !== MODE.PRACTICE && !canStartMode(GAME.SNIPER, mode)}
                                >
                                    Play again
                                </Button>
                                <Button variant="outlined" onClick={backToModePicker}>
                                    Back to mode picker
                                </Button>
                            </Stack>
                            {mode !== MODE.PRACTICE && !canStartMode(GAME.SNIPER, mode) && (
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

function Stat({ label, value }) {
    return (
        <Box>
            <Typography variant="overline" color="text.secondary">{label}</Typography>
            <Typography variant="h5">{value}</Typography>
        </Box>
    );
}
