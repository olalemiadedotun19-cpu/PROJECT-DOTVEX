import React, { useState, useEffect, useCallback } from 'react';
import { Conversation, GroupedConversations } from './types/conversation';
import { ChatMessage, MessageStatus, Attachment } from './types/chat';
import { ThemeMode, DotvexModelId } from './types/settings';
import { conversationService } from './services/api/conversationService';
import { chatService } from './services/api/chatService';
import { settingsService } from './services/api/settingsService';
import { AppShell } from './components/layout/AppShell';
import { MessageList } from './components/chat/MessageList';
import { MessageComposer } from './components/composer/MessageComposer';
import { CognitionLabView } from './components/cognition/CognitionLabView';
import { SearchModal } from './components/modals/SearchModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { ImagesModal } from './components/modals/ImagesModal';
import { LibraryModal } from './components/modals/LibraryModal';
import { ScheduledModal } from './components/modals/ScheduledModal';
import { PluginsModal } from './components/modals/PluginsModal';
import { ProjectsModal } from './components/modals/ProjectsModal';
import { CodexModal } from './components/modals/CodexModal';
import { ShareModal } from './components/modals/ShareModal';
import { UpgradeModal } from './components/modals/UpgradeModal';
import { VoiceModeModal } from './components/modals/VoiceModeModal';

export default function App() {
  const [activeView, setActiveView] = useState<'chat' | 'cognition'>('chat');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [groupedConversations, setGroupedConversations] = useState<GroupedConversations[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [composerSeed, setComposerSeed] = useState<string>('');
  const [codexCodeSeed, setCodexCodeSeed] = useState<string>('');

  // Modals
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isImagesOpen, setIsImagesOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isScheduledOpen, setIsScheduledOpen] = useState(false);
  const [isPluginsOpen, setIsPluginsOpen] = useState(false);
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [isCodexOpen, setIsCodexOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [isVoiceModeOpen, setIsVoiceModeOpen] = useState(false);

  // Settings & Theme & Model
  const [theme, setTheme] = useState<ThemeMode>(() => settingsService.getSettings().theme);
  const [activeModelId, setActiveModelId] = useState<DotvexModelId>(
    () => settingsService.getSettings().ai.activeModel
  );

  // Load initial settings and apply theme
  useEffect(() => {
    const s = settingsService.getSettings();
    setTheme(s.theme);
    setActiveModelId(s.ai.activeModel);
    settingsService.applyTheme(s.theme);
  }, []);

  // Refresh conversations from storage
  const refreshConversations = useCallback(async () => {
    try {
      const list = await conversationService.getConversations();
      setConversations(list);
      setGroupedConversations(conversationService.groupConversations(list));
    } catch (err) {
      console.error('Failed to refresh conversations:', err);
    }
  }, []);

  // Initialize or load conversation
  useEffect(() => {
    const loadConversations = async () => {
      try {
        let list = await conversationService.getConversations();
        const legacyMockIds = ['conv_user_desc', 'conv_no_apis', 'conv_api_key', 'conv_free_llms', 'conv_jarvis', 'conv_futuristic', 'conv_chatterbox', 'conv_augustine'];
        const filtered = list.filter((c) => !legacyMockIds.includes(c.id));
        if (filtered.length !== list.length) {
          list = filtered;
          conversationService.saveConversations(list);
        }

        setConversations(list);
        setGroupedConversations(conversationService.groupConversations(list));

        if (list.length > 0) {
          const firstId = list[0].id;
          setActiveConversationId(firstId);
          const msgs = await conversationService.getMessages(firstId);
          setMessages(msgs);
        } else {
          setActiveConversationId(null);
          setMessages([]);
        }
      } catch (err) {
        console.error('Failed to load conversations:', err);
        setActiveConversationId(null);
        setMessages([]);
      }
    };

    loadConversations();
  }, []);

  // Handle selecting a conversation
  const handleSelectConversation = async (id: string) => {
    setActiveConversationId(id);
    try {
      const msgs = await conversationService.getMessages(id);
      setMessages(msgs);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
    setActiveView('chat');
  };

  // Handle creating a new chat
  const handleNewChat = async () => {
    try {
      const newConv = await conversationService.createConversation('New chat');
      refreshConversations();
      setActiveConversationId(newConv.id);
      setMessages([]);
      setActiveView('chat');
    } catch (err) {
      console.error('Failed to create new chat:', err);
    }
  };

  // Handle pin toggle
  const handleTogglePin = async (id: string) => {
    try {
      await conversationService.togglePin(id);
      refreshConversations();
    } catch (err) {
      console.error('Failed to toggle pin:', err);
    }
  };

  // Handle conversation renaming
  const handleRenameConversation = async (id: string, newTitle: string) => {
    try {
      await conversationService.updateTitle(id, newTitle);
      refreshConversations();
    } catch (err) {
      console.error('Failed to rename conversation:', err);
    }
  };

  // Handle conversation deletion
  const handleDeleteConversation = async (id: string) => {
    try {
      await conversationService.deleteConversation(id);
      const updated = await conversationService.getConversations();
      setConversations(updated);
      setGroupedConversations(conversationService.groupConversations(updated));

      if (activeConversationId === id) {
        if (updated.length > 0) {
          handleSelectConversation(updated[0].id);
        } else {
          handleNewChat();
        }
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  // Handle model change
  const handleChangeModel = (modelId: DotvexModelId) => {
    setActiveModelId(modelId);
    const s = settingsService.getSettings();
    s.ai.activeModel = modelId;
    settingsService.saveSettings(s);
  };

  // Handle sending a user message
  const handleSendMessage = async (
    text: string,
    attachments?: Attachment[],
    enableThinking = true,
    enableWebSearch = false
  ) => {
    let currentConvId = activeConversationId;
    if (!currentConvId) {
      const newConv = await conversationService.createConversation();
      currentConvId = newConv.id;
      setActiveConversationId(newConv.id);
      refreshConversations();
    }

    const userMessage: ChatMessage = {
      id: 'usr_' + Date.now(),
      conversationId: currentConvId,
      role: 'user',
      content: text,
      attachments,
      timestamp: Date.now(),
      status: 'completed',
    };

       const currentList = [...messages, userMessage];
    setMessages(currentList);
    conversationService.saveMessages(currentConvId, currentList).catch(() => {});
    refreshConversations();

    // Prepare assistant response placeholder
    const assistantPlaceholderId = 'ast_' + Date.now();
    const assistantPlaceholder: ChatMessage = {
      id: assistantPlaceholderId,
      conversationId: currentConvId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      status: 'thinking',
      modelName:
        activeModelId === 'dotvex-2.0-flash'
          ? 'DOTVEX 2.0 Flash'
          : activeModelId === 'dotvex-2.0-ultra'
          ? 'DOTVEX 2.0 Ultra'
          : 'DOTVEX 2.0 Pro',
    };

    const withAssistant = [...currentList, assistantPlaceholder];
    setMessages(withAssistant);
    setIsGenerating(true);

    const userSettings = settingsService.getSettings();

    try {
      await chatService.sendMessage({
        conversationId: currentConvId,
        userMessage: text,
        historyMessages: currentList,
        attachments,
        modelId: activeModelId,
        modelName: assistantPlaceholder.modelName,
        enableThinking,
        enableWebSearch,
        systemPrompt: userSettings.ai.systemPrompt,
        customInstructions: userSettings.customInstructions,
        temperature: userSettings.ai.temperature,
        topP: userSettings.ai.topP,
        maxTokens: userSettings.ai.maxTokens,
        onStatusChange: (status: MessageStatus) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantPlaceholderId ? { ...m, status } : m))
          );
        },
        onChunk: (chunk) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantPlaceholderId
                ? {
                    ...m,
                    content: chunk.text,
                    reasoningTrace: chunk.reasoning,
                    status: chunk.status,
                  }
                : m
            )
          );
        },
      });

      // Update final state in storage
      setMessages((latest) => {
        if (currentConvId) {
          conversationService.saveMessages(currentConvId, latest).catch(() => {});
        }
        return latest;
      });
      refreshConversations();
    } catch (err: any) {
      console.error('Chat error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle stopping ongoing generation
  const handleStopGeneration = () => {
    if (activeConversationId) {
      chatService.stopGeneration(activeConversationId);
      setIsGenerating(false);
    }
  };

  // Handle prompt suggestions from empty state
  const handleSelectPrompt = (prompt: string) => {
    handleSendMessage(prompt);
  };

  // Handle edit message
  const handleEditUserMessage = (content: string) => {
    setComposerSeed(content);
  };

  // Handle opening codex with specific code snippet
  const handleOpenCodexWithCode = (code: string) => {
    setCodexCodeSeed(code);
    setIsCodexOpen(true);
  };

  // Handle regenerating the latest assistant response
  const handleRegenerate = (assistantMessageId: string) => {
    if (isGenerating) return;
    const msgIndex = messages.findIndex((m) => m.id === assistantMessageId);
    if (msgIndex === -1) return;

    const precedingUserMessage = messages
      .slice(0, msgIndex)
      .reverse()
      .find((m) => m.role === 'user');

    if (precedingUserMessage) {
       const trimmed = messages.slice(0, msgIndex);
      setMessages(trimmed);
      if (activeConversationId) {
        conversationService.saveMessages(activeConversationId, trimmed).catch(() => {});
      }
      handleSendMessage(precedingUserMessage.content, precedingUserMessage.attachments);
    }
  };

  // Theme toggle
  const handleToggleTheme = () => {
    const newTheme: ThemeMode = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    const s = settingsService.getSettings();
    s.theme = newTheme;
    settingsService.saveSettings(s);
    settingsService.applyTheme(newTheme);
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        handleNewChat();
      }
    };

    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, []);

  const currentConv = conversations.find((c) => c.id === activeConversationId);

  return (
    <AppShell
      activeView={activeView}
      setActiveView={setActiveView}
      conversations={conversations}
      groupedConversations={groupedConversations}
      activeConversationId={activeConversationId}
      onSelectConversation={handleSelectConversation}
      onNewChat={handleNewChat}
      onOpenSearch={() => setIsSearchOpen(true)}
      onOpenSettings={() => setIsSettingsOpen(true)}
      onOpenImages={() => setIsImagesOpen(true)}
      onOpenLibrary={() => setIsLibraryOpen(true)}
      onOpenScheduled={() => setIsScheduledOpen(true)}
      onOpenPlugins={() => setIsPluginsOpen(true)}
      onOpenProjects={() => setIsProjectsOpen(true)}
      onOpenCodex={() => setIsCodexOpen(true)}
      onOpenShare={() => setIsShareOpen(true)}
      onOpenUpgrade={() => setIsUpgradeOpen(true)}
      onTogglePin={handleTogglePin}
      onRenameConversation={handleRenameConversation}
      onDeleteConversation={handleDeleteConversation}
      currentTheme={theme}
      onToggleTheme={handleToggleTheme}
      activeConversationTitle={currentConv?.title}
      activeModelId={activeModelId}
      onChangeModel={handleChangeModel}
    >
      {activeView === 'chat' ? (
        <div id="dotvex-chat-view" className="flex-1 flex flex-col h-full overflow-hidden bg-[#212121]">
          {/* Messages scroll viewport */}
          <MessageList
            messages={messages}
            onSelectPrompt={handleSelectPrompt}
            onRegenerate={handleRegenerate}
            onEditUserMessage={handleEditUserMessage}
            onOpenCodexWithCode={handleOpenCodexWithCode}
          />

          {/* Bottom Message Composer */}
          <MessageComposer
            onSendMessage={handleSendMessage}
            onStopGeneration={handleStopGeneration}
            isGenerating={isGenerating}
            initialValue={composerSeed}
            activeModelId={activeModelId}
            onChangeModel={handleChangeModel}
            onOpenVoiceMode={() => setIsVoiceModeOpen(true)}
            onOpenCodex={() => setIsCodexOpen(true)}
            onOpenImages={() => setIsImagesOpen(true)}
            onOpenLibrary={() => setIsLibraryOpen(true)}
            onOpenScheduled={() => setIsScheduledOpen(true)}
            onOpenPlugins={() => setIsPluginsOpen(true)}
          />
        </div>
      ) : (
        <CognitionLabView onBackToChat={() => setActiveView('chat')} />
      )}

      {/* Modals */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectConversation={handleSelectConversation}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onThemeChanged={(newTheme) => setTheme(newTheme)}
        onOpenCognitionLab={() => setActiveView('cognition')}
        onOpenPlugins={() => setIsPluginsOpen(true)}
        onOpenUpgrade={() => setIsUpgradeOpen(true)}
      />

      <ImagesModal
        isOpen={isImagesOpen}
        onClose={() => setIsImagesOpen(false)}
        onInsertToChat={(url, prompt) => handleSendMessage(`[Generated Image: ${prompt}]`)}
      />

      <LibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onInsertToChat={(content) => setComposerSeed(content)}
      />

      <ScheduledModal
        isOpen={isScheduledOpen}
        onClose={() => setIsScheduledOpen(false)}
        onTriggerPrompt={(prompt) => handleSendMessage(prompt)}
      />

      <PluginsModal
        isOpen={isPluginsOpen}
        onClose={() => setIsPluginsOpen(false)}
        onInsertToChat={(content) => setComposerSeed(content)}
      />

      <ProjectsModal
        isOpen={isProjectsOpen}
        onClose={() => setIsProjectsOpen(false)}
      />

      <CodexModal
        isOpen={isCodexOpen}
        onClose={() => {
          setIsCodexOpen(false);
          setCodexCodeSeed('');
        }}
        initialCode={codexCodeSeed}
      />

      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        conversationTitle={currentConv?.title}
        messages={messages}
      />

      <UpgradeModal
        isOpen={isUpgradeOpen}
        onClose={() => setIsUpgradeOpen(false)}
      />

      <VoiceModeModal
        isOpen={isVoiceModeOpen}
        onClose={() => setIsVoiceModeOpen(false)}
        onTranscribedQuery={(query) => handleSendMessage(query)}
      />
    </AppShell>
  );
}
