import { useRef } from "react";

export function usePlayer() {
  const player = useRef({
    x: 100,
    y: 100,
    width: 100,   // size of the sprite
    height: 100,
    speed: 5,
  }).current;

  const playerImgRef = useRef(null);

  // Load sprite once
  if (!playerImgRef.current) {
    const img = new Image();
    img.src = "/images/nightraider.png"; // put sprite inside public/images/
    playerImgRef.current = img;
  }

  const updatePlayer = (canvas, keysPressed) => {
    // --- Movement ---
    if (keysPressed["ArrowUp"]) player.y -= player.speed;
    if (keysPressed["ArrowDown"]) player.y += player.speed;
    if (keysPressed["ArrowLeft"]) player.x -= player.speed;
    if (keysPressed["ArrowRight"]) player.x += player.speed;

    // --- Clamp inside canvas ---
    if (player.x < 0) player.x = 0;
    if (player.y < 0) player.y = 0;
    if (player.x + player.width > canvas.width)
      player.x = canvas.width - player.width;
    if (player.y + player.height > canvas.height)
      player.y = canvas.height - player.height;
  };

  const drawPlayer = (ctx) => {
    if (playerImgRef.current && playerImgRef.current.complete) {
      ctx.drawImage(
        playerImgRef.current,
        player.x,
        player.y,
        player.width,
        player.height
      );
    } else {
      // fallback: draw a rectangle if image not yet loaded
      ctx.fillStyle = "blue";
      ctx.fillRect(player.x, player.y, player.width, player.height);
    }
  };

  const resetPlayer = () => {
    player.x = 100;
    player.y = 100;
  };

  return { player, updatePlayer, drawPlayer, resetPlayer };
}
