// Translation Terminal prompt banks.
//
// `solution` is the canonical answer — comparison uses tokensEqual so
// formatting/whitespace variations are accepted.
//
// `topic` tags which of Objective 3.2's six syntax areas a prompt exercises:
//   declarations | control-structures | functions | pointers | structs | preprocessor
// The tag exists so coverage is checkable rather than asserted — see
// TOPICS and coverageOf() at the bottom of this file. Before tagging, the banks
// held 30 prompts between them but ~17 were declarations and structs had none,
// so the objective was met on count and failed on spread.
//
// Practice and test banks are kept disjoint so Practice doesn't leak the
// Pre-Test / Post-Test answer key. Each bank independently covers all six
// topics and holds 30 prompts, so either can carry an assessment on its own.

export const TOPICS = Object.freeze([
    "declarations",
    "control-structures",
    "functions",
    "pointers",
    "structs",
    "preprocessor",
]);

export const practiceBank = [
    // ── declarations ──────────────────────────────────────────────────────
    { id: "P-01", difficulty: "easy",   damage: 10, topic: "declarations",
      prompt: "Declare an integer named score and set it to 0.",
      solution: "int score = 0;" },
    { id: "P-03", difficulty: "easy",   damage: 10, topic: "declarations",
      prompt: "Declare a float named ratio and set it to 0.5.",
      solution: "float ratio = 0.5;" },
    { id: "P-04", difficulty: "easy",   damage: 10, topic: "declarations",
      prompt: "Declare a character named letter and set it to 'Z'.",
      solution: "char letter = 'Z';" },
    { id: "P-05", difficulty: "easy",   damage: 10, topic: "declarations",
      prompt: "Declare a double named price and set it to 9.99.",
      solution: "double price = 9.99;" },
    { id: "P-10", difficulty: "medium", damage: 15, topic: "declarations",
      prompt: "Declare a character array named name with 20 elements.",
      solution: "char name[20];" },
    { id: "P-14", difficulty: "hard",   damage: 22, topic: "declarations",
      prompt: "Declare a constant float PI equal to 3.14159.",
      solution: "const float PI = 3.14159;" },

    // ── control structures ────────────────────────────────────────────────
    { id: "P-08", difficulty: "medium", damage: 15, topic: "control-structures",
      prompt: "Write a for loop that runs i from 1 to less than or equal to 5.",
      solution: "for (int i = 1; i <= 5; i++)" },
    { id: "P-11", difficulty: "medium", damage: 15, topic: "control-structures",
      prompt: "Write a while loop that runs while count is greater than 0.",
      solution: "while (count > 0)" },
    { id: "P-22", difficulty: "easy",   damage: 10, topic: "control-structures",
      prompt: "Write an if statement that checks whether lives is equal to 0.",
      solution: "if (lives == 0)" },
    { id: "P-23", difficulty: "medium", damage: 15, topic: "control-structures",
      prompt: "Write an else if branch that checks whether hp is less than 20.",
      solution: "else if (hp < 20)" },
    { id: "P-24", difficulty: "medium", damage: 15, topic: "control-structures",
      prompt: "Write a switch statement header on the variable choice.",
      solution: "switch (choice)" },
    { id: "P-25", difficulty: "medium", damage: 15, topic: "control-structures",
      prompt: "Write a case label for the value 2 followed by a break.",
      solution: "case 2: break;" },

    // ── functions ─────────────────────────────────────────────────────────
    { id: "P-02", difficulty: "easy",   damage: 10, topic: "functions",
      prompt: 'Print the string "Hi!" followed by a newline.',
      solution: 'printf("Hi!\\n");' },
    { id: "P-07", difficulty: "medium", damage: 15, topic: "functions",
      prompt: "Read a float from input into a variable named x.",
      solution: 'scanf("%f", &x);' },
    { id: "P-09", difficulty: "medium", damage: 15, topic: "functions",
      prompt: "Print the float value temperature using %f.",
      solution: 'printf("%f", temperature);' },
    { id: "P-12", difficulty: "hard",   damage: 22, topic: "functions",
      prompt: "Write the main function signature that takes argc (int) and argv (char**).",
      solution: "int main(int argc, char **argv)" },
    { id: "P-13", difficulty: "hard",   damage: 22, topic: "functions",
      prompt: "Return 1 from a function.",
      solution: "return 1;" },

    // ── pointers ──────────────────────────────────────────────────────────
    { id: "P-15", difficulty: "hard",   damage: 22, topic: "pointers",
      prompt: "Declare an integer pointer named ptr and set it to NULL.",
      solution: "int *ptr = NULL;" },
    { id: "P-16", difficulty: "hard",   damage: 22, topic: "pointers",
      prompt: "Allocate an int array of size n using malloc and assign to pointer arr.",
      solution: "int *arr = malloc(n * sizeof(int));" },
    { id: "P-26", difficulty: "medium", damage: 15, topic: "pointers",
      prompt: "Declare a pointer to a character named cursor.",
      solution: "char *cursor;" },
    { id: "P-27", difficulty: "hard",   damage: 22, topic: "pointers",
      prompt: "Store the address of the variable total in the pointer named ptr.",
      solution: "ptr = &total;" },

    // ── structs ───────────────────────────────────────────────────────────
    { id: "P-17", difficulty: "medium", damage: 15, topic: "structs",
      prompt: "Define a struct named Point with two integer members x and y.",
      solution: "struct Point { int x; int y; };" },
    { id: "P-18", difficulty: "medium", damage: 15, topic: "structs",
      prompt: "Declare a variable named origin of type struct Point.",
      solution: "struct Point origin;" },
    { id: "P-19", difficulty: "medium", damage: 15, topic: "structs",
      prompt: "Set the x member of the struct variable origin to 5.",
      solution: "origin.x = 5;" },
    { id: "P-20", difficulty: "hard",   damage: 22, topic: "structs",
      prompt: "Assign 3 to the y member reached through the struct pointer p.",
      solution: "p->y = 3;" },
    { id: "P-21", difficulty: "hard",   damage: 22, topic: "structs",
      prompt: "Create a typedef alias named Node for struct node.",
      solution: "typedef struct node Node;" },

    // ── preprocessor ──────────────────────────────────────────────────────
    { id: "P-06", difficulty: "medium", damage: 15, topic: "preprocessor",
      prompt: "Include the standard library header.",
      solution: "#include <stdlib.h>" },
    { id: "P-28", difficulty: "easy",   damage: 10, topic: "preprocessor",
      prompt: "Define a macro named LIMIT with the value 50.",
      solution: "#define LIMIT 50" },
    { id: "P-29", difficulty: "medium", damage: 15, topic: "preprocessor",
      prompt: "Include the string handling header.",
      solution: "#include <string.h>" },
    { id: "P-30", difficulty: "hard",   damage: 22, topic: "preprocessor",
      prompt: "Begin an include guard for a header using the macro GAME_H.",
      solution: "#ifndef GAME_H" },
];

export const testBank = [
    // ── declarations ──────────────────────────────────────────────────────
    { id: "T-01", difficulty: "easy",   damage: 10, topic: "declarations",
      prompt: "Declare an integer named playerHealth and set it to 100.",
      solution: "int playerHealth = 100;" },
    { id: "T-03", difficulty: "easy",   damage: 10, topic: "declarations",
      prompt: "Declare a float named pi and set it to 3.14.",
      solution: "float pi = 3.14;" },
    { id: "T-04", difficulty: "easy",   damage: 10, topic: "declarations",
      prompt: "Declare a character variable named grade and set it to 'A'.",
      solution: "char grade = 'A';" },
    { id: "T-09", difficulty: "medium", damage: 15, topic: "declarations",
      prompt: "Declare an integer array named arr with 5 elements.",
      solution: "int arr[5];" },
    { id: "T-12", difficulty: "hard",   damage: 25, topic: "declarations",
      prompt: "Declare a constant integer MAX equal to 100.",
      solution: "const int MAX = 100;" },
    { id: "T-14", difficulty: "hard",   damage: 25, topic: "declarations",
      prompt: "Declare a typedef alias named Byte for unsigned char.",
      solution: "typedef unsigned char Byte;" },

    // ── control structures ────────────────────────────────────────────────
    { id: "T-07", difficulty: "medium", damage: 15, topic: "control-structures",
      prompt: "Write a for loop that runs i from 0 to less than 10.",
      solution: "for (int i = 0; i < 10; i++)" },
    { id: "T-20", difficulty: "easy",   damage: 10, topic: "control-structures",
      prompt: "Write an if statement that checks whether score is greater than 50.",
      solution: "if (score > 50)" },
    { id: "T-21", difficulty: "medium", damage: 15, topic: "control-structures",
      prompt: "Write an else if branch that checks whether score is equal to 0.",
      solution: "else if (score == 0)" },
    { id: "T-22", difficulty: "medium", damage: 15, topic: "control-structures",
      prompt: "Write a switch statement header on the variable option.",
      solution: "switch (option)" },
    { id: "T-23", difficulty: "medium", damage: 15, topic: "control-structures",
      prompt: "Write a default label followed by a break.",
      solution: "default: break;" },
    { id: "T-24", difficulty: "hard",   damage: 25, topic: "control-structures",
      prompt: "Write a for loop that counts j down from 10 while j is greater than 0.",
      solution: "for (int j = 10; j > 0; j--)" },

    // ── functions ─────────────────────────────────────────────────────────
    { id: "T-02", difficulty: "easy",   damage: 10, topic: "functions",
      prompt: 'Print the string "Hello, World!" followed by a newline.',
      solution: 'printf("Hello, World!\\n");' },
    { id: "T-06", difficulty: "medium", damage: 15, topic: "functions",
      prompt: "Read an integer from input into a variable named n.",
      solution: 'scanf("%d", &n);' },
    { id: "T-08", difficulty: "medium", damage: 15, topic: "functions",
      prompt: "Print the integer score using %d.",
      solution: 'printf("%d", score);' },
    { id: "T-10", difficulty: "hard",   damage: 25, topic: "functions",
      prompt: "Write the main function signature that returns int and takes no arguments.",
      solution: "int main()" },
    { id: "T-11", difficulty: "hard",   damage: 25, topic: "functions",
      prompt: "Return 0 from a function.",
      solution: "return 0;" },

    // ── pointers ──────────────────────────────────────────────────────────
    { id: "T-13", difficulty: "hard",   damage: 25, topic: "pointers",
      prompt: "Free the memory pointed to by ptr.",
      solution: "free(ptr);" },
    { id: "T-25", difficulty: "medium", damage: 15, topic: "pointers",
      prompt: "Declare a pointer to a float named rate.",
      solution: "float *rate;" },
    { id: "T-26", difficulty: "medium", damage: 15, topic: "pointers",
      prompt: "Store the address of the variable count in the pointer named p.",
      solution: "p = &count;" },
    { id: "T-27", difficulty: "hard",   damage: 25, topic: "pointers",
      prompt: "Dereference the pointer ptr and assign 7 to it.",
      solution: "*ptr = 7;" },
    { id: "T-28", difficulty: "hard",   damage: 25, topic: "pointers",
      prompt: "Allocate memory for one struct Player using malloc and assign it to the pointer hero.",
      solution: "struct Player *hero = malloc(sizeof(struct Player));" },

    // ── structs ───────────────────────────────────────────────────────────
    { id: "T-15", difficulty: "medium", damage: 15, topic: "structs",
      prompt: "Define a struct named Player with an integer member hp and a character array name of 20.",
      solution: "struct Player { int hp; char name[20]; };" },
    { id: "T-16", difficulty: "medium", damage: 15, topic: "structs",
      prompt: "Declare a variable named hero of type struct Player.",
      solution: "struct Player hero;" },
    { id: "T-17", difficulty: "medium", damage: 15, topic: "structs",
      prompt: "Set the hp member of the struct variable hero to 100.",
      solution: "hero.hp = 100;" },
    { id: "T-18", difficulty: "hard",   damage: 25, topic: "structs",
      prompt: "Assign 50 to the hp member reached through the struct pointer enemy.",
      solution: "enemy->hp = 50;" },
    { id: "T-19", difficulty: "hard",   damage: 25, topic: "structs",
      prompt: "Create a typedef alias named Item for struct item.",
      solution: "typedef struct item Item;" },

    // ── preprocessor ──────────────────────────────────────────────────────
    { id: "T-05", difficulty: "medium", damage: 15, topic: "preprocessor",
      prompt: "Include the standard input/output header.",
      solution: "#include <stdio.h>" },
    { id: "T-29", difficulty: "easy",   damage: 10, topic: "preprocessor",
      prompt: "Define a macro named MAX_PLAYERS with the value 4.",
      solution: "#define MAX_PLAYERS 4" },
    { id: "T-30", difficulty: "medium", damage: 15, topic: "preprocessor",
      prompt: "Include the math header.",
      solution: "#include <math.h>" },
];

/** Count of prompts per topic in a bank — used by the coverage test. */
export const coverageOf = (bank) =>
    TOPICS.reduce((acc, t) => ({ ...acc, [t]: bank.filter((p) => p.topic === t).length }), {});

// Default export retained for legacy callers — keeps the old (testBank-shaped)
// import working until everything is migrated to bank-aware code.
const translationPrompts = [...testBank];
export default translationPrompts;

// RPG enemies — each represents a level. HP determines how many prompts you
// need to complete to defeat them.
export const enemies = [
    { id: 1, name: "Syntax Slime",     hp: 30,  attack: 8,  emoji: "🟢", sprite: "/assets/enemies/slime-idle.png",            color: "#3ecf6a" },
    { id: 2, name: "Bracket Beast",    hp: 50,  attack: 12, emoji: "🟣", sprite: "/assets/enemies/bracket-beast-idle.png",    color: "#a855f7" },
    { id: 3, name: "Compiler Wraith",  hp: 80,  attack: 18, emoji: "👻", sprite: "/assets/enemies/compiler-wraith-idle.png",  color: "#06b6d4" },
    { id: 4, name: "Segfault Dragon",  hp: 120, attack: 25, emoji: "🐉", sprite: "/assets/enemies/segfault-dragon-idle.png",  color: "#ef4444" },
];
