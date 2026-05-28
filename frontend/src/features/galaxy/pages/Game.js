import React, { useEffect, useRef, useState } from "react";
import { usePlayer } from "./usePlayer";
import { useMap } from "./map";
import { API_BASE } from '../../../shared/api/client';
import { authFetch } from '../../../shared/api/authFetch';

export default function Game() {
  const canvasRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [words, setWords] = useState([]);
const currentPowerupRef = useRef(null);
  const keysPressed = useRef({});
  const starsRef = useRef([]);
const lastPowerupSpawnRef = useRef(Date.now() + Math.random() * 20000);
  const { player, updatePlayer, drawPlayer, resetPlayer } = usePlayer();
  const { updateMap, captureZone } = useMap();

  // --- Enemy & Bullets ---
  const enemiesRef = useRef([]);
  const bulletsRef = useRef([]);

  // --- Typing ---
  const currentTargetRef = useRef(null);
  const typedLettersRef = useRef("");

  // --- Powerups ---
  const POWERUPS = [
    { subtype: "freeze", word: "FIREWALL", color: "cyan" },
    { subtype: "reveal", word: "ANTIVIRUS", color: "orange" },
    { subtype: "nuke", word: "ENCRYPTION", color: "magenta" },
  ];
  const powerupsRef = useRef([]);
  const powerupEffectRef = useRef(null); // holds active effect (like freeze timer)
const updatePowerups = () => {
  const now = Date.now();
  powerupsRef.current = powerupsRef.current.filter((p) => {
    if (!p.alive) return false;
    if (p.expiresAt && now > p.expiresAt) return false;
    return true;
    
  });
};

  // --- Fetch Words ---
  useEffect(() => {
    const fetchWords = async () => {
      try {
        const res = await authFetch(`${API_BASE}/api/challenges/galaxy/words`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        setWords(data);
      } catch (err) {
        console.error("Failed to load words:", err);
      }
    };
    fetchWords();
  }, []);

  // --- Spawn Enemy ---
  const spawnEnemy = (canvas) => {
    if (words.length === 0) return;
    const randomWord = words[Math.floor(Math.random() * words.length)];
    enemiesRef.current.push({
      word:
        level > 3
          ? randomWord + randomWord.slice(0, Math.min(3, randomWord.length))
          : randomWord,
      x: canvas.width - 150,
      y: Math.random() * (canvas.height - 100) + 50,
      speed: 1.5 + Math.random() * (1.5 + level * 0.6),
      alive: true,
    });
  };

  // --- Spawn Powerup ---
  const spawnPowerup = (canvas) => {
  const now = Date.now();
  const cooldown = 15000; // 15 seconds min between spawns
  if (now - lastPowerupSpawnRef.current < cooldown) return;

  if (Math.random() < 0.2) { // 20% chance when cooldown passes
    const p = POWERUPS[Math.floor(Math.random() * POWERUPS.length)];
    powerupsRef.current.push({
      word: p.word,
      x: Math.random() * (canvas.width - 150),
      y: Math.random() * (canvas.height - 100) + 50,
      alive: true,
      subtype: p.subtype,
      color: p.color,
      expiresAt: Date.now() + 6000, // lasts 6s
    });
    lastPowerupSpawnRef.current = now;
  }
};
  // --- Apply Powerup Effect ---
  const applyPowerup = (powerup) => {
    if (!powerup) return;
    if (powerup.subtype === "freeze") {
      powerupEffectRef.current = { type: "freeze", until: Date.now() + 5000 };
    } else if (powerup.subtype === "reveal") {
      enemiesRef.current.forEach((enemy) => {
        enemy.word = enemy.word.slice(-1); // leave last letter
      });
    } else if (powerup.subtype === "nuke") {
      enemiesRef.current = []; // wipe all enemies
    }
  };

  // --- Update Enemies ---
  function updateEnemies(ctx, player) {
    const frozen = powerupEffectRef.current?.type === "freeze" &&
                   Date.now() < powerupEffectRef.current.until;

    for (let i = enemiesRef.current.length - 1; i >= 0; i--) {
      const enemy = enemiesRef.current[i];
      if (!frozen) enemy.x -= enemy.speed;

      ctx.fillStyle = "red";
      ctx.fillRect(enemy.x, enemy.y, 40, 40);

      // Collision with player
      if (
        enemy.x < player.x + player.width &&
        enemy.x + 40 > player.x &&
        enemy.y < player.y + player.height &&
        enemy.y + 40 > player.y
      ) {
        enemiesRef.current.splice(i, 1);
        if (currentTargetRef.current === enemy) {
          currentTargetRef.current = null;
          typedLettersRef.current = "";
        }
        setLives((prev) => {
          const newLives = prev - 1;
          if (newLives <= 0) {
            setIsPaused(true);
            alert("Game Over!");
          }
          return newLives;
        });
      }

      // Off-screen cleanup
      if (enemy.x + 40 < 0) {
        enemiesRef.current.splice(i, 1);
        if (currentTargetRef.current === enemy) {
          currentTargetRef.current = null;
          typedLettersRef.current = "";
        }
      }
    }
  }

  // --- Draw Enemies ---
  const drawEnemies = (ctx) => {
    enemiesRef.current.forEach((enemy) => {
      ctx.fillStyle = currentTargetRef.current === enemy ? "yellow" : "red";
      ctx.font = "20px Arial";
      ctx.fillText(enemy.word, enemy.x, enemy.y);
      if (
        currentTargetRef.current === enemy &&
        typedLettersRef.current.length > 0
      ) {
        ctx.fillStyle = "yellow";
        ctx.fillText(typedLettersRef.current, enemy.x, enemy.y + 20);
      }
    });
  };

  // --- Draw Powerups ---
const drawPowerups = (ctx) => {
  powerupsRef.current.forEach((p) => {
    if (!p.alive) return;

    const typed = (currentPowerupRef.current === p) ? typedLettersRef.current : "";

    ctx.font = "20px monospace";

    // Draw typed part (highlight)
    ctx.fillStyle = "lime";
    ctx.fillText(typed, p.x, p.y);

    // Draw remaining part
    ctx.fillStyle = p.color;
    ctx.fillText(p.word.slice(typed.length), p.x + ctx.measureText(typed).width, p.y);
  });
};

  // --- Bullets ---
  const spawnBullet = () => {
    if (!currentTargetRef.current) return;
    bulletsRef.current.push({
      x: player.x + player.width / 2,
      y: player.y + player.height / 2,
      speed: 5,
      target: currentTargetRef.current,
    });
  };

  const updateBullets = () => {
    bulletsRef.current.forEach((bullet) => {
      if (!bullet.target || !bullet.target.alive) {
        bullet.remove = true;
        return;
      }
      const dx = bullet.target.x - bullet.x;
      const dy = bullet.target.y - bullet.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 15) {
        bullet.remove = true;
      } else {
        bullet.x += (dx / dist) * bullet.speed;
        bullet.y += (dy / dist) * bullet.speed;
      }
    });
    bulletsRef.current = bulletsRef.current.filter((b) => !b.remove);
  };

  const drawBullets = (ctx) => {
    ctx.fillStyle = "cyan";
    bulletsRef.current.forEach((bullet) => {
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, 5, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  // --- Typing ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isPaused) return;
      const key = e.key.toLowerCase();

      // Movement keys
      if (["arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) {
        e.preventDefault();
        keysPressed.current[e.key] = true;
        return;
      }

      // Backspace
      if (key === "backspace") {
        typedLettersRef.current = typedLettersRef.current.slice(0, -1);
        if (typedLettersRef.current.length === 0) {
          currentTargetRef.current = null;
          currentPowerupRef.current = null;
        }
        return;
      }

      // Typing letters
      if (key.length === 1 && key.match(/[a-z0-9]/i)) {
  // --- Powerup Typing ---
  if (!currentPowerupRef.current) {
    const target = powerupsRef.current.find((p) =>
      p.alive && p.word.toLowerCase().startsWith(key)
    );
    if (target) {
      currentPowerupRef.current = target;
      typedLettersRef.current = key;
    }
  } else {
    typedLettersRef.current += key;
  }

  if (currentPowerupRef.current) {
    if (
      typedLettersRef.current.toLowerCase() ===
      currentPowerupRef.current.word.toLowerCase()
    ) {
      // ✅ Powerup completed
      currentPowerupRef.current.alive = false;
      applyPowerup(currentPowerupRef.current);
      currentPowerupRef.current = null;
      typedLettersRef.current = "";
    }
    return; // don’t continue to enemy logic if typing a powerup
  }

  // --- Enemy Typing ---
  if (!currentTargetRef.current) {
    const target = enemiesRef.current.find((enemy) =>
      enemy.word.toLowerCase().startsWith(key)
    );
    if (target) {
      currentTargetRef.current = target;
      typedLettersRef.current = key;
    }
  } else {
    typedLettersRef.current += key;
  }
  if (currentTargetRef.current) spawnBullet();
}
    };

    const handleKeyUp = (e) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        keysPressed.current[e.key] = false;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isPaused]);

  // --- Word Completion + Scoring ---
  useEffect(() => {
    const checkWordCompletion = () => {
      if (
        currentTargetRef.current &&
        typedLettersRef.current.toLowerCase() ===
          currentTargetRef.current.word.toLowerCase()
      ) {
        currentTargetRef.current.alive = false;
        enemiesRef.current = enemiesRef.current.filter((e) => e.alive);
        currentTargetRef.current = null;
        typedLettersRef.current = "";
        bulletsRef.current = [];
        setScore((prev) => prev + 10);
      }
    };
    const interval = setInterval(checkWordCompletion, 50);
    return () => clearInterval(interval);
  }, []);

  // --- Level Up ---
  useEffect(() => {
    if (score > 0 && score % 100 === 0) {
      setLevel((prev) => prev + 1);
    }
  }, [score]);

  // --- Stars ---
  useEffect(() => {
    const canvas = canvasRef.current;
    const numStars = 150;
    starsRef.current = Array.from({ length: numStars }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 1,
      speed: 0.5 + Math.random() * 2,
    }));
  }, []);

  function drawStars(ctx, canvas) {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    starsRef.current.forEach((star) => {
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
      star.x -= star.speed;
      if (star.x < 0) {
        star.x = canvas.width;
        star.y = Math.random() * canvas.height;
      }
    });
  }

  // --- Main Loop ---
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let animationId;
    const loop = () => {
      if (!isPaused) {
        drawStars(ctx, canvas);

        updatePlayer(canvas, keysPressed.current);
        drawPlayer(ctx);

        // Spawning
         const baseSpawnRate = 0.003;
    const spawnIncrease = 0.002;
    const maxSpawnRate = 0.04;
    const spawnChance = Math.min(baseSpawnRate + level * spawnIncrease, maxSpawnRate);
    if (Math.random() < spawnChance) spawnEnemy(canvas);

    spawnPowerup(canvas);

        // Update & Draw
        updateEnemies(ctx, player);
        updatePowerups();
        if (
  currentPowerupRef.current &&
  !powerupsRef.current.includes(currentPowerupRef.current)
) {
  currentPowerupRef.current = null;
  typedLettersRef.current = "";
}
        drawEnemies(ctx);
        drawPowerups(ctx);
        updateBullets();
        drawBullets(ctx);
        
        updateMap(ctx, player, level);

        // HUD
        ctx.fillStyle = "lime";
        ctx.font = "18px Arial";
        ctx.fillText(`Lives: ${lives}`, 20, 80);
        ctx.fillText(`Score: ${score}`, 20, 100);
        ctx.fillText(`Level: ${level}`, 20, 120);
      }
      animationId = requestAnimationFrame(loop);
    };

    loop();
    return () => cancelAnimationFrame(animationId);
  }, [isPaused, player, updatePlayer, drawPlayer, updateMap, level, lives, score]);

  // --- Restart ---
  const restartGame = () => {
    resetPlayer();
    setLevel(1);
    setScore(0);
    setLives(3);
    enemiesRef.current = [];
    bulletsRef.current = [];
    powerupsRef.current = [];
    typedLettersRef.current = "";
    currentTargetRef.current = null;
    setIsPaused(false);
  };

  return (
    <div style={{ textAlign: "center" }}>
      <canvas ref={canvasRef} style={{ background: "black" }} />
      <div style={{ marginTop: "10px" }}>
        <button onClick={() => setIsPaused((p) => !p)}>
          {isPaused ? "Resume" : "Pause"}
        </button>
        <button onClick={restartGame}>Restart</button>
        <button onClick={captureZone}>Simulate Capture Zone</button>
      </div>
    </div>
  );
}
