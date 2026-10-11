import React, { useState } from 'react';
import { MicOff, ExternalLink, RefreshCw, X, ShieldAlert, Check, MessageSquare } from 'lucide-react';
import { VibeConfig } from '../types';
import { AudioStreamer } from '../services/AudioStreamer';

interface Props {
  isOpen: boolean;
  vibe: VibeConfig;
  errorMessage?: string | null;
  onClose: () => void;
  onRetry: () => void;
  onContinueTextMode?: () => void;
}

export const MicrophonePermissionModal: React.FC<Props> = ({
  isOpen,
  vibe,
  errorMessage,
  onClose,
  onRetry,
  onContinueTextMode,
}) => {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retrySuccess, setRetrySuccess] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTryAgain = async () => {
    setIsRetrying(true);
    setRequestError(null);
    try {
      const result = await AudioStreamer.checkAndRequestPermission();
      setIsRetrying(false);
      if (result.granted) {
        setRetrySuccess(true);
        setTimeout(() => {
          setRetrySuccess(false);
          onRetry();
          onClose();
        }, 600);
      } else {
        setRequestError(
          result.error ||
            'Permission was still not granted. Please check your browser site settings or open the app in a new tab.'
        );
      }
    } catch (e: any) {
      setIsRetrying(false);
      setRequestError(e?.message || 'Failed to request permission.');
    }
  };

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '#';

  return (
    <div
      id="mic-permission-modal-backdrop"
      className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="mic-permission-modal-card"
        className="w-full max-w-md rounded-2xl bg-[#0f091a] border border-rose-500/30 p-6 shadow-2xl relative text-left"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: `0 20px 50px -10px rgba(244, 63, 94, 0.25)`,
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-white/50 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon & Title */}
        <div className="flex items-center gap-3.5 mb-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center shrink-0 shadow-lg shadow-rose-500/10">
            <MicOff className="w-6 h-6 text-rose-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white font-['Outfit']">
              Microphone Permission Needed
            </h3>
            <p className="text-xs text-rose-300/80">
              Voice-to-voice stream requires mic access
            </p>
          </div>
        </div>

        <p className="text-xs text-white/75 leading-relaxed mb-4">
          Mahi is a real-time voice AI and communicates purely through speech. Your browser or embedded preview has blocked microphone permissions.
        </p>

        {/* Specific Error Callout if available */}
        {(requestError || errorMessage) && (
          <div className="mb-4 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-2 text-xs text-rose-200">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span className="leading-snug">{requestError || errorMessage}</span>
          </div>
        )}

        {/* Actionable Steps */}
        <div className="space-y-2.5 mb-5 text-xs">
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-white/10 text-white font-mono flex items-center justify-center text-[10px] shrink-0 mt-0.5">
              1
            </span>
            <div>
              <p className="font-semibold text-white/90">Open in a Dedicated Browser Tab</p>
              <p className="text-white/60 text-[11px] mt-0.5">
                Iframes (embedded preview windows) block direct hardware microphone prompts. Opening in a new window/tab gives your browser direct access to ask for microphone permission.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-white/10 text-white font-mono flex items-center justify-center text-[10px] shrink-0 mt-0.5">
              2
            </span>
            <div>
              <p className="font-semibold text-white/90">Allow Microphone in Address Bar</p>
              <p className="text-white/60 text-[11px] mt-0.5">
                Click the padlock / tune icon (left of the web address) &rarr; Site settings &rarr; Microphone &rarr; set to <strong className="text-emerald-400">Allow</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <a
            id="open-in-new-tab-link"
            href={currentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold text-white flex items-center justify-center gap-2 transition-all shadow-md"
          >
            <span>Open in New Tab</span>
            <ExternalLink className="w-3.5 h-3.5 text-white/70" />
          </a>

          <button
            id="retry-permission-button"
            onClick={handleTryAgain}
            disabled={isRetrying}
            className="w-full sm:flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 transition-all shadow-lg"
            style={{
              background: retrySuccess
                ? '#10b981'
                : `linear-gradient(135deg, ${vibe.primaryColor} 0%, ${vibe.accentColor} 100%)`,
              boxShadow: `0 0 20px ${vibe.glowColor}`,
            }}
          >
            {retrySuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>Granted! Connecting...</span>
              </>
            ) : isRetrying ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Requesting...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                <span>Request Permission Again</span>
              </>
            )}
          </button>
        </div>

        {/* Continue in Keyboard / Text & Speaker Mode */}
        {onContinueTextMode && (
          <button
            id="continue-text-mode-button"
            onClick={() => {
              onClose();
              onContinueTextMode();
            }}
            className="w-full mt-3 py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white/70 hover:text-white flex items-center justify-center gap-2 transition-all"
          >
            <MessageSquare className="w-3.5 h-3.5 text-pink-400" />
            <span>Continue with Keyboard & Voice Speaker (No Mic Needed)</span>
          </button>
        )}
      </div>
    </div>
  );
};
