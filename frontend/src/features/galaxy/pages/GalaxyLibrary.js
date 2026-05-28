// GalaxyLibrary.js

// ✅ Normal typing enemies (short C snippets)
export const easyEnemies = [
  { type: "typing", word: "int x = 5;", speed: 50 },
  { type: "typing", word: "const float pi = 3.14;", speed: 55 },
  { type: "typing", word: "if (hp <= 0)", speed: 60 },
  { type: "typing", word: "return 0;", speed: 60 },
  { type: "typing", word: "char c = 'A';", speed: 58 },
  { type: "typing", word: "float score = 100.0;", speed: 56 },
  { type: "typing", word: "bool alive = true;", speed: 55 },
  { type: "typing", word: "void reset();", speed: 52 },
  { type: "typing", word: "double distance = 0.0;", speed: 54 },
    { type: "typing", word: "int y = 10;", speed: 50 },
  { type: "typing", word: "bool win = false;", speed: 55 },
  { type: "typing", word: "hp = hp - 1;", speed: 58 },
  { type: "typing", word: "score++;", speed: 60 },
  { type: "typing", word: "level = 1;", speed: 52 },
  { type: "typing", word: "int lives = 3;", speed: 54 },
  { type: "typing", word: "x += 2;", speed: 56 },
  { type: "typing", word: "y -= 1;", speed: 56 },
  { type: "typing", word: "if (x > 0)", speed: 59 },
  { type: "typing", word: "return hp;", speed: 60 },
  { type: "typing", word: "float x = 1.5;", speed: 55 },
  { type: "typing", word: "char b = 'B';", speed: 57 },
  { type: "typing", word: "bool jump = true;", speed: 54 },
  { type: "typing", word: "int coins = 0;", speed: 53 },
  { type: "typing", word: "damage = 5;", speed: 58 },
];

// ✅ Shield enemies with single concept
export const shieldEnemies = [
  {
    type: "shield",
    word: "int dmg = rand() % 6 + 5;",
    speed: 45,
    questions: [
      { prompt: "Keyword to declare integer in C", answer: "int" },
    ],
  },
  {
    type: "shield",
    word: "printf(\"Damage dealt\");",
    speed: 42,
    questions: [
      { prompt: "Function to print output in C", answer: "printf" },
    ],
  },
  {
    type: "shield",
    word: "for (int i = 0; i < 10; i++) {}",
    speed: 40,
    questions: [
      { prompt: "Keyword used to repeat code multiple times", answer: "for" },
    ],
  },
  {
    type: "shield",
    word: "while (player.hp > 0) {}",
    speed: 38,
    questions: [
      { prompt: "Keyword for loop with condition", answer: "while" },
    ],
  },
  {
    type: "shield",
    word: "switch(option) { case 1: break; }",
    speed: 40,
    questions: [
      { prompt: "Keyword for multiple-choice branching", answer: "switch" },
    ],
  },
   {
    type: "shield",
    word: "char name = 'A';",
    speed: 44,
    questions: [
      { prompt: "Keyword for single character type in C", answer: "char" },
    ],
  },
  {
    type: "shield",
    word: "float speed = 1.5;",
    speed: 43,
    questions: [
      { prompt: "Keyword for decimal numbers in C", answer: "float" },
    ],
  },
  {
    type: "shield",
    word: "double total = 99.99;",
    speed: 42,
    questions: [
      { prompt: "Higher precision decimal type in C", answer: "double" },
    ],
  },
  {
    type: "shield",
    word: "if (hp < 50) {}",
    speed: 41,
    questions: [
      { prompt: "Keyword used for conditional statements", answer: "if" },
    ],
  },
  {
    type: "shield",
    word: "else { hp = 100; }",
    speed: 41,
    questions: [
      { prompt: "Keyword for alternative condition", answer: "else" },
    ],
  },
  {
    type: "shield",
    word: "return 1;",
    speed: 44,
    questions: [
      { prompt: "Keyword used to return a value from a function", answer: "return" },
    ],
  },
  {
    type: "shield",
    word: "#include <stdio.h>",
    speed: 39,
    questions: [
      { prompt: "Preprocessor directive to include libraries", answer: "#include" },
    ],
  },
  {
    type: "shield",
    word: "scanf(\"%d\", &x);",
    speed: 40,
    questions: [
      { prompt: "Function used to take input in C", answer: "scanf" },
    ],
  },
  {
    type: "shield",
    word: "break;",
    speed: 35,
    questions: [
      { prompt: "Keyword used to exit a loop or switch", answer: "break" },
    ],
  },
  {
    type: "shield",
    word: "continue;",
    speed: 35,
    questions: [
      { prompt: "Keyword to skip to next loop iteration", answer: "continue" },
    ],
  },
];
export const bossEnemy = {
  type: "shield",
  word: `void ultimateAttack(Player* p) {
  if (p->hp > 0) {
    p->hp -= 50;
  }
}`,
  speed: 18,
  questions: [
    { prompt: "BOSS: Keyword for function with no return", answer: "void" },
    
  ],
  spawnInterval: 60000, // 60 sec
  lastSpawn: 0,
};

// ✅ Boss enemy with multiple shields & code snippet as word
export const bossEnemy2 = {
  type: "shield",
  word: `int calculateDamage(Player player, Enemy enemy) {
  int base = rand() % 6 + 5;
  if (player.weapon) base += player.weapon.power * 2;
  return base;
}`,
  speed: 15,
  questions: [
    { prompt: "BOSS: Keyword for if-statement", answer: "if" },
    { prompt: "BOSS: Random number function in C", answer: "rand" },
  ],
  spawnInterval: 90000, // Boss appears every 90 seconds
  lastSpawn: 0,         // Timestamp tracker
};

export const bossEnemy3 = {
  type: "shield",
  word: `int factorial(int n) {
  if (n < 0) {
    printf("Invalid input");
    return -1;
  }
  if (n == 0 || n == 1) {
    return 1;
  }
  int result = n * factorial(n - 1);
  if (result > 1000000) {
    printf("Warning: large value");
  }
  return result;
}`,
  speed: 11,
  questions: [
    { prompt: "BOSS:Function calling itself is called", answer: "recursion" },
    { prompt: "BOSS: Keyword used to return a value", answer: "return" },
  ],
  spawnInterval: 120000,
  lastSpawn: 0,
 
};
// --- Combined library based on level ---
// GalaxyLibrary.js

export function getEnemiesByLevel(currentTime = 0, bossState = null) {
  const enemies = [];

  const bossIndex = bossState?.index ?? 0;
  const timeSinceLastBoss = currentTime - (bossState?.lastBossDefeatedTime ?? 0);

  // Boss 1
  if (bossIndex === 0 && timeSinceLastBoss >= 60000) {
    return [{ ...bossEnemy, type: "boss" }];
  }

  // Boss 2
  if (bossIndex === 1 && timeSinceLastBoss >= 60000) {
    return [{ ...bossEnemy2, type: "boss" }];
  }

  // Boss 3
  if (bossIndex === 2 && timeSinceLastBoss >= 60000) {
    return [{ ...bossEnemy3, type: "boss" }];
  }

  // Normal spawn
  const spawnPool = [...easyEnemies, ...shieldEnemies];
  const randomIndex = Math.floor(Math.random() * spawnPool.length);

  enemies.push({ ...spawnPool[randomIndex] });

  return enemies;
}
