import React, { useRef, useEffect, useState } from 'react';
import { ChatMessage } from '../../types/chat';
import { ChatMessageItem } from './ChatMessageItem';
import { EmptyState } from './EmptyState';
import { ArrowDown } from 'lucide-react';

interface MessageListProps {
  messages: ChatMessage[];
  onSelectPrompt: (prompt: string) => void;
  onRegenerate?: (messageId: string) => void;
  onEditUserMessage?: (content: string) => void;
  onOpenCodexWithCode?: (code: string) => void;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  onSelectPrompt,
  onRegenerate,
  onEditUserMessage,
  onOpenCodexWithCode,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomAnchorRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const userHasScrolledUpRef = useRef(false);

  // Detect scroll position to show/hide scroll-to-bottom button
  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;
    const isScrolledUp = distanceToBottom > 150;
    userHasScrolledUpRef.current = isScrolledUp;
    setShowScrollBottom(isScrolledUp);
  };

  // Scroll to bottom
  const scrollToBottom = (smooth = true) => {
    if (bottomAnchorRef.current) {
      bottomAnchorRef.current.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
        block: 'end',
      });
    }
  };

  useEffect(() => {
    if (!userHasScrolledUpRef.current) {
      scrollToBottom(false);
    }
  }, [messages]);

  return (
    <div className="relative flex-1 min-h-0 overflow-hidden flex flex-col bg-[#212121]">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        id="dotvex-messages-viewport"
        className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col"
      >
        {messages.length === 0 ? (
          <EmptyState onSelectPrompt={onSelectPrompt} />
        ) : (
          <div className="flex-1 py-4 flex flex-col justify-start">
            {messages.map((message) => (
              <ChatMessageItem
                key={message.id}
                message={message}
                onRegenerate={onRegenerate}
                onEdit={onEditUserMessage}
                onOpenCodexWithCode={onOpenCodexWithCode}
              />
            ))}
            <div ref={bottomAnchorRef} className="h-6 flex-shrink-0" />
          </div>
        )}
      </div>

      {/* Floating Scroll-To-Bottom Button (shown in user's screenshot) */}
      {showScrollBottom && (
        <button
          onClick={() => scrollToBottom(true)}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 p-2 rounded-full bg-[#2f2f2f] hover:bg-[#383838] border border-[#444] text-[#ececec] shadow-xl transition-all z-20"
          title="Scroll to bottom"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
