// Bookworm.js — gameplay logic unchanged; UI refactored to match SyntaxType theme.
import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import RefreshIcon from "@mui/icons-material/Refresh";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import BackspaceIcon from "@mui/icons-material/Backspace";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import { useScoreSubmission } from "../../../shared/hooks/useScoreSubmission";

const ROWS = 12;
const COLS = 12;

const C_DICTIONARY = {
  pointer: "Variable that stores the address of another variable",
  array: "Collection of elements of the same type stored in contiguous memory",
  loop: "Executes a block of code repeatedly",
  function: "Reusable block of code that can be called with parameters",
  struct: "User-defined data type to group variables",
  int: "Data type for integers",
  char: "Data type for single characters",
  float: "Data type for decimal numbers",
  double: "Data type for double-precision floating point numbers",
  printf: "Function to print output to the console",
  scanf: "Function to read input from the user",
  null: "Represents a pointer that points to nothing",
  const: "Keyword for defining a value that cannot change",
  break: "Exits a loop or switch statement",
  continue: "Skips the current loop iteration",
  typedef: "Keyword to create an alias for a type",
  enum: "User-defined type with named integer constants",
  return: "Exits a function and optionally returns a value",
  main: "The entry point of a C program",
  include: "Directive to include libraries or headers",
  switch: "Multi-way branch statement",
  case: "Label within a switch statement",
  default: "Default label in a switch statement",
  if: "Executes a block of code if condition is true",
  else: "Executes a block of code if condition is false",
  while: "Loop that executes while a condition is true",
  for: "Loop with initialization, condition, and increment",
  do: "Loop that executes at least once before checking condition",
  void: "Specifies a function returns nothing",
  static: "Keyword for local persistence or limited visibility",
  extern: "Specifies a variable or function exists elsewhere",
  sizeof: "Operator to get the size of a type or variable",
  volatile: "Keyword telling compiler variable may change unexpectedly",
  register: "Suggests variable be stored in CPU register",
  goto: "Jumps to a labeled statement (generally discouraged)",
  signed: "Specifies signed integer type",
  unsigned: "Specifies unsigned integer type",
  union: "User-defined type storing different data types in same memory",
  file: "Represents a file pointer for I/O operations",
  fopen: "Function to open a file",
  fclose: "Function to close a file",
  fread: "Function to read from a file",
  fwrite: "Function to write to a file",
  malloc: "Allocates memory dynamically",
  free: "Frees dynamically allocated memory",
  realloc: "Resizes previously allocated memory",
  exit: "Terminates a program",
  assert: "Macro to test assumptions at runtime",
  getchar: "Reads a single character from stdin",
  putchar: "Writes a single character to stdout",
  strtok: "Tokenizes a string into smaller strings",
  strcmp: "Compares two strings",
  strcpy: "Copies one string to another",
  strcat: "Concatenates two strings",
  strlen: "Returns length of a string",
  errno: "Global variable for error reporting",
  stderr: "Standard error stream",
  stdin: "Standard input stream",
  stdout: "Standard output stream",
  bitwise: "Operations using &, |, ^, ~, <<, >>",
  shift: "Left or right bitwise operation",
  operator: "Symbol performing computation (+, -, *, /, etc.)",
  macro: "Preprocessor directive defining reusable code snippet",
  preprocessor: "Processor that handles directives before compilation",
};

const WORDS = Object.keys(C_DICTIONARY);
const LETTER_BAG = "eeeeeeeeaaaaaaaaooooooiiiiiinnnnssrrttlldcugmbfywkpvzxjq".split("");

const gradientText = {
  background: "linear-gradient(90deg, #C8456D 0%, #E78AAC 50%, #FFC700 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
  display: "inline-block",
};

function randLetter() {
  return LETTER_BAG[Math.floor(Math.random() * LETTER_BAG.length)].toUpperCase();
}

function makeEmptyBoard() {
  return Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => ""));
}

function getRandomWords(n = 10) {
  const shuffled = [...WORDS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(n, shuffled.length));
}

function generateRandomQuestions() {
  const shuffled = [...Object.entries(C_DICTIONARY)].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 10);
}

function makeCBoard() {
  const board = makeEmptyBoard();
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) board[r][c] = randLetter();
  }
  const wordsToPlace = getRandomWords(10).map((w) => w.toUpperCase());
  const placed = [];
  for (const word of wordsToPlace) {
    for (let attempt = 0; attempt < 60; attempt++) {
      const horizontal = Math.random() < 0.5;
      const row = Math.floor(Math.random() * ROWS);
      const col = Math.floor(Math.random() * COLS);
      if ((horizontal && col + word.length > COLS) || (!horizontal && row + word.length > ROWS)) continue;
      let conflict = false;
      for (let j = 0; j < word.length; j++) {
        const r = horizontal ? row : row + j;
        const c = horizontal ? col + j : col;
        const existing = placed.find((p) => p.r === r && p.c === c);
        if (existing && existing.letter !== word[j]) {
          conflict = true;
          break;
        }
      }
      if (conflict) continue;
      for (let j = 0; j < word.length; j++) {
        const r = horizontal ? row : row + j;
        const c = horizontal ? col + j : col;
        board[r][c] = word[j];
        placed.push({ r, c, letter: word[j] });
      }
      break;
    }
  }
  return board;
}

function deepCopyBoard(board) {
  return board.map((row) => row.slice());
}

function isAdjacent(a, b) {
  const dr = Math.abs(a.r - b.r);
  const dc = Math.abs(a.c - b.c);
  return dr <= 1 && dc <= 1 && !(dr === 0 && dc === 0);
}

function findAnyWordOnBoard(board, wordsArray) {
  const R = board.length;
  const C = board[0].length;
  const boardLetters = board.map((r) => r.map((ch) => (ch || "").toLowerCase()));
  const wordSet = new Set(wordsArray.map((w) => w.toLowerCase()));
  const prefixSet = new Set();
  for (const w of wordsArray) {
    for (let i = 1; i <= w.length; i++) prefixSet.add(w.slice(0, i).toLowerCase());
  }
  const visited = Array.from({ length: R }, () => Array(C).fill(false));
  function dfs(r, c, acc) {
    const s = acc + (boardLetters[r][c] || "");
    if (!prefixSet.has(s)) return null;
    if (wordSet.has(s)) return s;
    visited[r][c] = true;
    const dr = [-1, -1, -1, 0, 0, 1, 1, 1];
    const dc = [-1, 0, 1, -1, 1, -1, 0, 1];
    for (let k = 0; k < 8; k++) {
      const nr = r + dr[k];
      const nc = c + dc[k];
      if (nr >= 0 && nr < R && nc >= 0 && nc < C && !visited[nr][nc]) {
        const found = dfs(nr, nc, s);
        if (found) {
          visited[r][c] = false;
          return found;
        }
      }
    }
    visited[r][c] = false;
    return null;
  }
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      const found = dfs(r, c, "");
      if (found) return found;
    }
  }
  return null;
}

function applyGravityAndRefill(b) {
  const newBoard = deepCopyBoard(b);
  for (let c = 0; c < COLS; c++) {
    let write = ROWS - 1;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (newBoard[r][c]) {
        newBoard[write][c] = newBoard[r][c];
        if (write !== r) newBoard[r][c] = null;
        write--;
      }
    }
    for (let r = write; r >= 0; r--) newBoard[r][c] = randLetter();
  }
  return newBoard;
}

export default function Bookworm() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [board, setBoard] = useState(() => makeCBoard());
  const [selected, setSelected] = useState([]);
  const [currentWord, setCurrentWord] = useState("");
  const [foundWords, setFoundWords] = useState(new Set());
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info"); // info | success | error
  const [questions, setQuestions] = useState([]);

  const [showSubmitButton, setShowSubmitButton] = useState(false);
  const { submitScore, isSubmitting, submitMessage, submitSuccess } = useScoreSubmission();

  useEffect(() => {
    if (foundWords.size >= 10 || score >= 200) setShowSubmitButton(true);
  }, [foundWords, score]);

  useEffect(() => {
    setCurrentWord(selected.map((p) => board[p.r][p.c]).join(""));
  }, [selected, board]);

  useEffect(() => {
    setQuestions(generateRandomQuestions());
  }, []);

  function handleCellClick(r, c) {
    if (!board[r][c]) return;
    setSelected((prev) => {
      const idx = prev.findIndex((p) => p.r === r && p.c === c);
      if (idx !== -1) return prev.slice(0, idx + 1);
      if (prev.length === 0) return [{ r, c }];
      const last = prev[prev.length - 1];
      if (!isAdjacent(last, { r, c })) return [{ r, c }];
      return [...prev, { r, c }];
    });
    setMessage("");
  }

  function clearSelection() {
    setSelected([]);
    setMessage("");
  }

  function submitSelectionAsWord() {
    const word = selected.map((p) => board[p.r][p.c]).join("").toLowerCase();
    if (word.length < 3) {
      setMessage("Words must be at least 3 letters.");
      setMessageType("error");
      return;
    }
    if (!C_DICTIONARY[word]) {
      setMessage(`"${word.toUpperCase()}" is not a C concept.`);
      setMessageType("error");
      return;
    }
    if (foundWords.has(word)) {
      setMessage(`Already found "${word.toUpperCase()}".`);
      setMessageType("error");
      return;
    }

    const gained = word.length * word.length;
    setFoundWords((prev) => new Set(prev).add(word));
    setScore((s) => s + gained);
    setMessage(`Found "${word.toUpperCase()}" (+${gained})`);
    setMessageType("success");

    const b = deepCopyBoard(board);
    selected.forEach((p) => (b[p.r][p.c] = null));
    setBoard(applyGravityAndRefill(b));
    setSelected([]);
  }

  function scrambleBoard() {
    setBoard(makeCBoard());
    setSelected([]);
    setFoundWords(new Set());
    setScore(0);
    setMessage("Board scrambled with C programming concepts.");
    setMessageType("info");
    setQuestions(generateRandomQuestions());
  }

  function giveHint() {
    const found = findAnyWordOnBoard(board, WORDS);
    if (found) {
      setMessage(`Hint: ${C_DICTIONARY[found.toLowerCase()]}`);
      setMessageType("info");
    } else {
      setMessage("No words found — try Scramble.");
      setMessageType("info");
    }
  }

  // --- Theme tokens ---
  const PINK = "#C8456D";
  const GOLD = "#FFC700";
  const NAVY = "#1A1A2E";
  const CREAM = "#FFF8F0";
  const tileBg = isDark ? "#2A2A3F" : CREAM;
  const tileText = isDark ? CREAM : NAVY;
  const tileBorder = isDark ? "rgba(255,248,240,0.18)" : "rgba(26,26,46,0.15)";

  return (
    <Box
      sx={{
        bgcolor: "background.default",
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          top: -100,
          right: -100,
          width: 320,
          height: 320,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${PINK} 0%, transparent 70%)`,
          opacity: isDark ? 0.28 : 0.16,
          filter: "blur(24px)",
          pointerEvents: "none",
        },
        "&::after": {
          content: '""',
          position: "absolute",
          bottom: -160,
          left: -160,
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${GOLD} 0%, transparent 70%)`,
          opacity: isDark ? 0.22 : 0.14,
          filter: "blur(28px)",
          pointerEvents: "none",
        },
      }}
    >
      <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1, py: { xs: 4, md: 6 } }}>
        {/* Header */}
        <Stack spacing={1} sx={{ mb: 4, textAlign: { xs: "center", md: "left" } }}>
          <Typography variant="overline" sx={{ color: "primary.main", fontWeight: 700, letterSpacing: 2 }}>
            Word Hunt
          </Typography>
          <Stack direction="row" spacing={1.5} alignItems="center" justifyContent={{ xs: "center", md: "flex-start" }}>
            <MenuBookIcon sx={{ color: "primary.main", fontSize: 36 }} />
            <Typography variant="h3" sx={{ color: "text.primary", fontWeight: 700 }}>
              Bookworm <Box component="span" sx={gradientText}>— C Concepts</Box>
            </Typography>
          </Stack>
          <Typography variant="body2" sx={{ color: "text.secondary", maxWidth: 720 }}>
            Click adjacent letters to form C programming concepts. Submitting a word removes its tiles and gravity pulls letters down.
          </Typography>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gap: 3,
            gridTemplateColumns: { xs: "1fr", md: "1fr 340px" },
            alignItems: "flex-start",
          }}
        >
          {/* Board card */}
          <Card>
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${COLS}, 1fr)`,
                  gap: { xs: 0.6, md: 0.8 },
                  maxWidth: 560,
                  margin: "0 auto",
                }}
              >
                {/* Render row-major so rows render top→bottom (gravity already places letters at the bottom) */}
                {Array.from({ length: ROWS }).map((_, r) =>
                  Array.from({ length: COLS }).map((_, c) => {
                    const ch = board[r][c];
                    const isSel = selected.some((p) => p.r === r && p.c === c);
                    const idx = selected.findIndex((p) => p.r === r && p.c === c);
                    return (
                      <Box
                        key={`${r}-${c}`}
                        onClick={() => handleCellClick(r, c)}
                        sx={{
                          aspectRatio: "1 / 1",
                          minWidth: 0,
                          borderRadius: 1.2,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          fontFamily: '"JetBrains Mono", monospace',
                          fontSize: { xs: 13, sm: 15, md: 16 },
                          cursor: ch ? "pointer" : "default",
                          userSelect: "none",
                          position: "relative",
                          transition: "transform 120ms, box-shadow 120ms",
                          opacity: ch ? 1 : 0,
                          background: isSel
                            ? `linear-gradient(180deg, ${PINK} 0%, #A0345A 100%)`
                            : tileBg,
                          color: isSel ? CREAM : tileText,
                          border: `1.5px solid ${isSel ? PINK : tileBorder}`,
                          boxShadow: isSel
                            ? `0 4px 0 rgba(0,0,0,0.4)`
                            : isDark
                            ? "0 2px 0 rgba(0,0,0,0.4)"
                            : "0 2px 0 rgba(0,0,0,0.08)",
                          "&:hover": ch
                            ? { transform: "translateY(-2px)" }
                            : undefined,
                        }}
                      >
                        {ch}
                        {idx !== -1 && (
                          <Box
                            component="span"
                            sx={{
                              position: "absolute",
                              bottom: 2,
                              right: 4,
                              fontSize: 10,
                              color: GOLD,
                              fontWeight: 800,
                            }}
                          >
                            {idx + 1}
                          </Box>
                        )}
                      </Box>
                    );
                  })
                )}
              </Box>

              {/* Word + controls */}
              <Stack spacing={1.5} sx={{ mt: 3 }}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1.5}
                  alignItems={{ xs: "stretch", sm: "center" }}
                  justifyContent="space-between"
                >
                  <Box
                    sx={{
                      flex: 1,
                      px: 2, py: 1.2,
                      background: isDark ? "#0A0A14" : NAVY,
                      color: CREAM,
                      borderRadius: 1.5,
                      fontFamily: '"JetBrains Mono", monospace',
                      letterSpacing: 1.5,
                      border: `2px solid ${currentWord ? GOLD : "transparent"}`,
                      minHeight: 44,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <Box component="span" sx={{ opacity: 0.55, fontSize: 12, mr: 1, letterSpacing: 2 }}>
                      WORD
                    </Box>
                    <Box component="strong" sx={{ color: GOLD, fontSize: 16 }}>
                      {currentWord || "—"}
                    </Box>
                  </Box>

                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<CheckCircleIcon />}
                      onClick={submitSelectionAsWord}
                      disabled={selected.length === 0}
                      sx={{ fontWeight: 700 }}
                    >
                      Submit
                    </Button>
                    <Button
                      variant="outlined"
                      color="inherit"
                      startIcon={<BackspaceIcon />}
                      onClick={clearSelection}
                      disabled={selected.length === 0}
                    >
                      Clear
                    </Button>
                    <Button
                      variant="outlined"
                      color="warning"
                      startIcon={<LightbulbIcon />}
                      onClick={giveHint}
                    >
                      Hint
                    </Button>
                    <Tooltip title="Scramble board (resets score)">
                      <IconButton
                        onClick={scrambleBoard}
                        sx={{
                          border: "2px solid",
                          borderColor: "error.main",
                          color: "error.main",
                          borderRadius: 1.5,
                        }}
                      >
                        <RefreshIcon />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>

                {message && (
                  <Box
                    sx={{
                      px: 1.5, py: 1,
                      borderRadius: 1,
                      fontSize: 13,
                      fontFamily: '"JetBrains Mono", monospace',
                      bgcolor:
                        messageType === "success"
                          ? "rgba(76,175,80,0.12)"
                          : messageType === "error"
                          ? "rgba(244,67,54,0.12)"
                          : isDark
                          ? "rgba(255,248,240,0.06)"
                          : "rgba(26,26,46,0.05)",
                      color:
                        messageType === "success"
                          ? "success.main"
                          : messageType === "error"
                          ? "error.main"
                          : "text.secondary",
                      border: "1px solid",
                      borderColor:
                        messageType === "success"
                          ? "success.main"
                          : messageType === "error"
                          ? "error.main"
                          : "transparent",
                    }}
                  >
                    {message}
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>

          {/* Stats sidebar */}
          <Stack spacing={2.5}>
            <Card>
              <CardContent>
                <Typography variant="overline" sx={{ color: "primary.main", fontWeight: 700, letterSpacing: 2 }}>
                  Stats
                </Typography>
                <Stack direction="row" spacing={3} sx={{ mt: 1.5 }} alignItems="baseline">
                  <Box>
                    <Typography variant="caption" sx={{ color: "text.secondary", letterSpacing: 1.5 }}>
                      SCORE
                    </Typography>
                    <Typography sx={{ ...gradientText, fontSize: 28, fontWeight: 800, lineHeight: 1 }}>
                      {score}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: "text.secondary", letterSpacing: 1.5 }}>
                      FOUND
                    </Typography>
                    <Typography sx={{ color: "warning.main", fontSize: 28, fontWeight: 800, lineHeight: 1 }}>
                      {foundWords.size}
                    </Typography>
                  </Box>
                </Stack>

                <Divider sx={{ my: 2 }} />

                <Typography variant="caption" sx={{ color: "text.secondary", letterSpacing: 1.5 }}>
                  FOUND LIST
                </Typography>
                <Box sx={{ mt: 1, maxHeight: 130, overflowY: "auto" }}>
                  {foundWords.size === 0 ? (
                    <Typography variant="body2" sx={{ color: "text.secondary", fontStyle: "italic" }}>
                      No words yet
                    </Typography>
                  ) : (
                    <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap">
                      {Array.from(foundWords).map((w) => (
                        <Chip
                          key={w}
                          label={`${w.toUpperCase()} +${w.length * w.length}`}
                          size="small"
                          sx={{
                            bgcolor: "rgba(255,199,0,0.15)",
                            color: "warning.main",
                            border: "1px solid",
                            borderColor: "warning.main",
                            fontFamily: '"JetBrains Mono", monospace',
                            fontWeight: 700,
                          }}
                        />
                      ))}
                    </Stack>
                  )}
                </Box>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="overline" sx={{ color: "primary.main", fontWeight: 700, letterSpacing: 2 }}>
                  Concept Cheatsheet
                </Typography>
                <Box sx={{ mt: 1.5, maxHeight: 280, overflowY: "auto", pr: 1 }}>
                  {questions.map(([word, hint]) => (
                    <Box key={word} sx={{ mb: 1.2 }}>
                      <Box
                        component="span"
                        sx={{
                          display: "inline-block",
                          px: 1, py: 0.2,
                          mr: 1,
                          bgcolor: "rgba(200,69,109,0.12)",
                          color: "primary.main",
                          border: "1px solid",
                          borderColor: "primary.main",
                          borderRadius: 0.8,
                          fontFamily: '"JetBrains Mono", monospace',
                          fontSize: 11,
                          fontWeight: 800,
                          letterSpacing: 1,
                        }}
                      >
                        {word.toUpperCase()}
                      </Box>
                      <Typography
                        variant="body2"
                        component="span"
                        sx={{ color: "text.secondary", fontSize: 13 }}
                      >
                        {hint}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ borderStyle: "dashed", borderColor: "text.disabled" }}>
              <CardContent sx={{ py: 1.5 }}>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  Tip: Click letters in order. Clicking a non-adjacent tile starts a new selection.
                </Typography>
              </CardContent>
            </Card>

            {showSubmitButton && (
              <Card sx={{ borderColor: "warning.main", borderWidth: 2, borderStyle: "solid" }}>
                <CardContent>
                  <Stack spacing={1.5} alignItems="center" textAlign="center">
                    <EmojiEventsIcon sx={{ color: "warning.main", fontSize: 36 }} />
                    <Typography variant="h6" sx={{ ...gradientText, fontWeight: 700 }}>
                      Round Complete!
                    </Typography>
                    {isSubmitting ? (
                      <Typography variant="body2" sx={{ color: "text.secondary" }}>
                        Submitting score…
                      </Typography>
                    ) : submitMessage ? (
                      <Typography
                        variant="body2"
                        sx={{ color: submitSuccess ? "success.main" : "error.main", fontWeight: 700 }}
                      >
                        {submitMessage}
                      </Typography>
                    ) : (
                      <Button
                        variant="contained"
                        color="warning"
                        startIcon={<EmojiEventsIcon />}
                        onClick={() => {
                          submitScore("BOOKWORM", { wpm: 0, accuracy: 100, score });
                          setShowSubmitButton(false);
                        }}
                        sx={{ fontWeight: 700 }}
                      >
                        Submit to Leaderboard
                      </Button>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            )}
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
