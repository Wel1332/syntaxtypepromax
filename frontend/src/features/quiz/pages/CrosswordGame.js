import React, { useEffect, useState, useCallback } from "react";
import { useScoreSubmission } from "../../../shared/hooks/useScoreSubmission";
 
// Grid Dimensions and Constants
const ROWS = 15;
const COLS = 15;
const NUM_WORDS = 10; // New constant to enforce 10 words
const MAX_RETRIES = 50; // Safety limit for puzzle generation retries
 
// Sample Dictionary for the puzzle
const SAMPLE_DICTIONARY = [
  { word: "syntax", clue: "The rules that define the structure of code" },
  { word: "worm", clue: "A self-replicating computer program" },
  { word: "data", clue: "Information processed or stored by a computer" },
  { word: "variable", clue: "A container for storing data values" },
  { word: "tree", clue: "A hierarchical data structure" },
  { word: "loop", clue: "A structure that repeats a block of code" },
  { word: "structure", clue: "A user-defined data type that groups variables of different types" },
  { word: "header", clue: "A file containing declarations and macros, included using #include" },
  { word: "code", clue: "Instructions written for a computer" },
  { word: "operator", clue: "A symbol that performs an operation on variables or values" },
  { word: "grid", clue: "A structure of rows and columns" },
  { word: "constant", clue: "A value that cannot be changed during program execution" },
  { word: "debugging", clue: "The process of finding and fixing errors in code" },
  { word: "overflow", clue: "An error caused when a value exceeds memory limits of its type" },
  { word: "virus", clue: "Malicious software that replicates itself" },
  { word: "recursion", clue: "A function that calls itself" },
  { word: "parameter", clue: "A variable used to receive values passed to a function" },
  { word: "semicolon", clue: "A symbol used to terminate statements in C" },
  { word: "sizeof", clue: "An operator that returns the size of a data type or variable" },
  { word: "buffer", clue: "Temporary storage used for data transfer" },
  { word: "scope", clue: "The region of the program where a variable can be accessed" },
  { word: "logic", clue: "Reasoning or principles of correct thinking" },
  { word: "bug", clue: "An error or flaw in a program" },
  { word: "debug", clue: "To identify and remove errors in code" },
  { word: "class", clue: "A blueprint for creating objects" },
  { word: "array", clue: "A data structure that holds elements in sequence" },
  { word: "stack", clue: "LIFO data structure" },
  { word: "queue", clue: "FIFO data structure" },
  { word: "index", clue: "A numerical position in an array" },
  { word: "case", clue: "A label used inside a switch statement" },
  { word: "forloop", clue: "A looping structure with initialization, condition, and update expressions" },
  { word: "whileloop", clue: "A loop that repeats as long as its condition is true" },
  { word: "dowhileloop", clue: "A loop that executes once before checking the condition" },
  { word: "switch", clue: "A multi-way branching syntax using case labels" },
  { word: "printf", clue: "Syntax for printing formatted text" },
  { word: "scanf", clue: "Syntax for reading input from stdin using format specifiers" },
  { word: "void", clue: "A function that does not return a value" },
  { word: "return", clue: "Syntax used to return data from a function" },
  { word: "typedef", clue: " is a keyword used to create an alias (a new name) for an existing data type" },
  { word: "struct", clue: "Syntax used to define a structure using struct keyword" },
  { word: "macro", clue: "Using #define to define constant values or code fragments" },
];
 
// --- Helper Functions ---
 
/** Creates an empty grid filled with the black-cell marker '#' */
function makeFilledGrid(char = "#") {
  return Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => char)
  );
}
 
/** Selects a random subset of words for the puzzle */
function getRandomWords(n) {
  const shuffled = [...SAMPLE_DICTIONARY].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}
 
/** * Checks if a word can be placed at a specific location and direction.
 * Includes boundary collision checks for a cleaner crossword pattern.
 */
function canPlaceWord(grid, word, row, col, dir, isFirstWord = false) {
  const len = word.length;
  const dr = dir === "DOWN" ? 1 : 0;
  const dc = dir === "ACROSS" ? 1 : 0;
 
  let intersections = 0;
 
  for (let i = 0; i < len; i++) {
    const r = row + dr * i;
    const c = col + dc * i;
 
    // 1. Out of bounds check
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return false;
 
    const cell = grid[r][c];
 
    // 2. Letter collision check (must be empty or match the intersecting letter)
    if (cell !== "#" && cell !== word[i]) return false;
   
    // 3. Count intersections
    if (cell === word[i]) {
        intersections++;
    }
 
    // 4. Parallel word check (only applies to non-intersecting letters in the new word)
    if (cell === "#" || cell !== word[i]) {
        if (dir === "ACROSS") {
            // Check up/down neighbors for parallel collision
            if (r > 0 && grid[r - 1][c] !== "#") return false;
            if (r < ROWS - 1 && grid[r + 1][c] !== "#") return false;
        } else { // DOWN
            // Check left/right neighbors for parallel collision
            if (c > 0 && grid[r][c - 1] !== "#") return false;
            if (c < COLS - 1 && grid[r][c + 1] !== "#") return false;
        }
    }
  }
 
  // 5. Boundary collision check (cells immediately before/after the word must be empty)
  // Check cell before the start
  const rStartCheck = row - dr;
  const cStartCheck = col - dc;
  if (rStartCheck >= 0 && rStartCheck < ROWS && cStartCheck >= 0 && cStartCheck < COLS && grid[rStartCheck][cStartCheck] !== "#") return false;
 
  // Check cell after the end
  const rEndCheck = row + dr * len;
  const cEndCheck = col + dc * len;
  if (rEndCheck >= 0 && rEndCheck < ROWS && cEndCheck >= 0 && cEndCheck < COLS && grid[rEndCheck][cEndCheck] !== "#") return false;
 
  // 6. Intersection requirement: for all words after the first, it must intersect at least once.
  if (!isFirstWord && intersections === 0) return false;
 
  return true;
}
 
/** Generates the crossword grid and placement data */
function buildCrossword(words) {
  const grid = makeFilledGrid("#");
  const placements = [];
  const numberMap = {}; // maps "r,c" -> number
  let nextNumber = 1;
 
  function assignNumber(r, c) {
    const key = `${r},${c}`;
    if (!numberMap[key]) {
      numberMap[key] = nextNumber++;
    }
    // Returns the existing number or the newly assigned one.
    return numberMap[key];
  }
 
  // 1. Place the first word ACROSS, centered
  const first = words[0];
  const midRow = Math.floor(ROWS / 2);
  const startCol = Math.floor((COLS - first.word.length) / 2);
  const firstWordUpper = first.word.toUpperCase();
 
  if (canPlaceWord(grid, firstWordUpper, midRow, startCol, "ACROSS", true)) {
    for (let i = 0; i < firstWordUpper.length; i++) {
      grid[midRow][startCol + i] = firstWordUpper[i];
    }
    placements.push({
      ...first,
      word: firstWordUpper, // Store uppercase word in placement
      row: midRow,
      col: startCol,
      dir: "ACROSS",
      number: assignNumber(midRow, startCol) // Assign number for the first word
    });
  } else {
      // If the very first word can't be placed (too long for grid), return empty.
      return { grid: makeFilledGrid("#"), placements: [] };
  }
 
  // 2. Place remaining words by intersection only
  for (let i = 1; i < words.length; i++) {
    const wordObj = words[i];
    const word = wordObj.word.toUpperCase();
    let bestPlacement = null;
 
    // Iterate through every already placed word (p)
    for (const p of placements) {
      const placedWord = p.word.toUpperCase();
     
      // Iterate through every letter index of the placed word (a)
      for (let a = 0; a < placedWord.length; a++) {
        // Iterate through every letter index of the new word (b)
        for (let b = 0; b < word.length; b++) {
          if (placedWord[a] === word[b]) {
            // Potential intersection found!
           
            const newDir = p.dir === "ACROSS" ? "DOWN" : "ACROSS";
           
            // Calculate the starting row/col for the new word
            const newRow = newDir === "DOWN" ? p.row - b : p.row + (p.dir === "DOWN" ? a : 0);
            const newCol = newDir === "ACROSS" ? p.col - b : p.col + (p.dir === "ACROSS" ? a : 0);
           
            if (canPlaceWord(grid, word, newRow, newCol, newDir)) {
              // We found a valid place, use it.
              bestPlacement = { word: wordObj, row: newRow, col: newCol, dir: newDir };
              break;
            }
          }
        }
        if (bestPlacement) break;
      }
      if (bestPlacement) break;
    }
 
    // Apply the placement if found
    if (bestPlacement) {
      const { word: wordObj, row, col, dir } = bestPlacement;
      const wordStr = wordObj.word.toUpperCase();
     
      for (let k = 0; k < wordStr.length; k++) {
        const r = row + (dir === "DOWN" ? k : 0);
        const c = col + (dir === "ACROSS" ? k : 0);
        grid[r][c] = wordStr[k];
      }
     
      // CRITICAL: Assign number. If a word already starts at (row, col), it returns the existing number.
      const number = assignNumber(row, col);
      placements.push({ ...wordObj, word: wordStr, row, col, dir, number });
    }
  }
 
  return { grid, placements };
}
 
/** Function to consistently generate a puzzle with NUM_WORDS */
function generatePuzzle() {
  let attempts = 0;
  let result = { grid: makeFilledGrid("#"), placements: [] };
 
  while (result.placements.length < NUM_WORDS && attempts < MAX_RETRIES) {
    const words = getRandomWords(NUM_WORDS);
    result = buildCrossword(words);
    attempts++;
    if (attempts === MAX_RETRIES) {
        console.warn(`Could only place ${result.placements.length} words after ${MAX_RETRIES} attempts.`);
    }
  }
  return result;
}
 
// create an answers grid consistent with the puzzle grid
function makeEmptyAnswersFromGrid(grid) {
  return grid.map(row => row.map(cell => (cell === "#" ? null : "")));
}
 
// create locked grid (null for black, false for playable, true for correct)
function makeLockedFromGrid(grid) {
  return grid.map(row => row.map(cell => (cell === "#" ? null : false)));
}
 
// find a placement (word) that contains the cell r,c
function findPlacementForCell(placements, r, c) {
  return placements.find(p => {
    if (p.dir === "ACROSS") {
      return r === p.row && c >= p.col && c < p.col + p.word.length;
    } else {
      return c === p.col && r >= p.row && r < p.row + p.word.length;
    }
  });
}
 
// --- Main component
const CrosswordGame = () => {
  // Use generatePuzzle for initial state
  const [puzzle, setPuzzle] = useState(generatePuzzle);
 
  const [answers, setAnswers] = useState(() =>
    makeEmptyAnswersFromGrid(puzzle.grid)
  );
  const [locked, setLocked] = useState(() => makeLockedFromGrid(puzzle.grid));
  const [revealed, setRevealed] = useState(false);
  const [message, setMessage] = useState("");
  const [activeRow, setActiveRow] = useState(null);
  const [activeCol, setActiveCol] = useState(null);
  const { grid, placements } = puzzle;
   const [secondsElapsed, setSecondsElapsed] = useState(0);
   const [score, setScore] = useState(null);
   
   // Score submission states
   const [showSubmitButton, setShowSubmitButton] = useState(false);
   const { submitScore, isSubmitting, submitMessage, submitSuccess } = useScoreSubmission();
 
 
 
  // Timer logic
  useEffect(() => {
    if (revealed) return; // stop timer when revealed
    const timer = setInterval(() => {
      setSecondsElapsed(prev => prev + 1);
    }, 1000);
 
    return () => clearInterval(timer);
  }, [revealed]);
 
  // Function to calculate score
  function calculateScore(seconds) {
    if (seconds <= 300) return 100;
    if (seconds <= 600) return 90;
    if (seconds <= 1800) return 70;
    return 60;
  }
  useEffect(() => {
    const totalCells = grid.flat().filter(cell => cell !== "#").length;
    const lockedCells = locked.flat().filter(cell => cell === true).length;
    if (lockedCells === totalCells) {
      const finalScore = calculateScore(secondsElapsed);
      setScore(finalScore);
      setMessage(`🎉 Puzzle completed! Score: ${finalScore}`);
      setShowSubmitButton(true);
    }
  }, [locked, grid, secondsElapsed]);
  // Reset state when puzzle changes
  useEffect(() => {
    setAnswers(makeEmptyAnswersFromGrid(grid));
    setLocked(makeLockedFromGrid(grid));
    setRevealed(false);
    setMessage("");
    setActiveRow(null);
    setActiveCol(null);
  }, [puzzle, grid]);
 
  // Check single word containing (r,c) using ansGrid
  const checkWordAt = useCallback((r, c, ansGrid = answers) => {
    const p = findPlacementForCell(placements, r, c);
    if (!p) return;
 
    const { row, col, dir, word } = p;
    let userWord = "";
    let isFullyFilled = true;
    let newLockedCells = [];
 
    // Construct the user's word and check for completeness
    for (let j = 0; j < word.length; j++) {
      const currentR = row + (dir === "DOWN" ? j : 0);
      const currentC = col + (dir === "ACROSS" ? j : 0);
      const ch = ansGrid[currentR][currentC];
 
      if (!ch) {
        isFullyFilled = false;
        break;
      }
      userWord += ch.toUpperCase();
      newLockedCells.push({r: currentR, c: currentC});
    }
 
    if (!isFullyFilled) return; // Only check if the word is complete
 
    if (userWord === word.toUpperCase()) {
      // Correct! Lock the cells.
      setLocked(prev => {
        const copy = prev.map(rw => rw.slice());
        newLockedCells.forEach(({r, c}) => copy[r][c] = true);
        return copy;
      });
      setMessage(`✅ Correct! Word ${p.number} completed.`);
    } else {
      // Wrong! Clear the cells (unless they are part of another locked word).
      setAnswers(prev => {
        const copy = prev.map(rw => rw.slice());
        let cleared = false;
        newLockedCells.forEach(({r, c}) => {
          if (!locked[r][c]) {
            copy[r][c] = "";
            cleared = true;
          }
        });
        if (cleared) {
          setMessage(`❌ Incorrect! Word ${p.number} cleared.`);
        }
        return copy; // FIX: Ensure the cleared copy is returned to update the state/UI.
      });
    }
  }, [locked, placements]);
 
 
  // handle single-cell change
  function handleChange(r, c, val) {
    if (locked[r][c] || revealed) return;
 
    const letter = val.toUpperCase().slice(-1);
    const next = answers.map(row => row.slice());
    next[r][c] = letter;
 
    setAnswers(next);
 
    // Check for correctness immediately if a letter is entered
    if (letter !== "") {
      checkWordAt(r, c, next);
    }
  }
 
  function revealAll() {
    setRevealed(true);
    setMessage("All answers revealed!");
  }
 
  function newPuzzle() {
    // Use generatePuzzle to ensure 10 words are generated
    setPuzzle(generatePuzzle());
  }
 
  // for UI: is cell part of active word?
  function isInActiveWord(r, c) {
    if (activeRow === null || activeCol === null) return false;
    const p = findPlacementForCell(placements, activeRow, activeCol);
    if (!p) return false;
    if (p.dir === "ACROSS") {
      return r === p.row && c >= p.col && c < p.col + p.word.length;
    } else {
      return c === p.col && r >= p.row && r < p.row + p.word.length;
    }
  }
 
 
  // Styling (using inline styles for single-file component simplicity)
  const styles = {
    container: {
      fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
      backgroundColor: "#f9fafb",
      minHeight: "100vh",
      padding: 20,
      display: "flex",
      justifyContent: "center"
    },
    gridWrap: {
      background: "transparent",
      padding: 24,
      borderRadius: 12,
      boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
      maxWidth: 900
    },
    grid: {
      display: "grid",
      gridTemplateColumns: `repeat(${COLS}, 36px)`, // Slightly larger cells
      gap: 3,
      marginTop: 20,
      justifyContent: "center",
      border: "1px solid #e5e7eb"
    },
    cellInput: {
      width: 36,
      height: 36,
      lineHeight: "36px",
      boxSizing: "border-box",
      textAlign: "center",
      border: "1px solid #e5e7eb",
      fontWeight: 700,
      fontSize: 18,
      textTransform: "uppercase",
      background: "#fff",
      outline: "none",
      padding: 0,
      userSelect: "none",
      transition: "background-color 0.1s"
    },
    black: {
      width: 36,
      height: 36,
      background: "#1f2937",
      borderRadius: 4
    },
    number: {
      position: "absolute",
      top: 2,
      left: 4,
      fontSize: 12,
      color: "#6b7280",
      fontWeight: 900
    },
    cellWrap: {
      position: "relative",
      width: 36,
      height: 36
    },
    lockedCell: {
      background: "#5fe994ff" // Light green for correct
    },
    activeHighlight: {
      background: "#eff6ff" // Light blue for active word
    },
    controls: {
      marginTop: 20,
      display: "flex",
      gap: 12,
      alignItems: "center",
      flexWrap: "wrap",
      padding: "10px 0"
    },
    btn: {
      padding: "10px 16px",
      borderRadius: 8,
      border: "none",
      cursor: "pointer",
      fontWeight: 600,
      boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
      transition: "transform 0.1s, box-shadow 0.1s",
      minWidth: 90
    }
  };
 
  return (
    <div style={styles.container}>
      <div style={styles.gridWrap}>
        <h1 style={{ margin: 0, fontSize: 28, color: "#1f2937" }}>
          🧩 C Crossword Challenge
        </h1>
        <p style={{ marginTop: 6, marginBottom: 12, color: "#4b5563" }}>
  Fill in the code-themed crossword. Words are automatically checked when completed. ({placements.length} Words Placed)
</p>
<p style={{ marginTop: 0, marginBottom: 12, color: "#6b7280" }}>
  Time: {Math.floor(secondsElapsed / 60)
    .toString()
    .padStart(2, "0")}:
  {(secondsElapsed % 60).toString().padStart(2, "0")}
</p>
        <div style={styles.grid}>
          {grid.map((rowArr, r) =>
            rowArr.map((cell, c) => {
              // black square
              if (cell === "#") {
                return <div key={`${r}-${c}`} style={styles.black} />;
              }
 
              // playable square
              const isLocked = !!locked[r][c];
              const isActive = isInActiveWord(r, c);
              const showLetter = revealed || isLocked;
              const value = showLetter ? grid[r][c] : (answers[r][c] || "");
 
              const inputStyle = {
                ...styles.cellInput,
                background: isLocked ? styles.lockedCell.background : styles.cellInput.background,
                ...(isActive && !isLocked ? styles.activeHighlight : {}),
                borderRadius: 0, // Squares
                caretColor: isLocked ? "transparent" : undefined
              };
 
              // find if this cell is start of a placement to show number
              const placementStart = placements.find(p => p.row === r && p.col === c);
 
              return (
                <div key={`${r}-${c}`} style={styles.cellWrap}>
                  {placementStart && (
                    <div style={styles.number}>{placementStart.number}</div>
                  )}
                  <input
                    style={inputStyle}
                    value={value}
                    maxLength={1}
                    disabled={isLocked || revealed}
                    onChange={(e) => handleChange(r, c, e.target.value)}
                    onFocus={() => {
                      setActiveRow(r);
                      setActiveCol(c);
                    }}
                    onKeyDown={(e) => {
                      // quick navigation with arrows
                      let nextR = r;
                      let nextC = c;
                      if (e.key === "ArrowRight") { nextC = c + 1; e.preventDefault(); }
                      else if (e.key === "ArrowLeft") { nextC = c - 1; e.preventDefault(); }
                      else if (e.key === "ArrowDown") { nextR = r + 1; e.preventDefault(); }
                      else if (e.key === "ArrowUp") { nextR = r - 1; e.preventDefault(); }
 
                      if (nextR !== r || nextC !== c) {
                        let found = false;
                        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                            const step = e.key === "ArrowRight" ? 1 : -1;
                            for (let nc = c + step; (step > 0 ? nc < COLS : nc >= 0); nc += step) {
                                if (grid[r][nc] !== "#") {
                                    const el = document.querySelector(`input[data-pos='${r}-${nc}']`);
                                    if (el) { el.focus(); found = true; break; }
                                }
                            }
                        } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                             const step = e.key === "ArrowDown" ? 1 : -1;
                             for (let nr = r + step; (step > 0 ? nr < ROWS : nr >= 0); nr += step) {
                                if (grid[nr][c] !== "#") {
                                    const el = document.querySelector(`input[data-pos='${nr}-${c}']`);
                                    if (el) { el.focus(); found = true; break; }
                                }
                            }
                        }
                      }
                    }}
                    data-pos={`${r}-${c}`}
                  />
                </div>
              );
            })
          )}
        </div>
 
        <div style={styles.controls}>
          
          <button onClick={newPuzzle} style={{ ...styles.btn, background: "#ef4444", color: "#fff" }}>
            New Puzzle
          </button>

          {/* Leaderboard Submit Button */}
          {showSubmitButton && (
            <div style={{ marginLeft: "20px" }}>
              {isSubmitting ? (
                <span style={{ color: "#666" }}>Submitting score...</span>
              ) : submitMessage ? (
                <span style={{ color: submitSuccess ? "#4caf50" : "#f44336", fontWeight: "bold" }}>
                  {submitMessage}
                </span>
              ) : (
                <button 
                  onClick={() => {
                    submitScore('CROSSWORD', { wpm: 0, accuracy: 100, score });
                    setShowSubmitButton(false);
                  }}
                  style={{
                    padding: "8px 16px",
                    fontSize: "13px",
                    cursor: "pointer",
                    borderRadius: "5px",
                    backgroundColor: "#4caf50",
                    color: "white",
                    border: "none"
                  }}
                >
                  Submit to Leaderboard
                </button>
              )}
            </div>
          )}
  
          <div style={{ marginLeft: "auto", color: "#10b981", fontWeight: 600 }}>
            {message}
          </div>
        </div>
 
        <h3 style={{ marginTop: 16, marginBottom: 8, color: "#1f2937" }}>Clues</h3>
        <div style={{ display: "flex", gap: "40px", flexWrap: "wrap", fontSize: 14 }}>
            <div>
                <h4 style={{ margin: 0, marginBottom: 5, color: "#4b5563" }}>ACROSS</h4>
                <ul style={{ paddingLeft: 20, margin: 0 }}>
                    {/* Words starting at the same cell share the same number. */}
                    {placements.filter(p => p.dir === "ACROSS").sort((a, b) => a.number - b.number).map((p, i) => (
                        <li key={i} style={{ marginBottom: 6 }}>
                            <strong>{p.number}.</strong> {p.clue}
                        </li>
                    ))}
                </ul>
            </div>
            <div>
                <h4 style={{ margin: 0, marginBottom: 5, color: "#4b5563" }}>DOWN</h4>
                <ul style={{ paddingLeft: 20, margin: 0 }}>
                    {/* Words starting at the same cell share the same number. */}
                    {placements.filter(p => p.dir === "DOWN").sort((a, b) => a.number - b.number).map((p, i) => (
                        <li key={i} style={{ marginBottom: 6 }}>
                            <strong>{p.number}.</strong> {p.clue}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
 
        <div style={{ marginTop: 20, fontSize: 13, color: "#6b7280", borderTop: "1px solid #e5e7eb", paddingTop: 10 }}>
          Tip: Use arrow keys to navigate cells quickly. The current word is highlighted in light blue.
        </div>
      </div>
    </div>
  );
}
 
export default CrosswordGame;
