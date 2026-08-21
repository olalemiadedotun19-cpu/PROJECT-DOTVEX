import React, { useState, useEffect, useRef } from 'react';
import { Conversation } from '../../types/conversation';
import { conversationService } from '../../services/api/conversationService';
import { Search, MessageSquare, X, ArrowRight } from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectConversation: (conversationId: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectConversation,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

     setIsLoading(true);
    const timeout = setTimeout(async () => {
      const all = await conversationService.getConversations();
      const q = query.toLowerCase();
      const matched = all.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          (c.lastMessagePreview && c.lastMessagePreview.toLowerCase().includes(q))
      );
      setResults(matched);
      setIsLoading(false);
    }, 150);

    return () => clearTimeout(timeout);
  }, [query]);

  // Handle escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      {/* Backdrop click */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Dialog */}
      <div
        id="search-conversations-modal"
        className="relative w-full max-w-xl rounded-2xl bg-white dark:bg-[#161822] border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden flex flex-col max-h-[75vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header Bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-800/80">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            id="search-input-field"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search conversations and topics..."
            className="flex-1 bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700"
          >
            ESC
          </button>
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-2">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-gray-400">Searching conversations...</div>
          ) : query.trim() === '' ? (
            <div className="p-8 text-center text-xs text-gray-400">
              Type keywords to search through your DOTVEX conversation history.
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-400">
              No matching conversations found for "{query}".
            </div>
          ) : (
            <div className="space-y-1">
              <div className="px-3 py-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Matching Conversations ({results.length})
              </div>
              {results.map((item) => (
                <button
                  key={item.id}
                  id={`search-result-${item.id}`}
                  onClick={() => {
                    onSelectConversation(item.id);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800/70 text-left transition-colors group"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 group-hover:text-blue-500 transition-colors">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {item.title}
                      </div>
                      {item.lastMessagePreview && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                          {item.lastMessagePreview}
                        </div>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
