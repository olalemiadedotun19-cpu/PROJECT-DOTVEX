import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { DotvexTheme } from '../theme';
import { DotvexLogo } from './DotvexLogo';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  onSelectPrompt: (prompt: string) => void;
  theme: DotvexTheme;
}

const suggestions = [
  { title: 'Analyze Architecture', subtitle: 'Evaluate memory retention & local quantization', prompt: 'Compare local edge inference architectures against cloud proxy models in terms of latency, privacy, and token cost.', icon: 'code-slash', color: '#10a37f' },
  { title: 'Build Autonomous Loop', subtitle: 'Design step-by-step reasoning and self-healing code', prompt: 'Write a robust TypeScript async execution pipeline with error recovery and performance telemetry.', icon: 'sparkles', color: '#a855f7' },
  { title: 'Cognition Graph Audit', subtitle: 'Organize persistent project concepts', prompt: 'How does DOTVEX 2.0 maintain persistent memory in the Cognition Lab across sessions?', icon: 'compass', color: '#3b82f6' },
  { title: 'Executive Summary', subtitle: 'Synthesize complex papers or data tables', prompt: 'Generate an executive summary of modern reasoning paradigms with mathematical step complexity.', icon: 'bulb', color: '#f59e0b' },
];

export function EmptyState({ onSelectPrompt, theme }: Props) {
  const c = theme.colors;

  return (
    <View style={styles.container}>
      <View style={{ alignItems: 'center', marginBottom: 28 }}>
        <DotvexLogo size="lg" showText={false} showBadge={false} />
        <Text style={[styles.title, { color: c.textPrimary }]}>What can I help with today?</Text>
        <Text style={[styles.subtitle, { color: c.textMuted }]}>DOTVEX 2.0 • Created by Dotman (Olalemi Michael Adedotun)</Text>
      </View>

      <View style={styles.grid}>
        {suggestions.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.card, { backgroundColor: theme.dark ? '#282828' : '#f7f7f8', borderColor: theme.dark ? '#333' : '#e5e5e5' }]}
            onPress={() => onSelectPrompt(item.prompt)}
          >
            <View style={[styles.iconWrap, { backgroundColor: theme.dark ? '#212121' : '#ffffff', borderColor: theme.dark ? '#383838' : '#e5e5e5' }]}>
              <Ionicons name={item.icon as any} size={16} color={item.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: c.textPrimary }]}>{item.title}</Text>
              <Text style={[styles.cardSub, { color: c.textMuted }]} numberOfLines={1}>{item.subtitle}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16, paddingHorizontal: 24 },
  title: { fontSize: 20, fontWeight: 'bold', marginTop: 16, textAlign: 'center' },
  subtitle: { fontSize: 11, marginTop: 4, textAlign: 'center' },
  grid: { width: '100%', maxWidth: 500, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 14, borderWidth: 1, width: '48%' },
  iconWrap: { padding: 8, borderRadius: 10, borderWidth: 1 },
  cardTitle: { fontSize: 12, fontWeight: '600' },
  cardSub: { fontSize: 10, marginTop: 2 },
});
