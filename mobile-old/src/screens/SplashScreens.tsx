import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { DotvexLogo } from '../components/DotvexLogo';

export function SplashScreen({ onFinished }: { onFinished: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onFinished, 1800);
    return () => clearTimeout(timer);
  }, [onFinished]);

  return (
    <View style={styles.container}>
      <View style={{ alignItems: 'center' }}>
        <DotvexLogo size="xl" showText={true} showBadge={true} />
        <Text style={[styles.tagline, { color: '#737373' }]}>Your Personal AI Assistant</Text>
      </View>
      <ActivityIndicator size="small" color="#10a37f" style={{ position: 'absolute', bottom: 60 }} />
    </View>
  );
}

export function InitializationScreen({ onFinished }: { onFinished: (authenticated: boolean) => void }) {
  const [status, setStatus] = useState('Initializing DOTVEX...');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { getAuthToken } = require('../services/firebase/firebaseAuthService');
        setStatus('Restoring session...');
        await getAuthToken();
        if (!cancelled) onFinished(true);
      } catch {
        if (!cancelled) onFinished(false);
      }
    })();
    return () => { cancelled = true; };
  }, [onFinished]);

  return (
    <View style={styles.container}>
      <View style={{ alignItems: 'center' }}>
        <DotvexLogo size="lg" showText={true} showBadge={true} />
        <Text style={[styles.status, { color: '#737373', marginTop: 24 }]}>{status}</Text>
      </View>
      <ActivityIndicator size="small" color="#10a37f" style={{ position: 'absolute', bottom: 60 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#212121', alignItems: 'center', justifyContent: 'center' },
  tagline: { fontSize: 13, marginTop: 12 },
  status: { fontSize: 12 },
});
