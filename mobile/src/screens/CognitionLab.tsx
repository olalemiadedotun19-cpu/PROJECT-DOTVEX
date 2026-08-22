import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
} from 'react-native';
import { MemoryItem, MemoryCategory, CognitionLabStats } from '@dotvex/shared';
import { DotvexTheme } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';

interface Props {
  theme: DotvexTheme;
  cognitionService: any;
  onBack: () => void;
}

const categories: { key: MemoryCategory | 'all'; label: string }[] = [
  { key: 'all', label: 'All Knowledge' },
  { key: 'preference', label: 'Preferences' },
  { key: 'fact', label: 'Facts & Data' },
  { key: 'project', label: 'Projects' },
  { key: 'instruction', label: 'Instructions' },
  { key: 'entity', label: 'Entities' },
];

export function CognitionLab({ theme, cognitionService, onBack }: Props) {
  const c = theme.colors;
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [stats, setStats] = useState<CognitionLabStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MemoryCategory | 'all'>('all');
  const [isAdding, setIsAdding] = useState(false);
  const [editingMemory, setEditingMemory] = useState<MemoryItem | null>(null);
  const [newConcept, setNewConcept] = useState('');
  const [newCategory, setNewCategory] = useState<MemoryCategory>('fact');
  const [newContent, setNewContent] = useState('');
  const [newConfidence, setNewConfidence] = useState(0.85);
  const [newImportance, setNewImportance] = useState(0.5);
  const [newTags, setNewTags] = useState('');
  const [editSourceType, setEditSourceType] = useState<'explicit' | 'inferred'>('explicit');

  const loadData = useCallback(async () => {
    try {
      const [mem, st] = await Promise.all([cognitionService.getMemories(), cognitionService.getStats()]);
      setMemories(mem);
      setStats(st);
    } catch (err) { console.warn('Failed to load cognition data:', err); }
  }, [cognitionService]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreate = useCallback(async () => {
    if (!newConcept.trim() || !newContent.trim()) return;
    await cognitionService.addMemory({ concept: newConcept.trim(), category: newCategory, content: newContent.trim(), confidence: newConfidence, importance: newImportance, tags: newTags.split(',').map((t) => t.trim()).filter(Boolean) });
    setNewConcept(''); setNewContent(''); setNewTags(''); setNewConfidence(0.85); setNewImportance(0.5);
    setIsAdding(false);
    loadData();
  }, [newConcept, newContent, newCategory, newConfidence, newImportance, newTags, cognitionService, loadData]);

  const handleDelete = useCallback(async (id: string) => {
    await cognitionService.deleteMemory(id);
    loadData();
  }, [cognitionService, loadData]);

  const handleEdit = useCallback((mem: MemoryItem) => {
    setEditingMemory(mem);
    setNewConcept(mem.concept); setNewCategory(mem.category); setNewContent(mem.content);
    setNewConfidence(mem.confidence); setNewImportance(mem.importance ?? 0.5);
    setNewTags((mem.tags || []).join(', '));
    setEditSourceType(mem.sourceType ?? 'explicit');
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editingMemory) return;
    await cognitionService.updateMemory(editingMemory.id, { concept: newConcept, category: newCategory, content: newContent, confidence: newConfidence, importance: newImportance, tags: newTags.split(',').map((t) => t.trim()).filter(Boolean), sourceType: editSourceType, evidenceCount: editingMemory.evidenceCount ?? 1 });
    setEditingMemory(null);
    loadData();
  }, [editingMemory, newConcept, newContent, newCategory, newConfidence, newImportance, newTags, editSourceType, cognitionService, loadData]);

  const filtered = memories.filter((m) => {
    const matchesCat = selectedCategory === 'all' || m.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchesQuery = !q || m.concept.toLowerCase().includes(q) || m.content.toLowerCase().includes(q) || m.tags.some((t) => t.toLowerCase().includes(q));
    return matchesCat && matchesQuery;
  });

  return (
    <View style={[styles.container, { backgroundColor: c.bgMain }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: c.dark ? '#0c0e15' : '#ffffff', borderBottomColor: c.borderMain }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity onPress={onBack} style={[styles.backBtn, { borderColor: c.dark ? '#374151' : '#e5e5e5', backgroundColor: c.dark ? '#151822' : '#ffffff' }]}>
            <Ionicons name="arrow-back" size={16} color={c.textSecondary} />
            <Text style={{ fontSize: 12, fontWeight: '600', color: c.textSecondary }}>Chat</Text>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="bulb" size={18} color={c.blue} />
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: c.textPrimary }}>Cognition Lab</Text>
            <View style={{ backgroundColor: c.blue + '18', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4 }}>
              <Text style={{ fontSize: 9, fontWeight: 'bold', color: c.blue, fontFamily: 'monospace' }}>DOTVEX 2.0</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity onPress={() => setIsAdding(true)} style={[styles.newBtn, { backgroundColor: c.blue }]}>
          <Ionicons name="add" size={16} color="white" />
          <Text style={{ fontSize: 11, fontWeight: 'bold', color: 'white' }}>New Concept</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Stats */}
        <View style={styles.statsGrid}>
          <StatCard label="Total Memories" value={stats?.totalMemories?.toString() || '0'} theme={theme} />
          <StatCard label="Active Concepts" value={stats?.activeConcepts?.toString() || '0'} theme={theme} valueColor={c.blue} />
          <StatCard label="Avg Confidence" value={stats && stats.totalMemories > 0 ? `${(stats.averageConfidence * 100).toFixed(0)}%` : '—'} theme={theme} valueColor={c.blue} />
          <StatCard label="Cognitive Engine" value="DOTVEX 2.0" theme={theme} small />
          <StatCard label="Explicit" value={(stats?.explicitCount ?? 0).toString()} theme={theme} valueColor={c.blue} />
          <StatCard label="Inferred" value={(stats?.inferredCount ?? 0).toString()} theme={theme} valueColor={c.purple} />
        </View>

        {/* Filters */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: 12, flexWrap: 'wrap' }}>
          {categories.map((cat) => (
            <TouchableOpacity key={cat.key} onPress={() => setSelectedCategory(cat.key)} style={[styles.catBtn, { backgroundColor: selectedCategory === cat.key ? c.blue : c.bgCard, borderColor: selectedCategory === cat.key ? c.blue : c.borderMain }]}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: selectedCategory === cat.key ? 'white' : c.textSecondary }}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.searchBox, { backgroundColor: c.bgCard, borderColor: c.borderMain }]}>
          <Ionicons name="search" size={16} color={c.textMuted} />
          <TextInput style={[styles.searchInput, { color: c.textPrimary }]} placeholder="Search concepts or tags..." placeholderTextColor={c.textMuted} value={searchQuery} onChangeText={setSearchQuery} />
        </View>

        {/* Add/Edit Form */}
        {(isAdding || editingMemory) && (
          <View style={[styles.formBox, { backgroundColor: c.bgCard, borderColor: c.blue + '40' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ fontSize: 13, fontWeight: 'bold', color: c.textPrimary }}>{editingMemory ? 'Edit Memory' : 'Register New Knowledge Concept'}</Text>
              <TouchableOpacity onPress={() => { setIsAdding(false); setEditingMemory(null); }}>
                <Ionicons name="close" size={18} color={c.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Concept Identifier</Text>
                  <TextInput style={[styles.formInput, { backgroundColor: c.bgInput, color: c.textPrimary, borderColor: c.dark ? '#374151' : '#e5e5e5' }]} value={newConcept} onChangeText={setNewConcept} placeholder="e.g. Preferred Coding Style" placeholderTextColor={c.textMuted} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Category</Text>
                  <View style={[styles.picker, { backgroundColor: c.bgInput, borderColor: c.dark ? '#374151' : '#e5e5e5' }]}>
                    <Text style={{ fontSize: 12, color: c.textPrimary }}>{newCategory}</Text>
                  </View>
                </View>
              </View>

              <Text style={styles.formLabel}>Memory Content</Text>
              <TextInput style={[styles.formInput, { backgroundColor: c.bgInput, color: c.textPrimary, borderColor: c.dark ? '#374151' : '#e5e5e5', minHeight: 60 }]} value={newContent} onChangeText={setNewContent} multiline placeholder="Details of the learned concept or fact..." placeholderTextColor={c.textMuted} />

              <Text style={styles.formLabel}>Tags (comma-separated)</Text>
              <TextInput style={[styles.formInput, { backgroundColor: c.bgInput, color: c.textPrimary, borderColor: c.dark ? '#374151' : '#e5e5e5' }]} value={newTags} onChangeText={setNewTags} placeholder="typescript, architecture, dotvex" placeholderTextColor={c.textMuted} />

              <View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={styles.formLabel}>Confidence Score</Text>
                  <Text style={{ fontSize: 11, fontWeight: 'bold', color: c.blue, fontFamily: 'monospace' }}>{(newConfidence * 100).toFixed(0)}%</Text>
                </View>
                <Slider style={{ width: '100%', height: 30 }} minimumValue={0.1} maximumValue={1.0} step={0.05} value={newConfidence} onValueChange={setNewConfidence} minimumTrackTintColor={c.blue} maximumTrackTintColor={c.borderMain} thumbTintColor={c.blue} />
              </View>

              <View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={styles.formLabel}>Importance</Text>
                  <Text style={{ fontSize: 11, fontWeight: 'bold', color: c.amber, fontFamily: 'monospace' }}>{(newImportance * 100).toFixed(0)}%</Text>
                </View>
                <Slider style={{ width: '100%', height: 30 }} minimumValue={0} maximumValue={1} step={0.05} value={newImportance} onValueChange={setNewImportance} minimumTrackTintColor={c.amber} maximumTrackTintColor={c.borderMain} thumbTintColor={c.amber} />
              </View>

              {editingMemory && (
                <View>
                  <Text style={styles.formLabel}>Source Type</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity onPress={() => setEditSourceType('explicit')} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: editSourceType === 'explicit' ? c.blue : c.bgInput, borderWidth: 1, borderColor: editSourceType === 'explicit' ? c.blue : c.borderMain }}>
                      <Text style={{ fontSize: 11, color: editSourceType === 'explicit' ? 'white' : c.textSecondary, fontWeight: '500' }}>Explicit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setEditSourceType('inferred')} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: editSourceType === 'inferred' ? c.purple : c.bgInput, borderWidth: 1, borderColor: editSourceType === 'inferred' ? c.purple : c.borderMain }}>
                      <Text style={{ fontSize: 11, color: editSourceType === 'inferred' ? 'white' : c.textSecondary, fontWeight: '500' }}>Inferred</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
              <TouchableOpacity onPress={() => { setIsAdding(false); setEditingMemory(null); }} style={[styles.formBtn, { borderColor: c.dark ? '#374151' : '#e5e5e5' }]}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: c.textSecondary }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={editingMemory ? handleSaveEdit : handleCreate} style={[styles.formBtn, { backgroundColor: c.blue }]}>
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: 'white' }}>{editingMemory ? 'Save Changes' : 'Save Concept'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Memory Cards */}
        {filtered.length === 0 ? (
          <View style={[styles.emptyState, { borderColor: c.borderMain }]}>
            <Ionicons name="bulb-outline" size={40} color={c.textMuted} />
            <Text style={{ fontSize: 13, fontWeight: 'bold', color: c.textSecondary, marginTop: 8 }}>No Concepts in Cognition Lab</Text>
            <Text style={{ fontSize: 11, color: c.textMuted, textAlign: 'center', marginTop: 4 }}>DOTVEX 2.0 stores persistent memories here.</Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {filtered.map((mem) => (
              <View key={mem.id} style={[styles.memoryCard, { backgroundColor: c.bgCard, borderColor: c.borderMain }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <View style={{ backgroundColor: c.blue + '18', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                        <Text style={{ fontSize: 9, fontWeight: 'bold', color: c.blue, textTransform: 'uppercase' }}>{mem.category}</Text>
                      </View>
                      {mem.lifespan && (
                        <Text style={{ fontSize: 9, fontWeight: '500', color: mem.lifespan === 'permanent' ? c.amber : mem.lifespan === 'long_term' ? c.emerald : c.textMuted }}>
                          {mem.lifespan}
                        </Text>
                      )}
                    </View>
                    <Text style={{ fontSize: 13, fontWeight: 'bold', color: c.textPrimary }}>{mem.concept}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 4 }}>
                    <TouchableOpacity onPress={() => handleEdit(mem)} style={{ padding: 6 }}>
                      <Ionicons name="create-outline" size={14} color={c.textMuted} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(mem.id)} style={{ padding: 6 }}>
                      <Ionicons name="trash-outline" size={14} color={c.textMuted} />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={{ fontSize: 12, color: c.textSecondary, lineHeight: 18, marginTop: 8 }}>{mem.content}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: c.dark ? '#111827' : '#f3f4f6' }}>
                  <View style={{ flexDirection: 'row', gap: 4, flex: 1, flexWrap: 'wrap' }}>
                    {mem.tags.slice(0, 3).map((tag, idx) => (
                      <Text key={idx} style={{ fontSize: 10, backgroundColor: c.dark ? '#1f2937' : '#f3f4f6', color: c.textMuted, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>#{tag}</Text>
                    ))}
                  </View>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <Text style={{ fontSize: 10, color: c.blue, fontWeight: 'bold' }}>{(mem.confidence * 100).toFixed(0)}%</Text>
                    <Text style={{ fontSize: 10, color: mem.sourceType === 'explicit' ? c.emerald : c.purple, fontWeight: 'bold' }}>{mem.sourceType === 'explicit' ? 'explicit' : 'inferred'}</Text>
                    <Text style={{ fontSize: 10, color: c.textMuted }}>{mem.evidenceCount ?? 1}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function StatCard({ label, value, theme, valueColor, small }: { label: string; value: string; theme: DotvexTheme; valueColor?: string; small?: boolean }) {
  const c = theme.colors;
  return (
    <View style={[styles.statCard, { backgroundColor: c.bgCard, borderColor: c.borderMain }]}>
      <Text style={{ fontSize: 10, fontWeight: '500', color: c.textMuted }}>{label}</Text>
      <Text style={[{ fontSize: small ? 11 : 18, fontWeight: 'bold', color: valueColor || c.textPrimary, marginTop: 4 }, small && { fontSize: 11 }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  newBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statCard: { width: '48%', padding: 12, borderRadius: 14, borderWidth: 1 },
  catBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, marginVertical: 12 },
  searchInput: { flex: 1, fontSize: 12 },
  formBox: { padding: 16, borderRadius: 18, borderWidth: 1, marginBottom: 12 },
  formLabel: { fontSize: 11, fontWeight: 'bold', color: '#374151', marginBottom: 4 },
  formInput: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, fontSize: 12 },
  picker: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  formBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: 'transparent' },
  emptyState: { padding: 48, alignItems: 'center', borderRadius: 18, borderWidth: 1, borderStyle: 'dashed' },
  memoryCard: { padding: 14, borderRadius: 14, borderWidth: 1 },
});
