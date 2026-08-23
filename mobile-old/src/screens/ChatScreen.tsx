import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { ChatMessage, MessageStatus, DotvexModelId } from '@dotvex/shared';
import { DotvexTheme } from '../theme';
import { MessageBubble } from '../components/MessageBubble';
import { MessageComposer } from '../components/MessageComposer';
import { EmptyState } from '../components/EmptyState';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  conversationId: string | null;
  setConversationId: (id: string) => void;
  isGenerating: boolean;
  setIsGenerating: (v: boolean) => void;
  theme: DotvexTheme;
  activeModelId: DotvexModelId;
  onChangeModel: (id: DotvexModelId) => void;
  chatService: any;
  settings: any;
  onOpenVoiceMode: () => void;
  onOpenCodex: () => void;
  onOpenImages: () => void;
  onOpenLibrary: () => void;
  onOpenScheduled: () => void;
  onOpenPlugins: () => void;
  onOpenSearch: () => void;
  onRegenerate?: (id: string) => void;
}

export function ChatScreen({
  messages,
  setMessages,
  conversationId,
  setConversationId,
  isGenerating,
  setIsGenerating,
  theme,
  activeModelId,
  onChangeModel,
  chatService,
  settings,
  onOpenVoiceMode,
  onOpenCodex,
  onOpenImages,
  onOpenLibrary,
  onOpenScheduled,
  onOpenPlugins,
  onOpenSearch,
  onRegenerate,
}: Props) {
  const [text, setText] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const c = theme.colors;

  const handleSend = useCallback(async (msg: string, options?: { enableThinking?: boolean; enableWebSearch?: boolean }) => {
    const trimmed = msg.trim();
    if (!trimmed || isGenerating) return;

    setIsGenerating(true);
    setText('');

    let currentConvId = conversationId;
    if (!currentConvId) {
      currentConvId = 'conv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      setConversationId(currentConvId);
    }

    const userMessage: ChatMessage = {
      id: 'usr_' + Date.now(),
      conversationId: currentConvId,
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
      status: 'completed' as MessageStatus,
    };

    const assistantId = 'ast_' + Date.now();
    const modelName = activeModelId === 'dotvex-2.0-flash' ? 'DOTVEX 2.0 Flash' : activeModelId === 'dotvex-2.0-ultra' ? 'DOTVEX 2.0 Ultra' : 'DOTVEX 2.0 Pro';

    const assistantMessage: ChatMessage = {
      id: assistantId,
      conversationId: currentConvId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      status: 'thinking' as MessageStatus,
      modelName,
    };

    const allMessages = [...messages, userMessage, assistantMessage];
    setMessages(allMessages);

    await chatService.sendMessage({
      conversationId: currentConvId,
      userMessage: trimmed,
      historyMessages: [...messages, userMessage],
      systemPrompt: settings.ai.systemPrompt,
      customInstructions: settings.customInstructions,
      temperature: settings.ai.temperature,
      topP: settings.ai.topP,
      maxTokens: settings.ai.maxTokens,
      enableThinking: options?.enableThinking !== false,
      enableWebSearch: options?.enableWebSearch || false,
      modelId: activeModelId,
      modelName,
      onStatusChange: (status: MessageStatus) => {
        setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, status } : m)));
      },
      onChunk: (chunk: any) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: chunk.text, reasoningTrace: chunk.reasoning || m.reasoningTrace, status: chunk.status }
              : m
          )
        );
      },
    });

    setIsGenerating(false);
  }, [messages, isGenerating, conversationId, chatService, settings, activeModelId]);

  const handleStop = useCallback(() => {
    if (conversationId) chatService.stopGeneration(conversationId);
    setIsGenerating(false);
  }, [conversationId, chatService]);

  const handleEditUserMessage = useCallback((content: string) => {
    setText(content);
  }, []);

  const renderMessage = useCallback(
    ({ item }: { item: ChatMessage }) => (
      <MessageBubble message={item} theme={theme} onRegenerate={onRegenerate} onEdit={item.role === 'user' ? handleEditUserMessage : undefined} />
    ),
    [theme, onRegenerate, handleEditUserMessage]
  );

  return (
    <View style={[styles.container, { backgroundColor: c.bgMain }]}>
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={messages.length === 0 ? { flexGrow: 1 } : { paddingVertical: 12 }}
        ListEmptyComponent={<EmptyState onSelectPrompt={(p) => handleSend(p)} theme={theme} />}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <MessageComposer
        theme={theme}
        onSendMessage={handleSend}
        onStopGeneration={handleStop}
        isGenerating={isGenerating}
        activeModelId={activeModelId}
        onChangeModel={onChangeModel}
        onOpenVoiceMode={onOpenVoiceMode}
        onOpenCodex={onOpenCodex}
        onOpenImages={onOpenImages}
        onOpenLibrary={onOpenLibrary}
        onOpenScheduled={onOpenScheduled}
        onOpenPlugins={onOpenPlugins}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
