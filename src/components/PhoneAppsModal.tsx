import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Smartphone,
  MessageCircle,
  Youtube,
  Phone,
  Camera,
  Music,
  MapPin,
  Mail,
  Send,
  Download,
  Settings,
  Calculator,
  Play,
  Check,
  Radio,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { VibeConfig } from '../types';
import { launchMobileApp, SUPPORTED_PHONE_APPS } from '../utils/mobileAppLauncher';

interface Props {
  isOpen: boolean;
  vibe: VibeConfig;
  isConnected: boolean;
  onClose: () => void;
}

export const PhoneAppsModal: React.FC<Props> = ({
  isOpen,
  vibe,
  isConnected,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'apps' | 'background'>('apps');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);
  const [lastLaunchedApp, setLastLaunchedApp] = useState<string | null>(null);

  useEffect(() => {
    // Listen for PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
        setInstallSuccess(true);
      }
      setDeferredPrompt(null);
    } else {
      // Manual guide instructions shown in UI
    }
  };

  const handleQuickLaunch = (appId: string) => {
    const res = launchMobileApp(appId);
    setLastLaunchedApp(res.appTitle);
    setTimeout(() => {
      setLastLaunchedApp(null);
    }, 3000);
  };

  const appCards = [
    {
      id: 'whatsapp',
      title: 'WhatsApp',
      voicePrompt: '"WhatsApp kholo" / "WhatsApp par message bhejo"',
      icon: <MessageCircle className="w-5 h-5 text-emerald-400" />,
      tag: 'Chat & Call',
    },
    {
      id: 'youtube',
      title: 'YouTube',
      voicePrompt: '"YouTube chalao" / "Arijit Singh ke gaane chalao"',
      icon: <Youtube className="w-5 h-5 text-rose-400" />,
      tag: 'Video & Songs',
    },
    {
      id: 'phone',
      title: 'Phone / Dialer',
      voicePrompt: '"Call lagao" / "Phone dialer kholo"',
      icon: <Phone className="w-5 h-5 text-sky-400" />,
      tag: 'Voice Calling',
    },
    {
      id: 'camera',
      title: 'Camera',
      voicePrompt: '"Camera kholo" / "Photo kheecho"',
      icon: <Camera className="w-5 h-5 text-amber-400" />,
      tag: 'Photo & Video',
    },
    {
      id: 'spotify',
      title: 'Spotify',
      voicePrompt: '"Spotify kholo" / "Gaana sunao"',
      icon: <Music className="w-5 h-5 text-green-400" />,
      tag: 'Music Player',
    },
    {
      id: 'maps',
      title: 'Google Maps',
      voicePrompt: '"Google Maps kholo" / "Rasta dikhao"',
      icon: <MapPin className="w-5 h-5 text-indigo-400" />,
      tag: 'GPS Navigation',
    },
    {
      id: 'instagram',
      title: 'Instagram',
      voicePrompt: '"Instagram kholo" / "Reels dikhao"',
      icon: <Radio className="w-5 h-5 text-pink-400" />,
      tag: 'Social & Reels',
    },
    {
      id: 'gmail',
      title: 'Gmail / Mail',
      voicePrompt: '"Gmail kholo" / "Email check karo"',
      icon: <Mail className="w-5 h-5 text-red-400" />,
      tag: 'Email',
    },
    {
      id: 'telegram',
      title: 'Telegram',
      voicePrompt: '"Telegram kholo"',
      icon: <Send className="w-5 h-5 text-cyan-400" />,
      tag: 'Messenger',
    },
    {
      id: 'settings',
      title: 'Settings',
      voicePrompt: '"Phone Settings kholo"',
      icon: <Settings className="w-5 h-5 text-slate-300" />,
      tag: 'System',
    },
    {
      id: 'calculator',
      title: 'Calculator',
      voicePrompt: '"Calculator kholo" / "Hisab lagao"',
      icon: <Calculator className="w-5 h-5 text-teal-300" />,
      tag: 'Math Tool',
    },
    {
      id: 'playstore',
      title: 'Play Store',
      voicePrompt: '"Play Store kholo"',
      icon: <Download className="w-5 h-5 text-emerald-300" />,
      tag: 'App Store',
    },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl bg-[#0d0918] border border-white/15 shadow-2xl overflow-hidden text-white"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center border"
                style={{
                  backgroundColor: `${vibe.primaryColor}20`,
                  borderColor: `${vibe.primaryColor}40`,
                }}
              >
                <Smartphone className="w-5 h-5" style={{ color: vibe.primaryColor }} />
              </div>
              <div>
                <h3 className="font-semibold text-base text-white flex items-center gap-2">
                  Phone Apps & Background Mode
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Live
                  </span>
                </h3>
                <p className="text-xs text-white/60">
                  Mahi background me chalta hai aur phone apps open karta hai
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-white/10 px-4 bg-black/20">
            <button
              onClick={() => setActiveTab('apps')}
              className={`py-2.5 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'apps'
                  ? 'border-pink-500 text-white'
                  : 'border-transparent text-white/50 hover:text-white/80'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Phone Apps (Voice Launch)</span>
            </button>
            <button
              onClick={() => setActiveTab('background')}
              className={`py-2.5 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'background'
                  ? 'border-purple-500 text-white'
                  : 'border-transparent text-white/50 hover:text-white/80'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Background Running & Install</span>
            </button>
          </div>

          {/* Body content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {lastLaunchedApp && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-200 flex items-center justify-between"
              >
                <span>Launched <strong>{lastLaunchedApp}</strong> on your phone! Mahi stays active.</span>
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              </motion.div>
            )}

            {activeTab === 'apps' ? (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white/80 leading-relaxed">
                  <p className="font-medium text-white mb-1">
                    🗣️ Speak naturally in Hindi, Hinglish, or English:
                  </p>
                  <p className="text-white/60">
                    Just say <strong className="text-pink-300">"WhatsApp kholo"</strong>, <strong className="text-rose-300">"YouTube chalao"</strong>, or <strong className="text-amber-300">"Camera kholo"</strong>. Mahi will trigger the native app on your phone while continuing to speak with you!
                  </p>
                </div>

                {/* Grid of supported apps */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {appCards.map((app) => (
                    <div
                      key={app.id}
                      className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 flex items-center justify-between gap-2 group transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                          {app.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-semibold text-white truncate">
                              {app.title}
                            </h4>
                            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-white/10 text-white/60">
                              {app.tag}
                            </span>
                          </div>
                          <p className="text-[10px] text-white/50 truncate mt-0.5">
                            {app.voicePrompt}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleQuickLaunch(app.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-[11px] font-semibold text-white/90 hover:text-white shrink-0 flex items-center gap-1 transition-all"
                        title={`Test opening ${app.title}`}
                      >
                        <span>Open</span>
                        <ExternalLink className="w-3 h-3 text-white/60" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Active Background Status Card */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-purple-950/40 to-black/60 border border-purple-500/30 relative overflow-hidden">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center shrink-0 text-purple-300">
                      <Radio className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">
                        Background Voice Active
                      </h4>
                      <p className="text-xs text-white/70 mt-1 leading-relaxed">
                        Mahi maintains an active audio session with <strong>MediaSession notification</strong> and <strong>Screen WakeLock</strong>. You can switch to WhatsApp or any other app while Mahi continues speaking.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Install App as Phone Application (PWA) */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                        Install Mahi on Phone Screen
                        {isInstalled && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Installed
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-white/60 mt-0.5">
                        Add to your Android or iPhone home screen as a standalone phone app.
                      </p>
                    </div>
                  </div>

                  {deferredPrompt ? (
                    <button
                      onClick={handleInstallClick}
                      className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 shadow-lg shadow-pink-500/20 flex items-center justify-center gap-2 transition-all"
                    >
                      <Download className="w-4 h-4" />
                      <span>Install Mahi App on Phone</span>
                    </button>
                  ) : isInstalled ? (
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Mahi is installed in Standalone Mode on your device!</span>
                    </div>
                  ) : (
                    <div className="space-y-2 text-xs text-white/70 bg-black/30 p-3 rounded-lg border border-white/5">
                      <p className="font-semibold text-white/90">How to add to phone home screen:</p>
                      <ul className="list-disc pl-4 space-y-1 text-[11px] text-white/60">
                        <li><strong>Android (Chrome):</strong> Tap the <strong>3 dots menu ⋮</strong> &rarr; tap <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong>.</li>
                        <li><strong>iPhone (Safari):</strong> Tap the <strong>Share button ⎋</strong> &rarr; tap <strong>"Add to Home Screen" ⊞</strong>.</li>
                      </ul>
                    </div>
                  )}
                </div>

                {/* Tips for Best Background Experience */}
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-xs space-y-2">
                  <h5 className="font-semibold text-white/90">💡 Background Running Tips:</h5>
                  <div className="space-y-1.5 text-[11px] text-white/60">
                    <p>• <strong>Notification Controls:</strong> Check your phone's notification bar while connected; Mahi will appear as an ongoing media call.</p>
                    <p>• <strong>Dedicated Window:</strong> For the most reliable background microphone access on Android, use the browser in a standalone tab or installed app mode.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-white/10 bg-black/40 flex items-center justify-between text-xs text-white/50">
            <span>Powered by Gemini Live API</span>
            <button
              onClick={onClose}
              className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
