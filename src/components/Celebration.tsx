"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Full-screen confetti burst for a pass, with no dependencies. Fires once on
 * mount, runs for ~5s, then removes itself. Skipped when the user prefers
 * reduced motion.
 */
export function Celebration() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      canvas.style.display = "none";
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const colors = ["#5b3df5", "#8b74ff", "#c99e3b", "#f5c542", "#15803d", "#ffffff", "#ff6b9d"];
    type P = {
      x: number; y: number; vx: number; vy: number; w: number; h: number;
      rot: number; vr: number; color: string; shape: 0 | 1 | 2; life: number;
    };
    const parts: P[] = [];
    const W = () => window.innerWidth;
    const H = () => window.innerHeight;

    const burst = (x: number, y: number, n: number, spread: number, power: number) => {
      for (let i = 0; i < n; i++) {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * spread;
        const speed = power * (0.5 + Math.random());
        parts.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          w: 6 + Math.random() * 6,
          h: 4 + Math.random() * 8,
          rot: Math.random() * Math.PI,
          vr: (Math.random() - 0.5) * 0.3,
          color: colors[(Math.random() * colors.length) | 0],
          shape: ((Math.random() * 3) | 0) as 0 | 1 | 2,
          life: 1,
        });
      }
    };

    // Opening salvo from both bottom corners, then a shower from the top.
    burst(W() * 0.1, H(), 90, 1.1, 22);
    burst(W() * 0.9, H(), 90, 1.1, 22);
    const timers = [
      setTimeout(() => burst(W() / 2, H() * 0.35, 120, Math.PI * 2, 10), 350),
      setTimeout(() => burst(W() * 0.25, -10, 60, 0.6, 3), 900),
      setTimeout(() => burst(W() * 0.75, -10, 60, 0.6, 3), 1200),
      setTimeout(() => burst(W() * 0.5, -10, 80, 0.8, 3), 1600),
    ];

    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = (now - start) / 1000;
      ctx.clearRect(0, 0, W(), H());
      for (const p of parts) {
        p.vy += 0.35; // gravity
        p.vx *= 0.99;
        p.vy *= 0.985;
        p.x += p.vx + Math.sin(now / 200 + p.rot) * 0.6; // flutter
        p.y += p.vy;
        p.rot += p.vr;
        if (t > 3.5) p.life -= 0.02;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        if (p.shape === 0) ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        else if (p.shape === 1) {
          ctx.beginPath(); ctx.arc(0, 0, p.w / 2.5, 0, Math.PI * 2); ctx.fill();
        } else {
          ctx.beginPath(); ctx.moveTo(0, -p.h / 2); ctx.lineTo(p.w / 2, p.h / 2); ctx.lineTo(-p.w / 2, p.h / 2); ctx.closePath(); ctx.fill();
        }
        ctx.restore();
      }
      if (t < 5.5) raf = requestAnimationFrame(tick);
      else setDone(true);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
      window.removeEventListener("resize", resize);
    };
  }, []);

  if (done) return null;
  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-50"
    />
  );
}
