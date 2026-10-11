import React from 'react';
import { Sparkles, X, MessageSquare, Globe, Palette, Dices, Smartphone } from 'lucide-react';
import { VibeConfig } from '../types';

interface Props {
  isOpen: boolean;
  vibe: VibeConfig;
  onClose: () => void;
}

export const QuickPromptsModal: React.FC<Props> = ({ isOpen, vibe, onClose }) => {
  if (!isOpen) return null;

  const promptCategories = [
    {
      title: 'Phone Apps (Voice Launch)',
      icon: <Smartphone className="w-4 h-4 text-emerald-400" />,
      prompts: [
        'WhatsApp kholo, kisi ko message bhejna hai.',
        'YouTube chalao aur koi mast gaana lagao.',
        'Camera kholo ek photo leni hai.',
        'Phone dialer kholo call lagani hai.',
        'Google Maps kholo rasta dekhna hai.',
      ],
    },
    {
      title: 'Tools & Actions',
      icon: <Globe className="w-4 h-4 text-sky-400" />,
      prompts: [
        'Open Spotify for me.',
        'Change the vibe to cyber violet or matrix green.',
        'Search the web for upcoming space missions.',
        'What time and date is it right now?',
      ],
    },
    {
      title: 'Sassy Banter & Flirty Fun',
      icon: <Sparkles className="w-4 h-4 text-pink-400" />,
      prompts: [
        'Be honest with me, Mahi—how do I look today?',
        'Give me your sharpest, most savage one-liner.',
        'Are you always this cheeky or am I just special?',
        'Tell me a secret about yourself.',
      ],
    },
    {
      title: 'Decisions & Games',
      icon: <Dices className="w-4 h-4 text-amber-400" />,
      prompts: [
        'Flip a coin: heads I hit the gym, tails I take a nap.',
        'Roll a 6-sided dice for me.',
        'What time and day is it right now?',
      ],
    },
  ];

  return (
    <div
      id="quick-prompts-modal-backdrop"
      className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="quick-prompts-modal-card"
        className="w-full max-w-lg rounded-2xl bg-[#0f0a1d] border border-white/15 p-6 shadow-2xl relative max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-white/50 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-lg"
            style={{
              borderColor: vibe.primaryColor,
              background: 'rgba(255, 255, 255, 0.05)',
              boxShadow: `0 0 15px ${vibe.glowColor}`,
            }}
          >
            <MessageSquare className="w-5 h-5" style={{ color: vibe.primaryColor }} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white font-['Outfit']">
              Conversational Sparks
            </h3>
            <p className="text-xs text-white/60">
              Things to say aloud to Mahi
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {promptCategories.map((cat, idx) => (
            <div key={idx} className="p-3.5 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-white/90">
                {cat.icon}
                <span>{cat.title}</span>
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {cat.prompts.map((p, pIdx) => (
                  <div
                    key={pIdx}
                    className="p-2 rounded-lg bg-black/30 border border-white/5 text-xs text-white/75 font-mono"
                  >
                    "{p}"
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 pt-3 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition-colors"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
