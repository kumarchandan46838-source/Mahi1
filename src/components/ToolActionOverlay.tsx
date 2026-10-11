import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ExternalLink, Globe, Sparkles, Search, Clock, Dices, X, Smartphone, MessageCircle, Youtube, Phone, Camera } from 'lucide-react';
import { ToolActionRecord, VibeConfig } from '../types';

interface Props {
  action: ToolActionRecord | null;
  vibe: VibeConfig;
  onDismiss: () => void;
}

export const ToolActionOverlay: React.FC<Props> = ({ action, vibe, onDismiss }) => {
  if (!action) return null;

  const getToolIcon = (name: string, args: Record<string, unknown>) => {
    switch (name) {
      case 'openPhoneApp': {
        const app = ((args.appName as string) || '').toLowerCase();
        if (app.includes('whatsapp')) return <MessageCircle className="w-5 h-5 text-emerald-400" />;
        if (app.includes('youtube')) return <Youtube className="w-5 h-5 text-rose-400" />;
        if (app.includes('phone') || app.includes('call')) return <Phone className="w-5 h-5 text-sky-400" />;
        if (app.includes('camera')) return <Camera className="w-5 h-5 text-amber-400" />;
        return <Smartphone className="w-5 h-5 text-pink-400" />;
      }
      case 'openWebsite':
        return <Globe className="w-5 h-5" style={{ color: vibe.primaryColor }} />;
      case 'changeVibe':
        return <Sparkles className="w-5 h-5 text-amber-400" />;
      case 'searchWeb':
        return <Search className="w-5 h-5 text-sky-400" />;
      case 'getTimeAndDate':
        return <Clock className="w-5 h-5 text-emerald-400" />;
      case 'flipCoinOrRollDice':
        return <Dices className="w-5 h-5 text-pink-400" />;
      default:
        return <Sparkles className="w-5 h-5" style={{ color: vibe.primaryColor }} />;
    }
  };

  const getTitle = (name: string, args: Record<string, unknown>) => {
    if (name === 'openPhoneApp') {
      const appTitle = (action.result?.appTitle as string) || (args.appName as string) || 'Phone App';
      return `Launched ${appTitle} on Phone`;
    }
    if (name === 'openWebsite') {
      return `Opened ${args.name || args.url || 'Website'}`;
    }
    if (name === 'changeVibe') {
      return `Shifted Vibe to ${args.vibe || 'New Atmosphere'}`;
    }
    if (name === 'searchWeb') {
      return `Web Search: "${args.query || ''}"`;
    }
    if (name === 'getTimeAndDate') {
      return 'Checked Time & Date';
    }
    if (name === 'flipCoinOrRollDice') {
      return `Flipped / Rolled ${args.type || 'Random'}`;
    }
    return `Action: ${name}`;
  };

  return (
    <AnimatePresence>
      <motion.div
        id="tool-action-overlay-hud"
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="fixed top-20 left-1/2 -translate-x-1/2 w-[92%] max-w-md z-40"
      >
        <div
          className="rounded-2xl p-4 backdrop-blur-2xl bg-[#0e0a1a]/95 border shadow-2xl flex items-start gap-3.5 relative overflow-hidden"
          style={{
            borderColor: 'rgba(255, 255, 255, 0.18)',
            boxShadow: `0 20px 40px -10px ${vibe.glowColor}`,
          }}
        >
          {/* Top highlight glow line */}
          <div
            className="absolute top-0 left-0 right-0 h-[2px]"
            style={{
              background: `linear-gradient(90deg, transparent 0%, ${vibe.primaryColor} 50%, transparent 100%)`,
            }}
          />

          {/* Tool Icon */}
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
            {getToolIcon(action.name, action.args)}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-pink-400 font-semibold flex items-center gap-1">
                {action.name === 'openPhoneApp' ? (
                  <>
                    <Smartphone className="w-3 h-3" />
                    <span>Mobile App Triggered</span>
                  </>
                ) : (
                  <span>Mahi Executed Tool</span>
                )}
              </span>
              <span className="text-[10px] text-white/30">• Active in background</span>
            </div>

            <h4 className="text-sm font-semibold text-white truncate mt-0.5">
              {getTitle(action.name, action.args)}
            </h4>

            {action.message && (
              <p className="text-xs text-white/70 mt-1 italic leading-snug">
                "{action.message}"
              </p>
            )}

            {/* Quick Action Link / Phone App button */}
            {action.url && (
              <div className="mt-2.5 flex items-center gap-2">
                <a
                  href={action.url}
                  target={action.name === 'openPhoneApp' ? '_self' : '_blank'}
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-white bg-white/15 hover:bg-white/25 border border-white/15 transition-all"
                >
                  <span>{action.name === 'openPhoneApp' ? 'Open App' : 'Open URL'}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <span className="text-[11px] text-white/40 truncate max-w-[180px]">
                  {action.name === 'openPhoneApp' ? 'Deep-link ready' : action.url}
                </span>
              </div>
            )}
          </div>

          {/* Dismiss button */}
          <button
            onClick={onDismiss}
            className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
