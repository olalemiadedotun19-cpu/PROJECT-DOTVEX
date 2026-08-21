import 'react-native-gesture-handler';
import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, SafeAreaView } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator, DrawerContentScrollView } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { AppProvider, useApp } from './src/context/AppContext';
import { ChatScreen } from './src/screens/ChatScreen';
import { ConversationList } from './src/screens/ConversationList';
import { CognitionLab } from './src/screens/CognitionLab';
import { Settings } from './src/screens/Settings';
import { ChatMessage } from '@dotvex/shared';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

function ChatDrawerContent(props: any) {
  const { theme } = useApp();
  const colors = theme.colors;

  const navItems = [
    { label: 'Chat', icon: 'chatbubble-outline', route: 'ChatMain' },
    { label: 'Cognition Lab', icon: 'brain-outline', route: 'CognitionLab' },
    { label: 'Settings', icon: 'settings-outline', route: 'Settings' },
  ];

  return (
    <DrawerContentScrollView {...props} style={{ backgroundColor: colors.background }}>
      <View style={[styles.drawerHeader, { borderBottomColor: colors.border }]}>
        <Text style={[styles.drawerTitle, { color: colors.text }]}>DOTVEX 2.0</Text>
      </View>
      {navItems.map((item) => {
        const focused = props.state.routes[state.index]?.name === item.route;
        return (
          <TouchableOpacity
            key={item.route}
            style={[styles.drawerItem, focused && { backgroundColor: colors.surfaceVariant }]}
            onPress={() => props.navigation.navigate(item.route)}
          >
            <Ionicons name={item.icon as any} size={20} color={focused ? colors.accent : colors.icon} />
            <Text style={[styles.drawerItemText, { color: focused ? colors.accent : colors.text }]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </DrawerContentScrollView>
  );
}

let state = { index: 0 };

function DrawerNavigator() {
  const { theme } = useApp();
  const colors = theme.colors;

  return (
    <Drawer.Navigator
      drawerContent={(props) => {
        state = props.state;
        return <ChatDrawerContent {...props} />;
      }}
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        drawerStyle: { backgroundColor: colors.background },
      }}
    >
      <Drawer.Screen name="ChatMain" component={ChatMainDrawer} />
      <Drawer.Screen name="CognitionLab" component={CognitionLab} />
      <Drawer.Screen name="Settings" component={Settings} />
    </Drawer.Navigator>
  );
}

function ChatMainDrawer() {
  const { theme } = useApp();
  const colors = theme.colors;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSelectConversation = useCallback(async (id: string) => {
    setActiveConversationId(id);
  }, []);

  const handleNewChat = useCallback(() => {
    setActiveConversationId(null);
    setMessages([]);
  }, []);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ChatScreen
        messages={messages}
        setMessages={setMessages}
        conversationId={activeConversationId}
        setConversationId={setActiveConversationId}
        isGenerating={isGenerating}
        setIsGenerating={setIsGenerating}
      />
    </SafeAreaView>
  );
}

function AppNavigator() {
  return (
    <NavigationContainer>
      <DrawerNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AppProvider>
      <StatusBarStyle />
      <AppNavigator />
    </AppProvider>
  );
}

function StatusBarStyle() {
  const { theme } = useApp();
  return <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} />;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  drawerHeader: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  drawerTitle: { fontSize: 18, fontWeight: 'bold' },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    marginHorizontal: 8,
    borderRadius: 8,
  },
  drawerItemText: { fontSize: 14, fontWeight: '500' },
});
