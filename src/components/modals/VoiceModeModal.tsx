import React, { useState, useEffect, useRef } from 'react';
import { X, Mic, MicOff, Volume2, Sparkles, PhoneOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface VoiceModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTranscribedQuery?: (text: string) => void;
}

export const VoiceModeModal: React.FC<VoiceModeModalProps> = ({ isOpen, onClose, onTranscribedQuery }) => {
  const [isListening, setIsListening] = useState(true);
  const [transcript, setTranscript] = useState('');
  const [aiSpeechStatus, setAiSpeechStatus] = useState<'listening' | 'thinking' | 'speaking'>('listening');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!isOpen) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const current = event.resultIndex;
        const text = event.results[current][0].transcript;
        setTranscript(text);

        if (event.results[current].isFinal) {
          setAiSpeechStatus('thinking');
          setTimeout(() => {
            setAiSpeechStatus('speaking');
            // Speak response using Web Speech Synthesis
            const synth = window.speechSynthesis;
            if (synth) {
              const utter = new SpeechSynthesisUtterance(
                `I heard you say: "${text}". I am analyzing this in DOTVEX 2.0 real-time cognition core.`
              );
              utter.rate = 1.05;
              utter.onend = () => {
                setAiSpeechStatus('listening');
                if (onTranscribedQuery) {
                  onTranscribedQuery(text);
                  onClose();
                }
              };
              synth.speak(utter);
            }
          }, 800);
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      try {
        recognition.start();
        recognitionRef.current = recognition;
        setIsListening(true);
      } catch {}
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleMic = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#121212]/95 backdrop-blur-md animate-fadeIn text-[#ececec]">
      <div className="relative w-full max-w-xl flex flex-col items-center justify-between min-h-[500px] p-8">
        {/* Top Bar */}
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold tracking-wider uppercase text-emerald-400">
              DOTVEX 2.0 LIVE VOICE MODE
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-[#262626] hover:bg-[#333] text-[#8e8e8e] hover:text-[#ececec] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Center Pulsing Orb */}
        <div className="my-auto flex flex-col items-center space-y-8">
          <div className="relative flex items-center justify-center">
            {/* Outer rings */}
            <motion.div
              animate={{
                scale: aiSpeechStatus === 'speaking' ? [1, 1.35, 1] : isListening ? [1, 1.15, 1] : 1,
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{ repeat: Infinity, duration: aiSpeechStatus === 'speaking' ? 1.2 : 2.5, ease: 'easeInOut' }}
              className="absolute w-44 h-44 rounded-full bg-emerald-500/20 blur-xl"
            />
            <motion.div
              animate={{
                scale: aiSpeechStatus === 'speaking' ? [1, 1.2, 1] : [1, 1.08, 1],
              }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
              className="relative w-32 h-32 rounded-full bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 shadow-2xl flex items-center justify-center cursor-pointer"
              onClick={toggleMic}
            >
              <div className="w-24 h-24 rounded-full bg-[#181818] flex items-center justify-center">
                {isListening ? (
                  <Mic className="w-8 h-8 text-emerald-400 animate-pulse" />
                ) : (
                  <MicOff className="w-8 h-8 text-[#737373]" />
                )}
              </div>
            </motion.div>
          </div>

          <div className="text-center space-y-2 max-w-md">
            <div className="text-sm font-semibold capitalize text-[#ececec]">
              {aiSpeechStatus === 'speaking'
                ? 'DOTVEX is speaking...'
                : aiSpeechStatus === 'thinking'
                ? 'Synthesizing voice response...'
                : isListening
                ? 'Listening to you...'
                : 'Microphone muted'}
            </div>
            {transcript && (
              <p className="text-xs text-[#b4b4b4] italic bg-[#212121] px-4 py-2 rounded-xl border border-[#333]">
                "{transcript}"
              </p>
            )}
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleMic}
            className={`p-4 rounded-full ${
              isListening ? 'bg-[#2f2f2f] hover:bg-[#383838]' : 'bg-red-900/60 hover:bg-red-800'
            } transition-colors`}
          >
            {isListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5 text-red-400" />}
          </button>
          <button
            onClick={onClose}
            className="p-4 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-lg transition-colors"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
