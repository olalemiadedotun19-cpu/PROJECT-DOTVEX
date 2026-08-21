import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ChatMessage } from '@dotvex/shared';
import { DotvexTheme } from '../theme';

interface Props {
  message: ChatMessage;
  theme: DotvexTheme;
  isLast: boolean;
}

export function MessageBubble({ message, theme }: Props) {
  const isUser = message.role === 'user';
  const colors = theme.colors;

  const bubbleStyle = isUser
    ? { backgroundColor: colors.userBubble }
    : { backgroundColor: colors.assistantBubble };

  const textColor = isUser ? colors.userBubbleText : colors.assistantBubbleText;

  return (
    <View style={[styles.container, isUser && styles.userContainer]}>
      <View style={[styles.bubble, bubbleStyle, isUser && styles.userBubble]}>
        <Text style={[styles.text, { color: textColor }]}>{message.content}</Text>
        {message.reasoningTrace ? (
          <View style={[styles.reasoning, { backgroundColor: colors.surfaceVariant }]}>
            <Text style={[styles.reasoningText, { color: colors.textSecondary }]}>
              {message.reasoningTrace}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    alignItems: 'flex-start',
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  bubble: {
    maxWidth: '85%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  text: {
    fontSize: 15,
    lineHeight: 21,
  },
  reasoning: {
    marginTop: 8,
    padding: 10,
    borderRadius: 8,
  },
  reasoningText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});
