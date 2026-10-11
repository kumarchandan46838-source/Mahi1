import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, Camera, Monitor, X, Sparkles } from 'lucide-react';
import { VibeConfig } from '../types';
import { ScreenVisionService } from '../services/ScreenVision';

interface Props {
  vibe: VibeConfig;
  screenVision: ScreenVisionService | null;
  isSharing: boolean;
  onStop: () => void;
  onCaptureNow: () => void;
}

export const VisionOverlay: React.FC<Props> = ({
  vibe,
  screenVision,
  isSharing,
  onStop,
  onCaptureNow,
}) => {
  const [snapshotTaken, setSnapshotTaken] = useState(false);

  if (!isSharing) return null;

  const mode = screenVision?.getMode() || 'screen';

  const handleCapture = () => {
    onCaptureNow();
    setSnapshotTaken(true);
    setTimeout(() => {
      setSnapshotTaken(false);
    }, 2000);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-20 right-4 z-40 flex items-center gap-2 p-2 sm:px-3 sm:py-2 rounded-2xl bg-[#0b0817]/90 backdrop-blur-xl border border-cyan-500/40 shadow-2xl shadow-cyan-500/20 text-white text-xs font-['Plus_Jakarta_Sans',sans-serif]"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shrink-0">
            {mode === 'screen' ? (
              <Monitor className="w-3.5 h-3.5 animate-pulse" />
            ) : (
              <Camera className="w-3.5 h-3.5 animate-pulse" />
            )}
          </div>
          <div className="hidden sm:block">
            <div className="font-semibold text-[11px] text-white flex items-center gap-1.5">
              <span>{mode === 'screen' ? 'Screen Vision Active' : 'Camera Vision Active'}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <div className="text-[10px] text-cyan-200/70">
              {snapshotTaken ? 'Frame sent to Gemini!' : 'Streaming to Gemini Live'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 ml-2 border-l border-white/10 pl-2">
          <button
            onClick={handleCapture}
            className="px-2 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-[11px] font-medium text-cyan-200 transition-colors flex items-center gap-1"
            title="Send immediate snapshot frame"
          >
            <Sparkles className="w-3 h-3" />
            <span className="hidden md:inline">Snapshot</span>
          </button>

          <button
            onClick={onStop}
            className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 transition-colors"
            title="Stop Screen Vision"
          >
            <EyeOff className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
