import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mic,
  MicOff,
  Power,
  Loader2,
  Sparkles,
  Heart,
  Smile,
  Sun,
  Shield,
  Zap,
  Volume2,
  Sliders,
} from 'lucide-react';
import { VibeConfig, SessionState, EmotionMode, AvatarModelStyle } from '../types';
import { EMOTION_PRESETS, EmotionPreset } from '../data/vibes';
import { COMPANIONS } from '../data/companions';

interface Props {
  vibe: VibeConfig;
  state: SessionState;
  isMuted: boolean;
  audioVolume: number; // 0.0 - 1.0
  activeCompanionId: string;
  activeEmotion: EmotionMode;
  avatarStyle: AvatarModelStyle;
  onToggleConnect: () => void;
  onInterrupt: () => void;
  onSelectEmotion: (emotion: EmotionMode) => void;
  onOpenSettings?: () => void;
}

export const EmotionalAvatarModel: React.FC<Props> = ({
  vibe,
  state,
  isMuted,
  audioVolume,
  activeCompanionId,
  activeEmotion,
  avatarStyle,
  onToggleConnect,
  onInterrupt,
  onSelectEmotion,
  onOpenSettings,
}) => {
  const isConnected = state === 'listening' || state === 'speaking' || state === 'processing';
  const isSpeaking = state === 'speaking';
  const isListening = state === 'listening';
  const isConnecting = state === 'connecting';

  // Smooth audio volume with exponential moving average to prevent ANY shaking or jitter
  const smoothedVolumeRef = useRef(0);
  const [displayVolume, setDisplayVolume] = useState(0);

  // Blinking cycle state for human avatar eyes
  const [isBlinking, setIsBlinking] = useState(false);

  // Companion details
  const companion = COMPANIONS[activeCompanionId as keyof typeof COMPANIONS] || COMPANIONS.mahi;
  const currentEmotionConfig =
    EMOTION_PRESETS.find((e) => e.id === activeEmotion) || EMOTION_PRESETS[0];

  // Natural human eye blinking loop (natural 3.5 - 5.5s intervals)
  useEffect(() => {
    let blinkTimeout: number;
    let closeTimeout: number;

    const scheduleNextBlink = () => {
      const delay = Math.random() * 2500 + 3200;
      blinkTimeout = window.setTimeout(() => {
        setIsBlinking(true);
        closeTimeout = window.setTimeout(() => {
          setIsBlinking(false);
          scheduleNextBlink();
        }, 140);
      }, delay);
    };

    scheduleNextBlink();

    return () => {
      clearTimeout(blinkTimeout);
      clearTimeout(closeTimeout);
    };
  }, []);

  // Frame loop for smooth audio volume damping
  useEffect(() => {
    let animId: number;
    const updateSmooth = () => {
      const target = isConnected ? audioVolume : 0;
      smoothedVolumeRef.current += (target - smoothedVolumeRef.current) * 0.16;
      setDisplayVolume(smoothedVolumeRef.current);
      animId = requestAnimationFrame(updateSmooth);
    };
    animId = requestAnimationFrame(updateSmooth);
    return () => cancelAnimationFrame(animId);
  }, [isConnected, audioVolume]);

  const handleClick = () => {
    if (isSpeaking) {
      onInterrupt();
    } else {
      onToggleConnect();
    }
  };

  // Organic mouth opening height (scaled gently, clamped to prevent distortion)
  const mouthOpenHeight = isSpeaking ? Math.min(26, 6 + displayVolume * 36) : 3;

  // Emotional aura color scheme
  const auraColor = currentEmotionConfig.color || vibe.primaryColor;

  return (
    <div
      id="emotional-avatar-model"
      className="relative flex flex-col items-center justify-center select-none w-full max-w-md mx-auto"
    >
      {/* 1. Deep Serene Volumetric Emotional Halo (Smooth, Never Jittery) */}
      <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
        {/* Soft Ambient Radial Radiance */}
        <motion.div
          animate={{
            scale: isConnected
              ? isSpeaking
                ? [1, 1.05, 1]
                : [0.98, 1.02, 0.98]
              : [0.95, 1, 0.95],
            opacity: isConnected ? (isSpeaking ? 0.7 : 0.5) : 0.25,
          }}
          transition={{
            duration: isSpeaking ? 2.0 : 4.0,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute inset-0 rounded-full blur-2xl pointer-events-none transition-colors duration-700"
          style={{
            background: `radial-gradient(circle, ${auraColor}66 0%, ${vibe.primaryColor}22 55%, transparent 75%)`,
          }}
        />

        {/* Delicate Outer Orbiting Luminous Ring */}
        {isConnected && (
          <motion.div
            animate={{
              rotate: 360,
              scale: isSpeaking ? [1, 1.03, 1] : 1,
            }}
            transition={{
              rotate: { duration: 24, repeat: Infinity, ease: 'linear' },
              scale: { duration: 2.2, repeat: Infinity, ease: 'easeInOut' },
            }}
            className="absolute inset-2 sm:inset-3 rounded-full pointer-events-none border border-white/10"
            style={{
              borderColor: `${auraColor}35`,
              boxShadow: `0 0 25px ${auraColor}20, inset 0 0 15px ${auraColor}15`,
            }}
          >
            {/* Tiny Orbiting Starlight Jewel */}
            <div
              className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full shadow-lg"
              style={{
                backgroundColor: auraColor,
                boxShadow: `0 0 10px ${auraColor}, 0 0 20px #ffffff`,
              }}
            />
          </motion.div>
        )}

        {/* Main Interactive Model Housing Button */}
        <motion.button
          id="avatar-model-button"
          onClick={handleClick}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="relative w-44 h-44 sm:w-48 sm:h-48 rounded-full flex items-center justify-center cursor-pointer shadow-2xl focus:outline-none overflow-hidden z-10 transition-all duration-500"
          style={{
            background: isConnected
              ? `radial-gradient(circle at 50% 35%, #1f1435 0%, #100b20 60%, #06040d 100%)`
              : `radial-gradient(circle at 50% 35%, #130f22 0%, #0c0817 60%, #04020a 100%)`,
            border: `2px solid ${isConnected ? auraColor + '88' : 'rgba(255, 255, 255, 0.15)'}`,
            boxShadow: isConnected
              ? `0 15px 45px rgba(0, 0, 0, 0.8), 0 0 35px ${auraColor}40, inset 0 0 25px rgba(255, 255, 255, 0.08)`
              : `0 12px 30px rgba(0, 0, 0, 0.7), inset 0 0 15px rgba(255, 255, 255, 0.04)`,
          }}
          aria-label={
            isSpeaking
              ? `Interrupt ${companion.name}`
              : isConnected
              ? `${companion.name} is listening. Tap to disconnect`
              : `Tap to talk with ${companion.name}`
          }
        >
          {/* Subtle Stardust Motes Drifting Inside */}
          {isConnected && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-60">
              {[15, 45, 75, 120, 180, 240].map((deg, i) => (
                <motion.div
                  key={i}
                  animate={{
                    y: [-4, 4, -4],
                    opacity: [0.3, 0.8, 0.3],
                  }}
                  transition={{
                    duration: 3 + (i % 3),
                    repeat: Infinity,
                    delay: i * 0.4,
                    ease: 'easeInOut',
                  }}
                  className="absolute w-1 h-1 rounded-full bg-white shadow-sm"
                  style={{
                    left: `${20 + ((i * 27) % 60)}%`,
                    top: `${25 + ((i * 31) % 50)}%`,
                    boxShadow: `0 0 6px ${auraColor}`,
                  }}
                />
              ))}
            </div>
          )}

          {/* MODEL STYLE 1: Human Touch Avatar (चेहरे के जीवंत भाव, पलकें, मुस्कान और सांस) */}
          {avatarStyle === 'human-avatar' && (
            <div className="relative w-full h-full flex flex-col items-center justify-center">
              {/* Gentle Human Breathing Physics (Soft, never shakes) */}
              <motion.div
                animate={{
                  y: isConnected ? [0, -2, 0] : [0, -1, 0],
                  scale: isSpeaking ? [1, 1.015, 1] : [1, 1.008, 1],
                }}
                transition={{
                  duration: 3.8,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="relative flex flex-col items-center justify-center w-32 h-32"
              >
                {/* Companion Silhouette Head Base */}
                <div
                  className="relative w-24 h-26 rounded-[48%] flex flex-col items-center justify-center border transition-colors duration-500"
                  style={{
                    background: `radial-gradient(circle at 50% 30%, ${auraColor}25 0%, #1a1230 70%, #0d091a 100%)`,
                    borderColor: `${auraColor}50`,
                    boxShadow: `0 4px 20px rgba(0, 0, 0, 0.6), inset 0 2px 10px rgba(255, 255, 255, 0.15)`,
                  }}
                >
                  {/* Subtle Forehead Neural Jewel / Bindi / Glow */}
                  <motion.div
                    animate={{
                      opacity: isConnected ? [0.6, 1, 0.6] : 0.4,
                      scale: isSpeaking ? [1, 1.2, 1] : 1,
                    }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-1.5 h-1.5 rounded-full mb-2 shadow-sm"
                    style={{
                      backgroundColor: auraColor,
                      boxShadow: `0 0 8px ${auraColor}, 0 0 12px #ffffff`,
                    }}
                  />

                  {/* Lifelike Expressive Eyes (Blinking naturally & reacting to emotion) */}
                  <div className="flex items-center gap-5 my-1">
                    {/* Left Eye */}
                    <div className="relative flex items-center justify-center">
                      <motion.div
                        animate={{
                          scaleY: isBlinking ? 0.08 : 1,
                        }}
                        transition={{ duration: 0.08 }}
                        className="w-4 h-3 rounded-full bg-white/90 flex items-center justify-center overflow-hidden shadow-sm"
                        style={{
                          boxShadow: `0 0 6px ${auraColor}80`,
                        }}
                      >
                        {/* Iris with expressive color */}
                        <div
                          className="w-2.5 h-2.5 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: auraColor }}
                        >
                          <div className="w-1 h-1 rounded-full bg-black/90" />
                        </div>
                      </motion.div>
                      {/* Eyelash arch */}
                      <div
                        className="absolute -top-1 w-4 h-0.5 rounded-full"
                        style={{ backgroundColor: `${auraColor}aa` }}
                      />
                    </div>

                    {/* Right Eye */}
                    <div className="relative flex items-center justify-center">
                      <motion.div
                        animate={{
                          scaleY: isBlinking ? 0.08 : 1,
                        }}
                        transition={{ duration: 0.08 }}
                        className="w-4 h-3 rounded-full bg-white/90 flex items-center justify-center overflow-hidden shadow-sm"
                        style={{
                          boxShadow: `0 0 6px ${auraColor}80`,
                        }}
                      >
                        {/* Iris */}
                        <div
                          className="w-2.5 h-2.5 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: auraColor }}
                        >
                          <div className="w-1 h-1 rounded-full bg-black/90" />
                        </div>
                      </motion.div>
                      {/* Eyelash arch */}
                      <div
                        className="absolute -top-1 w-4 h-0.5 rounded-full"
                        style={{ backgroundColor: `${auraColor}aa` }}
                      />
                    </div>
                  </div>

                  {/* Cute subtle blush cheeks */}
                  <div className="flex justify-between w-16 px-1 my-0.5">
                    <span
                      className="w-2.5 h-1 rounded-full blur-[1px] opacity-70"
                      style={{ backgroundColor: auraColor }}
                    />
                    <span
                      className="w-2.5 h-1 rounded-full blur-[1px] opacity-70"
                      style={{ backgroundColor: auraColor }}
                    />
                  </div>

                  {/* Expressive Mouth & Natural Lip-Sync (Smooth, organic, zero jitter) */}
                  <div className="mt-1 h-6 flex items-center justify-center">
                    {isSpeaking ? (
                      // Speaking: Organic, smooth mouth opening with warm internal luminescence
                      <motion.div
                        animate={{
                          height: mouthOpenHeight,
                          width: Math.min(20, 10 + displayVolume * 14),
                        }}
                        transition={{ duration: 0.1, ease: 'easeOut' }}
                        className="rounded-full flex items-center justify-center overflow-hidden shadow-sm"
                        style={{
                          backgroundColor: '#2b1228',
                          border: `1.5px solid ${auraColor}`,
                          boxShadow: `0 0 10px ${auraColor}66`,
                        }}
                      >
                        <div
                          className="w-full h-full opacity-60"
                          style={{
                            background: `radial-gradient(circle, ${auraColor} 0%, transparent 80%)`,
                          }}
                        />
                      </motion.div>
                    ) : isListening ? (
                      // Listening: Attentive, gentle smiling curve
                      <div className="flex flex-col items-center">
                        <svg width="18" height="8" viewBox="0 0 18 8" className="overflow-visible">
                          <path
                            d="M 1 2 Q 9 8 17 2"
                            fill="transparent"
                            stroke={auraColor}
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>
                    ) : isConnecting ? (
                      // Connecting: Thinking soft glow
                      <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                    ) : (
                      // Idle: Sweet resting smile
                      <svg width="16" height="6" viewBox="0 0 16 6">
                        <path
                          d="M 2 1.5 Q 8 6 14 1.5"
                          fill="transparent"
                          stroke="rgba(255, 255, 255, 0.45)"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                      </svg>
                    )}
                  </div>
                </div>

                {/* Companion Chest / Collar Arc for anatomical elegance */}
                <div
                  className="w-16 h-3 rounded-b-xl border-t-0 border transition-colors duration-500 mt-1 opacity-70"
                  style={{
                    background: `linear-gradient(to bottom, #170f2a, #0b0716)`,
                    borderColor: `${auraColor}33`,
                  }}
                />
              </motion.div>
            </div>
          )}

          {/* MODEL STYLE 2: Smooth Crystal Halo (स्मूथ क्रिस्टल हेलो - No shaking) */}
          {avatarStyle === 'luminous-halo' && (
            <div className="relative w-full h-full flex flex-col items-center justify-center">
              <motion.div
                animate={{
                  scale: isSpeaking ? [1, 1.04, 1] : [0.99, 1.01, 0.99],
                }}
                transition={{ duration: isSpeaking ? 1.8 : 3.5, repeat: Infinity, ease: 'easeInOut' }}
                className="relative w-28 h-28 rounded-full flex items-center justify-center"
                style={{
                  background: `radial-gradient(circle at 40% 35%, #ffffff22 0%, ${auraColor}44 50%, #0d081c 95%)`,
                  boxShadow: `0 0 30px ${auraColor}50, inset 0 0 20px #ffffff30`,
                  border: `1.5px solid ${auraColor}80`,
                }}
              >
                {/* Concentric inner crystal core */}
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-md"
                  style={{
                    background: `radial-gradient(circle, #ffffff 0%, ${auraColor}88 60%, transparent 100%)`,
                    boxShadow: `0 0 15px #ffffff88`,
                  }}
                >
                  <Sparkles className="w-6 h-6 text-white drop-shadow" />
                </div>
              </motion.div>
            </div>
          )}

          {/* MODEL STYLE 3: Harmonic Ribbon Waves (शांत हार्मोनिक तरंगें) */}
          {avatarStyle === 'harmonic-waves' && (
            <div className="relative w-full h-full flex flex-col items-center justify-center">
              <div className="flex items-center gap-1.5 h-16">
                {[0.4, 0.7, 1.0, 0.7, 0.4].map((h, idx) => (
                  <motion.div
                    key={idx}
                    animate={{
                      scaleY: isSpeaking
                        ? [0.3, Math.max(0.4, h * (0.8 + displayVolume * 1.4)), 0.3]
                        : [0.25, 0.45, 0.25],
                    }}
                    transition={{
                      duration: 0.6 + idx * 0.12,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    className="w-2.5 rounded-full shadow-lg"
                    style={{
                      height: '100%',
                      backgroundColor: idx === 2 ? '#ffffff' : auraColor,
                      boxShadow: `0 0 10px ${auraColor}`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Holographic Disconnected / Connecting Overlay Status Icon */}
          <AnimatePresence>
            {!isConnected && !isConnecting && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center text-white/80 z-20"
              >
                <Power className="w-8 h-8 text-white/70 hover:text-white transition-colors drop-shadow" />
                <span className="text-[10px] text-white/60 font-medium mt-1">Tap to awaken</span>
              </motion.div>
            )}

            {isConnecting && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex flex-col items-center justify-center text-white z-20"
              >
                <Loader2 className="w-8 h-8 animate-spin text-pink-400" />
                <span className="text-[10px] text-white/80 font-medium mt-1">Connecting...</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* 2. Live Emotional Status Badge (मानवीय एहसास और स्थिति) */}
      <div className="mt-2 flex flex-col items-center text-center px-4 max-w-sm pointer-events-none">
        <motion.div
          key={state + activeEmotion + (isMuted ? '-muted' : '')}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.2 rounded-full text-xs font-medium backdrop-blur-xl border shadow-lg transition-all"
          style={{
            backgroundColor: 'rgba(10, 6, 20, 0.75)',
            borderColor: `${auraColor}40`,
            boxShadow: `0 4px 15px rgba(0, 0, 0, 0.5), 0 0 10px ${auraColor}20`,
          }}
        >
          {/* Animated state beacon */}
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              isConnected
                ? isSpeaking
                  ? 'bg-pink-400 animate-ping'
                  : 'bg-emerald-400 animate-pulse'
                : isConnecting
                ? 'bg-amber-400 animate-spin'
                : 'bg-white/40'
            }`}
          />

          <span className="text-white/90 font-medium text-[11px] sm:text-xs">
            {isSpeaking
              ? `${companion.name} is speaking • ${currentEmotionConfig.hindiTagline}`
              : isListening
              ? isMuted
                ? 'Microphone is muted'
                : `${companion.name} is listening with heart • Bolte rahiye`
              : isConnecting
              ? 'Connecting with human touch...'
              : `Tap model to talk with ${companion.name}`}
          </span>
        </motion.div>
      </div>

      {/* 3. Interactive Quick Emotion Mood Selector (5 Emotional Presets) */}
      <div className="mt-4 w-full px-2 flex flex-col items-center">
        <div className="flex items-center justify-between w-full max-w-xs mb-1.5 px-1">
          <span className="text-[10px] font-mono tracking-wider uppercase text-white/50 flex items-center gap-1">
            <Heart className="w-3 h-3 text-pink-400" />
            Emotional Tone (इमोशन):
          </span>
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="text-[10px] text-pink-300 hover:text-white flex items-center gap-1 transition-colors"
              title="Voice & Emotional Settings"
            >
              <Sliders className="w-3 h-3" />
              Settings
            </button>
          )}
        </div>

        {/* Emotion Pills */}
        <div
          id="emotion-pills-row"
          className="flex items-center gap-1.5 p-1 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 overflow-x-auto no-scrollbar max-w-sm justify-center w-full"
        >
          {EMOTION_PRESETS.map((ep) => {
            const isSelected = activeEmotion === ep.id;
            return (
              <button
                key={ep.id}
                onClick={() => onSelectEmotion(ep.id)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-medium transition-all shrink-0 ${
                  isSelected
                    ? 'text-white shadow-md border'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
                style={{
                  backgroundColor: isSelected ? ep.bgRgba : 'transparent',
                  borderColor: isSelected ? `${ep.color}80` : 'transparent',
                  boxShadow: isSelected ? `0 0 10px ${ep.color}40` : 'none',
                }}
                title={ep.description}
              >
                <span>{ep.icon}</span>
                <span className="capitalize">{ep.name.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
