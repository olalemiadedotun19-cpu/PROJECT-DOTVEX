import React, { useState } from 'react';
import { Conversation, GroupedConversations } from '../../types/conversation';
import { DotvexLogo } from '../brand/DotvexLogo';
import {
  PenSquare,
  Search,
  Settings,
  Brain,
  Trash2,
  Edit2,
  Pin,
  PinOff,
  Image as ImageIcon,
  BookMarked,
  Clock,
  AtSign,
  Folder,
  Terminal,
  MoreHorizontal,
  Moon,
  Sun,
  X,
  Sparkles,
  ChevronDown,
  LogOut,
  Sliders,
} from 'lucide-react';
import { ThemeMode } from '../../types/settings';

interface SidebarProps {
  conversations: Conversation[];
  groupedConversations: GroupedConversations[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onOpenSearch: () => void;
  onOpenSettings: () => void;
  onOpenCognitionLab: () => void;
  onOpenImages: () => void;
  onOpenLibrary: () => void;
  onOpenScheduled: () => void;
  onOpenPlugins: () => void;
  onOpenProjects: () => void;
  onOpenCodex: () => void;
  onOpenUpgrade: () => void;
  onTogglePin: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onDeleteConversation: (id: string) => void;
  currentTheme: ThemeMode;
  onToggleTheme: () => void;
  isMobile?: boolean;
  onCloseMobileDrawer?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  groupedConversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onOpenSearch,
  onOpenSettings,
  onOpenCognitionLab,
  onOpenImages,
  onOpenLibrary,
  onOpenScheduled,
  onOpenPlugins,
  onOpenProjects,
  onOpenCodex,
  onOpenUpgrade,
  onTogglePin,
  onRenameConversation,
  onDeleteConversation,
  currentTheme,
  onToggleTheme,
  isMobile = false,
  onCloseMobileDrawer,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const pinnedConversations = conversations.filter((c) => c.isPinned);

  const startRename = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const handleSaveRename = (id: string) => {
    if (editTitle.trim()) {
      onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <aside
      id="dotvex-sidebar"
      className={`w-64 h-full flex flex-col bg-[#f9f9f9] dark:bg-[#171717] text-[#0d0d0d] dark:text-[#ececec] border-r border-[#e5e5e5] dark:border-[#262626] select-none flex-shrink-0 transition-colors ${
        isMobile ? 'w-full' : ''
      }`}
    >
      {/* 1. Header: Logo, Search, Collapse / Close */}
      <div className="h-14 px-3.5 flex items-center justify-between border-b border-[#e5e5e5] dark:border-[#222] flex-shrink-0">
        <div className="flex items-center gap-2 cursor-pointer" onClick={onNewChat}>
          <DotvexLogo size="sm" showBadge={false} />
          <span className="font-bold text-sm text-[#0d0d0d] dark:text-[#ececec] tracking-tight">
            DOTVEX 2.0
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            id="sidebar-search-btn"
            onClick={onOpenSearch}
            title="Search (⌘K)"
            className="p-1.5 rounded-lg text-[#737373] dark:text-[#8e8e8e] hover:text-[#0d0d0d] dark:hover:text-[#ececec] hover:bg-[#eaeaea] dark:hover:bg-[#212121] transition-colors cursor-pointer"
          >
            <Search className="w-4 h-4" />
          </button>

          {isMobile && onCloseMobileDrawer && (
            <button
              onClick={onCloseMobileDrawer}
              className="p-1.5 rounded-lg text-[#737373] dark:text-[#8e8e8e] hover:text-[#0d0d0d] dark:hover:text-[#ececec] hover:bg-[#eaeaea] dark:hover:bg-[#212121] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Top Nav Items (ChatGPT Layout) */}
      <div className="px-2.5 py-2 space-y-0.5 border-b border-[#e5e5e5] dark:border-[#222] flex-shrink-0 text-xs font-medium text-[#555] dark:text-[#b4b4b4]">
        {/* New chat */}
        <button
          id="sidebar-new-chat-btn"
          onClick={onNewChat}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg bg-[#eaeaea] hover:bg-[#dfdfdf] dark:bg-[#212121] dark:hover:bg-[#282828] text-[#0d0d0d] dark:text-[#ececec] font-semibold transition-colors cursor-pointer"
        >
          <PenSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>New chat</span>
        </button>

        {/* Images */}
        <button
          onClick={onOpenImages}
          className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-[#eaeaea] dark:hover:bg-[#212121] text-[#444] dark:text-[#b4b4b4] hover:text-[#0d0d0d] dark:hover:text-[#ececec] transition-colors cursor-pointer"
        >
          <ImageIcon className="w-4 h-4 text-[#737373] dark:text-[#8e8e8e]" />
          <span>Images</span>
        </button>

        {/* Library */}
        <button
          onClick={onOpenLibrary}
          className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-[#eaeaea] dark:hover:bg-[#212121] text-[#444] dark:text-[#b4b4b4] hover:text-[#0d0d0d] dark:hover:text-[#ececec] transition-colors cursor-pointer"
        >
          <BookMarked className="w-4 h-4 text-[#737373] dark:text-[#8e8e8e]" />
          <span>Library</span>
        </button>

        {/* Scheduled */}
        <button
          onClick={onOpenScheduled}
          className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-[#eaeaea] dark:hover:bg-[#212121] text-[#444] dark:text-[#b4b4b4] hover:text-[#0d0d0d] dark:hover:text-[#ececec] transition-colors cursor-pointer"
        >
          <Clock className="w-4 h-4 text-[#737373] dark:text-[#8e8e8e]" />
          <span>Scheduled</span>
        </button>

        {/* @ Plugins */}
        <button
          onClick={onOpenPlugins}
          className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-[#eaeaea] dark:hover:bg-[#212121] text-[#444] dark:text-[#b4b4b4] hover:text-[#0d0d0d] dark:hover:text-[#ececec] transition-colors cursor-pointer"
        >
          <AtSign className="w-4 h-4 text-[#737373] dark:text-[#8e8e8e]" />
          <span>Plugins & Tools</span>
        </button>

        {/* Projects */}
        <button
          onClick={onOpenProjects}
          className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-[#eaeaea] dark:hover:bg-[#212121] text-[#444] dark:text-[#b4b4b4] hover:text-[#0d0d0d] dark:hover:text-[#ececec] transition-colors cursor-pointer"
        >
          <Folder className="w-4 h-4 text-[#737373] dark:text-[#8e8e8e]" />
          <span>Projects</span>
        </button>

        {/* Codex */}
        <button
          onClick={onOpenCodex}
          className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-[#eaeaea] dark:hover:bg-[#212121] text-[#444] dark:text-[#b4b4b4] hover:text-[#0d0d0d] dark:hover:text-[#ececec] transition-colors cursor-pointer"
        >
          <Terminal className="w-4 h-4 text-[#737373] dark:text-[#8e8e8e]" />
          <span>Codex Sandbox</span>
        </button>

        {/* More Options Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-[#eaeaea] dark:hover:bg-[#212121] text-[#444] dark:text-[#b4b4b4] hover:text-[#0d0d0d] dark:hover:text-[#ececec] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <MoreHorizontal className="w-4 h-4 text-[#737373] dark:text-[#8e8e8e]" />
              <span>More</span>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${showMoreMenu ? 'rotate-180' : ''}`}
            />
          </button>

          {showMoreMenu && (
            <div className="p-1.5 my-1 rounded-xl bg-white dark:bg-[#212121] border border-[#e5e5e5] dark:border-[#333] shadow-lg space-y-1">
              <button
                onClick={() => {
                  onOpenCognitionLab();
                  setShowMoreMenu(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs hover:bg-[#f4f4f4] dark:hover:bg-[#2a2a2a] text-[#0d0d0d] dark:text-[#ececec] cursor-pointer"
              >
                <Brain className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                <span>Cognition Lab</span>
              </button>
              <button
                onClick={() => {
                  onOpenSettings();
                  setShowMoreMenu(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs hover:bg-[#f4f4f4] dark:hover:bg-[#2a2a2a] text-[#0d0d0d] dark:text-[#ececec] cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                <span>Settings</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. Conversation List (Pinned + Recents) */}
      <div className="flex-1 overflow-y-auto px-2.5 py-2 space-y-4 no-scrollbar">
        {/* Pinned Section */}
        {pinnedConversations.length > 0 && (
          <div className="space-y-1">
            <div className="px-2 text-[11px] font-semibold text-[#737373] dark:text-[#8e8e8e] tracking-wider">
              Pinned
            </div>
            {pinnedConversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={`group relative flex items-center justify-between px-2.5 py-2 rounded-lg text-xs cursor-pointer transition-colors ${
                  activeConversationId === conv.id
                    ? 'bg-[#eaeaea] dark:bg-[#212121] text-[#0d0d0d] dark:text-[#ececec] font-medium'
                    : 'text-[#555] dark:text-[#b4b4b4] hover:bg-[#eaeaea] dark:hover:bg-[#212121] hover:text-[#0d0d0d] dark:hover:text-[#ececec]'
                }`}
              >
                {editingId === conv.id ? (
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={() => handleSaveRename(conv.id)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(conv.id)}
                    autoFocus
                    className="w-full bg-[#f4f4f4] dark:bg-[#181818] px-1.5 py-0.5 rounded text-xs text-[#0d0d0d] dark:text-[#ececec] outline-none"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Pin className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 flex-shrink-0" />
                    <span className="truncate">{conv.title}</span>
                  </div>
                )}

                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePin(conv.id);
                    }}
                    title="Unpin"
                    className="p-1 hover:text-[#0d0d0d] dark:hover:text-[#ececec]"
                  >
                    <PinOff className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteConversation(conv.id);
                    }}
                    title="Delete"
                    className="p-1 hover:text-red-500"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recents Section */}
        <div className="space-y-3">
          {groupedConversations.map((group) => (
            <div key={group.group} className="space-y-0.5">
              <div className="px-2 text-[11px] font-semibold text-[#737373] dark:text-[#8e8e8e] tracking-wider">
                {group.group === 'Today' ? 'Recents' : group.group}
              </div>
              {group.conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => onSelectConversation(conv.id)}
                  className={`group relative flex items-center justify-between px-2.5 py-2 rounded-lg text-xs cursor-pointer transition-colors ${
                    activeConversationId === conv.id
                      ? 'bg-[#eaeaea] dark:bg-[#212121] text-[#0d0d0d] dark:text-[#ececec] font-medium'
                      : 'text-[#555] dark:text-[#b4b4b4] hover:bg-[#eaeaea] dark:hover:bg-[#212121] hover:text-[#0d0d0d] dark:hover:text-[#ececec]'
                  }`}
                >
                  {editingId === conv.id ? (
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onBlur={() => handleSaveRename(conv.id)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(conv.id)}
                      autoFocus
                      className="w-full bg-[#f4f4f4] dark:bg-[#181818] px-1.5 py-0.5 rounded text-xs text-[#0d0d0d] dark:text-[#ececec] outline-none"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="truncate flex-1 pr-2">{conv.title}</span>
                  )}

                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onTogglePin(conv.id);
                      }}
                      title="Pin chat"
                      className="p-1 hover:text-amber-500"
                    >
                      <Pin className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => startRename(conv, e)}
                      title="Rename"
                      className="p-1 hover:text-[#0d0d0d] dark:hover:text-[#ececec]"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteConversation(conv.id);
                      }}
                      title="Delete"
                      className="p-1 hover:text-red-500"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* 4. Bottom User Profile (ChatGPT format) */}
      <div className="p-2.5 border-t border-[#e5e5e5] dark:border-[#222] relative flex-shrink-0">
        <div
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="flex items-center justify-between p-2 rounded-xl hover:bg-[#eaeaea] dark:hover:bg-[#212121] cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-700 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-xs">
              OA
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-[#0d0d0d] dark:text-[#ececec] truncate">
                Olalemi Adedotun
              </div>
              <div className="text-[10px] text-[#737373] dark:text-[#8e8e8e] truncate">
                Dotman
              </div>
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenUpgrade();
            }}
            className="px-2 py-0.5 rounded-full bg-[#e5e5e5] hover:bg-[#dcdcdc] dark:bg-[#2a2a2a] dark:hover:bg-[#333] text-[11px] font-semibold text-[#0d0d0d] dark:text-[#ececec] border border-[#d5d5d5] dark:border-[#383838] transition-colors cursor-pointer"
          >
            Upgrade
          </button>
        </div>

        {/* User Popup Menu */}
        {showUserMenu && (
          <div className="absolute bottom-16 left-2.5 right-2.5 p-1.5 rounded-2xl bg-white dark:bg-[#212121] border border-[#e5e5e5] dark:border-[#333] shadow-2xl space-y-1 z-30 animate-fadeIn text-[#0d0d0d] dark:text-[#ececec]">
            <button
              onClick={() => {
                onOpenSettings();
                setShowUserMenu(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-[#0d0d0d] dark:text-[#ececec] hover:bg-[#f4f4f4] dark:hover:bg-[#2a2a2a] transition-colors cursor-pointer"
            >
              <Settings className="w-4 h-4 text-[#737373] dark:text-[#8e8e8e]" />
              <span>Settings & Preferences</span>
            </button>
            <button
              onClick={() => {
                onToggleTheme();
                setShowUserMenu(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-[#0d0d0d] dark:text-[#ececec] hover:bg-[#f4f4f4] dark:hover:bg-[#2a2a2a] transition-colors cursor-pointer"
            >
              {currentTheme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span>Switch to Light Theme</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-blue-500" />
                  <span>Switch to Dark Theme</span>
                </>
              )}
            </button>
            <button
              onClick={() => {
                onOpenCognitionLab();
                setShowUserMenu(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-[#0d0d0d] dark:text-[#ececec] hover:bg-[#f4f4f4] dark:hover:bg-[#2a2a2a] transition-colors cursor-pointer"
            >
              <Brain className="w-4 h-4 text-blue-500 dark:text-blue-400" />
              <span>Cognition Lab Graph</span>
            </button>
            <div className="pt-1 border-t border-[#e5e5e5] dark:border-[#333]" />
            <button
              onClick={() => {
                if (confirm('Clear local chat storage?')) {
                  localStorage.clear();
                  window.location.reload();
                }
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-rose-600 dark:text-red-400 hover:bg-rose-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Clear Local Data</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
