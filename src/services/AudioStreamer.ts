/**
 * AudioStreamer handles 16kHz PCM audio capture from microphone
 * and 24kHz PCM gapless playback scheduling with Web Audio API.
 */

// Helper to convert Float32Array to 16-bit PCM Base64 string
export function floatTo16BitPCMBase64(float32Array: Float32Array): string {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  const bytes = new Uint8Array(int16Array.buffer);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Resample audio if browser context is not at 16000Hz
export function downsampleBuffer(
  buffer: Float32Array,
  inputSampleRate: number,
  outputSampleRate: number = 16000
): Float32Array {
  if (inputSampleRate === outputSampleRate) {
    return buffer;
  }
  const sampleRateRatio = inputSampleRate / outputSampleRate;
  const newLength = Math.round(buffer.length / sampleRateRatio);
  const result = new Float32Array(newLength);
  let offsetResult = 0;
  let offsetBuffer = 0;
  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
    let accum = 0;
    let count = 0;
    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
      accum += buffer[i];
      count++;
    }
    result[offsetResult] = count > 0 ? accum / count : 0;
    offsetResult++;
    offsetBuffer = nextOffsetBuffer;
  }
  return result;
}

export class AudioStreamer {
  private inputAudioCtx: AudioContext | null = null;
  private outputAudioCtx: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private inputAnalyser: AnalyserNode | null = null;
  private outputAnalyser: AnalyserNode | null = null;
  private outputGainNode: GainNode | null = null;

  private activeSources: AudioBufferSourceNode[] = [];
  private nextStartTime: number = 0;
  private isMuted: boolean = false;
  private isOutputMuted: boolean = false;

  // Background keep-alive and mobile OS audio persistence
  private silentAudioElement: HTMLAudioElement | null = null;
  private wakeLock: any = null;
  private onVisibilityChangeHandler: (() => void) | null = null;

  public onAudioChunk?: (base64Chunk: string) => void;
  public onPlaybackStarted?: () => void;
  public onPlaybackEnded?: () => void;

  /**
   * Initializes both input (16kHz recording) and output (24kHz playback) AudioContexts.
   */
  public async initialize(): Promise<void> {
    // 1. Output Audio Context (Gemini Live outputs 24kHz PCM)
    const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    
    if (!this.outputAudioCtx || this.outputAudioCtx.state === 'closed') {
      try {
        this.outputAudioCtx = new AudioCtxClass({ sampleRate: 24000 });
      } catch {
        this.outputAudioCtx = new AudioCtxClass();
      }
      this.outputAnalyser = this.outputAudioCtx.createAnalyser();
      this.outputAnalyser.fftSize = 128;
      this.outputAnalyser.smoothingTimeConstant = 0.8;

      this.outputGainNode = this.outputAudioCtx.createGain();
      this.outputGainNode.gain.value = 1.0;

      this.outputGainNode.connect(this.outputAnalyser);
      this.outputAnalyser.connect(this.outputAudioCtx.destination);
    }

    if (this.outputAudioCtx.state === 'suspended') {
      await this.outputAudioCtx.resume();
    }

    // 2. Input Audio Context (16kHz)
    if (!this.inputAudioCtx || this.inputAudioCtx.state === 'closed') {
      try {
        this.inputAudioCtx = new AudioCtxClass({ sampleRate: 16000 });
      } catch {
        this.inputAudioCtx = new AudioCtxClass();
      }
      this.inputAnalyser = this.inputAudioCtx.createAnalyser();
      this.inputAnalyser.fftSize = 128;
      this.inputAnalyser.smoothingTimeConstant = 0.7;
    }

    if (this.inputAudioCtx.state === 'suspended') {
      await this.inputAudioCtx.resume();
    }
  }

  /**
   * Proactively test and request microphone access.
   */
  public static async checkAndRequestPermission(): Promise<{ granted: boolean; error?: string }> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      return {
        granted: false,
        error: 'Microphone API is not supported in this browser context (requires HTTPS).',
      };
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      return { granted: true };
    } catch (err: any) {
      return {
        granted: false,
        error: err?.message || 'Permission denied',
      };
    }
  }

  /**
   * Starts capturing microphone audio and streaming PCM chunks.
   */
  public async startRecording(): Promise<void> {
    await this.initialize();
    if (!this.inputAudioCtx || !this.inputAnalyser) return;

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      throw new Error('Microphone access is not supported in this browser environment.');
    }

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });
    } catch (firstErr: any) {
      // Fallback with minimal constraints if browser fails strict audio constraints
      try {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (err: any) {
        const msg = err?.message || String(err);
        if (
          err?.name === 'NotAllowedError' ||
          err?.name === 'PermissionDeniedError' ||
          msg.toLowerCase().includes('permission') ||
          msg.toLowerCase().includes('denied')
        ) {
          const permErr = new Error(
            'Microphone permission denied. Please allow microphone access in your browser or open the app in a new tab.'
          );
          permErr.name = 'NotAllowedError';
          throw permErr;
        }
        throw err;
      }
    }

    this.sourceNode = this.inputAudioCtx.createMediaStreamSource(this.mediaStream);
    this.sourceNode.connect(this.inputAnalyser);

    // Buffer size 4096 gives smooth streaming at 16kHz (~256ms chunk)
    const bufferSize = 4096;
    this.processorNode = this.inputAudioCtx.createScriptProcessor(bufferSize, 1, 1);

    const actualSampleRate = this.inputAudioCtx.sampleRate;

    this.processorNode.onaudioprocess = (e) => {
      if (this.isMuted) return;
      const inputData = e.inputBuffer.getChannelData(0);

      let processedData: Float32Array;
      if (actualSampleRate !== 16000) {
        processedData = downsampleBuffer(inputData, actualSampleRate, 16000);
      } else {
        processedData = inputData;
      }

      const base64PCM = floatTo16BitPCMBase64(processedData);
      if (this.onAudioChunk) {
        this.onAudioChunk(base64PCM);
      }
    };

    // Connect through a zero-gain node so ScriptProcessor is driven without feeding mic to speakers
    const silenceGain = this.inputAudioCtx.createGain();
    silenceGain.gain.value = 0;
    this.sourceNode.connect(this.processorNode);
    this.processorNode.connect(silenceGain);
    silenceGain.connect(this.inputAudioCtx.destination);

    // Enable background audio keep-alive, WakeLock, and mobile MediaSession
    this.enableBackgroundAudioAndWakeLock().catch(() => {});
  }

  /**
   * Activates background silent audio loop, screen WakeLock, and mobile MediaSession
   * to ensure continuous background execution when switching phone apps or minimizing.
   */
  private async enableBackgroundAudioAndWakeLock(): Promise<void> {
    // 1. Screen WakeLock API to keep display awake during conversation
    if ('wakeLock' in navigator) {
      try {
        this.wakeLock = await (navigator as any).wakeLock.request('screen');
      } catch {
        // Optional wake lock
      }
    }

    // 2. Background silent audio loop
    // Mobile browsers (Chrome Android, Safari iOS) maintain audio processing when an HTMLAudioElement is active
    try {
      if (!this.silentAudioElement) {
        // Base64 1-second silent WAV
        const silentWav = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
        const audio = new Audio(silentWav);
        audio.loop = true;
        audio.volume = 0.01;
        this.silentAudioElement = audio;
      }
      this.silentAudioElement.play().catch(() => {});
    } catch {}

    // 3. MediaSession API registration
    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: 'Mahi Voice Assistant',
          artist: 'Active Live Voice Call',
          album: 'Background Voice Companion',
          artwork: [
            { src: '/assets/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/assets/icon-512.png', sizes: '512x512', type: 'image/png' },
          ],
        });
        navigator.mediaSession.playbackState = 'playing';

        navigator.mediaSession.setActionHandler('play', () => {
          this.outputAudioCtx?.resume();
          this.silentAudioElement?.play().catch(() => {});
        });
        navigator.mediaSession.setActionHandler('pause', () => {
          // Handled gracefully
        });
      } catch {}
    }

    // 4. Visibility change handler: resume AudioContext when app is minimized or phone app is opened
    if (!this.onVisibilityChangeHandler) {
      this.onVisibilityChangeHandler = () => {
        if (this.mediaStream) {
          if (this.inputAudioCtx && this.inputAudioCtx.state === 'suspended') {
            this.inputAudioCtx.resume().catch(() => {});
          }
          if (this.outputAudioCtx && this.outputAudioCtx.state === 'suspended') {
            this.outputAudioCtx.resume().catch(() => {});
          }
        }
        // Re-request wake lock if tab became visible again
        if (document.visibilityState === 'visible' && !this.wakeLock && 'wakeLock' in navigator) {
          (navigator as any).wakeLock.request('screen').then((lock: any) => {
            this.wakeLock = lock;
          }).catch(() => {});
        }
      };
      document.addEventListener('visibilitychange', this.onVisibilityChangeHandler);
    }
  }

  private disableBackgroundAudioAndWakeLock(): void {
    if (this.wakeLock) {
      try {
        this.wakeLock.release().catch(() => {});
      } catch {}
      this.wakeLock = null;
    }

    if (this.silentAudioElement) {
      try {
        this.silentAudioElement.pause();
      } catch {}
    }

    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.playbackState = 'none';
      } catch {}
    }

    if (this.onVisibilityChangeHandler) {
      document.removeEventListener('visibilitychange', this.onVisibilityChangeHandler);
      this.onVisibilityChangeHandler = null;
    }
  }

  /**
   * Stops recording and releases microphone track.
   */
  public stopRecording(): void {
    this.disableBackgroundAudioAndWakeLock();
    if (this.processorNode) {
      this.processorNode.onaudioprocess = null;
      this.processorNode.disconnect();
      this.processorNode = null;
    }
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
  }

  /**
   * Plays a 24kHz raw PCM16 base64 chunk seamlessly using AudioBufferSourceNode.
   */
  public playChunk(base64Audio: string): void {
    if (!this.outputAudioCtx || !this.outputGainNode) return;

    try {
      const binary = atob(base64Audio);
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      // 16-bit little-endian PCM
      const int16Array = new Int16Array(bytes.buffer);
      const float32Array = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0;
      }

      const sampleRate = 24000;
      const audioBuffer = this.outputAudioCtx.createBuffer(1, float32Array.length, sampleRate);
      audioBuffer.getChannelData(0).set(float32Array);

      const currentTime = this.outputAudioCtx.currentTime;
      if (this.nextStartTime < currentTime) {
        this.nextStartTime = currentTime;
      }

      const source = this.outputAudioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.outputGainNode);

      source.start(this.nextStartTime);
      const chunkDuration = audioBuffer.duration;
      this.nextStartTime += chunkDuration;

      this.activeSources.push(source);

      if (this.activeSources.length === 1 && this.onPlaybackStarted) {
        this.onPlaybackStarted();
      }

      source.onended = () => {
        const index = this.activeSources.indexOf(source);
        if (index !== -1) {
          this.activeSources.splice(index, 1);
        }
        if (this.activeSources.length === 0) {
          if (this.onPlaybackEnded) {
            this.onPlaybackEnded();
          }
        }
      };
    } catch (err) {
      console.error('Failed to decode or play audio chunk:', err);
    }
  }

  /**
   * Instantly stops any current audio playback and resets queue on interruption.
   */
  public stopPlayback(): void {
    for (const source of this.activeSources) {
      try {
        source.stop();
        source.disconnect();
      } catch {
        // Source might have already ended
      }
    }
    this.activeSources = [];
    if (this.outputAudioCtx) {
      this.nextStartTime = this.outputAudioCtx.currentTime;
    }
    if (this.onPlaybackEnded) {
      this.onPlaybackEnded();
    }
  }

  /**
   * Toggles microphone mute.
   */
  public setMuted(muted: boolean): void {
    this.isMuted = muted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Sets output speaker mute / unmute.
   */
  public setOutputMuted(muted: boolean): void {
    this.isOutputMuted = muted;
    if (this.outputGainNode) {
      this.outputGainNode.gain.value = muted ? 0 : 1;
    }
  }

  public getIsOutputMuted(): boolean {
    return this.isOutputMuted;
  }

  /**
   * Retrieves live visualization data from both input (mic) and output (Mahi) analysers.
   */
  public getVisualMetrics(): {
    inputVolume: number;
    outputVolume: number;
    inputFrequencyData: Uint8Array<ArrayBufferLike>;
    outputFrequencyData: Uint8Array<ArrayBufferLike>;
    isSpeaking: boolean;
  } {
    const defaultData = new Uint8Array(64);

    let inputVolume = 0;
    const inputFreq = new Uint8Array(64);
    if (this.inputAnalyser && !this.isMuted) {
      this.inputAnalyser.getByteFrequencyData(inputFreq);
      let sum = 0;
      for (let i = 0; i < inputFreq.length; i++) {
        sum += inputFreq[i];
      }
      inputVolume = sum / (inputFreq.length * 255);
    }

    let outputVolume = 0;
    const outputFreq = new Uint8Array(64);
    if (this.outputAnalyser && !this.isOutputMuted && this.activeSources.length > 0) {
      this.outputAnalyser.getByteFrequencyData(outputFreq);
      let sum = 0;
      for (let i = 0; i < outputFreq.length; i++) {
        sum += outputFreq[i];
      }
      outputVolume = sum / (outputFreq.length * 255);
    }

    return {
      inputVolume,
      outputVolume,
      inputFrequencyData: inputFreq.length ? inputFreq : defaultData,
      outputFrequencyData: outputFreq.length ? outputFreq : defaultData,
      isSpeaking: this.activeSources.length > 0,
    };
  }

  /**
   * Clean up all audio resources.
   */
  public dispose(): void {
    this.stopRecording();
    this.stopPlayback();

    if (this.inputAudioCtx && this.inputAudioCtx.state !== 'closed') {
      this.inputAudioCtx.close().catch(() => {});
    }
    if (this.outputAudioCtx && this.outputAudioCtx.state !== 'closed') {
      this.outputAudioCtx.close().catch(() => {});
    }

    this.inputAudioCtx = null;
    this.outputAudioCtx = null;
  }
}
