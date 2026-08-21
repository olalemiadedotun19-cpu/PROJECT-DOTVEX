import React, { useState, useEffect } from 'react';
import { X, Clock, Plus, Trash2, Play, CheckCircle2, AlertCircle } from 'lucide-react';
import { conversationService } from '../../services/api/conversationService';
import { ScheduledTask } from '../../types/conversation';
import { motion } from 'motion/react';

interface ScheduledModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerPrompt?: (prompt: string) => void;
}

export const ScheduledModal: React.FC<ScheduledModalProps> = ({ isOpen, onClose, onTriggerPrompt }) => {
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [delayMinutes, setDelayMinutes] = useState(5);
  const [isRecurring, setIsRecurring] = useState(false);

  const refresh = () => {
    setTasks(conversationService.getScheduledTasks());
  };

  useEffect(() => {
    if (isOpen) {
      refresh();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !prompt.trim()) return;

    conversationService.addScheduledTask({
      title: title.trim(),
      prompt: prompt.trim(),
      runAt: Date.now() + delayMinutes * 60 * 1000,
      isRecurring,
      status: 'pending',
    });

    setTitle('');
    setPrompt('');
    setIsCreating(false);
    refresh();
  };

  const handleDelete = (id: string) => {
    conversationService.deleteScheduledTask(id);
    refresh();
  };

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
            <div className="p-2 rounded-xl bg-[#2f2f2f] text-blue-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Scheduled Prompts & Automation</h2>
              <p className="text-xs text-[#b4b4b4]">Automate periodic prompts, recurring research, and reminders</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCreating(true)}
              className="px-3 py-1.5 rounded-lg bg-[#2f2f2f] hover:bg-[#383838] text-xs font-medium text-[#ececec] flex items-center gap-1.5 border border-[#383838]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Schedule Prompt</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#8e8e8e] hover:text-[#ececec] hover:bg-[#2f2f2f] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {isCreating && (
            <form onSubmit={handleCreate} className="p-4 rounded-xl bg-[#2a2a2a] border border-[#383838] space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-[#ececec]">New Scheduled Task</h3>
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
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Task Name (e.g. Daily Standup Prep)"
                  className="w-full px-3 py-2 rounded-lg bg-[#212121] border border-[#333] text-xs text-[#ececec] placeholder-[#737373] focus:outline-none focus:border-blue-500"
                />
                <select
                  value={delayMinutes}
                  onChange={(e) => setDelayMinutes(parseInt(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-[#212121] border border-[#333] text-xs text-[#ececec] focus:outline-none focus:border-blue-500"
                >
                  <option value={5}>In 5 minutes</option>
                  <option value={30}>In 30 minutes</option>
                  <option value={60}>In 1 hour</option>
                  <option value={1440}>In 24 hours (Tomorrow)</option>
                  <option value={10080}>In 7 days (Next week)</option>
                </select>
              </div>

              <textarea
                required
                rows={2}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="The exact prompt to execute automatically..."
                className="w-full px-3 py-2 rounded-lg bg-[#212121] border border-[#333] text-xs text-[#ececec] placeholder-[#737373] focus:outline-none focus:border-blue-500"
              />

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-xs text-[#b4b4b4] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="accent-blue-500"
                  />
                  <span>Repeat automatically</span>
                </label>

                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium"
                >
                  Save Schedule
                </button>
              </div>
            </form>
          )}

          {tasks.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#737373]">
              No scheduled automations. Click "Schedule Prompt" to create one.
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => {
                const isReady = Date.now() >= task.runAt;
                return (
                  <div
                    key={task.id}
                    className="p-4 rounded-xl bg-[#2a2a2a] border border-[#333] hover:border-[#444] transition-all flex items-start justify-between gap-4"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="p-1 rounded bg-[#333] text-blue-400">
                          <Clock className="w-3.5 h-3.5" />
                        </span>
                        <h4 className="text-sm font-medium text-[#ececec]">{task.title}</h4>
                        {task.isRecurring && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800">
                            Recurring
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#b4b4b4] font-mono bg-[#181818] p-2 rounded-lg mt-1 border border-[#282828]">
                        "{task.prompt}"
                      </p>
                      <div className="text-[11px] text-[#737373] flex items-center gap-2 mt-1">
                        <span>Target: {new Date(task.runAt).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {onTriggerPrompt && (
                        <button
                          onClick={() => {
                            onTriggerPrompt(task.prompt);
                            onClose();
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-[#333] hover:bg-[#3d3d3d] text-xs font-medium text-[#ececec] flex items-center gap-1"
                        >
                          <Play className="w-3 h-3 text-emerald-400" />
                          <span>Run Now</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(task.id)}
                        className="p-1.5 rounded-lg hover:bg-red-950/40 text-[#737373] hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
