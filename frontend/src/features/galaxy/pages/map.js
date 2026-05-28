// map.js
import { useRef } from "react";

export function useMap() {
  const zonesCapturedRef = useRef(0);

  const updateMap = (ctx, player, level) => {
    ctx.fillStyle = "white";
    ctx.font = "16px Arial";
    ctx.fillText(`Zones Captured: ${zonesCapturedRef.current}`, 20, 30);

    ctx.fillStyle = "lime";
    ctx.fillText(`Lives: ${player.lives}/${player.maxLives}`, 20, 55);

    ctx.fillStyle = "cyan";
    ctx.fillText(`Level: ${level}`, 20, 80);
  };

  const captureZone = () => {
    zonesCapturedRef.current++;
  };

  return { updateMap, captureZone, zonesCapturedRef };
}
