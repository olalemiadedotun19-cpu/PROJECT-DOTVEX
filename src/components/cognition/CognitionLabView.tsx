import React, { useState, useEffect } from 'react';
import { MemoryItem, MemoryCategory, MemoryLifespan, CognitionLabStats, MemorySourceType } from '../../types/memory';
import { cognitionService } from '../../services/api/cognitionService';
import {
  Brain,
  Search,
  Plus,
  Trash2,
  Tag,
  ArrowLeft,
  Calendar,
  Layers,
  Sparkles,
  CheckCircle2,
  X,
  Cpu,
  Database,
  Pencil,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CognitionLabViewProps {
  onBackToChat: () => void;
}

export const CognitionLabView: React.FC<CognitionLabViewProps> = ({ onBackToChat }) => {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [stats, setStats] = useState<CognitionLabStats>({
    totalMemories: 0,
    activeConcepts: 0,
    averageConfidence: 0,
    averageImportance: 0,
    lastUpdated: Date.now(),
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MemoryCategory | 'all'>('all');
  const [isAdding, setIsAdding] = useState(false);

  // New Memory Form State
  const [newConcept, setNewConcept] = useState('');
  const [newCategory, setNewCategory] = useState<MemoryCategory>('fact');
  const [newContent, setNewContent] = useState('');
  const [newConfidence, setNewConfidence] = useState(0.85);
  const [newImportance, setNewImportance] = useState(0.5);
  const [newTags, setNewTags] = useState('');

  const [editingMemory, setEditingMemory] = useState<MemoryItem | null>(null);
  const [editSourceType, setEditSourceType] = useState<MemorySourceType>('explicit');

  const refreshData = async () => {
    try {
      const [mem, st] = await Promise.all([
        cognitionService.getMemories(),
        cognitionService.getStats(),
      ]);
      setMemories(mem);
      setStats(st);
    } catch (err) {
      console.error('Failed to refresh cognition data:', err);
    }
  };

  useEffect(() => {
    cognitionService.migrateIfNeeded().then(() => refreshData());
  }, []);

  const handleCreateMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConcept.trim() || !newContent.trim()) return;

    const tagsArray = newTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      await cognitionService.addMemory({
        concept: newConcept.trim(),
        category: newCategory,
        content: newContent.trim(),
        confidence: newConfidence,
        importance: newImportance,
        tags: tagsArray,
      });
    } catch (err) {
      console.error('Failed to create memory:', err);
    }

    setNewConcept('');
    setNewContent('');
    setNewTags('');
    setNewConfidence(0.85);
    setIsAdding(false);
    refreshData();
  };

  const handleDeleteMemory = async (id: string) => {
    try {
      await cognitionService.deleteMemory(id);
    } catch (err) {
      console.error('Failed to delete memory:', err);
    }
    refreshData();
  };

  const handleEditMemory = (mem: MemoryItem) => {
    setEditingMemory(mem);
    setNewConcept(mem.concept);
    setNewCategory(mem.category);
    setNewContent(mem.content);
    setNewConfidence(mem.confidence);
    setNewImportance(mem.importance ?? 0.5);
    setNewTags((mem.tags || []).join(', '));
    setEditSourceType(mem.sourceType ?? 'explicit');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMemory) return;

    try {
      await cognitionService.updateMemory(editingMemory.id, {
        concept: newConcept,
        category: newCategory as MemoryCategory,
        content: newContent,
        confidence: newConfidence,
        importance: newImportance,
        tags: newTags.split(',').map((t) => t.trim()).filter(Boolean),
        sourceType: editSourceType,
        evidenceCount: editingMemory.evidenceCount ?? 1,
      });
    } catch (err) {
      console.error('Failed to update memory:', err);
    }

    setEditingMemory(null);
    refreshData();
  };

  const filteredMemories = memories.filter((m) => {
    const matchesCat = selectedCategory === 'all' || m.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      !q ||
      m.concept.toLowerCase().includes(q) ||
      m.content.toLowerCase().includes(q) ||
      m.tags.some((t) => t.toLowerCase().includes(q));
    return matchesCat && matchesQuery;
  });

  const categories: { key: MemoryCategory | 'all'; label: string }[] = [
    { key: 'all', label: 'All Knowledge' },
    { key: 'preference', label: 'Preferences' },
    { key: 'fact', label: 'Facts & Data' },
    { key: 'project', label: 'Projects' },
    { key: 'instruction', label: 'Instructions' },
    { key: 'entity', label: 'Entities' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      id="cognition-lab-view"
      className="flex-1 flex flex-col h-full bg-gray-50/50 dark:bg-[#090a0f] overflow-y-auto"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-[#0c0e15]/80 backdrop-blur-md border-b border-gray-200 dark:border-[#1a1f2c] px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            id="back-to-chat-btn"
            onClick={onBackToChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#151822] text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Chat</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h1 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">
                Cognition Lab
              </h1>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-blue-600/10 text-blue-600 dark:text-blue-400 font-bold font-mono">
                DOTVEX 2.0
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
              Persistent long-term cognitive concept & memory retention graph
            </p>
          </div>
        </div>

        <button
          id="add-memory-btn"
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Concept</span>
        </button>
      </div>

      <div className="max-w-6xl w-full mx-auto p-4 sm:p-6 md:p-8 space-y-6">
        {/* Stats Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl border border-gray-200 dark:border-[#1a1f2c] bg-white dark:bg-[#12151e] shadow-xs"
          >
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Memories</div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
              {stats.totalMemories}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="p-4 rounded-2xl border border-gray-200 dark:border-[#1a1f2c] bg-white dark:bg-[#12151e] shadow-xs"
          >
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Active Concepts</div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
              {stats.activeConcepts}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4 rounded-2xl border border-gray-200 dark:border-[#1a1f2c] bg-white dark:bg-[#12151e] shadow-xs"
          >
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Avg Confidence</div>
            <div className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
              {stats.totalMemories > 0 ? `${(stats.averageConfidence * 100).toFixed(0)}%` : '—'}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="p-4 rounded-2xl border border-gray-200 dark:border-[#1a1f2c] bg-white dark:bg-[#12151e] shadow-xs"
          >
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Cognitive Engine</div>
            <div className="text-sm font-bold text-gray-900 dark:text-gray-100 mt-1 truncate">
              DOTVEX 2.0
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-4 rounded-2xl border border-gray-200 dark:border-[#1a1f2c] bg-white dark:bg-[#12151e] shadow-xs"
          >
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Explicit Memories</div>
            <div className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
              {stats.explicitCount ?? 0}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="p-4 rounded-2xl border border-gray-200 dark:border-[#1a1f2c] bg-white dark:bg-[#12151e] shadow-xs"
          >
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Inferred Insights</div>
            <div className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
              {stats.inferredCount ?? 0}
            </div>
          </motion.div>
        </div>

        {/* Filter & Search Controls */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat.key
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white dark:bg-[#12151e] border border-gray-200 dark:border-[#1e2433] text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search concepts or tags..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 dark:border-[#1e2433] bg-white dark:bg-[#12151e] text-xs text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Add Memory Modal */}
        <AnimatePresence>
          {isAdding && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-5 rounded-3xl border border-blue-200 dark:border-blue-900/60 bg-white dark:bg-[#12151e] shadow-xl space-y-4 overflow-hidden"
            >
              <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  Register New Knowledge Concept
                </h3>
                <button
                  onClick={() => setIsAdding(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateMemory} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Concept Identifier
                    </label>
                    <input
                      type="text"
                      required
                      value={newConcept}
                      onChange={(e) => setNewConcept(e.target.value)}
                      placeholder="e.g. Preferred Coding Style, Project Architecture"
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#181c28] text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Category
                    </label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as MemoryCategory)}
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#181c28] text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="preference">Preference</option>
                      <option value="fact">Fact & Data</option>
                      <option value="project">Project Context</option>
                      <option value="instruction">Instruction</option>
                      <option value="entity">Entity</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Memory Content
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Details of the learned concept or fact..."
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#181c28] text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Tags (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={newTags}
                      onChange={(e) => setNewTags(e.target.value)}
                      placeholder="typescript, architecture, dotvex"
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#181c28] text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                        Confidence Score
                      </label>
                      <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                        {(newConfidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={newConfidence}
                      onChange={(e) => setNewConfidence(parseFloat(e.target.value))}
                      className="w-full accent-blue-600"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                        Importance
                      </label>
                      <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                        {(newImportance * 100).toFixed(0)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max="1.0"
                      step="0.05"
                      value={newImportance}
                      onChange={(e) => setNewImportance(parseFloat(e.target.value))}
                      className="w-full accent-amber-600"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs"
                  >
                    Save Concept
                  </button>
                </div>
              </form>
             </motion.div>
          )}
        </AnimatePresence>

        {/* Edit Memory Modal */}
        <AnimatePresence>
          {editingMemory && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-5 rounded-3xl border border-blue-200 dark:border-blue-900/60 bg-white dark:bg-[#12151e] shadow-xl space-y-4 overflow-hidden"
            >
              <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  Edit Memory
                </h3>
                <button
                  onClick={() => setEditingMemory(null)}
                  className="text-gray-400 hover:text-600 dark:hover:text-gray-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Concept
                    </label>
                    <input
                      type="text"
                      required
                      value={newConcept}
                      onChange={(e) => setNewConcept(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#181c28] text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Category
                    </label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as MemoryCategory)}
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#181c28] text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="preference">Preference</option>
                      <option value="fact">Fact & Data</option>
                      <option value="project">Project Context</option>
                      <option value="instruction">Instruction</option>
                      <option value="entity">Entity</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Memory Content
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#181c28] text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Tags
                    </label>
                    <input
                      type="text"
                      value={newTags}
                      onChange={(e) => setNewTags(e.target.value)}
                      placeholder="comma-separated"
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#181c28] text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Confidence</label>
                      <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                        {(newConfidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    <input
                      type="range" min="0.1" max="1.0" step="0.05"
                      value={newConfidence}
                      onChange={(e) => setNewConfidence(parseFloat(e.target.value))}
                      className="w-full accent-blue-600"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Importance</label>
                      <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                        {(newImportance * 100).toFixed(0)}%
                      </span>
                    </div>
                    <input
                      type="range" min="0.0" max="1.0" step="0.05"
                      value={newImportance}
                      onChange={(e) => setNewImportance(parseFloat(e.target.value))}
                      className="w-full accent-amber-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Source Type
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditSourceType('explicit')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        editSourceType === 'explicit'
                          ? 'bg-blue-600 text-white border border-blue-700'
                          : 'bg-gray-100 dark:bg-[#181c28] text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-[#24293a]'
                      }`}
                    >
                      Explicit
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditSourceType('inferred')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        editSourceType === 'inferred'
                          ? 'bg-purple-600 text-white border border-purple-700'
                          : 'bg-gray-100 dark:bg-[#181c28] text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-[#24293a]'
                      }`}
                    >
                      Inferred
                    </button>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingMemory(null)}
                    className="px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Memories Grid List */}
        {filteredMemories.length === 0 ? (
          <div className="p-12 text-center rounded-3xl border border-dashed border-gray-200 dark:border-[#1a1f2c] bg-white/50 dark:bg-[#12151e]/50">
            <Brain className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">
              No Concepts in Cognition Lab
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
              DOTVEX 2.0 stores persistent memories here. Click "New Concept" above or allow DOTVEX to learn preferences during conversations.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {filteredMemories.map((mem) => (
              <motion.div
                key={mem.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                id={`memory-item-${mem.id}`}
                className="group relative p-4 rounded-2xl border border-gray-200/90 dark:border-[#1a1f2c] bg-white dark:bg-[#12151e] hover:border-blue-500/40 dark:hover:border-blue-500/40 shadow-xs transition-all flex flex-col justify-between"
              >
              <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/40 dark:border-blue-800/40 mb-1">
                          {mem.category}
                        </span>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                          {mem.concept}
                        </h4>
                        {mem.lifespan && (
                          <span className={`inline-block mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium ${
                            mem.lifespan === 'permanent' ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400' :
                            mem.lifespan === 'long_term' ? 'bg-green-50 dark:bg-green-950/50 text-green-600 dark:text-green-400' :
                            mem.lifespan === 'short_term' ? 'bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-500' :
                            'bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400'
                          }`}>
                            {mem.lifespan}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100">
                        <button
                          id={`edit-memory-${mem.id}`}
                          onClick={() => handleEditMemory(mem)}
                          title="Edit memory"
                          className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 text-gray-400 hover:text-blue-500 transition-all"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          id={`delete-memory-${mem.id}`}
                          onClick={() => handleDeleteMemory(mem.id)}
                          title="Delete memory"
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-gray-400 hover:text-red-500 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                      {mem.content}
                    </p>
                  </div>

                    <div className="pt-2.5 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between text-[11px] text-gray-400">
                     {/* Tags */}
                     <div className="flex items-center gap-1 overflow-hidden">
                       {mem.tags.slice(0, 3).map((tag, idx) => (
                         <span
                           key={idx}
                           className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800/80 text-gray-600 dark:text-gray-400 text-[10px] font-medium"
                         >
                           #{tag}
                         </span>
                       ))}
                     </div>

                     {/* Confidence, Source, Evidence */}
                     <div className="flex items-center gap-3 font-mono text-[10px]">
                       <div className="flex items-center gap-1">
                         <span>Confidence</span>
                         <span className="font-bold text-blue-600 dark:text-blue-400">
                           {(mem.confidence * 100).toFixed(0)}%
                         </span>
                       </div>
                       <div className="flex items-center gap-1">
                         <span>Source</span>
                         <span className={`font-bold ${
                           mem.sourceType === 'explicit'
                             ? 'text-emerald-600 dark:text-emerald-400'
                             : 'text-purple-600 dark:text-purple-400'
                         }`}>
                           {mem.sourceType === 'explicit' ? 'explicit' : 'inferred'}
                         </span>
                       </div>
                       <div className="flex items-center gap-1">
                         <span>Evidence</span>
                         <span className="font-bold text-gray-600 dark:text-gray-400">
                           {mem.evidenceCount ?? 1}
                         </span>
                       </div>
                        <div className="flex items-center gap-1">
                          <span>Importance</span>
                          <span className="font-bold text-amber-600 dark:text-amber-400">
                            {(mem.importance !== undefined ? mem.importance * 100 : 50).toFixed(0)}%
                          </span>
                        </div>
                     </div>
                   </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};
