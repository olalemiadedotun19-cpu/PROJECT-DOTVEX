import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { DotvexTheme, getTheme, ACCENT_COLORS } from './src/theme';
import { ChatMessage, Conversation, MemoryItem, UserSettings } from './src/types';
import { apiService } from './src/api';
import { storage } from './src/storage';

type Screen = 'chat' | 'conversations' | 'settings' | 'cognition';

export default function App() {
  const [theme, setTheme] = useState<DotvexTheme>(getTheme(true));
  const [screen, setScreen] = useState<Screen>('chat');
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    (async () => {
      const s = await storage.getSettings();
      setSettings(s);
      setTheme(getTheme(s.theme === 'dark'));
      const convos = await storage.getConversations();
      setConversations(convos);
      const mems = await storage.getMemories();
      setMemories(mems);
    })();
  }, []);

  if (!settings) {
    return (
      <View style={[styles.container, { backgroundColor: '#212121', alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#10a37f" />
      </View>
    );
  }

  const c = theme.colors;

  const handleSend = useCallback(async () => {
    const trimmed = inputText.trim();
    if (!trimmed || isGenerating || !settings) return;

    setInputText('');
    setIsGenerating(true);

    const userMessage: ChatMessage = {
      id: 'msg_' + Date.now(),
      conversationId: activeConversationId || 'new',
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
      status: 'completed',
    };

    const assistantId = 'msg_' + (Date.now() + 1);
    const assistantMessage: ChatMessage = {
      id: assistantId,
      conversationId: activeConversationId || 'new',
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      status: 'thinking',
    };

    const allMessages = [...messages, userMessage, assistantMessage];
    setMessages(allMessages);

    try {
      const result = await apiService.sendMessage(
        trimmed,
        [...messages, userMessage],
        settings
      );

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: result.text, status: 'completed', modelName: result.modelName }
            : m
        )
      );
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: `Error: ${err.message || 'Failed to get response'}`, status: 'error' }
            : m
        )
      );
    } finally {
      setIsGenerating(false);
    }
  }, [inputText, isGenerating, messages, activeConversationId, settings]);

  const handleNewChat = useCallback(() => {
    setActiveConversationId(null);
    setMessages([]);
  }, []);

  const handleDeleteConversation = useCallback(async (id: string) => {
    await storage.saveConversations(conversations.filter((c) => c.id !== id));
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConversationId === id) handleNewChat();
  }, [conversations, activeConversationId, handleNewChat]);

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.messageRow, isUser && styles.messageRowUser]}>
        <View
          style={[
            styles.messageBubble,
            { backgroundColor: isUser ? c.userBubble : c.assistantBubble },
          ]}
        >
          <Text style={{ fontSize: 14, color: isUser ? c.userBubbleText : c.assistantBubbleText, lineHeight: 20 }}>
            {item.content}
          </Text>
          {item.status === 'thinking' && !item.content && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.accent }} />
              <Text style={{ fontSize: 11, color: c.textMuted }}>Thinking...</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderChatScreen = () => (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: c.bgMain }]}>
      <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} />
      <View style={[styles.header, { borderBottomColor: c.borderSubtle }]}>
        <TouchableOpacity onPress={() => setScreen('conversations')} style={styles.headerBtn}>
          <Text style={{ color: c.textPrimary, fontSize: 18 }}>☰</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: c.textPrimary }]} numberOfLines={1}>
          {conversations.find((c) => c.id === activeConversationId)?.title || 'DOTVEX 2.0'}
        </Text>
        <TouchableOpacity onPress={handleNewChat} style={styles.headerBtn}>
          <Text style={{ color: c.accent, fontSize: 18 }}>+</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingVertical: 12 }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 28, marginBottom: 8 }}>🧠</Text>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: c.textPrimary, marginBottom: 4 }}>
              What can I help with today?
            </Text>
            <Text style={{ fontSize: 12, color: c.textMuted }}>Start a conversation with DOTVEX</Text>
          </View>
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.composerContainer, { backgroundColor: c.bgComposer, borderTopColor: c.borderSubtle }]}
      >
        <TextInput
          style={[styles.input, { backgroundColor: c.bgInput, color: c.textPrimary, borderColor: c.borderSubtle }]}
          placeholder="Reply to DOTVEX..."
          placeholderTextColor={c.textMuted}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={10000}
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={isGenerating || !inputText.trim()}
          style={[styles.sendBtn, { backgroundColor: inputText.trim() ? c.accent : c.borderMain }]}
        >
          {isGenerating ? (
            <ActivityIndicator size="small" color={c.accentText} />
          ) : (
            <Text style={{ color: c.accentText, fontSize: 16 }}>↑</Text>
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );

  const renderConversationsScreen = () => (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: c.bgMain }]}>
      <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} />
      <View style={[styles.header, { borderBottomColor: c.borderSubtle }]}>
        <TouchableOpacity onPress={() => setScreen('chat')} style={styles.headerBtn}>
          <Text style={{ color: c.textPrimary, fontSize: 18 }}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: c.textPrimary }]}>Conversations</Text>
        <TouchableOpacity onPress={handleNewChat} style={styles.headerBtn}>
          <Text style={{ color: c.accent, fontSize: 18 }}>+</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.conversationItem, { borderBottomColor: c.borderSubtle }]}
            onPress={() => {
              setActiveConversationId(item.id);
              setScreen('chat');
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, color: c.textPrimary, fontWeight: '500' }} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>
                {new Date(item.updatedAt).toLocaleDateString()}
              </Text>
            </View>
            <TouchableOpacity onPress={() => handleDeleteConversation(item.id)} style={{ padding: 8 }}>
              <Text style={{ color: c.error, fontSize: 14 }}>✕</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 14, color: c.textMuted }}>No conversations yet</Text>
          </View>
        }
      />
    </SafeAreaView>
  );

  const renderCognitionScreen = () => (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: c.bgMain }]}>
      <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} />
      <View style={[styles.header, { borderBottomColor: c.borderSubtle }]}>
        <TouchableOpacity onPress={() => setScreen('chat')} style={styles.headerBtn}>
          <Text style={{ color: c.textPrimary, fontSize: 18 }}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: c.textPrimary }]}>Cognition Lab</Text>
        <View style={styles.headerBtn} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
          <View style={[styles.statCard, { backgroundColor: c.bgCard }]}>
            <Text style={{ fontSize: 10, color: c.textMuted }}>Memories</Text>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: c.textPrimary }}>{memories.length}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: c.bgCard }]}>
            <Text style={{ fontSize: 10, color: c.textMuted }}>Concepts</Text>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: c.accent }}>
              {new Set(memories.map((m) => m.concept)).size}
            </Text>
          </View>
        </View>

        <Text style={{ fontSize: 13, fontWeight: 'bold', color: c.textSecondary, marginBottom: 8 }}>
          MEMORIES
        </Text>
        {memories.map((mem) => (
          <View key={mem.id} style={[styles.memoryCard, { backgroundColor: c.bgCard }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <View style={{ backgroundColor: c.accent + '22', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                    <Text style={{ fontSize: 9, fontWeight: 'bold', color: c.accent }}>{mem.category}</Text>
                  </View>
                  <Text style={{ fontSize: 11, fontWeight: 'bold', color: c.textPrimary }}>{mem.concept}</Text>
                </View>
                <Text style={{ fontSize: 12, color: c.textSecondary, lineHeight: 17 }}>{mem.content}</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  const updated = memories.filter((m) => m.id !== mem.id);
                  setMemories(updated);
                  storage.saveMemories(updated);
                }}
                style={{ padding: 4 }}
              >
                <Text style={{ color: c.textMuted, fontSize: 12 }}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
              <Text style={{ fontSize: 10, color: c.blue }}>{(mem.confidence * 100).toFixed(0)}%</Text>
              <Text style={{ fontSize: 10, color: c.textMuted }}>{mem.sourceType || 'explicit'}</Text>
            </View>
          </View>
        ))}
        {memories.length === 0 && (
          <Text style={{ fontSize: 12, color: c.textMuted, textAlign: 'center', paddingVertical: 20 }}>
            No memories stored yet.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );

  const renderSettingsScreen = () => (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: c.bgMain }]}>
      <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} />
      <View style={[styles.header, { borderBottomColor: c.borderSubtle }]}>
        <TouchableOpacity onPress={() => setScreen('chat')} style={styles.headerBtn}>
          <Text style={{ color: c.textPrimary, fontSize: 18 }}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: c.textPrimary }]}>Settings</Text>
        <View style={styles.headerBtn} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={{ fontSize: 13, fontWeight: 'bold', color: c.textSecondary, marginBottom: 8 }}>THEME</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          {(['dark', 'light'] as const).map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => {
                const newSettings = { ...settings, theme: t };
                setSettings(newSettings);
                setTheme(getTheme(t === 'dark'));
                storage.saveSettings(newSettings);
              }}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 8,
                backgroundColor: settings.theme === t ? c.accent : c.bgCard,
              }}
            >
              <Text style={{ fontSize: 12, color: settings.theme === t ? c.accentText : c.textSecondary }}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={{ fontSize: 13, fontWeight: 'bold', color: c.textSecondary, marginBottom: 8 }}>ACCENT COLOR</Text>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
          {Object.entries(ACCENT_COLORS).map(([name, color]) => (
            <TouchableOpacity
              key={name}
              onPress={() => {
                const newSettings = { ...settings, accentColor: name };
                setSettings(newSettings);
                storage.saveSettings(newSettings);
              }}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: color,
                borderWidth: settings.accentColor === name ? 3 : 0,
                borderColor: '#fff',
              }}
            />
          ))}
        </View>

        <Text style={{ fontSize: 13, fontWeight: 'bold', color: c.textSecondary, marginBottom: 8 }}>API CONFIGURATION</Text>
        <TextInput
          style={[styles.input, { backgroundColor: c.bgInput, color: c.textPrimary, borderColor: c.borderSubtle, marginBottom: 8 }]}
          placeholder="API Endpoint"
          placeholderTextColor={c.textMuted}
          value={settings.apiEndpoint}
          onChangeText={(v) => {
            const newSettings = { ...settings, apiEndpoint: v };
            setSettings(newSettings);
            apiService.setBaseUrl(v || 'http://localhost:3000');
            storage.saveSettings(newSettings);
          }}
          autoCapitalize="none"
        />
        <TextInput
          style={[styles.input, { backgroundColor: c.bgInput, color: c.textPrimary, borderColor: c.borderSubtle }]}
          placeholder="API Key"
          placeholderTextColor={c.textMuted}
          value={settings.apiKey}
          onChangeText={(v) => {
            const newSettings = { ...settings, apiKey: v };
            setSettings(newSettings);
            apiService.setApiKey(v);
            storage.saveSettings(newSettings);
          }}
          autoCapitalize="none"
          secureTextEntry
        />
      </ScrollView>
    </SafeAreaView>
  );

  return (
    <View style={{ flex: 1 }}>
      {screen === 'chat' && renderChatScreen()}
      {screen === 'conversations' && renderConversationsScreen()}
      {screen === 'cognition' && renderCognitionScreen()}
      {screen === 'settings' && renderSettingsScreen()}

      <View style={[styles.bottomNav, { backgroundColor: c.bgSidebar, borderTopColor: c.borderSubtle }]}>
        <TouchableOpacity onPress={() => setScreen('chat')} style={styles.navItem}>
          <Text style={{ fontSize: 20, color: screen === 'chat' ? c.accent : c.textMuted }}>💬</Text>
          <Text style={{ fontSize: 9, color: screen === 'chat' ? c.accent : c.textMuted }}>Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setScreen('conversations')} style={styles.navItem}>
          <Text style={{ fontSize: 20, color: screen === 'conversations' ? c.accent : c.textMuted }}>📋</Text>
          <Text style={{ fontSize: 9, color: screen === 'conversations' ? c.accent : c.textMuted }}>Chats</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setScreen('cognition')} style={styles.navItem}>
          <Text style={{ fontSize: 20, color: screen === 'cognition' ? c.accent : c.textMuted }}>🧠</Text>
          <Text style={{ fontSize: 9, color: screen === 'cognition' ? c.accent : c.textMuted }}>Cognition</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setScreen('settings')} style={styles.navItem}>
          <Text style={{ fontSize: 20, color: screen === 'settings' ? c.accent : c.textMuted }}>⚙️</Text>
          <Text style={{ fontSize: 9, color: screen === 'settings' ? c.accent : c.textMuted }}>Settings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 14, fontWeight: '600', flex: 1, textAlign: 'center' },
  messageRow: { paddingHorizontal: 14, paddingVertical: 4, alignItems: 'flex-start' },
  messageRowUser: { alignItems: 'flex-end' },
  messageBubble: { maxWidth: '85%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  composerContainer: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: 1, gap: 8 },
  input: { flex: 1, maxHeight: 120, borderRadius: 20, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15 },
  sendBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  conversationItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  statCard: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
  memoryCard: { padding: 14, borderRadius: 12, marginBottom: 10 },
  bottomNav: { flexDirection: 'row', borderTopWidth: 1, paddingVertical: 8 },
  navItem: { flex: 1, alignItems: 'center', gap: 2 },
});
