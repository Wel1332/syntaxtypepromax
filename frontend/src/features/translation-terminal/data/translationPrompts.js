// Translation Terminal prompt banks.
//
// `solution` is the canonical answer — comparison uses tokensEqual so
// formatting/whitespace variations are accepted.
//
// Practice and test banks are kept disjoint so Practice doesn't leak the
// Pre-Test / Post-Test answer key.

export const practiceBank = [
    { id: "P-01", difficulty: "easy",   damage: 10,
      prompt: "Declare an integer named score and set it to 0.",
      solution: "int score = 0;" },
    { id: "P-02", difficulty: "easy",   damage: 10,
      prompt: 'Print the string "Hi!" followed by a newline.',
      solution: 'printf("Hi!\\n");' },
    { id: "P-03", difficulty: "easy",   damage: 10,
      prompt: "Declare a float named ratio and set it to 0.5.",
      solution: "float ratio = 0.5;" },
    { id: "P-04", difficulty: "easy",   damage: 10,
      prompt: "Declare a character named letter and set it to 'Z'.",
      solution: "char letter = 'Z';" },
    { id: "P-05", difficulty: "easy",   damage: 10,
      prompt: "Declare a double named price and set it to 9.99.",
      solution: "double price = 9.99;" },
    { id: "P-06", difficulty: "medium", damage: 15,
      prompt: "Include the standard library header.",
      solution: "#include <stdlib.h>" },
    { id: "P-07", difficulty: "medium", damage: 15,
      prompt: "Read a float from input into a variable named x.",
      solution: 'scanf("%f", &x);' },
    { id: "P-08", difficulty: "medium", damage: 15,
      prompt: "Write a for loop that runs i from 1 to less than or equal to 5.",
      solution: "for (int i = 1; i <= 5; i++)" },
    { id: "P-09", difficulty: "medium", damage: 15,
      prompt: "Print the float value temperature using %f.",
      solution: 'printf("%f", temperature);' },
    { id: "P-10", difficulty: "medium", damage: 15,
      prompt: "Declare a character array named name with 20 elements.",
      solution: "char name[20];" },
    { id: "P-11", difficulty: "medium", damage: 15,
      prompt: "Write a while loop that runs while count is greater than 0.",
      solution: "while (count > 0)" },
    { id: "P-12", difficulty: "hard",   damage: 22,
      prompt: "Write the main function signature that takes argc (int) and argv (char**).",
      solution: "int main(int argc, char **argv)" },
    { id: "P-13", difficulty: "hard",   damage: 22,
      prompt: "Return 1 from a function.",
      solution: "return 1;" },
    { id: "P-14", difficulty: "hard",   damage: 22,
      prompt: "Declare a constant float PI equal to 3.14159.",
      solution: "const float PI = 3.14159;" },
    { id: "P-15", difficulty: "hard",   damage: 22,
      prompt: "Declare an integer pointer named ptr and set it to NULL.",
      solution: "int *ptr = NULL;" },
    { id: "P-16", difficulty: "hard",   damage: 22,
      prompt: "Allocate an int array of size n using malloc and assign to pointer arr.",
      solution: "int *arr = malloc(n * sizeof(int));" },
];

export const testBank = [
    { id: "T-01", difficulty: "easy",   damage: 10,
      prompt: "Declare an integer named playerHealth and set it to 100.",
      solution: "int playerHealth = 100;" },
    { id: "T-02", difficulty: "easy",   damage: 10,
      prompt: 'Print the string "Hello, World!" followed by a newline.',
      solution: 'printf("Hello, World!\\n");' },
    { id: "T-03", difficulty: "easy",   damage: 10,
      prompt: "Declare a float named pi and set it to 3.14.",
      solution: "float pi = 3.14;" },
    { id: "T-04", difficulty: "easy",   damage: 10,
      prompt: "Declare a character variable named grade and set it to 'A'.",
      solution: "char grade = 'A';" },
    { id: "T-05", difficulty: "medium", damage: 15,
      prompt: "Include the standard input/output header.",
      solution: "#include <stdio.h>" },
    { id: "T-06", difficulty: "medium", damage: 15,
      prompt: "Read an integer from input into a variable named n.",
      solution: 'scanf("%d", &n);' },
    { id: "T-07", difficulty: "medium", damage: 15,
      prompt: "Write a for loop that runs i from 0 to less than 10.",
      solution: "for (int i = 0; i < 10; i++)" },
    { id: "T-08", difficulty: "medium", damage: 15,
      prompt: "Print the integer score using %d.",
      solution: 'printf("%d", score);' },
    { id: "T-09", difficulty: "medium", damage: 15,
      prompt: "Declare an integer array named arr with 5 elements.",
      solution: "int arr[5];" },
    { id: "T-10", difficulty: "hard",   damage: 25,
      prompt: "Write the main function signature that returns int and takes no arguments.",
      solution: "int main()" },
    { id: "T-11", difficulty: "hard",   damage: 25,
      prompt: "Return 0 from a function.",
      solution: "return 0;" },
    { id: "T-12", difficulty: "hard",   damage: 25,
      prompt: "Declare a constant integer MAX equal to 100.",
      solution: "const int MAX = 100;" },
    { id: "T-13", difficulty: "hard",   damage: 25,
      prompt: "Free the memory pointed to by ptr.",
      solution: "free(ptr);" },
    { id: "T-14", difficulty: "hard",   damage: 25,
      prompt: "Declare a typedef alias named Byte for unsigned char.",
      solution: "typedef unsigned char Byte;" },
];

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
