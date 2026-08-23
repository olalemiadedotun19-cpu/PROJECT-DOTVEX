import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { DotvexTheme } from '../theme';
import { Ionicons } from '@expo/vector-icons';

interface MarkdownProps {
  content: string;
  theme: DotvexTheme;
}

export function MarkdownRenderer({ content, theme }: MarkdownProps) {
  const c = theme.colors;
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('### ')) {
      elements.push(<Text key={key++} style={[styles.h3, { color: c.textPrimary }]}>{line.slice(4)}</Text>);
      i++;
    } else if (line.startsWith('## ')) {
      elements.push(<Text key={key++} style={[styles.h2, { color: c.textPrimary }]}>{line.slice(3)}</Text>);
      i++;
    } else if (line.startsWith('# ')) {
      elements.push(<Text key={key++} style={[styles.h1, { color: c.textPrimary }]}>{line.slice(2)}</Text>);
      i++;
    } else if (line.startsWith('```')) {
      const lang = line.slice(3).trim() || 'code';
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++;
      elements.push(
        <CodeBlock key={key++} code={codeLines.join('\n')} lang={lang} theme={theme} />
      );
    } else if (line.startsWith('> ')) {
      elements.push(
        <View key={key++} style={[styles.blockquote, { borderLeftColor: c.accent, backgroundColor: theme.dark ? '#1a1a1a' : '#f4f4f5' }]}>
          <Text style={{ color: c.textSecondary, fontStyle: 'italic', fontSize: 13 }}>{line.slice(2)}</Text>
        </View>
      );
      i++;
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      const listItems: string[] = [];
      while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) {
        listItems.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <View key={key++} style={{ marginVertical: 4 }}>
          {listItems.map((item, idx) => (
            <View key={idx} style={{ flexDirection: 'row', marginVertical: 2 }}>
              <Text style={{ color: c.textPrimary, marginRight: 8 }}>•</Text>
              <Text style={[styles.paragraph, { color: c.textPrimary, flex: 1 }]}>{item}</Text>
            </View>
          ))}
        </View>
      );
    } else if (/^\d+\.\s/.test(line)) {
      const listItems: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        listItems.push(lines[i].replace(/^\d+\.\s/, ''));
        i++;
      }
      elements.push(
        <View key={key++} style={{ marginVertical: 4 }}>
          {listItems.map((item, idx) => (
            <View key={idx} style={{ flexDirection: 'row', marginVertical: 2 }}>
              <Text style={{ color: c.textPrimary, marginRight: 8 }}>{idx + 1}.</Text>
              <Text style={[styles.paragraph, { color: c.textPrimary, flex: 1 }]}>{item}</Text>
            </View>
          ))}
        </View>
      );
    } else if (line.trim() === '') {
      i++;
    } else {
      const inlineParts = parseInline(line, c);
      elements.push(
        <Text key={key++} style={[styles.paragraph, { color: c.textPrimary }]}>{inlineParts}</Text>
      );
      i++;
    }
  }

  return <View style={{ gap: 6 }}>{elements}</View>;
}

function parseInline(text: string, c: any): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*.*?\*\*|`[^`]+`|\[.*?\]\(.*?\))/g;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('**')) {
      parts.push(<Text key={key++} style={{ fontWeight: '600', color: c.textPrimary }}>{token.slice(2, -2)}</Text>);
    } else if (token.startsWith('`')) {
      parts.push(
        <Text key={key++} style={{ backgroundColor: c.bgCard, color: c.emerald, fontFamily: 'monospace', fontSize: 12, paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4, borderWidth: 1, borderColor: c.borderSubtle }}>
          {token.slice(1, -1)}
        </Text>
      );
    } else {
      const linkMatch = /\[(.*?)\]\((.*?)\)/.exec(token);
      if (linkMatch) {
        parts.push(<Text key={key++} style={{ color: c.blue, textDecorationLine: 'underline' }}>{linkMatch[1]}</Text>);
      }
    }
    lastIndex = match.index + token.length;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts;
}

function CodeBlock({ code, lang, theme }: { code: string; lang: string; theme: DotvexTheme }) {
  const c = theme.colors;
  const [copied, setCopied] = React.useState(false);

  return (
    <View style={{ marginVertical: 10, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: theme.dark ? '#2e2e2e' : '#e4e4e7', backgroundColor: theme.dark ? '#181818' : '#f9f9fa' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 8, backgroundColor: theme.dark ? '#212121' : '#f0f0f2', borderBottomWidth: 1, borderBottomColor: theme.dark ? '#2e2e2e' : '#e4e4e7' }}>
        <Text style={{ fontSize: 11, fontFamily: 'monospace', color: c.textMuted, textTransform: 'uppercase' }}>{lang}</Text>
        <TouchableOpacity onPress={() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            {copied ? (
              <>
                <Ionicons name="checkmark" size={13} color="#10a37f" />
                <Text style={{ fontSize: 11, color: '#10a37f' }}>Copied</Text>
              </>
            ) : (
              <>
                <Ionicons name="copy-outline" size={13} color={c.textMuted} />
                <Text style={{ fontSize: 11, color: c.textMuted }}>Copy code</Text>
              </>
            )}
          </View>
        </TouchableOpacity>
      </View>
      <View style={{ padding: 14 }}>
        <Text style={{ fontSize: 12, fontFamily: 'monospace', color: c.textPrimary, lineHeight: 18 }}>{code}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 20, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  h2: { fontSize: 18, fontWeight: 'bold', marginTop: 12, marginBottom: 6 },
  h3: { fontSize: 16, fontWeight: '600', marginTop: 10, marginBottom: 4 },
  paragraph: { fontSize: 14, lineHeight: 22 },
  blockquote: { borderLeftWidth: 3, paddingLeft: 12, paddingVertical: 4, marginVertical: 6, borderTopRightRadius: 8, borderBottomRightRadius: 8 },
});
