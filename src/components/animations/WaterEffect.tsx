'use client';

import { useEffect, useRef } from 'react';

const SCALE = 4;       // simulate at 1/4 resolution
const DAMPING = 0.986; // wave energy loss per frame

export default function WaterEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Off-screen small canvas for wave rendering
    const small = document.createElement('canvas');
    const sCtx = small.getContext('2d');
    if (!sCtx) return;

    let W = 0, H = 0;
    let cur: Float32Array, prev: Float32Array;
    let imgData: ImageData;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      W = Math.ceil(window.innerWidth / SCALE) + 2;
      H = Math.ceil(window.innerHeight / SCALE) + 2;
      small.width = W;
      small.height = H;
      cur = new Float32Array(W * H);
      prev = new Float32Array(W * H);
      imgData = sCtx.createImageData(W, H);
    };
    resize();
    window.addEventListener('resize', resize);

    // Drop a disturbance into the wave grid
    const disturb = (px: number, py: number, amount: number, radius: number) => {
      const gx = Math.floor(px / SCALE) + 1;
      const gy = Math.floor(py / SCALE) + 1;
      const r = Math.ceil(radius / SCALE);
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const d2 = dx * dx + dy * dy;
          if (d2 > r * r) continue;
          const nx = gx + dx;
          const ny = gy + dy;
          if (nx >= 0 && nx < W && ny >= 0 && ny < H) {
            cur[ny * W + nx] += amount * (1 - Math.sqrt(d2) / r);
          }
        }
      }
    };

    let lastX = -1, lastY = -1;
    const onMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      const vel = lastX < 0 ? 45 : Math.min(Math.sqrt(dx * dx + dy * dy) * 1.6, 110);
      if (vel > 1) {
        disturb(e.clientX, e.clientY, vel, 24);
      }
      lastX = e.clientX;
      lastY = e.clientY;
    };
    window.addEventListener('mousemove', onMouseMove);

    let rafId: number;

    const tick = () => {
      // --- Wave simulation (2D wave equation) ---
      for (let y = 1; y < H - 1; y++) {
        for (let x = 1; x < W - 1; x++) {
          const i = y * W + x;
          // new = avg_of_4_neighbors * 2 - old  (exact 2D wave propagation)
          prev[i] = (cur[i - W] + cur[i + W] + cur[i - 1] + cur[i + 1]) * 0.5 - prev[i];
          prev[i] *= DAMPING;
        }
      }
      // Swap buffers
      const tmp = cur; cur = prev; prev = tmp;

      // --- Render wave height map to ImageData ---
      const d = imgData.data;
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const i = y * W + x;
          const h = cur[i];
          const pi = i * 4;

          if (Math.abs(h) < 0.35) {
            d[pi + 3] = 0;
            continue;
          }

          // Surface normal from gradient → specular highlight
          const gx2 = x > 0 && x < W - 1 ? cur[i + 1] - cur[i - 1] : 0;
          const gy2 = y > 0 && y < H - 1 ? cur[i + W] - cur[i - W] : 0;
          const dot = Math.max(0, 1 - gx2 * 0.05 - gy2 * 0.05);
          const specular = dot * dot * dot * dot * dot * dot; // pow 6

          // Soft teal-water color, warm peach specular
          d[pi]     = Math.min(255, Math.floor(115 + specular * 140)); // R
          d[pi + 1] = Math.min(255, Math.floor(168 + specular * 55));  // G
          d[pi + 2] = Math.min(255, Math.floor(188 + specular * 67));  // B
          d[pi + 3] = Math.min(65, Math.floor(Math.abs(h) * 1.9));     // A
        }
      }

      // Upload pixels to small canvas, then scale to full canvas
      sCtx.putImageData(imgData, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(small, 0, 0, canvas.width, canvas.height);

      rafId = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-50"
    />
  );
}
