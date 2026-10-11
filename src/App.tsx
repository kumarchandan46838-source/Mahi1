/**
 * Mahi AI Assistant - Master Application
 * Pure Real-Time Voice-to-Voice AI Assistant with Gemini Live API
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { VIBES } from './data/vibes';
import { SessionState, AssistantVibe, ToolActionRecord, EmotionMode, AvatarModelStyle } from './types';
import { AudioStreamer } from './services/AudioStreamer';
import { LiveSession } from './services/LiveSession';
import { FuturisticBackground } from './components/FuturisticBackground';
import { HeaderBar } from './components/HeaderBar';
import { EmotionalAvatarModel } from './components/EmotionalAvatarModel';
import { VoiceEmotionSettingsModal } from './components/VoiceEmotionSettingsModal';
import { ControlBar } from './components/ControlBar';
import { ToolActionOverlay } from './components/ToolActionOverlay';
import { QuickPromptsModal } from './components/QuickPromptsModal';
import { MicrophonePermissionModal } from './components/MicrophonePermissionModal';
import { MemoriesModal } from './components/MemoriesModal';
import { PhoneControlModal } from './components/PhoneControlModal';
import { VisionOverlay } from './components/VisionOverlay';
import { ScreenVisionService } from './services/ScreenVision';
import { deviceController } from './utils/deviceController';
import { CompanionId, COMPANIONS } from './data/companions';
import { AlertCircle, X, Sparkles, MicOff, ExternalLink } from 'lucide-react';
import { UserMemory } from './types';

export default function App() {
  const [sessionState, setSessionState] = useState<SessionState>('disconnected');
  const [currentVibe, setCurrentVibe] = useState<AssistantVibe>('cyber-violet');
  const [selectedVoice, setSelectedVoice] = useState<string>('Aoede');
  const [activeEmotion, setActiveEmotion] = useState<EmotionMode>('empathetic');
  const [avatarStyle, setAvatarStyle] = useState<AvatarModelStyle>('human-avatar');
  const [showVoiceEmotionModal, setShowVoiceEmotionModal] = useState<boolean>(false);
  const [activeCompanion, setActiveCompanion] = useState<CompanionId>('mahi');
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const [isBackgroundMode, setIsBackgroundMode] = useState<boolean>(deviceController.isBackgroundModeActive());
  const [showPhoneControlModal, setShowPhoneControlModal] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isOutputMuted, setIsOutputMuted] = useState<boolean>(false);
  const [sessionDuration, setSessionDuration] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMicActive, setIsMicActive] = useState<boolean>(true);
  const [micNotice, setMicNotice] = useState<string | null>(null);
  const [activeToolAction, setActiveToolAction] = useState<ToolActionRecord | null>(null);
  const [showPromptHelp, setShowPromptHelp] = useState<boolean>(false);
  const [showMicPermissionModal, setShowMicPermissionModal] = useState<boolean>(false);
  const [memories, setMemories] = useState<UserMemory[]>([]);
  const [showMemoriesModal, setShowMemoriesModal] = useState<boolean>(false);

  // Audio metrics for 60fps visualizer
  const [audioMetrics, setAudioMetrics] = useState<{
    inputVolume: number;
    outputVolume: number;
    frequencyData: Uint8Array<ArrayBufferLike>;
    activeIntensity: number;
  }>({
    inputVolume: 0,
    outputVolume: 0,
    frequencyData: new Uint8Array(64),
    activeIntensity: 0,
  });

  const audioStreamerRef = useRef<AudioStreamer | null>(null);
  const liveSessionRef = useRef<LiveSession | null>(null);
  const screenVisionRef = useRef<ScreenVisionService | null>(null);
  const durationTimerRef = useRef<number | null>(null);
  const toolDismissTimerRef = useRef<number | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const vibeConfig = VIBES[currentVibe] || VIBES['cyber-violet'];

  // Load persistent memories and register PWA service worker on initial mount
  useEffect(() => {
    fetch('/api/memories')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.memories)) {
          setMemories(data.memories);
        }
      })
      .catch((err) => console.error('Failed to load memories:', err));

    // Register PWA Service Worker
    if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('PWA service worker registration skipped:', err);
      });
    }
  }, []);

  // Initialize AudioStreamer & LiveSession once
  useEffect(() => {
    const streamer = new AudioStreamer();
    audioStreamerRef.current = streamer;

    const session = new LiveSession(streamer, {
      onStateChange: (state) => {
        setSessionState(state);
      },
      onMicStatusChange: (available, reason) => {
        setIsMicActive(available);
        if (!available && reason) {
          setMicNotice(reason);
        } else {
          setMicNotice(null);
        }
      },
      onError: (err) => {
        if (!err || typeof err !== 'string' || !err.trim()) return;
        if (err.includes('Session ended')) return;
        console.error('Session Error:', err);
        setErrorMessage(err);
        if (
          err.toLowerCase().includes('permission') ||
          err.toLowerCase().includes('denied') ||
          err.toLowerCase().includes('notallowed')
        ) {
          setShowMicPermissionModal(true);
        }
      },
      onToolAction: (action) => {
        setActiveToolAction(action);
        if (toolDismissTimerRef.current) {
          clearTimeout(toolDismissTimerRef.current);
        }
        // Auto dismiss after 8 seconds
        toolDismissTimerRef.current = window.setTimeout(() => {
          setActiveToolAction(null);
        }, 8000);
      },
      onVibeChange: (vibe) => {
        if (VIBES[vibe]) {
          setCurrentVibe(vibe);
        }
      },
      onEmotionChange: (emotion) => {
        setActiveEmotion(emotion);
      },
      onMemoryUpdated: (allMemories) => {
        setMemories(allMemories);
      },
    });

    session.setVoice(selectedVoice);
    session.setEmotion(activeEmotion);
    liveSessionRef.current = session;

    // Initialize ScreenVisionService for real-time visual streaming
    const vision = new ScreenVisionService({
      onStart: () => setIsScreenSharing(true),
      onStop: () => setIsScreenSharing(false),
      onFrame: (base64Image) => {
        liveSessionRef.current?.sendScreenFrame(base64Image);
      },
      onError: (err) => {
        console.warn('Vision error:', err);
        setErrorMessage(err);
      },
    });
    screenVisionRef.current = vision;

    // 60fps loop for audio visualizer
    const updateMetrics = () => {
      if (audioStreamerRef.current) {
        const metrics = audioStreamerRef.current.getVisualMetrics();
        const activeVol = metrics.isSpeaking ? metrics.outputVolume : metrics.inputVolume;
        const activeFreq = metrics.isSpeaking
          ? metrics.outputFrequencyData
          : metrics.inputFrequencyData;

        setAudioMetrics({
          inputVolume: metrics.inputVolume,
          outputVolume: metrics.outputVolume,
          frequencyData: activeFreq,
          activeIntensity: activeVol,
        });
      }
      animFrameRef.current = requestAnimationFrame(updateMetrics);
    };

    animFrameRef.current = requestAnimationFrame(updateMetrics);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
      if (toolDismissTimerRef.current) clearTimeout(toolDismissTimerRef.current);
      if (vision) vision.stop();
      if (liveSessionRef.current) liveSessionRef.current.disconnect();
      if (audioStreamerRef.current) audioStreamerRef.current.dispose();
    };
  }, []);

  // Update selected voice and emotion in live session seamlessly
  const handleSelectVoice = useCallback(
    async (voiceId: string) => {
      setSelectedVoice(voiceId);
      if (liveSessionRef.current) {
        liveSessionRef.current.setVoice(voiceId);
        if (sessionState !== 'disconnected') {
          liveSessionRef.current.disconnect();
          await new Promise((r) => setTimeout(r, 120));
          await liveSessionRef.current.connect();
        }
      }
    },
    [sessionState]
  );

  const handleSelectEmotion = useCallback(
    async (emotion: EmotionMode) => {
      setActiveEmotion(emotion);
      if (liveSessionRef.current) {
        liveSessionRef.current.setEmotion(emotion);
        if (sessionState !== 'disconnected') {
          liveSessionRef.current.disconnect();
          await new Promise((r) => setTimeout(r, 120));
          await liveSessionRef.current.connect();
        }
      }
    },
    [sessionState]
  );

  // Handle Companion Change
  const handleSelectCompanion = useCallback(
    async (companionId: CompanionId) => {
      setActiveCompanion(companionId);
      const comp = COMPANIONS[companionId];
      if (comp) {
        setSelectedVoice(comp.voice);
        setCurrentVibe(comp.defaultVibe);
        if (liveSessionRef.current) {
          liveSessionRef.current.setCompanion(companionId, comp.voice);
          if (sessionState !== 'disconnected') {
            liveSessionRef.current.disconnect();
            await new Promise((r) => setTimeout(r, 150));
            await liveSessionRef.current.connect();
          }
        }
      }
    },
    [sessionState]
  );

  // Vision Toggles
  const handleToggleScreenShare = useCallback(async () => {
    if (!screenVisionRef.current) return;
    if (isScreenSharing) {
      screenVisionRef.current.stop();
      setIsScreenSharing(false);
    } else {
      if (sessionState === 'disconnected') {
        await liveSessionRef.current?.connect();
      }
      const started = await screenVisionRef.current.startScreenSharing();
      setIsScreenSharing(started);
    }
  }, [isScreenSharing, sessionState]);

  const handleToggleCameraVision = useCallback(async () => {
    if (!screenVisionRef.current) return;
    if (isScreenSharing && screenVisionRef.current.getMode() === 'camera') {
      screenVisionRef.current.stop();
      setIsScreenSharing(false);
    } else {
      if (sessionState === 'disconnected') {
        await liveSessionRef.current?.connect();
      }
      const started = await screenVisionRef.current.startCameraVision();
      setIsScreenSharing(started);
    }
  }, [isScreenSharing, sessionState]);

  const handleCaptureImmediateSnapshot = useCallback(() => {
    screenVisionRef.current?.captureAndSendFrame();
  }, []);

  // Session timer ticker
  useEffect(() => {
    const isLive = sessionState === 'listening' || sessionState === 'speaking';
    if (isLive) {
      if (!durationTimerRef.current) {
        durationTimerRef.current = window.setInterval(() => {
          setSessionDuration((prev) => prev + 1);
        }, 1000);
      }
    } else if (sessionState === 'disconnected') {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
      setSessionDuration(0);
    }
  }, [sessionState]);

  // Toggle connection
  const handleToggleConnect = useCallback(async () => {
    setErrorMessage(null);
    if (!liveSessionRef.current) return;

    if (sessionState === 'disconnected') {
      await liveSessionRef.current.connect();
    } else {
      liveSessionRef.current.disconnect();
    }
  }, [sessionState]);

  // Interruption
  const handleInterrupt = useCallback(() => {
    if (liveSessionRef.current) {
      liveSessionRef.current.interrupt();
    }
  }, []);

  // Mute microphone
  const handleToggleMute = useCallback(() => {
    if (audioStreamerRef.current) {
      const nextMuted = !isMuted;
      audioStreamerRef.current.setMuted(nextMuted);
      setIsMuted(nextMuted);
    }
  }, [isMuted]);

  // Mute speaker output
  const handleToggleOutputMute = useCallback(() => {
    if (audioStreamerRef.current) {
      const nextOutputMuted = !isOutputMuted;
      audioStreamerRef.current.setOutputMuted(nextOutputMuted);
      setIsOutputMuted(nextOutputMuted);
    }
  }, [isOutputMuted]);

  const handleDisconnect = useCallback(() => {
    if (liveSessionRef.current) {
      liveSessionRef.current.disconnect();
    }
  }, []);

  // Memory management actions
  const handleAddMemory = async (fact: string, category: UserMemory['category']) => {
    try {
      const res = await fetch('/api/memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fact, category }),
      });
      const data = await res.json();
      if (data.allMemories) {
        setMemories(data.allMemories);
      }
    } catch (err) {
      console.error('Error adding memory:', err);
    }
  };

  const handleDeleteMemory = async (id: string) => {
    try {
      const res = await fetch(`/api/memories/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.allMemories) {
        setMemories(data.allMemories);
      }
    } catch (err) {
      console.error('Error deleting memory:', err);
    }
  };

  const handleClearAllMemories = async () => {
    try {
      const res = await fetch('/api/memories', { method: 'DELETE' });
      const data = await res.json();
      if (data.allMemories) {
        setMemories(data.allMemories);
      }
    } catch (err) {
      console.error('Error clearing memories:', err);
    }
  };

  const handleEnableMic = useCallback(async () => {
    if (!liveSessionRef.current) return;
    const granted = await liveSessionRef.current.enableMicrophone();
    if (!granted) {
      setShowMicPermissionModal(true);
    }
  }, []);

  const handleSendTextMessage = useCallback((text: string) => {
    if (!liveSessionRef.current) return;
    if (sessionState === 'disconnected') {
      liveSessionRef.current.connect().then(() => {
        liveSessionRef.current?.sendTextMessage(text);
      });
    } else {
      liveSessionRef.current.sendTextMessage(text);
    }
  }, [sessionState]);

  return (
    <div
      id="app-root-container"
      className="relative min-h-screen w-full bg-[#05030a] text-white flex flex-col justify-between select-none overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]"
    >
      {/* Dynamic Futuristic Neon Canvas Background */}
      <FuturisticBackground
        vibe={vibeConfig}
        state={sessionState}
        audioIntensity={audioMetrics.activeIntensity}
      />

      {/* Header Bar */}
      <HeaderBar
        vibe={vibeConfig}
        state={sessionState}
        sessionDuration={sessionDuration}
        selectedVoice={selectedVoice}
        activeEmotion={activeEmotion}
        activeCompanion={activeCompanion}
        onSelectCompanion={handleSelectCompanion}
        isScreenSharing={isScreenSharing}
        isBackgroundMode={isBackgroundMode}
        onOpenPhoneControl={() => setShowPhoneControlModal(true)}
        onOpenVoiceSettings={() => setShowVoiceEmotionModal(true)}
        memoriesCount={memories.length}
        onOpenMemories={() => setShowMemoriesModal(true)}
        onSelectVibe={(vibeKey) => setCurrentVibe(vibeKey)}
        onSelectVoice={handleSelectVoice}
      />

      {/* Real-time Vision Overlay HUD when Screen Sharing or Camera Vision is active */}
      <VisionOverlay
        vibe={vibeConfig}
        screenVision={screenVisionRef.current}
        isSharing={isScreenSharing}
        onStop={() => screenVisionRef.current?.stop()}
        onCaptureNow={handleCaptureImmediateSnapshot}
      />

      {/* Error Banner */}
      {errorMessage && (
        <div
          id="error-banner"
          className="fixed top-16 left-1/2 -translate-x-1/2 w-[92%] max-w-lg z-50 p-3.5 rounded-2xl bg-rose-950/90 border border-rose-500/40 text-rose-100 text-xs shadow-2xl backdrop-blur-xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span className="truncate leading-snug">{errorMessage}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {(errorMessage.toLowerCase().includes('permission') ||
              errorMessage.toLowerCase().includes('denied')) && (
              <button
                id="resolve-mic-permission-btn"
                onClick={() => setShowMicPermissionModal(true)}
                className="px-2.5 py-1 rounded-lg bg-rose-500/30 hover:bg-rose-500/50 border border-rose-400/40 text-white font-medium text-[11px] transition-colors whitespace-nowrap"
              >
                Fix Permission
              </button>
            )}
            <button
              onClick={() => setErrorMessage(null)}
              className="p-1 rounded-lg text-rose-300 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Dismiss error banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Real-time Tool Action HUD / Toast */}
      <ToolActionOverlay
        action={activeToolAction}
        vibe={vibeConfig}
        onDismiss={() => setActiveToolAction(null)}
      />

      {/* Central Voice Stage */}
      <main
        id="voice-stage-main"
        className="flex-1 flex flex-col items-center justify-center relative z-20 px-4 py-4 sm:py-6"
      >
        {/* Subtle holographic aura badge */}
        <div className="mb-4 flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5" style={{ color: vibeConfig.primaryColor }} />
          <span className="text-[11px] font-medium tracking-wide text-white/70">
            {sessionState === 'speaking'
              ? `${COMPANIONS[activeCompanion]?.name || 'Companion'} is speaking live...`
              : sessionState === 'listening'
              ? `${COMPANIONS[activeCompanion]?.name || 'Companion'} is listening with heart • Say anything`
              : sessionState === 'connecting'
              ? 'Opening Gemini Live duplex stream...'
              : `Tap model to talk with ${COMPANIONS[activeCompanion]?.name || 'Mahi'}`}
          </span>
        </div>

        {/* Central Non-Shaking Lifelike Emotional Model */}
        <EmotionalAvatarModel
          vibe={vibeConfig}
          state={sessionState}
          isMuted={isMuted}
          audioVolume={audioMetrics.activeIntensity}
          activeCompanionId={activeCompanion}
          activeEmotion={activeEmotion}
          avatarStyle={avatarStyle}
          onToggleConnect={handleToggleConnect}
          onInterrupt={handleInterrupt}
          onSelectEmotion={handleSelectEmotion}
          onOpenSettings={() => setShowVoiceEmotionModal(true)}
        />
      </main>

      {/* Bottom Mobile-first Control Deck */}
      <ControlBar
        vibe={vibeConfig}
        state={sessionState}
        isMuted={isMuted}
        isOutputMuted={isOutputMuted}
        isMicActive={isMicActive}
        micNotice={micNotice}
        isScreenSharing={isScreenSharing}
        onToggleMute={handleToggleMute}
        onToggleOutputMute={handleToggleOutputMute}
        onEnableMic={handleEnableMic}
        onSendText={handleSendTextMessage}
        onInterrupt={handleInterrupt}
        onDisconnect={handleDisconnect}
        onOpenQuickPromptHelp={() => setShowPromptHelp(true)}
        onOpenPhoneControl={() => setShowPhoneControlModal(true)}
        onToggleVision={handleToggleScreenShare}
      />

      {/* Quick Prompts / Persona Tips Modal */}
      <QuickPromptsModal
        isOpen={showPromptHelp}
        vibe={vibeConfig}
        onClose={() => setShowPromptHelp(false)}
      />

      {/* Mahi's Permanent Memory Bank Modal */}
      <MemoriesModal
        isOpen={showMemoriesModal}
        memories={memories}
        vibe={vibeConfig}
        onClose={() => setShowMemoriesModal(false)}
        onAddMemory={handleAddMemory}
        onDeleteMemory={handleDeleteMemory}
        onClearAll={handleClearAllMemories}
      />

      {/* Microphone Permission Recovery Modal */}
      <MicrophonePermissionModal
        isOpen={showMicPermissionModal}
        vibe={vibeConfig}
        errorMessage={errorMessage}
        onClose={() => setShowMicPermissionModal(false)}
        onRetry={handleToggleConnect}
        onContinueTextMode={() => {
          setShowMicPermissionModal(false);
          if (sessionState === 'disconnected') {
            liveSessionRef.current?.connect();
          }
        }}
      />

      {/* Phone Apps & System Controls Modal */}
      <PhoneControlModal
        isOpen={showPhoneControlModal}
        vibe={vibeConfig}
        activeCompanion={activeCompanion}
        onSelectCompanion={handleSelectCompanion}
        screenVision={screenVisionRef.current}
        isScreenSharing={isScreenSharing}
        onToggleScreenShare={handleToggleScreenShare}
        onToggleCameraVision={handleToggleCameraVision}
        onClose={() => setShowPhoneControlModal(false)}
      />

      {/* Voice, Emotion & Model Settings Modal */}
      <VoiceEmotionSettingsModal
        isOpen={showVoiceEmotionModal}
        vibe={vibeConfig}
        selectedVoice={selectedVoice}
        activeEmotion={activeEmotion}
        avatarStyle={avatarStyle}
        onSelectVoice={handleSelectVoice}
        onSelectEmotion={handleSelectEmotion}
        onSelectAvatarStyle={(style) => setAvatarStyle(style)}
        onClose={() => setShowVoiceEmotionModal(false)}
      />
    </div>
  );
}
