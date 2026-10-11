import React, { useEffect, useRef } from 'react';
import { VibeConfig, SessionState } from '../types';

interface Props {
  vibe: VibeConfig;
  state: SessionState;
  audioIntensity: number;
}

export const FuturisticBackground: React.FC<Props> = ({ vibe, state, audioIntensity }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Particle nodes for futuristic cyber dust
    const particleCount = 45;
    const particles = Array.from({ length: particleCount }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 0.8,
      speedX: (Math.random() - 0.5) * 0.4,
      speedY: (Math.random() - 0.5) * 0.4,
      alpha: Math.random() * 0.5 + 0.2,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Subtle cyber grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.lineWidth = 1;
      const gridSize = 60;

      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw floating digital dust
      const energyMultiplier = state === 'speaking' || state === 'listening' ? 1 + audioIntensity * 2 : 1;

      particles.forEach((p) => {
        p.x += p.speedX * energyMultiplier;
        p.y += p.speedY * energyMultiplier;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.fillStyle = vibe.primaryColor;
        ctx.globalAlpha = Math.min(1, p.alpha * (0.4 + audioIntensity * 0.6));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 + audioIntensity * 0.8), 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.globalAlpha = 1;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [vibe, state, audioIntensity]);

  return (
    <div
      id="futuristic-background-container"
      className="fixed inset-0 pointer-events-none transition-all duration-1000 ease-out overflow-hidden"
      style={{
        background: vibe.bgGradient,
      }}
    >
      {/* Background canvas for grid & particles */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Atmospheric ambient neon glow orbs */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] rounded-full blur-[140px] pointer-events-none transition-all duration-700 opacity-60"
        style={{
          background: vibe.primaryColor,
          transform: `translate(-50%, -50%) scale(${1 + audioIntensity * 0.5})`,
          opacity: state === 'disconnected' ? 0.25 : 0.45 + audioIntensity * 0.35,
        }}
      />
      <div
        className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-[380px] h-[380px] rounded-full blur-[160px] pointer-events-none transition-all duration-700 opacity-40"
        style={{
          background: vibe.accentColor,
          transform: `translate(-50%, 50%) scale(${1 + audioIntensity * 0.4})`,
        }}
      />

      {/* Radial vignette overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.7)_100%)] pointer-events-none" />
    </div>
  );
};
