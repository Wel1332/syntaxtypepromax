import React, { useState, useEffect, useRef, useMemo } from "react";
import { Box, Card, CardContent, Stack, Typography, Button, Chip, LinearProgress, useTheme } from "@mui/material";
import GpsFixedIcon from "@mui/icons-material/GpsFixed";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import drills from "../data/syntaxSniperDrills";

/**
 * Syntax Sniper — fill-in-the-blank speedrun.
 * Each underscore in the drill is a single-character punctuation blank
 * (`;` `{` `}` `(` `)` `,` etc). The active blank is highlighted; the user
 * presses one key per blank. The cursor auto-advances on a correct hit.
 * Wrong keys cost time. Goal: build punctuation muscle memory.
 */

const PER_DRILL_SECONDS = 25;

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

    const [view, setView] = useState("picker"); // picker | playing | done
    const [drillIdx, setDrillIdx] = useState(0);
    const [filled, setFilled] = useState([]); // array per drill, same length as answers
    const [active, setActive] = useState(0);
    const [timeLeft, setTimeLeft] = useState(PER_DRILL_SECONDS);
    const [score, setScore] = useState(0);
    const [misses, setMisses] = useState(0);
    const [completedDrills, setCompletedDrills] = useState(0);
    const [shake, setShake] = useState(false);

    const drill = drills[drillIdx];
    const segments = useMemo(() => (drill ? buildSegments(drill) : []), [drill]);
    const totalBlanks = drill?.answers.length ?? 0;

    const activeRef = useRef(active);
    const filledRef = useRef(filled);
    const viewRef = useRef(view);
    useEffect(() => { activeRef.current = active; }, [active]);
    useEffect(() => { filledRef.current = filled; }, [filled]);
    useEffect(() => { viewRef.current = view; }, [view]);

    const startDrill = (idx) => {
        const d = drills[idx];
        if (!d) {
            setView("done");
            return;
        }
        setDrillIdx(idx);
        setFilled(new Array(d.answers.length).fill(null));
        setActive(0);
        setTimeLeft(PER_DRILL_SECONDS);
        setView("playing");
    };

    const restart = () => {
        setScore(0);
        setMisses(0);
        setCompletedDrills(0);
        startDrill(0);
    };

    // Timer
    useEffect(() => {
        if (view !== "playing") return;
        const t = setInterval(() => {
            setTimeLeft(prev => {
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
            // Single-char keys only
            if (e.key.length !== 1) return;

            const d = drills[drillIdx];
            if (!d) return;
            const idx = activeRef.current;
            const expected = d.answers[idx];
            if (expected == null) return;

            e.preventDefault();
            if (e.key === expected) {
                const next = [...filledRef.current];
                next[idx] = e.key;
                setFilled(next);
                setScore(s => s + 10);
                if (idx + 1 >= d.answers.length) {
                    advanceDrill(true);
                } else {
                    setActive(idx + 1);
                }
            } else {
                setMisses(m => m + 1);
                setTimeLeft(t => Math.max(0, t - 0.5));
                setShake(true);
                setTimeout(() => setShake(false), 180);
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [drillIdx]);

    const advanceDrill = (cleared) => {
        if (cleared) {
            setCompletedDrills(c => c + 1);
            setScore(s => s + 50 + Math.round(timeLeft * 5)); // time bonus
        }
        const nextIdx = drillIdx + 1;
        if (nextIdx >= drills.length) {
            setView("done");
        } else {
            startDrill(nextIdx);
        }
    };

    const accuracy = useMemo(() => {
        const hits = score / 10; // rough
        const total = hits + misses;
        return total === 0 ? 100 : Math.round((hits / total) * 100);
    }, [score, misses]);

    return (
        <Box
            sx={{
                minHeight: "100vh",
                bgcolor: "background.default",
                py: 4,
                px: { xs: 2, md: 4 },
                position: "relative",
                overflow: "hidden",
                "&::before": {
                    content: '""',
                    position: "absolute",
                    top: -120, left: -120, width: 360, height: 360, borderRadius: "50%",
                    background: "radial-gradient(circle, #C8456D 0%, transparent 70%)",
                    opacity: isDark ? 0.18 : 0.10, filter: "blur(28px)", pointerEvents: "none",
                },
                "&::after": {
                    content: '""',
                    position: "absolute",
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
                </Stack>
                <Typography variant="body2" sx={{ mb: 3, color: "text.secondary" }}>
                    Each blank takes ONE key — semicolons, braces, parens, commas. Build punctuation muscle memory under time pressure.
                </Typography>

                {view === "picker" && (
                    <Card>
                        <CardContent>
                            <Typography variant="h6" sx={{ mb: 2 }}>Drills</Typography>
                            <Stack spacing={1}>
                                {drills.map((d, i) => (
                                    <Box key={d.id}
                                        sx={{
                                            display: "flex", alignItems: "center", justifyContent: "space-between",
                                            p: 1.5, border: "1px solid", borderColor: "divider", borderRadius: 1,
                                        }}
                                    >
                                        <Box>
                                            <Typography>{i + 1}. {d.title}</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {d.answers.length} blanks · {d.difficulty}
                                            </Typography>
                                        </Box>
                                        <Button size="small" variant="contained" onClick={() => { setScore(0); setMisses(0); setCompletedDrills(0); startDrill(i); }}>
                                            Start
                                        </Button>
                                    </Box>
                                ))}
                            </Stack>
                        </CardContent>
                    </Card>
                )}

                {view === "playing" && drill && (
                    <Card sx={{ animation: shake ? "snipe-shake 180ms" : "none", "@keyframes snipe-shake": {
                        "0%,100%": { transform: "translateX(0)" },
                        "25%": { transform: "translateX(-6px)" },
                        "75%": { transform: "translateX(6px)" },
                    } }}>
                        <CardContent>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                                <Typography variant="overline" color="text.secondary">
                                    Drill {drillIdx + 1} / {drills.length} — {drill.title}
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
                                    fontSize: 16,
                                    lineHeight: 1.7,
                                    m: 0,
                                    p: 2,
                                    bgcolor: isDark ? "#0F0F1E" : "#fff8f0",
                                    border: "1px solid",
                                    borderColor: "divider",
                                    borderRadius: 1,
                                    whiteSpace: "pre-wrap",
                                    overflow: "auto",
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
                                                display: "inline-block",
                                                minWidth: "1ch",
                                                px: "2px",
                                                borderBottom: isActive ? "3px solid #C8456D" : "2px solid rgba(127,127,127,0.4)",
                                                bgcolor: isFilled
                                                    ? "rgba(62,207,106,0.18)"
                                                    : isActive ? "rgba(200,69,109,0.18)" : "transparent",
                                                color: isFilled ? "#3ecf6a" : isActive ? "#C8456D" : "inherit",
                                                fontWeight: 700,
                                                animation: isActive ? "snipe-blink 900ms infinite" : "none",
                                                "@keyframes snipe-blink": {
                                                    "0%, 100%": { opacity: 1 },
                                                    "50%": { opacity: 0.55 },
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
                            <Typography variant="h4" sx={{ fontFamily: "'Pixelify Sans', sans-serif", mb: 2 }}>
                                Done.
                            </Typography>
                            <Stack direction="row" spacing={3} justifyContent="center" sx={{ mb: 3 }}>
                                <Stat label="Score" value={score} />
                                <Stat label="Drills cleared" value={`${completedDrills} / ${drills.length}`} />
                                <Stat label="Misses" value={misses} />
                                <Stat label="Accuracy" value={`${accuracy}%`} />
                            </Stack>
                            <Button startIcon={<RestartAltIcon />} variant="contained" color="primary" onClick={restart}>
                                Play again
                            </Button>
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
