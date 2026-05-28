// GalaxyEnemy.js
import { getEnemiesByLevel } from "./GalaxyLibrary";

export function spawnEnemy(canvasWidth, enemyData) {
  if (!enemyData) return null;

  return {
    ...enemyData,
    x: canvasWidth + 100,
    y: 0,
    lane: null,
    typed: "",
    shieldIndex: 0,
    answerTyped: "",
    shield: Array.isArray(enemyData.questions) && enemyData.questions.length > 0,
    destroyed: false,
    remove: false,
    hitPlayer: false,
    collapseTimer: 0,
    speed: enemyData.speed || 150,
  };
}

export function updateEnemies(enemies, dt, canvasWidth, playerPos, onHitPlayer) {
  for (let e of enemies) {
    if (e.remove) continue;

    // --- 1. COLLAPSE STATE ---
    if (e.hitPlayer) {
      e.collapseTimer += dt;
      if (e.collapseTimer > 0.4) e.remove = true;
      continue;
    }

    // --- 2. MOVEMENT ---
    e.x -= e.speed * dt;

    const playerCenterY = playerPos.y + playerPos.height / 2;
    if (e.baseY === undefined) e.baseY = e.y;

    // Tracking logic
    const FAR_ZONE = canvasWidth * 0.6;
    const MID_ZONE = canvasWidth * 0.4;
    const MAX_OFFSET = 30;
    let targetY = e.baseY;

    if (e.x < FAR_ZONE && e.x > MID_ZONE) {
      const diff = playerCenterY - e.baseY;
      targetY = e.baseY + Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, diff));
    } else if (e.x <= MID_ZONE) {
      const diff = playerCenterY - e.baseY;
      targetY = e.baseY + Math.max(-MAX_OFFSET * 1.5, Math.min(MAX_OFFSET * 1.5, diff));
    }

    const smoothFactor = 0.08;
    e.y += (targetY - e.y) * smoothFactor;

    // --- 3. COLLISION DETECTION ---
    const shipBox = {
      left: playerPos.x + 10,
      right: playerPos.x + playerPos.width - 10,
      top: playerPos.y + 10,
      bottom: playerPos.y + playerPos.height - 10
    };

    const enemyWidth = (e.word ? e.word.length * 10 : 60); 

    const isTouching = (
      e.x < shipBox.right &&
      e.x + enemyWidth > shipBox.left &&
      e.y < shipBox.bottom &&
      e.y + 10 > shipBox.top
    );

    if (isTouching && !e.hitPlayer && !e.destroyed) {
      e.hitPlayer = true;
      e.collapseTimer = 0;
      onHitPlayer(); 
    }

    if (e.x < -400) e.remove = true;
  }
  return enemies;
}

// --- Palette (matches GalaxyMainGame / LandingPage) ---
const C_TYPED = "#FFC700";     // gold — already-typed chars
const C_REMAIN = "#FFF8F0";    // cream — untyped chars
const C_DESTROYED = "#C8456D"; // pink — kill-flash
const C_TARGET = "#FFC700";    // gold — target bracket
const C_QUESTION = "#E78AAC";  // salmon — shield prompt
const C_PLACEHOLDER = "#C8456D"; // pink — answer underscores
const FONT_FAMILY = '"JetBrains Mono", Menlo, Monaco, Consolas, monospace';

export function drawEnemies(ctx, enemies, targetEnemy) {
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";

  enemies.forEach((e) => {
    if (e.remove) return;

    // --- 1. SHIELD PHASE ---
    if (e.shield && e.questions && e.questions[e.shieldIndex]) {
      const q = e.questions[e.shieldIndex];
      ctx.font = `bold 20px ${FONT_FAMILY}`;
      ctx.fillStyle = C_QUESTION;
      ctx.fillText(`QUESTION: ${q.prompt}`, e.x, e.y - 40);

      const typedPart = e.answerTyped || "";
      const remaining = q.answer.slice(typedPart.length);

      ctx.font = `bold 24px ${FONT_FAMILY}`;
      ctx.fillStyle = C_TYPED;
      ctx.fillText(typedPart, e.x, e.y);
      ctx.fillStyle = C_PLACEHOLDER;
      ctx.fillText("_ ".repeat(remaining.length), e.x + ctx.measureText(typedPart).width, e.y);

      ctx.strokeStyle = "rgba(231,138,172,0.55)"; // salmon outline
      ctx.lineWidth = 2;
      ctx.strokeRect(e.x - 10, e.y - 60, 400, 100);
    }
    // --- 2. WORD PHASE ---
    else {
      const isBoss = e.type === "boss";
      const typedTotal = e.typed || "";

      if (isBoss) {
        ctx.font = `bold 22px ${FONT_FAMILY}`;
        const lines = e.word.split("\n");
        const lineHeight = 28;
        let processedChars = 0;

        lines.forEach((line, i) => {
          const y = e.y + (i * lineHeight);
          const charsInLine = line.length;
          const typedInLineCount = Math.max(0, Math.min(charsInLine, typedTotal.length - processedChars));
          const typedPart = line.slice(0, typedInLineCount);
          const remainingPart = line.slice(typedInLineCount);

          ctx.fillStyle = C_TYPED;
          ctx.fillText(typedPart, e.x, y);
          ctx.fillStyle = e.destroyed ? C_DESTROYED : C_REMAIN;
          ctx.fillText(remainingPart, e.x + ctx.measureText(typedPart).width, y);

          processedChars += charsInLine + 1;
        });
      } else {
        ctx.font = `bold 18px ${FONT_FAMILY}`;
        const typedPart = e.typed || "";
        const remainingPart = e.word.slice(typedPart.length);

        ctx.fillStyle = C_TYPED;
        ctx.fillText(typedPart, e.x, e.y);
        ctx.fillStyle = e.destroyed ? C_DESTROYED : C_REMAIN;
        ctx.fillText(remainingPart, e.x + ctx.measureText(typedPart).width, e.y);
      }
    }

    // --- 3. TARGETING BRACKETS ---
    if (e === targetEnemy && !e.destroyed) {
      ctx.strokeStyle = C_TARGET;
      ctx.lineWidth = 2;
      const h = e.type === "boss" ? 150 : 60;
      ctx.strokeRect(e.x - 15, e.y - 30, 450, h);
    }
  });
}

export function cleanupEnemies(enemies) {
  return enemies.filter((e) => !e.remove);
}
