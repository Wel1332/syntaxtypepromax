// Falling Code word + line banks, split for Pre-Test / Practice / Post-Test.
//
// `words` are short keywords.
// `wrongWords` are { buggy, correct } pairs for the bug-bash phase.
// `codeLines` are full C lines that drop in the back half of the round.
// `buggyLines` are { buggy, correct } pairs for full-line bugs (missing
//   semicolons, wrong operators, etc.) — they drop like code lines but
//   display in red and require the corrected syntax to clear.
// `sequenceBlocks` are arrays of 2–3 consecutive lines that must be typed
//   in execution order when they drop together as a group.
//
// Everything stays within the course's four topics: basic programming,
// conditionals, loops and functions.

// Basic C has only so many keywords, so both banks share one list. Typing a
// keyword gives nothing away; every other pool differs between the banks.
const WORDS = [
    "int", "float", "double", "char", "void", "main", "return", "printf",
    "scanf", "include", "const", "sizeof", "if", "else", "switch", "case",
    "break", "default", "for", "while", "do", "continue", "long", "short",
];

export const practiceBank = {
    words: WORDS,
    wrongWords: [
        { buggy: "pirntf", correct: "printf" },
        { buggy: "scnaf", correct: "scanf" },
        { buggy: "retrun", correct: "return" },
        { buggy: "flaot", correct: "float" },
        { buggy: "whlie", correct: "while" },
        { buggy: "swtich", correct: "switch" },
        { buggy: "esle", correct: "else" },
        { buggy: "mian", correct: "main" },
        { buggy: "incldue", correct: "include" },
        { buggy: "viod", correct: "void" },
    ],
    codeLines: [
        "int age = 15;",
        "float price = 9.5;",
        'printf("Hello!\\n");',
        'scanf("%d", &age);',
        "if (age >= 18)",
        "else if (age > 12)",
        "switch (choice)",
        "for (int i = 0; i < 5; i++)",
        "while (count > 0)",
        "sum = sum + i;",
        "void greet()",
        "return 0;",
    ],
    // Full-line bugs: display the buggy form, player must type the correct form.
    // `category` tags the error type (OBJ1 — support >=4 categories):
    //   missing-terminator | mismatched-delimiter | incorrect-keyword |
    //   malformed-declaration | wrong-operator. (wrongWords above are all the
    //   incorrect-keyword category.)
    buggyLines: [
        { buggy: "int age = 15", correct: "int age = 15;", category: "missing-terminator" },
        { buggy: 'printf("Hi")', correct: 'printf("Hi");', category: "missing-terminator" },
        { buggy: "if (age >= 18 {", correct: "if (age >= 18) {", category: "mismatched-delimiter" },
        { buggy: "void greet( {", correct: "void greet() {", category: "mismatched-delimiter" },
        { buggy: "whil (n > 0)", correct: "while (n > 0)", category: "incorrect-keyword" },
        { buggy: "int x 5;", correct: "int x = 5;", category: "malformed-declaration" },
        { buggy: "if (x = 10)", correct: "if (x == 10)", category: "wrong-operator" },
        { buggy: "sum =+ i;", correct: "sum += i;", category: "wrong-operator" },
    ],
    // Sequence blocks: 2–3 lines that must be typed in listed order.
    sequenceBlocks: [
        ["int a = 2;", "int b = 3;", 'printf("%d", a + b);'],
        ["int age;", 'scanf("%d", &age);', 'printf("%d", age);'],
        ["int n = 4;", "if (n > 0)", 'printf("positive");'],
        ["int sum = 0;", "for (int i = 1; i <= 3; i++)", "sum += i;"],
        ["int r = twice(5);", 'printf("%d", r);', "return 0;"],
    ],
};

export const testBank = {
    words: WORDS,
    wrongWords: [
        { buggy: "prinft", correct: "printf" },
        { buggy: "sacnf", correct: "scanf" },
        { buggy: "reutrn", correct: "return" },
        { buggy: "itn", correct: "int" },
        { buggy: "wihle", correct: "while" },
        { buggy: "fro", correct: "for" },
        { buggy: "defualt", correct: "default" },
        { buggy: "brake", correct: "break" },
        { buggy: "dobule", correct: "double" },
        { buggy: "contniue", correct: "continue" },
    ],
    codeLines: [
        "int score = 100;",
        "char grade = 'B';",
        'printf("Score: %d\\n", score);',
        'scanf("%f", &weight);',
        "if (score > 50)",
        "else if (score == 50)",
        "case 2: break;",
        "for (int i = 1; i <= 10; i++)",
        "while (lives > 0)",
        "total += n;",
        "int add(int a, int b)",
        "return total;",
    ],
    // Full-line bugs: display the buggy form, player must type the correct form.
    // `category` tags the error type (OBJ1 — support >=4 categories):
    //   missing-terminator | mismatched-delimiter | incorrect-keyword |
    //   malformed-declaration | wrong-operator. (wrongWords above are all the
    //   incorrect-keyword category.)
    buggyLines: [
        { buggy: "int score = 0", correct: "int score = 0;", category: "missing-terminator" },
        { buggy: 'scanf("%d", &n)', correct: 'scanf("%d", &n);', category: "missing-terminator" },
        { buggy: "while (lives > 0 {", correct: "while (lives > 0) {", category: "mismatched-delimiter" },
        { buggy: "int add(int a, int b {", correct: "int add(int a, int b) {", category: "mismatched-delimiter" },
        { buggy: "fi (score > 50)", correct: "if (score > 50)", category: "incorrect-keyword" },
        { buggy: "float price 2.5;", correct: "float price = 2.5;", category: "malformed-declaration" },
        { buggy: "if (n = 0)", correct: "if (n == 0)", category: "wrong-operator" },
        { buggy: "total =+ n;", correct: "total += n;", category: "wrong-operator" },
    ],
    // Sequence blocks: 2–3 lines that must be typed in listed order.
    sequenceBlocks: [
        ["int x = 7;", "int y = 8;", 'printf("%d", x * y);'],
        ["float w;", 'scanf("%f", &w);', 'printf("%.1f", w);'],
        ["int t = 35;", "if (t > 30)", 'printf("hot");'],
        ["int i = 0;", "while (i < 3)", "i++;"],
        ["int s = square(3);", 'printf("%d", s);', "return 0;"],
    ],
};

// Convenience: assemble a challenge-shaped object the existing game accepts.
// `mode` is one of MODE.PRE_TEST / PRACTICE / POST_TEST.
//
// `overrides` lets faculty-authored content replace individual pools without the
// caller having to rebuild the whole challenge (Objective 4.2). Any pool left
// undefined keeps its built-in bank, so a teacher who has only written new bug
// templates does not lose the word and code-line pools with them.
export const buildChallengeForMode = (mode, overrides = {}) => {
    const isPractice = mode === "PRACTICE";
    const base = isPractice ? practiceBank : testBank;
    const bank = {
        words:          overrides.words          ?? base.words,
        wrongWords:     overrides.wrongWords     ?? base.wrongWords,
        codeLines:      overrides.codeLines      ?? base.codeLines,
        buggyLines:     overrides.buggyLines     ?? base.buggyLines,
        sequenceBlocks: overrides.sequenceBlocks ?? base.sequenceBlocks,
    };
    return {
        challengeId: `__${mode.toLowerCase()}__`,
        id:          `__${mode.toLowerCase()}__`,
        title:       isPractice ? "Practice Run" : (mode === "PRE_TEST" ? "Pre-Test Run" : "Final Run"),
        words:           bank.words,
        wrongWords:      bank.wrongWords,
        codeLines:       bank.codeLines,
        buggyLines:      bank.buggyLines,
        sequenceBlocks:  bank.sequenceBlocks,
        testTimer: isPractice ? 90 : 60,
        speed:     1,
        maxLives:  isPractice ? 5 : 3,
    };
};
