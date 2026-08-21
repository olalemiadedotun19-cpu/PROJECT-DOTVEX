export interface SpeechRecognitionHandlers {
  onStart?: () => void;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}

export interface VoiceService {
  isRecognitionSupported(): boolean;
  isSynthesisSupported(): boolean;
  startListening(handlers: SpeechRecognitionHandlers, lang?: string): boolean;
  stopListening(): void;
  getIsListening(): boolean;
  speakText(text: string, options?: { speed?: number; pitch?: number; onEnd?: () => void }): void;
  stopSpeaking(): void;
  getIsSpeaking(): boolean;
  getVoices?(): any[];
}

export function cleanTextForSpeech(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, 'Code block omitted.')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[*#_~>]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim();
}
