import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  ArrowUp,
  Square,
  Mic,
  MicOff,
  Paperclip,
  X,
  FileText,
  Brain,
  AudioWaveform,
  Code,
  Image as ImageIcon,
  Globe,
  Clock,
  BookMarked,
  AtSign,
  Check,
  ChevronRight,
  Zap,
  Sparkles,
} from 'lucide-react';
import { Attachment } from '../../types/chat';
import { DotvexModelId } from '../../types/settings';
import { motion, AnimatePresence } from 'motion/react';

interface MessageComposerProps {
  onSendMessage: (
    text: string,
    attachments?: Attachment[],
    enableThinking?: boolean,
    enableWebSearch?: boolean
  ) => void;
  onStopGeneration: () => void;
  isGenerating: boolean;
  initialValue?: string;
  activeModelId?: DotvexModelId;
  onChangeModel?: (modelId: DotvexModelId) => void;
  onOpenVoiceMode?: () => void;
  onOpenCodex?: () => void;
  onOpenImages?: () => void;
  onOpenLibrary?: () => void;
  onOpenScheduled?: () => void;
  onOpenPlugins?: () => void;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  onSendMessage,
  onStopGeneration,
  isGenerating,
  initialValue = '',
  activeModelId = 'dotvex-2.0-pro',
  onChangeModel,
  onOpenVoiceMode,
  onOpenCodex,
  onOpenImages,
  onOpenLibrary,
  onOpenScheduled,
  onOpenPlugins,
}) => {
  const [text, setText] = useState(initialValue);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isThinkingEnabled, setIsThinkingEnabled] = useState(false);
  const [isWebSearchEnabled, setIsWebSearchEnabled] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [showModelSubmenu, setShowModelSubmenu] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const modelMetadata: Record<
    DotvexModelId,
    { name: string; tag: string; description: string; color: string }
  > = {
    'dotvex-2.0-pro': {
      name: 'DOTVEX 2.0 Pro',
      tag: 'Default',
      description: 'Smart reasoning and multimodal intelligence for all everyday tasks',
      color: 'text-emerald-400',
    },
    'dotvex-2.0-flash': {
      name: 'DOTVEX 2.0 Flash',
      tag: 'Fast',
      description: 'Lightning-fast responses with ultra-low latency execution',
      color: 'text-cyan-400',
    },
    'dotvex-2.0-ultra': {
      name: 'DOTVEX 2.0 Ultra',
      tag: 'Deep Reasoning',
      description: 'Advanced multi-step reasoning, complex code generation and math',
      color: 'text-purple-400',
    },
    'dotvex-custom-api': {
      name: 'DOTVEX Custom Endpoint',
      tag: 'Custom',
      description: 'Connected to custom local or remote cognitive endpoint',
      color: 'text-amber-400',
    },
  };

  // Close plus popup on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowPlusMenu(false);
        setShowModelSubmenu(false);
      }
    };
    if (showPlusMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPlusMenu]);

  // Sync initialValue
  useEffect(() => {
    if (initialValue) {
      setText(initialValue);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [initialValue]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(Math.max(scrollHeight, 24), 180)}px`;
    }
  }, [text]);

  // Speech to Text Dictation
  const toggleSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    if (isRecording) {
      try {
        recognitionRef.current?.stop();
      } catch {}
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setText((prev) => (prev ? prev + ' ' + currentTranscript : currentTranscript));
      };

      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => setIsRecording(false);

      recognition.start();
      recognitionRef.current = recognition;
      setIsRecording(true);
    } catch {
      setIsRecording(false);
    }
  };

  // Real File Reader for Attachments
  const processFiles = (files: FileList | File[]) => {
    Array.from(files).forEach((file) => {
      const isImage = file.type.startsWith('image/');
      const reader = new FileReader();

      reader.onload = (e) => {
        const result = e.target?.result as string;
        const newAttachment: Attachment = {
          id: 'att_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          url: isImage ? result : undefined,
          textContent: !isImage ? result : undefined,
        };

        setAttachments((prev) => [...prev, newAttachment]);
      };

      if (isImage) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    });
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isGenerating) {
      onStopGeneration();
      return;
    }

    if (!text.trim() && attachments.length === 0) return;

    if (isRecording) {
      try {
        recognitionRef.current?.stop();
      } catch {}
      setIsRecording(false);
    }

    onSendMessage(text.trim(), attachments, isThinkingEnabled, isWebSearchEnabled);
    setText('');
    setAttachments([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Only send on Ctrl+Enter or Cmd+Enter; bare Enter and Shift+Enter both insert a new paragraph/line
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div
      id="message-composer-wrapper"
      className="w-full max-w-3xl mx-auto px-4 pb-4 pt-1 flex-shrink-0 relative select-none"
      onDragOver={(e) => {
        e.preventDefault();
        setIsDraggingOver(true);
      }}
      onDragLeave={() => setIsDraggingOver(false)}
      onDrop={handleDrop}
    >
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        multiple
        className="hidden"
        accept="*/*"
      />

      {/* Drag & Drop Visual Glow */}
      <AnimatePresence>
        {isDraggingOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-x-4 inset-y-0 rounded-[28px] border-2 border-dashed border-emerald-500 bg-emerald-950/30 backdrop-blur-xs flex items-center justify-center z-30 pointer-events-none"
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-400">
              <Paperclip className="w-5 h-5" />
              <span>Drop files here to analyze with DOTVEX 2.0</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Badges Indicator Row */}
      {(isWebSearchEnabled || activeModelId !== 'dotvex-2.0-pro') && (
        <div className="flex items-center gap-2 px-3 pb-1 text-[11px]">
          {activeModelId !== 'dotvex-2.0-pro' && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#e4e4e7] dark:bg-[#2a2a2a] text-[#09090b] dark:text-[#ececec] border border-[#d4d4d8] dark:border-[#3a3a3a]">
              <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span>{modelMetadata[activeModelId].name}</span>
            </div>
          )}
          {isWebSearchEnabled && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
              <Globe className="w-3 h-3" />
              <span>Web Search Grounding Active</span>
              <button
                onClick={() => setIsWebSearchEnabled(false)}
                className="ml-1 hover:text-blue-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Composer Box */}
      <div className="relative rounded-[26px] bg-[#f4f4f5] dark:bg-[#2f2f2f] border border-[#e4e4e7] dark:border-[#383838] shadow-md flex flex-col overflow-visible focus-within:border-[#cbd5e1] dark:focus-within:border-[#4f4f4f] transition-all">
        {/* Attachments Chips Bar */}
        {attachments.length > 0 && (
          <div className="flex items-center gap-2 px-4 pt-3 pb-1 overflow-x-auto">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#212121] border border-[#e4e4e7] dark:border-[#3d3d3d] text-xs text-[#09090b] dark:text-[#ececec] flex-shrink-0 animate-fadeIn"
              >
                {att.url ? (
                  <img src={att.url} alt={att.name} className="w-6 h-6 object-cover rounded-md" />
                ) : (
                  <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                )}
                <div className="max-w-[140px] truncate font-medium">{att.name}</div>
                <button
                  onClick={() => handleRemoveAttachment(att.id)}
                  className="p-0.5 rounded hover:bg-[#eaeaea] dark:hover:bg-[#333] text-[#71717a] dark:text-[#8e8e8e] hover:text-[#09090b] dark:hover:text-[#ececec] transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Row */}
        <div className="flex items-end px-3 py-2 gap-2 relative">
          {/* Plus Button Container with 130fps Smooth Bubble-Up Menu */}
          <div className="relative flex-shrink-0 mb-1" ref={menuRef}>
            <button
              id="composer-plus-btn"
              type="button"
              onClick={() => {
                setShowPlusMenu(!showPlusMenu);
                setShowModelSubmenu(false);
              }}
              className={`p-2 rounded-full transition-all cursor-pointer ${
                showPlusMenu
                  ? 'bg-[#09090b] text-white dark:bg-white dark:text-black rotate-45 scale-105'
                  : 'text-[#71717a] dark:text-[#b4b4b4] hover:text-[#09090b] dark:hover:text-[#ececec] hover:bg-[#e4e4e7] dark:hover:bg-[#383838]'
              }`}
              title="Add tools, models, files & features"
            >
              <Plus className="w-5 h-5 transition-transform duration-200" />
            </button>

            {/* Bubble-Up Animated Menu (Spring physics 130fps smooth) */}
            <AnimatePresence>
              {showPlusMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.85, y: 16, x: 0 }}
                  animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                  exit={{ opacity: 0, scale: 0.85, y: 16 }}
                  transition={{
                    type: 'spring',
                    stiffness: 460,
                    damping: 28,
                    mass: 0.7,
                  }}
                  style={{ transformOrigin: 'bottom left' }}
                  className="absolute bottom-12 left-0 w-72 rounded-2xl bg-white dark:bg-[#212121] border border-[#e4e4e7] dark:border-[#383838] shadow-2xl p-1.5 z-50 text-[#09090b] dark:text-[#ececec] space-y-1 backdrop-blur-md"
                >
                  {/* 1. Model Selector Option */}
                  <div className="relative">
                    <button
                      onClick={() => setShowModelSubmenu(!showModelSubmenu)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs hover:bg-[#f4f4f5] dark:hover:bg-[#2c2c2c] transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1 rounded-lg bg-[#f4f4f5] dark:bg-[#2a2a2a] text-emerald-600 dark:text-emerald-400 group-hover:bg-[#e4e4e7] dark:group-hover:bg-[#333]">
                          <Sparkles className="w-3.5 h-3.5" />
                        </div>
                        <div className="text-left">
                          <div className="font-semibold text-[#09090b] dark:text-[#ececec] flex items-center gap-1.5">
                            <span>{modelMetadata[activeModelId]?.name}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 font-medium">
                              Active
                            </span>
                          </div>
                          <div className="text-[10px] text-[#71717a] dark:text-[#8e8e8e]">
                            Switch AI model & engine
                          </div>
                        </div>
                      </div>
                      <ChevronRight
                        className={`w-3.5 h-3.5 text-[#71717a] dark:text-[#8e8e8e] transition-transform ${
                          showModelSubmenu ? 'rotate-90' : ''
                        }`}
                      />
                    </button>

                    {/* Submenu for selecting Models */}
                    <AnimatePresence>
                      {showModelSubmenu && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.16 }}
                          className="overflow-hidden px-1 pt-1 pb-1 space-y-1 bg-[#f9f9fa] dark:bg-[#1a1a1a] rounded-xl border border-[#e4e4e7] dark:border-[#2e2e2e] mt-1"
                        >
                          {(
                            ['dotvex-2.0-pro', 'dotvex-2.0-flash', 'dotvex-2.0-ultra'] as DotvexModelId[]
                          ).map((mId) => {
                            const meta = modelMetadata[mId];
                            const isSelected = activeModelId === mId;
                            return (
                              <button
                                key={mId}
                                onClick={() => {
                                  onChangeModel?.(mId);
                                  setShowModelSubmenu(false);
                                  setShowPlusMenu(false);
                                }}
                                className={`w-full flex items-start justify-between p-2 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                                  isSelected
                                    ? 'bg-[#e4e4e7] dark:bg-[#2a2a2a] text-[#09090b] dark:text-white font-medium'
                                    : 'text-[#52525b] dark:text-[#b4b4b4] hover:bg-[#f4f4f5] dark:hover:bg-[#252525] hover:text-[#09090b] dark:hover:text-[#ececec]'
                                }`}
                              >
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-semibold">{meta.name}</span>
                                    <span className="text-[9px] px-1 rounded bg-[#e4e4e7] dark:bg-[#333] text-[#52525b] dark:text-[#999]">
                                      {meta.tag}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-[#71717a] dark:text-[#737373] mt-0.5 leading-snug">
                                    {meta.description}
                                  </div>
                                </div>
                                {isSelected && (
                                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5 ml-1" />
                                )}
                              </button>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="border-t border-[#e4e4e7] dark:border-[#2e2e2e] my-1" />

                  {/* 2. Add Photos & Files */}
                  <button
                    onClick={() => {
                      fileInputRef.current?.click();
                      setShowPlusMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#09090b] dark:text-[#ececec] hover:bg-[#f4f4f5] dark:hover:bg-[#2c2c2c] transition-colors cursor-pointer"
                  >
                    <div className="p-1 rounded-lg bg-[#f4f4f5] dark:bg-[#2a2a2a] text-emerald-600 dark:text-emerald-400">
                      <Paperclip className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">Add photos & files</div>
                      <div className="text-[10px] text-[#71717a] dark:text-[#8e8e8e]">
                        Upload documents, code, images
                      </div>
                    </div>
                  </button>

                  {/* 3. Create Image */}
                  {onOpenImages && (
                    <button
                      onClick={() => {
                        onOpenImages();
                        setShowPlusMenu(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#09090b] dark:text-[#ececec] hover:bg-[#f4f4f5] dark:hover:bg-[#2c2c2c] transition-colors cursor-pointer"
                    >
                      <div className="p-1 rounded-lg bg-[#f4f4f5] dark:bg-[#2a2a2a] text-amber-600 dark:text-amber-400">
                        <ImageIcon className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold">Create image</div>
                        <div className="text-[10px] text-[#71717a] dark:text-[#8e8e8e]">
                          Generate AI visual assets
                        </div>
                      </div>
                    </button>
                  )}

                  {/* 4. Web Search Grounding */}
                  <button
                    onClick={() => {
                      setIsWebSearchEnabled(!isWebSearchEnabled);
                      setShowPlusMenu(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-[#09090b] dark:text-[#ececec] hover:bg-[#f4f4f5] dark:hover:bg-[#2c2c2c] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1 rounded-lg bg-[#f4f4f5] dark:bg-[#2a2a2a] text-blue-600 dark:text-blue-400">
                        <Globe className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold">Search the web</div>
                        <div className="text-[10px] text-[#71717a] dark:text-[#8e8e8e]">
                          Real-time live internet grounding
                        </div>
                      </div>
                    </div>
                    {isWebSearchEnabled && (
                      <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    )}
                  </button>

                  {/* 5. Codex Sandbox */}
                  {onOpenCodex && (
                    <button
                      onClick={() => {
                        onOpenCodex();
                        setShowPlusMenu(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#09090b] dark:text-[#ececec] hover:bg-[#f4f4f5] dark:hover:bg-[#2c2c2c] transition-colors cursor-pointer"
                    >
                      <div className="p-1 rounded-lg bg-[#f4f4f5] dark:bg-[#2a2a2a] text-cyan-600 dark:text-cyan-400">
                        <Code className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold">Codex Sandbox</div>
                        <div className="text-[10px] text-[#71717a] dark:text-[#8e8e8e]">
                          Run & test TypeScript/JS live
                        </div>
                      </div>
                    </button>
                  )}

                  {/* 6. Deep Think Toggle */}
                  <button
                    onClick={() => {
                      setIsThinkingEnabled(!isThinkingEnabled);
                      setShowPlusMenu(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-[#09090b] dark:text-[#ececec] hover:bg-[#f4f4f5] dark:hover:bg-[#2c2c2c] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1 rounded-lg bg-[#f4f4f5] dark:bg-[#2a2a2a] text-purple-600 dark:text-purple-400">
                        <Brain className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold">Deep Reasoning (Think)</div>
                        <div className="text-[10px] text-[#71717a] dark:text-[#8e8e8e]">
                          Step-by-step cognitive traces
                        </div>
                      </div>
                    </div>
                    {isThinkingEnabled && (
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    )}
                  </button>

                  {/* 7. Scheduled Prompts */}
                  {onOpenScheduled && (
                    <button
                      onClick={() => {
                        onOpenScheduled();
                        setShowPlusMenu(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#09090b] dark:text-[#ececec] hover:bg-[#f4f4f5] dark:hover:bg-[#2c2c2c] transition-colors cursor-pointer"
                    >
                      <div className="p-1 rounded-lg bg-[#f4f4f5] dark:bg-[#2a2a2a] text-indigo-600 dark:text-indigo-400">
                        <Clock className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold">Scheduled Prompts</div>
                        <div className="text-[10px] text-[#71717a] dark:text-[#8e8e8e]">
                          Automate periodic prompts
                        </div>
                      </div>
                    </button>
                  )}

                  {/* 8. Library */}
                  {onOpenLibrary && (
                    <button
                      onClick={() => {
                        onOpenLibrary();
                        setShowPlusMenu(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#09090b] dark:text-[#ececec] hover:bg-[#f4f4f5] dark:hover:bg-[#2c2c2c] transition-colors cursor-pointer"
                    >
                      <div className="p-1 rounded-lg bg-[#f4f4f5] dark:bg-[#2a2a2a] text-amber-600 dark:text-amber-400">
                        <BookMarked className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold">Library & Notes</div>
                        <div className="text-[10px] text-[#71717a] dark:text-[#8e8e8e]">
                          Saved snippets and prompts
                        </div>
                      </div>
                    </button>
                  )}

                  {/* 9. Plugins */}
                  {onOpenPlugins && (
                    <button
                      onClick={() => {
                        onOpenPlugins();
                        setShowPlusMenu(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#09090b] dark:text-[#ececec] hover:bg-[#f4f4f5] dark:hover:bg-[#2c2c2c] transition-colors cursor-pointer"
                    >
                      <div className="p-1 rounded-lg bg-[#f4f4f5] dark:bg-[#2a2a2a] text-rose-600 dark:text-rose-400">
                        <AtSign className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold">Plugins & Tools</div>
                        <div className="text-[10px] text-[#71717a] dark:text-[#8e8e8e]">
                          Calculators, converters & JSON
                        </div>
                      </div>
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Text Area */}
          <textarea
            ref={textareaRef}
            id="composer-textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Reply to DOTVEX 2.0..."
            rows={1}
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
            className="flex-1 bg-transparent border-0 text-sm text-[#09090b] dark:text-[#ececec] placeholder-[#71717a] dark:placeholder-[#737373] resize-none focus:outline-none py-1.5 px-1 max-h-44 leading-normal no-scrollbar overflow-y-auto"
          />

          {/* Right Action Controls */}
          <div className="flex items-center gap-1.5 flex-shrink-0 mb-1">
            {/* Think Mode Quick-Pill */}
            <button
              id="composer-think-toggle"
              type="button"
              onClick={() => setIsThinkingEnabled(!isThinkingEnabled)}
              title={isThinkingEnabled ? 'Deep Reasoning Active' : 'Enable Deep Reasoning'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                isThinkingEnabled
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-400 dark:border-emerald-700/60 shadow-xs'
                  : 'bg-[#e4e4e7] text-[#52525b] hover:text-[#09090b] border border-[#d4d4d8] dark:bg-[#262626] dark:text-[#8e8e8e] dark:hover:text-[#ececec] dark:border-[#383838]'
              }`}
            >
              <Brain
                className={`w-3.5 h-3.5 ${
                  isThinkingEnabled ? 'text-emerald-700 dark:text-emerald-400' : ''
                }`}
              />
              <span>Think</span>
            </button>

            {/* Mic Dictation */}
            <button
              id="composer-mic-btn"
              type="button"
              onClick={toggleSpeechRecognition}
              title={isRecording ? 'Listening...' : 'Dictate with voice'}
              className={`p-2 rounded-full transition-colors cursor-pointer ${
                isRecording
                  ? 'bg-red-600 text-white animate-pulse'
                  : 'text-[#71717a] dark:text-[#b4b4b4] hover:text-[#09090b] dark:hover:text-[#ececec] hover:bg-[#e4e4e7] dark:hover:bg-[#383838]'
              }`}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Send OR Live Voice Mode Waveform Button */}
            {isGenerating ? (
              <button
                id="composer-stop-btn"
                type="button"
                onClick={onStopGeneration}
                className="p-2 rounded-full bg-[#09090b] text-white dark:bg-[#ececec] dark:text-[#171717] hover:opacity-90 transition-all cursor-pointer"
                title="Stop generation"
              >
                <Square className="w-4 h-4 fill-current" />
              </button>
            ) : text.trim() || attachments.length > 0 ? (
              <button
                id="composer-send-btn"
                type="button"
                onClick={() => handleSubmit()}
                className="p-2 rounded-full bg-[#09090b] text-white dark:bg-[#ececec] dark:text-[#171717] hover:opacity-90 transition-all shadow-xs cursor-pointer"
                title="Send message"
              >
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              </button>
            ) : (
              <button
                id="composer-voice-mode-btn"
                type="button"
                onClick={onOpenVoiceMode}
                className="p-2 rounded-full bg-[#e4e4e7] text-[#09090b] hover:bg-[#d4d4d8] dark:bg-[#212121] dark:text-[#ececec] dark:hover:bg-[#383838] transition-colors cursor-pointer"
                title="Start Voice Conversation"
              >
                <AudioWaveform className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Footer Tag */}
      <div className="text-center mt-1.5 text-[11px] text-[#737373]">
        DOTVEX 2.0 can make mistakes. Verify critical architecture decisions.
      </div>
    </div>
  );
};
