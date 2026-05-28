import { useRef } from "react";

/**
 * useBackground
 * - initStars(canvas, count)
 * - drawBackground(ctx, canvas) -> call each frame
 */
export function useBackground() {
  const starsRef = useRef([]);

  function initStars(canvas, count = 150) {
    if (!canvas) return;
    starsRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 0.5,
      speed: 0.2 + Math.random() * 1.8,
      twinkle: Math.random(),
    }));
  }

  function drawBackground(ctx, canvas) {
    if (!ctx || !canvas) return;
    // clear
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // stars
    ctx.fillStyle = "white";
    starsRef.current.forEach((star) => {
      // simple twinkle
      star.twinkle += 0.02;
      const alpha = 0.6 + 0.4 * Math.sin(star.twinkle);
      ctx.globalAlpha = Math.max(0.2, Math.min(1, alpha));
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
      // move
      star.x -= star.speed;
      if (star.x < -5) {
        star.x = canvas.width + 5;
        star.y = Math.random() * canvas.height;
      }
    });
    ctx.globalAlpha = 1;
  }

  return { initStars, drawBackground, starsRef };
}