import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../utils/api";
import { authFetch } from "../utils/authFetch";
import { useScoreSubmission } from "../hooks/useScoreSubmission";
import {
    Box,
    Card,
    CardContent,
    Stack,
    Typography,
    Button,
    Chip,
    IconButton,
    LinearProgress,
    CircularProgress,
    Snackbar,
    Alert,
    Divider,
    Tooltip,
    useTheme,
} from "@mui/material";
import KeyboardIcon from "@mui/icons-material/Keyboard";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import codeChallenges from "./codeChallenges";

const gradientText = {
    background: "linear-gradient(90deg, #C8456D 0%, #E78AAC 50%, #FFC700 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    display: "inline-block",
};

const DIFF_COLOR = { easy: "#2D7A3A", medium: "#B45309", hard: "#9B2E54" };
const DIFF_LABEL = { easy: "EASY", medium: "MEDIUM", hard: "HARD" };

const PB_PREFIX = "tt:best:";
const loadPersonalBest = (challengeId) => {
    try {
        const raw = localStorage.getItem(`${PB_PREFIX}${challengeId}`);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};
const savePersonalBest = (challengeId, stats) => {
    try {
        localStorage.setItem(`${PB_PREFIX}${challengeId}`, JSON.stringify(stats));
    } catch {}
};

// The user only types the answer characters that fill the blanks (not the whole code).
// Expected text = concatenation of all answers in order.
const buildExpected = (challenge) => {
    if (!challenge) return "";
    const { answers = [] } = challenge;
    return answers.join("");
};

// Split code by "___" into static parts that surround each blank.
// Returns: { parts: string[], answers: string[] }
// where parts.length === answers.length + 1
const tokenizeChallenge = (challenge) => {
    if (!challenge) return { parts: [""], answers: [] };
    const { code = "", answers = [] } = challenge;
    const parts = code.split("___");
    return { parts, answers };
};

// Compute final stats from input vs expected, given elapsed seconds.
const computeStats = (input, expected, elapsedSeconds) => {
    const trimmed = input.slice(0, expected.length);
    let correctChars = 0;
    for (let i = 0; i < expected.length; i++) {
        if (trimmed[i] === expected[i]) correctChars++;
    }
    const totalChars = expected.length;
    const accuracy = totalChars > 0 ? Math.round((correctChars / totalChars) * 100) : 0;
    // Industry-standard WPM = (chars / 5) / minutes
    const minutes = Math.max(elapsedSeconds, 1) / 60;
    const wpm = Math.round((trimmed.length / 5) / minutes);
    // Blended score: 70% accuracy, 30% speed (capped at 100 WPM for the speed term).
    const score = Math.round(accuracy * 0.7 + Math.min(wpm, 100) * 0.3);
    const errors = totalChars - correctChars;
    return { accuracy, wpm, score, errors, correctChars, totalChars, trimmedLen: trimmed.length };
};

const TypingTest = () => {
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";
    const navigate = useNavigate();

    // View state: 'picker' (mode picker), 'list' (challenge list), 'test' (active test)
    const [view, setView] = useState("picker");
    const [challenges, setChallenges] = useState([]);
    const [selectedChallenge, setSelectedChallenge] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Typing state
    const [input, setInput] = useState("");
    const [startTime, setStartTime] = useState(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [wpm, setWpm] = useState(0);
    const [accuracy, setAccuracy] = useState(100);
    const [isTestComplete, setIsTestComplete] = useState(false);
    const [finalStats, setFinalStats] = useState(null);
    const [showCursor, setShowCursor] = useState(true);
    const [personalBest, setPersonalBest] = useState(null);

    // Refs
    const hiddenInputRef = useRef(null);
    const expectedRef = useRef("");

    // Score submission
    const [showSubmitButton, setShowSubmitButton] = useState(false);
    const { submitScore, isSubmitting, submitMessage, submitSuccess, snackbarOpen, setSnackbarOpen } =
        useScoreSubmission();

    // Load challenge list for code/paragraph mode
    const fetchCodeChallenges = useCallback(() => {
        setError(null);
        setLoading(true);
        try {
            setChallenges(codeChallenges);
        } catch (err) {
            setError("Failed to load challenges.");
        } finally {
            setLoading(false);
        }
    }, []);

    // Reset typing state to baseline for the current challenge.
    const resetTypingState = useCallback(() => {
        setInput("");
        setStartTime(null);
        setElapsedTime(0);
        setWpm(0);
        setAccuracy(100);
        setIsTestComplete(false);
        setFinalStats(null);
        setShowSubmitButton(false);
    }, []);

    // Auto-complete handler.
    const completeTest = useCallback(
        (currentInput) => {
            if (!selectedChallenge || isTestComplete) return;
            const startedAt = startTime || Date.now();
            const elapsed = Math.max(1, Math.floor((Date.now() - startedAt) / 1000));
            const expected = expectedRef.current;
            const stats = computeStats(currentInput, expected, elapsed);
            setElapsedTime(elapsed);
            setWpm(stats.wpm);
            setAccuracy(stats.accuracy);
            setFinalStats(stats);
            setIsTestComplete(true);
            setShowSubmitButton(true);

            // Personal best
            const prev = personalBest;
            if (!prev || stats.score > prev.score) {
                const newPB = { score: stats.score, wpm: stats.wpm, accuracy: stats.accuracy, at: Date.now() };
                savePersonalBest(selectedChallenge.id, newPB);
                setPersonalBest(newPB);
            }
        },
        [selectedChallenge, isTestComplete, startTime, personalBest]
    );

    // Handle input changes from the hidden input.
    const handleInputChange = (e) => {
        if (isTestComplete) return;
        const value = e.target.value;
        // Start the clock on first keystroke.
        if (startTime === null && value.length > 0) {
            setStartTime(Date.now());
        }
        // Don't allow typing past the expected length.
        const expected = expectedRef.current;
        const next = value.slice(0, expected.length);
        setInput(next);
        // Auto-complete when full match.
        if (next.length === expected.length && next === expected) {
            completeTest(next);
        }
    };

    // Block destructive keys before they hit the input.
    const handleKeyDown = (e) => {
        // Block modifier shortcuts (Ctrl/Cmd/Alt + letter) — but allow shift for capitals.
        if ((e.ctrlKey || e.metaKey || e.altKey) && e.key.length === 1) {
            e.preventDefault();
            return;
        }
        // Tab: prevent focus loss. Only insert characters if the next expected char is whitespace.
        if (e.key === "Tab") {
            e.preventDefault();
            if (isTestComplete) return;
            const expected = expectedRef.current;
            const pos = input.length;
            if (pos >= expected.length) return;
            const nextChar = expected[pos];
            if (nextChar !== "\t" && nextChar !== " ") return; // no-op if blank doesn't need whitespace
            let toInsert = "";
            if (nextChar === "\t") {
                toInsert = "\t";
            } else {
                let i = pos;
                while (i < expected.length && expected[i] === " " && i - pos < 4) {
                    toInsert += " ";
                    i++;
                }
            }
            const newInput = (input + toInsert).slice(0, expected.length);
            if (startTime === null) setStartTime(Date.now());
            setInput(newInput);
            if (newInput.length === expected.length && newInput === expected) {
                completeTest(newInput);
            }
        }
    };

    // Refocus hidden input on container click.
    const focusInput = () => {
        if (hiddenInputRef.current) hiddenInputRef.current.focus();
    };

    // Manual submit (when user clicks Submit Test button).
    const handleManualSubmit = () => completeTest(input);

    // Restart the current challenge.
    const handleRestart = () => {
        resetTypingState();
        setTimeout(focusInput, 0);
    };

    // Back to challenge list.
    const handleBackToList = () => {
        setSelectedChallenge(null);
        resetTypingState();
        setView("list");
    };

    // Submit score to leaderboard (single source of truth — only this path POSTs).
    const handleSubmitScore = async () => {
        if (!finalStats) return;
        const success = await submitScore("TYPING_TESTS", {
            wpm: finalStats.wpm,
            accuracy: finalStats.accuracy,
            score: finalStats.score,
        });
        if (success) setShowSubmitButton(false);
    };

    // Load selected challenge → enter test view.
    const handleSelectChallenge = (challenge) => {
        setSelectedChallenge(challenge);
        expectedRef.current = buildExpected(challenge);
        resetTypingState();
        setPersonalBest(loadPersonalBest(challenge.id));
        setView("test");
        setTimeout(focusInput, 50);
    };

    // Timer effect
    useEffect(() => {
        if (!startTime || isTestComplete) return;
        const timer = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            setElapsedTime(elapsed);
            const expected = expectedRef.current;
            const stats = computeStats(input, expected, Math.max(1, elapsed));
            setWpm(stats.wpm);
            setAccuracy(stats.accuracy);
        }, 250);
        return () => clearInterval(timer);
    }, [startTime, isTestComplete, input]);

    // Cursor blink
    useEffect(() => {
        if (isTestComplete) return;
        const i = setInterval(() => setShowCursor((s) => !s), 500);
        return () => clearInterval(i);
    }, [isTestComplete]);

    // Render code with static parts (dimmed) and blanks (active typing slots).
    const renderTypingDisplay = () => {
        const { parts, answers } = tokenizeChallenge(selectedChallenge);
        const inputLen = input.length;

        // Determine input offset for each blank (where in `input` it starts).
        let runningOffset = 0;
        const blankRanges = answers.map((ans) => {
            const start = runningOffset;
            const end = start + ans.length;
            runningOffset = end;
            return { start, end, length: ans.length };
        });

        // Which blank is the cursor currently in?
        const activeBlankIdx = blankRanges.findIndex(
            (r) => inputLen >= r.start && inputLen < r.end
        );
        // If all blanks done, activeBlankIdx === -1 and we're past the end.

        return (
            <Box
                onClick={focusInput}
                sx={{
                    p: { xs: 2, md: 3 },
                    bgcolor: isDark ? "#0A0A14" : "#1A1A2E",
                    color: "#FFF8F0",
                    border: "2px solid",
                    borderColor: "primary.main",
                    borderRadius: 2,
                    fontFamily: '"JetBrains Mono", Menlo, Monaco, Consolas, monospace',
                    fontSize: { xs: "0.9rem", md: "1.05rem" },
                    lineHeight: 1.7,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    cursor: "text",
                    userSelect: "none",
                    minHeight: 200,
                    position: "relative",
                }}
            >
                {parts.map((part, i) => {
                    const segments = [];
                    // Static text segment — dimmed, not typed.
                    segments.push(
                        <Box key={`text-${i}`} component="span" sx={{ color: "#6B7280" }}>
                            {part}
                        </Box>
                    );
                    // Blank slot after this part (if any).
                    if (i < answers.length) {
                        const range = blankRanges[i];
                        const answer = answers[i];
                        const isActiveBlank = i === activeBlankIdx;
                        const blankDone = inputLen >= range.end;
                        const blankPending = inputLen < range.start;

                        segments.push(
                            <Box
                                key={`blank-${i}`}
                                component="span"
                                sx={{
                                    display: "inline-block",
                                    px: 0.5,
                                    mx: 0.25,
                                    borderRadius: 0.75,
                                    bgcolor: blankPending
                                        ? "rgba(255, 199, 0, 0.08)"
                                        : isActiveBlank
                                        ? "rgba(200, 69, 109, 0.18)"
                                        : "transparent",
                                    border: "1.5px solid",
                                    borderColor: blankPending
                                        ? "rgba(255, 199, 0, 0.4)"
                                        : isActiveBlank
                                        ? "#C8456D"
                                        : blankDone
                                        ? "rgba(45, 122, 58, 0.5)"
                                        : "rgba(255, 199, 0, 0.4)",
                                    position: "relative",
                                }}
                            >
                                {answer.split("").map((char, j) => {
                                    const absPos = range.start + j;
                                    const typedChar = input[absPos];
                                    const untyped = typedChar === undefined;
                                    const correct = !untyped && typedChar === char;
                                    let color, bg;
                                    let displayChar;
                                    if (untyped) {
                                        color = "#FFC700";
                                        bg = "transparent";
                                        displayChar = "_";
                                    } else if (correct) {
                                        color = "#7BE093";
                                        bg = "transparent";
                                        displayChar = typedChar === "\n" ? "↵" : typedChar === " " ? "·" : typedChar;
                                    } else {
                                        color = "#FF6B6B";
                                        bg = "rgba(255, 68, 68, 0.25)";
                                        displayChar = typedChar === "\n" ? "↵" : typedChar === " " ? "·" : typedChar || "_";
                                    }
                                    const isCursorHere = absPos === inputLen;
                                    return (
                                        <Box
                                            key={j}
                                            component="span"
                                            sx={{
                                                color,
                                                backgroundColor: bg,
                                                position: "relative",
                                                borderRadius: "2px",
                                                fontWeight: 700,
                                            }}
                                        >
                                            {isCursorHere && !isTestComplete && (
                                                <Box
                                                    component="span"
                                                    sx={{
                                                        position: "absolute",
                                                        left: -1,
                                                        top: "10%",
                                                        height: "80%",
                                                        width: "2px",
                                                        bgcolor: "#C8456D",
                                                        opacity: showCursor ? 1 : 0,
                                                    }}
                                                />
                                            )}
                                            {displayChar}
                                        </Box>
                                    );
                                })}
                            </Box>
                        );
                    }
                    return segments;
                })}
            </Box>
        );
    };

    // ─── VIEWS ─────────────────────────────────────────────────────────────────

    // Mode picker (top-level)
    const renderModePicker = () => (
        <Box
            sx={{
                display: "grid",
                gap: 3,
                gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
            }}
        >
            <Card
                onClick={() => {
                    fetchCodeChallenges();
                    setView("list");
                }}
                sx={{ cursor: "pointer", transition: "transform 200ms", "&:hover": { transform: "translate(-3px,-3px)" } }}
            >
                <CardContent sx={{ p: 3 }}>
                    <Stack spacing={2}>
                        <Box sx={{ color: "primary.main" }}><KeyboardIcon fontSize="large" /></Box>
                        <Typography variant="h5" sx={{ color: "text.primary" }}>Code Test</Typography>
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                            Type code snippets and fill in the blanks. Tracks WPM, accuracy, and personal best per challenge.
                        </Typography>
                        <Button variant="contained" color="primary" sx={{ alignSelf: "flex-start", mt: 1 }}>
                            Pick a challenge →
                        </Button>
                    </Stack>
                </CardContent>
            </Card>

            <Card
                onClick={() => navigate("/fallingtypingtest")}
                sx={{ cursor: "pointer", transition: "transform 200ms", "&:hover": { transform: "translate(-3px,-3px)" } }}
            >
                <CardContent sx={{ p: 3 }}>
                    <Stack spacing={2}>
                        <Box sx={{ color: "primary.main" }}><CloudDownloadIcon fontSize="large" /></Box>
                        <Typography variant="h5" sx={{ color: "text.primary" }}>Falling Code</Typography>
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                            Catch keywords before they hit the ground. Reflex-based with lives and time pressure.
                        </Typography>
                        <Button variant="outlined" color="primary" sx={{ alignSelf: "flex-start", mt: 1 }}>
                            Launch →
                        </Button>
                    </Stack>
                </CardContent>
            </Card>

        </Box>
    );

    // Challenge list
    const renderChallengeList = () => {
        if (loading)
            return (
                <Card>
                    <CardContent sx={{ p: 6, textAlign: "center" }}>
                        <CircularProgress color="primary" />
                        <Typography sx={{ mt: 2, color: "text.secondary" }}>Loading challenges…</Typography>
                    </CardContent>
                </Card>
            );
        if (error)
            return (
                <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
            );

        return (
            <Card>
                <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                        <Typography variant="h5" sx={{ color: "text.primary" }}>
                            Pick a <Box component="span" sx={gradientText}>challenge</Box>
                        </Typography>
                        <Button startIcon={<ArrowBackIcon />} onClick={() => setView("picker")} color="primary">
                            Modes
                        </Button>
                    </Stack>

                    {["easy", "medium", "hard"].map((level) => {
                        const filtered = challenges.filter((c) => c.difficulty === level);
                        if (filtered.length === 0) return null;
                        return (
                            <Box key={level} sx={{ mb: 3 }}>
                                <Chip
                                    label={DIFF_LABEL[level]}
                                    size="small"
                                    sx={{
                                        bgcolor: `${DIFF_COLOR[level]}22`,
                                        color: DIFF_COLOR[level],
                                        border: "1.5px solid",
                                        borderColor: DIFF_COLOR[level],
                                        fontWeight: 700,
                                        mb: 1.5,
                                    }}
                                />
                                <Stack spacing={1}>
                                    {filtered.map((c) => {
                                        const best = loadPersonalBest(c.id);
                                        return (
                                            <Box
                                                key={c.id}
                                                onClick={() => handleSelectChallenge(c)}
                                                sx={{
                                                    p: 2,
                                                    borderRadius: 2,
                                                    border: "1.5px solid",
                                                    borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
                                                    cursor: "pointer",
                                                    transition: "all 150ms",
                                                    "&:hover": {
                                                        borderColor: "primary.main",
                                                        bgcolor: "rgba(200,69,109,0.06)",
                                                        transform: "translateX(4px)",
                                                    },
                                                }}
                                            >
                                                <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                                                    <Stack direction="row" alignItems="center" spacing={2}>
                                                        <Box
                                                            sx={{
                                                                width: 32,
                                                                height: 32,
                                                                borderRadius: 1,
                                                                bgcolor: DIFF_COLOR[level],
                                                                color: "#fff",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                fontWeight: 700,
                                                                fontSize: "0.85rem",
                                                                flexShrink: 0,
                                                            }}
                                                        >
                                                            {c.id}
                                                        </Box>
                                                        <Typography sx={{ color: "text.primary", fontWeight: 600 }}>
                                                            {c.question}
                                                        </Typography>
                                                    </Stack>
                                                    {best && (
                                                        <Tooltip title={`Best: ${best.score} • ${best.wpm} WPM • ${best.accuracy}%`}>
                                                            <Chip
                                                                icon={<EmojiEventsIcon sx={{ fontSize: 14, color: "#FFC700 !important" }} />}
                                                                label={best.score}
                                                                size="small"
                                                                sx={{
                                                                    bgcolor: "rgba(255,199,0,0.15)",
                                                                    color: "warning.main",
                                                                    border: "1.5px solid",
                                                                    borderColor: "warning.main",
                                                                    fontWeight: 700,
                                                                    flexShrink: 0,
                                                                }}
                                                            />
                                                        </Tooltip>
                                                    )}
                                                </Stack>
                                            </Box>
                                        );
                                    })}
                                </Stack>
                            </Box>
                        );
                    })}
                </CardContent>
            </Card>
        );
    };

    // Active test view
    const renderTest = () => {
        const expected = expectedRef.current;
        const progressPct = expected.length > 0 ? (input.length / expected.length) * 100 : 0;
        return (
            <Stack spacing={3}>
                {/* Header row */}
                <Card>
                    <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                <Typography variant="overline" sx={{ color: "primary.main", fontWeight: 700 }}>
                                    Challenge #{selectedChallenge.id}
                                </Typography>
                                <Typography variant="h6" sx={{ color: "text.primary", mt: 0.5 }}>
                                    {selectedChallenge.question}
                                </Typography>
                            </Box>
                            <Button
                                startIcon={<ArrowBackIcon />}
                                onClick={handleBackToList}
                                color="primary"
                                variant="outlined"
                                size="small"
                            >
                                Back
                            </Button>
                        </Stack>
                    </CardContent>
                </Card>

                {/* Stats bar */}
                <Box
                    sx={{
                        display: "grid",
                        gap: 2,
                        gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
                    }}
                >
                    {[
                        { label: "Time", value: `${String(elapsedTime).padStart(2, "0")}s`, color: "#C8456D" },
                        { label: "WPM", value: wpm, color: "#FFC700" },
                        { label: "Accuracy", value: `${accuracy}%`, color: "#E78AAC" },
                        {
                            label: "Best",
                            value: personalBest ? personalBest.score : "—",
                            color: "#9B2E54",
                        },
                    ].map((s) => (
                        <Card key={s.label}>
                            <CardContent sx={{ p: 2, textAlign: "center" }}>
                                <Typography variant="overline" sx={{ color: "text.secondary", fontWeight: 700 }}>
                                    {s.label}
                                </Typography>
                                <Typography variant="h4" sx={{ color: s.color, lineHeight: 1, mt: 0.5 }}>
                                    {s.value}
                                </Typography>
                            </CardContent>
                        </Card>
                    ))}
                </Box>

                {/* Progress bar */}
                <Box>
                    <LinearProgress
                        variant="determinate"
                        value={progressPct}
                        sx={{
                            height: 8,
                            borderRadius: 999,
                            bgcolor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
                            "& .MuiLinearProgress-bar": {
                                background: "linear-gradient(90deg, #C8456D 0%, #FFC700 100%)",
                                borderRadius: 999,
                            },
                        }}
                    />
                </Box>

                {/* Typing display */}
                {renderTypingDisplay()}

                {/* Hidden textarea for keyboard capture — textarea so Enter inserts \n.
                    Works on mobile + desktop (soft keyboard pops automatically when focused). */}
                <textarea
                    ref={hiddenInputRef}
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck={false}
                    aria-label="Typing input"
                    style={{
                        position: "absolute",
                        opacity: 0,
                        pointerEvents: "none",
                        width: 1,
                        height: 1,
                        border: 0,
                        padding: 0,
                        resize: "none",
                    }}
                />

                {/* Action row */}
                {!isTestComplete && (
                    <Stack direction="row" spacing={2} justifyContent="center">
                        <Button
                            variant="outlined"
                            color="primary"
                            startIcon={<RestartAltIcon />}
                            onClick={handleRestart}
                        >
                            Restart
                        </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<CheckCircleIcon />}
                            onClick={handleManualSubmit}
                        >
                            Submit Test
                        </Button>
                    </Stack>
                )}

                {/* Completion banner */}
                {isTestComplete && finalStats && renderCompletion()}
            </Stack>
        );
    };

    const renderCompletion = () => {
        const stars = finalStats.score >= 90 ? 3 : finalStats.score >= 70 ? 2 : 1;
        const isNewBest = personalBest && finalStats.score === personalBest.score && personalBest.at >= Date.now() - 5000;
        return (
            <Card>
                <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                    <Stack spacing={3} alignItems="center" textAlign="center">
                        <Typography variant="h2" sx={{ color: "warning.main", fontSize: { xs: "2.5rem", md: "3.5rem" }, letterSpacing: 8 }}>
                            {"★".repeat(stars)}{"☆".repeat(3 - stars)}
                        </Typography>
                        <Typography variant="h4" sx={{ color: "text.primary" }}>
                            {finalStats.score >= 90 ? (
                                <>Out<Box component="span" sx={gradientText}>standing!</Box></>
                            ) : finalStats.score >= 70 ? (
                                <>Nice <Box component="span" sx={gradientText}>work!</Box></>
                            ) : (
                                <>Keep <Box component="span" sx={gradientText}>practicing!</Box></>
                            )}
                        </Typography>

                        {isNewBest && (
                            <Chip
                                icon={<EmojiEventsIcon sx={{ color: "#FFC700 !important" }} />}
                                label="NEW PERSONAL BEST"
                                sx={{
                                    bgcolor: "rgba(255,199,0,0.15)",
                                    color: "warning.main",
                                    border: "1.5px solid",
                                    borderColor: "warning.main",
                                    fontWeight: 700,
                                }}
                            />
                        )}

                        <Box sx={{ width: "100%" }}>
                            <Divider sx={{ mb: 2 }} />
                            <Box
                                sx={{
                                    display: "grid",
                                    gap: 2,
                                    gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(5, 1fr)" },
                                }}
                            >
                                {[
                                    { label: "Score", value: finalStats.score, color: "#C8456D" },
                                    { label: "WPM", value: finalStats.wpm, color: "#FFC700" },
                                    { label: "Accuracy", value: `${finalStats.accuracy}%`, color: "#E78AAC" },
                                    { label: "Errors", value: finalStats.errors, color: "#9B2E54" },
                                    { label: "Time", value: `${elapsedTime}s`, color: "#7C2D54" },
                                ].map((s) => (
                                    <Box key={s.label} sx={{ textAlign: "center" }}>
                                        <Typography variant="overline" sx={{ color: "text.secondary", fontWeight: 700 }}>
                                            {s.label}
                                        </Typography>
                                        <Typography variant="h4" sx={{ color: s.color, lineHeight: 1, mt: 0.5 }}>
                                            {s.value}
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        </Box>

                        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ width: "100%", justifyContent: "center" }}>
                            {showSubmitButton && (
                                <Button
                                    variant="contained"
                                    color="primary"
                                    size="large"
                                    onClick={handleSubmitScore}
                                    disabled={isSubmitting}
                                    startIcon={
                                        isSubmitting ? <CircularProgress size={18} color="inherit" /> : <EmojiEventsIcon />
                                    }
                                >
                                    {isSubmitting ? "Submitting…" : "Submit to Leaderboard"}
                                </Button>
                            )}
                            <Button variant="outlined" color="primary" size="large" onClick={handleRestart} startIcon={<RestartAltIcon />}>
                                Try Again
                            </Button>
                            <Button variant="text" color="primary" size="large" onClick={handleBackToList}>
                                Pick another
                            </Button>
                        </Stack>
                    </Stack>
                </CardContent>
            </Card>
        );
    };

    return (
        <Box sx={{ bgcolor: "background.default", minHeight: "100vh", position: "relative", overflow: "hidden" }}>
            {/* Ambient blobs */}
            <Box
                sx={{
                    position: "absolute",
                    top: -160,
                    right: -160,
                    width: 420,
                    height: 420,
                    borderRadius: "50%",
                    background: "radial-gradient(circle, #C8456D 0%, transparent 70%)",
                    opacity: isDark ? 0.22 : 0.14,
                    filter: "blur(28px)",
                    pointerEvents: "none",
                }}
            />
            <Box
                sx={{
                    position: "absolute",
                    bottom: -200,
                    left: -200,
                    width: 480,
                    height: 480,
                    borderRadius: "50%",
                    background: "radial-gradient(circle, #FFC700 0%, transparent 70%)",
                    opacity: isDark ? 0.16 : 0.10,
                    filter: "blur(32px)",
                    pointerEvents: "none",
                }}
            />

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={5000}
                onClose={() => setSnackbarOpen(false)}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert onClose={() => setSnackbarOpen(false)} severity={submitSuccess ? "success" : "error"} sx={{ width: "100%" }}>
                    {submitMessage}
                </Alert>
            </Snackbar>

            <Box sx={{ position: "relative", zIndex: 1, maxWidth: 1100, mx: "auto", px: { xs: 2, md: 4 }, py: { xs: 4, md: 6 } }}>
                <Stack spacing={3} sx={{ mb: 4 }}>
                    <Typography variant="overline" sx={{ color: "primary.main", fontWeight: 700, letterSpacing: 2 }}>
                        Typing Test
                    </Typography>
                    <Typography variant="h3" sx={{ color: "text.primary" }}>
                        Sharpen your <Box component="span" sx={gradientText}>syntax</Box>
                    </Typography>
                </Stack>

                {view === "picker" && renderModePicker()}
                {view === "list" && renderChallengeList()}
                {view === "test" && selectedChallenge && renderTest()}
            </Box>
        </Box>
    );
};

export default TypingTest;
