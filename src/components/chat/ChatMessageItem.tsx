import React, { useState } from 'react';
import { ChatMessage } from '../../types/chat';
import {
  Copy,
  Check,
  RotateCw,
  Edit2,
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronUp,
  Brain,
  FileText,
  Bookmark,
  BookmarkCheck,
  Play,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { conversationService } from '../../services/api/conversationService';

interface ChatMessageItemProps {
  message: ChatMessage;
  onRegenerate?: (messageId: string) => void;
  onEdit?: (content: string) => void;
  onOpenCodexWithCode?: (code: string) => void;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  message,
  onRegenerate,
  onEdit,
  onOpenCodexWithCode,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isReasoningOpen, setIsReasoningOpen] = useState(false);
  const [isSavedToLibrary, setIsSavedToLibrary] = useState(false);

  const isAssistant = message.role === 'assistant';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleSpeak = () => {
    const synth = window.speechSynthesis;
    if (!synth) return;

    if (isSpeaking) {
      synth.cancel();
      setIsSpeaking(false);
      return;
    }

    synth.cancel();
    const cleanText = message.content.replace(/[#*`_]/g, '');
    const utter = new SpeechSynthesisUtterance(cleanText);
    utter.rate = 1.0;
    utter.onend = () => setIsSpeaking(false);
    utter.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    synth.speak(utter);
  };

  const handleSaveToLibrary = () => {
    conversationService.addLibraryItem({
      title: message.content.slice(0, 40) + '...',
      content: message.content,
      category: 'note',
      tags: ['saved-chat', 'dotvex'],
    });
    setIsSavedToLibrary(true);
    setTimeout(() => setIsSavedToLibrary(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="w-full py-3 px-4 flex justify-center bg-transparent"
    >
      <div className="w-full max-w-3xl flex gap-4">
        {/* User / AI Message Body */}
        <div className={`flex-1 min-w-0 ${!isAssistant ? 'flex justify-end' : ''}`}>
          {/* 1. USER MESSAGE (Pill on right) */}
          {!isAssistant ? (
            <div className="max-w-[85%] sm:max-w-[75%] rounded-[22px] bg-[#f4f4f5] dark:bg-[#2f2f2f] border border-[#e4e4e7] dark:border-[#383838] px-4 py-3 text-sm text-[#09090b] dark:text-[#ececec] shadow-xs space-y-2">
              {/* Attachments preview */}
              {message.attachments && message.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 pb-1">
                  {message.attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-[#212121] border border-[#e4e4e7] dark:border-[#3d3d3d] text-xs text-[#09090b] dark:text-[#ececec]"
                    >
                      {att.url ? (
                        <img
                          src={att.url}
                          alt={att.name}
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                      ) : (
                        <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      )}
                      <span className="truncate max-w-[120px]">{att.name}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>
              {onEdit && (
                <div className="flex justify-end pt-0.5">
                  <button
                    onClick={() => onEdit(message.content)}
                    className="p-1 rounded text-[#71717a] dark:text-[#8e8e8e] hover:text-[#09090b] dark:hover:text-[#ececec] transition-colors cursor-pointer"
                    title="Edit prompt"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* 2. ASSISTANT MESSAGE (Clean Left-aligned Stream) */
            <div className="space-y-3 w-full">
              {/* Thinking System: Tappable Collapsible Pill that scrolls open/closed */}
              {message.reasoningTrace && (
                <div className="rounded-xl border border-[#e4e4e7] dark:border-[#2e2e2e] bg-[#f9f9fa] dark:bg-[#1a1a1a] overflow-hidden">
                  <button
                    onClick={() => setIsReasoningOpen(!isReasoningOpen)}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs text-[#52525b] dark:text-[#8e8e8e] hover:text-[#09090b] dark:hover:text-[#ececec] hover:bg-[#f0f0f2] dark:hover:bg-[#242424] transition-all cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2">
                      <Brain className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
                      <span className="font-medium text-[#27272a] dark:text-[#b4b4b4]">
                        {message.status === 'thinking'
                          ? 'Thinking...'
                          : 'Thought for a few seconds'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-[#71717a] dark:text-[#737373]">
                      <span>{isReasoningOpen ? 'Hide thoughts' : 'View thoughts'}</span>
                      {isReasoningOpen ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </div>
                  </button>

                  <AnimatePresence>
                    {isReasoningOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-[#e4e4e7] dark:border-[#262626] bg-[#f4f4f5] dark:bg-[#141414]"
                      >
                        <div className="max-h-60 overflow-y-auto p-3.5 font-mono text-xs text-[#52525b] dark:text-[#999] leading-relaxed whitespace-pre-wrap select-text">
                          {message.reasoningTrace}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Message Content: Rendered with standard react-markdown (NO raw ** marks) */}
              {message.status === 'error' && !message.content ? (
                <div className="flex items-center justify-between p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                  <span>An error occurred while generating the response.</span>
                  {onRegenerate && (
                    <button
                      onClick={() => onRegenerate(message.id)}
                      className="px-2.5 py-1 rounded-md bg-red-500/20 hover:bg-red-500/30 text-red-300 font-medium transition-colors cursor-pointer"
                    >
                      Retry
                    </button>
                  )}
                </div>
              ) : (message.status === 'thinking' || message.status === 'generating') && !message.content ? (
                <div className="flex items-center gap-2 text-xs text-[#71717a] dark:text-[#8e8e8e] py-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping" />
                  <span>
                    {message.status === 'thinking'
                      ? 'DOTVEX 2.0 is reasoning...'
                      : 'DOTVEX 2.0 is generating response...'}
                  </span>
                </div>
              ) : (
                <div className="text-sm leading-relaxed text-[#09090b] dark:text-[#ececec]">
                  <div className="markdown-body space-y-3">
                    <Markdown
                      components={{
                        // Bold text (proper <strong> tag)
                        strong: ({ node, ...props }) => (
                          <strong
                            className="font-semibold text-[#09090b] dark:text-white"
                            {...props}
                          />
                        ),
                        // Paragraphs
                        p: ({ node, ...props }) => (
                          <p
                            className="leading-relaxed text-[#09090b] dark:text-[#ececec] whitespace-pre-wrap"
                            {...props}
                          />
                        ),
                        // Headings
                        h1: ({ node, ...props }) => (
                          <h1
                            className="text-xl font-bold text-[#09090b] dark:text-white mt-4 mb-2"
                            {...props}
                          />
                        ),
                        h2: ({ node, ...props }) => (
                          <h2
                            className="text-lg font-bold text-[#09090b] dark:text-white mt-3 mb-1.5"
                            {...props}
                          />
                        ),
                        h3: ({ node, ...props }) => (
                          <h3
                            className="text-base font-semibold text-[#09090b] dark:text-white mt-2.5 mb-1"
                            {...props}
                          />
                        ),
                        // Unordered list
                        ul: ({ node, ...props }) => (
                          <ul
                            className="list-disc list-inside space-y-1 pl-1 text-[#09090b] dark:text-[#ececec]"
                            {...props}
                          />
                        ),
                        // Ordered list
                        ol: ({ node, ...props }) => (
                          <ol
                            className="list-decimal list-inside space-y-1 pl-1 text-[#09090b] dark:text-[#ececec]"
                            {...props}
                          />
                        ),
                        // List items
                        li: ({ node, ...props }) => <li className="leading-relaxed" {...props} />,
                        // Blockquote
                        blockquote: ({ node, ...props }) => (
                          <blockquote
                            className="border-l-2 border-emerald-500 pl-3 py-1 text-[#52525b] dark:text-[#b4b4b4] italic bg-[#f4f4f5] dark:bg-[#1a1a1a] rounded-r-lg my-2"
                            {...props}
                          />
                        ),
                        // Code blocks and inline code
                        code: ({ node, className, children, ...props }: any) => {
                          const isInline =
                            !className && typeof children === 'string' && !children.includes('\n');
                          if (isInline) {
                            return (
                              <code
                                className="px-1.5 py-0.5 rounded bg-[#f4f4f5] dark:bg-[#2a2a2a] text-emerald-700 dark:text-emerald-300 font-mono text-xs border border-[#e4e4e7] dark:border-[#383838]"
                                {...props}
                              >
                                {children}
                              </code>
                            );
                          }

                          const match = /language-(\w+)/.exec(className || '');
                          const lang = match ? match[1] : 'code';
                          const codeString = String(children).replace(/\n$/, '');

                          return (
                            <div className="my-3 rounded-xl overflow-hidden bg-[#f9f9fa] dark:bg-[#181818] border border-[#e4e4e7] dark:border-[#2e2e2e]">
                              <div className="flex items-center justify-between px-4 py-2 bg-[#f0f0f2] dark:bg-[#212121] border-b border-[#e4e4e7] dark:border-[#2e2e2e] text-[11px] font-mono text-[#71717a] dark:text-[#8e8e8e]">
                                <span>{lang}</span>
                                <div className="flex items-center gap-2">
                                  {onOpenCodexWithCode && (
                                    <button
                                      onClick={() => onOpenCodexWithCode(codeString)}
                                      className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors cursor-pointer"
                                    >
                                      <Play className="w-3 h-3" />
                                      <span>Run in Codex</span>
                                    </button>
                                  )}
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(codeString);
                                    }}
                                    className="flex items-center gap-1 hover:text-[#09090b] dark:hover:text-[#ececec] transition-colors cursor-pointer"
                                  >
                                    <Copy className="w-3 h-3" />
                                    <span>Copy code</span>
                                  </button>
                                </div>
                              </div>
                              <pre className="p-4 text-xs font-mono text-[#09090b] dark:text-[#ececec] overflow-x-auto whitespace-pre leading-relaxed">
                                <code>{codeString}</code>
                              </pre>
                            </div>
                          );
                        },
                      }}
                    >
                      {message.content}
                    </Markdown>
                  </div>

                  {message.status === 'generating' && (
                    <span className="inline-block w-2 h-4 bg-emerald-500 dark:bg-emerald-400 ml-1 animate-pulse align-middle" />
                  )}
                </div>
              )}

              {/* Action Toolbar */}
              {message.content && message.status !== 'generating' && (
                <div className="flex items-center gap-1.5 pt-1 text-[#71717a] dark:text-[#8e8e8e]">
                  <button
                    onClick={handleCopy}
                    className="p-1.5 rounded-lg hover:bg-[#f4f4f5] dark:hover:bg-[#2a2a2a] hover:text-[#09090b] dark:hover:text-[#ececec] transition-colors cursor-pointer"
                    title="Copy message"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    onClick={handleToggleSpeak}
                    className="p-1.5 rounded-lg hover:bg-[#f4f4f5] dark:hover:bg-[#2a2a2a] hover:text-[#09090b] dark:hover:text-[#ececec] transition-colors cursor-pointer"
                    title={isSpeaking ? 'Stop speaking' : 'Read aloud'}
                  >
                    {isSpeaking ? (
                      <VolumeX className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    onClick={handleSaveToLibrary}
                    className="p-1.5 rounded-lg hover:bg-[#f4f4f5] dark:hover:bg-[#2a2a2a] hover:text-[#09090b] dark:hover:text-[#ececec] transition-colors cursor-pointer"
                    title="Save to Library"
                  >
                    {isSavedToLibrary ? (
                      <BookmarkCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Bookmark className="w-4 h-4" />
                    )}
                  </button>

                  {onRegenerate && (
                    <button
                      onClick={() => onRegenerate(message.id)}
                      className="p-1.5 rounded-lg hover:bg-[#f4f4f5] dark:hover:bg-[#2a2a2a] hover:text-[#09090b] dark:hover:text-[#ececec] transition-colors cursor-pointer"
                      title="Regenerate response"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
