// Translation Terminal prompt banks.
//
// `solution` is the canonical answer — comparison uses tokensEqual so
// formatting/whitespace variations are accepted.
//
// `topic` tags which of the course's four topics a prompt exercises
// (shared/assessment/topics.js): basics | conditionals | loops | functions.
// The tag exists so coverage is checkable rather than asserted — see
// coverageOf() at the bottom of this file.
//
// Practice and test banks are kept disjoint so Practice doesn't leak the
// Pre-Test / Post-Test answer key. Each bank holds 32 prompts, eight per topic,
// so either can carry an assessment on its own (Objective 3.2 asks for 30+).
//
// Ids carry a 2 (P2-, T2-): this is the second question set, and its ids must
// never match the first set's, which are already in recorded study data.

import { TOPICS } from "../../../shared/assessment/topics";

export { TOPICS };

export const practiceBank = [
    // ── basic programming ─────────────────────────────────────────────────
    { id: "P2-01", difficulty: "easy",   damage: 10, topic: "basics",
      prompt: "Declare an int named lives equal to 3.",
      solution: "int lives = 3;" },
    { id: "P2-02", difficulty: "easy",   damage: 10, topic: "basics",
      prompt: "Declare a float named height equal to 1.5.",
      solution: "float height = 1.5;" },
    { id: "P2-03", difficulty: "easy",   damage: 10, topic: "basics",
      prompt: "Declare a char named answer equal to 'Y'.",
      solution: "char answer = 'Y';" },
    { id: "P2-04", difficulty: "easy",   damage: 10, topic: "basics",
      prompt: 'Print "Hi!" using printf.',
      solution: 'printf("Hi!");' },
    { id: "P2-05", difficulty: "medium", damage: 15, topic: "basics",
      prompt: "Print the int variable lives using %d.",
      solution: 'printf("%d", lives);' },
    { id: "P2-06", difficulty: "medium", damage: 15, topic: "basics",
      prompt: "Read an int from the keyboard into the variable lives.",
      solution: 'scanf("%d", &lives);' },
    { id: "P2-07", difficulty: "medium", damage: 15, topic: "basics",
      prompt: "Set total to price times 2.",
      solution: "total = price * 2;" },
    { id: "P2-08", difficulty: "hard",   damage: 22, topic: "basics",
      prompt: "Declare two ints in one line: x equal to 1 and y equal to 2.",
      solution: "int x = 1, y = 2;" },

    // ── conditionals ──────────────────────────────────────────────────────
    { id: "P2-09", difficulty: "easy",   damage: 10, topic: "conditionals",
      prompt: "Write an if statement that checks if lives is equal to 0.",
      solution: "if (lives == 0)" },
    { id: "P2-10", difficulty: "easy",   damage: 10, topic: "conditionals",
      prompt: "Write an if statement that checks if age is less than 13.",
      solution: "if (age < 13)" },
    { id: "P2-11", difficulty: "easy",   damage: 10, topic: "conditionals",
      prompt: "Write an if statement that checks if speed is greater than 60.",
      solution: "if (speed > 60)" },
    { id: "P2-12", difficulty: "medium", damage: 15, topic: "conditionals",
      prompt: "Write an else if that checks if score is greater than or equal to 75.",
      solution: "else if (score >= 75)" },
    { id: "P2-13", difficulty: "medium", damage: 15, topic: "conditionals",
      prompt: "Write an if statement that checks if n is even, using n % 2 == 0.",
      solution: "if (n % 2 == 0)" },
    { id: "P2-14", difficulty: "medium", damage: 15, topic: "conditionals",
      prompt: "Write a switch statement header on the variable color.",
      solution: "switch (color)" },
    { id: "P2-15", difficulty: "medium", damage: 15, topic: "conditionals",
      prompt: "Write a case label for the value 3.",
      solution: "case 3:" },
    { id: "P2-16", difficulty: "hard",   damage: 22, topic: "conditionals",
      prompt: "Write an if statement that checks if x is greater than 0 and less than 10, using &&.",
      solution: "if (x > 0 && x < 10)" },

    // ── loops ─────────────────────────────────────────────────────────────
    { id: "P2-17", difficulty: "easy",   damage: 10, topic: "loops",
      prompt: "Write a while loop header that runs while n is greater than 0.",
      solution: "while (n > 0)" },
    { id: "P2-18", difficulty: "easy",   damage: 10, topic: "loops",
      prompt: "Add 1 to count using ++.",
      solution: "count++;" },
    { id: "P2-19", difficulty: "medium", damage: 15, topic: "loops",
      prompt: "Write a for loop header: int i starts at 0, runs while i < 5, and uses i++.",
      solution: "for (int i = 0; i < 5; i++)" },
    { id: "P2-20", difficulty: "medium", damage: 15, topic: "loops",
      prompt: "Write a while loop header that runs while i is less than or equal to 10.",
      solution: "while (i <= 10)" },
    { id: "P2-21", difficulty: "medium", damage: 15, topic: "loops",
      prompt: "Add i to sum using +=.",
      solution: "sum += i;" },
    { id: "P2-22", difficulty: "medium", damage: 15, topic: "loops",
      prompt: "Write the statement that leaves a loop right away.",
      solution: "break;" },
    { id: "P2-23", difficulty: "hard",   damage: 22, topic: "loops",
      prompt: "Write a for loop header: int i starts at 10, runs while i > 0, and uses i--.",
      solution: "for (int i = 10; i > 0; i--)" },
    { id: "P2-24", difficulty: "hard",   damage: 22, topic: "loops",
      prompt: "Write a for loop header: int j starts at 0, runs while j <= 100, and uses j += 10.",
      solution: "for (int j = 0; j <= 100; j += 10)" },

    // ── functions ─────────────────────────────────────────────────────────
    { id: "P2-25", difficulty: "easy",   damage: 10, topic: "functions",
      prompt: "Call the function start with no arguments.",
      solution: "start();" },
    { id: "P2-26", difficulty: "easy",   damage: 10, topic: "functions",
      prompt: "Return 0 from main.",
      solution: "return 0;" },
    { id: "P2-27", difficulty: "medium", damage: 15, topic: "functions",
      prompt: "Write the header of a void function named showMenu with empty parentheses.",
      solution: "void showMenu()" },
    { id: "P2-28", difficulty: "medium", damage: 15, topic: "functions",
      prompt: "Write the header of an int function named getAge with empty parentheses.",
      solution: "int getAge()" },
    { id: "P2-29", difficulty: "medium", damage: 15, topic: "functions",
      prompt: "Call the function printScore and pass it the variable score.",
      solution: "printScore(score);" },
    { id: "P2-30", difficulty: "medium", damage: 15, topic: "functions",
      prompt: "Return the value of the variable result.",
      solution: "return result;" },
    { id: "P2-31", difficulty: "hard",   damage: 22, topic: "functions",
      prompt: "Write the header of an int function named subtract that takes int a and int b.",
      solution: "int subtract(int a, int b)" },
    { id: "P2-32", difficulty: "hard",   damage: 22, topic: "functions",
      prompt: "Store the value returned by getAge() in a new int named age.",
      solution: "int age = getAge();" },
];

export const testBank = [
    // ── basic programming ─────────────────────────────────────────────────
    { id: "T2-01", difficulty: "easy",   damage: 10, topic: "basics",
      prompt: "Declare an int named score equal to 0.",
      solution: "int score = 0;" },
    { id: "T2-02", difficulty: "easy",   damage: 10, topic: "basics",
      prompt: "Declare a float named weight equal to 45.5.",
      solution: "float weight = 45.5;" },
    { id: "T2-03", difficulty: "easy",   damage: 10, topic: "basics",
      prompt: "Declare a char named initial equal to 'J'.",
      solution: "char initial = 'J';" },
    { id: "T2-04", difficulty: "easy",   damage: 10, topic: "basics",
      prompt: 'Print "Hello" using printf.',
      solution: 'printf("Hello");' },
    { id: "T2-05", difficulty: "medium", damage: 15, topic: "basics",
      prompt: "Print the int variable score using %d.",
      solution: 'printf("%d", score);' },
    { id: "T2-06", difficulty: "medium", damage: 15, topic: "basics",
      prompt: "Read an int from the keyboard into the variable age.",
      solution: 'scanf("%d", &age);' },
    { id: "T2-07", difficulty: "medium", damage: 15, topic: "basics",
      prompt: "Set area to length times width.",
      solution: "area = length * width;" },
    { id: "T2-08", difficulty: "hard",   damage: 25, topic: "basics",
      prompt: "Declare two ints in one line: a equal to 5 and b equal to 10.",
      solution: "int a = 5, b = 10;" },

    // ── conditionals ──────────────────────────────────────────────────────
    { id: "T2-09", difficulty: "easy",   damage: 10, topic: "conditionals",
      prompt: "Write an if statement that checks if score is equal to 100.",
      solution: "if (score == 100)" },
    { id: "T2-10", difficulty: "easy",   damage: 10, topic: "conditionals",
      prompt: "Write an if statement that checks if age is greater than or equal to 18.",
      solution: "if (age >= 18)" },
    { id: "T2-11", difficulty: "easy",   damage: 10, topic: "conditionals",
      prompt: "Write an if statement that checks if temp is less than 0.",
      solution: "if (temp < 0)" },
    { id: "T2-12", difficulty: "medium", damage: 15, topic: "conditionals",
      prompt: "Write an else if that checks if score is greater than or equal to 80.",
      solution: "else if (score >= 80)" },
    { id: "T2-13", difficulty: "medium", damage: 15, topic: "conditionals",
      prompt: "Write an if statement that checks if n is odd, using n % 2 == 1.",
      solution: "if (n % 2 == 1)" },
    { id: "T2-14", difficulty: "medium", damage: 15, topic: "conditionals",
      prompt: "Write a switch statement header on the variable day.",
      solution: "switch (day)" },
    { id: "T2-15", difficulty: "medium", damage: 15, topic: "conditionals",
      prompt: "Write a case label for the value 1.",
      solution: "case 1:" },
    { id: "T2-16", difficulty: "hard",   damage: 25, topic: "conditionals",
      prompt: "Write an if statement that checks if age is less than 13 or greater than 60, using ||.",
      solution: "if (age < 13 || age > 60)" },

    // ── loops ─────────────────────────────────────────────────────────────
    { id: "T2-17", difficulty: "easy",   damage: 10, topic: "loops",
      prompt: "Write a while loop header that runs while lives is greater than 0.",
      solution: "while (lives > 0)" },
    { id: "T2-18", difficulty: "easy",   damage: 10, topic: "loops",
      prompt: "Subtract 1 from count using --.",
      solution: "count--;" },
    { id: "T2-19", difficulty: "medium", damage: 15, topic: "loops",
      prompt: "Write a for loop header: int i starts at 1, runs while i <= 10, and uses i++.",
      solution: "for (int i = 1; i <= 10; i++)" },
    { id: "T2-20", difficulty: "medium", damage: 15, topic: "loops",
      prompt: "Write a while loop header that runs while i is less than 100.",
      solution: "while (i < 100)" },
    { id: "T2-21", difficulty: "medium", damage: 15, topic: "loops",
      prompt: "Add n to total using +=.",
      solution: "total += n;" },
    { id: "T2-22", difficulty: "medium", damage: 15, topic: "loops",
      prompt: "Write the statement that skips to the next loop round.",
      solution: "continue;" },
    { id: "T2-23", difficulty: "hard",   damage: 25, topic: "loops",
      prompt: "Write a for loop header: int i starts at 5, runs while i >= 1, and uses i--.",
      solution: "for (int i = 5; i >= 1; i--)" },
    { id: "T2-24", difficulty: "hard",   damage: 25, topic: "loops",
      prompt: "Write a for loop header: int k starts at 0, runs while k < 50, and uses k += 5.",
      solution: "for (int k = 0; k < 50; k += 5)" },

    // ── functions ─────────────────────────────────────────────────────────
    { id: "T2-25", difficulty: "easy",   damage: 10, topic: "functions",
      prompt: "Call the function play with no arguments.",
      solution: "play();" },
    { id: "T2-26", difficulty: "easy",   damage: 10, topic: "functions",
      prompt: "Return 1 from a function.",
      solution: "return 1;" },
    { id: "T2-27", difficulty: "medium", damage: 15, topic: "functions",
      prompt: "Write the header of a void function named greet with empty parentheses.",
      solution: "void greet()" },
    { id: "T2-28", difficulty: "medium", damage: 15, topic: "functions",
      prompt: "Write the header of an int function named getScore with empty parentheses.",
      solution: "int getScore()" },
    { id: "T2-29", difficulty: "medium", damage: 15, topic: "functions",
      prompt: "Call the function showAge and pass it the variable age.",
      solution: "showAge(age);" },
    { id: "T2-30", difficulty: "medium", damage: 15, topic: "functions",
      prompt: "Return the value of the variable total.",
      solution: "return total;" },
    { id: "T2-31", difficulty: "hard",   damage: 25, topic: "functions",
      prompt: "Write the header of an int function named add that takes int a and int b.",
      solution: "int add(int a, int b)" },
    { id: "T2-32", difficulty: "hard",   damage: 25, topic: "functions",
      prompt: "Store the value returned by getScore() in a new int named score.",
      solution: "int score = getScore();" },
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
