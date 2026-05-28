import React, { useState, useEffect } from "react";

export default function CodeWormBattle({ onNext }) {
  const [loading, setLoading] = useState(true);
  const [enemyHP, setEnemyHP] = useState(50);
  const [playerHP, setPlayerHP] = useState(40);
  const [assembled, setAssembled] = useState([]);
  const [feedback, setFeedback] = useState("");
  const [flash, setFlash] = useState(false);
  const [playerAnimation, setPlayerAnimation] = useState("idle");
  const [enemyAnimation, setEnemyAnimation] = useState("idle");
  const [playerHit, setPlayerHit] = useState(false);
  const [enemyHit, setEnemyHit] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

  // ✅ PRELOAD ASSETS
  const preloadAssets = async () => {
    const assets = [
      "/images/idleedit2.png",
      "/images/spriteedit.gif",
      "/images/idledamage.png",
      "/images/enemy_idle(1).png",
      "/images/enemy_idle(damage).png",
      "/images/enemyattack.gif",
    ];

    const promises = assets.map((src) => {
      return new Promise((resolve) => {
        const ext = src.split(".").pop();

        if (ext === "webm") {
          const video = document.createElement("video");
          video.src = src;
          video.onloadeddata = resolve;
        } else {
          const img = new Image();
          img.src = src;
          img.onload = resolve;
        }
      });
    });

    await Promise.all(promises);
  };

  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const validFunctions = [
  [
    ["void special attack", "(", "Player player", ",", "Enemy enemy", ")", "{"],
    ["int dmg = rand() % 6 + 5;"],
    ["if (player.weapon) {", "dmg += player.weapon.power * 2;}"],
    ["enemy.hp -= dmg;"],
    ["if (enemy.hp <= 0) {"],
    ['printf("Enemy defeated!\\n"); }'],
  
    ["return dmg;"],
    ["}"],
    {
      hint: "Start with a function declaration, calculate damage, check weapon, subtract from enemy, return damage."
    }
  ],
  [
    ["void doubleStrike", "(", "Player player", ",", "Enemy enemy", ")"],
    ["{"],
    ["int dmg1 = rand() % 4 + 3;"],
    ["int dmg2 = rand() % 4 + 3;"],
    ["enemy.hp -= (dmg1 + dmg2);"],
    ['printf("Double strike dealt %d damage!\\n", dmg1 + dmg2);'],
    ["return;"],
    ["}"],
    {
      hint: "Declare function, compute two damage values, combine them, apply to enemy, return."
    }
  ],
  [
    ["void attack", "(", "Player player", ")"],
    ["{"],
    ["int dmgAmount = rand() % 10 + 5;"],
    ["player.hp += dmgAmount;"],
    ['printf("Player attacks for %d damage\\n", dmgAmount);'],
    ["return;"],
    ["}"],
    {
      hint: "Start function, compute value, apply to player, optionally print result, return."
    }
  ],
];
const [currentFunction, setCurrentFunction] = useState({
  blocks: [],
  hint: ""
});
  const [bank, setBank] = useState([]);

const generateNewFunction = () => {
  const func = validFunctions[Math.floor(Math.random() * validFunctions.length)];

  // ✅ Separate hint from code blocks
  const hintObj = func.find(item => !Array.isArray(item));
  const codeBlocks = func.filter(item => Array.isArray(item));

  setCurrentFunction({
    blocks: codeBlocks,
    hint: hintObj?.hint || ""
  });

  // ✅ Flatten ONLY arrays (no objects)
  setBank(shuffleArray(codeBlocks.flat()));
  setAssembled([]);
};

  // ✅ INIT WITH LOADING
  useEffect(() => {
    const init = async () => {
      await Promise.all([
        preloadAssets(),
        new Promise((res) => setTimeout(res, 500)),
      ]);

      generateNewFunction();
      setLoading(false);
    };

    init();
  }, []);

  const handleAddBlock = (block) => {
    if (gameOver) return;
    setAssembled((prev) => [...prev, block]);
  };

  const handleRemoveBlock = (index) => {
    if (gameOver) return;
    setAssembled((prev) => prev.filter((_, i) => i !== index));
  };

const isValidAssembly = (blocks) => {
  const flatFunc = currentFunction.blocks.flat(); // ✅ correct

  if (blocks.length !== flatFunc.length) return false;
  return blocks.every((b, i) => b === flatFunc[i]);
};

  const handleAttack = async () => {
    if (gameOver) return;

    if (!assembled.length) {
      setFeedback("❌ No code assembled!");
      return;
    }

    const valid = isValidAssembly(assembled);

    if (!valid) {
      setFeedback("❌ Incorrect function! No attack!");
      setAssembled([]);
      return;
    }

    const dmg = assembled.length * 2;
    setFeedback(`⚔️ Function correct! Damage: ${dmg}`);
    setFlash(true);
    setTimeout(() => setFlash(false), 500);

    setPlayerAnimation("attack");
    await sleep(1200);
    setPlayerAnimation("idle");

    setEnemyHit(true);
    let nextEnemyHP;
    setEnemyHP((hp) => {
      nextEnemyHP = Math.max(0, hp - dmg);
      return nextEnemyHP;
    });
    await sleep(600);
    setEnemyHit(false);

    if (nextEnemyHP <= 0) {
      setFeedback(`💥 Enemy defeated! Damage dealt: ${dmg}`);
      setGameOver(true);
      if (onNext) onNext(dmg);
      return;
    }

    const enemyDmg = Math.floor(Math.random() * 6) + 3;
    setFeedback("🐛 Enemy counterattacks!");

    setEnemyAnimation("attack");
    await sleep(1200);
    setEnemyAnimation("idle");

    setPlayerHit(true);
    let nextPlayerHP;
    setPlayerHP((hp) => {
      nextPlayerHP = Math.max(0, hp - enemyDmg);
      return nextPlayerHP;
    });
    await sleep(400);
    setPlayerHit(false);

    if (nextPlayerHP <= 0) {
      setFeedback("💀 You were defeated!");
      setGameOver(true);
      return;
    }

    setFeedback(`⚔️ Turn complete! You dealt ${dmg}, enemy dealt ${enemyDmg}.`);
    generateNewFunction();
  };

  const getPlayerSprite = () =>
    playerAnimation === "idle"
      ? "/images/idleedit2.png"
      : "/images/spriteedit.gif";

  const getEnemySprite = () =>
    enemyAnimation === "idle"
      ? "/images/enemy_idle(1).png"
      : "/images/enemyattack.gif";

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 50 }}>
        <h2>🐛 Loading Battle...</h2>
        <p>Preparing assets...</p>
      </div>
    );
  }

  const HPBar = ({ hp, maxHp }) => {
    const percent = Math.max(0, (hp / maxHp) * 100);

    return (
      <div style={{ width: 120 }}>
        <div
          style={{
            width: "100%",
            height: 10,
            background: "#444",
            borderRadius: 5,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${percent}%`,
              height: "100%",
              background:
                percent > 60
                  ? "#4caf50"
                  : percent > 30
                  ? "#ff9800"
                  : "#f44336",
              transition: "width 0.3s ease",
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>🐛 CodeWorm Battle</h2>
      <h4>{feedback || "Assemble the function blocks correctly to attack!"}</h4>

      <div
        style={{
          position: "relative",
           width: "100%",
          maxWidth: 600,
          height: 350,
          margin: "0 auto 20px",
          border: "2px solid #333",
          borderRadius: 12,
          background: "#414041",
          overflow: "hidden",
        }}
      >
        {/* PLAYER */}
        <div style={{ position: "absolute", bottom: 10, left: "30%" }}>
          <div style={{ position: "relative", width: 250, height: 250 }}>
             <div style={{ position: "absolute",  left: 0,  }}>
            <HPBar hp={playerHP} maxHp={40} />
          </div>
                <img src={getPlayerSprite()} width={250} height={250} alt="player" />
    {playerHit && (
      <img
        src="/images/idledamage.png"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
        }}
        alt=""
      />
    )}
            
          </div>

         
        </div>

       {/* ENEMY */}
<div style={{ position: "absolute", bottom: 3, right: "25%" }}>
  <div style={{ position: "relative", width: 250, height: 250 }}>
    <div style={{ position: "absolute", top: -7,  right: 0 }}>
    <HPBar hp={enemyHP} maxHp={50} />
  </div>
    <img src={getEnemySprite()} width={250} height={250} alt="enemy" />
    {enemyHit && (
      <img
        src="/images/enemy_idle(damage).png"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
        }}
        alt=""
      />
    )}
  </div>

  {/* Move this HP bar to bottom-right */}
  
</div>
</div>
{currentFunction.hint && (
  <div style={{
    marginBottom: 10,
    padding: "6px 12px",
    background: "#ffe082",
    borderRadius: 6,
    color: "#333",
    fontWeight: "bold",
    fontFamily: "monospace",
    fontSize: 14
  }}>
    💡 Hint: {currentFunction.hint}
  </div>
)}


      {/* Assembled */}
      <div
        style={{
          minHeight: 50,
          border: "2px dashed #ccc",
          padding: 10,
          marginBottom: 16,
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          boxShadow: flash ? "0 0 20px 5px #4caf50" : "none",
          transition: "0.2s",
        }}
      >
        {assembled.map((block, i) => (
          <div
            key={i}
            onClick={() => handleRemoveBlock(i)}
            style={{
              padding: "6px 12px",
              borderRadius: 4,
              cursor: gameOver ? "not-allowed" : "pointer",
              fontFamily: "monospace",
              background: "#0c5b0bff",
              color: "white",
            }}
          >
            {block}
          </div>
        ))}
      </div>

      {/* Bank */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          padding: 10,
          background: "#eee",
          borderRadius: 8,
        }}
      >
        {bank.map((block, i) => (
          <div
            key={i}
            onClick={() => handleAddBlock(block)}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: "1px solid #333",
              background: "#0c5b0bff",
              color: "white",
              fontFamily: "monospace",
              cursor: gameOver ? "not-allowed" : "pointer",
            }}
          >
            {block}
          </div>
        ))}
      </div>

      <button
        onClick={handleAttack}
        disabled={gameOver}
        style={{
          marginTop: 16,
          padding: "8px 16px",
          background: "#4caf50",
          color: "#fff",
          borderRadius: 6,
          border: "none",
          cursor: gameOver ? "not-allowed" : "pointer",
        }}
      >
        ⚔️ Attack!
      </button>
    </div>
  );
}
