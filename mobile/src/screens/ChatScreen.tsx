import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ChatMessage, GenerationChunk, MessageStatus } from '@dotvex/shared';
import { useApp } from '../context/AppContext';
import { MessageBubble } from '../components/MessageBubble';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  conversationId: string | null;
  setConversationId: (id: string) => void;
  isGenerating: boolean;
  setIsGenerating: (v: boolean) => void;
  onOpenVoice?: () => void;
}

export function ChatScreen({
  messages,
  setMessages,
  conversationId,
  setConversationId,
  isGenerating,
  setIsGenerating,
  onOpenVoice,
}: Props) {
  const { theme, chatService, settings, voiceService } = useApp();
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const colors = theme.colors;

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || isGenerating) return;

    setText('');
    setIsGenerating(true);

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
      status: 'completed',
    };

    const assistantId = 'ast_' + Date.now();
    const assistantMessage: ChatMessage = {
      id: assistantId,
      conversationId: currentConvId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      status: 'thinking',
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
      enableThinking: settings.ai.enableReasoningTrace,
      onStatusChange: (status: MessageStatus) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, status } : m))
        );
      },
      onChunk: (chunk: GenerationChunk) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content: chunk.text,
                  reasoningTrace: chunk.reasoning || m.reasoningTrace,
                  status: chunk.status,
                }
              : m
          )
        );
      },
    });

    setIsGenerating(false);
  }, [text, isGenerating, conversationId, messages, chatService, settings]);

  const handleStop = useCallback(() => {
    if (conversationId) {
      chatService.stopGeneration(conversationId);
    }
    setIsGenerating(false);
  }, [conversationId, chatService]);

  const toggleMic = useCallback(() => {
    if (isRecording) {
      voiceService.stopListening();
      setIsRecording(false);
      return;
    }
    voiceService.startListening({
      onResult: (transcript: string, isFinal: boolean) => {
        setText((prev) => (prev ? prev + ' ' + transcript : transcript));
        if (isFinal) {
          setIsRecording(false);
        }
      },
      onError: () => {
        setIsRecording(false);
      },
      onEnd: () => setIsRecording(false),
    });
    setIsRecording(true);
  }, [isRecording, voiceService]);

  const renderMessage = useCallback(
    ({ item, index }: { item: ChatMessage; index: number }) => (
      <MessageBubble message={item} theme={theme} isLast={index === messages.length - 1} />
    ),
    [theme, messages.length]
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {isGenerating && (
        <View style={[styles.thinkingBar, { backgroundColor: colors.surfaceVariant }]}>
          <ActivityIndicator size="small" color={colors.accent} />
          <Text style={[styles.thinkingText, { color: colors.textSecondary }]}>
            DOTVEX is thinking...
          </Text>
        </View>
      )}

      <View style={[styles.composer, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
        <TextInput
          style={[styles.input, { color: colors.text, backgroundColor: colors.inputBackground }]}
          placeholder="Reply to DOTVEX 2.0..."
          placeholderTextColor={colors.textMuted}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={100000}
        />
        {isGenerating ? (
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: colors.primary }]}
            onPress={handleStop}
          >
            <Ionicons name="stop" size={18} color={colors.primaryText} />
          </TouchableOpacity>
        ) : text.trim() ? (
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: colors.primary }]}
            onPress={handleSend}
          >
            <Ionicons name="arrow-up" size={18} color={colors.primaryText} />
          </TouchableOpacity>
        ) : (
          <View style={styles.bottomRow}>
            <TouchableOpacity onPress={toggleMic} style={styles.iconBtn}>
              <Ionicons
                name={isRecording ? 'mic' : 'mic-outline'}
                size={22}
                color={isRecording ? colors.error : colors.icon}
              />
            </TouchableOpacity>
            {onOpenVoice && (
              <TouchableOpacity onPress={onOpenVoice} style={styles.iconBtn}>
                <Ionicons name="mic-circle-outline" size={24} color={colors.accent} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messagesList: {
    paddingVertical: 12,
  },
  thinkingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  thinkingText: {
    fontSize: 12,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconBtn: {
    padding: 6,
  },
});
