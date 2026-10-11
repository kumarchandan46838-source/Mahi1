/**
 * LiveSession manages WebSocket communication with the backend Gemini Live API bridge.
 */

import { AudioStreamer } from './AudioStreamer';
import { launchMobileApp } from '../utils/mobileAppLauncher';
import { deviceController } from '../utils/deviceController';
import {
  SessionState,
  ToolActionRecord,
  ClientLiveMessage,
  ServerLiveMessage,
  AssistantVibe,
  UserMemory,
  CompanionId,
  EmotionMode,
} from '../types';

export interface LiveSessionCallbacks {
  onStateChange: (state: SessionState) => void;
  onError: (errorMessage: string) => void;
  onToolAction: (action: ToolActionRecord) => void;
  onVibeChange?: (vibe: AssistantVibe) => void;
  onEmotionChange?: (emotion: EmotionMode) => void;
  onMemoryUpdated?: (allMemories: UserMemory[], newMemory?: UserMemory) => void;
  onMicStatusChange?: (available: boolean, reason?: string) => void;
}

export class LiveSession {
  private ws: WebSocket | null = null;
  private audioStreamer: AudioStreamer;
  private callbacks: LiveSessionCallbacks;
  private state: SessionState = 'disconnected';
  private selectedVoice: string = 'Aoede';
  private selectedCompanion: CompanionId = 'mahi';
  private selectedEmotion: EmotionMode = 'empathetic';
  private pingInterval: number | null = null;
  private isMicActive: boolean = false;

  constructor(audioStreamer: AudioStreamer, callbacks: LiveSessionCallbacks) {
    this.audioStreamer = audioStreamer;
    this.callbacks = callbacks;

    // Connect audio streamer events
    this.audioStreamer.onAudioChunk = (chunk) => {
      this.sendAudioChunk(chunk);
    };

    this.audioStreamer.onPlaybackStarted = () => {
      this.setState('speaking');
    };

    this.audioStreamer.onPlaybackEnded = () => {
      if (this.state === 'speaking') {
        this.setState('listening');
      }
    };
  }

  public setVoice(voice: string) {
    this.selectedVoice = voice;
  }

  public setEmotion(emotion: EmotionMode) {
    this.selectedEmotion = emotion;
  }

  public getEmotion(): EmotionMode {
    return this.selectedEmotion;
  }

  public setCompanion(companion: CompanionId, defaultVoice?: string) {
    this.selectedCompanion = companion;
    if (defaultVoice) {
      this.selectedVoice = defaultVoice;
    }
  }

  public getCompanion(): CompanionId {
    return this.selectedCompanion;
  }

  public getIsMicActive(): boolean {
    return this.isMicActive;
  }

  /**
   * Sends base64 screen/camera frame to Gemini Live
   */
  public sendScreenFrame(base64Image: string): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return false;
    }
    this.ws.send(
      JSON.stringify({
        type: 'screenFrame',
        image: base64Image,
      })
    );
    return true;
  }

  public async enableMicrophone(): Promise<boolean> {
    try {
      await this.audioStreamer.startRecording();
      this.isMicActive = true;
      this.callbacks.onMicStatusChange?.(true);
      return true;
    } catch (err: any) {
      this.isMicActive = false;
      const msg = err?.message || 'Permission denied';
      this.callbacks.onMicStatusChange?.(false, msg);
      return false;
    }
  }

  public sendTextMessage(text: string): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('Cannot send text message: session is not open');
      return false;
    }
    const trimmed = text.trim();
    if (!trimmed) return false;

    this.ws.send(
      JSON.stringify({
        type: 'text',
        text: trimmed,
      })
    );
    this.setState('processing');
    return true;
  }

  private setState(newState: SessionState) {
    if (this.state !== newState) {
      this.state = newState;
      this.callbacks.onStateChange(newState);
    }
  }

  public getState(): SessionState {
    return this.state;
  }

  /**
   * Connect to backend WebSocket and initiate live session.
   */
  public async connect(): Promise<void> {
    if (this.state === 'connecting' || this.state === 'listening' || this.state === 'speaking') {
      return;
    }

    this.cleanup();
    this.setState('connecting');

    try {
      // 1. Initialize audio playback pipeline (works without microphone)
      await this.audioStreamer.initialize();

      // 2. Try starting microphone.
      // If mic is denied (e.g. iframe sandbox or user blocked), we gracefully continue in Speaker & Text mode!
      try {
        await this.audioStreamer.startRecording();
        this.isMicActive = true;
        this.callbacks.onMicStatusChange?.(true);
      } catch (micErr: any) {
        console.warn('Microphone not available, continuing in Speaker & Text mode:', micErr);
        this.isMicActive = false;
        const rawMsg = micErr instanceof Error ? micErr.message : String(micErr);
        const reason =
          micErr?.name === 'NotAllowedError' || rawMsg.toLowerCase().includes('denied')
            ? 'Microphone blocked by browser/iframe. Connected in Speaker & Text mode.'
            : rawMsg || 'Microphone unavailable';
        this.callbacks.onMicStatusChange?.(false, reason);
      }

      // 3. Form WebSocket URL
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/live?voice=${encodeURIComponent(
        this.selectedVoice
      )}&companion=${encodeURIComponent(this.selectedCompanion)}&emotion=${encodeURIComponent(
        this.selectedEmotion
      )}`;

      const ws = new WebSocket(wsUrl);
      this.ws = ws;

      let reportedError = false;

      ws.onopen = () => {
        if (this.ws !== ws) return;
        this.setState('listening');
        // Setup keepalive ping
        this.pingInterval = window.setInterval(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 15000);
      };

      ws.onmessage = async (event) => {
        if (this.ws !== ws) return;
        try {
          const msg: ServerLiveMessage = JSON.parse(event.data);
          if (msg.type === 'error' && msg.message) {
            reportedError = true;
          }
          this.handleServerMessage(msg);
        } catch (err) {
          console.error('Error parsing live server message:', err);
        }
      };

      ws.onerror = (event) => {
        if (this.ws !== ws) return;
        console.warn('LiveSession WebSocket notice:', event);
      };

      ws.onclose = (event) => {
        if (this.ws !== ws) return;
        const wasConnecting = this.state === 'connecting';
        this.cleanup();
        this.setState('disconnected');

        if (event.code === 1008) {
          this.callbacks.onError('Gemini API key is not configured. Please add GEMINI_API_KEY in Settings > Secrets.');
        } else if (event.code === 1011 && event.reason && !reportedError) {
          this.callbacks.onError(event.reason);
        } else if (wasConnecting && !reportedError && event.code !== 1000 && event.code !== 1001) {
          this.callbacks.onError('Unable to connect to live assistant. Please try tapping again.');
        }
      };
    } catch (err: any) {
      this.cleanup();
      this.setState('disconnected');
      const rawMsg = err instanceof Error ? err.message : String(err);
      let msg = rawMsg;
      if (
        err?.name === 'NotAllowedError' ||
        err?.name === 'PermissionDeniedError' ||
        rawMsg.toLowerCase().includes('permission') ||
        rawMsg.toLowerCase().includes('denied')
      ) {
        msg = 'Microphone permission denied. Please allow microphone access in your browser or open the app in a new tab.';
      }
      this.callbacks.onError(msg);
    }
  }

  /**
   * Disconnect the live session.
   */
  public disconnect(): void {
    this.cleanup();
    this.setState('disconnected');
  }

  private cleanup(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onerror = null;
      this.ws.onclose = null;
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close();
      }
      this.ws = null;
    }
    this.audioStreamer.stopRecording();
    this.audioStreamer.stopPlayback();
    this.isMicActive = false;
  }

  /**
   * Sends audio chunk (16kHz PCM Base64) to the server.
   */
  private sendAudioChunk(base64Chunk: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const payload: ClientLiveMessage = {
        type: 'audio',
        audio: base64Chunk,
      };
      this.ws.send(JSON.stringify(payload));
    }
  }

  /**
   * User or system interruption trigger.
   */
  public interrupt(): void {
    this.audioStreamer.stopPlayback();
    this.setState('listening');
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'clientInterrupt' }));
    }
  }

  /**
   * Handles incoming server messages from Gemini Live.
   */
  private async handleServerMessage(msg: ServerLiveMessage): Promise<void> {
    switch (msg.type) {
      case 'audio':
        if (msg.audio) {
          this.audioStreamer.playChunk(msg.audio);
        }
        break;

      case 'interrupted':
        // Model was interrupted by user speech
        this.audioStreamer.stopPlayback();
        this.setState('listening');
        break;

      case 'toolCall':
        if (msg.toolCall) {
          await this.executeToolCall(msg.toolCall);
        }
        break;

      case 'memoryUpdated' as any: {
        const anyMsg = msg as any;
        if (this.callbacks.onMemoryUpdated) {
          this.callbacks.onMemoryUpdated(anyMsg.allMemories || [], anyMsg.memory);
        }
        break;
      }

      case 'emotionChanged' as any: {
        const anyMsg = msg as any;
        if (anyMsg.emotion) {
          this.selectedEmotion = anyMsg.emotion;
          this.callbacks.onEmotionChange?.(anyMsg.emotion);
        }
        break;
      }

      case 'status':
        if (msg.status) {
          this.setState(msg.status);
        }
        break;

      case 'error':
        if (msg.message) {
          this.callbacks.onError(msg.message);
        }
        break;

      case 'turnComplete':
        // Optional turn completed signal
        break;
    }
  }

  /**
   * Executes tools locally and sends toolResponse immediately back to Gemini Live.
   */
  private async executeToolCall(toolCall: { id: string; name: string; args: Record<string, unknown> }): Promise<void> {
    const { id, name, args } = toolCall;
    let output: Record<string, unknown> = {};
    let actionRecord: ToolActionRecord = {
      id,
      name,
      timestamp: Date.now(),
      args,
      status: 'pending',
    };

    try {
      if (name === 'saveMemory') {
        const fact = (args.fact as string) || '';
        actionRecord.message = `Saved to memory: "${fact}"`;
        actionRecord.status = 'success';
        actionRecord.result = { success: true, fact };
        this.callbacks.onToolAction(actionRecord);
        return; // Handled directly on server, do not send duplicate toolResponse
      } else if (name === 'recallMemories') {
        actionRecord.message = `Recalled memories`;
        actionRecord.status = 'success';
        actionRecord.result = { success: true };
        this.callbacks.onToolAction(actionRecord);
        return; // Handled directly on server
      } else if (name === 'forgetMemory') {
        const removed = (args.removed as string) || (args.factOrKeyword as string) || '';
        actionRecord.message = `Removed memory: "${removed}"`;
        actionRecord.status = 'success';
        actionRecord.result = { success: true, removed };
        this.callbacks.onToolAction(actionRecord);
        return; // Handled directly on server
      } else if (name === 'openPhoneApp') {
        const appName = (args.appName as string) || '';
        const actionOrQuery = (args.actionOrQuery as string) || '';
        const commentary = (args.commentary as string) || '';

        const launchResult = launchMobileApp(appName, actionOrQuery, commentary);

        actionRecord.url = launchResult.deepLink || launchResult.fallbackUrl;
        actionRecord.message = launchResult.actionMessage;
        actionRecord.status = 'success';
        actionRecord.result = {
          success: true,
          appName: launchResult.appName,
          appTitle: launchResult.appTitle,
          deepLink: launchResult.deepLink,
          fallbackUrl: launchResult.fallbackUrl,
          message: `Opened ${launchResult.appTitle} on device.`,
        };

        output = {
          success: true,
          appName: launchResult.appName,
          appTitle: launchResult.appTitle,
          openedOnPhone: true,
          message: `Successfully triggered ${launchResult.appTitle} on user's phone. Background voice conversation remains active!`,
        };
      } else if (name === 'openWebsite') {
        let rawUrl = (args.url as string) || '';
        const siteName = (args.name as string) || rawUrl;
        const reason = (args.reason as string) || 'Browsing at your request';

        if (rawUrl && !rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
          rawUrl = `https://${rawUrl}`;
        }

        actionRecord.url = rawUrl;
        actionRecord.message = reason;

        // Attempt browser open
        let openedSuccessfully = false;
        try {
          if (rawUrl) {
            const win = window.open(rawUrl, '_blank', 'noopener,noreferrer');
            openedSuccessfully = !!win;
          }
        } catch {
          openedSuccessfully = false;
        }

        output = {
          success: true,
          opened: openedSuccessfully,
          url: rawUrl,
          message: openedSuccessfully
            ? `Successfully opened ${siteName} in a new tab.`
            : `Prepared ${siteName} (${rawUrl}). The user has an instant interactive link on screen!`,
        };
        actionRecord.status = 'success';
        actionRecord.result = output;
      } else if (name === 'changeVibe') {
        const targetVibe = (args.vibe as AssistantVibe) || 'cyber-violet';
        const moodNote = (args.moodNote as string) || 'Vibe shifted!';

        if (this.callbacks.onVibeChange) {
          this.callbacks.onVibeChange(targetVibe);
        }

        output = {
          success: true,
          vibe: targetVibe,
          message: `Atmosphere adjusted to ${targetVibe}. ${moodNote}`,
        };
        actionRecord.status = 'success';
        actionRecord.message = moodNote;
        actionRecord.result = output;
      } else if (name === 'searchWeb') {
        const query = (args.query as string) || '';
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;

        actionRecord.url = searchUrl;
        actionRecord.message = `Searched web for "${query}"`;

        try {
          window.open(searchUrl, '_blank', 'noopener,noreferrer');
        } catch {}

        output = {
          success: true,
          query,
          searchUrl,
          message: `Search initiated for "${query}". The results card is ready!`,
        };
        actionRecord.status = 'success';
        actionRecord.result = output;
      } else if (name === 'getTimeAndDate') {
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const dateStr = now.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        output = {
          time: timeStr,
          date: dateStr,
          timeZone,
          formatted: `${timeStr} on ${dateStr} (${timeZone})`,
        };
        actionRecord.status = 'success';
        actionRecord.message = `${timeStr} - ${dateStr}`;
        actionRecord.result = output;
      } else if (name === 'flipCoinOrRollDice') {
        const type = ((args.type as string) || 'coin').toLowerCase();
        let result: string;
        let commentary: string;

        if (type.includes('dice') || type.includes('die')) {
          const roll = Math.floor(Math.random() * 6) + 1;
          result = `Rolled a ${roll}`;
          commentary = roll === 6 ? 'A lucky 6! Not bad at all!' : roll === 1 ? 'Oof, a 1! Try again or blame luck!' : `You got a ${roll}!`;
        } else {
          const coin = Math.random() > 0.5 ? 'Heads' : 'Tails';
          result = coin;
          commentary = coin === 'Heads' ? 'Heads it is! Destiny favors you!' : 'Tails! Don’t look at me like that, physics decided!';
        }

        output = {
          type,
          result,
          commentary,
        };
        actionRecord.status = 'success';
        actionRecord.message = `${result} - ${commentary}`;
        actionRecord.result = output;
      } else if (name === 'controlDeviceHardware') {
        const action = (args.action as string) || '';
        const commentary = (args.commentary as string) || '';

        switch (action) {
          case 'toggleTorch': {
            const isTorchOn = await deviceController.toggleTorch();
            const msg = isTorchOn ? 'Flashlight turned ON 🔦' : 'Flashlight turned OFF';
            output = { success: true, torch: isTorchOn, message: msg };
            actionRecord.message = `${msg}${commentary ? ` (${commentary})` : ''}`;
            break;
          }
          case 'setTorch': {
            const enable = Boolean(args.enable);
            const isTorchOn = await deviceController.setTorch(enable);
            const msg = isTorchOn ? 'Flashlight turned ON 🔦' : 'Flashlight turned OFF';
            output = { success: true, torch: isTorchOn, message: msg };
            actionRecord.message = `${msg}${commentary ? ` (${commentary})` : ''}`;
            break;
          }
          case 'vibrate': {
            const pattern = (args.pattern as any) || 'short';
            const didVibrate = deviceController.vibrate(pattern);
            output = { success: true, vibrated: didVibrate, pattern };
            actionRecord.message = `Haptic buzz pulsed (${pattern})`;
            break;
          }
          case 'getBattery': {
            const battery = await deviceController.getBatteryStatus();
            const batMsg = battery
              ? `Battery is at ${battery.level}% (${battery.charging ? 'Charging ⚡' : 'Discharging'})`
              : 'Battery status queried';
            output = { success: true, battery, message: batMsg };
            actionRecord.message = batMsg;
            break;
          }
          case 'getLocation': {
            const loc = await deviceController.getDeviceLocation();
            if (loc) {
              const locMsg = `Location: ${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`;
              output = {
                success: true,
                latitude: loc.latitude,
                longitude: loc.longitude,
                mapUrl: loc.mapUrl,
                message: locMsg,
              };
              actionRecord.message = locMsg;
              actionRecord.url = loc.mapUrl;
            } else {
              output = { success: false, message: 'Location permission was denied or unavailable.' };
              actionRecord.message = 'Location unavailable';
            }
            break;
          }
          case 'copyClipboard': {
            const textToCopy = (args.text as string) || '';
            const copied = await deviceController.copyToClipboard(textToCopy);
            output = { success: copied, text: textToCopy };
            actionRecord.message = `Copied to clipboard: "${textToCopy.slice(0, 40)}"`;
            break;
          }
          case 'makeCall': {
            const phoneNum = (args.number as string) || '';
            deviceController.makePhoneCall(phoneNum);
            output = { success: true, dialed: phoneNum, message: `Dialed ${phoneNum}` };
            actionRecord.message = `Dialing ${phoneNum}`;
            break;
          }
          case 'sendSMS': {
            const phoneNum = (args.number as string) || '';
            const smsText = (args.message as string) || '';
            deviceController.sendSMS(phoneNum, smsText);
            output = { success: true, sentTo: phoneNum, message: smsText };
            actionRecord.message = `Prepared SMS to ${phoneNum}`;
            break;
          }
          case 'setBrightness': {
            const level = typeof args.brightness === 'number' ? args.brightness : 100;
            deviceController.setScreenBrightness(level);
            output = { success: true, brightness: level };
            actionRecord.message = `Brightness set to ${level}%`;
            break;
          }
          case 'setNightShield': {
            const enable = Boolean(args.enable);
            deviceController.setNightShield(enable);
            output = { success: true, nightShield: enable };
            actionRecord.message = enable ? 'Eye protection shield ON 🌙' : 'Night shield OFF';
            break;
          }
          case 'playAlertSound': {
            const soundType = (args.alertType as any) || 'chime';
            deviceController.playSoundEffect(soundType);
            output = { success: true, played: soundType };
            actionRecord.message = `Played alert: ${soundType}`;
            break;
          }
          default: {
            output = { success: true, action, message: `Device action ${action} executed` };
            actionRecord.message = `Device action: ${action}`;
          }
        }

        actionRecord.status = 'success';
        actionRecord.result = output;
      } else if (name === 'getDeviceStatus') {
        const battery = await deviceController.getBatteryStatus();
        const loc = await deviceController.getDeviceLocation();
        const isTorchOn = deviceController.getIsTorchOn();
        const isBgMode = deviceController.isBackgroundModeActive();
        const brightness = deviceController.getScreenBrightness();

        output = {
          success: true,
          battery: battery ? `${battery.level}% (${battery.charging ? 'Charging' : 'On battery'})` : 'Unknown',
          location: loc ? `${loc.latitude.toFixed(3)}, ${loc.longitude.toFixed(3)}` : 'Permission required',
          torchOn: isTorchOn,
          backgroundMode: isBgMode,
          brightness: `${brightness}%`,
          online: navigator.onLine,
        };
        actionRecord.status = 'success';
        actionRecord.message = `Device status read (${battery ? `${battery.level}%` : 'Ready'})`;
        actionRecord.result = output;
      } else if (name === 'setBackgroundMode') {
        const enabled = Boolean(args.enabled);
        const commentary = (args.commentary as string) || '';
        deviceController.setBackgroundMode(enabled);

        output = {
          success: true,
          backgroundMode: enabled,
          message: enabled
            ? 'Background mode enabled. Assistant remains active in background with wake-lock.'
            : 'Background mode disabled. Battery saver active.',
        };
        actionRecord.status = 'success';
        actionRecord.message = `${enabled ? 'Background mode ON' : 'Background mode OFF'}${
          commentary ? ` - ${commentary}` : ''
        }`;
        actionRecord.result = output;
      } else {
        output = {
          success: true,
          message: `Executed tool: ${name}`,
          args,
        };
        actionRecord.status = 'success';
        actionRecord.result = output;
      }
    } catch (err) {
      console.error(`Failed executing tool ${name}:`, err);
      output = {
        error: err instanceof Error ? err.message : 'Unknown tool error',
      };
      actionRecord.status = 'failed';
      actionRecord.message = 'Tool execution encountered a glitch.';
    }

    // Notify UI
    this.callbacks.onToolAction(actionRecord);

    // Immediately send toolResponse back to Gemini Live
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const responsePayload: ClientLiveMessage = {
        type: 'toolResponse',
        toolResponse: {
          id,
          name,
          output,
        },
      };
      this.ws.send(JSON.stringify(responsePayload));
    }
  }
}
