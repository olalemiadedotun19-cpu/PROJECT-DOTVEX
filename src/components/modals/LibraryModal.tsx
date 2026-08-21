import React, { useState, useEffect } from 'react';
import { X, BookMarked, Code2, FileText, Sparkles, Trash2, Copy, Check, Plus } from 'lucide-react';
import { conversationService } from '../../services/api/conversationService';
import { LibraryItem } from '../../types/conversation';
import { motion } from 'motion/react';

interface LibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertToChat?: (text: string) => void;
}

export const LibraryModal: React.FC<LibraryModalProps> = ({ isOpen, onClose, onInsertToChat }) => {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'code' | 'note' | 'prompt'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<'code' | 'note' | 'prompt'>('note');

  const refresh = () => {
    setItems(conversationService.getLibraryItems());
  };

  useEffect(() => {
    if (isOpen) {
      refresh();
      // Seed default items if empty
      const existing = conversationService.getLibraryItems();
      if (existing.length === 0) {
        conversationService.addLibraryItem({
          title: 'Fast TypeScript Async Pipeline',
          content: `export async function runPipeline<T>(tasks: (() => Promise<T>)[]): Promise<T[]> {\n  return Promise.all(tasks.map(t => t()));\n}`,
          category: 'code',
          tags: ['typescript', 'async'],
        });
        conversationService.addLibraryItem({
          title: 'System Architecture Prompt',
          content: 'You are DOTVEX 2.0, an expert system engineer. Provide rigorous architecture specs with mathematical time complexity analysis.',
          category: 'prompt',
          tags: ['system', 'prompt'],
        });
        refresh();
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleDelete = (id: string) => {
    conversationService.deleteLibraryItem(id);
    refresh();
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    conversationService.addLibraryItem({
      title: newTitle.trim(),
      content: newContent.trim(),
      category: newCategory,
      tags: [newCategory],
    });
    setNewTitle('');
    setNewContent('');
    setIsCreating(false);
    refresh();
  };

  const filtered = items.filter((i) => filter === 'all' || i.category === filter);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
      <div className="absolute inset-0" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-3xl rounded-2xl bg-[#212121] border border-[#333] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-[#ececec]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#333]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#2f2f2f] text-amber-400">
              <BookMarked className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Workspace Library</h2>
              <p className="text-xs text-[#b4b4b4]">Saved code snippets, notes, and prompt blueprints</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCreating(true)}
              className="px-3 py-1.5 rounded-lg bg-[#2f2f2f] hover:bg-[#383838] text-xs font-medium text-[#ececec] flex items-center gap-1.5 border border-[#383838]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Snippet</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#8e8e8e] hover:text-[#ececec] hover:bg-[#2f2f2f] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-2 px-5 py-3 border-b border-[#2a2a2a] bg-[#1e1e1e]">
          {(['all', 'code', 'note', 'prompt'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all ${
                filter === cat
                  ? 'bg-[#333] text-[#ececec]'
                  : 'text-[#8e8e8e] hover:text-[#ececec] hover:bg-[#262626]'
              }`}
            >
              {cat === 'all' ? 'All Items' : `${cat}s`}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Create Form */}
          {isCreating && (
            <form onSubmit={handleCreate} className="p-4 rounded-xl bg-[#2a2a2a] border border-[#383838] space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-[#ececec]">Add to Library</h3>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="text-xs text-[#8e8e8e] hover:text-[#ececec]"
                >
                  Cancel
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Snippet or Note Title"
                  className="w-full px-3 py-2 rounded-lg bg-[#212121] border border-[#333] text-xs text-[#ececec] placeholder-[#737373] focus:outline-none focus:border-amber-500"
                />
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg bg-[#212121] border border-[#333] text-xs text-[#ececec] focus:outline-none focus:border-amber-500"
                >
                  <option value="code">Code Snippet</option>
                  <option value="note">Document Note</option>
                  <option value="prompt">Prompt Blueprint</option>
                </select>
              </div>
              <textarea
                required
                rows={3}
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Content, code, or prompt..."
                className="w-full px-3 py-2 rounded-lg bg-[#212121] border border-[#333] text-xs text-[#ececec] placeholder-[#737373] focus:outline-none focus:border-amber-500 font-mono"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium"
                >
                  Save to Library
                </button>
              </div>
            </form>
          )}

          {/* List */}
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#737373]">
              No items in this category. Click "New Snippet" above to store code, notes, or prompts.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-[#2a2a2a] border border-[#333] hover:border-[#444] transition-all space-y-2 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {item.category === 'code' ? (
                        <Code2 className="w-4 h-4 text-cyan-400" />
                      ) : item.category === 'prompt' ? (
                        <Sparkles className="w-4 h-4 text-purple-400" />
                      ) : (
                        <FileText className="w-4 h-4 text-amber-400" />
                      )}
                      <h4 className="text-sm font-medium text-[#ececec]">{item.title}</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#333] text-[#b4b4b4] capitalize font-mono">
                        {item.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleCopy(item.id, item.content)}
                        className="p-1.5 rounded-lg hover:bg-[#333] text-[#b4b4b4] hover:text-[#ececec] transition-colors"
                        title="Copy content"
                      >
                        {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      {onInsertToChat && (
                        <button
                          onClick={() => {
                            onInsertToChat(item.content);
                            onClose();
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[#333] hover:bg-[#3d3d3d] text-xs text-[#ececec]"
                        >
                          Insert
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 rounded-lg hover:bg-red-950/40 text-[#737373] hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <pre className="p-3 rounded-lg bg-[#181818] border border-[#282828] text-xs text-[#b4b4b4] font-mono overflow-x-auto whitespace-pre-wrap max-h-36">
                    {item.content}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
