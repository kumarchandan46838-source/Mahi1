/**
 * ScreenVision.ts
 * Real-time Screen Sharing and Camera Vision streaming service.
 * Captures screen frames or camera video frames and sends them to Gemini Live API
 * so Mahi can literally see what's on the user's screen in real-time!
 */

export interface ScreenVisionCallbacks {
  onStart: () => void;
  onStop: () => void;
  onFrame: (base64Image: string) => void;
  onError: (error: string) => void;
}

export class ScreenVisionService {
  private mediaStream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private canvasElement: HTMLCanvasElement | null = null;
  private frameInterval: number | null = null;
  private isCapturing: boolean = false;
  private mode: 'screen' | 'camera' = 'screen';
  private callbacks: ScreenVisionCallbacks;
  private captureFps: number = 0.8; // ~1 frame every 1.25s for optimal network and Gemini Live ingestion

  constructor(callbacks: ScreenVisionCallbacks) {
    this.callbacks = callbacks;
  }

  public getIsCapturing(): boolean {
    return this.isCapturing;
  }

  public getMode(): 'screen' | 'camera' {
    return this.mode;
  }

  public getMediaStream(): MediaStream | null {
    return this.mediaStream;
  }

  /**
   * Start capturing the user's screen
   */
  public async startScreenSharing(): Promise<boolean> {
    if (this.isCapturing) {
      this.stop();
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      // If getDisplayMedia is not available on this mobile browser, fallback to camera vision
      console.warn('getDisplayMedia not supported, falling back to camera vision');
      return this.startCameraVision();
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'browser',
        },
        audio: false,
      });

      this.mode = 'screen';
      this.setupStream(stream);
      return true;
    } catch (err: any) {
      console.warn('Error initiating screen share, attempting camera fallback:', err);
      if (err.name === 'NotAllowedError' || err.message?.includes('denied')) {
        this.callbacks.onError('Screen capture permission was denied.');
        return false;
      }
      // If displayMedia fails (e.g. mobile restriction), try camera
      return this.startCameraVision();
    }
  }

  /**
   * Start camera vision (works everywhere, including mobile browsers)
   */
  public async startCameraVision(facingMode: 'environment' | 'user' = 'environment'): Promise<boolean> {
    if (this.isCapturing) {
      this.stop();
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.callbacks.onError('Camera API is not supported on this device.');
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      this.mode = 'camera';
      this.setupStream(stream);
      return true;
    } catch (err: any) {
      const msg = err?.message || 'Unable to access camera';
      this.callbacks.onError(msg);
      return false;
    }
  }

  private setupStream(stream: MediaStream) {
    this.mediaStream = stream;
    this.isCapturing = true;

    // Listen for user stopping stream via browser UI
    const track = stream.getVideoTracks()[0];
    if (track) {
      track.onended = () => {
        this.stop();
      };
    }

    // Hidden video element to read frames
    this.videoElement = document.createElement('video');
    this.videoElement.autoplay = true;
    this.videoElement.playsInline = true;
    this.videoElement.muted = true;
    this.videoElement.srcObject = stream;
    this.videoElement.play().catch(() => {});

    // Canvas for frame extraction
    this.canvasElement = document.createElement('canvas');

    this.callbacks.onStart();

    // Start periodic frame capture loop
    const intervalMs = Math.round(1000 / this.captureFps);
    this.frameInterval = window.setInterval(() => {
      this.captureAndSendFrame();
    }, intervalMs);

    // Capture initial frame after short delay
    setTimeout(() => {
      this.captureAndSendFrame();
    }, 500);
  }

  /**
   * Extract JPEG frame from video stream and send via callback
   */
  public captureAndSendFrame(): string | null {
    if (!this.isCapturing || !this.videoElement || !this.canvasElement) {
      return null;
    }

    if (this.videoElement.readyState < 2) {
      return null; // Video not ready yet
    }

    const video = this.videoElement;
    const canvas = this.canvasElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Target dimensions: Max 640x360 for fast transmission and lightweight payload
    const maxWidth = 640;
    const maxHeight = 360;
    let width = video.videoWidth || 640;
    let height = video.videoHeight || 360;

    if (width > maxWidth) {
      height = Math.round((height * maxWidth) / width);
      width = maxWidth;
    }
    if (height > maxHeight) {
      width = Math.round((width * maxHeight) / height);
      height = maxHeight;
    }

    canvas.width = width;
    canvas.height = height;

    ctx.drawImage(video, 0, 0, width, height);

    try {
      // 0.6 JPEG quality gives high clarity for text/UI while keeping file size ~25KB
      const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
      const base64 = dataUrl.replace(/^data:image\/jpeg;base64,/, '');
      if (base64) {
        this.callbacks.onFrame(base64);
        return base64;
      }
    } catch (err) {
      console.warn('Error converting frame to base64:', err);
    }
    return null;
  }

  public stop() {
    if (!this.isCapturing && !this.mediaStream) return;

    if (this.frameInterval) {
      clearInterval(this.frameInterval);
      this.frameInterval = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }

    this.canvasElement = null;
    this.isCapturing = false;
    this.callbacks.onStop();
  }
}
