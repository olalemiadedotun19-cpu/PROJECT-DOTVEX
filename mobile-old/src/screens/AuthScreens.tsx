import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Image,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export function LoginScreen({ onSwitchToSignup, onLoggedIn }: { onSwitchToSignup: () => void; onLoggedIn: () => void }) {
  const { signInWithEmail, signInWithGoogle, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }
    const result = await signInWithEmail(email.trim(), password);
    if (result.success) {
      onLoggedIn();
    } else {
      setError(result.error || 'Login failed.');
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    const result = await signInWithGoogle();
    if (result.success) {
      onLoggedIn();
    } else if (result.error !== 'Sign-in cancelled.') {
      setError(result.error || 'Google sign-in failed.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <Image source={require('../../assets/icon.png')} style={{ width: 80, height: 80, borderRadius: 16 }} />
            <Text style={[styles.welcome, { color: '#ececec' }]}>Welcome back</Text>
            <Text style={[styles.subtitle, { color: '#737373' }]}>Sign in to your DOTVEX account</Text>
          </View>

          <View style={{ width: '100%', maxWidth: 400 }}>
            <TouchableOpacity onPress={handleGoogleSignIn} disabled={isLoading} style={styles.googleBtn}>
              <Ionicons name="logo-google" size={18} color="#ececec" />
              <Text style={styles.googleBtnText}>Continue with Google</Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: '#333' }]} />
              <Text style={[styles.dividerText, { color: '#737373' }]}>OR</Text>
              <View style={[styles.dividerLine, { backgroundColor: '#333' }]} />
            </View>

            <Text style={styles.label}>Email</Text>
            <TextInput style={styles.input} placeholder="your@email.com" placeholderTextColor="#737373" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

            <Text style={[styles.label, { marginTop: 16 }]}>Password</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="Enter your password" placeholderTextColor="#737373" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} autoCapitalize="none" />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 14 }}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#737373" />
              </TouchableOpacity>
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity onPress={handleLogin} disabled={isLoading} style={[styles.primaryBtn, { opacity: isLoading ? 0.6 : 1 }]}>
              {isLoading ? <ActivityIndicator size="small" color="white" /> : <Text style={styles.primaryBtnText}>Sign In</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={onSwitchToSignup} style={{ marginTop: 16, alignItems: 'center' }}>
              <Text style={[styles.link, { color: '#ececec' }]}>Don't have an account? <Text style={{ color: '#10a37f', fontWeight: '600' }}>Create one</Text></Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function SignupScreen({ onSwitchToLogin, onLoggedIn }: { onSwitchToLogin: () => void; onLoggedIn: () => void }) {
  const { signUpWithEmail, isLoading } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async () => {
    setError('');
    if (!displayName.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    const result = await signUpWithEmail(email.trim(), password, displayName.trim());
    if (result.success) {
      onLoggedIn();
    } else {
      setError(result.error || 'Sign up failed.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <Image source={require('../../assets/icon.png')} style={{ width: 80, height: 80, borderRadius: 16 }} />
            <Text style={[styles.welcome, { color: '#ececec' }]}>Create your account</Text>
            <Text style={[styles.subtitle, { color: '#737373' }]}>Join DOTVEX — your personal AI assistant</Text>
          </View>

          <View style={{ width: '100%', maxWidth: 400 }}>
            <Text style={styles.label}>Display Name</Text>
            <TextInput style={styles.input} placeholder="Your name" placeholderTextColor="#737373" value={displayName} onChangeText={setDisplayName} />

            <Text style={[styles.label, { marginTop: 12 }]}>Email</Text>
            <TextInput style={styles.input} placeholder="your@email.com" placeholderTextColor="#737373" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

            <Text style={[styles.label, { marginTop: 12 }]}>Password</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="At least 6 characters" placeholderTextColor="#737373" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} autoCapitalize="none" />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 14 }}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#737373" />
              </TouchableOpacity>
            </View>

            <Text style={[styles.label, { marginTop: 12 }]}>Confirm Password</Text>
            <TextInput style={styles.input} placeholder="Repeat your password" placeholderTextColor="#737373" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showPassword} autoCapitalize="none" />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity onPress={handleSignup} disabled={isLoading} style={[styles.primaryBtn, { opacity: isLoading ? 0.6 : 1 }]}>
              {isLoading ? <ActivityIndicator size="small" color="white" /> : <Text style={styles.primaryBtnText}>Create Account</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={onSwitchToLogin} style={{ marginTop: 16, alignItems: 'center' }}>
              <Text style={[styles.link, { color: '#ececec' }]}>Already have an account? <Text style={{ color: '#10a37f', fontWeight: '600' }}>Sign in</Text></Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function ForgotPasswordScreen({ onBack }: { onBack: () => void }) {
  const { resetPassword, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    setError('');
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    const result = await resetPassword(email.trim());
    if (result.success) {
      setSent(true);
    } else {
      setError(result.error || 'Failed to send reset email.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <Image source={require('../../assets/icon.png')} style={{ width: 80, height: 80, borderRadius: 16 }} />
            <Text style={[styles.welcome, { color: '#ececec' }]}>Reset your password</Text>
            <Text style={[styles.subtitle, { color: '#737373' }]}>Enter your email and we'll send you a reset link</Text>
          </View>

          <View style={{ width: '100%', maxWidth: 400 }}>
            <Text style={styles.label}>Email</Text>
            <TextInput style={styles.input} placeholder="your@email.com" placeholderTextColor="#737373" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            {sent ? (
              <View style={{ alignItems: 'center', padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#10a37f44', backgroundColor: '#10a37f11' }}>
                <Ionicons name="mail-outline" size={24} color="#10a37f" />
                <Text style={{ fontSize: 13, color: '#ececec', textAlign: 'center', marginTop: 8 }}>If an account exists with that email, a reset link has been sent.</Text>
              </View>
            ) : (
              <TouchableOpacity onPress={handleReset} disabled={isLoading} style={[styles.primaryBtn, { opacity: isLoading ? 0.6 : 1 }]}>
                {isLoading ? <ActivityIndicator size="small" color="white" /> : <Text style={styles.primaryBtnText}>Send Reset Link</Text>}
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={onBack} style={{ marginTop: 16, alignItems: 'center' }}>
              <Text style={[styles.link, { color: '#ececec' }]}>Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#212121' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24, alignItems: 'center' },
  welcome: { fontSize: 24, fontWeight: 'bold', marginTop: 20, textAlign: 'center' },
  subtitle: { fontSize: 13, marginTop: 6, textAlign: 'center' },
  label: { fontSize: 11, fontWeight: 'bold', color: '#b4b4b4', marginBottom: 6 },
  input: { backgroundColor: '#2f2f2f', borderRadius: 12, borderWidth: 1, borderColor: '#333', paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#ececec' },
  primaryBtn: { backgroundColor: '#10a37f', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
  primaryBtnText: { fontSize: 14, fontWeight: 'bold', color: 'white' },
  googleBtn: { backgroundColor: '#2f2f2f', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 20, flexDirection: 'row', justifyContent: 'center', gap: 10, borderWidth: 1, borderColor: '#333' },
  googleBtnText: { fontSize: 14, fontWeight: '600', color: '#ececec' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 11, marginHorizontal: 12, fontWeight: '600' },
  link: { fontSize: 13 },
  error: { fontSize: 12, color: '#f43f5e', marginTop: 10 },
});
