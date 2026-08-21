// Real Web Speech API abstraction for DOTVEX voice capabilities

export interface SpeechRecognitionHandlers {
  onStart?: () => void;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}

// Window declaration for speech recognition compatibility
declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

class SpeechService {
  private recognitionInstance: any = null;
  private isListening: boolean = false;
  private isSpeaking: boolean = false;

  /**
   * Check if speech recognition (STT) is supported in current environment
   */
  isRecognitionSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  /**
   * Check if speech synthesis (TTS) is supported
   */
  isSynthesisSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return 'speechSynthesis' in window;
  }

  /**
   * Start microphone listening for voice input
   */
  startListening(handlers: SpeechRecognitionHandlers, lang: string = 'en-US'): boolean {
    if (!this.isRecognitionSupported()) {
      handlers.onError?.('Speech recognition is not supported in this browser.');
      return false;
    }

    try {
      this.stopListening();

      const SpeechRecClass = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognitionInstance = new SpeechRecClass();
      this.recognitionInstance.continuous = true;
      this.recognitionInstance.interimResults = true;
      this.recognitionInstance.lang = lang;

      this.recognitionInstance.onstart = () => {
        this.isListening = true;
        handlers.onStart?.();
      };

      this.recognitionInstance.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        const text = finalTranscript || interimTranscript;
        handlers.onResult?.(text, !!finalTranscript);
      };

      this.recognitionInstance.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        handlers.onError?.(event.error);
      };

      this.recognitionInstance.onend = () => {
        this.isListening = false;
        handlers.onEnd?.();
      };

      this.recognitionInstance.start();
      return true;
    } catch (e: any) {
      console.warn('Failed to start speech recognition:', e);
      handlers.onError?.(e?.message || 'Failed to start speech recognition.');
      return false;
    }
  }

  /**
   * Stop speech recognition
   */
  stopListening(): void {
    if (this.recognitionInstance) {
      try {
        this.recognitionInstance.stop();
      } catch {
        // ignore
      }
      this.recognitionInstance = null;
      this.isListening = false;
    }
  }

  /**
   * Get active listening status
   */
  getIsListening(): boolean {
    return this.isListening;
  }

  /**
   * Read aloud assistant response using SpeechSynthesis
   */
  speakText(text: string, options?: { speed?: number; pitch?: number; onEnd?: () => void }): void {
    if (!this.isSynthesisSupported()) return;

    this.stopSpeaking();

    // Clean markdown symbols for cleaner audio narration
    const cleanText = text
      .replace(/```[\s\S]*?```/g, 'Code block omitted.')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/[*#_~>]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = options?.speed ?? 1.0;
    utterance.pitch = options?.pitch ?? 1.0;

    utterance.onstart = () => {
      this.isSpeaking = true;
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      options?.onEnd?.();
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
      options?.onEnd?.();
    };

    window.speechSynthesis.speak(utterance);
  }

  /**
   * Stop any current speech synthesis
   */
  stopSpeaking(): void {
    if (this.isSynthesisSupported()) {
      window.speechSynthesis.cancel();
      this.isSpeaking = false;
    }
  }

  /**
   * Get available voices
   */
  getVoices(): SpeechSynthesisVoice[] {
    if (!this.isSynthesisSupported()) return [];
    return window.speechSynthesis.getVoices();
  }
}

export const speechService = new SpeechService();
