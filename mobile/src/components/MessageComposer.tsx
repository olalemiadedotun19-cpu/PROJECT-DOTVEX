import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
} from 'react-native';
import { DotvexTheme } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { DotvexModelId } from '@dotvex/shared';

interface Props {
  theme: DotvexTheme;
  onSendMessage: (text: string, options?: { enableThinking?: boolean; enableWebSearch?: boolean }) => void;
  onStopGeneration: () => void;
  isGenerating: boolean;
  activeModelId: DotvexModelId;
  onChangeModel: (id: DotvexModelId) => void;
  onOpenVoiceMode: () => void;
  onOpenCodex: () => void;
  onOpenImages: () => void;
  onOpenLibrary: () => void;
  onOpenScheduled: () => void;
  onOpenPlugins: () => void;
}

const MODELS: { id: DotvexModelId; name: string; tag: string; desc: string }[] = [
  { id: 'dotvex-2.0-pro', name: 'DOTVEX 2.0 Pro', tag: 'Default', desc: 'Smart reasoning and multimodal intelligence for all everyday tasks' },
  { id: 'dotvex-2.0-flash', name: 'DOTVEX 2.0 Flash', tag: 'Fast', desc: 'Lightning-fast responses with ultra-low latency execution' },
  { id: 'dotvex-2.0-ultra', name: 'DOTVEX 2.0 Ultra', tag: 'Deep Reasoning', desc: 'Advanced multi-step reasoning, complex code generation and math' },
  { id: 'dotvex-custom-api', name: 'DOTVEX Custom Endpoint', tag: 'Custom', desc: 'Connected to custom local or remote cognitive endpoint' },
];

export function MessageComposer({
  theme,
  onSendMessage,
  onStopGeneration,
  isGenerating,
  activeModelId,
  onChangeModel,
  onOpenVoiceMode,
  onOpenCodex,
  onOpenImages,
  onOpenLibrary,
  onOpenScheduled,
  onOpenPlugins,
}: Props) {
  const c = theme.colors;
  const [text, setText] = useState('');
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [enableThinking, setEnableThinking] = useState(true);
  const [enableWebSearch, setEnableWebSearch] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSendMessage(trimmed, { enableThinking, enableWebSearch });
    setText('');
  };

  return (
    <View style={{ paddingHorizontal: 12, paddingBottom: 8, paddingTop: 4 }}>
      <View style={[styles.composer, { backgroundColor: c.bgComposer, borderColor: c.borderSubtle }]}>
        <TouchableOpacity onPress={() => setShowPlusMenu(true)} style={styles.plusBtn}>
          <Ionicons name="add" size={22} color={c.textMuted} />
        </TouchableOpacity>

        <TextInput
          ref={inputRef}
          style={[styles.input, { color: c.textPrimary }]}
          placeholder="Reply to DOTVEX 2.0..."
          placeholderTextColor={c.textMuted}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={100000}
        />

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {isGenerating ? (
            <TouchableOpacity onPress={onStopGeneration} style={[styles.sendBtn, { backgroundColor: c.accent }]}>
              <Ionicons name="stop" size={16} color={c.accentText} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handleSend} style={[styles.sendBtn, { backgroundColor: text.trim() ? c.accent : c.borderMain }]}>
              <Ionicons name="arrow-up" size={16} color={text.trim() ? c.accentText : c.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, paddingHorizontal: 4 }}>
        <TouchableOpacity onPress={() => setShowModelPicker(true)} style={[styles.pillBtn, { backgroundColor: c.bgCard, borderColor: c.borderSubtle }]}>
          <Text style={{ fontSize: 11, color: c.textSecondary, fontWeight: '600' }}>
            {MODELS.find((m) => m.id === activeModelId)?.name || 'DOTVEX 2.0 Pro'}
          </Text>
          <Ionicons name="chevron-down" size={12} color={c.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setEnableThinking(!enableThinking)} style={[styles.pillBtn, { borderColor: enableThinking ? c.accent : c.borderSubtle, backgroundColor: enableThinking ? (c.dark ? '#10a37f22' : '#10a37f11') : c.bgCard }]}>
          <Ionicons name="bulb-outline" size={13} color={enableThinking ? c.accent : c.textMuted} />
          <Text style={{ fontSize: 11, color: enableThinking ? c.accent : c.textMuted, fontWeight: '600' }}>Think</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setEnableWebSearch(!enableWebSearch)} style={[styles.pillBtn, { borderColor: enableWebSearch ? c.blue : c.borderSubtle, backgroundColor: enableWebSearch ? (c.dark ? '#3b82f622' : '#3b82f611') : c.bgCard }]}>
          <Ionicons name="search-outline" size={13} color={enableWebSearch ? c.blue : c.textMuted} />
          <Text style={{ fontSize: 11, color: enableWebSearch ? c.blue : c.textMuted, fontWeight: '600' }}>Web search</Text>
        </TouchableOpacity>

        <View style={{ flex: 1 }} />

        <TouchableOpacity onPress={onOpenVoiceMode} style={styles.iconBtn}>
          <Ionicons name="mic-outline" size={20} color={c.accent} />
        </TouchableOpacity>
      </View>

      <Text style={{ fontSize: 10, color: c.textMuted, textAlign: 'center', marginTop: 6 }}>
        DOTVEX 2.0 can make mistakes. Verify important information.
      </Text>

      {/* Plus Menu */}
      <Modal visible={showPlusMenu} transparent animationType="fade" onRequestClose={() => setShowPlusMenu(false)}>
        <TouchableOpacity style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.7)' }]} activeOpacity={1} onPress={() => setShowPlusMenu(false)}>
          <View style={[styles.plusMenu, { backgroundColor: c.bgCard, borderColor: c.borderMain }]}>
            <ScrollView>
              <PlusMenuItem icon="chatbubble-outline" label="Choose model" color={c.accent} onPress={() => { setShowPlusMenu(false); setShowModelPicker(true); }} />
              <PlusMenuItem icon="attach-outline" label="Attach files" color={c.textSecondary} onPress={() => setShowPlusMenu(false)} />
              <PlusMenuItem icon="image-outline" label="Images" color={c.textSecondary} onPress={() => { setShowPlusMenu(false); onOpenImages(); }} />
              <PlusMenuItem icon="search-outline" label="Web search" color={c.blue} onPress={() => { setShowPlusMenu(false); setEnableWebSearch(true); }} />
              <PlusMenuItem icon="terminal-outline" label="Codex Sandbox" color={c.textSecondary} onPress={() => { setShowPlusMenu(false); onOpenCodex(); }} />
              <PlusMenuItem icon="time-outline" label="Scheduled prompts" color={c.textSecondary} onPress={() => { setShowPlusMenu(false); onOpenScheduled(); }} />
              <PlusMenuItem icon="book-outline" label="Library" color={c.textSecondary} onPress={() => { setShowPlusMenu(false); onOpenLibrary(); }} />
              <PlusMenuItem icon="grid-outline" label="Plugins & Tools" color={c.textSecondary} onPress={() => { setShowPlusMenu(false); onOpenPlugins(); }} />
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Model Picker */}
      <Modal visible={showModelPicker} transparent animationType="fade" onRequestClose={() => setShowModelPicker(false)}>
        <TouchableOpacity style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.7)' }]} activeOpacity={1} onPress={() => setShowModelPicker(false)}>
          <View style={[styles.modelPicker, { backgroundColor: c.bgCard, borderColor: c.borderMain }]}>
            {MODELS.map((model) => (
              <TouchableOpacity
                key={model.id}
                style={[styles.modelItem, { borderBottomColor: c.borderSubtle }]}
                onPress={() => { onChangeModel(model.id); setShowModelPicker(false); }}
              >
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: c.textPrimary }}>{model.name}</Text>
                    <View style={{ backgroundColor: c.accent, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 }}>
                      <Text style={{ fontSize: 9, color: c.accentText, fontWeight: 'bold' }}>{model.tag}</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>{model.desc}</Text>
                </View>
                {activeModelId === model.id && <Ionicons name="checkmark" size={18} color={c.accent} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

function PlusMenuItem({ icon, label, color, onPress }: { icon: string; label: string; color: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.plusMenuItem} onPress={onPress}>
      <Ionicons name={icon as any} size={20} color={color} />
      <Text style={[styles.plusMenuLabel, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 26,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 6,
    gap: 6,
  },
  plusBtn: { padding: 8 },
  input: { flex: 1, maxHeight: 120, fontSize: 15, paddingVertical: 8, paddingHorizontal: 4 },
  sendBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  pillBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  iconBtn: { padding: 6 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  plusMenu: { borderRadius: 16, borderWidth: 1, padding: 8, width: 260, maxHeight: 400 },
  plusMenuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8 },
  plusMenuLabel: { fontSize: 13, fontWeight: '500' },
  modelPicker: { borderRadius: 16, borderWidth: 1, padding: 8, width: 340, maxHeight: 400 },
  modelItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, gap: 10 },
});
