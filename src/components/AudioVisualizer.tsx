import React, { useEffect, useRef } from 'react';
import { VibeConfig, SessionState } from '../types';

interface Props {
  vibe: VibeConfig;
  state: SessionState;
  inputVolume: number;
  outputVolume: number;
  frequencyData: Uint8Array<ArrayBufferLike>;
}

export const AudioVisualizer: React.FC<Props> = ({
  vibe,
  state,
  inputVolume,
  outputVolume,
  frequencyData,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 360);
    let height = (canvas.height = 80);

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        width = canvas.width = entry.contentRect.width;
        height = canvas.height = entry.contentRect.height;
      }
    });

    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    const barCount = 36;
    const smoothBars = new Float32Array(barCount).fill(4);

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      const isLive = state === 'listening' || state === 'speaking';
      const activeVolume = state === 'speaking' ? outputVolume : inputVolume;

      const barWidth = Math.max(3, (width / barCount) * 0.55);
      const gap = (width - barWidth * barCount) / (barCount - 1);
      const centerY = height / 2;

      for (let i = 0; i < barCount; i++) {
        let targetHeight = 4;

        if (isLive) {
          // Map frequency data index symmetrically from center outward
          const centerDist = Math.abs(i - barCount / 2) / (barCount / 2);
          const dataIndex = Math.min(
            frequencyData.length - 1,
            Math.floor((1 - centerDist * 0.7) * (frequencyData.length * 0.7))
          );
          const freqVal = frequencyData[dataIndex] || 0;
          const energy = (freqVal / 255) * 0.75 + activeVolume * 0.75;
          targetHeight = Math.max(4, energy * (height * 0.85));
        } else if (state === 'connecting') {
          // Subtle breathing sine wave
          const t = performance.now() * 0.005;
          targetHeight = 6 + Math.sin(t + i * 0.3) * 6;
        } else {
          // Idle minimal pulse
          const t = performance.now() * 0.002;
          targetHeight = 3 + Math.sin(t + i * 0.15) * 2;
        }

        // Smooth interpolation (spring-like decay)
        smoothBars[i] += (targetHeight - smoothBars[i]) * 0.28;

        const x = i * (barWidth + gap);
        const barH = smoothBars[i];
        const y = centerY - barH / 2;

        // Gradient for bars
        const grad = ctx.createLinearGradient(0, y, 0, y + barH);
        if (state === 'speaking') {
          grad.addColorStop(0, vibe.accentColor);
          grad.addColorStop(0.5, vibe.primaryColor);
          grad.addColorStop(1, vibe.accentColor);
        } else if (state === 'listening') {
          grad.addColorStop(0, '#ffffff');
          grad.addColorStop(0.5, vibe.primaryColor);
          grad.addColorStop(1, vibe.primaryColor);
        } else {
          grad.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
          grad.addColorStop(1, 'rgba(255, 255, 255, 0.08)');
        }

        ctx.fillStyle = grad;
        ctx.beginPath();
        // Rounded bar ends
        const radius = barWidth / 2;
        ctx.roundRect(x, y, barWidth, Math.max(barWidth, barH), radius);
        ctx.fill();

        // Extra subtle glow highlight on top peaks when active
        if (isLive && barH > height * 0.45) {
          ctx.shadowColor = vibe.primaryColor;
          ctx.shadowBlur = 8;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(x + barWidth / 2, y, 1.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animId);
    };
  }, [vibe, state, inputVolume, outputVolume, frequencyData]);

  return (
    <div
      id="audio-waveform-container"
      className="w-full max-w-sm h-16 relative flex items-center justify-center pointer-events-none px-4"
    >
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
};
