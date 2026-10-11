import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Volume2,
  Heart,
  User,
  Sparkles,
  Check,
  Play,
  RotateCw,
  Sliders,
  Shield,
  Smile,
  Zap,
} from 'lucide-react';
import { VibeConfig, EmotionMode, AvatarModelStyle, VoiceOption } from '../types';
import { VOICE_OPTIONS, EMOTION_PRESETS } from '../data/vibes';

interface Props {
  isOpen: boolean;
  vibe: VibeConfig;
  selectedVoice: string;
  activeEmotion: EmotionMode;
  avatarStyle: AvatarModelStyle;
  onSelectVoice: (voiceId: string) => void;
  onSelectEmotion: (emotion: EmotionMode) => void;
  onSelectAvatarStyle: (style: AvatarModelStyle) => void;
  onClose: () => void;
}

export const VoiceEmotionSettingsModal: React.FC<Props> = ({
  isOpen,
  vibe,
  selectedVoice,
  activeEmotion,
  avatarStyle,
  onSelectVoice,
  onSelectEmotion,
  onSelectAvatarStyle,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'voices' | 'emotions' | 'avatar'>('voices');
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);

  if (!isOpen) return null;

  // Group voices by gender
  const femaleVoices = VOICE_OPTIONS.filter((v) => v.gender === 'female');
  const maleVoices = VOICE_OPTIONS.filter((v) => v.gender === 'male');

  const handleSimulateVoicePreview = (voiceId: string) => {
    setPreviewingVoice(voiceId);

    // Play a gentle musical test sound tone with Web Audio API for interactive feedback
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      // Pitch variation based on voice
      const pitchMap: Record<string, number> = {
        Aoede: 440,
        Kore: 392,
        Zephyr: 494,
        Puck: 330,
        Fenrir: 220,
        Charon: 260,
      };

      osc.frequency.setValueAtTime(pitchMap[voiceId] || 440, audioCtx.currentTime);
      osc.type = 'sine';

      gain.gain.setValueAtTime(0.01, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.8);
    } catch {}

    setTimeout(() => {
      setPreviewingVoice(null);
    }, 1200);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          className="relative w-full max-w-xl max-h-[92vh] flex flex-col rounded-3xl bg-[#120c24] border border-white/20 shadow-2xl overflow-hidden text-white"
          style={{
            boxShadow: `0 25px 60px rgba(0, 0, 0, 0.9), 0 0 40px ${vibe.primaryColor}20`,
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/5">
            <div className="flex items-center gap-2.5">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
                style={{
                  backgroundColor: vibe.primaryColor,
                  boxShadow: `0 0 15px ${vibe.primaryColor}60`,
                }}
              >
                <Sliders className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                  <span>Voice & Emotion Settings</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/40">
                    Human Touch
                  </span>
                </h2>
                <p className="text-xs text-white/60">
                  वॉइस (Male/Female), मानवीय भावनाएं और 3D मॉडल स्टाइल
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close settings"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 px-4 pt-3 pb-2 border-b border-white/10 bg-black/20">
            <button
              onClick={() => setActiveTab('voices')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'voices'
                  ? 'bg-white/15 text-white shadow border border-white/20'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5 text-pink-400" />
              <span>Voices (आवाजें)</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-pink-500/30 text-pink-200">
                {VOICE_OPTIONS.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('emotions')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'emotions'
                  ? 'bg-white/15 text-white shadow border border-white/20'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Heart className="w-3.5 h-3.5 text-rose-400" />
              <span>Emotions (इमोशन)</span>
            </button>

            <button
              onClick={() => setActiveTab('avatar')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'avatar'
                  ? 'bg-white/15 text-white shadow border border-white/20'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Model (मॉडल)</span>
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
            {/* TAB 1: VOICES (3-4 Male & Female with Human Touch) */}
            {activeTab === 'voices' && (
              <div className="space-y-5">
                {/* Female Voices Section */}
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-pink-400 flex items-center gap-1.5">
                      <span>👩</span> Female Voices (महिला आवाजें)
                    </span>
                    <div className="flex-1 h-px bg-pink-500/20" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {femaleVoices.map((voice) => {
                      const isSelected = selectedVoice === voice.id;
                      const isPreviewing = previewingVoice === voice.id;
                      return (
                        <div
                          key={voice.id}
                          className={`relative p-3.5 rounded-2xl border transition-all text-left flex flex-col justify-between ${
                            isSelected
                              ? 'bg-gradient-to-br from-pink-500/20 to-purple-500/20 border-pink-500/60 shadow-lg'
                              : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-white">{voice.name}</span>
                                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-200 border border-pink-500/30">
                                  {voice.emotionalTag}
                                </span>
                              </div>
                              {isSelected && (
                                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                                  <Check className="w-3.5 h-3.5" />
                                  Active
                                </span>
                              )}
                            </div>

                            <p className="text-[11px] text-pink-300 font-medium mb-1">
                              {voice.hindiName}
                            </p>
                            <p className="text-[11px] text-white/70 leading-relaxed mb-2">
                              {voice.description}
                            </p>

                            {/* Sample dialogue box */}
                            <div className="p-2 rounded-xl bg-black/30 border border-white/5 text-[10px] text-white/80 italic mb-3">
                              "{voice.samplePhrase}"
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                            <button
                              onClick={() => handleSimulateVoicePreview(voice.id)}
                              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-medium transition-all ${
                                isPreviewing
                                  ? 'bg-pink-500 text-white'
                                  : 'bg-white/10 hover:bg-white/20 text-white/90'
                              }`}
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                              <span>{isPreviewing ? 'Testing...' : 'Test Tone'}</span>
                            </button>

                            <button
                              onClick={() => onSelectVoice(voice.id)}
                              disabled={isSelected}
                              className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold transition-all ${
                                isSelected
                                  ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 cursor-default'
                                  : 'bg-pink-500 hover:bg-pink-400 text-white shadow-md'
                              }`}
                            >
                              {isSelected ? 'Selected' : 'Use Voice'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Male Voices Section */}
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <span>👨</span> Male Voices (पुरुष आवाजें)
                    </span>
                    <div className="flex-1 h-px bg-amber-500/20" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {maleVoices.map((voice) => {
                      const isSelected = selectedVoice === voice.id;
                      const isPreviewing = previewingVoice === voice.id;
                      return (
                        <div
                          key={voice.id}
                          className={`relative p-3.5 rounded-2xl border transition-all text-left flex flex-col justify-between ${
                            isSelected
                              ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-amber-500/60 shadow-lg'
                              : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-white">{voice.name}</span>
                                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200 border border-amber-500/30">
                                  {voice.emotionalTag}
                                </span>
                              </div>
                              {isSelected && (
                                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                                  <Check className="w-3.5 h-3.5" />
                                  Active
                                </span>
                              )}
                            </div>

                            <p className="text-[11px] text-amber-300 font-medium mb-1">
                              {voice.hindiName}
                            </p>
                            <p className="text-[11px] text-white/70 leading-relaxed mb-2">
                              {voice.description}
                            </p>

                            {/* Sample dialogue box */}
                            <div className="p-2 rounded-xl bg-black/30 border border-white/5 text-[10px] text-white/80 italic mb-3">
                              "{voice.samplePhrase}"
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                            <button
                              onClick={() => handleSimulateVoicePreview(voice.id)}
                              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-medium transition-all ${
                                isPreviewing
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-white/10 hover:bg-white/20 text-white/90'
                              }`}
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                              <span>{isPreviewing ? 'Testing...' : 'Test Tone'}</span>
                            </button>

                            <button
                              onClick={() => onSelectVoice(voice.id)}
                              disabled={isSelected}
                              className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold transition-all ${
                                isSelected
                                  ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 cursor-default'
                                  : 'bg-amber-500 hover:bg-amber-400 text-black font-bold shadow-md'
                              }`}
                            >
                              {isSelected ? 'Selected' : 'Use Voice'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: EMOTIONS (इमोशनल मोड्स और मानवीय एहसास) */}
            {activeTab === 'emotions' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-pink-500/15 to-purple-500/15 border border-pink-500/30 text-xs text-white/90 leading-relaxed">
                  <span className="font-bold text-pink-300">💖 सच्चा मानवीय एहसास: </span>
                  यहाँ से आप अपने असिस्टेंट की भावनात्मक टोन बदल सकते हैं। यह हर मूड में आपकी भावनाएं समझकर उसी अंदाज़ में बातचीत करेगा।
                </div>

                <div className="space-y-2.5">
                  {EMOTION_PRESETS.map((preset) => {
                    const isSelected = activeEmotion === preset.id;
                    return (
                      <button
                        key={preset.id}
                        onClick={() => onSelectEmotion(preset.id)}
                        className={`w-full p-4 rounded-2xl border transition-all text-left flex items-start gap-3.5 ${
                          isSelected
                            ? 'bg-white/15 border-white/40 shadow-xl'
                            : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                        }`}
                        style={{
                          borderColor: isSelected ? `${preset.color}80` : undefined,
                          boxShadow: isSelected ? `0 0 20px ${preset.color}30` : undefined,
                        }}
                      >
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 shadow-md"
                          style={{ backgroundColor: preset.bgRgba }}
                        >
                          {preset.icon}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-white">{preset.name}</span>
                              <span className="text-[11px] text-white/50">({preset.hindiName})</span>
                            </div>
                            {isSelected && (
                              <span
                                className="flex items-center gap-1 text-[11px] font-semibold"
                                style={{ color: preset.color }}
                              >
                                <Check className="w-3.5 h-3.5" />
                                Selected
                              </span>
                            )}
                          </div>

                          <p className="text-xs font-medium text-pink-300 mb-1">
                            {preset.hindiTagline}
                          </p>
                          <p className="text-[11px] text-white/70 leading-relaxed">
                            {preset.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: AVATAR MODEL STYLE (मॉडल विकल्प - No Shaking!) */}
            {activeTab === 'avatar' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/15 to-cyan-500/15 border border-emerald-500/30 text-xs text-white/90 leading-relaxed">
                  <span className="font-bold text-emerald-300">✨ हिलने-डुलने की समस्या ठीक की गई: </span>
                  नया मॉडल स्मूथ मोशन और मानवीय स्पर्श के साथ डिज़ाइन किया गया है। बोलते समय कोई कंपन या अवांछित हिलना-डुलना नहीं होगा।
                </div>

                <div className="space-y-3">
                  {/* Style 1: Human Touch Avatar */}
                  <button
                    onClick={() => onSelectAvatarStyle('human-avatar')}
                    className={`w-full p-4 rounded-2xl border transition-all text-left flex items-start gap-3.5 ${
                      avatarStyle === 'human-avatar'
                        ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 border-pink-500/60 shadow-xl'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="w-11 h-11 rounded-2xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-2xl shrink-0">
                      👤
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm text-white">
                          Human Touch Avatar (इमोशनल ह्यूमन अवतार)
                        </span>
                        {avatarStyle === 'human-avatar' && (
                          <span className="text-emerald-400 font-semibold text-xs flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-pink-300 mb-1">
                        पलकें झपकाना, मुस्कान, प्राकृतिक सांस और स्मूथ लिप-सिंक
                      </p>
                      <p className="text-[11px] text-white/60">
                        जीवंत मानवीय अहसास। बोलते समय बिल्कुल नहीं हिलेगा, केवल चेहरे और होंठों के कोमल भाव बदलेंगे।
                      </p>
                    </div>
                  </button>

                  {/* Style 2: Smooth Crystal Halo */}
                  <button
                    onClick={() => onSelectAvatarStyle('luminous-halo')}
                    className={`w-full p-4 rounded-2xl border transition-all text-left flex items-start gap-3.5 ${
                      avatarStyle === 'luminous-halo'
                        ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-cyan-500/60 shadow-xl'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="w-11 h-11 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-2xl shrink-0">
                      🔮
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm text-white">
                          Smooth Crystal Halo (स्मूथ क्रिस्टल हेलो)
                        </span>
                        {avatarStyle === 'luminous-halo' && (
                          <span className="text-emerald-400 font-semibold text-xs flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-cyan-300 mb-1">
                        शांत, खूबसूरत क्रिस्टल कोर और कोमल रोशनी का रिंग
                      </p>
                      <p className="text-[11px] text-white/60">
                        अल्ट्रा-स्मूथ लिक्विड ग्लास और शांत आंतरिक चमक। कोई जिटर या वाइब्रेशन नहीं।
                      </p>
                    </div>
                  </button>

                  {/* Style 3: Harmonic Waves */}
                  <button
                    onClick={() => onSelectAvatarStyle('harmonic-waves')}
                    className={`w-full p-4 rounded-2xl border transition-all text-left flex items-start gap-3.5 ${
                      avatarStyle === 'harmonic-waves'
                        ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500/60 shadow-xl'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-2xl shrink-0">
                      🌊
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm text-white">
                          Harmonic Waves (शांत हार्मोनिक तरंगें)
                        </span>
                        {avatarStyle === 'harmonic-waves' && (
                          <span className="text-emerald-400 font-semibold text-xs flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-amber-300 mb-1">
                        धीमी, कोमल रिदमिक वेव्स
                      </p>
                      <p className="text-[11px] text-white/60">
                        आवाज के उतार-चढ़ाव को कोमलता से दर्शाने वाली शांत सिल्क वेव्स।
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/10 bg-black/40 flex items-center justify-between">
            <div className="text-xs text-white/50">
              Active: <span className="text-white font-medium">{selectedVoice}</span> •{' '}
              <span className="text-pink-300 font-medium capitalize">{activeEmotion}</span>
            </div>

            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-white text-black hover:bg-white/90 transition-all shadow-lg active:scale-95"
            >
              Done (पूर्ण)
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
