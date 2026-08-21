import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  TextInput,
  Modal,
} from 'react-native';
import { MemoryItem, CognitionLabStats, MemoryCategory } from '@dotvex/shared';
import { useApp } from '../context/AppContext';
import { Ionicons } from '@expo/vector-icons';

export function CognitionLab() {
  const { theme, cognitionService } = useApp();
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [stats, setStats] = useState<CognitionLabStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MemoryCategory | 'all'>('all');
  const [isAdding, setIsAdding] = useState(false);
  const [editingMemory, setEditingMemory] = useState<MemoryItem | null>(null);
  const [newConcept, setNewConcept] = useState('');
  const [newContent, setNewContent] = useState('');
  const colors = theme.colors;

  const loadData = useCallback(async () => {
    try {
      const [mem, st] = await Promise.all([
        cognitionService.getMemories(),
        cognitionService.getStats(),
      ]);
      setMemories(mem);
      setStats(st);
    } catch (err) {
      console.warn('Failed to load cognition data:', err);
    }
  }, [cognitionService]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = useCallback(async () => {
    if (!newConcept.trim() || !newContent.trim()) return;
    await cognitionService.addMemory({
      concept: newConcept.trim(),
      category: 'fact',
      content: newContent.trim(),
      confidence: 0.85,
      importance: 0.5,
      tags: [],
    });
    setNewConcept('');
    setNewContent('');
    setIsAdding(false);
    loadData();
  }, [newConcept, newContent, cognitionService, loadData]);

  const handleDelete = useCallback(
    async (id: string) => {
      await cognitionService.deleteMemory(id);
      loadData();
    },
    [cognitionService, loadData]
  );

  const filtered = memories.filter((m) => {
    const matchesCat = selectedCategory === 'all' || m.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      !q ||
      m.concept.toLowerCase().includes(q) ||
      m.content.toLowerCase().includes(q) ||
      m.tags.some((t) => t.toLowerCase().includes(q));
    return matchesCat && matchesQuery;
  });

  const categories: { key: MemoryCategory | 'all'; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'preference', label: 'Preferences' },
    { key: 'fact', label: 'Facts' },
    { key: 'project', label: 'Projects' },
    { key: 'instruction', label: 'Instructions' },
    { key: 'entity', label: 'Entities' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Cognition Lab</Text>
        <TouchableOpacity onPress={() => setIsAdding(true)} style={[styles.addBtn, { backgroundColor: colors.accent }]}>
          <Ionicons name="add" size={18} color={colors.accentText} />
        </TouchableOpacity>
      </View>

      {stats && (
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.surfaceVariant }]}>
            <Text style={[styles.statValue, { color: colors.text }]}>{stats.totalMemories}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Memories</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surfaceVariant }]}>
            <Text style={[styles.statValue, { color: colors.accent }]}>{stats.activeConcepts}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Concepts</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surfaceVariant }]}>
            <Text style={[styles.statValue, { color: colors.accent }]}>
              {stats.totalMemories > 0 ? `${(stats.averageConfidence * 100).toFixed(0)}%` : '—'}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Confidence</Text>
          </View>
        </View>
      )}

      <View style={[styles.searchBox, { backgroundColor: colors.surfaceVariant }]}>
        <Ionicons name="search" size={16} color={colors.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search concepts..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.categories}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={[
              styles.catBtn,
              selectedCategory === cat.key && { backgroundColor: colors.accent },
            ]}
            onPress={() => setSelectedCategory(cat.key)}
          >
            <Text
              style={[
                styles.catText,
                { color: selectedCategory === cat.key ? colors.accentText : colors.textSecondary },
              ]}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={[styles.memoryCard, { backgroundColor: colors.surfaceVariant }]}>
            <View style={styles.memoryHeader}>
              <View>
                <Text style={[styles.memoryCategory, { color: colors.accent }]}>{item.category}</Text>
                <Text style={[styles.memoryConcept, { color: colors.text }]}>{item.concept}</Text>
              </View>
              <TouchableOpacity onPress={() => handleDelete(item.id)}>
                <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.memoryContent, { color: colors.textSecondary }]}>{item.content}</Text>
            <View style={styles.memoryFooter}>
              <Text style={[styles.memoryMeta, { color: colors.textMuted }]}>
                Confidence {(item.confidence * 100).toFixed(0)}%
              </Text>
              <Text style={[styles.memoryMeta, { color: colors.textMuted }]}>
                {item.sourceType === 'explicit' ? 'explicit' : 'inferred'}
              </Text>
            </View>
          </View>
        )}
      />

      <Modal visible={isAdding} transparent animationType="fade">
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>New Concept</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.inputBackground, color: colors.text }]}
              placeholder="Concept"
              placeholderTextColor={colors.textMuted}
              value={newConcept}
              onChangeText={setNewConcept}
            />
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.inputBackground, color: colors.text }]}
              placeholder="Content"
              placeholderTextColor={colors.textMuted}
              value={newContent}
              onChangeText={setNewContent}
              multiline
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setIsAdding(false)} style={styles.modalBtn}>
                <Text style={{ color: colors.textSecondary }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCreate} style={[styles.modalBtn, { backgroundColor: colors.accent }]}>
                <Text style={{ color: colors.accentText }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: { fontSize: 18, fontWeight: 'bold' },
  statLabel: { fontSize: 11, marginTop: 2 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 8,
  },
  searchInput: { flex: 1, paddingVertical: 8, fontSize: 14 },
  categories: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 10,
  },
  catBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  catText: { fontSize: 12, fontWeight: '600' },
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  memoryCard: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  memoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  memoryCategory: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  memoryConcept: { fontSize: 14, fontWeight: 'bold', marginTop: 2 },
  memoryContent: { fontSize: 13, marginTop: 8, lineHeight: 18 },
  memoryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  memoryMeta: { fontSize: 11 },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 14 },
  modalInput: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    fontSize: 14,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
  modalBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
});
