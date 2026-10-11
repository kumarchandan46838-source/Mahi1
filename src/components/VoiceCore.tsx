import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, Power, Loader2, Sparkles } from 'lucide-react';
import { VibeConfig, SessionState } from '../types';

interface Props {
  vibe: VibeConfig;
  state: SessionState;
  isMuted: boolean;
  audioVolume: number; // 0.0 - 1.0 (mic volume when listening, model volume when speaking)
  frequencyData?: Uint8Array<ArrayBufferLike>;
  onToggleConnect: () => void;
  onInterrupt: () => void;
}

export const VoiceCore: React.FC<Props> = ({
  vibe,
  state,
  isMuted,
  audioVolume,
  frequencyData,
  onToggleConnect,
  onInterrupt,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isConnected = state === 'listening' || state === 'speaking' || state === 'processing';
  const isSpeaking = state === 'speaking';
  const isListening = state === 'listening';
  const isConnecting = state === 'connecting';

  // Compact, controlled scale factor so the orb never blows up or distorts the screen
  const scaleBoost = 1 + Math.min(0.14, audioVolume * 0.28);

  // 60FPS Organic Luminous Plasma Canvas inside the Sphere
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const size = 180;
    canvas.width = size;
    canvas.height = size;
    const center = size / 2;
    const radius = size * 0.46;

    let phase = 0;
    const particles: Array<{
      angle: number;
      distance: number;
      speed: number;
      size: number;
      opacity: number;
    }> = [];

    // Initialize 24 organic micro-plasma particles inside the core
    for (let i = 0; i < 24; i++) {
      particles.push({
        angle: Math.random() * Math.PI * 2,
        distance: Math.random() * (radius * 0.8),
        speed: (Math.random() * 0.015 + 0.005) * (Math.random() > 0.5 ? 1 : -1),
        size: Math.random() * 2.2 + 0.8,
        opacity: Math.random() * 0.7 + 0.3,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, size, size);

      const isLive = isSpeaking || isListening;
      const energy = isLive ? Math.max(0.15, audioVolume) : isConnecting ? 0.4 : 0.08;
      const speedMultiplier = isSpeaking ? 0.045 : isListening ? 0.03 : isConnecting ? 0.025 : 0.008;
      phase += speedMultiplier * (1 + energy * 2);

      // Clip canvas to the exact spherical circle for realistic optical containment
      ctx.save();
      ctx.beginPath();
      ctx.arc(center, center, radius, 0, Math.PI * 2);
      ctx.clip();

      // 1. Deep Celestial Base Nebula Gradient
      const baseGrad = ctx.createRadialGradient(
        center * 0.9,
        center * 0.85,
        radius * 0.05,
        center,
        center,
        radius
      );
      if (isConnected) {
        baseGrad.addColorStop(0, vibe.accentColor + '55');
        baseGrad.addColorStop(0.4, '#140c26');
        baseGrad.addColorStop(0.85, '#070312');
        baseGrad.addColorStop(1, '#020108');
      } else {
        baseGrad.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
        baseGrad.addColorStop(0.5, '#0e0b16');
        baseGrad.addColorStop(1, '#040207');
      }
      ctx.fillStyle = baseGrad;
      ctx.fillRect(0, 0, size, size);

      // 2. Multi-layered Harmonic Organic Plasma Waves (Deforming with real audio FFT)
      const waveLayers = isConnected ? 3 : 1;
      for (let layer = 0; layer < waveLayers; layer++) {
        ctx.beginPath();
        const layerPhase = phase * (1 + layer * 0.4) + layer * (Math.PI / 3);
        const layerRadius = radius * (0.35 + layer * 0.2 + energy * 0.18);
        const points = 32;

        for (let i = 0; i <= points; i++) {
          const angle = (i / points) * Math.PI * 2;
          // Harmonic wave distortion
          let waveDisp = Math.sin(angle * 3 + layerPhase) * (4 + energy * 12);
          waveDisp += Math.cos(angle * 5 - layerPhase * 1.3) * (2 + energy * 8);

          // If real frequency data exists, sample audio spectrum
          if (frequencyData && frequencyData.length > 0 && isLive) {
            const freqIndex = Math.min(
              frequencyData.length - 1,
              Math.floor((i / points) * (frequencyData.length * 0.6))
            );
            const freqVal = frequencyData[freqIndex] / 255;
            waveDisp += freqVal * 14 * energy;
          }

          const r = Math.max(8, layerRadius + waveDisp);
          const x = center + Math.cos(angle) * r;
          const y = center + Math.sin(angle) * r;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.closePath();

        const plasmaGrad = ctx.createRadialGradient(
          center,
          center,
          0,
          center,
          center,
          radius
        );
        if (layer === 0) {
          plasmaGrad.addColorStop(0, vibe.primaryColor + (isSpeaking ? 'cc' : '99'));
          plasmaGrad.addColorStop(0.6, vibe.accentColor + '55');
          plasmaGrad.addColorStop(1, 'transparent');
        } else if (layer === 1) {
          plasmaGrad.addColorStop(0, '#ffffff66');
          plasmaGrad.addColorStop(0.5, vibe.primaryColor + '44');
          plasmaGrad.addColorStop(1, 'transparent');
        } else {
          plasmaGrad.addColorStop(0.3, vibe.accentColor + '44');
          plasmaGrad.addColorStop(0.8, vibe.primaryColor + '22');
          plasmaGrad.addColorStop(1, 'transparent');
        }

        ctx.fillStyle = plasmaGrad;
        ctx.fill();
      }

      // 3. Floating Bioluminescent Micro-Particles
      if (isConnected) {
        for (const p of particles) {
          p.angle += p.speed * (1 + energy * 1.8);
          const currentDist = p.distance * (0.85 + Math.sin(phase + p.angle) * 0.15);
          const px = center + Math.cos(p.angle) * currentDist;
          const py = center + Math.sin(p.angle) * currentDist;

          ctx.beginPath();
          ctx.arc(px, py, p.size * (1 + energy * 0.5), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity * (0.4 + energy * 0.6)})`;
          ctx.shadowColor = vibe.primaryColor;
          ctx.shadowBlur = 6;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      // 4. Photorealistic 3D Glass Specular Reflection & Caustic Rim
      // Top-left curved optical glare (gives instant glass sphere illusion)
      const specularGrad = ctx.createRadialGradient(
        center * 0.62,
        center * 0.48,
        1,
        center * 0.62,
        center * 0.48,
        radius * 0.65
      );
      specularGrad.addColorStop(0, 'rgba(255, 255, 255, 0.78)');
      specularGrad.addColorStop(0.25, 'rgba(255, 255, 255, 0.28)');
      specularGrad.addColorStop(0.6, 'rgba(255, 255, 255, 0.04)');
      specularGrad.addColorStop(1, 'transparent');

      ctx.save();
      ctx.beginPath();
      // Elliptical top glare
      ctx.ellipse(
        center * 0.72,
        center * 0.55,
        radius * 0.45,
        radius * 0.24,
        -Math.PI / 4,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = specularGrad;
      ctx.fill();
      ctx.restore();

      // Bottom ambient bounce light (counter-illumination for spherical curvature)
      const bounceGrad = ctx.createRadialGradient(
        center,
        center + radius * 0.8,
        1,
        center,
        center + radius * 0.8,
        radius * 0.5
      );
      bounceGrad.addColorStop(0, vibe.accentColor + '33');
      bounceGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = bounceGrad;
      ctx.beginPath();
      ctx.arc(center, center + radius * 0.5, radius * 0.5, 0, Math.PI * 2);
      ctx.fill();

      // Sub-surface optical caustic rim
      ctx.beginPath();
      ctx.arc(center, center, radius - 1, 0, Math.PI * 2);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = isConnected
        ? `${vibe.primaryColor}88`
        : 'rgba(255, 255, 255, 0.15)';
      ctx.stroke();

      ctx.restore(); // End clipping

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [vibe, isConnected, isSpeaking, isListening, isConnecting, audioVolume, frequencyData]);

  const handleClick = () => {
    if (isSpeaking) {
      onInterrupt();
    } else {
      onToggleConnect();
    }
  };

  return (
    <div
      id="voice-core-container"
      className="relative flex flex-col items-center justify-center select-none"
    >
      {/* Organic Volumetric Atmospheric Glow (Realistic Soft Aura) */}
      <AnimatePresence>
        {isConnected && (
          <>
            {/* Primary Soft Ambient Corona */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{
                opacity: isSpeaking ? [0.45, 0.75, 0.45] : [0.3, 0.5, 0.3],
                scale: [scaleBoost * 0.98, scaleBoost * 1.08, scaleBoost * 0.98],
              }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{
                duration: isSpeaking ? 1.4 : 2.6,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute w-44 h-44 sm:w-48 sm:h-48 rounded-full pointer-events-none filter blur-xl"
              style={{
                background: `radial-gradient(circle, ${vibe.glowColor} 0%, ${vibe.primaryColor}33 50%, transparent 75%)`,
              }}
            />

            {/* Micro harmonic ring pulse */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{
                opacity: [0.2, 0.45, 0.2],
                scale: [scaleBoost * 1.05, scaleBoost * 1.16, scaleBoost * 1.05],
              }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{
                duration: isSpeaking ? 1.8 : 3.2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute w-48 h-48 sm:w-52 sm:h-52 rounded-full pointer-events-none"
              style={{
                border: `1px solid ${vibe.primaryColor}44`,
                boxShadow: `0 0 25px ${vibe.glowColor}33`,
              }}
            />
          </>
        )}
      </AnimatePresence>

      {/* Main Realistic Interactive Spherical Core */}
      <motion.button
        id="voice-core-button"
        onClick={handleClick}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        animate={{
          scale: isConnected ? scaleBoost : 1,
        }}
        transition={{ type: 'spring', stiffness: 380, damping: 26 }}
        className="relative w-36 h-36 sm:w-40 sm:h-40 rounded-full flex items-center justify-center cursor-pointer shadow-2xl focus:outline-none transition-shadow duration-500 z-10 p-0 overflow-hidden"
        style={{
          boxShadow: isConnected
            ? `0 12px 35px rgba(0, 0, 0, 0.7), 0 0 40px ${vibe.glowColor}88, inset 0 0 20px rgba(255, 255, 255, 0.2)`
            : `0 10px 25px rgba(0, 0, 0, 0.8), inset 0 0 15px rgba(255, 255, 255, 0.05)`,
          border: `1.5px solid ${isConnected ? vibe.primaryColor : 'rgba(255, 255, 255, 0.15)'}`,
        }}
        aria-label={
          isSpeaking
            ? 'Interrupt Mahi'
            : isConnected
            ? 'Mahi is listening. Tap to disconnect'
            : isConnecting
            ? 'Connecting...'
            : 'Tap to awaken Mahi'
        }
      >
        {/* Dynamic 60FPS Organic Plasma Canvas inside the Sphere */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full rounded-full pointer-events-none z-0"
        />

        {/* Minimalist Holographic Center Status Glyph */}
        <div className="relative z-10 flex flex-col items-center justify-center text-white pointer-events-none drop-shadow-md">
          <AnimatePresence mode="wait">
            {isConnecting && (
              <motion.div
                key="connecting"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex flex-col items-center"
              >
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: vibe.primaryColor }} />
              </motion.div>
            )}

            {isSpeaking && (
              <motion.div
                key="speaking"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex flex-col items-center"
              >
                {/* Refined sound wave equalizer glyph */}
                <div className="flex items-center gap-1 h-7">
                  {[0.4, 0.85, 1.0, 0.7, 0.35].map((h, idx) => (
                    <motion.span
                      key={idx}
                      animate={{
                        scaleY: [
                          0.35,
                          Math.max(0.4, h * (0.8 + audioVolume * 1.5)),
                          0.35,
                        ],
                      }}
                      transition={{
                        duration: 0.45 + idx * 0.1,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                      className="w-1 bg-white rounded-full origin-center shadow-sm"
                      style={{
                        height: '100%',
                        backgroundColor: idx % 2 === 0 ? '#ffffff' : vibe.accentColor,
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {isListening && (
              <motion.div
                key="listening"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex flex-col items-center"
              >
                {isMuted ? (
                  <MicOff className="w-8 h-8 text-rose-400" />
                ) : (
                  <motion.div
                    animate={{
                      scale: [1, 1 + audioVolume * 0.25, 1],
                    }}
                    transition={{ duration: 0.25 }}
                  >
                    <Mic className="w-8 h-8 text-white drop-shadow" />
                  </motion.div>
                )}
              </motion.div>
            )}

            {!isConnected && !isConnecting && (
              <motion.div
                key="disconnected"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex flex-col items-center"
              >
                <Power className="w-8 h-8 text-white/70 group-hover:text-white transition-colors" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.button>

      {/* State status pill beneath the orb */}
      <div className="mt-5 flex flex-col items-center text-center px-4 max-w-xs pointer-events-none">
        <motion.div
          key={state + (isMuted ? '-muted' : '')}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-medium backdrop-blur-md border border-white/10"
          style={{
            backgroundColor: isConnected ? 'rgba(0, 0, 0, 0.55)' : 'rgba(255, 255, 255, 0.04)',
          }}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isConnected
                ? isSpeaking
                  ? 'bg-pink-400 animate-ping'
                  : 'bg-emerald-400 animate-pulse'
                : isConnecting
                ? 'bg-amber-400 animate-spin'
                : 'bg-white/30'
            }`}
          />
          <span className="text-white/85">
            {isSpeaking
              ? 'Mahi is speaking • Tap to interrupt'
              : isListening
              ? isMuted
                ? 'Microphone muted'
                : 'Mahi is listening to you'
              : isConnecting
              ? 'Connecting neural audio stream...'
              : 'Tap sphere to talk with Mahi'}
          </span>
        </motion.div>
      </div>
    </div>
  );
};
