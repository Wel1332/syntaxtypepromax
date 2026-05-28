import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../../../shared/api/client";
import { authFetch } from "../../../shared/api/authFetch";
import { useScoreSubmission } from "../../../shared/hooks/useScoreSubmission";
import {
    Box,
    Card,
    CardContent,
    Stack,
    Typography,
    Button,
    Chip,
    IconButton,
    CircularProgress,
    Snackbar,
    Alert,
    Tooltip,
    useTheme,
} from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import BoltIcon from "@mui/icons-material/Bolt";
import CenterFocusStrongIcon from "@mui/icons-material/CenterFocusStrong";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";

const gradientText = {
    background: "linear-gradient(90deg, #C8456D 0%, #E78AAC 50%, #FFC700 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    display: "inline-block",
};

const GAME_HEIGHT_BASE = 600; // baseline; CSS clamp scales it
const BASE_FALL_RATE = 7; // % per second at speed=1
const PB_PREFIX = "fall:best:";

// Difficulty ramp: after this fraction of the game has elapsed, full code lines
// begin to drop. The chance ramps with continued progress, so the back half of
// the round is meaningfully harder than the start.
const LINE_PHASE_START = 0.4;
const LINE_CHANCE_MAX = 0.35;
const LINE_CHANCE_GROWTH = 0.7;
// Lines are long — they fall slower so they remain catchable.
const LINE_FALL_MUL = 0.55;
// Overall fall rate scales modestly with elapsed time as a general ramp.
const DIFFICULTY_FALL_RAMP = 0.5;

// Built-in code-line pool. Used when a challenge doesn't define its own lines.
const DEFAULT_CODE_LINES = [
    'printf("Hello, World!\\n");',
    'int main(void) { return 0; }',
    'for (int i = 0; i < n; i++)',
    'if (ptr != NULL) free(ptr);',
    'scanf("%d", &num);',
    'while (count < max) count++;',
    'struct Node *head = NULL;',
    'return EXIT_SUCCESS;',
    'char buffer[256];',
    '#include <stdio.h>',
    'int *arr = malloc(n * sizeof(int));',
    'typedef struct Point Point;',
];

const loadPB = (id) => {
    try {
        const raw = localStorage.getItem(`${PB_PREFIX}${id}`);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};
const savePB = (id, stats) => {
    try {
        localStorage.setItem(`${PB_PREFIX}${id}`, JSON.stringify(stats));
    } catch {}
};

const streakMultiplier = (streak) => 1 + Math.floor(streak / 5); // 1x → 2x at 5 → 3x at 10 …
const basePointsPerWord = 10;

// Built-in default challenge so the game can be tested without picking from the list.
const DEFAULT_CHALLENGE = {
    challengeId: "__default__",
    id: "__default__",
    title: "Test Run",
    words: [
        "int", "float", "double", "char", "void", "return", "if", "else",
        "for", "while", "do", "switch", "case", "break", "continue",
        "printf", "scanf", "main", "include", "struct", "typedef",
        "const", "static", "sizeof", "malloc", "free", "NULL",
    ],
    // Bug Bash pairs: the buggy form is displayed, the student must type the fix.
    wrongWords: [
        { buggy: "pointr", correct: "pointer" },
        { buggy: "funtion", correct: "function" },
        { buggy: "paramater", correct: "parameter" },
        { buggy: "arguement", correct: "argument" },
        { buggy: "retrun", correct: "return" },
        { buggy: "pirntf", correct: "printf" },
        { buggy: "scnaf", correct: "scanf" },
        { buggy: "incldue", correct: "include" },
        { buggy: "strcut", correct: "struct" },
        { buggy: "voild", correct: "void" },
        { buggy: "flaot", correct: "float" },
        { buggy: "chra", correct: "char" },
    ],
    testTimer: 60,
    speed: 1,
    maxLives: 3,
};

const FallingTypingTest = () => {
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";
    const navigate = useNavigate();

    // Top-level view states: 'picker' | 'playing' | 'gameover'
    const [view, setView] = useState("picker");
    const [availableChallenges, setAvailableChallenges] = useState([]);
    const [challengesLoading, setChallengesLoading] = useState(true);
    const [challengesError, setChallengesError] = useState(null);
    const [selectedChallenge, setSelectedChallenge] = useState(null);
    const [personalBest, setPersonalBest] = useState(null);

    // Challenge config
    const [gameDuration, setGameDuration] = useState(60);
    const [speed, setSpeed] = useState(1);
    const [useLives, setUseLives] = useState(false);
    const [maxLives, setMaxLives] = useState(3);

    // Active game state
    const [timeLeft, setTimeLeft] = useState(60);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [streak, setStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [fallingWords, setFallingWords] = useState([]);
    const [popups, setPopups] = useState([]);
    const [currentInput, setCurrentInput] = useState("");
    const [bugPhaseAlert, setBugPhaseAlert] = useState(false);
    const [linePhaseAlert, setLinePhaseAlert] = useState(false);
    const [activeWordId, setActiveWordId] = useState(null);
    const [flash, setFlash] = useState(null); // { color, expiresAt }

    // Final stats
    const [finalStats, setFinalStats] = useState(null);
    const [showSubmitButton, setShowSubmitButton] = useState(false);

    // Refs (animation + counters)
    const fallingWordsRef = useRef([]);
    const wordIdCounter = useRef(0);
    const popupIdCounter = useRef(0);
    const lastSpawnRef = useRef(0);
    const lastFrameRef = useRef(0);
    const animationRef = useRef(null);
    const gameStartedAtRef = useRef(0);
    const pausedAccumRef = useRef(0);
    const pauseStartRef = useRef(0);
    const correctCharsRef = useRef(0);
    const totalCharsRef = useRef(0);
    const wordsCaughtRef = useRef(0);
    const wordsMissedRef = useRef(0);
    const wrongWordsTypedRef = useRef(0);
    const bugPhaseStartedRef = useRef(false);
    const linePhaseStartedRef = useRef(false);
    const linesCaughtRef = useRef(0);
    const linesMissedRef = useRef(0);
    const streakRef = useRef(0);
    const bestStreakRef = useRef(0);
    const livesRef = useRef(3);
    const useLivesRef = useRef(false);
    const isPausedRef = useRef(false);
    const wordPoolsRef = useRef({ correct: [], wrong: [] });
    const speedRef = useRef(1);
    const inputRef = useRef("");
    const hiddenInputRef = useRef(null);
    const gameOverRef = useRef(false);
    const scoreRef = useRef(0);
    const gameDurationRef = useRef(60);
    const selectedChallengeRef = useRef(null);

    // Keep refs in sync with state used by endGame.
    useEffect(() => { scoreRef.current = score; }, [score]);
    useEffect(() => { gameDurationRef.current = gameDuration; }, [gameDuration]);
    useEffect(() => { selectedChallengeRef.current = selectedChallenge; }, [selectedChallenge]);

    const { submitScore, isSubmitting, submitMessage, submitSuccess, snackbarOpen, setSnackbarOpen } =
        useScoreSubmission();

    // ─── Load challenge list ──────────────────────────────────────────────────
    useEffect(() => {
        let cancelled = false;
        const loadList = async () => {
            setChallengesLoading(true);
            setChallengesError(null);
            try {
                const res = await authFetch(`${API_BASE}/api/challenges/falling`);
                if (!res.ok) throw new Error(`status ${res.status}`);
                const data = await res.json();
                if (!cancelled) {
                    setAvailableChallenges(Array.isArray(data) ? data : []);
                }
            } catch (e) {
                if (!cancelled) setChallengesError("Couldn't load challenges from server.");
            } finally {
                if (!cancelled) setChallengesLoading(false);
            }
        };
        loadList();

        // If a challenge was set in sessionStorage (e.g., from /typingtest mode picker), pre-select it.
        let stored = null;
        try {
            stored = JSON.parse(sessionStorage.getItem("fallingChallenge"));
        } catch {}
        if (stored?.challengeId) {
            loadChallengeById(stored.challengeId);
            sessionStorage.removeItem("fallingChallenge");
        }
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadChallengeById = async (id) => {
        try {
            const res = await authFetch(`${API_BASE}/api/challenges/falling/${id}`);
            if (!res.ok) throw new Error();
            const c = await res.json();
            startChallenge(c);
        } catch (e) {
            setChallengesError("Failed to load that challenge.");
        }
    };

    // ─── Start / Reset game ───────────────────────────────────────────────────
    const startChallenge = (c) => {
        const dur = c.testTimer || c.duration || 60;
        const spd = c.speed || 1;
        const useL = !!(c.maxLives && c.maxLives > 0);
        const ml = c.maxLives || 3;

        setSelectedChallenge(c);
        setGameDuration(dur);
        setSpeed(spd);
        setUseLives(useL);
        setMaxLives(ml);
        useLivesRef.current = useL;
        speedRef.current = spd;

        const challengeLines = (c.codeLines || c.lines || [])
            .map((l) => String(l).trim())
            .filter(Boolean);
        wordPoolsRef.current = {
            correct: (c.words || []).map((w) => String(w).trim()).filter(Boolean),
            // Normalize wrong entries to { buggy, correct }. Legacy string entries
            // (from backend Challenge.wrongWords) fall back to buggy === correct so
            // the spawn keeps working until teachers can author paired fixes.
            wrong: (c.wrongWords || [])
                .map((w) => {
                    if (typeof w === "string") {
                        const s = w.trim();
                        return s ? { buggy: s, correct: s } : null;
                    }
                    if (w && w.buggy && w.correct) {
                        return { buggy: String(w.buggy).trim(), correct: String(w.correct).trim() };
                    }
                    return null;
                })
                .filter(Boolean),
            // Full lines of code that start dropping after LINE_PHASE_START of the round.
            lines: challengeLines.length > 0 ? challengeLines : DEFAULT_CODE_LINES,
        };

        setPersonalBest(loadPB(c.challengeId || c.id));
        resetGameState(dur, ml, useL);
        setView("playing");
        setTimeout(() => hiddenInputRef.current?.focus(), 50);
    };

    // Auto-start with the built-in default challenge on first mount so the
    // game is testable without going through the picker.
    useEffect(() => {
        startChallenge(DEFAULT_CHALLENGE);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const resetGameState = (dur, ml, useL) => {
        setTimeLeft(dur);
        setScore(0);
        setLives(ml);
        setStreak(0);
        setBestStreak(0);
        setIsPaused(false);
        setFallingWords([]);
        setPopups([]);
        setCurrentInput("");
        setActiveWordId(null);
        setFlash(null);
        setFinalStats(null);
        setShowSubmitButton(false);

        fallingWordsRef.current = [];
        wordIdCounter.current = 0;
        popupIdCounter.current = 0;
        lastSpawnRef.current = 0;
        lastFrameRef.current = 0;
        gameStartedAtRef.current = performance.now();
        pausedAccumRef.current = 0;
        pauseStartRef.current = 0;
        correctCharsRef.current = 0;
        totalCharsRef.current = 0;
        wordsCaughtRef.current = 0;
        wordsMissedRef.current = 0;
        wrongWordsTypedRef.current = 0;
        bugPhaseStartedRef.current = false;
        setBugPhaseAlert(false);
        linePhaseStartedRef.current = false;
        setLinePhaseAlert(false);
        linesCaughtRef.current = 0;
        linesMissedRef.current = 0;
        streakRef.current = 0;
        bestStreakRef.current = 0;
        livesRef.current = useL ? ml : Infinity;
        isPausedRef.current = false;
        inputRef.current = "";
        gameOverRef.current = false;
    };

    // ─── Game over ────────────────────────────────────────────────────────────
    const endGame = useCallback(() => {
        if (gameOverRef.current) return;
        gameOverRef.current = true;
        if (animationRef.current) cancelAnimationFrame(animationRef.current);

        const totalCorrect = wordsCaughtRef.current;
        const elapsedSec = Math.max(1, gameDurationRef.current);
        const charsTyped = totalCharsRef.current;
        const wpm = Math.round((charsTyped / 5) / (elapsedSec / 60));
        const accuracy = totalCharsRef.current > 0
            ? Math.round((correctCharsRef.current / totalCharsRef.current) * 100)
            : 100;
        const stats = {
            score: scoreRef.current,
            wpm,
            accuracy,
            wordsCaught: totalCorrect,
            wordsMissed: wordsMissedRef.current,
            wrongTyped: wrongWordsTypedRef.current,
            bestStreak: bestStreakRef.current,
            linesCaught: linesCaughtRef.current,
            linesMissed: linesMissedRef.current,
        };

        const c = selectedChallengeRef.current;
        const challengeKey = c?.challengeId || c?.id;
        if (challengeKey) {
            const prev = loadPB(challengeKey);
            if (!prev || stats.score > prev.score) {
                const newPB = { ...stats, at: Date.now() };
                savePB(challengeKey, newPB);
                setPersonalBest(newPB);
                stats.isNewBest = true;
            }
        }
        setFinalStats(stats);
        setShowSubmitButton(true);
        setView("gameover");
    }, []);

    // ─── Spawn logic ──────────────────────────────────────────────────────────
    // Bug Bash phase: bug words don't start dropping until the player has caught
    // a few correct words. The probability ramps up after the threshold so the
    // game feels progressively harder.
    const BUG_PHASE_THRESHOLD = 5;

    // Elapsed-time progress in [0, 1] — used to ramp difficulty.
    const getProgress = () => {
        const elapsed = (performance.now() - gameStartedAtRef.current - pausedAccumRef.current) / 1000;
        return Math.min(1, Math.max(0, elapsed / Math.max(1, gameDurationRef.current)));
    };

    const trySpawn = () => {
        const pools = wordPoolsRef.current;
        const totalPool = pools.correct.length + pools.wrong.length;
        if (totalPool === 0) return;

        const caught = wordsCaughtRef.current;
        const bugPhaseUnlocked = caught >= BUG_PHASE_THRESHOLD;
        const wrongChance = bugPhaseUnlocked
            ? Math.min(0.30, 0.15 + (caught - BUG_PHASE_THRESHOLD) * 0.008)
            : 0;

        // Trigger the "Bugs incoming!" warning the first time we cross the threshold.
        if (bugPhaseUnlocked && !bugPhaseStartedRef.current && pools.wrong.length > 0) {
            bugPhaseStartedRef.current = true;
            setBugPhaseAlert(true);
            setTimeout(() => setBugPhaseAlert(false), 2500);
        }

        // Line phase: as the round progresses, occasionally drop full code lines.
        // Chance starts at 0 until LINE_PHASE_START is reached, then climbs toward
        // LINE_CHANCE_MAX by the end. Only one line in the air at a time so the
        // play area never gets visually swamped.
        const progress = getProgress();
        const linesAvailable = (pools.lines || []).length > 0;
        const lineInFlight = fallingWordsRef.current.some((w) => w.isLine);
        const lineChance = (linesAvailable && progress >= LINE_PHASE_START && !lineInFlight)
            ? Math.min(LINE_CHANCE_MAX, (progress - LINE_PHASE_START) * LINE_CHANCE_GROWTH)
            : 0;

        if (linesAvailable && progress >= LINE_PHASE_START && !linePhaseStartedRef.current) {
            linePhaseStartedRef.current = true;
            setLinePhaseAlert(true);
            setTimeout(() => setLinePhaseAlert(false), 2500);
        }

        const useLine = Math.random() < lineChance;

        if (useLine) {
            const line = pools.lines[Math.floor(Math.random() * pools.lines.length)];
            // Lines are pinned to x=50% and the only thing that meaningfully clashes
            // with them is another line — that's already prevented by `lineInFlight`
            // above. We only need to ensure the very top entry row is clear so the
            // newborn line isn't drawn through an existing word's glyphs.
            const tooClose = fallingWordsRef.current.some((w) => w.y < 6 && Math.abs(w.x - 50) < 30);
            if (tooClose) return;
            const newLine = {
                id: wordIdCounter.current++,
                text: line,
                expected: line,
                x: 50,
                y: 0,
                isCorrect: true,
                isLine: true,
            };
            fallingWordsRef.current = [...fallingWordsRef.current, newLine];
            return;
        }

        const useWrong = pools.wrong.length > 0 && Math.random() < wrongChance;
        const pool = useWrong ? pools.wrong : pools.correct;
        if (pool.length === 0) return;
        const entry = pool[Math.floor(Math.random() * pool.length)];
        // For correct words: entry is a string and the student types it as shown.
        // For bug words: entry is { buggy, correct } — display the buggy form, expect the fix.
        const display = useWrong ? entry.buggy : entry;
        const expected = useWrong ? entry.correct : entry;

        // Avoid overlap: pick an x band not occupied near the top.
        let x;
        for (let attempt = 0; attempt < 6; attempt++) {
            const candidate = Math.random() * 80 + 5; // 5–85% so words don't clip
            const tooClose = fallingWordsRef.current.some(
                (w) => w.y < 18 && Math.abs(w.x - candidate) < 14
            );
            if (!tooClose) {
                x = candidate;
                break;
            }
        }
        if (x === undefined) return; // skip this spawn rather than overlap

        const newWord = {
            id: wordIdCounter.current++,
            text: display,
            expected,
            x,
            y: 0,
            isCorrect: !useWrong,
        };
        fallingWordsRef.current = [...fallingWordsRef.current, newWord];
    };

    // ─── Catch / penalize ─────────────────────────────────────────────────────
    const catchWord = (word) => {
        // Both correct words and squashed bugs award score; bugs get a bonus
        // because the player typed the FIX, not a copy. Full lines scale with
        // length so they meaningfully reward the extra typing.
        const mult = streakMultiplier(streakRef.current);
        let basePoints;
        if (word.isLine) {
            basePoints = basePointsPerWord * 3 + Math.round(word.text.length * 0.8);
        } else if (word.isCorrect) {
            basePoints = basePointsPerWord;
        } else {
            basePoints = basePointsPerWord * 2;
        }
        const points = basePoints * mult;
        setScore((s) => s + points);
        wordsCaughtRef.current += 1;
        if (word.isLine) linesCaughtRef.current += 1;
        if (!word.isCorrect) wrongWordsTypedRef.current += 1; // counts as a bug squashed
        streakRef.current += 1;
        setStreak(streakRef.current);
        if (streakRef.current > bestStreakRef.current) {
            bestStreakRef.current = streakRef.current;
            setBestStreak(bestStreakRef.current);
        }
        let popupText;
        let popupColor;
        if (word.isLine) {
            popupText = `📜 LINE CLEAR +${points}${mult > 1 ? ` ×${mult}` : ""}`;
            popupColor = "#A78BFA";
        } else if (word.isCorrect) {
            popupText = `+${points}${mult > 1 ? ` ×${mult}` : ""}`;
            popupColor = "#7BE093";
        } else {
            popupText = `🐛 SQUASHED +${points}`;
            popupColor = "#FFC700";
        }
        pushPopup({ x: word.x, y: word.y, text: popupText, color: popupColor });
        triggerFlash(word.isLine ? "#A78BFA" : word.isCorrect ? "#7BE093" : "#FFC700");
        removeWord(word.id);
    };

    const removeWord = (id) => {
        fallingWordsRef.current = fallingWordsRef.current.filter((w) => w.id !== id);
    };

    const pushPopup = ({ x, y, text, color }) => {
        const p = {
            id: popupIdCounter.current++,
            x,
            y,
            text,
            color,
            createdAt: performance.now(),
        };
        setPopups((arr) => [...arr, p]);
        setTimeout(() => {
            setPopups((arr) => arr.filter((pp) => pp.id !== p.id));
        }, 900);
    };

    const triggerFlash = (color) => {
        setFlash({ color, expiresAt: performance.now() + 250 });
    };

    // ─── Input handling ───────────────────────────────────────────────────────
    const handleInputChange = (e) => {
        if (gameOverRef.current || isPausedRef.current) return;
        const value = e.target.value;
        const prevLen = inputRef.current.length;
        inputRef.current = value;
        setCurrentInput(value);

        // Track keystrokes (added chars).
        if (value.length > prevLen) {
            const newChar = value[value.length - 1];
            totalCharsRef.current += 1;

            // Find a falling word whose EXPECTED text (what the player needs to type)
            // starts with the current input. For bug words, expected !== text — the
            // player types the fix, not the buggy form on screen.
            const match = fallingWordsRef.current.find((w) =>
                (w.expected || w.text).startsWith(value)
            );
            if (match) {
                const target = match.expected || match.text;
                const expectedChar = target[value.length - 1];
                if (newChar === expectedChar) correctCharsRef.current += 1;
                setActiveWordId(match.id);
                if (value === target) {
                    catchWord(match);
                    inputRef.current = "";
                    setCurrentInput("");
                    setActiveWordId(null);
                }
            } else {
                setActiveWordId(null);
            }
        } else if (value === "") {
            setActiveWordId(null);
        }
    };

    const handleKeyDown = (e) => {
        if ((e.ctrlKey || e.metaKey || e.altKey) && e.key.length === 1) e.preventDefault();
        if (e.key === "Tab") e.preventDefault();
        if (e.key === "Escape") {
            e.preventDefault();
            setIsPaused((p) => {
                const next = !p;
                isPausedRef.current = next;
                if (next) pauseStartRef.current = performance.now();
                else if (pauseStartRef.current) {
                    pausedAccumRef.current += performance.now() - pauseStartRef.current;
                    pauseStartRef.current = 0;
                }
                return next;
            });
        }
    };

    const togglePause = () => {
        setIsPaused((p) => {
            const next = !p;
            isPausedRef.current = next;
            if (next) pauseStartRef.current = performance.now();
            else if (pauseStartRef.current) {
                pausedAccumRef.current += performance.now() - pauseStartRef.current;
                pauseStartRef.current = 0;
            }
            return next;
        });
        hiddenInputRef.current?.focus();
    };

    const handleRestart = () => {
        if (!selectedChallenge) return;
        startChallenge(selectedChallenge);
    };

    const handleBackToPicker = () => {
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        setView("picker");
        setSelectedChallenge(null);
    };

    // ─── Animation loop ───────────────────────────────────────────────────────
    useEffect(() => {
        if (view !== "playing") return;
        lastFrameRef.current = performance.now();
        lastSpawnRef.current = performance.now();

        const loop = (now) => {
            if (gameOverRef.current) return;
            const dt = Math.min((now - lastFrameRef.current) / 1000, 0.1);
            lastFrameRef.current = now;

            if (!isPausedRef.current) {
                // Progress-based difficulty ramp: spawns get tighter and the fall
                // rate scales modestly as the round wears on.
                const progress = getProgress();
                const difficultyMul = 1 + progress * DIFFICULTY_FALL_RAMP;

                // Spawn
                const spawnIntervalMs = (1800 / speedRef.current) / difficultyMul;
                if (now - lastSpawnRef.current > spawnIntervalMs) {
                    trySpawn();
                    lastSpawnRef.current = now;
                }

                // Fall + cleanup
                const fallRate = BASE_FALL_RATE * speedRef.current * difficultyMul; // % per second
                const updated = [];
                let livesLostThisFrame = 0;
                for (const w of fallingWordsRef.current) {
                    const wordFallRate = w.isLine ? fallRate * LINE_FALL_MUL : fallRate;
                    const newY = w.y + wordFallRate * dt;
                    if (newY > 100) {
                        // Missed — words and bugs cost a life. Lines also cost a life
                        // because letting a whole line slip is a bigger deal.
                        wordsMissedRef.current += 1;
                        if (w.isLine) linesMissedRef.current += 1;
                        streakRef.current = 0;
                        if (useLivesRef.current) {
                            livesLostThisFrame += w.isLine ? 2 : 1;
                        }
                        continue;
                    }
                    updated.push({ ...w, y: newY });
                }
                fallingWordsRef.current = updated;
                setFallingWords(updated);
                if (livesLostThisFrame > 0) {
                    livesRef.current -= livesLostThisFrame;
                    setLives(livesRef.current);
                    setStreak(0);
                    triggerFlash("#FF6B6B");
                    if (livesRef.current <= 0) {
                        endGame();
                        return;
                    }
                }
            }

            animationRef.current = requestAnimationFrame(loop);
        };
        animationRef.current = requestAnimationFrame(loop);

        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [view, endGame]);

    // ─── Timer countdown (real-time, pause-aware) ────────────────────────────
    useEffect(() => {
        if (view !== "playing") return;
        const interval = setInterval(() => {
            if (gameOverRef.current) return;
            if (isPausedRef.current) return;
            const elapsedMs = performance.now() - gameStartedAtRef.current - pausedAccumRef.current;
            const remaining = Math.max(0, Math.ceil(gameDurationRef.current - elapsedMs / 1000));
            setTimeLeft(remaining);
            if (remaining <= 0) {
                endGame();
            }
        }, 200);
        return () => clearInterval(interval);
    }, [view, endGame]);

    // ─── Flash decay ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (!flash) return;
        const t = setTimeout(() => setFlash(null), 250);
        return () => clearTimeout(t);
    }, [flash]);

    // ─── Submit score ─────────────────────────────────────────────────────────
    const handleSubmitScore = async () => {
        if (!finalStats) return;
        const ok = await submitScore("FALLING_WORDS", {
            wpm: finalStats.wpm,
            accuracy: finalStats.accuracy,
            score: finalStats.score,
        });
        if (ok) setShowSubmitButton(false);
    };

    // ─── Render: word in game area ────────────────────────────────────────────
    const renderWord = (w) => {
        const isActive = w.id === activeWordId;
        const baseColor = w.isLine ? "#A78BFA" : w.isCorrect ? "#FFC700" : "#FF6B6B";
        return (
            <Box
                key={w.id}
                sx={{
                    position: "absolute",
                    left: `${w.x}%`,
                    top: `${w.y}%`,
                    transform: "translate(-50%, -50%)",
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: w.isLine
                        ? { xs: "0.85rem", md: "1rem" }
                        : { xs: "1rem", md: "1.2rem" },
                    fontWeight: w.isLine ? 700 : w.isCorrect ? 600 : 800,
                    color: baseColor,
                    textShadow: w.isLine
                        ? "0 0 14px rgba(167,139,250,0.7), 0 2px 6px rgba(0,0,0,0.7)"
                        : w.isCorrect
                            ? "0 2px 8px rgba(0,0,0,0.7)"
                            : "0 0 12px rgba(255, 107, 107, 0.8), 0 2px 6px rgba(0,0,0,0.7)",
                    whiteSpace: "nowrap",
                    pointerEvents: "none",
                    transition: "transform 80ms",
                    ...(w.isLine && {
                        bgcolor: "rgba(167,139,250,0.12)",
                        border: "1.5px dashed rgba(167,139,250,0.55)",
                        borderRadius: 1,
                        px: 1,
                        py: 0.5,
                        maxWidth: "92%",
                    }),
                    ...(isActive && {
                        bgcolor: "rgba(200,69,109,0.25)",
                        border: "2px solid #C8456D",
                        borderRadius: 1,
                        px: 0.75,
                        py: 0.25,
                    }),
                }}
            >
                {isActive
                    ? (w.expected || w.text).split("").map((ch, i) => (
                          <Box
                              component="span"
                              key={i}
                              sx={{
                                  color:
                                      currentInput[i] === ch ? "#7BE093"
                                          : currentInput[i] !== undefined ? "#FF6B6B"
                                              : baseColor,
                              }}
                          >
                              {ch}
                          </Box>
                      ))
                    : w.text}
            </Box>
        );
    };

    // ─── Render: picker view ─────────────────────────────────────────────────
    const renderPicker = () => (
        <Stack spacing={3}>
            <Card>
                <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                    <Stack spacing={2}>
                        <Box sx={{ color: "primary.main", display: "flex", alignItems: "center", gap: 1 }}>
                            <CloudDownloadIcon fontSize="large" />
                        </Box>
                        <Typography variant="h4" sx={{ color: "text.primary" }}>
                            Falling <Box component="span" sx={gradientText}>Code</Box>
                        </Typography>
                        <Typography variant="body1" sx={{ color: "text.secondary" }}>
                            Type the keywords before they hit the ground. Some words are traps — don't type those, or you'll lose a life.
                        </Typography>
                    </Stack>
                </CardContent>
            </Card>

            <Card>
                <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                    <Typography variant="h6" sx={{ color: "text.primary", mb: 2 }}>
                        Choose a challenge
                    </Typography>
                    {challengesLoading && (
                        <Box sx={{ textAlign: "center", py: 4 }}>
                            <CircularProgress color="primary" />
                        </Box>
                    )}
                    {challengesError && <Alert severity="error">{challengesError}</Alert>}
                    {!challengesLoading && !challengesError && availableChallenges.length === 0 && (
                        <Typography sx={{ color: "text.secondary", textAlign: "center", py: 4 }}>
                            No challenges available yet. Ask your teacher to create one.
                        </Typography>
                    )}
                    <Stack spacing={1}>
                        {availableChallenges.map((c) => {
                            const id = c.challengeId || c.id;
                            const pb = loadPB(id);
                            return (
                                <Box
                                    key={id}
                                    onClick={() => startChallenge(c)}
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
                                        <Box>
                                            <Typography sx={{ color: "text.primary", fontWeight: 700 }}>
                                                {c.title || c.name || `Challenge #${id}`}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                                {(c.words?.length || 0)} words · {(c.testTimer || c.duration || 60)}s · speed {c.speed || 1}×
                                                {c.maxLives ? ` · ${c.maxLives} ❤` : " · no lives"}
                                            </Typography>
                                        </Box>
                                        {pb && (
                                            <Chip
                                                icon={<EmojiEventsIcon sx={{ fontSize: 14, color: "#FFC700 !important" }} />}
                                                label={pb.score}
                                                size="small"
                                                sx={{
                                                    bgcolor: "rgba(255,199,0,0.15)",
                                                    color: "warning.main",
                                                    border: "1.5px solid",
                                                    borderColor: "warning.main",
                                                    fontWeight: 700,
                                                }}
                                            />
                                        )}
                                    </Stack>
                                </Box>
                            );
                        })}
                    </Stack>
                </CardContent>
            </Card>
        </Stack>
    );

    // ─── Render: playing view ────────────────────────────────────────────────
    const renderPlaying = () => (
        <Stack spacing={3}>
            {/* Top stat bar */}
            <Box
                sx={{
                    display: "grid",
                    gap: 2,
                    gridTemplateColumns: { xs: "repeat(3, 1fr)", md: "repeat(5, 1fr)" },
                }}
            >
                <Card>
                    <CardContent sx={{ p: 1.5, textAlign: "center" }}>
                        <Typography variant="overline" sx={{ color: "text.secondary", fontWeight: 700 }}>Time</Typography>
                        <Typography variant="h5" sx={{ color: timeLeft <= 10 ? "#FF6B6B" : "#C8456D", lineHeight: 1, mt: 0.5 }}>
                            {timeLeft}s
                        </Typography>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent sx={{ p: 1.5, textAlign: "center" }}>
                        <Typography variant="overline" sx={{ color: "text.secondary", fontWeight: 700 }}>Score</Typography>
                        <Typography variant="h5" sx={{ color: "#FFC700", lineHeight: 1, mt: 0.5 }}>{score}</Typography>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent sx={{ p: 1.5, textAlign: "center" }}>
                        <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
                            <LocalFireDepartmentIcon sx={{ color: streak > 0 ? "#FF6B35" : "text.secondary", fontSize: 18 }} />
                            <Typography variant="overline" sx={{ color: "text.secondary", fontWeight: 700 }}>Streak</Typography>
                        </Stack>
                        <Typography variant="h5" sx={{ color: streak > 0 ? "#FF6B35" : "text.primary", lineHeight: 1, mt: 0.5 }}>
                            {streak} {streakMultiplier(streak) > 1 && <Box component="span" sx={{ fontSize: "0.7em", color: "warning.main" }}>×{streakMultiplier(streak)}</Box>}
                        </Typography>
                    </CardContent>
                </Card>
                {useLives && (
                    <Card>
                        <CardContent sx={{ p: 1.5, textAlign: "center" }}>
                            <Typography variant="overline" sx={{ color: "text.secondary", fontWeight: 700 }}>Lives</Typography>
                            <Stack direction="row" justifyContent="center" spacing={0.25} sx={{ mt: 0.5 }}>
                                {Array.from({ length: maxLives }, (_, i) =>
                                    i < lives ? (
                                        <FavoriteIcon key={i} sx={{ color: "#FF6B6B", fontSize: 22 }} />
                                    ) : (
                                        <FavoriteBorderIcon key={i} sx={{ color: "text.secondary", fontSize: 22 }} />
                                    )
                                )}
                            </Stack>
                        </CardContent>
                    </Card>
                )}
                <Card sx={{ display: { xs: useLives ? "none" : "block", md: "block" } }}>
                    <CardContent sx={{ p: 1.5, textAlign: "center" }}>
                        <Typography variant="overline" sx={{ color: "text.secondary", fontWeight: 700 }}>Best</Typography>
                        <Typography variant="h5" sx={{ color: "warning.main", lineHeight: 1, mt: 0.5 }}>
                            {personalBest ? personalBest.score : "—"}
                        </Typography>
                    </CardContent>
                </Card>
            </Box>

            {/* Game area */}
            <Box
                onClick={() => hiddenInputRef.current?.focus()}
                sx={{
                    position: "relative",
                    width: "100%",
                    height: { xs: 480, md: GAME_HEIGHT_BASE },
                    overflow: "hidden",
                    borderRadius: 3,
                    border: "2px solid",
                    borderColor: "primary.main",
                    background: isDark
                        ? "radial-gradient(ellipse at top, #1A1A2E 0%, #0A0A14 100%)"
                        : "radial-gradient(ellipse at top, #2A1A3E 0%, #0F0820 100%)",
                    boxShadow: flash
                        ? `inset 0 0 60px ${flash.color}66`
                        : "inset 0 0 40px rgba(0,0,0,0.4)",
                    transition: "box-shadow 150ms",
                    cursor: "text",
                }}
            >
                {/* Decorative grid lines */}
                <Box
                    sx={{
                        position: "absolute",
                        inset: 0,
                        backgroundImage:
                            "linear-gradient(rgba(200,69,109,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,199,0,0.04) 1px, transparent 1px)",
                        backgroundSize: "32px 32px",
                        pointerEvents: "none",
                    }}
                />

                {/* Pause overlay */}
                {isPaused && (
                    <Box
                        sx={{
                            position: "absolute",
                            inset: 0,
                            bgcolor: "rgba(0,0,0,0.75)",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 10,
                            gap: 2,
                        }}
                    >
                        <Typography variant="h2" sx={{ color: "#FFC700" }}>
                            <Box component="span" sx={gradientText}>PAUSED</Box>
                        </Typography>
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                            Press Esc or click Resume to continue
                        </Typography>
                        <Button variant="contained" color="primary" startIcon={<PlayArrowIcon />} onClick={togglePause}>
                            Resume
                        </Button>
                    </Box>
                )}

                {/* Falling words */}
                {fallingWords.map(renderWord)}

                {/* Bug Bash phase activation alert */}
                {bugPhaseAlert && (
                    <Box
                        sx={{
                            position: "absolute",
                            top: "30%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            px: 4,
                            py: 2,
                            borderRadius: 2,
                            bgcolor: "rgba(239,68,68,0.92)",
                            color: "#fff",
                            fontFamily: '"Pixelify Sans", sans-serif',
                            fontSize: "2rem",
                            fontWeight: 800,
                            textAlign: "center",
                            boxShadow: "0 0 24px rgba(239,68,68,0.6)",
                            pointerEvents: "none",
                            animation: "fp-bug-warn 2500ms ease-out forwards",
                            "@keyframes fp-bug-warn": {
                                "0%": { opacity: 0, transform: "translate(-50%, -50%) scale(0.6)" },
                                "15%": { opacity: 1, transform: "translate(-50%, -50%) scale(1.1)" },
                                "30%": { transform: "translate(-50%, -50%) scale(1)" },
                                "85%": { opacity: 1 },
                                "100%": { opacity: 0 },
                            },
                            zIndex: 10,
                        }}
                    >
                        🐛 BUGS INCOMING!
                        <Box sx={{ fontSize: "0.9rem", fontWeight: 400, mt: 0.5 }}>
                            Red words are bugs — type the CORRECT syntax to squash them
                        </Box>
                    </Box>
                )}

                {/* Line phase activation alert — difficulty ramps up, full lines drop now */}
                {linePhaseAlert && (
                    <Box
                        sx={{
                            position: "absolute",
                            top: "30%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            px: 4,
                            py: 2,
                            borderRadius: 2,
                            bgcolor: "rgba(167,139,250,0.92)",
                            color: "#fff",
                            fontFamily: '"Pixelify Sans", sans-serif',
                            fontSize: "2rem",
                            fontWeight: 800,
                            textAlign: "center",
                            boxShadow: "0 0 24px rgba(167,139,250,0.6)",
                            pointerEvents: "none",
                            animation: "fp-line-warn 2500ms ease-out forwards",
                            "@keyframes fp-line-warn": {
                                "0%": { opacity: 0, transform: "translate(-50%, -50%) scale(0.6)" },
                                "15%": { opacity: 1, transform: "translate(-50%, -50%) scale(1.1)" },
                                "30%": { transform: "translate(-50%, -50%) scale(1)" },
                                "85%": { opacity: 1 },
                                "100%": { opacity: 0 },
                            },
                            zIndex: 10,
                        }}
                    >
                        📜 LINES INCOMING!
                        <Box sx={{ fontSize: "0.9rem", fontWeight: 400, mt: 0.5 }}>
                            Full lines of code now drop — type them all to clear, double life cost if missed
                        </Box>
                    </Box>
                )}

                {/* Popups */}
                {popups.map((p) => (
                    <Box
                        key={p.id}
                        sx={{
                            position: "absolute",
                            left: `${p.x}%`,
                            top: `${p.y}%`,
                            transform: "translate(-50%, -50%)",
                            color: p.color,
                            fontFamily: '"Pixelify Sans", sans-serif',
                            fontWeight: 800,
                            fontSize: "1.4rem",
                            pointerEvents: "none",
                            textShadow: "0 2px 8px rgba(0,0,0,0.8)",
                            animation: "fp-rise 900ms ease-out forwards",
                            "@keyframes fp-rise": {
                                "0%": { opacity: 1, transform: "translate(-50%, -50%) scale(1)" },
                                "100%": { opacity: 0, transform: "translate(-50%, -180%) scale(1.3)" },
                            },
                        }}
                    >
                        {p.text}
                    </Box>
                ))}
            </Box>

            {/* Hidden input */}
            <textarea
                ref={hiddenInputRef}
                value={currentInput}
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

            {/* Visible input indicator + controls */}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center" justifyContent="space-between">
                <Box
                    sx={{
                        flexGrow: 1,
                        minHeight: 48,
                        bgcolor: isDark ? "#1A1A2E" : "#FFF",
                        border: "2px solid",
                        borderColor: currentInput ? "primary.main" : isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
                        borderRadius: 2,
                        px: 2,
                        py: 1.5,
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: "1.1rem",
                        color: "text.primary",
                        width: "100%",
                    }}
                >
                    {currentInput || (
                        <Box component="span" sx={{ color: "text.secondary", fontStyle: "italic" }}>
                            Start typing…
                        </Box>
                    )}
                </Box>
                <Stack direction="row" spacing={1}>
                    <Tooltip title={isPaused ? "Resume (Esc)" : "Pause (Esc)"}>
                        <IconButton onClick={togglePause} color="primary" sx={{ border: "1.5px solid", borderColor: "primary.main" }}>
                            {isPaused ? <PlayArrowIcon /> : <PauseIcon />}
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Restart">
                        <IconButton onClick={handleRestart} color="primary" sx={{ border: "1.5px solid", borderColor: "primary.main" }}>
                            <RestartAltIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Back to picker">
                        <IconButton onClick={handleBackToPicker} sx={{ border: "1.5px solid", borderColor: "text.secondary", color: "text.secondary" }}>
                            <ArrowBackIcon />
                        </IconButton>
                    </Tooltip>
                </Stack>
            </Stack>
        </Stack>
    );

    // ─── Render: game over view ──────────────────────────────────────────────
    const renderGameOver = () => {
        if (!finalStats) return null;
        const stars = finalStats.score >= 200 ? 3 : finalStats.score >= 100 ? 2 : 1;
        return (
            <Card>
                <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                    <Stack spacing={3} alignItems="center" textAlign="center">
                        <Typography variant="h2" sx={{ color: "warning.main", fontSize: { xs: "2.5rem", md: "3.5rem" }, letterSpacing: 8 }}>
                            {"★".repeat(stars)}{"☆".repeat(3 - stars)}
                        </Typography>
                        <Typography variant="h4" sx={{ color: "text.primary" }}>
                            {finalStats.score >= 200 ? (
                                <>Out<Box component="span" sx={gradientText}>standing!</Box></>
                            ) : finalStats.score >= 100 ? (
                                <>Nice <Box component="span" sx={gradientText}>run!</Box></>
                            ) : (
                                <>Keep <Box component="span" sx={gradientText}>training!</Box></>
                            )}
                        </Typography>

                        {finalStats.isNewBest && (
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

                        <Box
                            sx={{
                                display: "grid",
                                gap: 2,
                                width: "100%",
                                gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
                            }}
                        >
                            {[
                                { label: "Score", value: finalStats.score, color: "#C8456D" },
                                { label: "WPM", value: finalStats.wpm, color: "#FFC700" },
                                { label: "Accuracy", value: `${finalStats.accuracy}%`, color: "#E78AAC" },
                                { label: "Best Streak", value: finalStats.bestStreak, color: "#FF6B35" },
                                { label: "Caught", value: finalStats.wordsCaught, color: "#7BE093" },
                                { label: "Missed", value: finalStats.wordsMissed, color: "#9B2E54" },
                                { label: "Lines Cleared", value: finalStats.linesCaught, color: "#A78BFA" },
                                { label: "Traps Hit", value: finalStats.wrongTyped, color: "#FF6B6B" },
                                { label: "Prev Best", value: personalBest?.score ?? "—", color: "#7C2D54" },
                            ].map((s) => (
                                <Box key={s.label} sx={{ textAlign: "center" }}>
                                    <Typography variant="overline" sx={{ color: "text.secondary", fontWeight: 700 }}>
                                        {s.label}
                                    </Typography>
                                    <Typography variant="h5" sx={{ color: s.color, lineHeight: 1, mt: 0.5 }}>
                                        {s.value}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>

                        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                            {showSubmitButton && (
                                <Button
                                    variant="contained"
                                    color="primary"
                                    size="large"
                                    onClick={handleSubmitScore}
                                    disabled={isSubmitting}
                                    startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : <EmojiEventsIcon />}
                                >
                                    {isSubmitting ? "Submitting…" : "Submit to Leaderboard"}
                                </Button>
                            )}
                            <Button variant="outlined" color="primary" size="large" startIcon={<RestartAltIcon />} onClick={handleRestart}>
                                Play Again
                            </Button>
                            <Button variant="text" color="primary" size="large" onClick={handleBackToPicker}>
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
                <Stack spacing={1} sx={{ mb: 4 }}>
                    <Typography variant="overline" sx={{ color: "primary.main", fontWeight: 700, letterSpacing: 2 }}>
                        Falling Code
                    </Typography>
                    <Typography variant="h3" sx={{ color: "text.primary" }}>
                        Catch the <Box component="span" sx={gradientText}>keywords</Box>
                    </Typography>
                </Stack>

                {view === "picker" && renderPicker()}
                {view === "playing" && selectedChallenge && renderPlaying()}
                {view === "gameover" && renderGameOver()}
            </Box>
        </Box>
    );
};

export default FallingTypingTest;
