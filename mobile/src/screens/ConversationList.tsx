import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  TextInput,
} from 'react-native';
import { Conversation, GroupedConversations } from '@dotvex/shared';
import { useApp } from '../context/AppContext';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  activeConversationId: string | null;
}

export function ConversationList({ onSelectConversation, onNewChat, activeConversationId }: Props) {
  const { theme, conversationService } = useApp();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [grouped, setGrouped] = useState<GroupedConversations[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const colors = theme.colors;

  const loadConversations = useCallback(async () => {
    try {
      const list = await conversationService.getConversations();
      setConversations(list);
      setGrouped(conversationService.groupConversations(list));
    } catch (err) {
      console.warn('Failed to load conversations:', err);
    }
  }, [conversationService]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const handleDelete = useCallback(
    async (id: string) => {
      await conversationService.deleteConversation(id);
      loadConversations();
    },
    [conversationService, loadConversations]
  );

  const renderConversation = useCallback(
    ({ item }: { item: Conversation }) => {
      const isActive = item.id === activeConversationId;
      return (
        <TouchableOpacity
          style={[
            styles.convItem,
            isActive && { backgroundColor: colors.surfaceVariant },
          ]}
          onPress={() => onSelectConversation(item.id)}
        >
          <Ionicons name="chatbubble-outline" size={18} color={isActive ? colors.accent : colors.icon} />
          <View style={styles.convText}>
            <Text
              style={[styles.convTitle, { color: colors.text }]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            {item.lastMessagePreview ? (
              <Text style={[styles.convPreview, { color: colors.textMuted }]} numberOfLines={1}>
                {item.lastMessagePreview}
              </Text>
            ) : null}
          </View>
          <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
            <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </TouchableOpacity>
      );
    },
    [activeConversationId, colors, handleDelete, onSelectConversation]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>DOTVEX 2.0</Text>
        <TouchableOpacity onPress={onNewChat} style={[styles.newBtn, { backgroundColor: colors.accent }]}>
          <Ionicons name="add" size={20} color={colors.accentText} />
        </TouchableOpacity>
      </View>

      <View style={[styles.searchBox, { backgroundColor: colors.surfaceVariant }]}>
        <Ionicons name="search" size={16} color={colors.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search conversations..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={conversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  newBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 14,
  },
  list: {
    paddingHorizontal: 12,
  },
  convItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 10,
  },
  convText: {
    flex: 1,
  },
  convTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  convPreview: {
    fontSize: 12,
    marginTop: 2,
  },
  deleteBtn: {
    padding: 4,
  },
});
