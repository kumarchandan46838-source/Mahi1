import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Hand,
  Power,
  Sparkles,
  HelpCircle,
  Send,
  ExternalLink,
  MessageSquare,
  ShieldAlert,
  Smartphone,
  Eye,
} from 'lucide-react';
import { VibeConfig, SessionState } from '../types';

interface Props {
  vibe: VibeConfig;
  state: SessionState;
  isMuted: boolean;
  isOutputMuted: boolean;
  isMicActive?: boolean;
  micNotice?: string | null;
  isScreenSharing?: boolean;
  onToggleMute: () => void;
  onToggleOutputMute: () => void;
  onEnableMic?: () => void;
  onInterrupt: () => void;
  onDisconnect: () => void;
  onOpenQuickPromptHelp: () => void;
  onOpenPhoneControl?: () => void;
  onToggleVision?: () => void;
  onSendText?: (text: string) => void;
}

export const ControlBar: React.FC<Props> = ({
  vibe,
  state,
  isMuted,
  isOutputMuted,
  isMicActive = true,
  micNotice,
  isScreenSharing = false,
  onToggleMute,
  onToggleOutputMute,
  onEnableMic,
  onInterrupt,
  onDisconnect,
  onOpenQuickPromptHelp,
  onOpenPhoneControl,
  onToggleVision,
  onSendText,
}) => {
  const isConnected = state === 'listening' || state === 'speaking' || state === 'processing';
  const isSpeaking = state === 'speaking';
  const [textInput, setTextInput] = useState('');

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    onSendText?.(textInput);
    setTextInput('');
  };

  const handleChipClick = (prompt: string) => {
    if (onSendText) {
      onSendText(prompt);
    }
  };

  const quickPrompts = [
    { label: 'Screen dekho', full: 'Mahi, meri screen dekho' },
    { label: 'WhatsApp kholo', full: 'WhatsApp kholo' },
    { label: 'YouTube chalao', full: 'YouTube chalao' },
    { label: 'Torch jalao', full: 'Flashlight on karo' },
    { label: 'Battery check', full: 'Phone ki battery kitni hai?' },
    { label: 'Flip a coin', full: 'Flip a coin for me' },
  ];

  return (
    <div
      id="control-dock-container"
      className="w-full max-w-lg mx-auto px-4 pb-6 pt-2 z-30 relative"
    >
      {/* Microphone Blocked Notice Banner (when connected in speaker mode) */}
      {isConnected && !isMicActive && (
        <div
          id="mic-blocked-banner"
          className="mb-3 p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-between gap-2 text-xs text-amber-200 shadow-lg"
        >
          <div className="flex items-center gap-2 min-w-0">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="truncate text-[11px] sm:text-xs">
              Mic blocked in iframe. Operating in Speaker & Chat mode.
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {onEnableMic && (
              <button
                onClick={onEnableMic}
                className="px-2 py-1 rounded-lg bg-amber-500/30 hover:bg-amber-500/50 text-[11px] font-semibold text-white transition-all"
              >
                Enable Mic
              </button>
            )}
            <a
              href={typeof window !== 'undefined' ? window.location.href : '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all flex items-center"
              title="Open app in a new tab for native microphone permission"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}

      {/* Quick voice inspiration chips when connected */}
      {isConnected && (
        <div
          id="quick-prompts-tray"
          className="flex items-center gap-2 mb-3 overflow-x-auto no-scrollbar py-1"
        >
          <span className="text-[10px] font-mono font-medium text-white/40 tracking-wider uppercase shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-pink-400" />
            Quick:
          </span>
          {quickPrompts.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleChipClick(q.full)}
              className="text-xs px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 hover:border-white/25 text-white/80 hover:text-white transition-all shrink-0 active:scale-95"
            >
              "{q.label}"
            </button>
          ))}
          <button
            onClick={onOpenQuickPromptHelp}
            className="p-1 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            title="More voice command ideas"
            aria-label="More voice command ideas"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Interactive Text & Command Bar (Allows chatting / typing anytime) */}
      <form
        onSubmit={handleTextSubmit}
        className="mb-2.5 flex items-center gap-1.5 p-1.5 rounded-xl bg-black/40 backdrop-blur-xl border border-white/10 focus-within:border-pink-500/50 transition-all"
      >
        <div className="pl-2 text-white/40">
          <MessageSquare className="w-3.5 h-3.5" />
        </div>
        <input
          type="text"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder={
            isConnected
              ? 'Type to assistant (e.g. "WhatsApp kholo", "Screen dekho")...'
              : 'Type a message to start...'
          }
          className="flex-1 bg-transparent px-2 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none"
        />

        {onToggleVision && (
          <button
            type="button"
            onClick={onToggleVision}
            className={`p-1.5 rounded-lg border transition-all shrink-0 ${
              isScreenSharing
                ? 'bg-cyan-500/30 border-cyan-500/50 text-cyan-200 animate-pulse'
                : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/60 hover:text-white'
            }`}
            title={isScreenSharing ? 'Stop Screen Vision' : 'Screen Vision (Share Screen)'}
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        )}

        {onOpenPhoneControl && (
          <button
            type="button"
            onClick={onOpenPhoneControl}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white transition-all shrink-0"
            title="Total Phone Controls & 3 Friends"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          type="submit"
          disabled={!textInput.trim()}
          className="p-1.5 rounded-lg bg-pink-500/80 hover:bg-pink-500 text-white disabled:opacity-30 disabled:hover:bg-pink-500/80 transition-all shrink-0"
          title="Send to Mahi"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>

      {/* Main Glass Control Dock */}
      <div
        id="control-dock-panel"
        className="w-full rounded-2xl p-2.5 sm:p-3 backdrop-blur-2xl bg-black/60 border border-white/15 shadow-2xl flex items-center justify-between gap-2"
        style={{
          boxShadow: isConnected ? `0 10px 40px -10px ${vibe.glowColor}` : '0 10px 30px rgba(0,0,0,0.6)',
        }}
      >
        {/* Mic Control Toggle */}
        <button
          id="toggle-mic-mute-button"
          onClick={() => {
            if (!isMicActive && onEnableMic) {
              onEnableMic();
            } else {
              onToggleMute();
            }
          }}
          disabled={!isConnected}
          className={`flex-1 py-3 px-2 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold transition-all ${
            !isConnected
              ? 'opacity-30 cursor-not-allowed text-white/40'
              : !isMicActive
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
              : isMuted
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-lg shadow-rose-500/10'
              : 'bg-white/5 hover:bg-white/10 text-white/90 border border-white/10'
          }`}
          title={
            !isMicActive
              ? 'Microphone blocked - tap to enable'
              : isMuted
              ? 'Unmute microphone'
              : 'Mute microphone'
          }
          aria-label={
            !isMicActive
              ? 'Microphone blocked - tap to enable'
              : isMuted
              ? 'Unmute microphone'
              : 'Mute microphone'
          }
        >
          {!isMicActive ? (
            <>
              <MicOff className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Enable Mic</span>
            </>
          ) : isMuted ? (
            <>
              <MicOff className="w-4 h-4 text-rose-400" />
              <span className="hidden sm:inline">Unmute</span>
            </>
          ) : (
            <>
              <Mic className="w-4 h-4" />
              <span className="hidden sm:inline">Mute</span>
            </>
          )}
        </button>

        {/* Output Speaker Mute Toggle */}
        <button
          id="toggle-speaker-mute-button"
          onClick={onToggleOutputMute}
          disabled={!isConnected}
          className={`flex-1 py-3 px-2 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold transition-all ${
            !isConnected
              ? 'opacity-30 cursor-not-allowed text-white/40'
              : isOutputMuted
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'bg-white/5 hover:bg-white/10 text-white/90 border border-white/10'
          }`}
          title={isOutputMuted ? 'Unmute audio playback' : 'Mute audio playback'}
          aria-label={isOutputMuted ? 'Unmute audio playback' : 'Mute audio playback'}
        >
          {isOutputMuted ? <VolumeX className="w-4 h-4 text-amber-400" /> : <Volume2 className="w-4 h-4" />}
          <span className="hidden sm:inline">{isOutputMuted ? 'Audio Off' : 'Audio On'}</span>
        </button>

        {/* Interruption Button (Highlighted when speaking) */}
        {isSpeaking && (
          <button
            id="interrupt-assistant-button"
            onClick={onInterrupt}
            className="flex-1 py-3 px-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all shadow-lg animate-pulse"
            style={{
              background: `linear-gradient(135deg, ${vibe.primaryColor} 0%, ${vibe.accentColor} 100%)`,
              color: '#ffffff',
              boxShadow: `0 0 20px ${vibe.glowColor}`,
            }}
            title="Interrupt Mahi"
            aria-label="Interrupt Mahi"
          >
            <Hand className="w-4 h-4" />
            <span>Interrupt</span>
          </button>
        )}

        {/* Disconnect / End Call Button */}
        {isConnected ? (
          <button
            id="disconnect-session-button"
            onClick={onDisconnect}
            className="py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 transition-all"
            title="End voice session"
            aria-label="End voice session"
          >
            <Power className="w-4 h-4" />
            <span className="hidden sm:inline">End</span>
          </button>
        ) : (
          <div className="flex-1 py-3 px-3 text-center text-[11px] text-white/40">
            Tap the core to begin
          </div>
        )}
      </div>
    </div>
  );
};
