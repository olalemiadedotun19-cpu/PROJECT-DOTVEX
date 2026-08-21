import React, { useState } from 'react';
import { Conversation, GroupedConversations } from '../../types/conversation';
import { Sidebar } from '../sidebar/Sidebar';
import {
  Menu,
  SquarePen,
  MoreVertical,
  Share2,
  Settings,
  Sun,
  Moon,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { ThemeMode, DotvexModelId } from '../../types/settings';
import { motion, AnimatePresence } from 'motion/react';

interface AppShellProps {
  children: React.ReactNode;
  activeView: 'chat' | 'cognition';
  setActiveView: (view: 'chat' | 'cognition') => void;
  conversations: Conversation[];
  groupedConversations: GroupedConversations[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onOpenSearch: () => void;
  onOpenSettings: () => void;
  onOpenImages: () => void;
  onOpenLibrary: () => void;
  onOpenScheduled: () => void;
  onOpenPlugins: () => void;
  onOpenProjects: () => void;
  onOpenCodex: () => void;
  onOpenShare: () => void;
  onOpenUpgrade: () => void;
  onTogglePin: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onDeleteConversation: (id: string) => void;
  currentTheme: ThemeMode;
  onToggleTheme: () => void;
  activeConversationTitle?: string;
  activeModelId?: DotvexModelId;
  onChangeModel?: (modelId: DotvexModelId) => void;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  activeView,
  setActiveView,
  conversations,
  groupedConversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onOpenSearch,
  onOpenSettings,
  onOpenImages,
  onOpenLibrary,
  onOpenScheduled,
  onOpenPlugins,
  onOpenProjects,
  onOpenCodex,
  onOpenShare,
  onOpenUpgrade,
  onTogglePin,
  onRenameConversation,
  onDeleteConversation,
  currentTheme,
  onToggleTheme,
  activeConversationTitle,
}) => {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);

  return (
    <div
      id="dotvex-app-shell"
      className="flex h-screen w-screen overflow-hidden bg-[#ffffff] dark:bg-[#212121] text-[#0d0d0d] dark:text-[#ececec] font-sans select-none"
    >
      {/* 1. Desktop Persistent Sidebar */}
      <AnimatePresence initial={false}>
        {desktopSidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 256, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="hidden md:flex h-full flex-shrink-0 overflow-hidden"
          >
            <Sidebar
              conversations={conversations}
              groupedConversations={groupedConversations}
              activeConversationId={activeConversationId}
              onSelectConversation={(id) => {
                setActiveView('chat');
                onSelectConversation(id);
              }}
              onNewChat={() => {
                setActiveView('chat');
                onNewChat();
              }}
              onOpenSearch={onOpenSearch}
              onOpenSettings={onOpenSettings}
              onOpenCognitionLab={() => setActiveView('cognition')}
              onOpenImages={onOpenImages}
              onOpenLibrary={onOpenLibrary}
              onOpenScheduled={onOpenScheduled}
              onOpenPlugins={onOpenPlugins}
              onOpenProjects={onOpenProjects}
              onOpenCodex={onOpenCodex}
              onOpenUpgrade={onOpenUpgrade}
              onTogglePin={onTogglePin}
              onRenameConversation={onRenameConversation}
              onDeleteConversation={onDeleteConversation}
              currentTheme={currentTheme}
              onToggleTheme={onToggleTheme}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Mobile Drawer & Backdrop */}
      <AnimatePresence>
        {mobileDrawerOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-xs"
              onClick={() => setMobileDrawerOpen(false)}
            />

            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 h-full w-4/5 max-w-xs shadow-2xl overflow-hidden"
            >
              <Sidebar
                isMobile={true}
                conversations={conversations}
                groupedConversations={groupedConversations}
                activeConversationId={activeConversationId}
                onSelectConversation={(id) => {
                  setActiveView('chat');
                  onSelectConversation(id);
                  setMobileDrawerOpen(false);
                }}
                onNewChat={() => {
                  setActiveView('chat');
                  onNewChat();
                  setMobileDrawerOpen(false);
                }}
                onOpenSearch={() => {
                  onOpenSearch();
                  setMobileDrawerOpen(false);
                }}
                onOpenSettings={() => {
                  onOpenSettings();
                  setMobileDrawerOpen(false);
                }}
                onOpenCognitionLab={() => {
                  setActiveView('cognition');
                  setMobileDrawerOpen(false);
                }}
                onOpenImages={() => {
                  onOpenImages();
                  setMobileDrawerOpen(false);
                }}
                onOpenLibrary={() => {
                  onOpenLibrary();
                  setMobileDrawerOpen(false);
                }}
                onOpenScheduled={() => {
                  onOpenScheduled();
                  setMobileDrawerOpen(false);
                }}
                onOpenPlugins={() => {
                  onOpenPlugins();
                  setMobileDrawerOpen(false);
                }}
                onOpenProjects={() => {
                  onOpenProjects();
                  setMobileDrawerOpen(false);
                }}
                onOpenCodex={() => {
                  onOpenCodex();
                  setMobileDrawerOpen(false);
                }}
                onOpenUpgrade={() => {
                  onOpenUpgrade();
                  setMobileDrawerOpen(false);
                }}
                onTogglePin={onTogglePin}
                onRenameConversation={onRenameConversation}
                onDeleteConversation={onDeleteConversation}
                currentTheme={currentTheme}
                onToggleTheme={onToggleTheme}
                onCloseMobileDrawer={() => setMobileDrawerOpen(false)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Main Center Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#ffffff] dark:bg-[#212121]">
        {/* Top Header - Exact match to image reference */}
        <header
          id="dotvex-top-navbar"
          className="h-14 px-3 sm:px-4 flex items-center justify-between bg-[#ffffff] dark:bg-[#212121] border-b border-[#f0f0f0] dark:border-transparent z-20 flex-shrink-0"
        >
          {/* Left: Sidebar Toggle (Rounded circular/pill button with menu bars) */}
          <div className="flex items-center gap-2 min-w-0">
            <button
              id="sidebar-toggle-btn"
              onClick={() => {
                if (window.innerWidth < 768) {
                  setMobileDrawerOpen(true);
                } else {
                  setDesktopSidebarOpen(!desktopSidebarOpen);
                }
              }}
              title="Toggle sidebar"
              className="w-10 h-10 rounded-full bg-[#f4f4f4] hover:bg-[#eaeaea] dark:bg-[#2f2f2f] dark:hover:bg-[#383838] border border-[#e5e5e5] dark:border-[#383838] flex items-center justify-center text-[#222] dark:text-[#ececec] transition-colors cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          {/* Center: Conversation Title (Subtle & clean) */}
          <div className="flex-1 text-center truncate px-3">
            <span className="text-xs font-medium text-[#737373] dark:text-[#8e8e8e] truncate max-w-xs inline-block">
              {activeConversationTitle || ''}
            </span>
          </div>

          {/* Right: Pill container with New Chat (SquarePen) and More (⋮) as in image */}
          <div className="relative flex items-center">
            <div className="flex items-center rounded-full bg-[#f4f4f4] dark:bg-[#2f2f2f] border border-[#e5e5e5] dark:border-[#383838] p-0.5">
              {/* New Chat Edit Icon */}
              <button
                id="header-new-chat-btn"
                onClick={() => {
                  setActiveView('chat');
                  onNewChat();
                }}
                title="New chat"
                className="p-2 rounded-full text-[#333] dark:text-[#ececec] hover:bg-[#e8e8e8] dark:hover:bg-[#3a3a3a] transition-colors"
              >
                <SquarePen className="w-4 h-4" />
              </button>

              {/* Three Dots More Menu */}
              <button
                id="header-more-menu-btn"
                onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                title="More options"
                className="p-2 rounded-full text-[#333] dark:text-[#ececec] hover:bg-[#e8e8e8] dark:hover:bg-[#3a3a3a] transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>

            {/* Options Popup Menu */}
            {showOptionsMenu && (
              <div className="absolute top-12 right-0 w-52 p-1.5 rounded-2xl bg-white dark:bg-[#282828] border border-[#e5e5e5] dark:border-[#383838] shadow-2xl space-y-1 z-50 animate-fadeIn">
                <button
                  onClick={() => {
                    onOpenShare();
                    setShowOptionsMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#222] dark:text-[#ececec] hover:bg-[#f4f4f4] dark:hover:bg-[#333] transition-colors cursor-pointer"
                >
                  <Share2 className="w-4 h-4 text-[#737373] dark:text-[#8e8e8e]" />
                  <span>Share conversation</span>
                </button>

                <button
                  onClick={() => {
                    onOpenUpgrade();
                    setShowOptionsMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#222] dark:text-[#ececec] hover:bg-[#f4f4f4] dark:hover:bg-[#333] transition-colors cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                  <span>Upgrade plan</span>
                </button>

                <button
                  onClick={() => {
                    onToggleTheme();
                    setShowOptionsMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#222] dark:text-[#ececec] hover:bg-[#f4f4f4] dark:hover:bg-[#333] transition-colors cursor-pointer"
                >
                  {currentTheme === 'dark' ? (
                    <>
                      <Sun className="w-4 h-4 text-amber-500" />
                      <span>Light mode</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-4 h-4 text-blue-500" />
                      <span>Dark mode</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    onOpenSettings();
                    setShowOptionsMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#222] dark:text-[#ececec] hover:bg-[#f4f4f4] dark:hover:bg-[#333] transition-colors cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-[#737373] dark:text-[#8e8e8e]" />
                  <span>Settings</span>
                </button>

                {activeConversationId && (
                  <>
                    <div className="border-t border-[#e5e5e5] dark:border-[#383838] my-1" />
                    <button
                      onClick={() => {
                        onDeleteConversation(activeConversationId);
                        setShowOptionsMenu(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete chat</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Workspace Body */}
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          {children}
        </main>
      </div>
    </div>
  );
};
