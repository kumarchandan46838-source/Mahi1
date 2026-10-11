import React, { useState } from 'react';
import {
  Sparkles,
  Palette,
  Radio,
  ChevronDown,
  Check,
  Brain,
  Smartphone,
  Users,
  Eye,
  Zap,
} from 'lucide-react';
import { VibeConfig, SessionState, AssistantVibe, CompanionId } from '../types';
import { VIBES, VOICE_OPTIONS } from '../data/vibes';
import { COMPANIONS } from '../data/companions';

interface Props {
  vibe: VibeConfig;
  state: SessionState;
  sessionDuration: number;
  selectedVoice: string;
  activeCompanion: CompanionId;
  memoriesCount: number;
  isScreenSharing?: boolean;
  isBackgroundMode?: boolean;
  onSelectCompanion: (companionId: CompanionId) => void;
  onOpenMemories: () => void;
  onOpenPhoneControl: () => void;
  onSelectVibe: (vibeKey: AssistantVibe) => void;
  onSelectVoice: (voiceId: string) => void;
}

export const HeaderBar: React.FC<Props> = ({
  vibe,
  state,
  sessionDuration,
  selectedVoice,
  activeCompanion,
  memoriesCount,
  isScreenSharing = false,
  isBackgroundMode = false,
  onSelectCompanion,
  onOpenMemories,
  onOpenPhoneControl,
  onSelectVibe,
  onSelectVoice,
}) => {
  const [showCompanionPicker, setShowCompanionPicker] = useState(false);
  const [showVibePicker, setShowVibePicker] = useState(false);
  const [showVoicePicker, setShowVoicePicker] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isConnected = state === 'listening' || state === 'speaking' || state === 'processing';
  const currentCompanion = COMPANIONS[activeCompanion] || COMPANIONS.mahi;

  return (
    <header
      id="app-header"
      className="w-full max-w-6xl mx-auto px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between z-30 relative"
    >
      {/* Brand & Companion Switcher */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Companion Avatar Button with Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowCompanionPicker(!showCompanionPicker);
              setShowVibePicker(false);
              setShowVoicePicker(false);
            }}
            className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border transition-all text-left bg-white/5 hover:bg-white/10"
            style={{
              borderColor: `${currentCompanion.accentColor}50`,
              boxShadow: `0 0 12px ${currentCompanion.accentColor}30`,
            }}
            title="Switch between 3 Friends"
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm text-white shadow"
              style={{ backgroundColor: currentCompanion.accentColor }}
            >
              {currentCompanion.name[0]}
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-white tracking-tight">
                  {currentCompanion.name}
                </span>
                <span
                  className="text-[9px] font-mono px-1 py-0.2 rounded border"
                  style={{
                    backgroundColor: `${currentCompanion.accentColor}20`,
                    borderColor: `${currentCompanion.accentColor}40`,
                    color: currentCompanion.accentColor,
                  }}
                >
                  {currentCompanion.badge}
                </span>
                <ChevronDown className="w-3 h-3 text-white/50" />
              </div>
              <p className="text-[10px] text-white/50 truncate max-w-[120px]">
                {currentCompanion.tagline}
              </p>
            </div>
          </button>

          {/* 3 Friends Dropdown */}
          {showCompanionPicker && (
            <div
              id="companion-dropdown-menu"
              className="absolute left-0 mt-2 w-64 rounded-2xl bg-[#120e22]/98 backdrop-blur-2xl border border-white/20 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/50 flex items-center justify-between">
                <span>Select Companion</span>
                <span className="text-[10px] text-pink-400 font-mono">3 Friends</span>
              </div>
              {Object.values(COMPANIONS).map((comp) => {
                const isSelected = activeCompanion === comp.id;
                return (
                  <button
                    key={comp.id}
                    onClick={() => {
                      onSelectCompanion(comp.id);
                      setShowCompanionPicker(false);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs transition-all text-left mb-1 ${
                      isSelected
                        ? 'bg-white/15 text-white shadow-sm'
                        : 'text-white/70 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 text-white"
                        style={{ backgroundColor: comp.accentColor }}
                      >
                        {comp.name[0]}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-white truncate">{comp.name}</span>
                          <span className="text-[9px] text-white/50">({comp.hindiName})</span>
                        </div>
                        <p className="text-[10px] text-white/50 truncate">{comp.hindiTagline}</p>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Center Session Timer or Status */}
      {isConnected && (
        <div
          id="session-timer"
          className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/50 border border-white/10 backdrop-blur-md text-xs font-mono text-white/90"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{formatTime(sessionDuration)}</span>
        </div>
      )}

      {/* Right Controls (Phone & Friends, Screen Vision, Memories, Vibe) */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Total Phone & Hardware Control Button */}
        <button
          id="phone-control-button"
          onClick={onOpenPhoneControl}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium text-white bg-gradient-to-r from-pink-500/20 to-purple-500/20 hover:from-pink-500/30 hover:to-purple-500/30 border border-pink-500/40 shadow-sm transition-all group"
          title="Total Phone Control & 3 Friends Setting"
        >
          <Smartphone className="w-3.5 h-3.5 text-pink-400 group-hover:scale-110 transition-transform" />
          <span className="hidden sm:inline font-semibold">Phone & Friends</span>
          {isBackgroundMode && (
            <span
              className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"
              title="Background mode active"
            />
          )}
        </button>

        {/* Screen Vision Pill */}
        {isScreenSharing && (
          <button
            onClick={onOpenPhoneControl}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl text-xs font-mono bg-cyan-500/20 border border-cyan-500/50 text-cyan-200 animate-pulse"
            title="Screen Vision is active!"
          >
            <Eye className="w-3.5 h-3.5 text-cyan-300" />
            <span className="hidden md:inline text-[11px]">Vision ON</span>
          </button>
        )}

        {/* Memories Bank Button */}
        <button
          id="memory-bank-button"
          onClick={onOpenMemories}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-white/80 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all group"
          title="Memory Bank"
        >
          <Brain className="w-3.5 h-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
          <span className="hidden lg:inline">Memories</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full border border-purple-500/30 bg-purple-500/20 text-purple-200">
            {memoriesCount}
          </span>
        </button>

        {/* Vibe Selector Button */}
        <div className="relative">
          <button
            id="vibe-selector-button"
            onClick={() => {
              setShowVibePicker(!showVibePicker);
              setShowCompanionPicker(false);
              setShowVoicePicker(false);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-white/80 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
            title="Change Visual Theme"
          >
            <Palette className="w-3.5 h-3.5" style={{ color: vibe.primaryColor }} />
            <ChevronDown className="w-3 h-3 text-white/50" />
          </button>

          {showVibePicker && (
            <div
              id="vibe-dropdown-menu"
              className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#120f1d]/95 backdrop-blur-xl border border-white/15 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="px-2 py-1.5 text-[11px] font-medium uppercase tracking-wider text-white/40">
                Visual Aesthetic
              </div>
              {Object.values(VIBES).map((v) => (
                <button
                  key={v.id}
                  onClick={() => {
                    onSelectVibe(v.id as AssistantVibe);
                    setShowVibePicker(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-colors text-left ${
                    vibe.id === v.id
                      ? 'bg-white/15 text-white font-medium'
                      : 'text-white/70 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: v.primaryColor, boxShadow: `0 0 6px ${v.primaryColor}` }}
                    />
                    <span>{v.name}</span>
                  </div>
                  {vibe.id === v.id && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

