import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Smartphone,
  Radio,
  Zap,
  Eye,
  Sliders,
  Battery,
  BatteryCharging,
  MapPin,
  Volume2,
  Phone,
  MessageSquare,
  Copy,
  Moon,
  Sun,
  Shield,
  Check,
  Video,
  Monitor,
  Camera,
  Play,
  RotateCw,
  ExternalLink,
  Sparkles,
  Users,
} from 'lucide-react';
import { VibeConfig, CompanionId } from '../types';
import { COMPANIONS, CompanionProfile } from '../data/companions';
import { deviceController, DeviceBatteryStatus, DeviceLocation } from '../utils/deviceController';
import { ScreenVisionService } from '../services/ScreenVision';

interface Props {
  isOpen: boolean;
  vibe: VibeConfig;
  activeCompanion: CompanionId;
  onSelectCompanion: (companionId: CompanionId) => void;
  screenVision: ScreenVisionService | null;
  isScreenSharing: boolean;
  onToggleScreenShare: () => void;
  onToggleCameraVision: () => void;
  onClose: () => void;
}

export const PhoneControlModal: React.FC<Props> = ({
  isOpen,
  vibe,
  activeCompanion,
  onSelectCompanion,
  screenVision,
  isScreenSharing,
  onToggleScreenShare,
  onToggleCameraVision,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'hardware' | 'companions' | 'vision' | 'background'>('hardware');

  // Hardware states
  const [torchOn, setTorchOn] = useState(deviceController.getIsTorchOn());
  const [batteryStatus, setBatteryStatus] = useState<DeviceBatteryStatus | null>(null);
  const [locationStatus, setLocationStatus] = useState<DeviceLocation | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [brightness, setBrightness] = useState(deviceController.getScreenBrightness());
  const [nightShield, setNightShield] = useState(deviceController.getIsNightShieldOn());
  const [backgroundMode, setBackgroundMode] = useState(deviceController.isBackgroundModeActive());
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Phone Call / SMS test state
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  const [testSmsMessage, setTestSmsMessage] = useState('');

  // Vision preview
  const [visionMode, setVisionMode] = useState<'screen' | 'camera'>('screen');

  useEffect(() => {
    if (!isOpen) return;

    // Read initial hardware states
    setTorchOn(deviceController.getIsTorchOn());
    setBackgroundMode(deviceController.isBackgroundModeActive());
    setBrightness(deviceController.getScreenBrightness());
    setNightShield(deviceController.getIsNightShieldOn());

    deviceController.getBatteryStatus().then((bat) => {
      if (bat) setBatteryStatus(bat);
    });

    const unsubscribeBat = deviceController.onBatteryChange((bat) => {
      setBatteryStatus(bat);
    });

    return () => {
      unsubscribeBat();
    };
  }, [isOpen]);

  const showFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 2800);
  };

  const handleToggleTorch = async () => {
    const res = await deviceController.toggleTorch();
    setTorchOn(res.state);
    showFeedback(res.state ? '🔦 Flashlight turned ON' : 'Flashlight turned OFF');
  };

  const handleVibrate = (pattern: 'short' | 'double' | 'heartbeat' | 'alert') => {
    deviceController.vibrate(pattern);
    showFeedback(`📳 Haptic pulse: ${pattern}`);
  };

  const handleFetchLocation = async () => {
    setIsLocating(true);
    const loc = await deviceController.getDeviceLocation();
    setIsLocating(false);
    if (loc) {
      setLocationStatus(loc);
      showFeedback(`📍 GPS: ${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`);
    } else {
      showFeedback('Location access was denied or unavailable.');
    }
  };

  const handleBrightnessChange = (val: number) => {
    setBrightness(val);
    deviceController.setScreenBrightness(val);
  };

  const handleToggleNightShield = () => {
    const next = !nightShield;
    setNightShield(next);
    deviceController.setNightShield(next);
    showFeedback(next ? '🌙 Eye Protection Shield ON' : 'Night Shield OFF');
  };

  const handleToggleBackgroundMode = (enable: boolean) => {
    setBackgroundMode(enable);
    deviceController.setBackgroundMode(enable);
    showFeedback(
      enable
        ? '🔋 Background Running Mode ON (Holds wake-lock & audio keep-alive)'
        : 'Background Mode OFF (Battery saver mode)'
    );
  };

  const handlePlaySound = (type: 'chime' | 'alarm' | 'whistle' | 'success') => {
    deviceController.playSoundEffect(type);
    showFeedback(`🔊 Alert sound played: ${type}`);
  };

  const handleMakeCall = () => {
    if (!testPhoneNumber) {
      showFeedback('Please enter a phone number to dial');
      return;
    }
    deviceController.makePhoneCall(testPhoneNumber);
    showFeedback(`📞 Dialing ${testPhoneNumber}...`);
  };

  const handleSendSms = () => {
    if (!testPhoneNumber) {
      showFeedback('Please enter a phone number for SMS');
      return;
    }
    deviceController.sendSMS(testPhoneNumber, testSmsMessage || 'Namaste! Sent from Mahi AI.');
    showFeedback(`✉️ SMS ready for ${testPhoneNumber}`);
  };

  const currentCompanion = COMPANIONS[activeCompanion] || COMPANIONS.mahi;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-xl max-h-[92vh] flex flex-col rounded-2xl bg-[#0e0a1a] border border-white/15 shadow-2xl overflow-hidden text-white font-['Plus_Jakarta_Sans',sans-serif]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-lg"
                style={{
                  backgroundColor: `${vibe.primaryColor}20`,
                  borderColor: `${vibe.primaryColor}50`,
                }}
              >
                <Smartphone className="w-5 h-5" style={{ color: vibe.primaryColor }} />
              </div>
              <div>
                <h3 className="font-semibold text-base text-white flex items-center gap-2">
                  Total Phone Control & Friends
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300 border border-pink-500/30">
                    Pro
                  </span>
                </h3>
                <p className="text-xs text-white/60">
                  Active Companion: <strong className="text-pink-300">{currentCompanion.name}</strong> • Hardware, Vision & Background
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Feedback Toast */}
          {feedbackMessage && (
            <div className="bg-emerald-500/20 border-b border-emerald-500/30 px-4 py-2 text-xs text-emerald-200 flex items-center justify-between animate-in fade-in">
              <span>{feedbackMessage}</span>
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex border-b border-white/10 px-3 sm:px-4 bg-black/30 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('hardware')}
              className={`py-3 px-3.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'hardware'
                  ? 'border-pink-500 text-white'
                  : 'border-transparent text-white/50 hover:text-white/80'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Phone Hardware</span>
            </button>

            <button
              onClick={() => setActiveTab('companions')}
              className={`py-3 px-3.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'companions'
                  ? 'border-purple-500 text-white'
                  : 'border-transparent text-white/50 hover:text-white/80'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-purple-400" />
              <span>3 Friends (Companions)</span>
            </button>

            <button
              onClick={() => setActiveTab('vision')}
              className={`py-3 px-3.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'vision'
                  ? 'border-cyan-500 text-white'
                  : 'border-transparent text-white/50 hover:text-white/80'
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span>Screen Vision & Camera</span>
              {isScreenSharing && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('background')}
              className={`py-3 px-3.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'background'
                  ? 'border-emerald-500 text-white'
                  : 'border-transparent text-white/50 hover:text-white/80'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
              <span>Background Mode</span>
              {backgroundMode && (
                <span className="text-[9px] font-mono px-1 rounded bg-emerald-500/30 text-emerald-300">
                  ON
                </span>
              )}
            </button>
          </div>

          {/* Main Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {/* TAB 1: HARDWARE CONTROLS */}
            {activeTab === 'hardware' && (
              <div className="space-y-4">
                {/* Hardware Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {/* Torch / Flashlight Button */}
                  <button
                    onClick={handleToggleTorch}
                    className={`p-3.5 rounded-xl border flex flex-col items-center justify-center gap-2 text-center transition-all ${
                      torchOn
                        ? 'bg-amber-500/20 border-amber-500/50 shadow-lg shadow-amber-500/15'
                        : 'bg-white/5 hover:bg-white/10 border-white/10'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        torchOn ? 'bg-amber-400 text-black shadow-md' : 'bg-white/10 text-white/70'
                      }`}
                    >
                      <Zap className={`w-5 h-5 ${torchOn ? 'fill-current' : ''}`} />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">Flashlight</div>
                      <div className="text-[10px] text-white/60">
                        {torchOn ? 'Torch ON 🔦' : 'Torch OFF'}
                      </div>
                    </div>
                  </button>

                  {/* Battery Status Tile */}
                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center justify-center gap-2 text-center">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300">
                      {batteryStatus?.charging ? (
                        <BatteryCharging className="w-5 h-5 animate-pulse" />
                      ) : (
                        <Battery className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">
                        Battery: {batteryStatus ? `${batteryStatus.level}%` : 'Read status'}
                      </div>
                      <div className="text-[10px] text-white/60">
                        {batteryStatus?.charging ? 'Charging ⚡' : 'On battery'}
                      </div>
                    </div>
                  </div>

                  {/* Night Eye Shield Tile */}
                  <button
                    onClick={handleToggleNightShield}
                    className={`p-3.5 rounded-xl border flex flex-col items-center justify-center gap-2 text-center transition-all ${
                      nightShield
                        ? 'bg-amber-900/30 border-amber-500/40'
                        : 'bg-white/5 hover:bg-white/10 border-white/10'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        nightShield ? 'bg-amber-500/30 text-amber-300' : 'bg-white/10 text-white/70'
                      }`}
                    >
                      <Moon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">Night Shield</div>
                      <div className="text-[10px] text-white/60">
                        {nightShield ? 'Eye care filter ON' : 'Filter OFF'}
                      </div>
                    </div>
                  </button>
                </div>

                {/* Haptic Vibration Buzz Patterns */}
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-pink-400" />
                      Phone Haptic Vibration Test
                    </span>
                    <span className="text-[10px] text-white/50">Voice: "Vibrate karo"</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      onClick={() => handleVibrate('short')}
                      className="py-2 px-2 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-[11px] font-medium text-white/90 text-center transition-all"
                    >
                      Short Tap
                    </button>
                    <button
                      onClick={() => handleVibrate('double')}
                      className="py-2 px-2 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-[11px] font-medium text-white/90 text-center transition-all"
                    >
                      Double Buzz
                    </button>
                    <button
                      onClick={() => handleVibrate('heartbeat')}
                      className="py-2 px-2 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-[11px] font-medium text-white/90 text-center transition-all"
                    >
                      Heartbeat
                    </button>
                    <button
                      onClick={() => handleVibrate('alert')}
                      className="py-2 px-2 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-[11px] font-medium text-white/90 text-center transition-all"
                    >
                      Alert Siren
                    </button>
                  </div>
                </div>

                {/* Brightness Adjustment Slider */}
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white flex items-center gap-1.5">
                      <Sun className="w-4 h-4 text-amber-300" />
                      Screen Brightness
                    </span>
                    <span className="font-mono text-white/70">{brightness}%</span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="150"
                    value={brightness}
                    onChange={(e) => handleBrightnessChange(Number(e.target.value))}
                    className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-pink-500"
                  />
                  <div className="flex justify-between text-[10px] text-white/40">
                    <span>Dim (30%)</span>
                    <span>Standard (100%)</span>
                    <span>High Bright (150%)</span>
                  </div>
                </div>

                {/* GPS Location Lookup */}
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-cyan-400" />
                      GPS Device Coordinates
                    </span>
                    <button
                      onClick={handleFetchLocation}
                      disabled={isLocating}
                      className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-[11px] font-medium text-cyan-300 flex items-center gap-1 transition-all disabled:opacity-50"
                    >
                      {isLocating ? <RotateCw className="w-3 h-3 animate-spin" /> : <MapPin className="w-3 h-3" />}
                      <span>{isLocating ? 'Locating...' : 'Get GPS'}</span>
                    </button>
                  </div>
                  {locationStatus ? (
                    <div className="text-xs text-white/80 bg-black/40 p-2.5 rounded-lg border border-white/5 flex items-center justify-between">
                      <div>
                        <div className="font-mono text-[11px]">
                          Lat: {locationStatus.latitude.toFixed(5)} • Lng: {locationStatus.longitude.toFixed(5)}
                        </div>
                        <div className="text-[10px] text-white/50">Accuracy: ~{Math.round(locationStatus.accuracy)}m</div>
                      </div>
                      <a
                        href={locationStatus.mapUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-[11px] text-cyan-200 flex items-center gap-1"
                      >
                        <span>Open Map</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ) : (
                    <p className="text-[11px] text-white/50">
                      Tap "Get GPS" or ask Mahi: <strong className="text-white/80">"Mera location kya hai?"</strong>
                    </p>
                  )}
                </div>

                {/* Speed Dial & SMS Direct Trigger */}
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
                  <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-emerald-400" />
                    Phone Call & SMS Direct Launch
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      placeholder="Phone number (e.g. 9876543210)"
                      value={testPhoneNumber}
                      onChange={(e) => setTestPhoneNumber(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-black/40 border border-white/15 text-xs text-white placeholder-white/40 focus:outline-none focus:border-pink-500"
                    />
                    <button
                      onClick={handleMakeCall}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-1"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call</span>
                    </button>
                    <button
                      onClick={handleSendSms}
                      className="px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/30 text-sky-300 text-xs font-medium flex items-center gap-1"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>SMS</span>
                    </button>
                  </div>
                </div>

                {/* Alert Sound Effects */}
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                  <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4 text-purple-400" />
                    Play Alert Sounds
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {(['chime', 'alarm', 'whistle', 'success'] as const).map((snd) => (
                      <button
                        key={snd}
                        onClick={() => handlePlaySound(snd)}
                        className="py-1.5 px-3 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-xs font-medium text-white/80 capitalize"
                      >
                        🔊 {snd}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: 3 FRIENDS / COMPANIONS SELECTOR */}
            {activeTab === 'companions' && (
              <div className="space-y-3.5">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white/70">
                  <p className="text-white font-medium mb-1">
                    👥 3 Friends (Personalities) Switcher:
                  </p>
                  <p>
                    Apne mood ke hisab se apna dost select karo! Har dost ka apna nature, awaaz aur baat karne ka andaaz hai:
                  </p>
                </div>

                <div className="space-y-3">
                  {Object.values(COMPANIONS).map((companion: CompanionProfile) => {
                    const isSelected = activeCompanion === companion.id;
                    return (
                      <div
                        key={companion.id}
                        onClick={() => onSelectCompanion(companion.id)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
                          isSelected
                            ? 'bg-gradient-to-r from-purple-900/40 to-pink-900/30 border-pink-500/60 shadow-xl'
                            : 'bg-white/[0.03] hover:bg-white/[0.08] border-white/10'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div
                              className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg border shadow-md shrink-0"
                              style={{
                                backgroundColor: `${companion.accentColor}25`,
                                borderColor: `${companion.accentColor}60`,
                                color: companion.accentColor,
                              }}
                            >
                              {companion.name[0]}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-base text-white">
                                  {companion.name} ({companion.hindiName})
                                </h4>
                                <span
                                  className="text-[10px] font-mono px-2 py-0.5 rounded-full border"
                                  style={{
                                    backgroundColor: `${companion.accentColor}20`,
                                    borderColor: `${companion.accentColor}40`,
                                    color: companion.accentColor,
                                  }}
                                >
                                  {companion.badge}
                                </span>
                              </div>
                              <p className="text-xs text-white/70 font-medium mt-0.5">
                                {companion.hindiTagline}
                              </p>
                              <p className="text-[11px] text-white/50 mt-1 leading-relaxed">
                                {companion.bio}
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0 flex flex-col items-end gap-1.5">
                            {isSelected ? (
                              <span className="px-2.5 py-1 rounded-full bg-pink-500/20 border border-pink-500/40 text-pink-300 text-xs font-semibold flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" />
                                Active
                              </span>
                            ) : (
                              <button className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors">
                                Select
                              </button>
                            )}
                            <span className="text-[10px] text-white/40 font-mono">
                              Voice: {companion.voice}
                            </span>
                          </div>
                        </div>

                        {/* Sample Voice Prompts for this companion */}
                        <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap gap-1.5">
                          {companion.sampleVoicePrompts.map((p, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] px-2 py-0.5 rounded bg-black/30 border border-white/5 text-white/70"
                            >
                              💬 {p.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: SCREEN VISION & FLEXIBILITY PERMISSION */}
            {activeTab === 'vision' && (
              <div className="space-y-4">
                {/* Vision Status Card */}
                <div
                  className={`p-4 rounded-xl border relative overflow-hidden transition-all ${
                    isScreenSharing
                      ? 'bg-cyan-950/40 border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                      : 'bg-white/5 border-white/10'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${
                        isScreenSharing
                          ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                          : 'bg-white/10 border-white/15 text-white/60'
                      }`}
                    >
                      <Eye className={`w-6 h-6 ${isScreenSharing ? 'animate-pulse' : ''}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-white">
                          Real-time Screen & Visual Vision
                        </h4>
                        {isScreenSharing ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono animate-pulse">
                            Live Watching
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-white/10 text-white/50 text-[10px] font-mono">
                            Idle
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-white/70 mt-1 leading-relaxed">
                        {isScreenSharing
                          ? 'Mahi is actively seeing your screen! When you ask "Screen dekho", "Ye padh kar batao", or "Ye photo kaisa hai", she will analyze and talk about it directly.'
                          : 'Turn on screen sharing or camera vision so your companion can see whatever is on your phone display in real-time.'}
                      </p>
                    </div>
                  </div>

                  {/* Toggle Controls */}
                  <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap gap-2">
                    <button
                      onClick={onToggleScreenShare}
                      className={`py-2 px-3.5 rounded-xl font-semibold text-xs flex items-center gap-2 transition-all ${
                        isScreenSharing
                          ? 'bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200'
                          : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/20'
                      }`}
                    >
                      <Monitor className="w-4 h-4" />
                      <span>{isScreenSharing ? 'Stop Screen Sharing' : 'Start Screen Share (Desktop/Phone)'}</span>
                    </button>

                    <button
                      onClick={onToggleCameraVision}
                      className="py-2 px-3.5 rounded-xl font-semibold text-xs bg-white/10 hover:bg-white/20 border border-white/15 text-white flex items-center gap-2 transition-all"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Camera Vision (Mobile)</span>
                    </button>
                  </div>
                </div>

                {/* Example prompts for vision */}
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                  <h5 className="text-xs font-semibold text-white/90">👁️ What to ask when Screen Vision is ON:</h5>
                  <ul className="space-y-1.5 text-[11px] text-white/60">
                    <li>• <strong className="text-cyan-300">"Mahi, meri screen par jo question hai uska solution batao"</strong></li>
                    <li>• <strong className="text-cyan-300">"Ye WhatsApp chat padh kar batao kya likha hai"</strong></li>
                    <li>• <strong className="text-cyan-300">"Screen par kaunsa photo hai? Kaisa lag raha hoon?"</strong></li>
                    <li>• <strong className="text-cyan-300">"Ye receipt / bill summarize kar do"</strong></li>
                  </ul>
                </div>
              </div>
            )}

            {/* TAB 4: BACKGROUND RUNNING MODE */}
            {activeTab === 'background' && (
              <div className="space-y-4">
                {/* Big ON / OFF Switch Card */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-950/30 to-black/60 border border-emerald-500/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center border shrink-0 ${
                          backgroundMode
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                            : 'bg-white/10 border-white/15 text-white/50'
                        }`}
                      >
                        <Radio className={`w-5 h-5 ${backgroundMode ? 'animate-pulse' : ''}`} />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                          Background Running Mode
                          {backgroundMode && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/30 text-emerald-300 border border-emerald-500/40">
                              ACTIVE
                            </span>
                          )}
                        </h4>
                        <p className="text-xs text-white/60">
                          {backgroundMode
                            ? 'Phone me dusra app chalane par bhi Mahi baatein karegi'
                            : 'Screen off hone par assistant pause ho jayega'}
                        </p>
                      </div>
                    </div>

                    {/* Big Switch */}
                    <button
                      onClick={() => handleToggleBackgroundMode(!backgroundMode)}
                      className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        backgroundMode ? 'bg-emerald-500' : 'bg-white/20'
                      }`}
                      role="switch"
                      aria-checked={backgroundMode}
                    >
                      <span
                        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          backgroundMode ? 'translate-x-7' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Technical features active under background mode */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-2 border-t border-white/10">
                    <div className="p-2 rounded bg-black/40 border border-white/5 flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="text-white/80">Screen WakeLock active</span>
                    </div>
                    <div className="p-2 rounded bg-black/40 border border-white/5 flex items-center gap-2">
                      <Radio className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="text-white/80">Silent audio loop keep-alive</span>
                    </div>
                  </div>
                </div>

                {/* Instructions */}
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-2 text-xs">
                  <h5 className="font-semibold text-white/90">📲 Background me kaise use karein:</h5>
                  <div className="space-y-1 text-[11px] text-white/60 leading-relaxed">
                    <p>1. Background Mode ko <strong>ON</strong> karein.</p>
                    <p>2. Voice start karein (sphere par tap karke).</p>
                    <p>3. Ab aap home button press karke <strong>WhatsApp, YouTube, Instagram</strong> ya koi bhi app khol sakte hain!</p>
                    <p>4. Mahi aapke headphone/speaker me bolti rahegi aur aap usse baatein karte reh sakte hain.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3.5 border-t border-white/10 bg-black/40 flex items-center justify-between text-xs text-white/50">
            <span>Powered by Gemini Live API</span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
