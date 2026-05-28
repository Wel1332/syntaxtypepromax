import React, { useEffect, useRef, useState, useCallback } from "react";
import { useBackground } from "./GalaxyBackground";
import { loadAssets } from "./assets";
import { getEnemiesByLevel, bossEnemy, bossEnemy2, bossEnemy3 } from "./GalaxyLibrary";
import { spawnEnemy, updateEnemies, drawEnemies, cleanupEnemies } from "./GalaxyEnemy";
import { useScoreSubmission } from '../../../shared/hooks/useScoreSubmission';

const MAX_BOSSES = 3;
const COMBO_PER_TIER = 10;
const MAX_MULTIPLIER = 5;
const TUTORIAL_KEY = 'galaxy-tutorial-seen-v1';

const computeMultiplier = (combo) =>
  Math.min(MAX_MULTIPLIER, 1 + Math.floor(combo / COMBO_PER_TIER) * 0.5);

const GalaxyMainGame = () => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const assetsRef = useRef({ ship: null });

  // --- Game-loop source-of-truth refs ---
  const gameTimeRef = useRef(0);
  const difficultyRef = useRef(1);
  const realTimeRef = useRef(0);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const spawnTimerRef = useRef(-1.5);
  const bossStateRef = useRef({ index: 0, lastBossDefeatedTime: 0 });
  const playerRef = useRef({ x: 50, y: 300, width: 80, height: 60, speed: 500 });
  const enemiesRef = useRef([]);
  const targetEnemyRef = useRef(null);
  const bulletsRef = useRef([]);
  const keysPressed = useRef({});
  const bossesDefeatedRef = useRef(0);

  // Typing stats
  const comboRef = useRef(0);
  const maxComboRef = useRef(0);
  const correctCharsRef = useRef(0);
  const totalKeyAttemptsRef = useRef(0);
  const flashTimerRef = useRef(0);
  const hudSyncTimerRef = useRef(0);

  // --- HUD state (synced from refs at ~5 Hz) ---
  const [hud, setHud] = useState({
    score: 0,
    lives: 3,
    combo: 0,
    multiplier: 1,
    wpm: 0,
    accuracy: 100,
    bossesDefeated: 0,
    currentWord: '',
    typedSoFar: '',
  });

  const [gameReady, setGameReady] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [showSubmitButton, setShowSubmitButton] = useState(false);
  const [showTutorial, setShowTutorial] = useState(() => {
    try { return !localStorage.getItem(TUTORIAL_KEY); } catch { return false; }
  });

  const { initStars, drawBackground } = useBackground();
  const { submitScore, isSubmitting, submitMessage, submitSuccess } = useScoreSubmission();

  // --- Helpers ---
  const triggerFlash = () => { flashTimerRef.current = 0.35; };
  const resetCombo = () => { comboRef.current = 0; };

  const addCorrectKey = () => {
    correctCharsRef.current += 1;
    totalKeyAttemptsRef.current += 1;
    comboRef.current += 1;
    if (comboRef.current > maxComboRef.current) maxComboRef.current = comboRef.current;
  };

  const addMissKey = () => {
    totalKeyAttemptsRef.current += 1;
    resetCombo();
    triggerFlash();
  };

  const updateLivesUI = useCallback(() => {
    livesRef.current -= 1;
    resetCombo();
    triggerFlash();
    if (livesRef.current <= 0) {
      setGameOver(true);
      setGameWon(false);
      setShowSubmitButton(true);
    }
  }, []);

  const shootBullet = (target) => {
    const p = playerRef.current;
    bulletsRef.current.push({
      x: p.x + p.width,
      y: p.y + p.height / 2,
      target,
      speed: 1400,
    });
  };

  const finishEnemy = (target) => {
    const basePts = target.type === "boss" ? 50 : (target.type === "shield" ? 2 : 1);
    const mult = computeMultiplier(comboRef.current);
    scoreRef.current += Math.round(basePts * mult);

    if (target.type === "boss") {
      bossesDefeatedRef.current += 1;
      bossStateRef.current.lastBossDefeatedTime = gameTimeRef.current;
      bossStateRef.current.index += 1;
      if (bossesDefeatedRef.current >= MAX_BOSSES) {
        setGameOver(true);
        setGameWon(true);
        setShowSubmitButton(true);
        enemiesRef.current.forEach(en => { en.destroyed = true; en.remove = true; });
        targetEnemyRef.current = null;
        return;
      }
    }

    target.destroyed = true;
    if (targetEnemyRef.current === target) targetEnemyRef.current = null;
    setTimeout(() => { target.remove = true; }, 100);
  };

  const restartGame = () => {
    setGameOver(false);
    setGameWon(false);
    setShowSubmitButton(false);
    setIsPaused(false);

    gameTimeRef.current = 0;
    realTimeRef.current = 0;
    difficultyRef.current = 1;
    scoreRef.current = 0;
    livesRef.current = 3;
    spawnTimerRef.current = -1.5;
    bossesDefeatedRef.current = 0;
    bossStateRef.current = { index: 0, lastBossDefeatedTime: 0 };
    comboRef.current = 0;
    maxComboRef.current = 0;
    correctCharsRef.current = 0;
    totalKeyAttemptsRef.current = 0;
    flashTimerRef.current = 0;

    enemiesRef.current = [];
    bulletsRef.current = [];
    targetEnemyRef.current = null;
    playerRef.current = { x: 50, y: 300, width: 80, height: 60, speed: 500 };

    bossEnemy.lastSpawn = 0;
    bossEnemy2.lastSpawn = 0;
    bossEnemy3.spawned = false;

    setHud({
      score: 0, lives: 3, combo: 0, multiplier: 1,
      wpm: 0, accuracy: 100, bossesDefeated: 0,
      currentWord: '', typedSoFar: '',
    });
  };

  const handleSubmitScore = async () => {
    const success = await submitScore('GALAXY', { score: scoreRef.current });
    if (success) setShowSubmitButton(false);
  };

  const dismissTutorial = () => {
    setShowTutorial(false);
    try { localStorage.setItem(TUTORIAL_KEY, '1'); } catch {}
  };

  // --- Asset load ---
  useEffect(() => {
    loadAssets({ images: { ship: "/images/nightraider.png" } })
      .then((loaded) => { assetsRef.current = loaded; setGameReady(true); })
      .catch((err) => console.error("Asset load failed", err));
  }, []);

  // --- Input handling ---
  useEffect(() => {
    // Map browser key values that aren't single printable chars but represent
    // a real keystroke we want to accept (dead keys on some layouts, etc.)
    const DEAD_KEY_FALLBACK = {
      Quote: "'",
      Backquote: "`",
      Semicolon: ";",
      Slash: "/",
      Backslash: "\\",
      BracketLeft: "[",
      BracketRight: "]",
      Minus: "-",
      Equal: "=",
      Period: ".",
      Comma: ",",
    };

    const resolvePrintableKey = (e) => {
      const k = e.key;
      if (k && k.length === 1) return k;
      // Some keyboard layouts emit "Dead" instead of a printable char for ' ` etc.
      if (k === "Dead" && DEAD_KEY_FALLBACK[e.code]) return DEAD_KEY_FALLBACK[e.code];
      return null;
    };

    const handleKeyDown = (e) => {
      const key = e.key;

      if (key === "Escape" && !gameOver && !showTutorial) {
        e.preventDefault();
        setIsPaused((p) => !p);
        return;
      }
      if (isPaused || gameOver || showTutorial) return;

      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Tab"].includes(key)) {
        e.preventDefault();
        if (key === "Tab") {
          const alive = enemiesRef.current.filter((en) => !en.destroyed && !en.remove);
          if (!alive.length) return;
          const idx = alive.indexOf(targetEnemyRef.current);
          targetEnemyRef.current = alive[(idx + 1) % alive.length];
        } else {
          keysPressed.current[key] = true;
        }
        return;
      }

      const printable = resolvePrintableKey(e);
      const currentTarget = targetEnemyRef.current;
      const bossActive = currentTarget && currentTarget.type === "boss" && !currentTarget.destroyed;

      // Acquire a new target by first-letter match if nothing locked
      if (!bossActive && printable && (!currentTarget || currentTarget.remove || currentTarget.destroyed)) {
        e.preventDefault();
        const char = printable.toLowerCase();
        const match = enemiesRef.current.find((en) => {
          if (en.destroyed || en.remove || en.hitPlayer) return false;
          const wordToMatch = (en.shield && en.questions[en.shieldIndex])
            ? en.questions[en.shieldIndex].answer
            : en.word;
          return wordToMatch.toLowerCase().startsWith(char);
        });
        if (match) {
          targetEnemyRef.current = match;
        } else {
          addMissKey();
          return;
        }
      }

      const active = targetEnemyRef.current;
      if (!active || active.remove || active.destroyed) return;

      // Boss Enter handling
      if (key === "Enter" && active.type === "boss" && !active.shield) {
        e.preventDefault();
        const remaining = active.word.slice((active.typed || "").length);
        if (remaining.startsWith("\n")) {
          const match = remaining.match(/^[\n\r]\s*/);
          if (match) {
            active.typed = (active.typed || "") + match[0];
            shootBullet(active);
            addCorrectKey();
            if (active.typed.length >= active.word.length) finishEnemy(active);
          }
          return;
        }
      }

      if (printable) {
        e.preventDefault();
        const char = printable.toLowerCase();
        if (active.shield) {
          const q = active.questions[active.shieldIndex];
          const expected = q.answer[(active.answerTyped || "").length]?.toLowerCase();
          if (char === expected) {
            active.answerTyped = (active.answerTyped || "") + printable;
            shootBullet(active);
            addCorrectKey();
            if (active.answerTyped.toLowerCase() === q.answer.toLowerCase()) {
              active.shieldIndex++;
              active.answerTyped = "";
              if (active.shieldIndex >= active.questions.length) {
                active.shield = false;
                active.typed = "";
              }
            }
          } else {
            addMissKey();
          }
        } else {
          const nextIdx = (active.typed || "").length;
          const expected = active.word[nextIdx]?.toLowerCase();
          if (char === expected) {
            active.typed = (active.typed || "") + printable;
            shootBullet(active);
            addCorrectKey();
            if (active.typed.toLowerCase() === active.word.toLowerCase()) finishEnemy(active);
          } else {
            addMissKey();
          }
        }
      }
    };

    const handleKeyUp = (e) => { keysPressed.current[e.key] = false; };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isPaused, gameOver, showTutorial]);

  // --- Main game loop ---
  useEffect(() => {
    if (!gameReady) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initStars(canvas, 150);
    };
    window.addEventListener("resize", resize);
    resize();

    let last = performance.now();

    const loop = (now) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;

      const running = !isPaused && !gameOver && !showTutorial;

      if (running) {
        const bossActive = enemiesRef.current.some(en => en.type === "boss" && !en.remove && !en.destroyed);

        if (!bossActive) {
          gameTimeRef.current += dt;
          spawnTimerRef.current += dt;
        }
        realTimeRef.current += dt;

        difficultyRef.current = Math.floor(gameTimeRef.current / 60) + 1;
        const speedMultiplier = 1 + (difficultyRef.current - 1) * 0.15;
        const maxEnemies = 5 + (difficultyRef.current - 1) * 2;

        const p = playerRef.current;
        const keys = keysPressed.current;
        if (keys["ArrowLeft"]) p.x -= p.speed * dt;
        if (keys["ArrowRight"]) p.x += p.speed * dt;
        if (keys["ArrowUp"]) p.y -= p.speed * dt;
        if (keys["ArrowDown"]) p.y += p.speed * dt;
        p.x = Math.max(10, Math.min(canvas.width - p.width - 10, p.x));
        p.y = Math.max(90, Math.min(canvas.height - 120, p.y));

        const activeCount = enemiesRef.current.filter(en => !en.remove && !en.destroyed).length;
        if (!bossActive && spawnTimerRef.current > 1.8 && activeCount < maxEnemies) {
          spawnTimerRef.current = 0;
          const enemiesToSpawn = getEnemiesByLevel(realTimeRef.current * 1000, bossStateRef.current);
          if (enemiesToSpawn.some(e => e.type === "boss")) targetEnemyRef.current = null;

          enemiesToSpawn.forEach((data) => {
            const en = spawnEnemy(canvas.width, data);
            if (en) {
              const laneHeight = 80;
              const maxLanes = Math.floor((canvas.height - 180) / laneHeight);
              const occupied = enemiesRef.current.filter(o => !o.remove && o.x > canvas.width - 400).map(o => o.lane);
              const available = Array.from({ length: maxLanes }, (_, i) => i).filter(i => !occupied.includes(i));
              en.lane = available.length > 0 ? available[Math.floor(Math.random() * available.length)] : 0;
              en.y = en.type === "boss" ? canvas.height / 2 - 40 : 120 + en.lane * laneHeight;
              if (en.type === "boss") targetEnemyRef.current = en;
              enemiesRef.current.push(en);
            }
          });
        }

        updateEnemies(enemiesRef.current, dt * speedMultiplier, canvas.width, p, updateLivesUI);
        enemiesRef.current = cleanupEnemies(enemiesRef.current);

        bulletsRef.current = bulletsRef.current.filter((b) => {
          if (!b.target || b.target.remove || b.target.destroyed) return false;
          const dx = b.target.x - b.x, dy = (b.target.y + 20) - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 20) return false;
          b.x += (dx / dist) * b.speed * dt;
          b.y += (dy / dist) * b.speed * dt;
          return true;
        });

        if (flashTimerRef.current > 0) {
          flashTimerRef.current = Math.max(0, flashTimerRef.current - dt);
        }

        // Sync HUD state at 5 Hz so React doesn't re-render every frame
        hudSyncTimerRef.current += dt;
        if (hudSyncTimerRef.current >= 0.2) {
          hudSyncTimerRef.current = 0;
          const minutes = realTimeRef.current / 60;
          const wpm = minutes > 0.01 ? Math.round((correctCharsRef.current / 5) / minutes) : 0;
          const acc = totalKeyAttemptsRef.current > 0
            ? Math.round((correctCharsRef.current / totalKeyAttemptsRef.current) * 100)
            : 100;
          const t = targetEnemyRef.current;
          const alive = t && !t.remove && !t.destroyed;
          const currentWord = alive
            ? (t.shield ? (t.questions[t.shieldIndex]?.answer || '') : (t.word || ''))
            : '';
          const typedSoFar = alive
            ? (t.shield ? (t.answerTyped || '') : (t.typed || ''))
            : '';
          setHud({
            score: scoreRef.current,
            lives: livesRef.current,
            combo: comboRef.current,
            multiplier: computeMultiplier(comboRef.current),
            wpm,
            accuracy: acc,
            bossesDefeated: bossesDefeatedRef.current,
            currentWord,
            typedSoFar,
          });
        }
      }

      // Render
      drawBackground(ctx, canvas);
      drawEnemies(ctx, enemiesRef.current, targetEnemyRef.current);
      ctx.fillStyle = "#FFC700"; // bullets — gold
      bulletsRef.current.forEach(b => {
        ctx.beginPath(); ctx.arc(b.x, b.y, 4, 0, Math.PI * 2); ctx.fill();
      });
      if (assetsRef.current.ship) {
        ctx.drawImage(
          assetsRef.current.ship,
          playerRef.current.x, playerRef.current.y,
          playerRef.current.width, playerRef.current.height
        );
      }

      // Pink vignette on miss / hit
      if (flashTimerRef.current > 0) {
        const alpha = (flashTimerRef.current / 0.35) * 0.5;
        const grad = ctx.createRadialGradient(
          canvas.width / 2, canvas.height / 2, canvas.width * 0.3,
          canvas.width / 2, canvas.height / 2, canvas.width * 0.7
        );
        grad.addColorStop(0, 'rgba(200,69,109,0)');
        grad.addColorStop(1, `rgba(200,69,109,${alpha})`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      animationRef.current = requestAnimationFrame(loop);
    };

    animationRef.current = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, [gameReady, isPaused, gameOver, showTutorial, initStars, drawBackground, updateLivesUI]);

  // --- Derived UI bits ---
  const heartsStr = '❤️ '.repeat(Math.max(0, hud.lives)) + '🖤 '.repeat(Math.max(0, 3 - hud.lives));
  const multiplierColor = hud.multiplier >= 3 ? PALETTE.pink : hud.multiplier >= 2 ? PALETTE.gold : PALETTE.salmon;

  return (
    <div style={{ position: "fixed", inset: 0, background: "#05050b", overflow: "hidden" }}>
      <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%" }} />

      {/* Top HUD */}
      <div style={{
        position: "absolute", top: 16, left: 16, right: 16,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        pointerEvents: "none", zIndex: 100,
        gap: 12, flexWrap: "wrap",
        fontFamily: FONT_STACK, color: PALETTE.cream,
      }}>
        <div style={{ ...panelStyle, display: "flex", gap: 18, alignItems: "center" }}>
          <span style={{ fontSize: 13, color: PALETTE.cream, opacity: 0.7, letterSpacing: 2 }}>SCORE</span>
          <span style={{ ...gradientText, fontSize: 24, fontWeight: 700, letterSpacing: 1 }}>
            {hud.score.toLocaleString()}
          </span>
          <span style={{ width: 1, height: 22, background: 'rgba(255,248,240,0.18)' }} />
          <span style={{ fontSize: 14, color: multiplierColor, letterSpacing: 1 }}>
            x{hud.multiplier.toFixed(1)} · {hud.combo}
          </span>
        </div>

        <div style={{ ...panelStyle, display: "flex", gap: 18, fontSize: 13, letterSpacing: 1 }}>
          <Stat label="WPM" value={hud.wpm} />
          <Stat label="ACC" value={`${hud.accuracy}%`} />
          <Stat label="BOSS" value={`${hud.bossesDefeated}/${MAX_BOSSES}`} />
        </div>

        <div style={{ ...panelStyle, fontSize: 20 }}>{heartsStr}</div>
      </div>

      {/* Subtle controls hint */}
      {!gameOver && !isPaused && !showTutorial && (
        <div style={{
          position: "absolute", bottom: 14, right: 18,
          fontFamily: FONT_STACK, fontSize: 11,
          color: 'rgba(255,248,240,0.5)', letterSpacing: 1.5,
          pointerEvents: "none", zIndex: 100,
        }}>
          ESC · PAUSE &nbsp;·&nbsp; TAB · SWITCH TARGET
        </div>
      )}

      {/* Bottom: current word being typed */}
      {hud.currentWord && !gameOver && (
        <div style={{
          position: "absolute", bottom: 42, left: "50%", transform: "translateX(-50%)",
          padding: "12px 26px",
          background: PALETTE.deepNavy,
          border: `2px solid ${PALETTE.pink}`,
          borderRadius: 10,
          boxShadow: `0 0 0 1px ${PALETTE.navy} inset, 0 8px 0 rgba(0,0,0,0.55)`,
          fontFamily: FONT_STACK, fontSize: 22,
          pointerEvents: "none", zIndex: 100,
          letterSpacing: 1.5,
          maxWidth: "80vw",
          overflow: "hidden",
          whiteSpace: "pre-wrap",
          textAlign: "center",
        }}>
          <span style={{ color: PALETTE.gold, fontWeight: 700 }}>{hud.typedSoFar}</span>
          <span style={{ color: PALETTE.cream, opacity: 0.7 }}>
            {hud.currentWord.slice(hud.typedSoFar.length)}
          </span>
        </div>
      )}

      {/* Pause overlay */}
      {isPaused && !gameOver && !showTutorial && (
        <div style={overlayStyle}>
          <div style={cardStyle}>
            <h1 style={{ ...gradientText, fontSize: "3rem", margin: 0, letterSpacing: 4 }}>PAUSED</h1>
            <p style={{ fontSize: 14, color: PALETTE.cream, opacity: 0.6, marginTop: 8, letterSpacing: 2 }}>
              PRESS ESC TO RESUME
            </p>
            <div style={{ marginTop: 22 }}>
              <button style={primaryBtn} onClick={() => setIsPaused(false)}>RESUME</button>
            </div>
          </div>
        </div>
      )}

      {/* Tutorial overlay */}
      {showTutorial && !gameOver && (
        <div style={overlayStyle}>
          <div style={{ ...cardStyle, maxWidth: 560 }}>
            <h1 style={{ ...gradientText, fontSize: "2.4rem", margin: 0, letterSpacing: 3 }}>
              GALAXY BRIEFING
            </h1>
            <div style={{
              color: PALETTE.cream,
              fontFamily: FONT_STACK, fontSize: 14, lineHeight: 2,
              marginTop: 22, textAlign: "left",
              letterSpacing: 1,
            }}>
              <KeyHint keys="↑ ↓ ← →" label="Move your ship" />
              <KeyHint keys="A — Z" label="Type to lock + fire" />
              <KeyHint keys="TAB" label="Switch target" />
              <KeyHint keys="ESC" label="Pause" />
              <div style={{
                marginTop: 18, padding: 12,
                background: 'rgba(255,199,0,0.08)',
                border: `1px solid ${PALETTE.gold}`, borderRadius: 6,
                color: PALETTE.gold, fontSize: 13,
              }}>
                Chain correct keys to climb the combo meter — up to <strong>x{MAX_MULTIPLIER}</strong> score multiplier.
              </div>
              <div style={{
                marginTop: 8, padding: 12,
                background: 'rgba(200,69,109,0.10)',
                border: `1px solid ${PALETTE.pink}`, borderRadius: 6,
                color: PALETTE.salmon, fontSize: 13,
              }}>
                A wrong key breaks your combo. Defeat <strong>{MAX_BOSSES}</strong> bosses to win.
              </div>
            </div>
            <div style={{ marginTop: 24 }}>
              <button style={primaryBtn} onClick={dismissTutorial}>LAUNCH</button>
            </div>
          </div>
        </div>
      )}

      {/* Game over overlay */}
      {gameOver && (
        <div style={overlayStyle}>
          <div style={{ ...cardStyle, borderColor: gameWon ? PALETTE.gold : PALETTE.pink }}>
            <h1 style={{
              ...gradientText, fontSize: "3rem", margin: 0, letterSpacing: 3,
            }}>
              {gameWon ? "MISSION ACCOMPLISHED" : "MISSION FAILED"}
            </h1>
            <p style={{
              fontSize: 13, color: PALETTE.cream, opacity: 0.6,
              margin: "10px 0 18px", letterSpacing: 2,
            }}>
              FINAL SCORE
            </p>
            <div style={{ ...gradientText, fontSize: "3.2rem", fontWeight: 800, lineHeight: 1 }}>
              {scoreRef.current.toLocaleString()}
            </div>
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(4, auto)",
              gap: 18, justifyContent: "center", alignItems: "center",
              fontFamily: FONT_STACK, color: PALETTE.cream, marginTop: 24,
              fontSize: 13, letterSpacing: 1.5,
            }}>
              <StatBlock label="WPM" value={hud.wpm} />
              <StatBlock label="ACCURACY" value={`${hud.accuracy}%`} />
              <StatBlock label="MAX COMBO" value={maxComboRef.current} />
              <StatBlock label="BOSSES" value={`${hud.bossesDefeated}/${MAX_BOSSES}`} />
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "center", marginTop: 28, flexWrap: "wrap" }}>
              {showSubmitButton && (
                isSubmitting ? <span style={{ color: PALETTE.cream, opacity: 0.7 }}>Submitting…</span>
                : submitMessage ? <span style={{ color: submitSuccess ? PALETTE.gold : PALETTE.pink }}>{submitMessage}</span>
                : <button onClick={handleSubmitScore} style={primaryBtn}>SUBMIT SCORE</button>
              )}
              <button onClick={restartGame} style={secondaryBtn}>REDEPLOY</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Design tokens (match LandingPage) ---
const PALETTE = {
  pink: '#C8456D',
  salmon: '#E78AAC',
  gold: '#FFC700',
  navy: '#1A1A2E',
  deepNavy: '#0A0A14',
  cream: '#FFF8F0',
};

const FONT_STACK = '"JetBrains Mono", Menlo, Monaco, Consolas, monospace';

const gradientText = {
  background: `linear-gradient(90deg, ${PALETTE.pink} 0%, ${PALETTE.salmon} 50%, ${PALETTE.gold} 100%)`,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  display: 'inline-block',
};

const panelStyle = {
  background: 'rgba(10,10,20,0.78)',
  border: `2px solid ${PALETTE.navy}`,
  borderRadius: 8,
  padding: '8px 14px',
  boxShadow: '0 4px 0 rgba(0,0,0,0.5)',
  color: PALETTE.cream,
};

const overlayStyle = {
  position: "absolute", inset: 0,
  background: "rgba(5,5,11,0.88)",
  backdropFilter: 'blur(2px)',
  display: "flex", alignItems: "center", justifyContent: "center",
  zIndex: 200, padding: 24,
};

const cardStyle = {
  background: PALETTE.deepNavy,
  border: `3px solid ${PALETTE.gold}`,
  borderRadius: 12,
  padding: '32px 36px',
  textAlign: 'center',
  color: PALETTE.cream,
  fontFamily: FONT_STACK,
  boxShadow: '0 10px 0 rgba(0,0,0,0.55), 0 0 0 2px rgba(255,199,0,0.18)',
  maxWidth: 520,
  width: '100%',
};

const primaryBtn = {
  padding: "12px 30px", fontSize: 14, cursor: "pointer", borderRadius: 8,
  background: `linear-gradient(180deg, ${PALETTE.pink} 0%, #A0345A 100%)`,
  color: PALETTE.cream, border: `2px solid ${PALETTE.navy}`,
  fontFamily: FONT_STACK, letterSpacing: 2, fontWeight: 700,
  boxShadow: '0 4px 0 rgba(0,0,0,0.5)',
};

const secondaryBtn = {
  padding: "12px 30px", fontSize: 14, cursor: "pointer", borderRadius: 8,
  background: 'transparent', color: PALETTE.gold, border: `2px solid ${PALETTE.gold}`,
  fontFamily: FONT_STACK, letterSpacing: 2, fontWeight: 700,
};

// --- Small presentational helpers ---
const Stat = ({ label, value }) => (
  <span>
    <span style={{ opacity: 0.6 }}>{label}</span>{' '}
    <strong style={{ color: PALETTE.gold }}>{value}</strong>
  </span>
);

const StatBlock = ({ label, value }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 80 }}>
    <span style={{ opacity: 0.55, fontSize: 11, letterSpacing: 1.5 }}>{label}</span>
    <strong style={{ color: PALETTE.gold, fontSize: 20, marginTop: 4 }}>{value}</strong>
  </div>
);

const KeyHint = ({ keys, label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
    <span style={{
      display: 'inline-block', minWidth: 90, padding: '4px 10px',
      background: PALETTE.navy, border: `1px solid ${PALETTE.gold}`,
      borderRadius: 4, color: PALETTE.gold, fontSize: 12,
      textAlign: 'center', letterSpacing: 1.5, fontWeight: 700,
    }}>
      {keys}
    </span>
    <span style={{ color: PALETTE.cream, opacity: 0.85 }}>{label}</span>
  </div>
);

export default GalaxyMainGame;
