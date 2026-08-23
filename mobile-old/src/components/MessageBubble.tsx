import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChatMessage } from '@dotvex/shared';
import { DotvexTheme } from '../theme';
import { MarkdownRenderer } from './MarkdownRenderer';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  message: ChatMessage;
  theme: DotvexTheme;
  onRegenerate?: (id: string) => void;
  onEdit?: (content: string) => void;
  onOpenCodexWithCode?: (code: string) => void;
}

export function MessageBubble({ message, theme, onRegenerate, onEdit }: Props) {
  const c = theme.colors;
  const isAssistant = message.role === 'assistant';
  const [copied, setCopied] = useState(false);
  const [isSavedToLibrary, setIsSavedToLibrary] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isReasoningOpen, setIsReasoningOpen] = useState(false);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isAssistant) {
    return (
      <View style={[styles.container, styles.userContainer]}>
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          <View style={[styles.userBubble, { backgroundColor: c.userBubble, borderColor: c.borderSubtle }]}>
            {message.attachments && message.attachments.length > 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                {message.attachments.map((att) => (
                  <View key={att.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, padding: 6, borderRadius: 10, backgroundColor: theme.dark ? '#212121' : '#ffffff', borderWidth: 1, borderColor: theme.dark ? '#3d3d3d' : '#e4e4e7' }}>
                    <Ionicons name="document-text-outline" size={14} color={c.emerald} />
                    <Text style={{ fontSize: 11, color: c.textPrimary }} numberOfLines={1}>{att.name}</Text>
                  </View>
                ))}
              </View>
            )}
            <Text style={{ fontSize: 14, color: c.userBubbleText, lineHeight: 20 }}>{message.content}</Text>
            {onEdit && (
              <View style={{ alignItems: 'flex-end', marginTop: 2 }}>
                <TouchableOpacity onPress={() => onEdit(message.content)} style={{ padding: 2 }}>
                  <Ionicons name="create-outline" size={13} color={c.textMuted} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.assistantContainer}>
        {message.reasoningTrace ? (
          <View style={[styles.reasoningBox, { borderColor: c.borderSubtle, backgroundColor: theme.dark ? '#1a1a1a' : '#f9f9fa' }]}>
            <TouchableOpacity onPress={() => setIsReasoningOpen(!isReasoningOpen)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="bulb-outline" size={14} color={c.emerald} />
                <Text style={{ fontSize: 12, fontWeight: '500', color: c.textSecondary }}>
                  {message.status === 'thinking' ? 'Thinking...' : 'Thought for a few seconds'}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={{ fontSize: 11, color: c.textMuted }}>{isReasoningOpen ? 'Hide' : 'View'}</Text>
                <Ionicons name={isReasoningOpen ? 'chevron-up' : 'chevron-down'} size={14} color={c.textMuted} />
              </View>
            </TouchableOpacity>
            {isReasoningOpen && (
              <View style={{ borderTopWidth: 1, borderTopColor: theme.dark ? '#262626' : '#e4e4e7', backgroundColor: theme.dark ? '#141414' : '#f4f4f5' }}>
                <View style={{ maxHeight: 240, padding: 12 }}>
                  <Text style={{ fontSize: 11, fontFamily: 'monospace', color: theme.dark ? '#999' : '#52525b', lineHeight: 17 }}>{message.reasoningTrace}</Text>
                </View>
              </View>
            )}
          </View>
        ) : null}

        {message.status === 'error' && !message.content ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 10, backgroundColor: 'rgba(244,63,94,0.1)', borderWidth: 1, borderColor: 'rgba(244,63,94,0.2)' }}>
            <Text style={{ fontSize: 12, color: '#f43f5e' }}>An error occurred while generating the response.</Text>
            {onRegenerate && (
              <TouchableOpacity onPress={() => onRegenerate(message.id)} style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: 'rgba(244,63,94,0.2)' }}>
                <Text style={{ fontSize: 12, color: '#f43f5e', fontWeight: '500' }}>Retry</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (message.status === 'thinking' || message.status === 'generating') && !message.content ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.accent, opacity: 0.8 }} />
            <Text style={{ fontSize: 12, color: c.textMuted }}>
              {message.status === 'thinking' ? 'DOTVEX 2.0 is reasoning...' : 'DOTVEX 2.0 is generating response...'}
            </Text>
          </View>
        ) : (
          <View>
            <View style={{ marginBottom: 8 }}>
              <MarkdownRenderer content={message.content} theme={theme} />
            </View>

            {message.status === 'generating' && (
              <View style={{ height: 16, justifyContent: 'center' }}>
                <View style={{ width: 8, height: 16, backgroundColor: c.accent, borderRadius: 2, opacity: 0.8 }} />
              </View>
            )}
          </View>
        )}

        {message.content && message.status !== 'generating' ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
            <TouchableOpacity onPress={handleCopy} style={styles.actionBtn}>
              {copied ? <Ionicons name="checkmark" size={16} color={c.emerald} /> : <Ionicons name="copy-outline" size={16} color={c.textMuted} />}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsSpeaking(!isSpeaking)} style={styles.actionBtn}>
              {isSpeaking ? <Ionicons name="volume-high-outline" size={16} color={c.emerald} /> : <Ionicons name="volume-medium-outline" size={16} color={c.textMuted} />}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsSavedToLibrary(!isSavedToLibrary)} style={styles.actionBtn}>
              {isSavedToLibrary ? <Ionicons name="bookmark" size={16} color={c.emerald} /> : <Ionicons name="bookmark-outline" size={16} color={c.textMuted} />}
            </TouchableOpacity>
            {onRegenerate && (
              <TouchableOpacity onPress={() => onRegenerate(message.id)} style={styles.actionBtn}>
                <Ionicons name="refresh-outline" size={16} color={c.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 14, paddingVertical: 6 },
  userContainer: { alignItems: 'flex-end' },
  userBubble: {
    maxWidth: '85%',
    borderRadius: 22,
    borderTopRightRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  assistantContainer: { maxWidth: '100%' as any, width: '100%' },
  reasoningBox: { borderRadius: 10, borderWidth: 1, overflow: 'hidden', marginBottom: 8 },
  actionBtn: { padding: 6, borderRadius: 6 },
});
