/**
 * deviceController.ts
 * Comprehensive Phone Hardware & System Controller for Mahi AI Assistant.
 * Controls Flashlight/Torch, Vibration, Battery Status, Volume/Sound Alerts,
 * Screen Brightness/Night Shield, Clipboard, Direct Dialing/SMS, Geolocation,
 * and Background Mode WakeLock.
 */

export interface BatteryInfo {
  level: number; // 0 to 100
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
}

export type DeviceBatteryStatus = BatteryInfo;

export interface LocationInfo {
  latitude: number;
  longitude: number;
  accuracy: number;
  mapsUrl: string;
  mapUrl?: string;
}

export type DeviceLocation = LocationInfo;

class DeviceController {
  private torchStream: MediaStream | null = null;
  private isTorchOn: boolean = false;
  private wakeLock: any = null;
  private keepAliveInterval: number | null = null;
  private keepAliveAudioCtx: AudioContext | null = null;
  private backgroundModeEnabled: boolean = true;
  private screenBrightness: number = 100;
  private nightShieldEnabled: boolean = false;
  private screenFlashlightActive: boolean = false;

  constructor() {
    // Restore saved background mode preference
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mahi_background_mode');
      if (saved !== null) {
        this.backgroundModeEnabled = saved === 'true';
      }
      if (this.backgroundModeEnabled) {
        this.enableBackgroundKeepAlive();
      }
    }
  }

  // ==================== FLASHLIGHT / TORCH ====================

  /**
   * Toggle or set device camera flashlight (torch)
   */
  public async setTorch(enable: boolean): Promise<{ success: boolean; state: boolean; message: string }> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.toggleScreenFlashlight(enable);
      return {
        success: true,
        state: enable,
        message: enable ? 'Screen flashlight turned ON' : 'Screen flashlight turned OFF',
      };
    }

    try {
      if (enable) {
        if (!this.torchStream) {
          this.torchStream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: 'environment',
            },
          });
        }
        const track = this.torchStream.getVideoTracks()[0];
        if (track) {
          const capabilities = (track.getCapabilities && track.getCapabilities()) || {};
          if ((capabilities as any).torch) {
            await track.applyConstraints({
              advanced: [{ torch: true } as any],
            });
            this.isTorchOn = true;
            return { success: true, state: true, message: 'Phone flashlight turned ON! 🔦' };
          }
        }
        // If hardware torch isn't supported, turn on screen flashlight
        this.toggleScreenFlashlight(true);
        this.isTorchOn = true;
        return { success: true, state: true, message: 'Screen flashlight enabled as fallback!' };
      } else {
        if (this.torchStream) {
          const track = this.torchStream.getVideoTracks()[0];
          if (track) {
            try {
              await track.applyConstraints({
                advanced: [{ torch: false } as any],
              });
            } catch {
              // ignore
            }
            track.stop();
          }
          this.torchStream = null;
        }
        this.toggleScreenFlashlight(false);
        this.isTorchOn = false;
        return { success: true, state: false, message: 'Flashlight turned OFF.' };
      }
    } catch (err: any) {
      console.warn('Hardware torch error, using screen flashlight:', err);
      this.toggleScreenFlashlight(enable);
      this.isTorchOn = enable;
      return {
        success: true,
        state: enable,
        message: enable ? 'Screen flashlight ON' : 'Flashlight OFF',
      };
    }
  }

  public async toggleTorch(): Promise<{ success: boolean; state: boolean; message: string }> {
    return this.setTorch(!this.isTorchOn);
  }

  public getTorchState(): boolean {
    return this.isTorchOn;
  }

  public getIsTorchOn(): boolean {
    return this.isTorchOn;
  }

  public toggleScreenFlashlight(enable: boolean) {
    this.screenFlashlightActive = enable;
    const existing = document.getElementById('screen-flashlight-overlay');
    if (enable) {
      if (!existing) {
        const div = document.createElement('div');
        div.id = 'screen-flashlight-overlay';
        div.style.position = 'fixed';
        div.style.inset = '0';
        div.style.backgroundColor = '#ffffff';
        div.style.zIndex = '99999';
        div.style.display = 'flex';
        div.style.flexDirection = 'column';
        div.style.alignItems = 'center';
        div.style.justifyContent = 'center';
        div.style.color = '#000000';
        div.style.fontWeight = 'bold';
        div.style.fontSize = '18px';
        div.innerHTML = `
          <div style="text-align:center; padding: 20px;">
            <p style="font-size: 40px; margin-bottom: 12px;">🔦</p>
            <p style="font-family: sans-serif; font-size: 20px; font-weight: 700;">Screen Flashlight ON</p>
            <p style="font-size: 13px; color: #555; margin-top: 6px;">Tap anywhere to turn off</p>
          </div>
        `;
        div.onclick = () => {
          this.toggleScreenFlashlight(false);
          this.isTorchOn = false;
        };
        document.body.appendChild(div);
      }
    } else {
      if (existing && existing.parentNode) {
        existing.parentNode.removeChild(existing);
      }
    }
  }

  // ==================== VIBRATION / HAPTICS ====================

  public vibrate(pattern: 'short' | 'double' | 'heartbeat' | 'alert' | number | number[] = 'short'): boolean {
    if (typeof navigator === 'undefined' || !navigator.vibrate) {
      return false;
    }
    try {
      if (typeof pattern === 'number' || Array.isArray(pattern)) {
        return navigator.vibrate(pattern);
      }
      switch (pattern) {
        case 'short':
          return navigator.vibrate(150);
        case 'double':
          return navigator.vibrate([120, 80, 120]);
        case 'heartbeat':
          return navigator.vibrate([100, 100, 200, 100, 100]);
        case 'alert':
          return navigator.vibrate([300, 100, 300, 100, 300]);
        default:
          return navigator.vibrate(150);
      }
    } catch {
      return false;
    }
  }

  // ==================== BATTERY STATUS ====================

  public async getBatteryStatus(): Promise<BatteryInfo | null> {
    if (typeof navigator === 'undefined') return null;
    try {
      if ('getBattery' in navigator) {
        const battery: any = await (navigator as any).getBattery();
        return {
          level: Math.round(battery.level * 100),
          charging: Boolean(battery.charging),
          chargingTime: battery.chargingTime || 0,
          dischargingTime: battery.dischargingTime || 0,
        };
      }
    } catch (err) {
      console.warn('Battery API not available:', err);
    }
    return null;
  }

  public onBatteryChange(callback: (bat: BatteryInfo) => void): () => void {
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      let batteryInstance: any = null;
      const update = () => {
        if (batteryInstance) {
          callback({
            level: Math.round(batteryInstance.level * 100),
            charging: Boolean(batteryInstance.charging),
            chargingTime: batteryInstance.chargingTime || 0,
            dischargingTime: batteryInstance.dischargingTime || 0,
          });
        }
      };
      (navigator as any).getBattery().then((battery: any) => {
        batteryInstance = battery;
        battery.addEventListener('levelchange', update);
        battery.addEventListener('chargingchange', update);
        update();
      }).catch(() => {});

      return () => {
        if (batteryInstance) {
          try {
            batteryInstance.removeEventListener('levelchange', update);
            batteryInstance.removeEventListener('chargingchange', update);
          } catch {
            // ignore
          }
        }
      };
    }
    return () => {};
  }

  // ==================== GEOLOCATION / GPS ====================

  public async getDeviceLocation(): Promise<LocationInfo> {
    return new Promise((resolve, reject) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser.'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
          resolve({
            latitude,
            longitude,
            accuracy,
            mapsUrl: url,
            mapUrl: url,
          });
        },
        (err) => {
          reject(new Error(err.message || 'Unable to retrieve location'));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
      );
    });
  }

  // ==================== CLIPBOARD ====================

  public async copyToClipboard(text: string): Promise<boolean> {
    if (!text) return false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        this.vibrate('short');
        return true;
      }
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      this.vibrate('short');
      return true;
    } catch {
      return false;
    }
  }

  public async readClipboard(): Promise<string | null> {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        return await navigator.clipboard.readText();
      }
    } catch {
      // ignore
    }
    return null;
  }

  // ==================== PHONE CALL & SMS ====================

  public makePhoneCall(phoneNumber: string): boolean {
    const cleaned = (phoneNumber || '').replace(/[^0-9+]/g, '');
    if (!cleaned) return false;
    window.location.href = `tel:${cleaned}`;
    return true;
  }

  public sendSMS(phoneNumber: string, message: string): boolean {
    const cleaned = (phoneNumber || '').replace(/[^0-9+]/g, '');
    const encodedBody = encodeURIComponent(message || '');
    if (cleaned) {
      window.location.href = `sms:${cleaned}?body=${encodedBody}`;
    } else {
      window.location.href = `sms:?body=${encodedBody}`;
    }
    return true;
  }

  // ==================== SOUND SYNTHESIZER ALERTS ====================

  public playSoundEffect(type: 'chime' | 'alarm' | 'whistle' | 'success' | 'coin') {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      if (type === 'coin') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(987.77, ctx.currentTime); // B5
        osc.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.08); // E6
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      } else if (type === 'success' || type === 'chime') {
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
          gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.3);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + i * 0.08);
          osc.stop(ctx.currentTime + i * 0.08 + 0.3);
        });
      } else if (type === 'alarm' || type === 'whistle') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(1400, ctx.currentTime + 0.2);
        osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      }
    } catch (err) {
      console.warn('Audio alert error:', err);
    }
  }

  // ==================== SCREEN BRIGHTNESS & NIGHT SHIELD ====================

  public setScreenBrightness(percent: number) {
    this.screenBrightness = Math.max(20, Math.min(150, percent));
    this.applyScreenFilters();
  }

  public getScreenBrightness(): number {
    return this.screenBrightness;
  }

  public setNightShield(enabled: boolean) {
    this.nightShieldEnabled = enabled;
    this.applyScreenFilters();
  }

  public getNightShield(): boolean {
    return this.nightShieldEnabled;
  }

  public getIsNightShieldOn(): boolean {
    return this.nightShieldEnabled;
  }

  private applyScreenFilters() {
    let overlay = document.getElementById('night-shield-overlay');
    if (this.nightShieldEnabled) {
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'night-shield-overlay';
        overlay.style.position = 'fixed';
        overlay.style.inset = '0';
        overlay.style.pointerEvents = 'none';
        overlay.style.backgroundColor = 'rgba(255, 140, 0, 0.18)';
        overlay.style.mixBlendMode = 'multiply';
        overlay.style.zIndex = '99990';
        overlay.style.transition = 'opacity 0.3s ease';
        document.body.appendChild(overlay);
      }
    } else {
      if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    }

    const appRoot = document.getElementById('root');
    if (appRoot) {
      const brightnessVal = this.screenBrightness / 100;
      appRoot.style.filter = `brightness(${brightnessVal})`;
    }
  }

  // ==================== BACKGROUND MODE (ON / OFF) ====================

  public setBackgroundMode(enabled: boolean) {
    this.backgroundModeEnabled = enabled;
    localStorage.setItem('mahi_background_mode', String(enabled));
    if (enabled) {
      this.enableBackgroundKeepAlive();
    } else {
      this.disableBackgroundKeepAlive();
    }
  }

  public isBackgroundModeEnabled(): boolean {
    return this.backgroundModeEnabled;
  }

  public isBackgroundModeActive(): boolean {
    return this.backgroundModeEnabled;
  }

  public async requestWakeLock(): Promise<boolean> {
    if (!this.backgroundModeEnabled) return false;
    try {
      if ('wakeLock' in navigator) {
        this.wakeLock = await (navigator as any).wakeLock.request('screen');
        this.wakeLock.addEventListener('release', () => {
          this.wakeLock = null;
        });
        return true;
      }
    } catch {
      // ignore
    }
    return false;
  }

  public releaseWakeLock() {
    if (this.wakeLock) {
      try {
        this.wakeLock.release();
      } catch {
        // ignore
      }
      this.wakeLock = null;
    }
  }

  private enableBackgroundKeepAlive() {
    this.requestWakeLock();

    // Set up silent audio buffer to keep mobile audio engine awake when tab is in background
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx && !this.keepAliveAudioCtx) {
        this.keepAliveAudioCtx = new AudioCtx();
        // Create an inaudible pulse every 12 seconds
        if (!this.keepAliveInterval) {
          this.keepAliveInterval = window.setInterval(() => {
            if (this.keepAliveAudioCtx && this.keepAliveAudioCtx.state !== 'closed') {
              try {
                if (this.keepAliveAudioCtx.state === 'suspended') {
                  this.keepAliveAudioCtx.resume();
                }
                const osc = this.keepAliveAudioCtx.createOscillator();
                const gain = this.keepAliveAudioCtx.createGain();
                osc.frequency.value = 25; // Sub-bass inaudible frequency
                gain.gain.value = 0.0001; // virtually 0 volume
                osc.connect(gain);
                gain.connect(this.keepAliveAudioCtx.destination);
                osc.start();
                osc.stop(this.keepAliveAudioCtx.currentTime + 0.1);
              } catch {
                // ignore
              }
            }
          }, 12000);
        }
      }
    } catch {
      // ignore
    }

    // Keep MediaSession active so Android / iOS notification stays live
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: 'Mahi AI • Full Phone Assistant',
        artist: 'Active Background Assistant',
        album: 'Mahi Live Voice Engine',
      });
      navigator.mediaSession.playbackState = 'playing';
      navigator.mediaSession.setActionHandler('play', () => {
        navigator.mediaSession.playbackState = 'playing';
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        navigator.mediaSession.playbackState = 'paused';
      });
    }
  }

  private disableBackgroundKeepAlive() {
    this.releaseWakeLock();
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
    if (this.keepAliveAudioCtx) {
      try {
        this.keepAliveAudioCtx.close();
      } catch {
        // ignore
      }
      this.keepAliveAudioCtx = null;
    }
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'none';
    }
  }
}

export const deviceController = new DeviceController();
