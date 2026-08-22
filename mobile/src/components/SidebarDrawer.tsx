import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
} from 'react-native';
import { Conversation, GroupedConversations } from '@dotvex/shared';
import { DotvexTheme } from '../theme';
import { DotvexLogo } from '../components/DotvexLogo';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  theme: DotvexTheme;
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
  onRenameConversation: (id: string, title: string) => void;
  onDeleteConversation: (id: string) => void;
  onToggleTheme: () => void;
  onClose: () => void;
}

export function SidebarDrawer({
  theme,
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
  onToggleTheme,
  onClose,
}: Props) {
  const c = theme.colors;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [showMore, setShowMore] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const pinned = conversations.filter((conv) => conv.isPinned);

  const startRename = (conv: Conversation) => {
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const saveRename = (id: string) => {
    if (editTitle.trim()) onRenameConversation(id, editTitle.trim());
    setEditingId(null);
  };

  const navItem = (icon: string, label: string, onPress: () => void, color?: string) => (
    <TouchableOpacity style={styles.navItem} onPress={() => { onPress(); onClose(); }}>
      <Ionicons name={icon as any} size={16} color={color || c.textSecondary} />
      <Text style={[styles.navLabel, { color: color || c.textSecondary }]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: c.bgSidebar, borderRightColor: c.borderMain }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: c.borderSubtle }]}>
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }} onPress={() => { onNewChat(); onClose(); }}>
          <DotvexLogo size="sm" showText={false} showBadge={false} />
          <Text style={[styles.brand, { color: c.textPrimary }]}>DOTVEX 2.0</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <TouchableOpacity onPress={() => { onOpenSearch(); onClose(); }} style={styles.iconBtn}>
            <Ionicons name="search-outline" size={16} color={c.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
            <Ionicons name="close-outline" size={18} color={c.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Nav Items */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: 8 }}>
        <View style={{ paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: c.borderSubtle, paddingBottom: 8 }}>
          {navItem('create-outline', 'New chat', onNewChat, c.emerald)}
          {navItem('image-outline', 'Images', onOpenImages)}
          {navItem('book-outline', 'Library', onOpenLibrary)}
          {navItem('time-outline', 'Scheduled', onOpenScheduled)}
          {navItem('at-outline', 'Plugins & Tools', onOpenPlugins)}
          {navItem('folder-outline', 'Projects', onOpenProjects)}
          {navItem('terminal-outline', 'Codex Sandbox', onOpenCodex)}

          <TouchableOpacity style={styles.navItem} onPress={() => setShowMore(!showMore)}>
            <Ionicons name="ellipsis-horizontal" size={16} color={c.textSecondary} />
            <Text style={[styles.navLabel, { color: c.textSecondary }]}>More</Text>
            <View style={{ flex: 1 }} />
            <Ionicons name={showMore ? 'chevron-up' : 'chevron-down'} size={14} color={c.textMuted} />
          </TouchableOpacity>

          {showMore && (
            <View style={{ backgroundColor: c.dark ? '#212121' : '#ffffff', borderRadius: 10, borderWidth: 1, borderColor: c.borderSubtle, padding: 4, marginTop: 2 }}>
              {navItem('bulb-outline', 'Cognition Lab', onOpenCognitionLab, c.blue)}
              {navItem('settings-outline', 'Settings', onOpenSettings, c.emerald)}
            </View>
          )}
        </View>

        {/* Pinned */}
        {pinned.length > 0 && (
          <View style={{ marginTop: 12 }}>
            <Text style={[styles.groupLabel, { color: c.textMuted }]}>PINNED</Text>
            {pinned.map((conv) => (
              <ConversationRow
                key={conv.id}
                conv={conv}
                active={activeConversationId === conv.id}
                editing={editingId === conv.id}
                editTitle={editTitle}
                setEditTitle={setEditTitle}
                onSelect={() => { onSelectConversation(conv.id); onClose(); }}
                onTogglePin={() => onTogglePin(conv.id)}
                onRename={() => startRename(conv)}
                onDelete={() => onDeleteConversation(conv.id)}
                onSaveRename={() => saveRename(conv.id)}
                theme={theme}
              />
            ))}
          </View>
        )}

        {/* Conversation Groups */}
        {groupedConversations.map((group) => (
          <View key={group.group} style={{ marginTop: 12 }}>
            <Text style={[styles.groupLabel, { color: c.textMuted }]}>
              {group.group === 'Today' ? 'RECENTS' : group.group.toUpperCase()}
            </Text>
            {group.conversations.map((conv) => (
              <ConversationRow
                key={conv.id}
                conv={conv}
                active={activeConversationId === conv.id}
                editing={editingId === conv.id}
                editTitle={editTitle}
                setEditTitle={setEditTitle}
                onSelect={() => { onSelectConversation(conv.id); onClose(); }}
                onTogglePin={() => onTogglePin(conv.id)}
                onRename={() => startRename(conv)}
                onDelete={() => onDeleteConversation(conv.id)}
                onSaveRename={() => saveRename(conv.id)}
                theme={theme}
              />
            ))}
          </View>
        ))}
      </ScrollView>

      {/* User Profile */}
      <View style={[styles.userSection, { borderTopColor: c.borderSubtle }]}>
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 8, borderRadius: 12 }} onPress={() => setShowUserMenu(!showUserMenu)}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={styles.avatar}>
              <Text style={{ color: 'white', fontSize: 11, fontWeight: 'bold' }}>OA</Text>
            </View>
            <View>
              <Text style={{ fontSize: 12, fontWeight: '600', color: c.textPrimary }}>Olalemi Adedotun</Text>
              <Text style={{ fontSize: 10, color: c.textMuted }}>Dotman</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => { onOpenUpgrade(); onClose(); }} style={[styles.upgradeBtn, { backgroundColor: c.dark ? '#2a2a2a' : '#e5e5e5', borderColor: c.dark ? '#383838' : '#d5d5d5' }]}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: c.textPrimary }}>Upgrade</Text>
          </TouchableOpacity>
        </TouchableOpacity>

        {showUserMenu && (
          <View style={[styles.userMenu, { backgroundColor: c.dark ? '#212121' : '#ffffff', borderColor: c.borderSubtle }]}>
            {navItem('settings-outline', 'Settings & Preferences', onOpenSettings)}
            {navItem(theme.dark ? 'sunny-outline' : 'moon-outline', theme.dark ? 'Switch to Light Theme' : 'Switch to Dark Theme', onToggleTheme)}
            {navItem('bulb-outline', 'Cognition Lab Graph', onOpenCognitionLab, c.blue)}
            <View style={{ height: 1, backgroundColor: c.borderSubtle, marginVertical: 4 }} />
            {navItem('log-out-outline', 'Clear Local Data', () => {}, c.red)}
          </View>
        )}
      </View>
    </View>
  );
}

function ConversationRow({
  conv,
  active,
  editing,
  editTitle,
  setEditTitle,
  onSelect,
  onTogglePin,
  onRename,
  onDelete,
  onSaveRename,
  theme,
}: any) {
  const c = theme.colors;
  return (
    <TouchableOpacity
      style={[styles.convRow, active && { backgroundColor: c.dark ? '#212121' : '#eaeaea' }]}
      onPress={onSelect}
    >
      {editing ? (
        <TextInput
          style={[styles.renameInput, { backgroundColor: c.dark ? '#181818' : '#f4f4f4', color: c.textPrimary }]}
          value={editTitle}
          onChangeText={setEditTitle}
          onBlur={() => onSaveRename()}
          onSubmitEditing={() => onSaveRename()}
          autoFocus
        />
      ) : (
        <>
          <Ionicons name="chatbubble-outline" size={13} color={active ? c.textPrimary : c.textMuted} />
          <Text style={[styles.convTitle, { color: active ? c.textPrimary : c.textSecondary }]} numberOfLines={1}>{conv.title}</Text>
        </>
      )}
      {!editing && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
          <TouchableOpacity onPress={onTogglePin} style={{ padding: 3 }}>
            <Ionicons name="pin-outline" size={11} color={c.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onRename} style={{ padding: 3 }}>
            <Ionicons name="create-outline" size={11} color={c.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete} style={{ padding: 3 }}>
            <Ionicons name="trash-outline" size={11} color={c.textMuted} />
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: 300 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 14, borderBottomWidth: 1 },
  brand: { fontSize: 13, fontWeight: 'bold', letterSpacing: -0.2 },
  iconBtn: { padding: 6 },
  navItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8 },
  navLabel: { fontSize: 12, fontWeight: '500' },
  groupLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, paddingHorizontal: 10, paddingVertical: 6 },
  convRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8 },
  convTitle: { fontSize: 12, flex: 1 },
  renameInput: { flex: 1, fontSize: 12, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4 },
  userSection: { borderTopWidth: 1, padding: 10 },
  avatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#10a37f', alignItems: 'center', justifyContent: 'center' },
  upgradeBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 14, borderWidth: 1 },
  userMenu: { borderRadius: 12, borderWidth: 1, padding: 6, marginTop: 6 },
});
