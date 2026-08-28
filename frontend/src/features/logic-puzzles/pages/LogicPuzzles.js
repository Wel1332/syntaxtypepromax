import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box, Card, CardContent, Stack, Typography, Button, Chip, LinearProgress,
    Alert, useTheme, Snackbar,
} from "@mui/material";
import PsychologyIcon from "@mui/icons-material/Psychology";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import { logicPuzzles, shuffled, CONSTRUCTS } from "../data/logicPuzzles";
import { getRemark } from "../../../shared/assessment/modes";
import { useScoreSubmission } from "../../../shared/hooks/useScoreSubmission";

/**
 * Logic Puzzles — read-and-reason challenges over C constructs (Objective 5.2).
 *
 * The other three game modes all measure how fast a player can *produce* syntax.
 * None of them measures whether the player can read it, which is what this mode
 * covers: predict the output, count the iterations, spot the off-by-one.
 *
 * Deliberately untimed. The skill under test is reasoning, and a countdown would
 * turn it back into a speed measure. It also carries no modeType, so its
 * submissions cannot contaminate the pre/post assessment data of the three
 * instrumented games.
 */

const SESSION_LENGTH = 10;

export default function LogicPuzzles() {
    const theme = useTheme();
    const navigate = useNavigate();
    const isDark = theme.palette.mode === "dark";

    const [view, setView] = useState("intro"); // intro | playing | results
    const [deck, setDeck] = useState([]);
    const [index, setIndex] = useState(0);
    const [picked, setPicked] = useState(null);
    const [correct, setCorrect] = useState(0);
    const [perConstruct, setPerConstruct] = useState({});

    const { submitScore, submitMessage, submitSuccess, snackbarOpen, setSnackbarOpen } =
        useScoreSubmission();

    const puzzle = deck[index] ?? null;
    const answered = picked !== null;
    const isRight = answered && puzzle && picked === puzzle.answer;

    const start = () => {
        setDeck(shuffled(logicPuzzles).slice(0, SESSION_LENGTH));
        setIndex(0);
        setPicked(null);
        setCorrect(0);
        setPerConstruct({});
        setView("playing");
    };

    const choose = (i) => {
        if (answered || !puzzle) return;
        setPicked(i);
        const right = i === puzzle.answer;
        if (right) setCorrect((c) => c + 1);
        // Per-construct tallies are what make "completion rates tied to C
        // constructs" reportable rather than a single aggregate score.
        setPerConstruct((prev) => {
            const cur = prev[puzzle.construct] ?? { attempted: 0, correct: 0 };
            return {
                ...prev,
                [puzzle.construct]: {
                    attempted: cur.attempted + 1,
                    correct: cur.correct + (right ? 1 : 0),
                },
            };
        });
    };

    const next = () => {
        if (index + 1 >= deck.length) {
            finish();
            return;
        }
        setIndex((i) => i + 1);
        setPicked(null);
    };

    const finish = () => {
        const total = deck.length;
        const finalCorrect = correct;
        const percent = total === 0 ? 0 : Math.round((finalCorrect / total) * 100);
        // Score is the percentage so the leaderboard compares like with like.
        // wpm is 0 — nothing here is typed, and reporting a fake figure would
        // pollute the typing statistics this platform exists to measure.
        submitScore("LOGIC_PUZZLES", {
            score: percent,
            accuracy: percent,
            wpm: 0,
            correctCount: finalCorrect,
            totalCount: total,
            errorCount: total - finalCorrect,
        });
        setView("results");
    };

    const percent = deck.length === 0 ? 0 : Math.round((correct / deck.length) * 100);
    const remark = useMemo(() => getRemark(percent), [percent]);

    const codeBox = {
        fontFamily: "monospace",
        fontSize: { xs: 13, md: 15 },
        whiteSpace: "pre",
        overflowX: "auto",
        p: 2,
        borderRadius: 1.5,
        bgcolor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
        color: "text.primary",
    };

    return (
        <Box sx={{ bgcolor: "background.default", minHeight: "100vh", py: { xs: 3, md: 6 } }}>
            <Box sx={{ maxWidth: 820, mx: "auto", px: 2 }}>

                {view === "intro" && (
                    <Card>
                        <CardContent>
                            <Stack spacing={2}>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <PsychologyIcon color="primary" />
                                    <Typography variant="h5" sx={{ fontWeight: 800 }}>
                                        Logic Puzzles
                                    </Typography>
                                </Stack>
                                <Typography sx={{ color: "text.secondary" }}>
                                    Read the C snippet and work out what it does. No timer —
                                    this one is about reasoning, not speed.
                                </Typography>
                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                    {CONSTRUCTS.map((c) => (
                                        <Chip key={c} label={c} size="small" />
                                    ))}
                                </Stack>
                                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                    {SESSION_LENGTH} puzzles per run, drawn at random from{" "}
                                    {logicPuzzles.length}.
                                </Typography>
                                <Button variant="contained" size="large" onClick={start}>
                                    Start
                                </Button>
                            </Stack>
                        </CardContent>
                    </Card>
                )}

                {view === "playing" && puzzle && (
                    <Card>
                        <CardContent>
                            <Stack spacing={2}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Chip size="small" label={puzzle.construct} color="primary" />
                                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                        {index + 1} / {deck.length}
                                    </Typography>
                                </Stack>
                                <LinearProgress
                                    variant="determinate"
                                    value={((index) / deck.length) * 100}
                                />

                                <Box component="pre" sx={codeBox}>{puzzle.code}</Box>

                                <Typography sx={{ fontWeight: 700 }}>{puzzle.question}</Typography>

                                <Stack spacing={1}>
                                    {puzzle.choices.map((c, i) => {
                                        let color = "inherit";
                                        let variant = "outlined";
                                        if (answered && i === puzzle.answer) {
                                            color = "success"; variant = "contained";
                                        } else if (answered && i === picked) {
                                            color = "error"; variant = "contained";
                                        }
                                        return (
                                            <Button
                                                key={i}
                                                onClick={() => choose(i)}
                                                disabled={answered}
                                                variant={variant}
                                                color={color}
                                                sx={{ justifyContent: "flex-start", textTransform: "none", fontFamily: "monospace" }}
                                            >
                                                {c}
                                            </Button>
                                        );
                                    })}
                                </Stack>

                                {answered && (
                                    <Alert severity={isRight ? "success" : "error"}>
                                        <Typography sx={{ fontWeight: 700 }}>
                                            {isRight ? "Correct." : "Not quite."}
                                        </Typography>
                                        <Typography variant="body2">{puzzle.why}</Typography>
                                    </Alert>
                                )}

                                {answered && (
                                    <Button variant="contained" onClick={next}>
                                        {index + 1 >= deck.length ? "See results" : "Next puzzle"}
                                    </Button>
                                )}
                            </Stack>
                        </CardContent>
                    </Card>
                )}

                {view === "results" && (
                    <Card>
                        <CardContent>
                            <Stack spacing={2} sx={{ textAlign: "center" }}>
                                <EmojiEventsIcon sx={{ fontSize: 56, mx: "auto", color: "warning.main" }} />
                                <Typography variant="h5" sx={{ fontWeight: 800 }}>
                                    {correct} / {deck.length} correct
                                </Typography>
                                <Typography sx={{ color: remark.color, fontWeight: 700 }}>
                                    {remark.text}
                                </Typography>

                                <Stack spacing={0.5} sx={{ textAlign: "left", pt: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                        By construct
                                    </Typography>
                                    {Object.entries(perConstruct).map(([c, v]) => (
                                        <Typography key={c} variant="body2" sx={{ color: "text.secondary" }}>
                                            {c}: {v.correct} / {v.attempted}
                                        </Typography>
                                    ))}
                                </Stack>

                                <Stack direction="row" spacing={1} justifyContent="center" sx={{ pt: 1 }}>
                                    <Button startIcon={<RestartAltIcon />} variant="contained" onClick={start}>
                                        Play again
                                    </Button>
                                    <Button variant="text" onClick={() => navigate("/dashboard")}>
                                        Back to dashboard
                                    </Button>
                                </Stack>
                            </Stack>
                        </CardContent>
                    </Card>
                )}
            </Box>

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={4000}
                onClose={() => setSnackbarOpen(false)}
            >
                <Alert severity={submitSuccess ? "success" : "error"} onClose={() => setSnackbarOpen(false)}>
                    {submitMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
}
