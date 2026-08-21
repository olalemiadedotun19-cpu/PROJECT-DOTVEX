import * as Speech from 'expo-speech';
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
import { VoiceService, SpeechRecognitionHandlers, cleanTextForSpeech } from '@dotvex/shared';

export class MobileVoiceService implements VoiceService {
  private isListening = false;
  private isSpeaking = false;

  isRecognitionSupported(): boolean {
    return true;
  }

  isSynthesisSupported(): boolean {
    return true;
  }

  async startListening(handlers: SpeechRecognitionHandlers, lang: string = 'en-US'): Promise<boolean> {
    try {
      const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!perm.granted) {
        handlers.onError?.('Microphone permission denied.');
        return false;
      }

      handlers.onStart?.();
      this.isListening = true;

      ExpoSpeechRecognitionModule.addListener('result', (event: any) => {
        if (!event.results) return;
        const first = event.results[0];
        if (!first) return;
        handlers.onResult?.(first.transcript, event.isFinal === true);
      });

      ExpoSpeechRecognitionModule.addListener('error', () => {
        this.isListening = false;
        handlers.onError?.('Speech recognition error.');
        handlers.onEnd?.();
      });

      ExpoSpeechRecognitionModule.addListener('end', () => {
        this.isListening = false;
        handlers.onEnd?.();
      });

      ExpoSpeechRecognitionModule.start({
        lang: lang,
        continuous: true,
        interimResults: true,
      });

      return true;
    } catch (e: any) {
      this.isListening = false;
      handlers.onError?.(e?.message || 'Failed to start speech recognition.');
      return false;
    }
  }

  stopListening(): void {
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch {}
    this.isListening = false;
  }

  getIsListening(): boolean {
    return this.isListening;
  }

  speakText(text: string, options?: { speed?: number; pitch?: number; onEnd?: () => void }): void {
    const cleanText = cleanTextForSpeech(text);
    if (!cleanText) return;

    this.stopSpeaking();

    this.isSpeaking = true;
    Speech.speak(cleanText, {
      rate: options?.speed ?? 1.0,
      pitch: options?.pitch ?? 1.0,
      language: 'en-US',
      onDone: () => {
        this.isSpeaking = false;
        options?.onEnd?.();
      },
      onError: () => {
        this.isSpeaking = false;
        options?.onEnd?.();
      },
    });
  }

  stopSpeaking(): void {
    Speech.stop();
    this.isSpeaking = false;
  }

  getIsSpeaking(): boolean {
    return this.isSpeaking;
  }
}
