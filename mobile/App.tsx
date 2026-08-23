import 'react-native-gesture-handler';
import React, { useState, useCallback, Component, ErrorInfo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Modal, SafeAreaView, ScrollView, TextInput, Switch, FlatList, ActivityIndicator } from 'react-native';

class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean; error: string }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: '' };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[DOTVEX] Uncaught error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: '#212121', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <Text style={{ color: '#f43f5e', fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>DOTVEX encountered an error</Text>
          <Text style={{ color: '#737373', fontSize: 12, textAlign: 'center' }}>{this.state.error}</Text>
          <TouchableOpacity onPress={() => this.setState({ hasError: false, error: '' })} style={{ marginTop: 20, padding: 12, backgroundColor: '#10a37f', borderRadius: 10 }}>
            <Text style={{ color: 'white', fontWeight: 'bold' }}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
const Stack = createNativeStackNavigator();
import { AppProvider, useApp } from './src/context/AppContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ChatScreen } from './src/screens/ChatScreen';
import { CognitionLab } from './src/screens/CognitionLab';
import { SidebarDrawer } from './src/components/SidebarDrawer';
import { DotvexLogo } from './src/components/DotvexLogo';
import { SplashScreen, InitializationScreen } from './src/screens/SplashScreens';
import { LoginScreen, SignupScreen, ForgotPasswordScreen } from './src/screens/AuthScreens';
import { Ionicons } from '@expo/vector-icons';
import { ChatMessage, Conversation, GroupedConversations, DotvexModelId } from '@dotvex/shared';

function MainApp() {
  const app = useApp();
  const { isAuthenticated, user, signOut, getAuthToken } = useAuth();
  const c = app.theme.colors;

  const [activeView, setActiveView] = useState<'chat' | 'cognition'>('chat');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [groupedConversations, setGroupedConversations] = useState<GroupedConversations[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeModelId, setActiveModelId] = useState<DotvexModelId>(app.activeModelId);

  const [showSearch, setShowSearch] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showImages, setShowImages] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showScheduled, setShowScheduled] = useState(false);
  const [showPlugins, setShowPlugins] = useState(false);
  const [showProjects, setShowProjects] = useState(false);
  const [showCodex, setShowCodex] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showVoiceMode, setShowVoiceMode] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  const refreshConversations = useCallback(async () => {
    try {
      const list = await app.conversationService.getConversations();
      setConversations(list);
      setGroupedConversations(app.conversationService.groupConversations(list));
    } catch (err) { console.warn('Failed to refresh conversations:', err); }
  }, [app]);

  const handleNewChat = useCallback(async () => {
    setActiveConversationId(null);
    setMessages([]);
    setActiveView('chat');
    try {
      const newConv = await app.conversationService.createConversation('New chat');
      refreshConversations();
      setActiveConversationId(newConv.id);
    } catch (err) {}
  }, [app, refreshConversations]);

  const handleSelectConversation = useCallback(async (id: string) => {
    setActiveConversationId(id);
    setActiveView('chat');
    try {
      const msgs = await app.conversationService.getMessages(id);
      setMessages(msgs);
    } catch (err) { setMessages([]); }
  }, [app]);

  const handleTogglePin = useCallback(async (id: string) => {
    try { await app.conversationService.togglePin(id); refreshConversations(); } catch (err) {}
  }, [app, refreshConversations]);

  const handleRenameConversation = useCallback(async (id: string, title: string) => {
    try { await app.conversationService.updateConversation(id, { title }); refreshConversations(); } catch (err) {}
  }, [app, refreshConversations]);

  const handleDeleteConversation = useCallback(async (id: string) => {
    try {
      await app.conversationService.deleteConversation(id);
      const updated = await app.conversationService.getConversations();
      setConversations(updated);
      setGroupedConversations(app.conversationService.groupConversations(updated));
      if (activeConversationId === id) { setActiveConversationId(null); setMessages([]); }
    } catch (err) {}
  }, [app, activeConversationId]);

  const handleChangeModel = useCallback((id: DotvexModelId) => {
    setActiveModelId(id);
    app.updateSettings({ ai: { ...app.settings.ai, activeModel: id } });
  }, [app]);

  const handleOpenSearch = useCallback(() => { setShowSearch(true); }, []);
  const currentConv = conversations.find((conv) => conv.id === activeConversationId);

  const handleSignOut = useCallback(async () => {
    await signOut();
  }, [signOut]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: c.bgMain }]}>
      <StatusBar barStyle={app.isDark ? 'light-content' : 'dark-content'} />

      {/* Top Header */}
      <View style={[styles.header, { backgroundColor: c.bgMain, borderBottomColor: c.dark ? 'transparent' : '#f0f0f0' }]}>
        <TouchableOpacity onPress={() => setDrawerOpen(true)} style={[styles.menuBtn, { backgroundColor: c.dark ? '#2f2f2f' : '#f4f4f4', borderColor: c.dark ? '#383838' : '#e5e5e5' }]}>
          <Ionicons name="menu" size={18} color={c.textPrimary} />
        </TouchableOpacity>

        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontSize: 11, fontWeight: '500', color: c.textMuted }} numberOfLines={1}>
            {currentConv?.title || ''}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: c.dark ? '#2f2f2f' : '#f4f4f4', borderRadius: 20, borderWidth: 1, borderColor: c.dark ? '#383838' : '#e5e5e5', padding: 2 }}>
          <TouchableOpacity onPress={handleNewChat} style={{ padding: 7 }}>
            <Ionicons name="create-outline" size={14} color={c.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleOpenSearch} style={{ padding: 7 }}>
            <Ionicons name="search-outline" size={14} color={c.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      {activeView === 'chat' ? (
        <ChatScreen
          messages={messages}
          setMessages={setMessages}
          conversationId={activeConversationId}
          setConversationId={setActiveConversationId}
          isGenerating={isGenerating}
          setIsGenerating={setIsGenerating}
          theme={app.theme}
          activeModelId={activeModelId}
          onChangeModel={handleChangeModel}
          chatService={app.chatService}
          settings={app.settings}
          onOpenVoiceMode={() => setShowVoiceMode(true)}
          onOpenCodex={() => setShowCodex(true)}
          onOpenImages={() => setShowImages(true)}
          onOpenLibrary={() => setShowLibrary(true)}
          onOpenScheduled={() => setShowScheduled(true)}
          onOpenPlugins={() => setShowPlugins(true)}
          onOpenSearch={handleOpenSearch}
        />
      ) : (
        <CognitionLab theme={app.theme} cognitionService={app.cognitionService} onBack={() => setActiveView('chat')} />
      )}

      {/* Drawer */}
      <Modal visible={drawerOpen} transparent animationType="slide" onRequestClose={() => setDrawerOpen(false)}>
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <TouchableOpacity style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)' }} activeOpacity={1} onPress={() => setDrawerOpen(false)} />
          <SidebarDrawer
            theme={app.theme}
            conversations={conversations}
            groupedConversations={groupedConversations}
            activeConversationId={activeConversationId}
            onSelectConversation={handleSelectConversation}
            onNewChat={handleNewChat}
            onOpenSearch={() => { setDrawerOpen(false); setShowSearch(true); }}
            onOpenSettings={() => { setDrawerOpen(false); setShowSettings(true); }}
            onOpenCognitionLab={() => { setDrawerOpen(false); setActiveView('cognition'); }}
            onOpenImages={() => { setDrawerOpen(false); setShowImages(true); }}
            onOpenLibrary={() => { setDrawerOpen(false); setShowLibrary(true); }}
            onOpenScheduled={() => { setDrawerOpen(false); setShowScheduled(true); }}
            onOpenPlugins={() => { setDrawerOpen(false); setShowPlugins(true); }}
            onOpenProjects={() => { setDrawerOpen(false); setShowProjects(true); }}
            onOpenCodex={() => { setDrawerOpen(false); setShowCodex(true); }}
            onOpenUpgrade={() => { setDrawerOpen(false); setShowUpgrade(true); }}
            onTogglePin={handleTogglePin}
            onRenameConversation={handleRenameConversation}
            onDeleteConversation={handleDeleteConversation}
            onToggleTheme={app.toggleTheme}
            onClose={() => setDrawerOpen(false)}
            user={user}
            onSignOut={handleSignOut}
          />
        </View>
      </Modal>

      {/* Modals */}
      <SearchModal visible={showSearch} onClose={() => setShowSearch(false)} theme={app.theme} onSelectConversation={(id: string) => { setShowSearch(false); handleSelectConversation(id); }} conversations={conversations} />
      <SettingsModal visible={showSettings} onClose={() => setShowSettings(false)} theme={app.theme} settings={app.settings} onUpdateSettings={app.updateSettings} user={user} />
      <LibraryModal visible={showLibrary} onClose={() => setShowLibrary(false)} theme={app.theme} />
      <ScheduledModal visible={showScheduled} onClose={() => setShowScheduled(false)} theme={app.theme} />
      <PluginsModal visible={showPlugins} onClose={() => setShowPlugins(false)} theme={app.theme} />
      <ProjectsModal visible={showProjects} onClose={() => setShowProjects(false)} theme={app.theme} />
      <CodexModal visible={showCodex} onClose={() => setShowCodex(false)} theme={app.theme} />
      <ImagesModal visible={showImages} onClose={() => setShowImages(false)} theme={app.theme} />
      <ShareModal visible={showShare} onClose={() => setShowShare(false)} theme={app.theme} />
      <UpgradeModal visible={showUpgrade} onClose={() => setShowUpgrade(false)} theme={app.theme} />
      <VoiceModeModal visible={showVoiceMode} onClose={() => setShowVoiceMode(false)} theme={app.theme} voiceService={app.voiceService} onTranscribedQuery={(query: string) => { setShowVoiceMode(false); }} />
    </SafeAreaView>
  );
}

// ─── Modal Components ─────────────────────────────────────────────────────────

function ModalSheet({ visible, onClose, theme, children }: { visible: boolean; onClose: () => void; theme: any; children: React.ReactNode }) {
  const c = theme.colors;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={[styles.modalSheet, { backgroundColor: c.bgCard, borderColor: c.borderMain }]} onPress={() => {}}>
          {children}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

function SearchModal({ visible, onClose, theme, onSelectConversation, conversations }: any) {
  const c = theme.colors;
  const [query, setQuery] = useState('');
  const filtered = conversations.filter((conv: Conversation) => conv.title.toLowerCase().includes(query.toLowerCase()));
  return (
    <ModalSheet visible={visible} onClose={onClose} theme={theme}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', color: c.textPrimary }}>Search conversations</Text>
        <TouchableOpacity onPress={onClose}><Ionicons name="close" size={20} color={c.textMuted} /></TouchableOpacity>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: c.bgInput, borderRadius: 10, borderWidth: 1, borderColor: c.borderSubtle, paddingHorizontal: 10, marginBottom: 12 }}>
        <Ionicons name="search" size={16} color={c.textMuted} />
        <TextInput style={{ flex: 1, paddingVertical: 10, color: c.textPrimary, fontSize: 14 }} placeholder="Search..." placeholderTextColor={c.textMuted} value={query} onChangeText={setQuery} autoFocus />
      </View>
      <FlatList data={filtered} keyExtractor={(item: any) => item.id} renderItem={({ item }: any) => (
        <TouchableOpacity onPress={() => onSelectConversation(item.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.borderSubtle }}>
          <Ionicons name="chatbubble-outline" size={14} color={c.textMuted} />
          <Text style={{ fontSize: 13, color: c.textPrimary }} numberOfLines={1}>{item.title}</Text>
        </TouchableOpacity>
      )} />
    </ModalSheet>
  );
}

function SettingsModal({ visible, onClose, theme, settings, onUpdateSettings, user }: any) {
  const c = theme.colors;
  const [page, setPage] = useState('main');
  const sections = [
    { key: 'personalization', label: 'Personalization', icon: 'person-outline' },
    { key: 'memory', label: 'Memory / Cognition', icon: 'bulb-outline' },
    { key: 'general', label: 'General', icon: 'settings-outline' },
    { key: 'notifications', label: 'Notifications', icon: 'notifications-outline' },
    { key: 'voice', label: 'Voice', icon: 'mic-outline' },
    { key: 'safety', label: 'Safety', icon: 'shield-checkmark-outline' },
    { key: 'security', label: 'Security', icon: 'key-outline' },
    { key: 'remote', label: 'Remote', icon: 'cloud-outline' },
    { key: 'storage', label: 'Storage', icon: 'server-outline' },
    { key: 'about', label: 'About', icon: 'information-circle-outline' },
  ];

  const renderMain = () => (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: c.textPrimary }}>Settings</Text>
        <TouchableOpacity onPress={onClose}><Ionicons name="close" size={22} color={c.textMuted} /></TouchableOpacity>
      </View>
      <TouchableOpacity onPress={() => setPage('account')} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.borderSubtle }}>
        <Ionicons name="person-circle-outline" size={22} color={c.accent} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, color: c.textPrimary, fontWeight: '600' }}>Account</Text>
          <Text style={{ fontSize: 11, color: c.textMuted }}>{user?.email || 'Signed in'}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={c.textMuted} />
      </TouchableOpacity>
      {sections.map((s) => (
        <TouchableOpacity key={s.key} onPress={() => setPage(s.key)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.borderSubtle }}>
          <Ionicons name={s.icon as any} size={18} color={c.accent} />
          <Text style={{ fontSize: 14, color: c.textPrimary, flex: 1 }}>{s.label}</Text>
          <Ionicons name="chevron-forward" size={16} color={c.textMuted} />
        </TouchableOpacity>
      ))}
    </View>
  );

  const SettingRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.borderSubtle }}>
      <Text style={{ fontSize: 13, color: c.textPrimary }}>{label}</Text>
      {value}
    </View>
  );

  const renderSection = (title: string, controls: React.ReactNode) => (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <TouchableOpacity onPress={() => setPage('main')}><Ionicons name="arrow-back" size={20} color={c.accent} /></TouchableOpacity>
        <Text style={{ fontSize: 16, fontWeight: 'bold', color: c.textPrimary }}>{title}</Text>
      </View>
      {controls}
    </View>
  );

  const renderControls = () => {
    switch (page) {
      case 'account':
        return renderSection('Account', (
          <View>
            <View style={{ alignItems: 'center', paddingVertical: 20, backgroundColor: c.bgCard, borderRadius: 14, borderWidth: 1, borderColor: c.borderSubtle, marginBottom: 16 }}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>{(user?.displayName || user?.email || 'U')[0].toUpperCase()}</Text>
              </View>
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: c.textPrimary, marginTop: 10 }}>{user?.displayName || 'User'}</Text>
              <Text style={{ fontSize: 12, color: c.textMuted, marginTop: 2 }}>{user?.email}</Text>
            </View>
            <Text style={{ fontSize: 11, color: c.textMuted, marginBottom: 8 }}>FIREBASE UID</Text>
            <Text style={{ fontSize: 10, fontFamily: 'monospace', color: c.textMuted, backgroundColor: c.bgInput, padding: 8, borderRadius: 6 }}>{user?.uid || 'unknown'}</Text>
          </View>
        ));
      case 'personalization':
        return renderSection('Personalization', (
          <View>
            <SettingRow label="User Name" value={<Text style={{ fontSize: 12, color: c.textSecondary }}>{settings.userName}</Text>} />
            <SettingRow label="Email" value={<Text style={{ fontSize: 12, color: c.textSecondary }}>{settings.userEmail}</Text>} />
            <SettingRow label="Workspace" value={<Text style={{ fontSize: 12, color: c.textSecondary }}>{settings.workspace}</Text>} />
          </View>
        ));
      case 'memory':
        return renderSection('Memory / Cognition', (
          <View>
            <SettingRow label="Cognition Lab" value={<Switch value={settings.memory.enableCognitionLab} onValueChange={(v: boolean) => onUpdateSettings({ memory: { ...settings.memory, enableCognitionLab: v } })} trackColor={{ false: c.borderMain, true: c.accent }} />} />
            <SettingRow label="Auto-extract memories" value={<Switch value={settings.memory.autoExtractMemories} onValueChange={(v: boolean) => onUpdateSettings({ memory: { ...settings.memory, autoExtractMemories: v } })} trackColor={{ false: c.borderMain, true: c.accent }} />} />
            <SettingRow label="Allow reinforcement" value={<Switch value={settings.memory.allowMemoryReinforcement} onValueChange={(v: boolean) => onUpdateSettings({ memory: { ...settings.memory, allowMemoryReinforcement: v } })} trackColor={{ false: c.borderMain, true: c.accent }} />} />
          </View>
        ));
      case 'general':
        return renderSection('General', (
          <View>
            <SettingRow label="Dark Mode" value={<Switch value={settings.theme === 'dark'} onValueChange={(v: boolean) => onUpdateSettings({ theme: v ? 'dark' : 'light' })} trackColor={{ false: c.borderMain, true: c.accent }} />} />
            <SettingRow label="Auto-scroll" value={<Switch value={settings.general.autoScroll} onValueChange={(v: boolean) => onUpdateSettings({ general: { ...settings.general, autoScroll: v } })} trackColor={{ false: c.borderMain, true: c.accent }} />} />
            <SettingRow label="Haptic Feedback" value={<Switch value={settings.general.hapticFeedback} onValueChange={(v: boolean) => onUpdateSettings({ general: { ...settings.general, hapticFeedback: v } })} trackColor={{ false: c.borderMain, true: c.accent }} />} />
          </View>
        ));
      case 'notifications':
        return renderSection('Notifications', (
          <View>
            <SettingRow label="Push" value={<Switch value={settings.notifications.push} onValueChange={(v: boolean) => onUpdateSettings({ notifications: { ...settings.notifications, push: v } })} trackColor={{ false: c.borderMain, true: c.accent }} />} />
            <SettingRow label="Sound" value={<Switch value={settings.notifications.soundAlerts} onValueChange={(v: boolean) => onUpdateSettings({ notifications: { ...settings.notifications, soundAlerts: v } })} trackColor={{ false: c.borderMain, true: c.accent }} />} />
            <SettingRow label="Scheduled Prompts" value={<Switch value={settings.notifications.scheduledPrompts} onValueChange={(v: boolean) => onUpdateSettings({ notifications: { ...settings.notifications, scheduledPrompts: v } })} trackColor={{ false: c.borderMain, true: c.accent }} />} />
          </View>
        ));
      case 'voice':
        return renderSection('Voice', (
          <View>
            <SettingRow label="Voice enabled" value={<Switch value={settings.voice.enabled} onValueChange={(v: boolean) => onUpdateSettings({ voice: { ...settings.voice, enabled: v } })} trackColor={{ false: c.borderMain, true: c.accent }} />} />
            <SettingRow label="Auto-play response" value={<Switch value={settings.voice.autoPlayResponse} onValueChange={(v: boolean) => onUpdateSettings({ voice: { ...settings.voice, autoPlayResponse: v } })} trackColor={{ false: c.borderMain, true: c.accent }} />} />
          </View>
        ));
      case 'safety':
        return renderSection('Safety', (
          <View>
            <SettingRow label="Math verification" value={<Switch value={settings.safety.mathVerification} onValueChange={(v: boolean) => onUpdateSettings({ safety: { ...settings.safety, mathVerification: v } })} trackColor={{ false: c.borderMain, true: c.accent }} />} />
            <SettingRow label="Reasoning guardrails" value={<Switch value={settings.safety.reasoningGuardrails} onValueChange={(v: boolean) => onUpdateSettings({ safety: { ...settings.safety, reasoningGuardrails: v } })} trackColor={{ false: c.borderMain, true: c.accent }} />} />
          </View>
        ));
      case 'security':
        return renderSection('Security', (
          <View>
            <SettingRow label="Passkey" value={<Switch value={settings.security.passkeyEnabled} onValueChange={(v: boolean) => onUpdateSettings({ security: { ...settings.security, passkeyEnabled: v } })} trackColor={{ false: c.borderMain, true: c.accent }} />} />
            <SettingRow label="Encrypt stored chats" value={<Switch value={settings.privacy.encryptStoredChats} onValueChange={(v: boolean) => onUpdateSettings({ privacy: { ...settings.privacy, encryptStoredChats: v } })} trackColor={{ false: c.borderMain, true: c.accent }} />} />
          </View>
        ));
      case 'remote':
        return renderSection('Remote', (
          <View>
            <Text style={{ fontSize: 11, fontWeight: 'bold', color: c.textSecondary, marginBottom: 4 }}>API Endpoint</Text>
            <TextInput style={{ backgroundColor: c.bgInput, borderRadius: 10, borderWidth: 1, borderColor: c.borderSubtle, padding: 10, color: c.textPrimary, fontSize: 13, marginBottom: 10 }} value={settings.ai.remoteApiEndpoint} onChangeText={(v: string) => onUpdateSettings({ ai: { ...settings.ai, remoteApiEndpoint: v } })} placeholder="https://your-server.com" placeholderTextColor={c.textMuted} autoCapitalize="none" />
            <Text style={{ fontSize: 11, fontWeight: 'bold', color: c.textSecondary, marginBottom: 4 }}>Temperature</Text>
            <TextInput style={{ backgroundColor: c.bgInput, borderRadius: 10, borderWidth: 1, borderColor: c.borderSubtle, padding: 10, color: c.textPrimary, fontSize: 13 }} value={String(settings.ai.temperature)} onChangeText={(v: string) => onUpdateSettings({ ai: { ...settings.ai, temperature: parseFloat(v) || 0.7 } })} keyboardType="decimal-pad" />
          </View>
        ));
      case 'storage':
        return renderSection('Storage', (
          <View>
            <SettingRow label="Save history locally" value={<Switch value={settings.privacy.saveHistoryLocally} onValueChange={(v: boolean) => onUpdateSettings({ privacy: { ...settings.privacy, saveHistoryLocally: v } })} trackColor={{ false: c.borderMain, true: c.accent }} />} />
            <SettingRow label="Allow diagnostics" value={<Switch value={settings.privacy.allowDataDiagnostics} onValueChange={(v: boolean) => onUpdateSettings({ privacy: { ...settings.privacy, allowDataDiagnostics: v } })} trackColor={{ false: c.borderMain, true: c.accent }} />} />
          </View>
        ));
      case 'about':
        return renderSection('About', (
          <View style={{ alignItems: 'center', paddingVertical: 20 }}>
            <DotvexLogo size="lg" showText={false} showBadge={false} />
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: c.textPrimary, marginTop: 12 }}>DOTVEX 2.0</Text>
            <Text style={{ fontSize: 12, color: c.textMuted, marginTop: 4 }}>Created by Dotman (Olalemi Michael Adedotun)</Text>
            <Text style={{ fontSize: 12, color: c.textMuted, marginTop: 2 }}>Powered by Qwen3</Text>
            <Text style={{ fontSize: 11, color: c.textMuted, marginTop: 8 }}>Version 2.0.0</Text>
          </View>
        ));
      default:
        return renderMain();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={[styles.settingsModal, { backgroundColor: c.bgMain, borderColor: c.borderMain }]} onPress={() => {}}>
          <ScrollView>{renderControls()}</ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

function LibraryModal({ visible, onClose, theme }: any) {
  const c = theme.colors;
  return (
    <ModalSheet visible={visible} onClose={onClose} theme={theme}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', color: c.textPrimary }}>Library</Text>
        <TouchableOpacity onPress={onClose}><Ionicons name="close" size={20} color={c.textMuted} /></TouchableOpacity>
      </View>
      <View style={{ alignItems: 'center', paddingVertical: 30 }}>
        <Ionicons name="book-outline" size={40} color={c.textMuted} />
        <Text style={{ fontSize: 12, color: c.textMuted, marginTop: 8 }}>No items saved yet.</Text>
      </View>
    </ModalSheet>
  );
}

function ScheduledModal({ visible, onClose, theme }: any) {
  const c = theme.colors;
  return (
    <ModalSheet visible={visible} onClose={onClose} theme={theme}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', color: c.textPrimary }}>Scheduled Prompts</Text>
        <TouchableOpacity onPress={onClose}><Ionicons name="close" size={20} color={c.textMuted} /></TouchableOpacity>
      </View>
      <Text style={{ fontSize: 12, color: c.textMuted }}>Schedule prompts to run at specific times.</Text>
    </ModalSheet>
  );
}

function PluginsModal({ visible, onClose, theme }: any) {
  const c = theme.colors;
  return (
    <ModalSheet visible={visible} onClose={onClose} theme={theme}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', color: c.textPrimary }}>Plugins & Tools</Text>
        <TouchableOpacity onPress={onClose}><Ionicons name="close" size={20} color={c.textMuted} /></TouchableOpacity>
      </View>
      <Text style={{ fontSize: 12, color: c.textMuted }}>Extend DOTVEX with plugins and tools.</Text>
    </ModalSheet>
  );
}

function ProjectsModal({ visible, onClose, theme }: any) {
  const c = theme.colors;
  return (
    <ModalSheet visible={visible} onClose={onClose} theme={theme}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', color: c.textPrimary }}>Projects</Text>
        <TouchableOpacity onPress={onClose}><Ionicons name="close" size={20} color={c.textMuted} /></TouchableOpacity>
      </View>
      <Text style={{ fontSize: 12, color: c.textMuted }}>Organize conversations into projects.</Text>
    </ModalSheet>
  );
}

function CodexModal({ visible, onClose, theme }: any) {
  const c = theme.colors;
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={[styles.settingsModal, { backgroundColor: c.bgMain, borderColor: c.borderMain }]} onPress={() => {}}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: c.textPrimary }}>Codex Sandbox</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={22} color={c.textMuted} /></TouchableOpacity>
          </View>
          <View style={{ backgroundColor: '#12141a', borderRadius: 10, borderWidth: 1, borderColor: c.borderSubtle, padding: 14, minHeight: 200 }}>
            <Text style={{ fontSize: 12, fontFamily: 'monospace', color: c.textMuted }}>{"$"} Ready to execute code...</Text>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

function ImagesModal({ visible, onClose, theme }: any) {
  const c = theme.colors;
  return (
    <ModalSheet visible={visible} onClose={onClose} theme={theme}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', color: c.textPrimary }}>Images</Text>
        <TouchableOpacity onPress={onClose}><Ionicons name="close" size={20} color={c.textMuted} /></TouchableOpacity>
      </View>
      <Text style={{ fontSize: 12, color: c.textMuted }}>Generate and browse images.</Text>
    </ModalSheet>
  );
}

function ShareModal({ visible, onClose, theme }: any) {
  const c = theme.colors;
  return (
    <ModalSheet visible={visible} onClose={onClose} theme={theme}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', color: c.textPrimary }}>Share conversation</Text>
        <TouchableOpacity onPress={onClose}><Ionicons name="close" size={20} color={c.textMuted} /></TouchableOpacity>
      </View>
      <View style={{ flexDirection: 'row', gap: 12, justifyContent: 'center', paddingVertical: 20 }}>
        <TouchableOpacity style={{ alignItems: 'center', gap: 4 }}>
          <View style={{ padding: 12, borderRadius: 12, backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.borderSubtle }}><Ionicons name="link-outline" size={20} color={c.accent} /></View>
          <Text style={{ fontSize: 10, color: c.textMuted }}>Copy link</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ alignItems: 'center', gap: 4 }}>
          <View style={{ padding: 12, borderRadius: 12, backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.borderSubtle }}><Ionicons name="download-outline" size={20} color={c.accent} /></View>
          <Text style={{ fontSize: 10, color: c.textMuted }}>Export</Text>
        </TouchableOpacity>
      </View>
    </ModalSheet>
  );
}

function UpgradeModal({ visible, onClose, theme }: any) {
  const c = theme.colors;
  return (
    <ModalSheet visible={visible} onClose={onClose} theme={theme}>
      <View style={{ alignItems: 'center', paddingVertical: 20 }}>
        <Ionicons name="sparkles" size={40} color={c.accent} />
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: c.textPrimary, marginTop: 12 }}>Upgrade DOTVEX</Text>
        <Text style={{ fontSize: 12, color: c.textMuted, textAlign: 'center', marginTop: 8 }}>Unlock advanced features and higher limits.</Text>
        <TouchableOpacity onPress={onClose} style={{ backgroundColor: c.accent, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12, marginTop: 16 }}>
          <Text style={{ fontSize: 13, fontWeight: 'bold', color: c.accentText }}>Learn more</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onClose} style={{ marginTop: 10 }}>
          <Text style={{ fontSize: 12, color: c.textMuted }}>Maybe later</Text>
        </TouchableOpacity>
      </View>
    </ModalSheet>
  );
}

function VoiceModeModal({ visible, onClose, theme, voiceService, onTranscribedQuery }: any) {
  const c = theme.colors;
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');

  const handleToggleListen = async () => {
    if (isListening) {
      voiceService.stopListening();
      setIsListening(false);
    } else {
      await voiceService.startListening({
        onResult: (text: string, isFinal: boolean) => {
          setTranscript(text);
          if (isFinal) { voiceService.stopListening(); setIsListening(false); }
        },
        onError: () => setIsListening(false),
        onEnd: () => setIsListening(false),
      });
      setIsListening(true);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: c.bgMain, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <TouchableOpacity onPress={onClose} style={{ position: 'absolute', top: 50, right: 20 }}>
          <Ionicons name="close" size={24} color={c.textMuted} />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: c.textPrimary, marginBottom: 20 }}>Voice Mode</Text>
        <TouchableOpacity onPress={handleToggleListen} style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: isListening ? c.accent : c.bgCard, borderWidth: 2, borderColor: c.accent, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={isListening ? 'mic' : 'mic-outline'} size={40} color={isListening ? c.accentText : c.accent} />
        </TouchableOpacity>
        <Text style={{ fontSize: 12, color: c.textMuted, marginTop: 16 }}>{isListening ? 'Listening...' : 'Tap to speak'}</Text>
        {transcript ? <Text style={{ fontSize: 14, color: c.textPrimary, marginTop: 20, textAlign: 'center' }}>{transcript}</Text> : null}
      </View>
    </Modal>
  );
}

function AuthApp() {
  const { isAuthenticated, isInitialized } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [showInit, setShowInit] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  if (showSplash) {
    return <SplashScreen onFinished={() => { setShowSplash(false); setShowInit(true); }} />;
  }

  if (showInit) {
    return <InitializationScreen onFinished={(authenticated: boolean) => { setShowInit(false); }} />;
  }

  if (!isInitialized) {
    return (
      <View style={{ flex: 1, backgroundColor: '#212121', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="small" color="#10a37f" />
      </View>
    );
  }

  if (!isAuthenticated) {
    if (showForgotPassword) {
      return <ForgotPasswordScreen onBack={() => setShowForgotPassword(false)} />;
    }
    if (showSignup) {
      return <SignupScreen onSwitchToLogin={() => setShowSignup(false)} onLoggedIn={() => setShowSignup(false)} />;
    }
    return <LoginScreen onSwitchToSignup={() => setShowSignup(true)} onLoggedIn={() => {}} />;
  }

  return <MainApp />;
}

function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={AuthApp} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppProvider>
          <AppNavigator />
        </AppProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { height: 56, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1 },
  menuBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalSheet: { borderRadius: 16, borderWidth: 1, padding: 20, width: '90%', maxWidth: 400, maxHeight: '80%' },
  settingsModal: { borderRadius: 16, borderWidth: 1, padding: 20, width: '92%', maxWidth: 480, maxHeight: '85%' },
});
