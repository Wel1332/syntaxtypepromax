// English-to-C prompts for Translation Terminal RPG combat.
// `solution` is the canonical answer — comparison uses tokensEqual so
// formatting/whitespace variations are accepted.

const translationPrompts = [
    { id: 1, difficulty: "easy", damage: 10,
      prompt: "Declare an integer named playerHealth and set it to 100.",
      solution: "int playerHealth = 100;" },
    { id: 2, difficulty: "easy", damage: 10,
      prompt: "Print the string \"Hello, World!\" followed by a newline.",
      solution: 'printf("Hello, World!\\n");' },
    { id: 3, difficulty: "easy", damage: 10,
      prompt: "Declare a float named pi and set it to 3.14.",
      solution: "float pi = 3.14;" },
    { id: 4, difficulty: "easy", damage: 10,
      prompt: "Declare a character variable named grade and set it to 'A'.",
      solution: "char grade = 'A';" },
    { id: 5, difficulty: "medium", damage: 15,
      prompt: "Include the standard input/output header.",
      solution: "#include <stdio.h>" },
    { id: 6, difficulty: "medium", damage: 15,
      prompt: "Read an integer from input into a variable named n.",
      solution: 'scanf("%d", &n);' },
    { id: 7, difficulty: "medium", damage: 15,
      prompt: "Write a for loop that runs i from 0 to less than 10.",
      solution: "for (int i = 0; i < 10; i++)" },
    { id: 8, difficulty: "medium", damage: 15,
      prompt: "Print the integer score using %d.",
      solution: 'printf("%d", score);' },
    { id: 9, difficulty: "medium", damage: 15,
      prompt: "Declare an integer array named arr with 5 elements.",
      solution: "int arr[5];" },
    { id: 10, difficulty: "hard", damage: 25,
      prompt: "Write the main function signature that returns int and takes no arguments.",
      solution: "int main()" },
    { id: 11, difficulty: "hard", damage: 25,
      prompt: "Return 0 from a function.",
      solution: "return 0;" },
    { id: 12, difficulty: "hard", damage: 25,
      prompt: "Declare a constant integer MAX equal to 100.",
      solution: "const int MAX = 100;" },
];

export default translationPrompts;

// RPG enemies — each represents a level. HP determines how many prompts you
// need to complete to defeat them.
export const enemies = [
    { id: 1, name: "Syntax Slime",     hp: 30, attack: 8,  emoji: "🟢", sprite: "/assets/enemies/slime-idle.png", color: "#3ecf6a" },
    { id: 2, name: "Bracket Beast",    hp: 50, attack: 12, emoji: "🟣", sprite: "/assets/enemies/bracket-beast-idle.png", color: "#a855f7" },
    { id: 3, name: "Compiler Wraith",  hp: 80, attack: 18, emoji: "👻", sprite: "/assets/enemies/compiler-wraith-idle.png", color: "#06b6d4" },
    { id: 4, name: "Segfault Dragon",  hp: 120, attack: 25, emoji: "🐉", sprite: "/assets/enemies/segfault-dragon-idle.png", color: "#ef4444" },
];
