import React, { useState, useEffect } from 'react';
import { X, Folder, Plus, Trash2, FolderPlus, MessageSquare } from 'lucide-react';
import { conversationService } from '../../services/api/conversationService';
import { ProjectFolder } from '../../types/conversation';
import { motion } from 'motion/react';

interface ProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProject?: (proj: ProjectFolder) => void;
}

export const ProjectsModal: React.FC<ProjectsModalProps> = ({ isOpen, onClose, onSelectProject }) => {
  const [projects, setProjects] = useState<ProjectFolder[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const refresh = () => {
    setProjects(conversationService.getProjects());
  };

  useEffect(() => {
    if (isOpen) {
      refresh();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    conversationService.createProject(name.trim(), description.trim());
    setName('');
    setDescription('');
    setIsCreating(false);
    refresh();
  };

  const handleDelete = (id: string) => {
    conversationService.deleteProject(id);
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
            <div className="p-2 rounded-xl bg-[#2f2f2f] text-emerald-400">
              <Folder className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Workspace Projects</h2>
              <p className="text-xs text-[#b4b4b4]">Organize chats, instructions, and context by project</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCreating(true)}
              className="px-3 py-1.5 rounded-lg bg-[#2f2f2f] hover:bg-[#383838] text-xs font-medium text-[#ececec] flex items-center gap-1.5 border border-[#383838]"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>New Project</span>
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
                <h3 className="text-xs font-semibold text-[#ececec]">Create Project Workspace</h3>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="text-xs text-[#8e8e8e] hover:text-[#ececec]"
                >
                  Cancel
                </button>
              </div>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Project Name (e.g. DOTVEX Mobile Client)"
                className="w-full px-3 py-2 rounded-lg bg-[#212121] border border-[#333] text-xs text-[#ececec] placeholder-[#737373] focus:outline-none focus:border-emerald-500"
              />
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Project description and goals..."
                className="w-full px-3 py-2 rounded-lg bg-[#212121] border border-[#333] text-xs text-[#ececec] placeholder-[#737373] focus:outline-none focus:border-emerald-500"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium"
                >
                  Create Project
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {projects.map((proj) => (
              <div
                key={proj.id}
                className="p-4 rounded-xl bg-[#2a2a2a] border border-[#333] hover:border-[#444] transition-all flex flex-col justify-between space-y-2 group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Folder className="w-4 h-4 text-emerald-400" />
                      <h4 className="text-sm font-medium text-[#ececec]">{proj.name}</h4>
                    </div>
                    <button
                      onClick={() => handleDelete(proj.id)}
                      className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-950/40 text-[#737373] hover:text-red-400 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {proj.description && (
                    <p className="text-xs text-[#b4b4b4] mt-1 line-clamp-2">{proj.description}</p>
                  )}
                </div>

                <div className="pt-2 border-t border-[#333] flex items-center justify-between text-[11px] text-[#737373]">
                  <span>{proj.conversationIds.length} conversations</span>
                  <span className="text-emerald-400 text-xs font-medium cursor-pointer hover:underline" onClick={onClose}>
                    Open Folder →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
