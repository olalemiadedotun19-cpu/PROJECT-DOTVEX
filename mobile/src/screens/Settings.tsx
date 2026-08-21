import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import { ACCENT_COLORS } from '../theme';

const ACCENT_KEYS = Object.keys(ACCENT_COLORS) as Array<keyof typeof ACCENT_COLORS>;

export function Settings() {
  const { theme, settings, updateSettings } = useApp();
  const colors = theme.colors;

  const toggleTheme = useCallback(() => {
    updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' });
  }, [settings.theme, updateSettings]);

  const setAccent = useCallback(
    (accent: any) => updateSettings({ accentColor: accent }),
    [updateSettings]
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>APPEARANCE</Text>
        <View style={[styles.card, { backgroundColor: colors.surfaceVariant }]}>
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: colors.text }]}>Dark Mode</Text>
            <Switch
              value={settings.theme === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.accent }}
            />
          </View>
          <Text style={[styles.rowLabel, { color: colors.text, marginTop: 14 }]}>Accent Color</Text>
          <View style={styles.accentRow}>
            {ACCENT_KEYS.map((key) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.accentDot,
                  { backgroundColor: ACCENT_COLORS[key] },
                  settings.accentColor === key && styles.accentDotActive,
                ]}
                onPress={() => setAccent(key)}
              />
            ))}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>AI CONFIGURATION</Text>
        <View style={[styles.card, { backgroundColor: colors.surfaceVariant }]}>
          <Text style={[styles.rowLabel, { color: colors.text }]}>Temperature</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text }]}
            value={String(settings.ai.temperature)}
            onChangeText={(t) => updateSettings({ ai: { ...settings.ai, temperature: parseFloat(t) || 0.7 } })}
            keyboardType="decimal-pad"
          />
          <Text style={[styles.rowLabel, { color: colors.text, marginTop: 10 }]}>Max Tokens</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text }]}
            value={String(settings.ai.maxTokens)}
            onChangeText={(t) => updateSettings({ ai: { ...settings.ai, maxTokens: parseInt(t) || 2048 } })}
            keyboardType="number-pad"
          />
          <View style={[styles.row, { marginTop: 10 }]}>
            <Text style={[styles.rowLabel, { color: colors.text }]}>Reasoning Trace</Text>
            <Switch
              value={settings.ai.enableReasoningTrace}
              onValueChange={(v) => updateSettings({ ai: { ...settings.ai, enableReasoningTrace: v } })}
              trackColor={{ false: colors.border, true: colors.accent }}
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>SERVER CONNECTION</Text>
        <View style={[styles.card, { backgroundColor: colors.surfaceVariant }]}>
          <Text style={[styles.rowLabel, { color: colors.text }]}>API Endpoint</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text }]}
            value={settings.ai.remoteApiEndpoint}
            onChangeText={(t) => updateSettings({ ai: { ...settings.ai, remoteApiEndpoint: t } })}
            placeholder="https://your-server.com"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>ABOUT</Text>
        <View style={[styles.card, { backgroundColor: colors.surfaceVariant }]}>
          <Text style={[styles.aboutText, { color: colors.text }]}>DOTVEX 2.0</Text>
          <Text style={[styles.aboutSub, { color: colors.textMuted }]}>Created by Dotman</Text>
          <Text style={[styles.aboutSub, { color: colors.textMuted }]}>Powered by Qwen3</Text>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  section: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  card: {
    borderRadius: 12,
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  accentRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  accentDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  accentDotActive: {
    borderColor: '#fff',
  },
  input: {
    borderRadius: 8,
    padding: 10,
    marginTop: 6,
    fontSize: 14,
  },
  aboutText: { fontSize: 16, fontWeight: 'bold' },
  aboutSub: { fontSize: 13, marginTop: 2 },
});
