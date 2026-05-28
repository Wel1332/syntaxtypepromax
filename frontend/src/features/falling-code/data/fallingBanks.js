// Falling Code word + line banks, split for Pre-Test / Practice / Post-Test.
//
// `words` are short keywords (single tokens). `wrongWords` are { buggy, correct }
// pairs that drop during the bug-bash phase. `codeLines` are full lines that
// start dropping in the back half of the round once the difficulty ramp kicks in.
//
// The Practice bank is broader and gentler (more keywords, easier misspellings,
// shorter code lines). The Test bank is tighter, with longer/more semantically
// loaded lines and trickier bug pairs.

export const practiceBank = {
    words: [
        "int", "float", "double", "char", "void", "return", "if", "else",
        "for", "while", "do", "switch", "case", "break", "continue",
        "printf", "scanf", "main", "include", "struct", "typedef",
        "const", "static", "sizeof", "true", "false", "long", "short",
    ],
    wrongWords: [
        { buggy: "pointr",     correct: "pointer" },
        { buggy: "funtion",    correct: "function" },
        { buggy: "paramater",  correct: "parameter" },
        { buggy: "arguement",  correct: "argument" },
        { buggy: "retrun",     correct: "return" },
        { buggy: "pirntf",     correct: "printf" },
        { buggy: "scnaf",      correct: "scanf" },
        { buggy: "incldue",    correct: "include" },
        { buggy: "strcut",     correct: "struct" },
        { buggy: "voild",      correct: "void" },
        { buggy: "flaot",      correct: "float" },
        { buggy: "chra",       correct: "char" },
    ],
    codeLines: [
        'printf("Hello!\\n");',
        'int x = 0;',
        'for (int i = 0; i < n; i++)',
        'if (x > 0) x++;',
        'scanf("%d", &n);',
        'while (i < 10) i++;',
        'int a[5];',
        'return 0;',
        'char c = \'A\';',
        '#include <stdio.h>',
    ],
};

export const testBank = {
    words: [
        "malloc", "free", "NULL", "size_t", "uint8_t", "FILE",
        "fopen", "fclose", "fprintf", "fscanf", "memcpy", "memset",
        "strcmp", "strcpy", "strlen", "atoi", "atof", "exit",
        "register", "volatile", "extern", "union", "enum",
    ],
    wrongWords: [
        { buggy: "mallc",      correct: "malloc" },
        { buggy: "freee",      correct: "free" },
        { buggy: "NUUL",       correct: "NULL" },
        { buggy: "sizeoff",    correct: "sizeof" },
        { buggy: "stcmp",      correct: "strcmp" },
        { buggy: "memcopy",    correct: "memcpy" },
        { buggy: "fpritf",     correct: "fprintf" },
        { buggy: "fclos",      correct: "fclose" },
        { buggy: "exitt",      correct: "exit" },
        { buggy: "voltile",    correct: "volatile" },
        { buggy: "exterm",     correct: "extern" },
        { buggy: "tyepdef",    correct: "typedef" },
    ],
    codeLines: [
        'int *arr = malloc(n * sizeof(int));',
        'if (ptr != NULL) free(ptr);',
        'printf("Result: %d\\n", result);',
        'for (int i = 0; i < count; i++)',
        'struct Node *head = NULL;',
        'return EXIT_SUCCESS;',
        'typedef struct Point Point;',
        'fprintf(stderr, "Error\\n");',
        'memset(buffer, 0, sizeof(buffer));',
        'while ((c = getchar()) != EOF)',
        'const char *name = "syntaxtype";',
        'int main(int argc, char **argv)',
    ],
};

// Convenience: assemble a challenge-shaped object the existing game accepts.
// `mode` is one of MODE.PRE_TEST / PRACTICE / POST_TEST.
export const buildChallengeForMode = (mode) => {
    const isPractice = mode === "PRACTICE";
    const bank = isPractice ? practiceBank : testBank;
    return {
        challengeId: `__${mode.toLowerCase()}__`,
        id: `__${mode.toLowerCase()}__`,
        title: isPractice ? "Practice Run" : (mode === "PRE_TEST" ? "Pre-Test Run" : "Final Run"),
        words: bank.words,
        wrongWords: bank.wrongWords,
        codeLines: bank.codeLines,
        // Pre/post are graded — tighter timer, lives on. Practice is more forgiving.
        testTimer: isPractice ? 90 : 60,
        speed: 1,
        maxLives: isPractice ? 5 : 3,
    };
};
